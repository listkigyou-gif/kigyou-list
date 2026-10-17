import os
import sys
import time
import re
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ARTICLE_PATH = r"c:\kigyou-list\scripts\zenn\articles\postgresql_entity_resolution_5m.md"
STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
ARTICLE_EDIT_URL = "https://zenn.dev/articles/9c6c99d695e033/edit"

with open(ARTICLE_PATH, "r", encoding="utf-8") as f:
    raw_content = f.read()

match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw_content, re.DOTALL)
if match:
    body_content = match.group(2).strip()
else:
    body_content = raw_content

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state=STORAGE_STATE,
        viewport={"width": 1440, "height": 900},
        permissions=["clipboard-read", "clipboard-write"]
    )
    page = context.new_page()
    page.goto(ARTICLE_EDIT_URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    
    # Replace content
    page.evaluate("text => navigator.clipboard.writeText(text)", body_content)
    editor_box = page.locator("div[class*='contentItemEditor']").first
    editor_box.click()
    time.sleep(0.5)
    page.keyboard.press("Control+A")
    time.sleep(0.3)
    page.keyboard.press("Control+V")
    time.sleep(3)
    
    save_btn = page.locator("span[class*='saveContainer'] button").first
    if not save_btn.is_disabled():
        save_btn.click()
    else:
        page.keyboard.press("Control+S")
        
    time.sleep(4)
    print("[SUCCESS] Đã cập nhật xong thứ tự hình ảnh trên Zenn!")
    browser.close()
