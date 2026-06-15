#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: PostgreSQL Database Migration (Industry Tags) - Partition Optimized
================================================================================
For all companies in PostgreSQL where jigyo_shumoku is NULL, empty, or '未分類', 
if they have an associated industry classification (like 'E' - 製造業),
sets their jigyo_shumoku to that industry's official name.

Optimized to run partition-by-partition (prefecture_code) to leverage partition
pruning on the 5-million-row partitioned table, preventing locks and high CPU.
"""

import os
import sys
import psycopg2
from datetime import datetime

# Enforce UTF-8 output to prevent Windows console crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def get_postgres_url():
    # Attempt to read .env first
    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    
    # Attempt to read .env.local
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
                    
    # Fallback to system env
    return os.environ.get("DATABASE_URL")

def run_migration():
    print("="*60)
    print("      KIGYOU-LIST: POSTGRESQL DB MIGRATION (INDUSTRY TAGS)")
    print("="*60)
    
    pg_url = get_postgres_url()
    if not pg_url:
        print("[-] Error: DATABASE_URL not found in .env, .env.local, or system environment.")
        sys.exit(1)
        
    start_time = datetime.now()
    
    print("[*] Connecting to PostgreSQL database...")
    try:
        conn = psycopg2.connect(pg_url)
        cursor = conn.cursor()
    except Exception as e:
        print(f"[-] Could not connect to PostgreSQL: {e}")
        sys.exit(1)
        
    print("[*] Retrieving active prefecture codes to optimize partition updates...")
    try:
        cursor.execute("SELECT DISTINCT prefecture_code FROM companies WHERE prefecture_code IS NOT NULL AND prefecture_code != '';")
        prefectures = [r[0] for r in cursor.fetchall()]
        prefectures.sort()
        # Also include None for companies that might not have a prefecture_code
        prefectures.append(None)
        print(f"[+] Found {len(prefectures) - 1} active prefectures in database.")
    except Exception as e:
        print(f"[-] Failed to retrieve prefecture list: {e}")
        conn.close()
        sys.exit(1)

    print("[*] Starting partition-by-partition migration...")
    total_updated = 0
    
    for idx, pref in enumerate(prefectures, 1):
        pref_name = pref if pref is not None else "NULL (Undefined Prefecture)"
        print(f"[{idx}/{len(prefectures)}] Migrating prefecture '{pref_name}'...")
        
        pref_start = datetime.now()
        try:
            if pref is None:
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
                    WHERE prefecture_code IS NULL
                      AND (jigyo_shumoku IS NULL OR jigyo_shumoku = '' OR jigyo_shumoku = '未分類' OR jigyo_shumoku = '未登録')
                      AND EXISTS (
                          SELECT 1 
                          FROM company_industries ci
                          WHERE ci.corporate_number = companies.corporate_number
                      );
                """)
            else:
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
                    WHERE prefecture_code = %s
                      AND (jigyo_shumoku IS NULL OR jigyo_shumoku = '' OR jigyo_shumoku = '未分類' OR jigyo_shumoku = '未登録')
                      AND EXISTS (
                          SELECT 1 
                          FROM company_industries ci
                          WHERE ci.corporate_number = companies.corporate_number
                      );
                """, (pref,))
                
            affected_rows = cursor.rowcount
            conn.commit()
            total_updated += affected_rows
            pref_duration = datetime.now() - pref_start
            
            if affected_rows > 0:
                print(f"    -> Updated {affected_rows:,} rows in {pref_duration.total_seconds():.2f}s.")
        except Exception as e:
            conn.rollback()
            print(f"    [-] Failed to update prefecture '{pref_name}': {e}")
            
    duration = datetime.now() - start_time
    print("="*60)
    print(f"[+] SUCCESS! Updated total {total_updated:,} companies in {duration}.")
    print("="*60)
    conn.close()

if __name__ == "__main__":
    run_migration()
