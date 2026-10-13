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
new_eyecatch = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

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
    
    # Check if there is an 'x' button on current eyecatch image
    print("Checking for existing image delete button...")
    del_btn = page.locator("div#eyecatch_field .close, div#eyecatch_field .delete, div#eyecatch_field svg, div#eyecatch_field i, div#eyecatch_field span").all()
    # Or find element with role or click the top right X
    # In screenshot test_after_crop.png, there was a black circle with an X icon at top-right of image
    x_btn = page.locator("div#eyecatch_field >> xpath=..").locator("*:has-text('×'), button.close, [class*='delete'], [class*='close']").first
    
    # Try deleting via evaluate if there's a delete icon
    removed = page.evaluate("""() => {
        const x = document.querySelector('#eyecatch_field .close, #eyecatch_field [class*="del"], #eyecatch_field [class*="close"], #eyecatch_field svg');
        if (x) {
            x.click();
            return true;
        }
        return false;
    }""")
    print("Delete button clicked via evaluate:", removed)
    time.sleep(2)
    
    # Upload new eyecatch
    print("Uploading new eyecatch with kigyoulist.com...")
    file_input = page.locator("input[type='file'].slider, input[type='file']").first
    file_input.set_input_files(new_eyecatch)
    
    print("Waiting 6 seconds for image processing and S3...")
    time.sleep(6)
    
    insert_btn = page.locator("div.vue-cropper-applybtn")
    if insert_btn.count() > 0:
        print("Clicking vue-cropper-applybtn...")
        insert_btn.first.click()
        time.sleep(5)
        print("Inserted new image successfully!")
        
    # Save draft
    print("Saving draft...")
    page.evaluate("""() => {
        const btns = Array.from(document.querySelectorAll('.save-draft, button, a')).filter(b => b.innerText && b.innerText.includes('下書き保存'));
        for (const b of btns) {
            if (b.offsetWidth > 0 && b.offsetHeight > 0) {
                b.click();
                return;
            }
        }
        if (btns.length > 0) btns[0].click();
    }""")
    time.sleep(4)
    
    screen_path = "c:/kigyou-list/scripts/updated_banner_draft.png"
    page.screenshot(path=screen_path, full_page=True)
    print("Screenshot saved to:", screen_path)
    
    context.close()
