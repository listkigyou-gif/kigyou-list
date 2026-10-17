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
ARTICLE_EDIT_URL = "https://zenn.dev/articles/1de5e66778e2c5/edit"

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
    page.goto(ARTICLE_EDIT_URL, wait_until="networkidle", timeout=30000)
    time.sleep(2)
    
    # Cập nhật metadata draft qua API
    update_res = page.evaluate("""async (data) => {
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
                published: false
            }
        };
        
        const res = await fetch('/api/articles/1de5e66778e2c5', {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        return {
            status: res.status,
            body: await res.json()
        };
    }""", {"title": title, "body": body_content, "topics": topics})
    
    print("Update Draft Result:")
    print(json.dumps(update_res, ensure_ascii=False, indent=2))
    
    browser.close()
