import time
import sys
import os
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

IMAGE_PATH = r"C:\Users\admin\.gemini\antigravity-ide\brain\a377b949-c675-4f33-9153-caea7180cdf3\note_cover_article1_1791620252708.jpg"

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

    print("Clicking eyecatch round button...")
    round_btn = page.locator(".rounded-full.h-10.w-10").first
    round_btn.click()
    time.sleep(1)

    print("Triggering file chooser for image upload...")
    with page.expect_file_chooser() as fc_info:
        page.locator("text='画像をアップロード'").first.click()
    
    file_chooser = fc_info.value
    file_chooser.set_files(IMAGE_PATH)
    print(f"File set: {IMAGE_PATH}")
    time.sleep(4)

    # Inspect modal buttons
    modal_btns = page.locator(".ReactModalPortal button").all()
    print("Modal buttons:", len(modal_btns))
    for b in modal_btns:
        print("-> Button in modal:", b.inner_text().strip())

    # Click the confirm button in CropModal (usually 保存 or 適用)
    save_crop = page.locator(".ReactModalPortal button:has-text('保存')")
    if save_crop.count() > 0:
        print("Clicking modal 保存...")
        save_crop.first.click()
        time.sleep(4)

    # Save note draft
    save_draft = page.locator("header button:has-text('下書き保存'), button:has-text('下書き保存')").first
    if save_draft.is_enabled():
        print("Clicking 下書き保存...")
        save_draft.click()
        time.sleep(4)

    page.screenshot(path="c:/kigyou-list/scripts/after_eyecatch_upload.png")
    print("Done! Saved screenshot to after_eyecatch_upload.png")
    browser.close()
