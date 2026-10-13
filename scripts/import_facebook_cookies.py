import os
import sys
import json
import time

# Đảm bảo UTF-8 cho Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))
COOKIES_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "facebook_cookies.json"))

def format_cookie(c):
    """Chuẩn hóa định dạng cookie từ Cookie-Editor hoặc Puppeteer sang Playwright"""
    same_site = c.get("sameSite", "Lax")
    if same_site:
        same_site_str = str(same_site).capitalize()
        if same_site_str not in ["Strict", "Lax", "None"]:
            same_site_str = "Lax"
    else:
        same_site_str = "Lax"

    cookie_obj = {
        "name": c["name"],
        "value": c["value"],
        "domain": c.get("domain", ".facebook.com"),
        "path": c.get("path", "/"),
        "httpOnly": bool(c.get("httpOnly", False)),
        "secure": bool(c.get("secure", True)),
        "sameSite": same_site_str
    }
    if "expirationDate" in c and c["expirationDate"] is not None:
        cookie_obj["expires"] = float(c["expirationDate"])
    elif "expires" in c and c["expires"] is not None:
        cookie_obj["expires"] = float(c["expires"])
    return cookie_obj

def import_cookies(cookies_json_data=None):
    if cookies_json_data is None:
        if not os.path.exists(COOKIES_FILE):
            print(f"[-] Không tìm thấy file: {COOKIES_FILE}")
            return False
        with open(COOKIES_FILE, "r", encoding="utf-8") as f:
            raw_cookies = json.load(f)
    else:
        if isinstance(cookies_json_data, str):
            raw_cookies = json.loads(cookies_json_data)
        else:
            raw_cookies = cookies_json_data

    # Chuẩn hóa danh sách cookie
    formatted_cookies = []
    for c in raw_cookies:
        try:
            formatted_cookies.append(format_cookie(c))
        except Exception as err:
            print(f"Bỏ qua cookie lỗi: {err}")

    print(f"[*] Đã đọc {len(formatted_cookies)} cookies. Đang nạp vào profile: {PROFILE_DIR} ...")
    os.makedirs(PROFILE_DIR, exist_ok=True)

    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox"
        ]
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",
            headless=True,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
        
        # Thêm cookies vào context
        context.add_cookies(formatted_cookies)
        page = context.pages[0] if context.pages else context.new_page()

        print("[*] Kiểm tra trạng thái đăng nhập trên https://www.facebook.com/ ...")
        page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
        time.sleep(5)

        # Lưu ảnh chụp màn hình xác thực
        check_shot = os.path.join(os.path.dirname(__file__), "facebook_session_check.png")
        page.screenshot(path=check_shot)
        print(f"[*] Ảnh chụp màn hình kiểm tra đã lưu tại: {check_shot}")

        current_url = page.url
        print(f"[*] Current URL: {current_url}")

        if "login" not in current_url:
            print("\n" + "=" * 65)
            print("[SUCCESS] 🎉 ĐÃ LƯU PHIÊN ĐĂNG NHẬP FACEBOOK VĨNH VIỄN VÀO .facebook_user_profile THÀNH CÔNG!")
            print("=" * 65)
            context.close()
            return True
        else:
            print("\n[-] Chưa thể đăng nhập tự động. Có thể cookies bị thiếu trường hoặc đã hết hạn.")
            context.close()
            return False

if __name__ == "__main__":
    import_cookies()
