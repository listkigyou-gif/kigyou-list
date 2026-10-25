#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Kigyou-list: Nationwide Open Data Source Auto-Discovery Engine
Finds all official Municipal & Prefectural Open Data datasets for:
- 飲食店営業許可 (Food Sanitation / Restaurants)
- 旅館業許可 (Hotels / Ryokan / Accommodations)
Across BODIK, Tokyo Metro Open Data Catalog, and other CKAN endpoints.
"""

import os
import sys
import json
import re
import urllib.request
import urllib.parse
import ssl

sys.stdout.reconfigure(encoding='utf-8')
ctx = ssl._create_unverified_context()

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "importdata", "open-data", "hospitality_food", "sources_registry.json")
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

PREF_MAP = {
    '北海道': '01', '青森': '02', '岩手': '03', '宮城': '04', '秋田': '05',
    '山形': '06', '福島': '07', '茨城': '08', '栃木': '09', '群馬': '10',
    '埼玉': '11', '千葉': '12', '東京': '13', '神奈川': '14', '新潟': '15',
    '富山': '16', '石川': '17', '福井': '18', '山梨': '19', '長野': '20',
    '岐阜': '21', '静岡': '22', '愛知': '23', '三重': '24', '滋賀': '25',
    '京都': '26', '大阪': '27', '兵庫': '28', '奈良': '29', '和歌山': '30',
    '鳥取': '31', '島根': '32', '岡山': '33', '広島': '34', '山口': '35',
    '徳島': '36', '香川': '37', '愛媛': '38', '高知': '39', '福岡': '40',
    '佐賀': '41', '長崎': '42', '熊本': '43', '大分': '44', '宮崎': '45',
    '鹿児島': '46', '沖縄': '47'
}

def detect_prefecture(text):
    if not text:
        return ""
    # Check 6-digit municipal code (e.g. 131105, 440001, 272272)
    m = re.search(r'\b([0-4][0-9])[0-9]{4}\b', text)
    if m:
        pref = m.group(1)
        if 1 <= int(pref) <= 47:
            return pref
    # Check prefecture names
    for name, code in PREF_MAP.items():
        if name in text:
            return code
    return ""

def query_ckan(base_url, query_term, max_rows=500):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    packages = []
    start = 0
    step = 100
    
    while start < max_rows:
        encoded_q = urllib.parse.quote(query_term)
        url = f"{base_url}?q={encoded_q}&rows={step}&start={start}"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=25) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                res = data.get('result', {})
                count = res.get('count', 0)
                batch = res.get('results', [])
                if not batch:
                    break
                packages.extend(batch)
                start += len(batch)
                if start >= count:
                    break
        except Exception as e:
            print(f"[-] Error querying {base_url} ({query_term}, start={start}): {e}")
            break
            
    return packages

def extract_sources():
    print("=" * 80)
    print("NATIONWIDE CKAN DISCOVERY FOR HOSPITALITY & FOOD")
    print("=" * 80)
    
    endpoints = [
        ("BODIK", "https://data.bodik.jp/api/3/action/package_search"),
        ("Tokyo Metro", "https://catalog.data.metro.tokyo.lg.jp/api/3/action/package_search"),
    ]
    
    food_queries = ["food_business", "食品営業許可", "飲食店営業", "食品衛生法"]
    ryokan_queries = ["ryokan", "旅館業", "宿泊施設", "旅館台帳"]
    
    food_resources = {}
    ryokan_resources = {}
    
    # 1. Search Food
    for portal_name, base_url in endpoints:
        for q in food_queries:
            print(f"[*] Querying {portal_name} for food: '{q}'...")
            pkgs = query_ckan(base_url, q, max_rows=300)
            print(f"    Found {len(pkgs)} packages")
            
            for pkg in pkgs:
                title = pkg.get('title', '')
                org = pkg.get('organization', {}).get('title', '') if pkg.get('organization') else ''
                notes = pkg.get('notes', '')
                context_str = f"{title} {org} {notes}"
                
                # Filter out irrelevant packages (e.g. food waste, inspections, menus)
                if any(bad in title for bad in ["食中毒", "違反", "検査結果", "食品ロス", "給食", "添加物", "イベント"]):
                    continue
                
                pref_code = detect_prefecture(context_str)
                
                for r in pkg.get('resources', []):
                    r_url = r.get('url', '')
                    r_name = r.get('name', '')
                    r_fmt = (r.get('format') or '').lower()
                    
                    if not ('csv' in r_fmt or r_url.lower().endswith('.csv') or 'csv' in r_name.lower()):
                        continue
                    
                    if any(bad in r_name for bad in ["食中毒", "違反", "検査", "ロス", "出店者"]):
                        continue
                        
                    pref = pref_code or detect_prefecture(r_url + " " + r_name)
                    
                    # Deduplicate by URL
                    if r_url not in food_resources:
                        food_resources[r_url] = {
                            "type": "飲食店営業許可",
                            "portal": portal_name,
                            "authority": org or title,
                            "package_title": title,
                            "resource_name": r_name,
                            "url": r_url,
                            "prefecture_code": pref or ("13" if portal_name == "Tokyo Metro" else "")
                        }

    # 2. Search Ryokan
    for portal_name, base_url in endpoints:
        for q in ryokan_queries:
            print(f"[*] Querying {portal_name} for ryokan: '{q}'...")
            pkgs = query_ckan(base_url, q, max_rows=300)
            print(f"    Found {len(pkgs)} packages")
            
            for pkg in pkgs:
                title = pkg.get('title', '')
                org = pkg.get('organization', {}).get('title', '') if pkg.get('organization') else ''
                notes = pkg.get('notes', '')
                context_str = f"{title} {org} {notes}"
                
                pref_code = detect_prefecture(context_str)
                
                for r in pkg.get('resources', []):
                    r_url = r.get('url', '')
                    r_name = r.get('name', '')
                    r_fmt = (r.get('format') or '').lower()
                    
                    if not ('csv' in r_fmt or r_url.lower().endswith('.csv') or 'csv' in r_name.lower()):
                        continue
                        
                    # Filter out obsolete/monthly diff files if a master/all exists, but keep active
                    if any(bad in r_name for bad in ["廃止", "手続", "申請書", "様式"]):
                        continue
                        
                    pref = pref_code or detect_prefecture(r_url + " " + r_name)
                    
                    if r_url not in ryokan_resources:
                        ryokan_resources[r_url] = {
                            "type": "旅館業許可",
                            "portal": portal_name,
                            "authority": org or title,
                            "package_title": title,
                            "resource_name": r_name,
                            "url": r_url,
                            "prefecture_code": pref or ("13" if portal_name == "Tokyo Metro" else "")
                        }

    print("\n" + "=" * 80)
    print(f"DISCOVERY SUMMARY:")
    print(f"- 飲食店営業許可 CSV Sources: {len(food_resources)}")
    print(f"- 旅館業許可 CSV Sources: {len(ryokan_resources)}")
    print("=" * 80)
    
    registry = {
        "food": list(food_resources.values()),
        "ryokan": list(ryokan_resources.values())
    }
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(registry, f, ensure_ascii=False, indent=2)
        
    print(f"[+] Saved registry to: {OUTPUT_FILE}")
    return registry

if __name__ == '__main__':
    extract_sources()
