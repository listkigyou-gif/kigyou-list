#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: G-Biz Business Signals Ingestion Script (SQLite Version - ASCII Safe Logs)
===================================================================================
Imports Awards, Certifications, Subsidies, and Procurements
matching the existing 5,000 companies in the local SQLite database.
All console logs are written in ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import csv
import re
import sys
import sqlite3
import json
from datetime import datetime

DB_PATH = "kigyou-list.db"
SOGO_DIR = "importdata/gbiz-data/sogo-data"

# File configurations with safe ASCII labels for logging
SIGNAL_CONFIGS = [
    {
        "file_name": "Hyoshojoho_UTF-8.csv",
        "label": "Awards (Hyoshojoho)",
        "signal_type": "表彰",
        "mapping": {
            "corp_idx": 0,
            "date_idx": 3,
            "title_idx": 4,
            "details_keys": {
                "対象": 5,
                "部門": 6,
                "発行元": 7,
                "備考": 8
            }
        }
    },
    {
        "file_name": "TodokedeNinteijoho_UTF-8.csv",
        "label": "Certifications (TodokedeNintei)",
        "signal_type": "届出認定",
        "mapping": {
            "corp_idx": 0,
            "date_idx": 3,
            "title_idx": 4,
            "details_keys": {
                "対象": 5,
                "部門": 6,
                "発行元": 7
            }
        }
    },
    {
        "file_name": "Hojokinjoho_UTF-8.csv",
        "label": "Subsidies (Hojokinjoho)",
        "signal_type": "補助金受給",
        "mapping": {
            "corp_idx": 0,
            "date_idx": 3,
            "title_idx": 4,
            "details_keys": {
                "金額": 5,
                "対象": 6,
                "発行元": 7
            }
        }
    },
    {
        "file_name": "Chotatsujoho_UTF-8.csv",
        "label": "Procurements (Chotatsujoho)",
        "signal_type": "調達案件",
        "mapping": {
            "corp_idx": 0,
            "date_idx": 3,
            "title_idx": 4,
            "details_keys": {
                "落札価格": 5,
                "組織名": 6,
                "備考": 7
            }
        }
    }
]

def get_db_connection():
    """Establish SQLite database connection with WAL mode and timeout."""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA cache_size=-64000;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn
    except Exception as e:
        print(f"[-] Could not connect to SQLite database: {e}")
        sys.exit(1)

def parse_japanese_date(date_str):
    """Parse dates safely (handles YYYY-MM-DD, YYYY/MM/DD and Japanese Wareki)."""
    if not date_str:
        return None
    date_str = date_str.strip()
    
    # Check for YYYY-MM-DD or YYYY/MM/DD
    m = re.match(r"^(\d{4})[-\/\.年](\d{1,2})[-\/\.月](\d{1,2})日?$", date_str)
    if m:
        return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
        
    # Wareki translations
    wareki_rules = [
        ("令和", 2018),
        ("平成", 1988),
        ("昭和", 1925),
        ("大正", 1911)
    ]
    for era_name, base_year in wareki_rules:
        if era_name in date_str:
            m = re.search(era_name + r"\s*(\d+|元)\s*年\s*(\d+)\s*月\s*(\d+)\s*日", date_str)
            if m:
                year_part = m.group(1)
                year = base_year + 1 if year_part == "元" else base_year + int(year_part)
                month = int(m.group(2))
                day = int(m.group(3))
                return f"{year:04d}-{month:02d}-{day:02d}"
                
            m = re.search(era_name + r"\s*(\d+|元)\s*[-\/\.]\s*(\d+)\s*[-\/\.]\s*(\d+)", date_str)
            if m:
                year_part = m.group(1)
                year = base_year + 1 if year_part == "元" else base_year + int(year_part)
                month = int(m.group(2))
                day = int(m.group(3))
                return f"{year:04d}-{month:02d}-{day:02d}"
                
    return None

