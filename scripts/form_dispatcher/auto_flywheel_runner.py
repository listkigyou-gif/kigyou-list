#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Automated Continuous Flywheel Runner for Kigyou-List Form DM
============================================================
Runs large-scale campaigns continuously on local machine with Docker WARP rotating proxies.
Features:
  - Iterative batch execution with auto-recovery and zero duplication
  - Real-time progress tracking, success rate monitoring, and graceful Ctrl+C shutdown
  - Automatic error diagnostic reporting
"""

import os
import sys
import time
import argparse
import signal
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from internal_runner import fetch_campaign, get_pg_connection

SHUTDOWN = False

def handle_sigint(sig, frame):
    global SHUTDOWN
    print("\n[!] Graceful shutdown requested. Finishing current batch and exiting safely...")
    SHUTDOWN = True

signal.signal(signal.SIGINT, handle_sigint)

def main():
    parser = argparse.ArgumentParser(description="Kigyou-List Continuous Form DM Flywheel Runner")
    parser.add_argument("--campaign-id", type=str, default="3ae19e5b-e93d-446e-bcc7-40af0e09a6ee", help="Campaign UUID")
    parser.add_argument("--batch-size", type=int, default=50, help="Number of companies per batch (default: 50)")
    parser.add_argument("--concurrency", "-c", type=int, default=5, help="Concurrent browser workers (default: 5)")
    parser.add_argument("--rotate-every", type=int, default=3, help="Proxy rotation frequency (default: 3 forms)")
    parser.add_argument("--cooldown", type=int, default=5, help="Cooldown seconds between batches (default: 5)")
    parser.add_argument("--live", action="store_true", default=True, help="Live outreach submission (default: True)")
    args = parser.parse_args()

    camp = fetch_campaign(args.campaign_id)
    if not camp:
        print(f"[!] Campaign '{args.campaign_id}' not found in database.")
        sys.exit(1)

    print("=" * 78)
    print("  KIGYOU-LIST: AUTOMATED CONTINUOUS FLYWHEEL RUNNER (LOCAL WARP EDITION)")
    print(f"  Campaign:       {camp['name']}")
    print(f"  Campaign ID:    {args.campaign_id}")
    print(f"  Total Targeted: {camp['total_targeted']:,} companies")
    print(f"  Batch Size:     {args.batch_size} per cycle")
    print(f"  Concurrency:    {args.concurrency} concurrent workers")
    print(f"  Proxy Network:  Local Docker WARP Pool (Auto-Rotating every {args.rotate_every} forms)")
    print("=" * 78)

    batch_idx = 1
    while not SHUTDOWN:
        # Check current progress
        camp = fetch_campaign(args.campaign_id)
        if not camp:
            break
        sent = camp["sent_count"] or 0
        skipped = camp["skipped_count"] or 0
        failed = camp["failed_count"] or 0
        total_targeted = camp["total_targeted"] or 0
        total_done = sent + skipped + failed

        if total_done >= total_targeted:
            print(f"\n[🎉] ALL {total_targeted:,} COMPANIES PROCESSED! Campaign complete.")
            break

        remaining = total_targeted - total_done
        current_limit = min(args.batch_size, remaining)
        pct = (total_done / total_targeted) * 100 if total_targeted > 0 else 0

        print(f"\n>>> Starting Batch #{batch_idx} | Progress: {total_done:,}/{total_targeted:,} ({pct:.2f}%) | Remaining: {remaining:,}")
        print(f"    Current Stats: [+] Sent: {sent:,} | [!] Skipped: {skipped:,} | [-] Failed: {failed:,}")

        # Execute batch via internal_runner
        cmd_args = [
            sys.executable,
            "-u",
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "internal_runner.py"),
            "--campaign-id", args.campaign_id,
            "--warp",
            "--concurrency", str(args.concurrency),
            "--rotate-every", str(args.rotate_every),
            "--limit", str(current_limit),
        ]
        if args.live:
            cmd_args.append("--live")

        import subprocess
        proc = subprocess.run(cmd_args)

        if SHUTDOWN:
            print("\n[!] Stopped by user.")
            break

        batch_idx += 1
        if args.cooldown > 0:
            print(f"[*] Cooling down for {args.cooldown}s before next batch...")
            time.sleep(args.cooldown)

if __name__ == "__main__":
    main()
