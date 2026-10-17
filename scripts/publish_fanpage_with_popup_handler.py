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
FANPAGE_URL = "https://www.facebook.com/kigyoulist/"
IMG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

DAY_1_TEXT = """【月10万円の名簿ツールは本当に必要か？】
B2B営業リストの「高額な年間契約」に終止符を打つ現実解 💡📊

新規開拓を進める多くの営業責任者・経営者の方から、こんなご相談をよくいただきます。

「年間契約で100万円以上前払いしたのに、半分以上使わなかった…」
「毎月数万円払っているのに、データの更新頻度が低く連絡がつかない…」
「スタートアップや中小企業には、既存の名簿ツールは高すぎる…」

日本のB2B営業において、長年当たり前とされてきた「高額な年間契約縛り」。
本当に、毎月10万円もの固定費を支払い続ける必要があるのでしょうか？

国内最大級の企業データベース「Kigyou List（kigyoulist.com）」は、こうした営業現場の不合理を解消するために誕生しました。

━━━━━━━━━━━━━━━━━━━━━━━━━━
■ Kigyou Listが選ばれる3つの理由
━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ 【月額4,980円（税込）・年間縛り一切なし】
初期費用0円、いつでも解約可能。必要な月だけ無駄なく活用できます。

2️⃣ 【全国500万社以上のオープンデータを網羅】
国税庁法人番号、経済産業省gBizINFO、自治体データをAIで独自統合・常に最新化。

3️⃣ 【業界・地域・求人シグナルによる精密ターゲティング】
単なる社名一覧ではなく、ハローワーク求人や助成金情報などの「購買意欲シグナル」と掛け合わせて抽出可能。

営業リストの調達コストを90%削減し、真に必要な営業活動と顧客提案にリソースを集中させませんか？

他社ツールとの詳細な料金・機能比較表を公開しております。ぜひ貴社のROI改善にお役立てください👇
👉 主要ツール徹底比較表： https://kigyoulist.com/ja/compare?utm_source=facebook&utm_medium=day_01

#営業リスト #B2B営業 #コスト削減 #法人データベース #営業DX #新規開拓 #インサイドセールス #KigyouList"""

def post_day1_to_fanpage():
    print(">>> [1] Khởi động trình duyệt...")
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            PROFILE_DIR,
            headless=True,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-notifications"],
            viewport={"width": 1280, "height": 1000}
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto(FANPAGE_URL, wait_until="domcontentloaded")
        time.sleep(5)
        page.keyboard.press("Escape")

        # 1. Bấm What's on your mind?
        print(">>> [2] Mở khung tạo bài viết...")
        trigger = page.locator('span:text-is("What\'s on your mind?"), div[role="button"]:has-text("What\'s on your mind")').first
        trigger.wait_for(state="visible", timeout=10000)
        trigger.click()
        time.sleep(3)

        # 2. Định vị modal Create post
        print(">>> [3] Định vị modal Create post...")
        dialog = page.locator('div[role="dialog"]').filter(has_text="Create post").first
        dialog.wait_for(state="visible", timeout=10000)

        # 3. Bấm icon Photo/video trong modal
        print(">>> [4] Bấm icon Photo/video...")
        photo_icon = dialog.locator('div[aria-label="Photo/video"]').first
        if photo_icon.count() > 0 and photo_icon.is_visible():
            photo_icon.click()
            time.sleep(2)

        # 4. Upload ảnh
        print(f">>> [5] Đính kèm file ảnh: {IMG_PATH} ...")
        file_input = dialog.locator('input[type="file"]').first
        file_input.wait_for(state="attached", timeout=10000)
        file_input.set_input_files(IMG_PATH)
        time.sleep(4)
        print("  -> Đã đính kèm ảnh!")

        # 5. Nhập văn bản
        print(">>> [6] Nhập text bài viết...")
        editor = dialog.locator('div[role="textbox"][contenteditable="true"]').first
        editor.click()
        time.sleep(1)
        page.keyboard.insert_text(DAY_1_TEXT)
        time.sleep(2)
        print("  -> Đã nhập nội dung bài viết!")

        # 6. Bấm Next
        print(">>> [7] Bấm nút Next...")
        next_btn = dialog.locator('div[aria-label="Next"][role="button"], div[role="button"]:has-text("Next")').first
        next_btn.wait_for(state="visible", timeout=10000)
        next_btn.click()
        time.sleep(4)
        print("  -> Đã qua bước Post settings!")

        # 7. Bấm Post
        print(">>> [8] Bấm nút Post...")
        post_btn = dialog.locator('span:text-is("Post")').last
        post_btn.wait_for(state="visible", timeout=10000)
        post_btn.click(force=True)
        print("  -> ĐÃ CLICK NÚT POST! Chờ phản hồi từ Facebook...")
        time.sleep(4)

        # 8. Xử lý popup upsell 'Chat directly with customers' / 'Not now'
        print(">>> [9] Kiểm tra popup Not now...")
        not_now_triggers = [
            'div[aria-label="Not now"]',
            'div[role="button"]:has-text("Not now")',
            'span:text-is("Not now")',
            'div[role="dialog"]:has-text("Chat directly with customers") span:text-is("Not now")'
        ]
        
        for sel in not_now_triggers:
            btn = page.locator(sel).first
            if btn.count() > 0 and btn.is_visible():
                print(f"  -> Phát hiện popup! Đang bấm '{sel}' để xác nhận xuất bản ngay...")
                btn.click()
                time.sleep(3)
                break
        else:
            print("  -> Không có popup Not now.")

        # 9. Đợi 15 giây để xuất bản xong hoàn toàn
        print(">>> [10] Đang chờ đăng bài hoàn tất...")
        time.sleep(15)

        # 10. Chụp ảnh nghiệm thu
        feed_shot = os.path.join(os.path.dirname(__file__), "fanpage_day1_published_real.png")
        page.screenshot(path=feed_shot)
        print(f">>> [HOÀN TẤT] 🎉 Đã chụp ảnh xác nhận: {feed_shot}")

        # Kiểm tra xem có bài trên trang không
        page.goto(FANPAGE_URL, wait_until="domcontentloaded")
        time.sleep(5)
        page.evaluate("window.scrollBy(0, 700)")
        time.sleep(3)
        final_shot = os.path.join(os.path.dirname(__file__), "fanpage_live_feed_verified.png")
        page.screenshot(path=final_shot)
        
        has_post = page.locator('*:has-text("月10万円の名簿ツール")').count() > 0
        print(f">>> KẾT QUẢ XÁC MINH TRÊN FEED: {'✅ ĐÃ LÊN SÓNG THÀNH CÔNG!' if has_post else '⚠️ CẦN KIỂM TRA LẠI'}")
        ctx.close()
        return has_post

if __name__ == "__main__":
    post_day1_to_fanpage()
