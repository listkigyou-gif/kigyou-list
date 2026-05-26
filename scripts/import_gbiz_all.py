#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: G-Biz Full Ingestion Script (SQLite Streaming & Batched Ingest)
========================================================================
Reads the large (3.45 GB) Kihonjoho_UTF-8.csv file and streams it in chunks
to prevent OOM errors. Supports importing customizable corporate types
(defaults to active commercial companies: 301, 302, 305).
Console outputs are ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import csv
import re
import sys
import sqlite3
import time
from datetime import datetime

# Reconfigure stdout to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = "kigyou-list.db"
CSV_PATH = "importdata/gbiz-data/Kihonjoho_UTF-8_20260516/Kihonjoho_UTF-8.csv"
JSIC_MD_PATH = ".docs/03-日本標準産業分類-JSIC.md"

# Default configuration: Ingest commercial types (301: Kabushiki, 302: Yugen, 305: Godo)
# Pass --all in command line to ingest all corporate types.
DEFAULT_TARGET_ORG_TYPES = {"301", "302", "305"}
BATCH_SIZE = 50000

def get_db_connection():
    try:
        conn = sqlite3.connect(DB_PATH)
        # Enable WAL mode and optimize sqlite page size/cache size for fast inserts
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA cache_size=-64000;") # 64MB cache
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn
    except Exception as e:
        print(f"[-] Could not connect to SQLite database: {e}")
        sys.exit(1)

def parse_jsic_industries(file_path):
    print("[*] Reading JSIC industry classification file...")
    if not os.path.exists(file_path):
        print(f"[-] Industry classification file not found at: {file_path}")
        return []

    industries = []
    current_major_code = None

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # 1. Parse Major Class (e.g. ## A 農業，林業)
            if line.startswith("## "):
                content = line[3:].strip()
                parts = content.split(" ", 1)
                if len(parts) >= 2:
                    code = parts[0].strip()
                    rest = parts[1].strip()
                    name = rest.split("(")[0].strip()
                    industries.append({
                        "code": code,
                        "name": name,
                        "level": "大分類",
                        "parent": None
                    })
                    current_major_code = code

            # 2. Parse Medium Class (e.g. * 01 農業)
            elif line.startswith("* "):
                content = line[2:].strip()
                parts = content.split(" ", 1)
                if len(parts) >= 2:
                    code = parts[0].strip()
                    name = parts[1].strip()
                    industries.append({
                        "code": code,
                        "name": name,
                        "level": "中分類",
                        "parent": current_major_code
                    })

    print(f"[+] Found {len(industries)} JSIC categories.")
    return industries

def sync_industries_to_db(conn, industries):
    print("[*] Synchronizing JSIC industries to database...")
    cursor = conn.cursor()
    sql = """
        INSERT INTO m_industries (industry_code, industry_name, classification_level, parent_code)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (industry_code) DO UPDATE 
        SET industry_name = EXCLUDED.industry_name,
            classification_level = EXCLUDED.classification_level,
            parent_code = EXCLUDED.parent_code;
    """
    values = [(ind["code"], ind["name"], ind["level"], ind["parent"]) for ind in industries]
    try:
        cursor.executemany(sql, values)
        conn.commit()
        print("[+] JSIC industry metadata synchronized successfully.")
    except Exception as e:
        conn.rollback()
        print(f"[-] Error synchronizing industries: {e}")
        sys.exit(1)

def parse_int(val_str):
    if not val_str:
        return None
    val_str = val_str.strip()
    try:
        cleaned = re.sub(r"[^\d]", "", val_str)
        return int(cleaned) if cleaned else None
    except ValueError:
        return None

def extract_industry_codes(industry_str):
    codes = set()
    if not industry_str:
        return codes
    items = industry_str.split('|')
    for item in items:
        parts = item.split('-')
        for part in parts:
            if ':' in part:
                code = part.split(':')[0].strip()
                if code:
                    codes.add(code)
            else:
                code = part.strip()
                if code:
                    codes.add(code)
    return codes

