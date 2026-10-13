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
    
    print("Navigating to article edit page...")
    page.goto("https://www.value-press.com/users/free_course_articles/382297/edit", wait_until="domcontentloaded")
    time.sleep(3)
    
    # 1. Nếu đang ở Bước 1, bấm sang Bước 2
    step2_nav = page.locator("a#confirm, a:has-text('配信先、日時を設定する'), button:has-text('配信先、日時を設定する')")
    if step2_nav.count() > 0 and step2_nav.first.is_visible():
        print("Clicking '配信先、日時を設定する'...")
        step2_nav.first.click()
        time.sleep(3)
        
    # 2. Đảm bảo các cài đặt Bước 2 đã được chọn
    try:
        page.locator("#exaggerated_expression_confirmation_status_not_applicable").click()
        time.sleep(0.5)
        page.locator("#unpublished_url_flg_id_not_included").click()
        time.sleep(0.5)
        page.select_option("select#article_genre_id", value="2")
        time.sleep(0.5)
        page.select_option("select#article_category_id", value="2")
        time.sleep(0.5)
        print("✓ Step 2 fields confirmed.")
    except Exception as e:
        print("Note on step 2 settings:", e)
        
    # 3. Bấm "配信内容を確認する"
    print("Clicking '配信内容を確認する'...")
    confirm_btn = page.locator("a:has-text('配信内容を確認する'), button:has-text('配信内容を確認する')")
    if confirm_btn.count() > 0:
        confirm_btn.first.click()
        time.sleep(3)
        print("✓ Clicked '配信内容を確認する'")
    else:
        print("Warning: confirm_btn not found directly, checking DOM...")
        
    # 4. Kiểm tra xem có popup modal upsell (mời dùng Standard) không
    time.sleep(2)
    upsell_popup = page.locator("text='配信効果を高めるためにスタンダードで配信しませんか？', text='スタンダードで配信'")
    if upsell_popup.count() > 0:
        print("Upsell popup detected! Finding '次へ進む' button...")
        next_step_btn = page.locator("a:has-text('次へ進む'), button:has-text('次へ進む')")
        if next_step_btn.count() > 0:
            print("Clicking '次へ進む' to stay on Free Plan...")
            next_step_btn.first.click()
            time.sleep(4)
            print("✓ Clicked '次へ進む'")
            
    print("Current URL after Step 2 confirmation:", page.url)
    
    # 5. Chụp ảnh màn hình Bước 3 (trước khi nộp)
    step3_screen_before = "c:/kigyou-list/scripts/step3_confirmation.png"
    page.screenshot(path=step3_screen_before, full_page=True)
    print("Step 3 review screenshot saved to:", step3_screen_before)
    
    # 6. Tìm nút đặt lịch / xuất bản cuối cùng ở Bước 3
    final_buttons = page.evaluate("""() => {
        const els = Array.from(document.querySelectorAll('button, input[type="submit"], a, [role="button"]'));
        return els.map(el => ({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            text: el.innerText ? el.innerText.trim() : '',
            value: el.value || '',
            href: el.getAttribute('href') || ''
        })).filter(e => (e.text || e.value) && (e.text.length < 50));
    }""")
    
    print("\n--- Available Action Buttons on Step 3 ---")
    for b in final_buttons:
        txt = b['text'] or b['value']
        if any(w in txt for w in ['予約', '配信', '申請', '審査', '完了', '確定']):
            print("Final candidate button:", b)
            
    # Bấm nút nộp/đặt lịch phát hành cuối cùng nếu có
    # Thường là: 配信を予約する hoặc 内容を確定する hoặc 予約する
    submit_btn = page.locator("button:has-text('配信を予約する'), a:has-text('配信を予約する'), button:has-text('予約する'), a:has-text('予約する'), input[value*='予約']")
    if submit_btn.count() > 0:
        btn_text = submit_btn.first.inner_text() or submit_btn.first.get_attribute("value")
        print(f"\nFound Final Submit Button: '{btn_text}'. Clicking to finalize reservation...")
        submit_btn.first.click()
        time.sleep(5)
        print("Current URL after submission:", page.url)
        submitted_screen = "c:/kigyou-list/scripts/step3_submitted.png"
        page.screenshot(path=submitted_screen, full_page=True)
        print("Final submission screenshot saved to:", submitted_screen)
    else:
        print("No automatic submit button triggered, check review screen.")

    context.close()
