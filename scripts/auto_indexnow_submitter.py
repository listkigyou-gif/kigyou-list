#!/usr/bin/env python3
"""
Automated Anti-Duplicate IndexNow Submitter for Kigyou-list
Automatically submits high-value company profiles to Microsoft Bing & IndexNow search engines.
Guarantees ZERO duplicates using a local SQLite tracking database.
"""

import sys
import os
import json
import sqlite3
import urllib.request
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = r"c:\kigyou-list\kigyou-list.db"
HOST = "kigyoulist.com"
BASE_URL = "https://kigyoulist.com"
KEY = "0a1fbe0a7866441bb57817e0bf538068"
KEY_LOCATION = f"https://{HOST}/0a1fbe0a7866441bb57817e0bf538068.txt"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

def init_db(conn: sqlite3.Connection):
    """Khởi tạo bảng lưu trữ lịch sử nộp URL nếu chưa có"""
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS indexnow_submissions (
        corporate_number TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        batch_id TEXT,
        response_code INTEGER DEFAULT 200,
        priority_level INTEGER DEFAULT 1
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_indexnow_submitted_at ON indexnow_submissions(submitted_at)")
    conn.commit()

def get_stats(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Lấy số liệu thống kê tiến độ IndexNow"""
    cursor = conn.cursor()
    total_companies = cursor.execute("SELECT count(1) FROM companies").fetchone()[0]
    total_submitted = cursor.execute("SELECT count(1) FROM indexnow_submissions").fetchone()[0]
    
    last_batch = cursor.execute("""
        SELECT batch_id, count(1), max(submitted_at) 
        FROM indexnow_submissions 
        GROUP BY batch_id 
        ORDER BY max(submitted_at) DESC 
        LIMIT 5
    """).fetchall()

    return {
        "total_companies": total_companies,
        "total_submitted": total_submitted,
        "remaining_unsubmitted": total_companies - total_submitted,
        "coverage_percent": round((total_submitted / total_companies) * 100, 4) if total_companies > 0 else 0,
        "recent_batches": [
            {"batch_id": b[0], "count": b[1], "submitted_at": b[2]} for b in last_batch
        ]
    }

def fetch_target_companies(conn: sqlite3.Connection, limit: int = 1000) -> List[Tuple[str, int]]:
    """
    Truy vấn siêu tốc lựa chọn doanh nghiệp quan trọng nhất chưa từng nộp:
    - Giai đoạn 1: Lấy từ bảng sitemap_companies (500.000 doanh nghiệp hàng đầu Nhật Bản được xếp theo quy mô nhân sự giảm dần)
    - Giai đoạn 2: Lấy tiếp từ bảng companies theo chỉ mục idx_companies_employees_corp
    - Đảm bảo 100% không trùng lặp nhờ LEFT JOIN indexnow_submissions
    """
    cursor = conn.cursor()
    selected: List[Tuple[str, int]] = []

    # 1. Ưu tiên 500k doanh nghiệp trọng điểm từ sitemap_companies
    query_sitemap = """
    SELECT s.corporate_number
    FROM sitemap_companies s
    LEFT JOIN indexnow_submissions sub ON s.corporate_number = sub.corporate_number
    WHERE sub.corporate_number IS NULL
    ORDER BY s.employee_count DESC, s.corporate_number ASC
    LIMIT ?
    """
    rows = cursor.execute(query_sitemap, (limit,)).fetchall()
    for r in rows:
        selected.append((r[0], 1))

    # 2. Nếu đã hết sitemap_companies, lấy tiếp từ bảng companies
    remaining = limit - len(selected)
    if remaining > 0:
        query_general = """
        SELECT c.corporate_number
        FROM companies c
        LEFT JOIN indexnow_submissions sub ON c.corporate_number = sub.corporate_number
        WHERE sub.corporate_number IS NULL
        ORDER BY c.employee_count DESC, c.corporate_number ASC
        LIMIT ?
        """
        rows2 = cursor.execute(query_general, (remaining,)).fetchall()
        for r in rows2:
            selected.append((r[0], 2))

    return selected

def submit_to_indexnow(urls: List[str]) -> Tuple[int, str]:
    """Gửi danh sách URL lên IndexNow API"""
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls
    }

    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        INDEXNOW_ENDPOINT,
        data=data_bytes,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "Kigyoulist-AutoIndexNow/1.0 (https://kigyoulist.com)"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        return e.code, body
    except Exception as e:
        return 500, str(e)

def run_batch_submission(batch_size: int = 1000, dry_run: bool = False) -> Dict[str, Any]:
    """Hàm thực thi 1 đợt submit tự động"""
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    targets = fetch_target_companies(conn, limit=batch_size)
    if not targets:
        conn.close()
        return {"status": "no_targets", "message": "Tất cả công ty đã được nộp hoặc không tìm thấy mục tiêu mới."}

    batch_id = datetime.now().strftime("BATCH_%Y%m%d_%H%M%S")
    urls = [f"{BASE_URL}/ja/company/{t[0]}" for t in targets]

    if dry_run:
        conn.close()
        return {
            "status": "dry_run",
            "batch_id": batch_id,
            "count": len(urls),
            "sample_urls": urls[:5],
            "message": f"Chế độ chạy thử: Sẵn sàng nộp {len(urls)} URL mà không ghi vào DB."
        }

    # Gửi qua API
    status_code, resp_body = submit_to_indexnow(urls)

    if status_code in (200, 202):
        # Lưu vào Database
        cursor = conn.cursor()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        records = [
            (target[0], f"{BASE_URL}/ja/company/{target[0]}", now_str, batch_id, status_code, target[1])
            for target in targets
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO indexnow_submissions 
            (corporate_number, url, submitted_at, batch_id, response_code, priority_level)
            VALUES (?, ?, ?, ?, ?, ?)
        """, records)
        conn.commit()
        stats = get_stats(conn)
        conn.close()

        return {
            "status": "success",
            "batch_id": batch_id,
            "submitted_count": len(urls),
            "http_status": status_code,
            "total_indexed_so_far": stats["total_submitted"],
            "remaining": stats["remaining_unsubmitted"],
            "coverage": f"{stats['coverage_percent']}%"
        }
    else:
        conn.close()
        raise RuntimeError(f"IndexNow API Error {status_code}: {resp_body}")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Automated Anti-Duplicate IndexNow Submitter for Kigyoulist")
    parser.add_argument("--batch-size", type=int, default=1000, help="Số lượng URL nộp trong đợt này (Mặc định: 1000, tối đa 10000)")
    parser.add_argument("--dry-run", action="store_true", help="Chạy thử nghiệm kiểm tra danh sách mà không gửi thật")
    parser.add_argument("--stats", action="store_true", help="Xem báo cáo tổng quan số lượng URL đã nộp và còn lại")
    args = parser.parse_args()

    if args.stats:
        conn = sqlite3.connect(DB_PATH)
        init_db(conn)
        stats = get_stats(conn)
        conn.close()
        print("=== BÁO CÁO TIẾN ĐỘ INDEXNOW KIGYOULIST ===")
        print(f"Tổng số doanh nghiệp trong DB : {stats['total_companies']:,}")
        print(f"Đã nộp thành công lên Bing/IndexNow: {stats['total_submitted']:,} ({stats['coverage_percent']}%)")
        print(f"Còn lại chưa nộp             : {stats['remaining_unsubmitted']:,}")
        print("\nCác đợt nộp gần nhất:")
        for b in stats["recent_batches"]:
            print(f" - {b['batch_id']}: {b['count']} URLs vào lúc {b['submitted_at']}")
        return

    print(f"[*] Bắt đầu tiến trình nộp IndexNow (Batch size: {args.batch_size}, Dry run: {args.dry_run})...")
    try:
        res = run_batch_submission(batch_size=args.batch_size, dry_run=args.dry_run)
        print(json.dumps(res, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"[!] Lỗi: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
