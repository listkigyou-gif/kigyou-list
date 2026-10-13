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

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))
IMG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "articles", "note_article1_b2b_summary.jpg"))

post_text = (
    "【note記事を更新しました】📝💡\n"
    "「【2026年最新】営業リスト・企業データベース主要7社徹底比較！コストとデータ鮮度で選ぶ最適解」\n\n"
    "「新規開拓のリスト作成に毎月莫大な工数がかかっている…」\n"
    "「大手データベースを導入したいが、年間数十万〜数百万円の契約縛りが重い…」\n\n"
    "多くの営業組織が直面するこの課題について、noteにて主要ツールのポジショニングと費用対効果を徹底比較・解説いたしました。\n\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    "■ 2026年、失敗しないツール選びの3大基準\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    "1️⃣ データ網羅性と鮮度：登記法人100%カバー（500万社超）か？\n"
    "2️⃣ コスト体系の柔軟性：年間縛りなしで、月額数千円から試せるか？\n"
    "3️⃣ 購買意欲シグナル：ハローワーク求人や助成金採択のインテントデータを捉えているか？\n\n"
    "固定費を抑えながら営業ROIを最大化したいセールスマネージャー・経営者の方に必見の内容です。\n\n"
    "▼ note記事の全文はこちら：\n"
    "https://note.com/kigyoulist\n\n"
    "▼ 主要ツール詳細比較表・公式サイト：\n"
    "https://kigyoulist.com/ja/compare?utm_source=facebook&utm_medium=note_summary\n\n"
    "#note #営業DX #法人リスト #インサイドセールス #コスト削減 #B2Bマーケティング #KigyouList"
)

def run():
    print("=" * 65)
    print("🚀 Xuất bản bài tóm tắt Note lên Facebook (Kigyou-list)")
    print(f"Ảnh đính kèm: {IMG_PATH}")
    print("=" * 65)

    if not os.path.exists(PROFILE_DIR):
        print(f"[-] Lỗi: Thư mục profile {PROFILE_DIR} không tồn tại!")
        return False

    if not os.path.exists(IMG_PATH):
        print(f"[-] Lỗi: Không tìm thấy file ảnh {IMG_PATH}!")
        return False

    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-notifications"
        ]
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",
            headless=True,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
        page = context.pages[0] if context.pages else context.new_page()

        try:
            print("[1/5] Điều hướng tới trang Facebook...")
            page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
            time.sleep(5)

            # Tự động đóng thông báo nếu có
            try:
                page.keyboard.press("Escape")
                close_icon = page.locator('div[aria-label="Close"], div[aria-label="閉じる"], div[aria-label="Đóng"]').first
                if close_icon.count() > 0 and close_icon.is_visible():
                    close_icon.click()
            except Exception:
                pass

            if "login" in page.url:
                print("[-] LỖI: Chưa có phiên đăng nhập Facebook hợp lệ.")
                context.close()
                return False

            print("[2/5] Đính kèm hình ảnh B2B chuẩn trước để mở modal soạn thảo...")
            file_input = page.locator('input[type="file"]').first
            file_input.wait_for(state="attached", timeout=10000)
            file_input.set_input_files(IMG_PATH)
            print("  -> Đã tải tệp ảnh lên, đang chờ modal...")
            time.sleep(5)

            print("[3/5] Nhập nội dung bài viết vào editor của modal...")
            editor = page.locator('div[role="textbox"][contenteditable="true"]').last
            editor.wait_for(state="visible", timeout=12000)
            editor.click()
            time.sleep(1)
            page.keyboard.insert_text(post_text)
            time.sleep(2)
            page.keyboard.press("Escape")
            time.sleep(1)
            print("  -> Đã nhập đầy đủ nội dung bài viết.")

            # Chụp ảnh xem trước
            preview_shot = os.path.join(os.path.dirname(__file__), "facebook_note_preview.png")
            page.screenshot(path=preview_shot)
            print(f"[4/5] Đã chụp ảnh xem trước: {preview_shot}")

            print("[5/5] Nhấn nút Post (Đăng bài)...")
            post_btn = page.locator('div[aria-label="Post"][role="button"], div[role="button"]:has-text("Post")').last
            post_btn.wait_for(state="visible", timeout=10000)
            post_btn.click(force=True)
            print("  -> Đã nhấn nút Post!")
            time.sleep(12)

            # Chụp ảnh xác nhận kết quả
            live_shot = os.path.join(os.path.dirname(__file__), "facebook_published_note_live.png")
            page.screenshot(path=live_shot)
            print(f"[+] Xuất bản thành công! Ảnh chụp màn hình: {live_shot}")

            context.close()
            return True

        except Exception as e:
            print(f"[-] Gặp lỗi: {e}")
            err_shot = os.path.join(os.path.dirname(__file__), "facebook_note_error.png")
            try:
                page.screenshot(path=err_shot)
            except Exception:
                pass
            context.close()
            return False

if __name__ == "__main__":
    run()
