# -*- coding: utf-8 -*-
"""
Script xuất bản Facebook Ngày 7 (Dual-Channel: Fanpage + Personal)
Chủ đề: Bản đồ B2B / SaaS Chaosmap 2026 - Tái hợp nhất dữ liệu & Phá bỏ cạm bẫy hợp đồng năm
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from facebook_publisher import post_facebook_dual

POST_CONTENT = """【2026年最新】日本のB2B / SaaS カオスマップを公開しました🗺️✨

「ツールの乱立で社内データが分断（サイロ化）している…」
「年間100万円超の名簿ツールを契約したが、データ更新が遅く固定費ばかりかかる…」

そんなB2B営業組織の課題を解決するため、全国500万社データベース『Kigyou-list』は、2026年の国内エンタープライズ・SaaSエコシステムを体系化した最新カオスマップを公開いたしました！

■ 2026年 営業DXを支える5大領域：
1️⃣ 【SalesTech & AI Outreach】フォーム自動送信・AIパーソナライズメール
2️⃣ 【Corporate DB & Intent Data】500万社DB・求人/補助金シグナル
3️⃣ 【AI & Automation】LLM業界タグ付け・セマンティック類似検索
4️⃣ 【HR Tech & Signals】採用動向・組織課題の特定
5️⃣ 【FinTech & Compliance】インボイス一括判定・24時間企業監視

単なる「静的な社名リスト」を年契約で買う時代は終わりました。リアルタイムなインテントデータをAPIとAIで軽量に使い倒すことが、これからの勝ち筋です。

初期費用0円・年間契約縛りなし・毎月50件CSV永久無料で今すぐご利用いただけます。

▼ カオスマップの詳細解説＆500万社無料検索はこちら：
👉 https://kigyoulist.com/?utm_source=facebook&utm_medium=day_07_chaosmap

#KigyouList #カオスマップ #B2B #SaaS #セールステック #インテントデータ #営業DX #スタートアップ #コスト削減"""

IMAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_day_07_chaosmap.jpg"))
COMMENT_LINK = "https://kigyoulist.com/?utm_source=facebook&utm_medium=day_07_chaosmap"

if __name__ == "__main__":
    print("[*] Starting Facebook Dual-Channel Publisher for Day 7 Chaosmap...")
    res = post_facebook_dual(
        text=POST_CONTENT,
        image_path=IMAGE_PATH,
        comment_link=COMMENT_LINK,
        target="both",
        headless=True
    )
    print(f"[+] Result: {res}")
