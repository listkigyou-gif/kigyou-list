#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Immigration Services Agency (ISA - 出入国在留管理庁)
Nationwide Registered Support Organization Harvester (登録支援機関)
====================================================================
Downloads the official nationwide master registry:
  URL: https://www.moj.go.jp/isa/content/001473034.xlsx
B2B Extraction:
  - Registration number (e.g. 19登-000002)
  - Registered date & era conversion
  - Corporate name & clean address
  - Direct office contact phone number
  - Representative name
  - Supported foreign languages (Vietnamese, English, Chinese, Indonesian, etc.)
  - Office branch locations & support scopes
Entity Resolution:
  - Resolves 13-digit NTA Corporate Number via (name + prefecture_code)
  - Enriches SQLite & VPS PostgreSQL company_licenses, companies, company_industries
"""

import os
import sys
import re
import json
import time
import sqlite3
import datetime
import urllib.request
import unicodedata
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scripts.sync_delta_licenses_to_vps import sync_licenses

DATA_DIR = os.path.join(PROJECT_ROOT, "importdata", "open-data", "isa")
EXCEL_PATH = os.path.join(DATA_DIR, "touroku_shien_kikan.xlsx")
ISA_EXCEL_URL = "https://www.moj.go.jp/isa/content/001473034.xlsx"
DB_PATH = os.path.join(PROJECT_ROOT, "kigyou-list.db")

os.makedirs(DATA_DIR, exist_ok=True)

PREF_MAP = {
    '北海道': '01', '青森県': '02', '岩手県': '03', '宮城県': '04', '秋田県': '05',
    '山形県': '06', '福島県': '07', '茨城県': '08', '栃木県': '09', '群馬県': '10',
    '埼玉県': '11', '千葉県': '12', '東京都': '13', '神奈川県': '14', '新潟県': '15',
    '富山県': '16', '石川県': '17', '福井県': '18', '山梨県': '19', '長野県': '20',
    '岐阜県': '21', '静岡県': '22', '愛知県': '23', '三重県': '24', '滋賀県': '25',
    '京都府': '26', '大阪府': '27', '兵庫県': '28', '奈良県': '29', '和歌山県': '30',
    '鳥取県': '31', '島根県': '32', '岡山県': '33', '広島県': '34', '山口県': '35',
    '徳島県': '36', '香川県': '37', '愛媛県': '38', '高知県': '39', '福岡県': '40',
    '佐賀県': '41', '長崎県': '42', '熊本県': '43', '大分県': '44', '宮崎県': '45',
    '鹿児島県': '46', '沖縄県': '47'
}

def clean_corp_name(name):
    if not name:
        return "", ""
    text = unicodedata.normalize("NFKC", str(name)).strip()
    text = re.sub(r'[\s\u3000]+', '', text)
    # Strip common corporate prefixes / suffixes for normalization
    norm = re.sub(r'(株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|一般財団法人|特定非営利活動法人|協同組合|事業協同組合|行政書士法人|弁護士法人|社会保険労務士法人|税理士法人)', '', text)
    return text, norm

def download_isa_excel():
    if not os.path.exists(EXCEL_PATH) or os.path.getsize(EXCEL_PATH) < 10000:
        print(f"[*] Downloading ISA Official Registered Support Org Registry from: {ISA_EXCEL_URL}...")
        req = urllib.request.Request(ISA_EXCEL_URL, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=60) as resp, open(EXCEL_PATH, "wb") as f:
            f.write(resp.read())
        print(f"[+] Download complete: {os.path.getsize(EXCEL_PATH):,} bytes")
    else:
        print(f"[*] ISA cache found: {EXCEL_PATH} ({os.path.getsize(EXCEL_PATH):,} bytes)")

def harvest_isa_support_orgs():
    t0 = time.time()
    print("=" * 80)
    print("KIGYOU-LIST: ISA NATIONWIDE REGISTERED SUPPORT ORG (登録支援機関) HARVESTER")
    print(f"Source: 出入国在留管理庁 (Immigration Services Agency of Japan)")
    print(f"Started at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    download_isa_excel()

    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
    ws = wb.active

    records = []
    print("[*] Parsing ISA Excel rows...")
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i < 8:
            continue
        lic_num = row[0]
        if not lic_num or not str(lic_num).strip():
            continue
            
        lic_number = str(lic_num).strip()
        reg_date = row[1]
        if isinstance(reg_date, datetime.datetime):
            issue_date = reg_date.strftime("%Y-%m-%d")
        elif reg_date:
            issue_date = str(reg_date).strip()[:10]
        else:
            issue_date = ""

        org_name = str(row[2] or "").strip()
        postal_code = str(row[3] or "").strip()
        address = str(row[4] or "").strip()
        phone = str(row[5] or "").strip()
        rep_name = str(row[6] or "").strip()
        office_name = str(row[7] or "").strip()
        office_postal = str(row[8] or "").strip()
        office_addr = str(row[9] or "").strip()
        support_scope = str(row[10] or "").strip()
        languages = str(row[12] or "").strip()

        # Clean phone
        phone_clean = re.sub(r'[^0-9]', '', phone)
        if len(phone_clean) in (10, 11):
            if phone_clean.startswith(('03', '06')):
                phone_formatted = f"{phone_clean[:2]}-{phone_clean[2:6]}-{phone_clean[6:]}"
            elif phone_clean.startswith(('050', '070', '080', '090', '0120')):
                phone_formatted = f"{phone_clean[:3]}-{phone_clean[3:7]}-{phone_clean[7:]}"
            else:
                phone_formatted = f"{phone_clean[:3]}-{phone_clean[3:6]}-{phone_clean[6:]}"
        else:
            phone_formatted = phone

        # Determine prefecture
        pref_code = "13"
        pref_name = "東京都"
        for p_name, p_code in PREF_MAP.items():
            if address.startswith(p_name) or office_addr.startswith(p_name):
                pref_code = p_code
                pref_name = p_name
                break

        full_addr = address if address else office_addr
        if postal_code and not full_addr.startswith("〒"):
            full_addr = f"〒{postal_code} {full_addr}"

        specialties = {
            "category": "登録支援機関",
            "supported_languages": languages,
            "office_name": office_name,
            "office_address": office_addr,
            "office_postal": office_postal,
            "support_scope": support_scope
        }

        clean_name, norm_name = clean_corp_name(org_name)

        records.append({
            "license_number": lic_number,
            "issue_date": issue_date,
            "org_name": org_name,
            "clean_name": clean_name,
            "norm_name": norm_name,
            "prefecture_code": pref_code,
            "prefecture_name": pref_name,
            "full_address": full_addr,
            "phone": phone_formatted,
            "rep_name": rep_name,
            "specialties_json": json.dumps(specialties, ensure_ascii=False)
        })

    wb.close()
    print(f"[+] Total Registered Support Organizations parsed: {len(records):,}")

    # Entity Resolution against local SQLite
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    cur = conn.cursor()

    print("[*] Performing Entity Resolution against NTA Master Companies...")
    resolved_count = 0
    batch_licenses = []
    batch_company_updates = []

    # Cache companies by (clean_name, prefecture_code)
    cur.execute("SELECT corporate_number, company_name, prefecture_code FROM companies;")
    corp_cache = {}
    for c_num, c_name, c_pref in cur.fetchall():
        cln, nrm = clean_corp_name(c_name)
        if cln:
            corp_cache[(cln, c_pref)] = c_num
            corp_cache[(cln, "ALL")] = c_num
        if nrm:
            corp_cache[(nrm, c_pref)] = c_num

    print(f"[*] Memory index built with {len(corp_cache):,} company lookup entries.")

    for rec in records:
        corp_num = corp_cache.get((rec["clean_name"], rec["prefecture_code"]))
        if not corp_num:
            corp_num = corp_cache.get((rec["norm_name"], rec["prefecture_code"]))
        if not corp_num:
            corp_num = corp_cache.get((rec["clean_name"], "ALL"))

        if not corp_num:
            # Skip individuals or non-matched organizations
            continue

        resolved_count += 1
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        batch_licenses.append((
            corp_num,
            "登録支援機関",
            "特定技能・外国人材支援",
            rec["license_number"],
            "出入国在留管理庁",
            rec["prefecture_code"],
            rec["rep_name"] or None,
            rec["phone"] or None,
            None, # fax
            rec["full_address"] or None,
            rec["issue_date"] or None,
            None, # valid_until
            "有効",
            rec["specialties_json"],
            ISA_EXCEL_URL,
            now_ts,
            now_ts
        ))

        batch_company_updates.append((
            rec["phone"] or None,
            rec["rep_name"] or None,
            corp_num
        ))

    print(f"[+] Successfully resolved {resolved_count:,} / {len(records):,} organizations ({resolved_count/len(records)*100:.1f}%) to official NTA Corporate Numbers.")

    # Insert into company_licenses
    print("[*] Inserting licenses into SQLite company_licenses...")
    cur.executemany("""
        INSERT OR REPLACE INTO company_licenses (
            corporate_number, license_type, license_category, license_number,
            issuing_authority, prefecture_code, representative_name, office_phone,
            office_fax, registered_address, issue_date, valid_until,
            license_status, specialties_json, source_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, batch_licenses)

    # Enrich companies (phone, representative, jigyo_shumoku, industries)
    print("[*] Updating company phone numbers, representatives, and industry tags...")
    for phone, rep, c_num in batch_company_updates:
        cur.execute("""
            UPDATE companies
            SET has_license = 1,
                phone_number = COALESCE(phone_number, ?),
                representative_name = COALESCE(representative_name, ?),
                primary_industry_code = COALESCE(primary_industry_code, '91'),
                major_industry_code = COALESCE(major_industry_code, 'R'),
                jigyo_shumoku = CASE
                    WHEN jigyo_shumoku IS NULL OR jigyo_shumoku = '' THEN '登録支援機関, 職業紹介・労働者派遣業'
                    WHEN jigyo_shumoku NOT LIKE '%登録支援機関%' THEN jigyo_shumoku || ', 登録支援機関'
                    ELSE jigyo_shumoku
                END
            WHERE corporate_number = ?;
        """, (phone, rep, c_num))

        # Insert into company_industries
        cur.execute("""
            INSERT OR IGNORE INTO company_industries (corporate_number, industry_code, industry_path, is_detailed, created_at)
            VALUES (?, 'R', 'R', 0, CURRENT_TIMESTAMP);
        """, (c_num,))
        cur.execute("""
            INSERT OR IGNORE INTO company_industries (corporate_number, industry_code, industry_path, is_detailed, created_at)
            VALUES (?, '91', 'R.91', 0, CURRENT_TIMESTAMP);
        """, (c_num,))

    conn.commit()
    conn.close()

    elapsed = time.time() - t0
    print("=" * 80)
    print(f"[+] HARVESTING COMPLETE IN {elapsed:.2f}s!")
    print(f"    - Total Registered Support Organizations Saved: {len(batch_licenses):,}")
    print("=" * 80)

    # Trigger delta synchronization to VPS PostgreSQL Production
    print("\n[*] Triggering automated delta sync to VPS PostgreSQL Production...")
    try:
        sync_licenses(target_types=['登録支援機関'])
        print("[+] Delta sync to VPS completed successfully!")
    except Exception as e:
        print(f"[-] Delta sync error: {e}")

    return len(batch_licenses)

if __name__ == "__main__":
    harvest_isa_support_orgs()
