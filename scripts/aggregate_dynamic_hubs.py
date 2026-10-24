#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Dynamic Hubs Aggregator Worker ("Mạng Nhện Biến Động")
==================================================================
Extracts and structures high-intent dynamic events for Programmatic SEO:
  1. new_establishment: Newly registered corporations (新設法人・新規設立企業)
  2. relocation: Corporate head office address changes (本店移転・所在地変更)
  3. bankruptcies: Corporate dissolutions and closures (企業解散・清算・倒産情報)
  4. hiring: Companies actively recruiting with careers/recruit pages (求人募集中速報)
  5. merger: Corporate trade name changes and mergers (商号変更・M&A・組織変更)

Usage:
  python scripts/aggregate_dynamic_hubs.py --mode all
  python scripts/aggregate_dynamic_hubs.py --mode relocation
  python scripts/aggregate_dynamic_hubs.py --mode new_establishment --recent-days 90
"""

import os
import sys
import argparse
import time
import logging
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv('.env.local')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(BASE_DIR, "aggregate_dynamic_hubs.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding='utf-8')
    ]
)
logger = logging.getLogger("DynamicHubsAggregator")

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")

def get_db():
    conn = psycopg2.connect(DB_URL, connect_timeout=20)
    conn.autocommit = False
    return conn

INSERT_SQL = """
INSERT INTO hub_dynamic_events (
    corporate_number,
    company_name,
    prefecture_code,
    prefecture_name,
    city_name,
    event_category,
    event_date,
    title_ja,
    description_ja,
    old_value,
    new_value,
    source
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (corporate_number, event_category, event_date) DO NOTHING;
"""

def aggregate_relocation(conn, batch_size=2000, limit=None):
    """Aggregate head office relocations from company_legal_histories"""
    logger.info("=== Starting Aggregation: [relocation] (本社移転・所在地変更) ===")
    cur = conn.cursor()
    
    limit_clause = f"LIMIT {limit}" if limit else ""
    query = f"""
        SELECT 
            h.corporate_number,
            COALESCE(c.company_name, '企業') as company_name,
            COALESCE(c.prefecture_code, '13') as prefecture_code,
            COALESCE(c.prefecture_name, '東京都') as prefecture_name,
            c.city_name,
            'relocation' as event_category,
            h.event_date,
            COALESCE(h.title_ja, '本店又は主たる事務所の所在地の変更') as title_ja,
            h.details_ja as description_ja,
            h.old_info as old_value,
            h.details_ja as new_value,
            COALESCE(h.source, '国税庁 法人番号公表サイト（変更履歴）') as source
        FROM company_legal_histories h
        JOIN companies c ON h.corporate_number = c.corporate_number
        WHERE h.event_type = 'address_change'
          AND h.event_date IS NOT NULL
        ORDER BY h.event_date DESC
        {limit_clause}
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    total_fetched = len(rows)
    logger.info(f"Fetched {total_fetched} relocation events to process.")
    
    inserted = 0
    if rows:
        for i in range(0, total_fetched, batch_size):
            batch = rows[i:i + batch_size]
            execute_batch(cur, INSERT_SQL, batch)
            conn.commit()
            inserted += len(batch)
            logger.info(f"Processed {inserted}/{total_fetched} relocation records...")
            
    cur.close()
    logger.info(f"=== Completed [relocation]: {inserted} records processed. ===\n")
    return inserted

def aggregate_new_establishment(conn, recent_days=None, batch_size=2000, limit=None):
    """Aggregate newly established corporations from company_legal_histories (366,790+ companies established 2024-2026)"""
    logger.info("=== Starting Aggregation: [new_establishment] (新設法人・新規設立企業) ===")
    cur = conn.cursor()
    
    date_filter = ""
    if recent_days:
        date_filter = f"AND h.event_date >= (CURRENT_DATE - INTERVAL '{recent_days} days')"
    else:
        date_filter = "AND h.event_date >= '2024-01-01'"
        
    limit_clause = f"LIMIT {limit}" if limit else "LIMIT 50000"
    
    query = f"""
        SELECT 
            h.corporate_number,
            COALESCE(c.company_name, '新設企業') as company_name,
            COALESCE(c.prefecture_code, '13') as prefecture_code,
            COALESCE(c.prefecture_name, '東京都') as prefecture_name,
            c.city_name,
            'new_establishment' as event_category,
            h.event_date,
            CONCAT(COALESCE(c.prefecture_name, '全国'), 'における新設法人の登記公表（', TO_CHAR(h.event_date, 'YYYY-MM'), '）') as title_ja,
            CONCAT(COALESCE(c.prefecture_name, ''), COALESCE(c.city_name, ''), 'にて「', COALESCE(c.company_name, ''), '」が法人登記・設立されました。') as description_ja,
            NULL as old_value,
            c.street_address as new_value,
            COALESCE(h.source, '国税庁 法人番号公表サイト') as source
        FROM company_legal_histories h
        JOIN companies c ON h.corporate_number = c.corporate_number
        WHERE h.event_type = 'establishment'
          {date_filter}
        ORDER BY h.event_date DESC
        {limit_clause}
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    total_fetched = len(rows)
    logger.info(f"Fetched {total_fetched} newly established companies to process.")
    
    inserted = 0
    if rows:
        for i in range(0, total_fetched, batch_size):
            batch = rows[i:i + batch_size]
            execute_batch(cur, INSERT_SQL, batch)
            conn.commit()
            inserted += len(batch)
            logger.info(f"Processed {inserted}/{total_fetched} new establishment records...")
            
    cur.close()
    logger.info(f"=== Completed [new_establishment]: {inserted} records processed. ===\n")
    return inserted

def aggregate_bankruptcies(conn, batch_size=2000, limit=None):
    """Aggregate corporate dissolutions and liquidations from company_legal_histories"""
    logger.info("=== Starting Aggregation: [bankruptcies] (企業解散・清算・倒産情報) ===")
    cur = conn.cursor()
    
    limit_clause = f"LIMIT {limit}" if limit else "LIMIT 50000"
    query = f"""
        SELECT 
            h.corporate_number,
            COALESCE(c.company_name, '企業') as company_name,
            COALESCE(c.prefecture_code, '13') as prefecture_code,
            COALESCE(c.prefecture_name, '東京都') as prefecture_name,
            c.city_name,
            'bankruptcies' as event_category,
            h.event_date,
            '企業の解散・清算結了等の登記公表' as title_ja,
            CONCAT(COALESCE(c.prefecture_name, ''), 'の法人「', COALESCE(c.company_name, ''), '」に関する解散等の異動登記が公表されました。') as description_ja,
            c.status as old_value,
            '解散登記' as new_value,
            COALESCE(h.source, '国税庁 法人番号公表サイト（登記情報）') as source
        FROM company_legal_histories h
        JOIN companies c ON h.corporate_number = c.corporate_number
        WHERE h.event_type = 'dissolution'
          AND h.event_date IS NOT NULL
          AND h.event_date >= '2024-01-01'
        ORDER BY h.event_date DESC
        {limit_clause}
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    total_fetched = len(rows)
    logger.info(f"Fetched {total_fetched} dissolution events to process.")
    
    inserted = 0
    if rows:
        for i in range(0, total_fetched, batch_size):
            batch = rows[i:i + batch_size]
            execute_batch(cur, INSERT_SQL, batch)
            conn.commit()
            inserted += len(batch)
            logger.info(f"Processed {inserted}/{total_fetched} dissolution records...")
            
    cur.close()
    logger.info(f"=== Completed [bankruptcies]: {inserted} records processed. ===\n")
    return inserted

def aggregate_hiring(conn, batch_size=2000, limit=None):
    """Aggregate companies actively recruiting with career pages"""
    logger.info("=== Starting Aggregation: [hiring] (求人募集中・新着採用情報) ===")
    cur = conn.cursor()
    
    limit_clause = f"LIMIT {limit}" if limit else "LIMIT 50000"
    query = f"""
        SELECT 
            c.corporate_number,
            c.company_name,
            COALESCE(c.prefecture_code, '13') as prefecture_code,
            COALESCE(c.prefecture_name, '東京都') as prefecture_name,
            c.city_name,
            'hiring' as event_category,
            COALESCE(c.updated_at::date, CURRENT_DATE) as event_date,
            '求人募集中・積極採用企業の公表速報' as title_ja,
            CONCAT(c.prefecture_name, COALESCE(c.city_name, ''), 'の「', c.company_name, '」が公式採用ページまたはハローワークにて求人を公開中です。') as description_ja,
            NULL as old_value,
            NULL as new_value,
            'ハローワーク / 公式採用ページ収集' as source
        FROM companies c
        WHERE c.has_hiring = TRUE
          AND c.status = '活動中'
        ORDER BY c.updated_at DESC NULLS LAST
        {limit_clause}
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    total_fetched = len(rows)
    logger.info(f"Fetched {total_fetched} hiring companies to process.")
    
    inserted = 0
    if rows:
        for i in range(0, total_fetched, batch_size):
            batch = rows[i:i + batch_size]
            execute_batch(cur, INSERT_SQL, batch)
            conn.commit()
            inserted += len(batch)
            logger.info(f"Processed {inserted}/{total_fetched} hiring records...")
            
    cur.close()
    logger.info(f"=== Completed [hiring]: {inserted} records processed. ===\n")
    return inserted

def aggregate_merger(conn, batch_size=2000, limit=None):
    """Aggregate corporate trade name changes and mergers (50,000+ M&A merger events)"""
    logger.info("=== Starting Aggregation: [merger] (商号変更・M&A・組織変更) ===")
    cur = conn.cursor()
    
    limit_clause = f"LIMIT {limit}" if limit else "LIMIT 50000"
    query = f"""
        SELECT 
            h.corporate_number,
            COALESCE(c.company_name, '企業') as company_name,
            COALESCE(c.prefecture_code, '13') as prefecture_code,
            COALESCE(c.prefecture_name, '東京都') as prefecture_name,
            c.city_name,
            'merger' as event_category,
            h.event_date,
            CASE 
                WHEN h.details_ja LIKE '%合併%' THEN '企業の吸収合併・組織再編（M&A登記）'
                ELSE COALESCE(h.title_ja, '商号又は名称の変更登記')
            END as title_ja,
            h.details_ja as description_ja,
            h.old_info as old_value,
            c.company_name as new_value,
            COALESCE(h.source, '国税庁 法人番号公表サイト（登記情報）') as source
        FROM company_legal_histories h
        JOIN companies c ON h.corporate_number = c.corporate_number
        WHERE (h.event_type = 'name_change' OR h.details_ja LIKE '%合併%')
          AND h.event_date IS NOT NULL
        ORDER BY h.event_date DESC
        {limit_clause}
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    total_fetched = len(rows)
    logger.info(f"Fetched {total_fetched} merger/name change events to process.")
    
    inserted = 0
    if rows:
        for i in range(0, total_fetched, batch_size):
            batch = rows[i:i + batch_size]
            execute_batch(cur, INSERT_SQL, batch)
            conn.commit()
            inserted += len(batch)
            logger.info(f"Processed {inserted}/{total_fetched} merger records...")
            
    cur.close()
    logger.info(f"=== Completed [merger]: {inserted} records processed. ===\n")
    return inserted

def print_hub_summary(conn):
    """Print current counts in hub_dynamic_events by category"""
    cur = conn.cursor()
    cur.execute("""
        SELECT event_category, COUNT(*), MIN(event_date), MAX(event_date)
        FROM hub_dynamic_events
        GROUP BY event_category
        ORDER BY COUNT(*) DESC;
    """)
    rows = cur.fetchall()
    logger.info("==========================================================")
    logger.info("CURRENT HUB_DYNAMIC_EVENTS SUMMARY IN DATABASE:")
    logger.info("==========================================================")
    for cat, cnt, min_d, max_d in rows:
        logger.info(f"  • {cat.ljust(18)} : {str(cnt).rjust(8)} events (from {min_d} to {max_d})")
    
    cur.execute("SELECT COUNT(*) FROM hub_dynamic_events;")
    total = cur.fetchone()[0]
    logger.info(f"  TOTAL EVENTS IN HUBS: {total}")
    logger.info("==========================================================")
    cur.close()

def main():
    parser = argparse.ArgumentParser(description="Aggregate dynamic events into hub_dynamic_events")
    parser.add_argument("--mode", default="all", choices=["all", "relocation", "new_establishment", "bankruptcies", "hiring", "merger", "summary"], help="Event category to aggregate")
    parser.add_argument("--batch-size", type=int, default=2000, help="Batch size for inserts")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of rows to process")
    parser.add_argument("--recent-days", type=int, default=None, help="Only process events in the last N days")
    args = parser.parse_args()

    start_time = time.time()
    conn = get_db()
    logger.info(f"Connected to database successfully. Mode: {args.mode}")

    try:
        if args.mode in ["all", "relocation"]:
            aggregate_relocation(conn, batch_size=args.batch_size, limit=args.limit)
            
        if args.mode in ["all", "merger"]:
            aggregate_merger(conn, batch_size=args.batch_size, limit=args.limit)

        if args.mode in ["all", "bankruptcies"]:
            aggregate_bankruptcies(conn, batch_size=args.batch_size, limit=args.limit)

        if args.mode in ["all", "hiring"]:
            aggregate_hiring(conn, batch_size=args.batch_size, limit=args.limit)

        if args.mode in ["all", "new_establishment"]:
            aggregate_new_establishment(conn, recent_days=args.recent_days, batch_size=args.batch_size, limit=args.limit or 50000)

        print_hub_summary(conn)
        
    except Exception as e:
        logger.error(f"Error during aggregation: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()
        elapsed = time.time() - start_time
        logger.info(f"All aggregation tasks finished in {elapsed:.2f}s.")

if __name__ == "__main__":
    main()
