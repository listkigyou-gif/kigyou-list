import os
import sys
import time
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(storage_state=STORAGE_STATE, viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto("https://zenn.dev", wait_until="networkidle", timeout=30000)
    page.locator("button:has-text('投稿する'), a:has-text('投稿する')").first.click()
    time.sleep(1)
    page.locator("text='記事を作成'").first.click()
    time.sleep(2)
    
    # Click 公開設定
    page.locator("button[aria-label='公開設定']").first.click()
    time.sleep(2)
    
    # Find element containing 'トピックを5つまで入力'
    el_info = page.evaluate("""() => {
        const els = Array.from(document.querySelectorAll('*'));
        const matched = els.filter(el => 
            (el.placeholder && el.placeholder.includes('トピック')) ||
            (el.innerText && el.innerText.includes('トピックを5つまで入力')) ||
            (el.getAttribute('placeholder') && el.getAttribute('placeholder').includes('トピック'))
        );
        return matched.map(m => ({
            tag: m.tagName,
            cls: m.className,
            placeholder: m.placeholder || m.getAttribute('placeholder'),
            outerHTML: m.outerHTML.slice(0, 200)
        }));
    }""")
    print("Found topic elements:", el_info)
    browser.close()
