#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-List: Overnight Autonomous Enrichment Supervisor
======================================================
1. Ensures HelloWork Extractor is active.
2. Ensures Yahoo Searcher Multi-WARP Engine is active.
3. Every 60 minutes:
   - Runs Website Scraper (Next-Gen Hybrid) to enrich new websites & SNS badges.
   - Runs Data Consolidation ETL (scripts/consolidate_data.py --incremental).
"""

import os
import sys
import time
import subprocess
import logging
from datetime import datetime

# Configure Windows UTF-8 stdout
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_EXE = sys.executable

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(ROOT_DIR, "overnight_supervisor.log"), encoding="utf-8")
    ]
)
log = logging.getLogger("overnight_supervisor")

def run_cmd(args: list[str], cwd: str, desc: str, timeout: int = None):
    log.info(f"▶️ Bắt đầu: {desc}...")
    t0 = time.time()
    try:
        res = subprocess.run(args, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)
        duration = time.time() - t0
        if res.returncode == 0:
            log.info(f"✅ Hoàn thành: {desc} ({duration:.1f}s)")
            return True
        else:
            log.warning(f"⚠️ {desc} kết thúc với mã {res.returncode}: {res.stderr[:300] if res.stderr else res.stdout[:300]}")
            return False
    except subprocess.TimeoutExpired:
        log.warning(f"⏱️ Quá hạn thời gian ({timeout}s) cho {desc}")
        return False
    except Exception as e:
        log.error(f"❌ Lỗi khi chạy {desc}: {e}")
        return False

def check_hellowork_finished() -> bool:
    hw_db = os.path.join(ROOT_DIR, "crawlers", "hellowork", "data", "hellowork.db")
    if not os.path.exists(hw_db):
        return False
    try:
        import sqlite3
        conn = sqlite3.connect(hw_db, timeout=10.0)
        c = conn.cursor()
        c.execute("SELECT count(*) FROM jobs_queue WHERE status='pending'")
        pending = c.fetchone()[0]
        conn.close()
        return pending == 0
    except Exception:
        return False

def main():
    log.info("="*75)
    log.info("   KIGYOU-LIST: OVERNIGHT AUTONOMOUS ENRICHMENT SUPERVISOR ACTIVE")
    log.info("="*75)
    log.info(f"Root: {ROOT_DIR}")
    log.info(f"Python: {PYTHON_EXE}")

    cycle = 1
    # Run cycle every 60 minutes
    INTERVAL_SECONDS = 3600

    while True:
        log.info(f"\n🌙 [CHU KỲ ĐÊM #{cycle:03d}] Bắt đầu chu trình làm giàu dữ liệu lúc {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}...")
        
        # 1. Kích hoạt cào Website & SNS cho các công ty đã có website
        hw_done = check_hellowork_finished()
        if hw_done:
            # Đồng bộ website mới nhất từ HelloWork vào Master DB
            run_cmd(
                [PYTHON_EXE, os.path.join(ROOT_DIR, "scripts", "sync_hw_websites.py")],
                cwd=ROOT_DIR,
                desc="Đồng bộ Website từ HelloWork sang Master DB",
                timeout=120
            )
            log.info("🎉 HelloWork đã hoàn tất 100%! Kích hoạt Toàn lực Website Multi-Scraper 8 Lõi CPU...")
            run_cmd(
                [PYTHON_EXE, os.path.join(ROOT_DIR, "crawlers", "website", "multi_scraper.py"), "--processes", "8", "--workers-per-proc", "25"],
                cwd=os.path.join(ROOT_DIR, "crawlers", "website"),
                desc=f"Website Multi-Scraper 8 Cores (Lô {cycle})",
                timeout=3600 # tối đa 60 phút
            )
        else:
            run_cmd(
                [PYTHON_EXE, os.path.join(ROOT_DIR, "crawlers", "website", "main.py"), "--limit", "2500"],
                cwd=os.path.join(ROOT_DIR, "crawlers", "website"),
                desc=f"Website Scraper Next-Gen (Lô {cycle})",
                timeout=1800 # tối đa 30 phút
            )

        # 2. Hợp nhất dữ liệu (Consolidation ETL)
        run_cmd(
            [PYTHON_EXE, os.path.join(ROOT_DIR, "scripts", "consolidate_data.py"), "--incremental"],
            cwd=ROOT_DIR,
            desc=f"Hợp nhất dữ liệu Master ETL (Lô {cycle})",
            timeout=900
        )

        log.info(f"💤 [CHU KỲ ĐÊM #{cycle:03d}] Hoàn tất! Nghỉ {INTERVAL_SECONDS // 60} phút chờ lô dữ liệu mới...")
        cycle += 1
        time.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
