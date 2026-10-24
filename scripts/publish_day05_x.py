# -*- coding: utf-8 -*-
"""
Script xuất bản chuỗi Thread Ngày 5 lên X (@kigyoulist)
Chủ đề: Case Study & Đột phá ROI: Đội ngũ 3 người cắt giảm 90% chi phí tiếp cận & Tăng 1.8 lần cuộc hẹn
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from x_browser_publisher import post_thread_browser

tweets = [
    """【営業3名で商談数1.8倍】
月7万円かけていた企業名簿を解約し、営業リスト調達費を「90%削減」した都内SaaS企業の事例📈

1日何時間もGoogle検索で連絡先を探していたチームが、なぜ劇的に成果を出せるようになったのか？

インハウス営業DXの全手順を公開します👇 (1/3)""",

    """勝因は「タイミング」と「データ内製化」：

1️⃣ ハローワーク求人中の企業だけにアプローチ（購買意欲の高い先を特定）
2️⃣ AIがフォームの「営業お断り」を事前検知し、クレームゼロで安全送信
3️⃣ 月7万円の固定費を月4,200円（初月1,260円）へ圧縮し、削減資金を提案力強化へ再投資

結果、商談獲得数が1.8倍に跳ね上がりました🚀 (2/3)""",

    """年間縛りなし・初期費用0円。
★初月わずか ¥1,260（70% OFF）／通常 ¥4,200/月
★即時登録で毎月50件CSVダウンロード永久無料！

都内企業・急成長企業を今すぐ無料検索：
https://kigyoulist.com/ja/search?utm_source=twitter&utm_medium=day_05

#営業DX #事例紹介 #インサイドセールス #コスト削減 #スタートアップ (3/3)"""
]

image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_day_05.jpg"))

if __name__ == "__main__":
    print("[*] Starting Day 5 X Thread Publisher...")
    url = post_thread_browser(tweets=tweets, image_path=image_path, headless=True)
    if url:
        print(f"[+] X Thread Day 5 published successfully: {url}")
    else:
        print("[-] X Thread Day 5 publishing failed.")
