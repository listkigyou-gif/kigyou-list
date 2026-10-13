import os
import time
from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".x_user_profile"))

PART_2 = """なぜ「AIフォーム営業」が今選ばれるのか？

1. 高到達率：正規窓口に届き担当者が確実に確認
2. 圧倒的低コスト：1件あたり「16.1円」で送信可能
3. コンプライアンス：オプトアウト明記・営業禁止先を除外

テレアポや手動送信の工数を、最新AIで90%削減できます。"""

PART_3 = """フォーム営業の配信ロジックや技術アーキテクチャはQiitaにて詳しく解説中。
料金体系やリスト詳細は公式サイトからご確認いただけます。

💻 Qiita技術解説（Playwright自動化）：
https://qiita.com/listkigyou/items/ce85c3ed064b618a51e9

🌐 Kigyou-list 公式サイト：
https://kigyoulist.com

#営業DX #フォーム営業 #新規開拓 #インサイドセールス #KigyouList"""

def reply_thread4():
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
        
        target_url = "https://x.com/kigyoulist/status/2109489806246113289"
        print(f"Navigating to {target_url}...")
        page.goto(target_url, wait_until="domcontentloaded")
        time.sleep(4)
        
        # 1. Reply Part 2
        print("Posting Part 2...")
        reply_box = page.locator('div[data-testid="tweetTextarea_0"]').first
        reply_box.wait_for(state="visible", timeout=15000)
        reply_box.click()
        time.sleep(0.5)
        page.keyboard.insert_text(PART_2)
        time.sleep(1)
        
        reply_btn = page.locator('button[data-testid="tweetButtonInline"]').first
        reply_btn.click(force=True)
        time.sleep(5)
        print("Part 2 submitted!")
        
        # 2. Reply Part 3
        print("Posting Part 3...")
        page.goto(target_url, wait_until="domcontentloaded")
        time.sleep(4)
        
        reply_box = page.locator('div[data-testid="tweetTextarea_0"]').first
        reply_box.wait_for(state="visible", timeout=15000)
        reply_box.click()
        time.sleep(0.5)
        page.keyboard.insert_text(PART_3)
        time.sleep(1)
        
        reply_btn = page.locator('button[data-testid="tweetButtonInline"]').first
        reply_btn.click(force=True)
        time.sleep(5)
        print("Part 3 submitted!")
        
        context.close()

if __name__ == "__main__":
    reply_thread4()
