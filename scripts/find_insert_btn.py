import os
import sys

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".valuepress_user_profile"))
eyecatch_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=profile_dir, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto('https://www.value-press.com/users/articles/new')
    page.wait_for_timeout(3000)
    
    skip = page.locator("a:has-text('スキップ'), button:has-text('スキップ')")
    if skip.count() > 0:
        skip.first.click()
        page.wait_for_timeout(1000)
        
    page.locator("input[type='file'].slider, input[type='file']").first.set_input_files(eyecatch_path)
    page.wait_for_timeout(4000)
    
    info = page.evaluate("""() => {
        const els = Array.from(document.querySelectorAll('*')).filter(e => e.innerText && e.innerText.includes('挿入する') && e.children.length === 0);
        return els.map(e => ({
            tag: e.tagName,
            text: e.innerText,
            class: e.className,
            parentTag: e.parentElement ? e.parentElement.tagName : '',
            parentClass: e.parentElement ? e.parentElement.className : ''
        }));
    }""")
    print("Found elements with 挿入する:", info)
    
    # Try clicking it via locator
    insert_loc = page.locator("text='挿入する'")
    print("Locator count for text='挿入する':", insert_loc.count())
    if insert_loc.count() > 0:
        print("Clicking text='挿入する'...")
        insert_loc.first.click()
        page.wait_for_timeout(3000)
        print("Clicked! Screenshotting...")
        page.screenshot(path="c:/kigyou-list/scripts/after_insert_click.png")
        
    ctx.close()
