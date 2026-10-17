import os
import sys
import time
import re
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ARTICLE_PATH = r"c:\kigyou-list\scripts\zenn\articles\nextjs_cloudflare_5m_seo_architecture.md"
STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"

with open(ARTICLE_PATH, "r", encoding="utf-8") as f:
    raw_content = f.read()

match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw_content, re.DOTALL)
if match:
    fm_text = match.group(1)
    body_content = match.group(2).strip()
    title = "【Next.js/Cloudflare】500万ページの超大規模Webサービスを低コスト・爆速で構築するSEOアーキテクチャ"
    topics = ["nextjs", "cloudflare", "seo", "typescript", "web"]
    for line in fm_text.splitlines():
        if line.startswith("title:"):
            title = line.replace("title:", "").strip().strip('"').strip("'")
else:
    title = "【Next.js/Cloudflare】500万ページの超大規模Webサービスを低コスト・爆速で構築するSEOアーキテクチャ"
    body_content = raw_content
    topics = ["nextjs", "cloudflare", "seo", "typescript", "web"]

print("==================================================")
print(f"Tiêu đề: {title}")
print(f"Topics: {topics}")
print(f"Độ dài bài viết: {len(body_content)} ký tự")
print("==================================================")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state=STORAGE_STATE,
        viewport={"width": 1440, "height": 900},
        permissions=["clipboard-read", "clipboard-write"]
    )
    page = context.new_page()
    
    print("[1] Mở trang chủ Zenn.dev...")
    page.goto("https://zenn.dev", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    
    print("[2] Bấm '投稿する' -> '記事を作成'...")
    page.locator("button:has-text('投稿する'), a:has-text('投稿する')").first.click()
    time.sleep(1)
    page.locator("text='記事を作成'").first.click()
    time.sleep(3)
    
    current_edit_url = page.url
    print(f"[+] Đang ở trang soạn thảo: {current_edit_url}")
    
    # 1. Điền Tiêu đề
    print("[3] Điền Tiêu đề...")
    title_field = page.locator("textarea[placeholder='Title']").first
    title_field.click()
    title_field.fill(title)
    time.sleep(1)
    
    # 2. Điền Body qua Clipboard
    print("[4] Điền Nội dung Markdown vào Editor...")
    page.evaluate("text => navigator.clipboard.writeText(text)", body_content)
    editor_box = page.locator("div[class*='contentItemEditor']").first
    editor_box.click()
    time.sleep(0.5)
    page.keyboard.press("Control+V")
    time.sleep(3)
    
    # Lưu draft 1 lần bằng Ctrl+S
    print("[+] Nhấn Ctrl+S để lưu bản nháp...")
    page.keyboard.press("Control+S")
    time.sleep(2)
    
    # 3. Mở bảng Cài đặt
    print("[5] Mở bảng Cài đặt (公開設定)...")
    settings_btn = page.locator("button[aria-label='公開設定']").first
    if settings_btn.count() > 0:
        settings_btn.click()
        time.sleep(1)
    
    # 4. Chọn Category 'Tech'
    print("[6] Chọn Category 'Tech'...")
    tech_radio = page.locator("div[role='radio']:has-text('Tech')").first
    tech_radio.click()
    time.sleep(0.5)
    
    # 5. Thêm 5 Topics qua react-select
    print("[7] Thêm các thẻ Topics...")
    rs_input = page.locator(".rs__control input, div[class*='TopicField'] input").first
    for tag in topics:
        rs_input.click()
        time.sleep(0.2)
        page.keyboard.type(tag)
        time.sleep(0.6)
        page.keyboard.press("Enter")
        time.sleep(0.4)
        print(f"    + Đã thêm topic: {tag}")
        
    time.sleep(1)
    
    # 6. Bật switch '公開する'
    print("[8] Bật switch '公開する'...")
    toggle_btn = page.locator(".ToggleSwitch-module-scss-module__jWc2Pa__switchMark, button[aria-label='公開する']").first
    toggle_btn.click()
    time.sleep(1.5)
    
    page.screenshot(path=os.path.join(BASE_DIR, "step8_toggle_on.png"))
    
    # 7. Bấm nút '公開する' ở header
    print("[9] Bấm nút '公開する' ở header để kích hoạt Modal...")
    header_pub_btn = page.locator("header button:has-text('公開する'), span[class*='saveContainer'] button:has-text('公開する')").first
    print("Header pub button visible:", header_pub_btn.is_visible())
    header_pub_btn.click()
    time.sleep(2)
    
    page.screenshot(path=os.path.join(BASE_DIR, "step9_after_header_click.png"))
    
    # 8. Chờ modal và bấm nút '公開する' bên trong Modal
    print("[10] Chờ Modal xuất hiện và bấm xác nhận...")
    try:
        page.wait_for_selector("div[role='dialog'], div[class*='Modal'], div[class*='dialog']", timeout=8000)
        print("[+] Đã phát hiện Modal xuất bản!")
    except Exception as e:
        print(f"[-] Wait modal timeout: {e}")
        
    page.screenshot(path=os.path.join(BASE_DIR, "step10_modal_view.png"))
    
    modal_confirm_btn = page.locator("div[role='dialog'] button:has-text('公開する'), div[class*='Modal'] button:has-text('公開する'), button:has-text('公開する')").last
    print("Modal button text:", modal_confirm_btn.inner_text())
    modal_confirm_btn.click()
    print("[+] Đã click nút xác nhận xuất bản!")
    
    # 9. Chờ điều hướng đến trang bài viết công khai
    print("[11] Chờ Zenn hoàn tất xuất bản và điều hướng...")
    for _ in range(15):
        time.sleep(1)
        if "/articles/" in page.url and "/edit" not in page.url:
            print(f"[SUCCESS] Đã chuyển hướng sang trang bài viết công khai: {page.url}")
            break
            
    time.sleep(5)
    live_url = page.url
    page.screenshot(path=os.path.join(BASE_DIR, "step11_final_result.png"))
    print(f"[+] Final URL: {live_url}")
    
    # 10. Mở Dashboard để xác thực
    print("[12] Kiểm tra Dashboard để lấy URL công khai chuẩn...")
    page.goto("https://zenn.dev/dashboard", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "step12_dashboard.png"))
    
    article_links = page.locator("a[href*='/articles/']").all()
    found_urls = []
    for al in article_links:
        h = al.get_attribute("href")
        if h and h not in found_urls and "/trendings" not in h:
            found_urls.append(h)
            
    print("==================================================")
    print("KẾT QUẢ XUẤT BẢN BÀI VIẾT 04:")
    for u in found_urls:
        print(f" - https://zenn.dev{u if u.startswith('/') else '/' + u}")
    print("==================================================")
    
    browser.close()
