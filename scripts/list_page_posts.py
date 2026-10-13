import os
import sys
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PAGE_URL = "https://www.facebook.com/profile.php?id=61594160223303"
PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE_DIR,
        headless=True,
        channel="chrome",
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-notifications"],
        viewport={"width": 1280, "height": 1000}
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto(PAGE_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(4000)
    
    articles = page.locator('div[role="feed"] div[role="article"], div[role="article"]').all()
    print(f"Total articles found: {len(articles)}")
    for idx, art in enumerate(articles[:5]):
        txt = art.inner_text()
        print(f"--- Article {idx+1} ---")
        print(txt[:300].replace('\n', ' '))
    ctx.close()
