import os
import sys
import shutil
import time
import re
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

dest_dir = r"c:\kigyou-list\scripts\zenn\images"
dest_img1 = os.path.join(dest_dir, "zenn_entity_pipeline.jpg")
dest_img2 = os.path.join(dest_dir, "zenn_trgm_benchmark.jpg")

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(storage_state=STORAGE_STATE, viewport={"width": 1440, "height": 900})
    page = context.new_page()
    
    print("[1] Mở trang chủ Zenn...")
    page.goto("https://zenn.dev", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    
    print("[2] Mở trình soạn thảo bài viết...")
    page.locator("button:has-text('投稿する'), a:has-text('投稿する')").first.click()
    time.sleep(1)
    page.locator("text='記事を作成'").first.click()
    time.sleep(3)
    
    file_input = page.locator("input[type='file']").first
    print("[3] Đã tìm thấy file input. Upload ảnh 1...")
    file_input.set_input_files(dest_img1)
    time.sleep(5)
    
    print("[4] Upload ảnh 2...")
    file_input.set_input_files(dest_img2)
    time.sleep(5)
    
    editor_text = page.locator("div[class*='contentItemEditor']").inner_text()
    cdn_links = re.findall(r"https://static\.zenn\.studio/user-upload/[a-zA-Z0-9_\-\.]+", editor_text)
    print("Found CDN links:", cdn_links)
    
    # Save links to file
    with open(r"c:\kigyou-list\scripts\zenn\article_02_cdn_images.txt", "w", encoding="utf-8") as f:
        for link in cdn_links:
            f.write(link + "\n")
            
    browser.close()
