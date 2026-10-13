import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"
ARTICLE_EDIT_URL = "https://zenn.dev/articles/5252fb84491120/edit"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state=STORAGE_STATE,
        viewport={"width": 1440, "height": 900}
    )
    page = context.new_page()
    print("Navigating to article edit page:", ARTICLE_EDIT_URL)
    page.goto(ARTICLE_EDIT_URL, wait_until="networkidle", timeout=30000)
    time.sleep(2)
    
    # Check if toggle is ON
    toggle_btn = page.locator(".ToggleSwitch-module-scss-module__jWc2Pa__switchMark, button[aria-label='公開する']").first
    # Check if button says '公開する'
    save_btn = page.locator("span[class*='saveContainer'] button").first
    if "公開する" not in save_btn.inner_text():
        toggle_btn.click()
        time.sleep(1)
        
    print("Clicking header '公開する' to open modal...")
    save_btn.click()
    time.sleep(2)
    
    # Now click the '公開する' button INSIDE the modal!
    modal_confirm_btn = page.locator("button:has-text('公開する')").last
    print("Found modal confirm button. Clicking final '公開する'...")
    modal_confirm_btn.click()
    time.sleep(6)
    
    # Screenshot final live state
    screenshot_path = os.path.join(BASE_DIR, "final_live_published.png")
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to: {screenshot_path}")
    print("Final URL:", page.url)
    
    # Check if redirected to public article
    if page.url != ARTICLE_EDIT_URL:
        print("\n[SUCCESS] >>> ARTICLE SUCCESSFULLY PUBLISHED LIVE! <<<")
        print("Live URL:", page.url)
        
    browser.close()
