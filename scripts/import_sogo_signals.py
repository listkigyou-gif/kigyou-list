#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: sogo-data Bulk Signal & Financial Importer
========================================================
Imports all business signals and financial data from G-Biz bulk CSV/XML files
into the SQLite database.

Source files (importdata/gbiz-data/sogo-data/):
  - Hojokinjoho_UTF-8.csv   -> business_signals (signal_type='補助金')
  - Chotatsujoho_UTF-8.csv  -> business_signals (signal_type='調達')
  - TodokedeNinteijoho_UTF-8.csv -> business_signals (signal_type='届出・認定')
  - Hyoshojoho_UTF-8.csv    -> business_signals (signal_type='表彰')
  - Zaimujoho_UTF-8.csv     -> company_financials

Source files (importdata/gbiz-data/Kessanjoho_*/):
  - *.xml                   -> company_financials (from settlement XML files)

Console outputs are written in ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import sys
import re
import csv
import json
import time
import sqlite3
import xml.etree.ElementTree as ET
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = "kigyou-list.db"
SOGO_DIR = "importdata/gbiz-data/sogo-data"
KESSANJOHO_DIR = "importdata/gbiz-data/Kessanjoho_20260515"

# Target organization types (digits 6-7 of NTA corporate number)
TARGET_CORP_TYPES = {"01", "02", "05"}

# CSV file configs: filename -> (signal_type, col_mapping)
SIGNAL_CSV_CONFIGS = [
    {
        "file": "Hojokinjoho_UTF-8.csv",
        "signal_type": "補助金",
        # CSV cols: 法人番号[0], 商号[1], 登記住所[2], 証明日[3], 名称[4], 金額[5], 対象[6], 発行元[7], キー情報[8]
        "col_corp_num": 0,
        "col_date": 3,
        "col_title": 4,
        "col_amount": 5,
        "col_target": 6,
        "col_gov": 7,
        "col_key": 8,
        "extra_cols": {},
    },
    {
        "file": "Chotatsujoho_UTF-8.csv",
        "signal_type": "調達",
        # CSV cols: 法人番号[0], 商号[1], 登記住所[2], 受注日[3], 件名[4], 落札価格[5], 組織名[6], 備考[7], キー情報[8]
        "col_corp_num": 0,
        "col_date": 3,
        "col_title": 4,
        "col_amount": 5,
        "col_target": None,
        "col_gov": 6,
        "col_key": 8,
        "extra_cols": {"note": 7},
    },
    {
        "file": "TodokedeNinteijoho_UTF-8.csv",
        "signal_type": "届出・認定",
        # CSV cols: 法人番号[0], 商号[1], 登記住所[2], 証明日[3], 名称[4], 対象[5], 部門[6], 発行元[7], キー情報[8]
        "col_corp_num": 0,
        "col_date": 3,
        "col_title": 4,
        "col_amount": None,
        "col_target": 5,
        "col_gov": 7,
        "col_key": 8,
        "extra_cols": {"category": 6},
    },
    {
        "file": "Hyoshojoho_UTF-8.csv",
        "signal_type": "表彰",
        # CSV cols: 法人番号[0], 商号[1], 登記住所[2], 証明日[3], 名称[4], 対象[5], 部門[6], 発行元[7], 備考[8], キー情報[9]
        "col_corp_num": 0,
        "col_date": 3,
        "col_title": 4,
        "col_amount": None,
        "col_target": 5,
        "col_gov": 7,
        "col_key": 9,
        "extra_cols": {"category": 6, "note": 8},
    },
]


# =============================================================================
# HELPERS
# =============================================================================

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys = OFF;")
    return conn


def parse_int_safe(val):
    if not val:
        return None
    try:
        cleaned = re.sub(r"[^\d\-]", "", str(val).strip())
        return int(cleaned) if cleaned and cleaned != "-" else None
    except (ValueError, OverflowError):
        return None


def parse_date_safe(date_str):
    if not date_str:
        return None
    date_str = str(date_str).strip()
    m = re.match(r"^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})", date_str)
    if m:
        return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    return date_str[:10] if len(date_str) >= 10 else date_str


