# -*- coding: utf-8 -*-
"""
Script xuất bản Facebook (Dual-Channel: Fanpage + Personal) ra mắt tính năng インボイス一括照会
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from facebook_publisher import post_facebook_dual

POST_CONTENT = """【経理・バックオフィス必見】取引先のインボイス登録失効を見落としていませんか？⚠️

「毎月末、何十社・何百社ものT番号を手打ち確認するのが重労働…」
「取引開始時は適格請求書発行事業者だったのに、いつの間にか登録取消になっていて仕入税額控除が否認された…」

インボイス制度下において、取引先の「免税事業者への自主転落」や「税金滞納等による登録取消」を見落とすと、税務調査で追徴課税のリスクに直面します。

国内500万社データベース『Kigyou-list』は、国税庁Web-APIと直接連携した「インボイス一括照会機能」を【完全無料】で一般公開しました！🔍✨

■ インボイス一括照会の3大メリット：
✅ 【10秒で一括判定】CSVドラッグ＆ドロップで数百社のT番号ステータスを即時判定
✅ 【3段階の明確なステータス】「有効」「取消・失効」「未登録」を視覚的に一目で判別
✅ 【監査証憑CSV出力】照会日時・登録年月日・取消年月日を記録した監査用CSVを1クリック保存

さらに、照会結果から1クリックで「企業監視（ウォッチリスト）」に登録可能。今後の登記変更やインボイス失効を24時間自動検知してアラート通知します。

初期費用0円・月額0円・クレジットカード登録不要で、今すぐブラウザからご利用いただけます。

▼ 取引先のインボイス有効性を今すぐ一括照会（無料）：
👉 https://kigyoulist.com/ja/invoice?utm_source=facebook&utm_medium=invoice_launch

#KigyouList #インボイス制度 #経理DX #適格請求書 #仕入税額控除 #バックオフィス #税務調査 #コスト削減 #B2B"""

IMAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_invoice_launch.jpg"))
COMMENT_LINK = "https://kigyoulist.com/ja/invoice?utm_source=facebook&utm_medium=invoice_launch"

if __name__ == "__main__":
    print("[*] Starting Facebook Dual-Channel Publisher for Invoice Feature...")
    res = post_facebook_dual(
        text=POST_CONTENT,
        image_path=IMAGE_PATH,
        comment_link=COMMENT_LINK,
        target="both",
        headless=True
    )
    print(f"[+] Result: {res}")
