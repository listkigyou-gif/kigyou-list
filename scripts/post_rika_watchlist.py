# -*- coding: utf-8 -*-
import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".facebook_user_profile"))
PERSONAL_URL = "https://www.facebook.com/profile.php?id=61595229033404"
IMAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "fb_watchlist_launch.jpg"))

POST_CONTENT = """【経営者・経理・法務必見】取引先の「サイレントな異変」、見落としていませんか？⚠️

「長年付き合いのあった取引先が突然連絡不能になり、売掛金が焦げ付いた…」
「いつの間にか代表者が交代し、怪しい事業へ定款変更されていた…」
「インボイス登録が取り消されていたのに気づかず、税務調査で追徴課税を受けた…」

企業の倒産や信用破綻の前兆は、商業登記簿の「変更履歴」に必ず現れます。しかし、高額な調査会社のモニタリングを全取引先に導入するのはコスト的に困難でした。

国内500万社データベース『Kigyou-list』は、取引先企業の登記変更やインボイス失効を24時間365日体制で自動トラッキングする新機能「企業監視・検知（ウォッチリスト）」を【完全無料】で一般公開しました！🔍✨

■ 企業監視・変更検知機能の4大メリット：
✅ 【24時間自動巡回】国税庁・行政オープンデータと連動し、夜間・休日も変更履歴を自動追跡
✅ 【重要イベント即時検知】商号変更／本店移転／代表者交代／減資／インボイス失効を検知
✅ 【即日メール通知】重要変更が検知された際、変更前後の差分データを即座にメールでお届け
✅ 【インボイス一括照会と連携】CSV照会結果からワンクリックで監視リストへ登録可能

初期費用0円・月額0円・クレジットカード不要で、今すぐブラウザからご利用いただけます。

▼ 取引先の24時間自動監視を今すぐ無料でスタート：
👉 https://kigyoulist.com/ja/watchlist?utm_source=facebook&utm_medium=watchlist_launch

#KigyouList #企業監視 #与信管理 #バックオフィス #倒産予防 #コンプライアンス #インボイス制度 #リスク管理 #B2B"""

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE_DIR,
        headless=True,
        channel="chrome",
        viewport={"width": 1366, "height": 900},
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-notifications"]
    )
    page = ctx.new_page()
    page.goto("https://www.facebook.com/", wait_until="domcontentloaded")
    time.sleep(5)
    page.keyboard.press("Escape")

    # Switch identity if needed
    profile_btn = page.locator('div[aria-label="Your profile"], div[role="button"][aria-label*="profile"]').first
    if profile_btn.count() > 0:
        print("[*] Clicking profile icon...")
        profile_btn.click()
        time.sleep(3)
        dialog = page.locator('div[role="dialog"]').last
        if dialog.count() > 0:
            rika_btn = dialog.locator('div[role="button"]:has-text("Takahashi Rika"), span:has-text("Takahashi Rika")').first
            if rika_btn.count() > 0:
                print("[*] Switching to Takahashi Rika...")
                rika_btn.click()
                time.sleep(7)
    
    # Go to personal URL
    print("[*] Navigating to personal profile:", PERSONAL_URL)
    page.goto(PERSONAL_URL, wait_until="domcontentloaded")
    time.sleep(5)
    page.keyboard.press("Escape")

    # Click create post trigger
    trigger = page.locator('span:text-is("What\'s on your mind?"), div[role="button"]:has-text("What\'s on your mind"), div:has-text("何を考えていますか")').first
    if trigger.count() > 0:
        print("[*] Clicking create post box...")
        trigger.click()
        time.sleep(3)
        
        dialog = page.locator('div[role="dialog"]').last
        dialog.wait_for(state="visible", timeout=10000)

        # Upload image
        if os.path.exists(IMAGE_PATH):
            print("[*] Uploading image...")
            photo_icon = dialog.locator('div[aria-label="Photo/video"]').first
            if photo_icon.count() > 0 and photo_icon.is_visible():
                photo_icon.click()
                time.sleep(2)
            file_input = dialog.locator('input[type="file"]').first
            file_input.wait_for(state="attached", timeout=10000)
            file_input.set_input_files(IMAGE_PATH)
            time.sleep(4)

        # Insert text
        print("[*] Inserting post text...")
        editor = dialog.locator('div[role="textbox"][contenteditable="true"]').first
        editor.wait_for(state="visible", timeout=10000)
        editor.click()
        time.sleep(1)
        page.keyboard.insert_text(POST_CONTENT)
        time.sleep(2)

        # Click Post
        print("[*] Clicking Post button...")
        post_btn = dialog.locator('div[aria-label="Post"][role="button"], div[role="button"]:has-text("Post"), span:text-is("Post")').last
        post_btn.click(force=True)
        time.sleep(15)

        shot = os.path.join(os.path.dirname(__file__), "facebook_personal_live.png")
        page.screenshot(path=shot)
        print(f"[+] Personal post published successfully! Saved to: {shot}")
    else:
        print("[-] Could not find trigger on personal profile.")
        page.screenshot(path="scratch/rika_error.png")

    ctx.close()
