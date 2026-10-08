#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Financial Records Table Migration (SQLite)
======================================================
Creates the 'financial_records' table and indexes for unified XML & CSV financial history.
Console outputs are written in ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import sqlite3
import sys

DB_PATH = "kigyou-list.db"

def run_migration():
    print("="*60)
    print("      KIGYOU-LIST: FINANCIAL RECORDS MIGRATION")
    print("="*60)
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 1. Create table
        print("[*] Creating table 'financial_records' if it does not exist...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS financial_records (
                corporate_number TEXT NOT NULL,
                fiscal_year TEXT NOT NULL,
                period_number INTEGER,
                revenue REAL,
                operating_income REAL,
                ordinary_income REAL,
                net_income REAL,
                capital REAL,
                total_assets REAL,
                net_assets REAL,
                liquid_assets REAL,
                fixed_assets REAL,
                liquid_liabilities REAL,
                fixed_liabilities REAL,
                retained_earnings REAL,
                shareholders_json TEXT,
                source_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (corporate_number, fiscal_year)
            );
        """)
        
        # 2. Create indexes
        print("[*] Creating indexes for 'financial_records'...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_financial_records_corp 
            ON financial_records(corporate_number);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_financial_records_year 
            ON financial_records(fiscal_year);
        """)
        
        conn.commit()
        print("[+] SUCCESS! Table 'financial_records' and its indexes have been created.")
        
    except Exception as e:
        print(f"[-] Migration failed: {e}")
        sys.exit(1)
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    run_migration()
