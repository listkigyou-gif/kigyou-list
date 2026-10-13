import os
import sys
import time
from typing import Optional
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))
FANPAGE_URL = "https://www.facebook.com/profile.php?id=61594160223303"
PERSONAL_URL = "https://www.facebook.com/"

def post_to_fanpage(page, text: str, image_path: Optional[str] = None) -> bool:
    """Đăng bài lên Fanpage Kigyou List"""
    print("\n" + "=" * 60)
    print("📢 [KÊNH 1/2] Đang tiến hành đăng bài lên Fanpage Kigyou List...")
    print("=" * 60)
    try:
        page.goto(FANPAGE_URL, wait_until="domcontentloaded")
        time.sleep(5)
        page.keyboard.press("Escape")

        # Switch sang quản trị page nếu có nút Switch Now
        switch_btn = page.locator('div[role="button"]:has-text("Switch Now")').first
        if switch_btn.count() > 0 and switch_btn.is_visible():
            print("  -> Chuyển sang profile quản trị Page...")
            switch_btn.click()
            time.sleep(5)

        # Mở dialog tạo bài
        print("  -> Mở khung soạn bài viết...")
        create_trigger = page.locator('div[role="button"]:has-text("What\'s on your mind"), span:has-text("What\'s on your mind")').first
        create_trigger.wait_for(state="visible", timeout=10000)
        create_trigger.click()
        time.sleep(3)

        dialog = page.locator('div[role="dialog"]').first
        dialog.wait_for(state="visible", timeout=10000)

        # Đính kèm ảnh
        if image_path and os.path.exists(image_path):
            print(f"  -> Upload hình ảnh: {image_path}...")
            photo_icon = dialog.locator('div[aria-label="Photo/video"]').first
            if photo_icon.count() > 0 and photo_icon.is_visible():
                photo_icon.click()
                time.sleep(2)
            file_input = dialog.locator('input[type="file"]').first
            file_input.wait_for(state="attached", timeout=10000)
            file_input.set_input_files(image_path)
            time.sleep(4)

        # Nhập văn bản
        print("  -> Nhập nội dung bài viết...")
        editor = dialog.locator('div[role="textbox"][contenteditable="true"]').first
        editor.wait_for(state="visible", timeout=10000)
        editor.click()
        time.sleep(1)
        page.keyboard.insert_text(text)
        time.sleep(2)

        # Bấm Next nếu có
        next_btn = dialog.locator('div[aria-label="Next"][role="button"], div[role="button"]:has-text("Next")').first
        if next_btn.count() > 0 and next_btn.is_visible():
            print("  -> Bấm Next...")
            next_btn.click()
            time.sleep(4)

        # Bấm Post
        print("  -> Bấm Post xác nhận...")
        post_span = dialog.locator('span:text-is("Post")').last
        post_span.wait_for(state="visible", timeout=10000)
        post_span.click(force=True)
        print("  -> Đã gửi lệnh Post! Chờ hoàn tất...")
        time.sleep(12)

        shot = os.path.join(os.path.dirname(__file__), "facebook_fanpage_live.png")
        page.screenshot(path=shot)
        print(f"  [+] 🎉 Fanpage: Đăng bài thành công! Đã lưu: {shot}")
        return True
    except Exception as e:
        print(f"  [-] Lỗi đăng Fanpage: {e}")
        err_shot = os.path.join(os.path.dirname(__file__), "facebook_fanpage_error.png")
        try:
            page.screenshot(path=err_shot)
        except Exception:
            pass
        return False

