import os
import time
from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".x_user_profile"))

def inspect_profile():
    with sync_playwright() as p:
        args = ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",
            headless=True,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
        page = context.pages[0] if context.pages else context.new_page()
        print("Navigating to https://x.com/kigyoulist ...")
        page.goto("https://x.com/kigyoulist", wait_until="domcontentloaded")
        time.sleep(4)
        
        screenshot_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "x_profile_check.png"))
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")
        
        # Check tweets on profile
        tweets = page.locator('article[data-testid="tweet"]')
        count = tweets.count()
        print(f"Number of tweet elements found: {count}")
        for i in range(min(count, 5)):
            text = tweets.nth(i).inner_text()
            print(f"--- Tweet {i+1} ---")
            print(text[:150])
            
        context.close()

if __name__ == "__main__":
    inspect_profile()
