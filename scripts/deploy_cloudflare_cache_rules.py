#!/usr/bin/env python3
"""
Deploy Enterprise Cloudflare Edge Cache Rules for Kigyou-list
Configures:
1. Bypass Cache for /api/, /dashboard, /admin, /login, non-GET requests.
2. Cache Everything for /ja/company/*, /ja/area/*, /ja/industry/*, /ja/changes, /ja/invoice, /ja/jobs, /ja/new-companies, /ja/status.
   - Edge TTL: 7 days (604,800s)
   - Browser TTL: 4 hours (14,400s)
   - Serve Stale Content: enabled
"""

import sys
import json
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

EMAIL = os.getenv("CLOUDFLARE_EMAIL", "trungkim8694@gmail.com")
KEY = os.getenv("CLOUDFLARE_API_KEY", "")
ZONE_ID = os.getenv("CLOUDFLARE_ZONE_ID", "881d2cbd9004c4216cb9f8d28c99b0b9")

HEADERS = {
    "X-Auth-Email": EMAIL,
    "X-Auth-Key": KEY,
    "Content-Type": "application/json"
}

def call_cf(method, path, data=None):
    url = f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/{path}"
    data_bytes = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=data_bytes, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return json.loads(err_body)
        except Exception:
            return {"error": f"HTTP {e.code}: {err_body}"}
    except Exception as e:
        return {"error": str(e)}

def deploy_cache_rules():
    print("=" * 70)
    print("🚀 DEPLOYING CLOUDFLARE CACHE RULES (KIGYOU-LIST)")
    print("=" * 70)

    # 1. Check existing rulesets in phase http_request_cache_settings
    print("\n[1] Checking existing cache rulesets...")
    existing_rulesets = call_cf("GET", "rulesets")
    cache_ruleset_id = None
    if "result" in existing_rulesets:
        for r in existing_rulesets["result"]:
            if r.get("phase") == "http_request_cache_settings" and r.get("kind") == "zone":
                cache_ruleset_id = r["id"]
                print(f"[*] Found existing cache ruleset ID: {cache_ruleset_id}")
                break

    rules = [
        {
            "description": "01_Bypass_Private_And_API",
            "expression": '(starts_with(http.request.uri.path, "/api/")) or (starts_with(http.request.uri.path, "/dashboard")) or (starts_with(http.request.uri.path, "/admin")) or (starts_with(http.request.uri.path, "/login")) or (http.request.method ne "GET" and http.request.method ne "HEAD")',
            "action": "set_cache_settings",
            "action_parameters": {
                "cache": False
            },
            "enabled": True
        },
        {
            "description": "02_Cache_Public_Company_Directory_And_Hubs",
            "expression": '(starts_with(http.request.uri.path, "/ja/company/")) or (starts_with(http.request.uri.path, "/ja/area/")) or (starts_with(http.request.uri.path, "/ja/industry/")) or (starts_with(http.request.uri.path, "/ja/changes")) or (starts_with(http.request.uri.path, "/ja/invoice")) or (starts_with(http.request.uri.path, "/ja/jobs")) or (starts_with(http.request.uri.path, "/ja/new-companies")) or (starts_with(http.request.uri.path, "/ja/status"))',
            "action": "set_cache_settings",
            "action_parameters": {
                "cache": True,
                "edge_ttl": {
                    "mode": "override_origin",
                    "default": 604800
                },
                "browser_ttl": {
                    "mode": "override_origin",
                    "default": 14400
                },
                "serve_stale": {
                    "disable_stale_while_updating": False
                }
            },
            "enabled": True
        }
    ]

    if cache_ruleset_id:
        print(f"\n[2] Updating existing ruleset {cache_ruleset_id}...")
        res = call_cf("PUT", f"rulesets/{cache_ruleset_id}", {
            "name": "default",
            "kind": "zone",
            "phase": "http_request_cache_settings",
            "rules": rules
        })
    else:
        print("\n[2] Creating new cache ruleset for phase http_request_cache_settings...")
        res = call_cf("POST", "rulesets", {
            "name": "default",
            "kind": "zone",
            "phase": "http_request_cache_settings",
            "rules": rules
        })

    if res.get("success"):
        print("✅ SUCCESS! Cloudflare Cache Rules deployed successfully:")
        for rule in res.get("result", {}).get("rules", []):
            print(f"  - [{rule.get('action')}] {rule.get('description')} (Enabled: {rule.get('enabled')})")
    else:
        print("[-] Ruleset API error:", json.dumps(res, indent=2))
        print("[!] Falling back to Cloudflare Page Rules API (3 Free Page Rules)...")
        deploy_page_rules_fallback()

def deploy_page_rules_fallback():
    # If ruleset API is not supported on this account tier, Page Rules is 100% supported
    # 1. Bypass API & Dashboard
    r1 = {
        "targets": [{"target": "url", "constraint": {"operator": "matches", "value": "*kigyoulist.com/api/*"}}],
        "actions": [{"id": "cache_level", "value": "bypass"}],
        "priority": 1,
        "status": "active"
    }
    r2 = {
        "targets": [{"target": "url", "constraint": {"operator": "matches", "value": "*kigyoulist.com/*/dashboard*"}}],
        "actions": [{"id": "cache_level", "value": "bypass"}],
        "priority": 2,
        "status": "active"
    }
    # 2. Cache Everything for all company pages
    r3 = {
        "targets": [{"target": "url", "constraint": {"operator": "matches", "value": "*kigyoulist.com/ja/company/*"}}],
        "actions": [
            {"id": "cache_level", "value": "cache_everything"},
            {"id": "edge_cache_ttl", "value": 604800},
            {"id": "browser_cache_ttl", "value": 14400}
        ],
        "priority": 3,
        "status": "active"
    }

    # Delete existing page rules to avoid collision
    existing = call_cf("GET", "pagerules")
    if existing.get("result"):
        for pr in existing["result"]:
            print(f"[*] Removing old page rule {pr['id']}...")
            call_cf("DELETE", f"pagerules/{pr['id']}")

    for idx, rule in enumerate([r1, r2, r3], 1):
        resp = call_cf("POST", "pagerules", rule)
        if resp.get("success"):
            print(f"  ✅ Page Rule {idx} created successfully: {rule['targets'][0]['constraint']['value']}")
        else:
            print(f"  ❌ Page Rule {idx} error: {json.dumps(resp)}")

def configure_crawler_hints_and_tiered_cache():
    print("\n[3] Configuring Crawler Hints & Smart Tiered Cache...")
    # Smart Tiered Cache
    tc_res = call_cf("PATCH", "cache/tiered_cache_smart_topology_enable", {"value": "on"})
    if tc_res.get("success"):
        print("✅ Smart Tiered Cache: ON")
    else:
        print(f"[-] Smart Tiered Cache status: {tc_res.get('errors')}")

    # Crawler Hints via zone settings
    ch_res = call_cf("PATCH", "settings/crawler_hints", {"value": "on"})
    if ch_res.get("success"):
        print("✅ Crawler Hints: ON (Bing & Google informed instantly)")
    else:
        print(f"[-] Crawler Hints status: {ch_res.get('errors')}")

if __name__ == "__main__":
    deploy_cache_rules()
    configure_crawler_hints_and_tiered_cache()
    print("\n" + "=" * 70)
    print("🎯 CLOUDFLARE CONFIGURATION COMPLETED!")
    print("=" * 70)