def import_signals(conn):
    """Import signals from configured available CSV files matching corporate numbers."""
    cursor = conn.cursor()
    
    # Clear existing signals of target types to support clean reruns
    print("[*] Clearing existing signals from database to prevent duplicates...")
    cursor.execute("DELETE FROM business_signals WHERE signal_type IN ('表彰', '届出認定', '補助金受給', '調達案件');")
    conn.commit()
    
    # Get valid corporate numbers in our database
    cursor.execute("SELECT corporate_number FROM companies;")
    valid_corp_numbers = {row[0] for row in cursor.fetchall()}
    print(f"[+] Loaded {len(valid_corp_numbers)} corporate numbers from database.")
    
    total_signals_imported = 0
    stats = {}
    
    for config in SIGNAL_CONFIGS:
        file_path = os.path.join(SOGO_DIR, config["file_name"])
        sig_type = config["signal_type"]
        label = config["label"]
        
        if not os.path.exists(file_path):
            print(f"[*] File not found: {config['file_name']}. Skipping.")
            continue
            
        print(f"\n[*] Processing: {label}...")
        
        mapping = config["mapping"]
        corp_idx = mapping["corp_idx"]
        date_idx = mapping["date_idx"]
        title_idx = mapping["title_idx"]
        details_keys = mapping["details_keys"]
        
        batch = []
        batch_size = 5000
        file_matches = 0
        
        with open(file_path, "r", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            # Skip header
            try:
                headers = next(reader)
            except StopIteration:
                continue
                
            for row_idx, row in enumerate(reader, start=2):
                if not row or len(row) <= max(corp_idx, date_idx, title_idx):
                    continue
                    
                corp_num = row[corp_idx].strip()
                
                # Check if it matches existing companies in DB
                if corp_num in valid_corp_numbers:
                    date_str = row[date_idx].strip()
                    parsed_date = parse_japanese_date(date_str)
                    
                    title = row[title_idx].strip()
                    
                    # Gather details
                    details = {}
                    for key, idx in details_keys.items():
                        if idx < len(row):
                            val = row[idx].strip()
                            if val:
                                details[key] = val
                                
                    details_json = json.dumps(details, ensure_ascii=False) if details else None
                    
                    batch.append((
                        corp_num,
                        sig_type,
                        title,
                        parsed_date,
                        None, # source_url
                        details_json
                    ))
                    
                    file_matches += 1
                    
                    if len(batch) >= batch_size:
                        cursor.executemany("""
                            INSERT INTO business_signals (corporate_number, signal_type, signal_title, signal_date, source_url, details)
                            VALUES (?, ?, ?, ?, ?, ?)
                        """, batch)
                        conn.commit()
                        batch = []
                        
            # Insert remaining
            if batch:
                cursor.executemany("""
                    INSERT INTO business_signals (corporate_number, signal_type, signal_title, signal_date, source_url, details)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, batch)
                conn.commit()
                
        print(f"[+] Finished: Matched & imported {file_matches} records.")
        stats[label] = file_matches
        total_signals_imported += file_matches
        
    print("\n" + "="*50)
    print("      SUMMARY OF BUSINESS SIGNALS INGESTION")
    print("="*50)
    for label, count in stats.items():
        print(f"  - {label:<35}: {count} records imported")
    print(f"  Total signals loaded: {total_signals_imported}")
    print("="*50)
    
    return stats

def main():
    print("="*60)
    print("      KIGYOU-LIST: BUSINESS SIGNALS INGESTION SYSTEM")
    print("="*60)
    
    start_time = datetime.now()
    conn = get_db_connection()
    
    try:
        import_signals(conn)
        duration = datetime.now() - start_time
        print(f"[+] Ingestion completed successfully in: {duration}")
    except Exception as e:
        print(f"[-] Fatal error during ingestion: {e}")
        conn.rollback()
    finally:
        conn.close()
        print("[*] SQLite database connection closed.")

if __name__ == "__main__":
    main()
