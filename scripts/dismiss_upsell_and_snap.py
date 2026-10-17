import os
import time
from playwright.sync_api import sync_playwright

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
    
    # Bấm Not now nếu có dialog Chat directly with customers
    not_now = page.locator('div[role="button"]:has-text("Not now"), span:text-is("Not now")').first
    if not_now.count() > 0 and not_now.is_visible():
        print("Bấm Not now...")
        not_now.click()
        time.sleep(3)
        
    page.screenshot(path="c:\\kigyou-list\\scripts\\facebook_fanpage_day1_live_feed.png")
    print("SAVED c:\\kigyou-list\\scripts\\facebook_fanpage_day1_live_feed.png")
    ctx.close()
