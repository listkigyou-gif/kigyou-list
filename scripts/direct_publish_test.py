import requests
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

with open('c:/kigyou-list/scripts/note_state.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
cookies = {c['name']: c['value'] for c in data.get('cookies', [])}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Origin': 'https://note.com',
    'Referer': 'https://editor.note.com/notes/n9a0e993b5438/publish/',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
}

# Fetch full note draft
cur = requests.get('https://note.com/api/v3/notes/n9a0e993b5438?draft=true', headers=headers, cookies=cookies).json().get('data', {})

payload = {
    "name": cur.get("name"),
    "body": cur.get("body"),
    "hashtags": ["営業リスト", "企業データベース", "B2Bマーケティング", "新規開拓", "DX", "コスト削減"],
    "image_keys": [],
    "index": False,
    "is_refund": False,
    "limited": False,
    "magazine_ids": [],
    "magazine_keys": [],
    "pay_body": "",
    "price": 0,
    "send_notifications_flag": True,
    "separator": None,
    "slug": f"slug-{cur.get('key')}",
    "status": "published"
}

r = requests.put(f"https://note.com/api/v1/text_notes/{cur.get('id')}", headers=headers, cookies=cookies, json=payload)
print("Publish Status:", r.status_code)
print("Publish Response:", r.text[:300])
