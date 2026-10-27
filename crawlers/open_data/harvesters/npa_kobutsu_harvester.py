#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: High-Speed Nationwide NPA Kobutsu Harvester & Enricher (古物商許可)
=============================================================================
Automated, high-performance in-memory batch harvester for official prefectural
URL-notified secondhand dealer registries across Japan.
Supports multi-prefecture harvesting (Tokyo, Saitama, Gunma, Tochigi, Miyagi,
Hiroshima, Shizuoka...), automatic JSIC tagging (I.60), corporate entity
resolution, official website enrichment, and live VPS delta synchronization.
"""

import os
import sys
import re
import json
import time
import sqlite3
import argparse
import unicodedata
import urllib.request
from datetime import datetime
from pypdf import PdfReader

# Set up project root in python sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scripts.sync_delta_licenses_to_vps import sync_licenses

sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = "kigyou-list.db"
DATA_DIR = "importdata/open-data/kobutsu"
CHECKPOINT_DIR = "importdata/open-data/checkpoints"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

PREFECTURE_CONFIGS = {
    "13": {
        "name": "東京都",
        "authority": "東京都公安委員会",
        "method": "PDF_LOCAL_OR_URL",
        "url": "https://www.kouaniinkai.metro.tokyo.lg.jp/kobutsu/keisai.pdf",
        "files": ["tokyo_keisai.pdf"]
    },
    "11": {
        "name": "埼玉県",
        "authority": "埼玉県公安委員会",
        "method": "HTML_SAITAMA",
        "url": "https://www.pref.saitama.lg.jp/kouaniinkai/kobutu/kobutu.html"
    },
    "10": {
        "name": "群馬県",
        "authority": "群馬県公安委員会",
        "method": "PDF_DOWNLOAD",
        "url": "https://www.pref.gunma.jp/uploaded/attachment/717175.pdf",
        "files": ["gunma_kobutsu.pdf"]
    },
    "09": {
        "name": "栃木県",
        "authority": "栃木県公安委員会",
        "method": "PDF_DOWNLOAD",
        "url": "https://www.pref.tochigi.lg.jp/keisatu/n13/documents/20260629090140.pdf",
        "files": ["tochigi_kobutsu.pdf"]
    },
    "04": {
        "name": "宮城県",
        "authority": "宮城県公安委員会",
        "method": "PDF_DOWNLOAD",
        "url": "https://www.police.pref.miyagi.jp/miyagi_kouaniinkai/pdf/kobutuurl.pdf",
        "files": ["miyagi_kobutsu.pdf"]
    },
    "34": {
        "name": "広島県",
        "authority": "広島県公安委員会",
        "method": "PDF_DOWNLOAD",
        "url": "https://www.pref.hiroshima.lg.jp/uploaded/attachment/680341.pdf",
        "files": ["hiroshima_kobutsu.pdf"]
    },
    "22": {
        "name": "静岡県",
        "authority": "静岡県公安委員会",
        "method": "PDF_SHIZUOKA",
        "base_url": "https://www.pref.shizuoka.jp/police/_res/projects/project_police/_page_/002/000/664/",
        "files": [
            "22_shizuoka/4910-0803.pdf",
            "22_shizuoka/4911-0803.pdf",
            "22_shizuoka/4912-0803.pdf",
            "22_shizuoka/4913-0803.pdf"
        ]
    }
}

def clean_corp_name(name):
    if not name:
        return "", ""
    text = unicodedata.normalize("NFKC", str(name)).strip()
    text = re.sub(r"[※＊\*].*$", "", text)
    text = re.sub(r"[\(（]株[\)）]", "株式会社", text)
    text = re.sub(r"[\(（]有[\)）]", "有限会社", text)
    text = re.sub(r"[\(（]合[\)）]", "合同会社", text)
    text = re.sub(r"[\(（]名[\)）]", "合名会社", text)
    text = re.sub(r"[\(（]資[\)）]", "合資会社", text)
    clean = re.sub(r"\s+", "", text).strip()
    norm = unicodedata.normalize("NFKC", clean)
    return clean, norm

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def download_file_if_needed(url, local_path):
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    if not os.path.exists(local_path) or os.path.getsize(local_path) < 1000:
        print(f"[*] Downloading official registry: {url} -> {local_path}...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=30) as resp, open(local_path, "wb") as out:
            out.write(resp.read())
        print(f"[+] Download complete: {os.path.getsize(local_path):,} bytes")
    else:
        print(f"[*] Registry cache found: {local_path} ({os.path.getsize(local_path):,} bytes)")

def extract_from_pdf(pdf_path, max_pages=None):
    if not os.path.exists(pdf_path):
        return []
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    end_page = min(total_pages, max_pages) if max_pages else total_pages
    raw_records = []

    # Standard pattern: 12-char license number, company name, URL
    line_pattern = re.compile(r"^(?:(?:\d+\s+)?第?)?([0-9A-Z]{12})号?\s+(.+?)\s+(https?://\S+|www\.\S+)")
    alt_pattern = re.compile(r"^([0-9A-Z]{12})\s+(.+)$")

    for p_idx in range(end_page):
        page = reader.pages[p_idx]
        text = page.extract_text()
        if not text:
            continue

        lines = [l.strip() for l in text.splitlines() if l.strip()]
        
        # Check if columnar (like Hiroshima: names/urls followed by a list of 12-digit numbers)
        has_standalone_nums = any(re.match(r"^\d{12}$", l) for l in lines[-35:])
        if has_standalone_nums:
            name_url_pairs = []
            lic_nums = []
            for l in lines:
                if re.match(r"^\d{12}$", l):
                    lic_nums.append(l)
                elif re.search(r"https?://|www\.", l):
                    if name_url_pairs and len(name_url_pairs[-1]) == 1:
                        name_url_pairs[-1].append(l)
                elif any(k in l for k in ['会社', '法人', '堂', '屋', '店', '商', '房', '館']) or re.search(r"[\u4e00-\u9faf]", l):
                    if not any(hdr in l for hdr in ['許可番号', '氏名又は名称', 'URL', '令和']):
                        name_url_pairs.append([l])
            
            for idx in range(min(len(name_url_pairs), len(lic_nums))):
                pair = name_url_pairs[idx]
                lic = lic_nums[idx]
                name = pair[0] if len(pair) > 0 else ""
                url = pair[1] if len(pair) > 1 else ""
                if name and lic:
                    raw_records.append((lic, name, url))
            continue

        # Standard line-by-line parsing
        for line in lines:
            if "許可番号" in line or "最終更新" in line or "はじめに" in line:
                continue

            m = line_pattern.search(line)
            if m:
                lic_num = m.group(1)
                name = m.group(2).strip()
                url = m.group(3).strip()
                raw_records.append((lic_num, name, url))
                continue

            m2 = alt_pattern.match(line)
            if m2:
                lic_num = m2.group(1)
                rest = m2.group(2).strip()
                url_match = re.search(r"(https?://\S+|www\.\S+)", rest)
                if url_match:
                    name = rest[:url_match.start()].strip()
                    url = rest[url_match.start():].strip()
                else:
                    name = rest
                    url = ""
                raw_records.append((lic_num, name, url))

    return raw_records

def extract_from_saitama_html():
    print("[*] Harvesting Saitama Kobutsu HTML tables across all Kana indexes...")
    base_url = "https://www.pref.saitama.lg.jp/kouaniinkai/kobutu/"
    index_url = base_url + "kobutu.html"
    req = urllib.request.Request(index_url, headers={"User-Agent": "Mozilla/5.0"})
    raw_records = []

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[-] Failed to fetch Saitama index: {e}")
        return []

    # Extract all kana index subpages (e.g. /kouaniinkai/kobutu/kobutu-gyousya-a.html)
    kana_links = re.findall(r'href=["\']([^"\']*(?:kobutu-gyousya|wa)[^"\']*\.html)["\']', html)
    unique_kana_urls = []
    for l in kana_links:
        full_u = urllib.parse.urljoin(index_url, l) if not l.startswith("http") else l
        if full_u not in unique_kana_urls:
            unique_kana_urls.append(full_u)

    print(f"[*] Found {len(unique_kana_urls)} Kana section pages in Saitama. Extracting detail tables...")

    detail_pages_seen = set()
    for k_url in unique_kana_urls:
        try:
            r = urllib.request.Request(k_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(r, timeout=15) as res:
                k_html = res.read().decode("utf-8", errors="ignore")
        except Exception:
            continue

        # Find detail subpages (e.g. a1.html, ka1.html...)
        sub_links = re.findall(r'href=["\']([^"\']*(?:kobutu-gyousya-[a-z0-9]+|[a-z]+[0-9]+)\.html)["\']', k_html)
        sub_urls = []
        for sl in sub_links:
            full_sub = urllib.parse.urljoin(k_url, sl) if not sl.startswith("http") else sl
            if full_sub not in detail_pages_seen:
                detail_pages_seen.add(full_sub)
                sub_urls.append(full_sub)

        # Parse table rows directly from page or subpages
        targets = sub_urls if sub_urls else [k_url]
        for target_url in targets:
            try:
                r2 = urllib.request.Request(target_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(r2, timeout=15) as res2:
                    sub_html = res2.read().decode("utf-8", errors="ignore")
                
                rows = re.findall(r'<tr[^>]*>(.*?)</tr>', sub_html, re.DOTALL)
                for r in rows:
                    cells = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.DOTALL)]
                    if len(cells) >= 6:
                        raw_lic = cells[1]
                        m = re.search(r'([0-9A-Z]{12})', raw_lic)
                        if m:
                            lic_num = m.group(1)
                            name = cells[3]
                            url = cells[5]
                            raw_records.append((lic_num, name, url))
            except Exception:
                continue

    print(f"[+] Saitama HTML extraction complete: {len(raw_records):,} records found.")
    return raw_records

def harvest_prefecture(pref_code, max_pages=None):
    cfg = PREFECTURE_CONFIGS.get(pref_code)
    if not cfg:
        print(f"[-] Unsupported prefecture code: {pref_code}")
        return 0

    print("\n" + "=" * 80)
    print(f"KIGYOU-LIST: HIGH-SPEED NPA KOBUTSU HARVESTER [{pref_code}] {cfg['name']}")
    print(f"Issuing Authority: {cfg['authority']}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    t0 = time.time()
    raw_records = []

    method = cfg["method"]
    if method == "HTML_SAITAMA":
        raw_records = extract_from_saitama_html()
    elif method in ["PDF_LOCAL_OR_URL", "PDF_DOWNLOAD", "PDF_SHIZUOKA"]:
        files = cfg.get("files", [])
        for fname in files:
            local_pdf = os.path.join(DATA_DIR, fname)
            if not os.path.exists(local_pdf) and "url" in cfg:
                download_file_if_needed(cfg["url"], local_pdf)
            elif not os.path.exists(local_pdf) and "base_url" in cfg:
                rel = fname.replace("22_shizuoka/", "")
                download_file_if_needed(cfg["base_url"] + rel, local_pdf)

            records = extract_from_pdf(local_pdf, max_pages=max_pages)
            raw_records.extend(records)

    print(f"[+] Total Raw Records Extracted for [{pref_code}]: {len(raw_records):,}")

    # Filter corporate entities
    corp_records = []
    names_to_query = set()

    for lic_num, name, url in raw_records:
        is_corp = any(k in name for k in [
            '株式会社', '有限会社', '合同会社', '合資会社', '合名会社', 
            '一般社団法人', '一般財団法人', '特定非営利活動法人'
        ])
        if not is_corp:
            continue

        clean, norm = clean_corp_name(name)
        corp_records.append((lic_num, name, url, clean, norm))
        if clean:
            names_to_query.add(clean)
        if norm:
            names_to_query.add(norm)

    print(f"[*] Total Corporate Entities: {len(corp_records):,} | Unique names to resolve: {len(names_to_query):,}")

    conn = get_db()
    cur = conn.cursor()

    # Pre-load company mappings in batches of 500
    t_map_start = time.time()
    name_list = list(names_to_query)
    name_to_comp = {}

    batch_size = 500
    for i in range(0, len(name_list), batch_size):
        chunk = name_list[i:i + batch_size]
        placeholders = ",".join(["?"] * len(chunk))
        query = f"""
            SELECT corporate_number, company_name, prefecture_code, 
                   website_url, jigyo_shumoku, full_address, representative_name
            FROM companies 
            WHERE company_name IN ({placeholders});
        """
        cur.execute(query, chunk)
        for row in cur.fetchall():
            c_num, c_name, c_pref, c_web, c_shu, c_addr, c_rep = row
            # Store in mapping with preference for this prefecture
            if c_name not in name_to_comp or c_pref == pref_code:
                name_to_comp[c_name] = row

    t_map = time.time() - t_map_start
    print(f"[+] Entity Resolution: Resolved {len(name_to_comp):,} companies in {t_map:.2f}s")

    # Match and prepare batch inserts
    batch_licenses = []
    batch_comp_updates = []
    seen_licenses = set()

    cur.execute(f"SELECT corporate_number, license_number FROM company_licenses WHERE license_type = '古物商許可' AND prefecture_code = '{pref_code}';")
    existing_licenses = set(cur.fetchall())
    print(f"[*] Existing Kobutsu licenses in DB for [{pref_code}]: {len(existing_licenses):,}")

    total_matched = 0
    total_websites_enriched = 0
    total_shumoku_enriched = 0
    now_iso = datetime.now().isoformat()

    for lic_num, raw_name, raw_url, clean, norm in corp_records:
        comp_row = name_to_comp.get(clean) or name_to_comp.get(norm)
        if not comp_row:
            continue

        total_matched += 1
        corp_num, comp_name, c_pref, cur_website, cur_shumoku, cur_addr, cur_rep = comp_row

        formatted_lic_num = f"{cfg['authority']} 第{lic_num}号"

        lic_key = (corp_num, formatted_lic_num)
        if lic_key in existing_licenses or lic_key in seen_licenses:
            continue
        seen_licenses.add(lic_key)

        # Website enrichment
        new_website = None
        if (not cur_website or cur_website.strip() == "") and raw_url:
            if not any(plat in raw_url for plat in ['yahoo.co.jp', 'rakuten.co.jp', 'amazon.co.jp', 'mercari.com', 'fril.jp', 'stores.jp', 'base.ec', 'base.in']):
                new_website = raw_url
                total_websites_enriched += 1

        # Shumoku enrichment
        new_shumoku = None
        if not cur_shumoku or cur_shumoku.strip() == "":
            new_shumoku = "その他の小売業"
            total_shumoku_enriched += 1
        elif "その他の小売業" not in cur_shumoku:
            new_shumoku = f"{cur_shumoku}, その他の小売業"
            total_shumoku_enriched += 1

        if new_website or new_shumoku:
            batch_comp_updates.append((
                new_website or cur_website,
                new_shumoku or cur_shumoku,
                corp_num
            ))

        specialties_meta = {
            "届出URL": raw_url,
            "区分": "ホームページ利用取引",
            "公安委員会": cfg["authority"]
        }

        batch_licenses.append((
            corp_num,
            "古物商許可",
            "公安委員会許可",
            formatted_lic_num,
            cfg["authority"],
            pref_code,
            cur_rep,
            None,
            None,
            cur_addr,
            None,
            None,
            "有効",
            json.dumps(specialties_meta, ensure_ascii=False),
            cfg.get("url", ""),
            now_iso,
            now_iso
        ))

    print(f"[*] Inserting {len(batch_licenses):,} new licenses and {len(batch_comp_updates):,} company updates...")

    # Bulk execute
    t_db_start = time.time()
    if batch_licenses:
        cur.executemany(
            """INSERT INTO company_licenses (
                corporate_number, license_type, license_category, license_number,
                issuing_authority, prefecture_code, representative_name, office_phone,
                office_fax, registered_address, issue_date, valid_until, license_status,
                specialties_json, source_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
            batch_licenses
        )

    if batch_comp_updates:
        cur.executemany(
            """UPDATE companies 
               SET has_kobutsu_lic = 1,
                   has_license = 1,
                   has_website = CASE WHEN ? IS NOT NULL AND ? != '' THEN 1 ELSE has_website END,
                   primary_industry_code = COALESCE(primary_industry_code, '60'),
                   major_industry_code = COALESCE(major_industry_code, 'I'),
                   industry_confidence = CASE 
                       WHEN industry_confidence IN ('UNCLASSIFIED', 'VERIFIED_WEB', NULL, '') THEN 'CONFIRMED_LICENSE'
                       ELSE industry_confidence 
                   END,
                   website_url = COALESCE(?, website_url),
                   jigyo_shumoku = COALESCE(?, jigyo_shumoku),
                   updated_at = CURRENT_TIMESTAMP
               WHERE corporate_number = ?;""",
            [(u[0], u[0], u[0], u[1], u[2]) for u in batch_comp_updates]
        )

        batch_industries = []
        for u in batch_comp_updates:
            corp = u[2]
            batch_industries.append((corp, 'I', 'I', 0))
            batch_industries.append((corp, '60', 'I.60', 0))
        cur.executemany("""
            INSERT OR IGNORE INTO company_industries (corporate_number, industry_code, industry_path, is_detailed)
            VALUES (?, ?, ?, ?);
        """, batch_industries)

    conn.commit()
    conn.close()
    t_db = time.time() - t_db_start

    total_time = time.time() - t0
    print("\n" + "=" * 80)
    print(f"HARVESTING COMPLETE FOR [{pref_code}] {cfg['name']}")
    print(f"Total Raw Records Extracted: {len(raw_records):,}")
    print(f"Total Corporate Entities: {len(corp_records):,}")
    print(f"Total Matched into Companies: {total_matched:,} ({total_matched/max(1, len(corp_records))*100:.1f}%)")
    print(f"Total Official Websites Enriched: {total_websites_enriched:,}")
    print(f"Total Business Summaries Enriched: {total_shumoku_enriched:,}")
    print(f"Total New Kobutsu Licenses Saved: {len(batch_licenses):,}")
    print(f"DB Write Time: {t_db:.2f}s | Total Processing Time: {total_time:.2f}s")
    print("=" * 80)

    # Trigger automatic delta sync to VPS PostgreSQL production
    if len(batch_licenses) > 0:
        print(f"\n[*] Triggering automated delta sync to VPS PostgreSQL for [{pref_code}]...")
        try:
            sync_licenses()
            print(f"[+] Delta sync complete for [{pref_code}] {cfg['name']}!")
        except Exception as e:
            print(f"[-] Delta sync error: {e}")

    return len(batch_licenses)

