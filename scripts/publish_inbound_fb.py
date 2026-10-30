# -*- coding: utf-8 -*-
"""
Script xuất bản Facebook (Dual-Channel: Fanpage + Personal)
Chủ đề: Tiêu chuẩn dữ liệu doanh nghiệp chất lượng cao & Chiến lược Inbound B2B
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from facebook_publisher import post_facebook_dual

POST_CONTENT = """【B2Bマーケター・営業責任者必見】営業成果を劇的に変える「良質な企業データ」の選び方🔍✨

「購入した営業名簿が古く、移転や廃業ばかりで架電効率が上がらない…」
「年間100万円超のツールを契約したが、データ更新が遅く固定費ばかりが膨らむ…」

営業の成否は「誰にアプローチするか」で8割が決まります。古い静的名簿ツールによる「空振りの山（バウンス率30%超）」から脱却し、最短距離で商談を獲得するための最新ノウハウを公開しました！

■ 2026年、成果を出す営業組織が選ぶ「良質な企業データ」の3大条件：
1️⃣ 【インテントシグナル連動】求人拡大や補助金採択など、今まさに投資意欲のある企業をリアルタイム検知
2️⃣ 【コンプライアンス自動照会】インボイスT番号の失効や登記変更履歴（商号・本店移転・代表者交代）を即時判定
3️⃣ 【年間縛りのない機動性】必要な月だけアジャイルに利用でき、不要な月はいつでも解約可能

全国500万社データベース『Kigyou-list』は、初期費用0円・クレジットカード不要で、毎月50件のCSVダウンロードが永久無料でご利用いただけます。

▼ 500万社の無料企業検索＆活用ガイドはこちら：
👉 https://kigyoulist.com/?utm_source=facebook&utm_medium=b2b_data_guide

#KigyouList #企業データベース #営業DX #法人リスト #インテントデータ #新規開拓 #インサイドセールス #コスト削減 #B2B"""

IMAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_inbound_links_launch.jpg"))
COMMENT_LINK = "https://kigyoulist.com/?utm_source=facebook&utm_medium=b2b_data_guide"

if __name__ == "__main__":
    print("[*] Starting Facebook Dual-Channel Publisher for Inbound Authority...")
    res = post_facebook_dual(
        text=POST_CONTENT,
        image_path=IMAGE_PATH,
        comment_link=COMMENT_LINK,
        target="both",
        headless=True
    )
    print(f"[+] Result: {res}")
