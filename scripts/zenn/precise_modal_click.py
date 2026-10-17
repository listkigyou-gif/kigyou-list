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
    
    # Kiểm tra xem nút header là gì
    header_btn = page.locator("header button:has-text('公開する')")
    if header_btn.count() == 0:
        print("Header button chưa phải là 公開する. Đang bật toggle...")
        toggle = page.locator(".ToggleSwitch-module-scss-module__jWc2Pa__switchMark, button[aria-label='公開する']").first
        toggle.click()
        time.sleep(1)
        
    print("Header buttons:")
    for b in page.locator("header button").all():
        print(f"  - '{b.inner_text().strip()}'")
        
    # Click header '公開する'
    pub_btn = page.locator("header button:has-text('公開する')").first
    print("Clicking header button:", pub_btn.inner_text())
    pub_btn.click()
    time.sleep(2)
    
    # Liệt kê TẤT CẢ các button có chữ '公開する' trên toàn bộ trang
    all_pub_btns = page.locator("button:has-text('公開する')").all()
    print(f"Found {len(all_pub_btns)} buttons with '公開する':")
    for i, b in enumerate(all_pub_btns):
        box = b.bounding_box()
        print(f"  [{i}] text='{b.inner_text().strip()}', visible={b.is_visible()}, box={box}")
        
    # Nút trong modal sẽ là nút nằm ở giữa màn hình (y > 200)
    modal_btn = None
    for b in all_pub_btns:
        box = b.bounding_box()
        if box and box['y'] > 200:
            modal_btn = b
            print(f"-> Selected modal button at y={box['y']}")
            break
            
    if modal_btn:
        print("Clicking modal publish button...")
        modal_btn.click()
        print("Clicked! Waiting 10s for publication...")
        time.sleep(10)
    else:
        print("[-] Không tìm thấy modal button ở y > 200!")
        
    page.screenshot(path=os.path.join(BASE_DIR, "after_modal_click_precise.png"))
    print("Final URL:", page.url)
    
    # Kiểm tra dashboard
    page.goto("https://zenn.dev/dashboard", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "dashboard_final_verify.png"))
    
    browser.close()
