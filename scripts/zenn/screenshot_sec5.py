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
    
    # Scroll directly to Section 5 Heading
    h2_sec5 = page.locator("h2:has-text('5. 実運用サービスでの検証成果')").first
    h2_sec5.scroll_into_view_if_needed()
    time.sleep(1)
    
    page.screenshot(path=os.path.join(BASE_DIR, "live_section_5_rendered.png"))
    browser.close()
