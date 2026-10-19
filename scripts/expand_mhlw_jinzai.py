"""
Kigyou-list Nationwide MHLW Jinzai Orchestrator
Harvests all Labor Dispatch (Hakken) and Employment Placement (Jinzai Shokai) licenses
across Japan from the Ministry of Health, Labour and Welfare (MHLW - 厚生労働省).
"""

import os
import sys
import argparse
import asyncio
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crawlers.open_data.harvesters.mhlw_jinzai_harvester import harvest_mhlw, MHLW_PREFECTURE_MAP

DEFAULT_TOP_PREFECTURES = [
    "13", # Tokyo (東京都)
    "27", # Osaka (大阪府)
    "14", # Kanagawa (神奈川県)
    "23", # Aichi (愛知県)
    "11", # Saitama (埼玉県)
    "12", # Chiba (千葉県)
    "40", # Fukuoka (福岡県)
    "28", # Hyogo (兵庫県)
    "22", # Shizuoka (静岡県)
    "26", # Kyoto (京都府)
    "01", # Hokkaido (北海道)
    "34", # Hiroshima (広島県)
    "04", # Miyagi (宮城県)
    "08", # Ibaraki (茨城県)
]

async def run_mhlw_expansion(prefs, harvest_types=("hakken", "jinzai"), pages_per_pref=None):
    print("=" * 85)
    print("KIGYOU-LIST: NATIONWIDE MHLW LABOR & STAFFING EXPANSION ENGINE")
    pref_desc = [f"[{p}] {MHLW_PREFECTURE_MAP[p]['name']}" for p in prefs if p in MHLW_PREFECTURE_MAP]
    print(f"Target Prefectures ({len(prefs)}): {', '.join(pref_desc)}")
    print(f"Target Services: {', '.join(harvest_types)}")
    print(f"Pages per service: {pages_per_pref if pages_per_pref else 'ALL available pages'}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 85)

    for p_idx, pref_code in enumerate(prefs, 1):
        pref_info = MHLW_PREFECTURE_MAP.get(pref_code)
        if not pref_info:
            continue
        pref_name = pref_info["name"]

        for h_type in harvest_types:
            type_label = "労働者派遣事業 (Hakken)" if h_type == "hakken" else "有料職業紹介事業 (Jinzai)"
            print(f"\n>>> [{p_idx}/{len(prefs)}] Launching {type_label} for [{pref_code}] {pref_name}...")
            try:
                await harvest_mhlw(pref_code, harvest_type=h_type, max_pages=pages_per_pref)
                print(f"[✓] Finished {type_label} for [{pref_code}] {pref_name}!")
            except Exception as e:
                print(f"[!] Error processing [{pref_code}] {pref_name} ({h_type}): {e}. Continuing...")

            await asyncio.sleep(2)

    print("\n" + "=" * 85)
    print("NATIONWIDE MHLW JINZAI EXPANSION COMPLETE!")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 85)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kigyou-list MHLW Jinzai Nationwide Expansion")
    parser.add_argument("--prefs", nargs="+", default=DEFAULT_TOP_PREFECTURES, help="Prefecture codes (default: Top 14)")
    parser.add_argument("--type", choices=["both", "hakken", "jinzai"], default="both", help="License type to harvest")
    parser.add_argument("--pages", type=int, default=None, help="Pages per prefecture (default: all)")
    parser.add_argument("--all", action="store_true", help="Harvest all 47 prefectures")
    args = parser.parse_args()

    targets = list(MHLW_PREFECTURE_MAP.keys()) if args.all else args.prefs
    types = ["hakken", "jinzai"] if args.type == "both" else [args.type]

    asyncio.run(run_mhlw_expansion(targets, harvest_types=types, pages_per_pref=args.pages))