def post_to_personal_profile(page, text: str, image_path: Optional[str] = None) -> bool:
    """Đăng bài lên Trang cá nhân Facebook"""
    print("\n" + "=" * 60)
    print("👤 [KÊNH 2/2] Đang tiến hành đăng bài lên Trang cá nhân...")
    print("=" * 60)
    try:
        page.goto(PERSONAL_URL, wait_until="domcontentloaded")
        time.sleep(5)
        page.keyboard.press("Escape")

        # Kiểm tra nếu đang ở giao diện lock/switch hoặc có nút avatar chuyển đổi
        top_avatar = page.locator('div[role="button"][aria-label="Your profile"], div[role="button"][aria-label="あなたのプロフィール"]').first
        if top_avatar.count() > 0 and top_avatar.is_visible():
            top_avatar.click()
            time.sleep(2)
            # Tìm profile cá nhân trong menu chuyển đổi
            personal_switch = page.locator('span:has-text("Takahashi Rika"), div[role="button"]:has-text("Takahashi Rika")').first
            if personal_switch.count() > 0 and personal_switch.is_visible():
                print("  -> Chuyển về trang cá nhân Takahashi Rika...")
                personal_switch.click()
                time.sleep(5)
            else:
                page.keyboard.press("Escape")

        # Mở khung soạn bài cá nhân
        create_box = page.locator('div[role="button"]:has-text("What\'s on your mind"), div[role="button"]:has-text("何を考えていますか"), span:has-text("What\'s on your mind")').first
        if create_box.count() == 0 or not create_box.is_visible():
            print("  -> Chưa ở trang cá nhân hoặc cần xác thực đăng nhập lại trên Chrome.")
            return False

        print("  -> Mở khung soạn bài cá nhân...")
        create_box.click()
        time.sleep(3)

        dialog = page.locator('div[role="dialog"]').first
        dialog.wait_for(state="visible", timeout=10000)

        # Upload ảnh
        if image_path and os.path.exists(image_path):
            print(f"  -> Upload ảnh cá nhân: {image_path}...")
            photo_icon = dialog.locator('div[aria-label="Photo/video"]').first
            if photo_icon.count() > 0 and photo_icon.is_visible():
                photo_icon.click()
                time.sleep(2)
            file_input = dialog.locator('input[type="file"]').first
            file_input.wait_for(state="attached", timeout=10000)
            file_input.set_input_files(image_path)
            time.sleep(4)

        # Nhập nội dung
        print("  -> Nhập nội dung bài viết...")
        editor = dialog.locator('div[role="textbox"][contenteditable="true"]').first
        editor.wait_for(state="visible", timeout=10000)
        editor.click()
        time.sleep(1)
        page.keyboard.insert_text(text)
        time.sleep(2)

        # Bấm Post trực tiếp trên trang cá nhân
        print("  -> Bấm Post xác nhận...")
        post_btn = dialog.locator('div[aria-label="Post"][role="button"], div[role="button"]:has-text("Post"), span:text-is("Post")').last
        post_btn.wait_for(state="visible", timeout=10000)
        post_btn.click(force=True)
        time.sleep(12)

        shot = os.path.join(os.path.dirname(__file__), "facebook_personal_live.png")
        page.screenshot(path=shot)
        print(f"  [+] 🎉 Cá nhân: Đăng bài thành công! Đã lưu: {shot}")
        return True
    except Exception as e:
        print(f"  [-] Lỗi đăng Trang cá nhân: {e}")
        err_shot = os.path.join(os.path.dirname(__file__), "facebook_personal_error.png")
        try:
            page.screenshot(path=err_shot)
        except Exception:
            pass
        return False

def post_facebook_dual(
    text: str,
    image_path: Optional[str] = None,
    comment_link: Optional[str] = None,
    target: str = "both",  # 'both', 'page', 'profile'
    headless: bool = True
) -> dict:
    """
    Tự động đăng bài đồng thời lên CẢ Fanpage và Trang cá nhân trong 1 câu lệnh!
    """
    print("=" * 65)
    print(f"🚀 BẮT ĐẦU QUY TRÌNH XUẤT BẢN FACEBOOK (Mục tiêu: {target.upper()})")
    print("=" * 65)

    if not os.path.exists(PROFILE_DIR):
        print(f"[-] LỖI: Thư mục hồ sơ '{PROFILE_DIR}' chưa tồn tại.")
        return {"fanpage": False, "personal": False}

    results = {"fanpage": False, "personal": False}

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",
            headless=headless,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-notifications"],
            viewport={"width": 1280, "height": 900}
        )
        page = context.pages[0] if context.pages else context.new_page()

        try:
            # 1. Đăng lên Fanpage
            if target in ["both", "page"]:
                results["fanpage"] = post_to_fanpage(page, text=text, image_path=image_path)

            # 2. Đăng lên Trang cá nhân
            if target in ["both", "profile"]:
                results["personal"] = post_to_personal_profile(page, text=text, image_path=image_path)

            context.close()
        except Exception as e:
            print(f"[-] Gặp lỗi tổng thể: {e}")
            context.close()

    print("\n" + "=" * 65)
    print("📊 KẾT QUẢ XUẤT BẢN:")
    print(f"  * Fanpage Kigyou List:   {'✅ THÀNH CÔNG' if results['fanpage'] else '⚠️ THẤT BẠI / BỎ QUA'}")
    print(f"  * Trang cá nhân (Rika):  {'✅ THÀNH CÔNG' if results['personal'] else '⚠️ CẦN XÁC THỰC LẠI'}")
    print("=" * 65)
    return results

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Facebook Dual-Channel Autonomous Publisher")
    parser.add_argument("--text", type=str, required=True, help="Nội dung bài viết")
    parser.add_argument("--image", type=str, default=None, help="Đường dẫn file ảnh đính kèm")
    parser.add_argument("--comment", type=str, default=None, help="Link điều hướng ở comment")
    parser.add_argument("--target", type=str, default="both", choices=["both", "page", "profile"], help="Kênh xuất bản")
    parser.add_argument("--headless", action="store_true", default=False, help="Chạy chế độ headless")

    args = parser.parse_args()
    post_facebook_dual(text=args.text, image_path=args.image, comment_link=args.comment, target=args.target, headless=args.headless)
