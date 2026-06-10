#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import sqlite3
from datetime import datetime

# Reconfigure stdout to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(SCRIPTS_DIR, ".."))
DB_PATH = os.path.join(WORKSPACE_ROOT, "kigyou-list.db")

def get_delta():
    if not os.path.exists(DB_PATH):
        print("[-] Khong tim thay file database kigyou-list.db")
        return

    try:
        conn = sqlite3.connect(DB_PATH, timeout=30)
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='yahoo_stats_history';")
        if not cur.fetchone():
            print("[-] Bang yahoo_stats_history chua duoc tao.")
            conn.close()
            return
            
        cur.execute("""
            SELECT timestamp, total_crawled, total_phones, total_websites
            FROM yahoo_stats_history
            ORDER BY timestamp DESC
            LIMIT 2;
        """)
        rows = cur.fetchall()
        
        if not rows:
            print("[-] Chua co ban ghi nao trong yahoo_stats_history.")
            conn.close()
            return
            
        latest = rows[0]
        
        # Fetch the midnight (0:00) record of the same day
        latest_date = latest[0][:10] # 'YYYY-MM-DD'
        cur.execute("""
            SELECT timestamp, total_crawled, total_phones, total_websites
            FROM yahoo_stats_history
            WHERE timestamp LIKE ?
            ORDER BY timestamp ASC
            LIMIT 1;
        """, (latest_date + "%",))
        midnight = cur.fetchone()
        conn.close()
        
        # Print Section 1: Delta 15 minutes (or latest vs prev)
        if len(rows) > 1:
            prev = rows[1]
            dc = latest[1] - prev[1]
            dp = latest[2] - prev[2]
            dw = latest[3] - prev[3]
            
            try:
                t_latest = datetime.strptime(latest[0], "%Y-%m-%d %H:%M:%S").strftime("%H:%M:%S")
                t_prev = datetime.strptime(prev[0], "%Y-%m-%d %H:%M:%S").strftime("%H:%M:%S")
                time_range_str = f"tu {t_prev} den {t_latest}"
                dt_latest = datetime.strptime(latest[0], "%Y-%m-%d %H:%M:%S")
                dt_prev = datetime.strptime(prev[0], "%Y-%m-%d %H:%M:%S")
                dur_min = (dt_latest - dt_prev).total_seconds() / 60.0
            except Exception:
                time_range_str = "so voi 15 phut truoc"
                t_latest = "nay"
                t_prev = "truoc"
                dur_min = 15.0

            print(f"### 📊 Thống kê Hiệu suất & Tốc độ cào ({time_range_str})")
            
            # Format speed strings
            sc_str = f" <br> *(~{dc/dur_min:.2f} cty/phút)*" if dur_min > 0 and dc > 0 else ""
            sp_str = f" <br> *(~{dp/dur_min:.2f} SĐT/phút)*" if dur_min > 0 and dp > 0 else ""
            sw_str = f" <br> *(~{dw/dur_min:.2f} web/phút)*" if dur_min > 0 and dw > 0 else ""
            
            print(f"\n| Chỉ số dữ liệu | Mốc {t_prev} | Mốc {t_latest} | Lượng tăng thêm (Delta) / Tốc độ cào / 1 phút |")
            print(f"| :--- | :---: | :---: | :---: |")
            print(f"| **Doanh nghiệp đã quét** | {prev[1]:,} | {latest[1]:,} | **+{dc:,}** doanh nghiệp{sc_str} |")
            print(f"| **Số điện thoại (SĐT)** | {prev[2]:,} | {latest[2]:,} | **+{dp:,}** SĐT{sp_str} |")
            print(f"| **Website chính thức** | {prev[3]:,} | {latest[3]:,} | **+{dw:,}** website{sw_str} |")
            print()

        # Print Section 2: Delta since midnight (0:00)
        if midnight:
            dc_m = latest[1] - midnight[1]
            dp_m = latest[2] - midnight[2]
            dw_m = latest[3] - midnight[3]
            
            try:
                t_latest_m = datetime.strptime(latest[0], "%Y-%m-%d %H:%M:%S").strftime("%H:%M:%S")
                t_midnight = datetime.strptime(midnight[0], "%Y-%m-%d %H:%M:%S").strftime("%H:%M:%S")
                dt_latest_m = datetime.strptime(latest[0], "%Y-%m-%d %H:%M:%S")
                dt_midnight = datetime.strptime(midnight[0], "%Y-%m-%d %H:%M:%S")
                dur_min_m = (dt_latest_m - dt_midnight).total_seconds() / 60.0
            except Exception:
                t_latest_m = "nay"
                t_midnight = "00:00"
                dur_min_m = 0.0
                
            print(f"### 📊 Thống kê Hiệu suất & Tốc độ cào (từ 0:00 tới thời điểm hiện tại)")
            
            sc_m_str = f" <br> *(~{dc_m/dur_min_m:.2f} cty/phút)*" if dur_min_m > 0 and dc_m > 0 else ""
            sp_m_str = f" <br> *(~{dp_m/dur_min_m:.2f} SĐT/phút)*" if dur_min_m > 0 and dp_m > 0 else ""
            sw_m_str = f" <br> *(~{dw_m/dur_min_m:.2f} web/phút)*" if dur_min_m > 0 and dw_m > 0 else ""
            
            print(f"\n| Chỉ số dữ liệu | Mốc {t_midnight} | Mốc {t_latest_m} | Lượng tăng thêm (Delta) / Tốc độ cào / 1 phút |")
            print(f"| :--- | :---: | :---: | :---: |")
            print(f"| **Doanh nghiệp đã quét** | {midnight[1]:,} | {latest[1]:,} | **+{dc_m:,}** doanh nghiệp{sc_m_str} |")
            print(f"| **Số điện thoại (SĐT)** | {midnight[2]:,} | {latest[2]:,} | **+{dp_m:,}** SĐT{sp_m_str} |")
            print(f"| **Website chính thức** | {midnight[3]:,} | {latest[3]:,} | **+{dw_m:,}** website{sw_m_str} |")
            print()
            
    except Exception as e:
        print(f"[-] Loi khi doc du lieu lich su stats: {e}")

if __name__ == "__main__":
    get_delta()
