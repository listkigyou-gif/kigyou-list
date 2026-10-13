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
    page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
    time.sleep(5)
    page.screenshot(path="scripts/feed_check_live.png")
    
    # Check notifications or posts
    notifs = page.locator('span.notification-badge, a[href*="notifications"]').first
    print("Notifs text:", notifs.inner_text() if notifs.is_visible() else "None")
    
    # Check if any post by kigyou list exists on feed
    user_posts = page.locator('div.feed-shared-update-v2:has-text("kigyou list"), div[data-urn*="activity"]:has-text("kigyou list")').all()
    print("User posts on feed:", len(user_posts))
    for up in user_posts:
        print("Post snippet:", up.inner_text()[:150])
        
    context.close()
