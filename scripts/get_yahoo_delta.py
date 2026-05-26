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
        conn.close()
        
        if not rows:
            print("[-] Chua co ban ghi nao trong yahoo_stats_history.")
            return
            
        if len(rows) == 1:
            # Chi co 1 ban ghi
            latest = rows[0]
            print("### 📊 Thong ke toc do cao (So voi 15 phut truoc)")
            print(f"> [!NOTE]")
            print(f"> Day la ky bao cao dau tien hoac chua co du lieu lich su de so sanh.")
            print(f"\n| Chi so | Gia tri hien tai | Tang them (Delta) |")
            print(f"| :--- | :--- | :--- |")
            print(f"| Doanh nghiep da quet | {latest[1]:,} | **+{latest[1]:,}** |")
            print(f"| So dien thoai (SDT) | {latest[2]:,} | **+{latest[2]:,}** |")
            print(f"| Website chinh thuc | {latest[3]:,} | **+{latest[3]:,}** |")
        else:
            latest, prev = rows[0], rows[1]
            dc = latest[1] - prev[1]
            dp = latest[2] - prev[2]
            dw = latest[3] - prev[3]
            
            # Format time formatting
            try:
                t_latest = datetime.strptime(latest[0], "%Y-%m-%d %H:%M:%S").strftime("%H:%M:%S")
                t_prev = datetime.strptime(prev[0], "%Y-%m-%d %H:%M:%S").strftime("%H:%M:%S")
                time_range_str = f"tu {t_prev} den {t_latest}"
            except Exception:
                time_range_str = f"so voi 15 phut truoc"

            print(f"### 📊 Thong ke toc do cao ({time_range_str})")
            print(f"\n| Chi so | Moc {t_prev if 't_prev' in locals() else 'truoc'} | Moc {t_latest if 't_latest' in locals() else 'nay'} | **Luong tang them (Delta)** |")
            print(f"| :--- | :---: | :---: | :--- |")
            print(f"| **Doanh nghiep da quet** | {prev[1]:,} | {latest[1]:,} | **+{dc:,}** |")
            print(f"| **So dien thoai (SDT)** | {prev[2]:,} | {latest[2]:,} | **+{dp:,}** |")
            print(f"| **Website chinh thuc** | {prev[3]:,} | {latest[3]:,} | **+{dw:,}** |")
            
    except Exception as e:
        print(f"[-] Loi khi doc du lieu lich su stats: {e}")

if __name__ == "__main__":
    get_delta()
