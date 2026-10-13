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

    page.goto('https://editor.note.com/notes/n389a9ef28df8/publish/', wait_until='networkidle')
    time.sleep(2)
    btn = page.locator("button:has-text('投稿する')").first
    box = btn.bounding_box()
    if box:
        page.mouse.click(box['x'] + box['width']/2, box['y'] + box['height']/2)
        time.sleep(3)
    page.screenshot(path='c:/kigyou-list/scripts/after_click_toast.png')
    
    # Check any toasts or error alerts
    alerts = page.locator("[role='alert'], .toast, div:has-text('エラー')").all()
    print('Alerts found:', len(alerts))
    for a in alerts:
        print('Alert:', a.inner_text())
    browser.close()
