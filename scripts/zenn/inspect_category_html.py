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
    page.locator("button[aria-label='公開設定']").first.click()
    time.sleep(1)
    
    # Inspect category elements
    cats = page.evaluate("""() => {
        const sections = Array.from(document.querySelectorAll('section'));
        const catSec = sections.find(s => s.innerText && s.innerText.includes('カテゴリー'));
        return catSec ? catSec.outerHTML : 'No category section';
    }""")
    print("Category section HTML:")
    print(cats)
    
    browser.close()
