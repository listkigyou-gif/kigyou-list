# -*- coding: utf-8 -*-
import sys
import json
import urllib.request
import re
from bs4 import BeautifulSoup

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

HUBS = [
    ("Homepage", "https://kigyoulist.com/ja"),
    ("AI Sales List Solution", "https://kigyoulist.com/ja/tools/ai-sales-list"),
    ("Form Marketing", "https://kigyoulist.com/ja/form-marketing"),
    ("Bankruptcies National Hub", "https://kigyoulist.com/ja/status/bankruptcies"),
    ("Bankruptcies Tokyo Hub", "https://kigyoulist.com/ja/status/bankruptcies/tokyo"),
    ("Ranking Salary Hub", "https://kigyoulist.com/ja/ranking/salary"),
    ("Ranking Tenure Hub", "https://kigyoulist.com/ja/ranking/tenure"),
    ("Ranking Employees Hub", "https://kigyoulist.com/ja/ranking/employees"),
    ("Licenses Hub", "https://kigyoulist.com/ja/licenses"),
    ("Sample Detail Page (Nissan Chemical)", "https://kigyoulist.com/ja/company/1010001008734")
]

FORBIDDEN_TERMS = ["tqc", "03-6907-1219", "豊島区"]

print("=" * 80)
print("DEEP TECHNICAL SEO AUDIT FOR KIGYOU-LIST DATA HUBS")
print("=" * 80)

results = []

for name, url in HUBS:
    print(f"\n---> Auditing: {name} ({url})")
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"}
    )
    
    audit = {
        "name": name,
        "url": url,
        "status": None,
        "title": None,
        "title_len": 0,
        "meta_desc": None,
        "meta_desc_len": 0,
        "canonical": None,
        "h1_count": 0,
        "h1_text": [],
        "json_ld_types": [],
        "robots": None,
        "forbidden_found": [],
        "issues": []
    }
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            audit["status"] = resp.status
            html = resp.read().decode('utf-8', errors='ignore')
            
            soup = BeautifulSoup(html, 'html.parser')
            
            # 1. Title
            title_tag = soup.find('title')
            if title_tag and title_tag.string:
                t_text = title_tag.string.strip()
                audit["title"] = t_text
                audit["title_len"] = len(t_text)
                if len(t_text) < 15:
                    audit["issues"].append(f"Title quá ngắn ({len(t_text)} chars): '{t_text}'")
                elif len(t_text) > 75:
                    audit["issues"].append(f"Title hơi dài ({len(t_text)} chars), Google có thể truncate")
            else:
                audit["issues"].append("THIẾU thẻ <title>")

            # 2. Meta description
            desc_tag = soup.find('meta', attrs={'name': 'description'})
            if desc_tag and desc_tag.get('content'):
                d_text = desc_tag['content'].strip()
                audit["meta_desc"] = d_text
                audit["meta_desc_len"] = len(d_text)
                if len(d_text) < 50:
                    audit["issues"].append(f"Meta Description quá ngắn ({len(d_text)} chars)")
                elif len(d_text) > 170:
                    audit["issues"].append(f"Meta Description hơi dài ({len(d_text)} chars)")
            else:
                audit["issues"].append("THIẾU thẻ <meta name='description'>")

            # 3. Canonical
            can_tag = soup.find('link', attrs={'rel': 'canonical'})
            if can_tag and can_tag.get('href'):
                audit["canonical"] = can_tag['href']
                if not can_tag['href'].startswith("https://kigyoulist.com"):
                    audit["issues"].append(f"Canonical không phải tuyệt đối https: {can_tag['href']}")
            else:
                audit["issues"].append("THIẾU thẻ <link rel='canonical'>")

            # 4. Robots
            robots_tag = soup.find('meta', attrs={'name': 'robots'})
            if robots_tag and robots_tag.get('content'):
                audit["robots"] = robots_tag['content']
                if "noindex" in robots_tag['content'].lower():
                    audit["issues"].append(f"BỊ NOINDEX: {robots_tag['content']}")

            # 5. Headings
            h1_tags = soup.find_all('h1')
            audit["h1_count"] = len(h1_tags)
            audit["h1_text"] = [h.get_text(strip=True) for h in h1_tags]
            if len(h1_tags) == 0:
                audit["issues"].append("THIẾU thẻ <h1>")
            elif len(h1_tags) > 1:
                audit["issues"].append(f"Có {len(h1_tags)} thẻ <h1> (Khuyến nghị 1 thẻ h1 duy nhất)")

            # 6. JSON-LD Structured Data
            ld_scripts = soup.find_all('script', attrs={'type': 'application/ld+json'})
            for s in ld_scripts:
                try:
                    data = json.loads(s.string)
                    if isinstance(data, dict):
                        audit["json_ld_types"].append(data.get('@type', 'Unknown'))
                    elif isinstance(data, list):
                        for item in data:
                            audit["json_ld_types"].append(item.get('@type', 'Unknown'))
                except Exception as e:
                    audit["issues"].append(f"Lỗi cú pháp JSON-LD: {e}")

            if not audit["json_ld_types"]:
                audit["issues"].append("THIẾU Schema Structured Data (JSON-LD)")

            # 7. Check forbidden terms
            full_text = html.lower()
            for term in FORBIDDEN_TERMS:
                if term.lower() in full_text:
                    audit["forbidden_found"].append(term)
                    audit["issues"].append(f"CẢNH BÁO: Tìm thấy từ cấm '{term}' trong trang!")

    except urllib.error.HTTPError as e:
        audit["status"] = e.code
        audit["issues"].append(f"HTTP Error: {e.code} {e.reason}")
    except Exception as e:
        audit["issues"].append(f"Fetch Error: {e}")

    results.append(audit)

print("\n" + "=" * 80)
print("AUDIT SUMMARY TABLE")
print("=" * 80)
for r in results:
    status_str = f"HTTP {r['status']}" if r['status'] else "FAIL"
    issues_str = f"[{len(r['issues'])} ISSUES: {'; '.join(r['issues'])}]" if r['issues'] else "[100% CLEAN - 0 ISSUES]"
    print(f"\n{r['name']} ({r['url']}) -> {status_str}")
    print(f"  Title ({r['title_len']} chars): {r['title']}")
    print(f"  Meta Desc ({r['meta_desc_len']} chars): {r['meta_desc'][:80]}...")
    print(f"  Canonical: {r['canonical']}")
    print(f"  H1 count: {r['h1_count']} -> {r['h1_text'][:1]}")
    print(f"  JSON-LD Types: {r['json_ld_types']}")
    print(f"  Forbidden Terms: {r['forbidden_found'] if r['forbidden_found'] else 'NONE (Clean)'}")
    print(f"  Result: {issues_str}")

