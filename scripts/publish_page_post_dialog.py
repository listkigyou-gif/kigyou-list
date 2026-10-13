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

PAGE_URL = "https://www.facebook.com/profile.php?id=61594160223303"
PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))
IMG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

POST_CONTENT = """【全国500万社を網羅】営業リスト作成の常識を変える、国内最大級の企業データベース「Kigyou List」🔍✨

「テレアポやフォーム送信用のリスト集めに何時間もかかっている…」
「名簿業者の年間契約や高額な従量課金で予算が圧迫されている…」

そんな営業組織の課題を解決するため、Kigyou List（kigyoulist.com）は全国500万社以上の最新法人オープンデータをワンストップで検索・抽出できる次世代データベースを提供しています。

■ Kigyou Listの3大特長：
✅ 【500万社以上の圧倒的網羅性】国税庁・行政・最新Web情報をAIが独自統合
✅ 【ピンポイント絞り込み】地域・業種だけでなく、採用動向や助成金シグナルでも検索可能
✅ 【圧倒的な低コスト】月額4,980円（税込）・年間契約縛り一切なしで即日利用可能

無駄な営業リスト作成工数を90%削減し、確度の高いアプローチに集中しませんか？

▼ 500万社の無料検索デモ・詳細はこちら
👉 https://kigyoulist.com/?utm_source=facebook&utm_medium=db_search

#KigyouList #企業データベース #営業DX #法人リスト #新規開拓 #インサイドセールス #コスト削減 #B2Bマーケティング"""

def main():
    print(">>> [1] Khởi động Chrome profile...", flush=True)
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            PROFILE_DIR,
            headless=True,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-notifications"],
            viewport={"width": 1280, "height": 900}
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        
        try:
            print(">>> [2] Điều hướng tới Facebook Page...", flush=True)
            page.goto(PAGE_URL, wait_until="domcontentloaded")
            time.sleep(5)
            page.keyboard.press("Escape")

            # Mở modal tạo bài viết bằng ô What's on your mind
            print(">>> [3] Bấm mở khung soạn bài...", flush=True)
            create_trigger = page.locator('div[role="button"]:has-text("What\'s on your mind"), span:has-text("What\'s on your mind")').first
            create_trigger.wait_for(state="visible", timeout=10000)
            create_trigger.click()
            time.sleep(3)

            # Xác định modal
            dialog = page.locator('div[role="dialog"]').first
            dialog.wait_for(state="visible", timeout=10000)
            print(">>> [4] Đã tìm thấy dialog soạn thảo bài viết!", flush=True)

            # Upload ảnh nếu có
            if os.path.exists(IMG_PATH):
                print(f">>> [5] Upload hình ảnh: {IMG_PATH} ...", flush=True)
                # Bấm vào icon Photo/video bên trong dialog (nếu chưa hiển thị file input)
                photo_icon = dialog.locator('div[aria-label="Photo/video"]').first
                if photo_icon.count() > 0 and photo_icon.is_visible():
                    photo_icon.click()
                    time.sleep(2)
                
                file_input = dialog.locator('input[type="file"]').first
                file_input.wait_for(state="attached", timeout=10000)
                file_input.set_input_files(IMG_PATH)
                print(">>> Đã attach file ảnh vào dialog!", flush=True)
                time.sleep(4)

            # Nhập text vào textbox BÊN TRONG DIALOG
            print(">>> [6] Nhập nội dung text vào editor trong dialog...", flush=True)
            editor = dialog.locator('div[role="textbox"][contenteditable="true"]').first
            editor.wait_for(state="visible", timeout=10000)
            editor.click()
            time.sleep(1)
            page.keyboard.insert_text(POST_CONTENT)
            time.sleep(2)
            print(">>> Đã nhập text xong!", flush=True)

            page.screenshot(path="scripts/dialog_ready_to_post.png")
            print(">>> Đã lưu ảnh: scripts/dialog_ready_to_post.png", flush=True)

            # Kiểm tra nút Next hoặc Post trong dialog
            print(">>> [7] Tìm nút Next hoặc Post trong dialog...", flush=True)
            next_btn = dialog.locator('div[aria-label="Next"][role="button"], div[role="button"]:has-text("Next")').first
            if next_btn.count() > 0 and next_btn.is_visible():
                print(">>> Bấm Next...", flush=True)
                next_btn.click()
                time.sleep(4)
                page.screenshot(path="scripts/dialog_step2.png")

            # Tìm nút Post trong dialog (hoặc màn hình thứ 2)
            post_btn = page.locator('div[role="dialog"] div[aria-label="Post"][role="button"], div[role="dialog"] div[role="button"]:has-text("Post"), div[role="dialog"] div[aria-label="投稿"][role="button"]').first
            post_btn.wait_for(state="visible", timeout=10000)
            post_btn.click(force=True)
            print(">>> Đã bấm Post! Chờ đăng bài 15s...", flush=True)
            time.sleep(15)

            # Chụp ảnh xác nhận bài live
            page.screenshot(path="scripts/facebook_post_success.png")
            print(">>> [HOÀN TẤT] 🎉 Bài viết kèm ảnh đã được xuất bản thành công!", flush=True)
            ctx.close()
            return True

        except Exception as e:
            print(">>> [LỖI]:", e, flush=True)
            page.screenshot(path="scripts/dialog_error.png")
            ctx.close()
            return False

if __name__ == "__main__":
    main()
