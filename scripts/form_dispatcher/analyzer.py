"""
Form Dispatcher Error Analyzer
Analyzes recent form submission errors, inspects captured HTML snapshots,
and outputs diagnostics and actionable improvement recommendations for dispatcher.py.
"""

import os
import sys
import glob
import json
import time
import datetime
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Ensure utf-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAILED_SAMPLES_DIR = os.path.join(BASE_DIR, "reports", "failed_samples")

def get_pg_connection():
    import psycopg2
    from psycopg2.extras import RealDictCursor
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL is not set.")
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)

def analyze_batch(campaign_id: str, since_minutes: int = 45) -> Dict[str, Any]:
    conn = get_pg_connection()
    c = conn.cursor()
    
    # 1. Fetch recent logs
    c.execute(
        """
        SELECT corporate_number, company_name, form_url, status, message, sent_at
        FROM internal_form_send_logs
        WHERE campaign_id = %s
          AND sent_at >= NOW() - (%s * INTERVAL '1 minute')
        ORDER BY sent_at DESC
        """,
        (campaign_id, since_minutes)
    )
    logs = c.fetchall()
    conn.close()

    total = len(logs)
    if total == 0:
        return {"status": "NO_LOGS", "message": f"No logs found in the last {since_minutes} minutes."}

    success_logs = [l for l in logs if l["status"] in ("SUCCESS_SENT", "SUCCESS_DRY_RUN")]
    skipped_logs = [l for l in logs if "SKIPPED" in l["status"] or "BLOCKED" in l["status"] or l["status"] in ("NO_FORM_ELEMENT", "ALREADY_CONTACTED", "DEAD_WEBSITE")]
    failed_logs = [l for l in logs if l not in success_logs and l not in skipped_logs]

    # Aggregate failure categories
    fail_breakdown = {}
    for fl in failed_logs:
        st = fl["status"]
        msg = fl["message"].split("\n")[0][:60]
        key = f"[{st}] {msg}"
        fail_breakdown[key] = fail_breakdown.get(key, 0) + 1

    # Aggregate skipped categories
    skip_breakdown = {}
    for sl in skipped_logs:
        st = sl["status"]
        msg = sl["message"].split("\n")[0][:60]
        key = f"[{st}] {msg}"
        skip_breakdown[key] = skip_breakdown.get(key, 0) + 1

    # Inspect HTML samples for failed logs
    html_diagnostics = []
    failed_corp_nums = {l["corporate_number"] for l in failed_logs if l["corporate_number"]}

    for corp_num in failed_corp_nums:
        pattern = os.path.join(FAILED_SAMPLES_DIR, f"{corp_num}_*.html")
        matches = glob.glob(pattern)
        for filepath in matches:
            filename = os.path.basename(filepath)
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as fp:
                    html_content = fp.read()
                soup = BeautifulSoup(html_content, "html.parser")
                forms = soup.find_all("form")
                
                # Check potential inputs
                inputs = soup.find_all(["input", "textarea", "select"])
                input_types = [inp.get("type", inp.name) for inp in inputs]
                
                # Check potential submit buttons
                submit_candidates = []
                for b in soup.find_all(["button", "input", "a", "div", "span", "p"]):
                    text = b.get_text(strip=True) or b.get("value", "")
                    if any(k in text for k in ["送信", "確認", "次へ", "問い合わせ", "submit"]) and len(text) < 40:
                        submit_candidates.append({
                            "tag": b.name,
                            "type": b.get("type", ""),
                            "class": b.get("class", []),
                            "id": b.get("id", ""),
                            "text": text[:30]
                        })

                html_diagnostics.append({
                    "corporate_number": corp_num,
                    "filename": filename,
                    "forms_count": len(forms),
                    "total_inputs": len(inputs),
                    "input_types": list(set(input_types)),
                    "submit_candidates": submit_candidates[:3]
                })
            except Exception as e:
                html_diagnostics.append({
                    "corporate_number": corp_num,
                    "filename": filename,
                    "error": str(e)
                })

    return {
        "campaign_id": campaign_id,
        "time_window_minutes": since_minutes,
        "total_processed": total,
        "success_count": len(success_logs),
        "success_rate": f"{(len(success_logs) / total * 100):.1f}%" if total > 0 else "0%",
        "skipped_count": len(skipped_logs),
        "skipped_rate": f"{(len(skipped_logs) / total * 100):.1f}%" if total > 0 else "0%",
        "failed_count": len(failed_logs),
        "failed_rate": f"{(len(failed_logs) / total * 100):.1f}%" if total > 0 else "0%",
        "fail_breakdown": fail_breakdown,
        "skip_breakdown": skip_breakdown,
        "html_diagnostics_sample": html_diagnostics[:10]
    }

def print_report(diag: Dict[str, Any]):
    print("=" * 78)
    print("  KIGYOU-LIST: AUTOMATED FORM DISPATCHER BATCH DIAGNOSTICS")
    print("=" * 78)
    print(f"  Campaign ID:       {diag.get('campaign_id')}")
    print(f"  Processed Count:   {diag.get('total_processed')} companies")
    print(f"  [+] SUCCESS SENT:  {diag.get('success_count')} ({diag.get('success_rate')})")
    print(f"  [!] AUTO-SKIPPED:  {diag.get('skipped_count')} ({diag.get('skipped_rate')})")
    print(f"  [-] FAILED:        {diag.get('failed_count')} ({diag.get('failed_rate')})")
    print("-" * 78)
    print("  TOP FAILURE REASONS:")
    for k, v in sorted(diag.get("fail_breakdown", {}).items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"    * {v}x {k}")
    print("-" * 78)
    print("  TOP PROTECTION / SKIP REASONS:")
    for k, v in sorted(diag.get("skip_breakdown", {}).items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"    * {v}x {k}")
    print("-" * 78)
    print(f"  HTML SAMPLE DIAGNOSTICS INSPECTED: {len(diag.get('html_diagnostics_sample', []))} files")
    for item in diag.get("html_diagnostics_sample", [])[:3]:
        print(f"    - Corp #{item.get('corporate_number')}: forms={item.get('forms_count')}, inputs={item.get('total_inputs')}, submit_candidates={len(item.get('submit_candidates', []))}")
    print("=" * 78)

if __name__ == "__main__":
    cid = sys.argv[1] if len(sys.argv) > 1 else "3ae19e5b-e93d-446e-bcc7-40af0e09a6ee"
    minutes = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    report = analyze_batch(cid, since_minutes=minutes)
    print_report(report)
