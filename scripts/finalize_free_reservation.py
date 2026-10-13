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
    
    # Auto accept mọi dialog (như alert/confirm "本当に配信予約しますか？")
    page.on("dialog", lambda dialog: dialog.accept())
    
    print("Navigating to confirm page (Step 3)...")
    page.goto("https://www.value-press.com/users/free_course_articles/382297/confirm", wait_until="domcontentloaded")
    time.sleep(3)
    
    print("Current URL:", page.url)
    
    # 1. Đóng modal upsell bằng cách click vào span '次へ進む'
    close_span = page.locator(".advertisement_modal_box_bottom .reset, .advertisement_modal_box_bottom span")
    if close_span.count() > 0:
        print("Clicking '.advertisement_modal_box_bottom span' to close upsell modal...")
        close_span.first.click()
        time.sleep(2)
        print("✓ Upsell modal closed.")
    else:
        print("Modal span not found or already closed.")
        
    # Xóa triệt để mask nếu còn sót lại trong DOM để không cản trở pointer events
    page.evaluate("""() => {
        const masks = document.querySelectorAll('.modal_media_compatibility_mask, .modal_media_compatibility');
        masks.forEach(m => m.remove());
    }""")
    time.sleep(1)

    # 2. Scroll xuống đáy trang để kích hoạt nút đặt lịch
    print("Scrolling to bottom to enable submit button...")
    page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)
    
    btn_status = page.evaluate("""() => {
        const btn = document.querySelector('#apply-confirm');
        if (!btn) return { exists: false };
        return {
            exists: true,
            disabled: btn.disabled,
            className: btn.className,
            text: btn.innerText
        };
    }""")
    print("Submit button status:", btn_status)
    
    # 3. Click nút '内容を確認し、配信予約する'
    print("Clicking '#apply-confirm' (内容を確認し、配信予約する)...")
    page.evaluate("""() => {
        const btn = document.querySelector('#apply-confirm');
        if (btn) {
            btn.disabled = false;
            btn.click();
        }
    }""")
    
    # Đợi xử lý submit
    time.sleep(6)
    print("After submission URL:", page.url)
    
    # Kiểm tra xem có popup xác nhận lần 2 không (SweetAlert2 hoặc Modal xác nhận)
    secondary_confirm = page.locator(".swal2-confirm, button:has-text('OK'), button:has-text('はい'), button:has-text('予約する')")
    if secondary_confirm.count() > 0 and secondary_confirm.first.is_visible():
        print("Secondary confirm button detected! Clicking:", secondary_confirm.first.inner_text())
        secondary_confirm.first.click()
        time.sleep(5)
        print("After secondary confirm URL:", page.url)

    # Chụp ảnh kết quả cuối cùng
    res_screenshot = "c:/kigyou-list/scripts/final_published_status.png"
    page.screenshot(path=res_screenshot, full_page=True)
    print("Final status screenshot saved to:", res_screenshot)
    
    context.close()
