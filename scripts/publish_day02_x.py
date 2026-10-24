# -*- coding: utf-8 -*-
"""
Script xuất bản chuỗi Thread Ngày 2 lên X (@kigyoulist)
Chủ đề: 3 Chi phí ẩn khi mua data từ các nhà cung cấp truyền thống & Cỗ máy dữ liệu sạch 500万社
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from x_browser_publisher import post_thread_browser

tweets = [
    """【知らないと大損】法人名簿サービスに潜む「3つの隠れコスト」とは？⚠️📉

「1件あたり数十円だから安い」と思って導入した企業名簿。
しかし、運用してみると想定外のコストが積み重なっていませんか？

従来の法人データ販売サービスに潜む【3つの罠】を解説します👇 (1/3)""",

    """❌ 隠れコスト①：初期費用＆100万〜200万円単位の年間縛り
❌ 隠れコスト②：移転・解散の更新遅れによるバウンス率30%超の無駄撃ち
❌ 隠れコスト③：ダウンロード上限超過による高額な従量課金

営業組織の利益率を最大化する第一歩は、「データ調達の見直し」から始まります。 (2/3)""",

    """国内最大級500万社DB「Kigyou List」は、初期費用0円・年間縛りなし。
★初月わずか ¥1,260（70% OFF）／通常 ¥4,200/月
★他社の1/25〜1/80という圧倒的低価格
★毎月50件CSVダウンロード永久無料！

主要ツールとの詳細比較表を公開中📊
👉 https://kigyoulist.com/ja/compare?utm_source=twitter&utm_medium=day_02

#営業リスト #B2B営業 #コスト削減 #営業DX #新規開拓 (3/3)"""
]

image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_day_02.jpg"))

if __name__ == "__main__":
    print("[*] Starting Day 2 X Thread Publisher...")
    url = post_thread_browser(tweets=tweets, image_path=image_path, headless=True)
    if url:
        print(f"[+] X Thread Day 2 published successfully: {url}")
    else:
        print("[-] X Thread Day 2 publishing failed.")
