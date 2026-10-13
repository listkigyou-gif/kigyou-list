import os
import sys
import time
from playwright.sync_api import sync_playwright

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(storage_state=STORAGE_STATE, viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto("https://zenn.dev/kigyoulist/articles/3953f13ad8878a", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    
    # Scroll to section 2
    page.evaluate("window.scrollTo(0, 950)")
    time.sleep(1)
    page.screenshot(path=os.path.join(BASE_DIR, "live_section_2_image.png"))
    
    # Scroll to section 5
    page.evaluate("window.scrollTo(0, 3600)")
    time.sleep(1)
    page.screenshot(path=os.path.join(BASE_DIR, "live_section_5_image.png"))
    
    browser.close()
