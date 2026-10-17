import os
import sys
import time
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))
FANPAGE_URL = "https://www.facebook.com/kigyoulist/"

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE_DIR,
        headless=True,
        channel="chrome",
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-notifications"],
        viewport={"width": 1280, "height": 1000}
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto(FANPAGE_URL, wait_until="domcontentloaded")
    time.sleep(5)
    page.keyboard.press("Escape")
    
    # Cuộn xuống khu vực posts
    page.evaluate("window.scrollBy(0, 800)")
    time.sleep(3)
    page.screenshot(path="c:\\kigyou-list\\scripts\\check_fanpage_posts_now.png")
    
    # Kiểm tra xem có bài "月10万円の名簿ツール" không
    found_day1 = page.locator('*:has-text("月10万円の名簿ツール")').count()
    print(f"Tìm thấy bài Ngày 1 trên page: {found_day1 > 0}")
    
    ctx.close()
