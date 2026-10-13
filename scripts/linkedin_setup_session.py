import os
import sys
import time

# Đảm bảo UTF-8 cho Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

def setup_linkedin_session():
    profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".linkedin_user_profile"))
    os.makedirs(profile_dir, exist_ok=True)
    
    print("=" * 65)
    print("Khởi động trình duyệt để thiết lập phiên đăng nhập LinkedIn:")
    print(f"Thư mục lưu hồ sơ: {profile_dir}")
    print("=" * 65)
    
    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--start-maximized",
            "--no-sandbox"
        ]
        
        context = None
        try:
            print("Đang mở Google Chrome...")
            context = p.chromium.launch_persistent_context(
                user_data_dir=profile_dir,
                channel="chrome",
                headless=False,
                args=args,
                viewport=None
            )
        except Exception as e:
            print(f"Chuyển sang Chromium mặc định: {e}")
            context = p.chromium.launch_persistent_context(
                user_data_dir=profile_dir,
                headless=False,
                args=args,
                viewport=None
            )
            
        page = context.pages[0] if context.pages else context.new_page()
        
        print("Đang điều hướng đến https://www.linkedin.com/login ...")
        page.goto("https://www.linkedin.com/login", wait_until="domcontentloaded")
        
        print("\n" + "=" * 65)
        print(">>> VUI LÒNG ĐĂNG NHẬP TÀI KHOẢN LINKEDIN TRÊN CỬA SỔ TRÌNH DUYỆT VỪA MỞ.")
        print("1. Nhập Email/Password hoặc chọn 'Sign in with Google'.")
        print("2. Hoàn tất mã xác thực 2FA (nếu có).")
        print("3. Khi đã vào được trang Feed (linkedin.com/feed),")
        print("   hệ thống sẽ tự động phát hiện và lưu phiên vĩnh viễn!")
        print("=" * 65 + "\n")
        
        logged_in = False
        start_time = time.time()
        timeout_seconds = 300  # 5 phút
        
        while time.time() - start_time < timeout_seconds:
            try:
                cookies = context.cookies()
                has_li_at = any(c["name"] == "li_at" for c in cookies)
                cur_url = page.url
                
                # Kiểm tra xem đã vào Feed hoặc trang profile chưa
                if ("linkedin.com/feed" in cur_url or "linkedin.com/in/" in cur_url or has_li_at) and "login" not in cur_url:
                    if has_li_at:
                        logged_in = True
                        print("\n[THÀNH CÔNG] Đã phát hiện cookie li_at và phiên đăng nhập LinkedIn hợp lệ!")
                        break
            except Exception:
                pass
            time.sleep(2)
            
        if logged_in:
            print("[XÁC NHẬN] Toàn bộ Cookies & Phiên làm việc đã được lưu vào .linkedin_user_profile.")
            print("Từ giờ AI có thể tự động xuất bản bài viết lên LinkedIn hoàn toàn không cần can thiệp!")
        else:
            print("[THÔNG BÁO] Kết thúc thời gian chờ. Phiên chưa hoàn tất.")
            
        time.sleep(3)
        context.close()

if __name__ == "__main__":
    setup_linkedin_session()
