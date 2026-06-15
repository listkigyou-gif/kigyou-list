#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: PostgreSQL Database Migration (Add parent major industries)
=======================================================================
For all companies in PostgreSQL that have medium industry codes (like '31'),
resolves their parent codes (like 'E') and inserts them into the company_industries
table if they are missing. This aligns existing historical data with the new logic.
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
    print("      KIGYOU-LIST: POSTGRESQL DB MIGRATION (ADD PARENT INDUSTRIES)")
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
        
    print("[*] Migrating company_industries: Inserting missing parent major industries...")
    try:
        cursor.execute("""
            INSERT INTO company_industries (corporate_number, industry_code, industry_path, is_detailed)
            SELECT DISTINCT ci.corporate_number, m.parent_code, m.parent_code, TRUE
            FROM company_industries ci
            JOIN m_industries m ON ci.industry_code = m.industry_code
            WHERE m.parent_code IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 
                  FROM company_industries parent_ci
                  WHERE parent_ci.corporate_number = ci.corporate_number
                    AND parent_ci.industry_code = m.parent_code
              )
            ON CONFLICT (corporate_number, industry_code) DO NOTHING;
        """)
        affected_rows = cursor.rowcount
        conn.commit()
        duration = datetime.now() - start_time
        print(f"[+] SUCCESS! Inserted {affected_rows:,} missing parent industry rows in {duration.total_seconds():.2f}s.")
    except Exception as e:
        conn.rollback()
        print(f"[-] Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
