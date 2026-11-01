# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Desktop
        page_pc = browser.new_page(viewport={"width": 1440, "height": 900})
        page_pc.goto("https://kigyoulist.com/ja", wait_until="networkidle")
        page_pc.locator("section[aria-labelledby='hero-heading']").screenshot(path="scripts/hero_desktop.png")
        print("[+] Desktop screenshot captured: scripts/hero_desktop.png")

        # 2. Mobile (iPhone 14 / Pixel standard 390px width)
        page_mobile = browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True)
        page_mobile.goto("https://kigyoulist.com/ja", wait_until="networkidle")
        page_mobile.locator("section[aria-labelledby='hero-heading']").screenshot(path="scripts/hero_mobile.png")
        print("[+] Mobile screenshot captured: scripts/hero_mobile.png")

        browser.close()

if __name__ == '__main__':
    capture()
