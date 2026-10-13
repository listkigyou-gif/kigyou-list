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
    
    # Click speech bubble / comment button
    comment_btn = page.locator('button[aria-label*="Comment"]').first
    print("Comment button found:", comment_btn.is_visible())
    if comment_btn.is_visible():
        comment_btn.click()
        time.sleep(2)
        
        cbox = page.locator('div.comments-comment-box__editor, div.ql-editor[role="textbox"]').first
        if cbox.is_visible():
            cbox.click()
            time.sleep(1)
            comment_text = "詳細な他社比較データと500万社の無料検索デモはこちらから👇\nhttps://kigyoulist.com/ja/compare?utm_source=linkedin&utm_medium=social&utm_campaign=launch_post"
            page.keyboard.insert_text(comment_text)
            time.sleep(2)
            
            submit_btn = page.locator('button.comments-comment-box__submit-button, button:has-text("Comment")').last
            if submit_btn.is_visible():
                submit_btn.click()
                print("First comment posted successfully!")
                time.sleep(3)
                
    # Copy link to post via 3 dots
    more_btn = page.locator('button[aria-label="More options"], button[aria-label="Control menu"]').first
    if more_btn.is_visible():
        more_btn.click()
        time.sleep(1)
        copy_btn = page.locator('div:has-text("Copy link to post")').first
        if copy_btn.is_visible():
            copy_btn.click()
            time.sleep(1)
            
    page.screenshot(path="scripts/linkedin_post_with_comment.png")
    context.close()
