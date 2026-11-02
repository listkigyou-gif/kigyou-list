# -*- coding: utf-8 -*-
import urllib.request
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

urls = [
    'https://kigyoulist.com/ja/guide',
    'https://kigyoulist.com/ja/guide/ai-sales-list',
    'https://kigyoulist.com/ja/guide/excel-sales-list-template',
    'https://kigyoulist.com/ja/guide/form-marketing-tips',
    'https://kigyoulist.com/ja/guide/bankruptcy-signs-check',
    'https://kigyoulist.com/ja/guide/edinet-salary-ranking-utilization',
]

headers = {'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'}

all_clean = True
for u in urls:
    req = urllib.request.Request(u, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        title_m = re.search(r'<title>(.*?)</title>', html)
        canonical_m = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', html)
        has_schema = 'application/ld+json' in html
        forbidden = [w for w in ['TQC', '03-6907-1219', '豊島区'] if w in html]
        print(f"URL: {u}")
        print(f"  Status: {resp.status}")
        print(f"  Title: {title_m.group(1) if title_m else 'None'}")
        print(f"  Canonical: {canonical_m.group(1) if canonical_m else 'None'}")
        print(f"  Has Schema: {has_schema}")
        print(f"  Forbidden found: {forbidden}")
        if forbidden:
            all_clean = False
        print("-" * 50)

print(f"Audit completed. All Clean: {all_clean}")

