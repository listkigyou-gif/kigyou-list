import time
import sys
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        storage_state='c:/kigyou-list/scripts/note_state.json',
        viewport={'width': 1440, 'height': 900}
    )
    page = context.new_page()

    note_key = "n9a0e993b5438"
    publish_url = f"https://editor.note.com/notes/{note_key}/publish/"
    page.goto(publish_url, wait_until='networkidle')
    time.sleep(3)

    # Click 投稿する with real mouse pointer event
    post_btn = page.locator("button:has-text('投稿する')").first
    box = post_btn.bounding_box()
    print("Post button bounding box:", box)
    if box:
        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2
        print(f"Clicking at ({cx}, {cy})...")
        page.mouse.move(cx, cy)
        time.sleep(0.1)
        page.mouse.down()
        time.sleep(0.1)
        page.mouse.up()
        print("Mouse released! Waiting 8s for submission...")
        time.sleep(8)

    print("URL after publish attempt:", page.url)
    page.screenshot(path="c:/kigyou-list/scripts/post_submitted.png")

    browser.close()
