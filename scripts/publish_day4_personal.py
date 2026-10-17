import os
import sys
import time
from playwright.sync_api import sync_playwright
from facebook_30_days_content import get_day_post

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

p_dir = os.path.abspath(r"c:\kigyou-list\.facebook_user_profile")
day4_data = get_day_post(4)
TEXT = day4_data["text"]
IMG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_day04_democracy.jpg"))
PROFILE_URL = "https://www.facebook.com/profile.php?id=61595229033404"

def post_day4_personal():
    print(">>> Khởi động trình duyệt đăng bài lên Trang cá nhân Takahashi Rika...")
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            p_dir,
            headless=True,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
            viewport={"width": 1280, "height": 900}
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        
        # 1. Truy cập trực tiếp trang cá nhân
        page.goto(PROFILE_URL, wait_until="domcontentloaded")
        time.sleep(5)
        page.keyboard.press("Escape")
        
        # 2. Mở composer trên trang cá nhân
        print(">>> Mở khung 'What\'s on your mind?' trên trang cá nhân...")
        trigger = page.locator('span:text-is("What\'s on your mind?"), div[role="button"]:has-text("What\'s on your mind"), div:has-text("何を考えていますか")').first
        trigger.wait_for(state="visible", timeout=12000)
        trigger.click()
        time.sleep(3)
        
        dialog = page.locator('div[role="dialog"]').filter(has_text="Create post").first
        if dialog.count() == 0:
            dialog = page.locator('div[role="dialog"]').first
        dialog.wait_for(state="visible", timeout=10000)
        
        # 3. Upload ảnh
        if os.path.exists(IMG_PATH):
            print(f">>> Đính kèm ảnh: {IMG_PATH}...")
            photo_icon = dialog.locator('div[aria-label="Photo/video"]').first
            if photo_icon.count() > 0 and photo_icon.is_visible():
                photo_icon.click()
                time.sleep(2)
            file_input = dialog.locator('input[type="file"]').first
            file_input.wait_for(state="attached", timeout=10000)
            file_input.set_input_files(IMG_PATH)
            time.sleep(4)
            print("  -> Đã đính kèm ảnh thành công!")
            
        # 4. Nhập nội dung
        print(">>> Nhập nội dung bài viết...")
        editor = dialog.locator('div[role="textbox"][contenteditable="true"]').first
        editor.wait_for(state="visible", timeout=10000)
        editor.click()
        time.sleep(1)
        page.keyboard.insert_text(TEXT)
        time.sleep(2)
        print("  -> Đã nhập nội dung!")
        
        # 5. Bấm nút Post
        print(">>> Bấm nút Post trên trang cá nhân...")
        post_btn = dialog.locator('div[aria-label="Post"][role="button"], div[role="button"]:has-text("Post"), span:text-is("Post")').last
        post_btn.wait_for(state="visible", timeout=10000)
        post_btn.click(force=True)
        print("  -> Đã bấm nút Post! Chờ đăng bài...")
        time.sleep(15)
        
        # 6. Reload trang cá nhân và kiểm tra
        print(">>> Kiểm tra lại trên profile timeline...")
        page.goto(PROFILE_URL, wait_until="domcontentloaded")
        time.sleep(5)
        page.evaluate("window.scrollBy(0, 600)")
        time.sleep(3)
        
        shot = os.path.join(os.path.dirname(__file__), "rika_day4_live_verified.png")
        page.screenshot(path=shot)
        print(f">>> Đã chụp ảnh nghiệm thu trang cá nhân: {shot}")
        
        has_post = page.locator('*:has-text("営業DXの民主化")').count() > 0 or page.locator('*:has-text("オープンデータ")').count() > 0
        print(f">>> KẾT QUẢ XÁC MINH TRANG CÁ NHÂN: {'✅ ĐÃ LÊN SÓNG THÀNH CÔNG!' if has_post else '⚠️ CHƯA THẤY BÀI'}")
        
        ctx.close()
        return has_post

if __name__ == "__main__":
    post_day4_personal()
