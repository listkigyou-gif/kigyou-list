import urllib.request
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
req = urllib.request.Request('https://kigyoulist.com/ja', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode('utf-8')
    matches = [m.start() for m in re.finditer(r'/ja/licenses', html)]
    print(f"Total occurrences of /ja/licenses: {len(matches)}")
    for m in matches:
        print("Snippet:", html[max(0, m-50):min(len(html), m+100)].replace('\n', ' '))
