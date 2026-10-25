#!/usr/bin/env python3
"""
Submit newly launched Public License & Professional Registration SEO Hubs to IndexNow
"""
import sys
import json
import urllib.request
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

HOST = "kigyoulist.com"
BASE_URL = "https://kigyoulist.com"
KEY = "0a1fbe0a7866441bb57817e0bf538068"
KEY_LOCATION = f"https://{HOST}/0a1fbe0a7866441bb57817e0bf538068.txt"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

HUBS = ['tokutei', 'shigyo', 'takken', 'kensetsu', 'kobutsu', 'haken', 'shokugyo', 'ryokan', 'inshoku']
PREF_CODES = [f"{p:02d}" for p in range(1, 48)]

def generate_hub_urls():
    urls = []
    # Core licenses directory
    urls.append(f"{BASE_URL}/ja/licenses")
    urls.append(f"{BASE_URL}/en/licenses")
    urls.append(f"{BASE_URL}/vi/licenses")
    
    # Each hub
    for hub in HUBS:
        urls.append(f"{BASE_URL}/ja/license/{hub}")
        urls.append(f"{BASE_URL}/en/license/{hub}")
        urls.append(f"{BASE_URL}/vi/license/{hub}")
        for pref in PREF_CODES:
            urls.append(f"{BASE_URL}/ja/license/{hub}/{pref}")
    return urls

def main():
    urls = generate_hub_urls()
    print(f"Tổng số URLs Hub Giấy Phép & Tỉnh Thành cần submit: {len(urls)}")
    
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls
    }
    
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        INDEXNOW_ENDPOINT,
        data=data_bytes,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "Kigyoulist-LicenseHub-IndexNow/1.0 (https://kigyoulist.com)"
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"IndexNow Response: {resp.status} - Thành công nộp {len(urls)} URLs!")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        print(f"IndexNow HTTP Error {e.code}: {body}")
    except Exception as e:
        print(f"IndexNow Exception: {e}")

if __name__ == "__main__":
    main()
