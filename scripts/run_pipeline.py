#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: ETL Pipeline Orchestrator (Central Control)
========================================================
Sequentially executes and monitors the 7-step ETL flow:
1. G-Biz Info Sync (with optional prefecture-level filtering)
2. Live Crawling (HelloWork & Yahoo Maps) [optional / skippable]
3. Entity Linkage & Staging Load (Migrate crawlers db/csv to raw staging)
4. Targeted Website Crawling (incremental, with concurrency) [optional / skippable]
5. Consolidation ETL (Source prioritization merge)
6. AI-Tagging JSIC Pipeline (Regex rules fallback, batched API Groq)
7. Production PostgreSQL Synchronizer & Index Apply

Console outputs are written in ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import sys
import re
import csv
import time
import argparse
import sqlite3
import subprocess
from datetime import datetime

# Resolve paths relative to workspace root
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(SCRIPTS_DIR, ".."))
DB_PATH = os.path.join(WORKSPACE_ROOT, "kigyou-list.db")
GBIZ_CSV_PATH = os.path.join(WORKSPACE_ROOT, "importdata/gbiz-data/Kihonjoho_UTF-8_20260516/Kihonjoho_UTF-8.csv")
JSIC_MD_PATH = os.path.join(WORKSPACE_ROOT, ".docs/03-日本標準産業分類-JSIC.md")

# Default target organization types (301: Kabushiki Gaisha, 302: Yugen Gaisha, 305: Godo Gaisha)
TARGET_ORG_TYPES = {"301", "302", "305"}

