import urllib.request
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

url = "https://kigyoulist.com/ja"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
html = urllib.request.urlopen(req).read().decode("utf-8")

title_m = re.search(r"<title>(.*?)</title>", html)
print("Title:", title_m.group(1) if title_m else "N/A")

schemas = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
print(f"Total ld+json scripts found: {len(schemas)}")
for i, s in enumerate(schemas):
    print(f"  Schema #{i+1}: {s[:100].strip()}...")

hubs = [
    "新設法人・新規設立企業速報",
    "本社移転・所在地変更企業速報",
    "求人募集中・新着採用企業速報",
    "補助金受給・官公庁入札",
    "商号変更・企業合併一覧",
    "倒産・解散・清算結了速報"
]
print("\n--- 6 Real-time Signals Hubs Verification ---")
for hub in hubs:
    status = "PRESENT" if hub in html else "MISSING"
    print(f"  [{status}] {hub}")

print("\n--- Key Entities & Trust Signals ---")
entities = ["TQC株式会社", "法人番号", "適格請求書発行事業者", "5,000,000", "47都道府県"]
for ent in entities:
    status = "PRESENT" if ent in html else "MISSING"
    print(f"  [{status}] {ent}")
