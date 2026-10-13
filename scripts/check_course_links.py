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

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=profile_dir, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto('https://www.value-press.com/users/articles/new_select_course')
    page.wait_for_timeout(3000)
    
    courses = page.evaluate("""() => {
        const btns = Array.from(document.querySelectorAll('a, button, form')).filter(e => e.innerText && e.innerText.includes('このプランを利用する'));
        return btns.map(b => ({
            tag: b.tagName,
            href: b.href || '',
            action: b.action || '',
            onclick: b.getAttribute('onclick') || '',
            parentText: b.parentElement ? b.parentElement.innerText.slice(0, 100) : ''
        }));
    }""")
    for i, c in enumerate(courses):
        print(f"[{i}] {c}")
    ctx.close()
