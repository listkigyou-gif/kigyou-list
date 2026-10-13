import os
import sys

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".valuepress_user_profile"))
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=profile_dir, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto('https://www.value-press.com/')
    
    print('Home URL:', page.url)
    print('Home Title:', repr(page.title()))
    has_mypage = page.locator("text='マイページ'").count()
    has_login = page.locator("text='ログイン'").count()
    has_logout = page.locator("text='ログアウト'").count()
    print('has mypage count:', has_mypage)
    print('has login count:', has_login)
    print('has logout count:', has_logout)
    
    # Check all cookies
    cookies = ctx.cookies()
    print("Total cookies:", len(cookies))
    for c in cookies:
        print("  - Cookie:", c.get("name"), c.get("domain"))
        
    ctx.close()