def harvest_all_available_kobutsu():
    print("=" * 80)
    print("KIGYOU-LIST: NATIONWIDE NPA KOBUTSU MULTI-PREFECTURE HARVESTER")
    print(f"Available Configured Prefectures: {list(PREFECTURE_CONFIGS.keys())}")
    print("=" * 80)

    total_new = 0
    for pref_code in PREFECTURE_CONFIGS.keys():
        new_cnt = harvest_prefecture(pref_code)
        total_new += new_cnt

    print("\n" + "=" * 80)
    print(f"ALL CONFIGURED PREFECTURES COMPLETED! Total New Licenses Added: {total_new:,}")
def harvest_tokyo_kobutsu():
    """Alias for harvesting Tokyo prefecture (13) secondhand dealer registry."""
    return harvest_prefecture("13")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Nationwide NPA Kobutsu License Harvester")
    parser.add_argument("--pref", type=str, default=None, help="Prefecture code to process (e.g. 11, 10, 09, 04, 34, 22)")
    parser.add_argument("--all", action="store_true", help="Process all available prefectures")
    parser.add_argument("--pages", type=int, default=None, help="Max pages per PDF")
    args = parser.parse_args()

    if args.pref:
        harvest_prefecture(args.pref, max_pages=args.pages)
    else:
        harvest_all_available_kobutsu()
