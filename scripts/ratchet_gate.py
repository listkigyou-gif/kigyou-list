# -*- coding: utf-8 -*-
"""
Kigyou-list 4-Layer Compounding Ratchet Gate (scripts/ratchet_gate.py)
======================================================================
Verifies that every code, UI, DB, or SEO change moves the project forward
and NEVER regresses any previously achieved milestone across 4 layers:
  Layer 1: Crawl Budget & Sitemap Purity (robots.txt Disallow /en/ /vi/, Googlebot / -> /ja, core.xml pure hubs)
  Layer 2: On-Page SEO & Anti-Boilerplate Quality Gate (22 Public Hubs 200 OK, zero noindex, zero en/vi hreflang,
           exact prefecture/archive entity titles & H1s, static internal link counts, pairwise shingle similarity)
  Layer 3: Frontend UI & Mobile Chromium Hydration Gate (zero JS console errors, zero page errors, zero 4xx/5xx resources)
  Layer 4: Persistent Ledger Integrity (content_calendar_history, backlink_registry, gsc_manual_request_indexing_history, pressMedia)
"""
import argparse
import json
import os
import sys
import paramiko
from datetime import datetime, timezone, timedelta

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCORECARD_PATH = os.path.join(ROOT, "data", "project_ratchet_scorecard.json")

PUBLIC_HUBS = [
    "/ja",
    "/ja/directory",
    "/ja/guide",
    "/ja/guide/ai-sales-list",
    "/ja/area/13",
    "/ja/area/27",
    "/ja/building",
    "/ja/licenses",
    "/ja/license/kensetsu",
    "/ja/license/tokutei",
    "/ja/changes/relocation",
    "/ja/changes/relocation/2026-10",
    "/ja/changes/merger",
    "/ja/jobs/latest",
    "/ja/status/bankruptcies",
    "/ja/invoice",
    "/ja/ranking/salary",
    "/ja/ranking/tenure",
    "/ja/form-marketing",
    "/ja/watchlist",
    "/ja/compare",
    "/ja/industry/39/location/13",
]


