import os
import sys
import time
import json
from typing import Optional
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))
FANPAGE_URL = "https://www.facebook.com/kigyoulist/"
PERSONAL_URL = "https://www.facebook.com/profile.php?id=61595229033404"

def ensure_switched_to_rika(page):
    """Đảm bảo tài khoản đang hoạt động là Trang cá nhân Takahashi Rika"""
    try:
        page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
        time.sleep(4)
        is_page = page.locator('div[role="navigation"]:has-text("Kigyou List"), div:has-text("What\'s on your mind, Kigyou List")').count() > 0
        if is_page:
            print("  -> Phát hiện đang ở chế độ Fanpage, đang chuyển đổi về Takahashi Rika...")
            profile_btn = page.locator('div[aria-label="Your profile"]').first
            if profile_btn.count() > 0 and profile_btn.is_visible():
                profile_btn.click()
                time.sleep(3)
                rika_btn = page.locator('div[role="dialog"] div[role="button"]:has-text("Takahashi Rika"), div[role="menu"] div[role="button"]:has-text("Takahashi Rika"), span:text-is("Takahashi Rika")').first
                if rika_btn.count() > 0:
                    rika_btn.click()
                    time.sleep(7)
                    print("  [+] Đã chuyển đổi thành công sang Takahashi Rika!")
    except Exception as e:
        print(f"  [-] Cảnh báo khi kiểm tra chuyển đổi: {e}")

def post_to_personal_profile(page, text: str, image_path: Optional[str] = None) -> dict:
    """Đăng bài lên Trang cá nhân Facebook (Takahashi Rika)"""
    print("\n" + "=" * 60)
    print("👤 [KÊNH 1/2] Đang tiến hành đăng bài lên Trang cá nhân...")
    print("=" * 60)
    result = {"success": False, "screenshot": None, "url": PERSONAL_URL}
    try:
        # Đảm bảo danh tính đang là Takahashi Rika
        ensure_switched_to_rika(page)
        page.goto(PERSONAL_URL, wait_until="domcontentloaded")
        time.sleep(5)
        page.keyboard.press("Escape")

        # Mở khung soạn bài cá nhân
        print("  -> Mở khung soạn bài cá nhân...")
        create_trigger = page.locator('span:text-is("What\'s on your mind?"), div[role="button"]:has-text("What\'s on your mind"), div:has-text("何を考えていますか")').first
        create_trigger.wait_for(state="visible", timeout=12000)
        create_trigger.click()
        time.sleep(3)

        dialog = page.locator('div[role="dialog"]:has-text("Create post"), div[role="dialog"]:has-text("投稿を作成"), div[aria-label="Create post"]').first
        if dialog.count() == 0 or not dialog.is_visible():
            dialog = page.locator('div[role="dialog"]').last
        dialog.wait_for(state="visible", timeout=10000)

        # Upload ảnh
        if image_path and os.path.exists(image_path):
            print(f"  -> Upload ảnh: {image_path}...")
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

        # Bấm nút Post trên trang cá nhân
        print("  -> Bấm Post xác nhận...")
        post_btn = dialog.locator('div[aria-label="Post"][role="button"], div[role="button"]:has-text("Post"), span:text-is("Post")').last
        post_btn.wait_for(state="visible", timeout=10000)
        post_btn.click(force=True)
        time.sleep(15)

        shot = os.path.join(os.path.dirname(__file__), "facebook_personal_live.png")
        page.screenshot(path=shot)
        print(f"  [+] 🎉 Cá nhân: Đăng bài thành công! Đã lưu: {shot}")
        result["success"] = True
        result["screenshot"] = shot
        return result
    except Exception as e:
        print(f"  [-] Lỗi đăng Trang cá nhân: {e}")
        err_shot = os.path.join(os.path.dirname(__file__), "facebook_personal_error.png")
        try:
            page.screenshot(path=err_shot)
        except Exception:
            pass
        return result

