#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: MLIT Prefecture Construction License Harvester & Enricher
======================================================================
Automates harvesting construction licenses for Osaka, Kanagawa, Aichi, Saitama,
and all 47 prefectures from the MLIT National Database.
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

def normalize_text(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", str(text)).strip()
    text = re.sub(r"[\(（]株[\)）]", "株式会社", text)
    text = re.sub(r"[\(（]有[\)）]", "有限会社", text)
    text = re.sub(r"[\(（]合[\)）]", "合同会社", text)
    text = re.sub(r"\s+", "", text)
    return text

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def load_checkpoint(pref_code):
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    cp_file = os.path.join(CHECKPOINT_DIR, f"pref_{pref_code}.json")
    if os.path.exists(cp_file):
        try:
            with open(cp_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"last_page": 0, "total_saved": 0}

def save_checkpoint(pref_code, last_page, total_saved):
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    cp_file = os.path.join(CHECKPOINT_DIR, f"pref_{pref_code}.json")
    with open(cp_file, "w", encoding="utf-8") as f:
        json.dump({"last_page": last_page, "total_saved": total_saved, "updated_at": datetime.now().isoformat()}, f)

async def harvest_prefecture(pref_code, max_pages=None, start_page=1):
    pref_name = PREFECTURE_MAP.get(pref_code)
    if not pref_name:
        print(f"[-] Invalid prefecture code: {pref_code}")
        return

    print("=" * 75)
    print(f"KIGYOU-LIST: HARVESTING & ENRICHING [{pref_code}] {pref_name}")
    print(f"Target DB: {DB_PATH}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 75)

    cp = load_checkpoint(pref_code)
    if start_page == 1 and cp["last_page"] > 0:
        start_page = cp["last_page"] + 1
        print(f"[*] Resuming from checkpoint: Page {start_page} (Previously saved: {cp['total_saved']:,})")

    conn = get_db()
    cur = conn.cursor()

    total_scraped = 0
    total_matched = 0
    total_reps_enriched = 0
    total_shumoku_enriched = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print(f"[*] Connecting to MLIT portal for {pref_name}...")
        await page.goto("https://etsuran2.mlit.go.jp/TAKKEN/kensetuKensaku.do?outPutKbn=1", wait_until="networkidle")

        await page.select_option("select[name='kenCode']", value=pref_code)
        await page.select_option("select[name='licenseNoKbn']", value="01") # 知事許可
        await page.select_option("select[name='dispCount']", value="50")

        async with page.expect_navigation(wait_until="networkidle"):
            await page.evaluate("js_Search('0')")

        await page.wait_for_selector("table", state="attached", timeout=15000)

        # Get total available pages
        sel = await page.query_selector("select[name='pageListNo1']")
        options = await sel.query_selector_all("option") if sel else []
        total_pages = len(options)
        print(f"[*] Total available pages for {pref_name}: {total_pages:,} (~{total_pages * 50:,} companies)")

        end_page = total_pages
        if max_pages:
            end_page = min(total_pages, start_page + max_pages - 1)

        t_start = time.time()

        for page_idx in range(start_page, end_page + 1):
            nav_success = False
            for attempt in range(1, 4):
                try:
                    if page_idx > 1:
                        async with page.expect_navigation(wait_until="networkidle", timeout=25000):
                            await page.evaluate(f"""
                                document.forms[0].pageListNo1.selectedIndex = {page_idx - 1};
                                js_PageSearch('1');
                            """)
                    await page.wait_for_selector("table", state="attached", timeout=12000)
                    nav_success = True
                    break
                except Exception as e:
                    print(f"[-] Warning: Page {page_idx} attempt {attempt}/3 failed: {e}. Retrying...")
                    await asyncio.sleep(2)
                    # If failed twice, reload search form and navigate back to page
                    if attempt == 2:
                        try:
                            await page.goto("https://etsuran2.mlit.go.jp/TAKKEN/kensetuKensaku.do?outPutKbn=1", wait_until="networkidle")
                            await page.select_option("select[name='kenCode']", value=pref_code)
                            await page.select_option("select[name='licenseNoKbn']", value="01")
                            await page.select_option("select[name='dispCount']", value="50")
                            async with page.expect_navigation(wait_until="networkidle"):
                                await page.evaluate("js_Search('0')")
                            await page.wait_for_selector("table", state="attached", timeout=15000)
                        except Exception:
                            pass

            if not nav_success:
                print(f"[!] Skipping page {page_idx} after 3 failed attempts.")
                continue

            # Extract table rows
            rows = await page.query_selector_all("table tr")
            batch_licenses = []
            batch_signals = []
            batch_comp_updates = []
            batch_industries = []

            for r in rows:
                cols = await r.query_selector_all("td")
                if len(cols) < 7:
                    continue

                col_texts = [(await c.inner_text()).strip() for c in cols]
                # Format: No., 許可行政庁, 許可番号, 商号又は名称, 代表者名, 営業所名, 所在地
                raw_lic_num = col_texts[2] # 第000109号
                raw_comp_name = col_texts[3] # 阪神通信工業（株）
                raw_rep_name = col_texts[4] # 直田　明剛
                raw_address = col_texts[6] # 大阪府大阪市...

                if not raw_comp_name or not raw_lic_num:
                    continue

                total_scraped += 1
                norm_name = normalize_text(raw_comp_name)
                formatted_lic_num = f"{pref_name}知事許可 {raw_lic_num}"

                # Match in companies table
                cur.execute(
                    """SELECT corporate_number, company_name, prefecture_code, 
                              phone_number, representative_name, capital_amount, jigyo_shumoku 
                       FROM companies WHERE company_name = ?;""",
                    (norm_name,)
                )
                candidates = cur.fetchall()

                matched_cand = None
                for cand in candidates:
                    if cand[2] == pref_code:
                        matched_cand = cand
                        break
                if not matched_cand and len(candidates) == 1:
                    matched_cand = candidates[0]

                if not matched_cand:
                    continue

                total_matched += 1
                corp_num = matched_cand[0]
                cur_phone = matched_cand[3]
                cur_rep = matched_cand[4]
                cur_shumoku = matched_cand[6]

                new_rep = None
                new_shumoku = None

                if (not cur_rep or cur_rep.strip() == "") and raw_rep_name:
                    new_rep = raw_rep_name
                    total_reps_enriched += 1

                if not cur_shumoku or cur_shumoku.strip() == "":
                    new_shumoku = f"建設業許可({pref_name}知事): {raw_lic_num}"
                    total_shumoku_enriched += 1
                elif "建設業" not in cur_shumoku:
                    new_shumoku = f"{cur_shumoku}; 建設業許可({pref_name}知事)"
                    total_shumoku_enriched += 1

                if new_rep or new_shumoku:
                    batch_comp_updates.append((
                        new_rep or cur_rep,
                        new_shumoku or cur_shumoku,
                        corp_num
                    ))

                # company_licenses record
                batch_licenses.append((
                    corp_num,
                    "建設業許可",
                    "知事免許",
                    formatted_lic_num,
                    pref_name,
                    pref_code,
                    raw_rep_name,
                    None, # phone
                    None, # fax
                    raw_address,
                    None, # issue_date
                    None, # valid_until
                    "有効",
                    json.dumps({"所在地": raw_address}, ensure_ascii=False),
                    "https://etsuran2.mlit.go.jp/TAKKEN/kensetuKensaku.do"
                ))

                # business_signals record
                source_key = f"lic_kensetsu_{pref_code}_{raw_lic_num}"
                sig_details = json.dumps({
                    "license_number": formatted_lic_num,
                    "issuing_authority": pref_name,
                    "representative_name": raw_rep_name,
                    "registered_address": raw_address
                }, ensure_ascii=False)

                batch_signals.append((
                    corp_num,
                    "建設業許可",
                    formatted_lic_num,
                    None, # date
                    None, # amount
                    pref_name,
                    source_key,
                    sig_details
                ))

                # Default construction mapping
                batch_industries.append((corp_num, '06'))

            # Flush to database
            if batch_licenses:
                cur.executemany("""
                    INSERT OR REPLACE INTO company_licenses (
                        corporate_number, license_type, license_category, license_number,
                        issuing_authority, prefecture_code, representative_name, office_phone,
                        office_fax, registered_address, issue_date, valid_until, license_status,
                        specialties_json, source_url, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
                """, batch_licenses)

                cur.executemany("""
                    INSERT OR IGNORE INTO business_signals (
                        corporate_number, signal_type, signal_title, signal_date,
                        amount, government_departments, source_key, details
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, batch_signals)

                if batch_comp_updates:
                    cur.executemany("""
                        UPDATE companies
                        SET representative_name = COALESCE(?, representative_name),
                            jigyo_shumoku = COALESCE(?, jigyo_shumoku),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE corporate_number = ?;
                    """, batch_comp_updates)

                if batch_industries:
                    cur.executemany("""
                        INSERT OR IGNORE INTO company_industries (
                            corporate_number, industry_code
                        ) VALUES (?, ?);
                    """, batch_industries)

                conn.commit()

            save_checkpoint(pref_code, page_idx, total_matched)

            elapsed = time.time() - t_start
            rate = total_scraped / elapsed if elapsed > 0 else 0
            print(f"[Page {page_idx}/{end_page}] Scraped: {total_scraped:,} | Matched: {total_matched:,} ({rate:.1f} rec/s) | New Reps: +{total_reps_enriched:,}")

        await browser.close()

    conn.close()
    t_total = time.time() - t_start
    print("=" * 75)
    print(f"COMPLETED [{pref_code}] {pref_name}")
    print(f"Total Scraped:        {total_scraped:,}")
    print(f"Matched Corporations: {total_matched:,} ({total_matched / total_scraped * 100:.1f}%)" if total_scraped else "Matched: 0")
    print(f"Enriched Reps:        +{total_reps_enriched:,}")
    print(f"Enriched Shumoku:     +{total_shumoku_enriched:,}")
    print(f"Total Time Taken:     {t_total:.1f}s ({total_scraped / t_total:.1f} records/sec)" if t_total > 0 else "")
    print("=" * 75)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MLIT Prefecture Construction Harvester")
    parser.add_argument("--pref", default="27", help="Prefecture code (e.g. 27 for Osaka, 14 for Kanagawa, 23 for Aichi, 11 for Saitama)")
    parser.add_argument("--pages", type=int, default=10, help="Max pages to harvest (default: 10 = 500 companies)")
    parser.add_argument("--start", type=int, default=1, help="Start page")
    args = parser.parse_args()

    asyncio.run(harvest_prefecture(args.pref, max_pages=args.pages, start_page=args.start))
