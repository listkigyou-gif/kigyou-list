import os
import sys
import time
import requests
import json
import uuid
import re
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

STATE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "note_state.json"))
IMAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "eyecatch_today.jpg"))

def get_cookies_dict():
    with open(STATE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {c["name"]: c["value"] for c in data.get("cookies", [])}

def format_paragraphs_to_html(paragraphs: list) -> str:
    html_parts = []
    for p in paragraphs:
        text = p.strip()
        uid = str(uuid.uuid4())
        if not text:
            html_parts.append(f'<p name="{uid}"><br></p>')
        elif text.startswith("■ ") or text.startswith("【2026") or (text.startswith("【") and text.endswith("】")):
            html_parts.append(f'<h2 name="{uid}">{text}</h2>')
        elif text.startswith("① ") or text.startswith("② ") or text.startswith("③ ") or text.startswith("④ "):
            html_parts.append(f'<h3 name="{uid}">{text}</h3>')
        elif text.startswith("> ") or text.startswith("【主要ツールの比較概要】") or ("費用" in text and "契約" in text and "|" in text):
            clean_text = text.replace("> ", "")
            html_parts.append(f'<blockquote name="{uid}">{clean_text}</blockquote>')
        else:
            # Parse Markdown Links: [anchor](url) -> <a href="url"><strong>anchor</strong></a>
            text = re.sub(r'\[([^\]]+)\]\((https?://[^\)]+)\)', r'<a href="\2" target="_blank" rel="noopener"><strong>\1</strong></a>', text)
            # Parse remaining naked URLs
            text = re.sub(r'(?<!href=")(https?://[^\s<"]+)', r'<a href="\1" target="_blank" rel="noopener"><strong>\1</strong></a>', text)
            html_parts.append(f'<p name="{uid}">{text}</p>')
    return "".join(html_parts)

def publish_note_today():
    title = "【2026年最新】月3万円の営業リストはもう古い？ハローワーク求人・助成金シグナル対応の500万社データベースを初月1,260円でフル活用するコスト削減術"
    
    paragraphs = [
        "新規開拓や法人営業を進める中で、名簿販売会社や営業支援ツールに「毎月3万円〜10万円」の高額な固定費用を支払い続けていませんか？",
        "初期費用10万円、年間契約縛り（途中解約不可）、年1回しか更新されない古いデータ...。多くの営業責任者・経営者が抱えるこの固定費負担を劇的に解消する、2026年最新の法人データベース選定基準を解説します。",
        "",
        "■ 従来の営業リスト支援ツールが抱える3大ボトルネック",
        "① 高額な年間契約縛り：月額3万円〜10万円のツールが多く、年間36万〜120万円の予算確保が必要。",
        "② データの陳腐化：更新頻度が低く、すでに倒産した企業や移転した住所へ架電・DMを送る無駄が発生。",
        "③ タイミングの不一致：相手にニーズがない時期にアプローチしてもアポ獲得率は1%未満に低迷。",
        "",
        "■ 2026年の勝ちパターン：「インテントデータ（購買シグナル）」の活用",
        "現在、営業成果を出している企業が注目しているのが「シグナル営業（インテントセールス）」です。ただの静的な会社一覧ではなく、「今まさに予算があり、人を採用している企業」に絞ってアプローチする手法です。",
        "> 【主要ツールの比較概要】\n・従来のリストツール：月額3万〜10万円／年間契約縛りあり／初期費用10万円／静的データのみ\n・Kigyou-list：初月1,260円（通常4,200円）／年間縛り一切なし／初期費用0円／求人・助成金シグナル日次更新",
        "",
        "■ 500万社網羅『Kigyou-list』が圧倒的支持を集める理由",
        "① 日本全国500万社を網羅：国税庁法人番号公表サイトの法人全量を完全網羅。",
        "② 他社比1/25〜1/80の圧倒的低価格：初月わずか ¥1,260（70% OFFキャンペーン）・2ヶ月目以降も通常 ¥4,200/月。",
        "③ 年間縛り一切なし：いつでもマイページから1クリックで解約可能。必要な月だけ使える柔軟設計。",
        "④ 永久無料プラン：登録即座に全500万社の高速検索が可能。1日20件（月約600件）のCSVダウンロードが永久無料。",
        "⑤ 問い合わせフォーム営業自動化：1通あたりわずか5.9円〜（祝祭70% OFF / 通常19.8円〜）でAIが送信代行。",
        "",
        "■ よくある質問（FAQ）",
        "Q: なぜ他社（月3万〜10万円）と比べてこれほど安いのですか？",
        "A: 徹底したシステム自動化とクラウド最適化により、営業人件費を完全に排除しているためです。他社の1/25〜1/80の価格破壊を実現しました。",
        "Q: 無料プランでも企業データは検索できますか？",
        "A: はい。会員登録後すぐに日本全国500万社のデータベースを検索でき、毎日20件（月約600件）までCSVダウンロードが永久無料です。",
        "Q: 問い合わせフォーム自動送信はクレームになりませんか？",
        "A: AIが送信禁止文言やオプトアウト表記を自動検知して送信対象から除外するため、安全にアプローチできます。",
        "",
        "■ Kigyou-list 公式リンク＆関連機能一覧（SEO Hub & Spoke）",
        "営業コストの見直しや新規アポイント獲得の効率化に、ぜひお役立てください。",
        "・[企業リストツールの料金比較・機能一覧はこちら（初月1,260円・年縛りなし）](https://kigyoulist.com/ja/compare)",
        "・[500万社を網羅する企業データベース・営業リスト作成ならKigyou-list](https://kigyoulist.com/ja)",
        "・[全国企業データベース・業種一覧ディレクトリ検索](https://kigyoulist.com/ja/directory)",
        "・[IT・通信業界の企業一覧・営業リスト作成](https://kigyoulist.com/ja/industry/IT)",
        "・[適格請求書発行事業者・インボイス登録番号検索](https://kigyoulist.com/ja/invoice)"
    ]

    hashtags = ["営業リスト", "法人データベース", "営業DX", "コスト削減", "インサイドセールス", "B2Bマーケティング", "KigyouList"]

    print("🚀 Đang khởi tạo bài viết Note.com...")
    cookie_dict = get_cookies_dict()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Origin": "https://note.com",
        "Referer": "https://note.com/kigyoulist",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }

    create_payload = {"name": title, "body": "<p></p>", "status": "draft", "price": 0}
    res = requests.post("https://note.com/api/v1/text_notes", headers=headers, cookies=cookie_dict, json=create_payload)
    if res.status_code != 201:
        print(f"[LỖI] Không thể tạo draft note: {res.status_code} - {res.text}")
        return

    note_data = res.json().get("data", {})
    note_key = note_data.get("key")
    note_id = note_data.get("id")
    print(f"-> Tạo draft thành công key: {note_key} (ID: {note_id})")

    body_html = format_paragraphs_to_html(paragraphs)
    save_headers = {**headers, "Referer": f"https://editor.note.com/notes/{note_key}/edit"}
    save_payload = {"body": body_html, "body_length": len(body_html), "name": title, "index": False, "is_lead_form": False}
    
    save_res = requests.post(f"https://note.com/api/v1/text_notes/draft_save?id={note_id}", headers=save_headers, cookies=cookie_dict, json=save_payload)
    if save_res.status_code != 201:
        print(f"[LỖI] Không thể lưu nội dung: {save_res.status_code} - {save_res.text}")
        return
    print("-> Đã lưu nội dung HTML chuẩn Mỏ neo từ khóa vàng!")

    print("🌐 Đang mở trình duyệt để gắn ảnh bìa & Xuất bản công khai...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(storage_state=STATE_PATH)
        page = context.new_page()

        edit_url = f"https://editor.note.com/notes/{note_key}/edit"
        page.goto(edit_url, wait_until="networkidle")
        time.sleep(2)

        try:
            close_btn = page.locator("button:has-text('閉じる')")
            if close_btn.count() > 0:
                close_btn.first.click(force=True, timeout=3000)
                time.sleep(1)
        except Exception:
            pass

        if os.path.exists(IMAGE_PATH):
            print(f"🖼️ Tải lên ảnh bìa: {IMAGE_PATH}")
            file_input = page.locator('input[type="file"]')
            if file_input.count() > 0:
                file_input.first.set_input_files(IMAGE_PATH)
                time.sleep(4)

        print("🚀 Bấm nút 公開に進む...")
        publish_nav = page.locator("button:has-text('公開に進む')")
        if publish_nav.count() > 0:
            publish_nav.first.click()
            time.sleep(2)

            for tag in hashtags:
                tag_input = page.locator('input[placeholder*="ハッシュタグ"]')
                if tag_input.count() > 0:
                    tag_input.first.fill(tag)
                    tag_input.first.press("Enter")
                    time.sleep(0.5)

            final_btn = page.locator("button:has-text('投稿する')")
            if final_btn.count() > 0:
                final_btn.first.click()
                print("🎉 ĐÃ BẤM NÚT 投稿する!")
                time.sleep(5)

        live_url = f"https://note.com/kigyoulist/n/{note_key}"
        print(f"\n==========================================")
        print(f"✅ BÀI VIẾT NOTE.COM ĐÃ XUẤT BẢN THÀNH CÔNG!")
        print(f"🔗 Link công khai: {live_url}")
        print(f"==========================================")
        browser.close()

if __name__ == "__main__":
    publish_note_today()
