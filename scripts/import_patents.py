#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: specialized patent/trademark/design CSV importer
==============================================================
Imports patent data from importdata/gbiz-data/sogo-data/Tokkyojoho_UTF-8.csv
into the business_signals table.

CSV size is ~1.75GB, containing ~4.6M records.
The script processes rows in a memory-efficient stream, filters using an 
in-memory set of existing companies in the database to prevent orphaned records, 
and imports in optimized batches using transactions.

Console outputs are written in ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import sys
import re
import csv
import json
import time
import sqlite3
import argparse

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = "kigyou-list.db"
CSV_PATH = "importdata/gbiz-data/sogo-data/Tokkyojoho_UTF-8.csv"

# Target organization types (digits 6-7 of corporate number)
TARGET_CORP_TYPES = {"01", "02", "05"}

def parse_date_safe(date_str):
    if not date_str:
        return None
    date_str = str(date_str).strip()
    m = re.match(r"^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})", date_str)
    if m:
        return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    return date_str[:10] if len(date_str) >= 10 else date_str

def is_target_corp(corp_num):
    if not corp_num or len(corp_num) != 13:
        return False
    return corp_num[5:7] in TARGET_CORP_TYPES

def load_existing_companies(conn):
    """Load all existing corporate numbers from companies table into a set."""
    print("[*] Loading existing corporate numbers from companies table...")
    t0 = time.time()
    cursor = conn.cursor()
    cursor.execute("SELECT corporate_number FROM companies")
    # Fetchall is faster than iterating for simple columns
    corps = set(row[0] for row in cursor.fetchall())
    print(f"[+] Loaded {len(corps)} corporate numbers in {time.time() - t0:.1f}s")
    return corps

