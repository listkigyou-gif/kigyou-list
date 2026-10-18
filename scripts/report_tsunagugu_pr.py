#!/usr/bin/env python3
"""
Tsunagugu PR Share Reporter
Automates submitting proof of PR sharing to Tsunagugu's Google Form:
https://docs.google.com/forms/d/e/1FAIpQLSeYjcdUHH9BZh63nUdCizAvOoZZ4fijAu5vuExbu9GULO7Wfw/viewform
"""

import os
import sys
import argparse
import asyncio
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeYjcdUHH9BZh63nUdCizAvOoZZ4fijAu5vuExbu9GULO7Wfw/viewform"
DEFAULT_TITLE = "国内最大級500万件超の企業データベース「Kigyou-list」、完全無料で高精度な企業リスト作成・ダウンロード機能を提供開始"
DEFAULT_COMPANY = "TQC株式会社"
SCREENSHOT_REPORT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scratch", "tsunagugu_reported.png"))

async def report_pr_share(share_url: str, title: str = DEFAULT_TITLE, company: str = DEFAULT_COMPANY, dry_run: bool = False):
    print("=" * 80)
    print("📋 TSUNAGUGU PR SHARE REPORT AUTOMATOR")
    print(f"🔗 URL Báo cáo (SNS/Web): {share_url}")
    print(f"🏢 Công ty: {company}")
    print(f"📰 Tiêu đề PR: {title[:50]}...")
    print(f"⚙️ Chế độ Dry-Run: {dry_run}")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()

        print(f"1️⃣ Đang tải Google Form báo cáo: {FORM_URL} ...")
        await page.goto(FORM_URL, wait_until="networkidle", timeout=30000)

        # Lấy tất cả các input text trên Google Form
        text_inputs = page.locator('input[type="text"]')
        count = await text_inputs.count()
        print(f"📝 Tìm thấy {count} trường nhập liệu trên form.")

        if count < 3:
            raise RuntimeError(f"Google Form không hiển thị đủ 3 trường (chỉ tìm thấy {count}).")

        # Điền lần lượt 3 trường:
        # Trường 1: プレスリリースをご紹介をして頂いたWEBサイトのURL
        print("✍️ Điền Trường 1 (URL bài chia sẻ)...")
        await text_inputs.nth(0).fill(share_url)

        # Trường 2: お客様の会社名
        print("✍️ Điền Trường 2 (Tên công ty)...")
        await text_inputs.nth(1).fill(company)

        # Trường 3: 今回配信したプレスリリースのタイトル
        print("✍️ Điền Trường 3 (Tiêu đề PR)...")
        await text_inputs.nth(2).fill(title)

        await page.wait_for_timeout(1500)

        if dry_run:
            print("🛑 [DRY RUN] Đã điền xong thông tin vào Google Form.")
            await page.screenshot(path=SCREENSHOT_REPORT, full_page=True)
            print(f"📸 Ảnh chụp xác nhận dry-run: {SCREENSHOT_REPORT}")
            await browser.close()
            return True

        # Bấm nút gửi (Submit button)
        print("🚀 Đang bấm nút gửi biểu mẫu Google Form...")
        submit_btn = page.locator('div[role="button"]:has-text("送信"), span:has-text("送信")').first
        await submit_btn.click()
        await page.wait_for_timeout(4000)

        await page.screenshot(path=SCREENSHOT_REPORT, full_page=True)
        print(f"🎉 ĐÃ GỬI BÁO CÁO THÀNH CÔNG! Ảnh chụp màn hình: {SCREENSHOT_REPORT}")
        await browser.close()
        return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tsunagugu PR Share Reporter")
    parser.add_argument("--share-url", required=True, help="URL bài post trên mạng xã hội hoặc website")
    parser.add_argument("--title", default=DEFAULT_TITLE, help="Tiêu đề bài PR")
    parser.add_argument("--company", default=DEFAULT_COMPANY, help="Tên công ty")
    parser.add_argument("--dry-run", action="store_true", help="Kiểm tra điền form mà không bấm submit")
    args = parser.parse_args()

    asyncio.run(report_pr_share(args.share_url, args.title, args.company, args.dry_run))
