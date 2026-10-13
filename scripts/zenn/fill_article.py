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

# Đọc nội dung file
with open(ARTICLE_PATH, "r", encoding="utf-8") as f:
    raw_content = f.read()

# Phân tách frontmatter và body
match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw_content, re.DOTALL)
if match:
    fm_text = match.group(1)
    body_content = match.group(2).strip()
    
    title = "【Python/Playwright】全国500万社の企業フォーム構造をセマンティック解析・自動最適化する実践アーキテクチャ"
    emoji = "⚡"
    topics = ["python", "playwright", "scraping", "ai", "dx"]
    for line in fm_text.splitlines():
        if line.startswith("title:"):
            title = line.replace("title:", "").strip().strip('"').strip("'")
        elif line.startswith("emoji:"):
            emoji = line.replace("emoji:", "").strip().strip('"').strip("'")
else:
    title = "【Python/Playwright】全国500万社の企業フォーム構造をセマンティック解析・自動最適化する実践アーキテクチャ"
    body_content = raw_content
    topics = ["python", "playwright", "scraping", "ai", "dx"]

print(f"Title: {title}")
print(f"Topics: {topics}")
print(f"Body length: {len(body_content)} chars")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state=STORAGE_STATE,
        viewport={"width": 1440, "height": 900}
    )
    page = context.new_page()
    
    print("[1] Đang mở trang chủ Zenn...")
    page.goto("https://zenn.dev", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    
    print("[2] Bấm nút '投稿する' -> '記事を作成'...")
    post_btn = page.locator("button:has-text('投稿する'), a:has-text('投稿する')").first
    post_btn.click()
    time.sleep(1)
    
    page.locator("text='記事を作成'").first.click()
    time.sleep(3)
    
    print("[3] Kiểm tra giao diện Editor...")
    page.screenshot(path=os.path.join(BASE_DIR, "step1_editor.png"))
    
    # 1. Điền Title
    # Tìm input title
    title_input = page.locator("textarea[placeholder*='Title'], input[placeholder*='Title']").first
    if title_input.count() > 0:
        print("[4] Điền Title...")
        title_input.fill(title)
    else:
        print("[-] Không tìm thấy input Title bằng placeholder, tìm selector khác...")
        # Lấy tất cả input/textarea
        inputs = page.locator("input, textarea").all()
        for idx, inp in enumerate(inputs):
            print(f"Input {idx}: tag={inp.evaluate('el => el.tagName')}, placeholder={inp.get_attribute('placeholder')}")
        if len(inputs) > 0:
            inputs[0].fill(title)
            
    # 2. Điền Body vào Markdown Editor
    print("[5] Điền Body Markdown...")
    body_editor = page.locator("textarea[placeholder*='markdown'], textarea.cm-content, div.cm-content, textarea").last
    # Dùng clipboard hoặc fill / evaluate để paste toàn bộ nội dung nhanh và chính xác
    try:
        body_editor.fill(body_content)
    except Exception as e:
        print(f"Fill body thất bại ({e}), dùng evaluate...")
        body_editor.evaluate("(el, text) => { el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })); }", body_content)
        
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "step2_filled.png"))
    print("[+] Đã điền xong Title và Body! Ảnh chụp lưu tại step2_filled.png")
    
    # 3. Mở cài đặt bài viết (Topics & Emoji)
    print("[6] Mở bảng cài đặt bài viết (Settings)...")
    # Nút cài đặt có icon slider / controls ở thanh trên cùng
    settings_btn = page.locator("button[aria-label*='設定'], button[aria-label*='Setting'], svg.lucide-sliders-horizontal, header button").all()
    print(f"Tìm thấy {len(settings_btn)} nút ở header")
    
    # Chụp ảnh và kiểm tra các nút
    buttons_info = []
    for idx, btn in enumerate(page.locator("header button, div button").all()[:15]):
        txt = btn.inner_text().strip()
        aria = btn.get_attribute("aria-label") or ""
        buttons_info.append(f"Btn {idx}: txt='{txt}', aria='{aria}'")
    print("\n".join(buttons_info[:10]))
    
    browser.close()
