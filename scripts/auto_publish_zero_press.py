#!/usr/bin/env python3
"""
Zero-Press Autonomous Publisher for Kigyou-list (kigyoulist.com)
Zero-Press (zero-press.net) 1-Command Autonomous Publisher via Playwright
Distributes Press Release free of charge (0 JPY) to Zero-Press and 20 major media outlets.
"""

import os
import sys
import json
import argparse
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

COOKIE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "zero_press_cookies.json"))
DEFAULT_IMAGE = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

async def publish_zero_press(payload_file: str, dry_run: bool = False):
    if not os.path.exists(COOKIE_PATH):
        raise FileNotFoundError(f"Không tìm thấy file cookie session tại: {COOKIE_PATH}")

    with open(payload_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    title = data.get("title", "").strip()
    summary = data.get("summary", "").strip()
    body_html = data.get("body_html", "").strip()
    category = data.get("category", "tech") # product, business, tech, hr, research, other
    delivery = data.get("delivery", "published") # published, scheduled, draft
    schedule_at = data.get("schedule_at", None) # YYYY-MM-DDTHH:MM
    image_path = os.path.abspath(data.get("image_path", DEFAULT_IMAGE))

    if not title or not summary or not body_html:
        raise ValueError("Payload phải bao gồm đầy đủ title, summary và body_html.")

    with open(COOKIE_PATH, "r", encoding="utf-8") as f:
        cookies = json.load(f)

    formatted_cookies = []
    for c in cookies:
        c_copy = dict(c)
        if c_copy.get("sameSite") not in ["Strict", "Lax", "None"]:
            c_copy["sameSite"] = "Lax"
        formatted_cookies.append(c_copy)

    print("=" * 80)
    print(f"🚀 ZERO-PRESS AUTONOMOUS PUBLISHER: {title[:50]}...")
    print(f"📁 Category: {category} | Delivery: {delivery} | DryRun: {dry_run}")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        await context.add_cookies(formatted_cookies)
        page = await context.new_page()

        # Step 1: Open New Article Editor
        print("1️⃣ Đang mở trang soạn thảo STEP 1: https://zero-press.net/mypage/articles/new ...")
        await page.goto("https://zero-press.net/mypage/articles/new", wait_until="networkidle")

        if "/login" in page.url:
            raise PermissionError("Session đã hết hạn. Cần cập nhật cookie mới vào scripts/zero_press_cookies.json")

        print("✍️ Đang điền Tiêu đề và Tóm tắt...")
        await page.fill('input[name="title"]', title)
        await page.fill('textarea[name="summary"]', summary)

        print("📝 Đang chèn nội dung HTML vào trình soạn thảo...")
        await page.evaluate("""(html) => {
            const ed = document.getElementById('editor-body');
            ed.innerHTML = html;
            ed.dispatchEvent(new Event('input', { bubbles: true }));
        }""", body_html)

        print(f"🖼️ Đang tải ảnh Banner lên Zero-Press ({image_path})...")
        thumb_input = page.locator('#thumb-input')
        await thumb_input.set_input_files(image_path)

        # Chờ upload hoàn tất
        print("⏳ Đang chờ xác nhận ảnh từ Cloud Storage...")
        await page.wait_for_function("() => document.querySelector('input[name=\"hero_image_url\"]').value.length > 0", timeout=20000)
        hero_url = await page.eval_on_selector('input[name="hero_image_url"]', 'el => el.value')
        print(f"✅ Ảnh Thumbnail đã sẵn sàng: {hero_url}")

        if dry_run:
            print("🛑 [DRY RUN] Đã hoàn thành Step 1. Dừng trước khi lưu.")
            await browser.close()
            return

        print("➡️ Tiến hành lưu STEP 1 và chuyển tiếp sang STEP 2...")
        await page.click('#save-btn')
        await page.wait_for_timeout(4000)

        # Step 2: Category & Delivery Setting
        print(f"2️⃣ Đang cấu hình STEP 2 tại: {page.url}")
        await page.wait_for_selector('form#step2-form', timeout=15000)

        print(f"📌 Đang chọn Chuyên mục: {category} và Hình thức: {delivery}...")
        await page.evaluate("""([cat, deliv]) => {
            const catRadio = document.querySelector(`input[name="category"][value="${cat}"]`) || document.querySelector('input[name="category"][value="tech"]');
            if (catRadio) {
                catRadio.checked = true;
                catRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            const delivRadio = document.querySelector(`input[name="delivery"][value="${deliv}"]`) || document.querySelector('input[name="delivery"][value="published"]');
            if (delivRadio) {
                delivRadio.checked = true;
                delivRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }""", [category, delivery])

        if delivery == "scheduled" and schedule_at:
            print(f"⏰ Cài đặt lịch phát hành: {schedule_at}")
            await page.fill('input[name="schedule_at"]', schedule_at)

        print("➡️ Xác nhận STEP 2 -> Chuyển vào Màn hình kiểm tra STEP 3...")
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(3000)

        # Step 3: Confirm & Publish
        print(f"3️⃣ Đang xử lý STEP 3 xác nhận cuối cùng tại: {page.url}")
        await page.wait_for_selector('form#confirm-form', timeout=15000)

        print("✅ Đang tích chọn xác nhận điều khoản và liên kết...")
        await page.evaluate("""() => {
            document.querySelectorAll('input[name="consent"]').forEach(c => {
                c.checked = true;
                c.dispatchEvent(new Event('change', { bubbles: true }));
            });
        }""")
        await page.wait_for_timeout(1000)

        print("🚀 Bấm nút PHÁT HÀNH CHÍNH THỨC (Delivery Confirm)...")
        confirm_btn = page.locator('#confirm-form button[type="submit"]')
        await confirm_btn.click()
        await page.wait_for_timeout(5000)

        print(f"🏁 Hoàn tất xuất bản! URL chuyển hướng: {page.url}")
        screenshot_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scratch", "zero_press_published.png"))
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"📸 Đã lưu ảnh minh chứng xác nhận tại: {screenshot_path}")

        # Lấy URL bài viết vừa đăng trên trang quản trị
        await page.goto("https://zero-press.net/mypage/articles", wait_until="networkidle")
        latest_article = await page.evaluate("""() => {
            const pubLinks = Array.from(document.querySelectorAll('a[href*="/p/"]'));
            return pubLinks.length > 0 ? pubLinks[0].href : null;
        }""")
        if latest_article:
            print(f"🌟 BÀI VIẾT ĐÃ CHÍNH THỨC LÊN SÓNG TẠI: {latest_article}")
        else:
            print("🌟 Bài viết đã được ghi nhận thành công trên danh mục quản lý của Zero-Press!")

        await browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Zero-Press Autonomous Publisher")
    parser.add_argument("--json", required=True, help="Đường dẫn file JSON chứa payload bài viết")
    parser.add_argument("--dry-run", action="store_true", help="Chạy kiểm thử không phát hành thật")
    args = parser.parse_args()

    asyncio.run(publish_zero_press(args.json, args.dry_run))
