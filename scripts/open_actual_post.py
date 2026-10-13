import os
import sys
import time
from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".linkedin_user_profile"))

with sync_playwright() as p:
    args = ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
    context = p.chromium.launch_persistent_context(
        user_data_dir=PROFILE_DIR, channel="chrome", headless=True, args=args, viewport={"width": 1280, "height": 900}
    )
    page = context.pages[0] if context.pages else context.new_page()
    page.goto("https://www.linkedin.com/notifications/", wait_until="domcontentloaded")
    time.sleep(3)
    
    # Click text of notification
    print("Clicking notification text...")
    page.locator('text="Congratulations on your first post"').click()
    time.sleep(5)
    print("Navigated URL:", page.url)
    page.screenshot(path="scripts/actual_post_page.png")
    
    context.close()
