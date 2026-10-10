import os
import sys
import uuid
import requests
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

STATE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "note_state.json"))

def get_cookies():
    with open(STATE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {c["name"]: c["value"] for c in data.get("cookies", [])}

note_id = "184834056"
note_key = "n9a0e993b5438"
title = "【2026年最新】営業リスト・企業データベース主要7社徹底比較！コストとデータ鮮度で選ぶ最適解"

# Chuẩn bị HTML có cấu trúc chuẩn SEO (Heading, Paragraph, Link thẻ <a>, In đậm <strong>)
html_sections = [
    '<p name="{uid}">「新規開拓営業のリスト作成に膨大な時間がかかっている」</p>',
    '<p name="{uid}">「大手企業データベースを導入したいが、月額数万〜数十万円の年間契約縛りで手が出ない」</p>',
    '<p name="{uid}">「テレアポの架電がつながらず、確度の高いアプローチ先が見つからない」</p>',
    '<p name="{uid}"><br></p>',
    '<p name="{uid}">B2Bビジネスにおいて、見込み顧客（リード）の獲得効率は事業成長の生命線です。しかし、多くの営業・マーケティング現場では、上記のような「リスト作成のコストと質」に関する課題を抱えています。</p>',
    '<p name="{uid}">本記事では、2026年現在の日本市場における主要な企業データベース・営業リスト作成サービスを徹底比較し、自社の規模や予算に最適なツールの選び方を分かりやすく解説します。</p>',
    '<p name="{uid}"><br></p>',
    
    '<h2 name="{uid}">■ 2026年、企業データベース選びで失敗しないための「4つの基準」</h2>',
    '<p name="{uid}">従来は「企業データの件数が多いこと」だけが重視されていましたが、現代のアウトバウンド営業では以下の4点が成約率とROIを左右します。</p>',
    '<p name="{uid}"><strong>1. データの網羅性と鮮度</strong>：国税庁法人番号のカバー率、代表者・URL・電話番号の最新性</p>',
    '<p name="{uid}"><strong>2. コスト体系の柔軟性</strong>：年間契約の縛りがないか、月額数千円〜で小規模スタートできるか</p>',
    '<p name="{uid}"><strong>3. 「購買意欲シグナル（インテントデータ）」の有無</strong>：求人募集、補助金採択、入札実績など</p>',
    '<p name="{uid}"><strong>4. アプローチの自動化機能</strong>：リスト抽出から問い合わせフォーム送信までワンストップで完結するか</p>',
    '<p name="{uid}"><br></p>',

    '<h2 name="{uid}">■ 主要企業データベースの特徴とポジショニング比較</h2>',
    '<p name="{uid}">日本の企業情報サービスは、大きく「従来型の大手調査会社」と「クラウド型営業支援ツール」に分かれます。</p>',
    '<h3 name="{uid}">① 帝国データバンク（COSMOS）／東京商工リサーチ（TSR）</h3>',
    '<p name="{uid}">・<strong>特徴</strong>：圧倒的な信用調査力と財務データの詳細さ。与信管理や大企業向け。</p>',
    '<p name="{uid}">・<strong>課題</strong>：導入費用が高額（数十万〜数百万円単位）で、日常的な営業アプローチリストとしてはオーバースペックになりがち。</p>',
    
    '<h3 name="{uid}">② クラウド型営業データベース（Musubu、Baseconnect、SalesMarker等）</h3>',
    '<p name="{uid}">・<strong>特徴</strong>：使いやすいUIと豊富な絞り込み条件。インサイドセールス向け機能が充実。</p>',
    '<p name="{uid}">・<strong>課題</strong>：月額3万円〜10万円以上が主流で、年間契約縛り（年額36万〜120万円一括/縛り）が一般的。スタートアップや中小企業には固定費負担が大きい。</p>',
    
    '<h3 name="{uid}">③ 次世代型スマート企業リスト「Kigyou-list（企業リスト.com）」</h3>',
    '<p name="{uid}">・<strong>特徴</strong>：全国500万社を完全網羅しながら、月額4,980円・年間縛りなしという圧倒的なコストパフォーマンス。</p>',
    '<p name="{uid}">・さらに「ハローワーク求人」「補助金採択」などのインテントデータ標準装備に加え、1通16.1円〜の問い合わせフォーム自動送信まで連携可能。</p>',
    '<p name="{uid}"><br></p>',

    '<h2 name="{uid}">■ なぜ今、多くの企業が「Kigyou-list」に乗り換えているのか？</h2>',
    '<p name="{uid}">現在、スタートアップから中小企業、大手新規事業部まで「Kigyou-list（企業リスト.com）」の導入が急増している理由は主に3つあります。</p>',
    '<p name="{uid}"><strong>【強み1】全国500万社以上！国税庁登記法人を100%カバー</strong><br>地方の中小企業や設立間もないスタートアップまで網羅。業種、地域、資本金、売上規模、設立年など多彩なフィルターでピンポイント検索が可能です。</p>',
    '<p name="{uid}"><strong>【強み2】月額4,980円・年間縛りなしの業界最安級プライス</strong><br>他社ツールのような「1年縛り（途中解約不可）」は一切ありません。必要な月だけ契約し、プロジェクト単位で柔軟に利用できるため、営業ツールのROIを劇的に改善できます。</p>',
    '<p name="{uid}"><strong>【強み3】「いま投資している企業」が分かるインテントデータ</strong><br>単なる会社名だけでなく、「現在ハローワークで採用強化中」「ものづくり補助金・IT導入補助金に採択された」「公共入札を受注した」といった、企業の活発な事業拡大シグナルをもとにアプローチできます。</p>',
    '<p name="{uid}"><br></p>',

    '<h2 name="{uid}">■ 詳しい他社比較表・スペック一覧はこちら</h2>',
    '<p name="{uid}">各ツールの月額料金、初期費用、契約期間、収録件数の詳細な比較チャートは、以下の特設ページにて全公開しています。</p>',
    '<p name="{uid}">👉 <a href="https://kigyoulist.com/ja/compare" target="_blank" rel="noopener">主要企業データベース詳細比較表（料金・機能）：https://kigyoulist.com/ja/compare</a></p>',
    '<p name="{uid}"><br></p>',
    '<p name="{uid}">自社の営業スタイルと予算に合ったツールを選び、新規アポイント獲得の効率化をぜひ実現してください。</p>',
    '<p name="{uid}">▼ <a href="https://kigyoulist.com" target="_blank" rel="noopener">Kigyou-list 公式サイト（無料検索・機能体験はこちら）：https://kigyoulist.com</a></p>'
]

body_html = "".join([s.replace("{uid}", str(uuid.uuid4())) for s in html_sections])

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Origin": "https://note.com",
    "Referer": f"https://editor.note.com/notes/{note_key}/edit",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
}

payload = {
    "body": body_html,
    "body_length": len(body_html),
    "name": title,
    "index": False,
    "is_lead_form": False
}

cookies = get_cookies()
res = requests.post(f"https://note.com/api/v1/text_notes/draft_save?id={note_id}", headers=headers, cookies=cookies, json=payload)
print("Draft Save Status:", res.status_code)
if res.status_code == 201:
    print(f"-> Đã lưu đầy đủ nội dung bài viết thành công vào draft {note_key}!")
    print(f"-> Xem tại: https://note.com/kigyoulist/n/{note_key}")
else:
    print("Error:", res.text)
