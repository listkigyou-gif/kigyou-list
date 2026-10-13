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
IMG_PATH = r"C:\Users\admin\.gemini\antigravity-ide\brain\d9896013-af63-44e9-b2a5-b9bf802d5608\linkedin_intent_data_1791689520024.jpg"

post_text = (
    "【アポ率3倍の秘密】「まだ業種と所在地だけでテレアポしていませんか？」\n\n"
    "従来の「静的な名簿」を使った新規開拓では、アプローチ先の99%が「今、買う理由がない」状態です。結果として、担当者の疲弊と低い成約率に悩まされることになります。\n\n"
    "今、トップセールスや先進的なインサイドセールス（IS）チームが導入しているのが【インテントデータ（購買意図データ）】を活用した「シグナル営業」です。\n\n"
    "■ 狙うべき「3大購買シグナル」：\n"
    "1️⃣ ハローワーク求人シグナル\n"
    "└ 営業職やエンジニアを積極採用している＝事業拡大中で新たなツールやサービスの予算がある証拠。\n"
    "2️⃣ 助成金・補助金受給シグナル\n"
    "└ IT導入補助金や事業再構築補助金が採択された企業＝国からの資金バックアップがあり、投資意欲がピーク。\n"
    "3️⃣ 官公庁入札・落札データ\n"
    "└ 公共事業を受注した企業＝直近で確実な売上が立ち、下請けや協業パートナーを求めている可能性大。\n\n"
    "■ Kigyou-list（企業リスト.com）なら：\n"
    "全国500万社の基本情報に加え、これらのリアルタイムシグナルをワンストップで抽出可能。\n"
    "月額たったの 4,980円（年間縛りなし）で、シグナルに基づく高確度リストを即座にダウンロードできます。\n\n"
    "「誰に売るか」ではなく「今、動いている企業に売る」。\n"
    "アウトバウンド営業の成約効率を劇的に変えるシグナル検索のデモは【最初のコメント欄】へ👇\n"
    "---\n"
    "#営業DX #インサイドセールス #シグナル営業 #インテントデータ #新規開拓 #B2Bマーケティング #KigyouList"
)

comment_text = (
    "ハローワーク求人企業や助成金採択企業のリアルタイム検索デモはこちらから👇\n"
    "https://kigyoulist.com/ja/search?utm_source=linkedin&utm_medium=social&utm_campaign=intent_data"
)

def run():
    print("=" * 65)
    print("🚀 Xuất bản bài viết: INTENT DATA & SIGNAL SELLING lên LinkedIn")
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
        
        # 2. Nhập nội dung
        print("[2/5] Nhập bài viết tiếng Nhật...")
        editor = page.locator('div.ql-editor').first
        editor.click()
        page.keyboard.insert_text(post_text)
        time.sleep(2)
        
        # 3. Đính kèm ảnh
        print(f"[3/5] Đính kèm Infographic Intent Data: {IMG_PATH} ...")
        with page.expect_file_chooser(timeout=10000) as fc_info:
            page.locator('button[aria-label="Add media"]').first.click()
        fc_info.value.set_files(IMG_PATH)
        time.sleep(4)
        
        # Next trong modal media
        page.locator('button:has-text("Next")').first.click()
        time.sleep(3)
        
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
                    
        screenshot_path = os.path.join(os.path.dirname(__file__), "linkedin_intent_data_live.png")
        page.screenshot(path=screenshot_path)
        print(f"[+] Đã lưu ảnh chụp xác nhận: {screenshot_path}")
        
        context.close()
        print("\n" + "=" * 65)
        print("🎉 HOÀN TẤT XUẤT BẢN BÀI VIẾT INTENT DATA LÊN LINKEDIN!")
        print("=" * 65)

if __name__ == "__main__":
    run()
