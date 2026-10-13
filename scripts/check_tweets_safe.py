import os
import sys
import time
from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".x_user_profile"))

def check_all_tweets():
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
        page.goto("https://x.com/kigyoulist", wait_until="domcontentloaded")
        time.sleep(4)
        
        page.screenshot(path="c:/kigyou-list/scripts/profile_scroll.png")
        
        articles = page.locator('article[data-testid="tweet"]')
        count = articles.count()
        print(f"Total articles found: {count}")
        for i in range(count):
            art = articles.nth(i)
            links = art.locator('a[href*="/status/"]')
            link_href = links.first.get_attribute("href") if links.count() > 0 else "NO LINK"
            text = art.inner_text().replace("\n", " ")
            # Print safely
            safe_text = text.encode("ascii", "replace").decode("ascii")
            print(f"[{i}] Link: {link_href} | Text: {safe_text[:100]}")
            
        context.close()

if __name__ == "__main__":
    check_all_tweets()
