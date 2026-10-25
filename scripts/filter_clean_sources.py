import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('importdata/open-data/hospitality_food/sources_registry.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

food_raw = data['food']
ryokan_raw = data['ryokan']

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

def detect_pref(s):
    if s.get('prefecture_code'):
        return s['prefecture_code']
    text = f"{s.get('authority', '')} {s.get('package_title', '')} {s.get('resource_name', '')} {s.get('url', '')}"
    m = re.search(r'\b([0-4][0-9])[0-9]{4}\b', text)
    if m and 1 <= int(m.group(1)) <= 47:
        return m.group(1)
    for name, code in PREF_MAP.items():
        if name in text:
            return code
    if s.get('portal') == 'Tokyo Metro':
        return '13'
    return ""

# 1. Filter Food
filtered_food = []
food_bad = ['cleaning', 'biyou', 'riyou', 'ippai', 'waste', 'クリーニング', '美容', '理容', '廃棄物', '旅行', '環境', '水道', '墓地', '動物', 'ペット', '公衆浴場', '浴場', 'プール']
food_good = ['food_business', 'food', '食品', '飲食', '喫茶', '食鳥', '製菓', '販売業', '許可', '届出']

for s in food_raw:
    combined = f"{s['url']} {s['resource_name']} {s['package_title']}".lower()
    if any(b in combined for b in food_bad):
        continue
    if not any(g in combined for g in food_good):
        continue
    pref = detect_pref(s)
    s['prefecture_code'] = pref
    filtered_food.append(s)

# 2. Filter Ryokan
filtered_ryokan = []
ryokan_bad = ['旅行業', '旅行サービス', 'クリーニング', '美容', '理容', '廃棄物', 'ビル管理', 'buil', 'cleaning', 'biyou', 'waste', 'ippai', '水道', '墓地', 'ペット', '動物']
ryokan_good = ['ryokan', '旅館', 'ホテル', '宿泊', '宿所', '下宿', '簡易宿所', '客室']

for s in ryokan_raw:
    combined = f"{s['url']} {s['resource_name']} {s['package_title']}".lower()
    if any(b in combined for b in ryokan_bad):
        continue
    if not any(g in combined for g in ryokan_good):
        continue
    pref = detect_pref(s)
    s['prefecture_code'] = pref
    filtered_ryokan.append(s)

print(f"Strict Filtered Food Datasets: {len(filtered_food)}")
print(f"Strict Filtered Ryokan Datasets: {len(filtered_ryokan)}")

# Breakdown by prefecture
food_by_pref = {}
for s in filtered_food:
    p = s['prefecture_code'] or 'Unknown'
    food_by_pref[p] = food_by_pref.get(p, 0) + 1

ryokan_by_pref = {}
for s in filtered_ryokan:
    p = s['prefecture_code'] or 'Unknown'
    ryokan_by_pref[p] = ryokan_by_pref.get(p, 0) + 1

print("\nFood Datasets by Prefecture:")
print(dict(sorted(food_by_pref.items())))

print("\nRyokan Datasets by Prefecture:")
print(dict(sorted(ryokan_by_pref.items())))

# Save cleaned registries
with open('importdata/open-data/hospitality_food/clean_sources.json', 'w', encoding='utf-8') as f:
    json.dump({
        'food': filtered_food,
        'ryokan': filtered_ryokan
    }, f, ensure_ascii=False, indent=2)
print("\n[+] Saved cleaned sources to importdata/open-data/hospitality_food/clean_sources.json")
