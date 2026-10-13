import os
import sys
import time

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".valuepress_user_profile"))

with sync_playwright() as p:
    args = [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox"
    ]
    context = p.chromium.launch_persistent_context(
        user_data_dir=profile_dir,
        headless=True,
        args=args,
        viewport={"width": 1366, "height": 900}
    )
    page = context.pages[0] if context.pages else context.new_page()
    page.goto("https://www.value-press.com/users/articles/382296/edit", wait_until="domcontentloaded")
    time.sleep(3)
    
    # 1. Click to go to Step 2
    print("Navigating to Step 2...")
    next_btn = page.locator("a:has-text('配信先、日時を設定する'), button:has-text('配信先、日時を設定する')").first
    next_btn.click()
    time.sleep(3)
    
    # 2. Check compliance radio buttons
    print("Selecting compliance radios...")
    # Radio 1: exaggerated expression
    page.locator("input[name='article[exaggerated_expression_confirmation_status]'][value='not_applicable']").check(force=True)
    time.sleep(1)
    
    # Radio 2: unpublished URL
    page.locator("input[name='article[unpublished_url_flg]'][value='not_included']").check(force=True)
    time.sleep(1)
    print("  ✓ Checked compliance radios")
    
    # 3. Select Genre (ネットサービス = 2)
    print("Selecting Genre (ネットサービス)...")
    page.select_option("select#article_genre_id", value="2")
    time.sleep(1)
    print("  ✓ Genre selected: ネットサービス")
    
    # 4. Select Category (サービス = 2)
    print("Selecting Category (サービス)...")
    page.select_option("select#article_category_id", value="2")
    time.sleep(1)
    print("  ✓ Category selected: サービス")
    
    # 5. Add hashtags if input exists
    tag_input = page.locator("input[placeholder*='ハッシュタグ'], input.tag-input, input#hashtag").first
    if tag_input.count() > 0:
        for tag in ["kigyoulist", "法人リスト", "企業データベース", "営業DX", "インテントデータ"]:
            try:
                tag_input.fill(tag)
                tag_input.press("Enter")
                time.sleep(0.5)
            except Exception:
                pass
        print("  ✓ Hashtags added")
        
    # Screenshot Step 2 filled
    page.screenshot(path="c:/kigyou-list/scripts/step2_filled.png", full_page=True)
    print("Step 2 filled screenshot saved: c:/kigyou-list/scripts/step2_filled.png")
    
    # 6. Click '配信内容を確認する' to proceed to Step 3
    print("Clicking '配信内容を確認する' to go to Step 3...")
    confirm_btn = page.locator("a:has-text('配信内容を確認する'), button:has-text('配信内容を確認する')").first
    confirm_btn.click()
    time.sleep(5)
    
    print("Current URL:", page.url)
    screen_step3 = "c:/kigyou-list/scripts/step3_confirmation.png"
    page.screenshot(path=screen_step3, full_page=True)
    print("Step 3 Confirmation screenshot saved to:", screen_step3)
    
    context.close()
