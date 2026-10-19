#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Multi-Prefecture Expansion Orchestrator
===================================================
Automates harvesting & enrichment across multiple prefectures:
- Osaka (27)
- Kanagawa (14)
- Aichi (23)
- Saitama (11)
- Chiba (12)
- Hyogo (28)
- Fukuoka (40)
- Hokkaido (01)
- Kyoto (26)
... and all 47 prefectures!

Runs 100% on Local PC with zero VPS load.
Includes automatic checkpointing, retry logic, and progress reporting.
"""

import os
import sys
import asyncio
import argparse
from datetime import datetime

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from crawlers.open_data.harvesters.mlit_prefecture_harvester import harvest_prefecture, PREFECTURE_MAP

DEFAULT_TARGETS = [
    "27", # Osaka (大阪府)
    "14", # Kanagawa (神奈川県)
    "23", # Aichi (愛知県)
    "11", # Saitama (埼玉県)
    "12", # Chiba (千葉県)
    "28", # Hyogo (兵庫県)
    "40", # Fukuoka (福岡県)
    "01", # Hokkaido (北海道)
    "26", # Kyoto (京都府)
    "22", # Shizuoka (静岡県)
    "34", # Hiroshima (広島県)
    "08", # Ibaraki (茨城県)
    "04", # Miyagi (宮城県)
]

async def run_expansion(prefs, pages_per_pref=None):
    print("=" * 80)
    print("KIGYOU-LIST: NATIONWIDE OPEN DATA EXPANSION ENGINE")
    print(f"Target Prefectures: {', '.join([f'[{p}] {PREFECTURE_MAP.get(p)}' for p in prefs])}")
    print(f"Pages per pref: {pages_per_pref if pages_per_pref else 'ALL available pages'}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    for idx, pref_code in enumerate(prefs, 1):
        pref_name = PREFECTURE_MAP.get(pref_code, "Unknown")
        print(f"\n>>> [{idx}/{len(prefs)}] Launching expansion for [{pref_code}] {pref_name}...")
        try:
            await harvest_prefecture(pref_code, max_pages=pages_per_pref)
            print(f"[✓] Finished batch for [{pref_code}] {pref_name}!")
        except Exception as e:
            print(f"[!] Error processing {pref_name}: {e}. Continuing to next prefecture...")
        
        # Polite 2s delay between prefectures
        await asyncio.sleep(2)

    print("\n" + "=" * 80)
    print("NATIONWIDE MULTI-PREFECTURE EXPANSION BATCH COMPLETED!")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kigyou-list Nationwide Expansion Orchestrator")
    parser.add_argument("--prefs", nargs="+", default=DEFAULT_TARGETS[:4], help="Prefecture codes (default: 27 14 23 11)")
    parser.add_argument("--pages", type=int, default=None, help="Pages per prefecture (default: all)")
    parser.add_argument("--all", action="store_true", help="Run all 47 prefectures")
    args = parser.parse_args()

    targets = list(PREFECTURE_MAP.keys()) if args.all else args.prefs
    asyncio.run(run_expansion(targets, pages_per_pref=args.pages))
