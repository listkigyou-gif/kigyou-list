#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Zaimu CSV Unified Ingestion Script (SQLite)
======================================================
Imports 5-year historical financial records from Zaimujoho_UTF-8.csv into the
new unified 'financial_records' table. Also enriches the 'companies' master table.
Console outputs are written in ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import csv
import re
import sys
import json
import sqlite3
from datetime import datetime

DB_PATH = "kigyou-list.db"
ZAIMU_CSV_PATH = "importdata/gbiz-data/sogo-data/Zaimujoho_UTF-8.csv"
BATCH_SIZE = 1000

def get_db_connection():
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA cache_size=-64000;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn
    except Exception as e:
        print(f"[-] Could not connect to SQLite database: {e}")
        sys.exit(1)

def parse_int(val_str):
    if not val_str:
        return None
    val_str = val_str.strip()
    try:
        cleaned = val_str.replace("△", "-")
        cleaned = re.sub(r"[^\d-]", "", cleaned)
        return int(cleaned) if cleaned else None
    except ValueError:
        return None

def parse_float(val_str):
    if not val_str:
        return None
    val_str = val_str.strip()
    try:
        # Strip percentage signs and spaces
        cleaned = val_str.replace("%", "").replace("％", "").strip()
        return float(cleaned) if cleaned else None
    except ValueError:
        return None

def parse_japanese_date(date_str):
    if not date_str:
        return None
    date_str = date_str.translate(str.maketrans("０１２３４５６７８９　", "0123456789 "))
    date_str = date_str.strip()
    
    pattern = r"(?:(令和|平成|昭和)(\d+|元)|(\d{4}))年\s*(\d{1,2})月\s*(\d{1,2})日"
    match = re.search(pattern, date_str)
    if not match:
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
    if not date_str or years_to_subtract == 0:
        return date_str
    
    try:
        parts = date_str.split("-")
        year = int(parts[0]) - years_to_subtract
        month = int(parts[1])
        day = int(parts[2])
        
        if month == 2 and day == 29:
            is_leap = (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0))
            if not is_leap:
                day = 28
                
        return f"{year:04d}-{month:02d}-{day:02d}"
    except Exception:
        return None

def parse_fiscal_period(period_str, sequence_num):
    if not period_str:
        return None, None
        
    start_date = None
    end_date = None
    
    if "自" in period_str and "至" in period_str:
        try:
            parts_自 = period_str.split("自")
            parts_至 = parts_自[1].split("至")
            start_raw = parts_至[0]
            end_raw = parts_至[1].split(")")[0].split("）")[0]
            start_date = parse_japanese_date(start_raw)
            end_date = parse_japanese_date(end_raw)
        except Exception:
            pass
            
    if not start_date or not end_date:
        normalized_str = period_str.translate(str.maketrans("０１２３４5６７８９　", "0123456789 "))
        pattern = r"(?:(?:令和|平成|昭和)(?:\d+|元)|(?:\d{4}))年\s*\d{1,2}月\s*\d{1,2}日"
        matches = re.findall(pattern, normalized_str)
        if len(matches) >= 2:
            start_date = parse_japanese_date(matches[0])
            end_date = parse_japanese_date(matches[1])
            
    adjusted_start = subtract_years(start_date, sequence_num)
    adjusted_end = subtract_years(end_date, sequence_num)
    
    return adjusted_start, adjusted_end

