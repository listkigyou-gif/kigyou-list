#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Internal Form DM Campaign Runner (High-Performance Multi-Worker + Rotating Proxy Edition)
========================================================================================
Executes internal marketing campaigns for Kigyou-List via Japanese corporate contact forms.
Supports:
  1. High-speed Multi-Worker Concurrency (--concurrency N / --workers N)
  2. Auto-discovery of Docker WARP Multi-Proxy Pool (caomingjun/warp: 80+ containers)
  3. Dynamic Proxy Rotation (--rotate-every N / Failover on Captcha/Block)
  4. System-level Cloudflare WARP VPN Tunnel fallback (0 cost, local PC)
  5. Real-time DB logging to internal_form_send_logs
  6. Auto-completion, audit metrics & CSV export
"""

import os
import sys
import time
import json
import argparse
import csv
import queue
import threading
import socket
from datetime import datetime
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

try:
    from dotenv import load_dotenv
    env_local = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", ".env.local")
    if os.path.exists(env_local):
        load_dotenv(env_local)
except ImportError:
    pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dispatcher import FormDispatcher, parse_proxy_url, HAS_PLAYWRIGHT
if HAS_PLAYWRIGHT:
    from playwright.sync_api import sync_playwright

def get_pg_connection():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL is not set in environment or frontend/.env.local")
    import psycopg2
    import psycopg2.extras
    return psycopg2.connect(db_url)

def fetch_campaign(campaign_id: str) -> Optional[Dict[str, Any]]:
    conn = get_pg_connection()
    import psycopg2.extras
    c = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    c.execute("SELECT * FROM internal_form_campaigns WHERE id = %s", (campaign_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def fetch_target_companies_pg(filters: Dict[str, Any], limit: int = 50) -> List[Dict[str, Any]]:
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
        ORDER BY c.employee_count DESC NULLS LAST, c.corporate_number ASC
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
    elif status.startswith("SKIPPED") or status.startswith("BLOCKED"):
        c.execute("UPDATE internal_form_campaigns SET skipped_count = skipped_count + 1, updated_at = NOW() WHERE id = %s", (campaign_id,))
    else:
        c.execute("UPDATE internal_form_campaigns SET failed_count = failed_count + 1, updated_at = NOW() WHERE id = %s", (campaign_id,))

    conn.commit()
    conn.close()

def complete_campaign_pg(campaign_id: str, duration_sec: int, report_url: str):
    conn = get_pg_connection()
    c = conn.cursor()
    c.execute(
        """
        UPDATE internal_form_campaigns
        SET status = 'completed', duration_seconds = %s, report_file_url = %s, completed_at = NOW(), updated_at = NOW()
        WHERE id = %s
        """,
        (duration_sec, report_url, campaign_id)
    )
    conn.commit()
    conn.close()

def scan_docker_warp_ports() -> List[int]:
    """Auto-detect active Docker WARP SOCKS5 proxy containers (40001-40100, 41000-41100)."""
    active_ports = []
    candidates = list(range(40001, 40101)) + list(range(41000, 41101))
    for p in candidates:
        try:
            with socket.create_connection(("127.0.0.1", p), timeout=0.03):
                active_ports.append(p)
        except Exception:
            pass
    return active_ports

def create_browser_session(playwright_instance, proxy_config: Optional[Dict[str, Any]]):
    browser = playwright_instance.chromium.launch(headless=True, proxy=proxy_config)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        viewport={"width": 1280, "height": 800}
    )
    page = context.new_page()
    return browser, context, page

def worker_routine(
    worker_id: int,
    total_workers: int,
    task_queue: queue.Queue,
    total_tasks: int,
    campaign_id: str,
    sender_profile: Dict[str, Any],
    warp_ports: List[int],
    fallback_proxy_str: Optional[str],
    is_warp_mode: bool,
    rotate_every: int,
    is_dry_run: bool,
    save_screenshot: bool,
    results_list: List[Dict[str, Any]],
    lock: threading.Lock,
    progress_counter: Dict[str, int]
):
    dispatcher = FormDispatcher(
        sender_profile=sender_profile,
        dry_run=is_dry_run,
        save_screenshot=save_screenshot
    )

    current_port_idx = (worker_id - 1) % len(warp_ports) if warp_ports else 0

    def resolve_proxy(port_idx: int):
        if warp_ports:
            port = warp_ports[port_idx % len(warp_ports)]
            p_str = f"socks5://127.0.0.1:{port}"
            return parse_proxy_url(p_str), f"WARP Port {port}"
        elif fallback_proxy_str:
            return parse_proxy_url(fallback_proxy_str), f"Proxy {fallback_proxy_str}"
        else:
            return None, "WARP System VPN" if is_warp_mode else "Direct"

    curr_proxy_conf, curr_proxy_label = resolve_proxy(current_port_idx)
    submissions_on_curr_proxy = 0

    with sync_playwright() as p:
        try:
            browser, context, page = create_browser_session(p, curr_proxy_conf)
        except Exception as e:
            print(f"[Worker #{worker_id}] Browser launch error: {e}")
            return

        while True:
            try:
                comp = task_queue.get_nowait()
            except queue.Empty:
                break

            # 1. Check if scheduled rotation is due
            if warp_ports and len(warp_ports) > 1 and submissions_on_curr_proxy >= rotate_every:
                print(f"  [🔄 Worker #{worker_id}] Reached {submissions_on_curr_proxy} dispatches. Rotating to next WARP proxy...")
                try:
                    browser.close()
                except Exception:
                    pass
                current_port_idx = (current_port_idx + total_workers) % len(warp_ports)
                curr_proxy_conf, curr_proxy_label = resolve_proxy(current_port_idx)
                print(f"  [🔄 Worker #{worker_id}] Now connected to: {curr_proxy_label}")
                try:
                    browser, context, page = create_browser_session(p, curr_proxy_conf)
                except Exception as rot_e:
                    print(f"  [!] Worker #{worker_id} rotation launch error: {rot_e}")
                    break
                submissions_on_curr_proxy = 0

            with lock:
                progress_counter["done"] += 1
                curr_idx = progress_counter["done"]

            comp_name = comp.get("company_name", "Target")
            form_url = comp.get("contact_form_url", "")
            print(f"\n[Worker #{worker_id} | {curr_idx}/{total_tasks}] Processing: {comp_name} ({curr_proxy_label})")
            print(f"  [>] Form URL: {form_url}")

            try:
                res = dispatcher.dispatch_single_company(page, comp)
            except Exception as e:
                res = {
                    "corporate_number": comp.get("corporate_number"),
                    "company_name": comp.get("company_name"),
                    "form_url": comp.get("contact_form_url"),
                    "status": "FAILED",
                    "message": f"Execution error: {str(e)[:150]}",
                    "timestamp": datetime.now().isoformat()
                }

            status = res.get("status", "FAILED")
            msg = res.get("message", "")
            submissions_on_curr_proxy += 1

            with lock:
                results_list.append(res)

            # Log to DB immediately
            try:
                record_log_pg(campaign_id, comp, status, msg)
            except Exception as e:
                print(f"  [Worker #{worker_id}] DB log error: {e}")

            # 2. Check for Failover Instant Rotation if Blocked / Captcha
            is_blocked = "BLOCKED" in status or "CAPTCHA" in status or "403" in msg or "429" in msg
            if is_blocked and warp_ports and len(warp_ports) > 1:
                print(f"  [⚠️ Worker #{worker_id}] Anti-bot/block triggered ({status}). Forcing instant WARP proxy rotation...")
                try:
                    browser.close()
                except Exception:
                    pass
                current_port_idx = (current_port_idx + 1) % len(warp_ports)
                curr_proxy_conf, curr_proxy_label = resolve_proxy(current_port_idx)
                print(f"  [🔄 Worker #{worker_id}] Switched instantly to: {curr_proxy_label}")
                try:
                    browser, context, page = create_browser_session(p, curr_proxy_conf)
                except Exception:
                    pass
                submissions_on_curr_proxy = 0

            task_queue.task_done()
            time.sleep(1.0)

        try:
            browser.close()
        except Exception:
            pass

def main():
    # Normalize common CLI typos like --limit5 -> --limit 5
    normalized_argv = []
    for arg in sys.argv:
        if arg.startswith("--limit") and len(arg) > 7 and arg[7:].isdigit():
            normalized_argv.extend(["--limit", arg[7:]])
        elif arg.startswith("--concurrency") and len(arg) > 13 and arg[13:].isdigit():
            normalized_argv.extend(["--concurrency", arg[13:]])
        elif arg.startswith("--rotate-every") and len(arg) > 14 and arg[14:].isdigit():
            normalized_argv.extend(["--rotate-every", arg[14:]])
        else:
            normalized_argv.append(arg)
    sys.argv = normalized_argv

    parser = argparse.ArgumentParser(description="Kigyou-List Internal Form DM Multi-Worker + Rotating Proxy Runner")
    parser.add_argument("--campaign-id", type=str, required=True, help="UUID of internal form campaign")
    parser.add_argument("--limit", type=int, default=10, help="Number of companies to dispatch")
    parser.add_argument("--concurrency", "-c", "--workers", type=int, default=3, help="Concurrent worker threads (default: 3)")
    parser.add_argument("--rotate-every", "-r", type=int, default=5, help="Rotate to next proxy in pool after N form dispatches (default: 5)")
    parser.add_argument("--live", action="store_true", help="Submit forms for real (Default is dry-run)")
    parser.add_argument("--warp", action="store_true", help="Use Cloudflare WARP (Auto-detects Docker WARP proxy pool or System WARP)")
    parser.add_argument("--proxy", type=str, default=None, help="Custom Proxy URL (e.g. socks5://127.0.0.1:40001)")
    parser.add_argument("--screenshot", action="store_true", help="Save screenshots for audit")
    args = parser.parse_args()

    is_dry_run = not args.live

    # 1. Detect Network & Docker WARP Pool
    warp_ports = []
    if args.warp:
        print("[*] Scanning local Docker WARP SOCKS5 proxy pool...")
        warp_ports = scan_docker_warp_ports()

    if warp_ports:
        network_summary = f"[DOCKER WARP POOL: {len(warp_ports)} active ports (Auto-Rotating every {args.rotate_every} forms)]"
    elif args.warp:
        network_summary = "[CLOUDFLARE WARP / SYSTEM VPN TUNNEL (Zero Cost)]"
    elif args.proxy:
        network_summary = f"[CUSTOM PROXY: {args.proxy}]"
    else:
        network_summary = "[DIRECT / LOCAL IP]"

    print("=" * 78)
    print("  KIGYOU-LIST: INTERNAL FORM DM RUNNER (MULTI-WORKER + ROTATING PROXY)")
    print(f"  Campaign ID:    {args.campaign_id}")
    print(f"  Mode:           {'[DRY RUN - Safe Simulation]' if is_dry_run else '[LIVE SUBMISSION - Real Outreach]'}")
    print(f"  Workers:        {args.concurrency} concurrent threads (High-Performance)")
    print(f"  Proxy Rotation: Every {args.rotate_every} forms + Instant Failover on Captcha/Block")
    print(f"  Network Mode:   {network_summary}")
    print(f"  Screenshots:    {'[ENABLED]' if args.screenshot else '[DISABLED - Fast Lightweight Mode]'}")
    print("=" * 78)

    if not HAS_PLAYWRIGHT:
        print("[!] Playwright is not installed. Please install: pip install playwright && playwright install chromium")
        sys.exit(1)

    # 2. Fetch Campaign Info
    campaign = fetch_campaign(args.campaign_id)
    if not campaign:
        print(f"[!] Campaign with ID {args.campaign_id} not found in database.")
        sys.exit(1)

    print(f"[*] Loaded Campaign: '{campaign['name']}'")
    print(f"[*] Sender: {campaign['sender_company']} ({campaign['sender_name']}) <{campaign['sender_email']}>")

    sender_profile = {
        "company_name": campaign["sender_company"],
        "contact_name": campaign["sender_name"],
        "furigana": campaign.get("sender_furigana") or "クリモト ヨシユキ",
        "email": campaign["sender_email"],
        "phone": campaign.get("sender_phone") or "03-5555-0123",
        "website": campaign.get("sender_website") or "https://kigyoulist.com",
        "subject": campaign["subject"],
        "message_body": campaign["message_body"]
    }

    # 3. Update campaign to processing
    conn = get_pg_connection()
    c = conn.cursor()
    c.execute("UPDATE internal_form_campaigns SET status = 'processing', started_at = NOW(), updated_at = NOW() WHERE id = %s", (args.campaign_id,))
    conn.commit()
    conn.close()

    # 4. Fetch Target Companies
    filters = campaign.get("target_filters") or {}
    if isinstance(filters, str):
        filters = json.loads(filters)

    targets = fetch_target_companies_pg(filters, limit=args.limit)
    print(f"[*] Fetched {len(targets)} target companies matching audience criteria.")

    if not targets:
        print("[!] No target companies found. Marking campaign completed.")
        complete_campaign_pg(args.campaign_id, 0, "")
        sys.exit(0)

    # 5. Populate Task Queue
    task_queue = queue.Queue()
    for t in targets:
        task_queue.put(t)

    results: List[Dict[str, Any]] = []
    lock = threading.Lock()
    progress_counter = {"done": 0}
    start_time = time.time()

    concurrency = min(args.concurrency, len(targets))
    threads: List[threading.Thread] = []

    print(f"[*] Launching {concurrency} concurrent browser workers with auto-rotation...\n")

    for w_id in range(1, concurrency + 1):
        t = threading.Thread(
            target=worker_routine,
            args=(
                w_id,
                concurrency,
                task_queue,
                len(targets),
                args.campaign_id,
                sender_profile,
                warp_ports,
                args.proxy,
                args.warp,
                args.rotate_every,
                is_dry_run,
                args.screenshot,
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

    total_duration = int(time.time() - start_time)

    # 6. Generate Audit CSV File
    reports_dir = os.path.join(ROOT_DIR, "frontend", "public", "reports")
    os.makedirs(reports_dir, exist_ok=True)
    report_filename = f"internal_form_dm_{args.campaign_id[:8]}_{int(time.time())}.csv"
    report_filepath = os.path.join(reports_dir, report_filename)
    report_public_url = f"/reports/{report_filename}"

    with open(report_filepath, "w", newline="", encoding="utf-8-sig") as f:
        fieldnames = ["corporate_number", "company_name", "form_url", "status", "message", "timestamp"]
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    # 7. Mark campaign completed in DB
    complete_campaign_pg(args.campaign_id, total_duration, report_public_url)

    # 8. Print Executive Summary
    success_count = sum(1 for r in results if r.get("status") == "SUCCESS_SENT")
    skipped_count = sum(1 for r in results if "SKIPPED" in r.get("status", "") or "BLOCKED" in r.get("status", ""))
    failed_count = len(results) - success_count - skipped_count

    print("\n" + "=" * 78)
    print("  CAMPAIGN EXECUTION FINISHED & AUDIT RECORDED")
    print("=" * 78)
    print(f"  Duration:         {total_duration // 60}m {total_duration % 60}s")
    print(f"  Total Processed:  {len(results)}")
    print(f"  Workers Used:     {concurrency} threads")
    print(f"  Proxy Rotation:   Active (Rotated every {args.rotate_every} forms across {len(warp_ports)} proxies)")
    print(f"  [+] SUCCESS SENT: {success_count} companies")
    print(f"  [!] AUTO-SKIPPED: {skipped_count} companies (Anti-Spam / Captcha Protection)")
    print(f"  [-] FAILED:       {failed_count} companies")
    print(f"  Audit CSV Report: {report_filepath}")
    print(f"  Public URL:       {report_public_url}")
    print("=" * 78)

if __name__ == "__main__":
    main()
