import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

URL = "https://zenn.dev/kigyoulist/articles/6285306a465d2c"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    print(f"[+] Mở bài viết live 03: {URL}")
    page.goto(URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    
    # Cuộn xuống Mục 2 (Ảnh Pipeline)
    page.evaluate("window.scrollTo(0, 950)")
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "live_art3_sec2_image.png"))
    print("[+] Đã chụp Mục 2 (Ảnh 1 - Pipeline)")
    
    # Cuộn xuống Mục 5 (Ảnh Benchmark)
    page.evaluate("window.scrollTo(0, 4200)")
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "live_art3_sec5_image.png"))
    print("[+] Đã chụp Mục 5 (Ảnh 2 - Benchmark)")
    
    browser.close()
    print("[+] Hoàn tất chụp ảnh nghiệm thu bài viết 03!")
