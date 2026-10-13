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

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".linkedin_user_profile"))
IMG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

post_text = (
    "【公式プレスリリース配信】国内最大級500万社を網羅する法人データベース『Kigyou-list』、求人・助成金インテントデータ対応の大型アップデートを実施\n\n"
    "昨今のB2B営業において、新規開拓（アウトバウンド）の効率化は喫緊の経営課題です。\n"
    "しかし、従来の法人リスト販売は「年間契約縛り（30万〜100万円単位の前払い）」や「1件数十円の従量課金」が主流で、多くの中小企業やスタートアップにとって大きな参入障壁となっていました。\n\n"
    "さらに、単なる企業名・電話番号のリストでは成約率が低下しており、「今、自社サービスを必要としている企業（インテントデータ）」へのピンポイントアプローチが求められています。\n\n"
    "こうした課題を解決すべく、『Kigyou-list（kigyoulist.com）』は以下の3つの革新性を備えた大型アップデートを実施し、本日公式プレスリリースを配信いたしました。\n\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    "■ Kigyou-listの3つの強み\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    "1️⃣ 国内最大級500万社の全量カバー（国税庁・官公庁オープンデータを独自名寄せ統合）\n"
    "2️⃣ ハローワーク求人・助成金受給シグナル（購買意欲の高い成長企業を特定）\n"
    "3️⃣ 月額4,980円（税込）・年間縛りなし（初期費用0円、即日利用可能）\n\n"
    "企業の営業DXを民主化し、新規開拓コストを最大90%削減します。\n\n"
    "本日公開の公式プレスリリース詳細およびサービス比較表は【コメント欄】に掲載しております👇\n\n"
    "#営業DX #法人リスト #プレスリリース #インサイドセールス #B2Bマーケティング #KigyouList"
)

comment_text = (
    "📰 本日公開の公式プレスリリース詳細（PR-FREE）：\n"
    "https://pr-free.jp/2026/184742/\n\n"
    "📊 サービス詳細・他社比較チャート・無料検索デモはこちら：\n"
    "https://kigyoulist.com/ja/compare?utm_source=linkedin&utm_medium=pr"
)

def run():
    print("=" * 65)
    print("🚀 Xuất bản thông báo PR-FREE lên LinkedIn (kigyou-list)")
    print("=" * 65)
    
    with sync_playwright() as p:
        args = ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",
            headless=True,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
        page = context.pages[0] if context.pages else context.new_page()
        
        # 1. Mở Sharebox
        print("[1/5] Mở khung soạn thảo LinkedIn...")
        page.goto("https://www.linkedin.com/preload/sharebox/", wait_until="domcontentloaded")
        time.sleep(4)
        
        if "login" in page.url:
            print("[-] LỖI: Chưa có phiên đăng nhập LinkedIn hợp lệ.")
            context.close()
            return False
            
        # 2. Nhập nội dung
        print("[2/5] Nhập bài viết tiếng Nhật...")
        editor = page.locator('div.ql-editor').first
        editor.click()
        page.keyboard.insert_text(post_text)
        time.sleep(2)
        
        # 3. Đính kèm ảnh
        if os.path.exists(IMG_PATH):
            print(f"[3/5] Đính kèm Banner Eyecatch: {IMG_PATH} ...")
            try:
                with page.expect_file_chooser(timeout=10000) as fc_info:
                    page.locator('button[aria-label="Add media"]').first.click()
                fc_info.value.set_files(IMG_PATH)
                time.sleep(4)
                
                # Next trong modal media
                page.locator('button:has-text("Next")').first.click()
                time.sleep(3)
            except Exception as e:
                print(f"[-] Cảnh báo khi đính kèm ảnh: {e}")
        
        # 4. Bấm Post
        print("[4/5] Bấm nút Post xuất bản...")
        post_btn = page.locator('button.share-actions__primary-action').first
        post_btn.click()
        print("  -> Đã nhấn nút Post! Chờ 10s...")
        time.sleep(10)
        
        # 5. Đăng First Comment trên trang Activity
        print("[5/5] Điều hướng đến trang Activity để gửi First Comment...")
        page.goto("https://www.linkedin.com/in/kigyou-list-0b5b8b442/recent-activity/all/", wait_until="domcontentloaded")
        time.sleep(5)
        
        # Bấm nút Comment ở bài viết mới nhất
        try:
            comment_bubble = page.locator('button[aria-label*="Comment"]').first
            if comment_bubble.is_visible(timeout=6000):
                comment_bubble.click()
                time.sleep(2)
                
                c_input = page.locator('div[role="textbox"][aria-label*="comment"], div.ql-editor, div.comments-comment-box__editor').first
                if c_input.is_visible(timeout=5000):
                    c_input.click()
                    time.sleep(1)
                    page.keyboard.insert_text(comment_text)
                    time.sleep(2)
                    
                    sub_btn = page.locator('button.comments-comment-box__submit-button, button:has-text("Comment")').last
                    if sub_btn.is_visible(timeout=3000):
                        sub_btn.click()
                        print("  -> First Comment đã được gửi thành công!")
                        time.sleep(4)
        except Exception as e:
            print(f"[-] Lỗi gửi first comment: {e}")
                    
        screenshot_path = os.path.join(os.path.dirname(__file__), "linkedin_pr_published_live.png")
        page.screenshot(path=screenshot_path)
        print(f"[+] Đã lưu ảnh chụp xác nhận: {screenshot_path}")
        
        context.close()
        print("\n" + "=" * 65)
        print("🎉 HOÀN TẤT XUẤT BẢN BÀI VIẾT THÔNG CÁO BÁO CHÍ LÊN LINKEDIN!")
        print("=" * 65)
        return True

if __name__ == "__main__":
    run()
