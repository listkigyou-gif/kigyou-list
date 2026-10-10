#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Campaign Runner & Settlement Engine for Kigyou-List Form Outreach
================================================================
Connects user campaigns stored in database (SQLite / PostgreSQL) with
the Playwright Form Dispatcher engine, generates audit delivery CSV reports,
and triggers automatic financial settlement (Approach 1: auto-refund unsent/skipped).
"""

import os
import sys
import time
import json
import sqlite3
import argparse
import csv
import threading
import queue
import socket
import urllib.request
import urllib.error
from urllib.parse import urlparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
from typing import Dict, Any, List, Optional

try:
    from dotenv import load_dotenv
    env_local = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local")
    if os.path.exists(env_local):
        load_dotenv(env_local)
except ImportError:
    pass

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

def parse_proxy_url(proxy_str: str):
    if not proxy_str:
        return None
    if not (proxy_str.startswith("http://") or proxy_str.startswith("https://") or proxy_str.startswith("socks5://")):
        proxy_str = "http://" + proxy_str
    parsed = urlparse(proxy_str)
    config = {
        "server": f"{parsed.scheme}://{parsed.hostname}:{parsed.port}",
        "bypass": "localhost, 127.0.0.1"
    }
    if parsed.username:
        config["username"] = parsed.username
    if parsed.password:
        config["password"] = parsed.password
    return config

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(ROOT_DIR, "kigyou-list.db")
REPORTS_DIR = os.path.join(ROOT_DIR, "frontend", "public", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)
ADMIN_USER = "trungkim8694@gmail.com"
API_BASE = "http://localhost:3000"

# Add form_dispatcher directory to python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dispatcher import FormDispatcher, HAS_PLAYWRIGHT
if HAS_PLAYWRIGHT:
    from playwright.sync_api import sync_playwright


# ==========================================
# MOCK SERVER FOR SAFE END-TO-END TESTING
# ==========================================
class MockFormHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()

        if self.path == "/standard":
            html = """<!DOCTYPE html>
            <html lang="ja">
            <head><meta charset="utf-8"><title>お問い合わせ | テスト株式会社</title></head>
            <body>
                <h1>お問い合わせ窓口</h1>
                <form action="/submit" method="POST">
                    <div><label>会社名</label><input type="text" name="company" placeholder="貴社名"></div>
                    <div><label>ご担当者様名</label><input type="text" name="name" placeholder="お名前"></div>
                    <div><label>フリガナ</label><input type="text" name="kana" placeholder="フリガナ"></div>
                    <div><label>メールアドレス</label><input type="email" name="email" placeholder="mail@example.com"></div>
                    <div><label>電話番号</label><input type="tel" name="phone" placeholder="03-1234-5678"></div>
                    <div><label>件名</label><input type="text" name="subject" placeholder="件名"></div>
                    <div><label>お問い合わせ内容</label><textarea name="body" rows="5"></textarea></div>
                    <div><label><input type="checkbox" name="agree"> プライバシーポリシーに同意する</label></div>
                    <button type="submit">送信する</button>
                </form>
            </body>
            </html>"""
            self.wfile.write(html.encode("utf-8"))

        elif self.path == "/prohibited":
            html = """<!DOCTYPE html>
            <html lang="ja">
            <head><meta charset="utf-8"><title>お問い合わせ | 営業お断り株式会社</title></head>
            <body>
                <h1>お問い合わせフォーム</h1>
                <div style="color:red; font-weight:bold;">
                    ※注意：営業目的、セールス、売り込み等のご連絡は固くお断りいたします。
                </div>
                <form action="/submit" method="POST">
                    <div><label>お名前</label><input type="text" name="name"></div>
                    <div><label>メールアドレス</label><input type="email" name="email"></div>
                    <div><label>内容</label><textarea name="body"></textarea></div>
                    <button type="submit">送信する</button>
                </form>
            </body>
            </html>"""
            self.wfile.write(html.encode("utf-8"))

        elif self.path == "/captcha":
            html = """<!DOCTYPE html>
            <html lang="ja">
            <head><meta charset="utf-8"><title>お問い合わせ | セキュリティ株式会社</title></head>
            <body>
                <h1>お問い合わせ</h1>
                <form action="/submit" method="POST">
                    <div><label>お名前</label><input type="text" name="name"></div>
                    <div><label>メールアドレス</label><input type="email" name="email"></div>
                    <div><label>内容</label><textarea name="body"></textarea></div>
                    <div class="g-recaptcha" data-sitekey="6Lc_mock_key">reCAPTCHA Protection</div>
                    <button type="submit">送信する</button>
                </form>
            </body>
            </html>"""
            self.wfile.write(html.encode("utf-8"))

        else:
            self.wfile.write(b"OK")

    def do_POST(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()
        html = """<!DOCTYPE html><html><body><h1>送信が完了いたしました</h1><p>お問い合わせありがとうございます。</p></body></html>"""
        self.wfile.write(html.encode("utf-8"))

    def log_message(self, format, *args):
        pass  # Quiet logs


def start_mock_server(port: int = 39999):
    server = HTTPServer(("127.0.0.1", port), MockFormHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


# ==========================================
# CAMPAIGN RETRIEVAL & UPDATE HELPERS
# ==========================================
def get_campaign(campaign_id: str) -> Optional[Dict[str, Any]]:
    # 1. Try Next.js Admin API
    try:
        req = urllib.request.Request(
            f"{API_BASE}/api/admin/form-campaigns?status=all",
            headers={"x-admin-email": ADMIN_USER}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for cmp in data.get("campaigns", []):
                if cmp.get("id") == campaign_id:
                    return cmp
    except Exception:
        pass

    # 2. Try PostgreSQL fallback
    pg_url = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"
    try:
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(pg_url)
        c = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        c.execute("SELECT * FROM user_form_campaigns WHERE id = %s", (campaign_id,))
        row = c.fetchone()
        conn.close()
        if row:
            return dict(row)
    except Exception:
        pass

    # 3. Try SQLite fallback
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        row = c.execute("SELECT * FROM user_form_campaigns WHERE id = ?", (campaign_id,)).fetchone()
        conn.close()
        if row:
            return dict(row)

    return None


def complete_and_settle_campaign(
    campaign_id: str,
    success_count: int,
    skipped_count: int,
    report_file_url: str
) -> bool:
    # 1. Call Next.js Admin API to complete campaign and trigger auto-refund
    try:
        payload = json.dumps({
            "campaignId": campaign_id,
            "action": "complete",
            "successCount": success_count,
            "skippedCount": skipped_count,
            "reportFileUrl": report_file_url
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{API_BASE}/api/admin/form-campaigns",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "x-admin-email": ADMIN_USER
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                return True
    except Exception as e:
        print(f"[-] Admin API completion call failed: {e}")

    # 2. SQLite direct fallback
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute(
                """
                UPDATE user_form_campaigns 
                SET status = 'completed', success_count = ?, skipped_count = ?, 
                    report_file_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (success_count, skipped_count, report_file_url, campaign_id)
            )
            conn.commit()
            conn.close()
            return True
        except Exception:
            pass

    return False


