# -*- coding: utf-8 -*-
"""
Script xuất bản chuỗi Thread Ngày 4 lên X (@kigyoulist)
Chủ đề: Data Democracy (Dân chủ hóa dữ liệu B2B) & Safe AI Outreach
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from x_browser_publisher import post_thread_browser

tweets = [
    """【「営業リストに年間100万円」はもう時代遅れ】
大企業が独占してきたB2B企業データを、すべてのスタートアップ・中小企業へ。

従来のセールステックが抱えていた「年間縛り・高額固定費」という不条理を壊し、誰もが自由に新規開拓できる「営業DXの民主化」が始まっています👇 (1/3)""",

    """なぜ大手ツールの1/25〜1/80の価格破壊が可能なのか？

国税庁・経済産業省などの公的オープンデータをAIが自動で正規化・統合。
無駄な調査員コストをゼロにしたことで、日本全国500万社データベースを圧倒的な低コストで提供可能に。

さらに、AIがフォームの「営業お断り」を事前検知しクレームを自動回避🛡️ (2/3)""",

    """初期費用0円・年間契約縛り一切なし。
★初月わずか ¥1,260（70% OFF）／通常 ¥4,200/月
★即時登録で毎月50件CSVダウンロード永久無料！

大手ツールとの料金・機能比較一覧＆全500万社検索はこちら：
https://kigyoulist.com/ja/compare?utm_source=twitter&utm_medium=day_04

#データ民主化 #営業DX #法人リスト #スタートアップ #コスト削減 (3/3)"""
]

image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_day_04.jpg"))

if __name__ == "__main__":
    print("[*] Starting Day 4 X Thread Publisher...")
    url = post_thread_browser(tweets=tweets, image_path=image_path, headless=True)
    if url:
        print(f"[+] X Thread Day 4 published successfully: {url}")
    else:
        print("[-] X Thread Day 4 publishing failed.")
