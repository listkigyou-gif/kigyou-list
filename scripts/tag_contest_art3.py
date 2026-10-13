import time
import sys
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

note_key = "nea6dd7ff864c"

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

    # Click the Nikkei / #チームだからできたこと contest card
    team_contest = page.locator("button:has-text('チームだからできたこと'), button:has-text('日本経済新聞')").first
    if team_contest.count() > 0:
        print("Clicking contest card for #チームだからできたこと...")
        team_contest.click()
        time.sleep(1)

        # Confirm modal if pops up
        confirm_btn = page.locator("button:has-text('内容に同意して応募')").first
        if confirm_btn.count() > 0:
            print("Confirming contest modal...")
            confirm_btn.click()
            time.sleep(1.5)

    # Fill tags
    tag_input = page.locator("input[placeholder*='ハッシュタグ'], input[placeholder*='タグ']").first
    if tag_input.count() > 0:
        for tag in ["チームだからできたこと", "営業組織", "業務効率化", "営業DX", "kigyoulist"]:
            tag_input.fill(tag)
            page.keyboard.press("Enter")
            time.sleep(0.3)

    # Add to magazine
    add_mag_btn = page.locator("button:has-text('追加')").first
    if add_mag_btn.count() > 0:
        print("Adding to official magazine...")
        add_mag_btn.click()
        time.sleep(1)

    page.screenshot(path='c:/kigyou-list/scripts/contest_art3_tags.png')
    print("Article 3 tagged and magazine attached successfully!")
    browser.close()
