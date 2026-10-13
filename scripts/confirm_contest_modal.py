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

    ai_contest = page.locator("button:has-text('10月18日まで')").first
    if ai_contest.count() > 0:
        ai_contest.click()
        time.sleep(1)

    # Click 内容に同意して応募
    confirm_btn = page.locator("button:has-text('内容に同意して応募')").first
    if confirm_btn.count() > 0:
        print("Found modal button: 内容に同意して応募. Clicking...")
        confirm_btn.click()
        time.sleep(2)

    page.screenshot(path='c:/kigyou-list/scripts/contest_applied_screen.png')
    print("Contest applied successfully!")
    browser.close()
