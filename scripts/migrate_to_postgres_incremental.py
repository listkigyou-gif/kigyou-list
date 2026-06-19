#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Incremental PostgreSQL Synchronizer
================================================
Queries the local SQLite database for records updated after a specific threshold
(or loads it from G-Biz sync state) and synchronizes only those records, signals,
and financial records to PostgreSQL. Recalculated stats tables are copied in full.
"""

import os
import sys
import json
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import argparse
import time
from datetime import datetime, timedelta, timezone

# Reconfigure stdout to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SQLITE_DB = "kigyou-list.db"
STATE_FILE = "importdata/gbiz-data/gbiz_sync_state.json"

# Retrieve PostgreSQL URL from environment or .env/env.local files
def get_postgres_url():
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url

    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    return None

def get_threshold_time(hours_fallback=24):
    """Load the last sync date and time from the G-Biz state file and convert to UTC."""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                state = json.load(f)
                updated_at_str = state.get("updated_at")
                if updated_at_str:
                    # gbiz_sync_state.json has updated_at in local timezone
                    local_dt = datetime.strptime(updated_at_str, "%Y-%m-%d %H:%M:%S")
                    # Convert naive local datetime to timezone-aware local datetime, then to UTC
                    local_dt = local_dt.astimezone() 
                    utc_dt = local_dt.astimezone(timezone.utc)
                    # Subtract 1 hour for safe margin overlap
                    utc_dt = utc_dt - timedelta(hours=1)
                    return utc_dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception as e:
            print(f"[~] Warning reading state file: {e}")
            
    # Fallback to current UTC time minus fallback hours
    threshold = datetime.now(timezone.utc) - timedelta(hours=hours_fallback)
    return threshold.strftime("%Y-%m-%d %H:%M:%S")

def main():
    parser = argparse.ArgumentParser(description="Incremental SQLite to PostgreSQL Synchronizer")
    parser.add_argument("--since", type=str, default=None, 
                        help="Threshold timestamp (UTC YYYY-MM-DD HH:MM:SS) to sync records since.")
    parser.add_argument("--hours", type=int, default=24,
                        help="Fallback hours if state file is missing or invalid.")
    parser.add_argument("--force-full-stats", action="store_true", default=True,
                        help="Force complete copying of stats tables (prefecture_counts, database_stats, etc.)")
    args = parser.parse_args()

    pg_url = get_postgres_url()
    if not pg_url:
        print("[-] Error: DATABASE_URL not found in environment, .env, or .env.local")
        sys.exit(1)

    threshold_time = args.since
    if not threshold_time:
        threshold_time = get_threshold_time(args.hours)

    print("=" * 60)
    print("      INCREMENTAL POSTGRESQL SYNCHRONIZER START")
    print("=" * 60)
    print(f"[*] Syncing records updated since (UTC): {threshold_time}")
    
    t_start = time.time()

    # 1. Connect databases
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
        print(f"[-] Failed to connect to PostgreSQL: {e}")
        lite_conn.close()
        sys.exit(1)

    try:
        # 2. Get list of updated corporate numbers from SQLite
        print("[*] Fetching updated companies from SQLite...")
        lite_cur.execute(
            "SELECT corporate_number FROM companies WHERE updated_at >= ?", 
            (threshold_time,)
        )
        updated_corps = [row[0] for row in lite_cur.fetchall()]
        
        if not updated_corps:
            print("[+] No updated companies found in SQLite since threshold. Checking stats tables...")
        else:
            print(f"[+] Found {len(updated_corps)} updated companies in SQLite.")
            
            # Divide into chunks for SQL query limits (Postgres parameterized query max is ~65535, 
            # and delete list shouldn't be too long).
            chunk_size = 1000
            for i in range(0, len(updated_corps), chunk_size):
                corps_chunk = updated_corps[i:i + chunk_size]
                
                # Fetch details from SQLite
                placeholders = ",".join(["?"] * len(corps_chunk))
                companies_query = f"""
                    SELECT 
                        corporate_number, company_name, company_name_kana, company_name_en, postal_code,
                        prefecture_code, prefecture_name, city_name, street_address, full_address,
                        representative_name, representative_position, establishment_date, capital_amount,
                        employee_count, sales_amount, phone_number, fax_number, website_url, email_address,
                        business_summary, status, created_at, updated_at, jigyo_shumoku, branch_phone_numbers,
                        yahoo_last_crawled_at, website_last_crawled_at, website_crawl_status, last_deep_tagged_at,
                        is_detailed
                    FROM companies
                    WHERE corporate_number IN ({placeholders})
                """
                lite_cur.execute(companies_query, corps_chunk)
                companies_rows = lite_cur.fetchall()
                
                # Clean up rows (prefecture mapping, null conversion)
                cleaned_companies = []
                for row in companies_rows:
                    r = list(row)
                    # Null conversions for numeric fields
                    for idx in [13, 14, 15]: # capital_amount, employee_count, sales_amount
                        if r[idx] == "" or r[idx] == "None" or r[idx] is None:
                            r[idx] = None
                    # Prefecture cleaning (default to '00' if null/empty)
                    if r[5] is None or r[5] == "" or r[5] == "None":
                        r[5] = "00"
                    if r[6] is None or r[6] == "" or r[6] == "None":
                        r[6] = "未登録"
                    # Boolean mapping for is_detailed (SQLite integer to Postgres boolean)
                    r[30] = bool(r[30]) if r[30] is not None else False
                    cleaned_companies.append(r)
                
                # Upsert into PostgreSQL
                # In partitioned Postgres table, we conflict on (prefecture_code, corporate_number)
                upsert_companies_sql = """
                    INSERT INTO companies (
                        corporate_number, company_name, company_name_kana, company_name_en, postal_code,
                        prefecture_code, prefecture_name, city_name, street_address, full_address,
                        representative_name, representative_position, establishment_date, capital_amount,
                        employee_count, sales_amount, phone_number, fax_number, website_url, email_address,
                        business_summary, status, created_at, updated_at, jigyo_shumoku, branch_phone_numbers,
                        yahoo_last_crawled_at, website_last_crawled_at, website_crawl_status, last_deep_tagged_at,
                        is_detailed
                    ) VALUES %s
                    ON CONFLICT (prefecture_code, corporate_number) DO UPDATE SET
                        company_name = EXCLUDED.company_name,
                        company_name_kana = EXCLUDED.company_name_kana,
                        company_name_en = EXCLUDED.company_name_en,
                        postal_code = EXCLUDED.postal_code,
                        prefecture_name = EXCLUDED.prefecture_name,
                        city_name = EXCLUDED.city_name,
                        street_address = EXCLUDED.street_address,
                        full_address = EXCLUDED.full_address,
                        representative_name = EXCLUDED.representative_name,
                        representative_position = EXCLUDED.representative_position,
                        establishment_date = EXCLUDED.establishment_date,
                        capital_amount = EXCLUDED.capital_amount,
                        employee_count = EXCLUDED.employee_count,
                        sales_amount = EXCLUDED.sales_amount,
                        phone_number = EXCLUDED.phone_number,
                        fax_number = EXCLUDED.fax_number,
                        website_url = EXCLUDED.website_url,
                        email_address = EXCLUDED.email_address,
                        business_summary = EXCLUDED.business_summary,
                        status = EXCLUDED.status,
                        updated_at = EXCLUDED.updated_at,
                        jigyo_shumoku = EXCLUDED.jigyo_shumoku,
                        branch_phone_numbers = EXCLUDED.branch_phone_numbers,
                        yahoo_last_crawled_at = EXCLUDED.yahoo_last_crawled_at,
                        website_last_crawled_at = EXCLUDED.website_last_crawled_at,
                        website_crawl_status = EXCLUDED.website_crawl_status,
                        last_deep_tagged_at = EXCLUDED.last_deep_tagged_at,
                        is_detailed = EXCLUDED.is_detailed
                    WHERE (
                        companies.company_name IS DISTINCT FROM EXCLUDED.company_name OR
                        companies.company_name_kana IS DISTINCT FROM EXCLUDED.company_name_kana OR
                        companies.company_name_en IS DISTINCT FROM EXCLUDED.company_name_en OR
                        companies.postal_code IS DISTINCT FROM EXCLUDED.postal_code OR
                        companies.prefecture_name IS DISTINCT FROM EXCLUDED.prefecture_name OR
                        companies.city_name IS DISTINCT FROM EXCLUDED.city_name OR
                        companies.street_address IS DISTINCT FROM EXCLUDED.street_address OR
                        companies.full_address IS DISTINCT FROM EXCLUDED.full_address OR
                        companies.representative_name IS DISTINCT FROM EXCLUDED.representative_name OR
                        companies.representative_position IS DISTINCT FROM EXCLUDED.representative_position OR
                        companies.establishment_date IS DISTINCT FROM EXCLUDED.establishment_date OR
                        companies.capital_amount IS DISTINCT FROM EXCLUDED.capital_amount OR
                        companies.employee_count IS DISTINCT FROM EXCLUDED.employee_count OR
                        companies.sales_amount IS DISTINCT FROM EXCLUDED.sales_amount OR
                        companies.phone_number IS DISTINCT FROM EXCLUDED.phone_number OR
                        companies.fax_number IS DISTINCT FROM EXCLUDED.fax_number OR
                        companies.website_url IS DISTINCT FROM EXCLUDED.website_url OR
                        companies.email_address IS DISTINCT FROM EXCLUDED.email_address OR
                        companies.business_summary IS DISTINCT FROM EXCLUDED.business_summary OR
                        companies.status IS DISTINCT FROM EXCLUDED.status OR
                        companies.jigyo_shumoku IS DISTINCT FROM EXCLUDED.jigyo_shumoku OR
                        companies.branch_phone_numbers IS DISTINCT FROM EXCLUDED.branch_phone_numbers OR
                        companies.yahoo_last_crawled_at IS DISTINCT FROM EXCLUDED.yahoo_last_crawled_at OR
                        companies.website_last_crawled_at IS DISTINCT FROM EXCLUDED.website_last_crawled_at OR
                        companies.website_crawl_status IS DISTINCT FROM EXCLUDED.website_crawl_status OR
                        companies.last_deep_tagged_at IS DISTINCT FROM EXCLUDED.last_deep_tagged_at OR
                        companies.is_detailed IS DISTINCT FROM EXCLUDED.is_detailed
                    );
                """
                execute_values(pg_cur, upsert_companies_sql, cleaned_companies)
                print(f"  [+] Synced {len(cleaned_companies)} companies to PostgreSQL.")

                # Sync company_industries
                # Fetch mappings from SQLite first
                lite_cur.execute(f"""
                    SELECT corporate_number, industry_code, industry_path, is_detailed, created_at 
                    FROM company_industries WHERE corporate_number IN ({placeholders})
                """, corps_chunk)
                ci_rows = lite_cur.fetchall()
                
                # Check existing mappings in PG for this chunk first to see if any delete is needed
                pg_placeholders = ",".join(["%s"] * len(corps_chunk))
                pg_cur.execute(f"SELECT DISTINCT corporate_number FROM company_industries WHERE corporate_number IN ({pg_placeholders})", corps_chunk)
                existing_pg_ci = [row[0] for row in pg_cur.fetchall()]
                
                if existing_pg_ci:
                    del_placeholders = ",".join(["%s"] * len(existing_pg_ci))
                    pg_cur.execute(f"DELETE FROM company_industries WHERE corporate_number IN ({del_placeholders})", existing_pg_ci)
                
                if ci_rows:
                    cleaned_ci = []
                    for row in ci_rows:
                        r = list(row)
                        r[3] = bool(r[3]) if r[3] is not None else False
                        cleaned_ci.append(r)
                        
                    insert_ci_sql = """
                        INSERT INTO company_industries (corporate_number, industry_code, industry_path, is_detailed, created_at)
                        VALUES %s
                        ON CONFLICT (corporate_number, industry_code) DO NOTHING;
                    """
                    execute_values(pg_cur, insert_ci_sql, cleaned_ci)
                    print(f"  [+] Synced {len(cleaned_ci)} industry mappings to PostgreSQL.")

                # Sync business_signals
                # Fetch signals from SQLite first
                lite_cur.execute(f"""
                    SELECT corporate_number, signal_type, signal_title, signal_date, source_url, details, created_at
                    FROM business_signals WHERE corporate_number IN ({placeholders})
                """, corps_chunk)
                signals_rows = lite_cur.fetchall()
                
                # Check existing signals in PG
                pg_cur.execute(f"SELECT DISTINCT corporate_number FROM business_signals WHERE corporate_number IN ({pg_placeholders})", corps_chunk)
                existing_pg_signals = [row[0] for row in pg_cur.fetchall()]
                
                if existing_pg_signals:
                    del_placeholders = ",".join(["%s"] * len(existing_pg_signals))
                    pg_cur.execute(f"DELETE FROM business_signals WHERE corporate_number IN ({del_placeholders})", existing_pg_signals)
                    print(f"  [-] Cleared signals for {len(existing_pg_signals)} companies.")
                
                if signals_rows:
                    insert_signals_sql = """
                        INSERT INTO business_signals (corporate_number, signal_type, signal_title, signal_date, source_url, details, created_at)
                        VALUES %s;
                    """
                    execute_values(pg_cur, insert_signals_sql, signals_rows)
                    print(f"  [+] Synced {len(signals_rows)} business signals to PostgreSQL.")

                # Sync financial_records
                # Fetch financials from SQLite first
                lite_cur.execute(f"""
                    SELECT 
                        corporate_number, fiscal_year, period_number, revenue, operating_income,
                        ordinary_income, net_income, capital, total_assets, net_assets,
                        liquid_assets, fixed_assets, liquid_liabilities, fixed_liabilities,
                        retained_earnings, shareholders_json, source_type, created_at
                    FROM financial_records WHERE corporate_number IN ({placeholders})
                """, corps_chunk)
                fin_rows = lite_cur.fetchall()
                
                # Check existing financials in PG
                pg_cur.execute(f"SELECT DISTINCT corporate_number FROM financial_records WHERE corporate_number IN ({pg_placeholders})", corps_chunk)
                existing_pg_fin = [row[0] for row in pg_cur.fetchall()]
                
                if existing_pg_fin:
                    del_placeholders = ",".join(["%s"] * len(existing_pg_fin))
                    pg_cur.execute(f"DELETE FROM financial_records WHERE corporate_number IN ({del_placeholders})", existing_pg_fin)
                    print(f"  [-] Cleared financial records for {len(existing_pg_fin)} companies.")
                
                if fin_rows:
                    cleaned_fin = []
                    for row in fin_rows:
                        r = list(row)
                        # Clean up non-text numeric values
                        for idx in [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]:
                            if r[idx] == "" or r[idx] == "None" or r[idx] is None:
                                r[idx] = None
                        cleaned_fin.append(r)
                        
                    insert_fin_sql = """
                        INSERT INTO financial_records (
                            corporate_number, fiscal_year, period_number, revenue, operating_income,
                            ordinary_income, net_income, capital, total_assets, net_assets,
                            liquid_assets, fixed_assets, liquid_liabilities, fixed_liabilities,
                            retained_earnings, shareholders_json, source_type, created_at
                        ) VALUES %s;
                    """
                    execute_values(pg_cur, insert_fin_sql, cleaned_fin)
                    print(f"  [+] Synced {len(cleaned_fin)} financial records to PostgreSQL.")

                # Sync sitemap_companies
                # Fetch sitemaps from SQLite first
                lite_cur.execute(f"""
                    SELECT corporate_number, updated_at, employee_count 
                    FROM sitemap_companies WHERE corporate_number IN ({placeholders})
                """, corps_chunk)
                sitemap_rows = lite_cur.fetchall()
                
                # Check existing sitemaps in PG
                pg_cur.execute(f"SELECT DISTINCT corporate_number FROM sitemap_companies WHERE corporate_number IN ({pg_placeholders})", corps_chunk)
                existing_pg_sitemap = [row[0] for row in pg_cur.fetchall()]
                
                if existing_pg_sitemap:
                    del_placeholders = ",".join(["%s"] * len(existing_pg_sitemap))
                    pg_cur.execute(f"DELETE FROM sitemap_companies WHERE corporate_number IN ({del_placeholders})", existing_pg_sitemap)
                
                if sitemap_rows:
                    insert_sitemap_sql = """
                        INSERT INTO sitemap_companies (corporate_number, updated_at, employee_count)
                        VALUES %s;
                    """
                    execute_values(pg_cur, insert_sitemap_sql, sitemap_rows)
                    print(f"  [+] Synced {len(sitemap_rows)} sitemap records to PostgreSQL.")

                # Commit transaction once for the entire chunk
                pg_conn.commit()

        # 3. Synchronize full stats tables if requested
        if args.force_full_stats:
            print("[*] Re-syncing metadata stats tables from SQLite in full...")
            
            # Table 1: prefecture_counts
            pg_cur.execute("TRUNCATE TABLE prefecture_counts CASCADE;")
            lite_cur.execute("SELECT prefecture_code, prefecture_name, company_count FROM prefecture_counts")
            rows = lite_cur.fetchall()
            if rows:
                execute_values(pg_cur, "INSERT INTO prefecture_counts (prefecture_code, prefecture_name, company_count) VALUES %s;", rows)
            print("  [+] Synced prefecture_counts.")

            # Table 2: city_counts
            pg_cur.execute("TRUNCATE TABLE city_counts CASCADE;")
            lite_cur.execute("SELECT prefecture_code, city_name, company_count FROM city_counts")
            rows = lite_cur.fetchall()
            if rows:
                execute_values(pg_cur, "INSERT INTO city_counts (prefecture_code, city_name, company_count) VALUES %s;", rows)
            print("  [+] Synced city_counts.")

            # Table 3: industry_counts
            pg_cur.execute("TRUNCATE TABLE industry_counts CASCADE;")
            lite_cur.execute("SELECT industry_code, industry_name, company_count FROM industry_counts")
            rows = lite_cur.fetchall()
            if rows:
                execute_values(pg_cur, "INSERT INTO industry_counts (industry_code, industry_name, company_count) VALUES %s;", rows)
            print("  [+] Synced industry_counts.")

            # Table 4: database_stats
            pg_cur.execute("TRUNCATE TABLE database_stats CASCADE;")
            lite_cur.execute("SELECT stat_key, stat_value FROM database_stats")
            rows = lite_cur.fetchall()
            if rows:
                execute_values(pg_cur, "INSERT INTO database_stats (stat_key, stat_value) VALUES %s;", rows)
            print("  [+] Synced database_stats.")
            
            pg_conn.commit()
            print("[+] Stats tables synchronization completed successfully.")

        duration = time.time() - t_start
        print("=" * 60)
        print(f"[🎉] SUCCESS! Incremental sync completed in {duration:.2f} seconds!")
        print("=" * 60)

    except Exception as e:
        pg_conn.rollback()
        import traceback
        print("\n[-] Incremental migration failed with error:")
        traceback.print_exc()
        sys.exit(1)
    finally:
        lite_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    main()
