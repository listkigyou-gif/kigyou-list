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
    page.goto("https://www.linkedin.com/in/me/recent-activity/all/", wait_until="domcontentloaded")
    time.sleep(5)
    page.screenshot(path="scripts/linkedin_activity_live.png")
    
    # Also find post link or share link
    print("Activity page title:", page.title())
    print("Activity page URL:", page.url)
    
    # Try comment on the post if not yet commented
    comment_btn = page.locator('button.comment-button, button:has-text("Comment")').first
    if comment_btn.is_visible(timeout=5000):
        print("Clicking Comment on activity post...")
        comment_btn.click()
        time.sleep(2)
        cbox = page.locator('div.comments-comment-box__editor, div.ql-editor[role="textbox"]').first
        if cbox.is_visible(timeout=5000):
            cbox.click()
            time.sleep(1)
            page.keyboard.insert_text("詳細な他社比較データと500万社の無料検索デモはこちらから👇\nhttps://kigyoulist.com/ja/compare?utm_source=linkedin&utm_medium=social&utm_campaign=launch_post")
            time.sleep(2)
            page.locator('button.comments-comment-box__submit-button').first.click()
            print("Comment posted!")
            time.sleep(3)
            page.screenshot(path="scripts/linkedin_activity_commented.png")
            
    context.close()
