#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Multi-Agent New Licenses Orchestrator
=================================================
Coordinates:
1. Agent 1: ISA Registered Support Organization Harvester (登録支援機関 - moj.go.jp/isa)
2. Agent 2: Statutory Professional Services Harvester (士業・専門職法人: 税理士法人, 監査法人, 弁護士法人, etc.)
Validates and syncs 100% into SQLite and VPS PostgreSQL Production.
"""

import os
import sys
import time
import logging
import psycopg2

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from crawlers.open_data.harvesters.isa_tokutei_harvester import harvest_isa_support_orgs
from crawlers.open_data.harvesters.professional_services_harvester import harvest_professional_services

LOG_FILE = "logs/new_licenses_orchestrator.log"
os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8', mode='a'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("NewLicensesOrchestrator")

PG_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")

def run():
    logger.info("=" * 80)
    logger.info("KIGYOU-LIST: MULTI-AGENT NEW LICENSES ORCHESTRATION COMMENCED")
    logger.info("Agent 1: 出入国在留管理庁 (ISA) 登録支援機関 (Tokutei Gino)")
    logger.info("Agent 2: 士業・専門職法人 (税理士法人, 監査法人, 弁護士法人, 行政書士法人, 司法書士法人, 社労士法人, 弁理士法人)")
    logger.info("=" * 80)

    t0 = time.time()

    # Run Agent 1: ISA Tokutei
    logger.info("\n" + "#" * 80)
    logger.info("[AGENT 1 ACTIVATING] Harvesting ISA Registered Support Organizations...")
    logger.info("#" * 80)
    try:
        isa_count = harvest_isa_support_orgs()
        logger.info(f"[+] Agent 1 finished successfully! {isa_count:,} organizations ingested.")
    except Exception as e:
        logger.error(f"[-] Agent 1 failed: {e}", exc_info=True)

    # Run Agent 2: Professional Services
    logger.info("\n" + "#" * 80)
    logger.info("[AGENT 2 ACTIVATING] Harvesting Statutory Professional Legal & Accounting Corporations...")
    logger.info("#" * 80)
    try:
        prof_count = harvest_professional_services()
        logger.info(f"[+] Agent 2 finished successfully! {prof_count:,} professional licenses ingested.")
    except Exception as e:
        logger.error(f"[-] Agent 2 failed: {e}", exc_info=True)

    # Verification Report
    logger.info("\n" + "=" * 80)
    logger.info("POSTGRESQL PRODUCTION LICENSE AUDIT:")
    logger.info("=" * 80)
    try:
        conn = psycopg2.connect(PG_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT license_type, count(1)
            FROM company_licenses
            GROUP BY license_type
            ORDER BY count(1) DESC;
        """)
        rows = cur.fetchall()
        total_lic = sum(r[1] for r in rows)
        for lic_type, cnt in rows:
            logger.info(f"  - {lic_type:<25}: {cnt:>10,}")
        logger.info("-" * 80)
        logger.info(f"  TOTAL ALL LICENSES ON VPS: {total_lic:>10,}")
        logger.info("=" * 80)
        conn.close()
    except Exception as e:
        logger.error(f"[-] Audit query failed: {e}")

    logger.info(f"[+] ALL MULTI-AGENT NEW LICENSES COMPLETED IN {time.time() - t0:.2f}s!")

if __name__ == "__main__":
    run()
