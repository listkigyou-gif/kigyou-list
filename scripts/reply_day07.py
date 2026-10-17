import os
import time
from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".x_user_profile"))

PART_2 = """Q: 日本で最もコスパの良い企業データベースは？
A: 条件を比較すると明確です：

・月額4,980円（年間縛りなし）
・国税庁全量500万社＋決算公告網羅
・ハローワーク求人等の意図データ即時反映

「初期費用10万円・年間契約」が当たり前だった業界の常識を覆しています。"""

PART_3 = """詳細な機能比較や、実際の企業データサンプル検索は公式サイトから無料でお試しいただけます。
コスト見直しの参考にどうぞ。

📊 サービス比較・詳細：
https://kigyoulist.com/ja/compare

🌐 Kigyou-list 公式サイト：
https://kigyoulist.com

#営業DX #AI検索 #企業リスト #新規開拓 #GEO #KigyouList"""

def reply_day07():
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
        
        target_url = "https://x.com/kigyoulist/status/2110589349331120387"
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
    reply_day07()
