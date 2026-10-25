import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('importdata/open-data/hospitality_food/sources_registry.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

food = data['food']
ryokan = data['ryokan']

print(f"Total Raw Food Sources: {len(food)}")
print(f"Total Raw Ryokan Sources: {len(ryokan)}")

def classify_and_filter(sources, target_type):
    masters = []
    regular = []
    
    for s in sources:
        url = s['url'].lower()
        name = s['resource_name'].lower()
        pkg = s['package_title'].lower()
        combined = f"{url} {name} {pkg}"
        
        # Priority 1: Master datasets containing 'all', '全件', 'zenken', 'ichiran', 'daicho'
        is_master = any(k in combined for k in ['_all', 'all.', '全件', '台帳', '一覧', 'master', 'daicho'])
        # Is it a monthly delta (e.g., shinki 202404...)?
        is_monthly = bool(re.search(r'202[0-9]{5}', combined)) or any(k in combined for k in ['新規', '月分', 'shinki', 'haishi', '廃止'])
        
        pref = s.get('prefecture_code', '')
        
        if is_master and not is_monthly:
            masters.append(s)
        elif not is_monthly:
            regular.append(s)
            
    return masters, regular

food_masters, food_reg = classify_and_filter(food, "food")
ryokan_masters, ryokan_reg = classify_and_filter(ryokan, "ryokan")

print(f"\nFood Master/Cumulative Datasets: {len(food_masters)}")
print(f"Food Regular Datasets: {len(food_reg)}")
print(f"Ryokan Master/Cumulative Datasets: {len(ryokan_masters)}")
print(f"Ryokan Regular Datasets: {len(ryokan_reg)}")

# Print sample masters
print("\n--- SAMPLE FOOD MASTERS ---")
for s in food_masters[:10]:
    print(f"[{s['prefecture_code']}] {s['authority']} | {s['resource_name']} | {s['url']}")

print("\n--- SAMPLE RYOKAN MASTERS ---")
for s in ryokan_masters[:10]:
    print(f"[{s['prefecture_code']}] {s['authority']} | {s['resource_name']} | {s['url']}")
