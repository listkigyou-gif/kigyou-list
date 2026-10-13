import time
import sys
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

note_key = "n8996d29cfcba"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state='c:/kigyou-list/scripts/note_state.json',
        viewport={'width': 1440, 'height': 900}
    )
    page = context.new_page()

    put_completed = False

    def on_resp(res):
        global put_completed
        if 'text_notes' in res.url and res.request.method == 'PUT':
            print(f"\n[INTERCEPTED PUT] URL: {res.url}")
            print(f"Status: {res.status}")
            try:
                txt = res.text()
                print("Body:", txt[:300])
                if res.status in [200, 201]:
                    put_completed = True
            except Exception as e:
                print("Error reading body:", e)

    page.on('response', on_resp)

    publish_url = f"https://editor.note.com/notes/{note_key}/publish/"
    print(f"Navigating to {publish_url}...")
    page.goto(publish_url, wait_until='networkidle')
    time.sleep(3)

    # Click the contest card button for #自動化したいこと if present
    contest_btn = page.locator("button:has-text('#自動化したいこと'), button:has-text('自動化したいこと')").first
    if contest_btn.count() > 0:
        print("Found official contest button #自動化したいこと! Clicking to enroll...")
        contest_btn.click()
        time.sleep(1)

    # Click 投稿する button
    post_btn = page.locator("button:has-text('投稿する')").first
    print("Post button count:", post_btn.count(), "Enabled:", post_btn.is_enabled())
    box = post_btn.bounding_box()
    print("Post button box:", box)

    if box:
        print("Clicking post button...")
        page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
        time.sleep(0.1)
        page.mouse.down()
        time.sleep(0.1)
        page.mouse.up()
        print("Mouse released! Waiting 20 seconds for publication pipeline...")
        
        for i in range(20):
            time.sleep(1)
            if put_completed:
                print(f"Publication PUT finished after {i+1}s!")
                time.sleep(5)
                break

    page.screenshot(path="c:/kigyou-list/scripts/after_do_publish.png")
    print("Final Page URL:", page.url)
    browser.close()
