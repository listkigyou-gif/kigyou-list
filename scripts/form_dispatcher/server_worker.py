#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Server-Side Form DM Background Worker (Dedicated / Residential Proxy Edition)
=============================================================================
Runs on backend servers / VPS containers to execute internal form outreach
campaigns without requiring local PC execution.

Features:
  1. Standalone Execution Mode: --campaign-id <UUID>
  2. Background Daemon Mode: --daemon (polls DB every N seconds for 'ready' / 'processing' server_proxy campaigns)
  3. High-Performance Multi-Worker Concurrency (--concurrency N)
  4. Residential / Dedicated Proxy Pool Support (via OUTREACH_PROXY_URL or --proxy)
  5. Real-Time DB Logging & Audit Trail to internal_form_send_logs
  6. Automatic CSV Generation & Completion Settlement
"""

import os
import sys
import time
import json
import argparse
import csv
import queue
import threading
import signal
from datetime import datetime
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

try:
    from dotenv import load_dotenv
    # Look for .env in current and parent directories
    for env_path in [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", ".env.local"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
    ]:
        if os.path.exists(env_path):
            load_dotenv(env_path)
            break
except ImportError:
    pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dispatcher import FormDispatcher, parse_proxy_url, HAS_PLAYWRIGHT
if HAS_PLAYWRIGHT:
    from playwright.sync_api import sync_playwright

SHUTDOWN_SIGNALLED = False


def signal_handler(signum, frame):
    global SHUTDOWN_SIGNALLED
    print(f"\n[!] Caught shutdown signal ({signum}). Gracefully stopping worker...")
    SHUTDOWN_SIGNALLED = True


signal.signal(signal.SIGINT, signal_handler)
try:
    signal.signal(signal.SIGTERM, signal_handler)
except Exception:
    pass


def get_pg_connection():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL is not set in environment or .env.local")
    import psycopg2
    import psycopg2.extras
    return psycopg2.connect(db_url, connect_timeout=5)


def fetch_campaign(campaign_id: str) -> Optional[Dict[str, Any]]:
    conn = get_pg_connection()
    import psycopg2.extras
    c = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    c.execute("SELECT * FROM internal_form_campaigns WHERE id = %s", (campaign_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def fetch_pending_server_campaign() -> Optional[Dict[str, Any]]:
    """Polls database for the oldest ready or stalled processing campaign configured for server_proxy."""
    conn = get_pg_connection()
    import psycopg2.extras
    c = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    c.execute(
        """
        SELECT * FROM internal_form_campaigns
        WHERE execution_mode = 'server_proxy'
          AND status IN ('ready', 'processing')
        ORDER BY created_at ASC
        LIMIT 1
        """
    )
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def fetch_target_companies_pg(filters: Dict[str, Any], limit: int = 50, campaign_id: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_pg_connection()
    import psycopg2.extras
    c = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    conditions = [
        "c.contact_form_url IS NOT NULL",
        "c.contact_form_url != ''",
        "c.contact_form_url LIKE 'http%%'"
    ]
    params = []

    pref = filters.get("prefecture_name")
    if pref and pref != "all":
        conditions.append("c.prefecture_name = %s")
        params.append(pref)

    ind = filters.get("industry_code")
    if ind and ind != "all":
        conditions.append("""EXISTS (
            SELECT 1 FROM company_industries ci
            WHERE ci.corporate_number = c.corporate_number
              AND (ci.industry_code = %s OR ci.industry_path LIKE %s || '%%')
        )""")
        params.extend([ind, ind])

    min_emp = filters.get("min_employees")
    if min_emp and int(min_emp) > 0:
        conditions.append("c.employee_count >= %s")
        params.append(int(min_emp))

    if filters.get("has_website"):
        conditions.append("c.website_url IS NOT NULL AND c.website_url != ''")

    rec_days = filters.get("exclude_recent_days")
    if rec_days and int(rec_days) > 0:
        conditions.append(f"(c.last_form_dm_sent_at IS NULL OR c.last_form_dm_sent_at < NOW() - INTERVAL '{int(rec_days)} days')")

    if campaign_id:
        conditions.append("""NOT EXISTS (
            SELECT 1 FROM internal_form_send_logs log
            WHERE log.corporate_number = c.corporate_number
              AND log.campaign_id = %s
        )""")
        params.append(campaign_id)

    # Multi-tenant opt-out exclusion
    user_scope = str(user_id) if user_id else "admin"
    conditions.append("""NOT EXISTS (
        SELECT 1 FROM form_marketing_opt_outs opt
        WHERE opt.corporate_number = c.corporate_number
          AND (opt.user_id = %s OR (opt.user_id IS NULL AND %s = 'admin'))
    )""")
    params.extend([user_scope, user_scope])

    where_clause = " AND ".join(conditions)
    query = f"""
        SELECT 
            c.corporate_number,
            c.company_name,
            c.representative_name,
            c.contact_form_url,
            c.prefecture_name,
            c.city_name,
            c.website_url,
            c.employee_count
        FROM companies c
        WHERE {where_clause}
        ORDER BY RANDOM()
        LIMIT %s
    """
    params.append(limit)

    c.execute(query, tuple(params))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def record_log_pg(campaign_id: str, company: Dict[str, Any], status: str, message: str):
    conn = get_pg_connection()
    c = conn.cursor()
    corp_num = company.get("corporate_number")
    c.execute(
        """
        INSERT INTO internal_form_send_logs (
            campaign_id, corporate_number, company_name, form_url, prefecture_name, website_url, status, message, sent_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """,
        (
            campaign_id,
            corp_num,
            company.get("company_name"),
            company.get("contact_form_url"),
            company.get("prefecture_name"),
            company.get("website_url"),
            status,
            message
        )
    )

    if status == "SUCCESS_SENT":
        c.execute("UPDATE internal_form_campaigns SET sent_count = sent_count + 1, updated_at = NOW() WHERE id = %s", (campaign_id,))
        if corp_num:
            c.execute("UPDATE companies SET last_form_dm_sent_at = NOW() WHERE corporate_number = %s", (corp_num,))
    elif status.startswith("SKIPPED") or status.startswith("BLOCKED") or status in ("NO_FORM_ELEMENT", "ALREADY_CONTACTED", "DEAD_WEBSITE"):
        c.execute("UPDATE internal_form_campaigns SET skipped_count = skipped_count + 1, updated_at = NOW() WHERE id = %s", (campaign_id,))
    elif status == "SUCCESS_DRY_RUN":
        pass  # Dry run simulation, do not increment failure counter
    else:
        c.execute("UPDATE internal_form_campaigns SET failed_count = failed_count + 1, updated_at = NOW() WHERE id = %s", (campaign_id,))

    conn.commit()
    conn.close()


def complete_campaign_pg(campaign_id: str, duration_sec: int, report_url: str):
    conn = get_pg_connection()
    c = conn.cursor()
    c.execute("SELECT total_targeted, (sent_count + skipped_count + failed_count) as total_done FROM internal_form_campaigns WHERE id = %s", (campaign_id,))
    row = c.fetchone()
    new_status = 'completed'
    if row and row[0] and row[1] and row[1] < row[0]:
        new_status = 'paused'  # Batch finished, still has remaining targets

    c.execute(
        """
        UPDATE internal_form_campaigns
        SET status = %s, duration_seconds = COALESCE(duration_seconds, 0) + %s, 
            report_file_url = %s, completed_at = CASE WHEN %s = 'completed' THEN NOW() ELSE completed_at END, 
            updated_at = NOW()
        WHERE id = %s
        """,
        (new_status, duration_sec, report_url, new_status, campaign_id)
    )
    conn.commit()
    conn.close()


def create_browser_session(playwright_instance, proxy_config: Optional[Dict[str, Any]]):
    browser = playwright_instance.chromium.launch(headless=True, proxy=proxy_config)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        viewport={"width": 1280, "height": 800},
        ignore_https_errors=True
    )
    page = context.new_page()
    return browser, context, page


def server_worker_routine(
    worker_id: int,
    task_queue: queue.Queue,
    total_tasks: int,
    campaign_id: str,
    sender_profile: Dict[str, Any],
    proxy_config: Optional[Dict[str, Any]],
    proxy_label: str,
    is_dry_run: bool,
    save_screenshot: bool,
    results_list: List[Dict[str, Any]],
    lock: threading.Lock,
    progress_counter: Dict[str, int]
):
    global SHUTDOWN_SIGNALLED
    dispatcher = FormDispatcher(
        sender_profile=sender_profile,
        dry_run=is_dry_run,
        save_screenshot=save_screenshot,
        save_failed_html=True
    )

    with sync_playwright() as p:
        try:
            browser, context, page = create_browser_session(p, proxy_config)
        except Exception as e:
            print(f"[Worker #{worker_id}] Browser session error: {e}")
            return

        while not SHUTDOWN_SIGNALLED:
            try:
                comp = task_queue.get_nowait()
            except queue.Empty:
                break

            with lock:
                progress_counter["done"] += 1
                curr_idx = progress_counter["done"]

            comp_name = comp.get("company_name", "Target")
            form_url = comp.get("contact_form_url", "")
            print(f"\n[Server Worker #{worker_id} | {curr_idx}/{total_tasks}] Processing: {comp_name} ({proxy_label})")
            print(f"  [>] Form URL: {form_url}")

            try:
                res = dispatcher.dispatch_single_company(page, comp)
            except Exception as e:
                res = {
                    "corporate_number": comp.get("corporate_number"),
                    "company_name": comp.get("company_name"),
                    "form_url": comp.get("contact_form_url"),
                    "status": "FAILED",
                    "message": f"Server execution error: {str(e)[:150]}",
                    "timestamp": datetime.now().isoformat()
                }

            status = res.get("status", "FAILED")
            msg = res.get("message", "")

            with lock:
                results_list.append(res)

            try:
                record_log_pg(campaign_id, comp, status, msg)
            except Exception as db_e:
                print(f"  [Server Worker #{worker_id}] DB logging error: {db_e}")

            if status in ["DEAD_WEBSITE", "ERROR", "TIMEOUT"]:
                try:
                    page.close()
                    page = context.new_page()
                except Exception:
                    pass

            task_queue.task_done()
            time.sleep(1.0)

        try:
            browser.close()
        except Exception:
            pass


def execute_server_campaign(
    campaign_id: str,
    concurrency: int = 3,
    limit: int = 50,
    proxy_url: Optional[str] = None,
    live: bool = False,
    screenshot: bool = False
) -> bool:
    global SHUTDOWN_SIGNALLED
    camp = fetch_campaign(campaign_id)
    if not camp:
        print(f"[!] Campaign '{campaign_id}' not found.")
        return False

    is_dry_run = not live
    active_proxy = proxy_url or os.environ.get("OUTREACH_PROXY_URL")
    proxy_config = parse_proxy_url(active_proxy) if active_proxy else None
    proxy_label = proxy_config["server"] if proxy_config else "Direct Connection"

    print("=" * 78)
    print("  KIGYOU-LIST: SERVER-SIDE FORM DM WORKER (DEDICATED PROXY ENGINE)")
    print(f"  Campaign ID:    {campaign_id}")
    print(f"  Campaign Name:  {camp['name']}")
    print(f"  Execution Mode: {'[LIVE SUBMISSION]' if live else '[DRY RUN - Safe Simulation]'}")
    print(f"  Workers:        {concurrency} threads")
    print(f"  Proxy Network:  {proxy_label}")
    print(f"  Batch Limit:    {limit} companies")
    print("=" * 78)

    if not HAS_PLAYWRIGHT:
        print("[!] Playwright is not installed. Please install: pip install playwright && playwright install chromium")
        return False

    user_scope = str(camp.get("user_id") or camp.get("user_email") or "admin")
    sender_profile = {
        "campaign_id": str(campaign_id),
        "user_id": user_scope,
        "company_name": camp["sender_company"],
        "contact_name": camp["sender_name"],
        "furigana": camp.get("sender_furigana") or "クリモト ヨシユキ",
        "email": camp["sender_email"],
        "phone": camp.get("sender_phone") or "03-5555-0123",
        "postal_code": "104-0061",
        "prefecture": "東京都",
        "address": "中央区銀座1-1-1",
        "website": camp.get("sender_website") or "https://kigyoulist.com",
        "subject": camp["subject"],
        "message_body": camp["message_body"]
    }

    # Mark campaign processing
    conn = get_pg_connection()
    c = conn.cursor()
    c.execute("UPDATE internal_form_campaigns SET status = 'processing', started_at = NOW(), updated_at = NOW() WHERE id = %s", (campaign_id,))
    conn.commit()
    conn.close()

    filters = camp.get("target_filters") or {}
    if isinstance(filters, str):
        filters = json.loads(filters)

    targets = fetch_target_companies_pg(filters, limit=limit, campaign_id=campaign_id, user_id=user_scope)
    print(f"[*] Fetched {len(targets)} target companies for server batch.")

    if not targets:
        print("[*] No remaining target companies for this campaign. Marking completed.")
        complete_campaign_pg(campaign_id, 0, "")
        return True

    task_queue = queue.Queue()
    for t in targets:
        task_queue.put(t)

    results: List[Dict[str, Any]] = []
    lock = threading.Lock()
    progress_counter = {"done": 0}
    start_time = time.time()

    actual_concurrency = min(concurrency, len(targets))
    threads: List[threading.Thread] = []

    print(f"[*] Starting {actual_concurrency} server browser threads...\n")
    for w_id in range(1, actual_concurrency + 1):
        t = threading.Thread(
            target=server_worker_routine,
            args=(
                w_id,
                task_queue,
                len(targets),
                campaign_id,
                sender_profile,
                proxy_config,
                proxy_label,
                is_dry_run,
                screenshot,
                results,
                lock,
                progress_counter
            ),
            daemon=True
        )
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    duration = int(time.time() - start_time)

    # Generate CSV Audit Report
    reports_dir = os.path.join(ROOT_DIR, "frontend", "public", "reports")
    os.makedirs(reports_dir, exist_ok=True)
    report_filename = f"server_form_dm_{campaign_id[:8]}_{int(time.time())}.csv"
    report_filepath = os.path.join(reports_dir, report_filename)
    report_public_url = f"/reports/{report_filename}"

    with open(report_filepath, "w", newline="", encoding="utf-8-sig") as f:
        fieldnames = ["corporate_number", "company_name", "form_url", "status", "message", "timestamp"]
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    complete_campaign_pg(campaign_id, duration, report_public_url)

    success_cnt = sum(1 for r in results if r.get("status") in ("SUCCESS_SENT", "SUCCESS_DRY_RUN"))
    skipped_cnt = sum(1 for r in results if "SKIPPED" in r.get("status", "") or "BLOCKED" in r.get("status", "") or r.get("status") in ("NO_FORM_ELEMENT", "ALREADY_CONTACTED", "DEAD_WEBSITE"))
    failed_cnt = len(results) - success_cnt - skipped_cnt

    print("\n" + "=" * 78)
    print("  SERVER CAMPAIGN BATCH COMPLETED")
    print(f"  Duration:         {duration // 60}m {duration % 60}s")
    print(f"  Processed:        {len(results)} companies")
    print(f"  [+] SUCCESS SENT: {success_cnt}")
    print(f"  [!] AUTO-SKIPPED: {skipped_cnt}")
    print(f"  [-] FAILED:       {failed_cnt}")
    print(f"  Report CSV:       {report_filepath}")
    print("=" * 78)
    return True


def run_daemon_loop(poll_interval: int = 30, concurrency: int = 3, limit: int = 50, live: bool = True):
    global SHUTDOWN_SIGNALLED
    print(f"[*] Starting Server Worker Daemon (Polling every {poll_interval}s)...")
    while not SHUTDOWN_SIGNALLED:
        try:
            pending = fetch_pending_server_campaign()
            if pending:
                print(f"[!] Found actionable server_proxy campaign: {pending['id']} ('{pending['name']}')")
                execute_server_campaign(
                    campaign_id=str(pending["id"]),
                    concurrency=concurrency,
                    limit=limit,
                    live=live
                )
            else:
                time.sleep(poll_interval)
        except Exception as e:
            print(f"[!] Daemon polling error: {e}")
            time.sleep(10)


def main():
    parser = argparse.ArgumentParser(description="Kigyou-List Server-Side Form DM Worker")
    parser.add_argument("--campaign-id", type=str, default=None, help="Specific internal campaign UUID to execute")
    parser.add_argument("--daemon", action="store_true", help="Run in continuous daemon polling mode")
    parser.add_argument("--poll-interval", type=int, default=30, help="Daemon polling interval in seconds (default: 30)")
    parser.add_argument("--limit", type=int, default=50, help="Number of companies per batch (default: 50)")
    parser.add_argument("--concurrency", "-c", type=int, default=3, help="Concurrent workers (default: 3)")
    parser.add_argument("--proxy", type=str, default=None, help="Dedicated Proxy URL (e.g. http://user:pass@proxy.example.com:8080)")
    parser.add_argument("--live", action="store_true", help="Submit forms for real (Default is dry-run)")
    parser.add_argument("--screenshot", action="store_true", help="Save screenshots for audit")
    args = parser.parse_args()

    if args.daemon:
        run_daemon_loop(
            poll_interval=args.poll_interval,
            concurrency=args.concurrency,
            limit=args.limit,
            live=args.live
        )
    elif args.campaign_id:
        execute_server_campaign(
            campaign_id=args.campaign_id,
            concurrency=args.concurrency,
            limit=args.limit,
            proxy_url=args.proxy,
            live=args.live,
            screenshot=args.screenshot
        )
    else:
        parser.print_help()
        print("\n[!] Please specify either --campaign-id <UUID> or --daemon")
        sys.exit(1)


if __name__ == "__main__":
    main()