def is_target_corp(corp_num):
    if not corp_num or len(corp_num) != 13:
        return False
    return corp_num[5:7] in TARGET_CORP_TYPES


# =============================================================================
# IMPORT SIGNAL CSVs
# =============================================================================

def import_signal_csv(conn, config):
    filepath = os.path.join(SOGO_DIR, config["file"])
    if not os.path.exists(filepath):
        print(f"[~] File not found: {filepath}")
        return 0

    signal_type = config["signal_type"]
    print(f"[*] Importing {signal_type} signals from {config['file']}...")

    insert_sql = """
        INSERT OR IGNORE INTO business_signals (
            corporate_number, signal_type, signal_title, signal_date,
            amount, government_departments, source_key, source_url, details
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
    """

    cursor = conn.cursor()
    batch = []
    imported = 0
    skipped = 0
    t0 = time.time()

    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader)  # Skip header

        for row in reader:
            if len(row) < 9:
                continue

            corp_num = row[config["col_corp_num"]].strip()
            if not is_target_corp(corp_num):
                skipped += 1
                continue

            title = row[config["col_title"]].strip() if config["col_title"] is not None else signal_type
            if not title:
                title = signal_type

            signal_date = parse_date_safe(row[config["col_date"]]) if config["col_date"] is not None else None
            amount = parse_int_safe(row[config["col_amount"]]) if config["col_amount"] is not None and config["col_amount"] < len(row) else None
            gov = row[config["col_gov"]].strip() if config["col_gov"] is not None and config["col_gov"] < len(row) else None
            source_key = row[config["col_key"]].strip() if config["col_key"] is not None and config["col_key"] < len(row) else None

            # Build details dict from extra fields
            details = {}
            if config["col_target"] is not None and config["col_target"] < len(row):
                details["target"] = row[config["col_target"]].strip() or None
            for key, col_idx in config.get("extra_cols", {}).items():
                if col_idx < len(row):
                    details[key] = row[col_idx].strip() or None

            details_json = json.dumps(details, ensure_ascii=False) if any(v for v in details.values()) else None

            batch.append((
                corp_num, signal_type, title, signal_date,
                amount, gov, source_key, details_json
            ))
            imported += 1

            if len(batch) >= 5000:
                cursor.executemany(insert_sql, batch)
                conn.commit()
                batch = []
                print(f"  -> Committed {imported} {signal_type} records ({skipped} skipped)...")

    if batch:
        cursor.executemany(insert_sql, batch)
        conn.commit()

    duration = time.time() - t0
    print(f"[+] {signal_type}: {imported} imported, {skipped} skipped in {duration:.1f}s")
    return imported


# =============================================================================
# IMPORT ZAIMUJOHO (FINANCIAL CSV)
# =============================================================================

