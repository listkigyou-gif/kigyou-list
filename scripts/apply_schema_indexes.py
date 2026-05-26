#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: SQLite WAL Mode and Ingestion Optimization Script
==============================================================
Enables WAL (Write-Ahead Log) mode and creates indexes on corporate_number
for the Bronze staging tables (raw_hellowork, raw_website, raw_yahoo).
Console outputs are ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import sqlite3
import sys

DB_PATH = "kigyou-list.db"

def main():
    print("="*60)
    print("      KIGYOU-LIST: SQLITE WAL & INDEX OPTIMIZATION")
    print("="*60)
    
    try:
        print(f"[*] Connecting to SQLite database at: {DB_PATH}")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 1. Enable WAL Mode
        print("[*] Checking and enabling Write-Ahead Log (WAL) mode...")
        cursor.execute("PRAGMA journal_mode;")
        current_mode = cursor.fetchone()[0]
        print(f"  Current journal mode: {current_mode.upper()}")
        
        if current_mode.lower() != "wal":
            print("  Enabling WAL mode...")
            cursor.execute("PRAGMA journal_mode=WAL;")
            new_mode = cursor.fetchone()[0]
            print(f"  New journal mode: {new_mode.upper()}")
        else:
            print("  WAL mode is already enabled.")
            
        # 2. Create indexes on Bronze staging tables
        print("\n[*] Creating indexes on staging tables for 'corporate_number'...")
        
        # A. raw_hellowork
        print("  Creating index on raw_hellowork(corporate_number)...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_raw_hellowork_corp_num 
            ON raw_hellowork(corporate_number);
        """)
        
        # B. raw_website
        print("  Creating index on raw_website(corporate_number)...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_raw_website_corp_num 
            ON raw_website(corporate_number);
        """)
        
        # C. raw_yahoo
        print("  Creating index on raw_yahoo(corporate_number)...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_raw_yahoo_corp_num 
            ON raw_yahoo(corporate_number);
        """)
        
        conn.commit()
        print("\n[+] SUCCESS! WAL mode enabled and all missing indexes created successfully.")
        
    except Exception as e:
        print(f"[-] Optimization failed: {e}")
        sys.exit(1)
    finally:
        if 'conn' in locals():
            conn.close()
            print("[*] Database connection closed.")

if __name__ == "__main__":
    main()
