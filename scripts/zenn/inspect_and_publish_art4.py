import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"
ARTICLE_EDIT_URL = "https://zenn.dev/articles/9a7e3003e3c002/edit"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state=STORAGE_STATE,
        viewport={"width": 1440, "height": 900}
    )
    page = context.new_page()
    print("Navigating to article edit page:", ARTICLE_EDIT_URL)
    page.goto(ARTICLE_EDIT_URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    
    # Screenshot current state
    page.screenshot(path=os.path.join(BASE_DIR, "art4_before_publish.png"))
    
    # 1. Mở panel cài đặt nếu chưa mở
    settings_btn = page.locator("button[aria-label='公開設定']")
    if settings_btn.count() > 0:
        print("Mở bảng 公開設定...")
        settings_btn.first.click()
        time.sleep(1)
        
    # 2. Kiểm tra toggle '公開する'
    toggle = page.locator(".ToggleSwitch-module-scss-module__jWc2Pa__switchMark, button[aria-label='公開する']").first
    print("Toggle locator count:", toggle.count())
    
    # Kiểm tra nút header
    save_btn = page.locator("span[class*='saveContainer'] button, header button:has-text('公開する')").first
    print("Save btn text:", save_btn.inner_text())
    
    # Click save_btn
    print("Clicking save_btn...")
    save_btn.click()
    time.sleep(2)
    
    # Screenshot sau khi click save_btn
    page.screenshot(path=os.path.join(BASE_DIR, "art4_after_save_click.png"))
    
    # Kiểm tra các modal hoặc dialog đang hiện
    modals = page.locator("div[role='dialog'], div[class*='Modal'], div[class*='dialog']").all()
    print(f"Found {len(modals)} modals/dialogs")
    for i, m in enumerate(modals):
        print(f"Modal {i}: {m.inner_text()[:100]}")
        
    # Tìm nút confirm
    confirm_btns = page.locator("button:has-text('公開する'), button:has-text('公開')").all()
    print(f"Found {len(confirm_btns)} publish buttons:")
    for i, b in enumerate(confirm_btns):
        print(f"  Button {i}: text='{b.inner_text()}', visible={b.is_visible()}")
        
    if len(confirm_btns) > 1:
        last_btn = confirm_btns[-1]
        print("Clicking last publish button...")
        last_btn.click()
        time.sleep(10)
        
    page.screenshot(path=os.path.join(BASE_DIR, "art4_after_modal_confirm.png"))
    print("Final URL:", page.url)
    
    browser.close()
