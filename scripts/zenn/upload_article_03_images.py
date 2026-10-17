import os
import sys
import shutil
import time
import re
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

brain_dir = r"C:\Users\admin\.gemini\antigravity-ide\brain\56058325-b4fe-44bf-af61-8289e97077c2"
src_img1 = os.path.join(brain_dir, "zenn_intent_pipeline_1792038780109.jpg")
src_img2 = os.path.join(brain_dir, "zenn_intent_benchmark_1792038815611.jpg")

dest_dir = r"c:\kigyou-list\scripts\zenn\images"
os.makedirs(dest_dir, exist_ok=True)

dest_img1 = os.path.join(dest_dir, "zenn_intent_pipeline.jpg")
dest_img2 = os.path.join(dest_dir, "zenn_intent_benchmark.jpg")

shutil.copy2(src_img1, dest_img1)
shutil.copy2(src_img2, dest_img2)
print(f"[+] Đã copy ảnh sang:\n  {dest_img1}\n  {dest_img2}")

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
    print("[3] Upload ảnh 1 (Pipeline Architecture)...")
    file_input.set_input_files(dest_img1)
    time.sleep(5)
    
    print("[4] Upload ảnh 2 (Conversion Benchmark)...")
    file_input.set_input_files(dest_img2)
    time.sleep(5)
    
    editor_text = page.locator("div[class*='contentItemEditor']").inner_text()
    cdn_links = re.findall(r"https://static\.zenn\.studio/user-upload/[a-zA-Z0-9_\-\.]+", editor_text)
    print("Found CDN links:", cdn_links)
    
    with open(r"c:\kigyou-list\scripts\zenn\article_03_cdn_images.txt", "w", encoding="utf-8") as f:
        for link in cdn_links:
            f.write(link + "\n")
            
    browser.close()
    print("[+] Hoàn tất lấy link CDN ảnh!")
