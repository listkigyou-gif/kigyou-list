#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Production Pass 2 & Metadata Synchronizer
======================================================
Synchronizes website crawl updates (contact_form_url, email_address,
email_type, website_url, website_crawl_status) directly into PostgreSQL
partition-by-partition for maximum throughput (~1,200+ rows/sec).
Also updates all 5 metadata stats tables.
"""

import os
import sys
import time
import io
import csv
import sqlite3
import psycopg2
from psycopg2.extras import execute_values

try:
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

SQLITE_DB = "kigyou-list.db"
DEFAULT_PG_URL = "postgresql://postgres:Hrptlcct6789%40@127.0.0.1:5432/kigyou_list"

def get_postgres_url():
    return os.environ.get("DATABASE_URL", DEFAULT_PG_URL)

def main():
    pg_url = get_postgres_url()
    print("=" * 65)
    print("      PRODUCTION PASS 2 & METADATA POSTGRESQL SYNCHRONIZER")
    print("=" * 65)
    print(f"[*] Connecting to SQLite: {SQLITE_DB}...")
    lite_conn = sqlite3.connect(SQLITE_DB)
    lite_cur = lite_conn.cursor()

    print("[*] Connecting to PostgreSQL...")
    try:
        pg_conn = psycopg2.connect(
            pg_url,
            keepalives=1,
            keepalives_idle=30,
            keepalives_interval=10,
            keepalives_count=5
        )
        pg_cur = pg_conn.cursor()
    except Exception as e:
        print(f"[-] Connection failed: {e}")
        lite_conn.close()
        sys.exit(1)

    t_start = time.time()
    total_synced_rows = 0

    try:
        print("\n" + "-" * 65)
        print(" PHASE 1: PARTITION-BY-PARTITION CRAWLER DATA SYNCHRONIZATION")
        print("-" * 65)

        for pref_num in range(1, 48):
            pref_code = f"{pref_num:02d}"
            part_table = f"companies_p{pref_code}"
            t_pref_start = time.time()

            # Query updates for this prefecture
            lite_cur.execute("""
                SELECT corporate_number, website_url, email_address, contact_form_url, 
                       email_type, website_crawl_status, website_last_crawled_at, updated_at
                FROM companies 
                WHERE prefecture_code = ?
                  AND (contact_form_url IS NOT NULL OR website_last_crawled_at >= '2026-10-06')
            """, (pref_code,))
            rows = lite_cur.fetchall()

            if not rows:
                print(f"  [{pref_code}/47] {part_table}: 0 updates. Skipped.")
                continue

            # Create unlogged temp table
            tmp_table = f"tmp_pref_{pref_code}"
            pg_cur.execute(f"""
                CREATE TEMP TABLE {tmp_table} (
                    corporate_number varchar(50) PRIMARY KEY,
                    website_url text,
                    email_address text,
                    contact_form_url text,
                    email_type text,
                    website_crawl_status text,
                    website_last_crawled_at text,
                    updated_at text
                ) ON COMMIT DROP;
            """)

            # Format buffer for CSV COPY
            s_buf = io.StringIO()
            writer = csv.writer(s_buf, delimiter=',', quoting=csv.QUOTE_MINIMAL)
            for r in rows:
                corp_num = r[0].strip() if r[0] else ''
                web_url = r[1].strip().replace('\r', '').replace('\n', '') if r[1] else ''
                email = r[2].strip().replace('\r', '').replace('\n', '') if r[2] else ''
                form_url = r[3].strip().replace('\r', '').replace('\n', '') if r[3] else ''
                email_t = r[4].strip().replace('\r', '').replace('\n', '') if r[4] else ''
                crawl_st = r[5].strip().replace('\r', '').replace('\n', '') if r[5] else ''
                last_crawled = r[6].strip() if r[6] else ''
                upd_at = r[7].strip() if r[7] else ''

                writer.writerow([
                    corp_num,
                    web_url if web_url else None,
                    email if email else None,
                    form_url if form_url else None,
                    email_t if email_t else None,
                    crawl_st if crawl_st else None,
                    last_crawled if last_crawled else None,
                    upd_at if upd_at else None
                ])
            s_buf.seek(0)

            # COPY CSV into temp table
            copy_sql = f"""
                COPY {tmp_table} (
                    corporate_number, website_url, email_address, 
                    contact_form_url, email_type, website_crawl_status, 
                    website_last_crawled_at, updated_at
                ) FROM STDIN WITH (FORMAT CSV, NULL '');
            """
            pg_cur.copy_expert(copy_sql, s_buf)

            # UPDATE directly on the partition
            update_sql = f"""
                UPDATE {part_table} c
                SET 
                    website_url = t.website_url,
                    email_address = t.email_address,
                    contact_form_url = t.contact_form_url,
                    email_type = t.email_type,
                    website_crawl_status = t.website_crawl_status,
                    website_last_crawled_at = t.website_last_crawled_at,
                    updated_at = t.updated_at::timestamp
                FROM {tmp_table} t
                WHERE c.corporate_number = t.corporate_number;
            """
            pg_cur.execute(update_sql)
            affected = pg_cur.rowcount
            pg_conn.commit()

            total_synced_rows += affected
            elapsed = time.time() - t_pref_start
            speed = affected / elapsed if elapsed > 0 else 0
            print(f"  [{pref_code}/47] {part_table}: updated {affected:,} / {len(rows):,} rows in {elapsed:.2f}s ({speed:.0f} rows/s)")

        print(f"\n[✓] Phase 1 completed! Total records updated across partitions: {total_synced_rows:,}")

        print("\n" + "-" * 65)
        print(" PHASE 2: METADATA & STATS TABLES RE-SYNCHRONIZATION")
        print("-" * 65)

        # 1. prefecture_counts
        t_sub = time.time()
        pg_cur.execute("TRUNCATE TABLE prefecture_counts CASCADE;")
        lite_cur.execute("SELECT prefecture_code, prefecture_name, company_count FROM prefecture_counts")
        p_rows = lite_cur.fetchall()
        if p_rows:
            execute_values(pg_cur, "INSERT INTO prefecture_counts (prefecture_code, prefecture_name, company_count) VALUES %s;", p_rows)
        print(f"  [+] prefecture_counts synced ({len(p_rows)} rows in {time.time()-t_sub:.2f}s)")

        # 2. city_counts
        t_sub = time.time()
        pg_cur.execute("TRUNCATE TABLE city_counts CASCADE;")
        lite_cur.execute("SELECT prefecture_code, city_name, company_count FROM city_counts")
        c_rows = lite_cur.fetchall()
        if c_rows:
            execute_values(pg_cur, "INSERT INTO city_counts (prefecture_code, city_name, company_count) VALUES %s;", c_rows)
        print(f"  [+] city_counts synced ({len(c_rows)} rows in {time.time()-t_sub:.2f}s)")

        # 3. industry_counts
        t_sub = time.time()
        pg_cur.execute("TRUNCATE TABLE industry_counts CASCADE;")
        lite_cur.execute("SELECT industry_code, industry_name, company_count FROM industry_counts")
        i_rows = lite_cur.fetchall()
        if i_rows:
            execute_values(pg_cur, "INSERT INTO industry_counts (industry_code, industry_name, company_count) VALUES %s;", i_rows)
        print(f"  [+] industry_counts synced ({len(i_rows)} rows in {time.time()-t_sub:.2f}s)")

        # 4. database_stats
        t_sub = time.time()
        pg_cur.execute("TRUNCATE TABLE database_stats CASCADE;")
        lite_cur.execute("SELECT stat_key, stat_value FROM database_stats")
        d_rows = lite_cur.fetchall()
        if d_rows:
            execute_values(pg_cur, "INSERT INTO database_stats (stat_key, stat_value) VALUES %s;", d_rows)
        print(f"  [+] database_stats synced ({len(d_rows)} keys in {time.time()-t_sub:.2f}s)")

        # 5. industry_prefecture_pairs
        t_sub = time.time()
        pg_cur.execute("TRUNCATE TABLE industry_prefecture_pairs CASCADE;")
        lite_cur.execute("SELECT industry_code, prefecture_code FROM industry_prefecture_pairs")
        ip_rows = lite_cur.fetchall()
        if ip_rows:
            execute_values(pg_cur, "INSERT INTO industry_prefecture_pairs (industry_code, prefecture_code) VALUES %s;", ip_rows)
        print(f"  [+] industry_prefecture_pairs synced ({len(ip_rows)} pairs in {time.time()-t_sub:.2f}s)")

        pg_conn.commit()
        print("[✓] Phase 2 completed!")

        print("\n" + "-" * 65)
        print(" PHASE 3: FINAL PRODUCTION DATABASE VERIFICATION")
        print("-" * 65)

        pg_cur.execute("SELECT COUNT(*) FROM companies WHERE contact_form_url IS NOT NULL AND contact_form_url != '';")
        pg_contacts = pg_cur.fetchone()[0]

        pg_cur.execute("SELECT COUNT(*) FROM companies WHERE email_address IS NOT NULL AND email_address != '';")
        pg_emails = pg_cur.fetchone()[0]

        pg_cur.execute("SELECT COUNT(*) FROM companies WHERE website_url IS NOT NULL AND website_url != '';")
        pg_websites = pg_cur.fetchone()[0]

        pg_cur.execute("SELECT COUNT(*) FROM database_stats;")
        pg_stat_keys = pg_cur.fetchone()[0]

        print(f"  [★] Total contact_form_url in Production: {pg_contacts:,}")
        print(f"  [★] Total email_address in Production:    {pg_emails:,}")
        print(f"  [★] Total website_url in Production:      {pg_websites:,}")
        print(f"  [★] Total database_stats keys:            {pg_stat_keys}")

        total_time = time.time() - t_start
        print("\n" + "=" * 65)
        print(f" [🎉] FULL SYNC COMPLETED SUCCESSFULLY IN {total_time:.2f} SECONDS ({total_time/60:.2f} MIN)!")
        print("=" * 65)

    except Exception as e:
        pg_conn.rollback()
        import traceback
        print("\n[-] Synchronization failed with error:")
        traceback.print_exc()
        sys.exit(1)
    finally:
        lite_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    main()