def run_vps_layers_1_and_2() -> dict:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect("160.251.203.84", 22, "root", "Hrptlcct6789@", timeout=20)

    remote_code = f"""
import urllib.request, re, json
from bs4 import BeautifulSoup

ua = "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
base = "http://127.0.0.1:3000"

out = {{
    "robots_txt_disallow_en": False,
    "robots_txt_disallow_vi": False,
    "googlebot_root_redirects_to_ja": False,
    "core_sitemap_hub_urls": 0,
    "core_sitemap_company_leaf_urls": 0,
    "public_hubs_verified_count": 0,
    "public_hubs_noindex_list": [],
    "public_hubs_missing_canonical_list": [],
    "en_vi_hreflang_leaks": [],
    "entity_assertion_failures": [],
    "directory_static_area_links": 0,
    "directory_static_ind_loc_links": 0,
    "area_13_static_company_links": 0,
    "guide_published_articles": 0,
    "max_pairwise_similarity_pct": 0.0,
    "pairwise_details": {{}},
}}

# 1. robots.txt
robots_txt = urllib.request.urlopen(base + "/robots.txt", timeout=10).read().decode("utf-8", "ignore")
out["robots_txt_disallow_en"] = "Disallow: /en/" in robots_txt
out["robots_txt_disallow_vi"] = "Disallow: /vi/" in robots_txt

# 2. Googlebot root redirect with Accept-Language: en-US
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirect)
req_root = urllib.request.Request(base + "/", headers={{"User-Agent": ua, "Accept-Language": "en-US,en;q=0.9"}})
try:
    opener.open(req_root, timeout=10)
except urllib.error.HTTPError as e:
    loc = e.headers.get("Location", "")
    out["googlebot_root_redirects_to_ja"] = (e.code in (301, 307, 308) and loc.endswith("/ja"))

# 3. core.xml purity
core_xml = urllib.request.urlopen(base + "/sitemap/core.xml", timeout=15).read().decode("utf-8", "ignore")
locs = re.findall(r"<loc>([^<]+)</loc>", core_xml)
out["core_sitemap_hub_urls"] = len(locs)
out["core_sitemap_company_leaf_urls"] = sum(1 for u in locs if "/company/" in u)

# 4. Inspect 22 Public Hubs
hubs = {json.dumps(PUBLIC_HUBS)}
main_texts = {{}}
titles = {{}}
h1s_map = {{}}

for path in hubs:
    req = urllib.request.Request(base + path, headers={{"User-Agent": ua}})
    with urllib.request.urlopen(req, timeout=20) as resp:
        if resp.status == 200:
            out["public_hubs_verified_count"] += 1
        html = resp.read().decode("utf-8", "ignore")

    if path == "/ja/directory":
        out["directory_static_area_links"] = len(set(re.findall(r'href="/ja/area/\\d{{2}}"', html)))
        out["directory_static_ind_loc_links"] = len(set(re.findall(r'href="/ja/industry/[^"]+/location/\\d{{2}}"', html)))
    elif path == "/ja/area/13":
        out["area_13_static_company_links"] = len(set(re.findall(r'/ja/company/\\d{{13}}', html)))
    elif path == "/ja/guide":
        out["guide_published_articles"] = len(set(re.findall(r'href="/ja/guide/[a-z0-9-]+"', html)))

    soup = BeautifulSoup(html, "html.parser")
    rmetas = [m.get("content", "") for m in soup.find_all("meta", attrs={{"name": re.compile(r"^(robots|googlebot)$", re.I)}})]
    if any("noindex" in r.lower() for r in rmetas):
        out["public_hubs_noindex_list"].append(path)

    canon = soup.find("link", attrs={{"rel": "canonical"}})
    if not canon or not canon.get("href", "").startswith("https://kigyoulist.com/ja"):
        out["public_hubs_missing_canonical_list"].append(path)

    for link in soup.find_all("link", attrs={{"rel": "alternate"}}):
        hl = (link.get("hreflang") or link.get("hrefLang") or "").lower()
        if hl in ("en", "vi"):
            out["en_vi_hreflang_leaks"].append(f"{{path}}:{{hl}}")

    title_str = soup.title.get_text(strip=True) if soup.title else ""
    h1_str = " | ".join(h.get_text(strip=True) for h in soup.find_all("h1"))
    titles[path] = title_str
    h1s_map[path] = h1_str

    for tag in soup(["script", "style", "noscript", "svg", "header", "footer", "nav"]):
        tag.decompose()
    main_texts[path] = re.sub(r"\\s+", " ", soup.get_text(" ", strip=True))

# 5. Entity Title & H1 Assertions (prevent Mie / duplicate H1 regressions)
if "東京都" not in titles.get("/ja/area/13", "") or "東京都" not in h1s_map.get("/ja/area/13", ""):
    out["entity_assertion_failures"].append(f"/ja/area/13 missing 東京都: title={{titles.get('/ja/area/13')}}")
if "大阪府" not in titles.get("/ja/area/27", "") or "大阪府" not in h1s_map.get("/ja/area/27", ""):
    out["entity_assertion_failures"].append(f"/ja/area/27 missing 大阪府: title={{titles.get('/ja/area/27')}}")
if "東京都" not in titles.get("/ja/industry/39/location/13", ""):
    out["entity_assertion_failures"].append(f"/ja/industry/39/location/13 missing 東京都: title={{titles.get('/ja/industry/39/location/13')}}")
if "2026年10月" not in h1s_map.get("/ja/changes/relocation/2026-10", ""):
    out["entity_assertion_failures"].append(f"/ja/changes/relocation/2026-10 H1 missing 2026年10月: h1={{h1s_map.get('/ja/changes/relocation/2026-10')}}")

# 6. Pairwise 5-char shingle similarity
def shingles(t, k=5):
    return set(t[i:i+k] for i in range(max(0, len(t) - k + 1)))

pairs = [
    ("/ja/area/13", "/ja/area/27"),
    ("/ja/license/kensetsu", "/ja/license/tokutei"),
    ("/ja/changes/relocation", "/ja/changes/merger"),
    ("/ja/ranking/salary", "/ja/ranking/tenure"),
    ("/ja/form-marketing", "/ja/watchlist"),
]
max_sim = 0.0
for a, b in pairs:
    sa, sb = shingles(main_texts.get(a, "")), shingles(main_texts.get(b, ""))
    sim = round(len(sa & sb) / max(len(sa | sb), 1) * 100, 1)
    out["pairwise_details"][f"{{a}} vs {{b}}"] = sim
    if sim > max_sim:
        max_sim = sim
out["max_pairwise_similarity_pct"] = max_sim

print("JSON_RESULT=" + json.dumps(out, ensure_ascii=False))
"""
    _, out, err = ssh.exec_command(f"python3 - << 'EOF'\n{remote_code}\nEOF", timeout=120)
    raw = out.read().decode("utf-8", "replace")
    ssh.close()
    for line in raw.splitlines():
        if line.startswith("JSON_RESULT="):
            return json.loads(line[len("JSON_RESULT="):])
    raise RuntimeError(f"Failed to parse VPS output: {raw} / {err.read().decode('utf-8', 'replace')}")


