import os
import sys
import time

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".valuepress_user_profile"))

with sync_playwright() as p:
    args = [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox"
    ]
    context = p.chromium.launch_persistent_context(
        user_data_dir=profile_dir,
        headless=True,
        args=args,
        viewport={"width": 1366, "height": 900}
    )
    page = context.pages[0] if context.pages else context.new_page()
    page.goto("https://www.value-press.com/users/articles/new", wait_until="domcontentloaded")
    time.sleep(3)
    
    # Dismiss popup
    skip_btn = page.locator("button:has-text('スキップ'), a:has-text('スキップ')")
    if skip_btn.count() > 0:
        skip_btn.first.click()
        time.sleep(1)
        
    info = page.evaluate("""() => {
        const els = Array.from(document.querySelectorAll('input, textarea, div[contenteditable="true"], div[role="textbox"]'));
        return els.map((el, i) => ({
            index: i,
            tagName: el.tagName,
            type: el.type || '',
            name: el.name || '',
            id: el.id || '',
            placeholder: el.placeholder || el.getAttribute('data-placeholder') || '',
            className: el.className || ''
        }));
    }""")
    
    for item in info:
        print(item)
        
    context.close()
