# -*- coding: utf-8 -*-
"""
Script kích hoạt lập chỉ mục hỏa tốc (Phase 4):
1. Gửi IndexNow (Microsoft Bing & Yandex)
2. Gửi Google Search Indexing API Pool (VIP)
3. Purge Cloudflare Edge Cache & Nginx Cache
4. Đo kiểm tra User-Agent Googlebot xác nhận thẻ <head>, Title & Canonical
"""
import os
import sys
import json
import time
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

HOST = "kigyoulist.com"
BASE_URL = "https://kigyoulist.com"
KEY = "0a1fbe0a7866441bb57817e0bf538068"
KEY_LOCATION = f"https://{HOST}/0a1fbe0a7866441bb57817e0bf538068.txt"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

TARGET_URLS = [
    f"{BASE_URL}/ja/tools/ai-sales-list",
    f"{BASE_URL}/ja/form-marketing",
    f"{BASE_URL}/ja/compare",
    f"{BASE_URL}/en/tools/ai-sales-list",
    f"{BASE_URL}/vi/tools/ai-sales-list",
]

def submit_indexnow():
    print("\n[1/4] Đang nộp URLs tới Microsoft Bing IndexNow...")
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": TARGET_URLS
    }
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        INDEXNOW_ENDPOINT,
        data=data_bytes,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"[+] IndexNow Response: {resp.status} {resp.reason}")
            if resp.status in [200, 202]:
                print(f"[+] Bing IndexNow đã tiếp nhận thành công {len(TARGET_URLS)} URLs!")
    except urllib.error.HTTPError as e:
        print(f"[-] IndexNow HTTPError: {e.code} - {e.read().decode('utf-8', errors='ignore')}")
    except Exception as e:
        print(f"[-] IndexNow Error: {e}")

def submit_google_vip():
    print("\n[2/4] Đang nộp URL tới Google Search Indexing API VIP Pool...")
    try:
        from google_indexing_vip import GoogleIndexingClient
        client = GoogleIndexingClient()
        target = f"{BASE_URL}/ja/tools/ai-sales-list"
        res = client.publish_url(target)
        print(f"[+] Google Indexing API Result: {res}")
    except Exception as e:
        print(f"[-] Google Indexing API notice: {e}")

def purge_caches():
    print("\n[3/4] Xóa cache 2 lớp (Cloudflare Edge + Nginx NVMe)...")
    try:
        import subprocess
        res = subprocess.run([
            sys.executable, "scripts/cache_purger.py",
            "--urls", 
            f"{BASE_URL}/ja/tools/ai-sales-list",
            f"{BASE_URL}/ja/form-marketing",
            f"{BASE_URL}/ja/compare"
        ], capture_output=True, text=True, timeout=30)
        print(res.stdout)
    except Exception as e:
        print(f"[-] Cache Purge error: {e}")

def verify_googlebot_head():
    print("\n[4/4] Đo kiểm tra User-Agent Googlebot trực tiếp trên Production...")
    url = f"{BASE_URL}/ja/tools/ai-sales-list"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.69 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            head_end = html.find("</head>")
            body_start = html.find("<body")
            can_pos = html.find('rel="canonical"')
            title_pos = html.find("<title>")
            
            print(f"HTTP Status: {resp.status}")
            print(f"Total HTML Bytes: {len(html)}")
            print(f"Position </head>: {head_end}")
            print(f"Position <body: {body_start}")
            print(f"Position <title>: {title_pos}")
            print(f"Position rel=\"canonical\": {can_pos}")
            
            valid = (0 < title_pos < head_end) and (0 < can_pos < head_end)
            print(f"Title & Canonical inside <head>: {valid}")
            if valid:
                print("[SUCCESS] Thẻ <head> hoàn hảo 100%! Googlebot sẽ nhận diện và index ngay.")
            else:
                print("[WARNING] Cần kiểm tra lại vị trí thẻ <head>!")
    except Exception as e:
        print(f"[-] Verification Error: {e}")

if __name__ == "__main__":
    submit_indexnow()
    submit_google_vip()
    purge_caches()
    verify_googlebot_head()
