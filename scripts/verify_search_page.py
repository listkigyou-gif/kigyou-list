import urllib.request
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

url = "https://kigyoulist.com/ja/search"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
html = urllib.request.urlopen(req).read().decode("utf-8")

print("=== LIVE SEARCH PAGE AUDIT ===")
print("HTTP Request: SUCCESS (200 OK)")

has_item_list = '"@type":"ItemList"' in html
print(f"[{'PASS' if has_item_list else 'FAIL'}] Schema.org ItemList JSON-LD: {has_item_list}")

banner_found = "無料会員特典 今すぐ無料登録で" in html
print(f"[{'PASS' if not banner_found else 'FAIL'}] Promo Banner Eliminated: {not banner_found}")

articles_count = len(re.findall(r"<article", html))
print(f"[{'PASS' if articles_count > 0 else 'FAIL'}] Semantic <article> Cards Found: {articles_count}")

has_aside = 'aria-label="絞り込み検索"' in html
print(f"[{'PASS' if has_aside else 'FAIL'}] Semantic <aside aria-label='絞り込み検索'>: {has_aside}")

has_4_groups = all(g in html for g in ["地域・業界", "アプローチ手段・連絡先", "企業規模・財務情報", "公的信用・シグナル"])
print(f"[{'PASS' if has_4_groups else 'FAIL'}] 4 Clean B2B Sidebar Groups: {has_4_groups}")

has_edinet_geps = "決算・財務情報あり" in html and "GEPS" in html
print(f"[{'PASS' if has_edinet_geps else 'FAIL'}] Expanded Data (FSA EDINET & GEPS): {has_edinet_geps}")
