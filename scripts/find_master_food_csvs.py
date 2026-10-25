import sys
import urllib.request
import json
import csv
import io

sys.stdout.reconfigure(encoding='utf-8')

# Search BODIK for more 34-col food datasets
url = 'https://data.bodik.jp/api/3/action/package_search?q=%E9%A3%9F%E5%93%81%E5%96%B6%E6%A5%AD%E8%A8%B1%E5%8F%AF&rows=30'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read().decode('utf-8'))

found_csvs = []
for pkg in data.get('result', {}).get('results', []):
    org = pkg.get('organization', {}).get('title', '')
    title = pkg.get('title', '')
    for r in pkg.get('resources', []):
        name = r.get('name', '')
        r_url = r.get('url', '')
        if 'all' in name.lower() or '全' in name or '台帳' in name or '全施設' in name or 'all' in r_url.lower():
            if 'csv' in r.get('format', '').lower():
                found_csvs.append((org, title, name, r_url))

print(f"Found {len(found_csvs)} Master Food CSVs across Japan:")
for org, title, name, r_url in found_csvs[:15]:
    print(f"- [{org}] {name} -> {r_url}")
