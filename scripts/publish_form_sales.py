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
IMG_PATH = r"C:\Users\admin\.gemini\antigravity-ide\brain\d9896013-af63-44e9-b2a5-b9bf802d5608\linkedin_b2b_form_sales_1791776313055.jpg"

post_text = (
    "【開封率80%超の衝撃】「テレアポと一斉メールだけで、新規開拓に行き詰まっていませんか？」\n\n"
    "リモートワークの普及により代表電話は繋がりにくくなり、一般的なコールドメールは迷惑メールフィルターによって開封率15%以下に低迷しています。\n\n"
    "そんな中、商談獲得効率を劇的に改善しているB2B企業がシフトしているのが【AI問い合わせフォーム営業】です。\n\n"
    "■ なぜ「フォーム営業」が圧倒的に強いのか？\n"
    "1️⃣ 確実に担当者の目に留まる\n"
    "└ 企業の「お問い合わせ窓口」に届くため、スパム扱いされず社内担当者や経営層が直接確認する確率が80%以上。\n"
    "2️⃣ 決裁者への転送率が高い\n"
    "└ 提案内容がニーズに合致していれば、社内チャットやメールでそのまま意思決定者へ転送されます。\n\n"
    "■ しかし「手動送信」には限界があります\n"
    "・1日30〜50件が限界で担当者の時間が奪われる\n"
    "・企業名やURLの入力ミスによるブランド毀損リスク\n\n"
    "■ Kigyou-list（kigyoulist.com）のAI自動化ソリューション：\n"
    "✅ 1件あたりわずか【16.1円】の圧倒的コストパフォーマンス\n"
    "✅ フォーム項目をAIが自動解析し、企業ごとの最適文章を自動入力・安全送信\n"
    "✅ 全国500万社の高精度データベースからターゲット企業を即座に抽出\n"
    "✅ 月額たったの 4,980円（年間縛りなし・いつでも解約可能）\n\n"
    "「人の手による単純作業をゼロにし、商談獲得だけに集中する」。\n"
    "次世代のアウトバウンド営業モデルの詳細は【最初のコメント欄】へ👇\n"
    "---\n"
    "#営業DX #問い合わせフォーム営業 #インサイドセールス #新規開拓 #B2Bマーケティング #KigyouList #業務効率化"
)

comment_text = (
    "AI問い合わせフォーム自動化の詳細および500万社のリスト検索はこちらから👇\n"
    "https://kigyoulist.com?utm_source=linkedin&utm_medium=social&utm_campaign=form_marketing"
)

def run():
    print("=" * 65)
    print("🚀 Xuất bản bài viết: AI FORM MARKETING lên LinkedIn")
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
        
        # 3. Đính kèm ảnh chuẩn phong cách B2B Nhật Bản
        print(f"[3/5] Đính kèm hình ảnh chuẩn trang nhã B2B: {IMG_PATH} ...")
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
                    
        screenshot_path = os.path.join(os.path.dirname(__file__), "linkedin_form_sales_live.png")
        page.screenshot(path=screenshot_path)
        print(f"[+] Đã lưu ảnh chụp xác nhận: {screenshot_path}")
        
        context.close()
        print("\n" + "=" * 65)
        print("🎉 HOÀN TẤT XUẤT BẢN BÀI VIẾT FORM MARKETING LÊN LINKEDIN!")
        print("=" * 65)

if __name__ == "__main__":
    run()
