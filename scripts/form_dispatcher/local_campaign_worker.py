#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Automated Local Campaign Worker (Cloudflare WARP Engine)
=========================================================
Fully autonomous daemon running on admin local workstation.
Monitors user_form_campaigns for approved campaigns marked for 'local' execution.
When detected, runs the dispatching pipeline via Cloudflare WARP proxy pool,
produces CSV audit reports, and triggers automatic customer settlement.
"""

import os
import sys
import time
import json
import socket
import argparse
from datetime import datetime
from typing import Optional, Dict, Any

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT_DIR, "scripts", "form_dispatcher"))

from campaign_runner import (
    run_campaign,
    get_campaign,
    scan_docker_warp_ports,
    complete_and_settle_campaign
)

PG_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")
DB_PATH = os.path.join(ROOT_DIR, "kigyou-list.db")


def find_pending_local_campaign() -> Optional[Dict[str, Any]]:
    """Poll database for approved campaigns designated for local worker."""
    # 1. Try PostgreSQL (primary source of truth)
    try:
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(PG_URL)
        c = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        c.execute(
            """
            SELECT * FROM user_form_campaigns 
            WHERE status = 'approved' AND runner_mode = 'local'
            ORDER BY created_at ASC LIMIT 1
            """
        )
        row = c.fetchone()
        conn.close()
        if row:
            return dict(row)
    except Exception as e:
        # Silently handle transient connection issues
        pass

    # 2. Try SQLite fallback
    if os.path.exists(DB_PATH):
        try:
            import sqlite3
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            row = c.execute(
                """
                SELECT * FROM user_form_campaigns 
                WHERE status = 'approved' AND runner_mode = 'local'
                ORDER BY created_at ASC LIMIT 1
                """
            ).fetchone()
            conn.close()
            if row:
                return dict(row)
        except Exception:
            pass

    return None


def mark_campaign_processing(campaign_id: str) -> bool:
    """Mark campaign as processing so no duplicate worker picks it up."""
    try:
        import psycopg2
        conn = psycopg2.connect(PG_URL)
        c = conn.cursor()
        c.execute(
            "UPDATE user_form_campaigns SET status = 'processing', updated_at = NOW() WHERE id = %s",
            (campaign_id,)
        )
        conn.commit()
        conn.close()
        return True
    except Exception:
        pass

    if os.path.exists(DB_PATH):
        try:
            import sqlite3
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute(
                "UPDATE user_form_campaigns SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (campaign_id,)
            )
            conn.commit()
            conn.close()
            return True
        except Exception:
            pass

    return False


def start_local_worker(interval: int = 5, concurrency: int = 2, dry_run: bool = False, once: bool = False):
    warp_ports = scan_docker_warp_ports()

    print("\n" + "=" * 70)
    print("  🚀 KIGYOU-LIST AUTOMATED LOCAL WORKER (WARP ENGINE)")
    print("=" * 70)
    print(f"  Status:          {'Active Daemon (Continuous Polling)' if not once else 'Single Run'}")
    print(f"  Target Queue:    user_form_campaigns [status='approved', runner_mode='local']")
    print(f"  Polling Rate:    Every {interval} seconds")
    print(f"  Concurrency:     {concurrency} thread(s)")
    print(f"  Mode:            {'[DRY RUN]' if dry_run else '[LIVE SUBMISSION]'}")
    print(f"  WARP SOCKS5:     {f'Detected active ports: {warp_ports}' if warp_ports else 'Direct connection (or Windows WARP client)'}")
    print("=" * 70)
    print("  [*] Waiting for admin to approve campaigns with 'Local (WARP)' option...")
    print("  [*] Press Ctrl+C anytime to stop gracefully.\n")

    consecutive_idle = 0

    while True:
        try:
            camp = find_pending_local_campaign()

            if camp:
                consecutive_idle = 0
                cid = camp["id"]
                cname = camp.get("name") or camp.get("title") or "Unnamed"
                uemail = camp.get("user_email")
                tcount = camp.get("target_count") or 100

                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"\n[⚡ {now_str}] FOUND APPROVED CAMPAIGN FOR LOCAL EXECUTION:")
                print(f"    ID:       {cid}")
                print(f"    Name:     {cname}")
                print(f"    User:     {uemail}")
                print(f"    Targets:  {tcount} companies")

                # Claim job
                print(f"[*] Marking status to 'processing'...")
                mark_campaign_processing(cid)

                # Execute dispatching
                print(f"[*] Launching Playwright WARP runner...")
                try:
                    res = run_campaign(
                        campaign_id=cid,
                        mock_run=False,
                        dry_run=dry_run,
                        use_warp=True,
                        concurrency=concurrency
                    )
                    print(f"[✅] Successfully completed campaign {cid}!")
                    print(f"    Delivered: {res.get('success_count')} | Skipped: {res.get('skipped_count')}")
                    print(f"    Report:    {res.get('report_file_url')}")
                except Exception as run_err:
                    print(f"[❌] Error executing campaign {cid}: {run_err}")
                
                print("\n[*] Resuming queue monitoring...")
            else:
                consecutive_idle += 1
                if consecutive_idle % 12 == 1:
                    now_str = datetime.now().strftime("%H:%M:%S")
                    print(f"[{now_str}] Listening for local campaigns... (0 pending)")

            if once:
                break

            time.sleep(interval)

        except KeyboardInterrupt:
            print("\n[!] Worker stopped by user. Goodbye!")
            sys.exit(0)
        except Exception as e:
            print(f"[-] Worker loop exception: {e}")
            time.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description="Kigyou-List Automated Local Campaign Worker")
    parser.add_argument("--interval", "-i", type=int, default=5, help="Polling interval in seconds (default: 5)")
    parser.add_argument("--concurrency", "-c", type=int, default=2, help="Concurrency (default: 2)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without submitting forms")
    parser.add_argument("--once", action="store_true", help="Check queue once and exit")
    parser.add_argument("--campaign-id", type=str, help="Directly execute a specific campaign ID")
    args = parser.parse_args()

    if args.campaign_id:
        print(f"[*] Directly running campaign ID: {args.campaign_id}")
        run_campaign(
            campaign_id=args.campaign_id,
            mock_run=False,
            dry_run=args.dry_run,
            use_warp=True,
            concurrency=args.concurrency
        )
    else:
        start_local_worker(
            interval=args.interval,
            concurrency=args.concurrency,
            dry_run=args.dry_run,
            once=args.once
        )


if __name__ == "__main__":
    main()
