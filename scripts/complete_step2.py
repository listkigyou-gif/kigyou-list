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
    page.locator("a:has-text('配信先、日時を設定する')").first.click()
    time.sleep(3)
    
    # 2. Click the exact span IDs for compliance
    print("Clicking compliance spans...")
    page.locator("#exaggerated_expression_confirmation_status_not_applicable").click()
    time.sleep(1)
    page.locator("#unpublished_url_flg_id_not_included").click()
    time.sleep(1)
    print("  ✓ Clicked compliance spans successfully!")
    
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
    
    # Screenshot Step 2 filled
    screen_path2 = "c:/kigyou-list/scripts/step2_perfect.png"
    page.screenshot(path=screen_path2, full_page=True)
    print("Step 2 screenshot saved:", screen_path2)
    
    # 5. Click '配信内容を確認する' (Confirm distribution content) to go to Step 3
    print("Clicking '配信内容を確認する' to go to Step 3...")
    page.locator("a:has-text('配信内容を確認する'), button:has-text('配信内容を確認する')").first.click()
    time.sleep(5)
    
    print("Step 3 URL:", page.url)
    screen_path3 = "c:/kigyou-list/scripts/step3_review.png"
    page.screenshot(path=screen_path3, full_page=True)
    print("Step 3 screenshot saved:", screen_path3)
    
    context.close()