def import_zaimujoho(conn):
    """
    Import Zaimujoho_UTF-8.csv into company_financials.
    CSV cols:
      [0]  法人番号
      [1]  商号または名称
      [2]  登記住所
      [3]  会計基準
      [4]  事業年度 (fiscal_year string)
      [5]  回次 (sequence_number: 0=current, 1=last year...)
      [6]  売上高             -> sales_amount
      [8]  営業収益           -> (fallback sales)
      [10] 営業収入           -> (fallback sales)
      [12] 営業総収入         -> (fallback sales)
      [14] 経常収益           -> (fallback)
      [18] 経常利益/損失      -> ordinary_income
      [20] 当期純利益/損失    -> net_income
      [22] 資本金             -> capital_amount
      [24] 純資産額           -> net_assets
      [26] 総資産額           -> total_assets
      [28] 従業員数           -> employee_count
    """
    filepath = os.path.join(SOGO_DIR, "Zaimujoho_UTF-8.csv")
    if not os.path.exists(filepath):
        print(f"[~] File not found: {filepath}")
        return 0

    print(f"[*] Importing financial data from Zaimujoho_UTF-8.csv...")

    insert_sql = """
        INSERT INTO company_financials (
            corporate_number, fiscal_year, sequence_number,
            fiscal_year_start, fiscal_year_end,
            sales_amount, ordinary_income, net_income,
            capital_amount, net_assets, total_assets, employee_count
        ) VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (corporate_number, sequence_number) DO UPDATE
        SET fiscal_year     = EXCLUDED.fiscal_year,
            sales_amount    = COALESCE(EXCLUDED.sales_amount, sales_amount),
            ordinary_income = COALESCE(EXCLUDED.ordinary_income, ordinary_income),
            net_income      = COALESCE(EXCLUDED.net_income, net_income),
            capital_amount  = COALESCE(EXCLUDED.capital_amount, capital_amount),
            net_assets      = COALESCE(EXCLUDED.net_assets, net_assets),
            total_assets    = COALESCE(EXCLUDED.total_assets, total_assets),
            employee_count  = COALESCE(EXCLUDED.employee_count, employee_count);
    """

    cursor = conn.cursor()
    batch = []
    imported = 0
    skipped = 0
    t0 = time.time()

    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader)  # Skip header

        for row in reader:
            if len(row) < 30:
                continue

            corp_num = row[0].strip()
            if not is_target_corp(corp_num):
                skipped += 1
                continue

            fiscal_year = row[4].strip()
            try:
                seq_num = int(row[5].strip())
            except (ValueError, IndexError):
                seq_num = 0

            # Revenue: prefer 売上高, fallback to 営業収益 -> 営業収入 -> 営業総収入
            sales_amount = (
                parse_int_safe(row[6]) or
                parse_int_safe(row[8]) or
                parse_int_safe(row[10]) or
                parse_int_safe(row[12])
            )
            ordinary_income = parse_int_safe(row[18])
            net_income = parse_int_safe(row[20])
            capital_amount = parse_int_safe(row[22])
            net_assets = parse_int_safe(row[24])
            total_assets = parse_int_safe(row[26])
            employee_count = parse_int_safe(row[28])

            # Skip entirely empty rows
            if all(v is None for v in [sales_amount, ordinary_income, net_income, net_assets, total_assets]):
                continue

            batch.append((
                corp_num, fiscal_year, seq_num,
                sales_amount, ordinary_income, net_income,
                capital_amount, net_assets, total_assets, employee_count
            ))
            imported += 1

            if len(batch) >= 5000:
                cursor.executemany(insert_sql, batch)
                conn.commit()
                batch = []
                print(f"  -> Committed {imported} financial records ({skipped} skipped)...")

    if batch:
        cursor.executemany(insert_sql, batch)
        conn.commit()

    duration = time.time() - t0
    print(f"[+] Zaimu (financials): {imported} imported, {skipped} skipped in {duration:.1f}s")
    return imported


# =============================================================================
# IMPORT KESSANJOHO XMLs (Balance Sheet)
# =============================================================================

