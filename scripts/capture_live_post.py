import os
import time
from playwright.sync_api import sync_playwright

PAGE_URL = "https://www.facebook.com/profile.php?id=61594160223303"
PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE_DIR,
        headless=True,
        channel="chrome",
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-notifications"],
        viewport={"width": 1280, "height": 1000}
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto(PAGE_URL, wait_until="domcontentloaded")
    time.sleep(5)
    page.keyboard.press("Escape")
    # Cuộn nhẹ xuống để nhìn rõ toàn bộ bài viết đầu tiên
    page.evaluate("window.scrollBy(0, 500)")
    time.sleep(3)
    page.screenshot(path="scripts/facebook_page_post_live.png")
    print("SAVED scripts/facebook_page_post_live.png")
    ctx.close()
