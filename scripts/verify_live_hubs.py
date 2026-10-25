import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

urls = [
    "https://kigyoulist.com/ja/licenses",
    "https://kigyoulist.com/ja/license/ryokan",
    "https://kigyoulist.com/ja/license/inshoku",
    "https://kigyoulist.com/ja/license/inshoku/44",
    "https://kigyoulist.com/ja/license/ryokan/22"
]

for url in urls:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            print(f"{url} -> HTTP {resp.status} OK!")
    except Exception as e:
        print(f"{url} -> FAILED: {e}")
