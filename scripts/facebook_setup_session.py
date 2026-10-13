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

def setup_facebook_session():
    profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))
    os.makedirs(profile_dir, exist_ok=True)
    
    print("=" * 65)
    print("Khởi động trình duyệt để thiết lập phiên đăng nhập Facebook:")
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
        
        print("Đang điều hướng đến https://www.facebook.com/ ...")
        page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
        
        print("\n" + "=" * 65)
        print(">>> VUI LÒNG ĐĂNG NHẬP HOẶC KIỂM TRA TÀI KHOẢN FACEBOOK TRÊN TRÌNH DUYỆT:")
        print("1. Đăng nhập tài khoản Facebook của bạn (nếu chưa đăng nhập).")
        print("2. Hoàn tất mã 2FA xác thực (nếu có yêu cầu).")
        print("3. Khi đã vào được trang chủ Facebook Feed hoặc trang cá nhân,")
        print("   hệ thống sẽ tự động lưu phiên vĩnh viễn vào .facebook_user_profile!")
        print("=" * 65)
        
        # Chờ tối đa 5 phút cho đến khi đăng nhập xong
        logged_in = False
        start_time = time.time()
        while time.time() - start_time < 300:
            current_url = page.url
            # Kiểm tra xem đã đăng nhập thành công chưa
            if any(key in current_url for key in ["facebook.com", "m.facebook.com"]) and not any(kw in current_url for kw in ["login", "recover"]):
                # Kiểm tra một số selector chỉ có khi đã login
                is_logged = page.locator('div[role="feed"], div[aria-label*="Facebook"], div[role="navigation"], div[aria-label*="Account"], div[aria-label*="アカウント"]').count() > 0
                if is_logged:
                    print("\n[+] ĐÃ PHÁT HIỆN ĐĂNG NHẬP THÀNH CÔNG!")
                    logged_in = True
                    time.sleep(3)
                    break
            time.sleep(3)
            
        if logged_in:
            print("[+] Phiên đăng nhập Facebook đã được lưu trữ thành công!")
        else:
            print("[-] Hết thời gian chờ hoặc chưa hoàn tất đăng nhập. Vui lòng chạy lại khi sẵn sàng.")
            
        context.close()

if __name__ == "__main__":
    setup_facebook_session()
