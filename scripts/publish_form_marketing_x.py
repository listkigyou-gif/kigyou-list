# -*- coding: utf-8 -*-
"""
Script xuất bản chuỗi Thread X (@kigyoulist) ra mắt tính năng AI問い合わせフォーム営業 (Form Marketing)
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from x_browser_publisher import post_thread_browser

tweets = [
    """【テレアポの限界を超える営業DX🚀】
「毎朝電話をかけまくっても受付でブロック…」
「配信したコールドメールが迷惑メール行き…」

従来のアウトバウンドに行き詰まっていませんか？
企業の問い合わせ窓口へ直接アプローチし、開封率80%超を誇る「AIフォーム営業」が今アツい理由👇 (1/3)""",

    """なぜ「AIフォーム営業」が圧倒的に強いのか？

1️⃣ スパムを物理的に回避し、担当者・経営層の閲覧率80%超
2️⃣ 提案が良ければ社内チャット（Slack等）で決裁者へ即転送
3️⃣ 145万件の採用シグナル連動で「予算のある成長企業」を直撃
4️⃣ 1件あたりわずか【16.1円】の圧倒的低コスト

人の手による単純作業はゼロにできます✨ (2/3)""",

    """★初期費用0円・年間契約の縛りなし（月額4,200円〜）
★全国500万社からターゲットを即座に抽出＆自動送信
★企業ごとのフォーム項目をAIが安全判別・自動入力

確度の高い商団獲得を今すぐスタート👇
https://kigyoulist.com/ja/form-marketing?utm_source=twitter&utm_medium=form_launch

#営業DX #問い合わせフォーム営業 #インサイドセールス #新規開拓 #B2Bマーケティング (3/3)"""
]

image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "linkedin_form_marketing.jpg"))

if __name__ == "__main__":
    print("[*] Starting Form Marketing X Thread Publisher...")
    url = post_thread_browser(tweets=tweets, image_path=image_path, headless=False)
    if url:
        print(f"[+] X Thread Form Marketing published successfully: {url}")
    else:
        print("[-] X Thread publishing failed.")

