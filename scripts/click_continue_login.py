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

p_dir = os.path.abspath(r"c:\kigyou-list\.facebook_user_profile")

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        p_dir,
        headless=True,
        channel="chrome",
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        viewport={"width": 1280, "height": 900}
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
    time.sleep(5)
    
    # Check for Continue button
    cont_btn = page.locator('div[role="button"]:has-text("Continue"), span:text-is("Continue"), button:has-text("Continue")').first
    if cont_btn.count() > 0 and cont_btn.is_visible():
        print("Clicking Continue button...")
        cont_btn.click()
        time.sleep(8)
    
    page.screenshot(path=r"c:\kigyou-list\scripts\after_continue_click.png")
    print("URL after continue:", page.url)
    
    # Verify logged in
    has_feed = page.locator('div[role="feed"], span:text-is("What\'s on your mind?"), div[aria-label="Your profile"]').count() > 0
    print("Logged in successfully:", has_feed)
    ctx.close()
