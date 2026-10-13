import os
import sys
import time
from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".linkedin_user_profile"))
IMG_PATH = r"C:\Users\admin\.gemini\antigravity-ide\brain\d9896013-af63-44e9-b2a5-b9bf802d5608\linkedin_eyecatch_art1_1791642324925.jpg"

post_text = (
    "【営業DXの真実】「法人名簿は月3万〜10万円が相場」という常識、まだ信じていませんか？\n\n"
    "新規開拓やインサイドセールス（IS）チームで、最も重い固定費になりやすいのが「法人リストツールの年間契約縛り」です。\n\n"
    "■ 従来の法人名簿サービスが抱える課題：\n"
    "・月額30,000円〜100,000円の高額コスト\n"
    "・1年間の年間契約縛り（途中解約不可）\n"
    "・ダウンロード件数や閲覧上限による追加課金\n\n"
    "■ Kigyou-list（企業リスト.com）が選ばれる理由：\n"
    "✅ 月額たったの 4,980円（税込）\n"
    "✅ 年間契約の縛りなし（いつでも解約・再開可能）\n"
    "✅ 全国500万社超（国税庁公表法人100%）に無制限アクセス\n"
    "✅ ハローワーク求人・助成金受給・官公庁入札の「シグナル営業」対応\n"
    "✅ AI問い合わせフォーム自動送信（1件あたり16.1円の圧倒的費用対効果）\n\n"
    "「必要な時だけ使って、成果を最大化する」\n"
    "新しい時代のB2B営業基盤をぜひご体験ください。\n\n"
    "詳細な機能比較および500万社の検索デモは【最初のコメント欄】に掲載しています👇\n"
    "---\n"
    "#営業DX #法人リスト #インサイドセールス #新規開拓 #B2Bマーケティング #KigyouList #企業リスト"
)

with sync_playwright() as p:
    args = ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
    context = p.chromium.launch_persistent_context(
        user_data_dir=PROFILE_DIR, channel="chrome", headless=True, args=args, viewport={"width": 1280, "height": 900}
    )
    page = context.pages[0] if context.pages else context.new_page()
    page.goto("https://www.linkedin.com/preload/sharebox/", wait_until="domcontentloaded")
    time.sleep(4)
    
    # 1. Editor
    editor = page.locator('div.ql-editor').first
    editor.click()
    page.keyboard.insert_text(post_text)
    time.sleep(2)
    
    # 2. Media
    with page.expect_file_chooser(timeout=10000) as fc_info:
        page.locator('button[aria-label="Add media"]').first.click()
    fc_info.value.set_files(IMG_PATH)
    time.sleep(4)
    
    # 3. Next
    page.locator('button:has-text("Next")').first.click()
    time.sleep(3)
    
    # 4. Click the REAL primary action Post button!
    print("Clicking REAL Post button at bottom right (button.share-actions__primary-action)...")
    real_post_btn = page.locator('button.share-actions__primary-action').first
    print("Real post button text:", real_post_btn.inner_text(), "classes:", real_post_btn.get_attribute("class"))
    real_post_btn.click()
    
    print("Waiting 10s for publish to complete...")
    time.sleep(10)
    page.screenshot(path="scripts/final_published_live.png")
    
    # 5. First Comment on feed
    print("Adding First Comment on feed...")
    page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
    time.sleep(5)
    
    comment_btn = page.locator('button.comment-button, button:has-text("Comment")').first
    if comment_btn.is_visible(timeout=5000):
        comment_btn.click()
        time.sleep(2)
        cbox = page.locator('div.comments-comment-box__editor, div.ql-editor[role="textbox"]').first
        if cbox.is_visible(timeout=5000):
            cbox.click()
            time.sleep(1)
            page.keyboard.insert_text("詳細な他社比較データと500万社の無料検索デモはこちらから👇\nhttps://kigyoulist.com/ja/compare?utm_source=linkedin&utm_medium=social&utm_campaign=launch_post")
            time.sleep(2)
            page.locator('button.comments-comment-box__submit-button').first.click()
            print("First comment posted successfully!")
            time.sleep(3)
            page.screenshot(path="scripts/final_commented_live.png")
            
    context.close()
    print("ALL DONE!")
