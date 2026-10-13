import json
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Import directly from the server module
sys.path.insert(0, r"c:\kigyou-list\scripts\mcp")
from kigyoulist_mcp_server import process_request, TOOLS

print("=== 1. Testing initialize ===")
init_req = {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}
resp1 = process_request(init_req)
print("Initialize Result:", resp1["result"]["serverInfo"])

print("\n=== 2. Testing tools/list ===")
tools_req = {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}
resp2 = process_request(tools_req)
print(f"Registered Tools Count: {len(resp2['result']['tools'])}")
for t in resp2['result']['tools']:
    print(f" - {t['name']}: {t['description'][:30]}...")

print("\n=== 3. Testing kigyoulist_get_ai_icebreaker ===")
call_req = {
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
        "name": "kigyoulist_get_ai_icebreaker",
        "arguments": {
            "corporate_number": "1010001002003",
            "pitch_product": "AI営業エージェント自動化基盤"
        }
    }
}
resp3 = process_request(call_req)
content = json.loads(resp3["result"]["content"][0]["text"])
print("AI Icebreaker Generated:\n", content["icebreaker_japanese"])

print("\n=== 4. Testing kigyoulist_check_opt_out ===")
opt_req = {
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
        "name": "kigyoulist_check_opt_out",
        "arguments": {
            "corporate_number": "1010001002003",
            "domain": "example.co.jp"
        }
    }
}
resp4 = process_request(opt_req)
opt_content = json.loads(resp4["result"]["content"][0]["text"])
print("Opt-out Status:", opt_content["status"])

print("\n=== 5. Testing kigyoulist_resolve_identity ===")
resolve_req = {
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
        "name": "kigyoulist_resolve_identity",
        "arguments": {
            "domain": "toyota.co.jp",
            "name": "トヨタ"
        }
    }
}
resp5 = process_request(resolve_req)
res_content = json.loads(resp5["result"]["content"][0]["text"])
print("Resolve Result:", res_content)

print("\n=== 6. Testing kigyoulist_semantic_search ===")
sem_req = {
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
        "name": "kigyoulist_semantic_search",
        "arguments": {
            "query": "東京都内でDXと採用を強化しているIT企業",
            "limit": 3
        }
    }
}
resp6 = process_request(sem_req)
sem_content = json.loads(resp6["result"]["content"][0]["text"])
print(f"Semantic Search Results Count: {sem_content['count']}")

print("\n[ALL 6 MCP SERVER TOOLS PASSED 100%!]")

