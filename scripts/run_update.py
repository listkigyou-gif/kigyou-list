#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Master Data Update Orchestrator (On-Demand Pipeline)
================================================================
Sequentially runs incremental data crawls, extraction, and consolidation:
  1. G-Biz Info API v1 Sync (Government METI registry delta)
  2. HelloWork Incremental Crawler & Bronze DB Migration (Job signals)
  3. Yahoo Searcher (Web & Phone enrichment with WARP Proxy check)
  4. Official Website Crawler (Rich Contacts, Scale, Business Summary, SNS Links)
  5. Master Data Consolidation ETL (Bronze -> companies & business_signals)
  6. AI Industry & Intent Tagging (Offline Rule-Based JSIC Classifier)
  7. Metadata & Cache Stats Rebuild (Prefecture, City, Industry counts)

Usage:
    python scripts/run_update.py --limit 50
    python scripts/run_update.py --limit 100 --skip-yahoo
    python scripts/run_update.py --no-proxy
"""

import os
import sys
import time
import socket
import argparse
import subprocess
from datetime import datetime

# UTF-8 stdout configuration for Windows terminals
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_EXE = sys.executable

class StepResult:
    def __init__(self, name: str):
        self.name = name
        self.status = "PENDING"
        self.duration = 0.0
        self.message = ""

def is_port_open(host: str, port: int, timeout: float = 0.5) -> bool:
    """Test if a local TCP port is currently open and accepting connections."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        res = s.connect_ex((host, port))
        return res == 0
    except Exception:
        return False
    finally:
        s.close()

def run_step_command(step_name: str, cmd_args: list[str], cwd: str = ROOT_DIR) -> tuple[bool, str, float]:
    """Execute a subprocess command, streaming stdout/stderr in real-time."""
    print(f"\n{'='*70}")
    print(f"  >>> RUNNING: {step_name}")
    print(f"  Command : {' '.join(cmd_args)}")
    print(f"  CWD     : {cwd}")
    print(f"{'='*70}\n")
    
    t_start = time.time()
    captured_logs = []
    
    try:
        process = subprocess.Popen(
            cmd_args,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            encoding='utf-8',
            errors='replace'
        )
        
        for line in process.stdout:
            sys.stdout.write(line)
            sys.stdout.flush()
            captured_logs.append(line.strip())
            
        process.wait()
        duration = time.time() - t_start
        success = (process.returncode == 0)
        
        last_msg = ""
        for line in reversed(captured_logs):
            if line:
                last_msg = line
                break
                
        return success, last_msg, duration
        
    except Exception as e:
        duration = time.time() - t_start
        err_msg = f"Exception: {str(e)}"
        print(f"[-] ERROR in {step_name}: {err_msg}")
        return False, err_msg, duration

