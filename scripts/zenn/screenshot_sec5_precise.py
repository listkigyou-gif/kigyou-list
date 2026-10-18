import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

URL = "https://zenn.dev/kigyoulist/articles/1de5e66778e2c5"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    
    # Cuộn chính xác đến Mục 5
    sec5 = page.locator("h2:has-text('実運用サービスでの検証成果')").first
    if sec5.count() > 0:
        sec5.scroll_into_view_if_needed()
        time.sleep(2)
        page.screenshot(path=os.path.join(BASE_DIR, "live_article_04_sec5_precise.png"))
        print("[+] Chụp thành công Mục 5!")
        
    browser.close()
