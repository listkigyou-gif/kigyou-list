import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"
ARTICLE_EDIT_URL = "https://zenn.dev/articles/1de5e66778e2c5/edit"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state=STORAGE_STATE,
        viewport={"width": 1440, "height": 900}
    )
    page = context.new_page()
    
    # Listen to console and response
    page.on("console", lambda msg: print(f"[CONSOLE] {msg.type}: {msg.text}"))
    page.on("response", lambda res: print(f"[API {res.status}] {res.request.method} {res.url}") if "api" in res.url or "article" in res.url else None)
    
    print("Navigating to article edit page:", ARTICLE_EDIT_URL)
    page.goto(ARTICLE_EDIT_URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    
    # Click header '公開する'
    pub_btn = page.locator("header button:has-text('公開する')").first
    print("Clicking header button...")
    pub_btn.click()
    time.sleep(2)
    
    # Tìm nút trong modal
    modal_btn = None
    for b in page.locator("button:has-text('公開する')").all():
        box = b.bounding_box()
        if box and box['y'] > 200:
            modal_btn = b
            print(f"Found modal button at box={box}")
            break
            
    if modal_btn:
        print("Clicking modal button now...")
        modal_btn.click()
        time.sleep(8)
    else:
        print("[-] Modal button not found")
        
    page.screenshot(path=os.path.join(BASE_DIR, "capture_network_result.png"))
    browser.close()
