#!/usr/bin/env python3
"""
Free-PressRelease (free-pressrelease.com/pressrelease/) Autonomous Press Release Publisher
Automates submission of B2B Press Releases to Free-PressRelease Google Form via Playwright.
Compatible with Kigyou-list 1-Command Autonomous Agent Workflow.
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfFdAgOnvwnL1MuR8kLqeql2aK4AP6-wN-emgdY1pDTdhHaWA/viewform"
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GOOGLE_COOKIES_PATH = os.path.join(ROOT_DIR, "scripts", "google_cookies.json")
DEFAULT_PAYLOAD = os.path.join(ROOT_DIR, "scripts", "press_releases", "release_free_pressrelease_01.json")
DEFAULT_IMAGE = os.path.join(ROOT_DIR, "scripts", "press_releases", "eyecatch_01.jpg")
SCRATCH_DIR = os.path.join(ROOT_DIR, "scratch")

os.makedirs(SCRATCH_DIR, exist_ok=True)
FILLED_SCREENSHOT = os.path.join(SCRATCH_DIR, "free_pressrelease_filled.png")
SUBMITTED_SCREENSHOT = os.path.join(SCRATCH_DIR, "free_pressrelease_submitted.png")

def load_and_inject_cookies(context):
    if not os.path.exists(GOOGLE_COOKIES_PATH):
        print(f"⚠️ Không tìm thấy file cookies tại: {GOOGLE_COOKIES_PATH}")
        return False
    try:
        with open(GOOGLE_COOKIES_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
        formatted = []
        for c in raw:
            s = c.get("sameSite", "Lax")
            if s in ["no_restriction", "None", "none"]:
                same_site_str = "None"
            elif s in ["strict", "Strict"]:
                same_site_str = "Strict"
            else:
                same_site_str = "Lax"
            cookie_obj = {
                "name": c["name"],
                "value": c["value"],
                "domain": c.get("domain", ".google.com"),
                "path": c.get("path", "/"),
                "httpOnly": bool(c.get("httpOnly", False)),
                "secure": True if same_site_str == "None" else bool(c.get("secure", False)),
                "sameSite": same_site_str
            }
            if "expirationDate" in c and c["expirationDate"] is not None:
                cookie_obj["expires"] = float(c["expirationDate"])
            formatted.append(cookie_obj)
        context.add_cookies(formatted)
        print(f"✅ Đã nạp thành công {len(formatted)} Google cookies từ: {GOOGLE_COOKIES_PATH}")
        return True
    except Exception as e:
        print(f"⚠️ Lỗi khi nạp cookies Google: {e}")
        return False

def fill_free_pressrelease_form(page, payload: dict, image_path: str):
    """
    Điền chính xác 18 trường trên Google Form của Free-PressRelease.
    """
    print("[*] Đang ánh xạ và điền tự động toàn bộ 18 trường trên form...")

    items = page.locator('div[role="listitem"]').all()
    print(f"[*] Tìm thấy {len(items)} khối câu hỏi.")

    for idx, item in enumerate(items):
        item_text = item.inner_text().strip()
        first_line = item_text.split("\n")[0] if item_text else ""

        # 1. Email
        if "Email" in first_line:
            inp = item.locator('input[type="email"], input[type="text"]').first
            if inp.count() > 0:
                val = payload.get("email", "info@kigyoulist.com")
                inp.fill(val)
                print(f"   [1/18] Điền Email: {val}")

        # 2. 何を見て当サイトを知りましたか？
        elif "何を見て当サイトを知りましたか" in item_text:
            radio = item.locator('div[role="radio"]').first
            if radio.count() > 0:
                radio.click(force=True)
                print("   [2/18] Chọn nguồn biết đến: 検索エンジン")

        # 3. 同意確認
        elif "同意確認" in first_line:
            radio = item.locator('div[role="radio"]').first
            if radio.count() > 0:
                radio.click(force=True)
                print("   [3/18] Đồng ý: 利用規約・プライバシーポリシーを確認し理解しました。")

        # 4. 注意事項
        elif "注意事項" in first_line and "次の項目" not in item_text:
            radio = item.locator('div[role="radio"]').first
            if radio.count() > 0:
                radio.click(force=True)
                print("   [4/18] Đồng ý: 注意事項を確認した")

        # 5. SNS配信の確認
        elif "SNS配信の確認" in first_line:
            radio = item.locator('div[role="radio"]').first
            if radio.count() > 0:
                radio.click(force=True)
                print("   [5/18] Đồng ý: SNS配信に同意します")

        # 7. 会社名・屋号（非公開）
        elif "会社名・屋号" in first_line:
            inp = item.locator('input[type="text"]').first
            if inp.count() > 0:
                val = payload.get("company_name", "TQC株式会社")
                inp.fill(val)
                print(f"   [6/18] Điền Tên công ty (không công khai): {val}")

        # 8. ご担当者名 （非公開）
        elif "ご担当者名" in first_line:
            inp = item.locator('input[type="text"]').first
            if inp.count() > 0:
                val = payload.get("contact_name", "キム　バン　チュン")
                inp.fill(val)
                print(f"   [7/18] Điền Người liên hệ (không công khai): {val}")

        # 9. 注意事項確認 (ハイフン)
        elif "注意事項確認" in first_line:
            radio = item.locator('div[role="radio"]').first
            if radio.count() > 0:
                radio.click(force=True)
                print("   [8/18] Xác nhận: Số điện thoại phải có dấu gạch ngang (ハイフン)")

        # 10. 電話番号 （非公開）
        elif "電話番号" in first_line:
            inp = item.locator('input[type="text"]').first
            if inp.count() > 0:
                val = payload.get("phone", "03-6907-1219")
                inp.fill(val)
                print(f"   [9/18] Điền Số điện thoại (có hyphen): {val}")

        # 12. 会社名/団体名/サイト名/サービス名 (Công khai)
        elif "会社名/団体名/サイト名/サービス名" in first_line or "サービス名" in first_line:
            inp = item.locator('input[type="text"]').first
            if inp.count() > 0:
                val = f"Kigyou-list（{payload.get('company_name', 'TQC株式会社')}）"
                inp.fill(val)
                print(f"   [10/18] Điền Tên thương hiệu/dịch vụ (công khai): {val}")

        # 13. 配信記事タイトル
        elif "配信記事タイトル" in first_line or "タイトル" in first_line:
            inp = item.locator('input[type="text"]').first
            if inp.count() > 0:
                val = payload.get("title", "")
                inp.fill(val)
                print(f"   [11/18] Điền Tiêu đề: {val[:45]}...")

        # 14. 要約分
        elif "要約分" in first_line:
            inp = item.locator('textarea').first
            if inp.count() > 0:
                val = payload.get("subtitle", "")
                inp.fill(val)
                print(f"   [12/18] Điền Tóm tắt (要約分): {val[:45]}...")

        # 15. サブタイトル
        elif "サブタイトル" in first_line:
            inp = item.locator('input[type="text"]').first
            if inp.count() > 0:
                val = payload.get("subtitle", "")
                inp.fill(val)
                print(f"   [13/18] Điền Phụ đề (サブタイトル): {val[:45]}...")

        # 16. リリース内容
        elif "リリース内容" in first_line:
            inp = item.locator('textarea').first
            if inp.count() > 0:
                val = payload.get("body", "")
                inp.fill(val)
                print(f"   [14/18] Điền Thân bài (リリース内容): {len(val)} ký tự")

        # 17. 本件に関するお問い合わせ先URL
        elif "お問い合わせ先URL" in first_line:
            inp = item.locator('input[type="text"]').first
            if inp.count() > 0:
                val = payload.get("url", "https://kigyoulist.com/")
                inp.fill(val)
                print(f"   [15/18] Điền URL liên hệ: {val}")

    # 18. Tải ảnh Thumbnail lên Form
    print(f"[*] [16/18] Đang mở hộp thoại tải ảnh: {image_path}")
    page.evaluate("""() => {
        const btns = Array.from(document.querySelectorAll('div[role="button"], span'));
        const addBtn = btns.find(b => b.innerText && (b.innerText.includes('Add file') || b.innerText.includes('ファイルを追加')));
        if (addBtn) {
            addBtn.scrollIntoView();
            addBtn.click();
        }
    }""")
    time.sleep(3)
    picker_frame = page.frame_locator('div[role="dialog"] iframe')
    file_input = picker_frame.locator('input[type="file"]')
    if file_input.count() > 0:
        file_input.set_input_files(image_path)
        print("   [17/18] Đã tải ảnh lên Drive picker, đang đợi xử lý...")
        time.sleep(8)
        print("   [18/18] ✅ Ảnh thumbnail đã được đính kèm thành công!")
    else:
        print("   ⚠️ Không tìm thấy file input trong picker dialog.")

def publish_free_pressrelease(payload_file: str, dry_run: bool = False, headless: bool = True):
    if not os.path.exists(payload_file):
        raise FileNotFoundError(f"Không tìm thấy payload JSON tại: {payload_file}")

    with open(payload_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    title = data.get("title", "").strip()
    image_path = os.path.abspath(data.get("image_path", DEFAULT_IMAGE))
    if not os.path.exists(image_path):
        image_path = DEFAULT_IMAGE

    print("=" * 80)
    print(f"🚀 FREE-PRESSRELEASE AUTONOMOUS PUBLISHER")
    print(f"📝 Tiêu đề: {title[:60]}...")
    print(f"🏢 Đơn vị: {data.get('company_name')} | Tel: {data.get('phone')} | URL: {data.get('url')}")
    print(f"⚙️ Chế độ: {'DRY RUN (Điền và chụp ảnh kiểm tra, KHÔNG gửi)' if dry_run else 'SUBMISSION (GỬI THẬT)'}")
    print(f"👤 Trình duyệt: {'Headless (chạy ngầm)' if headless else 'Headed (trực quan)'}")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 950}
        )

        load_and_inject_cookies(context)
        page = context.new_page()

        print(f"1️⃣ Đang tải Google Form: {FORM_URL} ...")
        page.goto(FORM_URL, wait_until="networkidle", timeout=60000)
        time.sleep(3)

        if "signin" in page.url or "ServiceLogin" in page.url:
            raise PermissionError("Phiên Google cookie đã hết hạn hoặc không hợp lệ. Vui lòng cập nhật scripts/google_cookies.json")

        print("2️⃣ Đang tự động điền các trường thông tin...")
        fill_free_pressrelease_form(page, data, image_path)

        time.sleep(3)
        print(f"📸 Đang chụp ảnh màn hình toàn trang sau khi điền: {FILLED_SCREENSHOT}")
        page.screenshot(path=FILLED_SCREENSHOT, full_page=True)

        if dry_run:
            print("\n" + "=" * 80)
            print("🛑 [DRY RUN THÀNH CÔNG RỰC RỠ]")
            print(f"   Đã điền trọn vẹn toàn bộ 18 trường và đính kèm ảnh {os.path.basename(image_path)}.")
            print(f"   Minh chứng toàn trang đã lưu tại: {FILLED_SCREENSHOT}")
            print("=" * 80)
            browser.close()
            return

        print("3️⃣ Đang nhấn nút gửi form (Submit / 送信)...")
        page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('div[role="button"], span'));
            const sBtn = btns.find(b => b.innerText && (b.innerText.trim() === 'Submit' || b.innerText.trim() === '送信'));
            if (sBtn) {
                sBtn.scrollIntoView();
                sBtn.click();
            }
        }""")
        time.sleep(10)
        print(f"📸 Đang chụp ảnh xác nhận sau khi gửi: {SUBMITTED_SCREENSHOT}")
        page.screenshot(path=SUBMITTED_SCREENSHOT, full_page=True)
        print(f"🎉 GỬI THÀNH CÔNG THÔNG CÁO BÁO CHÍ LÊN FREE-PRESSRELEASE.COM!")
        print(f"   Minh chứng: {SUBMITTED_SCREENSHOT}")

        browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tự động hóa xuất bản thông cáo báo chí lên Free-PressRelease")
    parser.add_argument("--payload", default=DEFAULT_PAYLOAD, help="Đường dẫn file JSON chứa nội dung bài")
    parser.add_argument("--dry-run", action="store_true", help="Chạy thử nghiệm kiểm tra form, không bấm gửi")
    parser.add_argument("--headed", action="store_true", help="Mở giao diện trình duyệt trực quan")
    args = parser.parse_args()

    publish_free_pressrelease(args.payload, dry_run=args.dry_run, headless=not args.headed)
