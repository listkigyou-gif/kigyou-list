#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Prefecture Open Data Ingestion & Enrichment Engine
==============================================================
Runs 100% on Local PC using NVMe SSD and multi-core CPU.
Imports and enriches corporate licenses into kigyou-list.db:
- Updates 'company_licenses'
- Enriches missing phone numbers, kana, capital, representatives, jigyo_shumoku in 'companies'
- Maps 29 construction specialties into JSIC industry codes '06', '07', '08' in 'company_industries'
- Records legal intent signals in 'business_signals'
"""

import os
import sys
import json
import time
import sqlite3
import argparse
from datetime import datetime

# Adjust path to import parsers
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from crawlers.open_data.parsers.tokyo_construction_parser import parse_tokyo_construction_file

DB_PATH = "kigyou-list.db"
BATCH_SIZE = 1000

# JSIC Mapping for 29 Construction Specialties
JSIC_06_SPECIALTIES = {'土木', '建築'}
JSIC_07_SPECIALTIES = {
    '大工', '左官', 'とび', '石工', '屋根', 'タイル', '鋼構造物', '鉄筋',
    '舗装', 'しゅんせつ', '板金', 'ガラス', '塗装', '防水', '内装', '造園',
    'さく井', '建具', '清掃施設', '解体'
}
JSIC_08_SPECIALTIES = {'電気', '管', '機械器具', '熱絶縁', '電気通信', '水道施設', '消防施設'}

def get_db_connection():
    try:
        conn = sqlite3.connect(DB_PATH, timeout=60.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA cache_size=-64000;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn
    except Exception as e:
        print(f"[-] Could not connect to SQLite database: {e}")
        sys.exit(1)

def run_tokyo_construction_import(file_path, limit=None):
    if not os.path.exists(file_path):
        print(f"[-] File not found: {file_path}")
        return

    conn = get_db_connection()
    cur = conn.cursor()
    
    print("=" * 75)
    print("KIGYOU-LIST: TOKYO OPEN DATA CONSTRUCTION LICENSES FULL INGESTION")
    print(f"Target DB: {DB_PATH}")
    print(f"Source: {file_path}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 75)

    t_start = time.time()
    total_parsed = 0
    matched_corp = 0
    skipped_individual = 0
    enriched_phone = 0
    enriched_rep = 0
    enriched_capital = 0
    enriched_kana = 0
    enriched_shumoku = 0
    industry_mappings_count = 0
    unmatched = 0

    batch_licenses = []
    batch_signals = []
    batch_comp_updates = []
    batch_industries = []

    for item in parse_tokyo_construction_file(file_path):
        total_parsed += 1
        if limit and total_parsed > limit:
            break

        if not item["is_corp"]:
            skipped_individual += 1
            continue

        norm_name = item["norm_name"]
        
        # Fast indexed lookup on companies with 8 columns
        cur.execute(
            """SELECT corporate_number, company_name, prefecture_code, 
                      phone_number, representative_name, capital_amount,
                      company_name_kana, jigyo_shumoku 
               FROM companies WHERE company_name = ?;""",
            (norm_name,)
        )
        candidates = cur.fetchall()

        matched_cand = None
        for cand in candidates:
            if cand[2] == item["prefecture_code"]:
                matched_cand = cand
                break
        
        # Fallback if only 1 exact candidate nationwide
        if not matched_cand and len(candidates) == 1:
            matched_cand = candidates[0]

        if not matched_cand:
            unmatched += 1
            continue

        matched_corp += 1
        corp_num = matched_cand[0]
        cur_phone = matched_cand[3]
        cur_rep = matched_cand[4]
        cur_cap = matched_cand[5]
        cur_kana = matched_cand[6]
        cur_shumoku = matched_cand[7]

        # 1. Check master fields to enrich in companies table
        new_phone = None
        new_rep = None
        new_cap = None
        new_kana = None
        new_shumoku = None

        if (not cur_phone or cur_phone.strip() == "") and item["office_phone"]:
            new_phone = item["office_phone"]
            enriched_phone += 1

        if (not cur_rep or cur_rep.strip() == "") and item["representative_name"]:
            new_rep = item["representative_name"]
            enriched_rep += 1

        if (not cur_cap or cur_cap == 0) and item["capital_amount"]:
            new_cap = item["capital_amount"]
            enriched_capital += 1

        if (not cur_kana or cur_kana.strip() == "") and item["company_name_kana"]:
            new_kana = item["company_name_kana"]
            enriched_kana += 1

        # Summary of construction specialties
        specs = item["specialties"]
        spec_keys = list(specs.keys())
        if spec_keys:
            spec_summary = f"建設業許可({item['license_category']}): " + ", ".join(spec_keys[:8])
            if len(spec_keys) > 8:
                spec_summary += f" 他{len(spec_keys)-8}種"
            if not cur_shumoku or cur_shumoku.strip() == "":
                new_shumoku = spec_summary
                enriched_shumoku += 1
            elif "建設業" not in cur_shumoku:
                new_shumoku = f"{cur_shumoku}; {spec_summary}"
                enriched_shumoku += 1

        if any([new_phone, new_rep, new_cap, new_kana, new_shumoku]):
            batch_comp_updates.append((
                new_phone or cur_phone,
                new_rep or cur_rep,
                new_cap or cur_cap,
                new_kana or cur_kana,
                new_shumoku or cur_shumoku,
                corp_num
            ))

        # 2. Map to JSIC Industries (06, 07, 08)
        spec_set = set(specs.keys())
        if spec_set & JSIC_06_SPECIALTIES:
            batch_industries.append((corp_num, '06'))
            industry_mappings_count += 1
        if spec_set & JSIC_07_SPECIALTIES:
            batch_industries.append((corp_num, '07'))
            industry_mappings_count += 1
        if spec_set & JSIC_08_SPECIALTIES:
            batch_industries.append((corp_num, '08'))
            industry_mappings_count += 1

        # 3. Prepare company_licenses record
        specialties_json = json.dumps(specs, ensure_ascii=False)
        batch_licenses.append((
            corp_num,
            "建設業許可",
            item["license_category"],
            item["license_number"],
            item["issuing_authority"],
            item["prefecture_code"],
            item["representative_name"],
            item["office_phone"],
            None, # fax
            item["registered_address"],
            item["issue_date"],
            None, # valid_until
            "有効",
            specialties_json,
            "https://www.toshiseibi.metro.tokyo.lg.jp/kenchiku_kaihatsu/kenchiku_shidou/gyosya_shido/kensetsu/tokyou_kensetsu_meibo"
        ))

        # 4. Prepare business_signals record
        source_key = f"lic_kensetsu_{item['prefecture_code']}_{item['raw_lic_num']}"
        sig_details = json.dumps({
            "license_number": item["license_number"],
            "license_category": item["license_category"],
            "issuing_authority": item["issuing_authority"],
            "specialties": specs,
            "capital_amount": item["capital_amount"],
            "fiscal_date": item["fiscal_date"]
        }, ensure_ascii=False)

        batch_signals.append((
            corp_num,
            "建設業許可",
            item["license_number"],
            item["issue_date"],
            item["capital_amount"],
            item["issuing_authority"],
            source_key,
            sig_details
        ))

        # Commit batches periodically
        if len(batch_licenses) >= BATCH_SIZE:
            _flush_batches(cur, conn, batch_licenses, batch_signals, batch_comp_updates, batch_industries)
            batch_licenses.clear()
            batch_signals.clear()
            batch_comp_updates.clear()
            batch_industries.clear()
            
            elapsed = time.time() - t_start
            rate = matched_corp / elapsed if elapsed > 0 else 0
            print(f"[Progress] Parsed: {total_parsed:,} | Matched: {matched_corp:,} ({rate:.1f} rec/s) | Phones: +{enriched_phone:,} | Reps: +{enriched_rep:,} | Kanas: +{enriched_kana:,}")

    # Flush remainder
    if batch_licenses:
        _flush_batches(cur, conn, batch_licenses, batch_signals, batch_comp_updates, batch_industries)

    conn.close()
    t_total = time.time() - t_start
    print("=" * 75)
    print("FULL INGESTION COMPLETED SUCCESSFULLY (LOCAL SSD NVME)")
    print(f"Total Rows Parsed:         {total_parsed:,}")
    print(f"Corporations Matched:      {matched_corp:,} ({matched_corp / (matched_corp + unmatched) * 100:.1f}%)")
    print(f"Individual (Skipped):      {skipped_individual:,}")
    print(f"Unmatched Corps:           {unmatched:,}")
    print(f"Enriched New Phones:       +{enriched_phone:,}")
    print(f"Enriched New Reps:         +{enriched_rep:,}")
    print(f"Enriched New Capital:      +{enriched_capital:,}")
    print(f"Enriched New Kanas:        +{enriched_kana:,}")
    print(f"Enriched Jigyo Shumoku:    +{enriched_shumoku:,}")
    print(f"Mapped JSIC Industries:    +{industry_mappings_count:,}")
    print(f"Total Time Taken:          {t_total:.2f} seconds ({matched_corp / t_total:.1f} records/sec)")
    print("=" * 75)

def _flush_batches(cur, conn, batch_licenses, batch_signals, batch_comp_updates, batch_industries):
    # 1. Insert/Replace into company_licenses
    cur.executemany("""
        INSERT OR REPLACE INTO company_licenses (
            corporate_number, license_type, license_category, license_number,
            issuing_authority, prefecture_code, representative_name, office_phone,
            office_fax, registered_address, issue_date, valid_until, license_status,
            specialties_json, source_url, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
    """, batch_licenses)

    # 2. Insert into business_signals (ignore if source_key exists)
    cur.executemany("""
        INSERT OR IGNORE INTO business_signals (
            corporate_number, signal_type, signal_title, signal_date,
            amount, government_departments, source_key, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, batch_signals)

    # 3. Update companies table with enriched fields
    if batch_comp_updates:
        cur.executemany("""
            UPDATE companies
            SET phone_number = COALESCE(?, phone_number),
                representative_name = COALESCE(?, representative_name),
                capital_amount = COALESCE(?, capital_amount),
                company_name_kana = COALESCE(?, company_name_kana),
                jigyo_shumoku = COALESCE(?, jigyo_shumoku),
                updated_at = CURRENT_TIMESTAMP
            WHERE corporate_number = ?;
        """, batch_comp_updates)

    # 4. Insert into company_industries (ignore if already exists)
    if batch_industries:
        cur.executemany("""
            INSERT OR IGNORE INTO company_industries (
                corporate_number, industry_code
            ) VALUES (?, ?);
        """, batch_industries)

    conn.commit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kigyou-list Open Data Ingestion")
    parser.add_argument("--file", default="importdata/open-data/13_tokyo/tokyo_kensetsu_kyokajun.xlsx", help="Path to xlsx/csv file")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of rows for testing")
    args = parser.parse_args()

    run_tokyo_construction_import(args.file, args.limit)
