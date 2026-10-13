#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
growth_orchestrator.py - Helper module for Kigyou-list Growth & Content Operations
Handles daily omnichannel publishing across ALL active platforms:
Note.com, Qiita, Zenn, PR-FREE, X, Facebook Page, Facebook Profile.
(ValuePress is reserved once a month).
"""

import os
import sys
import json
import datetime
from pathlib import Path

# Fix Windows console UTF-8 output
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

HISTORY_FILE = Path(__file__).parent / "growth_history.json"

ACTIVE_DAILY_CHANNELS = [
    {"id": "note", "name": "Note.com", "type": "Blog & Pillar Content"},
    {"id": "qiita", "name": "Qiita", "type": "Tech & Data Pipeline"},
    {"id": "zenn", "name": "Zenn.dev", "type": "Dev & Engineering Community"},
    {"id": "pr_free", "name": "PR-FREE", "type": "Free Press Release (100% Free)"},
    {"id": "x", "name": "X (@kigyoulist)", "type": "Social & Thread"},
    {"id": "facebook_page", "name": "Facebook Official Fanpage", "type": "Company News & Social Proof"},
    {"id": "facebook_profile", "name": "Facebook Personal Profile", "type": "Founder Story & P2P Reach"},
]

MONTHLY_CHANNELS = [
    {"id": "valuepress", "name": "ValuePress", "type": "Monthly Press Release (Giới hạn 1 lần/tháng)"}
]

def load_history():
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_history(entry):
    history = load_history()
    history.append(entry)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def get_today_channels():
    now = datetime.datetime.now()
    return {
        "date": now.strftime("%Y-%m-%d"),
        "channels": ACTIVE_DAILY_CHANNELS,
        "monthly_reserve": MONTHLY_CHANNELS
    }

def main():
    info = get_today_channels()
    print(f"=== HỆ SINH THÁI ĐĂNG BÀI TOÀN BỘ KÊNH HÔM NAY ({info['date']}) ===")
    print("Danh sách các kênh kích hoạt hàng ngày:")
    for idx, ch in enumerate(info["channels"], 1):
        print(f"  {idx}. [{ch['name']}] - {ch['type']}")
    print("\nKênh giới hạn chu kỳ:")
    print("  * ValuePress: Giữ nhịp 1 lần/tháng cho bản tin PR đặc biệt quan trọng.")

if __name__ == "__main__":
    main()
