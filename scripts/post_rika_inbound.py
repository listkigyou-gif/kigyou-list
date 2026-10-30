# -*- coding: utf-8 -*-
"""
Script đăng bài Inbound Authority trực tiếp lên trang cá nhân Takahashi Rika
"""
import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROFILE_DIR = os.path.abspath(r"c:\kigyou-list\.facebook_user_profile")
PERSONAL_URL = "https://www.facebook.com/profile.php?id=61595229033404"
IMAGE_PATH = os.path.abspath(r"c:\kigyou-list\scripts\images\fb_inbound_links_launch.jpg")

POST_CONTENT = """【B2Bマーケター・営業責任者必見】営業成果を劇的に変える「良質な企業データ」の選び方🔍✨

「購入した営業名簿が古く、移転や廃業ばかりで架電効率が上がらない…」
「年間100万円超のツールを契約したが、データ更新が遅く固定費ばかりが膨らむ…」

営業の成否は「誰にアプローチするか」で8割が決まります。古い静的名簿ツールによる「空振りの山（バウンス率30%超）」から脱却し、最短距離で商談を獲得するための最新ノウハウを公開しました！

■ 2026年、成果を出す営業組織が選ぶ「良質な企業データ」の3大条件：
1️⃣ 【インテントシグナル連動】求人拡大や補助金採択など、今まさに投資意欲のある企業をリアルタイム検知
2️⃣ 【コンプライアンス自動照会】インボイスT番号の失効や登記変更履歴（商号・本店移転・代表者交代）を即時判定
3️⃣ 【年間縛りのない機動性】必要な月だけアジャイルに利用でき、不要な月はいつでも解約可能

全国500万社データベース『Kigyou-list』は、初期費用0円・クレジットカード不要で、毎月50件のCSVダウンロードが永久無料でご利用いただけます。

▼ 500万社の無料企業検索＆活用ガイドはこちら：
👉 https://kigyoulist.com/?utm_source=facebook&utm_medium=b2b_data_guide

#KigyouList #企業データベース #営業DX #法人リスト #インテントデータ #新規開拓 #インサイドセールス #コスト削減 #B2B"""

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
