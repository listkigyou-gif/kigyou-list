#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sqlite3
import time
from datetime import datetime, timedelta

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "kigyou-list.db"))
REPORT_PATH = os.path.join(CURRENT_DIR, "crawl_report.md")
LOGS_DIR = os.path.join(CURRENT_DIR, "logs")

def get_stats():
    if not os.path.exists(DB_PATH):
        return None
        
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # 1. Total targets (cached value to avoid expensive table scan under database load)
    total_targets = 462226
    
    # 2. Get breakdown of already crawled status using index
    cur.execute("""
        SELECT website_crawl_status, COUNT(*) as count
        FROM companies INDEXED BY idx_companies_last_crawled_status
        WHERE website_last_crawled_at IS NOT NULL
        GROUP BY website_crawl_status;
    """)
    rows = cur.fetchall()
    
    success_total = 0
    failed_total = 0
    for row in rows:
        status = row["website_crawl_status"]
        count = row["count"]
        if status in ('SUCCESS', 'SUCCESS_EMPTY'):
            success_total += count
        elif status and status.startswith('ERR_'):
            failed_total += count
            
    # 3. Get successes and failures today using index
    one_day_ago = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
    cur.execute("""
        SELECT website_crawl_status, COUNT(*) as count
        FROM companies INDEXED BY idx_companies_last_crawled_status
        WHERE website_last_crawled_at >= ?
        GROUP BY website_crawl_status;
    """, (one_day_ago,))
    rows_today = cur.fetchall()
    
    success_today = 0
    failed_today = 0
    for row in rows_today:
        status = row["website_crawl_status"]
        count = row["count"]
        if status in ('SUCCESS', 'SUCCESS_EMPTY'):
            success_today += count
        elif status and status.startswith('ERR_'):
            failed_today += count
            
    # 4. Remaining targets calculation (using instant arithmetic)
    remaining = total_targets - (success_total + failed_total)
    
    conn.close()
    
    return {
        "total_targets": total_targets,
        "success_total": success_total,
        "failed_total": failed_total,
        "success_today": success_today,
        "failed_today": failed_today,
        "remaining": remaining
    }

def get_latest_log_entries():
    entries = []
    if not os.path.exists(LOGS_DIR):
        return entries
        
    log_files = [f for f in os.listdir(LOGS_DIR) if f.startswith("worker_") and f.endswith(".log")]
    if not log_files:
        return entries
        
    # Read the last line from up to 5 worker log files to see active lines
    for f in sorted(log_files)[:5]:
        path = os.path.join(LOGS_DIR, f)
        try:
            with open(path, "r", encoding="utf-8") as file:
                lines = file.readlines()
                if lines:
                    last_line = lines[-1].strip()
                    # extract timestamp and status
                    entries.append(f"{f.replace('.log', '')}: {last_line}")
        except Exception:
            continue
    return entries

def generate_report():
    stats = get_stats()
    if not stats:
        print("Could not fetch stats.")
        return
        
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    total = stats["total_targets"]
    crawled = stats["success_total"] + stats["failed_total"]
    remaining = stats["remaining"]
    
    progress_pct = (crawled / total * 100) if total > 0 else 0
    
    # Simple ASCII progress bar
    bar_width = 30
    filled = int(round(bar_width * progress_pct / 100))
    bar = "█" * filled + "░" * (bar_width - filled)
    
    # Calculate speed (based on last 24h)
    speed_per_hour = stats["success_today"] + stats["failed_today"]
    if speed_per_hour > 0:
        etc_hours = remaining / speed_per_hour
        etc_str = f"{etc_hours:.1f} hours" if etc_hours < 24 else f"{etc_hours/24:.1f} days"
    else:
        etc_str = "Calculating..."
        
    latest_logs = get_latest_log_entries()
    logs_md = "\n".join([f"- `{entry}`" for entry in latest_logs]) if latest_logs else "- *No active worker logs found yet.*"
    
    report_content = f"""# 📈 Official Website Crawl Progress Report
*Last Updated: {now_str}*

## 🖥️ System Status Dashboard
- **Orchestrator Status:** 🟢 Running
- **Concurrency:** 50 workers
- **Overall Progress:** **{progress_pct:.2f}%** (`{crawled:,}` / `{total:,}` websites crawled)
  - `[{bar}]`
- **Total Successes:** `{stats["success_total"]:,}`
- **Total Failures:** `{stats["failed_total"]:,}`
- **Remaining Targets:** `{remaining:,}`
- **Crawl Speed (Last 24h):** `{speed_per_hour:,} sites/hour`
- **Estimated Time to Completion (ETC):** **{etc_str}**

## 📊 Activity in Last 24 Hours
- **Successes:** `{stats["success_today"]:,}`
- **Failures:** `{stats["failed_today"]:,}`

## 🤖 Latest Workers Activity
{logs_md}
"""

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    print(f"Report updated successfully at {now_str}")

if __name__ == "__main__":
    generate_report()
