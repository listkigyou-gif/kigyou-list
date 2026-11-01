# -*- coding: utf-8 -*-
import sys
import urllib.request
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

def verify():
    url = "https://kigyoulist.com/ja"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            print(f"Status: {resp.status}")

            has_chunking = 'inline-block' in html and '全国500万社の企業情報を、' in html
            has_anchor = '信頼できる一次データを。' in html

            # Extract H1 raw HTML
            h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
            if h1_match:
                print("H1 HTML Segment:\n", h1_match.group(1).strip()[:300])

            print(f"Has Semantic Chunking: {has_chunking}")
            print(f"Has Visual Anchor: {has_anchor}")

            if has_chunking and has_anchor:
                print("[SUCCESS] H1 Semantic Chunking đã lên sóng hoàn hảo!")
            else:
                print("[WARNING] Cần purge cache để nhận HTML mới!")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    verify()
