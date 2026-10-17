import os
import sys
import shutil
import time
import re
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

brain_dir = r"C:\Users\admin\.gemini\antigravity-ide\brain\56058325-b4fe-44bf-af61-8289e97077c2"
src_img1 = os.path.join(brain_dir, "zenn_edge_cache_arch_1792123647641.jpg")
src_img2 = os.path.join(brain_dir, "zenn_edge_benchmark_1792123667767.jpg")

dest_dir = r"c:\kigyou-list\scripts\zenn\images"
os.makedirs(dest_dir, exist_ok=True)

dest_img1 = os.path.join(dest_dir, "zenn_edge_cache_arch.jpg")
dest_img2 = os.path.join(dest_dir, "zenn_edge_benchmark.jpg")

shutil.copy2(src_img1, dest_img1)
shutil.copy2(src_img2, dest_img2)
print(f"[+] Đã copy ảnh sang:\n  {dest_img1}\n  {dest_img2}")

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"

cdn_links = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(storage_state=STORAGE_STATE, viewport={"width": 1440, "height": 900})
    
    # 1. Upload Ảnh 1 (Architecture)
    page = context.new_page()
    print("[1] Mở trang chủ Zenn...")
    page.goto("https://zenn.dev", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    
    print("[2] Mở editor bài viết...")
    page.locator("button:has-text('投稿する'), a:has-text('投稿する')").first.click()
    time.sleep(1)
    page.locator("text='記事を作成'").first.click()
    time.sleep(3)
    
    file_input = page.locator("input[type='file']").first
    print("[3] Upload ảnh 1: zenn_edge_cache_arch.jpg...")
    file_input.set_input_files(dest_img1)
    time.sleep(6)
    
    editor_text = page.locator("div[class*='contentItemEditor']").inner_text()
    found1 = re.findall(r"https://static\.zenn\.studio/user-upload/[a-zA-Z0-9_\-\.]+", editor_text)
    if found1:
        cdn_links["arch"] = found1[0]
        print(f"[+] CDN Link 1 (Arch): {cdn_links['arch']}")
    page.close()
    
    # 2. Upload Ảnh 2 (Benchmark)
    page2 = context.new_page()
    page2.goto("https://zenn.dev", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    page2.locator("button:has-text('投稿する'), a:has-text('投稿する')").first.click()
    time.sleep(1)
    page2.locator("text='記事を作成'").first.click()
    time.sleep(3)
    
    file_input2 = page2.locator("input[type='file']").first
    print("[4] Upload ảnh 2: zenn_edge_benchmark.jpg...")
    file_input2.set_input_files(dest_img2)
    time.sleep(6)
    
    editor_text2 = page2.locator("div[class*='contentItemEditor']").inner_text()
    found2 = re.findall(r"https://static\.zenn\.studio/user-upload/[a-zA-Z0-9_\-\.]+", editor_text2)
    if found2:
        cdn_links["benchmark"] = found2[0]
        print(f"[+] CDN Link 2 (Benchmark): {cdn_links['benchmark']}")
    page2.close()
    
    browser.close()

# Lưu vào file JSON / text
out_file = r"c:\kigyou-list\scripts\zenn\article_04_cdn_images.txt"
with open(out_file, "w", encoding="utf-8") as f:
    f.write(f"ARCH={cdn_links.get('arch', '')}\n")
    f.write(f"BENCHMARK={cdn_links.get('benchmark', '')}\n")

print(f"[SUCCESS] Đã lưu CDN links vào: {out_file}")
