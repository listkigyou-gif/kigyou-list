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

def setup_valuepress_session():
    profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".valuepress_user_profile"))
    os.makedirs(profile_dir, exist_ok=True)
    
    print("=" * 70)
    print("🚀 KHỞI ĐỘNG TRÌNH DUYỆT THIẾT LẬP PHIÊN ĐĂNG NHẬP VALUEPRESS (value-press.com)")
    print(f"📁 Thư mục lưu hồ sơ Chrome: {profile_dir}")
    print("=" * 70)
    
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
        
        print("Đang điều hướng đến https://www.value-press.com/login ...")
        page.goto("https://www.value-press.com/login", wait_until="domcontentloaded")
        
        print("\n" + "=" * 70)
        print(">>> VUI LÒNG ĐĂNG NHẬP HOẶC ĐĂNG KÝ TÀI KHOẢN TRÊN CỬA SỔ TRÌNH DUYỆT:")
        print("1. Nhập Email & Mật khẩu tài khoản ValuePress của bạn.")
        print("2. Nếu chưa có tài khoản, bạn có thể đăng ký tài khoản doanh nghiệp (miễn phí).")
        print("3. Sau khi đăng nhập thành công vào trang quản trị (mypage / dashboard),")
        print("   hệ thống sẽ tự động phát hiện và lưu phiên đăng nhập vĩnh viễn!")
        print("=" * 70 + "\n")
        
        # Vòng lặp chờ người dùng đăng nhập hoặc bấm Enter
        print("\n>>> Sau khi bạn nhập Email/Mật khẩu và đã vào bên trong trang quản trị của ValuePress:")
        print("    Vui lòng quay lại cửa sổ dòng lệnh này và nhấn phím ENTER để hoàn tất lưu phiên.")
        print("    (Hoặc hệ thống sẽ tự phát hiện khi thấy nút ログアウト)")
        print("=" * 70)

        logged_in = False
        try:
            # Cho phép người dùng nhấn Enter bất kỳ lúc nào sau khi đã vào trang
            input("\n👉 Nhấn phím ENTER sau khi bạn đã đăng nhập thành công trên cửa sổ Chrome vừa mở...")
            logged_in = True
        except Exception:
            # Fallback nếu chạy ở môi trường không có stdin
            for i in range(120):
                time.sleep(3)
                has_logout = page.locator("a:has-text('ログアウト'), button:has-text('ログアウト'), a[href*='logout']").count() > 0
                if has_logout:
                    logged_in = True
                    break
            
        context.close()

if __name__ == "__main__":
    setup_valuepress_session()
