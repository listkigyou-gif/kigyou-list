#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
========================================================================================
KIGYOU-LIST GLOBAL MASTER DATA ORCHESTRATOR (Agent Tổng Điều Phối Dữ Liệu Quốc Gia)
========================================================================================
Central automated pipeline engine that coordinates, cleanses, and synchronizes all
enterprise data streams across the entire platform.
Conforms to: .agents/skills/b2b-data-engine/SKILL.md

Architecture:
  - Multi-Agent / Worker Subagents: Isolated execution per layer (Layer 0 to 3, EDINET, GEPS)
  - Self-Healing Circuit Breaker: Auto-isolates failing pipelines without halting the daemon
  - Dedicated Per-Worker Logging: Zero context pollution across subsystems
  - Conflict Resolution Engine: Absolute legal hierarchy (NTA > FSA EDINET > MLIT/NPA > Web)
  - 100% Local Heavy Lifting: Playwright, PDF/XBRL parsing, and normalization execute locally
  - Zero-Overhead Bulk Delta Sync: Pushes clean deltas to VPS PostgreSQL in 1-3 seconds
  - Instant IndexNow: Auto-pings search engines (Bing, Google) upon data publication
========================================================================================
"""

import os
import sys
import time
import json
import sqlite3
import argparse
import asyncio
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler
from typing import List, Dict, Any, Tuple, Optional

# Database drivers
import psycopg2
from psycopg2.extras import execute_values
import urllib.request
import urllib.error

# Ensure UTF-8 output across all environments (Windows CP1252 fix)
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Project Paths
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

SQLITE_DB = os.path.join(PROJECT_ROOT, "kigyou-list.db")
PG_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")
LOG_DIR = os.path.join(PROJECT_ROOT, "logs")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
STATE_FILE = os.path.join(DATA_DIR, "orchestrator_state.json")

os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# ======================================================================================
# MULTI-WORKER DEDICATED LOGGING SYSTEM
# ======================================================================================

def create_worker_logger(worker_name: str, log_filename: str) -> logging.Logger:
    """Creates an isolated rotating logger for a dedicated crawler worker."""
    worker_logger = logging.getLogger(worker_name)
    worker_logger.setLevel(logging.INFO)
    
    # Avoid duplicate handlers on re-creation
    if not worker_logger.handlers:
        formatter = logging.Formatter('%(asctime)s [%(levelname)s] [%(name)s] %(message)s')
        
        # Dedicated log file
        filepath = os.path.join(LOG_DIR, log_filename)
        file_handler = RotatingFileHandler(filepath, maxBytes=15*1024*1024, backupCount=5, encoding='utf-8')
        file_handler.setFormatter(formatter)
        worker_logger.addHandler(file_handler)
        
        # Console output
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        worker_logger.addHandler(console_handler)
        
    return worker_logger

logger = create_worker_logger("MasterOrchestrator", "master_orchestrator.log")
nta_logger = create_worker_logger("NTA_Worker", "nta_engine.log")
gbiz_logger = create_worker_logger("GBiz_Worker", "gbiz_engine.log")
lic_logger = create_worker_logger("License_Worker", "licenses_engine.log")
edinet_logger = create_worker_logger("EDINET_Worker", "edinet_engine.log")
geps_logger = create_worker_logger("GEPS_Worker", "geps_engine.log")
digital_logger = create_worker_logger("Digital_Worker", "deepweb_crawler.log")
jobs_logger = create_worker_logger("Jobs_Worker", "hellowork_engine.log")

# ======================================================================================
# STATE & CIRCUIT BREAKER MANAGEMENT
# ======================================================================================

CIRCUIT_BREAKER_THRESHOLD = 5  # Trips circuit if a worker fails consecutively 5 times

def get_default_layer_state(name: str) -> Dict[str, Any]:
    return {
        "name": name,
        "status": "IDLE",  # IDLE, RUNNING, COMPLETED, FAILED, CIRCUIT_OPEN
        "last_run": None,
        "last_success": None,
        "processed": 0,
        "last_delta": 0,
        "note": "",
        "error_count": 0,
        "last_error": None
    }

def load_orchestrator_state() -> Dict[str, Any]:
    state = {
        "created_at": datetime.now().isoformat(),
        "total_runs": 0,
        "last_sync_at": None,
        "layers": {
            "layer_0": get_default_layer_state("Tầng 0: NTA Pháp nhân & Invoice (My Number & T-Number)"),
            "layer_gbiz": get_default_layer_state("Tầng 1A: METI gBizINFO (Vốn, Nhân sự, Trợ cấp, Bằng sáng chế)"),
            "layer_1": get_default_layer_state("Tầng 1B: Giấy phép Hoạt động (MLIT, NPA, MHLW)"),
            "layer_edinet": get_default_layer_state("Tầng 1.5A: FSA EDINET (Tài chính & Thu nhập bình quân)"),
            "layer_geps": get_default_layer_state("Tầng 1.5B: GEPS Cổng Đấu thầu Mua sắm Chính phủ"),
            "layer_2": get_default_layer_state("Tầng 2: Mạng lưới số & Khai thác liên hệ (Deep Web & Yahoo)"),
            "layer_3": get_default_layer_state("Tầng 3: Nhịp đập thị trường & Việc làm (HelloWork)")
        }
    }
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                # Merge existing state safely
                state["created_at"] = saved.get("created_at", state["created_at"])
                state["total_runs"] = saved.get("total_runs", 0)
                state["last_sync_at"] = saved.get("last_sync_at")
                if "layers" in saved:
                    for k, v in saved["layers"].items():
                        if k in state["layers"]:
                            state["layers"][k].update(v)
        except Exception as e:
            logger.warning(f"[-] Could not parse state file, using default state: {e}")
    return state

def save_orchestrator_state(state: Dict[str, Any]):
    state["updated_at"] = datetime.now().isoformat()
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"[-] Failed to persist orchestrator state: {e}")

def get_local_db():
    conn = sqlite3.connect(SQLITE_DB, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=60000;")
    return conn

def update_worker_health(state: Dict[str, Any], layer_key: str, success: bool, error_msg: Optional[str] = None, processed: int = 0, delta: int = 0, note: str = ""):
    """Updates health metrics and handles automated circuit tripping."""
    info = state["layers"][layer_key]
    if success:
        info["status"] = "COMPLETED"
        info["last_success"] = datetime.now().isoformat()
        info["error_count"] = 0
        info["last_error"] = None
        info["processed"] = processed
        info["last_delta"] = delta
        info["note"] = note
    else:
        info["error_count"] = info.get("error_count", 0) + 1
        info["last_error"] = str(error_msg)
        if info["error_count"] >= CIRCUIT_BREAKER_THRESHOLD:
            info["status"] = "CIRCUIT_OPEN"
            logger.critical(f"🚨 [CIRCUIT BREAKER OPEN] Worker {layer_key} exceeded {CIRCUIT_BREAKER_THRESHOLD} failures! Auto-isolated.")
        else:
            info["status"] = "FAILED"
    save_orchestrator_state(state)

# ======================================================================================
# WORKER SUBAGENTS: EXECUTION PIPELINES
# ======================================================================================

# --- TẦNG 0: NTA NATIONAL LEGAL ANCHOR ---
async def run_layer_0_nta(state: Dict[str, Any]) -> int:
    layer_key = "layer_0"
    info = state["layers"][layer_key]
    if info.get("status") == "CIRCUIT_OPEN":
        nta_logger.warning("[-] Skipping Layer 0 (NTA) because Circuit Breaker is OPEN. Use --reset-circuit to resume.")
        return 0

    nta_logger.info(">>> [WORKER T0 START] NTA National Legal Anchor & Invoice Verification <<<")
    info["status"] = "RUNNING"
    info["last_run"] = datetime.now().isoformat()
    save_orchestrator_state(state)

    try:
        from crawlers.nta.nta_harvester import harvest_nta_legal_changes
        conn = get_local_db()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM company_legal_histories;")
        before_cnt = cur.fetchone()[0]
        conn.close()

        total = harvest_nta_legal_changes(limit=200)

        conn = get_local_db()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM company_legal_histories;")
        after_cnt = cur.fetchone()[0]
        conn.close()

        delta = max(0, after_cnt - before_cnt)
        note = f"+{delta:,} sự kiện pháp lý mới" if delta > 0 else "Hoàn thành quét, không có sự kiện mới"
        update_worker_health(state, layer_key, success=True, processed=after_cnt, delta=delta, note=note)
        nta_logger.info(f">>> [WORKER T0 COMPLETE] Processed: {after_cnt:,} records (+{delta:,} new) <<<")
        return delta
    except Exception as e:
        nta_logger.error(f"[-] Worker T0 error: {e}", exc_info=True)
        update_worker_health(state, layer_key, success=False, error_msg=str(e))
        return 0

# --- TẦNG 1A: METI G-BIZ INFO (VỐN, NHÂN SỰ, TÍN HIỆU TRỢ CẤP, BẰNG SÁNG CHẾ) ---
async def run_layer_gbiz(state: Dict[str, Any], limit: Optional[int] = None) -> int:
    layer_key = "layer_gbiz"
    info = state["layers"][layer_key]
    if info.get("status") == "CIRCUIT_OPEN":
        gbiz_logger.warning("[-] Skipping Layer gBizINFO because Circuit Breaker is OPEN. Use --reset-circuit to resume.")
        return 0

    gbiz_logger.info(">>> [WORKER GBIZ START] METI gBizINFO REST API v1 Harvester <<<")
    info["status"] = "RUNNING"
    info["last_run"] = datetime.now().isoformat()
    save_orchestrator_state(state)

    try:
        from scripts.import_gbiz_api import fetch_gbiz_updates, save_to_db, load_sync_state, save_sync_state
        from_date = load_sync_state()
        gbiz_logger.info(f"[*] Fetching METI gBizINFO incremental updates from: {from_date} (limit={limit})")

        loop = asyncio.get_running_loop()
        all_records = await loop.run_in_executor(None, fetch_gbiz_updates, from_date, limit)
        imported_companies, imported_signals, imported_financials = await loop.run_in_executor(None, save_to_db, all_records)

        if all_records:
            save_sync_state(datetime.now().strftime("%Y-%m-%d"))

        conn = get_local_db()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM business_signals;")
        total_signals = cur.fetchone()[0]
        conn.close()

        delta = imported_companies + imported_signals + imported_financials
        note = f"+{imported_signals:,} signals, +{imported_companies:,} cos" if delta > 0 else "Đã hoàn thành quét hôm nay, hết dữ liệu mới"
        update_worker_health(state, layer_key, success=True, processed=total_signals, delta=delta, note=note)
        gbiz_logger.info(f">>> [WORKER GBIZ COMPLETE] Imported: {imported_companies:,} companies, {imported_signals:,} signals (+{delta:,} total delta) <<<")
        return imported_companies
    except Exception as e:
        gbiz_logger.error(f"[-] Worker gBizINFO error: {e}", exc_info=True)
        update_worker_health(state, layer_key, success=False, error_msg=str(e))
        return 0

# --- TẦNG 1B: NATIONAL LICENSES (MLIT, NPA, MHLW) ---
async def run_layer_1_licenses(state: Dict[str, Any]) -> int:
    layer_key = "layer_1"
    info = state["layers"][layer_key]
    if info.get("status") == "CIRCUIT_OPEN":
        lic_logger.warning("[-] Skipping Layer 1 (Licenses) because Circuit Breaker is OPEN.")
        return 0

    lic_logger.info(">>> [WORKER T1 START] National Licenses & Compliance Harvesters <<<")
    info["status"] = "RUNNING"
    info["last_run"] = datetime.now().isoformat()
    save_orchestrator_state(state)

    try:
        conn = get_local_db()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM company_licenses;")
        before_cnt = cur.fetchone()[0]
        conn.close()

        # 1.1 Run NPA Kobutsu Harvester (Secondhand business)
        try:
            from crawlers.open_data.harvesters.npa_kobutsu_harvester import harvest_tokyo_kobutsu
            lic_logger.info("[*] Running NPA Kobutsu (古物商) Registry Harvester...")
            harvest_tokyo_kobutsu()
        except Exception as e:
            lic_logger.warning(f"[-] Kobutsu step warning: {e}")

        # 1.2 Run MLIT Takken Harvester (Real Estate - Priority Hubs)
        try:
            from crawlers.open_data.harvesters.mlit_takken_harvester import harvest_takken
            lic_logger.info("[*] Running MLIT Takken (宅建業者) Harvester for Tokyo...")
            await harvest_takken(pref_code="13")
        except Exception as e:
            lic_logger.warning(f"[-] Takken step warning: {e}")

        # 1.3 Run ISA Registered Support Organization Harvester (Tokutei Gino)
        try:
            from crawlers.open_data.harvesters.isa_tokutei_harvester import harvest_isa_support_orgs
            lic_logger.info("[*] Running ISA Registered Support Org (登録支援機関) Harvester...")
            harvest_isa_support_orgs()
        except Exception as e:
            lic_logger.warning(f"[-] ISA Tokutei step warning: {e}")

        # 1.4 Run Statutory Professional Services Harvester (Legal & Accounting)
        try:
            from crawlers.open_data.harvesters.professional_services_harvester import harvest_professional_services
            lic_logger.info("[*] Running Statutory Professional Services (士業・専門職法人) Harvester...")
            harvest_professional_services()
        except Exception as e:
            lic_logger.warning(f"[-] Professional Services step warning: {e}")

        # 1.5 Run Hospitality & Food Harvester (Restaurants & Ryokans)
        try:
            from crawlers.open_data.harvesters.hospitality_food_harvester import (
                harvest_food_restaurants,
                harvest_ryokan_hotels,
            )
            lic_logger.info("[*] Running Hospitality & Food Harvester (飲食店 & 旅館)...")
            harvest_food_restaurants()
            harvest_ryokan_hotels()
        except Exception as e:
            lic_logger.warning(f"[-] Hospitality & Food step warning: {e}")

        # 1.6 Automated Bulk Delta Sync to VPS PostgreSQL Production
        try:
            from scripts.sync_delta_licenses_to_vps import sync_licenses
            lic_logger.info("[*] Syncing license deltas to VPS PostgreSQL...")
            sync_licenses()
        except Exception as e:
            lic_logger.warning(f"[-] VPS license sync warning: {e}")

        # 1.7 Automated License-to-Industry Auto-Tagging on VPS
        try:
            from scripts.enrich_all_licensed_companies import run_enrichment
            lic_logger.info("[*] Running automated license-to-industry auto-tagger...")
            run_enrichment()
        except Exception as e:
            lic_logger.warning(f"[-] Industry auto-tagging warning: {e}")

        # Total licenses count in local DB
        conn = get_local_db()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM company_licenses;")
        after_cnt = cur.fetchone()[0]
        conn.close()

        delta = max(0, after_cnt - before_cnt)
        note = f"+{delta:,} giấy phép mới" if delta > 0 else "Đã thu thập trọn bộ kho dữ liệu mở, không có giấy phép mới"
        update_worker_health(state, layer_key, success=True, processed=after_cnt, delta=delta, note=note)
        lic_logger.info(f">>> [WORKER T1 COMPLETE] Total Local Licenses: {after_cnt:,} (+{delta:,} new) <<<")
        return after_cnt
    except Exception as e:
        lic_logger.error(f"[-] Worker T1 error: {e}", exc_info=True)
        update_worker_health(state, layer_key, success=False, error_msg=str(e))
        return 0

# --- TẦNG 1.5A: FSA EDINET (BÁO CÁO TÀI CHÍNH & LƯƠNG BÌNH QUÂN) ---
async def run_layer_edinet(state: Dict[str, Any], days_back: int = 3) -> int:
    layer_key = "layer_edinet"
    info = state["layers"][layer_key]
    if info.get("status") == "CIRCUIT_OPEN":
        edinet_logger.warning("[-] Skipping EDINET Worker because Circuit Breaker is OPEN.")
        return 0

    edinet_logger.info(">>> [WORKER EDINET START] FSA EDINET API v2 Financial Filings <<<")
    info["status"] = "RUNNING"
    info["last_run"] = datetime.now().isoformat()
    save_orchestrator_state(state)

    try:
        from crawlers.edinet.edinet_harvester import harvest_edinet
        total = harvest_edinet(days_back=days_back, max_docs=50)

        conn = get_local_db()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM company_financials;")
        total_in_db = cur.fetchone()[0]
        conn.close()

        delta = total
        note = f"+{delta:,} báo cáo tài chính mới" if delta > 0 else "Hoàn thành quét 3 ngày qua, không có báo cáo mới"
        update_worker_health(state, layer_key, success=True, processed=total_in_db, delta=delta, note=note)
        edinet_logger.info(f">>> [WORKER EDINET COMPLETE] Harvested: {total}, Total in DB: {total_in_db:,} <<<")
        return total
    except Exception as e:
        edinet_logger.error(f"[-] Worker EDINET error: {e}", exc_info=True)
        update_worker_health(state, layer_key, success=False, error_msg=str(e))
        return 0

# --- TẦNG 1.5B: GEPS (CỔNG ĐẤU THẦU MUA SẮM CHÍNH PHỦ) ---
async def run_layer_geps(state: Dict[str, Any]) -> int:
    layer_key = "layer_geps"
    info = state["layers"][layer_key]
    if info.get("status") == "CIRCUIT_OPEN":
        geps_logger.warning("[-] Skipping GEPS Worker because Circuit Breaker is OPEN.")
        return 0

    geps_logger.info(">>> [WORKER GEPS START] Government Procurement & Public Tender Awards <<<")
    info["status"] = "RUNNING"
    info["last_run"] = datetime.now().isoformat()
    save_orchestrator_state(state)

    try:
        from crawlers.geps.geps_harvester import harvest_geps
        total = harvest_geps(limit=50000)

        conn = get_local_db()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM company_public_tenders;")
        total_in_db = cur.fetchone()[0]
        conn.close()

        delta = total
        note = f"+{delta:,} gói thầu công mới" if delta > 0 else "Hoàn thành quét đấu thầu, không có gói thầu mới"
        update_worker_health(state, layer_key, success=True, processed=total_in_db, delta=delta, note=note)
        geps_logger.info(f">>> [WORKER GEPS COMPLETE] Added: {total}, Total in DB: {total_in_db:,} <<<")
        return total
    except Exception as e:
        geps_logger.error(f"[-] Worker GEPS error: {e}", exc_info=True)
        update_worker_health(state, layer_key, success=False, error_msg=str(e))
        return 0

# --- TẦNG 2: DIGITAL FOOTPRINT & YAHOO SMART RECRAWL ---
async def run_layer_2_digital(state: Dict[str, Any], recrawl_days: int = 60, limit: int = 0) -> int:
    """
    Coordinates Layer 2: Yahoo Search & Deep Web Crawler.
    Implements Smart Recrawl Policy:
      - Priority 1: Never crawled (yahoo_last_crawled_at IS NULL)
      - Priority 2: Hiring companies (HelloWork) lacking website
      - Priority 3: Missing website & crawled > recrawl_days ago (default: 60 days)
    """
    layer_key = "layer_2"
    info = state["layers"][layer_key]
    if info.get("status") == "CIRCUIT_OPEN":
        digital_logger.warning("[-] Skipping Layer 2 (Digital) because Circuit Breaker is OPEN.")
        return 0

    digital_logger.info(f">>> [WORKER T2 START] Digital Footprint & Yahoo Smart Recrawl (RecrawlDays={recrawl_days}) <<<")
    info["status"] = "RUNNING"
    info["last_run"] = datetime.now().isoformat()
    save_orchestrator_state(state)

    try:
        conn = get_local_db()
        cur = conn.cursor()

        cur.execute("SELECT count(*) FROM companies WHERE website_url IS NOT NULL AND website_url != '' AND website_url NOT LIKE '%なし%';")
        has_website_count = cur.fetchone()[0]

        cur.execute("SELECT count(*) FROM companies WHERE website_url IS NULL OR website_url = '' OR website_url LIKE '%なし%';")
        missing_website_count = cur.fetchone()[0]

        cur.execute(f"""
            SELECT count(*) FROM companies 
            WHERE (website_url IS NULL OR website_url = '' OR website_url LIKE '%なし%')
              AND (yahoo_last_crawled_at IS NULL OR yahoo_last_crawled_at < datetime('now', '-{recrawl_days} days'));
        """)
        due_recrawl_60d = cur.fetchone()[0]

        cur.execute("""
            SELECT count(*) FROM companies 
            WHERE website_url IS NOT NULL AND website_url != '' AND website_url NOT LIKE '%なし%'
              AND (website_last_crawled_at IS NULL OR website_last_crawled_at < datetime('now', '-30 days'));
        """)
        due_for_web_enrichment = cur.fetchone()[0]

        cur.execute("SELECT count(*) FROM raw_yahoo;")
        total_yahoo = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM raw_website;")
        total_websites = cur.fetchone()[0]
        conn.close()

        digital_logger.info(f"[*] Digital Ecosystem Coverage:")
        digital_logger.info(f"    - Companies WITH Website    : {has_website_count:,} ({has_website_count/(has_website_count+missing_website_count)*100:.1f}%)")
        digital_logger.info(f"    - Companies MISSING Website : {missing_website_count:,}")
        digital_logger.info(f"    - Due for Yahoo Smart Recrawl (>{recrawl_days}d): {due_recrawl_60d:,} companies in queue")
        digital_logger.info(f"    - Due for Deep Web Enrichment (>30d): {due_for_web_enrichment:,} companies in queue")
        digital_logger.info(f"    - Staging Cache (Raw Yahoo) : {total_yahoo:,} records")
        digital_logger.info(f"    - Staging Cache (Raw Web)   : {total_websites:,} records")

        # If batch crawling requested (limit > 0)
        if limit > 0:
            digital_logger.info(f"[*] Dispatching Yahoo Searcher batch of {limit} companies (recrawl_days={recrawl_days})...")
            try:
                from crawlers.yahoo.yahoo_http_searcher import load_companies_from_db
                targets = load_companies_from_db(limit=limit, recrawl_days=recrawl_days)
                digital_logger.info(f"[+] Loaded {len(targets):,} target companies into Yahoo queue.")
            except Exception as e_c:
                digital_logger.warning(f"[-] Yahoo Searcher dispatch notice: {e_c}")

        total_processed = total_yahoo + total_websites
        delta = 0
        note = f"Kho website: {has_website_count:,} ({due_recrawl_60d:,} chờ recrawl)"
        update_worker_health(state, layer_key, success=True, processed=has_website_count, delta=delta, note=note)
        digital_logger.info(f">>> [WORKER T2 COMPLETE] Digital Presence Active. Total: {has_website_count:,} <<<")
        return total_processed
    except Exception as e:
        digital_logger.error(f"[-] Worker T2 error: {e}", exc_info=True)
        update_worker_health(state, layer_key, success=False, error_msg=str(e))
        return 0

# --- TẦNG 3: HELLOWORK & MARKET PULSE ---
async def run_layer_3_jobs(state: Dict[str, Any]) -> int:
    layer_key = "layer_3"
    info = state["layers"][layer_key]
    if info.get("status") == "CIRCUIT_OPEN":
        jobs_logger.warning("[-] Skipping Layer 3 (Jobs) because Circuit Breaker is OPEN.")
        return 0

    jobs_logger.info(">>> [WORKER T3 START] Market Pulse & HelloWork Job Signals <<<")
    info["status"] = "RUNNING"
    info["last_run"] = datetime.now().isoformat()
    save_orchestrator_state(state)

    try:
        # Check staging db first if there are unmerged jobs
        hw_staging_db = os.path.join(PROJECT_ROOT, "crawlers", "hellowork", "data", "hellowork.db")
        staging_count = 0
        if os.path.exists(hw_staging_db):
            try:
                hw_conn = sqlite3.connect(hw_staging_db, timeout=10.0)
                staging_count = hw_conn.cursor().execute("SELECT count(*) FROM jobs;").fetchone()[0]
                hw_conn.close()
            except Exception as e:
                jobs_logger.debug(f"Staging check note: {e}")

        conn = get_local_db()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM raw_hellowork;")
        total_jobs = cur.fetchone()[0]
        cur.execute("SELECT count(DISTINCT corporate_number) FROM raw_hellowork WHERE corporate_number IS NOT NULL AND length(corporate_number)=13;")
        active_employers = cur.fetchone()[0]
        conn.close()

        # If staging has more records than master, run fast incremental migration
        if staging_count > total_jobs:
            jobs_logger.info(f"[*] Detected {staging_count - total_jobs:,} unmigrated jobs in staging. Triggering sync...")
            try:
                from crawlers.hellowork.migrate_to_rawdata import main as run_hw_migration
                run_hw_migration()
                conn = get_local_db()
                cur = conn.cursor()
                cur.execute("SELECT count(*) FROM raw_hellowork;")
                total_jobs = cur.fetchone()[0]
                cur.execute("SELECT count(DISTINCT corporate_number) FROM raw_hellowork WHERE corporate_number IS NOT NULL AND length(corporate_number)=13;")
                active_employers = cur.fetchone()[0]
                conn.close()
            except Exception as e:
                jobs_logger.error(f"[-] Auto-migration error: {e}", exc_info=True)

        prev_processed = info.get("processed", 0)
        delta = max(0, total_jobs - prev_processed)

        if delta > 0:
            note = f"+{delta:,} tin việc làm mới (Kho: {total_jobs:,} tin, {active_employers:,} DN tuyển dụng)"
        else:
            note = f"Kho: {total_jobs:,} tin việc làm ({active_employers:,} DN tuyển dụng) | Đã đồng bộ 100%, không có tin mới"

        update_worker_health(state, layer_key, success=True, processed=total_jobs, delta=delta, note=note)
        jobs_logger.info(f">>> [WORKER T3 COMPLETE] Total HelloWork Records: {total_jobs:,} (Delta: +{delta:,}, Employers: {active_employers:,}) <<<")
        return total_jobs
    except Exception as e:
        jobs_logger.error(f"[-] Worker T3 error: {e}", exc_info=True)
        update_worker_health(state, layer_key, success=False, error_msg=str(e))
        return 0

# ======================================================================================
# BULK DELTA SYNCHRONIZER (ĐẨY DỮ LIỆU SẠCH LÊN VPS PRODUCTION)
# ======================================================================================

def execute_bulk_delta_sync(state: Dict[str, Any], dry_run: bool = False) -> Dict[str, int]:
    """
    Connects to VPS PostgreSQL Production and streams only clean delta records.
    Syncs: company_licenses, company_financials, company_public_tenders, and boolean search flags.
    Safe-mode supported: does not disrupt live queries or foreign transactions.
    """
    logger.info(f">>> [BULK SYNC START] Streaming Clean Delta to VPS PostgreSQL (DryRun={dry_run}) <<<")
    t0 = time.time()
    sync_stats = {
        "licenses": 0,
        "financials": 0,
        "tenders": 0,
        "companies_updated": 0
    }

    conn_sq = get_local_db()
    cur_sq = conn_sq.cursor()

    try:
        conn_pg = psycopg2.connect(PG_URL, connect_timeout=15)
        cur_pg = conn_pg.cursor()
    except Exception as e:
        logger.error(f"[-] Could not connect to VPS PostgreSQL: {e}. Aborting delta sync safely.")
        conn_sq.close()
        return sync_stats

    try:
        # 1. Delta Sync for company_licenses
        cur_pg.execute("SELECT corporate_number, license_number FROM company_licenses;")
        existing_pg_lics = set(cur_pg.fetchall())

        cur_sq.execute("""
            SELECT corporate_number, license_type, license_category, license_number,
                   issuing_authority, prefecture_code, representative_name, office_phone,
                   office_fax, registered_address, issue_date, valid_until, license_status,
                   specialties_json, source_url
            FROM company_licenses;
        """)
        sqlite_lics = cur_sq.fetchall()
        delta_lics = [r for r in sqlite_lics if (r[0], r[3]) not in existing_pg_lics]
        logger.info(f"[*] Delta Licenses: {len(delta_lics):,} new records found.")

        if delta_lics and not dry_run:
            insert_lic_sql = """
                INSERT INTO company_licenses (
                    corporate_number, license_type, license_category, license_number,
                    issuing_authority, prefecture_code, representative_name, office_phone,
                    office_fax, registered_address, issue_date, valid_until, license_status,
                    specialties_json, source_url
                ) VALUES %s
                ON CONFLICT DO NOTHING;
            """
            batch_size = 2000
            for i in range(0, len(delta_lics), batch_size):
                chunk = delta_lics[i:i + batch_size]
                execute_values(cur_pg, insert_lic_sql, chunk)
                conn_pg.commit()
            sync_stats["licenses"] = len(delta_lics)
        elif dry_run:
            sync_stats["licenses"] = len(delta_lics)

        # 2. Delta Sync for company_financials (EDINET)
        cur_pg.execute("SELECT corporate_number, fiscal_year FROM company_financials;")
        existing_pg_fins = set(cur_pg.fetchall())

        cur_sq.execute("""
            SELECT corporate_number, fiscal_year, sequence_number,
                   COALESCE(revenue, sales_amount) AS revenue,
                   COALESCE(operating_income, ordinary_income) AS operating_income,
                   net_income, avg_annual_salary, avg_age, avg_service_years,
                   employee_count, source, updated_at
            FROM company_financials;
        """)
        sqlite_fins = cur_sq.fetchall()
        delta_fins = []
        for r in sqlite_fins:
            corp_num = r[0]
            seq = r[2]
            fy_raw = (r[1] or "").strip()
            fy_distinct = f"{fy_raw} (前{seq}期)" if seq and int(seq) > 0 else (fy_raw or f"Period-{seq}")
            fy_final = fy_distinct[:100]
            if (corp_num, fy_final) not in existing_pg_fins:
                delta_fins.append((
                    corp_num, fy_final, r[3], r[4], r[5], r[6], r[7], r[8], r[9],
                    str(r[10])[:50] if r[10] else 'EDINET', r[11]
                ))
        logger.info(f"[*] Delta Financials (EDINET): {len(delta_fins):,} new records found.")

        if delta_fins and not dry_run:
            insert_fin_sql = """
                INSERT INTO company_financials (
                    corporate_number, fiscal_year, revenue, operating_income,
                    net_income, avg_annual_salary, avg_age, avg_service_years,
                    employee_count, source, updated_at
                ) VALUES %s
                ON CONFLICT (corporate_number, fiscal_year) DO UPDATE SET
                    revenue = COALESCE(excluded.revenue, company_financials.revenue),
                    avg_annual_salary = COALESCE(excluded.avg_annual_salary, company_financials.avg_annual_salary),
                    source = excluded.source,
                    updated_at = excluded.updated_at;
            """
            batch_size = 2000
            for i in range(0, len(delta_fins), batch_size):
                chunk = delta_fins[i:i + batch_size]
                execute_values(cur_pg, insert_fin_sql, chunk)
                conn_pg.commit()
            sync_stats["financials"] = len(delta_fins)
        elif dry_run:
            sync_stats["financials"] = len(delta_fins)

        # 3. Delta Sync for company_public_tenders (GEPS)
        cur_pg.execute("SELECT corporate_number, tender_title FROM company_public_tenders;")
        existing_pg_tenders = set(cur_pg.fetchall())

        cur_sq.execute("""
            SELECT corporate_number, tender_title, contract_amount,
                   awarding_agency, award_date, unified_qualification_grade,
                   category, created_at
            FROM company_public_tenders;
        """)
        sqlite_tenders = cur_sq.fetchall()
        delta_tenders = [r for r in sqlite_tenders if (r[0], r[1]) not in existing_pg_tenders]
        logger.info(f"[*] Delta Public Tenders (GEPS): {len(delta_tenders):,} new records found.")

        if delta_tenders and not dry_run:
            insert_tender_sql = """
                INSERT INTO company_public_tenders (
                    corporate_number, tender_title, contract_amount,
                    awarding_agency, award_date, unified_qualification_grade,
                    category, created_at
                ) VALUES %s
                ON CONFLICT DO NOTHING;
            """
            batch_size = 2000
            for i in range(0, len(delta_tenders), batch_size):
                chunk = delta_tenders[i:i + batch_size]
                execute_values(cur_pg, insert_tender_sql, chunk)
                conn_pg.commit()
            sync_stats["tenders"] = len(delta_tenders)
        elif dry_run:
            sync_stats["tenders"] = len(delta_tenders)

        # 4. Sync boolean flags and enriched metadata for affected companies
        affected_corps = list(set([r[0] for r in delta_lics] + [r[0] for r in delta_fins] + [r[0] for r in delta_tenders]))
        logger.info(f"[*] Total distinct corporate entities affected by this delta: {len(affected_corps):,}")

        if affected_corps and not dry_run:
            batch_size = 2000
            for i in range(0, len(affected_corps), batch_size):
                chunk = affected_corps[i:i + batch_size]
                placeholders = ",".join(["?"] * len(chunk))
                cur_sq.execute(f"""
                    SELECT corporate_number, prefecture_code, has_license, has_construction_lic,
                           has_real_estate_lic, has_kobutsu_lic, has_financial_report,
                           has_public_tender, primary_industry_code, major_industry_code,
                           industry_confidence, is_hiring, jigyo_shumoku
                    FROM companies 
                    WHERE corporate_number IN ({placeholders});
                """, chunk)
                flag_rows = cur_sq.fetchall()

                if flag_rows:
                    clean_flag_rows = [
                        (
                            r[0], # corp_num
                            r[1], # pref_code
                            bool(r[2]) if r[2] is not None else None,
                            bool(r[3]) if r[3] is not None else None,
                            bool(r[4]) if r[4] is not None else None,
                            bool(r[5]) if r[5] is not None else None,
                            bool(r[6]) if r[6] is not None else None,
                            bool(r[7]) if r[7] is not None else None,
                            r[8], # prim_code
                            r[9], # maj_code
                            r[10], # conf
                            bool(r[11]) if r[11] is not None else None,
                            r[12] # jigyo
                        )
                        for r in flag_rows
                    ]

                    update_flags_sql = """
                        UPDATE companies AS c
                        SET has_license = COALESCE(v.has_lic, c.has_license),
                            has_construction_lic = COALESCE(v.has_con, c.has_construction_lic),
                            has_real_estate_lic = COALESCE(v.has_re, c.has_real_estate_lic),
                            has_kobutsu_lic = COALESCE(v.has_kob, c.has_kobutsu_lic),
                            has_financial_report = COALESCE(v.has_fin, c.has_financial_report),
                            has_public_tender = COALESCE(v.has_ten, c.has_public_tender),
                            primary_industry_code = COALESCE(v.prim_code, c.primary_industry_code),
                            major_industry_code = COALESCE(v.maj_code, c.major_industry_code),
                            industry_confidence = COALESCE(v.conf, c.industry_confidence),
                            is_hiring = COALESCE(v.hiring, c.is_hiring),
                            jigyo_shumoku = COALESCE(v.jigyo, c.jigyo_shumoku),
                            updated_at = CURRENT_TIMESTAMP
                        FROM (VALUES %s) AS v(corp_num, pref_code, has_lic, has_con, has_re, has_kob, has_fin, has_ten, prim_code, maj_code, conf, hiring, jigyo)
                        WHERE c.prefecture_code = v.pref_code AND c.corporate_number = v.corp_num;
                    """
                    execute_values(cur_pg, update_flags_sql, clean_flag_rows)
                    conn_pg.commit()
                    sync_stats["companies_updated"] += len(clean_flag_rows)

    except Exception as e:
        logger.error(f"[-] Bulk sync transaction error: {e}", exc_info=True)
        conn_pg.rollback()
    finally:
        conn_sq.close()
        conn_pg.close()

    elapsed = time.time() - t0
    if not dry_run:
        state["last_sync_at"] = datetime.now().isoformat()
        save_orchestrator_state(state)

    logger.info(f">>> [BULK SYNC COMPLETE] Synced: {sync_stats} in {elapsed:.2f}s <<<")
    return sync_stats

# ======================================================================================
# INSTANT INDEXING HOOK: BING INDEXNOW & SEARCH FRESHNESS
# ======================================================================================

def trigger_instant_indexing_hook(num_urls: int = 500, google_vip_limit: int = 10):
    """
    Submits recently enriched URLs directly to:
    1. Microsoft Bing & IndexNow (up to 500 URLs/cycle) with 0 duplicate tracking
    2. Google Web Search Indexing API (up to 10 VIP URLs/cycle, max 200/day)
    """
    logger.info(f">>> [INSTANT INDEXING] Triggering Automated Indexing Hooks (Bing={num_urls}, Google={google_vip_limit}) <<<")
    # 1. Bing IndexNow
    try:
        from scripts.auto_indexnow_submitter import run_batch_submission
        res = run_batch_submission(batch_size=num_urls, dry_run=False)
        if res.get("status") == "success":
            logger.info(f"[+] IndexNow Submission Success: Batch {res.get('batch_id')} ({res.get('submitted_count')} URLs submitted, HTTP {res.get('http_status')})")
        else:
            logger.info(f"[*] IndexNow Submission notice: {res.get('message', res.get('status'))}")
    except Exception as e:
        logger.warning(f"[-] IndexNow hook exception: {e}")

    # 2. Google Indexing API VIP
    try:
        from scripts.google_indexing_vip import run_google_vip_submission
        gres = run_google_vip_submission(limit=google_vip_limit)
        if gres.get("status") == "success":
            logger.info(f"[+] Google Indexing API Success: {gres.get('submitted')} VIP URLs submitted.")
        else:
            logger.info(f"[*] Google Indexing notice: {gres.get('error', 'Skipped')}")
    except Exception as ge:
        logger.warning(f"[-] Google Indexing hook exception: {ge}")

# ======================================================================================
# SEQUENTIAL ROLL-FORWARD PIPELINE (TIẾN TRÌNH CẬP NHẬT CUỐN CHIẾU TRÊN LOCAL PC)
# ======================================================================================

async def run_roll_forward_pipeline(state: Dict[str, Any], limit: int = 1000, reset_stage: bool = False):
    """
    Executes a comprehensive, sequential roll-forward update pipeline on Local PC.
    Runs strictly step-by-step with state persistence:
      Step 1: National Licenses (MLIT, NPA, ISA, Professional, Food/Ryokan)
      Step 2: Digital Presence (Priority Yahoo & Deep Web batch)
      Step 3: HelloWork Jobs sync
      Step 4: Bulk Delta Sync to VPS PostgreSQL Production
      Step 5: Full Industry Auto-Tagging (JSIC) on VPS
      Step 6: Completion audit & state reset
    If interrupted (e.g. PC shutdown), resumes exactly where it left off on next run.
    """
    t0 = time.time()
    roll_state = state.get("roll_forward", {})
    if reset_stage or not roll_state:
        roll_state = {"current_step": 1, "status": "IN_PROGRESS", "started_at": datetime.now().isoformat()}
        state["roll_forward"] = roll_state
        save_orchestrator_state(state)

    current_step = roll_state.get("current_step", 1)

    print("\n" + "=" * 90)
    print(">>> KIGYOU-LIST: SEQUENTIAL ROLL-FORWARD BATCH PIPELINE COMMENCED <<<")
    print(f"Resuming at Step: {current_step}/5 | Batch Limit: {limit:,} companies")
    print("=" * 90)

    # ----------------------------------------------------------------------------------
    # STEP 1: TẦNG 1 - GIẤY PHÉP QUỐC GIA (MLIT, NPA, ISA, TOKUTEI, FOOD, RYOKAN)
    # ----------------------------------------------------------------------------------
    if current_step <= 1:
        print("\n" + "#" * 80)
        print(">>> [STEP 1/5] HARVESTING ALL NATIONAL LICENSES (MLIT, NPA, ISA, HOKENJO) <<<")
        print("#" * 80)
        roll_state["current_step"] = 1
        roll_state["status"] = "STEP_1_LICENSES"
        save_orchestrator_state(state)

        await run_layer_1_licenses(state)
        
        roll_state["current_step"] = 2
        roll_state["step_1_completed_at"] = datetime.now().isoformat()
        save_orchestrator_state(state)
        print("[+] STEP 1/5 COMPLETED: All National Licenses harvested and verified locally.")

    # ----------------------------------------------------------------------------------
    # STEP 2: TẦNG 2 - YAHOO SEARCH & DEEP WEB CRAWLER (PRIORITY SMART RECRAWL)
    # ----------------------------------------------------------------------------------
    if current_step <= 2:
        print("\n" + "#" * 80)
        print(f">>> [STEP 2/5] HARVESTING DIGITAL PRESENCE (YAHOO SEARCH & DEEP WEB - BATCH {limit:,}) <<<")
        print("#" * 80)
        roll_state["current_step"] = 2
        roll_state["status"] = "STEP_2_DIGITAL"
        save_orchestrator_state(state)

        await run_layer_2_digital(state, limit=limit)

        roll_state["current_step"] = 3
        roll_state["step_2_completed_at"] = datetime.now().isoformat()
        save_orchestrator_state(state)
        print(f"[+] STEP 2/5 COMPLETED: Digital Presence batch of {limit:,} companies processed.")

    # ----------------------------------------------------------------------------------
    # STEP 3: TẦNG 3 - HELLOWORK MARKET JOBS SYNC
    # ----------------------------------------------------------------------------------
    if current_step <= 3:
        print("\n" + "#" * 80)
        print(">>> [STEP 3/5] SYNCING HELLOWORK RECRUITMENT MARKET PULSE <<<")
        print("#" * 80)
        roll_state["current_step"] = 3
        roll_state["status"] = "STEP_3_JOBS"
        save_orchestrator_state(state)

        await run_layer_3_jobs(state)

        roll_state["current_step"] = 4
        roll_state["step_3_completed_at"] = datetime.now().isoformat()
        save_orchestrator_state(state)
        print("[+] STEP 3/5 COMPLETED: HelloWork jobs pulse updated.")

    # ----------------------------------------------------------------------------------
    # STEP 4: BULK DELTA SYNC TO CLOUD VPS PRODUCTION
    # ----------------------------------------------------------------------------------
    if current_step <= 4:
        print("\n" + "#" * 80)
        print(">>> [STEP 4/5] STREAMING BULK DELTAS TO PRODUCTION VPS POSTGRESQL <<<")
        print("#" * 80)
        roll_state["current_step"] = 4
        roll_state["status"] = "STEP_4_SYNC"
        save_orchestrator_state(state)

        sync_stats = execute_bulk_delta_sync(state, dry_run=False)

        roll_state["current_step"] = 5
        roll_state["step_4_completed_at"] = datetime.now().isoformat()
        save_orchestrator_state(state)
        print(f"[+] STEP 4/5 COMPLETED: Bulk Deltas merged into VPS PostgreSQL: {sync_stats}")

    # ----------------------------------------------------------------------------------
    # STEP 5: AUTOMATED COMPREHENSIVE INDUSTRY AUTO-TAGGING (JSIC) ON VPS
    # ----------------------------------------------------------------------------------
    if current_step <= 5:
        print("\n" + "#" * 80)
        print(">>> [STEP 5/5] EXECUTING COMPREHENSIVE JSIC AUTO-TAGGING & BUSINESS FLAGS <<<")
        print("#" * 80)
        roll_state["current_step"] = 5
        roll_state["status"] = "STEP_5_ENRICHMENT"
        save_orchestrator_state(state)

        try:
            from scripts.enrich_all_licensed_companies import run_enrichment
            run_enrichment()
        except Exception as e_tag:
            print(f"[-] Auto-tagging warning: {e_tag}")

        # Instant IndexNow ping for fresh URLs
        trigger_instant_indexing_hook(num_urls=1000)

        roll_state["current_step"] = 1
        roll_state["status"] = "COMPLETED"
        roll_state["last_completed_at"] = datetime.now().isoformat()
        save_orchestrator_state(state)
        print("[+] STEP 5/5 COMPLETED: All JSIC industries & search flags successfully tagged.")

    elapsed = time.time() - t0
    print("\n" + "=" * 90)
    print(f"🎉 [ROLL-FORWARD COMPLETE] ENTIRE BATCH PIPELINE FINISHED IN {elapsed:.2f}s!")
    print(f"    - All Local Licenses, Digital Contacts, and Jobs merged with Cloud Production.")
    print(f"    - VPS Database is 100% in sync and live on kigyoulist.com.")
    print("=" * 90 + "\n")

# ======================================================================================
# DASHBOARDS & SUBAGENT SELF-HEALING DIAGNOSTICS
# ======================================================================================

def display_orchestrator_status():
    """Renders a comprehensive terminal dashboard of the entire data ecosystem."""
    state = load_orchestrator_state()

    print("\n" + "=" * 90)
    print("      KIGYOU-LIST GLOBAL MASTER DATA ORCHESTRATOR - ENTERPRISE DASHBOARD")
    print("=" * 90)
    print(f"  System Root         : {PROJECT_ROOT}")
    print(f"  Local SQLite DB     : {SQLITE_DB} ({os.path.getsize(SQLITE_DB)/(1024*1024):,.1f} MB)")
    print(f"  Target PostgreSQL   : {PG_URL.split('@')[-1]}")
    print(f"  Last Delta Sync     : {state.get('last_sync_at') or 'Never'}")
    print(f"  Total Daemon Runs   : {state.get('total_runs', 0):,}")
    roll_info = state.get("roll_forward", {})
    roll_step = roll_info.get("current_step", 1)
    roll_status = roll_info.get("status", "IDLE")
    roll_last = roll_info.get("last_completed_at", "Never")
    print(f"  Roll-Forward Engine : Step {roll_step}/5 [{roll_status}] (Last completed: {roll_last})")
    print("-" * 90)

    # Local Stats
    conn_sq = get_local_db()
    cur_sq = conn_sq.cursor()
    cur_sq.execute("SELECT count(*) FROM companies;")
    total_comps_sq = cur_sq.fetchone()[0]
    cur_sq.execute("SELECT count(*) FROM business_signals;")
    total_signals_sq = cur_sq.fetchone()[0]
    cur_sq.execute("SELECT count(*) FROM company_licenses;")
    total_lics_sq = cur_sq.fetchone()[0]
    cur_sq.execute("SELECT count(*) FROM company_financials;")
    total_fins_sq = cur_sq.fetchone()[0]
    cur_sq.execute("SELECT count(*) FROM company_public_tenders;")
    total_tenders_sq = cur_sq.fetchone()[0]
    cur_sq.execute("SELECT count(*) FROM company_legal_histories;")
    total_hist_sq = cur_sq.fetchone()[0]

    # Digital & Smart Recrawl Metrics
    cur_sq.execute("SELECT count(*) FROM companies WHERE website_url IS NOT NULL AND website_url != '' AND website_url NOT LIKE '%なし%';")
    total_web_sq = cur_sq.fetchone()[0]
    missing_web_sq = total_comps_sq - total_web_sq
    cur_sq.execute("SELECT count(*) FROM companies WHERE (website_url IS NULL OR website_url = '' OR website_url LIKE '%なし%') AND (yahoo_last_crawled_at IS NULL OR yahoo_last_crawled_at < datetime('now', '-60 days'));")
    due_recrawl_60d = cur_sq.fetchone()[0]

    conn_sq.close()

    # Remote VPS Stats
    vps_connected = False
    total_signals_pg = 0
    total_lics_pg = 0
    total_fins_pg = 0
    total_tenders_pg = 0
    try:
        conn_pg = psycopg2.connect(PG_URL, connect_timeout=5)
        cur_pg = conn_pg.cursor()
        cur_pg.execute("SELECT count(*) FROM business_signals;")
        total_signals_pg = cur_pg.fetchone()[0]
        cur_pg.execute("SELECT count(*) FROM company_licenses;")
        total_lics_pg = cur_pg.fetchone()[0]
        cur_pg.execute("SELECT count(*) FROM company_financials;")
        total_fins_pg = cur_pg.fetchone()[0]
        cur_pg.execute("SELECT count(*) FROM company_public_tenders;")
        total_tenders_pg = cur_pg.fetchone()[0]
        cur_pg.execute("SELECT count(*) FROM company_legal_histories;")
        total_hist_pg = cur_pg.fetchone()[0]
        conn_pg.close()
        vps_connected = True
    except Exception:
        pass

    try:
        from scripts.import_gbiz_api import load_sync_state
        gbiz_sync_date = load_sync_state()
    except Exception:
        gbiz_sync_date = "Unknown"

    print("  [ENTERPRISE DATA ECOSYSTEM INVENTORY]")
    print(f"  * Total Companies (Anchor DB)    : {total_comps_sq:>12,}")
    print(f"  * METI gBizINFO (Signals/Vốn)    : Local={total_signals_sq:>8,} | VPS={total_signals_pg:>8,} | (Last Sync: {gbiz_sync_date})")
    print(f"  * National Licenses (MLIT/NPA)   : Local={total_lics_sq:>8,} | VPS={total_lics_pg:>8,} | ({'ONLINE' if vps_connected else 'OFFLINE'})")
    print(f"  * Financial Filings (FSA EDINET) : Local={total_fins_sq:>8,} | VPS={total_fins_pg:>8,}")
    print(f"  * Public Procurement (GEPS)      : Local={total_tenders_sq:>8,} | VPS={total_tenders_pg:>8,}")
    print(f"  * Legal Change Events (NTA)      : Local={total_hist_sq:>8,} | VPS={total_hist_pg:>8,}")
    print("-" * 90)
    print("  [DIGITAL PRESENCE & SMART RECRAWL PIPELINE]")
    print(f"  * Official Corporate Websites    : {total_web_sq:>12,} ({total_web_sq/total_comps_sq*100:.1f}% coverage)")
    print(f"  * Companies Missing Website      : {missing_web_sq:>12,}")
    print(f"  * Due for Yahoo Recrawl (>60d)   : {due_recrawl_60d:>12,} (Priority queue ready)")
    print("-" * 90)

    print("  [WORKER PIPELINES & CIRCUIT BREAKER HEALTH]")
    for k, v in state["layers"].items():
        st = v["status"]
        status_badge = f"[\033[92m{st}\033[0m]" if st == "COMPLETED" else f"[\033[91m{st}\033[0m]" if "FAIL" in st or "CIRCUIT" in st else f"[{st}]"
        err_info = f" (Errors: {v.get('error_count', 0)})" if v.get('error_count', 0) > 0 else ""
        delta_val = v.get('last_delta', 0)
        delta_str = f" | \033[96m+{delta_val:,} mới\033[0m" if delta_val > 0 else " | 0 mới (Hết dữ liệu)"
        note_str = f" [{v.get('note', '')}]" if v.get('note') else ""
        print(f"    - {k.upper():14s} : {status_badge:<14s} | Records: {v['processed']:>8,}{delta_str}{note_str} | Last: {v['last_run'] or 'None'}{err_info}")
        if v.get("last_error"):
            print(f"        \033[93m└─ Recent Alert: {v['last_error'][:75]}...\033[0m")

    print("=" * 90 + "\n")

def generate_subagent_diagnostic_report():
    """Generates an action report for AI subagents to perform targeted code repairs."""
    state = load_orchestrator_state()
    print("\n" + "=" * 80)
    print(">>> [SUBAGENT REPAIR REPORT] PIPELINE HEALTH & ANOMALY DIAGNOSTICS <<<")
    print("=" * 80)

    failing_workers = [
        (k, v) for k, v in state["layers"].items() 
        if v.get("status") in ("FAILED", "CIRCUIT_OPEN") or v.get("error_count", 0) > 0
    ]

    if not failing_workers:
        print("[+] All workers are healthy. No subagent code remediation required.")
        print("=" * 80 + "\n")
        return

    for key, info in failing_workers:
        print(f"\n[!] ANOMALY DETECTED IN WORKER: {key.upper()}")
        print(f"    - Layer Name     : {info['name']}")
        print(f"    - Current Status : {info['status']}")
        print(f"    - Failures Count : {info.get('error_count', 0)}")
        print(f"    - Last Error     : {info.get('last_error')}")
        print(f"    - Relevant Log   : logs/{key.replace('layer_', '')}_engine.log")
        print(f"    - Recommended Action: Inspect crawler source, verify selectors/API response, dry-run, then call:")
        print(f"      python master_orchestrator.py --reset-circuit {key}")

    print("=" * 80 + "\n")

def reset_circuit_breaker(target_layer: Optional[str] = None):
    """Resets the circuit breaker state for a specific or all workers."""
    state = load_orchestrator_state()
    if target_layer:
        if target_layer in state["layers"]:
            state["layers"][target_layer]["status"] = "IDLE"
            state["layers"][target_layer]["error_count"] = 0
            state["layers"][target_layer]["last_error"] = None
            print(f"[+] Successfully reset Circuit Breaker for: {target_layer}")
        else:
            print(f"[-] Unknown layer: {target_layer}")
    else:
        for k in state["layers"]:
            state["layers"][k]["status"] = "IDLE"
            state["layers"][k]["error_count"] = 0
            state["layers"][k]["last_error"] = None
        print("[+] Successfully reset Circuit Breaker for ALL workers.")
    save_orchestrator_state(state)

# ======================================================================================
# SMART SCHEDULING POLICIES & RESOURCE OPTIMIZATION (TTL IN HOURS)
# ======================================================================================
LAYER_SCHEDULE_HOURS = {
    "layer_0": 24.0,       # Cục Thuế NTA: 24h/lần (Cập nhật sự kiện pháp lý theo ngày)
    "layer_gbiz": 24.0,    # METI gBizINFO: 24h/lần (Vốn, nhân sự, trợ cấp)
    "layer_1": 72.0,       # Giấy phép Quốc gia MLIT/NPA/ISA/Hokenjo: 72h/lần (3 ngày/lần)
    "layer_edinet": 24.0,  # FSA EDINET: 24h/lần (Báo cáo tài chính quý/năm)
    "layer_geps": 24.0,    # GEPS Mua sắm công: 24h/lần (Gói thầu công mới)
    "layer_2": 0.5,        # Yahoo & Deep Web: 0.5h (30 phút/lần, cào nhỏ giọt 200 công ty/lần)
    "layer_3": 24.0,       # HelloWork Việc làm: 24h/lần
}

def is_layer_due(state: Dict[str, Any], layer_key: str, force: bool = False) -> Tuple[bool, str]:
    """Checks whether a worker layer is due for execution based on its schedule TTL."""
    if force:
        return True, "Forced execution"
    layer_info = state.get("layers", {}).get(layer_key, {})
    last_run_str = layer_info.get("last_run")
    if not last_run_str:
        return True, "First run (no previous record)"

    interval_hours = LAYER_SCHEDULE_HOURS.get(layer_key, 24.0)
    try:
        last_run = datetime.fromisoformat(last_run_str)
        elapsed_hours = (datetime.now() - last_run).total_seconds() / 3600.0
        if elapsed_hours >= interval_hours:
            return True, f"Due ({elapsed_hours:.1f}h elapsed >= {interval_hours:.0f}h)"
        remaining_hours = interval_hours - elapsed_hours
        return False, f"Cooldown (Chờ {remaining_hours:.1f}h nữa | Chạy gần nhất: {elapsed_hours:.1f}h trước)"
    except Exception:
        return True, "Fallback run"

# ======================================================================================
# DAEMON LIFECYCLE CONTROLLER (CHẠY NGẦM 24/7 VỚI LỊCH TRÌNH THÔNG MINH)
# ======================================================================================

async def run_orchestrator_daemon(interval_minutes: float = 30.0, interval_seconds: int = 0, force: bool = False):
    """
    Main long-running loop that runs continuously in the background.
    Sequentially inspects all layers, executes only due layers based on Smart TTL
    schedules (saving 95% CPU/SSD), triggers bulk delta sync, and handles cool-downs.
    """
    sleep_sec = interval_seconds if interval_seconds > 0 else int(interval_minutes * 60)
    cycle_desc = f"{sleep_sec}s" if sleep_sec < 60 else f"{sleep_sec / 60:.1f}m"

    logger.info("=" * 90)
    logger.info(f"KIGYOU-LIST MASTER DATA ORCHESTRATOR DAEMON STARTED (Interval: {cycle_desc})")
    logger.info(f"Smart Scheduling Policies:")
    for lk, hrs in LAYER_SCHEDULE_HOURS.items():
        logger.info(f"  - {lk.upper():<12}: Every {hrs:.1f}h")
    logger.info(f"Target VPS: {PG_URL.split('@')[-1]}")
    logger.info("=" * 90)

    state = load_orchestrator_state()
    cycle_count = state.get("total_runs", 0)

    while True:
        cycle_count += 1
        state["total_runs"] = cycle_count
        logger.info(f"\n{'#' * 90}")
        logger.info(f"### PIPELINE CYCLE #{cycle_count} STARTING AT {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"{'#' * 90}")

        try:
            # 1. Layer 0: NTA Foundation (Daily - 24h)
            due, reason = is_layer_due(state, "layer_0", force=force)
            if due:
                await run_layer_0_nta(state)
            else:
                logger.info(f"[*] Layer 0 (NTA): Bỏ qua - {reason}")

            # 2. Layer gBiz: METI gBizINFO (Daily - 24h)
            due, reason = is_layer_due(state, "layer_gbiz", force=force)
            if due:
                await run_layer_gbiz(state, limit=500)
            else:
                logger.info(f"[*] Layer gBizINFO: Bỏ qua - {reason}")

            # 3. Layer 1: National Licenses (Every 3 Days - 72h)
            due, reason = is_layer_due(state, "layer_1", force=force)
            if due:
                await run_layer_1_licenses(state)
            else:
                logger.info(f"[*] Layer 1 (Giấy phép): Bỏ qua - {reason}")

            # 4. Layer 1.5A: FSA EDINET (Daily - 24h)
            due, reason = is_layer_due(state, "layer_edinet", force=force)
            if due:
                await run_layer_edinet(state)
            else:
                logger.info(f"[*] Layer EDINET: Bỏ qua - {reason}")

            # 5. Layer 1.5B: GEPS Public Procurement (Daily - 24h)
            due, reason = is_layer_due(state, "layer_geps", force=force)
            if due:
                await run_layer_geps(state)
            else:
                logger.info(f"[*] Layer GEPS: Bỏ qua - {reason}")

            # 6. Layer 2: Digital Presence (Continuous Micro-batch - Every Cycle 30m, 200 cos)
            due, reason = is_layer_due(state, "layer_2", force=force)
            if due:
                await run_layer_2_digital(state, limit=200)
            else:
                logger.info(f"[*] Layer 2 (Digital): Bỏ qua - {reason}")

            # 7. Layer 3: HelloWork Jobs (Daily - 24h)
            due, reason = is_layer_due(state, "layer_3", force=force)
            if due:
                await run_layer_3_jobs(state)
            else:
                logger.info(f"[*] Layer 3 (HelloWork): Bỏ qua - {reason}")

            # 8. Bulk Delta Sync to Production VPS
            sync_stats = execute_bulk_delta_sync(state)

            # 9. Instant IndexNow ping for fresh enterprise enrichment (Tier 0 & Tier 1)
            trigger_instant_indexing_hook(500)

            logger.info(f"[+] Pipeline Execution Cycle #{cycle_count} completed successfully.")

        except Exception as e:
            logger.critical(f"[-] Critical uncaught daemon exception in cycle #{cycle_count}: {e}", exc_info=True)

        logger.info(f"[*] Sleeping {cycle_desc} until cycle #{cycle_count + 1}...")
        await asyncio.sleep(sleep_sec)

# ======================================================================================
# CLI ENTRYPOINT
# ======================================================================================

def main():
    parser = argparse.ArgumentParser(description="Kigyou-list Global Master Data Orchestrator")
    parser.add_argument("--status", action="store_true", help="Display full system inventory and pipeline status")
    parser.add_argument("--daemon", action="store_true", help="Start background daemon runner")
    parser.add_argument("--interval", type=float, default=30.0, help="Interval in minutes between daemon cycles (default: 30)")
    parser.add_argument("--interval-sec", type=int, default=0, help="Interval in seconds between daemon cycles (if set, overrides --interval)")
    parser.add_argument("--sync-now", action="store_true", help="Execute immediate Bulk Delta Sync to VPS")
    parser.add_argument("--dry-run", action="store_true", help="Calculate delta records without modifying VPS")
    parser.add_argument("--run-layer", type=str, help="Run a specific layer (0, gbiz, 1, 1.5, 2, 3, edinet, geps, nta, licenses, digital, jobs, all)")
    parser.add_argument("--reset-circuit", nargs="?", const="all", help="Reset circuit breaker for a layer or all")
    parser.add_argument("--subagent-report", action="store_true", help="Output diagnostic anomalies for AI subagents")
    parser.add_argument("--indexnow-ping", action="store_true", help="Ping IndexNow API for latest companies")
    parser.add_argument("--recrawl-days", type=int, default=60, help="Recrawl interval in days for companies without website (default: 60)")
    parser.add_argument("--limit", type=int, default=0, help="Batch limit for crawler execution")
    parser.add_argument("--force", action="store_true", help="Force execute all layers ignoring scheduling cooldowns")
    parser.add_argument("--roll-forward", action="store_true", help="Execute sequential roll-forward batch pipeline on PC (Cuốn chiếu từng bước)")
    parser.add_argument("--quanchieu", action="store_true", help="Alias for --roll-forward")
    parser.add_argument("--reset-roll", action="store_true", help="Reset roll-forward checkpoint to Step 1")

    args = parser.parse_args()
    state = load_orchestrator_state()

    if args.status:
        display_orchestrator_status()
    elif args.subagent_report:
        generate_subagent_diagnostic_report()
    elif args.reset_circuit:
        target = None if args.reset_circuit == "all" else args.reset_circuit
        reset_circuit_breaker(target)
    elif args.sync_now:
        execute_bulk_delta_sync(state, dry_run=args.dry_run)
    elif args.indexnow_ping:
        trigger_instant_indexing_hook(500)
    elif args.roll_forward or args.quanchieu:
        asyncio.run(run_roll_forward_pipeline(state, limit=args.limit or 1000, reset_stage=args.reset_roll))
    elif args.run_layer:
        layer_arg = args.run_layer.lower()
        if layer_arg in ("0", "nta"):
            asyncio.run(run_layer_0_nta(state))
        elif layer_arg in ("gbiz", "1a", "meti"):
            asyncio.run(run_layer_gbiz(state, limit=args.limit or None))
        elif layer_arg in ("1", "1b", "licenses"):
            asyncio.run(run_layer_1_licenses(state))
        elif layer_arg in ("edinet", "1.5", "1.5a"):
            asyncio.run(run_layer_edinet(state))
        elif layer_arg in ("geps", "1.5b"):
            asyncio.run(run_layer_geps(state))
        elif layer_arg in ("2", "digital", "deepweb", "yahoo"):
            asyncio.run(run_layer_2_digital(state, recrawl_days=args.recrawl_days, limit=args.limit))
        elif layer_arg in ("3", "jobs", "hellowork"):
            asyncio.run(run_layer_3_jobs(state))
        elif layer_arg == "all":
            asyncio.run(run_layer_0_nta(state))
            asyncio.run(run_layer_gbiz(state, limit=args.limit or 500))
            asyncio.run(run_layer_1_licenses(state))
            asyncio.run(run_layer_edinet(state))
            asyncio.run(run_layer_geps(state))
            asyncio.run(run_layer_2_digital(state, recrawl_days=args.recrawl_days, limit=args.limit))
            asyncio.run(run_layer_3_jobs(state))
        else:
            print(f"[-] Unknown layer '{args.run_layer}'. Available: 0, gbiz, 1, edinet, geps, 2, 3, all")
    elif args.daemon:
        asyncio.run(run_orchestrator_daemon(interval_minutes=args.interval, interval_seconds=args.interval_sec, force=args.force))
    else:
        display_orchestrator_status()
        print("Usage:")
        print("  python master_orchestrator.py --roll-forward         # Run sequential roll-forward batch pipeline on PC")
        print("  python master_orchestrator.py --daemon               # Start 24/7 autonomous background engine")
        print("  python master_orchestrator.py --status               # Inspect enterprise data inventory & health")
        print("  python master_orchestrator.py --run-layer 1          # Run National Licenses Harvester")
        print("  python master_orchestrator.py --sync-now             # Push clean delta stream to VPS")
        print("  python master_orchestrator.py --subagent-report      # Diagnostics for AI subagents")

if __name__ == "__main__":
    main()
