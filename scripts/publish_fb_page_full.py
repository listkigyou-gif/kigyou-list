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

def post_to_page():
    print(">>> [1] Khởi tạo trình duyệt...", flush=True)
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
            print(">>> [2] Mở Facebook Page...", flush=True)
            page.goto(PAGE_URL, wait_until="domcontentloaded")
            time.sleep(5)
            page.keyboard.press("Escape")

            # Bấm Photo/video
            print(">>> [3] Bấm Photo/video để mở modal kèm upload ảnh...", flush=True)
            photo_btn = page.locator('span:has-text("Photo/video"), div[role="button"]:has-text("Photo/video")').first
            photo_btn.wait_for(state="visible", timeout=10000)
            photo_btn.click()
            time.sleep(3)
            page.screenshot(path="scripts/step3_modal.png")

            # Upload ảnh
            print(">>> [4] Đính kèm tệp ảnh...", flush=True)
            file_input = page.locator('input[type="file"]').first
            file_input.wait_for(state="attached", timeout=10000)
            file_input.set_input_files(IMG_PATH)
            time.sleep(4)
            page.screenshot(path="scripts/step4_uploaded.png")

            # Nhập text
            print(">>> [5] Nhập nội dung bài viết...", flush=True)
            editor = page.locator('div[role="textbox"][contenteditable="true"]').last
            editor.wait_for(state="visible", timeout=10000)
            editor.click()
            time.sleep(1)
            page.keyboard.insert_text(POST_CONTENT)
            time.sleep(2)
            page.screenshot(path="scripts/step5_text_typed.png")

            # Bấm nút Next (hoặc Post nếu trực tiếp)
            print(">>> [6] Tìm nút Next...", flush=True)
            next_btn = page.locator('div[aria-label="Next"][role="button"], div[role="button"]:has-text("Next")').last
            if next_btn.count() > 0 and next_btn.is_visible():
                print(">>> Đang bấm Next...", flush=True)
                next_btn.click()
                time.sleep(4)
                page.screenshot(path="scripts/step6_after_next.png")
            else:
                print(">>> Không có nút Next, tìm Post...", flush=True)

            # Bấm nút Post cuối cùng
            print(">>> [7] Tìm và bấm nút Post...", flush=True)
            post_btn = page.locator('div[aria-label="Post"][role="button"], div[role="button"]:has-text("Post"), div[aria-label="投稿"][role="button"]').last
            post_btn.wait_for(state="visible", timeout=10000)
            post_btn.click(force=True)
            print(">>> Đã bấm Post thành công! Đợi 15s để Facebook xử lý...", flush=True)
            time.sleep(15)

            page.screenshot(path="scripts/step7_final_live.png")
            print(">>> [HOÀN TẤT] Bài viết đã lên sóng!", flush=True)
            ctx.close()
            return True

        except Exception as e:
            print(">>> [LỖI]:", e, flush=True)
            page.screenshot(path="scripts/error_flow.png")
            ctx.close()
            return False

if __name__ == "__main__":
    post_to_page()
