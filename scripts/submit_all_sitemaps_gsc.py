#!/usr/bin/env python3
"""
Submit All Sitemaps to Google Search Console
Submits core sitemap and all company chunk sitemaps (0.xml - 9.xml) to GSC.
"""

import sys
import time
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

KEY_FILE = r"c:\kigyou-list\google_credentials.json"
SITE_URL = "sc-domain:kigyoulist.com"
SCOPES = ['https://www.googleapis.com/auth/webmasters']
BASE_URL = "https://kigyoulist.com"

def main():
    print("=" * 70)
    print("🚀 SUBMITTING ALL SITEMAPS TO GOOGLE SEARCH CONSOLE")
    print(f"Target Site: {SITE_URL}")
    print("=" * 70)

    creds = service_account.Credentials.from_service_account_file(KEY_FILE, scopes=SCOPES)
    service = build('searchconsole', 'v1', credentials=creds)

    # 1. Base index and core
    sitemaps_to_submit = [
        f"{BASE_URL}/sitemap.xml",
        f"{BASE_URL}/sitemap/core.xml",
    ]

    # 2. Company chunk sitemaps 0 to 9
    for i in range(10):
        sitemaps_to_submit.append(f"{BASE_URL}/sitemap/{i}.xml")

    print(f"Found {len(sitemaps_to_submit)} sitemaps to verify/submit.\n")

    for sm in sitemaps_to_submit:
        try:
            print(f"Submitting: {sm} ... ", end="", flush=True)
            service.sitemaps().submit(siteUrl=SITE_URL, feedpath=sm).execute()
            print("✅ SUCCESS")
            time.sleep(1) # respectful rate limit
        except Exception as e:
            print(f"❌ ERROR: {e}")

    print("\nVerifying current sitemap status on Google Search Console:")
    time.sleep(2)
    resp = service.sitemaps().list(siteUrl=SITE_URL).execute()
    sitemaps = resp.get('sitemap', [])
    print(f"\nTotal Registered Sitemaps in GSC: {len(sitemaps)}")
    print(f"{'Path':<45} | {'Pending':<8} | {'Warnings':<9} | {'Errors':<7} | {'Submitted URLs'}")
    print("-" * 85)
    for s in sitemaps:
        path = s.get('path', '')
        pending = str(s.get('isPending', False))
        warn = str(s.get('warnings', 0))
        err = str(s.get('errors', 0))
        contents = s.get('contents', [])
        sub_cnt = contents[0].get('submitted', 'N/A') if contents else 'Queued'
        print(f"{path:<45} | {pending:<8} | {warn:<9} | {err:<7} | {sub_cnt}")

if __name__ == "__main__":
    main()
