# -*- coding: utf-8 -*-
"""
Script xuất bản Facebook riêng cho Trang cá nhân Takahashi Rika Ngày 7
"""
import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROFILE_DIR = os.path.abspath(r"c:\kigyou-list\.facebook_user_profile")
PERSONAL_URL = "https://www.facebook.com/profile.php?id=61595229033404"
IMAGE_PATH = os.path.abspath(r"c:\kigyou-list\scripts\images\fb_day_07_chaosmap.jpg")

POST_CONTENT = """【2026年最新】日本のB2B / SaaS カオスマップを公開しました🗺️✨

「ツールの乱立で社内データが分断（サイロ化）している…」
「年間100万円超の名簿ツールを契約したが、データ更新が遅く固定費ばかりかかる…」

そんなB2B営業組織の課題を解決するため、全国500万社データベース『Kigyou-list』は、2026年の国内エンタープライズ・SaaSエコシステムを体系化した最新カオスマップを公開いたしました！

■ 2026年 営業DXを支える5大領域：
1️⃣ 【SalesTech & AI Outreach】フォーム自動送信・AIパーソナライズメール
2️⃣ 【Corporate DB & Intent Data】500万社DB・求人/補助金シグナル
3️⃣ 【AI & Automation】LLM業界タグ付け・セマンティック類似検索
4️⃣ 【HR Tech & Signals】採用動向・組織課題の特定
5️⃣ 【FinTech & Compliance】インボイス一括判定・24時間企業監視

単なる「静的な社名リスト」を年契約で買う時代は終わりました。リアルタイムなインテントデータをAPIとAIで軽量に使い倒すことが、これからの勝ち筋です。

初期費用0円・年間契約縛りなし・毎月50件CSV永久無料で今すぐご利用いただけます。

▼ カオスマップの詳細解説＆500万社無料検索はこちら：
👉 https://kigyoulist.com/?utm_source=facebook&utm_medium=day_07_chaosmap

#KigyouList #カオスマップ #B2B #SaaS #セールステック #インテントデータ #営業DX #スタートアップ #コスト削減"""

def publish_personal():
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            PROFILE_DIR,
            headless=True,
            channel="chrome",
            viewport={"width": 1280, "height": 900},
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto(PERSONAL_URL, wait_until="domcontentloaded")
        time.sleep(5)
        page.keyboard.press("Escape")

        print("[*] Opening composer on personal profile...")
        trigger = page.locator('span:text-is("What\'s on your mind?"), div[role="button"]:has-text("What\'s on your mind"), div:has-text("何を考えていますか")').first
        trigger.wait_for(state="visible", timeout=12000)
        trigger.click()
        time.sleep(3)

        dialog = page.locator('div[role="dialog"]').filter(has_text="Create post").first
        if dialog.count() == 0:
            dialog = page.locator('div[role="dialog"]').first
        dialog.wait_for(state="visible", timeout=10000)

        # Attach image
        if os.path.exists(IMAGE_PATH):
            print(f"[*] Attaching image: {IMAGE_PATH}...")
            photo_btn = dialog.locator('div[aria-label="Photo/video"]').first
            if photo_btn.count() > 0 and photo_btn.is_visible():
                photo_btn.click()
                time.sleep(2)
            
            file_input = page.locator('input[type="file"]').first
            if file_input.count() > 0:
                file_input.set_input_files(IMAGE_PATH)
                time.sleep(4)
                print("[+] Image attached successfully!")

        # Insert text
        print("[*] Inserting post text...")
        editor = dialog.locator('div[role="textbox"][contenteditable="true"]').first
        editor.wait_for(state="visible", timeout=10000)
        editor.click()
        time.sleep(1)
        page.keyboard.insert_text(POST_CONTENT)
        time.sleep(2)

        # Post
        print("[*] Clicking Post...")
        post_btn = dialog.locator('div[aria-label="Post"][role="button"], div[role="button"]:has-text("Post"), span:text-is("Post")').last
        post_btn.click(force=True)
        time.sleep(15)

        shot = os.path.join(r"c:\kigyou-list\scripts", "facebook_personal_live.png")
        page.screenshot(path=shot)
        print(f"[+] Personal post published successfully! Saved to: {shot}")
        ctx.close()

if __name__ == "__main__":
    publish_personal()
