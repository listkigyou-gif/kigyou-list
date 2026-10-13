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
    
    print("Navigating to https://www.value-press.com/login (should redirect to dashboard)...")
    page.goto("https://www.value-press.com/login", wait_until="domcontentloaded")
    time.sleep(4)
    
    print("Redirected URL:", page.url)
    print("Title:", repr(page.title()))
    
    screenshot_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "vp_dashboard.png"))
    page.screenshot(path=screenshot_path)
    print("Screenshot saved to:", screenshot_path)
    
    # Check all links on page
    links = page.locator("a").all()
    print(f"Total links: {len(links)}")
    found = []
    for l in links:
        try:
            txt = l.inner_text().strip()
            href = l.get_attribute("href")
            if any(k in txt for k in ["プレスリリース", "作成", "投稿", "配信", "新規", "マイページ"]) or (href and any(k in href for k in ["press", "release", "create", "new", "entry"])):
                found.append(f"'{txt}' -> {href}")
        except Exception:
            pass
            
    print("\nActionable Links:")
    for f in found[:30]:
        print(" *", f)
        
    context.close()
