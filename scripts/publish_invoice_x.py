# -*- coding: utf-8 -*-
"""
Script xuất bản chuỗi Thread X (@kigyoulist) ra mắt tính năng インボイス一括照会
Chủ đề: Phòng ngừa truy thu thuế do đối tác bị hủy T-Number - Check hàng loạt trong 10 giây
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from x_browser_publisher import post_thread_browser

tweets = [
    """【経理・財務担当者への緊急警告⚠️】
「取引先がいつの間にかインボイス登録取消になっていた…」
これを見落として仕入税額控除を計上すると、税務調査で否認され多額の追徴課税のリスクがあります。

取引先のT番号を一括10秒で最新判定する無料ツールを公開しました👇 (1/3)""",

    """なぜ「国税庁サイトの手作業確認」は限界なのか？

1️⃣ 数百社のT番号を1件ずつ手打ち照会するのは膨大な工数
2️⃣ 免税事業者への自主転落や滞納による取消処分が急増中
3️⃣ 年に1度の確認では、期中の登録失効を見逃す

最新Web-API連携なら、CSVドラッグ＆ドロップで一瞬で白黒判定できます🚀 (2/3)""",

    """★完全無料（0円・登録不要）
★国税庁Web-API直接連携で最新ステータス判定
★照会日時・登録日入りの監査証憑CSVを1クリック出力

取引先のインボイス有効性を今すぐ一括チェック👇
https://kigyoulist.com/ja/invoice?utm_source=twitter&utm_medium=invoice_launch

#インボイス制度 #経理DX #バックオフィス #仕入税額控除 #税務調査 (3/3)"""
]

image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_invoice_launch.jpg"))

if __name__ == "__main__":
    print("[*] Starting Invoice Feature X Thread Publisher...")
    url = post_thread_browser(tweets=tweets, image_path=image_path, headless=True)
    if url:
        print(f"[+] X Thread Invoice Launch published successfully: {url}")
    else:
        print("[-] X Thread publishing failed.")
