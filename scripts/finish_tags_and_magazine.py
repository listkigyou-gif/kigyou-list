import time
import sys
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

note_key = "nf011c38f4a46"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state='c:/kigyou-list/scripts/note_state.json',
        viewport={'width': 1440, 'height': 900}
    )
    page = context.new_page()
    publish_url = f"https://editor.note.com/notes/{note_key}/publish/"
    page.goto(publish_url, wait_until='networkidle')
    time.sleep(2)

    # Fill tags
    tag_input = page.locator("input[placeholder*='ハッシュタグ'], input[placeholder*='タグ']").first
    if tag_input.count() > 0:
        for tag in ["AIとできたこと", "生成AI", "営業DX", "新規開拓", "kigyoulist"]:
            tag_input.fill(tag)
            page.keyboard.press("Enter")
            time.sleep(0.3)

    # Add to magazine
    add_mag_btn = page.locator("button:has-text('追加')").first
    if add_mag_btn.count() > 0:
        print("Adding to official magazine...")
        add_mag_btn.click()
        time.sleep(1)

    page.screenshot(path='c:/kigyou-list/scripts/art2_ready_screen.png')
    print("Everything configured and ready!")
    browser.close()