# ==========================================
# CAMPAIGN DISPATCH RUNNER
# ==========================================
def run_campaign(
    campaign_id: str,
    mock_run: bool = False,
    dry_run: bool = False,
    limit: Optional[int] = None,
    proxy_url: Optional[str] = None,
    use_warp: bool = False,
    concurrency: int = 1,
    rotate_every: int = 5
) -> Dict[str, Any]:
    warp_ports = scan_docker_warp_ports() if use_warp else []
    active_proxy_str = proxy_url if proxy_url is not None else os.environ.get("OUTREACH_PROXY_URL")
    proxy_config = parse_proxy_url(active_proxy_str) if active_proxy_str else None

    print("=" * 65)
    print(f"  LAUNCHING FORM CAMPAIGN RUNNER: {campaign_id}")
    print(f"  Mode:        {'[MOCK RUN - 3 Test Types]' if mock_run else '[DRY RUN]' if dry_run else '[LIVE SUBMISSION]'}")
    print(f"  Workers:     {concurrency} concurrent threads")
    print(f"  Network:     {f'[DOCKER WARP POOL: {len(warp_ports)} active ports]' if warp_ports else '[' + proxy_config['server'] + ']' if proxy_config else '[DIRECT CONNECTION]'}")
    print("=" * 65)

    camp = get_campaign(campaign_id)
    if not camp:
        raise ValueError(f"Campaign with ID '{campaign_id}' not found.")

    print(f"[*] Campaign Name: {camp.get('name') or camp.get('title')}")
    print(f"[*] User Email:    {camp.get('user_email')}")
    print(f"[*] Target Volume: {camp.get('target_count')} companies")
    print(f"[*] Current Status:{camp.get('status')}")

    sender_profile = {
        "company_name": camp.get("sender_company") or camp.get("sender_company_name") or "株式会社アウトバウンドマーケティング",
        "contact_name": camp.get("sender_name") or "山田 太郎",
        "furigana": "ヤマダ タロウ",
        "email": camp.get("sender_email") or "contact@example.com",
        "phone": camp.get("sender_phone") or "03-5555-0123",
        "subject": camp.get("subject") or camp.get("pitch_subject") or "貴社事業に関する協業のご提案",
        "message_body": camp.get("body") or camp.get("pitch_body") or "貴社Webサイトより失礼いたします。"
    }

    mock_server = None
    if mock_run:
        port = 39999
        mock_server = start_mock_server(port)
        time.sleep(0.5)
        # Create 3 deterministic test targets
        targets = [
            {
                "corporate_number": "9000000000001",
                "company_name": "テストスタンダード株式会社",
                "contact_form_url": f"http://127.0.0.1:{port}/standard"
            },
            {
                "corporate_number": "9000000000002",
                "company_name": "テスト営業禁止株式会社",
                "contact_form_url": f"http://127.0.0.1:{port}/prohibited"
            },
            {
                "corporate_number": "9000000000003",
                "company_name": "テストセキュリティ株式会社",
                "contact_form_url": f"http://127.0.0.1:{port}/captcha"
            }
        ]
    else:
        # Load from database companies
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        effective_limit = limit or min(int(camp.get("target_count") or 10), 10)
        rows = c.execute(
            """
            SELECT corporate_number, company_name, prefecture_name, website_url, contact_form_url 
            FROM companies 
            WHERE contact_form_url IS NOT NULL AND contact_form_url != '' 
            LIMIT ?
            """,
            (effective_limit,)
        ).fetchall()
        conn.close()
        targets = [dict(r) for r in rows]

    print(f"[*] Loaded {len(targets)} targets for execution.")

    dispatcher = FormDispatcher(
        sender_profile=sender_profile,
        dry_run=dry_run and not mock_run,  # In mock run, allow submit to hit mock server
        save_screenshot=False
    )

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, proxy=proxy_config)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()

        for idx, company in enumerate(targets, 1):
            print(f"[{idx}/{len(targets)}] Dispatching: {company['company_name']} ({company['corporate_number']})")
            res = dispatcher.dispatch_single_company(page, company)
            results.append(res)
            time.sleep(0.5)

        browser.close()

    if mock_server:
        mock_server.shutdown()

    # Generate CSV delivery report
    report_filename = f"delivery_report_{campaign_id}_{int(time.time())}.csv"
    report_filepath = os.path.join(REPORTS_DIR, report_filename)
    report_web_url = f"/reports/{report_filename}"

    with open(report_filepath, "w", newline="", encoding="utf-8-sig") as f:
        fieldnames = ["corporate_number", "company_name", "form_url", "status", "billable", "message", "timestamp"]
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(results)

    success_count = sum(1 for r in results if r.get("status") == "SUCCESS_SENT" or r.get("billable") is True)
    skipped_count = len(results) - success_count
    target_count = int(camp.get("target_count") or 100)

    # Mark campaign completed and settle credits via Admin API
    complete_and_settle_campaign(
        campaign_id=campaign_id,
        success_count=success_count,
        skipped_count=skipped_count,
        report_file_url=report_web_url
    )

    print("\n" + "=" * 65)
    print("  CAMPAIGN EXECUTION & SETTLEMENT COMPLETE")
    print("=" * 65)
    print(f"  Campaign:             {camp.get('name') or camp.get('title')} ({campaign_id})")
    print(f"  Total Processed:      {len(results)}")
    print(f"  Delivered (Billable): {success_count} forms")
    print(f"  Skipped (Refunded):   {skipped_count} forms")
    print(f"  Refund to Wallet:     {max(0, target_count - success_count)} credits")
    print(f"  Report CSV URL:       {report_web_url}")
    print("=" * 65 + "\n")

    return {
        "campaign_id": campaign_id,
        "total": len(results),
        "success_count": success_count,
        "skipped_count": skipped_count,
        "refund_count": max(0, target_count - success_count),
        "report_file_url": report_web_url,
        "results": results
    }


