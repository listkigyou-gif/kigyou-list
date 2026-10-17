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
    page.goto("https://www.value-press.com/users/articles", wait_until="domcontentloaded")
    time.sleep(3)
    
    # 1. Tìm các link trên trang users/articles
    elements = page.evaluate("""() => {
        const els = Array.from(document.querySelectorAll('a'));
        return els.map(a => ({
            text: a.innerText.trim(),
            href: a.href
        })).filter(a => a.href.includes('pressrelease') || a.text.includes('500万社') || a.text.includes('Kigyou') || a.href.includes('users/articles/'));
    }""")
    print("Links on users/articles:", elements)
    
    # 2. Truy cập tab 案件管理 (Quản lý dự án)
    anken_link = page.locator("a:has-text('案件管理')")
    if anken_link.count() > 0:
        anken_link.first.click()
        time.sleep(3)
        print("Anken URL:", page.url)
        anken_items = page.evaluate("""() => {
            const els = Array.from(document.querySelectorAll('a, tr, .article_item, .list_item'));
            return els.map(el => ({
                tag: el.tagName,
                text: el.innerText ? el.innerText.trim().replace(/\\s+/g, ' ') : '',
                href: el.getAttribute('href') || ''
            })).filter(e => e.text.includes('500万社') || e.text.includes('Kigyou') || e.href.includes('pressrelease'));
        }""")
        print("Anken items:", anken_items)
        page.screenshot(path="c:/kigyou-list/scripts/anken_list.png", full_page=True)

    context.close()
