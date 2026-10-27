import os
import sys
import time
from typing import List, Optional

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".x_user_profile"))

def get_browser_context(p, headless=True):
    args = [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox"
    ]
    try:
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",
            headless=headless,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
    except Exception:
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            headless=headless,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
    return context

def post_thread_browser(tweets: List[str], image_path: Optional[str] = None, headless=True) -> Optional[str]:
    """Posts a thread cleanly: Post 1 on Home timeline, then subsequent parts as replies."""
    if not tweets:
        return None
        
    with sync_playwright() as p:
        context = get_browser_context(p, headless=headless)
        page = context.pages[0] if context.pages else context.new_page()
        
        # --- GHI NHẬN TWEET MỚI NHẤT TRƯỚC KHI ĐĂNG ---
        print("[*] Checking current latest tweet ID on profile...")
        page.goto("https://x.com/kigyoulist", wait_until="domcontentloaded")
        time.sleep(3)
        previous_top_href = None
        try:
            articles = page.locator('article[data-testid="tweet"]')
            for i in range(articles.count()):
                art = articles.nth(i)
                if "Pinned" in art.inner_text() or "固定された" in art.inner_text():
                    continue
                links = art.locator('a[href*="/status/"]')
                if links.count() > 0:
                    previous_top_href = links.first.get_attribute("href")
                    break
        except Exception:
            pass
        print(f"[*] Previous top tweet href: {previous_top_href}")

        # --- BƯỚC 1: ĐĂNG TWEET ĐẦU TIÊN TẠI TRANG CHỦ ---
        print("[*] Navigating to https://x.com/home ...")
        page.goto("https://x.com/home", wait_until="domcontentloaded")
        time.sleep(4)
        
        # Xử lý nếu gặp màn hình xác thực bảo mật Cloudflare Turnstile (account/access)
        for _ in range(8):
            if "account/access" in page.url:
                print("  -> Đang chờ Cloudflare Turnstile xác thực và chuyển hướng về trang chủ...")
                time.sleep(3)
            else:
                break
        time.sleep(2)

        if "login" in page.url:
            print("[-] Session expired or not logged in.")
            context.close()
            return None
            
        print("[*] Typing Tweet 1...")
        inline_box = page.locator('div[data-testid="tweetTextarea_0"]').first
        inline_box.wait_for(state="visible", timeout=15000)
        inline_box.click()
        page.keyboard.insert_text(tweets[0])
        time.sleep(1)
        
        if image_path and os.path.exists(image_path):
            print(f"[*] Attaching image to Tweet 1: {image_path}...")
            file_input = page.locator('input[data-testid="fileInput"]').first
            file_input.set_input_files(image_path)
            time.sleep(4)  # Wait for upload preview
            
        print("[*] Clicking Post button for Tweet 1...")
        post_btn = page.locator('button[data-testid="tweetButtonInline"], button[data-testid="tweetButton"]').first
        try:
            page.wait_for_selector('button[data-testid="tweetButtonInline"]:not([disabled]), button[data-testid="tweetButton"]:not([disabled])', timeout=15000)
        except Exception:
            page.screenshot(path="c:/kigyou-list/scripts/x_post1_debug.png")
            print("[-] Warning: Post button may still be disabled. Check x_post1_debug.png")
        post_btn.click(force=True)
        time.sleep(8)
        print("[+] Tweet 1 post clicked!")
        
        # --- BƯỚC 2: ĐỢI VÀ LẤY LINK TWEET 1 MỚI NHẤT ---
        print("[*] Polling https://x.com/kigyoulist for the brand new tweet...")
        tweet1_url = None
        for attempt in range(8):
            page.goto("https://x.com/kigyoulist", wait_until="domcontentloaded")
            time.sleep(4)
            try:
                articles = page.locator('article[data-testid="tweet"]')
                count = articles.count()
                for i in range(count):
                    art = articles.nth(i)
                    text = art.inner_text()
                    if "Pinned" in text or "固定された" in text:
                        continue
                    links = art.locator('a[href*="/status/"]')
                    if links.count() > 0:
                        href = links.first.get_attribute("href")
                        if href and "kigyoulist" in href:
                            # If it's different from the previous top tweet, it's our new tweet!
                            if href != previous_top_href:
                                tweet1_url = f"https://x.com{href}" if href.startswith("/") else href
                                print(f"[+] Verified brand new Tweet 1 URL: {tweet1_url}")
                                break
                            elif previous_top_href is None:
                                tweet1_url = f"https://x.com{href}" if href.startswith("/") else href
                                print(f"[+] Found Tweet 1 URL: {tweet1_url}")
                                break
                if tweet1_url:
                    break
            except Exception as e:
                print(f"[-] Poll attempt {attempt+1} error: {e}")
            print(f"[*] Waiting for tweet to be indexed by X (attempt {attempt+1}/8)...")
            time.sleep(3)
            
        if not tweet1_url:
            print("[-] Cannot proceed with replies without Tweet 1 URL.")
            context.close()
            return None
            
        # --- BƯỚC 3: ĐĂNG CÁC TWEET TIẾP THEO (REPLIES) ---
        target_reply_url = tweet1_url
        for idx in range(1, len(tweets)):
            part_num = idx + 1
            print(f"[*] Posting Part {part_num}/{len(tweets)} as reply...")
            page.goto(target_reply_url, wait_until="domcontentloaded")
            time.sleep(4)
            
            # Click inline reply box
            reply_box = page.locator('div[data-testid="tweetTextarea_0"]').first
            reply_box.wait_for(state="visible", timeout=15000)
            reply_box.click()
            time.sleep(0.5)
            page.keyboard.insert_text(tweets[idx])
            time.sleep(1)
            
            # Click Reply button with force=True to bypass overlay toasts
            reply_btn = page.locator('button[data-testid="tweetButtonInline"]').first
            reply_btn.wait_for(state="visible", timeout=10000)
            reply_btn.click(force=True)
            time.sleep(5)
            print(f"[+] Part {part_num} posted successfully!")
            
        print("[+] ALL THREAD PARTS PUBLISHED SUCCESSFULLY!")
        context.close()
        return tweet1_url

def post_tweet_browser(text: str, image_path: Optional[str] = None, headless=True) -> Optional[str]:
    """Posts a single tweet via home timeline."""
    return post_thread_browser([text], image_path=image_path, headless=headless)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="X Browser Publisher CLI")
    parser.add_argument("--setup", action="store_true", help="Setup X session")
    parser.add_argument("--text", type=str, help="Single tweet text")
    parser.add_argument("--thread-file", type=str, help="Path to thread markdown file")
    parser.add_argument("--media", type=str, help="Path to image file")
    parser.add_argument("--no-headless", action="store_true", help="Run with visible browser window")
    args = parser.parse_args()

    headless = not args.no_headless

    if args.setup:
        from x_setup_session import setup_x_session
        setup_x_session()
    elif args.thread_file:
        with open(args.thread_file, "r", encoding="utf-8") as f:
            parts = [p.strip() for p in f.read().split("---") if p.strip()]
        post_thread_browser(parts, image_path=args.media, headless=headless)
    elif args.text:
        post_tweet_browser(args.text, image_path=args.media, headless=headless)
    else:
        parser.print_help()
