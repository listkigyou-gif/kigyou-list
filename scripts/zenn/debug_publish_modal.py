import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"
ARTICLE_EDIT_URL = "https://zenn.dev/articles/1de5e66778e2c5/edit"

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
    
    # 1. Đóng tooltip AI nếu có
    ai_tooltip_close = page.locator("button:has-text('×'), button[aria-label='閉じる'], [class*='tooltip'] button").all()
    print(f"Found {len(ai_tooltip_close)} close buttons for tooltips")
    for b in ai_tooltip_close:
        try:
            if b.is_visible():
                b.click()
                print("Clicked close tooltip")
        except:
            pass
            
    # 2. Kiểm tra toggle '公開する'
    toggle = page.locator(".ToggleSwitch-module-scss-module__jWc2Pa__switchMark, button[aria-label='公開する']").first
    # Nếu toggle chưa bật (nút header chưa là '公開する')
    header_btn = page.locator("header button:has-text('公開する')")
    if header_btn.count() == 0:
        print("Bật toggle 公開する...")
        toggle.click()
        time.sleep(1)
        
    print("Clicking header 公開する to open modal...")
    page.locator("header button:has-text('公開する')").first.click()
    time.sleep(2)
    
    # In toàn bộ HTML của Modal
    modal = page.locator(".ReactModalPortal, div[role='dialog']").first
    print("Modal HTML snippet:")
    print(modal.inner_html()[:800])
    
    # Tìm tất cả button trong modal
    buttons_in_modal = modal.locator("button").all()
    print(f"Buttons in modal: {len(buttons_in_modal)}")
    target_btn = None
    for b in buttons_in_modal:
        txt = b.inner_text().strip()
        print(f" - Modal button: '{txt}'")
        if "公開する" in txt:
            target_btn = b
            
    if target_btn:
        print("Clicking target_btn in modal...")
        target_btn.click()
        print("Clicked! Waiting for network response and transition...")
        time.sleep(8)
    else:
        print("[-] Không tìm thấy target_btn!")
        
    page.screenshot(path=os.path.join(BASE_DIR, "after_modal_click_debug.png"))
    print("Current URL:", page.url)
    
    # Kiểm tra dashboard
    page.goto("https://zenn.dev/dashboard", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "dashboard_debug.png"))
    
    browser.close()
