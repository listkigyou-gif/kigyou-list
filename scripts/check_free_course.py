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
        viewport={"width": 1366, "height": 1200}
    )
    page = context.pages[0] if context.pages else context.new_page()
    page.goto("https://www.value-press.com/users/articles/new_select_course", wait_until="domcontentloaded")
    time.sleep(3)
    
    # Scroll down and check
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(2)
    
    screenshot_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "vp_select_course_full.png"))
    page.screenshot(path=screenshot_path, full_page=True)
    print("Full page screenshot saved:", screenshot_path)
    
    # Check text content for 'フリー' or '無料'
    content = page.content()
    has_free = "フリー" in content or "無料" in content
    print("Has free keyword in HTML:", has_free)
    
    # Search all occurrences of フリー
    links_and_texts = page.locator("a, button, p, div, span").all()
    for el in links_and_texts:
        try:
            t = el.inner_text().strip()
            if "フリー" in t or "無料" in t or "無料プラン" in t:
                print(f"Found: {el.tag_name} -> {t[:60]}")
        except Exception:
            pass
            
    context.close()
