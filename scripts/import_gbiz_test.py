#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: G-Biz CSV 5,000 Records Test Import Script
======================================================
Pure English console output to prevent UnicodeEncodeErrors on Windows CP1252 consoles.
"""

import os
import csv
import re
import sys
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values

# Default credentials for local PostgreSQL
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "kigyou-list")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")

CSV_PATH = r"importdata/gbiz-data/Kihonjoho_UTF-8/Kihonjoho_UTF-8.csv"
JSIC_MD_PATH = r".docs/03-日本標準産業分類-JSIC.md"
TARGET_RECORD_COUNT = 5000

def get_db_connection():
    """Establish connection to PostgreSQL."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        return conn
    except Exception as e:
        print(f"[-] Could not connect to Database: {e}")
        print("[!] Please make sure PostgreSQL is running and credentials are correct.")
        print(f"    (Host: {DB_HOST}, Port: {DB_PORT}, DB: {DB_NAME}, User: {DB_USER})")
        sys.exit(1)

def parse_jsic_industries(file_path):
    """Parse JSIC industries from Markdown file."""
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

    print(f"[+] Found {len(industries)} industries in total.")
    return industries

def sync_industries_to_db(conn, industries):
    """Sync industries list into PostgreSQL."""
    print("[*] Synchronizing JSIC industries into `m_industries` table...")
    cursor = conn.cursor()
    
    sql = """
        INSERT INTO m_industries (industry_code, industry_name, classification_level, parent_code)
        VALUES %s
        ON CONFLICT (industry_code) DO UPDATE 
        SET industry_name = EXCLUDED.industry_name,
            classification_level = EXCLUDED.classification_level,
            parent_code = EXCLUDED.parent_code;
    """
    
    values = [
        (ind["code"], ind["name"], ind["level"], ind["parent"])
        for ind in industries
    ]
    
    try:
        execute_values(cursor, sql, values)
        conn.commit()
        print("[+] Industry categories synchronized successfully.")
    except Exception as e:
        conn.rollback()
        print(f"[-] Error synchronizing industries: {e}")
        sys.exit(1)
    finally:
        cursor.close()

def parse_date(date_str):
    """Format dates safely to YYYY-MM-DD."""
    if not date_str:
        return None
    date_str = date_str.strip()
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y/%m/%d").date()
        except ValueError:
            return None

def parse_int(val_str):
    """Parse integers safely."""
    if not val_str:
        return None
    val_str = val_str.strip()
    try:
        cleaned = re.sub(r"[^\d]", "", val_str)
        return int(cleaned) if cleaned else None
    except ValueError:
        return None

def extract_industry_codes(industry_str):
    """Extract industry codes from G-Biz string."""
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

def import_gbiz_companies(conn):
    """Stream CSV and import 5,000 corporate records."""
    print(f"[*] Opening CSV file from: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print(f"[-] CSV file not found at: {CSV_PATH}")
        print("[!] Please make sure the CSV has been placed in the folder.")
        return

    # Get valid industry codes
    cursor = conn.cursor()
    cursor.execute("SELECT industry_code FROM m_industries;")
    valid_industry_codes = {row[0] for row in cursor.fetchall()}
    cursor.close()

    companies_data = []
    company_industries_data = []
    count = 0

    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        headers = next(reader)
        print(f"[+] Loaded CSV header row ({len(headers)} columns).")

        for row_idx, row in enumerate(reader, start=1):
            if len(row) < 27:
                continue

            org_type = row[13].strip() # 301 is Kabushiki Gaisha
            
            if org_type == "301":
                corporate_number = row[0].strip()
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
                representative_position = "代表取締役"
                
                # Establishment and financial
                establishment_date = parse_date(row[26])
                capital_amount = parse_int(row[18])
                employee_count = parse_int(row[19])
                
                # Other fields
                website_url = row[23].strip() if row[23] else None
                business_summary = row[22].strip() if row[22] else None
                status = row[16].strip() if row[16] else "活動中"
                
                companies_data.append((
                    corporate_number, company_name, company_name_kana, company_name_en,
                    postal_code, prefecture_code, prefecture_name, city_name, street_address, full_address,
                    representative_name, representative_position, establishment_date,
                    capital_amount, employee_count, None,
                    None, None, website_url, None,
                    business_summary, status
                ))
                
                # Parse industry codes
                industry_raw = row[25].strip()
                if industry_raw:
                    extracted_codes = extract_industry_codes(industry_raw)
                    for code in extracted_codes:
                        if code in valid_industry_codes:
                            company_industries_data.append((corporate_number, code))

                count += 1
                if count % 1000 == 0:
                    print(f"    -> Filtered {count}/{TARGET_RECORD_COUNT} companies...")

                if count >= TARGET_RECORD_COUNT:
                    break

    print(f"[+] Processing completed. {len(companies_data)} companies and {len(company_industries_data)} industry links ready.")
    
    # Bulk insert into PostgreSQL
    print("[*] Bulk inserting data into database...")
    cursor = conn.cursor()
    
    insert_company_sql = """
        INSERT INTO companies (
            corporate_number, company_name, company_name_kana, company_name_en,
            postal_code, prefecture_code, prefecture_name, city_name, street_address, full_address,
            representative_name, representative_position, establishment_date,
            capital_amount, employee_count, sales_amount,
            phone_number, fax_number, website_url, email_address,
            business_summary, status
        ) VALUES %s
        ON CONFLICT (corporate_number) DO UPDATE
        SET company_name = EXCLUDED.company_name,
            full_address = EXCLUDED.full_address,
            capital_amount = EXCLUDED.capital_amount,
            employee_count = EXCLUDED.employee_count,
            website_url = EXCLUDED.website_url;
    """
    
    insert_mapping_sql = """
        INSERT INTO company_industries (corporate_number, industry_code)
        VALUES %s
        ON CONFLICT (corporate_number, industry_code) DO NOTHING;
    """
    
    try:
        # Write to companies table (Parent)
        execute_values(cursor, insert_company_sql, companies_data)
        print(f"[+] Successfully inserted {len(companies_data)} companies into `companies`.")
        
        # Write to mapping table (Child)
        if company_industries_data:
            execute_values(cursor, insert_mapping_sql, company_industries_data)
            print(f"[+] Successfully inserted {len(company_industries_data)} links into `company_industries`.")
            
        conn.commit()
        print("\n[🎉] SUCCESS! Imported 5,000 corporate records of organization '301' into database.")
    except Exception as e:
        conn.rollback()
        print(f"[-] Database bulk insert failed: {e}")
    finally:
        cursor.close()

def main():
    print("="*60)
    print("         KIGYOU-LIST: 5,000 RECORDS TEST IMPORT")
    print("="*60)
    
    conn = get_db_connection()
    
    try:
        industries = parse_jsic_industries(JSIC_MD_PATH)
        if industries:
            sync_industries_to_db(conn, industries)
        import_gbiz_companies(conn)
        
    finally:
        conn.close()
        print("[*] Connection closed successfully.")

if __name__ == "__main__":
    main()
