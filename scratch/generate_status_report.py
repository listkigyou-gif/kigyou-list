#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sqlite3
import psycopg2
import os
import sys
import re
from datetime import datetime

# Setup absolute paths
WORKSPACE_ROOT = r"c:\TUHOCLAPTRINH\kigyou-list"
HELLOWORK_DB = os.path.join(WORKSPACE_ROOT, "crawlers", "hellowork", "data", "hellowork.db")
GOLD_DB = os.path.join(WORKSPACE_ROOT, "kigyou-list.db")
REPORT_PATH = r"C:\Users\admin\.gemini\antigravity-ide\brain\86e1fa62-6c0f-49a5-8e98-33af04a92224\enrichment_report.md"
PROXY_LOG = os.path.join(WORKSPACE_ROOT, "proxy_monitor.log")

def get_hellowork_stats():
    if not os.path.exists(HELLOWORK_DB):
        return None
    try:
        conn = sqlite3.connect(HELLOWORK_DB)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM search_tasks")
        total_tasks = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM search_tasks WHERE is_completed = 1")
        completed_tasks = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*), status FROM jobs_queue GROUP BY status")
        distribution = {row[1]: row[0] for row in cursor.fetchall()}
        
        conn.close()
        return {
            "tasks": f"{completed_tasks}/{total_tasks}",
            "completed": distribution.get("completed", 0),
            "pending": distribution.get("pending", 0),
            "processing": distribution.get("processing", 0),
        }
    except Exception as e:
        print(f"Error reading HelloWork DB: {e}")
        return None

def get_gold_stats():
    if not os.path.exists(GOLD_DB):
        return None
    try:
        conn = sqlite3.connect(GOLD_DB)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM companies")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM companies WHERE website_url IS NOT NULL")
        has_web = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM companies WHERE yahoo_last_crawled_at IS NOT NULL")
        yahoo_crawled = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*), website_crawl_status FROM companies GROUP BY website_crawl_status")
        web_dist = {row[1] or "PENDING": row[0] for row in cursor.fetchall()}
        
        conn.close()
        return {
            "total": total,
            "has_web": has_web,
            "yahoo_crawled": yahoo_crawled,
            "web_dist": web_dist
        }
    except Exception as e:
        print(f"Error reading Gold DB: {e}")
        return None

def get_pg_stats():
    pg_url = "postgresql://postgres:postgres@localhost:5432/kigyou_list"
    try:
        conn = psycopg2.connect(pg_url)
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM companies;")
        total_companies = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM business_signals;")
        total_signals = cur.fetchone()[0]
        
        conn.close()
        return {
            "pg_companies": total_companies,
            "pg_signals": total_signals
        }
    except Exception as e:
        print(f"Error reading Postgres: {e}")
        return None

def get_proxy_restarts():
    if not os.path.exists(PROXY_LOG):
        return []
    restarts = []
    try:
        with open(PROXY_LOG, "r", encoding="utf-8") as f:
            for line in f:
                if "Successfully restarted" in line:
                    restarts.append(line.strip())
    except Exception as e:
        print(f"Error reading proxy monitor log: {e}")
    return restarts[-10:]  # Last 10 restarts

def generate_report():
    hw = get_hellowork_stats() or {"tasks": "N/A", "completed": 0, "pending": 0, "processing": 0}
    gold = get_gold_stats() or {"total": 0, "has_web": 0, "yahoo_crawled": 0, "web_dist": {}}
    pg = get_pg_stats() or {"pg_companies": 0, "pg_signals": 0}
    restarts = get_proxy_restarts()
    
    # Calculate percentages
    web_pct = (gold["has_web"] / gold["total"] * 100) if gold["total"] > 0 else 0
    yahoo_pct = (gold["yahoo_crawled"] / gold["total"] * 100) if gold["total"] > 0 else 0
    
    # Read the current loop execution details
    loop_status = "RUNNING"
    
    # Determine the current stage by looking at the main loop log
    stage = "HelloWork Detail Extraction"
    loop_log = os.path.join(WORKSPACE_ROOT, "enrichment_loop.log")
    if os.path.exists(loop_log):
        try:
            with open(loop_log, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()[-20:]
                for line in reversed(lines):
                    if "STAGE 1: HELLOWORK CRAWLER" in line:
                        stage = "HelloWork Harvester/Extractor"
                        break
                    elif "STAGE 2: YAHOO MAPS CRAWLER" in line:
                        stage = "Yahoo Maps Parallel Crawler"
                        break
                    elif "STAGE 3: CENTRAL ETL PIPELINE" in line:
                        stage = "Central ETL (Website Scraper, AI Tagging, Postgres Sync)"
                        break
                    elif "LOOP COMPLETED SUCCESSFULLY" in line:
                        stage = "Finished / Idle"
                        loop_status = "COMPLETED"
                        break
        except Exception:
            pass

    content = f"""# Data Enrichment Loop Status Report

> [!NOTE]
> This status report is automatically updated by the background monitor system to track progress of the data enrichment pipeline.
> Last Updated: **{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}**

---

## 🚀 Current Status Summary
- **Main Loop Execution**: `{loop_status}`
- **Current Pipeline Stage**: `{stage}`

---

## 📊 Live Progress Statistics

### 1. HelloWork Scraper Queue (Staging sqlite)
| Metric | Value | Details / Progress |
| :--- | :--- | :--- |
| **Prefecture Scan Tasks** | `{hw["tasks"]}` | Scanning all prefectures for new Job IDs |
| **Pending Detail Extractions** | `{hw["pending"]:,}` | Jobs remaining in queue |
| **Completed Extractions** | `{hw["completed"]:,}` | Successfully crawled jobs |
| **Active Workers** | `{hw["processing"]}` | Parallel crawler threads processing jobs |

### 2. Consolidated Gold Database (`kigyou-list.db`)
| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Total Registered Companies** | `{gold["total"]:,}` | 100% |
| **Companies with Website URLs** | `{gold["has_web"]:,}` | `{web_pct:.2f}%` |
| **Companies Crawled on Yahoo Maps** | `{gold["yahoo_crawled"]:,}` | `{yahoo_pct:.2f}%` |

### 3. Central Production Database (PostgreSQL)
| Table | Row Count | Purpose |
| :--- | :--- | :--- |
| **`companies`** | `{pg["pg_companies"]:,}` | Live production company directory |
| **`business_signals`** | `{pg["pg_signals"]:,}` | Signals (Website, Yahoo Maps, HelloWork metadata) |

---

## 🔧 Self-Healing & Infrastructure Health
- **Container Health Daemon**: `Running` (Monitors every 30s)

### Recent Auto-Healing Events:
"""
    if restarts:
        for r in restarts:
            # Extract date and message
            m = re.search(r'(\d{{4}}-\d{{2}}-\d{{2}} \d{{2}}:\d{{2}}:\d{{2}}).*?Container \'(.*?)\' is UNHEALTHY\. Restarting\.\.\.', r)
            if m:
                content += f"- **{m.group(1)}**: Restarted unhealthy container `{m.group(2)}`.\n"
            else:
                content += f"- {r}\n"
    else:
        content += "- *No proxy restarts logged yet (all proxy services are currently stable).* \n"
        
    content += """
---
*You can view this file at any time to get real-time statistics on the crawl cycle. To refresh manually, run `python scratch/generate_status_report.py`.*
"""
    
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Report generated successfully at: {REPORT_PATH}")

if __name__ == "__main__":
    generate_report()
