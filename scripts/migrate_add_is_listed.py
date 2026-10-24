#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
========================================================================================
MIGRATION: ADD LISTED COMPANIES FLAG (上場企業フラグ is_listed)
========================================================================================
Adds `is_listed`, `listing_market`, and `stock_code` columns to:
1. SQLite local `kigyou-list.db`
2. VPS PostgreSQL Production partitioned `companies` table

Enables ultra-fast indexed filtering for Japanese listed corporations.
========================================================================================
"""

import sys
import time
import sqlite3
import psycopg2
from typing import List, Tuple

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from crawlers.nta.sync_nta_invoices_to_vps import PG_URL

DB_LOCAL = "kigyou-list.db"

def migrate_sqlite():
    print("=" * 80)
    print("[1/2] MIGRATING SQLITE LOCAL DATABASE...")
    print("=" * 80)
    conn = sqlite3.connect(DB_LOCAL, timeout=60.0)
    cur = conn.cursor()

    # 1. Check existing columns
    existing_cols = [c[1] for c in cur.execute("PRAGMA table_info(companies)").fetchall()]

    if "is_listed" not in existing_cols:
        print("[*] Adding column `is_listed` to SQLite companies...")
        cur.execute("ALTER TABLE companies ADD COLUMN is_listed BOOLEAN DEFAULT 0;")
    else:
        print("[+] Column `is_listed` already exists in SQLite companies.")

    if "listing_market" not in existing_cols:
        print("[*] Adding column `listing_market` to SQLite companies...")
        cur.execute("ALTER TABLE companies ADD COLUMN listing_market TEXT;")
    else:
        print("[+] Column `listing_market` already exists in SQLite companies.")

    if "stock_code" not in existing_cols:
        print("[*] Adding column `stock_code` to SQLite companies...")
        cur.execute("ALTER TABLE companies ADD COLUMN stock_code TEXT;")
    else:
        print("[+] Column `stock_code` already exists in SQLite companies.")

    conn.commit()

    # 2. Get distinct corporate numbers from EDINET
    cur.execute("SELECT DISTINCT corporate_number FROM company_financials WHERE source = 'EDINET';")
    edinet_corps = [r[0] for r in cur.fetchall()]
    print(f"[*] Found {len(edinet_corps):,} verified listed corporate numbers in company_financials.")

    # 3. Update is_listed in batches
    t0 = time.time()
    batch_size = 500
    total_updated = 0
    for i in range(0, len(edinet_corps), batch_size):
        chunk = edinet_corps[i:i + batch_size]
        placeholders = ",".join(["?"] * len(chunk))
        sql = f"""
            UPDATE companies 
            SET is_listed = 1,
                listing_market = COALESCE(listing_market, '東証'),
                updated_at = CURRENT_TIMESTAMP
            WHERE corporate_number IN ({placeholders});
        """
        cur.execute(sql, chunk)
        total_updated += cur.rowcount
    conn.commit()

    # 4. Create Partial Index
    print("[*] Creating partial index `idx_companies_is_listed`...")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_is_listed ON companies(is_listed) WHERE is_listed = 1;")
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM companies WHERE is_listed = 1;")
    active_cnt = cur.fetchone()[0]
    print(f"[+] SQLite migration complete in {time.time() - t0:.2f}s! Total active listed companies: {active_cnt:,}")

    conn.close()
    return edinet_corps

def migrate_postgresql(listed_corps: List[str]):
    print("\n" + "=" * 80)
    print("[2/2] MIGRATING VPS POSTGRESQL PRODUCTION DATABASE...")
    print("=" * 80)
    conn = psycopg2.connect(PG_URL)
    cur = conn.cursor()

    # 1. Add columns to master table if not exists
    cur.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name IN ('is_listed', 'listing_market', 'stock_code');
    """)
    existing_pg_cols = [r[0] for r in cur.fetchall()]

    if "is_listed" not in existing_pg_cols:
        print("[*] Adding column `is_listed` to PostgreSQL companies...")
        cur.execute("ALTER TABLE companies ADD COLUMN is_listed BOOLEAN DEFAULT FALSE;")
    if "listing_market" not in existing_pg_cols:
        print("[*] Adding column `listing_market` to PostgreSQL companies...")
        cur.execute("ALTER TABLE companies ADD COLUMN listing_market VARCHAR(50);")
    if "stock_code" not in existing_pg_cols:
        print("[*] Adding column `stock_code` to PostgreSQL companies...")
        cur.execute("ALTER TABLE companies ADD COLUMN stock_code VARCHAR(10);")
    conn.commit()

    # 2. Update is_listed across partitions using temporary table or IN clause
    print(f"[*] Updating is_listed = TRUE for {len(listed_corps):,} corporations on VPS...")
    t0 = time.time()

    cur.execute("CREATE TEMP TABLE tmp_listed_corps (corporate_number VARCHAR(13) PRIMARY KEY);")
    from psycopg2.extras import execute_values
    execute_values(cur, "INSERT INTO tmp_listed_corps (corporate_number) VALUES %s ON CONFLICT DO NOTHING;", [(c,) for c in listed_corps])
    conn.commit()

    cur.execute("""
        UPDATE companies AS c
        SET is_listed = TRUE,
            listing_market = COALESCE(c.listing_market, '東証'),
            updated_at = CURRENT_TIMESTAMP
        FROM tmp_listed_corps AS t
        WHERE c.corporate_number = t.corporate_number;
    """)
    updated_cnt = cur.rowcount
    conn.commit()

    # 3. Create covering index on companies
    print("[*] Creating partial index on PostgreSQL partitioned companies...")
    try:
        cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_is_listed ON companies(is_listed) WHERE is_listed = TRUE;")
        conn.commit()
    except Exception as e:
        print(f"[-] Note on index creation: {e}")
        conn.rollback()

    cur.execute("SELECT COUNT(*) FROM companies WHERE is_listed = TRUE;")
    active_vps = cur.fetchone()[0]
    print(f"[+] VPS migration complete in {time.time() - t0:.2f}s! Active listed companies on VPS: {active_vps:,}")

    conn.close()

def main():
    t_start = time.time()
    corps = migrate_sqlite()
    migrate_postgresql(corps)
    print("\n" + "=" * 80)
    print(f"[SUCCESS] ALL MIGRATIONS COMPLETED IN {time.time() - t_start:.2f}s!")
    print("=" * 80)

if __name__ == "__main__":
    main()
