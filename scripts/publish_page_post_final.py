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
    print(">>> [START] Mở persistent context...", flush=True)
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
            print(">>> [1] Mở trang Page URL...", flush=True)
            page.goto(PAGE_URL, wait_until="domcontentloaded")
            time.sleep(5)
            page.keyboard.press("Escape")

            # Kiểm tra switch nếu cần
            switch_btn = page.locator('div[role="button"]:has-text("Switch Now")').first
            if switch_btn.count() > 0 and switch_btn.is_visible():
                print(">>> [2] Chuyển sang profile Page...", flush=True)
                switch_btn.click()
                time.sleep(5)

            # Bấm nút Photo/video màu xanh trên feed
            print(">>> [3] Tìm nút Photo/video trên feed...", flush=True)
            photo_feed_btn = page.locator('div[role="button"]:has-text("Photo/video"), span:has-text("Photo/video")').first
            if photo_feed_btn.count() > 0 and photo_feed_btn.is_visible():
                print(">>> Bấm vào nút Photo/video trên feed...", flush=True)
                photo_feed_btn.click()
            else:
                print(">>> Bấm vào ô What's on your mind...", flush=True)
                box = page.locator('div[role="button"]:has-text("What\'s on your mind"), span:has-text("What\'s on your mind")').first
                box.click()
            time.sleep(3)

            # Tìm file input và upload ảnh
            print(">>> [4] Đính kèm file ảnh...", flush=True)
            file_input = page.locator('input[type="file"]').first
            file_input.wait_for(state="attached", timeout=8000)
            file_input.set_input_files(IMG_PATH)
            print(">>> Đã upload file ảnh thành công!", flush=True)
            time.sleep(4)

            # Nhập text
            print(">>> [5] Nhập nội dung text...", flush=True)
            editor = page.locator('div[role="textbox"][contenteditable="true"]').last
            editor.wait_for(state="visible", timeout=10000)
            editor.click()
            time.sleep(1)
            page.keyboard.insert_text(POST_CONTENT)
            time.sleep(2)
            page.keyboard.press("Escape")
            time.sleep(1)

            page.screenshot(path="scripts/before_post_or_next.png")
            print(">>> Đã chụp ảnh preview: scripts/before_post_or_next.png", flush=True)

            # Kiểm tra nút Next hoặc Post
            print(">>> [6] Kiểm tra nút Next / Post...", flush=True)
            # Thử tìm nút Next
            next_btn = page.locator('div[aria-label="Next"][role="button"], div[role="button"]:has-text("Next")').last
            if next_btn.count() > 0 and next_btn.is_visible():
                print(">>> Thấy nút Next, đang bấm...", flush=True)
                next_btn.click()
                time.sleep(4)
                page.screenshot(path="scripts/after_next_step.png")

            # Bấm Post
            print(">>> [7] Tìm và bấm Post...", flush=True)
            post_btn = page.locator('div[aria-label="Post"][role="button"], div[role="button"]:has-text("Post"), div[aria-label="投稿"][role="button"]').last
            post_btn.wait_for(state="visible", timeout=10000)
            post_btn.click(force=True)
            print(">>> Đã bấm Post! Chờ đăng bài 15s...", flush=True)
            time.sleep(15)

            page.screenshot(path="scripts/facebook_published_live.png")
            print(">>> [DONE] 🎉 ĐĂNG BÀI THÀNH CÔNG! Đã lưu: scripts/facebook_published_live.png", flush=True)
            ctx.close()
            return True

        except Exception as e:
            print(">>> [ERROR]:", e, flush=True)
            page.screenshot(path="scripts/page_post_error.png")
            ctx.close()
            return False

if __name__ == "__main__":
    main()
