#!/usr/bin/env python3
"""
Submit All Sitemaps to Microsoft Bing Webmaster Tools API
Submits core sitemap and all company chunk sitemaps (core.xml, 0.xml - 9.xml) to Bing.
"""

import sys
import time
import json
import urllib.request
import urllib.parse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

API_BASE = "https://ssl.bing.com/webmaster/api.svc/json"
API_KEY = "7c742571ab6a4103aa339488f8220031"
DEFAULT_SITE_URL = "https://kigyoulist.com/"
BASE_URL = "https://kigyoulist.com"

def submit_feed(feed_url: str, site_url: str = DEFAULT_SITE_URL) -> bool:
    url = f"{API_BASE}/SubmitFeed?apikey={API_KEY}"
    payload = {
        "siteUrl": site_url,
        "feedUrl": feed_url
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "Kigyoulist/1.0"
        }
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status == 200

def get_feeds(site_url: str = DEFAULT_SITE_URL):
    url = f"{API_BASE}/GetFeeds?siteUrl={urllib.parse.quote(site_url)}&apikey={API_KEY}"
    req = urllib.request.Request(url, headers={"User-Agent": "Kigyoulist/1.0"})
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode("utf-8")
        parsed = json.loads(raw)
        return parsed.get("d", parsed)

def main():
    print("=" * 75)
    print("🚀 SUBMITTING ALL SITEMAPS TO MICROSOFT BING WEBMASTER TOOLS")
    print(f"Target Site: {DEFAULT_SITE_URL}")
    print("=" * 75)

    sitemaps = [
        f"{BASE_URL}/sitemap.xml",
        f"{BASE_URL}/sitemap/core.xml",
    ]
    for i in range(10):
        sitemaps.append(f"{BASE_URL}/sitemap/{i}.xml")

    print(f"Found {len(sitemaps)} sitemaps to submit to Bing Webmaster Tools.\n")

    success_count = 0
    for sm in sitemaps:
        try:
            print(f"Submitting: {sm:<45} ... ", end="", flush=True)
            ok = submit_feed(sm)
            if ok:
                print("✅ SUCCESS (HTTP 200)")
                success_count += 1
            else:
                print("⚠️ Unexpected response")
            time.sleep(1) # respectful rate limit
        except Exception as e:
            print(f"❌ ERROR: {e}")

    print(f"\nSuccessfully submitted {success_count}/{len(sitemaps)} sitemaps to Bing.")
    print("\nVerifying current registered sitemaps on Bing Webmaster Tools:")
    time.sleep(2)

    try:
        feeds = get_feeds()
        print(f"\nTotal Registered Sitemaps in Bing: {len(feeds)}")
        print(f"{'Sitemap URL':<50} | {'Status':<10} | {'Last Crawled'}")
        print("-" * 85)
        for f in feeds:
            f_url = f.get('Url', '')
            status = f.get('Status', 'Unknown')
            last_crawled = f.get('LastCrawled', 'Pending')
            print(f"{f_url:<50} | {status:<10} | {last_crawled}")
    except Exception as e:
        print(f"Could not retrieve feed list: {e}")

if __name__ == "__main__":
    main()
