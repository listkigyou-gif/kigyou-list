import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

storage_state_file = r"c:\kigyou-list\zenn_auth_state.json"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(storage_state=storage_state_file)
    page = context.new_page()
    page.goto("https://zenn.dev", wait_until="networkidle", timeout=30000)
    
    post_btn = page.locator("button:has-text('投稿する'), a:has-text('投稿する')").first
    post_btn.click()
    time.sleep(1)
    
    article_btn = page.locator("text='記事を作成'").first
    print("[+] Clicking '記事を作成'...")
    article_btn.click()
    time.sleep(3)
    
    print("[+] Current URL:", page.url)
    screenshot_path = "c:/kigyou-list/scripts/zenn/editor_opened.png"
    page.screenshot(path=screenshot_path)
    print("[+] Screenshot saved to:", screenshot_path)
    
    browser.close()
