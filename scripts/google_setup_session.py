# -*- coding: utf-8 -*-
"""
Script mở cửa sổ trình duyệt để đăng nhập Google và tự động lưu session / cookies
cho cổng báo chí FREE PRESS RELEASE (free-pressrelease.com).
Tương tự cơ chế của x_setup_session.py.
"""
import os
import sys
import time
import json

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfFdAgOnvwnL1MuR8kLqeql2aK4AP6-wN-emgdY1pDTdhHaWA/viewform"
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROFILE_DIR = os.path.join(ROOT_DIR, ".free_pressrelease_user_profile")
COOKIES_PATH = os.path.join(ROOT_DIR, "scripts", "google_cookies.json")

def setup_google_session():
    os.makedirs(PROFILE_DIR, exist_ok=True)
    
    print("=" * 70)
    print("🚀 KHỞI ĐỘNG CỬA SỔ TRÌNH DUYỆT ĐỂ ĐĂNG NHẬP GOOGLE:")
    print(f"📁 Thư mục lưu User Profile : {PROFILE_DIR}")
    print(f"📁 File cookies xuất ra     : {COOKIES_PATH}")
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
                user_data_dir=PROFILE_DIR,
                channel="chrome",
                headless=False,
                args=args,
                viewport=None
            )
        except Exception as e:
            print(f"Mở Chromium mặc định: {e}")
            context = p.chromium.launch_persistent_context(
                user_data_dir=PROFILE_DIR,
                headless=False,
                args=args,
                viewport=None
            )
            
        page = context.pages[0] if context.pages else context.new_page()
        print(f"Đang mở trang Google Form: {FORM_URL} ...")
        page.goto(FORM_URL, wait_until="domcontentloaded")
        
        print("\n" + "=" * 70)
        print(">>> VUI LÒNG ĐĂNG NHẬP TÀI KHOẢN GOOGLE TRÊN CỬA SỔ TRÌNH DUYỆT VỪA MỞ.")
        print(">>> Sau khi đăng nhập thành công và nhìn thấy nội dung Google Form,")
        print(">>> Hệ thống sẽ TỰ ĐỘNG trích xuất toàn bộ Cookies và lưu vĩnh viễn!")
        print("=" * 70 + "\n")
        
        logged_in = False
        start_time = time.time()
        timeout = 300  # Chờ tối đa 5 phút
        
        while time.time() - start_time < timeout:
            current_url = page.url
            # Kiểm tra nếu không còn ở trang login và đã vào form
            if "viewform" in current_url and "signin" not in current_url and "ServiceLogin" not in current_url:
                # Kiểm tra xem có khối câu hỏi của form chưa
                if page.locator('div[role="listitem"], form').count() > 0:
                    logged_in = True
                    break
            time.sleep(2)
            
        if logged_in:
            time.sleep(3)
            cookies = context.cookies()
            with open(COOKIES_PATH, "w", encoding="utf-8") as f:
                json.dump(cookies, f, indent=2, ensure_ascii=False)
            print("\n" + "=" * 70)
            print(f"🎉 ĐĂNG NHẬP THÀNH CÔNG! Đã lưu {len(cookies)} cookies vào:")
            print(f"👉 {COOKIES_PATH}")
            print(f"👉 Toàn bộ phiên làm việc cũng đã lưu tại: {PROFILE_DIR}")
            print("Cửa sổ sẽ tự động đóng sau 3 giây...")
            print("=" * 70)
            time.sleep(3)
        else:
            print("\n⚠️ Hết thời gian chờ (5 phút) hoặc chưa hoàn tất đăng nhập.")
            
        context.close()

if __name__ == "__main__":
    setup_google_session()
