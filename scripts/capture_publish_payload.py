import time
import sys
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(storage_state='c:/kigyou-list/scripts/note_state.json')
    page = context.new_page()

    def on_resp(res):
        if 'text_notes' in res.url and res.request.method == 'PUT':
            print('CAPTURED PUT RESPONSE:')
            print('Status:', res.status)
            print('Body:', res.text()[:400])

    page.on('response', on_resp)
    page.goto('https://editor.note.com/notes/n9a0e993b5438/publish/', wait_until='networkidle')
    time.sleep(2)
    btn = page.locator("button:has-text('投稿する')").first
    btn.click(force=True)
    time.sleep(5)
    browser.close()
