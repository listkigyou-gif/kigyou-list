#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Kessan XML Unified Ingestion Script (SQLite)
======================================================
Ingests 26k+ official gazette kessan XML files into 'financial_records' table
using optimized XML parsing and a smart consolidation strategy.
Console outputs are written in ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import glob
import re
import sys
import sqlite3
import xml.etree.ElementTree as ET
from datetime import datetime

DB_PATH = "kigyou-list.db"
XML_DIR = "importdata/gbiz-data/Kessanjoho_20260515"
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

def to_half_width(text):
    if not text:
        return ""
    text = str(text)
    zenkaku = "０１２３４５６７８９－ー（）＠．，"
    hankaku = "0123456789--()@.,"
    trans_table = str.maketrans(zenkaku, hankaku)
    text = text.translate(trans_table)
    return text.strip()

def parse_int(val_str):
    if not val_str:
        return None
    val_str = to_half_width(val_str).replace(",", "").replace(" ", "")
    try:
        cleaned = val_str.replace("△", "-")
        cleaned = re.sub(r"[^\d-]", "", cleaned)
        return int(cleaned) if cleaned else None
    except ValueError:
        return None

def extract_year(date_str):
    """Extract calendar year from date string (supports Western and Japanese Wareki)."""
    if not date_str:
        return None
    
    date_str = to_half_width(date_str).strip()
    
    # 1. Look for Western year (4 digits)
    m_west = re.search(r"(\d{4})\s*(年|[-/.]|$)", date_str)
    if m_west:
        return m_west.group(1)
        
    # 2. Look for Japanese Era
    era_offsets = {
        "令和": 2018,
        "平成": 1988,
        "昭和": 1925
    }
    for era, offset in era_offsets.items():
        if era in date_str:
            year_part = date_str.split(era)[1]
            m_year = re.search(r"(\d+|元)", year_part)
            if m_year:
                y_val = m_year.group(1)
                y_num = 1 if y_val == "元" else int(y_val)
                return str(offset + y_num)
                
    return None

def get_xml_multiplier(unit_text):
    """Determine amount multiplier based on Unit tag."""
    if not unit_text:
        return 1
    unit_text = to_half_width(unit_text)
    if "千円" in unit_text or "千" in unit_text:
        return 1000
    if "百万円" in unit_text or "百万" in unit_text:
        return 1000000
    return 1

def parse_xml_file(filepath):
    """Parse a single XML file and return a dictionary of financial metrics."""
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
    except Exception:
        return None

    # Get Corporate Number
    corp_num_elem = root.find(".//CorporateNumber")
    if corp_num_elem is None or not corp_num_elem.text:
        return None
    corporate_number = corp_num_elem.text.strip()

    # Get Period Number
    period_number = None
    period_elem = root.find(".//Period")
    if period_elem is not None and period_elem.text:
        m_period = re.search(r"第\s*(\d+)\s*期", period_elem.text)
        if m_period:
            period_number = int(m_period.group(1))

    # Determine fiscal year (prioritize BsPlDate, fallback to Release)
    date_str = None
    bs_date_elem = root.find(".//BsPlDate")
    if bs_date_elem is not None and bs_date_elem.attrib.get("日付"):
        date_str = bs_date_elem.attrib.get("日付")
    else:
        release_elem = root.find(".//Release")
        if release_elem is not None and release_elem.text:
            date_str = release_elem.text

    fiscal_year = extract_year(date_str)
    if not fiscal_year:
        return None

    # Get Unit Multiplier
    unit_elem = root.find(".//Unit")
    unit_text = unit_elem.text if unit_elem is not None else ""
    multiplier = get_xml_multiplier(unit_text)

    # Initialize record structure
    data = {
        "corporate_number": corporate_number,
        "fiscal_year": fiscal_year,
        "period_number": period_number,
        "revenue": None,
        "operating_income": None,
        "ordinary_income": None,
        "net_income": None,
        "capital": None,
        "total_assets": None,
        "net_assets": None,
        "liquid_assets": None,
        "fixed_assets": None,
        "liquid_liabilities": None,
        "fixed_liabilities": None,
        "retained_earnings": None,
    }

    # Subject mappings
    subject_mapping = {
        "流動資産": "liquid_assets",
        "固定資産": "fixed_assets",
        "資産合計": "total_assets",
        "合計": "total_assets",
        "資産の部合計": "total_assets",
        "流動負債": "liquid_liabilities",
        "固定負債": "fixed_liabilities",
        "利益剰余金": "retained_earnings",
        "その他利益剰余金": "retained_earnings", # fallback if main is not found
        "資本金": "capital",
        "純資産合計": "net_assets",
        "株主資本": "net_assets",
    }

    income_mapping = {
        "営業利益": ("operating_income", 1),
        "営業損失": ("operating_income", -1),
        "経常利益": ("ordinary_income", 1),
        "経常損失": ("ordinary_income", -1),
        "当期純利益": ("net_income", 1),
        "当期純損失": ("net_income", -1),
        "（うち当期純利益）": ("net_income", 1),
        "（うち当期純損失）": ("net_income", -1),
        "当期純利益又は当期純損失（△）": ("net_income", 1), # just in case
    }

    # Parse all Meisai nodes
    for meisai in root.findall(".//Meisai"):
        sub_elem = meisai.find("Subject")
        amt_elem = meisai.find("Amount")
        if sub_elem is None or amt_elem is None or not sub_elem.text or not amt_elem.text:
            continue

        raw_subject = sub_elem.text.strip()
        # Clean leading Japanese full/half-width spaces
        subject = re.sub(r"^[　\s]+", "", raw_subject)
        
        amount_val = parse_int(amt_elem.text)
        if amount_val is None:
            continue

        # Scale by multiplier
        amount_val = amount_val * multiplier

        # 1. Map balance-sheet fields
        if subject in subject_mapping:
            col = subject_mapping[subject]
            # Don't overwrite if already set (except if we want to prioritize more specific subjects)
            if data[col] is None or subject in ("資産合計", "純資産合計", "利益剰余金"):
                data[col] = amount_val

        # 2. Map income statement fields
        elif subject in income_mapping:
            col, sign = income_mapping[subject]
            if data[col] is None or "（" not in subject: # prioritize main fields over parenthetical sub-fields
                data[col] = amount_val * sign

    return data

