#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: G-Biz Incremental Update Orchestrator
==================================================
Runs the incremental ETL pipeline:
1. G-Biz Info API sync (Step 1) -> pulls new/changed records to SQLite.
2. Master Consolidation (Step 5) -> merges and normalizes the data.
3. AI Tagging (Step 6) -> tags the new/updated companies.
4. Rebuild Metadata Stats -> recalculates counts in SQLite.
5. Incremental Postgres Sync -> synchronizes all changes to production PostgreSQL.
"""

import os
import sys
import argparse
import subprocess
import time
from datetime import datetime

# Reconfigure stdout to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(SCRIPTS_DIR, ".."))

def log_header(title):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def run_command(args, cwd=None):
    """Safely run a subprocess command and stream output."""
    print(f"[*] Executing command: {' '.join(args)} in {cwd or WORKSPACE_ROOT}")
    t_start = time.time()
    try:
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

def main():
    parser = argparse.ArgumentParser(description="Kigyou-list G-Biz Incremental Update Orchestrator")
    parser.add_argument("--limit", type=int, default=None, 
                        help="Limit number of updated records fetched from G-Biz API (useful for testing)")
    parser.add_argument("--since", type=str, default=None,
                        help="Sync timestamp override for PostgreSQL migration (UTC YYYY-MM-DD HH:MM:SS)")
    parser.add_argument("--hours", type=int, default=24,
                        help="Fallback hours for PostgreSQL migration if sync state file is missing")
    parser.add_argument("--offline", action="store_true",
                        help="Force offline mode for AI tagging (Regex-based only)")
    parser.add_argument("--limit-gbiz", type=int, default=100000,
                        help="Limit number of untagged G-Biz companies processed in Phase 1 AI tagging")
    parser.add_argument("--consolidate", action="store_true",
                        help="Run consolidation step (usually not needed for pure G-Biz updates)")
                        
    args = parser.parse_args()
    
    log_header("G-BIZ INCREMENTAL UPDATE PIPELINE START")
    print(f"[*] Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"[*] G-Biz API Limit: {args.limit}")
    print(f"[*] Offline Tagging: {args.offline}")
    print("=" * 80)
    
    t_start = time.time()
    
    # Step 1: Run G-Biz API Sync
    log_header("PHASE 1: FETCHING INCREMENTAL G-BIZ UPDATES")
    cmd_step1 = [sys.executable, "-u", "scripts/run_pipeline.py", "--steps", "1", "--api"]
    if args.limit:
        cmd_step1.append(f"--limit={args.limit}")
    cmd_step1.append(f"--limit-gbiz={args.limit_gbiz}")
    if not run_command(cmd_step1):
        print("[-] Phase 1 failed. Aborting pipeline.")
        sys.exit(1)
        
    # Step 2: Consolidation
    if args.consolidate:
        log_header("PHASE 2: CONSOLIDATING DATA")
        cmd_step5 = [sys.executable, "-u", "scripts/consolidate_data.py", "--incremental"]
        if not run_command(cmd_step5):
            print("[-] Phase 2 failed. Aborting pipeline.")
            sys.exit(1)
    else:
        log_header("PHASE 2: CONSOLIDATING DATA (SKIPPED)")
        print("[*] Skipped consolidation phase. Run with --consolidate if crawlers raw data was updated.")
        
    # Step 3: AI Tagging
    log_header("PHASE 3: RUNNING AI TAGGING ON NEW RECORDS")
    cmd_step6 = [sys.executable, "-u", "scripts/run_pipeline.py", "--steps", "6"]
    if args.offline:
        cmd_step6.append("--offline")
    cmd_step6.append(f"--limit-gbiz={args.limit_gbiz}")
    if not run_command(cmd_step6):
        print("[-] Phase 3 failed. Aborting pipeline.")
        sys.exit(1)
        
    # Step 4: Rebuild Metadata Stats
    log_header("PHASE 4: REBUILDING METADATA STATS IN SQLITE")
    cmd_stats = [sys.executable, "-u", "scripts/rebuild_metadata_stats.py"]
    if not run_command(cmd_stats):
        print("[-] Phase 4 failed. Aborting pipeline.")
        sys.exit(1)
        
    # Step 5: Incremental Postgres Sync
    log_header("PHASE 5: INCREMENTAL POSTGRESQL SYNCHRONIZATION")
    cmd_sync = [sys.executable, "-u", "scripts/migrate_to_postgres_incremental.py"]
    if args.since:
        cmd_sync.append(f"--since={args.since}")
    if args.hours:
        cmd_sync.append(f"--hours={args.hours}")
    if not run_command(cmd_sync):
        print("[-] Phase 5 failed. Aborting pipeline.")
        sys.exit(1)
        
    total_duration = time.time() - t_start
    log_header("G-BIZ INCREMENTAL UPDATE PIPELINE RUN COMPLETED SUCCESSFULLY!")
    print(f"[*] Finished at:      {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"[*] Total Execution: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
    print("=" * 80)

if __name__ == "__main__":
    main()
