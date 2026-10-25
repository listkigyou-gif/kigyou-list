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

KEYS_DIR = os.getenv("GOOGLE_KEYS_DIR", str(PROJECT_ROOT / "google_keys"))

class GoogleIndexingClient:
    def __init__(self, key_file: Optional[str] = None):
        self.key_paths = []
        if key_file and os.path.exists(key_file):
            self.key_paths.append(key_file)
        elif os.path.exists(KEYS_DIR):
            for f in sorted(os.listdir(KEYS_DIR)):
                if f.endswith('.json'):
                    self.key_paths.append(os.path.join(KEYS_DIR, f))
        
        if not self.key_paths and os.path.exists(KEY_FILE):
            self.key_paths.append(KEY_FILE)

        if not self.key_paths:
            raise FileNotFoundError(f"No key files found in {KEYS_DIR} or {KEY_FILE}")

        self.services = []
        for kp in self.key_paths:
            try:
                creds = service_account.Credentials.from_service_account_file(kp, scopes=SCOPES)
                svc = build('indexing', 'v3', credentials=creds)
                with open(kp, 'r', encoding='utf-8') as jf:
                    data = json.load(jf)
                self.services.append({
                    "path": kp,
                    "project_id": data.get("project_id", "unknown"),
                    "client_email": data.get("client_email", "unknown"),
                    "service": svc,
                    "submitted_today": 0,
                    "exhausted": False
                })
            except Exception as e:
                print(f"[-] Warning: Failed to load key {kp}: {e}")

        if not self.services:
            raise RuntimeError("No valid Google service accounts could be loaded.")

        self.active_index = 0

    def get_active_service(self) -> Dict[str, Any]:
        """Lấy service account còn hạn mức"""
        for i in range(len(self.services)):
            idx = (self.active_index + i) % len(self.services)
            svc_obj = self.services[idx]
            if not svc_obj["exhausted"] and svc_obj["submitted_today"] < 200:
                self.active_index = idx
                return svc_obj
        return None

    def publish_url(self, url: str, action: str = "URL_UPDATED") -> Dict[str, Any]:
        """Gửi 1 URL lên Google Indexing API sử dụng key xoay vòng"""
        svc_obj = self.get_active_service()
        if not svc_obj:
            raise RuntimeError("Toàn bộ các Google Service Accounts trong pool đều đã hết hạn mức hôm nay.")

        body = {
            "url": url,
            "type": action
        }
        try:
            resp = svc_obj["service"].urlNotifications().publish(body=body).execute()
            svc_obj["submitted_today"] += 1
            if svc_obj["submitted_today"] >= 200:
                svc_obj["exhausted"] = True
                self.active_index = (self.active_index + 1) % len(self.services)
            return resp
        except HttpError as e:
            if "RATE_LIMIT_EXCEEDED" in str(e) or "quota" in str(e).lower() or "429" in str(e):
                svc_obj["exhausted"] = True
                self.active_index = (self.active_index + 1) % len(self.services)
            raise e

    def get_url_status(self, url: str) -> Dict[str, Any]:
        """Kiểm tra trạng thái nạp của 1 URL trên Google Indexing API"""
        svc_obj = self.services[0]
        try:
            resp = svc_obj["service"].urlNotifications().getMetadata(url=url).execute()
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
        
        # Ưu tiên Tier 0: Doanh nghiệp có báo cáo tài chính EDINET chưa từng gửi Google (xếp theo quy mô Doanh thu & Nhân sự lớn nhất)
        query_vip = """
        SELECT f.corporate_number, c.company_name
        FROM company_financials f
        JOIN companies c ON f.corporate_number = c.corporate_number
        LEFT JOIN google_indexing_submissions sub ON f.corporate_number = sub.corporate_number
        WHERE sub.corporate_number IS NULL
        GROUP BY f.corporate_number
        ORDER BY COALESCE(c.sales_amount, 0) DESC, COALESCE(c.employee_count, 0) DESC
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


    def submit_smart_hybrid(self, total_limit: int = 200, hub_limit: int = 30, dry_run: bool = False) -> List[Dict[str, Any]]:
        """
        Chiến lược phân bổ thông minh: 30 Hubs (mở đường Googlebot cào diện rộng) + 170 Doanh nghiệp VIP hàng đầu.
        """
        quota_state_file = os.path.join(os.path.dirname(DB_PATH), "data", "google_quota_state.json")
        if not dry_run and os.path.exists(quota_state_file):
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
        available_quota = max(0, total_limit - today_count)
        if available_quota <= 0 and not dry_run:
            print(f"[*] Đã đạt hạn mức tối đa Google Indexing hôm nay ({today_count}/{total_limit} URLs). Bỏ qua đợt này.")
            conn.close()
            return []

        cur = conn.cursor()
        effective_quota = available_quota if not dry_run else total_limit
        hub_quota = min(hub_limit, effective_quota)
        vip_quota = effective_quota - hub_quota

        selected_items = []

        # 1. 5 Core Statutory Event Hubs
        core_hubs = [
            ("hub:changes", f"{BASE_URL}/ja/changes", "Hub: 登記・変更履歴 (Changes)"),
            ("hub:invoice", f"{BASE_URL}/ja/invoice", "Hub: インボイス制度 (Invoice)"),
            ("hub:jobs", f"{BASE_URL}/ja/jobs", "Hub: 求人・採用シグナル (Jobs)"),
            ("hub:new-companies", f"{BASE_URL}/ja/new-companies", "Hub: 新設法人 (New Companies)"),
            ("hub:status", f"{BASE_URL}/ja/status", "Hub: 企業ステータス・閉鎖 (Status)"),
        ]
        selected_items.extend(core_hubs[:hub_quota])

        # 2. 15 Rotating Major Prefecture Hubs (out of 47 prefectures)
        if len(selected_items) < hub_quota:
            pref_needed = min(15, hub_quota - len(selected_items))
            cur.execute("""
                SELECT corporate_number, submitted_at FROM google_indexing_submissions
                WHERE corporate_number LIKE 'hub:area:%'
            """)
            submitted_prefs = dict(cur.fetchall())
            
            all_prefs = [f"{i:02d}" for i in range(1, 48)]
            all_prefs.sort(key=lambda p: submitted_prefs.get(f"hub:area:{p}", "1970-01-01"))
            
            for p in all_prefs[:pref_needed]:
                selected_items.append((f"hub:area:{p}", f"{BASE_URL}/ja/area/{p}", f"Hub: 都道府県エリア ({p})"))

        # 3. 10 Rotating Major Industry Hubs
        if len(selected_items) < hub_quota:
            ind_needed = min(10, hub_quota - len(selected_items))
            try:
                cur.execute("SELECT industry_code, industry_name FROM m_industries ORDER BY industry_code ASC")
                ind_rows = cur.fetchall()
            except Exception:
                ind_rows = []

            cur.execute("""
                SELECT corporate_number, submitted_at FROM google_indexing_submissions
                WHERE corporate_number LIKE 'hub:industry:%'
            """)
            submitted_inds = dict(cur.fetchall())

            ind_rows.sort(key=lambda r: submitted_inds.get(f"hub:industry:{r[0]}", "1970-01-01"))
            for ind_code, ind_name in ind_rows[:ind_needed]:
                selected_items.append((f"hub:industry:{ind_code}", f"{BASE_URL}/ja/industry/{ind_code}", f"Hub: 業種 ({ind_code} - {ind_name})"))

        # 4. Top VIP Enterprises (170 URLs)
        vip_needed = min(vip_quota, effective_quota - len(selected_items))
        if vip_needed > 0:
            query_vip = """
            SELECT f.corporate_number, c.company_name
            FROM company_financials f
            JOIN companies c ON f.corporate_number = c.corporate_number
            LEFT JOIN google_indexing_submissions sub ON f.corporate_number = sub.corporate_number
            WHERE sub.corporate_number IS NULL
            GROUP BY f.corporate_number
            ORDER BY COALESCE(c.sales_amount, 0) DESC, COALESCE(c.employee_count, 0) DESC
            LIMIT ?
            """
            vip_rows = cur.execute(query_vip, (vip_needed,)).fetchall()
            for c_num, c_name in vip_rows:
                selected_items.append((c_num, f"{BASE_URL}/ja/company/{c_num}", c_name))

            if len(selected_items) < effective_quota:
                rem = effective_quota - len(selected_items)
                query_sitemap = """
                SELECT s.corporate_number, s.company_name
                FROM sitemap_companies s
                LEFT JOIN google_indexing_submissions sub ON s.corporate_number = sub.corporate_number
                WHERE sub.corporate_number IS NULL
                ORDER BY s.employee_count DESC, s.corporate_number ASC
                LIMIT ?
                """
                for c_num, c_name in cur.execute(query_sitemap, (rem,)).fetchall():
                    selected_items.append((c_num, f"{BASE_URL}/ja/company/{c_num}", c_name))

        if dry_run:
            print(f"[*] [DRY-RUN] Sẽ gửi {len(selected_items)} URLs (Hubs: {sum(1 for x in selected_items if x[0].startswith('hub:'))}, VIPs: {sum(1 for x in selected_items if not x[0].startswith('hub:'))}):")
            for idx, (ident, url, name) in enumerate(selected_items[:35], 1):
                print(f"  [{idx}] {name} ({ident}) -> {url}")
            if len(selected_items) > 35:
                print(f"  ... và {len(selected_items) - 35} URLs tiếp theo.")
            conn.close()
            return [{"identifier": i, "url": u, "name": n} for i, u, n in selected_items]

        results = []
        print(f"[*] Đang nạp {len(selected_items)} URLs (Hubs + VIPs) lên Google Indexing API (Hôm nay đã gửi: {today_count}/{total_limit})...")
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for idx, (ident, url, name) in enumerate(selected_items, 1):
            try:
                resp = self.publish_url(url)
                cur.execute("""
                    INSERT OR REPLACE INTO google_indexing_submissions (corporate_number, url, submitted_at, response_code)
                    VALUES (?, ?, ?, 200)
                """, (ident, url, now_str))
                conn.commit()

                results.append({"url": url, "name": name, "status": "success", "response": resp})
                print(f"  [{idx}/{len(selected_items)}] ✅ {name} ({ident}) -> {url}")
                time.sleep(0.5)
            except Exception as e:
                err_str = str(e)
                results.append({"url": url, "name": name, "status": "error", "error": err_str})
                print(f"  [{idx}/{len(selected_items)}] ❌ Lỗi: {err_str}")
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


def run_google_vip_submission(limit: int = 10, hybrid: bool = False) -> Dict[str, Any]:
    """Helper cho Master Orchestrator gọi tự động"""
    try:
        client = GoogleIndexingClient()
        if hybrid:
            res = client.submit_smart_hybrid(total_limit=limit, hub_limit=min(30, int(limit * 0.15)))
        else:
            res = client.submit_top_companies(limit=limit)
        return {"status": "success", "submitted": len(res)}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Google Search Indexing API VIP Submitter")
    parser.add_argument("--url", type=str, help="URL cụ thể cần ép Google index")
    parser.add_argument("--status", type=str, help="Kiểm tra trạng thái nạp của URL")
    parser.add_argument("--top-vip", type=int, default=0, help="Nộp số lượng N doanh nghiệp VIP hàng đầu (tối đa 200/ngày)")
    parser.add_argument("--smart-hybrid", action="store_true", help="Chạy chế độ thông minh 30 Hubs + 170 VIPs = 200 URLs")
    parser.add_argument("--dry-run", action="store_true", help="Chạy thử không nộp thật lên Google")
    parser.add_argument("--limit", type=int, default=200, help="Tổng số URL giới hạn (mặc định 200)")
    parser.add_argument("--hubs", type=int, default=30, help="Số lượng Hubs giới hạn (mặc định 30)")
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

    elif args.smart_hybrid:
        client.submit_smart_hybrid(total_limit=args.limit, hub_limit=args.hubs, dry_run=args.dry_run)

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
