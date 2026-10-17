import os
import sys
import time
import re
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ARTICLE_PATH = r"c:\kigyou-list\scripts\zenn\articles\postgresql_entity_resolution_5m.md"
STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"

with open(ARTICLE_PATH, "r", encoding="utf-8") as f:
    raw_content = f.read()

match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw_content, re.DOTALL)
if match:
    fm_text = match.group(1)
    body_content = match.group(2).strip()
    title = "【PostgreSQL/pg_trgm】500万件の法人オープンデータをミリ秒単位で名寄せ・曖昧検索するデータパイプライン構築"
    topics = ["postgresql", "python", "database", "opendata", "dx"]
    for line in fm_text.splitlines():
        if line.startswith("title:"):
            title = line.replace("title:", "").strip().strip('"').strip("'")
else:
    title = "【PostgreSQL/pg_trgm】500万件の法人オープンデータをミリ秒単位で名寄せ・曖昧検索するデータパイプライン構築"
    body_content = raw_content
    topics = ["postgresql", "python", "database", "opendata", "dx"]

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
    time.sleep(2)
    
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
    time.sleep(2)
    
    # 3. Mở bảng Cài đặt
    print("[5] Mở bảng Cài đặt (公開設定)...")
    page.locator("button[aria-label='公開設定']").first.click()
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
    time.sleep(1)
    
    # 7. Bấm nút '公開する' ở saveContainer để mở Modal
    print("[9] Bấm nút '公開する' ở header để mở Modal xác nhận...")
    save_btn = page.locator("span[class*='saveContainer'] button").first
    save_btn.click()
    time.sleep(2)
    
    # 8. Bấm nút '公開する' BÊN TRONG MODAL XÁC NHẬN!
    print("[10] Bấm nút '公開する' bên trong Modal xác nhận...")
    modal_publish_btn = page.locator("button:has-text('公開する')").last
    print("Modal button text:", modal_publish_btn.inner_text())
    modal_publish_btn.click()
    
    print("[+] Đang đợi Zenn hoàn tất xuất bản...")
    time.sleep(10)
    
    page.screenshot(path=os.path.join(BASE_DIR, "live_article_02_published.png"))
    final_url = page.url
    print(f"[+] Final URL sau khi xuất bản: {final_url}")
    
    # Kiểm tra dashboard bài viết
    page.goto("https://zenn.dev/dashboard", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "dashboard_after_article_02.png"))
    
    article_links = page.locator("a[href*='/articles/']").all()
    found_urls = []
    for al in article_links:
        h = al.get_attribute("href")
        if h and h not in found_urls and "/trendings" not in h:
            found_urls.append(h)
            
    print("==================================================")
    print("BÀI VIẾT 02 ĐÃ ĐƯỢC XUẤT BẢN THÀNH CÔNG LÊN ZENN.DEV!")
    if found_urls:
        for u in found_urls:
            print(f"URL bài viết: https://zenn.dev{u if u.startswith('/') else '/' + u}")
    else:
        print(f"URL: {final_url}")
    print("==================================================")
    
    browser.close()
