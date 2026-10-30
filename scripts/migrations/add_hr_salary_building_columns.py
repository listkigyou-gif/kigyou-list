# -*- coding: utf-8 -*-
"""
Migration: Add HR, Salary, and Building Columns to SQLite and PostgreSQL
- insured_employee_count (INT)
- avg_annual_salary (BIGINT)
- avg_age (NUMERIC/REAL)
- avg_service_years (NUMERIC/REAL)
- building_name (TEXT)
- building_slug (TEXT)
- has_insured_count (INT/BOOLEAN)
- has_salary_data (INT/BOOLEAN)
- in_major_building (INT/BOOLEAN)
"""

import sys
import os
import sqlite3
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, PROJECT_ROOT)
from crawlers.nta.sync_nta_invoices_to_vps import PG_URL

DB_PATH = os.path.join(PROJECT_ROOT, 'kigyou-list.db')

def migrate_sqlite():
    print(f"[*] Migrating SQLite: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Get existing columns in companies
    cur.execute("PRAGMA table_info(companies)")
    existing_cols = {row[1] for row in cur.fetchall()}
    
    cols_to_add = [
        ("insured_employee_count", "INTEGER"),
        ("avg_annual_salary", "INTEGER"),
        ("avg_age", "REAL"),
        ("avg_service_years", "REAL"),
        ("building_name", "TEXT"),
        ("building_slug", "TEXT"),
        ("has_insured_count", "INTEGER DEFAULT 0"),
        ("has_salary_data", "INTEGER DEFAULT 0"),
        ("in_major_building", "INTEGER DEFAULT 0")
    ]
    
    for col_name, col_type in cols_to_add:
        if col_name not in existing_cols:
            print(f"  -> Adding SQLite column companies.{col_name} ({col_type})")
            cur.execute(f"ALTER TABLE companies ADD COLUMN {col_name} {col_type}")
        else:
            print(f"  -> SQLite column companies.{col_name} already exists.")
            
    # Create indexes for fast filtering
    cur.execute("CREATE INDEX IF NOT EXISTS idx_comp_building_slug ON companies (building_slug)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_comp_insured_count ON companies (insured_employee_count)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_comp_avg_salary ON companies (avg_annual_salary)")
    
    # Create office_buildings table in SQLite
    cur.execute("""
    CREATE TABLE IF NOT EXISTS office_buildings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        building_slug TEXT UNIQUE NOT NULL,
        building_name TEXT NOT NULL,
        building_name_en TEXT,
        prefecture_code TEXT NOT NULL,
        prefecture_name TEXT NOT NULL,
        city_name TEXT NOT NULL,
        street_address TEXT NOT NULL,
        postal_code TEXT,
        nearest_stations TEXT,
        total_floors INTEGER,
        completed_year INTEGER,
        tenant_company_count INTEGER DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_buildings_pref_tenants ON office_buildings (prefecture_code, tenant_company_count DESC)")
    
    conn.commit()
    conn.close()
    print("[+] SQLite migration completed successfully.")

def migrate_postgres():
    print(f"[*] Migrating PostgreSQL on VPS...")
    try:
        conn = psycopg2.connect(PG_URL)
        cur = conn.cursor()
        
        # 1. Add columns to companies
        cur.execute("""
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS insured_employee_count INT NULL;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS insured_range_id SMALLINT NULL;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS avg_annual_salary BIGINT NULL;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS avg_age NUMERIC(4, 1) NULL;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS avg_service_years NUMERIC(4, 1) NULL;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS building_name VARCHAR(255) NULL;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS building_slug VARCHAR(255) NULL;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS has_insured_count BOOLEAN DEFAULT FALSE;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS has_salary_data BOOLEAN DEFAULT FALSE;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS in_major_building BOOLEAN DEFAULT FALSE;
        """)
        
        # 2. Indexes
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_comp_insured_count ON companies (prefecture_code, insured_range_id, insured_employee_count DESC) WHERE has_insured_count = TRUE;
            CREATE INDEX IF NOT EXISTS idx_comp_salary_ranking ON companies (avg_salary_range_id, avg_annual_salary DESC) WHERE has_salary_data = TRUE;
            CREATE INDEX IF NOT EXISTS idx_comp_building_slug ON companies (building_slug) WHERE building_slug IS NOT NULL;
        """)
        
        # 3. Create office_buildings table in PostgreSQL
        cur.execute("""
        CREATE TABLE IF NOT EXISTS office_buildings (
            id BIGSERIAL PRIMARY KEY,
            building_slug VARCHAR(255) UNIQUE NOT NULL,
            building_name VARCHAR(255) NOT NULL,
            building_name_en VARCHAR(255) NULL,
            prefecture_code VARCHAR(2) NOT NULL,
            prefecture_name VARCHAR(50) NOT NULL,
            city_name VARCHAR(100) NOT NULL,
            street_address TEXT NOT NULL,
            postal_code VARCHAR(7) NULL,
            nearest_stations JSONB NULL,
            total_floors INT NULL,
            completed_year INT NULL,
            tenant_company_count INT DEFAULT 0,
            description TEXT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_buildings_pref_tenants ON office_buildings (prefecture_code, tenant_company_count DESC);
        """)
        
        conn.commit()
        conn.close()
        print("[+] PostgreSQL migration completed successfully.")
    except Exception as e:
        print(f"[-] PostgreSQL migration error: {e}")

if __name__ == '__main__':
    migrate_sqlite()
    migrate_postgres()
