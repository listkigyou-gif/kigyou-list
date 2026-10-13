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

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROFILE_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", ".zenn_user_profile"))
COOKIES_FILE = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "zenn_cookies.json"))

def format_cookie(c):
    """Chuẩn hóa định dạng cookie từ Cookie-Editor sang Playwright"""
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
        "domain": c.get("domain", ".zenn.dev"),
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

    formatted_cookies = []
    for c in raw_cookies:
        try:
            formatted_cookies.append(format_cookie(c))
        except Exception as e:
            print(f"[-] Bỏ qua cookie lỗi: {e}")

    print(f"[+] Đã đọc và chuẩn hóa {len(formatted_cookies)} cookies từ Zenn.dev")

    os.makedirs(PROFILE_DIR, exist_ok=True)

    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox"
        ]
        
        print(f"[+] Đang khởi tạo session tại: {PROFILE_DIR}")
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            headless=True,
            args=args
        )

        # Nạp cookie vào context
        context.add_cookies(formatted_cookies)
        print("[+] Đã nạp thành công cookies vào Playwright Context!")

        # Kiểm tra thử phiên đăng nhập
        page = context.new_page()
        print("[+] Đang kiểm tra đăng nhập trên https://zenn.dev ...")
        page.goto("https://zenn.dev", wait_until="networkidle", timeout=30000)
        time.sleep(3)

        content = page.content()
        # Kiểm tra sự xuất hiện của nút 投稿する hoặc user menu
        if "投稿する" in content or "dashboard" in content or "sign_out" in content:
            print("[SUCCESS] >>> ĐĂNG NHẬP ZENN.DEV THÀNH CÔNG! PHIÊN ĐÃ ĐƯỢC LƯU VÀO PROFILE! <<<")
            success = True
        else:
            print("[?] Chưa nhận diện được trạng thái đăng nhập đầy đủ. Đang chụp ảnh kiểm tra...")
            screenshot_path = os.path.join(BASE_DIR, "zenn_session_check.png")
            page.screenshot(path=screenshot_path)
            print(f"[-] Đã lưu ảnh chụp màn hình: {screenshot_path}")
            success = False

        context.close()
        return success

if __name__ == "__main__":
    if len(sys.argv) > 1:
        custom_path = sys.argv[1]
        with open(custom_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        import_cookies(data)
    else:
        import_cookies()
