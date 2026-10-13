import os
import sys
import time
from playwright.sync_api import sync_playwright

STORAGE_STATE = r"c:\kigyou-list\zenn_auth_state.json"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(storage_state=STORAGE_STATE, viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto("https://zenn.dev", wait_until="networkidle", timeout=30000)
    
    post_btn = page.locator("button:has-text('投稿する'), a:has-text('投稿する')").first
    post_btn.click()
    time.sleep(1)
    page.locator("text='記事を作成'").first.click()
    time.sleep(2)
    
    # Inspect elements near "Write in markdown"
    elements = page.evaluate("""() => {
        const els = Array.from(document.querySelectorAll('*'));
        return els.filter(el => (el.placeholder && el.placeholder.includes('markdown')) || 
                                (el.innerText && el.innerText.includes('Write in markdown')) ||
                                el.classList.contains('cm-editor') ||
                                el.classList.contains('cm-content') ||
                                el.getAttribute('contenteditable') === 'true' ||
                                el.tagName === 'TEXTAREA')
                  .map(el => ({
                      tagName: el.tagName,
                      className: el.className,
                      id: el.id,
                      placeholder: el.placeholder || '',
                      contentEditable: el.getAttribute('contenteditable') || '',
                      rect: el.getBoundingClientRect()
                  }));
    }""")
    print("Found matching editor elements:")
    for el in elements:
        print(el)
        
    browser.close()