def main():
    parser = argparse.ArgumentParser(description="Kigyou-list Patent CSV Importer")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of records to import")
    parser.add_argument("--batch-size", type=int, default=20000, help="SQLite batch insert size")
    parser.add_argument("--dry-run", action="store_true", help="Parse CSV without writing to database")
    parser.add_argument("--skip-filter", action="store_true", help="Do not check if company exists in companies table")
    args = parser.parse_args()

    print("=" * 70)
    print("   SPECIALIZED PATENT (特許/意匠/商標) BULK IMPORTER")
    print("=" * 70)
    print(f"[*] CSV file: {CSV_PATH}")
    print(f"[*] DB file:  {DB_PATH}")
    print(f"[*] Batch size: {args.batch_size}")
    if args.limit:
        print(f"[*] Limit: {args.limit} records")
    if args.dry_run:
        print("[!] DRY RUN MODE - No database changes will be saved")
    if args.skip_filter:
        print("[!] SKIP FILTER MODE - Importing all rows matching target corp types")

    if not os.path.exists(CSV_PATH):
        print(f"[-] Error: CSV file not found at {CSV_PATH}")
        sys.exit(1)

    t_start = time.time()

    # Open DB connection
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA cache_size=-2000000;")  # ~2GB page cache if needed
    conn.execute("PRAGMA foreign_keys = OFF;")

    # Load existing companies if filtering is enabled
    existing_corps = set()
    if not args.skip_filter and not args.dry_run:
        existing_corps = load_existing_companies(conn)

    print("[*] Starting CSV parsing and import...")
    insert_sql = """
        INSERT OR IGNORE INTO business_signals (
            corporate_number, signal_type, signal_title, signal_date,
            amount, government_departments, source_key, source_url, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    cursor = conn.cursor()
    batch = []
    
    total_processed = 0
    imported_count = 0
    skipped_non_target = 0
    skipped_non_existent = 0
    
    t_prev = time.time()

    # We determine total file size for progress estimation
    file_size = os.path.getsize(CSV_PATH)
    bytes_read = 0

    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            print("[-] Error: CSV file is empty")
            return

        for row in reader:
            total_processed += 1
            
            # Simple estimate of bytes read for progress percentage
            # Join row with commas plus newline representation
            bytes_read += len(",".join(row)) + 2 

            if len(row) < 16:
                continue

            corp_num = row[0].strip()
            
            # 1. Filter by target corp type (01, 02, 05)
            if not is_target_corp(corp_num):
                skipped_non_target += 1
                continue

            # 2. Filter by existing company
            if not args.skip_filter and not args.dry_run and corp_num not in existing_corps:
                skipped_non_existent += 1
                continue

            # Parse columns
            patent_type = row[3].strip() or "特許"
            reg_num = row[4].strip()
            signal_date = parse_date_safe(row[5])
            title = row[13].strip() or patent_type
            source_url = row[14].strip() or None
            source_key = row[15].strip()
            
            if not source_key:
                source_key = f"{corp_num}_特許_{signal_date}_{title[:30]}"
                
            gov = row[17].strip() or "特許庁"

            # Parse specialized details based on type
            details = {
                "patent_type": patent_type,
                "registration_number": reg_num,
                "data_quality": row[16].strip() or None,
                "acquisition_date": row[19].strip() or None,
                "update_date": row[20].strip() or None
            }

            if patent_type == "特許":
                details["fi_code"] = row[6].strip() or None
                details["fi_name"] = row[7].strip() or None
                details["f_term"] = row[8].strip() or None
            elif patent_type == "意匠":
                details["design_code"] = row[9].strip() or None
                details["design_name"] = row[10].strip() or None
            elif patent_type == "商標":
                details["trademark_code"] = row[11].strip() or None
                details["trademark_name"] = row[12].strip() or None

            # Filter empty values from details dict
            details = {k: v for k, v in details.items() if v is not None}
            details_json = json.dumps(details, ensure_ascii=False) if details else None

            # Add to batch (signals table maps patent/design/trademark under '特許' type)
            batch.append((
                corp_num, "特許", title, signal_date,
                None, gov, source_key, source_url, details_json
            ))
            imported_count += 1

            # Commit batch
            if len(batch) >= args.batch_size:
                if not args.dry_run:
                    cursor.executemany(insert_sql, batch)
                    conn.commit()
                batch = []

            # Print status every 100,000 rows
            if total_processed % 100000 == 0:
                t_now = time.time()
                elapsed = t_now - t_start
                chunk_time = t_now - t_prev
                t_prev = t_now
                
                # Calculate speed and progress
                speed = 100000 / chunk_time if chunk_time > 0 else 0
                pct = (bytes_read / file_size) * 100
                
                # Estimate remaining time
                remaining_bytes = file_size - bytes_read
                bytes_per_sec = bytes_read / elapsed if elapsed > 0 else 1
                eta_sec = remaining_bytes / bytes_per_sec
                eta_min = eta_sec / 60
                
                print(
                    f"Processed {total_processed:,} rows ({pct:.1f}%) | "
                    f"Imported: {imported_count:,} | "
                    f"Skipped (Non-Target: {skipped_non_target:,}, Non-Existent: {skipped_non_existent:,}) | "
                    f"Speed: {speed:.0f} rows/s | Elapsed: {elapsed/60:.1f}m | ETA: {eta_min:.1f}m"
                )

            if args.limit and imported_count >= args.limit:
                print(f"[*] Hit import limit of {args.limit} records. Stopping.")
                break

        # Commit remaining records
        if batch:
            if not args.dry_run:
                cursor.executemany(insert_sql, batch)
                conn.commit()
            print(f"[+] Final batch committed: {len(batch)} records.")

    conn.close()
    
    t_end = time.time()
    duration = t_end - t_start
    print("\n" + "=" * 70)
    print("   IMPORT PROCESS COMPLETED")
    print("=" * 70)
    print(f"[*] Status:          {'Dry Run (No changes saved)' if args.dry_run else 'SUCCESS'}")
    print(f"[*] Total processed: {total_processed:,} rows")
    print(f"[*] Imported:        {imported_count:,} records")
    print(f"[*] Skipped:         {(skipped_non_target + skipped_non_existent):,} rows")
    print(f"    - Non-target:    {skipped_non_target:,}")
    print(f"    - Non-existent:  {skipped_non_existent:,}")
    print(f"[*] Time elapsed:    {duration/60:.1f} minutes ({duration:.1f} seconds)")
    print(f"[*] Average speed:   {total_processed/duration:.0f} rows/second")
    print("=" * 70)

if __name__ == "__main__":
    main()
