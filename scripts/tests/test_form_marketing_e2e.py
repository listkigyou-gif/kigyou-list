#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
End-to-End Test Suite for Kigyou-List Form Marketing (問い合わせフォーム営業)
=======================================================================
Tests the complete lifecycle:
1. Validation of form fields & minimum target counts (>= 100).
2. Draft campaign creation.
3. Insufficient credit rejection.
4. Stripe / Simulated credit top-up (+1,000 credits).
5. Submit for approval & credit reservation.
6. Revert to draft (refund test), re-submit, admin rejection (refund test), admin approval.
7. Dispatcher Playwright engine execution (Success, Skipped Disclaimer, Blocked Captcha).
8. Auto-settlement: delived charge, unused refund, CSV delivery audit report.
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error
import sqlite3

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT_DIR, "kigyou-list.db")
API_BASE = "http://localhost:3000"
TEST_USER = "test_e2e_agent@example.com"
ADMIN_USER = "trungkim8694@gmail.com"

# Import campaign runner
sys.path.insert(0, os.path.join(ROOT_DIR, "scripts", "form_dispatcher"))
from campaign_runner import run_campaign


# ==========================================
# HTTP REQUEST HELPERS
# ==========================================
def http_request(path: str, method: str = "GET", data: dict = None, headers: dict = None) -> tuple[int, dict]:
    url = f"{API_BASE}{path}"
    req_headers = {
        "User-Agent": "E2E-Test-Runner/1.0",
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
# ASSERTION HELPERS
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
# TEST SUITE EXECUTION
# ==========================================
def main():
    print("=" * 70)
    print("  KIGYOU-LIST: 問い合わせフォーム営業 END-TO-END AUTOMATED TEST SUITE")
    print("=" * 70)

    # 0. Clean up previous test data for TEST_USER in both PostgreSQL and SQLite
    try:
        import psycopg2
        pg = psycopg2.connect("postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")
        pgc = pg.cursor()
        pgc.execute("DELETE FROM user_form_campaigns WHERE user_email = %s", (TEST_USER,))
        pgc.execute("DELETE FROM user_form_credits WHERE user_email = %s", (TEST_USER,))
        pgc.execute("DELETE FROM user_form_credit_transactions WHERE user_email = %s", (TEST_USER,))
        pg.commit()
        pg.close()
    except Exception as e:
        print("[*] Note Postgres cleanup:", e)

    try:
        if os.path.exists(DB_PATH):
            sl = sqlite3.connect(DB_PATH)
            slc = sl.cursor()
            slc.execute("DELETE FROM user_form_campaigns WHERE user_email = ?", (TEST_USER,))
            slc.execute("DELETE FROM user_form_credits WHERE user_email = ?", (TEST_USER,))
            slc.execute("DELETE FROM user_form_credit_transactions WHERE user_email = ?", (TEST_USER,))
            sl.commit()
            sl.close()
    except Exception as e:
        print("[*] Note SQLite cleanup:", e)
    print("[*] Prepared clean state for test user in PostgreSQL & SQLite:", TEST_USER)

    # -------------------------------------------------------------
    # STEP 1: VALIDATION RULES
    # -------------------------------------------------------------
    print("\n--- STEP 1: VALIDATION RULES ---")
    
    # 1A. Missing required fields
    status, res = http_request(
        "/api/user/form-campaigns",
        method="POST",
        data={"name": "Incomplete Campaign"},
        headers={"x-user-email": TEST_USER}
    )
    assert_equal(status, 400, "1A. Reject when required fields are missing")

    # 1B. Target count < 100 when submitting for approval
    status, res = http_request(
        "/api/user/form-campaigns",
        method="POST",
        data={
            "name": "Under 100 targets",
            "sender_company": "株式会社テスト",
            "sender_name": "山田 太郎",
            "subject": "テスト件名",
            "body": "テスト本文",
            "target_count": 50,
            "target_filters": {"type": "preset_filter"},
            "status": "pending_approval"
        },
        headers={"x-user-email": TEST_USER}
    )
    assert_equal(status, 400, "1B. Reject when target count < 100 on submission")
    assert_equal(res.get("code"), "MIN_TARGET_100", "1B. Code matches MIN_TARGET_100")

    # -------------------------------------------------------------
    # STEP 2: DRAFT CAMPAIGN CREATION
    # -------------------------------------------------------------
    print("\n--- STEP 2: DRAFT CAMPAIGN CREATION ---")
    campaign_payload = {
        "name": "E2Eテスト_フォーム営業_2026",
        "sender_company": "株式会社アウトバウンドマーケティング",
        "sender_name": "山田 太郎",
        "sender_email": TEST_USER,
        "sender_phone": "03-5555-0123",
        "sender_website": "https://example-outreach.jp",
        "subject": "【ご提案】貴社の業務効率化を支援するソリューションのご案内",
        "body": "貴社Webサイトより失礼いたします。業務効率化のご提案です。\n※配信不要な場合はその旨ご返信ください。",
        "target_count": 100,
        "target_filters": {
            "type": "preset_filter",
            "industry": "it",
            "prefecture": "kanto",
            "label": "IT・情報通信 × 関東圏"
        },
        "status": "draft"
    }

    status, res = http_request(
        "/api/user/form-campaigns",
        method="POST",
        data=campaign_payload,
        headers={"x-user-email": TEST_USER}
    )
    assert_equal(status, 200, "2A. Save draft campaign HTTP 200")
    campaign_id = res.get("campaign", {}).get("id")
    assert_true(campaign_id is not None, "2B. Campaign ID generated")
    assert_equal(res.get("campaign", {}).get("status"), "draft", "2C. Initial status is 'draft'")

    # Verify retrieval
    status, res = http_request("/api/user/form-campaigns", method="GET", headers={"x-user-email": TEST_USER})
    assert_equal(status, 200, "2D. Fetch user campaigns")
    assert_equal(len(res.get("campaigns", [])), 1, "2E. Exactly 1 campaign retrieved")

    # -------------------------------------------------------------
    # STEP 3: INSUFFICIENT CREDITS REJECTION
    # -------------------------------------------------------------
    print("\n--- STEP 3: INSUFFICIENT CREDITS REJECTION ---")
    status, res = http_request(
        "/api/user/form-campaigns",
        method="PATCH",
        data={"id": campaign_id, "action": "submit_for_approval"},
        headers={"x-user-email": TEST_USER}
    )
    assert_equal(status, 400, "3A. Reject submission when wallet is 0")
    assert_true("INSUFFICIENT_CREDITS" in str(res.get("error", "")), "3B. Error specifies INSUFFICIENT_CREDITS")

    # -------------------------------------------------------------
    # STEP 4: PAYMENT / CREDIT TOP-UP VIA SIMULATED STRIPE WEBHOOK
    # -------------------------------------------------------------
    print("\n--- STEP 4: CREDIT TOP-UP (STRIPE SIMULATION) ---")
    status, res = http_request(
        "/api/stripe/webhook",
        method="POST",
        data={
            "simulated": True,
            "formPlanId": "form_1k",
            "email": TEST_USER,
            "allowance": 1000,
            "amount_jpy": 19600
        }
    )
    assert_equal(status, 200, "4A. Stripe simulated webhook HTTP 200")

    # Verify wallet credits
    status, res = http_request("/api/user/form-credits", method="GET", headers={"x-user-email": TEST_USER})
    assert_equal(status, 200, "4B. Fetch wallet credits")
    credits = res.get("credits", {})
    assert_equal(credits.get("balance"), 1000, "4C. Wallet balance is 1,000 credits")
    assert_equal(credits.get("total_purchased"), 1000, "4D. Total purchased is 1,000 credits")

    # Verify transaction log
    status, res = http_request("/api/user/form-credits/transactions", method="GET", headers={"x-user-email": TEST_USER})
    assert_equal(status, 200, "4E. Fetch credit transactions")
    txs = res.get("transactions", [])
    assert_true(len(txs) >= 1, "4F. Transaction record created")
    assert_equal(txs[0].get("type"), "charge", "4G. Transaction type is 'charge'")
    assert_equal(txs[0].get("amount"), 1000, "4H. Transaction amount is +1,000")

    # -------------------------------------------------------------
    # STEP 5: SUBMIT FOR APPROVAL & CREDIT RESERVATION
    # -------------------------------------------------------------
    print("\n--- STEP 5: SUBMIT FOR APPROVAL & CREDIT RESERVATION ---")
    status, res = http_request(
        "/api/user/form-campaigns",
        method="PATCH",
        data={"id": campaign_id, "action": "submit_for_approval"},
        headers={"x-user-email": TEST_USER}
    )
    assert_equal(status, 200, "5A. Submit campaign for approval HTTP 200")

    # Verify wallet reservation: balance was 1000, target is 100 -> balance becomes 900
    status, res = http_request("/api/user/form-credits", method="GET", headers={"x-user-email": TEST_USER})
    credits = res.get("credits", {})
    assert_equal(credits.get("balance"), 900, "5B. Available balance reduced to 900")
    assert_equal(credits.get("reserved"), 100, "5C. Reserved credits is 100")

    # Verify transaction log
    status, res = http_request("/api/user/form-credits/transactions", method="GET", headers={"x-user-email": TEST_USER})
    txs = res.get("transactions", [])
    assert_equal(txs[0].get("type"), "reserve", "5D. Transaction type is 'reserve'")
    assert_equal(txs[0].get("amount"), -100, "5E. Transaction amount is -100")

    # Verify campaign status is pending_approval
    status, res = http_request("/api/user/form-campaigns", method="GET", headers={"x-user-email": TEST_USER})
    camp = next(c for c in res.get("campaigns", []) if c["id"] == campaign_id)
    assert_equal(camp.get("status"), "pending_approval", "5F. Campaign status is 'pending_approval'")

    # -------------------------------------------------------------
    # STEP 6: REVERT TO DRAFT & ADMIN MODERATION (REFUND TESTS)
    # -------------------------------------------------------------
    print("\n--- STEP 6: REVERT TO DRAFT & ADMIN MODERATION ---")
    
    # 6A. Customer withdraws (revert_to_draft) -> 100 credits returned
    status, res = http_request(
        "/api/user/form-campaigns",
        method="PATCH",
        data={"id": campaign_id, "action": "revert_to_draft"},
        headers={"x-user-email": TEST_USER}
    )
    assert_equal(status, 200, "6A-1. Customer reverts pending campaign to draft")
    status, res = http_request("/api/user/form-credits", method="GET", headers={"x-user-email": TEST_USER})
    assert_equal(res.get("credits", {}).get("balance"), 1000, "6A-2. Credits refunded back to 1,000 on draft revert")

    # 6B. Customer re-submits
    http_request(
        "/api/user/form-campaigns",
        method="PATCH",
        data={"id": campaign_id, "action": "submit_for_approval"},
        headers={"x-user-email": TEST_USER}
    )

    # 6C. Admin Rejection Test -> 100 credits refunded
    status, res = http_request(
        "/api/admin/form-campaigns",
        method="POST",
        data={
            "campaignId": campaign_id,
            "action": "reject",
            "rejectionReason": "特定商取引法の表記不備"
        },
        headers={"x-admin-email": ADMIN_USER}
    )
    assert_equal(status, 200, "6C-1. Admin rejects campaign HTTP 200")
    status, res = http_request("/api/user/form-credits", method="GET", headers={"x-user-email": TEST_USER})
    assert_equal(res.get("credits", {}).get("balance"), 1000, "6C-2. Credits refunded back to 1,000 on admin rejection")

    # Verify rejection reason recorded
    status, res = http_request("/api/user/form-campaigns", method="GET", headers={"x-user-email": TEST_USER})
    camp = next(c for c in res.get("campaigns", []) if c["id"] == campaign_id)
    assert_equal(camp.get("status"), "rejected", "6C-3. Campaign status is 'rejected'")
    assert_true("特定商取引法" in str(camp.get("rejection_reason")), "6C-4. Rejection reason recorded")

    # 6D. Re-submit and Admin Approval
    status, res = http_request(
        "/api/user/form-campaigns",
        method="PATCH",
        data={"id": campaign_id, "action": "submit_for_approval"},
        headers={"x-user-email": TEST_USER}
    )
    assert_equal(status, 200, "6D-1. Re-submit after fixing")

    # Admin approves
    status, res = http_request(
        "/api/admin/form-campaigns",
        method="POST",
        data={"campaignId": campaign_id, "action": "approve"},
        headers={"x-admin-email": ADMIN_USER}
    )
    assert_equal(status, 200, "6D-2. Admin approves campaign HTTP 200")
    status, res = http_request("/api/user/form-campaigns", method="GET", headers={"x-user-email": TEST_USER})
    camp = next(c for c in res.get("campaigns", []) if c["id"] == campaign_id)
    assert_equal(camp.get("status"), "approved", "6D-3. Campaign status is 'approved'")

    # -------------------------------------------------------------
    # STEP 7: DISPATCHER EXECUTION (PLAYWRIGHT ENGINE MOCK RUN)
    # -------------------------------------------------------------
    print("\n--- STEP 7: DISPATCHER PLAYWRIGHT ENGINE EXECUTION ---")
    exec_result = run_campaign(campaign_id=campaign_id, mock_run=True)
    
    assert_equal(exec_result["total"], 3, "7A. Processed 3 test targets")
    assert_equal(exec_result["success_count"], 1, "7B. 1 form successfully submitted (SUCCESS_SENT)")
    assert_equal(exec_result["skipped_count"], 2, "7C. 2 forms skipped (Disclaimer & CAPTCHA)")
    
    results = exec_result["results"]
    assert_equal(results[0]["status"], "SUCCESS_SENT", "7D. Standard target status is SUCCESS_SENT")
    assert_equal(results[0]["billable"], True, "7E. Standard target is billable")
    
    assert_equal(results[1]["status"], "SKIPPED_DISCLAIMER", "7F. Sales-prohibited target status is SKIPPED_DISCLAIMER")
    assert_equal(results[1]["billable"], False, "7G. Sales-prohibited target is not billable")
    
    assert_true("CAPTCHA" in results[2]["status"], "7H. Protected target status is BLOCKED_CAPTCHA")
    assert_equal(results[2]["billable"], False, "7I. Protected target is not billable")

    # -------------------------------------------------------------
    # STEP 8: FINANCIAL SETTLEMENT & AUDIT REPORT VERIFICATION
    # -------------------------------------------------------------
    print("\n--- STEP 8: FINANCIAL SETTLEMENT & REPORT VERIFICATION ---")

    # Check campaign completion status in database
    status, res = http_request("/api/user/form-campaigns", method="GET", headers={"x-user-email": TEST_USER})
    camp = next(c for c in res.get("campaigns", []) if c["id"] == campaign_id)
    assert_equal(camp.get("status"), "completed", "8A. Campaign marked 'completed'")
    assert_equal(camp.get("success_count"), 1, "8B. Database success_count is 1")
    assert_equal(camp.get("skipped_count"), 2, "8C. Database skipped_count is 2")
    assert_true(camp.get("report_file_url") is not None, "8D. Report file URL is saved")

    # Verify wallet credits:
    # Reserved was 100.
    # Delivered: 1 form -> 1 credit consumed.
    # Unsent: 99 forms -> 99 credits refunded.
    # Starting available was 900. With 99 refunded, balance becomes 999!
    status, res = http_request("/api/user/form-credits", method="GET", headers={"x-user-email": TEST_USER})
    credits = res.get("credits", {})
    assert_equal(credits.get("balance"), 999, "8E. Final wallet balance is exactly 999 (1 consumed, 99 refunded)")

    # Verify audit transactions
    status, res = http_request("/api/user/form-credits/transactions", method="GET", headers={"x-user-email": TEST_USER})
    txs = res.get("transactions", [])
    has_delivered_tx = any(t["type"] == "delivered" and t["amount"] == -1 for t in txs)
    has_refund_tx = any(t["type"] == "refund" and t["amount"] == 99 for t in txs)
    assert_true(has_delivered_tx, "8F. Found 'delivered' transaction (-1)")
    assert_true(has_refund_tx, "8G. Found 'refund' transaction (+99)")

    # Verify CSV report file exists on disk
    report_file_rel = camp.get("report_file_url").lstrip("/")
    report_file_abs = os.path.join(ROOT_DIR, "frontend", "public", report_file_rel)
    assert_true(os.path.exists(report_file_abs), f"8H. CSV report exists on disk at {report_file_abs}")
    
    with open(report_file_abs, "r", encoding="utf-8-sig") as f:
        lines = f.readlines()
        assert_equal(len(lines), 4, "8I. CSV report contains header + 3 rows")

    print("\n" + "=" * 70)
    print("  ALL 8 PHASES OF E2E TEST PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    main()
