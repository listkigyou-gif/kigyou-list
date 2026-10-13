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

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE_DIR,
        headless=True,
        channel="chrome",
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-notifications"],
        viewport={"width": 1280, "height": 900}
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
    time.sleep(5)
    page.keyboard.press("Escape")
    print("CURRENT HOME URL:", page.url)
    page.screenshot(path="scripts/fb_home_current.png")
    
    # Kiểm tra avatar góc trên bên phải
    top_avatar = page.locator('div[role="button"][aria-label="Your profile"], div[role="button"][aria-label="あなたのプロフィール"]').first
    if top_avatar.count() > 0:
        print("Clicking top avatar to see switch options...")
        top_avatar.click()
        time.sleep(3)
        page.screenshot(path="scripts/top_avatar_menu.png")
    ctx.close()
