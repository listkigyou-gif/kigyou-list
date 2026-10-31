# -*- coding: utf-8 -*-
"""
Script xuất bản bài viết Note.com công bố Báo cáo Điều tra Xếp hạng Doanh nghiệp & White Company 2026
Chủ đề: Phân tích sâu về Thu nhập bình quân, Thâm niên gắn bó, và Quy mô đóng BHXH
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from note_publisher import create_note

title = "【独自調査2026】全国ホワイト企業＆年収ランキングTOP100発表：勤続年数・平均給与・雇用実態から読み解く「選ばれる優良企業」の共通点"

content_paragraphs = [
    "「給与は高いが離職率が激しい企業」と、「給与も高く20年以上長く働き続けられる企業」。\n日本のビジネスパーソンや就職・転職者が本当に求めている『持続可能な優良企業（真のホワイト企業）』の実態はどこにあるのでしょうか？",
    "人的資本開示の義務化に伴い、各企業が開示する『平均年間給与』『平均勤続年数』『厚生年金被保険者数』などの一次データが注目を集めています。",
    "本稿では、全国500万社データベース『Kigyou-list（kigyoulist.com）』が、金融庁EDINETおよび公的オープンデータを独自統合・解析して算出した【2026年最新 全国企業ランキング】の分析結果を特別公開いたします。",
    "",
    "■ 調査1：全国ホワイト企業・平均勤続年数ランキングTOP100",
    "正社員の定着率の高さを示す「平均勤続年数」において、上位100社の平均はなんと【21.4年】に達しました。",
    "電力・エネルギーインフラ、大手私鉄、素材・重化学工業などの伝統的基幹産業が上位の大半を占め、手厚い福利厚生と長期的な人材育成プログラムが定着率を強力に支えている実態が浮き彫りとなりました。",
    "👉 【全国ホワイト企業・平均勤続年数ランキングTOP100】全社リストはこちら：\nhttps://kigyoulist.com/ja/ranking/tenure?utm_source=note&utm_medium=ranking_tenure",
    "",
    "■ 調査2：全国上場企業・平均年間給与ランキングTOP50",
    "有価証券報告書の給与データ分析では、M&A仲介、大手総合商社、都心部再開発を手掛ける大手不動産デベロッパーが上位を独占しました。",
    "上位陣では平均年収が1,500万円〜2,000万円を超えており、高付加価値型のビジネスモデルを展開する企業において、社員への高い還元が実現されています。",
    "👉 【平均年間給与ランキングTOP50】全社リストはこちら：\nhttps://kigyoulist.com/ja/ranking/salary?utm_source=note&utm_medium=ranking_salary",
    "",
    "■ 調査3：厚生年金被保険者数による「実質的な企業規模」ランキング",
    "名目上の従業員数（パート・アルバイト・委託等の基準が曖昧な数値）ではなく、日本年金機構の「厚生年金被保険者数」から真の正規雇用規模を算出しました。",
    "製造業や通信メガ企業が数万人規模の被保険者を抱える一方、近年のアウトソーシング需要を背景に大手BPO・人材サービス企業の躍進が顕著となっています。",
    "👉 【厚生年金被保険者数ランキングTOP100】全社リストはこちら：\nhttps://kigyoulist.com/ja/ranking/employees?utm_source=note&utm_medium=ranking_employees",
    "",
    "■ 調査4：六本木ヒルズなど「主要15高層オフィスビル入居企業名鑑」",
    "都心のランドマーク超高層ビルに入居する企業群をデータベース化。渋谷スクランブルスクエアには急成長AI・SaaSベンチャーが集中し、丸の内・大手町には金融・商社の中枢機能が集結している実態を可視化しました。",
    "👉 【都内15大オフィスビル別・入居企業名鑑】はこちら：\nhttps://kigyoulist.com/ja/building?utm_source=note&utm_medium=ranking_building",
    "",
    "■ まとめ：データドリブンで「企業の真の姿」を見極める時代へ",
    "単なるブランドイメージや求人広告のキャッチコピーではなく、公的開示データに基づく客観的な数値こそが、取引先選定やキャリア選択における最大の武器となります。",
    "全国500万社を網羅するKigyou-listでは、今後も日本の法人取引・採用DXを支援するオープンなデータインフラを拡充してまいります。",
    "",
    "※本調査結果およびランキングデータを引用・転載される際は、必ず【出典：国内最大級の法人データベース『Kigyou-list（kigyoulist.com）』】のクレジット表記および上記URLへのリンクを明記してください。"
]

hashtags = ["ホワイト企業", "年収ランキング", "勤続年数", "働き方改革", "就職活動", "転職", "企業研究", "KigyouList"]
image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "linkedin_ranking_2026.jpg"))

if __name__ == "__main__":
    print("[*] Bắt đầu xuất bản bài viết Báo cáo Xếp hạng lên Note.com...")
    result_url = create_note(
        title=title,
        content_paragraphs=content_paragraphs,
        hashtags=hashtags,
        image_path=image_path,
        publish=True
    )
    print(f"[NOTE RESULT] {result_url}")
