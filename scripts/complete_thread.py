import os
import sys
import time
from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".x_user_profile"))

PART_2 = """従来のリスト販売サービス vs Kigyou-list：

❌ 従来：月額3万〜10万円／年間契約（途中解約不可）／約100万社
⭕ Kigyou-list：月額4,980円／年間縛りなし／500万社（国税庁全量）

さらにハローワーク求人や助成金受給など「今、予算がある企業」のインテントデータも網羅しています。"""

PART_3 = """詳細な機能比較表と、実際のデータサンプル検索はこちらから無料で確認できます。
営業コスト見直しや新規開拓の効率化にぜひお役立てください。

📊 サービス詳細・比較チャート：
https://kigyoulist.com/ja/compare

#営業DX #企業リスト #インサイドセールス #B2Bマーケティング #KigyouList"""

def reply_parts():
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
        
        target_url = "https://x.com/kigyoulist/status/2108915652002222106"
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
    reply_parts()
