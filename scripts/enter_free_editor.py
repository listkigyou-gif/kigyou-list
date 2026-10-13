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
    page.goto("https://www.value-press.com/users/articles/new_select_course", wait_until="domcontentloaded")
    time.sleep(3)
    
    # Locate the button under フリー
    print("Finding the Free plan button...")
    # The container has text 'フリー' and 'お試し用'
    free_container = page.locator("div:has-text('フリー'):has-text('お試し用')")
    free_btn = free_container.locator("a:has-text('このプランを利用する'), button:has-text('このプランを利用する')").first
    
    if free_btn.count() == 0:
        # Fallback: get all 'このプランを利用する' and pick the one with 0 yen
        all_btns = page.locator("a:has-text('このプランを利用する'), button:has-text('このプランを利用する')").all()
        print(f"Total 'このプランを利用する' buttons: {len(all_btns)}")
        free_btn = all_btns[-1] # Usually the 4th button
        
    print("Clicking Free Plan button:", free_btn)
    free_btn.click()
    time.sleep(4)
    
    print("New Page URL:", page.url)
    print("New Page Title:", repr(page.title()))
    
    screenshot_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "vp_editor_form.png"))
    page.screenshot(path=screenshot_path, full_page=True)
    print("Editor screenshot saved:", screenshot_path)
    
    # Inspect form fields
    inputs = page.locator("input, textarea, select").all()
    print(f"Total form controls: {len(inputs)}")
    for inp in inputs:
        try:
            name = inp.get_attribute("name")
            id_attr = inp.get_attribute("id")
            type_attr = inp.get_attribute("type")
            placeholder = inp.get_attribute("placeholder")
            print(f"Tag: {inp.tag_name} | Name: '{name}' | ID: '{id_attr}' | Type: '{type_attr}' | Placeholder: '{placeholder}'")
        except Exception:
            pass
            
    context.close()
