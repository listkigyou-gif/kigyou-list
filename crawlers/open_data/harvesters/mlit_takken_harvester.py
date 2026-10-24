#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: MLIT Real Estate License Harvester & Enricher (宅地建物取引業者)
======================================================================
Automates harvesting real estate licenses for Tokyo and all 47 prefectures
from the MLIT National Database (etsuran2.mlit.go.jp/TAKKEN/).
Includes robust Entity Resolution (cleaning ※, *, mae/ato-kabu, addresses),
granular page-level checkpoint resumption, and automatic industry tagging (K & 68).
Runs 100% on Local PC with zero load on production server.
"""

import os
import sys
import json
import time
import sqlite3
import argparse
import asyncio
import unicodedata
import re
from datetime import datetime
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = "kigyou-list.db"
CHECKPOINT_DIR = "importdata/open-data/checkpoints"

PREFECTURE_MAP = {
    "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県",
    "06": "山形県", "07": "福島県", "08": "茨城県", "09": "栃木県", "10": "群馬県",
    "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県", "15": "新潟県",
    "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
    "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県", "25": "滋賀県",
    "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県",
    "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県",
    "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
    "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県",
    "46": "鹿児島県", "47": "沖縄県"
}

# Gojuon syllables list for comprehensive crawling
KANA_SYLLABLES = [
    'ア', 'イ', 'ウ', 'エ', 'オ',
    'カ', 'キ', 'ク', 'ケ', 'コ',
    'サ', 'シ', 'ス', 'セ', 'ソ',
    'タ', 'チ', 'ツ', 'テ', 'ト',
    'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
    'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
    'マ', 'ミ', 'ム', 'メ', 'モ',
    'ヤ', 'ユ', 'ヨ',
    'ラ', 'リ', 'ル', 'レ', 'ロ',
    'ワ'
]

def clean_company_name_variants(raw_name):
    """
    Strips administrative notes like ※, *, spaces, brackets,
    and returns canonical name + common corporate prefixes/suffixes variants.
    """
    if not raw_name:
        return []
    # 1. Normalize unicode (NFKC: halfwidth to fullwidth, fullwidth alphanumerics)
    text = unicodedata.normalize("NFKC", str(raw_name)).strip()
    # 2. Strip administrative footnotes/symbols: ※, *, (※...), [※...]
    text = re.sub(r"[※＊\*].*$", "", text)
    text = re.sub(r"[\(（]※[^\)）]*[\)）]", "", text)
    text = re.sub(r"\[※[^\]]*\]", "", text)
    # 3. Standardize corporate types
    text = re.sub(r"[\(（]株[\)）]", "株式会社", text)
    text = re.sub(r"[\(（]有[\)）]", "有限会社", text)
    text = re.sub(r"[\(（]合[\)）]", "合同会社", text)
    text = re.sub(r"[\(（]名[\)）]", "合名会社", text)
    text = re.sub(r"[\(（]資[\)）]", "合資会社", text)
    # 4. Remove all whitespace
    clean = re.sub(r"\s+", "", text).strip()
    if not clean:
        return []

    variants = [clean]
    # 5. Handle 前株 vs 後株 variants
    corp_types = ["株式会社", "有限会社", "合同会社", "合名会社", "合資会社"]
    for ctype in corp_types:
        if clean.startswith(ctype):
            base = clean[len(ctype):]
            if base:
                variants.append(base + ctype)
                variants.append(base)
            break
        elif clean.endswith(ctype):
            base = clean[:-len(ctype)]
            if base:
                variants.append(ctype + base)
                variants.append(base)
            break

    seen = set()
    res = [v for v in variants if v and not (v in seen or seen.add(v))]
    return res

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def load_checkpoint(pref_code):
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    cp_file = os.path.join(CHECKPOINT_DIR, f"takken_pref_{pref_code}.json")
    if os.path.exists(cp_file):
        try:
            with open(cp_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"completed_kana": [], "in_progress": None, "total_saved": 0}

def save_checkpoint(pref_code, completed_kana, total_saved, in_progress=None):
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    cp_file = os.path.join(CHECKPOINT_DIR, f"takken_pref_{pref_code}.json")
    with open(cp_file, "w", encoding="utf-8") as f:
        json.dump({
            "completed_kana": completed_kana,
            "in_progress": in_progress,
            "total_saved": total_saved,
            "updated_at": datetime.now().isoformat()
        }, f, ensure_ascii=False, indent=2)

async def harvest_takken(pref_code="13", kana_filter=None, max_pages_per_kana=None, name_query=None):
    pref_name = PREFECTURE_MAP.get(pref_code)
    if not pref_name:
        print(f"[-] Invalid prefecture code: {pref_code}")
        return

    print("=" * 78)
    print(f"KIGYOU-LIST: MLIT REAL ESTATE (宅地建物取引業) HARVESTER [{pref_code}] {pref_name}")
    print(f"Target DB: {DB_PATH}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 78)

    cp = load_checkpoint(pref_code)
    completed_kana = cp.get("completed_kana", [])
    in_progress = cp.get("in_progress")
    total_saved = cp.get("total_saved", 0)

    conn = get_db()
    cur = conn.cursor()

    total_scraped = 0
    total_matched = 0
    total_reps_enriched = 0
    total_shumoku_enriched = 0

    portal_url = "https://etsuran2.mlit.go.jp/TAKKEN/takkenKensaku.do?outPutKbn=1"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        target_kanas = [kana_filter] if kana_filter else KANA_SYLLABLES
        search_units = [("NAME", name_query)] if name_query else [("KANA", k) for k in target_kanas]

        for unit_type, unit_val in search_units:
            if unit_type == "KANA" and not kana_filter and unit_val in completed_kana:
                print(f"[*] Skipping Kana '{unit_val}' (Already completed in checkpoint)")
                continue

            label = f"Name Query '{unit_val}'" if unit_type == "NAME" else f"Kana Syllable: [{unit_val}]"
            print(f"\n>>> Processing {label} for [{pref_code}] {pref_name} <<<")

            # Determine starting page if resuming from in_progress
            start_page = 1
            if in_progress and in_progress.get("kana") == unit_val:
                start_page = in_progress.get("page", 1)
                print(f"[*] Resuming from in-progress checkpoint page {start_page}...")

            # Navigate to search form
            loaded = False
            for nav_try in range(1, 4):
                try:
                    await page.goto(portal_url, wait_until="networkidle", timeout=35000)
                    loaded = True
                    break
                except Exception as e:
                    print(f"[-] Portal load attempt {nav_try}/3 failed: {e}. Retrying in 3s...")
                    await asyncio.sleep(3)
            if not loaded:
                print(f"[!] Critical: Cannot connect to MLIT portal. Skipping {label}.")
                continue

            # Select Prefecture & 50 items per page
            await page.select_option("select[name='kenCode']", value=pref_code)
            await page.select_option("select[name='dispCount']", value="50")

            if unit_type == "NAME":
                async with page.expect_navigation(wait_until="networkidle", timeout=30000):
                    await page.evaluate(f"""
                        document.forms['tkModel'].rdoSelect[1].checked = true;
                        document.forms['tkModel'].comNameKanjiOnly.value = '{unit_val}';
                        js_Search('0');
                    """)
            else:
                async with page.expect_navigation(wait_until="networkidle", timeout=30000):
                    await page.evaluate(f"""
                        document.forms['tkModel'].rdoSelect[0].checked = true;
                        document.forms['tkModel'].comNameKanaOnly.value = '{unit_val}';
                        js_Search('0');
                    """)

            # Check if any results returned
            body_text = await page.inner_text("body")
            if "該当するデータが存在しません" in body_text:
                print(f"[*] No firms found for {label}.")
                if unit_type == "KANA" and not kana_filter and unit_val not in completed_kana:
                    completed_kana.append(unit_val)
                    save_checkpoint(pref_code, completed_kana, total_saved, in_progress=None)
                continue

            # Determine total pages
            sel = await page.query_selector("select[name='pageListNo1']")
            options = await sel.query_selector_all("option") if sel else []
            total_pages = len(options) if options else 1
            print(f"[*] Found {total_pages:,} pages (~{total_pages * 50:,} firms) for {label}")

            end_page = total_pages
            if max_pages_per_kana:
                end_page = min(total_pages, max_pages_per_kana)

            for page_idx in range(start_page, end_page + 1):
                if page_idx > 1:
                    nav_ok = False
                    for attempt in range(1, 4):
                        try:
                            async with page.expect_navigation(wait_until="networkidle", timeout=30000):
                                await page.evaluate(f"""
                                    document.forms['tkModel'].pageListNo1.selectedIndex = {page_idx - 1};
                                    if (document.forms['tkModel'].pageListNo2) {{
                                        document.forms['tkModel'].pageListNo2.selectedIndex = {page_idx - 1};
                                    }}
                                    js_PageSearch('1');
                                """)
                            nav_ok = True
                            break
                        except Exception as e:
                            print(f"[-] Warning: Page {page_idx} attempt {attempt}/3 failed: {e}. Retrying...")
                            await asyncio.sleep(attempt * 2)
                    if not nav_ok:
                        print(f"[!] Skipping page {page_idx} due to navigation errors.")
                        continue

                # Extract rows from table
                rows = await page.query_selector_all("table tr")
                batch_licenses = []
                batch_comp_updates = []

                for r in rows:
                    cols = await r.query_selector_all("td")
                    if len(cols) < 7:
                        continue

                    col_texts = [(await c.inner_text()).strip() for c in cols]
                    # Columns: ['No.', '免許行政庁', '免許証番号', '商号又は名称', '代表者名', '事務所名', '所在地']
                    raw_auth = col_texts[1]      # 東京都 or 国土交通大臣
                    raw_lic_num = col_texts[2]   # (01)第107650号
                    raw_comp_name = col_texts[3] # ＴＱＣ　株式会社
                    raw_rep_name = col_texts[4]  # キム・バン・チュン
                    raw_office = col_texts[5]    # 本店
                    raw_address = col_texts[6]   # 東京都豊島区...

                    if not raw_comp_name or not raw_lic_num:
                        continue

                    total_scraped += 1

                    # Standardize authority & formatted license number
                    if "大臣" in raw_auth:
                        lic_category = "大臣免許"
                        formatted_lic_num = f"{raw_auth}免許 {raw_lic_num}"
                    else:
                        lic_category = "知事免許"
                        formatted_lic_num = f"{raw_auth}知事免許 {raw_lic_num}"

                    # Clean company name variants (Entity Resolution)
                    variants = clean_company_name_variants(raw_comp_name)
                    if not variants:
                        continue

                    placeholders = ",".join("?" for _ in variants)
                    cur.execute(
                        f"""SELECT corporate_number, company_name, prefecture_code, 
                                   full_address, representative_name, jigyo_shumoku 
                            FROM companies WHERE company_name IN ({placeholders});""",
                        variants
                    )
                    candidates = cur.fetchall()

                    matched_cand = None
                    # Priority 1: Match same prefecture
                    for cand in candidates:
                        if cand[2] == pref_code:
                            matched_cand = cand
                            break

                    # Priority 2: If only 1 candidate found nationwide, match it
                    if not matched_cand and len(candidates) == 1:
                        matched_cand = candidates[0]

                    # Priority 3: Match address municipality if multiple candidates
                    if not matched_cand and raw_address and candidates:
                        for cand in candidates:
                            cand_addr = cand[3] or ""
                            # Check if common city/ward exists in both
                            m = re.search(r"([^都道府県]+?[市区町村])", raw_address)
                            if m and m.group(1) in cand_addr:
                                matched_cand = cand
                                break

                    if not matched_cand:
                        continue

                    total_matched += 1
                    corp_num = matched_cand[0]
                    cur_rep = matched_cand[4]
                    cur_shumoku = matched_cand[5]

                    new_rep = None
                    new_shumoku = None

                    if (not cur_rep or cur_rep.strip() == "") and raw_rep_name:
                        new_rep = raw_rep_name
                        total_reps_enriched += 1

                    if not cur_shumoku or cur_shumoku.strip() == "":
                        new_shumoku = "不動産取引業"
                        total_shumoku_enriched += 1
                    elif "不動産取引業" not in cur_shumoku:
                        new_shumoku = f"{cur_shumoku}, 不動産取引業"
                        total_shumoku_enriched += 1

                    batch_comp_updates.append((
                        new_rep or cur_rep,
                        new_shumoku or cur_shumoku,
                        corp_num
                    ))

                    specialties_meta = {
                        "事務所名": raw_office,
                        "所在地": raw_address,
                        "免許行政庁": raw_auth
                    }

                    # Check existence in company_licenses
                    cur.execute(
                        """SELECT id FROM company_licenses 
                           WHERE corporate_number = ? AND license_type = ? AND license_number = ?;""",
                        (corp_num, "宅地建物取引業", formatted_lic_num)
                    )
                    existing = cur.fetchone()

                    now_iso = datetime.now().isoformat()
                    if not existing:
                        cur.execute(
                            """INSERT INTO company_licenses (
                                corporate_number, license_type, license_category, license_number,
                                issuing_authority, prefecture_code, representative_name, office_phone,
                                office_fax, registered_address, issue_date, valid_until, license_status,
                                specialties_json, source_url, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                            (
                                corp_num,
                                "宅地建物取引業",
                                lic_category,
                                formatted_lic_num,
                                raw_auth,
                                pref_code,
                                raw_rep_name,
                                None,
                                None,
                                raw_address,
                                None,
                                None,
                                "有効",
                                json.dumps(specialties_meta, ensure_ascii=False),
                                portal_url,
                                now_iso,
                                now_iso
                            )
                        )
                        total_saved += 1

                # Bulk update company records with V2 Schema & CONFIRMED_LICENSE
                if batch_comp_updates:
                    cur.executemany("""
                        UPDATE companies 
                        SET has_real_estate_lic = 1,
                            has_license = 1,
                            primary_industry_code = COALESCE(primary_industry_code, '68'),
                            major_industry_code = COALESCE(major_industry_code, 'K'),
                            industry_confidence = CASE 
                                WHEN industry_confidence IN ('UNCLASSIFIED', 'VERIFIED_WEB', NULL, '') THEN 'CONFIRMED_LICENSE'
                                ELSE industry_confidence 
                            END,
                            representative_name = COALESCE(?, representative_name),
                            jigyo_shumoku = COALESCE(?, jigyo_shumoku),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE corporate_number = ?;
                    """, batch_comp_updates)

                    batch_industries = []
                    for u in batch_comp_updates:
                        corp = u[2]
                        batch_industries.append((corp, 'K', 'K', 0))
                        batch_industries.append((corp, '68', 'K.68', 0))
                    cur.executemany("""
                        INSERT OR IGNORE INTO company_industries (corporate_number, industry_code, industry_path, is_detailed)
                        VALUES (?, ?, ?, ?);
                    """, batch_industries)

                conn.commit()
                print(f"  [+] Page {page_idx}/{end_page}: Scraped {len(rows)} | Matched: {len(batch_comp_updates)} | Total Saved DB: {total_saved:,}")

                # Save page-level checkpoint
                save_checkpoint(pref_code, completed_kana, total_saved, in_progress={"kana": unit_val, "page": page_idx + 1})

                # Polite delay between pages
                await asyncio.sleep(1.0)

            # When all pages of this Kana are completed
            if unit_type == "KANA" and not kana_filter and unit_val not in completed_kana:
                completed_kana.append(unit_val)
                save_checkpoint(pref_code, completed_kana, total_saved, in_progress=None)

        await browser.close()

    conn.close()

    print("\n" + "=" * 78)
    print(f"HARVESTING COMPLETE FOR [{pref_code}] {pref_name}")
    print(f"Total Scraped: {total_scraped:,}")
    print(f"Total Matched into Companies: {total_matched:,}")
    print(f"Total Representatives Enriched: {total_reps_enriched:,}")
    print(f"Total Business Summaries Enriched: {total_shumoku_enriched:,}")
    print(f"Total Real Estate Licenses in DB: {total_saved:,}")
    print("=" * 78)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MLIT Real Estate License Harvester")
    parser.add_argument("--pref", type=str, default="13", help="Prefecture code (e.g., 13 for Tokyo)")
    parser.add_argument("--kana", type=str, default=None, help="Filter by specific Kana (e.g., テ or ア)")
    parser.add_argument("--name", type=str, default=None, help="Specific company name query (e.g., ＴＱＣ or 三井不動産)")
    parser.add_argument("--pages", type=int, default=None, help="Max pages per search unit")
    args = parser.parse_args()

    asyncio.run(harvest_takken(
        pref_code=args.pref,
        kana_filter=args.kana,
        max_pages_per_kana=args.pages,
        name_query=args.name
    ))
