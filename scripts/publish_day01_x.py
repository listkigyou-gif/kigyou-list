# -*- coding: utf-8 -*-
"""
Script xuất bản chuỗi Thread Ngày 1 lên X (@kigyoulist)
Chủ đề: Bóc trần chi phí ẩn & Nghịch lý hợp đồng năm
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from x_browser_publisher import post_thread_browser

tweets = [
    """【月10万円の名簿ツールは本当に必要か？】
日本のB2B営業で当たり前とされてきた「高額な年間契約縛り」。
実は多くの企業が「使わない月も引き落とされ続ける」「データが古くて繋がらない」という隠れコストに悩まされています。

私たちはその営業の不合理を終わらせます👇 (1/3)""",

    """全国500万社（国税庁全法人100%）を網羅した企業データベース「Kigyou List」は、初期費用0円・年間縛り一切なし。

★初月わずか ¥1,260（70% OFF）
★2ヶ月目以降も通常 ¥4,200/月
他社（月3〜10万円）の1/25〜1/80という圧倒的な低コストを実現しました。
毎月50件CSVダウンロード永久無料です。 (2/3)""",

    """大手主要ツールとの料金・機能の徹底比較表を公開中。貴社の営業コスト削減とROI改善にぜひお役立てください📊

👉 主要ツール徹底比較表：
https://kigyoulist.com/ja/compare?utm_source=twitter&utm_medium=day_01

#営業リスト #B2B営業 #コスト削減 #法人データベース #営業DX #新規開拓 (3/3)"""
]

image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_day_01.jpg"))

if __name__ == "__main__":
    print("[*] Starting Day 1 X Thread Publisher...")
    url = post_thread_browser(tweets=tweets, image_path=image_path, headless=True)
    if url:
        print(f"[+] X Thread published successfully: {url}")
    else:
        print("[-] X Thread publishing failed or returned no URL.")
