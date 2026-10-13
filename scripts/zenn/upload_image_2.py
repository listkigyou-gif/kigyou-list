import os
import sys
import time
import re
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
ARTICLE_EDIT_URL = "https://zenn.dev/articles/3953f13ad8878a/edit"
IMG2_PATH = r"c:\kigyou-list\scripts\zenn\images\zenn_benchmark_metrics.jpg"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(storage_state=STORAGE_STATE, viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto(ARTICLE_EDIT_URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    
    file_input = page.locator("input[type='file']").first
    print(f"Uploading image 2: {IMG2_PATH} ...")
    file_input.set_input_files(IMG2_PATH)
    time.sleep(5)
    
    editor_text = page.locator("div[class*='contentItemEditor']").inner_text()
    img_links = re.findall(r"https://static\.zenn\.studio/user-upload/[a-zA-Z0-9_\-\.]+", editor_text)
    print("Found inserted CDN image links:", img_links)
    
    browser.close()
