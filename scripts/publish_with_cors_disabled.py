import time
import sys
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

note_key = "n8996d29cfcba"

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
    )
    context = browser.new_context(
        storage_state='c:/kigyou-list/scripts/note_state.json',
        viewport={'width': 1440, 'height': 900}
    )
    page = context.new_page()

    def on_resp(res):
        if 'text_notes' in res.url:
            print(f"[PUT/POST RESP] {res.status} {res.url}")
            try:
                print("Body:", res.text()[:200])
            except:
                pass

    page.on('response', on_resp)
    publish_url = f"https://editor.note.com/notes/{note_key}/publish/"
    print(f"Going to {publish_url} with CORS disabled...")
    page.goto(publish_url, wait_until='networkidle')
    time.sleep(3)

    # Click contest card for #自動化したいこと
    contest_btn = page.locator("button:has-text('11月1日まで')").first
    if contest_btn.count() > 0:
        print("Clicking contest card...")
        contest_btn.click()
        time.sleep(1)

    btn = page.locator("button:has-text('投稿する')").first
    box = btn.bounding_box()
    if box:
        print("Clicking 投稿する button with mouse...")
        page.mouse.click(box['x'] + box['width']/2, box['y'] + box['height']/2)
        print("Clicked! Waiting 15s...")
        time.sleep(15)

    page.screenshot(path="c:/kigyou-list/scripts/after_cors_disabled_post.png")
    print("Page URL after submission:", page.url)
    browser.close()
