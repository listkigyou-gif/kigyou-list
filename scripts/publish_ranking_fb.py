# -*- coding: utf-8 -*-
"""
Script xuất bản Facebook Fanpage công bố Báo cáo Xếp hạng Doanh nghiệp & White Company 2026
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from facebook_publisher import post_facebook_dual

POST_CONTENT = """【2026年最新独自調査】全国ホワイト企業＆年収ランキングTOP100を正式公表！📊✨

「給与は高いが離職率が激しい企業」と「手厚い待遇で20年以上長く働き続けられる企業」。
日本のビジネスパーソンや転職者が本当に求めている【持続可能な優良企業（ホワイト企業）】の実態を500万社データから徹底分析しました！

■ 調査の3大ハイライト：
1️⃣ 【ホワイト企業・平均勤続年数TOP100】上位100社の平均勤続年数は驚異の「21.4年」。電力・私鉄・重化学メーカーが圧倒的な定着率を記録
2️⃣ 【平均年間給与TOP50】上位陣は年収1,500万円〜2,000万円超。M&A仲介・総合商社・都心不動産デベロッパーが高年収を牽引
3️⃣ 【厚生年金被保険者数TOP100】名目上の従業員数ではなく、公的社会保険データに基づく真の正規雇用規模をランキング化

各ランキングの全社詳細リストおよび「主要15高層オフィスビル入居企業名鑑」を完全無料で公開しております。

▼ 全国企業ランキングハブ・詳細閲覧はこちら：
👉 https://kigyoulist.com/ja/ranking/tenure?utm_source=facebook&utm_medium=ranking_launch

#KigyouList #ホワイト企業 #年収ランキング #勤続年数 #働き方改革 #企業研究 #就活 #転職 #B2B"""

IMAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "linkedin_ranking_2026.jpg"))
COMMENT_LINK = "https://kigyoulist.com/ja/ranking/tenure?utm_source=facebook&utm_medium=ranking_launch"

if __name__ == "__main__":
    print("[*] Starting Facebook Fanpage Publisher for Ranking Report...")
    res = post_facebook_dual(
        text=POST_CONTENT,
        image_path=IMAGE_PATH,
        comment_link=COMMENT_LINK,
        target="page",
        headless=True
    )
    print(f"[+] Result: {res}")
