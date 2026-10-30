# -*- coding: utf-8 -*-
"""
Script xuất bản Facebook Fanpage ra mắt giải pháp AI 問い合わせフォーム営業 (Form Marketing)
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from facebook_publisher import post_facebook_dual

POST_CONTENT = """【営業パーソン・事業責任者必見】テレアポと一斉メールの限界、感じていませんか？⚠️

「毎日数十件テレアポをしても受付でブロックされる…」
「配信したコールドメールが迷惑メールフォルダに直行している…」

リモートワークが定着した現代のB2B営業において、従来型のアウトバウンド手法の成約率は急激に低下しています。

そこで、多くの急成長企業がシフトしているのが【AI問い合わせフォーム営業（Form Marketing）】です！🚀✨

■ なぜ「フォーム営業」が圧倒的に強いのか？
✅ 【開封率80%超】企業の「お問い合わせ窓口」に届くため、迷惑メールフィルターをすり抜け担当者・経営層が直接確認
✅ 【決裁者への転送率が高い】提案がニーズに合致していれば、社内チャットツールで意思決定者へ即座に共有
✅ 【1件わずか16.1円】従来の代行業者（1件30〜50円）の約半額という圧倒的コストパフォーマンス
✅ 【145万件の採用シグナル連動】直近で積極採用を行っている「予算のある成長企業」だけにピンポイント送信可能

初期費用0円・年間契約の縛りなし。人の手による単純作業をゼロにし、営業は商談だけに専念しませんか？

▼ AI問い合わせフォーム営業の詳細・無料デモはこちら：
👉 https://kigyoulist.com/ja/form-marketing?utm_source=facebook&utm_medium=form_launch

#KigyouList #営業DX #問い合わせフォーム営業 #インサイドセールス #新規開拓 #B2Bマーケティング #業務効率化"""

IMAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "linkedin_form_marketing.jpg"))
COMMENT_LINK = "https://kigyoulist.com/ja/form-marketing?utm_source=facebook&utm_medium=form_launch"

if __name__ == "__main__":
    print("[*] Starting Facebook Fanpage Publisher for Form Marketing...")
    res = post_facebook_dual(
        text=POST_CONTENT,
        image_path=IMAGE_PATH,
        comment_link=COMMENT_LINK,
        target="page",
        headless=True
    )
    print(f"[+] Result: {res}")
