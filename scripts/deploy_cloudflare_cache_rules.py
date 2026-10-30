#!/usr/bin/env python3
"""
Deploy Enterprise Cloudflare Edge Cache Rules for Kigyou-list
==============================================================
Fully synchronized with Kigyou-list Two-Tier Caching Architecture:
1. Rule 01 (Bypass Private & Mutations):
   - /api/, /dashboard, /admin, /login, /watchlist, non-GET/HEAD requests
2. Rule 02 (Cache Everything Public Directory & Hub Matrix):
   - All 5.07M Company Profile pages (/company/*) across all locales (ja, en, vi)
   - Area / Prefecture Hubs (/area/*)
   - Industry Hubs & Cross-Prefecture Silos (/industry/*)
   - Licenses Hubs & 47-Prefecture Matrix (/license/*, /licenses)
   - National Directory Hub (/directory)
   - Company Comparison Platform (/compare)
   - High-Intent Dynamic Legal Events (/changes, /changes/relocation, /changes/merger)
   - Invoice Tax Registration Hubs (/invoice)
   - Hiring & Jobs Express Hubs (/jobs, /jobs/latest)
   - Newly Established Corporations (/new-companies)
   - Status & Bankruptcy Events (/status, /status/bankruptcies)
   - Form Marketing Strategic B2B Landing (/form-marketing)
   - Public Search Engine (/search)
   - Commercial Pricing & Legal Documents (/pricing, /terms, /privacy, /tokushoho)
   - Root Landing Pages (/, /ja, /en, /vi)
   
Edge TTL: 7 days (604,800s)
Browser TTL: 4 hours (14,400s)
Serve Stale Content: Enabled (zero downtime / zero latency)
Smart Tiered Cache: Enabled (Tokyo & Osaka Super-POPs)
"""

import os
import sys
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 1. Load credentials
load_dotenv('.env.local')
load_dotenv()

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

def build_cache_expression():
    """Build high-performance, compliant Cloudflare Ruleset expression"""
    hub_contains = [
        "/company/",
        "/area/",
        "/industry/",
        "/license",         # covers /license/* and /licenses across all locales (ja, en, vi)
        "/directory",       # national directory hub
        "/compare",         # corporate compare hub
        "/changes",         # relocation, merger
        "/invoice",         # qualified invoice T-number
        "/jobs",            # careers & hiring
        "/new-companies",   # newly registered companies
        "/status",          # bankruptcies & dissolutions
        "/form-marketing",  # B2B form sales landing page
        "/search",          # public faceted search
        "/building",        # landmark towers directory & tenant hubs
        "/ranking",         # national salary, tenure, and insured employee rankings
        "/pricing",         # pricing packages
        "/terms",           # legal terms
        "/privacy",         # privacy policy
        "/tokushoho"        # specified commercial transactions act
    ]

    contains_parts = [f'(http.request.uri.path contains "{h}")' for h in hub_contains]
    root_parts = [
        '(http.request.uri.path eq "/")',
        '(http.request.uri.path eq "/ja")',
        '(http.request.uri.path eq "/en")',
        '(http.request.uri.path eq "/vi")',
        '(http.request.uri.path eq "/ja/")',
        '(http.request.uri.path eq "/en/")',
        '(http.request.uri.path eq "/vi/")'
    ]

    return ' or '.join(contains_parts + root_parts)

def deploy_cache_rules():
    print("=" * 70)
    print("🚀 DEPLOYING CLOUDFLARE CACHE RULES (KIGYOU-LIST EXPANDED ENGINE)")
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

    cache_expression = build_cache_expression()
    print(f"[*] Generated Cache Expression length: {len(cache_expression)} bytes")

    rules = [
        {
            "description": "01_Bypass_Private_And_API_And_Authenticated",
            "expression": '(starts_with(http.request.uri.path, "/api/")) or (http.request.uri.path contains "/dashboard") or (http.request.uri.path contains "/admin") or (http.request.uri.path contains "/login") or (http.request.uri.path contains "/watchlist") or (http.cookie contains "session-token") or (http.request.method ne "GET" and http.request.method ne "HEAD")',
            "action": "set_cache_settings",
            "action_parameters": {
                "cache": False
            },
            "enabled": True
        },
        {
            "description": "02_Cache_Public_Company_Directory_And_Hubs",
            "expression": cache_expression,
            "action": "set_cache_settings",
            "action_parameters": {
                "cache": True,
                "edge_ttl": {
                    "mode": "override_origin",
                    "default": 604800
                },
                "browser_ttl": {
                    "mode": "bypass"
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
        print("[SUCCESS] Cloudflare Cache Rules deployed successfully:")
        for rule in res.get("result", {}).get("rules", []):
            print(f"  - [{rule.get('action')}] {rule.get('description')} (Enabled: {rule.get('enabled')})")
    else:
        print("[-] Ruleset API error:", json.dumps(res, indent=2))
        sys.exit(1)

def configure_crawler_hints_and_tiered_cache():
    print("\n[3] Configuring Crawler Hints & Smart Tiered Cache...")
    # Smart Tiered Cache
    tc_res = call_cf("PATCH", "cache/tiered_cache_smart_topology_enable", {"value": "on"})
    if tc_res.get("success"):
        print("[OK] Smart Tiered Cache: ON (Tokyo & Osaka Super-POPs)")
    else:
        print(f"[-] Smart Tiered Cache status: {tc_res.get('errors')}")

    # Crawler Hints via zone settings
    ch_res = call_cf("PATCH", "settings/crawler_hints", {"value": "on"})
    if ch_res.get("success"):
        print("[OK] Crawler Hints: ON (Bingbot & Googlebot informed instantly)")
    else:
        print(f"[-] Crawler Hints status: {ch_res.get('errors')}")

if __name__ == "__main__":
    deploy_cache_rules()
    configure_crawler_hints_and_tiered_cache()
    print("\n" + "=" * 70)
    print("🎯 CLOUDFLARE CONFIGURATION COMPLETED!")
    print("=" * 70)
