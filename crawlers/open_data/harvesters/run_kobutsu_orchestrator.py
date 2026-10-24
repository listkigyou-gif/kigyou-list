#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Nationwide Kobutsu Multi-Prefecture Orchestrator
============================================================
Sequentially harvests, enriches, and delta-syncs official secondhand dealer
registries across Japanese prefectures (Tokyo, Gunma, Tochigi, Miyagi,
Hiroshima, Shizuoka, Saitama...) into SQLite and VPS PostgreSQL production.
"""

import os
import sys
import time
import logging

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from crawlers.open_data.harvesters.npa_kobutsu_harvester import harvest_prefecture, PREFECTURE_CONFIGS

LOG_FILE = "logs/kobutsu_orchestrator.log"
os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8', mode='a'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("KobutsuOrchestrator")

def run_orchestrator():
    logger.info("=" * 80)
    logger.info("KIGYOU-LIST: NATIONWIDE KOBUTSU HARVESTER ORCHESTRATOR STARTED")
    logger.info(f"Target Prefectures: {list(PREFECTURE_CONFIGS.keys())}")
    logger.info(f"Log File: {LOG_FILE}")
    logger.info("=" * 80)

    total_added = 0
    # Process prefectures (skipping 13 and 10 since they are already ingested)
    prefs_to_run = ["09", "04", "34", "22", "11"]
    for idx, pref_code in enumerate(prefs_to_run, 1):
        cfg = PREFECTURE_CONFIGS.get(pref_code, {})
        pref_name = cfg.get("name", pref_code)
        logger.info(f"\n[>>>] STARTING PREFECTURE {idx}/{len(prefs_to_run)}: [{pref_code}] {pref_name}")

        try:
            t_start = time.time()
            added = harvest_prefecture(pref_code)
            elapsed = time.time() - t_start
            total_added += added
            logger.info(f"[+] Completed [{pref_code}] {pref_name}: Added {added:,} new licenses in {elapsed:.1f}s")
        except Exception as e:
            logger.error(f"[-] Error harvesting [{pref_code}] {pref_name}: {e}", exc_info=True)

        logger.info("[*] Cooling down 3s before next prefecture...")
        time.sleep(3)

    logger.info("\n" + "=" * 80)
    logger.info(f"KOBUTSU ORCHESTRATION BATCH COMPLETED! Total New Licenses: {total_added:,}")
    logger.info("=" * 80)

if __name__ == "__main__":
    run_orchestrator()
