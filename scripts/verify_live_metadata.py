import urllib.request
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://kigyoulist.com/ja/company/1010001000179"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
html = urllib.request.urlopen(req).read().decode('utf-8')

t = re.search(r'<title>(.*?)</title>', html)
d = re.search(r'<meta name="description" content="(.*?)"', html)
llms = re.search(r'href="https://kigyoulist\.com/llms\.txt"', html)

print("URL Tested:", url)
print("Live Title:\n ", t.group(1) if t else "Not found")
print("Live Description:\n ", d.group(1) if d else "Not found")
print("llms.txt discovery link present in HTML:", bool(llms))

# Check FAQ Schema count in HTML
faq_matches = re.findall(r'"@type":"Question"', html)
print(f"FAQ Questions count in JSON-LD: {len(faq_matches)}")