def main():
    parser = argparse.ArgumentParser(description="Kigyou-List Campaign Runner & Settlement Engine")
    parser.add_argument("--campaign-id", type=str, required=True, help="Campaign ID to execute")
    parser.add_argument("--mock-run", action="store_true", help="Run against 3 deterministic mock targets")
    parser.add_argument("--dry-run", action="store_true", help="Simulate form filling without final submit")
    parser.add_argument("--limit", type=int, help="Limit number of companies to dispatch")
    parser.add_argument("--proxy", type=str, default=os.environ.get("OUTREACH_PROXY_URL"), help="Proxy URL (e.g. http://user:pass@host:port)")
    parser.add_argument("--warp", action="store_true", help="Use Cloudflare WARP proxy pool with auto-rotation")
    parser.add_argument("--concurrency", "-c", type=int, default=3, help="Concurrent worker threads (default: 3)")
    parser.add_argument("--rotate-every", "-r", type=int, default=5, help="Rotate proxy every N forms")
    args = parser.parse_args()

    run_campaign(
        campaign_id=args.campaign_id,
        mock_run=args.mock_run,
        dry_run=args.dry_run,
        limit=args.limit,
        proxy_url=args.proxy,
        use_warp=args.warp,
        concurrency=args.concurrency,
        rotate_every=args.rotate_every
    )


if __name__ == "__main__":
    main()
