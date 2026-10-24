#!/usr/bin/env python3
"""
Google Web Search Indexing API Client for Kigyou-list
Directly submits high-priority / VIP pages to Googlebot for instant fast-track indexing (up to 200 URLs/day).
"""

import sys
import os
import json
import time
from datetime import datetime, timedelta
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parent.parent
KEY_FILE = os.getenv("GOOGLE_CREDENTIALS_PATH", str(PROJECT_ROOT / "google_credentials.json"))
SCOPES = ['https://www.googleapis.com/auth/indexing']
BASE_URL = "https://kigyoulist.com"
DB_PATH = os.getenv("SQLITE_DB_PATH", str(PROJECT_ROOT / "kigyou-list.db"))

class GoogleIndexingClient:
    def __init__(self, key_file: str = KEY_FILE):
        self.key_file = key_file
        if not os.path.exists(self.key_file):
            raise FileNotFoundError(f"Key file not found: {self.key_file}")
        self.creds = service_account.Credentials.from_service_account_file(self.key_file, scopes=SCOPES)
        self.service = build('indexing', 'v3', credentials=self.creds)

    def publish_url(self, url: str, action: str = "URL_UPDATED") -> Dict[str, Any]:
        """Gửi 1 URL lên Google Indexing API"""
        body = {
            "url": url,
            "type": action
        }
        try:
            resp = self.service.urlNotifications().publish(body=body).execute()
            return resp
        except HttpError as e:
            if "SERVICE_DISABLED" in str(e):
                raise RuntimeError(
                    "Google Web Search Indexing API is disabled on Google Cloud Console.\n"
                    "👉 Vui lòng truy cập đường link sau và bấm 'ENABLE':\n"
                    "https://console.developers.google.com/apis/api/indexing.googleapis.com/overview?project=165334338797"
                )
            raise e

    def get_url_status(self, url: str) -> Dict[str, Any]:
        """Kiểm tra trạng thái nạp của 1 URL trên Google Indexing API"""
        try:
            resp = self.service.urlNotifications().getMetadata(url=url).execute()
            return resp
        except HttpError as e:
            if "SERVICE_DISABLED" in str(e):
                raise RuntimeError(
                    "Google Web Search Indexing API is disabled on Google Cloud Console.\n"
                    "👉 Vui lòng truy cập đường link sau và bấm 'ENABLE':\n"
                    "https://console.developers.google.com/apis/api/indexing.googleapis.com/overview?project=165334338797"
                )
            raise e

    def init_db(self, conn: sqlite3.Connection):
        """Khởi tạo bảng theo dõi lịch sử submit Google Indexing"""
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS google_indexing_submissions (
            corporate_number TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            response_code INTEGER DEFAULT 200
        )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_g_indexing_submitted_at ON google_indexing_submissions(submitted_at)")
        conn.commit()

    def get_submitted_today(self, conn: sqlite3.Connection) -> int:
        """Đếm số URL đã gửi lên Google hôm nay (tránh vượt hạn mức 200/ngày)"""
        cursor = conn.cursor()
        row = cursor.execute("""
            SELECT count(1) FROM google_indexing_submissions
            WHERE date(submitted_at) = date('now')
        """).fetchone()
        return row[0] if row else 0

    def submit_top_companies(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Lấy top doanh nghiệp VIP chưa từng nộp để gửi Google Indexing API"""
        quota_state_file = os.path.join(os.path.dirname(DB_PATH), "data", "google_quota_state.json")
        if os.path.exists(quota_state_file):
            try:
                with open(quota_state_file, "r", encoding="utf-8") as qf:
                    qstate = json.load(qf)
                    resume_dt = datetime.fromisoformat(qstate.get("resume_at", ""))
                    if datetime.now() < resume_dt:
                        print(f"[*] Google Indexing API daily quota cooling down until {qstate.get('resume_at')}. Skipping.")
                        return []
            except Exception:
                pass

        conn = sqlite3.connect(DB_PATH)
        self.init_db(conn)

        today_count = self.get_submitted_today(conn)
        available_quota = max(0, 200 - today_count)
        if available_quota <= 0:
            print(f"[*] Đã đạt hạn mức tối đa Google Indexing hôm nay ({today_count}/200 URLs). Bỏ qua đợt này.")
            conn.close()
            return []

        actual_limit = min(limit, available_quota)
        cur = conn.cursor()
        
        # Ưu tiên Tier 0: Doanh nghiệp có báo cáo tài chính EDINET chưa từng gửi Google
        query_vip = """
        SELECT f.corporate_number, c.company_name
        FROM company_financials f
        JOIN companies c ON f.corporate_number = c.corporate_number
        LEFT JOIN google_indexing_submissions sub ON f.corporate_number = sub.corporate_number
        WHERE sub.corporate_number IS NULL
        GROUP BY f.corporate_number
        LIMIT ?
        """
        rows = cur.execute(query_vip, (actual_limit,)).fetchall()

        # Nếu còn quota, lấy tiếp top sitemap_companies theo quy mô nhân sự
        if len(rows) < actual_limit:
            remaining = actual_limit - len(rows)
            query_sitemap = """
            SELECT s.corporate_number, s.company_name
            FROM sitemap_companies s
            LEFT JOIN google_indexing_submissions sub ON s.corporate_number = sub.corporate_number
            WHERE sub.corporate_number IS NULL
            ORDER BY s.employee_count DESC, s.corporate_number ASC
            LIMIT ?
            """
            rows.extend(cur.execute(query_sitemap, (remaining,)).fetchall())

        if not rows:
            print("[*] Không còn URL VIP nào cần gửi Google.")
            conn.close()
            return []

        results = []
        print(f"[*] Đang gửi {len(rows)} URLs VIP lên Google Indexing API (Hôm nay đã gửi: {today_count}/200)...")
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for idx, (corp_num, name) in enumerate(rows, 1):
            url = f"{BASE_URL}/ja/company/{corp_num}"
            try:
                resp = self.publish_url(url)
                cur.execute("""
                    INSERT OR REPLACE INTO google_indexing_submissions (corporate_number, url, submitted_at, response_code)
                    VALUES (?, ?, ?, 200)
                """, (corp_num, url, now_str))
                conn.commit()

                results.append({"url": url, "name": name, "status": "success", "response": resp})
                print(f"  [{idx}/{len(rows)}] ✅ {name} ({corp_num}) -> {url}")
                time.sleep(0.5)
            except Exception as e:
                err_str = str(e)
                results.append({"url": url, "name": name, "status": "error", "error": err_str})
                print(f"  [{idx}/{len(rows)}] ❌ Lỗi: {err_str}")
                if "RATE_LIMIT_EXCEEDED" in err_str or "quota" in err_str.lower() or "429" in err_str:
                    resume_time = (datetime.now() + timedelta(hours=3)).isoformat()
                    try:
                        os.makedirs(os.path.dirname(quota_state_file), exist_ok=True)
                        with open(quota_state_file, "w", encoding="utf-8") as qf:
                            json.dump({"quota_exceeded_at": now_str, "resume_at": resume_time}, qf, indent=2)
                        print(f"[*] Google Daily Quota reached. Cool-down state saved until {resume_time}.")
                    except Exception as qe:
                        print(f"[-] Could not save quota cool-down state: {qe}")
                break

        conn.close()
        return results


def run_google_vip_submission(limit: int = 10) -> Dict[str, Any]:
    """Helper cho Master Orchestrator gọi tự động"""
    try:
        client = GoogleIndexingClient()
        res = client.submit_top_companies(limit=limit)
        return {"status": "success", "submitted": len(res)}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def main():
    import argparse
    from datetime import datetime
    parser = argparse.ArgumentParser(description="Google Search Indexing API VIP Submitter")
    parser.add_argument("--url", type=str, help="URL cụ thể cần ép Google index")
    parser.add_argument("--status", type=str, help="Kiểm tra trạng thái nạp của URL")
    parser.add_argument("--top-vip", type=int, default=0, help="Nộp số lượng N doanh nghiệp VIP hàng đầu (tối đa 200/ngày)")
    args = parser.parse_args()

    client = GoogleIndexingClient()

    if args.url:
        print(f"[*] Đang gửi yêu cầu index URL lên Google: {args.url}")
        res = client.publish_url(args.url)
        print("Phản hồi từ Google:")
        print(json.dumps(res, indent=2, ensure_ascii=False))

    elif args.status:
        print(f"[*] Đang kiểm tra trạng thái URL trên Google: {args.status}")
        res = client.get_url_status(args.status)
        print("Trạng thái từ Google:")
        print(json.dumps(res, indent=2, ensure_ascii=False))

    elif args.top_vip > 0:
        limit = min(args.top_vip, 200)
        client.submit_top_companies(limit=limit)

    else:
        # Default test
        print("Kiểm tra kết nối Google Indexing API...")
        try:
            res = client.publish_url(f"{BASE_URL}/ja")
            print("✅ Kết nối thành công!")
            print(json.dumps(res, indent=2))
        except Exception as e:
            print(f"❌ {str(e)}")

if __name__ == "__main__":
    main()
