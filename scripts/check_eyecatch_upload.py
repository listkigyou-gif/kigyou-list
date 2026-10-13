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
    page.goto('https://editor.note.com/notes/n9a0e993b5438/edit', wait_until='networkidle')
    time.sleep(2)

    cb = page.locator("button:has-text('閉じる')")
    if cb.count() > 0:
        cb.first.click()
        time.sleep(1)

    # Click the round eyecatch button
    round_btn = page.locator(".rounded-full.h-10.w-10").first
    print("Found round button:", round_btn.count())
    round_btn.click()
    time.sleep(1)

    # Check newly opened menu/options
    page.screenshot(path="c:/kigyou-list/scripts/eyecatch_menu.png")
    
    menu_items = page.locator("[role='menuitem'], [role='menu'] button, div:has-text('画像をアップロード')").all()
    print("Menu items found:", len(menu_items))
    for mi in menu_items:
        print("Menu item:", mi.inner_text())

    # Check if a file input was mounted
    file_inputs = page.locator("input[type='file']").all()
    print("File inputs after click:", len(file_inputs))
    for fi in file_inputs:
        print("File input accept:", fi.get_attribute("accept"))

    browser.close()