def main():
    parser = argparse.ArgumentParser(description="Kigyou-list Master Data Update Orchestrator")
    parser.add_argument("--limit", type=int, default=50, help="Number of records to crawl/process per source (default: 50)")
    parser.add_argument("--skip-gbiz", action="store_true", help="Skip G-Biz Info API sync")
    parser.add_argument("--skip-hellowork", action="store_true", help="Skip HelloWork incremental crawler")
    parser.add_argument("--skip-yahoo", action="store_true", help="Skip Yahoo searcher")
    parser.add_argument("--skip-website", action="store_true", help="Skip Official Website crawler")
    parser.add_argument("--skip-consolidation", action="store_true", help="Skip Master consolidation ETL")
    parser.add_argument("--skip-ai", action="store_true", help="Skip AI industry tagging")
    parser.add_argument("--skip-rebuild", action="store_true", help="Skip metadata stats rebuild")
    parser.add_argument("--no-proxy", action="store_true", help="Run crawlers with direct connection (no SOCKS5 proxy)")
    parser.add_argument("--prefecture", type=str, default=None, help="Target prefecture code for HelloWork (e.g., 13)")
    parser.add_argument("--dry-run", action="store_true", help="Print execution plan without running")
    
    args = parser.parse_args()
    
    print("\n" + "#"*70)
    print("      KIGYOU-LIST: MASTER ON-DEMAND DATA UPDATE PIPELINE")
    print("#"*70)
    print(f"  Target Limit : {args.limit} records per stage")
    print(f"  Proxy Mode   : {'DIRECT (No Proxy)' if args.no_proxy else 'AUTOMATIC (WARP Proxy with Direct Fallback)'}")
    print(f"  Prefecture   : {args.prefecture or 'ALL Japan'}")
    print(f"  Start Time   : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("#"*70 + "\n")
    
    if args.dry_run:
        print("[*] DRY RUN MODE: Execution plan confirmed. Exiting.")
        return
        
    results: list[StepResult] = []
    overall_start = time.time()
    
    # -------------------------------------------------------------------------
    # STEP 1: G-BIZ INFO API INCREMENTAL SYNC
    # -------------------------------------------------------------------------
    step1 = StepResult("1. G-Biz Info API Sync")
    if args.skip_gbiz:
        step1.status = "SKIPPED"
        step1.message = "Skipped by user flag (--skip-gbiz)"
        print(f"[*] Skipping {step1.name}...")
    else:
        cmd = [PYTHON_EXE, os.path.join(ROOT_DIR, "scripts", "import_gbiz_api.py"), f"--limit={args.limit}"]
        ok, msg, dur = run_step_command(step1.name, cmd)
        step1.duration = dur
        step1.status = "SUCCESS" if ok else "FAILED"
        step1.message = msg
    results.append(step1)
    
    # -------------------------------------------------------------------------
    # STEP 2: HELLOWORK INCREMENTAL CRAWLER & BRONZE MIGRATION
    # -------------------------------------------------------------------------
    step2 = StepResult("2. HelloWork Incremental Crawl")
    if args.skip_hellowork:
        step2.status = "SKIPPED"
        step2.message = "Skipped by user flag (--skip-hellowork)"
        print(f"[*] Skipping {step2.name}...")
    else:
        hw_dir = os.path.join(ROOT_DIR, "crawlers", "hellowork")
        hw_warp_port = 40008
        hw_proxy_ready = is_port_open("127.0.0.1", hw_warp_port)
        
        if not hw_proxy_ready and not args.no_proxy:
            print(f"\n[!] NOTICE: Cloudflare WARP proxy port {hw_warp_port} is closed (Docker stopped).")
            print("[*] Skipping live HelloWork network crawl and synchronizing existing local database...")
            mig_cmd = [PYTHON_EXE, "migrate_to_rawdata.py"]
            ok_mig, msg_mig, dur_mig = run_step_command("HelloWork DB Migration to Master", mig_cmd, cwd=hw_dir)
            step2.duration = dur_mig
            step2.status = "SUCCESS" if ok_mig else "FAILED"
            step2.message = f"Proxy port {hw_warp_port} offline (Docker stopped) | Synced DB: {msg_mig}"
        else:
            hw_cmd = [PYTHON_EXE, "main.py", "--mode", "update", "--limit", str(args.limit)]
            if args.prefecture:
                hw_cmd.extend(["--prefecture", args.prefecture])
                
            ok_crawl, msg_crawl, dur_crawl = run_step_command("HelloWork Harvester & Extractor", hw_cmd, cwd=hw_dir)
            
            # Migrate bronze data from hellowork.db to kigyou-list.db(raw_hellowork)
            mig_cmd = [PYTHON_EXE, "migrate_to_rawdata.py"]
            ok_mig, msg_mig, dur_mig = run_step_command("HelloWork DB Migration to Master", mig_cmd, cwd=hw_dir)
            
            step2.duration = dur_crawl + dur_mig
            step2.status = "SUCCESS" if (ok_crawl and ok_mig) else "FAILED"
            step2.message = f"{msg_crawl} | {msg_mig}"
    results.append(step2)
    
    # -------------------------------------------------------------------------
    # STEP 3: YAHOO SEARCH (WITH WARP PROXY CHECK)
    # -------------------------------------------------------------------------
    step3 = StepResult("3. Yahoo Searcher")
    if args.skip_yahoo:
        step3.status = "SKIPPED"
        step3.message = "Skipped by user flag (--skip-yahoo)"
        print(f"[*] Skipping {step3.name}...")
    else:
        warp_port = 40001
        proxy_ready = is_port_open("127.0.0.1", warp_port)
        if not proxy_ready and not args.no_proxy:
            step3.status = "SKIPPED"
            step3.message = f"Cloudflare WARP proxy port {warp_port} not open (Docker stopped). Skipping Yahoo Search."
            print(f"\n[!] WARNING: {step3.message}")
        else:
            yahoo_dir = os.path.join(ROOT_DIR, "crawlers", "yahoo")
            yahoo_cmd = [PYTHON_EXE, "yahoo_searcher.py", "--limit", str(args.limit)]
            ok_search, msg_search, dur_search = run_step_command(step3.name, yahoo_cmd, cwd=yahoo_dir)
            
            # Import CSV results to raw_yahoo in kigyou-list.db
            imp_cmd = [PYTHON_EXE, "import_to_raw_yahoo.py"]
            ok_imp, msg_imp, dur_imp = run_step_command("Yahoo Raw Data Import to Master", imp_cmd, cwd=yahoo_dir)
            
            step3.duration = dur_search + dur_imp
            step3.status = "SUCCESS" if ok_search else "FAILED"
            step3.message = f"{msg_search} | {msg_imp}"
    results.append(step3)
    
    # -------------------------------------------------------------------------
    # STEP 4: OFFICIAL WEBSITE CRAWLER (SNS + DETAILS)
    # -------------------------------------------------------------------------
    step4 = StepResult("4. Official Website Crawler & SNS Extraction")
    if args.skip_website:
        step4.status = "SKIPPED"
        step4.message = "Skipped by user flag (--skip-website)"
        print(f"[*] Skipping {step4.name}...")
    else:
        web_cmd = [
            PYTHON_EXE, 
            os.path.join(ROOT_DIR, "crawlers", "website", "main.py"), 
            "--limit", str(args.limit),
            "--concurrency", "3"
        ]
        if args.no_proxy:
            web_cmd.append("--no-proxy")
            
        ok, msg, dur = run_step_command(step4.name, web_cmd)
        step4.duration = dur
        step4.status = "SUCCESS" if ok else "FAILED"
        step4.message = msg
    results.append(step4)
    
    # -------------------------------------------------------------------------
    # STEP 5: MASTER DATA CONSOLIDATION (ETL)
    # -------------------------------------------------------------------------
    step5 = StepResult("5. Master Consolidation ETL (Bronze -> Gold)")
    if args.skip_consolidation:
        step5.status = "SKIPPED"
        step5.message = "Skipped by user flag (--skip-consolidation)"
        print(f"[*] Skipping {step5.name}...")
    else:
        con_cmd = [PYTHON_EXE, os.path.join(ROOT_DIR, "scripts", "consolidate_data.py"), "--incremental"]
        ok, msg, dur = run_step_command(step5.name, con_cmd)
        step5.duration = dur
        step5.status = "SUCCESS" if ok else "FAILED"
        step5.message = msg
    results.append(step5)
    
    # -------------------------------------------------------------------------
    # STEP 6: AI INDUSTRY & INTENT TAGGING (OFFLINE RULE-BASED)
    # -------------------------------------------------------------------------
    step6 = StepResult("6. AI Industry & Intent Tagging")
    if args.skip_ai:
        step6.status = "SKIPPED"
        step6.message = "Skipped by user flag (--skip-ai)"
        print(f"[*] Skipping {step6.name}...")
    else:
        ai_cmd = [PYTHON_EXE, os.path.join(ROOT_DIR, "scripts", "ai_tagging_pipeline.py"), "--offline"]
        ok, msg, dur = run_step_command(step6.name, ai_cmd)
        step6.duration = dur
        step6.status = "SUCCESS" if ok else "FAILED"
        step6.message = msg
    results.append(step6)
    
    # -------------------------------------------------------------------------
    # STEP 7: METADATA & CACHE STATS REBUILD
    # -------------------------------------------------------------------------
    step7 = StepResult("7. Metadata Stats Rebuild")
    if args.skip_rebuild:
        step7.status = "SKIPPED"
        step7.message = "Skipped by user flag (--skip-rebuild)"
        print(f"[*] Skipping {step7.name}...")
    else:
        reb_cmd = [PYTHON_EXE, os.path.join(ROOT_DIR, "scripts", "rebuild_metadata_stats.py")]
        ok, msg, dur = run_step_command(step7.name, reb_cmd)
        step7.duration = dur
        step7.status = "SUCCESS" if ok else "FAILED"
        step7.message = msg
    results.append(step7)
    
    # -------------------------------------------------------------------------
    # EXECUTIVE SUMMARY REPORT
    # -------------------------------------------------------------------------
    total_time = time.time() - overall_start
    print("\n" + "="*80)
    print("                  DATA UPDATE PIPELINE EXECUTION SUMMARY")
    print("="*80)
    print(f"{'Stage':<40} | {'Status':<10} | {'Time (s)':<10} | {'Details'}")
    print("-"*80)
    
    has_failure = False
    for r in results:
        status_display = r.status
        if r.status == "SUCCESS":
            status_display = "SUCCESS"
        elif r.status == "FAILED":
            status_display = "FAILED"
            has_failure = True
            
        short_msg = (r.message[:35] + "...") if len(r.message) > 35 else r.message
        print(f"{r.name:<40} | {status_display:<10} | {r.duration:>8.1f}s | {short_msg}")
        
    print("-"*80)
    print(f"Total Execution Time: {total_time:.1f} seconds ({total_time/60.0:.2f} minutes)")
    print("="*80 + "\n")
    
    if has_failure:
        print("[!] One or more pipeline stages reported issues. Please review log outputs above.")
        sys.exit(1)
    else:
        print("[+] ALL DATA UPDATE PIPELINE STAGES COMPLETED SUCCESSFULLY!")
        sys.exit(0)

if __name__ == "__main__":
    main()