def import_kessanjoho_xml(conn, limit=None):
    """
    Import financial data from Kessanjoho XML files.
    Filename format: {corp_num}_Kessanjoho_{fiscal_year}_{date}_{balance_date}.xml
    """
    if not os.path.exists(KESSANJOHO_DIR):
        print(f"[~] Kessanjoho directory not found: {KESSANJOHO_DIR}")
        return 0

    print(f"[*] Importing settlement data from XML files in {KESSANJOHO_DIR}...")

    insert_sql = """
        INSERT INTO company_financials (
            corporate_number, fiscal_year, sequence_number,
            fiscal_year_start, fiscal_year_end,
            sales_amount, ordinary_income, net_income,
            capital_amount, net_assets, total_assets, employee_count
        ) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, ?, ?, ?, ?, NULL)
        ON CONFLICT (corporate_number, sequence_number) DO UPDATE
        SET fiscal_year    = EXCLUDED.fiscal_year,
            capital_amount = COALESCE(EXCLUDED.capital_amount, capital_amount),
            net_assets     = COALESCE(EXCLUDED.net_assets, net_assets),
            total_assets   = COALESCE(EXCLUDED.total_assets, total_assets);
    """

    cursor = conn.cursor()
    batch = []
    imported = 0
    skipped = 0
    errors = 0
    t0 = time.time()

    xml_files = [f for f in os.listdir(KESSANJOHO_DIR) if f.endswith(".xml")]
    print(f"  Found {len(xml_files)} XML files")

    for i, fname in enumerate(xml_files):
        if limit and imported >= limit:
            break

        # Extract corporate number from filename
        parts = fname.split("_")
        corp_num = parts[0] if parts else ""
        if not is_target_corp(corp_num):
            skipped += 1
            continue

        # Extract fiscal year label from filename (e.g. 第75期決算公告)
        fiscal_year = parts[2] if len(parts) > 2 else fname

        filepath = os.path.join(KESSANJOHO_DIR, fname)
        try:
            tree = ET.parse(filepath)
            root = tree.getroot()

            # Remove namespaces for easier parsing
            ns = re.match(r'\{.*\}', root.tag)
            ns_prefix = ns.group(0) if ns else ""

            def find_text(tag):
                el = root.find(f".//{ns_prefix}{tag}")
                if el is not None and el.text:
                    return el.text.strip()
                return None

            capital_amount = parse_int_safe(find_text("CapitalStock") or find_text("CapitalAndReserves"))
            net_assets = parse_int_safe(find_text("NetAssets") or find_text("TotalNetAssets") or find_text("ShareholdersEquity"))
            total_assets = parse_int_safe(find_text("TotalAssets"))

            if all(v is None for v in [capital_amount, net_assets, total_assets]):
                continue

            # sequence_number: use file index within same corp_num
            seq_num = i  # Use global file index as fallback unique key per corp

            batch.append((
                corp_num, fiscal_year, seq_num,
                capital_amount, net_assets, total_assets
            ))
            imported += 1

            if len(batch) >= 1000:
                cursor.executemany(insert_sql, batch)
                conn.commit()
                batch = []
                print(f"  -> Committed {imported} XML records ({skipped} skipped, {errors} errors)...")

        except Exception as e:
            errors += 1

    if batch:
        cursor.executemany(insert_sql, batch)
        conn.commit()

    duration = time.time() - t0
    print(f"[+] Kessanjoho XML: {imported} imported, {skipped} skipped, {errors} errors in {duration:.1f}s")
    return imported


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 65)
    print("   SOGO-DATA BULK SIGNAL & FINANCIAL IMPORTER")
    print("=" * 65)

    limit = None
    skip_xml = False
    skip_financials = False
    skip_signals = False

    for arg in sys.argv[1:]:
        if arg.startswith("--limit="):
            try:
                limit = int(arg.split("=", 1)[1])
            except ValueError:
                pass
        elif arg == "--skip-xml":
            skip_xml = True
        elif arg == "--skip-financials":
            skip_financials = True
        elif arg == "--skip-signals":
            skip_signals = True

    if limit:
        print(f"[*] Limit mode: max {limit} records per source")

    conn = get_db_connection()
    total_signals = 0
    total_financials = 0

    t_start = time.time()

    # 1. Import signal CSVs
    if not skip_signals:
        print("\n--- PHASE 1: Signal CSV Import ---")
        for config in SIGNAL_CSV_CONFIGS:
            total_signals += import_signal_csv(conn, config)

    # 2. Import Zaimujoho (financial CSV)
    if not skip_financials:
        print("\n--- PHASE 2: Financial CSV Import (Zaimujoho) ---")
        total_financials += import_zaimujoho(conn)

    # 3. Import Kessanjoho XMLs
    if not skip_financials and not skip_xml:
        print("\n--- PHASE 3: Settlement XML Import (Kessanjoho) ---")
        total_financials += import_kessanjoho_xml(conn, limit)

    conn.close()

    duration = time.time() - t_start
    print(f"\n{'='*65}")
    print(f"[+] DONE in {duration:.1f}s | {total_signals} signals | {total_financials} financials")
    print(f"{'='*65}")


if __name__ == "__main__":
    main()
