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

def publish_to_page():
    print("🚀 Bắt đầu quy trình đăng bài lên Facebook Page Kigyou List...")
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
            print("[1/5] Điều hướng đến trang Facebook Page...")
            page.goto(PAGE_URL, wait_until="domcontentloaded")
            time.sleep(5)

            # Đóng popups nếu có
            try:
                page.keyboard.press("Escape")
            except Exception:
                pass

            # Kiểm tra xem có nút Switch Now không
            switch_btn = page.locator('div[aria-label="Switch Now"], div[role="button"]:has-text("Switch Now"), span:has-text("Switch Now")').first
            if switch_btn.count() > 0 and switch_btn.is_visible():
                print("  -> Tìm thấy nút 'Switch Now', đang chuyển sang tư cách quản trị Page...")
                switch_btn.click()
                time.sleep(6)
                page.screenshot(path="scripts/after_switch.png")
            else:
                print("  -> Đã ở tư cách Page hoặc không có nút Switch Now.")

            # Sau khi switch, tìm khung đăng bài
            print("[2/5] Tìm ô tạo bài viết...")
            # Khung tạo bài viết có thể là: "What's on your mind?", "何を考えていますか？", "Create post", "Post"
            post_triggers = [
                'div[role="button"]:has-text("What\'s on your mind")',
                'div[role="button"]:has-text("何を考えていますか")',
                'div[role="button"]:has-text("Create post")',
                'div[role="button"]:has-text("投稿を作成")',
                'span:has-text("What\'s on your mind")',
                'span:has-text("何を考えていますか")'
            ]
            
            clicked = False
            for selector in post_triggers:
                loc = page.locator(selector).first
                if loc.count() > 0 and loc.is_visible():
                    print(f"  -> Bấm vào ô soạn thảo: {selector}")
                    loc.click()
                    clicked = True
                    break
            
            if not clicked:
                # Thử tìm input file ảnh trực tiếp hoặc nút ảnh
                photo_btn = page.locator('div[aria-label="Photo/video"], div[aria-label="写真・動画"]').first
                if photo_btn.count() > 0 and photo_btn.is_visible():
                    print("  -> Bấm vào nút Photo/video...")
                    photo_btn.click()
                    clicked = True

            time.sleep(3)
            page.screenshot(path="scripts/modal_opened.png")

            # Tải ảnh lên nếu có file input
            if os.path.exists(IMG_PATH):
                print(f"[3/5] Đính kèm hình ảnh: {IMG_PATH} ...")
                file_input = page.locator('input[type="file"]').first
                if file_input.count() > 0:
                    file_input.set_input_files(IMG_PATH)
                    print("  -> Đã upload ảnh banner thành công.")
                    time.sleep(4)

            print("[4/5] Nhập nội dung bài viết...")
            editor = page.locator('div[role="textbox"][contenteditable="true"]').last
            editor.wait_for(state="visible", timeout=10000)
            editor.click()
            time.sleep(1)
            page.keyboard.insert_text(POST_CONTENT)
            time.sleep(2)
            page.keyboard.press("Escape")
            time.sleep(1)

            page.screenshot(path="scripts/facebook_post_preview.png")
            print("  -> Đã lưu ảnh xem trước: scripts/facebook_post_preview.png")

            print("[5/5] Nhấn nút Đăng (Post)...")
            post_btn = page.locator('div[aria-label="Post"][role="button"], div[aria-label="投稿"][role="button"], div[role="button"]:has-text("Post"), div[role="button"]:has-text("投稿")').last
            post_btn.wait_for(state="visible", timeout=10000)
            post_btn.click(force=True)
            print("  -> Đã bấm Post! Chờ xuất bản...")
            time.sleep(12)

            page.screenshot(path="scripts/facebook_published_live.png")
            print("🎉 XUẤT BẢN THÀNH CÔNG! Đã lưu ảnh: scripts/facebook_published_live.png")
            ctx.close()
            return True

        except Exception as e:
            print(f"[-] Gặp lỗi: {e}")
            page.screenshot(path="scripts/facebook_page_error.png")
            ctx.close()
            return False

if __name__ == "__main__":
    publish_to_page()
