import os
import sys
import time
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

p_dir = os.path.abspath(r"c:\kigyou-list\.facebook_user_profile")

def switch_to_rika(page) -> bool:
    print(">>> Đang kiểm tra xem có cần chuyển sang Takahashi Rika không...")
    page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
    time.sleep(5)
    
    # Kiểm tra xem có đang ở Kigyou List không
    is_kigyou = page.locator('div[role="navigation"]:has-text("Kigyou List"), div:has-text("What\'s on your mind, Kigyou List")').count() > 0
    print("Đang ở chế độ Fanpage:", is_kigyou)
    
    if is_kigyou:
        print(">>> Bấm avatar góc phải để mở menu chuyển đổi...")
        profile_btn = page.locator('div[aria-label="Your profile"]').first
        profile_btn.click()
        time.sleep(3)
        
        print(">>> Bấm vào Takahashi Rika để chuyển đổi...")
        rika_btn = page.locator('div[role="dialog"] div[role="button"]:has-text("Takahashi Rika"), div[role="menu"] div[role="button"]:has-text("Takahashi Rika"), span:text-is("Takahashi Rika")').first
        if rika_btn.count() > 0:
            rika_btn.click()
            print("Đã click chuyển sang Takahashi Rika! Chờ reload...")
            time.sleep(8)
            page.screenshot(path=r"c:\kigyou-list\scripts\after_switch_rika_real.png")
            return True
        else:
            print("Không tìm thấy nút Takahashi Rika trong menu!")
            return False
    else:
        print("Đã ở sẵn tài khoản cá nhân Takahashi Rika.")
        return True

if __name__ == "__main__":
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            p_dir,
            headless=True,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
            viewport={"width": 1280, "height": 900}
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        res = switch_to_rika(page)
        print("Kết quả chuyển đổi:", res)
        ctx.close()
