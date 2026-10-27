# -*- coding: utf-8 -*-
"""
Script xuất bản chuỗi Thread X (@kigyoulist) Ngày 7: Bản đồ B2B / SaaS Chaosmap 2026
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from x_browser_publisher import post_thread_browser

tweets = [
    """【2026年最新版】日本のB2B / SaaS カオスマップを公開しました🗺️

ツール乱立による「データ分断」と「年間契約縛り」に終止符を打つ、次世代営業DXの全体像を徹底整理。

いま急成長企業が導入している5大領域の全貌はこちら👇 (1/3)""",

    """2026年の最大の地殻変動は「静的名簿からインテントデータへのシフト」です。

1️⃣ 問い合わせフォーム自動送信（AI営業）
2️⃣ 500万社DB×求人シグナル
3️⃣ LLMによる業界自動タグ付け
4️⃣ 人事・採用動向の時系列追跡
5️⃣ インボイス照会・24時間企業監視

単なる社名リストの時代は完全に終わりました🚀 (2/3)""",

    """★日本全国500万社の企業データを今すぐ無料検索
★初期費用0円・年間契約縛り一切なし
★インボイス一括照会＆企業監視も即日利用可能！

カオスマップの詳細解説記事＆無料検索デモはこちら👇
https://kigyoulist.com/?utm_source=twitter&utm_medium=day_07_chaosmap

#B2B #SaaS #カオスマップ #営業DX #インテントデータ #スタートアップ (3/3)"""
]

image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_day_07_chaosmap.jpg"))

if __name__ == "__main__":
    print("[*] Starting Day 7 Chaosmap X Thread Publisher...")
    url = post_thread_browser(tweets=tweets, image_path=image_path, headless=True)
    if url:
        print(f"[+] X Thread Day 7 published successfully: {url}")
    else:
        print("[-] X Thread publishing failed.")
