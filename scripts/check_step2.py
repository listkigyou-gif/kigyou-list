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
    page.goto("https://www.value-press.com/users/articles/382296/edit", wait_until="domcontentloaded")
    time.sleep(3)
    
    print("Clicking '配信先、日時を設定する' button...")
    next_btn = page.locator("a:has-text('配信先、日時を設定する'), button:has-text('配信先、日時を設定する')").first
    next_btn.click()
    time.sleep(4)
    
    print("New URL:", page.url)
    screen_path = "c:/kigyou-list/scripts/step2_settings.png"
    page.screenshot(path=screen_path, full_page=True)
    print("Screenshot saved to:", screen_path)
    
    context.close()
