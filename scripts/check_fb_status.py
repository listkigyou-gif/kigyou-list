import os
import sys
from playwright.sync_api import sync_playwright

p_dir = os.path.abspath(".facebook_user_profile")
with sync_playwright() as p:
    try:
        ctx = p.chromium.launch_persistent_context(
            p_dir,
            headless=True,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
        page.wait_for_timeout(5000)
        print("CURRENT_URL:", page.url)
        page.screenshot(path="scripts/check_fb_auth.png")
        ctx.close()
    except Exception as e:
        print("ERROR:", e)
