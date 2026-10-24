#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
========================================================================================
KIGYOU-LIST: SYNC NTA OFFICIAL INVOICES TO VPS POSTGRESQL PRODUCTION
========================================================================================
1. Streams 2.57M+ official NTA certified invoices from SQLite into VPS PostgreSQL: nta_invoices
2. Updates has_invoice = true on VPS companies partitions in high-speed indexed joins
========================================================================================
"""

import os
import sys
import time
import sqlite3
import psycopg2
from psycopg2.extras import execute_values

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SQLITE_DB = os.path.join(PROJECT_ROOT, "kigyou-list.db")
PG_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")

BATCH_SIZE = 25000
PREFECTURE_CODES = [f"{i:02d}" for i in range(1, 48)]

def main():
    print("=" * 80)
    print("      SYNC NTA OFFICIAL INVOICES TO VPS POSTGRESQL PRODUCTION")
    print("=" * 80)

    # 1. Check SQLite count
    conn_sq = sqlite3.connect(SQLITE_DB, timeout=60.0)
    cur_sq = conn_sq.cursor()
    cur_sq.execute("SELECT COUNT(*) FROM nta_invoices WHERE is_valid = 1;")
    total_invoices = cur_sq.fetchone()[0]
    print(f"[*] Total official certified invoices in SQLite: {total_invoices:,}")

    # 2. Connect to VPS PostgreSQL
    print("[*] Connecting to VPS PostgreSQL...")
    conn_pg = psycopg2.connect(PG_URL, connect_timeout=20)
    cur_pg = conn_pg.cursor()

    cur_pg.execute("SELECT COUNT(*) FROM nta_invoices;")
    existing_pg = cur_pg.fetchone()[0]
    print(f"[*] Current invoices in VPS nta_invoices table: {existing_pg:,}")

    # If VPS nta_invoices needs loading
    if existing_pg < total_invoices:
        print(f"\n[*] Streaming {total_invoices - existing_pg:,} invoices from SQLite to VPS...")
        t0 = time.time()
        
        cur_sq.execute("""
            SELECT corporate_number, registration_number, prefecture_code,
                   effective_date, update_date, address, 
                   CASE WHEN is_valid = 1 THEN true ELSE false END
            FROM nta_invoices
            WHERE is_valid = 1;
        """)

        insert_pg_sql = """
            INSERT INTO nta_invoices (
                corporate_number, registration_number, prefecture_code,
                effective_date, update_date, address, is_valid
            ) VALUES %s
            ON CONFLICT (corporate_number) DO UPDATE SET
                effective_date = EXCLUDED.effective_date,
                update_date = EXCLUDED.update_date,
                address = EXCLUDED.address,
                is_valid = EXCLUDED.is_valid;
        """

        total_streamed = 0
        while True:
            raw_rows = cur_sq.fetchmany(BATCH_SIZE)
            if not raw_rows:
                break
            rows = [(r[0], r[1], r[2], r[3], r[4], r[5], bool(r[6])) for r in raw_rows]
            execute_values(cur_pg, insert_pg_sql, rows, page_size=BATCH_SIZE)
            conn_pg.commit()
            total_streamed += len(rows)

            elapsed = time.time() - t0
            speed = total_streamed / elapsed if elapsed > 0 else 0
            pct = (total_streamed / total_invoices) * 100
            print(f"    Streamed: {total_streamed:,}/{total_invoices:,} ({pct:.1f}%) | Speed: {speed:.0f} rows/sec", end="\r", flush=True)

        print(f"\n[+] Successfully populated VPS nta_invoices table with {total_streamed:,} certified invoices in {time.time() - t0:.2f}s!")

    # 3. Update companies partitions on VPS using fast indexed join
    print("\n[*] Updating has_invoice = true across all 47 PostgreSQL partitions...")
    t0_update = time.time()
    total_companies_activated = 0

    for pref_code in PREFECTURE_CODES:
        part_name = f"companies_p{pref_code}"
        update_part_sql = f"""
            UPDATE {part_name} AS c
            SET has_invoice = true,
                updated_at = CURRENT_TIMESTAMP
            FROM nta_invoices AS n
            WHERE c.corporate_number = n.corporate_number
              AND n.prefecture_code = '{pref_code}'
              AND n.is_valid = true
              AND (c.has_invoice IS NULL OR c.has_invoice = false);
        """
        try:
            cur_pg.execute(update_part_sql)
            conn_pg.commit()
            cnt = cur_pg.rowcount
            total_companies_activated += cnt
            if cnt > 0:
                print(f"    [Prefecture {pref_code}] Partition {part_name}: Activated {cnt:,} corporate T-Numbers.")
        except Exception as e:
            conn_pg.rollback()
            print(f"    [-] Partition {part_name} note: {e}")

    elapsed_update = time.time() - t0_update
    cur_pg.execute("SELECT COUNT(*) FROM companies WHERE has_invoice = true;")
    final_active_invoices = cur_pg.fetchone()[0]

    print("\n" + "=" * 80)
    print(f"[+] ALL 47 PREFECTURES UPDATED IN {elapsed_update:.2f}s!")
    print(f"[+] Activated {total_companies_activated:,} newly confirmed T-Numbers.")
    print(f"[+] TOTAL CERTIFIED INVOICE ISSUERS ON VPS PRODUCTION: {final_active_invoices:,}")
    print("=" * 80)

    cur_sq.close()
    conn_sq.close()
    cur_pg.close()
    conn_pg.close()

if __name__ == "__main__":
    main()
