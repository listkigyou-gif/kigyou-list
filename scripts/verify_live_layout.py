import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')
req = urllib.request.Request('https://kigyoulist.com/ja', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode('utf-8')
    print("Homepage contains Tầng 5.5?", "公的許認可・国家資格・士業法人データベース" in html)
    print("Footer contains licenses hub?", "公的許認可・士業登録ハブ" in html)
    print("Header nav has /licenses?", 'href="/ja/licenses"' in html and 'nav' in html)
