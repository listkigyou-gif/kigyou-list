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

def setup_note_session():
    profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".note_user_profile"))
    os.makedirs(profile_dir, exist_ok=True)
    
    print("==================================================")
    print("Khoi dong trinh duyet luu ho so tai:")
    print(f"{profile_dir}")
    print("==================================================")
    
    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--start-maximized",
            "--no-sandbox"
        ]
        
        context = None
        try:
            print("Dang mo Google Chrome...")
            context = p.chromium.launch_persistent_context(
                user_data_dir=profile_dir,
                channel="chrome",
                headless=False,
                args=args,
                viewport=None
            )
        except Exception as e:
            print(f"Chuyen sang Chromium: {e}")
            context = p.chromium.launch_persistent_context(
                user_data_dir=profile_dir,
                headless=False,
                args=args,
                viewport=None
            )
            
        page = context.pages[0] if context.pages else context.new_page()
        
        print("Dang dieu huong den trang dang nhap Note.com...")
        page.goto("https://note.com/login")
        
        print("\n>>> Vui long thao tac tren cua so trinh duyet:")
        print("1. Chon 'Google de login' (Dang nhap bang Google)")
        print("2. Dang nhap tai khoan Google cua ban")
        print("3. Khi da vao duoc trang chu Note.com, he thong se tu dong nhan dien va luu phien.\n")
        
        logged_in = False
        start_time = time.time()
        timeout_seconds = 300  # 5 phut
        
        while time.time() - start_time < timeout_seconds:
            try:
                cookies = context.cookies()
                has_session = any("_note_session" in c["name"] or "remember_token" in c["name"] for c in cookies)
                cur_url = page.url
                
                if "note.com/login" not in cur_url and ("note.com" in cur_url):
                    if has_session:
                        logged_in = True
                        print("\n[THANH CONG] Da phat hien phien dang nhap Note.com hop le!")
                        break
            except Exception:
                pass
            time.sleep(2)
            
        if logged_in:
            print("[XAC NHAN] Cookies va Session da duoc luu vao thu muc .note_user_profile.")
            print("Hoan tat thiet lap!")
        else:
            print("[THONG BAO] Ket thuc thoi gian cho. Phien da duoc dong.")
            
        time.sleep(3)
        context.close()

if __name__ == "__main__":
    setup_note_session()
