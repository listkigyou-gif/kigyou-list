#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: High-Speed Hiring Flag Synchronizer to VPS
======================================================
Uses Postgres Partition Pruning (prefecture_code + corporate_number)
and execute_values for maximum throughput (10,000+ rows/sec).
"""

import os
import sys
import time
import sqlite3
import psycopg2
from psycopg2.extras import execute_values

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SQLITE_DB = os.path.join(PROJECT_ROOT, "kigyou-list.db")
PG_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")

BATCH_SIZE = 10000

def main():
    print("="*60)
    print("      HIGH-SPEED HIRING FLAG SYNCHRONIZER TO VPS")
    print("="*60)

    # 1. Fetch all hiring companies (corp_num, pref_code) from SQLite
    print("[*] Fetching hiring companies from SQLite master...")
    conn_sq = sqlite3.connect(SQLITE_DB, timeout=60.0)
    cur_sq = conn_sq.cursor()
    cur_sq.execute("""
        SELECT corporate_number, prefecture_code 
        FROM companies 
        WHERE is_hiring = 1 
          AND corporate_number IS NOT NULL 
          AND length(corporate_number) = 13
          AND prefecture_code IS NOT NULL;
    """)
    sqlite_rows = cur_sq.fetchall()
    conn_sq.close()
    print(f"[+] Found {len(sqlite_rows):,} active hiring companies in SQLite.")

    # 2. Connect to VPS PostgreSQL
    print("[*] Connecting to VPS PostgreSQL...")
    conn_pg = psycopg2.connect(PG_URL, connect_timeout=15)
    cur_pg = conn_pg.cursor()

    cur_pg.execute("SELECT corporate_number FROM companies WHERE is_hiring = true;")
    existing_pg = set(r[0] for r in cur_pg.fetchall())
    print(f"[+] Found {len(existing_pg):,} companies already having is_hiring = true on VPS.")

    delta_rows = [r for r in sqlite_rows if r[0] not in existing_pg]
    print(f"[*] Delta to update on VPS: {len(delta_rows):,} companies.")

    if not delta_rows:
        print("[+] Everything is already 100% up to date on VPS!")
        conn_pg.close()
        return

    # 3. Stream in batches using execute_values with partition key
    t0 = time.time()
    total_updated = 0
    total_batches = (len(delta_rows) + BATCH_SIZE - 1) // BATCH_SIZE

    update_sql = """
        UPDATE companies AS c
        SET is_hiring = true,
            updated_at = CURRENT_TIMESTAMP
        FROM (VALUES %s) AS v(corp_num, pref_code)
        WHERE c.prefecture_code = v.pref_code 
          AND c.corporate_number = v.corp_num
          AND (c.is_hiring IS NULL OR c.is_hiring = false);
    """

    for b_idx in range(total_batches):
        chunk = delta_rows[b_idx * BATCH_SIZE : (b_idx + 1) * BATCH_SIZE]
        execute_values(cur_pg, update_sql, chunk)
        conn_pg.commit()
        total_updated += len(chunk)

        pct = ((b_idx + 1) / total_batches) * 100
        speed = total_updated / (time.time() - t0) if time.time() > t0 else 0
        print(f"    Batch {b_idx + 1}/{total_batches} ({pct:.1f}%) | Synced: {total_updated:,} | Speed: {speed:.0f} rows/sec", flush=True)

    elapsed = time.time() - t0
    print("\n" + "="*60)
    print(f"[+] VPS SYNC COMPLETE: Updated {total_updated:,} companies in {elapsed:.2f}s ({total_updated/elapsed:.0f} rows/sec)!")
    print("="*60)

    cur_pg.close()
    conn_pg.close()

if __name__ == "__main__":
    main()
