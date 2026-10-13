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

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".linkedin_user_profile"))

def check_profile():
    print(f"Checking LinkedIn session in: {PROFILE_DIR}")
    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox"
        ]
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",
            headless=True,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
        time.sleep(5)
        
        print(f"Current URL: {page.url}")
        cookies = context.cookies()
        has_li_at = any(c["name"] == "li_at" for c in cookies)
        print(f"Has li_at cookie: {has_li_at}")
        
        screenshot_path = os.path.join(os.path.dirname(__file__), "linkedin_profile_check.png")
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to: {screenshot_path}")
        
        is_feed = "linkedin.com/feed" in page.url or has_li_at
        if is_feed and "login" not in page.url:
            print("[SUCCESS] LinkedIn session is ACTIVE and verified!")
        else:
            print("[NOTICE] Still on login or redirected.")
            
        context.close()

if __name__ == "__main__":
    check_profile()
