import json
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('importdata/open-data/hospitality_food/clean_sources.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

food = data['food']
ryokan = data['ryokan']

def prioritize_datasets(datasets, max_items=100):
    # Sort:
    # 1. Contains 'all', '全件', 'daicho', '台帳', 'zenken'
    # 2. Prefer recent years (2026, 2025, 2024, r8, r7, r6)
    # 3. Not monthly delta
    scored = []
    seen_urls = set()
    
    for d in datasets:
        url = d['url']
        if url in seen_urls:
            continue
        seen_urls.add(url)
        
        name = d['resource_name'].lower()
        title = d['package_title'].lower()
        u = url.lower()
        combined = f"{u} {name} {title}"
        
        score = 0
        if any(k in combined for k in ['_all', 'all.csv', '全件', 'zenken', '台帳']):
            score += 50
        if any(k in combined for k in ['2026', '2025', '2024', 'r8', 'r7', 'r6']):
            score += 20
        if any(k in combined for k in ['一覧', 'ichiran']):
            score += 15
        if any(k in combined for k in ['新規', '月分', 'shinki']):
            score -= 30
            
        scored.append((score, d))
        
    scored.sort(key=lambda x: x[0], reverse=True)
    return [x[1] for x in scored[:max_items]]

top_food = prioritize_datasets(food, 120)
top_ryokan = prioritize_datasets(ryokan, 60)

print(f"Top Prioritized Food Datasets: {len(top_food)}")
for i, d in enumerate(top_food[:15]):
    print(f"{i+1}. [{d['prefecture_code']}] {d['authority']} | {d['resource_name']} | {d['url']}")

print(f"\nTop Prioritized Ryokan Datasets: {len(top_ryokan)}")
for i, d in enumerate(top_ryokan[:15]):
    print(f"{i+1}. [{d['prefecture_code']}] {d['authority']} | {d['resource_name']} | {d['url']}")

with open('importdata/open-data/hospitality_food/top_sources.json', 'w', encoding='utf-8') as f:
    json.dump({
        'food': top_food,
        'ryokan': top_ryokan
    }, f, ensure_ascii=False, indent=2)
print("\n[+] Saved top prioritized sources to importdata/open-data/hospitality_food/top_sources.json")
