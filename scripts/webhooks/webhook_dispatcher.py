"""
Kigyou-list Real-time Event Dispatcher for AI Sales Agents
Scans detected corporate intent signals (Hiring, Subsidy, Public Bidding)
and dispatches signed webhook payloads (HMAC SHA-256) to subscribed agents.
"""

import sys
import os
import json
import sqlite3
import hmac
import hashlib
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Dict, Any, List

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = r"c:\kigyou-list\kigyou-list.db"

def compute_hmac_signature(secret: str, payload_bytes: bytes) -> str:
    sig = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
    return f"sha256={sig}"

def get_active_subscriptions() -> List[Dict[str, Any]]:
    if not os.path.exists(DB_PATH):
        return []
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, user_email, webhook_url, secret_token, filter_events, filter_prefecture 
    FROM webhook_subscriptions 
    WHERE is_active = 1
    """)
    rows = cursor.fetchall()
    subs = [dict(r) for r in rows]
    conn.close()
    return subs

def update_subscription_status(sub_id: str, success: bool):
    if not os.path.exists(DB_PATH):
        return
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()
    if success:
        cursor.execute("UPDATE webhook_subscriptions SET last_dispatched_at = ? WHERE id = ?", (now_str, sub_id))
    else:
        cursor.execute("UPDATE webhook_subscriptions SET failure_count = failure_count + 1 WHERE id = ?", (sub_id,))
    conn.commit()
    conn.close()

def dispatch_event_to_subscriber(sub: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
    url = sub["webhook_url"]
    secret = sub["secret_token"]
    payload_bytes = json.dumps(event_data, ensure_ascii=False).encode("utf-8")
    signature = compute_hmac_signature(secret, payload_bytes)

    req = urllib.request.Request(
        url,
        data=payload_bytes,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "KigyouList-WebhookDispatcher/1.1.0",
            "X-KigyouList-Signature": signature,
            "X-KigyouList-Subscription-Id": sub["id"]
        },
        method="POST"
    )

    try:
        # 5 second timeout for fast webhook delivery
        with urllib.request.urlopen(req, timeout=5) as resp:
            status = resp.status
            update_subscription_status(sub["id"], True)
            print(f" -> [SUCCESS] Dispatched to {url} (HTTP {status})")
            return True
    except Exception as e:
        update_subscription_status(sub["id"], False)
        print(f" -> [FAILED] Could not dispatch to {url}: {e}")
        return False

def run_test_dispatch():
    print("=" * 60)
    print("KIGYOU-LIST WEBHOOK DISPATCHER: RUNNING EVENT SCAN")
    print("=" * 60)

    subs = get_active_subscriptions()
    print(f"Found {len(subs)} active webhook subscriber(s).")

    # Sample High-Priority Realtime Intent Event
    sample_event = {
        "event": "company.signal.detected",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "signal_id": "sig_live_9921",
        "signal_type": "hiring",
        "company": {
            "corporate_number": "1010001002003",
            "company_name": "大和システム開発株式会社",
            "prefecture": "東京都",
            "industry": "情報通信業"
        },
        "intent_details": {
            "title": "急募: DX推進リードエンジニア及びセールスリーダー",
            "detected_source": "大手求人ポータル (新規掲載から15分以内)",
            "speed_to_lead_priority": "CRITICAL_HOT"
        },
        "ai_sales_agent_hook": {
            "recommended_angle": "新規採用に伴う業務効率化ツールおよび開発リソース支援の提案",
            "icebreaker": "貴社のDX推進リードエンジニアの急募動向を拝見し、即戦力で支援可能な弊社のソリューションについて..."
        }
    }

    if not subs:
        print("Không có webhook subscriber nào đang kích hoạt. Hãy dùng API POST /api/v1/webhooks để đăng ký.")
        return

    for sub in subs:
        print(f"Dispatching event to sub [{sub['id']}] -> {sub['webhook_url']}...")
        dispatch_event_to_subscriber(sub, sample_event)

    print("=" * 60)
    print("WEBHOOK DISPATCH COMPLETED.")

if __name__ == "__main__":
    run_test_dispatch()
