# -*- coding: utf-8 -*-
"""
Script xuất bản chuỗi Thread Ngày 3 lên X (@kigyoulist)
Chủ đề: Signal Sales & Intent Data - Săn khách hàng qua tín hiệu tuyển dụng Hello Work
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from x_browser_publisher import post_thread_browser

tweets = [
    """【テレアポ成約率が3倍に】
なぜ「求人中の会社」だけに絞ると、営業効率が劇的に跳ね上がるのか？🎯📈

100件かけて98件断られるコールドコール。
それは営業の腕ではなく、「相手に今、買う理由がない」タイミングでかけているからです。

成約率を跳ね上げる「シグナル営業」の極意👇 (1/3)""",

    """企業がハローワーク等に求人を出す背景には：
1️⃣ 人を採用できる「投資余力（予算）」がある証明
2️⃣ 人手不足で「業務効率化・SaaS・外注」へのニーズが切実
3️⃣ 組織拡大に伴い、PCやツールなど新規調達が連鎖的に発生

求人票は「今すぐ提案してほしい」という最強の購買シグナルです。 (2/3)""",

    """全国500万社DB「Kigyou List」なら、ハローワーク求人中の企業をワンクリックで抽出可能。
初期費用0円・年間縛りなし。
★初月わずか ¥1,260（70% OFF）／通常 ¥4,200/月
★毎月50件CSVダウンロード永久無料！

▼ 求人シグナル絞り込み検索はこちら：
https://kigyoulist.com/ja/search?has_recruitment=true&utm_source=twitter&utm_medium=day_03

#インテントセールス #求人シグナル #ハローワーク求人 #新規開拓 #営業DX (3/3)"""
]

image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_day_03.jpg"))

if __name__ == "__main__":
    print("[*] Starting Day 3 X Thread Publisher...")
    url = post_thread_browser(tweets=tweets, image_path=image_path, headless=True)
    if url:
        print(f"[+] X Thread Day 3 published successfully: {url}")
    else:
        print("[-] X Thread Day 3 publishing failed.")
