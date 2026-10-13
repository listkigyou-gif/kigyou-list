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
eyecatch_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

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
    page.goto("https://www.value-press.com/users/articles/new", wait_until="domcontentloaded")
    time.sleep(3)
    
    skip_btn = page.locator("button:has-text('スキップ'), a:has-text('スキップ')")
    if skip_btn.count() > 0:
        skip_btn.first.click()
        time.sleep(1)
        
    print("Uploading image...")
    file_input = page.locator("input[type='file'].slider, input[type='file']").first
    file_input.set_input_files(eyecatch_path)
    time.sleep(4)
    
    # Inspect all elements in modal
    modal_info = page.evaluate("""() => {
        const modal = document.querySelector('.modal, .cropper, [class*="cropper"], [id*="eyecatch"]');
        return {
            html: modal ? modal.outerHTML.slice(0, 1000) : 'Not found',
            allButtonsInBody: Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], a')).map(b => ({
                text: b.innerText ? b.innerText.trim() : b.value,
                tag: b.tagName,
                class: b.className
            }))
        };
    }""")
    print("Modal HTML snippet:", modal_info.get("html")[:500])
    print("All buttons:", modal_info.get("allButtonsInBody"))
    
    context.close()
