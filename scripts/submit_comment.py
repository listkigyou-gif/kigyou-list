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
    page.goto("https://www.linkedin.com/in/kigyou-list-0b5b8b442/recent-activity/all/", wait_until="domcontentloaded")
    time.sleep(5)
    
    # Click comment bubble
    page.locator('button[aria-label*="Comment"]').first.click()
    time.sleep(2)
    
    # Click the editor directly
    comment_input = page.locator('div[role="textbox"][aria-label*="comment"], div.ql-editor, div.comments-comment-box__editor').first
    if comment_input.is_visible():
        comment_input.click()
        time.sleep(1)
        comment_text = "詳細な他社比較データと500万社の無料検索デモはこちらから👇\nhttps://kigyoulist.com/ja/compare?utm_source=linkedin&utm_medium=social&utm_campaign=launch_post"
        page.keyboard.insert_text(comment_text)
        time.sleep(2)
        
        # Click Comment button inside comment form
        post_comment_btn = page.locator('button.comments-comment-box__submit-button, button:has-text("Comment")').last
        print("Post comment btn visible:", post_comment_btn.is_visible(), post_comment_btn.is_enabled())
        if post_comment_btn.is_visible():
            post_comment_btn.click()
            print("First comment submitted!")
            time.sleep(4)
            
    page.screenshot(path="scripts/linkedin_comment_confirmed.png")
    context.close()