def import_all_gbiz(conn, ingest_all_types=False):
    print(f"[*] Ingestion Mode: {'ALL CORPORATE TYPES' if ingest_all_types else 'COMMERCIAL TYPES ONLY (301, 302, 305)'}")
    print(f"[*] Scanning G-Biz CSV file: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print(f"[-] G-Biz CSV file not found at: {CSV_PATH}")
        sys.exit(1)

    # Cache JSIC codes
    cursor = conn.cursor()
    cursor.execute("SELECT industry_code FROM m_industries;")
    valid_industry_codes = {row[0] for row in cursor.fetchall()}
    print(f"[+] Cached {len(valid_industry_codes)} JSIC industry codes for mapping.")

    insert_company_sql = """
        INSERT INTO companies (
            corporate_number, company_name, company_name_kana, company_name_en,
            postal_code, prefecture_code, prefecture_name, city_name, street_address, full_address,
            representative_name, representative_position, establishment_date,
            capital_amount, employee_count, sales_amount,
            phone_number, fax_number, website_url, email_address,
            business_summary, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (corporate_number) DO UPDATE
        SET company_name = EXCLUDED.company_name,
            full_address = EXCLUDED.full_address,
            capital_amount = EXCLUDED.capital_amount,
            employee_count = EXCLUDED.employee_count,
            website_last_crawled_at = CASE 
                WHEN EXCLUDED.website_url IS NOT website_url THEN NULL 
                ELSE website_last_crawled_at 
            END,
            website_crawl_status = CASE 
                WHEN EXCLUDED.website_url IS NOT website_url THEN NULL 
                ELSE website_crawl_status 
            END,
            website_url = EXCLUDED.website_url,
            updated_at = CURRENT_TIMESTAMP;
    """
    
    insert_mapping_sql = """
        INSERT INTO company_industries (corporate_number, industry_code)
        VALUES (?, ?)
        ON CONFLICT (corporate_number, industry_code) DO NOTHING;
    """

    companies_batch = []
    mappings_batch = []
    
    total_scanned = 0
    total_imported = 0
    total_mappings = 0
    
    start_time = time.time()
    batch_start = time.time()

    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        headers = next(reader)
        print(f"[+] Read CSV Header. {len(headers)} columns.")

        for row in reader:
            total_scanned += 1
            if len(row) < 27:
                continue

            org_type = row[13].strip()
            
            # Check filter
            if not ingest_all_types and org_type not in DEFAULT_TARGET_ORG_TYPES:
                continue

            corporate_number = row[0].strip()
            if not corporate_number or len(corporate_number) != 13:
                continue

            company_name = row[1].strip()
            company_name_kana = row[2].strip() if row[2] else None
            company_name_en = row[3].strip() if row[3] else None
            
            # Address details
            postal_code = re.sub(r"[^\d]", "", row[7].strip())[:7] if row[7] else None
            prefecture_name = row[8].strip() if row[8] else None
            prefecture_code = row[9].strip() if row[9] else None
            city_name = row[10].strip() if row[10] else None
            street_address = row[12].strip() if row[12] else None
            full_address = row[6].strip() if row[6] else None
            
            # Representative
            representative_name = row[17].strip() if row[17] else None
            representative_position = "代表取締役" if org_type == "301" else "代表者"
            
            # Establishment & Capital
            establishment_date = row[26].strip() if row[26] else None
            capital_amount = parse_int(row[18])
            employee_count = parse_int(row[19])
            
            # Other fields
            website_url = row[23].strip() if row[23] else None
            business_summary = row[22].strip() if row[22] else None
            status = row[16].strip() if row[16] else "活動中"

            companies_batch.append((
                corporate_number, company_name, company_name_kana, company_name_en,
                postal_code, prefecture_code, prefecture_name, city_name, street_address, full_address,
                representative_name, representative_position, establishment_date,
                capital_amount, employee_count, None,
                None, None, website_url, None,
                business_summary, status
            ))

            # Parse and queue industries
            industry_raw = row[25].strip()
            if industry_raw:
                extracted_codes = extract_industry_codes(industry_raw)
                for code in extracted_codes:
                    if code in valid_industry_codes:
                        mappings_batch.append((corporate_number, code))
                        total_mappings += 1

            total_imported += 1

            # Commit batch when size reached
            if len(companies_batch) >= BATCH_SIZE:
                cursor.executemany(insert_company_sql, companies_batch)
                if mappings_batch:
                    cursor.executemany(insert_mapping_sql, mappings_batch)
                conn.commit()
                
                batch_duration = time.time() - batch_start
                rate = len(companies_batch) / batch_duration if batch_duration > 0 else 0
                print(f"  -> Imported {total_imported} companies (Scanned {total_scanned}). Batch rate: {rate:.1f} rows/s")
                
                companies_batch = []
                mappings_batch = []
                batch_start = time.time()

        # Commit remaining records
        if companies_batch:
            cursor.executemany(insert_company_sql, companies_batch)
            if mappings_batch:
                cursor.executemany(insert_mapping_sql, mappings_batch)
            conn.commit()
            print(f"  -> Imported remaining records. Final total imported: {total_imported}")

    duration = time.time() - start_time
    avg_rate = total_imported / duration if duration > 0 else 0
    print("\n" + "="*50)
    print("      SUMMARY OF G-BIZ DATABASE INGESTION")
    print("="*50)
    print(f"  - Total CSV Lines Scanned   : {total_scanned}")
    print(f"  - Total Companies Imported  : {total_imported}")
    print(f"  - Total JSIC Mappings Added : {total_mappings}")
    print(f"  - Total Ingestion Duration  : {duration:.1f} seconds ({duration/60:.1f} minutes)")
    print(f"  - Average Ingestion Rate    : {avg_rate:.1f} rows/second")
    print("="*50)

def main():
    print("="*60)
    print("      KIGYOU-LIST: G-BIZ FULL DATA STREAM LOADER")
    print("="*60)
    
    ingest_all_types = "--all" in sys.argv
    conn = get_db_connection()
    try:
        # Load industries first to build classification categories
        industries = parse_jsic_industries(JSIC_MD_PATH)
        if industries:
            sync_industries_to_db(conn, industries)
        
        # Run streaming company loader
        import_all_gbiz(conn, ingest_all_types)
        
    except Exception as e:
        print(f"[-] Fatal error during G-Biz ingestion: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()
        print("[*] Database connection closed.")

if __name__ == "__main__":
    main()
