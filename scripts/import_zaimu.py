#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Financial Data Ingestion & Enrichment Script (SQLite)
======================================================================
Enriches the 'companies' table and loads 5-year historical trends into 
'company_financials' from Zaimujoho_UTF-8.csv.
Supports Japanese Wareki (令和, 平成) to Seireki Western calendar conversion 
and leap-year-safe date offsets.
"""

import os
import csv
import re
import sys
import sqlite3
from datetime import datetime

DB_PATH = "kigyou-list.db"
ZAIMU_CSV_PATH = "importdata/gbiz-data/sogo-data/Zaimujoho_UTF-8.csv"
BATCH_SIZE = 2000

def get_db_connection():
    """Establish SQLite database connection."""
    try:
        conn = sqlite3.connect(DB_PATH)
        return conn
    except Exception as e:
        print(f"[-] Could not connect to SQLite database: {e}")
        sys.exit(1)

def parse_int(val_str):
    """Parse integers safely by stripping non-numeric characters (except minus sign)."""
    if not val_str:
        return None
    val_str = val_str.strip()
    try:
        # Keep digits and minus sign (for losses represented by - or △ in Japanese)
        cleaned = val_str.replace("△", "-")
        cleaned = re.sub(r"[^\d-]", "", cleaned)
        return int(cleaned) if cleaned else None
    except ValueError:
        return None

def parse_japanese_date(date_str):
    """
    Parses a Japanese date string like '2024年4月1日', '令和6年4月1日', or '平成29年3月31日'
    and returns a ISO formatted date string 'YYYY-MM-DD'.
    Handles full-width Zenkaku numerals by translating them.
    """
    if not date_str:
        return None
    
    # Normalize Zenkaku to Hankaku numerals and spaces
    date_str = date_str.translate(str.maketrans("０１２３４５６７８９　", "0123456789 "))
    date_str = date_str.strip()
    
    # Match pattern: (EraName Year | WesternYear)年 Month月 Day日
    pattern = r"(?:(令和|平成|昭和)(\d+|元)|(\d{4}))年\s*(\d{1,2})月\s*(\d{1,2})日"
    match = re.search(pattern, date_str)
    if not match:
        # Fallback to standard YYYY-MM-DD
        match = re.search(r"(\d{4})[./-](\d{1,2})[./-](\d{1,2})", date_str)
        if match:
            year = int(match.group(1))
            month = int(match.group(2))
            day = int(match.group(3))
            return f"{year:04d}-{month:02d}-{day:02d}"
        return None
        
    era = match.group(1)
    wareki_year = match.group(2)
    western_year = match.group(3)
    month = int(match.group(4))
    day = int(match.group(5))
    
    if era:
        w_year = 1 if wareki_year == "元" else int(wareki_year)
        if era == "令和":
            year = 2018 + w_year
        elif era == "平成":
            year = 1988 + w_year
        elif era == "昭和":
            year = 1925 + w_year
        else:
            year = w_year
    else:
        year = int(western_year)
        
    return f"{year:04d}-{month:02d}-{day:02d}"

def subtract_years(date_str, years_to_subtract):
    """
    Subtracts N years from an ISO date string (YYYY-MM-DD) safely.
    Handles Feb 29 leap day fallback to Feb 28 in non-leap years.
    """
    if not date_str or years_to_subtract == 0:
        return date_str
    
    try:
        parts = date_str.split("-")
        year = int(parts[0]) - years_to_subtract
        month = int(parts[1])
        day = int(parts[2])
        
        # Handle Feb 29 leap day fallback to Feb 28 in non-leap years
        if month == 2 and day == 29:
            is_leap = (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0))
            if not is_leap:
                day = 28
                
        return f"{year:04d}-{month:02d}-{day:02d}"
    except Exception:
        return None

def parse_fiscal_period(period_str, sequence_num):
    """
    Parses a period string like '第75期(自 2024年4月1日 至 2025年3月31日)'
    and returns a tuple of (fiscal_year_start, fiscal_year_end) adjusted for sequence_num.
    """
    if not period_str:
        return None, None
        
    start_date = None
    end_date = None
    
    # Try splitting by '自' and '至'
    if "自" in period_str and "至" in period_str:
        try:
            parts_自 = period_str.split("自")
            parts_至 = parts_自[1].split("至")
            
            start_raw = parts_至[0]
            end_raw = parts_至[1].split(")")[0].split("）")[0] # Clean trailing brackets
            
            start_date = parse_japanese_date(start_raw)
            end_date = parse_japanese_date(end_raw)
        except Exception:
            pass
            
    # Fallback: search for any two dates using regex in order
    if not start_date or not end_date:
        normalized_str = period_str.translate(str.maketrans("０１２３４５６７８９　", "0123456789 "))
        pattern = r"(?:(?:令和|平成|昭和)(?:\d+|元)|(?:\d{4}))年\s*\d{1,2}月\s*\d{1,2}日"
        matches = re.findall(pattern, normalized_str)
        if len(matches) >= 2:
            start_date = parse_japanese_date(matches[0])
            end_date = parse_japanese_date(matches[1])
            
    # Adjust starting/ending year based on the sequence_number (回次) offset
    adjusted_start = subtract_years(start_date, sequence_num)
    adjusted_end = subtract_years(end_date, sequence_num)
    
    return adjusted_start, adjusted_end

def enrich_companies_financials(conn):
    """Read Zaimujoho CSV and enrich both 'companies' and 'company_financials' tables."""
    print(f"[*] Opening Financial CSV file from: {ZAIMU_CSV_PATH}")
    if not os.path.exists(ZAIMU_CSV_PATH):
        print(f"[-] CSV file not found at: {ZAIMU_CSV_PATH}")
        print("[!] Please make sure the Zaimujoho_UTF-8.csv has been placed in the folder.")
        return

    cursor = conn.cursor()

    # Get the set of corporate numbers already in our database to ensure relational integrity
    print("[*] Fetching existing corporate numbers from database...")
    cursor.execute("SELECT corporate_number FROM companies;")
    existing_companies = {row[0] for row in cursor.fetchall()}
    print(f"[+] Found {len(existing_companies)} companies currently in database.")

    if not existing_companies:
        print("[-] No companies found in the database. Please run the base import script first!")
        return

    companies_batch = []
    financials_batch = []
    processed_count = 0
    matched_count = 0
    companies_updated = 0
    financials_inserted = 0

    with open(ZAIMU_CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        headers = next(reader)
        print(f"[+] Loaded CSV header row with {len(headers)} columns.")

        # Mapping column names to index for resilience
        col_indices = {name: idx for idx, name in enumerate(headers)}
        
        # Helper to get value by header name safely
        def get_val(row, col_name):
            idx = col_indices.get(col_name)
            return row[idx].strip() if idx is not None and idx < len(row) else ""

        print("[*] Processing CSV rows and calculating calendar years...")
        for row_idx, row in enumerate(reader, start=1):
            if len(row) < 30:
                continue

            corporate_number = get_val(row, "法人番号")
            
            # Check if this company exists in our database
            if corporate_number not in existing_companies:
                continue
                
            sequence_str = get_val(row, "回次")
            sequence_number = parse_int(sequence_str)
            if sequence_number is None:
                continue

            matched_count += 1

            # 1. Parse common metrics
            fiscal_year = get_val(row, "事業年度")
            capital_amount = parse_int(get_val(row, "資本金"))
            employee_count = parse_int(get_val(row, "従業員数"))

            # Consolidate revenue/sales based on industry priority:
            sales_amount = None
            revenue_sources = ["売上高", "営業収益", "営業収入", "営業総収入", "経常収益", "正味収入保険料"]
            for source in revenue_sources:
                val = parse_int(get_val(row, source))
                if val is not None:
                    sales_amount = val
                    break

            # 2. Parse special historical indicators for company_financials
            ordinary_income = parse_int(get_val(row, "経常利益又は経常損失（△）"))
            net_income = parse_int(get_val(row, "当期純利益又は当期純損失（△）"))
            net_assets = parse_int(get_val(row, "純資産額"))
            total_assets = parse_int(get_val(row, "総資産額"))

            # 3. Calculate exact start and end Western dates for this historical row
            fiscal_year_start, fiscal_year_end = parse_fiscal_period(fiscal_year, sequence_number)

            # 4. Prepare data for the financials history table (All periods)
            financials_batch.append((
                corporate_number, fiscal_year, sequence_number,
                fiscal_year_start, fiscal_year_end, sales_amount,
                ordinary_income, net_income, capital_amount,
                net_assets, total_assets, employee_count
            ))

            # 5. Prepare data for the master companies table (ONLY latest period: sequence_number == 0)
            if sequence_number == 0:
                companies_batch.append((
                    sales_amount, sales_amount,
                    capital_amount, capital_amount,
                    employee_count, employee_count,
                    corporate_number
                ))

            processed_count += 1

            # Perform batch updates/inserts
            if len(financials_batch) >= BATCH_SIZE:
                financials_inserted += execute_financials_insert(cursor, financials_batch)
                if companies_batch:
                    companies_updated += execute_companies_update(cursor, companies_batch)
                    companies_batch = []
                conn.commit()
                financials_batch = []
                print(f"    -> Row processed: {matched_count} | Hist inserted: {financials_inserted} | Master updated: {companies_updated}")

        # Insert/Update remaining records in batches
        if financials_batch:
            financials_inserted += execute_financials_insert(cursor, financials_batch)
        if companies_batch:
            companies_updated += execute_companies_update(cursor, companies_batch)
        conn.commit()
        
    print(f"\n[+] SUCCESS! Completed financial data enrichment.")
    print(f"    - Total matches processed: {matched_count}")
    print(f"    - Records loaded into historical trend table (company_financials): {financials_inserted}")
    print(f"    - Master companies updated with current figures: {companies_updated}")
    cursor.close()

def execute_companies_update(cursor, batch):
    """Execute SQL UPDATE query for a batch of master companies."""
    update_sql = """
        UPDATE companies
        SET sales_amount = CASE WHEN ? IS NOT NULL THEN ? ELSE sales_amount END,
            capital_amount = CASE WHEN ? IS NOT NULL THEN ? ELSE capital_amount END,
            employee_count = CASE WHEN ? IS NOT NULL THEN ? ELSE employee_count END,
            updated_at = CURRENT_TIMESTAMP
        WHERE corporate_number = ?;
    """
    try:
        cursor.executemany(update_sql, batch)
        return cursor.rowcount
    except Exception as e:
        print(f"[-] Master companies batch update failed: {e}")
        return 0

def execute_financials_insert(cursor, batch):
    """Execute SQL INSERT OR REPLACE for a batch of historical records."""
    insert_sql = """
        INSERT INTO company_financials (
            corporate_number, fiscal_year, sequence_number,
            fiscal_year_start, fiscal_year_end, sales_amount,
            ordinary_income, net_income, capital_amount,
            net_assets, total_assets, employee_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (corporate_number, sequence_number) DO UPDATE SET
            fiscal_year = EXCLUDED.fiscal_year,
            fiscal_year_start = EXCLUDED.fiscal_year_start,
            fiscal_year_end = EXCLUDED.fiscal_year_end,
            sales_amount = COALESCE(EXCLUDED.sales_amount, sales_amount),
            ordinary_income = COALESCE(EXCLUDED.ordinary_income, ordinary_income),
            net_income = COALESCE(EXCLUDED.net_income, net_income),
            capital_amount = COALESCE(EXCLUDED.capital_amount, capital_amount),
            net_assets = COALESCE(EXCLUDED.net_assets, net_assets),
            total_assets = COALESCE(EXCLUDED.total_assets, total_assets),
            employee_count = COALESCE(EXCLUDED.employee_count, employee_count);
    """
    try:
        cursor.executemany(insert_sql, batch)
        return cursor.rowcount
    except Exception as e:
        print(f"[-] Historical financials batch insert failed: {e}")
        return 0

def main():
    print("="*60)
    print("      KIGYOU-LIST: HISTORICAL FINANCIAL INGESTION (5-YEARS)")
    print("="*60)
    
    start_time = datetime.now()
    conn = get_db_connection()
    
    try:
        enrich_companies_financials(conn)
    finally:
        conn.close()
        print(f"[*] Connection closed.")
        print(f"[+] Ingestion completed in: {datetime.now() - start_time}")

if __name__ == "__main__":
    main()
