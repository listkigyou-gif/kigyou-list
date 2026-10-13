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
IMG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

post_text = (
    "【プレスリリース配信のお知らせ】📰✨\n"
    "国内最大級500万社を網羅する法人データベース『Kigyou-list』、求人・助成金インテントデータ対応の大型アップデートを実施いたしました！\n\n"
    "昨今のB2B営業において、新規顧客開拓（アウトバウンド）の効率化は企業の死活問題です。\n"
    "しかし、従来の法人リスト販売は「年間契約縛り（30万〜100万円単位の前払い）」や「古い連絡先データ」が主流で、多くの中小企業やスタートアップにとって大きな負担となっていました。\n\n"
    "さらに、単なる企業名・電話番号だけのリストでは成約率が低下しており、「今、自社サービスを必要としている企業（インテントデータ）」へのピンポイントアプローチが求められています。\n\n"
    "こうした課題を解決すべく、『Kigyou-list（kigyoulist.com）』は以下の3つの革新性を備えた大型アップデートを実施いたしました。\n\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    "■ Kigyou-listの3つの革新ポイント\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    "1️⃣ 国内最大級500万社の全量カバー（国税庁・官公庁オープンデータを独自名寄せ統合）\n"
    "2️⃣ ハローワーク求人・助成金受給シグナル（購買意欲の高い成長企業を素早く特定）\n"
    "3️⃣ 月額4,980円（税込）・年間縛りなし（初期費用0円、いつでも解約可能）\n\n"
    "企業の営業DXを民主化し、新規開拓コストを最大90%削減します。\n\n"
    "▼ 本日公開の公式プレスリリース詳細はこちら：\n"
    "https://pr-free.jp/2026/184742/\n\n"
    "▼ 公式サイト・他社比較チャート・無料トライアルはこちら：\n"
    "https://kigyoulist.com/?utm_source=facebook&utm_medium=pr_release\n\n"
    "#プレスリリース #営業DX #法人リスト #インサイドセールス #B2Bマーケティング #新規開拓 #KigyouList"
)

def run():
    print("=" * 65)
    print("🚀 Xuất bản thông báo PR-FREE lên Facebook (Kigyou-list)")
    print("=" * 65)

    if not os.path.exists(PROFILE_DIR):
        print(f"[-] Lỗi: Thư mục profile {PROFILE_DIR} không tồn tại!")
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

            print("[2/5] Đính kèm hình ảnh banner trước để mở modal...")
            file_input = page.locator('input[type="file"]').first
            file_input.wait_for(state="attached", timeout=10000)
            file_input.set_input_files(IMG_PATH)
            print("  -> Đã tải tệp ảnh lên, đang chờ modal hiển thị...")
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
            preview_shot = os.path.join(os.path.dirname(__file__), "facebook_post_preview.png")
            page.screenshot(path=preview_shot)
            print(f"[4/5] Đã chụp ảnh xem trước: {preview_shot}")

            print("[5/5] Nhấn nút Post (Đăng bài)...")
            post_btn = page.locator('div[aria-label="Post"][role="button"], div[role="button"]:has-text("Post")').last
            post_btn.wait_for(state="visible", timeout=10000)
            post_btn.click(force=True)
            print("  -> Đã nhấn nút Post!")
            time.sleep(12)

            # Chụp ảnh xác nhận kết quả
            live_shot = os.path.join(os.path.dirname(__file__), "facebook_published_live.png")
            page.screenshot(path=live_shot)
            print(f"[+] Xuất bản thành công! Ảnh chụp màn hình: {live_shot}")

            context.close()
            return True

        except Exception as e:
            print(f"[-] Gặp lỗi: {e}")
            err_shot = os.path.join(os.path.dirname(__file__), "facebook_error.png")
            try:
                page.screenshot(path=err_shot)
            except Exception:
                pass
            context.close()
            return False

if __name__ == "__main__":
    run()
