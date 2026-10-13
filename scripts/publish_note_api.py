import requests
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

note_key = "n8996d29cfcba"

with open('c:/kigyou-list/scripts/note_state.json', 'r', encoding='utf-8') as f:
    cookies = {c['name']: c['value'] for c in json.load(f).get('cookies', [])}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Origin': 'https://note.com',
    'Referer': f'https://editor.note.com/notes/{note_key}/publish/',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
}

cur = requests.get(f'https://note.com/api/v3/notes/{note_key}?draft=true', headers=headers, cookies=cookies).json().get('data', {})
note_id = cur.get('id')
draft_info = cur.get('note_draft') or {}
body = draft_info.get('body') or cur.get('body')

print(f"Loaded note ID: {note_id}, Current status: {cur.get('status')}, Body length: {len(body) if body else 0}")

payload = {
    "name": cur.get("name"),
    "body": body,
    "hashtags": ["自動化したいこと", "業務効率化", "営業DX", "新規開拓", "kigyoulist"],
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
    "slug": f"slug-{note_key}",
    "status": "published"
}

r = requests.put(f"https://note.com/api/v1/text_notes/{note_id}", headers=headers, cookies=cookies, json=payload)
print("PUT Status:", r.status_code)
print("PUT Response:", r.text[:400])