def import_kessan_xmls(conn):
    print(f"[*] Scanning Kessan XML files in: {XML_DIR}")
    xml_files = glob.glob(os.path.join(XML_DIR, "*.xml"))
    print(f"[+] Found {len(xml_files)} total XML files.")

    cursor = conn.cursor()

    # Load existing companies
    cursor.execute("SELECT corporate_number FROM companies;")
    existing_companies = {row[0] for row in cursor.fetchall()}
    print(f"[+] Loaded {len(existing_companies)} companies from companies table.")

    if not existing_companies:
        print("[-] No companies found in the database. Please run base imports first.")
        return

    # Filter XML files based on corporate number in filename to be highly efficient
    matching_xml_files = []
    for fpath in xml_files:
        filename = os.path.basename(fpath)
        corp_num = filename.split("_")[0]
        if corp_num in existing_companies:
            matching_xml_files.append((fpath, corp_num))

    print(f"[+] Filtered down to {len(matching_xml_files)} matching XML files.")

    inserted_count = 0
    updated_count = 0
    skipped_count = 0

    print("[*] Processing matching XML files...")
    for idx, (fpath, corp_num) in enumerate(matching_xml_files, start=1):
        parsed = parse_xml_file(fpath)
        if not parsed:
            skipped_count += 1
            continue

        fiscal_year = parsed["fiscal_year"]
        
        # Check if record already exists
        cursor.execute("""
            SELECT source_type, revenue, ordinary_income, net_income, capital, total_assets, net_assets, shareholders_json 
            FROM financial_records 
            WHERE corporate_number = ? AND fiscal_year = ?;
        """, (corp_num, fiscal_year))
        existing = cursor.fetchone()

        if existing:
            # Smart Consolidation: merge XML into existing record
            existing_source = existing[0]
            new_source = 'BOTH' if existing_source == 'CSV' else 'XML'
            
            # Combine values: prioritize XML for BS details, COALESCE for others
            cursor.execute("""
                UPDATE financial_records
                SET period_number = COALESCE(?, period_number),
                    operating_income = COALESCE(?, operating_income),
                    ordinary_income = COALESCE(ordinary_income, ?),
                    net_income = COALESCE(net_income, ?),
                    capital = COALESCE(capital, ?),
                    total_assets = COALESCE(total_assets, ?),
                    net_assets = COALESCE(net_assets, ?),
                    liquid_assets = COALESCE(?, liquid_assets),
                    fixed_assets = COALESCE(?, fixed_assets),
                    liquid_liabilities = COALESCE(?, liquid_liabilities),
                    fixed_liabilities = COALESCE(?, fixed_liabilities),
                    retained_earnings = COALESCE(?, retained_earnings),
                    source_type = ?
                WHERE corporate_number = ? AND fiscal_year = ?;
            """, (
                parsed["period_number"],
                parsed["operating_income"],
                parsed["ordinary_income"],
                parsed["net_income"],
                parsed["capital"],
                parsed["total_assets"],
                parsed["net_assets"],
                parsed["liquid_assets"],
                parsed["fixed_assets"],
                parsed["liquid_liabilities"],
                parsed["fixed_liabilities"],
                parsed["retained_earnings"],
                new_source,
                corp_num,
                fiscal_year
            ))
            updated_count += cursor.rowcount
        else:
            # Insert new XML record
            cursor.execute("""
                INSERT INTO financial_records (
                    corporate_number, fiscal_year, period_number, revenue,
                    operating_income, ordinary_income, net_income, capital,
                    total_assets, net_assets, liquid_assets, fixed_assets,
                    liquid_liabilities, fixed_liabilities, retained_earnings,
                    source_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'XML');
            """, (
                corp_num, fiscal_year, parsed["period_number"], parsed["revenue"],
                parsed["operating_income"], parsed["ordinary_income"], parsed["net_income"], parsed["capital"],
                parsed["total_assets"], parsed["net_assets"], parsed["liquid_assets"], parsed["fixed_assets"],
                parsed["liquid_liabilities"], parsed["fixed_liabilities"], parsed["retained_earnings"]
            ))
            inserted_count += cursor.rowcount

        if idx % BATCH_SIZE == 0:
            conn.commit()
            print(f"  -> Processed {idx}/{len(matching_xml_files)} files...")

    conn.commit()

    print("\n" + "="*50)
    print("      SUMMARY OF KESSAN XML IMPORT")
    print("="*50)
    print(f"  - New financial records inserted  : {inserted_count}")
    print(f"  - Existing records merged/updated : {updated_count}")
    print(f"  - Files skipped (parsing/error)   : {skipped_count}")
    print("="*50)

def main():
    start_time = datetime.now()
    conn = get_db_connection()
    try:
        import_kessan_xmls(conn)
    finally:
        conn.close()
        print(f"[*] Ingestion completed in: {datetime.now() - start_time}")

if __name__ == "__main__":
    main()
