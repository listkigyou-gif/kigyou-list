#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Database Migration to Align jigyo_shumoku with company_industries
=============================================================================
For all companies where jigyo_shumoku is NULL, empty, or '未分類', 
if they have an associated industry classification (like 'E' - 製造業),
sets their jigyo_shumoku to that industry's official name.
"""

import sqlite3
import sys
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = "kigyou-list.db"

def run_migration():
    print("="*60)
    print("      KIGYOU-LIST: DATABASE MIGRATION (INDUSTRY TAGS)")
    print("="*60)
    
    start_time = datetime.now()
    
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        cursor = conn.cursor()
    except Exception as e:
        print(f"[-] Could not connect to SQLite database: {e}")
        sys.exit(1)
        
    print("[*] Finding companies with empty/unclassified tags that have registered industry codes...")
    
    # Check total count first
    cursor.execute("""
        SELECT COUNT(*) 
        FROM companies 
        WHERE (jigyo_shumoku IS NULL OR jigyo_shumoku = '' OR jigyo_shumoku = '未分類' OR jigyo_shumoku = '未登録')
          AND EXISTS (
              SELECT 1 
              FROM company_industries ci
              WHERE ci.corporate_number = companies.corporate_number
          );
    """)
    total_count = cursor.fetchone()[0]
    print(f"[+] Found {total_count:,} companies matching the migration criteria.")
    
    if total_count == 0:
        print("[~] No companies need migration. Database is already aligned.")
        conn.close()
        return

    print("[*] Running migration query. This may take a moment...")
    try:
        cursor.execute("""
            UPDATE companies
            SET jigyo_shumoku = (
                SELECT m.industry_name 
                FROM company_industries ci
                JOIN m_industries m ON ci.industry_code = m.industry_code
                WHERE ci.corporate_number = companies.corporate_number
                ORDER BY LENGTH(ci.industry_code) ASC, ci.industry_code ASC
                LIMIT 1
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE (jigyo_shumoku IS NULL OR jigyo_shumoku = '' OR jigyo_shumoku = '未分類' OR jigyo_shumoku = '未登録')
              AND EXISTS (
                  SELECT 1 
                  FROM company_industries ci
                  WHERE ci.corporate_number = companies.corporate_number
              );
        """)
        affected_rows = cursor.rowcount
        conn.commit()
        duration = datetime.now() - start_time
        print(f"[+] SUCCESS! Updated {affected_rows:,} company rows in {duration}.")
    except Exception as e:
        conn.rollback()
        print(f"[-] Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
