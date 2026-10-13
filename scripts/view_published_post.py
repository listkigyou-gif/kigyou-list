import os
import sys
import time
from playwright.sync_api import sync_playwright

PAGE_URL = "https://www.facebook.com/profile.php?id=61594160223303"
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
    page.goto(PAGE_URL, wait_until="domcontentloaded")
    time.sleep(5)
    page.keyboard.press("Escape")
    
    # Tìm liên kết thời gian (ví dụ "Just now", "1m", "2m", "幾秒前", "Just now"...) của bài viết
    # hoặc hover vào bài viết và chụp toàn màn hình
    # Hãy tìm phần tử chứa '500万社' hoặc 'そんな営業組織'
    post_el = page.locator('div:has-text("そんな営業組織の課題を解決するため")').first
    if post_el.count() > 0:
        print("FOUND POST ELEMENT!")
        post_el.scroll_into_view_if_needed()
        time.sleep(2)
        # Chụp riêng phần tử bài viết này
        post_el.screenshot(path="scripts/post_element.png")
        print("Captured post_element.png")
    
    # Chụp toàn cảnh trang
    page.screenshot(path="scripts/full_page_post.png")
    ctx.close()
