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
    page.goto("https://www.value-press.com/users/free_course_articles/382297", wait_until="domcontentloaded")
    time.sleep(3)
    
    # Dismiss upsell popup by clicking '次へ進む'
    print("Clicking '次へ進む' on upsell popup...")
    next_popup_btn = page.locator("button:has-text('次へ進む'), a:has-text('次へ進む')").first
    if next_popup_btn.count() > 0:
        next_popup_btn.click()
        time.sleep(2)
        print("  ✓ Closed upsell modal!")
        
    # Scroll to bottom
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1)
    
    # Inspect final submit button
    btns = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('button, a, input[type=\"submit\"]')).map(b => ({
            text: b.innerText ? b.innerText.trim() : b.value,
            tag: b.tagName,
            class: b.className,
            visible: b.offsetWidth > 0 && b.offsetHeight > 0
        })).filter(b => b.visible);
    }""")
    print("Visible buttons at bottom of Step 3:")
    for b in btns:
        print("  Button:", b)
        
    screen_path = "c:/kigyou-list/scripts/ready_to_submit_step3.png"
    page.screenshot(path=screen_path, full_page=True)
    print("Screenshot saved to:", screen_path)
    
    context.close()
