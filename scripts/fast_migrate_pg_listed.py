#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import time
import sqlite3
import psycopg2
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from crawlers.nta.sync_nta_invoices_to_vps import PG_URL

DB_LOCAL = "kigyou-list.db"

def main():
    print("=" * 80)
    print("FAST PG LISTED COMPANIES MIGRATION (BY PARTITION)")
    print("=" * 80)

    # 1. Fetch listed companies with prefecture_code from SQLite
    conn_sq = sqlite3.connect(DB_LOCAL)
    cur_sq = conn_sq.cursor()
    cur_sq.execute("""
        SELECT c.corporate_number, c.prefecture_code 
        FROM companies c
        WHERE c.is_listed = 1 AND c.prefecture_code IS NOT NULL;
    """)
    rows = cur_sq.fetchall()
    conn_sq.close()

    print(f"[*] Found {len(rows):,} listed companies with prefecture codes in SQLite.")

    # Group by prefecture_code
    pref_map = defaultdict(list)
    for corp, pref in rows:
        pref_code = f"{int(pref):02d}" if str(pref).isdigit() else str(pref)
        pref_map[pref_code].append(corp)

    print(f"[*] Distributed across {len(pref_map)} prefectures.")

    # 2. Connect to VPS PostgreSQL
    conn_pg = psycopg2.connect(PG_URL)
    cur_pg = conn_pg.cursor()

    total_activated = 0
    t0 = time.time()

    for pref_code, corps in sorted(pref_map.items()):
        part_name = f"companies_p{pref_code}"
        placeholders = ",".join(["%s"] * len(corps))
        sql = f"""
            UPDATE {part_name}
            SET is_listed = TRUE,
                listing_market = COALESCE(listing_market, '東証'),
                updated_at = CURRENT_TIMESTAMP
            WHERE corporate_number IN ({placeholders})
              AND (is_listed IS NULL OR is_listed = FALSE);
        """
        try:
            cur_pg.execute(sql, corps)
            cnt = cur_pg.rowcount
            conn_pg.commit()
            total_activated += cnt
            if cnt > 0:
                print(f"  [+] Partition {part_name}: Activated {cnt:,} listed companies.")
        except Exception as e:
            conn_pg.rollback()
            print(f"  [-] Partition {part_name} error: {e}")

    # Index creation on partitioned parent table
    print("[*] Ensuring partial covering index on VPS...")
    try:
        cur_pg.execute("CREATE INDEX IF NOT EXISTS idx_companies_is_listed ON companies(is_listed) WHERE is_listed = TRUE;")
        conn_pg.commit()
    except Exception as e:
        print(f"  [-] Index note: {e}")
        conn_pg.rollback()

    cur_pg.execute("SELECT COUNT(*) FROM companies WHERE is_listed = TRUE;")
    final_cnt = cur_pg.fetchone()[0]

    print("=" * 80)
    print(f"[+] COMPLETED IN {time.time() - t0:.2f}s!")
    print(f"[+] Activated {total_activated:,} companies.")
    print(f"[+] TOTAL LISTED COMPANIES ON VPS PRODUCTION: {final_cnt:,}")
    print("=" * 80)

    cur_pg.close()
    conn_pg.close()

if __name__ == "__main__":
    main()
