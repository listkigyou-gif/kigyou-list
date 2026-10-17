import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"
ARTICLE_EDIT_URL = "https://zenn.dev/articles/1de5e66778e2c5/edit"
TOPICS = ["nextjs", "cloudflare", "seo", "typescript", "web"]

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
    
    # 1. Mở bảng Cài đặt (公開設定) nếu chưa mở
    topic_field = page.locator("input[placeholder*='トピック'], .rs__control input, div[class*='TopicField'] input")
    if topic_field.count() == 0 or not topic_field.first.is_visible():
        print("Mở bảng Cài đặt 公開設定...")
        page.locator("button[aria-label='公開設定']").first.click()
        time.sleep(1)
        
    # 2. Thêm từng thẻ Topic
    print("Đang thêm 5 topics...")
    topic_input = page.locator("input[placeholder*='トピック'], .rs__control input, div[class*='TopicField'] input").first
    for tag in TOPICS:
        topic_input.click()
        time.sleep(0.3)
        page.keyboard.type(tag)
        time.sleep(0.6)
        page.keyboard.press("Enter")
        time.sleep(0.4)
        print(f"  + Added: {tag}")
        
    time.sleep(1)
    
    # 3. Chọn Category Tech
    print("Chọn Category Tech...")
    page.locator("div[role='radio']:has-text('Tech')").first.click()
    time.sleep(0.5)
    
    # 4. Kiểm tra toggle '公開する'
    header_btn = page.locator("header button:has-text('公開する')")
    if header_btn.count() == 0:
        print("Bật switch 公開する...")
        toggle = page.locator(".ToggleSwitch-module-scss-module__jWc2Pa__switchMark, button[aria-label='公開する']").first
        toggle.click()
        time.sleep(1)
        
    # Lưu draft bằng Ctrl+S để lưu topics & category
    print("Nhấn Ctrl+S để lưu cài đặt...")
    page.keyboard.press("Control+S")
    time.sleep(3)
    
    page.screenshot(path=os.path.join(BASE_DIR, "after_topics_saved.png"))
    
    # 5. Bấm nút '公開する' ở header để mở Modal
    print("Bấm nút '公開する' ở header...")
    pub_btn = page.locator("header button:has-text('公開する')").first
    pub_btn.click()
    time.sleep(2)
    
    page.screenshot(path=os.path.join(BASE_DIR, "modal_opened_with_topics.png"))
    
    # 6. Bấm nút '公開する' BÊN TRONG MODAL
    print("Tìm và bấm nút '公開する' trong Modal...")
    modal_pub_btns = page.locator("button:has-text('公開する')").all()
    print(f"Total publish buttons: {len(modal_pub_btns)}")
    
    clicked = False
    for b in modal_pub_btns:
        box = b.bounding_box()
        if box and box['y'] > 200:
            print(f"Clicking modal button at box={box}")
            b.click()
            clicked = True
            break
            
    if not clicked and len(modal_pub_btns) > 1:
        modal_pub_btns[-1].click()
        print("Clicked last publish button!")
        
    print("Waiting 10s for publishing...")
    time.sleep(10)
    
    page.screenshot(path=os.path.join(BASE_DIR, "after_final_modal_publish.png"))
    print("Final URL:", page.url)
    
    # 7. Kiểm tra Dashboard
    print("Kiểm tra Dashboard...")
    page.goto("https://zenn.dev/dashboard", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "dashboard_published_success.png"))
    
    browser.close()
    print("[DONE] Hoàn tất quá trình xuất bản bài viết 04!")
