import os
import sys
import json
import urllib.parse
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

raw_header = "_ga=GA1.1.1550660219.1791736874;remember_user_token=eyJfcmFpbHMiOnsibWVzc2FnZSI6Ilcxc3pOVEl6T1RGZExDSWtNbUVrTVRFa1lscGhSbWc0ZFV0VE56UkRUemd2Tm5Ga1dGQk9kU0lzSWpFM09URTNNelk1TURNdU56YzNOVGN5TkNKZCIsImV4cCI6IjIwMjctMDItMTRUMTY6NDE6NDMuNzc3WiIsInB1ciI6ImNvb2tpZS5yZW1lbWJlcl91c2VyX3Rva2VuIn19--cf40eed76da67a2c61e16a64b1c3b5ed33c4ebe1;_zenn_session=cJ6UylwKMXB7KRmnoc8SReAX%2B2HMYpJtFvsQy85Jsl40caqpVNpLzi5cxYXNbKbUd8o6knJABsjouV2pYmNS8aI5IvRom62NYE%2FZPRHiunGmApu25C1Jm1ZUAsyNKhtTKL08UFLYCVqDN97nOfA1uMionl3HbbuW%2B3UjPQ%2Fkgigw8%2Bc0n9hq18bAeXfFFIhyuJT%2BICmAEw5Qi%2FsbT%2BQuAXbxCRuVLWbRU4Qb%2BzonOkX8nDQZIB7lPQiPLDo1zTkG%2Fo91N6JYY33OMgURnECrekGqLQIR9Wc6pc1MMfEAeitEbxtNwgI7liOXhL3EvE6t9yvkkNjUizZ0JOIVdnBE5z%2FLOs10osqw%2FVwnT%2B1TsQxrNUcChJqvrQC0favuolYld20DncY%3D--0lzFnQAtZ%2B%2FSN3Sf--1Z7JquKJ7ZNxWvkH4NW9%2Bg%3D%3D;_ga_PVQ2KDWHD2=GS2.1.s1791736874$o1$g1$t1791737606$j60$l0$h0"

items = {}
for part in raw_header.split(";"):
    if "=" in part:
        k, v = part.strip().split("=", 1)
        items[k.strip()] = v.strip()

cookies_to_add = []
for k, v in items.items():
    unquoted = urllib.parse.unquote(v)
    cookies_to_add.append({
        "name": k,
        "value": unquoted,
        "domain": ".zenn.dev",
        "path": "/",
        "httpOnly": True if k in ["remember_user_token", "_zenn_session"] else False,
        "secure": True,
        "sameSite": "Lax"
    })

storage_state_file = r"c:\kigyou-list\zenn_auth_state.json"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    context.add_cookies(cookies_to_add)
    page = context.new_page()
    page.goto("https://zenn.dev", wait_until="networkidle", timeout=30000)
    
    html = page.content()
    if "投稿する" in html:
        # Save exact Playwright storage_state (cookies + localStorage)
        context.storage_state(path=storage_state_file)
        print(f"[SUCCESS] Da luu storage_state hoan hao vao {storage_state_file}!")
    else:
        print("[-] Login failed")
        
    browser.close()