def log_header(title):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def run_command(args, cwd=None):
    """Safely run a subprocess command and stream output."""
    print(f"[*] Executing command: {' '.join(args)} in {cwd or WORKSPACE_ROOT}")
    t_start = time.time()
    try:
        # Run process and stream output to stdout
        process = subprocess.Popen(
            args,
            cwd=cwd or WORKSPACE_ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            bufsize=1,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        
        # Read stdout line by line
        for line in process.stdout:
            print(f"  {line.rstrip()}")
            
        process.wait()
        duration = time.time() - t_start
        
        if process.returncode != 0:
            print(f"[-] Command failed with return code {process.returncode} (Duration: {duration:.1f}s)")
            return False
            
        print(f"[+] Command completed successfully in {duration:.1f}s")
        return True
    except Exception as e:
        print(f"[-] Error executing command: {e}")
        return False

def parse_int(val_str):
    if not val_str:
        return None
    try:
        cleaned = re.sub(r"[^\d]", "", val_str.strip())
        return int(cleaned) if cleaned else None
    except ValueError:
        return None

def extract_industry_codes(industry_str):
    codes = set()
    if not industry_str:
        return codes
    items = industry_str.split('|')
    for item in items:
        parts = item.split('-')
        for part in parts:
            if ':' in part:
                code = part.split(':')[0].strip()
                if code:
                    codes.add(code)
            else:
                code = part.strip()
                if code:
                    codes.add(code)
    return codes

def load_jsic_industries(conn):
    """Load JSIC metadata if not loaded."""
    if not os.path.exists(JSIC_MD_PATH):
        print(f"[-] JSIC MD file not found at: {JSIC_MD_PATH}")
        return
        
    print("[*] Parsing JSIC categories from document...")
    industries = []
    current_major_code = None

    with open(JSIC_MD_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("## "):
                content = line[3:].strip()
                parts = content.split(" ", 1)
                if len(parts) >= 2:
                    code = parts[0].strip()
                    rest = parts[1].strip()
                    name = rest.split("(")[0].strip()
                    industries.append((code, name, "大分類", None))
                    current_major_code = code
            elif line.startswith("* "):
                content = line[2:].strip()
                parts = content.split(" ", 1)
                if len(parts) >= 2:
                    code = parts[0].strip()
                    name = parts[1].strip()
                    industries.append((code, name, "中分類", current_major_code))

    cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO m_industries (industry_code, industry_name, classification_level, parent_code)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (industry_code) DO UPDATE 
        SET industry_name = EXCLUDED.industry_name,
            classification_level = EXCLUDED.classification_level,
            parent_code = EXCLUDED.parent_code;
    """, industries)
    conn.commit()
    print(f"[+] Loaded {len(industries)} JSIC categories into SQLite.")

def step_1_gbiz_sync(prefecture_code=None, limit=None, use_api=False):
    """Step 1: Sync G-Biz Info Registry (Supports scoping by prefecture or API)."""
    log_header("STEP 1: G-BIZ INFO REGISTRY SYNC")
    
    if use_api:
        print("[*] API Mode selected. Invoking incremental G-Biz API synchronizer...")
        api_script = os.path.join(SCRIPTS_DIR, "import_gbiz_api.py")
        cmd = [sys.executable, "-u", api_script]
        if limit:
            cmd.append(f"--limit={limit}")
        return run_command(cmd)
        
    if not os.path.exists(GBIZ_CSV_PATH):
        print(f"[-] G-Biz CSV file not found at: {GBIZ_CSV_PATH}")
        print("    Please check the path or ensure the dataset is placed correctly.")
        return False
        
    print(f"[*] Source G-Biz CSV: {GBIZ_CSV_PATH}")
    if prefecture_code:
        print(f"[*] Prefecture Scope Filter: {prefecture_code}")
    if limit:
        print(f"[*] Record Count Limit: {limit}")

    # Establish db and verify schema
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    
    # Setup schema
    schema_sql_path = os.path.join(WORKSPACE_ROOT, "database/init_schema_sqlite.sql")
    if os.path.exists(schema_sql_path):
        print(f"[*] Initializing SQLite schema from {schema_sql_path}...")
        with open(schema_sql_path, "r", encoding="utf-8") as sf:
            conn.cursor().executescript(sf.read())
            conn.commit()
            
    # Load JSIC metadata first
    load_jsic_industries(conn)
    
    cursor = conn.cursor()
    cursor.execute("SELECT industry_code FROM m_industries;")
    valid_industry_codes = {row[0] for row in cursor.fetchall()}

    companies_batch = []
    mappings_batch = []
    total_scanned = 0
    total_imported = 0
    total_mappings = 0
    
    t_start = time.time()
    
    insert_company_sql = """
        INSERT INTO companies (
            corporate_number, company_name, company_name_kana, company_name_en,
            postal_code, prefecture_code, prefecture_name, city_name, street_address, full_address,
            representative_name, representative_position, establishment_date,
            capital_amount, employee_count, sales_amount,
            phone_number, fax_number, website_url, email_address,
            business_summary, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (corporate_number) DO UPDATE
        SET company_name = EXCLUDED.company_name,
            full_address = EXCLUDED.full_address,
            capital_amount = EXCLUDED.capital_amount,
            employee_count = EXCLUDED.employee_count,
            website_last_crawled_at = CASE 
                WHEN EXCLUDED.website_url IS NOT website_url THEN NULL 
                ELSE website_last_crawled_at 
            END,
            website_crawl_status = CASE 
                WHEN EXCLUDED.website_url IS NOT website_url THEN NULL 
                ELSE website_crawl_status 
            END,
            website_url = EXCLUDED.website_url,
            updated_at = CURRENT_TIMESTAMP;
    """
    
    insert_mapping_sql = """
        INSERT INTO company_industries (corporate_number, industry_code)
        VALUES (?, ?)
        ON CONFLICT (corporate_number, industry_code) DO NOTHING;
    """

    print("[*] Streaming CSV file for registry import...")
    with open(GBIZ_CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        headers = next(reader)
        
        for row in reader:
            total_scanned += 1
            if len(row) < 27:
                continue
                
            org_type = row[13].strip()
            if org_type not in TARGET_ORG_TYPES:
                continue
                
            row_pref_code = row[9].strip() if row[9] else None
            # Filter by prefecture if specified
            if prefecture_code and row_pref_code != prefecture_code:
                continue
                
            corporate_number = row[0].strip()
            if not corporate_number or len(corporate_number) != 13:
                continue
                
            company_name = row[1].strip()
            company_name_kana = row[2].strip() if row[2] else None
            company_name_en = row[3].strip() if row[3] else None
            
            postal_code = re.sub(r"[^\d]", "", row[7].strip())[:7] if row[7] else None
            prefecture_name = row[8].strip() if row[8] else None
            city_name = row[10].strip() if row[10] else None
            street_address = row[12].strip() if row[12] else None
            full_address = row[6].strip() if row[6] else None
            
            representative_name = row[17].strip() if row[17] else None
            representative_position = "代表取締役" if org_type == "301" else "代表者"
            
            establishment_date = row[26].strip() if row[26] else None
            capital_amount = parse_int(row[18])
            employee_count = parse_int(row[19])
            
            website_url = row[23].strip() if row[23] else None
            business_summary = row[22].strip() if row[22] else None
            status = row[16].strip() if row[16] else "活動中"
            
            companies_batch.append((
                corporate_number, company_name, company_name_kana, company_name_en,
                postal_code, row_pref_code, prefecture_name, city_name, street_address, full_address,
                representative_name, representative_position, establishment_date,
                capital_amount, employee_count, None,
                None, None, website_url, None,
                business_summary, status
            ))
            
            # Parse industry codes
            industry_raw = row[25].strip()
            if industry_raw:
                extracted_codes = extract_industry_codes(industry_raw)
                for code in extracted_codes:
                    if code in valid_industry_codes:
                        mappings_batch.append((corporate_number, code))
                        total_mappings += 1

            total_imported += 1
            
            if len(companies_batch) >= 10000:
                cursor.executemany(insert_company_sql, companies_batch)
                if mappings_batch:
                    cursor.executemany(insert_mapping_sql, mappings_batch)
                conn.commit()
                print(f"  -> Imported {total_imported} companies (Scanned {total_scanned})...")
                companies_batch = []
                mappings_batch = []
                
            if limit and total_imported >= limit:
                break
                
        # Commit remaining
        if companies_batch:
            cursor.executemany(insert_company_sql, companies_batch)
            if mappings_batch:
                cursor.executemany(insert_mapping_sql, mappings_batch)
            conn.commit()
            
    conn.close()
    duration = time.time() - t_start
    print(f"[+] Registry sync finished. Imported {total_imported} records (Scanned {total_scanned}) in {duration:.1f}s.")
    return True

def step_2_crawlers(prefecture_code=None):
    """Step 2: Crawl HelloWork & Yahoo Maps dynamically (Simulated via notifications or run script)."""
    log_header("STEP 2: RUN DYNAMIC CRAWLERS")
    print("[*] To run a full live crawl, execute crawlers separately or deploy docker containers.")
    print("    - HelloWork crawler path: crawlers/hellowork/")
    print("    - Yahoo Maps crawler path: crawlers/yahoo/")
    print("[*] Skipped crawling stage. Procedural ETL will operate on available SQLite/CSV local files.")
    return True

def step_3_load_staging():
    """Step 3: Entity Linkage & Staging Load (Import crawler output databases/CSVs to staging)."""
    log_header("STEP 3: LOAD CRAWLER DATA TO STAGING")
    
    # 1. HelloWork migration
    hw_migrate_script = os.path.join(WORKSPACE_ROOT, "crawlers/hellowork/migrate_to_rawdata.py")
    hw_db = os.path.join(WORKSPACE_ROOT, "crawlers/hellowork/data/hellowork.db")
    
    if os.path.exists(hw_db):
        print(f"[+] Found HelloWork crawler database: {hw_db}")
        if not run_command([sys.executable, "-u", hw_migrate_script]):
            print("[-] HelloWork staging loading encountered an issue.")
    else:
        print(f"[~] HelloWork crawler database not found at: {hw_db}. Skipping HelloWork nabs.")
        
    # 2. Yahoo Maps migration
    yahoo_migrate_script = os.path.join(WORKSPACE_ROOT, "crawlers/yahoo/import_to_raw_yahoo.py")
    yahoo_final_csv = os.path.join(WORKSPACE_ROOT, "crawlers/yahoo/data/companies_final.csv")
    yahoo_basic_csv = os.path.join(WORKSPACE_ROOT, "crawlers/yahoo/data/companies_basic.csv")
    
    if os.path.exists(yahoo_final_csv) or os.path.exists(yahoo_basic_csv):
        print("[+] Found Yahoo search results CSV.")
        if not run_command([sys.executable, "-u", yahoo_migrate_script]):
            print("[-] Yahoo staging loading encountered an issue.")
    else:
        print("[~] Yahoo Map CSV results not found. Skipping Yahoo nabs.")
        
    return True

def step_4_web_crawl(limit=50, max_time=7200):
    """Step 4: Targeted Web Scraper."""
    log_header("STEP 4: TARGETED WEBSITE CRAWLER")
    web_crawler_script = os.path.join(WORKSPACE_ROOT, "crawlers/website/main.py")
    
    if os.path.exists(web_crawler_script):
        # If limit is 0 (no limit requested globally), default website crawl to 5000 batch size
        crawl_limit = 5000 if limit == 0 else limit
        print(f"[*] Triggering website crawler with limit: {crawl_limit}, max-time: {max_time}s...")
        return run_command([
            sys.executable, "-u", web_crawler_script, 
            "--limit", str(crawl_limit), 
            "--concurrency", "5", 
            "--headless", "true",
            "--max-time", str(max_time)
        ])
    else:
        print(f"[-] Website crawler script not found at: {web_crawler_script}")
        return False

def step_5_consolidation():
    """Step 5: Consolidation ETL (Source prioritization merge)."""
    log_header("STEP 5: MASTER DATA CONSOLIDATION ETL")
    consolidation_script = os.path.join(SCRIPTS_DIR, "consolidate_data.py")
    
    if os.path.exists(consolidation_script):
        return run_command([sys.executable, "-u", consolidation_script])
    else:
        print(f"[-] Consolidation script not found at: {consolidation_script}")
        return False

def step_6_ai_tagging(offline=False, limit_gbiz=100000, stage1_only=False):
    """Step 6: AI-Tagging JSIC Classification."""
    log_header("STEP 6: AI-TAGGING JSIC TAXONOMY CLASSIFIER")
    ai_tagging_script = os.path.join(SCRIPTS_DIR, "ai_tagging_pipeline.py")
    
    if os.path.exists(ai_tagging_script):
        args = [sys.executable, "-u", ai_tagging_script]
        if offline:
            args.append("--offline")
            print("[*] Running AI tagging in OFFLINE mode (Regex Rule-Based mapping only).")
        else:
            print("[*] Running AI tagging in LIVE mode (will use Groq API if GROQ_API_KEY is available).")
            
        if stage1_only:
            args.append("--stage1-only")
            print("[*] Running Stage 1 ONLY (Fast Offline G-Biz Registry Regex Tagging).")
            
        args.extend(["--limit-gbiz", str(limit_gbiz)])
        return run_command(args)
    else:
        print(f"[-] AI tagging script not found at: {ai_tagging_script}")
        return False

def step_7_postgres_sync():
    """Step 7: Production PostgreSQL Synchronizer."""
    log_header("STEP 7: POSTGRESQL PRODUCTION SYNCHRONIZATION")
    postgres_sync_script = os.path.join(SCRIPTS_DIR, "migrate_to_postgres.py")
    
    if os.path.exists(postgres_sync_script):
        return run_command([sys.executable, "-u", postgres_sync_script])
    else:
        print(f"[-] Postgres migration script not found at: {postgres_sync_script}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Kigyou-list ETL Orchestrator")
    parser.add_argument("--steps", type=str, default="1,2,3,4,5,6,7", 
                        help="Comma-separated step numbers to execute (e.g. 1,3,5,6,7)")
    parser.add_argument("--prefecture", type=str, default=None, 
                        help="Prefecture code (2 digits, e.g. 31 for Tottori) to restrict scope")
    parser.add_argument("--limit", type=int, default=50, 
                        help="Record limit for crawlers and imports (useful for testing)")
    parser.add_argument("--offline", action="store_true", 
                        help="Force offline modes (e.g. Rule-Based mapping for AI tagging)")
    parser.add_argument("--skip-scraping", action="store_true", 
                        help="Skip actual crawler scraping stages (Step 2 & Step 4)")
    parser.add_argument("--api", action="store_true", 
                        help="Use G-Biz Info API instead of CSV for Step 1 sync")
    parser.add_argument("--limit-gbiz", type=int, default=100000,
                        help="Limit number of untagged G-Biz companies processed in Phase 1 AI tagging")
    parser.add_argument("--web-crawl-max-time", type=int, default=7200,
                        help="Max duration in seconds for Website Crawler (Step 4)")
                        
    args = parser.parse_args()
    
    steps_to_run = [int(s.strip()) for s in args.steps.split(",") if s.strip().isdigit()]
    
    log_header("KIGYOU-LIST ETL PIPELINE SYSTEM START")
    print(f"[*] Started at:      {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"[*] Active Steps:    {steps_to_run}")
    print(f"[*] Prefecture Code: {args.prefecture or 'ALL'}")
    print(f"[*] Limit Option:    {args.limit}")
    print(f"[*] Offline Mode:    {args.offline}")
    print(f"[*] Skip Scraping:   {args.skip_scraping}")
    print(f"[*] G-Biz API Mode:  {args.api}")
    print(f"[*] Web Crawl Max Time: {args.web_crawl_max_time}s")
    print("=" * 80)
    
    t_pipeline_start = time.time()
    
    # Execute steps sequentially
    try:
        # Step 1: G-Biz Registry Ingest
        if 1 in steps_to_run:
            if not step_1_gbiz_sync(args.prefecture, args.limit, args.api):
                print("[-] Step 1 failed. Aborting pipeline.")
                sys.exit(1)
            # Run Stage 1 of AI tagging immediately to classify newly imported records
            print("[*] Running Stage 1 AI Tagging (Regex) immediately for new G-Biz records...")
            step_6_ai_tagging(offline=True, limit_gbiz=args.limit_gbiz, stage1_only=True)
                
        # Step 2: Dynamically Crawl (HelloWork & Yahoo Maps)
        if 2 in steps_to_run:
            if args.skip_scraping:
                print("[*] Skipping Step 2 (Scraping Stage) as requested.")
            else:
                step_2_crawlers(args.prefecture)
                
        # Step 3: Load staging
        if 3 in steps_to_run:
            if not step_3_load_staging():
                print("[-] Step 3 failed. Aborting pipeline.")
                sys.exit(1)
                
        # Intermediate Consolidation (Runs if both Step 4 and Step 5 are selected)
        # This ensures newly discovered company website URLs are populated in the master table
        # before the Website Crawler attempts to target them.
        if 4 in steps_to_run and 5 in steps_to_run and 3 in steps_to_run:
            print("[*] Running intermediate Consolidation to populate website URLs for Website Crawler...")
            if not step_5_consolidation():
                print("[-] Intermediate Step 5 failed. Aborting pipeline.")
                sys.exit(1)

        # Step 4: Web Crawl
        if 4 in steps_to_run:
            if args.skip_scraping:
                print("[*] Skipping Step 4 (Website Scraping Stage) as requested.")
            else:
                if not step_4_web_crawl(args.limit, args.web_crawl_max_time):
                    print("[-] Step 4 failed. Aborting pipeline.")
                    sys.exit(1)
                    
        # Step 5: Master Consolidation
        if 5 in steps_to_run:
            if not step_5_consolidation():
                print("[-] Step 5 failed. Aborting pipeline.")
                sys.exit(1)
                
        # Step 6: AI-Tagging mapping
        if 6 in steps_to_run:
            if not step_6_ai_tagging(args.offline, args.limit_gbiz):
                print("[-] Step 6 failed. Aborting pipeline.")
                sys.exit(1)
                
        # Step 7: Postgres Sync
        if 7 in steps_to_run:
            if not step_7_postgres_sync():
                print("[-] Step 7 failed. Aborting pipeline.")
                sys.exit(1)
                
        total_duration = time.time() - t_pipeline_start
        log_header("KIGYOU-LIST ETL PIPELINE RUN COMPLETED SUCCESSFULLY!")
        print(f"[*] Finished at:      {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"[*] Total Execution: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
        print("=" * 80)
        
    except KeyboardInterrupt:
        print("\n[!] Pipeline execution aborted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n[-] Fatal error during pipeline execution: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
