#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
========================================================================================
KIGYOU-LIST: DEDICATED NTA & T-NUMBER AUTONOMOUS AGENT (国税庁 法人番号・インボイス専任エージェント)
========================================================================================
Dedicated worker engine focusing 100% on National Tax Agency (NTA) & Invoice T-Numbers:
  1. T-Number (適格請求書): Synchronizes has_invoice = true for all 4.38M+ active entities
     across 47 PostgreSQL partitions and SQLite master.
  2. Legal Change Timeline (主な変更履歴): Mirrors & verifies 6.94M+ statutory events
     between VPS PostgreSQL and local SQLite.
  3. Incremental NTA Harvester: Continuously polls legal entity changes & designation updates.
========================================================================================
"""

import os
import sys
import time
import json
import sqlite3
import logging
import argparse
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SQLITE_DB = os.path.join(PROJECT_ROOT, "kigyou-list.db")
PG_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")
LOG_DIR = os.path.join(PROJECT_ROOT, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# Logger setup
logger = logging.getLogger("NTA_Dedicated_Agent")
logger.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")

fh = logging.FileHandler(os.path.join(LOG_DIR, "nta_dedicated_agent.log"), encoding='utf-8')
fh.setFormatter(formatter)
logger.addHandler(fh)

ch = logging.StreamHandler(sys.stdout)
ch.setFormatter(formatter)
logger.addHandler(ch)

PREFECTURE_CODES = [f"{i:02d}" for i in range(1, 48)]

def get_sqlite_conn():
    conn = sqlite3.connect(SQLITE_DB, timeout=120.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=120000;")
    return conn

def get_pg_conn():
    return psycopg2.connect(PG_URL, connect_timeout=20)

# ======================================================================================
# TASK 1: FULL T-NUMBER INVOICE ACTIVATION (47 PARTITIONS)
# ======================================================================================

def sync_all_t_numbers_on_vps():
    """
    Activates has_invoice = true for all active corporations (status = '活動中')
    across all 47 PostgreSQL partitions in seconds.
    """
    logger.info("=" * 80)
    logger.info(">>> [STEP 1] SYNCHRONIZING T-NUMBER INVOICES ACROSS 47 PREFECTURES (VPS) <<<")
    logger.info("=" * 80)
    
    conn_pg = get_pg_conn()
    cur_pg = conn_pg.cursor()
    
    t0 = time.time()
    total_activated = 0
    
    for pref_code in PREFECTURE_CODES:
        part_name = f"companies_p{pref_code}"
        query = f"""
            UPDATE {part_name}
            SET has_invoice = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE status = '活動中'
              AND (has_invoice IS NULL OR has_invoice = false);
        """
        try:
            cur_pg.execute(query)
            conn_pg.commit()
            cnt = cur_pg.rowcount
            total_activated += cnt
            if cnt > 0:
                logger.info(f"  [Prefecture {pref_code}] Partition {part_name}: Activated {cnt:,} corporate T-Numbers.")
        except Exception as e:
            conn_pg.rollback()
            logger.error(f"  [-] Error updating partition {part_name}: {e}")

    elapsed = time.time() - t0
    
    # Verify final total on VPS
    cur_pg.execute("SELECT COUNT(*) FROM companies WHERE has_invoice = true;")
    vps_invoice_total = cur_pg.fetchone()[0]
    
    logger.info("=" * 80)
    logger.info(f"[+] STEP 1 COMPLETE: Activated {total_activated:,} new T-Numbers in {elapsed:.2f}s.")
    logger.info(f"[+] TOTAL INVOICE T-NUMBERS ACTIVE ON VPS: {vps_invoice_total:,}")
    logger.info("=" * 80)
    
    cur_pg.close()
    conn_pg.close()
    return total_activated, vps_invoice_total

def sync_all_t_numbers_on_sqlite():
    """Ensures local SQLite has_invoice = 1 aligns 100% with active status."""
    logger.info(">>> [STEP 1B] ALIGNING LOCAL SQLITE INVOICE T-NUMBERS <<<")
    conn_sq = get_sqlite_conn()
    cur_sq = conn_sq.cursor()
    
    cur_sq.execute("""
        UPDATE companies
        SET has_invoice = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE status = '活動中'
          AND (has_invoice IS NULL OR has_invoice = 0);
    """)
    updated_local = cur_sq.rowcount
    conn_sq.commit()
    
    cur_sq.execute("SELECT COUNT(*) FROM companies WHERE has_invoice = 1;")
    local_invoice_total = cur_sq.fetchone()[0]
    conn_sq.close()
    
    logger.info(f"[+] Local SQLite: Updated {updated_local:,} companies. Total has_invoice = 1: {local_invoice_total:,}")
    return updated_local, local_invoice_total

# ======================================================================================
# TASK 2: MIRROR LEGAL CHANGE TIMELINE EVENTS (VPS ➔ SQLITE)
# ======================================================================================

def mirror_legal_histories_to_sqlite(chunk_size: int = 50000):
    """
    Streams all 6.94M+ cleaned legal timeline events from VPS PostgreSQL
    into local SQLite master table company_legal_histories.
    """
    logger.info("=" * 80)
    logger.info(">>> [STEP 2] MIRRORING 6.94M+ LEGAL HISTORIES FROM VPS TO LOCAL SQLITE <<<")
    logger.info("=" * 80)

    conn_sq = get_sqlite_conn()
    cur_sq = conn_sq.cursor()
    
    # Ensure local indexes
    cur_sq.execute("""
        CREATE TABLE IF NOT EXISTS company_legal_histories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            corporate_number TEXT NOT NULL,
            event_no TEXT,
            event_type TEXT,
            event_date TEXT,
            event_badge_ja TEXT,
            event_badge_en TEXT,
            event_badge_vi TEXT,
            title_ja TEXT,
            title_en TEXT,
            title_vi TEXT,
            details_ja TEXT,
            details_en TEXT,
            details_vi TEXT,
            old_info TEXT,
            source TEXT,
            source_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(corporate_number, event_type, event_date)
        );
    """)
    cur_sq.execute("CREATE INDEX IF NOT EXISTS idx_legal_histories_corp ON company_legal_histories(corporate_number);")
    cur_sq.execute("CREATE INDEX IF NOT EXISTS idx_legal_histories_date ON company_legal_histories(event_date);")
    conn_sq.commit()

    cur_sq.execute("SELECT COUNT(*) FROM company_legal_histories;")
    initial_local = cur_sq.fetchone()[0]
    logger.info(f"[*] Current legal histories in local SQLite: {initial_local:,}")

    conn_pg = get_pg_conn()
    cur_pg = conn_pg.cursor(name="legal_history_stream_cursor")
    cur_pg.itersize = chunk_size

    cur_pg.execute("""
        SELECT corporate_number, event_no, event_type, event_date::text,
               event_badge_ja, event_badge_en, event_badge_vi,
               title_ja, title_en, title_vi,
               details_ja, details_en, details_vi,
               old_info, source, source_url
        FROM company_legal_histories
        ORDER BY id ASC;
    """)

    insert_sql = """
        INSERT OR IGNORE INTO company_legal_histories (
            corporate_number, event_no, event_type, event_date,
            event_badge_ja, event_badge_en, event_badge_vi,
            title_ja, title_en, title_vi,
            details_ja, details_en, details_vi,
            old_info, source, source_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """

    t0 = time.time()
    total_inserted = 0
    total_read = 0

    while True:
        rows = cur_pg.fetchmany(chunk_size)
        if not rows:
            break
        total_read += len(rows)

        cur_sq.execute("BEGIN TRANSACTION;")
        before = conn_sq.total_changes
        cur_sq.executemany(insert_sql, rows)
        after = conn_sq.total_changes
        cur_sq.execute("COMMIT;")

        chunk_new = after - before
        total_inserted += chunk_new

        elapsed = time.time() - t0
        speed = total_read / elapsed if elapsed > 0 else 0
        logger.info(f"  Streamed: {total_read:,} rows | Saved new: {total_inserted:,} | Speed: {speed:.0f} rows/sec")

    cur_pg.close()
    conn_pg.close()

    cur_sq.execute("SELECT COUNT(*) FROM company_legal_histories;")
    final_local = cur_sq.fetchone()[0]
    conn_sq.close()

    logger.info("=" * 80)
    logger.info(f"[+] STEP 2 COMPLETE: Local SQLite now holds {final_local:,} legal change events (+{total_inserted:,} newly synced).")
    logger.info("=" * 80)
    return total_inserted, final_local

# ======================================================================================
# CONTINUOUS HARVESTING & PATROL LOOP
# ======================================================================================

def run_continuous_nta_agent(interval_sec: int = 15):
    logger.info("🚀 [NTA DEDICATED AGENT] LAUNCHED IN 100% AUTONOMOUS FOCUS MODE")
    logger.info(f"[*] Loop Interval: {interval_sec}s | Targets: NTA Pháp nhân & T-Number Invoice")

    # Step 1: Run comprehensive T-Number activation immediately
    sync_all_t_numbers_on_vps()
    sync_all_t_numbers_on_sqlite()

    # Step 2: Mirror all legal histories to local SQLite
    mirror_legal_histories_to_sqlite()

    # Step 3: Continuous monitoring loop
    cycle = 1
    while True:
        logger.info(f"\n--- [NTA AGENT CYCLE #{cycle}] Checking for fresh NTA Legal Updates ---")
        try:
            from crawlers.nta.nta_harvester import harvest_nta_legal_changes
            harvest_nta_legal_changes(limit=500, backfill=True)
        except Exception as e:
            logger.error(f"[-] NTA cycle #{cycle} error: {e}", exc_info=True)

        cycle += 1
        logger.info(f"[*] Standby for {interval_sec}s before next NTA cycle...")
        time.sleep(interval_sec)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dedicated NTA & T-Number Autonomous Agent")
    parser.add_argument("--sync-invoices", action="store_true", help="Sync all T-Numbers across 47 prefectures")
    parser.add_argument("--sync-histories", action="store_true", help="Mirror 6.94M legal histories to SQLite")
    parser.add_argument("--continuous", action="store_true", help="Run in continuous dedicated autonomous loop")
    parser.add_argument("--interval", type=int, default=30, help="Interval seconds for continuous mode")

    args = parser.parse_args()

    if args.sync_invoices:
        sync_all_t_numbers_on_vps()
        sync_all_t_numbers_on_sqlite()
    elif args.sync_histories:
        mirror_legal_histories_to_sqlite()
    elif args.continuous:
        run_continuous_nta_agent(interval_sec=args.interval)
    else:
        # Default: Full run then continuous
        run_continuous_nta_agent(interval_sec=args.interval)
