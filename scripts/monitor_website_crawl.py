#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-List: Full-Scale Website Crawler & Industry Tagging Monitor
=================================================================
Ultra-fast non-blocking monitor for the website crawler pipeline.
"""

import os
import sys
import time
import sqlite3
import subprocess
import re
from datetime import datetime
from collections import Counter

# Set UTF-8
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = r"C:\kigyou-list"
DB_PATH = os.path.join(ROOT_DIR, "kigyou-list.db")
TASK_DIR = r"C:\Users\admin\.gemini\antigravity-ide\brain\ce468796-d3cb-4e99-8f36-ffb8e9b9fb26\.system_generated\tasks"

LOG_PATH = os.path.join(TASK_DIR, "task-2429.log")
if not os.path.exists(LOG_PATH):
    # Fallback to any crawler log
    for f in os.listdir(TASK_DIR):
        if f.endswith(".log"):
            p = os.path.join(TASK_DIR, f)
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as fl:
                    if "OFFICIAL WEBSITE CRAWLER ENGINE" in fl.read(2048):
                        LOG_PATH = p
                        break
            except Exception:
                pass

def get_warp_stats():
    try:
        res = subprocess.run(["docker", "ps", "--filter", "name=warp-", "--format", "{{.Names}}"], capture_output=True, text=True, timeout=3)
        return len([l for l in res.stdout.splitlines() if l.strip()])
    except Exception:
        return "?"

def get_log_stats():
    stats = {
        "total_logged": 0,
        "forms_logged": 0,
        "mails_logged": 0,
        "sns_logged": 0,
        "dead_logged": 0,
        "statuses": Counter(),
        "last_lines": []
    }
    if not os.path.exists(LOG_PATH):
        return stats
        
    try:
        with open(LOG_PATH, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.read().splitlines()
            
        stats["last_lines"] = [line.strip() for line in lines[-6:] if line.strip()]
        for line in lines:
            m = re.search(r'\|\s+([A-Z_]+)\s+\|\s+FORM:\s+([^|]+)\|\s+MAIL:\s+([^|]+)\|\s+SNS:\s+([^|]+)\|', line)
            if m:
                stats["total_logged"] += 1
                st, form, mail, sns = m.groups()
                st = st.strip()
                stats["statuses"][st] += 1
                if '[FORM]' in form:
                    stats["forms_logged"] += 1
                if mail.strip() != '-':
                    stats["mails_logged"] += 1
                if sns.strip() != '-':
                    stats["sns_logged"] += 1
                if st in ['DEAD_DOMAIN', 'PARKED_DOMAIN']:
                    stats["dead_logged"] += 1
    except Exception as e:
        stats["log_error"] = str(e)
    return stats

def get_quick_db_stats():
    stats = {}
    try:
        conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True, timeout=2)
        c = conn.cursor()
        c.execute("PRAGMA query_only = ON;")
        stats["company_industries_count"] = c.execute("SELECT count(1) FROM company_industries").fetchone()[0]
        stats["raw_website_count"] = c.execute("SELECT count(1) FROM raw_website").fetchone()[0]
        conn.close()
    except Exception as e:
        stats["db_error"] = str(e)
    return stats

def run_monitor():
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log = get_log_stats()
    db = get_quick_db_stats()
    warp_cnt = get_warp_stats()
    
    total_target = 515107
    total_done = log["total_logged"]
    pct = (total_done / total_target * 100) if total_target else 0
    
    print("=" * 80)
    print(f"   KIGYOU-LIST: WEBLIST RE-CRAWL & TAGGING PIPELINE MONITOR")
    print(f"   Thời gian: {now_str}  |  Proxy WARP: {warp_cnt} containers (Ports 40011-40050)")
    if log.get("log_error"):
        print(f"   [!] LOG READ ERROR: {log.get('log_error')}")
    print("=" * 80)
    
    print(f"\n[1] TIẾN ĐỘ CÀO WEBSITE (Turbo Mode - 200 Workers / 40 Proxies)")
    print("-" * 80)
    print(f"  * Tổng số website trong queue : {total_target:,} websites")
    print(f"  * Số website đã xử lý         : {total_done:,} ({pct:.2f}%)")
    print(f"  * Số Form liên hệ bóc tách    : {log['forms_logged']:,} ({log['forms_logged']*100/max(1, total_done):.1f}%)")
    print(f"  * Số Email bóc tách           : {log['mails_logged']:,} ({log['mails_logged']*100/max(1, total_done):.1f}%)")
    print(f"  * Số Mạng xã hội bóc tách     : {log['sns_logged']:,} ({log['sns_logged']*100/max(1, total_done):.1f}%)")
    print(f"  * Web chết/parked đã xoá      : {log['dead_logged']:,}")
    
    status_summary = ", ".join([f"{k}: {v}" for k, v in log["statuses"].items()])
    print(f"  * Phân bổ trạng thái          : {status_summary}")
    
    print(f"\n[2] DỮ LIỆU ĐÃ ĐƯỢC LÀM GIÀU TRONG DATABASE")
    print("-" * 80)
    print(f"  * Tổng bản ghi Raw Website    : {db.get('raw_website_count', 0):,}")
    print(f"  * Tổng bản ghi Phân loại JSIC : {db.get('company_industries_count', 0):,}")
    
    print(f"\n[3] 6 WEBSITE XỬ LÝ GẦN NHẤT:")
    print("-" * 80)
    for l in log.get("last_lines", []):
        print(f"  {l}")
    print("=" * 80)

if __name__ == "__main__":
    run_monitor()
