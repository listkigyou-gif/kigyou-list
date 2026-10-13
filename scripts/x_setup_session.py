import os
import sys
import time

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

def setup_x_session():
    profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".x_user_profile"))
    os.makedirs(profile_dir, exist_ok=True)
    
    print("=" * 60)
    print("Khoi dong trinh duyet de luu phien dang nhap X (Twitter):")
    print(f"Thu muc luu profile: {profile_dir}")
    print("=" * 60)
    
    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--start-maximized",
            "--no-sandbox"
        ]
        
        context = None
        try:
            print("Dang mo Chrome...")
            context = p.chromium.launch_persistent_context(
                user_data_dir=profile_dir,
                channel="chrome",
                headless=False,
                args=args,
                viewport=None
            )
        except Exception as e:
            print(f"Chuyen sang Chromium mac dinh: {e}")
            context = p.chromium.launch_persistent_context(
                user_data_dir=profile_dir,
                headless=False,
                args=args,
                viewport=None
            )
            
        page = context.pages[0] if context.pages else context.new_page()
        print("Dang mo https://x.com/login ...")
        page.goto("https://x.com/login", wait_until="domcontentloaded")
        
        print("\n" + "=" * 60)
        print(">>> VUI LONG DANG NHAP TAI KHOAN @kigyoulist TREN CUA SO TRINH DUYET VUA MO.")
        print("Sau khi dang nhap thanh cong va vao trang chu X (x.com/home),")
        print("he thong se tu dong ghi nhan va luu phien vinh vien!")
        print("=" * 60 + "\n")
        
        logged_in = False
        start_time = time.time()
        # Cho toi da 5 phut de nguoi dung dang nhap
        while time.time() - start_time < 300:
            current_url = page.url
            if "home" in current_url or "x.com/kigyoulist" in current_url:
                logged_in = True
                print("[+] Da phat hien dang nhap thanh cong vao X.com!")
                break
            
            # Kiem tra neu co the compose tweet
            try:
                compose_box = page.locator('[data-testid="tweetTextarea_0"]')
                if compose_box.count() > 0:
                    logged_in = True
                    print("[+] Da phat hien o dang bai tren X.com!")
                    break
            except Exception:
                pass
                
            time.sleep(2)
            
        if logged_in:
            time.sleep(3)
            # Luu cookies de co the su dung them neu can
            cookies = context.cookies()
            print(f"[+] Da luu {len(cookies)} cookies vao ho so.")
            print("[+] Hoan tat! Ban co the dong trinh duyet.")
        else:
            print("[-] Het thoi gian cho hoac chua dang nhap thanh cong.")
            
        context.close()

if __name__ == "__main__":
    setup_x_session()
