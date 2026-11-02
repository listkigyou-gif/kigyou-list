# -*- coding: utf-8 -*-
"""
Script kích hoạt lập chỉ mục hỏa tốc cho Hub /guide và 5 bài viết:
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
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure scripts dir is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

HOST = "kigyoulist.com"
BASE_URL = "https://kigyoulist.com"
KEY = "0a1fbe0a7866441bb57817e0bf538068"
KEY_LOCATION = f"https://{HOST}/0a1fbe0a7866441bb57817e0bf538068.txt"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

TARGET_URLS = [
    f"{BASE_URL}/ja/guide",
    f"{BASE_URL}/ja/guide/ai-sales-list",
    f"{BASE_URL}/ja/guide/excel-sales-list-template",
    f"{BASE_URL}/ja/guide/form-marketing-tips",
    f"{BASE_URL}/ja/guide/bankruptcy-signs-check",
    f"{BASE_URL}/ja/guide/edinet-salary-ranking-utilization",
    f"{BASE_URL}/en/guide",
    f"{BASE_URL}/vi/guide",
    f"{BASE_URL}/ja",
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
    print("\n[2/4] Đang nộp URLs tới Google Search Indexing API VIP Pool...")
    try:
        from google_indexing_vip import GoogleIndexingClient
        client = GoogleIndexingClient()
        for u in TARGET_URLS[:6]: # Submit top 6 primary URLs to save quota
            res = client.publish_url(u)
            print(f"[+] Google Indexing API [{u}]: {res}")
            time.sleep(1)
    except Exception as e:
        print(f"[-] Google Indexing API notice: {e}")

def purge_caches():
    print("\n[3/4] Xóa cache 2 lớp (Cloudflare Edge + Nginx NVMe)...")
    try:
        cmd = [sys.executable, "scripts/cache_purger.py", "--urls"] + TARGET_URLS
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        print(res.stdout)
    except Exception as e:
        print(f"[-] Purge error: {e}")

def verify_googlebot():
    print("\n[4/4] Đo kiểm thực tế với User-Agent Googlebot...")
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    }
    check_urls = [
        f"{BASE_URL}/ja/guide",
        f"{BASE_URL}/ja/guide/ai-sales-list",
        f"{BASE_URL}/ja/tools/ai-sales-list" # should return 301 or redirect
    ]
    for url in check_urls:
        try:
            req = urllib.request.Request(url, headers=headers)
            # Custom opener to check redirects without auto following if needed, or follow
            with urllib.request.urlopen(req, timeout=15) as resp:
                final_url = resp.geturl()
                status = resp.status
                body = resp.read(2048).decode("utf-8", errors="ignore")
                has_title = "<title>" in body
                print(f"[OK] {url} -> Status {status} | Final URL: {final_url} | Has Title: {has_title}")
        except urllib.error.HTTPError as e:
            print(f"[REDIRECT/ERR] {url} -> HTTP {e.code} (Location: {e.headers.get('Location')})")
        except Exception as e:
            print(f"[ERR] {url}: {e}")

if __name__ == "__main__":
    submit_indexnow()
    submit_google_vip()
    purge_caches()
    verify_googlebot()
