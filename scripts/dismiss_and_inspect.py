import os
import sys
import time
from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".linkedin_user_profile"))

with sync_playwright() as p:
    args = [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox"
    ]
    context = p.chromium.launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        channel="chrome",
        headless=True,
        args=args,
        viewport={"width": 1280, "height": 900}
    )
    page = context.pages[0] if context.pages else context.new_page()
    page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
    time.sleep(4)
    
    # 1. Close terms banner
    print("Looking for banner close button...")
    banner_x = page.locator('button:has(svg[data-test-icon="close-small"]), button[aria-label="Dismiss"], button[aria-label="Close"]')
    print("Banner X buttons:", banner_x.count())
    if banner_x.count() > 0:
        banner_x.first.click()
        print("Clicked banner X")
        time.sleep(2)
        
    page.screenshot(path="scripts/after_dismiss_terms.png")
    
    # 2. Let's see what happens if we click Photo
    # Find button containing Photo text or icon
    photo_selector = page.locator('div:has-text("Photo"), button:has-text("Photo"), span:has-text("Photo")').all()
    print("Photo elements:", len(photo_selector))
    
    # Let's inspect all buttons in main feed container
    main_feed = page.locator('main').first
    if main_feed.is_visible():
        btns = main_feed.locator('button, a').all()
        print(f"Found {len(btns)} buttons/links inside <main>:")
        for i, b in enumerate(btns[:15]):
            print(f"  [{i}] tag={b.evaluate('e => e.tagName')} aria={b.get_attribute('aria-label')} text={b.inner_text()[:30]}")
            
    context.close()
