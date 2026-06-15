#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: PostgreSQL Database Migration (Add is_detailed flag)
==================================================================
1. Adds 'is_detailed' BOOLEAN column to the companies table (default FALSE).
2. Creates an index on 'is_detailed' for fast search performance.
3. Updates 'is_detailed = TRUE' partition-by-partition (prefecture_code) 
   for all companies mapped to at least one medium JSIC code (length > 1).
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
    print("      KIGYOU-LIST: POSTGRESQL DB MIGRATION (ADD IS_DETAILED)")
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
        
    # 1. Add column to companies table
    print("[*] Adding column 'is_detailed' to 'companies' table...")
    try:
        # Check if column already exists to prevent error
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM information_schema.columns 
            WHERE table_name = 'companies' AND column_name = 'is_detailed';
        """)
        column_exists = cursor.fetchone()
        
        if not column_exists:
            cursor.execute("ALTER TABLE companies ADD COLUMN is_detailed BOOLEAN NOT NULL DEFAULT FALSE;")
            conn.commit()
            print("[+] Successfully added 'is_detailed' column.")
        else:
            print("[~] Column 'is_detailed' already exists. Skipping ALTER TABLE.")
    except Exception as e:
        conn.rollback()
        print(f"[-] Failed to add column: {e}")
        conn.close()
        sys.exit(1)

    # 2. Create index on is_detailed
    print("[*] Creating index 'idx_companies_is_detailed'...")
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_companies_is_detailed ON companies (is_detailed);")
        conn.commit()
        print("[+] Index created successfully.")
    except Exception as e:
        conn.rollback()
        print(f"[-] Failed to create index: {e}")
        conn.close()
        sys.exit(1)

    # 3. Retrieve active prefectures to update values partition-by-partition
    print("[*] Retrieving active prefecture codes to update values...")
    try:
        cursor.execute("SELECT DISTINCT prefecture_code FROM companies WHERE prefecture_code IS NOT NULL AND prefecture_code != '';")
        prefectures = [r[0] for r in cursor.fetchall()]
        prefectures.sort()
        prefectures.append(None) # For Undefined prefecture
        print(f"[+] Found {len(prefectures) - 1} active prefectures in database.")
    except Exception as e:
        print(f"[-] Failed to retrieve prefecture list: {e}")
        conn.close()
        sys.exit(1)

    print("[*] Starting partition-by-partition update of 'is_detailed' flag...")
    total_updated = 0
    
    for idx, pref in enumerate(prefectures, 1):
        pref_name = pref if pref is not None else "NULL (Undefined Prefecture)"
        print(f"[{idx}/{len(prefectures)}] Updating prefecture '{pref_name}'...")
        
        pref_start = datetime.now()
        try:
            if pref is None:
                cursor.execute("""
                    UPDATE companies
                    SET is_detailed = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE prefecture_code IS NULL
                      AND is_detailed = FALSE
                      AND EXISTS (
                          SELECT 1 
                          FROM company_industries ci
                          WHERE ci.corporate_number = companies.corporate_number
                            AND LENGTH(ci.industry_code) > 1
                      );
                """)
            else:
                cursor.execute("""
                    UPDATE companies
                    SET is_detailed = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE prefecture_code = %s
                      AND is_detailed = FALSE
                      AND EXISTS (
                          SELECT 1 
                          FROM company_industries ci
                          WHERE ci.corporate_number = companies.corporate_number
                            AND LENGTH(ci.industry_code) > 1
                      );
                """, (pref,))
                
            affected_rows = cursor.rowcount
            conn.commit()
            total_updated += affected_rows
            pref_duration = datetime.now() - pref_start
            
            if affected_rows > 0:
                print(f"    -> Marked {affected_rows:,} companies as detailed in {pref_duration.total_seconds():.2f}s.")
        except Exception as e:
            conn.rollback()
            print(f"    [-] Failed to update prefecture '{pref_name}': {e}")
            
    duration = datetime.now() - start_time
    print("="*60)
    print(f"[+] SUCCESS! Added column, created index, and marked total {total_updated:,} companies as detailed in {duration}.")
    print("="*60)
    conn.close()

if __name__ == "__main__":
    run_migration()
