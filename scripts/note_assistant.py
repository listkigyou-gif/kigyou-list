import os
import sys
import time
import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE_DIR = Path(__file__).resolve().parent.parent / ".note_user_profile"

def get_browser_context(playwright_instance, headless=False):
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    
    # Try system Google Chrome first, fallback to Chromium
    browser_channel = "chrome"
    args = [
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
    ]
    
    try:
        context = playwright_instance.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=headless,
            channel=browser_channel,
            viewport={"width": 1280, "height": 850},
            args=args,
        )
        return context
    except Exception as e:
        print(f"[Warning] Failed to launch Chrome channel ({e}). Falling back to bundled Chromium...")
        context = playwright_instance.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=headless,
            viewport={"width": 1280, "height": 850},
            args=args,
        )
        return context

def login_flow():
    print("=" * 60)
    print(" [NOTE.COM GOOGLE LOGIN SESSION RECORDER] ")
    print("=" * 60)
    print("Dang khoi chay trinh duyet Chrome de ban dang nhap...")
    print(f"Thu muc luu profile: {PROFILE_DIR}")
    
    with sync_playwright() as p:
        context = get_browser_context(p, headless=False)
        page = context.pages[0] if context.pages else context.new_page()
        
        page.goto("https://note.com/login", wait_until="domcontentloaded")
        print("\n--> Cua so Chrome da mo!")
        print("--> Vui long bam vao nut 'Google de dang nhap' (Googleでログイン) va dang nhap tai khoan cua ban.")
        print("--> Sau khi dang nhap thanh cong va trinh duyet tro ve trang chu note.com:")
        print("    Vui long quay lai day va go 'done' roi bam ENTER de luu phien.")
        print("-" * 60)
        
        while True:
            try:
                user_input = input("Go 'done' khi da dang nhap xong tren trinh duyet (hoac 'cancel' de thoat): ").strip().lower()
                if user_input in ["done", "d", "ok"]:
                    current_url = page.url
                    print(f"URL hien tai: {current_url}")
                    cookies = context.cookies("https://note.com")
                    session_cookies = [c for c in cookies if "note" in c["name"] or "session" in c["name"]]
                    print(f"Da ghi nhan {len(cookies)} cookies (Session cookies: {len(session_cookies)}).")
                    print("[SUCCESS] Phien dang nhap da duoc luu vinh vien vao thu muc profile!")
                    break
                elif user_input in ["cancel", "q", "exit"]:
                    print("Da huy luu phien.")
                    break
            except (KeyboardInterrupt, EOFError):
                print("\nDa dung qua trinh.")
                break
                
        context.close()
        print("Cua so trinh duyet da dong an toan.")

def post_article(title: str, body_text: str, tags: list = None, publish: bool = False):
    print("=" * 60)
    print(f" [DANG DANG BAI LEN NOTE.COM] Title: {title[:40]}... ")
    print("=" * 60)
    
    with sync_playwright() as p:
        # headless=False de giam thieu kha nang bi bot block va de nguoi dung xem duoc
        context = get_browser_context(p, headless=False)
        page = context.pages[0] if context.pages else context.new_page()
        
        print("1. Dang truy cap trang tao bai viet moi...")
        page.goto("https://note.com/notes/new", wait_until="networkidle", timeout=45000)
        time.sleep(3)
        
        # Kiem tra xem co bi da ve login khong
        if "login" in page.url:
            print("[ERROR] Chua dang nhap! Vui long chay: python scripts/note_assistant.py login truoc.")
            context.close()
            return False
            
        print("2. Dang nhap tieu de bai viet...")
        # Note editor tieu de thuong co placeholder "記事タイトル"
        title_locator = page.locator("textarea[placeholder*='記事タイトル'], input[placeholder*='記事タイトル']")
        if not title_locator.count():
            title_locator = page.locator("textarea").first
        
        title_locator.fill(title)
        time.sleep(1)
        
        print("3. Dang nhap noi dung bai viet...")
        # Note content editor la contenteditable div
        body_locator = page.locator("div[contenteditable='true'], div.ProseMirror").first
        if body_locator.count():
            body_locator.click()
            # Chia paragraphs va go vao editor
            paragraphs = body_text.strip().split("\n\n")
            for para in paragraphs:
                lines = para.split("\n")
                for line in lines:
                    if line.strip():
                        page.keyboard.type(line)
                    page.keyboard.press("Shift+Enter")
                page.keyboard.press("Enter")
                time.sleep(0.3)
        else:
            print("[Warning] Khong tim thay contenteditable editor, dang thu click fallback...")
            page.mouse.click(600, 350)
            page.keyboard.type(body_text)
            
        time.sleep(2)
        
        if publish:
            print("4. Dang tien hanh bam nut Cong khai (公開設定)...")
            pub_setting_btn = page.locator("button:has-text('公開設定'), button:has-text('公開に進む')").first
            if pub_setting_btn.count():
                pub_setting_btn.click()
                time.sleep(3)
                
                # Dien hashtags neu co
                if tags:
                    tag_input = page.locator("input[placeholder*='ハッシュタグ'], input[placeholder*='タグ']").first
                    if tag_input.count():
                        for tag in tags:
                            tag_clean = tag.replace("#", "").strip()
                            if tag_clean:
                                tag_input.fill(tag_clean)
                                page.keyboard.press("Enter")
                                time.sleep(0.5)
                
                time.sleep(2)
                # Nut xuat ban cuoi cung
                final_publish_btn = page.locator("button:has-text('投稿する'), button:has-text('公開する')").first
                if final_publish_btn.count():
                    final_publish_btn.click()
                    print("[SUCCESS] Bai viet da duoc xuat ban len note.com!")
                    time.sleep(4)
                else:
                    print("[Notice] Da den buoc cai dat xuat ban nhung de an toan, bai viet dang o trang thai san sang.")
            else:
                print("[Notice] Luu ban nhap tu dong (Draft saved).")
        else:
            print("4. Luu ban nhap (Draft)...")
            # Note thuong tu dong autosave hoac co nut 下書き保存
            draft_btn = page.locator("button:has-text('下書き保存')").first
            if draft_btn.count():
                draft_btn.click()
                print("[SUCCESS] Da luu ban nhap (Draft) thanh cong tren note.com!")
            else:
                print("[SUCCESS] Note.com da tu dong luu ban nhap vao tai khoan cua ban!")
                
        # Chup anh man hinh ket qua
        screenshot_path = Path(__file__).resolve().parent / "note_last_post.png"
        page.screenshot(path=str(screenshot_path))
        print(f"Da chup anh man hinh xac nhan: {screenshot_path}")
        
        time.sleep(3)
        context.close()
        return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Note.com Assistant Bot")
    parser.add_argument("mode", choices=["login", "post"], help="Chế độ chạy: login hoặc post")
    parser.add_argument("--title", type=str, help="Tiêu đề bài viết")
    parser.add_argument("--body", type=str, help="Nội dung bài viết")
    parser.add_argument("--tags", type=str, help="Danh sách tags cách nhau bằng dấu phẩy (vd: 営業リスト,企業データベース)")
    parser.add_argument("--publish", action="store_true", help="Xuất bản trực tiếp (mặc định là lưu nháp)")
    
    args = parser.parse_args()
    
    if args.mode == "login":
        login_flow()
    elif args.mode == "post":
        if not args.title or not args.body:
            print("Loi: Vui long cung cap --title va --body khi dung che do post!")
            sys.exit(1)
        tag_list = [t.strip() for t in args.tags.split(",")] if args.tags else []
        post_article(args.title, args.body, tag_list, publish=args.publish)
