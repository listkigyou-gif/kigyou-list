# -*- coding: utf-8 -*-
"""
Script xuất bản Facebook (Dual-Channel: Fanpage + Personal) ra mắt tính năng 企業監視・変更検知 (Watchlist)
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from facebook_publisher import post_facebook_dual

POST_CONTENT = """【経営者・経理・法務必見】取引先の「サイレントな異変」、見落としていませんか？⚠️

「長年付き合いのあった取引先が突然連絡不能になり、売掛金が焦げ付いた…」
「いつの間にか代表者が交代し、怪しい事業へ定款変更されていた…」
「インボイス登録が取り消されていたのに気づかず、税務調査で追徴課税を受けた…」

企業の倒産や信用破綻の前兆は、商業登記簿の「変更履歴」に必ず現れます。しかし、高額な調査会社のモニタリングを全取引先に導入するのはコスト的に困難でした。

国内500万社データベース『Kigyou-list』は、取引先企業の登記変更やインボイス失効を24時間365日体制で自動トラッキングする新機能「企業監視・検知（ウォッチリスト）」を【完全無料】で一般公開しました！🔍✨

■ 企業監視・変更検知機能の4大メリット：
✅ 【24時間自動巡回】国税庁・行政オープンデータと連動し、夜間・休日も変更履歴を自動追跡
✅ 【重要イベント即時検知】商号変更／本店移転／代表者交代／減資／インボイス失効を検知
✅ 【即日メール通知】重要変更が検知された際、変更前後の差分データを即座にメールでお届け
✅ 【インボイス一括照会と連携】CSV照会結果からワンクリックで監視リストへ登録可能

初期費用0円・月額0円・クレジットカード不要で、今すぐブラウザからご利用いただけます。

▼ 取引先の24時間自動監視を今すぐ無料でスタート：
👉 https://kigyoulist.com/ja/watchlist?utm_source=facebook&utm_medium=watchlist_launch

#KigyouList #企業監視 #与信管理 #バックオフィス #倒産予防 #コンプライアンス #インボイス制度 #リスク管理 #B2B"""

IMAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_watchlist_launch.jpg"))
COMMENT_LINK = "https://kigyoulist.com/ja/watchlist?utm_source=facebook&utm_medium=watchlist_launch"

if __name__ == "__main__":
    print("[*] Starting Facebook Dual-Channel Publisher for Watchlist Feature...")
    res = post_facebook_dual(
        text=POST_CONTENT,
        image_path=IMAGE_PATH,
        comment_link=COMMENT_LINK,
        target="both",
        headless=True
    )
    print(f"[+] Result: {res}")
