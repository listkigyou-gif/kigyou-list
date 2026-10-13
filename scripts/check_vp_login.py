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
    
    print("Navigating to https://www.value-press.com/login ...")
    page.goto("https://www.value-press.com/login", wait_until="domcontentloaded")
    time.sleep(3)
    
    print("Current URL:", page.url)
    print("Page Title:", page.title())
    
    cookies = context.cookies()
    print("Total cookies:", len(cookies))
    for c in cookies:
        if "value-press" in c.get("domain", ""):
            print("Cookie:", c.get("name"), c.get("domain"), c.get("expires"))
            
    screenshot_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "vp_login_state.png"))
    page.screenshot(path=screenshot_path)
    print("Screenshot saved to:", screenshot_path)
    
    context.close()
