# -*- coding: utf-8 -*-
"""
Script xuất bản chuỗi Thread X (@kigyoulist) ra mắt tính năng 企業監視・変更検知 (Watchlist)
Chủ đề: Phòng ngừa nợ xấu & Theo dõi biến động pháp lý/đổi đại diện/hủy T-number tự động 24/7
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from x_browser_publisher import post_thread_browser

tweets = [
    """【経営者・経理必見の与信リスク⚠️】
「取引先の代表が突然交代していた…」
「いつの間にか本店が移転し連絡不能になった…」
取引開始時に一度調べたきりで放置していませんか？

全国500万社の登記変更を24時間自動検知する無料ツールを公開しました👇 (1/3)""",

    """なぜ「年に1度の信用調査」では防げないのか？

1️⃣ 従来の調査会社は高額で、全取引先の継続監視は困難
2️⃣ 倒産や夜逃げの前兆は「登記変更履歴」に必ず現れる
3️⃣ インボイス失効や代表交代を放置すると追徴課税・貸倒れに直結

重要イベント発生時に即日メールで自動アラートをお届けします🚀 (2/3)""",

    """★完全無料（0円・登録不要）
★国税庁・行政オープンデータ連動で主な変更履歴を自動追跡
★商号変更／本店移転／代表者交代／インボイス失効を24時間監視

取引先の自動モニタリングを今すぐ無料スタート👇
https://kigyoulist.com/ja/watchlist?utm_source=twitter&utm_medium=watchlist_launch

#与信管理 #企業監視 #バックオフィス #倒産予防 #コンプライアンス (3/3)"""
]

image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_watchlist_launch.jpg"))

if __name__ == "__main__":
    print("[*] Starting Watchlist Feature X Thread Publisher...")
    url = post_thread_browser(tweets=tweets, image_path=image_path, headless=True)
    if url:
        print(f"[+] X Thread Watchlist Launch published successfully: {url}")
    else:
        print("[-] X Thread publishing failed.")
