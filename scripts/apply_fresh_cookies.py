import os
import sys
import json
import time
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))
COOKIES_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "facebook_cookies.json"))

with open(COOKIES_FILE, "r", encoding="utf-8") as f:
    raw_cookies = json.load(f)

formatted = []
for c in raw_cookies:
    s = c.get("sameSite", "Lax")
    if s in ["no_restriction", "None", "none"]:
        same_site_str = "None"
    elif s in ["strict", "Strict"]:
        same_site_str = "Strict"
    else:
        same_site_str = "Lax"
    
    cookie_obj = {
        "name": c["name"],
        "value": c["value"],
        "domain": c.get("domain", ".facebook.com"),
        "path": c.get("path", "/"),
        "httpOnly": bool(c.get("httpOnly", False)),
        "secure": True if same_site_str == "None" else bool(c.get("secure", False)),
        "sameSite": same_site_str
    }
    if "expirationDate" in c and c["expirationDate"] is not None:
        cookie_obj["expires"] = float(c["expirationDate"])
    formatted.append(cookie_obj)

print(f"[*] Đã định dạng {len(formatted)} cookies chuẩn Playwright.")

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        channel="chrome",
        headless=True,
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-notifications"],
        viewport={"width": 1280, "height": 900}
    )
    
    ctx.clear_cookies()
    ctx.add_cookies(formatted)
    
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    print("[*] Đang kiểm tra Facebook với cookies mới...")
    page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
    time.sleep(5)
    
    print("URL hiện tại:", page.url)
    screenshot_path = os.path.join(os.path.dirname(__file__), "facebook_fresh_auth.png")
    page.screenshot(path=screenshot_path)
    print(f"[*] Đã chụp ảnh xác thực: {screenshot_path}")
    
    is_logged_in = "login" not in page.url and (
        page.locator('div[role="feed"]').count() > 0 or 
        page.locator('div[aria-label="Your profile"], div[aria-label="あなたのプロフィール"]').count() > 0 or
        page.locator('div[role="button"]:has-text("What\'s on your mind")').count() > 0
    )
    
    if is_logged_in:
        print("[SUCCESS] 🎉 XÁC THỰC THÀNH CÔNG! ĐÃ ĐĂNG NHẬP VÀO TRANG CHỦ FACEBOOK!")
    else:
        print("[-] Vẫn cần kiểm tra thêm trạng thái đăng nhập.")
        
    ctx.close()