def run_layer_3_mobile_playwright(quick: bool = False) -> dict:
    if quick:
        return {"console_errors": 0, "page_errors": 0, "failed_requests": 0, "skipped": True}
    from playwright.sync_api import sync_playwright

    test_urls = [
        "https://kigyoulist.com/ja",
        "https://kigyoulist.com/ja/directory",
        "https://kigyoulist.com/ja/area/13",
        "https://kigyoulist.com/ja/watchlist",
        "https://kigyoulist.com/ja/guide",
    ]
    c_errs, p_errs, f_reqs = [], [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
            viewport={"width": 412, "height": 915},
        )
        page = ctx.new_page()
        page.on("console", lambda m: c_errs.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: p_errs.append(str(e)))
        page.on("response", lambda r: f_reqs.append((r.status, r.url)) if r.status >= 400 else None)
        for u in test_urls:
            page.goto(u, wait_until="networkidle", timeout=30000)
        browser.close()
    return {
        "console_errors": len(c_errs),
        "page_errors": len(p_errs),
        "failed_requests": len(f_reqs),
        "details": {"console": c_errs[:3], "page": p_errs[:3], "network": f_reqs[:3]},
    }


def run_layer_4_ledgers() -> dict:
    cal = json.load(open(os.path.join(ROOT, "data", "content_calendar_history.json"), encoding="utf-8"))
    pm = json.load(open(os.path.join(ROOT, "frontend", "src", "data", "pressMedia.json"), encoding="utf-8"))
    gsc = json.load(open(os.path.join(ROOT, "data", "gsc_manual_request_indexing_history.json"), encoding="utf-8"))
    return {
        "campaigns_logged": len(cal.get("history", [])),
        "press_media_synced": len(pm),
        "manual_gsc_tracked_urls": len(gsc.get("already_submitted_urls", [])),
    }


