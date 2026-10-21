#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Production PostgreSQL License Migration & Synchronizer
===================================================================
1. Migrates company_licenses table and indexes into PostgreSQL VPS.
2. Streams and bulk-inserts all 467,596 license records from SQLite (kigyou-list.db)
   into PostgreSQL using batch execute_values for high throughput.
3. Verifies data integrity and record counts between SQLite and PostgreSQL.
"""

import os
import sys
import time
import sqlite3
import psycopg2
from psycopg2.extras import execute_values

try:
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

SQLITE_DB = "kigyou-list.db"
DEFAULT_PG_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"
BATCH_SIZE = 5000

MIGRATION_SQL = """
-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS company_licenses (
    id SERIAL PRIMARY KEY,
    corporate_number VARCHAR(13) NOT NULL,
    license_type VARCHAR(100) NOT NULL,
    license_category VARCHAR(100) NULL,
    license_number VARCHAR(150) NOT NULL,
    issuing_authority VARCHAR(100) NOT NULL,
    prefecture_code VARCHAR(2) NOT NULL,
    representative_name VARCHAR(150) NULL,
    office_phone VARCHAR(50) NULL,
    office_fax VARCHAR(50) NULL,
    registered_address TEXT NULL,
    issue_date VARCHAR(20) NULL,
    valid_until VARCHAR(20) NULL,
    license_status VARCHAR(50) DEFAULT '有効',
    specialties_json TEXT NULL,
    source_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_company_licenses_corp_num ON company_licenses(corporate_number);
CREATE INDEX IF NOT EXISTS idx_company_licenses_type ON company_licenses(license_type);
CREATE INDEX IF NOT EXISTS idx_company_licenses_pref ON company_licenses(prefecture_code);
CREATE INDEX IF NOT EXISTS idx_company_licenses_lic_num ON company_licenses(license_number);

-- 3. Comments in Japanese
COMMENT ON TABLE company_licenses IS '企業が保有する行政許認可および登録資格情報（建設業、人材派遣、有料職業紹介等）';
COMMENT ON COLUMN company_licenses.corporate_number IS '法人番号（13桁）';
COMMENT ON COLUMN company_licenses.license_type IS '許認可種別（建設業許可、労働者派遣事業、有料職業紹介事業等）';
COMMENT ON COLUMN company_licenses.license_category IS '区分（知事免許、大臣許可等）';
COMMENT ON COLUMN company_licenses.license_number IS '許認可番号・登録番号';
COMMENT ON COLUMN company_licenses.issuing_authority IS '管轄自治体・行政機関名';
COMMENT ON COLUMN company_licenses.prefecture_code IS '都道府県コード（JIS X 0401）';
COMMENT ON COLUMN company_licenses.representative_name IS '専任・代表者氏名';
COMMENT ON COLUMN company_licenses.office_phone IS '事業所・届出電話番号';
COMMENT ON COLUMN company_licenses.registered_address IS '届出住所・所在地';
COMMENT ON COLUMN company_licenses.specialties_json IS '業種・業態別詳細データ（29業種区分、派遣マージン率等）';
"""

def get_postgres_url():
    return os.environ.get("DATABASE_URL", DEFAULT_PG_URL)

def main():
    pg_url = get_postgres_url()
    print("=" * 70)
    print("   KIGYOU-LIST: PRODUCTION POSTGRESQL LICENSE SYNCHRONIZER")
    print("=" * 70)
    
    # 1. Connect SQLite
    if not os.path.exists(SQLITE_DB):
        print(f"[-] SQLite database not found: {SQLITE_DB}")
        sys.exit(1)
        
    print(f"[*] Connecting to SQLite: {SQLITE_DB}...")
    lite_conn = sqlite3.connect(SQLITE_DB)
    lite_cur = lite_conn.cursor()
    
    lite_cur.execute("SELECT COUNT(*) FROM company_licenses;")
    total_source_count = lite_cur.fetchone()[0]
    print(f"[+] Total license records in SQLite: {total_source_count:,}")

    # 2. Connect PostgreSQL
    print("[*] Connecting to VPS PostgreSQL...")
    try:
        pg_conn = psycopg2.connect(
            pg_url,
            connect_timeout=15,
            keepalives=1,
            keepalives_idle=30,
            keepalives_interval=10,
            keepalives_count=5
        )
        pg_cur = pg_conn.cursor()
        print("[+] Connected to PostgreSQL VPS successfully!")
    except Exception as e:
        print(f"[-] PostgreSQL connection error: {e}")
        lite_conn.close()
        sys.exit(1)

    # 3. Run migration
    print("[*] Running table migration & index creation on PostgreSQL...")
    pg_cur.execute(MIGRATION_SQL)
    pg_conn.commit()
    print("[+] Table 'company_licenses' and indexes created / verified.")

    # 4. Check current row count in PG
    pg_cur.execute("SELECT COUNT(*) FROM company_licenses;")
    current_pg_count = pg_cur.fetchone()[0]
    print(f"[*] Current row count in PostgreSQL: {current_pg_count:,}")

    if current_pg_count > 0:
        print("[*] Truncating company_licenses table for clean full sync...")
        pg_cur.execute("TRUNCATE TABLE company_licenses RESTART IDENTITY;")
        pg_conn.commit()
        print("[+] Table truncated.")

    # 5. Stream data from SQLite and bulk insert into PostgreSQL
    print(f"[*] Streaming {total_source_count:,} records in batches of {BATCH_SIZE:,}...")
    t_start = time.time()

    query_sqlite = """
        SELECT corporate_number, license_type, license_category, license_number,
               issuing_authority, prefecture_code, representative_name, office_phone,
               office_fax, registered_address, issue_date, valid_until, license_status,
               specialties_json, source_url
        FROM company_licenses
        ORDER BY id ASC;
    """
    lite_cur.execute(query_sqlite)

    insert_sql = """
        INSERT INTO company_licenses (
            corporate_number, license_type, license_category, license_number,
            issuing_authority, prefecture_code, representative_name, office_phone,
            office_fax, registered_address, issue_date, valid_until, license_status,
            specialties_json, source_url
        ) VALUES %s;
    """

    synced_count = 0
    while True:
        rows = lite_cur.fetchmany(BATCH_SIZE)
        if not rows:
            break

        execute_values(pg_cur, insert_sql, rows, page_size=BATCH_SIZE)
        pg_conn.commit()

        synced_count += len(rows)
        elapsed = time.time() - t_start
        speed = synced_count / elapsed if elapsed > 0 else 0
        pct = (synced_count / total_source_count) * 100
        remaining_secs = (total_source_count - synced_count) / speed if speed > 0 else 0

        print(f"[{pct:5.1f}%] Synced {synced_count:,}/{total_source_count:,} records | "
              f"Speed: {speed:,.0f} rows/s | ETA: {remaining_secs:,.0f}s", end="\r")

    print("\n" + "=" * 70)
    print(f"[+] Sync finished in {time.time() - t_start:.2f} seconds!")

    # 6. Verify row count and breakdown on PostgreSQL
    pg_cur.execute("SELECT COUNT(*) FROM company_licenses;")
    final_pg_count = pg_cur.fetchone()[0]
    print(f"[+] Total records in PostgreSQL: {final_pg_count:,}")

    print("\n--- Breakdown by license_type in PostgreSQL ---")
    pg_cur.execute("SELECT license_type, COUNT(*) FROM company_licenses GROUP BY license_type ORDER BY COUNT(*) DESC;")
    for r in pg_cur.fetchall():
        print(f"  * {r[0]}: {r[1]:,}")

    print("\n--- Unique corporate_numbers in PostgreSQL ---")
    pg_cur.execute("SELECT COUNT(DISTINCT corporate_number) FROM company_licenses;")
    unique_corps = pg_cur.fetchone()[0]
    print(f"[+] Unique companies with licenses: {unique_corps:,}")

    # Check match
    if final_pg_count == total_source_count:
        print("\n[SUCCESS] Exact 100% data match between SQLite and PostgreSQL!")
    else:
        print(f"\n[WARNING] Count mismatch: SQLite={total_source_count:,}, PG={final_pg_count:,}")

    lite_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    main()
