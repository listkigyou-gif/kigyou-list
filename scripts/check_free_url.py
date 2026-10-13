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
    url = "https://www.value-press.com/users/free_course_articles/new"
    print("Navigating to actual Free Plan URL:", url)
    page.goto(url, wait_until="domcontentloaded")
    time.sleep(3)
    
    print("Current URL:", page.url)
    print("Page Title:", repr(page.title()))
    
    screen_path = "c:/kigyou-list/scripts/actual_free_plan_editor.png"
    page.screenshot(path=screen_path, full_page=True)
    print("Screenshot saved to:", screen_path)
    
    context.close()
