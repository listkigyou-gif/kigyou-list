import json
import re

path = r"C:\Users\admin\.gemini\antigravity-ide\brain\04ace8c1-efd9-4e83-9b72-18d12c8611d5\.system_generated\logs\transcript_full.jsonl"

all_matches = []
with open(path, "r", encoding="utf-8") as f:
    for line_idx, line in enumerate(f):
        if '"name": "c_user"' in line or '"name":"c_user"' in line or 'c_user' in line:
            obj = json.loads(line)
            # Find any large string in obj
            def search_val(v):
                if isinstance(v, str) and "c_user" in v and len(v) > 500:
                    all_matches.append(v)
                elif isinstance(v, dict):
                    for k, val in v.items():
                        search_val(val)
                elif isinstance(v, list):
                    for item in v:
                        search_val(item)
            search_val(obj)

print("Matches found:", len(all_matches))
for i, m in enumerate(all_matches):
    print(f"Match {i} len:", len(m))
    with open(f"c:\\kigyou-list\\fb_cookies_match_{i}.json", "w", encoding="utf-8") as out:
        out.write(m)
