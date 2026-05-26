#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: HelloWork Crawler DB Migration Script
==================================================
Migrates, denormalizes, and backs up crawled records from hellowork.db
into the raw_hellowork staging table of kigyou-list.db.
Supports high-speed batch transfers and idempotent insert-or-ignore.
"""

import os
import sys
import sqlite3
import time

# Resolve absolute paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DB = os.path.join(CURRENT_DIR, "data", "hellowork.db")
DEST_DB = os.path.join(CURRENT_DIR, "..", "..", "kigyou-list.db")

BATCH_SIZE = 10000

def main():
    print("="*60)
    print("      HELLOWORK DATABASE MIGRATION & BACKUP UTILITY")
    print("="*60)
    
    if not os.path.exists(SRC_DB):
        print(f"[-] Source database not found at: {SRC_DB}")
        print("    Please ensure you have copied the database file to crawlers/hellowork/data/hellowork.db")
        sys.exit(1)
        
    if not os.path.exists(DEST_DB):
        print(f"[-] Destination database not found at: {DEST_DB}")
        sys.exit(1)

    print(f"[*] Source Database: {SRC_DB}")
    print(f"[*] Destination Database: {DEST_DB}")

    # Establish connections
    src_conn = sqlite3.connect(SRC_DB)
    src_cur = src_conn.cursor()

    dest_conn = sqlite3.connect(DEST_DB)
    dest_cur = dest_conn.cursor()

    # Step 1: Create a unique index on raw_hellowork(job_number) to allow fast and idempotent merge
    print("[*] Creating unique index on destination table for idempotent integration...")
    try:
        dest_cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_hellowork_job_number ON raw_hellowork(job_number);")
        dest_conn.commit()
    except Exception as e:
        print(f"[-] Could not create index on destination: {e}")
        # Proceed anyway

    # Step 2: Query total row counts from source
    print("[*] Checking source records count...")
    try:
        total_jobs = src_cur.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        total_companies = src_cur.execute("SELECT COUNT(*) FROM companies").fetchone()[0]
        print(f"[+] Found {total_jobs:,} jobs and {total_companies:,} companies in source database.")
    except Exception as e:
        print(f"[-] Failed to read source database tables: {e}")
        src_conn.close()
        dest_conn.close()
        sys.exit(1)

    # Step 3: Run the JOIN migration query in batches
    print("\n[*] Starting batch transfer process...")
    start_time = time.time()
    
    query = """
        SELECT
            j.job_id AS job_number,
            j.reception_date,
            j.job_title,
            c.company_name AS office_name,
            j.corporate_number,
            c.representative_name,
            j.employment_type AS employment_status,
            j.salary_remarks AS wages,
            j.work_location,
            j.working_hours AS work_hours,
            j.holiday_remarks AS holidays,
            j.job_content AS job_description,
            j.requirements AS required_experience,
            j.contact_person,
            c.phone_number,
            c.fax_number,
            c.email AS email_address,
            c.address AS office_address,
            c.website AS website_url,
            c.industry_name AS industry,
            c.capital AS capital_amount,
            c.employee_count_total AS total_employees,
            c.employee_count_workplace AS location_employees,
            c.employee_count_female AS female_employees,
            c.employee_count_part_time AS parttime_employees,
            c.established_year AS establishment_year,
            j.discovered_at AS scraped_at
        FROM jobs j
        LEFT JOIN companies c ON j.corporate_number = c.corporate_number
    """
    
    try:
        src_cur.execute(query)
    except Exception as e:
        print(f"[-] Failed to execute source JOIN query: {e}")
        src_conn.close()
        dest_conn.close()
        sys.exit(1)

    inserted_count = 0
    ignored_count = 0
    total_processed = 0

    insert_sql = """
        INSERT OR IGNORE INTO raw_hellowork (
            job_number, receipt_date, job_title, office_name, corporate_number,
            representative_name, employment_status, wages, work_location, work_hours,
            holidays, job_description, required_experience, contact_person, phone_number,
            fax_number, email_address, office_address, website_url, industry,
            capital_amount, total_employees, location_employees, female_employees, parttime_employees,
            establishment_year, scraped_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?
        )
    """

    while True:
        rows = src_cur.fetchmany(BATCH_SIZE)
        if not rows:
            break
            
        total_processed += len(rows)
        
        # Insert chunk in transaction
        dest_cur.execute("BEGIN TRANSACTION;")
        try:
            # We track rows affected via total changes
            before_changes = dest_conn.total_changes
            dest_cur.executemany(insert_sql, rows)
            after_changes = dest_conn.total_changes
            
            chunk_inserted = after_changes - before_changes
            chunk_ignored = len(rows) - chunk_inserted
            
            inserted_count += chunk_inserted
            ignored_count += chunk_ignored
            
            dest_cur.execute("COMMIT;")
        except Exception as e:
            dest_cur.execute("ROLLBACK;")
            print(f"\n[-] Error during batch insert: {e}")
            break
            
        # Log progress
        elapsed = time.time() - start_time
        speed = total_processed / elapsed if elapsed > 0 else 0
        pct = (total_processed / total_jobs) * 100 if total_jobs > 0 else 100
        print(f"    Processed: {total_processed:,}/{total_jobs:,} ({pct:.1f}%) | "
              f"New: {inserted_count:,} | Duplicates skipped: {ignored_count:,} | "
              f"Speed: {speed:.0f} rows/sec", end="\r")

    end_time = time.time()
    total_elapsed = end_time - start_time
    print("\n" + "="*60)
    print("      MIGRATION RUN COMPLETED SUCCESSFULLY!")
    print("="*60)
    print(f"[*] Total Records Processed: {total_processed:,}")
    print(f"[+] Total New Records Saved:  {inserted_count:,}")
    print(f"[~] Total Duplicates Skipped: {ignored_count:,}")
    print(f"[*] Total Time Elapsed:       {total_elapsed:.2f} seconds")
    if total_elapsed > 0:
        print(f"[*] Average Throughput:       {total_processed/total_elapsed:.0f} rows/sec")
    print("="*60)

    # Close databases
    src_conn.close()
    dest_conn.close()

if __name__ == "__main__":
    main()
