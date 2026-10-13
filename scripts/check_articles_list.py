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
    
    print("Projects URL:", page.url)
    screenshot_path = "c:/kigyou-list/scripts/vp_articles_list.png"
    page.screenshot(path=screenshot_path, full_page=True)
    print("Screenshot saved to:", screenshot_path)
    
    # List items
    items = page.evaluate("""() => {
        const rows = Array.from(document.querySelectorAll('tr, .article_item, .release_item, [class*=\"article\"], [class*=\"release\"]'));
        return rows.map(r => r.innerText.replace(/\\s+/g, ' ').trim()).filter(t => t.length > 5 && t.length < 300);
    }""")
    for it in items[:15]:
        print("Item:", it)
        
    context.close()
