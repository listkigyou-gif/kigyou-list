import os
import time
from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".x_user_profile"))

def check_new_tweet():
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
        page.goto("https://x.com/kigyoulist/status/2108915652002222106", wait_until="domcontentloaded")
        time.sleep(4)
        
        screenshot_path = "c:/kigyou-list/scripts/new_tweet_live.png"
        page.screenshot(path=screenshot_path)
        print(f"Saved screenshot of new tweet to {screenshot_path}")
        
        # Check text
        articles = page.locator('article[data-testid="tweet"]')
        print(f"Articles in thread: {articles.count()}")
        for i in range(articles.count()):
            safe = articles.nth(i).inner_text().replace('\n', ' ').encode('ascii', 'replace').decode('ascii')
            print(f"Tweet {i+1}: {safe[:100]}")
            
        context.close()

if __name__ == "__main__":
    check_new_tweet()
