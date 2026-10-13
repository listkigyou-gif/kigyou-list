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
    page.goto("https://www.value-press.com/users/articles/382296/edit", wait_until="domcontentloaded")
    time.sleep(3)
    
    # 1. Click button to go to Step 2
    print("Navigating to Step 2...")
    next_btn = page.locator("a:has-text('配信先、日時を設定する'), button:has-text('配信先、日時を設定する')").first
    next_btn.click()
    time.sleep(4)
    
    # 2. Inspect Step 2 form controls
    print("Inspecting Step 2 form controls...")
    radios = page.locator("input[type='radio']").all()
    print(f"Total radio buttons: {len(radios)}")
    for i, r in enumerate(radios):
        name = r.get_attribute("name")
        val = r.get_attribute("value")
        # parent label or text
        parent_text = r.evaluate("el => el.parentElement ? el.parentElement.innerText.trim() : ''")
        print(f"Radio [{i}]: name='{name}' val='{val}' text='{parent_text}'")
        
    selects = page.locator("select").all()
    print(f"\nTotal selects: {len(selects)}")
    for s in selects:
        name = s.get_attribute("name")
        id_attr = s.get_attribute("id")
        options = s.evaluate("""el => Array.from(el.options).map(o => ({ value: o.value, text: o.text }))""")
        print(f"Select name='{name}' id='{id_attr}' options count: {len(options)}")
        for opt in options[:10]:
            print(f"   Option: {opt['value']} -> '{opt['text']}'")
            
    # Take screenshot of Step 2
    screen_path = "c:/kigyou-list/scripts/step2_inspect.png"
    page.screenshot(path=screen_path, full_page=True)
    print("Screenshot saved to:", screen_path)
    
    context.close()
