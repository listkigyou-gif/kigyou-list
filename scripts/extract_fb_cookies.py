import json

path = r"C:\Users\admin\.gemini\antigravity-ide\brain\04ace8c1-efd9-4e83-9b72-18d12c8611d5\.system_generated\logs\transcript_full.jsonl"

found_cookies = None
with open(path, "r", encoding="utf-8") as f:
    for line in f:
        if "c_user" in line:
            obj = json.loads(line)
            # check content or tool_calls
            content = obj.get("content", "")
            if isinstance(content, str) and "c_user" in content:
                found_cookies = content
            tool_calls = obj.get("tool_calls", [])
            for tc in tool_calls:
                args = tc.get("args", {})
                for k, v in args.items():
                    if isinstance(v, str) and "c_user" in v:
                        found_cookies = v

print("Found len:", len(found_cookies) if found_cookies else 0)
if found_cookies:
    with open("c:\\kigyou-list\\found_fb_raw.txt", "w", encoding="utf-8") as out:
        out.write(found_cookies)
    print("Written to c:\\kigyou-list\\found_fb_raw.txt")