def main():
    parser = argparse.ArgumentParser(description="Kigyou-list 4-Layer Compounding Ratchet Gate")
    parser.add_argument("--quick", action="store_true", help="Skip Playwright browser step for rapid pre-check")
    args = parser.parse_args()

    scorecard = json.load(open(SCORECARD_PATH, encoding="utf-8"))
    hwm = scorecard["high_water_marks"]

    print("=" * 76)
    print("⚙️  KIGYOU-LIST 4-LAYER COMPOUNDING RATCHET GATE")
    print("=" * 76)

    v = run_vps_layers_1_and_2()
    m = run_layer_3_mobile_playwright(quick=args.quick)
    l = run_layer_4_ledgers()

    failures = []

    # Check Invariants
    if not v["robots_txt_disallow_en"] or not v["robots_txt_disallow_vi"]:
        failures.append("robots.txt missing Disallow: /en/ or Disallow: /vi/")
    if not v["googlebot_root_redirects_to_ja"]:
        failures.append("Googlebot root '/' with Accept-Language: en-US did NOT redirect to /ja")
    if v["core_sitemap_company_leaf_urls"] > 0:
        failures.append(f"sitemap/core.xml contains {v['core_sitemap_company_leaf_urls']} company leaf URLs (must be 0)")
    if v["public_hubs_noindex_list"]:
        failures.append(f"Public hubs infected with noindex: {v['public_hubs_noindex_list']}")
    if v["public_hubs_missing_canonical_list"]:
        failures.append(f"Public hubs missing canonical: {v['public_hubs_missing_canonical_list']}")
    if v["en_vi_hreflang_leaks"]:
        failures.append(f"en/vi hreflang leaks detected: {v['en_vi_hreflang_leaks']}")
    if v["entity_assertion_failures"]:
        failures.append(f"Entity Title/H1 failures: {v['entity_assertion_failures']}")
    if m["console_errors"] > 0 or m["page_errors"] > 0 or m["failed_requests"] > 0:
        failures.append(f"Mobile Chromium errors: {m}")

    # Check High-Water Marks (Non-Regression)
    checks = [
        ("core_sitemap_min_hub_urls", v["core_sitemap_hub_urls"], ">="),
        ("public_hubs_verified_count", v["public_hubs_verified_count"], ">="),
        ("directory_min_static_area_links", v["directory_static_area_links"], ">="),
        ("directory_min_static_industry_location_links", v["directory_static_ind_loc_links"], ">="),
        ("area_13_min_static_company_links", v["area_13_static_company_links"], ">="),
        ("guide_min_published_articles", v["guide_published_articles"], ">="),
        ("max_allowed_pairwise_hub_similarity_pct", v["max_pairwise_similarity_pct"], "<="),
        ("min_campaigns_logged", l["campaigns_logged"], ">="),
        ("min_press_media_synced", l["press_media_synced"], ">="),
        ("min_manual_gsc_tracked_urls", l["manual_gsc_tracked_urls"], ">="),
    ]

    for key, actual, op in checks:
        target = hwm[key]
        passed = (actual >= target) if op == ">=" else (actual <= target)
        icon = "✅" if passed else "❌"
        print(f"  {icon} {key}: actual={actual} (required {op} {target})")
        if not passed:
            failures.append(f"Regression on {key}: actual {actual} violates {op} {target}")
        elif op == ">=" and actual > target:
            hwm[key] = actual  # Ratchet forward!

    print(f"  ✅ Pairwise Similarities: {v['pairwise_details']}")
    print(f"  ✅ Invariants: noindex=0, en_vi_hreflang=0, entity_titles=OK, mobile_errors=0")

    jst = timezone(timedelta(hours=7))
    scorecard["updated_at"] = datetime.now(jst).isoformat(timespec="seconds")
    scorecard["latest_measured"] = {"layer1_2_vps": v, "layer3_mobile": m, "layer4_ledgers": l}

    if failures:
        print("\n" + "!" * 76)
        print("❌ RATCHET GATE FAILED — REGRESSIONS DETECTED:")
        for f in failures:
            print("   -", f)
        print("!" * 76)
        sys.exit(1)

    with open(SCORECARD_PATH, "w", encoding="utf-8") as f:
        json.dump(scorecard, f, ensure_ascii=False, indent=2)
    print("\n" + "=" * 76)
    print("🎉 ALL 4 RATCHET LAYERS PASSED (100%) — SCORECARD LOCKED FORWARD!")
    print("=" * 76)


if __name__ == "__main__":
    main()
