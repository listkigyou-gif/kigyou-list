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

def get_cookies_dict():
    with open(STATE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {c["name"]: c["value"] for c in data.get("cookies", [])}

def format_paragraphs_to_html(paragraphs: list) -> str:
    """Chuyển đổi danh sách đoạn văn/tiêu đề thành HTML Note chuẩn SEO & GEO"""
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
        elif text.startswith("> ") or text.startswith("【主要ツールの比較概要】") or "費用" in text and "契約" in text and "|" in text:
            clean_text = text.replace("> ", "")
            html_parts.append(f'<blockquote name="{uid}">{clean_text}</blockquote>')
        elif text.startswith("http://") or text.startswith("https://"):
            html_parts.append(f'<p name="{uid}"><a href="{text}" target="_blank" rel="noopener"><strong>{text}</strong></a></p>')
        else:
            if "https://" in text or "http://" in text:
                text = re.sub(r'(https?://[^\s]+)', r'<a href="\1" target="_blank" rel="noopener"><strong>\1</strong></a>', text)
            html_parts.append(f'<p name="{uid}">{text}</p>')
    return "".join(html_parts)

def create_note(title: str, content_paragraphs: list, hashtags: list = None, image_path: str = None, publish: bool = False):
    """
    Quy trình tự động hóa xuất bản toàn diện cho Note.com:
    - title: Tiêu đề bài viết
    - content_paragraphs: Danh sách các đoạn văn bản (paragraphs)
    - hashtags: Danh sách hashtag tiếng Nhật (không dấu #)
    - image_path: Đường dẫn tuyệt đối của ảnh bìa (16:9 / 1280x670)
    - publish: True để xuất bản công khai ngay, False để lưu nháp
    """
    print(f"\n[1/3] Khởi tạo bài viết trên Note.com...")
    cookie_dict = get_cookies_dict()
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Origin": "https://note.com",
        "Referer": "https://note.com/kigyoulist",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }

    create_payload = {
        "name": title,
        "body": "<p></p>",
        "status": "draft",
        "price": 0
    }

    res = requests.post("https://note.com/api/v1/text_notes", headers=headers, cookies=cookie_dict, json=create_payload)
    if res.status_code != 201:
        print(f"[LỖI] Không thể tạo draft note: {res.status_code} - {res.text}")
        return None

    note_data = res.json().get("data", {})
    note_key = note_data.get("key")
    note_id = note_data.get("id")
    print(f"-> Khởi tạo thành công draft key: {note_key} (ID: {note_id})")

    # Format nội dung thành HTML chuẩn
    print(f"\n[2/3] Lưu toàn bộ nội dung, Heading, FAQ & Backlink (SEO & AI Search)...")
    body_html = format_paragraphs_to_html(content_paragraphs)
    save_headers = {
        **headers,
        "Referer": f"https://editor.note.com/notes/{note_key}/edit"
    }
    save_payload = {
        "body": body_html,
        "body_length": len(body_html),
        "name": title,
        "index": False,
        "is_lead_form": False
    }

    save_res = requests.post(f"https://note.com/api/v1/text_notes/draft_save?id={note_id}", headers=save_headers, cookies=cookie_dict, json=save_payload)
    if save_res.status_code != 201:
        print(f"[LỖI] Không thể lưu nội dung draft: {save_res.status_code} - {save_res.text}")
        return None

    print(f"-> Đã lưu hoàn tất nội dung thân bài!")

    # Xử lý ảnh bìa và xuất bản nếu cần
    needs_browser = bool(image_path or publish)
    if not needs_browser:
        print(f"\n[THÀNH CÔNG] Đã lưu bản nháp!")
        print(f"👉 Link xem trước: https://note.com/kigyoulist/n/{note_key}")
        print(f"👉 Link chỉnh sửa: https://editor.note.com/notes/{note_key}/edit")
        return f"https://note.com/kigyoulist/n/{note_key}"

    print(f"\n[3/3] Đang xử lý giao diện (Tải ảnh bìa / Xuất bản)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(storage_state=STATE_PATH)
        page = context.new_page()

        edit_url = f"https://editor.note.com/notes/{note_key}/edit"
        page.goto(edit_url, wait_until="networkidle")
        time.sleep(2)

        # Đóng popup nếu có
        close_btn = page.locator("button:has-text('閉じる')")
        if close_btn.count() > 0:
            close_btn.first.click()
            time.sleep(1)

        # Tải ảnh bìa nếu có
        if image_path and os.path.exists(image_path):
            print(f"-> Đang tải ảnh bìa: {os.path.basename(image_path)}...")
            round_btn = page.locator(".rounded-full.h-10.w-10").first
            if round_btn.count() > 0:
                round_btn.click()
                time.sleep(1)

                with page.expect_file_chooser() as fc_info:
                    page.locator("text='画像をアップロード'").first.click()
                fc_info.value.set_files(image_path)
                time.sleep(4)

                # Xác nhận modal cắt ảnh
                save_crop = page.locator(".ReactModalPortal button:has-text('保存')")
                if save_crop.count() > 0:
                    save_crop.first.click()
                    time.sleep(3)
                print("-> Đã gắn ảnh bìa thành công!")

        if not publish:
            # Lưu bản nháp kèm ảnh
            save_btn = page.locator("header button:has-text('下書き保存'), button:has-text('下書き保存')").first
            if save_btn.count() > 0 and save_btn.is_enabled():
                save_btn.click()
                time.sleep(3)
            print(f"\n[THÀNH CÔNG] Bản nháp kèm ảnh bìa đã hoàn tất!")
            print(f"👉 Link xem trước: https://note.com/kigyoulist/n/{note_key}")
            print(f"👉 Link chỉnh sửa: {edit_url}")
            browser.close()
            return f"https://note.com/kigyoulist/n/{note_key}"
        else:
            # Xuất bản công khai
            print("-> Đang tiến hành xuất bản công khai...")
            publish_btn = page.locator("button:has-text('公開に進む')").first
            if publish_btn.count() > 0:
                publish_btn.click()
                time.sleep(3)

                if hashtags:
                    tag_input = page.locator("input[placeholder*='ハッシュタグ'], input[placeholder*='タグ']").first
                    if tag_input.count() > 0:
                        for tag in hashtags:
                            tag_input.fill(tag)
                            page.keyboard.press("Enter")
                            time.sleep(0.4)

                final_post_btn = page.locator("button:has-text('投稿する'), button:has-text('公開する')").first
                if final_post_btn.count() > 0:
                    final_post_btn.click()
                    time.sleep(4)
                    print(f"\n[XUẤT BẢN THÀNH CÔNG] Bài viết đã chính thức lên sóng công khai!")
                    print(f"👉 https://note.com/kigyoulist/n/{note_key}")

            browser.close()
            return f"https://note.com/kigyoulist/n/{note_key}"
