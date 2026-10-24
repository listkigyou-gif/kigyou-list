"""
Kigyou-list MHLW Jinzai Web Harvester (厚生労働省 人材サービス総合サイト)
Harvests:
1. 労働者派遣事業 (Hakken - 派xx-xxxxxx)
2. 有料職業紹介事業 (Jinzai Shokai - xx-ユ-xxxxxx)
Extracts:
- License number & permit date (Japanese era -> ISO date)
- Employer name, branch office name
- Clean office address & direct phone numbers
- Dispatch billing rates, wage rates, margin rates, labor agreements
- Commission fees & refund systems
Matches with kigyou-list.db and enriches company_licenses, companies, business_signals, and company_industries.
"""

import os
import sys
import re
import json
import time
import sqlite3
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "kigyou-list.db")
CHECKPOINT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "importdata", "open-data", "checkpoints")

MHLW_PREFECTURE_MAP = {
    "01": {"name": "北海道", "cb": "ID_cbHokkaido1"},
    "02": {"name": "青森県", "cb": "ID_cbAomori1"},
    "03": {"name": "岩手県", "cb": "ID_cbIwate1"},
    "04": {"name": "宮城県", "cb": "ID_cbMiyagi1"},
    "05": {"name": "秋田県", "cb": "ID_cbAkita1"},
    "06": {"name": "山形県", "cb": "ID_cbYamagata1"},
    "07": {"name": "福島県", "cb": "ID_cbFukushima1"},
    "08": {"name": "茨城県", "cb": "ID_cbIbaragi1"},
    "09": {"name": "栃木県", "cb": "ID_cbTochigi1"},
    "10": {"name": "群馬県", "cb": "ID_cbGunma1"},
    "11": {"name": "埼玉県", "cb": "ID_cbSaitama1"},
    "12": {"name": "千葉県", "cb": "ID_cbChiba1"},
    "13": {"name": "東京都", "cb": "ID_cbTokyo1"},
    "14": {"name": "神奈川県", "cb": "ID_cbKanagawa1"},
    "15": {"name": "新潟県", "cb": "ID_cbNigata1"},
    "16": {"name": "富山県", "cb": "ID_cbToyama1"},
    "17": {"name": "石川県", "cb": "ID_cbIshikawa1"},
    "18": {"name": "福井県", "cb": "ID_cbFukui1"},
    "19": {"name": "山梨県", "cb": "ID_cbYamanashi1"},
    "20": {"name": "長野県", "cb": "ID_cbNagano1"},
    "21": {"name": "岐阜県", "cb": "ID_cbGifu1"},
    "22": {"name": "静岡県", "cb": "ID_cbShizuoka1"},
    "23": {"name": "愛知県", "cb": "ID_cbAichi1"},
    "24": {"name": "三重県", "cb": "ID_cbMie1"},
    "25": {"name": "滋賀県", "cb": "ID_cbShiga1"},
    "26": {"name": "京都府", "cb": "ID_cbKyoto1"},
    "27": {"name": "大阪府", "cb": "ID_cbOsaka1"},
    "28": {"name": "兵庫県", "cb": "ID_cbHyogo1"},
    "29": {"name": "奈良県", "cb": "ID_cbNara1"},
    "30": {"name": "和歌山県", "cb": "ID_cbWakayama1"},
    "31": {"name": "鳥取県", "cb": "ID_cbTottori1"},
    "32": {"name": "島根県", "cb": "ID_cbShimane1"},
    "33": {"name": "岡山県", "cb": "ID_cbOkayama1"},
    "34": {"name": "広島県", "cb": "ID_cbHiroshima1"},
    "35": {"name": "山口県", "cb": "ID_cbYamaguchi1"},
    "36": {"name": "徳島県", "cb": "ID_cbTokushima1"},
    "37": {"name": "香川県", "cb": "ID_cbKagawa1"},
    "38": {"name": "愛媛県", "cb": "ID_cbEhime1"},
    "39": {"name": "高知県", "cb": "ID_cbKochi1"},
    "40": {"name": "福岡県", "cb": "ID_cbFukuoka1"},
    "41": {"name": "佐賀県", "cb": "ID_cbSaga1"},
    "42": {"name": "長崎県", "cb": "ID_cbNagasaki1"},
    "43": {"name": "熊本県", "cb": "ID_cbKumamoto1"},
    "44": {"name": "大分県", "cb": "ID_cbOita1"},
    "45": {"name": "宮崎県", "cb": "ID_cbMiyazaki1"},
    "46": {"name": "鹿児島県", "cb": "ID_cbKagoshima1"},
    "47": {"name": "沖縄県", "cb": "ID_cbOkinawa1"}
}

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def normalize_text(text):
    if not text:
        return ""
    # Remove corporate structure tags for clean matching
    t = text.strip()
    t = re.sub(r'[\s\u3000]+', '', t)
    # Convert fullwidth alphanumerics to halfwidth
    table = str.maketrans(
        '０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ（）－',
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()-'
    )
    return t.translate(table)

