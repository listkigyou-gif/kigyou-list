import os
import sys
import json
import time
import re
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ARTICLE_PATH = r"c:\kigyou-list\scripts\zenn\articles\nextjs_cloudflare_5m_seo_architecture.md"
STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"
BASE_DIR = r"c:\kigyou-list\scripts\zenn"
ARTICLE_SLUG = "1de5e66778e2c5"
ARTICLE_EDIT_URL = f"https://zenn.dev/articles/{ARTICLE_SLUG}/edit"

with open(ARTICLE_PATH, "r", encoding="utf-8") as f:
    raw_content = f.read()

match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw_content, re.DOTALL)
if match:
    body_content = match.group(2).strip()
    title = "【Next.js/Cloudflare】500万ページの超大規模Webサービスを低コスト・爆速で構築するSEOアーキテクチャ"
    topics = ["nextjs", "cloudflare", "seo", "typescript", "web"]
else:
    body_content = raw_content
    title = "【Next.js/Cloudflare】500万ページの超大規模Webサービスを低コスト・爆速で構築するSEOアーキテクチャ"
    topics = ["nextjs", "cloudflare", "seo", "typescript", "web"]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state=STORAGE_STATE,
        viewport={"width": 1440, "height": 900}
    )
    page = context.new_page()
    
    print(f"[1] Mở trang soạn thảo bài 04: {ARTICLE_EDIT_URL}...")
    page.goto(ARTICLE_EDIT_URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    
    # Phương thức 1: Thử Publish qua REST API chính thức của Zenn
    print("[2] Thử kích hoạt published: true qua Zenn API...")
    publish_res = page.evaluate("""async (data) => {
        const metaCsrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (metaCsrf) {
            headers['X-CSRF-Token'] = metaCsrf;
        }
        
        const payload = {
            article: {
                title: data.title,
                body_markdown: data.body,
                article_type: "tech",
                emoji: "⚡",
                topics: data.topics,
                published: true
            }
        };
        
        const res = await fetch(`/api/articles/${data.slug}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        let resJson = null;
        try {
            resJson = await res.json();
        } catch(e) {}
        
        return {
            status: res.status,
            body: resJson
        };
    }""", {"slug": ARTICLE_SLUG, "title": title, "body": body_content, "topics": topics})
    
    print("API Publish Status:", publish_res["status"])
    print("API Publish Body:", json.dumps(publish_res.get("body"), ensure_ascii=False))
    
    # Nếu API thành công (200/204)
    if publish_res["status"] in [200, 204]:
        print("[SUCCESS] Xuất bản bài viết thành công qua Zenn API!")
    else:
        # Nếu API chưa cho hoặc cần UI confirmation:
        print("[*] API trả về status:", publish_res["status"], "-> Thử kích hoạt qua giao diện...")
        # Reload để cập nhật DOM mới nhất
        page.reload(wait_until="networkidle")
        time.sleep(3)
        
        # Bấm toggle nếu chưa bật
        header_pub = page.locator("header button:has-text('公開する')")
        if header_pub.count() == 0:
            toggle = page.locator(".ToggleSwitch-module-scss-module__jWc2Pa__switchMark, button[aria-label='公開する']").first
            toggle.click()
            time.sleep(1)
            
        # Click header button
        page.locator("header button:has-text('公開する')").first.click()
        time.sleep(2)
        
        # Click modal button
        modal_btn = None
        for b in page.locator("button:has-text('公開する')").all():
            box = b.bounding_box()
            if box and box['y'] > 200:
                modal_btn = b
                break
        if modal_btn:
            modal_btn.click()
            time.sleep(10)
            
    # Kiểm tra trạng thái trên Dashboard
    print("[3] Kiểm tra trạng thái trên Dashboard...")
    page.goto("https://zenn.dev/dashboard", wait_until="networkidle", timeout=30000)
    time.sleep(3)
    page.screenshot(path=os.path.join(BASE_DIR, "dashboard_published_live_check.png"))
    
    # Kiểm tra trang bài viết công khai
    public_url = f"https://zenn.dev/kigyoulist/articles/{ARTICLE_SLUG}"
    print(f"[4] Mở trang bài viết công khai: {public_url}...")
    page.goto(public_url, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    page.screenshot(path=os.path.join(BASE_DIR, "live_article_04_verified.png"))
    
    # Cuộn chụp ảnh 1 ở mục 2
    page.evaluate("window.scrollTo(0, 950)")
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "live_article_04_sec2.png"))
    
    # Cuộn chụp ảnh 2 ở mục 5
    page.evaluate("window.scrollTo(0, 4800)")
    time.sleep(2)
    page.screenshot(path=os.path.join(BASE_DIR, "live_article_04_sec5.png"))
    
    print("[+] Hoàn tất toàn bộ quy trình xuất bản và nghiệm thu bài 04!")
    browser.close()