def post_to_fanpage(page, text: str, image_path: Optional[str] = None) -> dict:
    """Đăng bài lên Fanpage Kigyou List với xử lý popup Not now tự động"""
    print("\n" + "=" * 60)
    print("📢 [KÊNH 2/2] Đang tiến hành đăng bài lên Fanpage Kigyou List...")
    print("=" * 60)
    result = {"success": False, "screenshot": None, "url": FANPAGE_URL, "post_url": None}
    try:
        page.goto(FANPAGE_URL, wait_until="domcontentloaded")
        time.sleep(5)
        page.keyboard.press("Escape")

        # Kiểm tra nút Switch Now
        switch_btn = page.locator('div[role="button"]:has-text("Switch Now"), span:has-text("Switch Now"), div[aria-label="Switch Now"]').first
        if switch_btn.count() > 0 and switch_btn.is_visible():
            print("  -> Chuyển sang profile quản trị Page...")
            switch_btn.click()
            time.sleep(5)

        # Mở khung soạn bài
        print("  -> Mở khung soạn bài viết trên Fanpage...")
        trigger = page.locator('span:text-is("What\'s on your mind?"), div[role="button"]:has-text("What\'s on your mind")').first
        trigger.wait_for(state="visible", timeout=10000)
        trigger.click()
        time.sleep(3)

        # Xác định chính xác dialog Create post
        dialog = page.locator('div[role="dialog"]').filter(has_text="Create post").first
        dialog.wait_for(state="visible", timeout=12000)

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
        print("  -> Đã click Post! Kiểm tra popup 'Not now'...")
        time.sleep(4)

        # Xử lý triệt để popup upsell 'Not now' của Facebook
        not_now_triggers = [
            'div[aria-label="Not now"]',
            'div[role="button"]:has-text("Not now")',
            'span:text-is("Not now")',
            'div[role="dialog"]:has-text("Chat directly with customers") span:text-is("Not now")'
        ]
        for sel in not_now_triggers:
            btn = page.locator(sel).first
            if btn.count() > 0 and btn.is_visible():
                print(f"  -> Phát hiện popup! Đang bấm '{sel}' để xác nhận xuất bản ngay...")
                btn.click()
                time.sleep(3)
                break

        print("  -> Chờ 15s để hoàn tất lưu trữ trên Facebook CDN...")
        time.sleep(15)

        # Nghiệm thu và lấy link bài viết
        page.goto(FANPAGE_URL, wait_until="domcontentloaded")
        time.sleep(5)
        page.evaluate("window.scrollBy(0, 700)")
        time.sleep(3)

        shot = os.path.join(os.path.dirname(__file__), "facebook_fanpage_live.png")
        page.screenshot(path=shot)
        print(f"  [+] 🎉 Fanpage: Đăng bài thành công! Đã lưu: {shot}")

        # Tìm link bài viết mới nhất
        links = page.locator('a').all()
        for l in links:
            href = l.get_attribute('href')
            if href and ('/posts/' in href or 'story_fbid' in href):
                clean_href = href.split('?')[0] if '?' in href else href
                if not clean_href.startswith('http'):
                    clean_href = f"https://www.facebook.com{clean_href}"
                result["post_url"] = clean_href
                break

        result["success"] = True
        result["screenshot"] = shot
        return result
    except Exception as e:
        print(f"  [-] Lỗi đăng Fanpage: {e}")
        err_shot = os.path.join(os.path.dirname(__file__), "facebook_fanpage_error.png")
        try:
            page.screenshot(path=err_shot)
        except Exception:
            pass
        return result

def post_facebook_dual(
    text: str,
    image_path: Optional[str] = None,
    comment_link: Optional[str] = None,
    target: str = "both",  # 'both', 'page', 'profile'
    headless: bool = True
) -> dict:
    print("=" * 65)
    print(f"🚀 BẮT ĐẦU XUẤT BẢN FACEBOOK (Mục tiêu: {target.upper()})")
    print("=" * 65)

    if not os.path.exists(PROFILE_DIR):
        print(f"[-] LỖI: Thư mục hồ sơ '{PROFILE_DIR}' chưa tồn tại.")
        return {"personal": {"success": False}, "fanpage": {"success": False}}

    results = {"personal": {"success": False}, "fanpage": {"success": False}}

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
            # 1. Đăng lên Trang cá nhân
            if target in ["both", "profile"]:
                results["personal"] = post_to_personal_profile(page, text=text, image_path=image_path)

            # 2. Đăng lên Fanpage
            if target in ["both", "page"]:
                results["fanpage"] = post_to_fanpage(page, text=text, image_path=image_path)

            context.close()
        except Exception as e:
            print(f"[-] Lỗi luồng thực thi: {e}")
            context.close()

    print("\n" + "=" * 65)
    print("📊 KẾT QUẢ XUẤT BẢN:")
    p_stat = "✅ THÀNH CÔNG" if results["personal"].get("success") else "⚠️ THẤT BẠI / BỎ QUA"
    f_stat = "✅ THÀNH CÔNG" if results["fanpage"].get("success") else "⚠️ THẤT BẠI / BỎ QUA"
    print(f"  * Trang cá nhân (Rika):  {p_stat}")
    print(f"  * Fanpage Kigyou List:   {f_stat}")
    if results["fanpage"].get("post_url"):
        print(f"  * Fanpage Post Link:     {results['fanpage']['post_url']}")
    print("=" * 65)
    return results

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Facebook Dual-Channel Autonomous Publisher")
    parser.add_argument("--day", type=int, default=None, help="Số ngày trong kế hoạch 30 ngày (1-30)")
    parser.add_argument("--text", type=str, default=None, help="Nội dung bài viết tùy biến")
    parser.add_argument("--image", type=str, default=None, help="Đường dẫn file ảnh đính kèm")
    parser.add_argument("--comment", type=str, default=None, help="Link điều hướng ở comment")
    parser.add_argument("--target", type=str, default="both", choices=["both", "page", "profile"], help="Kênh xuất bản")
    parser.add_argument("--headless", action="store_true", default=False, help="Chạy chế độ headless")

    args = parser.parse_args()

    content_text = args.text
    img_path = args.image

    if args.day:
        try:
            from facebook_30_days_content import get_day_post
            day_data = get_day_post(args.day)
            content_text = day_data["text"]
            if not img_path:
                img_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", day_data.get("image", "scripts/press_releases/eyecatch_01.jpg")))
            print(f">>> [LỆNH 1-CLICK] Đã nạp kịch bản Ngày {args.day}: {day_data.get('title')}")
        except Exception as e:
            print(f"[-] Cảnh báo nạp dữ liệu ngày: {e}")

    if not content_text:
        print("[-] Lỗi: Cần cung cấp --text hoặc --day [1-30]!")
        sys.exit(1)

    if not img_path:
        default_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))
        if os.path.exists(default_img):
            img_path = default_img

    post_facebook_dual(
        text=content_text,
        image_path=img_path,
        comment_link=args.comment,
        target=args.target,
        headless=args.headless
    )