def parse_era_date(text):
    if not text:
        return None
    m = re.search(r'(令和|平成|昭和)(\d+|元)年(\d+)月(\d+)日', text)
    if not m:
        return None
    era, y_str, m_str, d_str = m.groups()
    y = 1 if y_str == '元' else int(y_str)
    month = int(m_str)
    day = int(d_str)
    if era == '令和':
        year = 2018 + y
    elif era == '平成':
        year = 1988 + y
    elif era == '昭和':
        year = 1925 + y
    else:
        return None
    return f"{year:04d}-{month:02d}-{day:02d}"

def load_checkpoint(harvest_type, pref_code):
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    cp_file = os.path.join(CHECKPOINT_DIR, f"mhlw_{harvest_type}_{pref_code}.json")
    if os.path.exists(cp_file):
        try:
            with open(cp_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"last_page": 0, "total_saved": 0}

def save_checkpoint(harvest_type, pref_code, last_page, total_saved):
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    cp_file = os.path.join(CHECKPOINT_DIR, f"mhlw_{harvest_type}_{pref_code}.json")
    with open(cp_file, "w", encoding="utf-8") as f:
        json.dump({"last_page": last_page, "total_saved": total_saved, "updated_at": datetime.now().isoformat()}, f)

async def harvest_mhlw(pref_code, harvest_type="hakken", max_pages=None, start_page=1):
    """
    harvest_type: 'hakken' (労働者派遣事業) or 'jinzai' (有料職業紹介事業)
    """
    pref_info = MHLW_PREFECTURE_MAP.get(pref_code)
    if not pref_info:
        print(f"[-] Invalid prefecture code: {pref_code}")
        return

    pref_name = pref_info["name"]
    pref_cb = pref_info["cb"]
    
    is_hakken = (harvest_type == "hakken")
    transition_arg = '0' if is_hakken else '1'
    license_type_name = "労働者派遣事業" if is_hakken else "有料職業紹介事業"
    industry_code = "91" if is_hakken else "92"

    print("=" * 80)
    print(f"MHLW JINZAI HARVESTER: [{pref_code}] {pref_name} - {license_type_name}")
    print(f"Target DB: {DB_PATH}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    cp = load_checkpoint(harvest_type, pref_code)
    if start_page == 1 and cp["last_page"] > 0:
        start_page = cp["last_page"] + 1
        print(f"[*] Resuming from checkpoint: Page {start_page} (Previously saved: {cp['total_saved']:,})")

    conn = get_db()
    cur = conn.cursor()

    total_scraped = 0
    total_matched = 0
    total_phones_enriched = 0
    total_shumoku_enriched = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="ja-JP"
        )
        page = await context.new_page()

        print(f"[*] Connecting to MHLW Jinzai portal for {pref_name}...")
        try:
            await page.goto("https://jinzai.hellowork.mhlw.go.jp/JinzaiWeb/GICB101010.do?screenId=GICB101010", wait_until="networkidle", timeout=30000)
            btn = await page.query_selector("input[value='こちら']")
            if btn:
                async with page.expect_navigation(wait_until="networkidle", timeout=30000):
                    await btn.click()
        except Exception as e:
            print(f"[-] Initial connection error: {e}. Retrying...")
            await asyncio.sleep(3)
            await page.goto("https://jinzai.hellowork.mhlw.go.jp/JinzaiWeb/GICB101010.do?screenId=GICB101010", wait_until="networkidle", timeout=30000)
            btn = await page.query_selector("input[value='こちら']")
            if btn:
                async with page.expect_navigation(wait_until="networkidle", timeout=30000):
                    await btn.click()

        # Transition to target service
        async with page.expect_navigation(wait_until="networkidle", timeout=30000):
            await page.evaluate(f"doPostAction('transition', '{transition_arg}')")

        # Check prefecture checkbox
        await page.check(f"input#{pref_cb}")
        print(f"[*] Selected {pref_name} ({pref_cb}). Submitting search...")

        # Click search
        async with page.expect_navigation(wait_until="networkidle", timeout=30000):
            await page.click('input[src*="search_button.gif"]')

        # Read total count
        body_text = await page.evaluate("() => document.body.innerText")
        match = re.search(r'(\d+[\d,]*)\s*件', body_text)
        total_records = int(match.group(1).replace(',', '')) if match else 0
        total_pages = (total_records + 19) // 20
        print(f"[*] Total available: {total_records:,} records in {total_pages:,} pages")

        if total_records == 0:
            print(f"[!] No records found for {pref_name}. Exiting.")
            await browser.close()
            return

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
                            await page.evaluate(f"doPostAction('page', '{page_idx}')")
                    await page.wait_for_selector("table#search", state="attached", timeout=12000)
                    nav_success = True
                    break
                except Exception as e:
                    print(f"[-] Warning: Page {page_idx} attempt {attempt}/3 failed: {e}. Retrying...")
                    await asyncio.sleep(2)
                    if attempt == 2:
                        try:
                            # Re-establish navigation to search results
                            await page.goto("https://jinzai.hellowork.mhlw.go.jp/JinzaiWeb/GICB101010.do?screenId=GICB101010", wait_until="networkidle")
                            b = await page.query_selector("input[value='こちら']")
                            if b:
                                async with page.expect_navigation(wait_until="networkidle"):
                                    await b.click()
                            async with page.expect_navigation(wait_until="networkidle"):
                                await page.evaluate(f"doPostAction('transition', '{transition_arg}')")
                            await page.check(f"input#{pref_cb}")
                            async with page.expect_navigation(wait_until="networkidle"):
                                await page.click('input[src*="search_button.gif"]')
                        except Exception:
                            pass

            if not nav_success:
                print(f"[!] Skipping page {page_idx} after 3 failed attempts.")
                continue

            # Extract table rows
            raw_rows = await page.evaluate("""() => {
                const table = document.querySelector('table#search');
                if (!table) return [];
                const res = [];
                for (let i = 1; i < table.rows.length; i++) {
                    const row = table.rows[i];
                    if (row.cells.length >= 3) {
                        res.push(Array.from(row.cells).map(c => c.innerText.trim()));
                    }
                }
                return res;
            }""")

            batch_licenses = []
            batch_signals = []
            batch_comp_updates = []
            batch_industries = []

            for cols in raw_rows:
                if len(cols) < 3:
                    continue

                col0 = cols[0] # Lic num & date
                col1 = cols[1] # Employer name & branch
                col2 = cols[2] # Address & phone

                # Extract lic num & date
                lic_m = re.search(r'(派\d{2}-\d{6}|\d{2}-ユ-\d{6}|\d{2}-地-\d{6}|\d{2}-特-\d{6})', col0)
                raw_lic_num = lic_m.group(1) if lic_m else col0.split()[0]
                iso_date = parse_era_date(col0)

                # Extract employer name
                c1_parts = [p.strip() for p in col1.split('\n') if p.strip()]
                raw_comp_name = c1_parts[0] if c1_parts else ""
                office_name = c1_parts[1] if len(c1_parts) > 1 else raw_comp_name

                # Extract address & phone
                c2_parts = [p.strip() for p in col2.split('\n') if p.strip()]
                phone = ""
                address = ""
                for p in c2_parts:
                    if re.search(r'\d{2,4}-\d{2,4}-\d{3,4}', p):
                        phone = p
                    else:
                        address += (" " + p if address else p)

                if not raw_comp_name or not raw_lic_num:
                    continue

                total_scraped += 1

                # Clean matching
                norm_name = normalize_text(raw_comp_name)

                cur.execute(
                    """SELECT corporate_number, company_name, prefecture_code, 
                              phone_number, representative_name, capital_amount, jigyo_shumoku 
                       FROM companies WHERE company_name = ?;""",
                    (norm_name,)
                )
                candidates = cur.fetchall()

                # Filter by prefecture code if multiple candidates
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

                new_phone = None
                new_shumoku = None

                if (not cur_phone or cur_phone.strip() == "") and phone:
                    new_phone = phone
                    total_phones_enriched += 1

                shumoku_tag = f"{license_type_name}許可: {raw_lic_num}"
                if not cur_shumoku or cur_shumoku.strip() == "":
                    new_shumoku = shumoku_tag
                    total_shumoku_enriched += 1
                elif license_type_name not in cur_shumoku:
                    new_shumoku = f"{cur_shumoku}; {shumoku_tag}"
                    total_shumoku_enriched += 1

                if new_phone or new_shumoku:
                    batch_comp_updates.append((
                        new_phone or cur_phone,
                        new_shumoku or cur_shumoku,
                        corp_num
                    ))

                # Specialties JSON
                if is_hakken:
                    billing_rate = cols[3].replace('\n', ' ') if len(cols) > 3 else ""
                    wage_rate = cols[4].replace('\n', ' ') if len(cols) > 4 else ""
                    margin_rate = cols[5].replace('\n', ' ') if len(cols) > 5 else ""
                    labor_agree = cols[6].replace('\n', ' ') if len(cols) > 6 else ""
                    specs = {
                        "office_name": office_name,
                        "billing_rate_avg": billing_rate,
                        "wage_rate_avg": wage_rate,
                        "margin_rate": margin_rate,
                        "labor_agreement": labor_agree
                    }
                else:
                    fee_system = cols[6].strip() if len(cols) > 6 else ""
                    refund_system = cols[7].strip() if len(cols) > 7 else ""
                    specs = {
                        "office_name": office_name,
                        "fee_system": fee_system,
                        "refund_system": refund_system
                    }

                now_iso = datetime.now().isoformat()
                batch_licenses.append((
                    corp_num,
                    license_type_name,
                    "厚生労働大臣許可",
                    raw_lic_num,
                    "厚生労働省",
                    pref_code,
                    cur_rep or "",
                    phone or None,
                    None, # office_fax
                    address,
                    iso_date,
                    None, # valid_until
                    "有効",
                    json.dumps(specs, ensure_ascii=False),
                    "https://jinzai.hellowork.mhlw.go.jp/"
                ))

                signal_title = f"厚生労働省 {license_type_name}許可 ({raw_lic_num})"
                batch_signals.append((
                    corp_num,
                    "労働許認可",
                    signal_title,
                    iso_date,
                    None, # amount
                    "厚生労働省",
                    f"mhlw_{raw_lic_num}",
                    json.dumps(specs, ensure_ascii=False)
                ))

                batch_industries.append((corp_num, industry_code))

            # Database commit
            if batch_licenses:
                cur.executemany(
                    """INSERT OR REPLACE INTO company_licenses 
                       (corporate_number, license_type, license_category, license_number, 
                        issuing_authority, prefecture_code, representative_name, office_phone, 
                        office_fax, registered_address, issue_date, valid_until, license_status, 
                        specialties_json, source_url, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);""",
                    batch_licenses
                )

            if batch_signals:
                cur.executemany(
                    """INSERT OR IGNORE INTO business_signals 
                       (corporate_number, signal_type, signal_title, signal_date, amount, government_departments, source_key, details)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?);""",
                    batch_signals
                )

            if batch_comp_updates:
                cur.executemany(
                    """UPDATE companies 
                       SET has_license = 1,
                           primary_industry_code = COALESCE(primary_industry_code, '91'),
                           major_industry_code = COALESCE(major_industry_code, 'R'),
                           industry_confidence = CASE 
                               WHEN industry_confidence IN ('UNCLASSIFIED', 'VERIFIED_WEB', NULL, '') THEN 'CONFIRMED_LICENSE'
                               ELSE industry_confidence 
                           END,
                           phone_number = COALESCE(?, phone_number),
                           jigyo_shumoku = COALESCE(?, jigyo_shumoku),
                           updated_at = CURRENT_TIMESTAMP
                       WHERE corporate_number = ?;""",
                    batch_comp_updates
                )

            if batch_industries:
                cur.executemany(
                    """INSERT OR IGNORE INTO company_industries 
                       (corporate_number, industry_code)
                       VALUES (?, ?);""",
                    batch_industries
                )

            conn.commit()
            save_checkpoint(harvest_type, pref_code, page_idx, total_matched)

            elapsed = max(0.1, time.time() - t_start)
            rec_per_sec = total_scraped / elapsed
            print(f"[Page {page_idx}/{end_page}] Scraped: {total_scraped:,} | Matched: {total_matched:,} ({rec_per_sec:.1f} rec/s) | New Phones: +{total_phones_enriched:,}")

            # Safe pace
            await asyncio.sleep(0.3)

        await browser.close()

    conn.close()

    print("=" * 80)
    print(f"COMPLETED [{pref_code}] {pref_name} - {license_type_name}")
    print(f"Total Scraped:        {total_scraped:,}")
    print(f"Matched Corporations: {total_matched:,} ({(total_matched/max(1,total_scraped))*100:.1f}%)")
    print(f"Enriched Phones:      +{total_phones_enriched:,}")
    print(f"Enriched Shumoku:     +{total_shumoku_enriched:,}")
    print(f"Total Time Taken:     {time.time() - t_start:.1f}s")
    print("=" * 80)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="MHLW Jinzai Web Harvester")
    parser.add_argument("--pref", default="13", help="Prefecture code (default: 13 for Tokyo)")
    parser.add_argument("--type", default="hakken", choices=["hakken", "jinzai"], help="License type")
    parser.add_argument("--pages", type=int, default=None, help="Number of pages to harvest")
    parser.add_argument("--start", type=int, default=1, help="Starting page")
    args = parser.parse_args()

    asyncio.run(harvest_mhlw(args.pref, harvest_type=args.type, max_pages=args.pages, start_page=args.start))
