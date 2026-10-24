#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Nationwide 47-Prefecture Takken Harvester Orchestrator
==================================================================
Coordinates automated background harvesting of real estate licenses (宅地建物取引業者)
across all 47 prefectures in Japan from the MLIT National Database.
Includes automated checkpointing, auto-recovery on network drops, and periodic
delta synchronization directly to VPS PostgreSQL Production with JSIC auto-tagging.
"""

import os
import sys
import time
import asyncio
import logging
import argparse
from datetime import datetime

# Set up project root in python sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Import harvester function
from crawlers.open_data.harvesters.mlit_takken_harvester import harvest_takken, PREFECTURE_MAP
# Import delta sync function
from scripts.sync_delta_licenses_to_vps import sync_licenses

sys.stdout.reconfigure(encoding='utf-8')

LOG_FILE = "logs/takken_orchestrator.log"
os.makedirs("logs", exist_ok=True)

# Strategic order: 16 major economic prefectures first (~85% of market), followed by all 31 regional prefectures
ALL_47_PREFECTURES = [
    # --- Tier 1: Mega Economic Hubs ---
    "13", # 東京都 (Tokyo) - ~30,000 firms
    "14", # 神奈川県 (Kanagawa) - ~10,000 firms
    "27", # 大阪府 (Osaka) - ~12,000 firms
    "23", # 愛知県 (Aichi) - ~8,000 firms
    "11", # 埼玉県 (Saitama) - ~7,000 firms
    "12", # 千葉県 (Chiba) - ~6,500 firms
    "40", # 福岡県 (Fukuoka) - ~5,500 firms
    "28", # 兵庫県 (Hyogo) - ~5,000 firms
    # --- Tier 2: Key Regional Economic Centers ---
    "01", # 北海道 (Hokkaido) - ~4,000 firms
    "26", # 京都府 (Kyoto) - ~3,500 firms
    "22", # 静岡県 (Shizuoka) - ~3,000 firms
    "04", # 宮城県 (Miyagi) - ~2,500 firms
    "34", # 広島県 (Hiroshima) - ~2,500 firms
    "08", # 茨城県 (Ibaraki) - ~2,500 firms
    "09", # 栃木県 (Tochigi) - ~2,000 firms
    "10", # 群馬県 (Gunma) - ~2,000 firms
    # --- Tier 3: All Remaining 31 Prefectures Nationwide ---
    "02", # 青森県
    "03", # 岩手県
    "05", # 秋田県
    "06", # 山形県
    "07", # 福島県
    "15", # 新潟県
    "16", # 富山県
    "17", # 石川県
    "18", # 福井県
    "19", # 山梨県
    "20", # 長野県
    "21", # 岐阜県
    "24", # 三重県
    "25", # 滋賀県
    "29", # 奈良県
    "30", # 和歌山県
    "31", # 鳥取県
    "32", # 島根県
    "33", # 岡山県
    "35", # 山口県
    "36", # 徳島県
    "37", # 香川県
    "38", # 愛媛県
    "39", # 高知県
    "41", # 佐賀県
    "42", # 長崎県
    "43", # 熊本県
    "44", # 大分県
    "45", # 宮崎県
    "46", # 鹿児島県
    "47"  # 沖縄県
]

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8', mode='a'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("TakkenOrchestrator")

async def run_orchestrator(start_pref=None, single_pref=None):
    logger.info("=" * 80)
    logger.info("KIGYOU-LIST: NATIONWIDE 47-PREFECTURE REAL ESTATE HARVESTER ORCHESTRATOR")
    logger.info(f"Total Prefectures: {len(ALL_47_PREFECTURES)}")
    logger.info(f"Log File: {LOG_FILE}")
    logger.info("=" * 80)

    target_list = ALL_47_PREFECTURES
    if single_pref:
        target_list = [single_pref]
    elif start_pref:
        try:
            idx = target_list.index(start_pref)
            target_list = target_list[idx:]
        except ValueError:
            logger.warning(f"Start prefecture {start_pref} not found in list, running all.")

    for idx, pref_code in enumerate(target_list, 1):
        pref_name = PREFECTURE_MAP.get(pref_code, f"Pref_{pref_code}")
        logger.info(f"\n[>>>] STARTING PREFECTURE {idx}/{len(target_list)}: [{pref_code}] {pref_name}")

        retries = 3
        success = False

        for attempt in range(1, retries + 1):
            try:
                t_start = time.time()
                await harvest_takken(pref_code=pref_code)
                elapsed = time.time() - t_start
                logger.info(f"[+] Completed harvesting for [{pref_code}] {pref_name} in {elapsed:.1f}s")
                success = True
                break
            except Exception as e:
                logger.error(f"[-] Error harvesting [{pref_code}] {pref_name} (Attempt {attempt}/{retries}): {e}", exc_info=True)
                if attempt < retries:
                    wait_time = attempt * 15
                    logger.info(f"[*] Waiting {wait_time}s before retrying...")
                    await asyncio.sleep(wait_time)

        if success:
            logger.info(f"[*] Triggering delta synchronization & auto-tagging to VPS PostgreSQL Production...")
            try:
                sync_licenses()
                logger.info(f"[+] Delta sync completed successfully for [{pref_code}] {pref_name}")
            except Exception as e:
                logger.error(f"[-] Delta sync error for [{pref_code}] {pref_name}: {e}")

        # Polite delay between prefectures to avoid server throttling
        logger.info(f"[*] Cooldown 5s before next prefecture...")
        await asyncio.sleep(5)

    logger.info("\n" + "=" * 80)
    logger.info("NATIONWIDE 47-PREFECTURE REAL ESTATE HARVESTING ORCHESTRATION COMPLETED")
    logger.info("=" * 80)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Nationwide MLIT Real Estate License Harvester Orchestrator")
    parser.add_argument("--start", type=str, default=None, help="Start from specific prefecture code (e.g. 13)")
    parser.add_argument("--pref", type=str, default=None, help="Run single prefecture only (e.g. 13)")
    args = parser.parse_args()

    asyncio.run(run_orchestrator(start_pref=args.start, single_pref=args.pref))
