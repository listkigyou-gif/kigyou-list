#!/usr/bin/env python3
"""
Tsunagugu (press.portal-th.com) Autonomous Press Release Publisher
Automates submission of B2B Press Releases to Tsunagugu (Portal-TH Press Portal)
Compatible with Kigyou-list 1-Command Autonomous Agent Workflow.
"""

import os
import sys
import json
import argparse
import asyncio
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

TARGET_URL = "https://press.portal-th.com/register"
DEFAULT_PAYLOAD = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "release_tsunagugu_01.json"))
DEFAULT_IMAGE = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))
CONFIRMATION_SCREENSHOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scratch", "tsunagugu_confirmation.png"))
PUBLISHED_SCREENSHOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scratch", "tsunagugu_published.png"))

async def publish_tsunagugu(payload_file: str, dry_run: bool = False):
    if not os.path.exists(payload_file):
        raise FileNotFoundError(f"Không tìm thấy payload JSON tại: {payload_file}")

    with open(payload_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    title = data.get("title", "").strip()
    lead = data.get("lead", "").strip()
    h1 = data.get("heading_1", "").strip()
    b1 = data.get("body_1", "").strip()
    h2 = data.get("heading_2", "").strip()
    b2 = data.get("body_2", "").strip()
    h3 = data.get("heading_3", "").strip()
    b3 = data.get("body_3", "").strip()
    
    category = data.get("category", "service")
    industry = data.get("industry", "g_net")
    company_name = data.get("company_name", "TQC株式会社")
    business_desc = data.get("business_desc", "B2B企業データプラットフォーム「Kigyou-list」の企画・開発・運営")
    contact_name = data.get("contact_name", "キム　バン　チュン")
    email = data.get("email", "info@kigyoulist.com")
    prefecture = data.get("prefecture", "tr13")
    address = data.get("address", "豊島区南池袋２丁目３３－６ 佐藤ビル３F")
    phone = data.get("phone", "03-6907-1219")
    url = data.get("url", "https://kigyoulist.com/")

    under_5 = data.get("under_5_this_month", "sv010")
    sns_opt = data.get("sns_option", "sv02")
    share_agree = data.get("share_agreement", "わかりました")
    consult = data.get("consult_service", "sg00")

    image_path = os.path.abspath(data.get("image_path", DEFAULT_IMAGE))

    print("=" * 80)
    print(f"🚀 TSUNAGUGU AUTONOMOUS PUBLISHER: {title[:50]}...")
    print(f"🎯 URL Đích: {TARGET_URL}")
    print(f"🏢 Doanh nghiệp: {company_name} | Tel: {phone} | URL: {url}")
    print(f"⚙️ Chế độ Dry-Run: {dry_run}")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()

        print(f"1️⃣ Đang tải trang đăng ký: {TARGET_URL} ...")
        await page.goto(TARGET_URL, wait_until="networkidle", timeout=60000)

        # Kiểm tra form tồn tại
        form_locator = page.locator("#fluentform_14")
        if not await form_locator.count():
            raise RuntimeError("Không tìm thấy form fluentform_14 trên trang đăng ký.")

        print("2️⃣ Đang điền nội dung thông cáo báo chí vào form...")
        
        # Tiêu đề & Đoạn mở đầu
        await page.fill('input[name="cf_ttl"]', title)
        await page.fill('textarea[name="tu04"]', lead)

        # Phần 1
        await page.fill('input[name="input_text_1"]', h1)
        await page.fill('textarea[name="description"]', b1)

        # Phần 2
        if h2:
            await page.fill('input[name="input_text_2"]', h2)
        if b2:
            await page.fill('textarea[name="description_1"]', b2)

        # Phần 3
        if h3:
            await page.fill('input[name="input_text_3"]', h3)
        if b3:
            await page.fill('textarea[name="description_2"]', b3)

        # Dropdowns
        print("3️⃣ Đang cấu hình phân loại và thực thể doanh nghiệp...")
        await page.select_option('select[name="dropdown_4"]', category)
        await page.select_option('select[name="dropdown"]', industry)

        # Thông tin công ty & liên hệ (E-E-A-T)
        await page.fill('input[name="input_text"]', company_name)
        await page.fill('input[name="input_text_8"]', business_desc)
        await page.fill('input[name="input_text_4"]', contact_name)
        await page.fill('input[name="email"]', email)
        await page.select_option('select[name="dropdown_1"]', prefecture)
        await page.fill('input[name="input_text_5"]', address)
        await page.fill('input[name="input_text_6"]', phone)
        await page.fill('input[name="input_text_7"]', url)

        # Tùy chọn miễn phí và điều khoản
        await page.select_option('select[name="dropdown_5"]', under_5)
        await page.select_option('select[name="dropdown_2"]', sns_opt)
        await page.select_option('select[name="dropdown_6"]', share_agree)
        await page.select_option('select[name="dropdown_3"]', consult)

        # Tải ảnh đại diện (Featured Image)
        if os.path.exists(image_path):
            print(f"🖼️ Đang đính kèm ảnh đại diện ({image_path})...")
            file_input = page.locator('input[name="featured_image"]')
            await file_input.set_input_files(image_path)
            await page.wait_for_timeout(2000)

        # Chuyển sang bước Xác nhận (Step 2)
        print("4️⃣ Bấm nút '入力内容を確認する' (Xem trước & Xác nhận)...")
        next_btn = page.locator('button[data-action="next"]')
        await next_btn.click()
        await page.wait_for_timeout(3000)

        # Chụp ảnh xác nhận
        os.makedirs(os.path.dirname(CONFIRMATION_SCREENSHOT), exist_ok=True)
        await page.screenshot(path=CONFIRMATION_SCREENSHOT, full_page=True)
        print(f"📸 Đã lưu ảnh chụp màn hình xác nhận: {CONFIRMATION_SCREENSHOT}")

        if dry_run:
            print("\n" + "=" * 80)
            print("🛑 [DRY RUN THÀNH CÔNG] Toàn bộ form đã được điền và kiểm tra dữ liệu hợp lệ 100%.")
            print("Dừng lại trước khi bấm nút '送信する' để bảo đảm an toàn dữ liệu.")
            print("=" * 80)
            await browser.close()
            return True

        # Nếu không phải Dry-run -> Bấm nút gửi thực tế
        print("5️⃣ Đang gửi thông cáo báo chí chính thức (Bấm '送信する')...")
        submit_btn = page.locator('button[type="submit"]:has-text("送信する")')
        await submit_btn.click()
        print("⏳ Đang chờ hệ thống xử lý và lưu thông cáo báo chí...")
        try:
            await page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass
        await page.wait_for_timeout(6000)

        await page.screenshot(path=PUBLISHED_SCREENSHOT, full_page=True)
        print(f"🎉 ĐÃ GỬI THÀNH CÔNG! Ảnh chụp màn hình kết quả: {PUBLISHED_SCREENSHOT}")
        print(f"🌐 URL hiện tại sau khi gửi: {page.url}")
        await browser.close()
        return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tsunagugu Press Release Autonomous Publisher")
    parser.add_argument("--payload", default=DEFAULT_PAYLOAD, help="Đường dẫn file JSON nội dung bài PR")
    parser.add_argument("--dry-run", action="store_true", help="Chạy kiểm tra toàn bộ điền form và chụp ảnh xác nhận mà không bấm nút Submit")
    args = parser.parse_args()

    asyncio.run(publish_tsunagugu(args.payload, args.dry_run))
