import time
import sys
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(storage_state='c:/kigyou-list/scripts/note_state.json', viewport={'width': 1440, 'height': 900})
    page = context.new_page()
    page.goto('https://editor.note.com/notes/n8996d29cfcba/publish/', wait_until='networkidle')
    time.sleep(2)
    buttons = page.locator('button').all()
    print(f'Total buttons: {len(buttons)}')
    for i, b in enumerate(buttons):
        txt = b.inner_text().strip().replace('\n', ' ')
        print(f'{i}: text="{txt}", box={b.bounding_box()}')
    page.screenshot(path='c:/kigyou-list/scripts/publish_screen_buttons.png')
    browser.close()
