import os
import sys
import time
from typing import Optional

# Đảm bảo UTF-8 cho Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".linkedin_user_profile"))

def get_browser_context(p, headless=True):
    args = [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox"
    ]
    try:
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",
            headless=headless,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
    except Exception:
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            headless=headless,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
    return context

def post_linkedin(
    text: str,
    image_path: Optional[str] = None,
    comment_link: Optional[str] = None,
    headless: bool = True
) -> bool:
    """
    Tự động đăng bài lên LinkedIn:
    1. Vào trực tiếp endpoint: https://www.linkedin.com/preload/sharebox/
    2. Điền nội dung bài viết vào div.ql-editor
    3. Đính kèm ảnh qua FileChooser và bấm Next
    4. Nhấn nút Post (button.share-actions__primary-action)
    5. Vào trang hoạt động cá nhân để ghim First Comment chứa link chuyển đổi
    """
    print("=" * 65)
    print("🚀 Bắt đầu quy trình xuất bản bài viết lên LinkedIn...")
    print("=" * 65)
    
    with sync_playwright() as p:
        context = get_browser_context(p, headless=headless)
        page = context.pages[0] if context.pages else context.new_page()
        
        try:
            print("[1/4] Điều hướng tới Sharebox (https://www.linkedin.com/preload/sharebox/) ...")
            page.goto("https://www.linkedin.com/preload/sharebox/", wait_until="domcontentloaded")
            time.sleep(4)
            
            if "login" in page.url:
                print("[-] LỖI: Chưa có phiên đăng nhập LinkedIn hợp lệ.")
                context.close()
                return False
                
            print("[2/4] Nhập nội dung bài viết vào editor...")
            editor = page.locator('div.ql-editor').first
            editor.wait_for(state="visible", timeout=10000)
            editor.click()
            time.sleep(1)
            page.keyboard.insert_text(text)
            time.sleep(2)
            
            if image_path and os.path.exists(image_path):
                print(f"[3/4] Đính kèm hình ảnh: {image_path} ...")
                with page.expect_file_chooser(timeout=10000) as fc_info:
                    page.locator('button[aria-label="Add media"], button.share-promoted-detour-button').first.click()
                file_chooser = fc_info.value
                file_chooser.set_files(image_path)
                print("  -> Đã tải tệp ảnh lên.")
                time.sleep(4)
                
                next_btn = page.locator('button:has-text("Next"), button:has-text("次へ"), button.share-box-footer__primary-btn').first
                if next_btn.is_visible(timeout=5000):
                    next_btn.click()
                    print("  -> Bấm Next thành công.")
                    time.sleep(3)
                    
            print("[4/4] Đang nhấn nút Post xuất bản...")
            real_post_btn = page.locator('button.share-actions__primary-action').first
            real_post_btn.wait_for(state="visible", timeout=10000)
            real_post_btn.click()
            print("  -> Đã nhấn nút Post!")
            time.sleep(10)
            
            # Gửi First Comment
            if comment_link:
                print("💬 Đang tiến hành đăng First Comment chứa liên kết...")
                try:
                    page.goto("https://www.linkedin.com/in/me/recent-activity/all/", wait_until="domcontentloaded")
                    time.sleep(5)
                    
                    comment_btn = page.locator('button[aria-label*="Comment"]').first
                    if comment_btn.is_visible(timeout=5000):
                        comment_btn.click()
                        time.sleep(2)
                        
                        comment_input = page.locator('div[role="textbox"][aria-label*="comment"], div.ql-editor, div.comments-comment-box__editor').first
                        if comment_input.is_visible(timeout=5000):
                            comment_input.click()
                            time.sleep(1)
                            full_comment = f"詳細な他社比較データと500万社の無料検索デモはこちらから👇\n{comment_link}"
                            page.keyboard.insert_text(full_comment)
                            time.sleep(2)
                            
                            submit_btn = page.locator('button.comments-comment-box__submit-button, button:has-text("Comment")').last
                            if submit_btn.is_visible(timeout=3000):
                                submit_btn.click()
                                print("  -> Đã đăng First Comment thành công!")
                                time.sleep(3)
                except Exception as ex:
                    print(f"  -> Ghi chú First Comment: {ex}")
                    
            print("\n" + "=" * 65)
            print("🎉 BÀI VIẾT ĐÃ ĐƯỢC XUẤT BẢN THÀNH CÔNG LÊN LINKEDIN!")
            print("=" * 65 + "\n")
            context.close()
            return True
            
        except Exception as e:
            print(f"[-] Lỗi trong quá trình xuất bản: {e}")
            context.close()
            return False
