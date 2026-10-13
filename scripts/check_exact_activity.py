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
    time.sleep(5)
    page.screenshot(path="scripts/linkedin_notifs.png")
    
    # Also check member profile URL
    page.goto("https://www.linkedin.com/in/kigyou-list-0b5b8b442/recent-activity/all/", wait_until="domcontentloaded")
    time.sleep(5)
    page.screenshot(path="scripts/member_activity.png")
    
    posts = page.locator('div.feed-shared-update-v2, div[data-urn]').all()
    print("Posts found on member activity:", len(posts))
    for p in posts:
        print("Text:", p.inner_text()[:150])
        
    context.close()
