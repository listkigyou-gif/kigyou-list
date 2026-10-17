import json
import re

with open("c:\\kigyou-list\\fb_cookies_match_10.json", "r", encoding="utf-8") as f:
    raw = f.read()

# Extract json array between [ and ]
match = re.search(r'\[\s*\{.*\}\s*\]', raw, re.DOTALL)
if match:
    json_str = match.group(0)
    cookies = json.loads(json_str)
    print("Parsed cookies count:", len(cookies))
    with open("c:\\kigyou-list\\facebook_cookies.json", "w", encoding="utf-8") as out:
        json.dump(cookies, out, indent=2, ensure_ascii=False)
    print("Saved to c:\\kigyou-list\\facebook_cookies.json successfully!")
else:
    print("Could not find json array!")
