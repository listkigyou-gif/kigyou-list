import os
import sys
import time
import re
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ARTICLE_PATH = r"c:\kigyou-list\scripts\zenn\articles\python_form_crawler_architecture.md"
STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"
ARTICLE_EDIT_URL = "https://zenn.dev/articles/3953f13ad8878a/edit"

with open(ARTICLE_PATH, "r", encoding="utf-8") as f:
    raw_content = f.read()

match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw_content, re.DOTALL)
if match:
    body_content = match.group(2).strip()
else:
    body_content = raw_content

print("==================================================")
print(f"Cập nhật bài viết 01 kèm 2 hình ảnh trực quan...")
print(f"Độ dài bài mới: {len(body_content)} ký tự")
print("==================================================")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state=STORAGE_STATE,
        viewport={"width": 1440, "height": 900},
        permissions=["clipboard-read", "clipboard-write"]
    )
    page = context.new_page()
    
    print(f"[1] Mở trang chỉnh sửa: {ARTICLE_EDIT_URL} ...")
    page.goto(ARTICLE_EDIT_URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    
    # Select all text in CodeMirror editor and replace with new body
    print("[2] Thay thế nội dung editor bằng Markdown có hình ảnh...")
    page.evaluate("text => navigator.clipboard.writeText(text)", body_content)
    editor_box = page.locator("div[class*='contentItemEditor']").first
    editor_box.click()
    time.sleep(0.5)
    
    # Select all and Paste
    page.keyboard.press("Control+A")
    time.sleep(0.3)
    page.keyboard.press("Control+V")
    time.sleep(3)
    
    # Check save button
    save_btn = page.locator("span[class*='saveContainer'] button").first
    print(f"[3] Nút lưu: text='{save_btn.inner_text()}', disabled={save_btn.is_disabled()}")
    
    # If not disabled, click save
    if not save_btn.is_disabled():
        save_btn.click()
        print("[4] Đã bấm lưu cập nhật!")
        time.sleep(4)
    else:
        # Save via shortcut Ctrl+S
        print("[4] Lưu qua phím tắt Ctrl+S...")
        page.keyboard.press("Control+S")
        time.sleep(4)
        
    # Check if a confirmation modal pops up
    modal_btn = page.locator("div[role='dialog'] button:has-text('更新する'), div[role='dialog'] button:has-text('公開する')").first
    if modal_btn.count() > 0 and modal_btn.is_visible():
        print(f"Bấm nút xác nhận trong modal: {modal_btn.inner_text()}")
        modal_btn.click()
        time.sleep(3)
        
    page.screenshot(path=os.path.join(BASE_DIR, "updated_editor_view.png"))
    
    # Navigate to public view
    print("[5] Kiểm tra trang công khai trực tiếp...")
    page.goto("https://zenn.dev/kigyoulist/articles/3953f13ad8878a", wait_until="networkidle", timeout=30000)
    time.sleep(3)
    
    screenshot_live = os.path.join(BASE_DIR, "updated_live_article.png")
    page.screenshot(path=screenshot_live, full_page=False)
    print(f"[SUCCESS] Ảnh chụp bài viết công khai đã lưu tại: {screenshot_live}")
    
    browser.close()