def enrich_financial_records(conn):
    print(f"[*] Opening Financial CSV from: {ZAIMU_CSV_PATH}")
    if not os.path.exists(ZAIMU_CSV_PATH):
        print(f"[-] CSV file not found at: {ZAIMU_CSV_PATH}")
        return

    cursor = conn.cursor()

    # Get set of valid corporate numbers in 'companies'
    cursor.execute("SELECT corporate_number FROM companies;")
    existing_companies = {row[0] for row in cursor.fetchall()}
    print(f"[+] Loaded {len(existing_companies)} companies from companies table.")

    if not existing_companies:
        print("[-] No companies found in the database. Please import base companies first.")
        return

    inserted_count = 0
    updated_count = 0
    companies_updated = 0
    
    with open(ZAIMU_CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        headers = next(reader)
        col_indices = {name: idx for idx, name in enumerate(headers)}
        
        def get_val(row, col_name):
            idx = col_indices.get(col_name)
            return row[idx].strip() if idx is not None and idx < len(row) else ""

        print("[*] Processing CSV lines and inserting into 'financial_records'...")
        for row_idx, row in enumerate(reader, start=1):
            if len(row) < 30:
                continue

            corporate_number = get_val(row, "法人番号")
            if corporate_number not in existing_companies:
                continue
                
            sequence_str = get_val(row, "回次")
            sequence_number = parse_int(sequence_str)
            if sequence_number is None:
                continue

            # Parse fiscal period info
            fiscal_year_raw = get_val(row, "事業年度")
            
            # Extract actual period number if present (e.g. 第75期 -> 75)
            period_number = None
            m_period = re.search(r"第\s*(\d+)\s*期", fiscal_year_raw)
            if m_period:
                period_number = int(m_period.group(1))

            # Derive calendar fiscal year
            start_date, end_date = parse_fiscal_period(fiscal_year_raw, sequence_number)
            if not end_date:
                # Fallback to current year minus sequence number
                fiscal_year = str(datetime.now().year - sequence_number)
            else:
                fiscal_year = end_date.split("-")[0] # e.g. 2025

            # Revenue/Sales Amount based on priority
            revenue = None
            revenue_sources = ["売上高", "営業収益", "営業収入", "営業総収入", "経常収益", "正味収入保険料"]
            for source in revenue_sources:
                val = parse_int(get_val(row, source))
                if val is not None:
                    revenue = val
                    break

            ordinary_income = parse_int(get_val(row, "経常利益又は経常損失（△）"))
            net_income = parse_int(get_val(row, "当期純利益又は当期純損失（△）"))
            capital = parse_int(get_val(row, "資本金"))
            net_assets = parse_int(get_val(row, "純資産額"))
            total_assets = parse_int(get_val(row, "総資産額"))
            employee_count = parse_int(get_val(row, "従業員数"))

            # Shareholders Parsing
            shareholders = []
            for i in range(1, 6):
                sh_name = get_val(row, f"大株主{i}")
                sh_ratio = parse_float(get_val(row, f"発行済株式総数に対する所有株式数の割合{i}"))
                if sh_name:
                    shareholders.append({"name": sh_name, "ratio": sh_ratio})
            
            shareholders_json = json.dumps(shareholders, ensure_ascii=False) if shareholders else None

            # Upsert into financial_records
            # Check if this company & fiscal_year already has a record
            cursor.execute("""
                SELECT source_type FROM financial_records 
                WHERE corporate_number = ? AND fiscal_year = ?;
            """, (corporate_number, fiscal_year))
            existing = cursor.fetchone()

            if existing:
                # If there's an existing record, perform merge updates
                # XML does not have shareholders or revenue, so CSV takes priority for income statements
                existing_source = existing[0]
                new_source = 'BOTH' if existing_source == 'XML' else 'CSV'
                
                cursor.execute("""
                    UPDATE financial_records
                    SET period_number = COALESCE(?, period_number),
                        revenue = COALESCE(?, revenue),
                        ordinary_income = COALESCE(?, ordinary_income),
                        net_income = COALESCE(?, net_income),
                        capital = COALESCE(?, capital),
                        total_assets = COALESCE(?, total_assets),
                        net_assets = COALESCE(?, net_assets),
                        shareholders_json = COALESCE(?, shareholders_json),
                        source_type = ?
                    WHERE corporate_number = ? AND fiscal_year = ?;
                """, (period_number, revenue, ordinary_income, net_income, capital, total_assets, net_assets, shareholders_json, new_source, corporate_number, fiscal_year))
                updated_count += cursor.rowcount
            else:
                cursor.execute("""
                    INSERT INTO financial_records (
                        corporate_number, fiscal_year, period_number, revenue,
                        ordinary_income, net_income, capital, total_assets,
                        net_assets, shareholders_json, source_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CSV');
                """, (corporate_number, fiscal_year, period_number, revenue, ordinary_income, net_income, capital, total_assets, net_assets, shareholders_json))
                inserted_count += cursor.rowcount

            # If sequence_number == 0 (latest period), update companies table
            if sequence_number == 0:
                cursor.execute("""
                    UPDATE companies
                    SET sales_amount = COALESCE(?, sales_amount),
                        capital_amount = COALESCE(?, capital_amount),
                        employee_count = COALESCE(?, employee_count),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE corporate_number = ?;
                """, (revenue, capital, employee_count, corporate_number))
                companies_updated += cursor.rowcount

            if row_idx % BATCH_SIZE == 0:
                conn.commit()

        conn.commit()
        
    print("\n" + "="*50)
    print("      SUMMARY OF ZAIMU CSV IMPORT")
    print("="*50)
    print(f"  - New financial records inserted  : {inserted_count}")
    print(f"  - Existing records merged/updated : {updated_count}")
    print(f"  - Master companies enriched       : {companies_updated}")
    print("="*50)

def main():
    start_time = datetime.now()
    conn = get_db_connection()
    try:
        enrich_financial_records(conn)
    finally:
        conn.close()
        print(f"[*] Ingestion completed in: {datetime.now() - start_time}")

if __name__ == "__main__":
    main()
