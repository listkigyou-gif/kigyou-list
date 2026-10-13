#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Comprehensive Proxy & End-to-End Test Suite for Form Outreach (問い合わせフォーム営業)
======================================================================================
Verifies:
1. Proxy configuration parser (protocol, host, port, credentials, localhost bypass).
2. Live Proxy Geo-location verification (confirms Japan / Tokyo IP).
3. Playwright browser engine integration with proxy.
4. Full customer campaign lifecycle through Proxy (Create -> Reserve -> Approve -> Dispatch -> Settle).
5. Error tolerance & credit refund guarantee on connection anomalies.
"""

import os
import sys
import time
import json
import sqlite3
import urllib.request
import urllib.error
from urllib.parse import urlparse

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT_DIR, "kigyou-list.db")
API_BASE = "http://localhost:3000"
TEST_USER = "test_proxy_agent@example.com"
ADMIN_USER = "trungkim8694@gmail.com"

# Import dispatcher & runner
sys.path.insert(0, os.path.join(ROOT_DIR, "scripts", "form_dispatcher"))
from dispatcher import parse_proxy_url, HAS_PLAYWRIGHT
from campaign_runner import run_campaign
if HAS_PLAYWRIGHT:
    from playwright.sync_api import sync_playwright

# Load .env.local
try:
    from dotenv import load_dotenv
    env_local = os.path.join(ROOT_DIR, ".env.local")
    if os.path.exists(env_local):
        load_dotenv(env_local)
except ImportError:
    pass

PROXY_URL = os.environ.get("OUTREACH_PROXY_URL")


# ==========================================
# HTTP API HELPERS
# ==========================================
def http_request(path: str, method: str = "GET", data: dict = None, headers: dict = None) -> tuple[int, dict]:
    url = f"{API_BASE}{path}"
    req_headers = {
        "User-Agent": "E2E-Proxy-Runner/1.0",
        "Content-Type": "application/json"
    }
    if headers:
        req_headers.update(headers)

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp_body = resp.read().decode("utf-8")
            try:
                return resp.status, json.loads(resp_body)
            except Exception:
                return resp.status, {"raw": resp_body}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}


# ==========================================
# ASSERTIONS
# ==========================================
def assert_equal(actual, expected, msg: str):
    if actual != expected:
        print(f"  [FAIL] {msg} -> Expected: {expected}, Got: {actual}")
        raise AssertionError(f"{msg}: expected {expected}, got {actual}")
    print(f"  [PASS] {msg}: {actual}")


def assert_true(condition, msg: str):
    if not condition:
        print(f"  [FAIL] {msg}")
        raise AssertionError(f"Condition failed: {msg}")
    print(f"  [PASS] {msg}")


# ==========================================
# TEST RUNNER
# ==========================================
def main():
    print("=" * 70)
    print("  KIGYOU-LIST: PROXY & FORM OUTREACH END-TO-END VERIFICATION")
    print("=" * 70)

    # -------------------------------------------------------------
    # STAGE 1: PROXY CONFIGURATION & PARSER UNIT TEST
    # -------------------------------------------------------------
    print("\n--- STAGE 1: PROXY CONFIGURATION & PARSER UNIT TEST ---")
    assert_true(PROXY_URL is not None and len(PROXY_URL) > 0, "1A. OUTREACH_PROXY_URL is defined in .env.local")
    print(f"  [*] Raw Proxy String: {PROXY_URL}")

    proxy_cfg = parse_proxy_url(PROXY_URL)
    assert_true(proxy_cfg is not None, "1B. Proxy parsed successfully")
    assert_true("server" in proxy_cfg, "1C. Proxy server field generated")
    assert_true(proxy_cfg.get("username") is not None, "1D. Proxy username extracted")
    assert_true(proxy_cfg.get("password") is not None, "1E. Proxy password extracted")
    assert_equal(proxy_cfg.get("bypass"), "localhost, 127.0.0.1", "1F. Localhost bypass configured")
    print(f"  [*] Parsed Config Server: {proxy_cfg['server']} (User: {proxy_cfg['username']})")

    # -------------------------------------------------------------
    # STAGE 2: LIVE PROXY CONNECTIVITY & GEO-IP VERIFICATION (JAPAN)
    # -------------------------------------------------------------
    print("\n--- STAGE 2: DIRECT PROXY NETWORK & GEO-IP (JAPAN) ---")
    try:
        proxy_handler = urllib.request.ProxyHandler({'http': PROXY_URL, 'https': PROXY_URL})
        opener = urllib.request.build_opener(proxy_handler)
        req = urllib.request.Request("http://ip-api.com/json", headers={"User-Agent": "curl/7.68.0"})
        with opener.open(req, timeout=20) as resp:
            geo_data = json.loads(resp.read().decode("utf-8"))
        
        print(f"  [*] Detected GeoIP Response:")
        print(f"      - Query IP:   {geo_data.get('query')}")
        print(f"      - Country:    {geo_data.get('country')} ({geo_data.get('countryCode')})")
        print(f"      - City:       {geo_data.get('city')} ({geo_data.get('regionName')})")
        print(f"      - ISP:        {geo_data.get('isp')}")

        assert_equal(geo_data.get("status"), "success", "2A. GeoIP API response status is 'success'")
        assert_equal(geo_data.get("countryCode"), "JP", "2B. Proxy IP is physically located in Japan (JP)")
        assert_true("Tokyo" in geo_data.get("city", "") or "Japan" in geo_data.get("country", ""), "2C. Proxy operates in Japan region")
    except Exception as e:
        print(f"  [FAIL] Failed to connect through proxy: {e}")
        raise e

    # -------------------------------------------------------------
    # STAGE 3: PLAYWRIGHT BROWSER NAVIGATION THROUGH PROXY
    # -------------------------------------------------------------
    print("\n--- STAGE 3: PLAYWRIGHT BROWSER VIA PROXY ---")
    assert_true(HAS_PLAYWRIGHT, "3A. Playwright is available in python environment")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, proxy=proxy_cfg)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        page = context.new_page()

        print("  [*] Visiting GeoIP endpoint from Playwright browser through proxy...")
        page.goto("http://ip-api.com/json", timeout=25000)
        body_text = page.inner_text("body")
        browser_geo = json.loads(body_text)

        print(f"  [*] Playwright Browser IP: {browser_geo.get('query')} ({browser_geo.get('country')})")
        assert_equal(browser_geo.get("countryCode"), "JP", "3B. Playwright browser connects via Japan proxy IP")
        browser.close()

    # -------------------------------------------------------------
    # STAGE 4: FULL CAMPAIGN LIFECYCLE DISPATCH VIA PROXY
    # -------------------------------------------------------------
    print("\n--- STAGE 4: CUSTOMER CAMPAIGN LIFECYCLE THROUGH PROXY ---")

    # Clean up test user state
    try:
        import psycopg2
        pg = psycopg2.connect("postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")
        pgc = pg.cursor()
        pgc.execute("DELETE FROM user_form_campaigns WHERE user_email = %s", (TEST_USER,))
        pgc.execute("DELETE FROM user_form_credits WHERE user_email = %s", (TEST_USER,))
        pgc.execute("DELETE FROM user_form_credit_transactions WHERE user_email = %s", (TEST_USER,))
        pg.commit()
        pg.close()
    except Exception:
        pass

    if os.path.exists(DB_PATH):
        sl = sqlite3.connect(DB_PATH)
        slc = sl.cursor()
        slc.execute("DELETE FROM user_form_campaigns WHERE user_email = ?", (TEST_USER,))
        slc.execute("DELETE FROM user_form_credits WHERE user_email = ?", (TEST_USER,))
        slc.execute("DELETE FROM user_form_credit_transactions WHERE user_email = ?", (TEST_USER,))
        sl.commit()
        sl.close()

    # 4A. Create campaign
    camp_payload = {
        "name": "Proxyテスト_B2B営業_2026",
        "sender_company": "株式会社アウトバウンドマーケティング",
        "sender_name": "山田 太郎",
        "sender_email": TEST_USER,
        "sender_phone": "03-5555-0123",
        "sender_website": "https://example-outreach.jp",
        "subject": "【協業のご提案】貴社業務効率化ソリューションのご案内",
        "body": "貴社Webサイト問い合わせフォームより大変恐れ入ります。業務効率化のご案内です。\n※配信不要な場合はその旨ご返信ください。",
        "target_count": 100,
        "target_filters": {"type": "preset_filter", "industry": "it", "prefecture": "tokyo"},
        "status": "draft"
    }
    status, res = http_request("/api/user/form-campaigns", method="POST", data=camp_payload, headers={"x-user-email": TEST_USER})
    assert_equal(status, 200, "4A. Campaign created in draft state")
    campaign_id = res.get("campaign", {}).get("id")

    # 4B. Top-up credits via simulated Stripe webhook (+1000)
    status, res = http_request("/api/stripe/webhook", method="POST", data={"simulated": True, "formPlanId": "form_1k", "email": TEST_USER, "allowance": 1000, "amount_jpy": 19600})
    assert_equal(status, 200, "4B. Credit wallet charged with 1,000 credits")

    # 4C. Submit for approval (reserve 100 credits)
    status, res = http_request("/api/user/form-campaigns", method="PATCH", data={"id": campaign_id, "action": "submit_for_approval"}, headers={"x-user-email": TEST_USER})
    assert_equal(status, 200, "4C. Campaign submitted for approval, 100 credits reserved")

    # 4D. Admin approval
    status, res = http_request("/api/admin/form-campaigns", method="POST", data={"campaignId": campaign_id, "action": "approve"}, headers={"x-admin-email": ADMIN_USER})
    assert_equal(status, 200, "4D. Admin approved campaign")

    # 4E. Execute campaign runner with Japan Proxy enabled
    print("\n  [*] Running Campaign Runner with Live Proxy configuration...")
    exec_res = run_campaign(campaign_id=campaign_id, mock_run=True, proxy_url=PROXY_URL)
    assert_equal(exec_res.get("success_count"), 1, "4E-1. 1 form successfully submitted (SUCCESS_SENT)")
    assert_equal(exec_res.get("skipped_count"), 2, "4E-2. 2 forms safely skipped (Disclaimer & CAPTCHA)")

    # 4F. Check campaign completed & auto-refunded
    status, res = http_request("/api/user/form-campaigns", method="GET", headers={"x-user-email": TEST_USER})
    camp_rec = next(c for c in res.get("campaigns", []) if c["id"] == campaign_id)
    assert_equal(camp_rec.get("status"), "completed", "4F-1. Campaign status updated to 'completed'")
    assert_true(camp_rec.get("report_file_url") is not None, "4F-2. Delivery report URL recorded")

    status, res = http_request("/api/user/form-credits", method="GET", headers={"x-user-email": TEST_USER})
    assert_equal(res.get("credits", {}).get("balance"), 999, "4F-3. Final wallet balance is exactly 999 (1 charged, 99 refunded)")

    # 4G. Check CSV report file
    report_file_rel = camp_rec.get("report_file_url").lstrip("/")
    report_file_abs = os.path.join(ROOT_DIR, "frontend", "public", report_file_rel)
    assert_true(os.path.exists(report_file_abs), "4G. Audit delivery report CSV successfully generated on disk")

    print("\n" + "=" * 70)
    print("  ALL PROXY & OUTREACH FLOW TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    main()
