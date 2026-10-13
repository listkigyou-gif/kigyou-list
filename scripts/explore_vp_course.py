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
    
    url = "https://www.value-press.com/users/articles/new_select_course"
    print("Navigating to:", url)
    page.goto(url, wait_until="domcontentloaded")
    time.sleep(3)
    
    print("Current URL:", page.url)
    screenshot_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "vp_select_course.png"))
    page.screenshot(path=screenshot_path)
    print("Screenshot saved to:", screenshot_path)
    
    # List buttons and links
    elements = page.locator("a, button, input[type='submit'], input[type='radio']").all()
    for el in elements:
        try:
            txt = el.inner_text().strip() if el.tag_name != "input" else el.get_attribute("value")
            href = el.get_attribute("href")
            name = el.get_attribute("name")
            print(f"Tag: {el.tag_name} | Text/Val: '{txt}' | Href: '{href}' | Name: '{name}'")
        except Exception:
            pass
            
    context.close()
