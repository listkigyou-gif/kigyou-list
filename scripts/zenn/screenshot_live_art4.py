import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

URL = "https://zenn.dev/kigyoulist/articles/9a7e3003e3c002"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    print(f"[+] Mở bài viết live 04: {URL}")
    page.goto(URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    
    # 1. Chụp header bài viết
    page.screenshot(path=os.path.join(BASE_DIR, "live_art4_header.png"))
    print("[+] Đã chụp ảnh Header bài viết 04")
    
    # 2. Cuộn xuống chụp Mục 2 (Ảnh 1 - Architecture)
    page.evaluate("window.scrollTo(0, 950)")
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "live_art4_sec2_image.png"))
    print("[+] Đã chụp Mục 2 (Ảnh 1 - Architecture)")
    
    # 3. Cuộn xuống chụp Mục 5 (Ảnh 2 - Benchmark)
    page.evaluate("window.scrollTo(0, 5200)")
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "live_art4_sec5_image.png"))
    print("[+] Đã chụp Mục 5 (Ảnh 2 - Benchmark)")
    
    browser.close()
    print("[+] Hoàn tất nghiệm thu bài viết 04 live!")
