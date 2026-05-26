#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Yahoo Maps Crawler Staging Integrator
===================================================
Reads the crawled CSV results from Yahoo Map Searcher and nabs/inserts
them into the raw_yahoo staging table of kigyou-list.db.
Supports both companies_basic.csv and companies_final.csv.
"""

import os
import sys
import csv
import sqlite3

# Resolve absolute paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASIC_CSV = os.path.join(CURRENT_DIR, "data", "companies_basic.csv")
FINAL_CSV = os.path.join(CURRENT_DIR, "data", "companies_final.csv")
DEST_DB = os.path.join(CURRENT_DIR, "..", "..", "kigyou-list.db")

def main():
    print("="*60)
    print("      YAHOO CRAWLER STAGING DATA INTEGRATOR")
    print("="*60)
    
    # Check which CSV is available (Prefer Final because it has emails/faxes)
    csv_path = None
    if os.path.exists(FINAL_CSV):
        csv_path = FINAL_CSV
    elif os.path.exists(BASIC_CSV):
        csv_path = BASIC_CSV
    else:
        print("[-] No Yahoo Crawler output CSV found under crawlers/yahoo/data/.")
        print("    Please run the Yahoo Map Searcher first.")
        sys.exit(1)
        
    if not os.path.exists(DEST_DB):
        print(f"[-] Main database not found at: {DEST_DB}")
        sys.exit(1)

    print(f"[*] Reading Source CSV:   {csv_path}")
    print(f"[*] Target Database:      {DEST_DB}")

    # Connect to database
    conn = sqlite3.connect(DEST_DB)
    cur = conn.cursor()

    # Step 1: Create unique index to guarantee idempotency and avoid duplicate records
    print("[*] Ensuring unique index on raw_yahoo(corporate_number) for safe runs...")
    try:
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_yahoo_corp_num ON raw_yahoo(corporate_number);")
        conn.commit()
    except Exception as e:
        print(f"[-] Warning: could not verify index: {e}")

    # Step 2: Read CSV and prepare batch
    print("[*] Parsing CSV rows...")
    rows_to_insert = []
    
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            corp_num = (row.get("corp_num") or "").strip()
            name = (row.get("name") or "").strip()
            y_name = (row.get("y_name") or "").strip()
            y_address = (row.get("y_address") or "").strip()
            phone = (row.get("phone") or "").strip()
            website = (row.get("website") or "").strip()
            
            if not corp_num:
                continue
                
            rows_to_insert.append((
                corp_num,
                name,
                y_name,
                y_address,
                phone,
                website
            ))

    print(f"[+] Loaded {len(rows_to_insert):,} company rows from CSV.")
    if not rows_to_insert:
        print("[~] No valid corporate rows to insert.")
        conn.close()
        return

    # Step 3: Insert into raw_yahoo in a single transaction
    print("[*] Inserting rows into raw_yahoo table...")
    insert_sql = """
        INSERT OR REPLACE INTO raw_yahoo (
            corporate_number, company_name, yahoo_name, yahoo_address, phone_number, website_url, scraped_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """
    
    try:
        cur.execute("BEGIN TRANSACTION;")
        before_changes = conn.total_changes
        cur.executemany(insert_sql, rows_to_insert)
        after_changes = conn.total_changes
        
        inserted = after_changes - before_changes
        ignored = len(rows_to_insert) - inserted
        
        # Step 4: If this was companies_final.csv, it has emails and faxes!
        # We can also populate raw_website table with those emails and faxes!
        website_inserted = 0
        if "companies_final.csv" in csv_path:
            print("[*] Found Fax/Email in final CSV, populating raw_website table...")
            # raw_website columns: corporate_number, website_url, phone_number, fax_number, email_address
            # Create a unique index on raw_website as well
            cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_website_corp_num ON raw_website(corporate_number);")
            
            website_rows = []
            f.seek(0) # reset file to read faxes/emails
            reader = csv.DictReader(f)
            for row in reader:
                corp_num = (row.get("corp_num") or "").strip()
                website = (row.get("website") or "").strip()
                phone = (row.get("phone") or "").strip()
                fax = (row.get("fax") or "").strip()
                email = (row.get("email") or "").strip()
                
                if corp_num and (fax or email):
                    website_rows.append((
                        corp_num,
                        website,
                        phone,
                        fax,
                        email
                    ))
            
            if website_rows:
                web_insert_sql = """
                    INSERT OR REPLACE INTO raw_website (
                        corporate_number, website_url, phone_number, fax_number, email_address, scraped_at
                    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """
                before_web = conn.total_changes
                cur.executemany(web_insert_sql, website_rows)
                after_web = conn.total_changes
                website_inserted = after_web - before_web
                
        conn.commit()
        print("\n" + "="*60)
        print("      YAHOO DATA INTEGRATION COMPLETED!")
        print("="*60)
        print(f"[+] Staging records added to raw_yahoo:   {inserted:,}")
        print(f"[~] Staging duplicates skipped:          {ignored:,}")
        if website_inserted > 0:
            print(f"[+] Rich contacts added to raw_website:  {website_inserted:,}")
        print("="*60)
        
    except Exception as e:
        conn.rollback()
        print(f"[-] Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
