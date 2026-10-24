# -*- coding: utf-8 -*-
"""
Script xuất bản chuỗi Thread Ngày 6 lên X (@kigyoulist)
Chủ đề: Tối ưu cho Startup & SMB - Tự tạo danh bạ in-house thay vì thuê ngoài & Né cạm bẫy hợp đồng năm
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from x_browser_publisher import post_thread_browser

tweets = [
    """【創業期に絶対やってはいけないこと】
「年間100万円の一括契約で営業名簿を買うこと」です⚠️

毎月ターゲットが変わる初期フェーズで、年間縛りの固定費は命取り。

外注費ゼロ・月1,260円で営業リストを自社内製化する実践ステップをまとめました👇 (1/3)""",

    """なぜ「名簿の内製化」が最強なのか？

1️⃣ 外注業者との見積もり・納品待ち（数週間）が「即日5分」に短縮
2️⃣ ハローワーク求人シグナルで「今、予算がある会社」だけをピンポイント抽出
3️⃣ 年間契約縛りなし。不要な月はワンクリックで解約可能

機動性とコスト効率が、大手に勝つ唯一の武器です🚀 (2/3)""",

    """初期費用0円・年間契約縛り一切なし。
★初月わずか ¥1,260（70% OFF）／通常 ¥4,200/月
★即時登録で毎月50件CSVダウンロード永久無料！

日本全国500万社の詳細企業データを今すぐ無料検索：
https://kigyoulist.com/ja/search?utm_source=twitter&utm_medium=day_06

#スタートアップ #中小企業 #営業DX #内製化 #コスト削減 #法人リスト (3/3)"""
]

image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_day_06.jpg"))

if __name__ == "__main__":
    print("[*] Starting Day 6 X Thread Publisher...")
    url = post_thread_browser(tweets=tweets, image_path=image_path, headless=True)
    if url:
        print(f"[+] X Thread Day 6 published successfully: {url}")
    else:
        print("[-] X Thread Day 6 publishing failed.")
