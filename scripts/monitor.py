#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-List: Real-Time Crawler & Pipeline Monitoring Dashboard
============================================================
Run in terminal:
    python scripts/monitor.py
"""

import os
import sys
import time
import sqlite3
import subprocess
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Setup paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if not os.path.exists(os.path.join(ROOT_DIR, "crawlers", "hellowork", "data", "hellowork.db")):
    ROOT_DIR = r"C:\kigyou-list"
HW_DB_PATH = os.path.join(ROOT_DIR, "crawlers", "hellowork", "data", "hellowork.db")
MAIN_DB_PATH = os.path.join(ROOT_DIR, "kigyou-list.db")

def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")

def get_stats():
    stats = {}
    
    # 1. HelloWork Stats
    if os.path.exists(HW_DB_PATH):
        try:
            conn = sqlite3.connect(HW_DB_PATH, timeout=5)
            c = conn.cursor()
            stats["hw_total_queue"] = c.execute("SELECT count(*) FROM jobs_queue").fetchone()[0]
            stats["hw_pending"] = c.execute("SELECT count(*) FROM jobs_queue WHERE status='pending'").fetchone()[0]
            stats["hw_processing"] = c.execute("SELECT count(*) FROM jobs_queue WHERE status='processing'").fetchone()[0]
            stats["hw_done"] = c.execute("SELECT count(*) FROM jobs_queue WHERE status='done'").fetchone()[0]
            stats["hw_extracted_jobs"] = c.execute("SELECT count(*) FROM jobs").fetchone()[0]
            stats["hw_prefs_completed"] = c.execute("SELECT count(*) FROM search_tasks WHERE is_completed=1").fetchone()[0]
            
            # Active prefectures
            active_prefs = c.execute("SELECT prefecture_code, last_page_processed FROM search_tasks WHERE is_completed=0 AND last_page_processed > 0 ORDER BY prefecture_code").fetchall()
            stats["active_prefs"] = active_prefs

            # Live Feed: Latest 4 crawled jobs & companies
            query_latest = """
                SELECT j.discovered_at, 
                       COALESCE(c.company_name, 'Doanh nghiệp tư nhân'), 
                       COALESCE(j.job_title, 'Tin tuyển dụng'), 
                       COALESCE(c.industry_name, 'Chưa phân loại'), 
                       COALESCE(j.work_location, '')
                FROM jobs j 
                LEFT JOIN companies c ON j.corporate_number = c.corporate_number 
                ORDER BY j.rowid DESC LIMIT 4
            """
            stats["latest_jobs"] = c.execute(query_latest).fetchall()
            conn.close()
        except Exception as e:
            stats["hw_error"] = str(e)
            
    # 2. Main DB Stats
    if os.path.exists(MAIN_DB_PATH):
        try:
            conn2 = sqlite3.connect(MAIN_DB_PATH, timeout=5)
            c2 = conn2.cursor()
            stats["companies_count"] = c2.execute("SELECT count(*) FROM companies").fetchone()[0]
            stats["companies_with_website"] = c2.execute("SELECT count(*) FROM companies WHERE website_url IS NOT NULL AND website_url != ''").fetchone()[0]
            stats["companies_with_sns"] = c2.execute("SELECT count(*) FROM companies WHERE sns_links IS NOT NULL AND sns_links != ''").fetchone()[0]
            conn2.close()
        except Exception:
            pass

    # 3. WARP Containers
    try:
        res = subprocess.run(["docker", "ps", "--filter", "name=warp-", "--format", "{{.Names}}"], capture_output=True, text=True, timeout=3)
        containers = [line.strip() for line in res.stdout.splitlines() if line.strip()]
        stats["warp_count"] = len(containers)
    except Exception:
        stats["warp_count"] = "?"
        
    return stats

def main():
    print("[*] Starting Kigyou-List Monitor Dashboard...")
    last_extracted = None
    last_time = None
    speed_per_sec = 0.0

    try:
        while True:
            stats = get_stats()
            now = time.time()
            current_extracted = stats.get("hw_extracted_jobs", 0)
            
            if last_extracted is not None and last_time is not None and now > last_time:
                delta_jobs = current_extracted - last_extracted
                delta_sec = now - last_time
                if delta_sec > 0:
                    speed_per_sec = delta_jobs / delta_sec
                    
            last_extracted = current_extracted
            last_time = now
            
            clear_screen()
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            print("=" * 72)
            print(f"      KIGYOU-LIST: REAL-TIME DATA CRAWLER MONITOR")
            print(f"      Thời gian: {now_str}  |  Bấm Ctrl + C để thoát")
            print("=" * 72)
            
            # --- SECTION 1: HELLOWORK EXTRACTOR (BÓC TÁCH) ---
            print("\n[1] HELLOWORK EXTRACTOR SUPER ENGINE (Đang bóc tách chi tiết)")
            print("-" * 72)
            print(f"  * Tổng số tin ĐÃ BÓC TÁCH hoàn chỉnh : {current_extracted:,} tin")
            print(f"  * Hàng đợi tin MỚI ĐANG CHỜ bóc tách : {stats.get('hw_pending', 0):,} tin")
            print(f"  * Số tin ĐANG ĐỒNG THỜI XỬ LÝ (Slot) : {stats.get('hw_processing', 0)} luồng")
            
            speed_min = speed_per_sec * 60
            speed_hour = speed_min * 60
            print(f"  * Tốc độ bóc tách ước tính          : {speed_per_sec:.1f} tin/giây  ({speed_min:.0f} tin/phút  ~  {speed_hour:,.0f} tin/giờ)")

            # --- LIVE STREAM FEED ---
            print("\n[LIVE STREAM] DỮ LIỆU CÔNG TY & VIỆC LÀM VỪA CÀO VỀ MỚI NHẤT (Cập nhật trực tiếp):")
            latest = stats.get("latest_jobs", [])
            if latest:
                for idx, r in enumerate(latest, 1):
                    raw_time = str(r[0])
                    time_str = raw_time.split()[1] if " " in raw_time else raw_time
                    comp = str(r[1])[:36]
                    title = str(r[2])[:36]
                    ind = str(r[3])[:28]
                    loc = str(r[4])[:38]
                    print(f"  {idx}. [{time_str}] {comp}")
                    print(f"     └─ Vị trí: {title}")
                    print(f"     └─ Ngành : {ind} | {loc}")
            else:
                print("  (Đang kết nối nhận luồng dữ liệu...)")
            
            # --- SECTION 2: HELLOWORK HARVESTER (GOM LINK) ---
            print("\n[2] HELLOWORK HARVESTER (Đang rà soát quét Job ID mới)")
            print("-" * 72)
            prefs_done = stats.get("hw_prefs_completed", 0)
            print(f"  * Tiến độ quét tỉnh thành            : {prefs_done}/47 tỉnh ({prefs_done*100//47}%)")
            print(f"  * Tổng số Job ID trong hệ thống      : {stats.get('hw_total_queue', 0):,} tin")
            
            active_prefs = stats.get("active_prefs", [])
            if active_prefs:
                pref_strs = [f"Tỉnh {p[0]} (trang {p[1]})" for p in active_prefs[:6]]
                print(f"  * Các tỉnh đang quét trực tiếp       : {', '.join(pref_strs)}")
                
            # --- SECTION 3: PROXY POOL & HẠ TẦNG ---
            print("\n[3] HẠ TẦNG CLOUDFLARE WARP PROXY POOL")
            print("-" * 72)
            print(f"  * Số container WARP Proxy đang chạy  : {stats.get('warp_count', 0)} containers (mỗi luồng 1 proxy riêng)")
            print(f"  * Độ trễ bảo vệ Rate Limit           : 1.0 - 1.2 giây/tin (An toàn 100%)")
            
            # --- SECTION 4: MASTER DATABASE STATS ---
            print("\n[4] DỮ LIỆU CÔNG TY TRONG MASTER DATABASE (kigyou-list.db)")
            print("-" * 72)
            print(f"  * Tổng số doanh nghiệp Master        : {stats.get('companies_count', 0):,} công ty")
            print(f"  * Doanh nghiệp đã có Website         : {stats.get('companies_with_website', 0):,} công ty")
            print(f"  * Doanh nghiệp đã bóc tách SNS links : {stats.get('companies_with_sns', 0):,} công ty")
            print("=" * 72)
            
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\n[*] Đã đóng Dashboard giám sát. Các tiến trình cào ngầm vẫn đang hoạt động bình thường!")

if __name__ == "__main__":
    main()
