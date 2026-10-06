#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-List: High-Concurrency Multi-WARP PR TIMES Crawler & Enrichment Engine
=============================================================================
Architecture:
1. Multi-WARP Proxy Pool:
   - Utilizes Cloudflare WARP SOCKS5 Docker containers (ports 40011-40050).
   - Up to 40 independent Cloudflare WARP exit IPs.
   - Proactive rotation: Automatically restarts `docker restart warp-{port}` on 429/403.
2. Anti-Bot Bypassing:
   - Uses `curl_cffi` with genuine Chrome TLS fingerprinting (`impersonate="chrome124"`).
   - Zero JavaScript challenge blocks, ultra-fast response (<0.3s/page).
3. Persistent SQLite Queue (`raw_prtimes`):
   - Supports Resume/Checkpoint: Stop and restart anytime with zero data loss.
   - Tracks: URL, status (pending/completed/failed), category, published_at.
4. Clean Data Extraction:
   - Strips global site headers, footers, navs to avoid scraping PR TIMES internal links.
   - Extracts standard `<dl>` Profile Card: Address, Prefecture, Phone, Representative, Website.
   - Extracts PR/Media email addresses (pr@..., kouhou@..., press@...).
   - Extracts Direct Contact Form URLs (tayori.com/form/..., internal /contact pages).
5. Multi-Tier Entity Matching & Master DB Enrichment:
   - Matches corporate entities in kigyou-list.db using name + prefecture + phone heuristics.
   - Inserts real-time B2B Intent Signals: 'PR発信' into business_signals table.
   - Syncs to PostgreSQL.
"""

import os
import sys
import re
import time
import json
import socket
import sqlite3
import logging
import argparse
import subprocess
import unicodedata
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse, urljoin, quote
from bs4 import BeautifulSoup

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Try importing curl_cffi for TLS impersonation & SOCKS5 support
try:
    from curl_cffi import requests as curl_requests
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False
    import urllib.request
    import urllib.error

# Setup paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
DB_PATH = os.path.join(ROOT_DIR, "kigyou-list.db")
PG_DSN = "postgresql://postgres:Hrptlcct6789%40@localhost:5432/kigyou_list"

log = logging.getLogger("prtimes_warp_crawler")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(CURRENT_DIR, "prtimes_crawler.log"), encoding="utf-8")
    ]
)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0"
]

EMAIL_PATTERN = re.compile(r'\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b')
EMAIL_BLACKLIST = re.compile(r'(prtimes|tayori|jooto|predge|preditor|example|noreply|donotreply|wix|sentry|wordpress)', re.I)
PHONE_PATTERN = re.compile(r'(?:TEL|Tel|電話番号|電話)\s*[：:・\.]?[ 　]*(0\d{1,4}[-－]?\d{1,4}[-－]?\d{4})', re.I)

FEED_CATEGORIES = [
    ("main", "https://prtimes.jp/"),
    ("technology", "https://prtimes.jp/technology/"),
    ("mobile", "https://prtimes.jp/mobile/"),
    ("app", "https://prtimes.jp/app/"),
    ("entertainment", "https://prtimes.jp/entertainment/"),
    ("beauty", "https://prtimes.jp/beauty/"),
    ("fashion", "https://prtimes.jp/fashion/"),
    ("lifestyle", "https://prtimes.jp/lifestyle/"),
    ("business", "https://prtimes.jp/business/"),
    ("gourmet", "https://prtimes.jp/gourmet/"),
    ("sports", "https://prtimes.jp/sports/")
]

HARVEST_KEYWORDS = [
    # Top Corporate Actions
    "株式会社", "合同会社", "有限会社", "一般社団法人", "新商品", "新サービス", "業務提携", "資本業務提携", 
    "資金調達", "代表取締役", "出資", "協業", "DX", "AI", "SaaS", "クラウド", 
    "特許", "導入事例", "セミナー", "展示会", "設立", "開設", "リニューアル", 
    "採用", "中途採用", "新卒採用", "ヘルスケア", "フィンテック", "受託開発", 
    "コンサルティング", "マーケティング", "不動産", "物流", "EC", "ロボット", 
    "脱炭素", "サステナビリティ", "セキュリティ", "自治体", "実証実験", "共同研究", 
    "アプリ", "子会社", "M&A", "株式取得", "上場", "IPO", "売上", "増資",
    # 47 Prefectures
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", 
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", 
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", 
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", 
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", 
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", 
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
    # High-Yield Syllables & Tech Terms
    "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ", 
    "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト", 
    "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ", 
    "マ", "ミ", "ム", "メ", "モ", "ヤ", "ユ", "ヨ", "ラ", "リ", "ル", "レ", "ロ", "ワ",
    "システム", "開発", "ソリューション", "プラットフォーム", "エンジニア", "デザイン", 
    "メディア", "リリース", "キャンペーン", "イベント", "オンライン", "店舗", "オープン", 
    "事業", "プロジェクト", "パートナー", "共同", "支援", "製品", "ブランド", 
    "テクノロジー", "グループ", "ネットワーク", "マネジメント", "ホールディングス"
]

class WarpClusterManager:
    """Manages Cloudflare WARP Docker SOCKS5 proxies and proactive rotation."""
    def __init__(self, ports: list[int], auto_start: bool = True):
        self.ports = ports
        self.auto_start = auto_start
        self.active_ports = []
        self._initialize_pool()

    def _is_port_open(self, port: int) -> bool:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                return s.connect_ex(('127.0.0.1', port)) == 0
        except Exception:
            return False

    def _initialize_pool(self):
        log.info(f"[*] Checking WARP Proxy Cluster readiness across {len(self.ports)} candidate ports...")
        stopped = []
        for port in self.ports:
            if self._is_port_open(port):
                self.active_ports.append(port)
            else:
                stopped.append(port)
                
        if stopped and self.auto_start:
            log.info(f"  [*] Starting {len(stopped)} stopped WARP containers in parallel...")
            container_names = [f"warp-{p}" for p in stopped]
            subprocess.run(["docker", "start"] + container_names, capture_output=True)
            
            # Wait for ports to become active
            t_end = time.time() + 20
            while time.time() < t_end and len(self.active_ports) < len(self.ports):
                for p in stopped:
                    if p not in self.active_ports and self._is_port_open(p):
                        self.active_ports.append(p)
                time.sleep(1.0)
                    
        log.info(f"[+] WARP Cluster Ready: {len(self.active_ports)} active proxy ports online.")

    def rotate_port(self, port: int):
        """Restarts Docker container to obtain a brand new exit IP from Cloudflare."""
        container_name = f"warp-{port}"
        log.warning(f"🔄 [ROTATION] Restarting {container_name} on port {port} to rotate IP...")
        try:
            subprocess.run(["docker", "restart", container_name], capture_output=True, timeout=20)
            t_end = time.time() + 15
            while time.time() < t_end:
                if self._is_port_open(port):
                    log.info(f"  [+] Port {port} rotated and reconnected successfully.")
                    return True
                time.sleep(1.0)
        except Exception as e:
            log.error(f"  [-] Failed to rotate {container_name}: {e}")
        return False

def init_raw_table(db_path: str = DB_PATH):
    """Initializes raw_prtimes queue table in SQLite."""
    conn = sqlite3.connect(db_path, timeout=60.0)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS raw_prtimes (
            url TEXT PRIMARY KEY,
            category TEXT,
            title TEXT,
            status TEXT DEFAULT 'pending',
            company_name TEXT,
            corporate_number TEXT,
            website_url TEXT,
            email_address TEXT,
            contact_form_url TEXT,
            phone_number TEXT,
            representative_name TEXT,
            address TEXT,
            prefecture TEXT,
            published_at TEXT,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            crawled_at DATETIME
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS prtimes_companies (
            company_id INTEGER PRIMARY KEY,
            name_origin TEXT,
            name TEXT,
            total_releases INTEGER,
            latest_release_url TEXT,
            latest_release_title TEXT,
            latest_release_at TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_prtimes_comp_status ON prtimes_companies(status);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_prtimes_comp_origin ON prtimes_companies(name_origin);")
    conn.commit()
    conn.close()

def fetch_html_warp(url: str, proxy_port: int, warp_mgr: WarpClusterManager = None, timeout: int = 12) -> str:
    """Fetches HTML using genuine Chrome TLS fingerprinting via specific WARP proxy port."""
    proxy_url = f"socks5h://127.0.0.1:{proxy_port}" if proxy_port else None
    
    for attempt in range(2):
        try:
            if HAS_CURL_CFFI:
                resp = curl_requests.get(
                    url,
                    proxy=proxy_url,
                    impersonate="chrome124",
                    timeout=timeout,
                    headers={"Accept-Language": "ja,en-US;q=0.9,en;q=0.8"}
                )
                if resp.status_code == 200:
                    return resp.text
                elif resp.status_code in [403, 429]:
                    log.warning(f"⚠️ [BLOCKED {resp.status_code}] on port {proxy_port} for {url}")
                    if warp_mgr and proxy_port:
                        warp_mgr.rotate_port(proxy_port)
                        continue
                else:
                    return ""
            else:
                req = urllib.request.Request(url, headers={"User-Agent": USER_AGENTS[0]})
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    return resp.read().decode("utf-8", errors="replace")
        except Exception as e:
            if attempt == 0 and warp_mgr and proxy_port:
                warp_mgr.rotate_port(proxy_port)
            time.sleep(1.0)
            
    return ""

def extract_article_links(html: str) -> list[str]:
    """Extracts press release article links from PR TIMES category or page HTML."""
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    articles = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/main/html/rd/p/" in href:
            full_url = urljoin("https://prtimes.jp", href.split("?")[0])
            if full_url not in articles:
                articles.append(full_url)
    return articles

def parse_pr_article(url: str, html: str) -> dict:
    """Parses a PR TIMES article for company name, website, email, phone, address, and representative."""
    soup = BeautifulSoup(html, "html.parser")
    
    # Strip site template headers, footers, navigation, sidebars to avoid scraping PR TIMES's own footer links
    for tag in soup.find_all(["footer", "header", "nav", "aside"]):
        tag.decompose()

    data = {
        "source_url": url,
        "company_name": "",
        "title": "",
        "published_at": "",
        "website_url": "",
        "contact_form_url": "",
        "email_address": "",
        "phone_number": "",
        "representative_name": "",
        "address": "",
        "prefecture": "",
    }
    
    # Title
    t_elem = soup.find("h1")
    if t_elem:
        data["title"] = t_elem.get_text().strip()
        
    # Company Name
    c_elem = soup.find(class_=re.compile(r'company.*name', re.I)) or soup.find(class_="company-name")
    if c_elem:
        data["company_name"] = c_elem.get_text().strip()
    else:
        meta_comp = soup.find("meta", property="article:author")
        if meta_comp and meta_comp.get("content"):
            data["company_name"] = meta_comp["content"].strip()
            
    # Published date
    time_elem = soup.find("time")
    if time_elem:
        data["published_at"] = time_elem.get("datetime") or time_elem.get_text().strip()

    # 1. Parse Official Company Profile Definition List (<dl><dt><dd>)
    for dl in soup.find_all("dl"):
        dts = dl.find_all("dt")
        dds = dl.find_all("dd")
        if len(dts) == len(dds) and any("所在地" in dt.get_text() for dt in dts):
            for dt, dd in zip(dts, dds):
                k = dt.get_text().strip()
                v = dd.get_text().strip()
                if "所在地" in k:
                    data["address"] = v.replace("\r", " ").replace("\n", " ").strip()
                elif "代表" in k:
                    data["representative_name"] = v
                elif "電話" in k and not data["phone_number"]:
                    data["phone_number"] = v.replace("－", "-")
                elif "URL" in k and not data["website_url"]:
                    data["website_url"] = v.rstrip("/")

    # Detect Prefecture from Address
    if data["address"]:
        pref_match = re.search(r'(東京都|北海道|(?:京都|大阪)府|.{2,3}県)', data["address"])
        if pref_match:
            data["prefecture"] = pref_match.group(1)

    # 2. Emails
    emails = []
    for em in EMAIL_PATTERN.findall(html):
        if not EMAIL_BLACKLIST.search(em) and em not in emails:
            emails.append(em)
    if emails:
        data["email_address"] = emails[0]
        
    # 3. Fallback Phone
    if not data["phone_number"]:
        m_ph = PHONE_PATTERN.search(html)
        if m_ph:
            data["phone_number"] = m_ph.group(1).replace("－", "-")
        
    # 4. External Links (Official Website & Contact Form)
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href.startswith("http"):
            continue
        domain = urlparse(href).netloc.lower()
        if any(ign in domain for ign in ["prtimes.", "jooto.com", "twitter.com", "x.com", "facebook.com", "youtube.com", "instagram.com", "tiktok.com", "amazon.co.jp", "rakuten.co.jp", "bilibili.com"]):
            continue
            
        # External form providers (Tayori, Formrun, Google Form, etc.)
        if any(form_dom in domain for form_dom in ["tayori.com", "form.run", "forms.gle", "form-mailer.jp"]):
            if "tayori.com/feature" not in href and "536e9f54c53fb0fa255e36237e66a8c50e2cd625" not in href:
                if not data["contact_form_url"]:
                    data["contact_form_url"] = href
            continue
            
        # Official Company Homepage
        if not data["website_url"]:
            if any(kw in a.get_text() for kw in ["公式サイト", "ホームページ", "会社概要", "コーポレートサイト"]) or \
               domain in url or "www." in domain or ".co.jp" in domain:
                data["website_url"] = href.split("?")[0].rstrip("/")
                
        if any(kw in href.lower() for kw in ["/contact", "/inquiry", "/otoiawase"]) and not data["contact_form_url"]:
            data["contact_form_url"] = href

    # Clean company name
    if data["company_name"]:
        data["company_name"] = re.sub(r'[\r\n\t]+', ' ', data["company_name"]).strip()
        
    # Sanitize all string fields (remove null bytes that break PostgreSQL, trim whitespace, remove dash placeholders)
    for k, v in data.items():
        if isinstance(v, str):
            c_val = v.replace("\x00", "").strip()
            if c_val in ["-", "なし", "None", "null", "―", "ー"]:
                c_val = ""
            data[k] = c_val
        
    return data

def generate_name_variants(name: str) -> list[str]:
    """Generates Japanese company name variations for robust cross-database matching."""
    variants = set()
    cleaned = re.sub(r'[\r\n\t]+', '', name).strip()
    if not cleaned:
        return []
    variants.add(cleaned)
    variants.add(cleaned.replace(" ", "").replace("　", ""))
    
    nfkc = unicodedata.normalize('NFKC', cleaned)
    variants.add(nfkc)
    variants.add(nfkc.replace(" ", ""))
    
    zenkaku = cleaned.translate(str.maketrans(
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        '０１２３４５６７８９ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ'
    ))
    variants.add(zenkaku)
    variants.add(zenkaku.replace(" ", "").replace("　", ""))
    
    for base in list(variants):
        for legal in ["株式会社", "有限会社", "合同会社", "一般社団法人"]:
            if not base.startswith(legal):
                variants.add(f"{legal}{base}")
                variants.add(f"{legal} {base}")
                variants.add(f"{legal}　{base}")
            if not base.endswith(legal):
                variants.add(f"{base}{legal}")
    return [v for v in variants if v]

# ==============================================================================
# PIPELINE STEPS: ENUM -> HARVEST -> CRAWL -> ENRICH
# ==============================================================================

def run_enum_companies(start_id: int, end_id: int, workers: int, warp_mgr: WarpClusterManager, active_ports: list[int]) -> dict:
    """Enumerates sequential company IDs (1..192500) via PR TIMES internal REST API, indexing all active companies."""
    log.info(f"[*] Starting PR TIMES Company Enumeration across ID range [{start_id:,} .. {end_id:,}] with {workers} workers...")
    
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    cur = conn.cursor()
    
    # 1. Fetch already processed company IDs in this range for resume capability
    cur.execute("SELECT company_id FROM prtimes_companies WHERE company_id BETWEEN ? AND ?;", (start_id, end_id))
    processed_ids = set(r[0] for r in cur.fetchall())
    conn.close()
    
    target_ids = [cid for cid in range(start_id, end_id + 1) if cid not in processed_ids]
    log.info(f"[*] Range size: {end_id - start_id + 1:,} | Already indexed: {len(processed_ids):,} | Remaining to scan: {len(target_ids):,}")
    
    if not target_ids:
        log.info("[+] All company IDs in the specified range have already been indexed.")
        return {"scanned": 0, "active_companies": 0, "new_articles": 0}
        
    def _fetch_company(item):
        idx, cid = item
        port = active_ports[idx % len(active_ports)]
        url = f"https://prtimes.jp/api/company_content.php/companies/{cid}/press_releases?limit=1"
        res = fetch_html_warp(url, port, warp_mgr, timeout=8)
        if res and '"data"' in res:
            try:
                d = json.loads(res)
                data_obj = d.get("data", {})
                total = data_obj.get("total", 0)
                releases = data_obj.get("data", [])
                if total > 0 and releases:
                    first = releases[0]
                    comp = first.get("company", {})
                    name_origin = comp.get("name_origin") or comp.get("name") or ""
                    name = comp.get("name") or ""
                    r_url = urljoin("https://prtimes.jp", first.get("url", ""))
                    r_title = first.get("title", "")
                    r_at = first.get("updated_at", {}).get("time_iso_8601", "")
                    return (cid, True, {
                        "company_id": cid,
                        "name_origin": name_origin,
                        "name": name,
                        "total_releases": total,
                        "latest_release_url": r_url,
                        "latest_release_title": r_title,
                        "latest_release_at": r_at
                    })
                else:
                    return (cid, False, {"company_id": cid, "total_releases": 0})
            except Exception:
                pass
        return (cid, False, None)

    start_time = time.time()
    active_count = 0
    scanned_count = 0
    batch_companies = []
    batch_articles = []
    
    def _flush_enum_batch(comps, arts):
        if not comps and not arts: return
        b_conn = sqlite3.connect(DB_PATH, timeout=60.0)
        b_conn.execute("PRAGMA journal_mode=WAL;")
        b_cur = b_conn.cursor()
        if comps:
            b_cur.executemany("""
                INSERT OR REPLACE INTO prtimes_companies 
                (company_id, name_origin, name, total_releases, latest_release_url, latest_release_title, latest_release_at, status, updated_at)
                VALUES (:company_id, :name_origin, :name, :total_releases, :latest_release_url, :latest_release_title, :latest_release_at, 'completed', CURRENT_TIMESTAMP);
            """, comps)
        if arts:
            b_cur.executemany("""
                INSERT OR IGNORE INTO raw_prtimes 
                (url, category, status, company_name, title, published_at)
                VALUES (?, 'company_enum', 'pending', ?, ?, ?);
            """, arts)
        b_conn.commit()
        b_conn.close()

    chunk_size = 5000
    for chunk_start in range(0, len(target_ids), chunk_size):
        chunk_ids = target_ids[chunk_start:chunk_start + chunk_size]
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(_fetch_company, (i, cid)): cid for i, cid in enumerate(chunk_ids)}
            for future in as_completed(futures):
                cid, is_active, data = future.result()
                scanned_count += 1
                if is_active and data:
                    active_count += 1
                    batch_companies.append(data)
                    if data.get("latest_release_url"):
                        batch_articles.append((
                            data["latest_release_url"],
                            data.get("name_origin") or data.get("name"),
                            data.get("latest_release_title"),
                            data.get("latest_release_at")
                        ))
                elif data and data.get("total_releases") == 0:
                    batch_companies.append({
                        "company_id": cid, "name_origin": "", "name": "", "total_releases": 0,
                        "latest_release_url": "", "latest_release_title": "", "latest_release_at": ""
                    })
                    
                if len(batch_companies) >= 200:
                    _flush_enum_batch(batch_companies, batch_articles)
                    batch_companies = []
                    batch_articles = []
                    elapsed = time.time() - start_time
                    log.info(f"  - Enum Progress: {scanned_count:,} / {len(target_ids):,} IDs ({scanned_count/(elapsed+0.001):.1f} req/s) | Active Companies: {active_count:,}")
                    
        # Flush at the end of each 5000-chunk
        if batch_companies or batch_articles:
            _flush_enum_batch(batch_companies, batch_articles)
            batch_companies = []
            batch_articles = []
            
    elapsed = time.time() - start_time
    log.info(f"[+] Company Enumeration Finished: Scanned {scanned_count:,} IDs in {elapsed:.1f}s ({scanned_count/(elapsed+0.001):.1f} req/s). Active Companies Found: {active_count:,}")
    return {"scanned": scanned_count, "active_companies": active_count, "new_articles": len(batch_articles)}

def run_harvest(pages: int, warp_mgr: WarpClusterManager, active_ports: list[int]) -> int:
    """Scans all PR TIMES categories, 47 prefectures, sitemaps, and business search keywords to populate raw_prtimes queue."""
    log.info(f"[*] Starting Link Harvester across categories, 47 prefectures, sitemaps, and {len(HARVEST_KEYWORDS)} business keywords...")
    
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    
    total_added = 0
    urls_to_scan = []
    
    # 1. Category feeds
    for cat_name, base_url in FEED_CATEGORIES:
        urls_to_scan.append((f"cat:{cat_name}", base_url))
        
    # 2. All 47 Prefectures
    for pref_id in range(1, 48):
        pref_code = f"{pref_id:02d}"
        urls_to_scan.append((f"pref:{pref_code}", f"https://prtimes.jp/main/html/searchcity/pref_id/{pref_code}"))
        
    # 3. Real Business keywords search (PR TIMES server-rendered searchkey endpoint)
    for kw in HARVEST_KEYWORDS:
        encoded_kw = quote(kw)
        urls_to_scan.append((f"kw:{kw}", f"https://prtimes.jp/main/action.php?run=html&page=searchkey&search_word={encoded_kw}"))
            
    log.info(f"[*] Generated {len(urls_to_scan)} harvest targets.")
    
    # 4. Harvest Sitemaps
    for sitemap_url in ["https://prtimes.jp/sitemap-news.xml", "https://prtimes.jp/sitemap-general.xml"]:
        try:
            p0 = active_ports[0] if active_ports else 0
            s_xml = fetch_html_warp(sitemap_url, p0, warp_mgr)
            s_links = re.findall(r'<loc>(https://prtimes\.jp/main/html/rd/p/[^<]+)</loc>', s_xml)
            if s_links:
                s_records = [(l, "sitemap", "pending") for l in s_links]
                cur = conn.cursor()
                cur.executemany("INSERT OR IGNORE INTO raw_prtimes (url, category, status) VALUES (?, ?, ?);", s_records)
                conn.commit()
                total_added += cur.rowcount
                log.info(f"  [+] {sitemap_url} -> Harvested {len(s_links)} links ({cur.rowcount} new). Total queue: {total_added}")
        except Exception as e:
            log.warning(f"Error harvesting {sitemap_url}: {e}")
    
    def _harvest_page(item):
        idx, (cat_name, p_url) = item
        port = active_ports[idx % len(active_ports)]
        try:
            html = fetch_html_warp(p_url, port, warp_mgr)
            links = extract_article_links(html)
            return (cat_name, p_url, links)
        except Exception as e:
            log.warning(f"Error harvesting {p_url} on port {port}: {e}")
            return (cat_name, p_url, [])

    # Use 25-30 concurrent threads across WARP pool for ultra-fast link harvesting
    harvester_workers = min(len(active_ports), 30) if active_ports != [0] else 5
    with ThreadPoolExecutor(max_workers=harvester_workers) as executor:
        futures = {executor.submit(_harvest_page, (i, target)): target for i, target in enumerate(urls_to_scan)}
        for future in as_completed(futures):
            cat_name, p_url, links = future.result()
            if links:
                records = [(link, cat_name, 'pending') for link in links]
                cur = conn.cursor()
                cur.executemany("INSERT OR IGNORE INTO raw_prtimes (url, category, status) VALUES (?, ?, ?);", records)
                conn.commit()
                added = cur.rowcount
                total_added += added
                log.info(f"  [+] {cat_name} -> Harvested {len(links)} links ({added} new). Total queue: {total_added}")
            time.sleep(0.05)
            
    conn.close()
    log.info(f"[+] Harvester finished! Added {total_added:,} new PR articles to raw_prtimes queue.")
    return total_added

def run_crawl(limit: int, workers: int, warp_mgr: WarpClusterManager, active_ports: list[int]) -> int:
    """Consumes pending URLs from raw_prtimes, crawls and extracts data using 40 workers."""
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    cur = conn.cursor()
    
    if limit > 0:
        cur.execute("SELECT url FROM raw_prtimes WHERE status = 'pending' LIMIT ?;", (limit,))
    else:
        cur.execute("SELECT url FROM raw_prtimes WHERE status = 'pending';")
    pending_urls = [r[0] for r in cur.fetchall()]
    conn.close()
    
    if not pending_urls:
        log.info("[*] No pending articles in raw_prtimes queue to crawl.")
        return 0
        
    log.info(f"[*] Starting Multi-WARP Crawler on {len(pending_urls):,} pending articles with {workers} workers...")
    
    def _crawl_item(item):
        idx, url = item
        port = active_ports[idx % len(active_ports)]
        html = fetch_html_warp(url, port, warp_mgr)
        if html:
            data = parse_pr_article(url, html)
            return (url, True, data)
        else:
            return (url, False, None)

    start_time = time.time()
    processed = 0
    batch_records = []
    
    def _flush_batch(batch):
        if not batch: return
        c_conn = sqlite3.connect(DB_PATH, timeout=60.0)
        c_conn.execute("PRAGMA journal_mode=WAL;")
        c_cur = c_conn.cursor()
        for u, ok, d in batch:
            if ok and d:
                c_cur.execute("""
                    UPDATE raw_prtimes 
                    SET status = 'completed',
                        title = ?,
                        company_name = ?,
                        website_url = ?,
                        email_address = ?,
                        contact_form_url = ?,
                        phone_number = ?,
                        representative_name = ?,
                        address = ?,
                        prefecture = ?,
                        published_at = ?,
                        crawled_at = CURRENT_TIMESTAMP
                    WHERE url = ?;
                """, (
                    d.get("title"), d.get("company_name"), d.get("website_url"),
                    d.get("email_address"), d.get("contact_form_url"), d.get("phone_number"),
                    d.get("representative_name"), d.get("address"), d.get("prefecture"),
                    d.get("published_at"), u
                ))
            else:
                c_cur.execute("UPDATE raw_prtimes SET status = 'failed', crawled_at = CURRENT_TIMESTAMP WHERE url = ?;", (u,))
        c_conn.commit()
        c_conn.close()

    chunk_size = 5000
    for chunk_start in range(0, len(pending_urls), chunk_size):
        chunk_urls = pending_urls[chunk_start:chunk_start + chunk_size]
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(_crawl_item, (i, url)): url for i, url in enumerate(chunk_urls)}
            for future in as_completed(futures):
                res = future.result()
                batch_records.append(res)
                processed += 1
                
                if len(batch_records) >= 100:
                    _flush_batch(batch_records)
                    batch_records = []
                    elapsed = time.time() - start_time
                    log.info(f"  - Progress: {processed:,} / {len(pending_urls):,} articles ({processed/(elapsed+0.001):.1f} articles/sec)")
                    
        # Flush remaining in chunk
        if batch_records:
            _flush_batch(batch_records)
            batch_records = []
        
    elapsed = time.time() - start_time
    log.info(f"[+] Crawler Completed: Processed {processed:,} articles in {elapsed:.1f}s ({processed/(elapsed+0.001):.1f} articles/sec).")
    return processed

def run_enrich() -> dict:
    """Enriches master companies table with completed PR TIMES records."""
    log.info("[*] Starting Master Database Enrichment from raw_prtimes...")
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    cur = conn.cursor()
    
    cur.execute("""
        SELECT url, company_name, title, website_url, email_address, contact_form_url, phone_number, representative_name, address, prefecture, published_at
        FROM raw_prtimes 
        WHERE status = 'completed' AND corporate_number IS NULL AND company_name IS NOT NULL AND company_name != '';
    """)
    rows = cur.fetchall()
    log.info(f"[*] Found {len(rows):,} unenriched PR company records to match.")
    
    if not rows:
        conn.close()
        return {"matched": 0, "updated": 0, "signals_added": 0}

    valid_records = []
    for r in rows:
        valid_records.append({
            "url": r[0],
            "company_name": r[1],
            "title": r[2],
            "website_url": r[3],
            "email_address": r[4],
            "contact_form_url": r[5],
            "phone_number": r[6],
            "representative_name": r[7],
            "address": r[8],
            "prefecture": r[9],
            "published_at": r[10]
        })

    # 1. Collect all candidate search names
    name_map = {}
    for r in valid_records:
        cn = r["company_name"]
        variants = generate_name_variants(cn)
        for v in variants:
            if v not in name_map: name_map[v] = []
            name_map[v].append(r)

    # 2. Fast chunked batch query with WHERE company_name IN (...)
    candidate_keys = list(name_map.keys())
    matched_db_rows = {}
    chunk_size = 900
    log.info(f"[*] Running fast batch matching against master 5,000,000 companies table...")
    for i in range(0, len(candidate_keys), chunk_size):
        chunk = candidate_keys[i:i + chunk_size]
        placeholders = ",".join(["?"] * len(chunk))
        cur.execute(f"""
            SELECT company_name, corporate_number, prefecture_name, full_address, phone_number, representative_name, website_url, email_address, contact_form_url 
            FROM companies 
            WHERE company_name IN ({placeholders});
        """, chunk)
        for row in cur.fetchall():
            c_name = row[0]
            if c_name not in matched_db_rows: matched_db_rows[c_name] = []
            matched_db_rows[c_name].append({
                "corporate_number": row[1],
                "prefecture_name": row[2],
                "full_address": row[3],
                "phone_number": row[4],
                "representative_name": row[5],
                "website_url": row[6],
                "email_address": row[7],
                "contact_form_url": row[8],
            })

    matched = 0
    updated = 0
    signals_added = 0
    total_to_process = len(valid_records)
    
    for idx, r in enumerate(valid_records, 1):
        cn = r["company_name"]
        variants = generate_name_variants(cn)
        candidates = []
        for v in variants:
            if v in matched_db_rows:
                candidates.extend(matched_db_rows[v])
                
        # Deduplicate candidates by corporate_number
        seen_corps = set()
        dedup_candidates = []
        for c in candidates:
            if c["corporate_number"] not in seen_corps:
                seen_corps.add(c["corporate_number"])
                dedup_candidates.append(c)
        candidates = dedup_candidates
                
        if not candidates: continue

        selected_match = None
        if len(candidates) == 1:
            selected_match = candidates[0]
        else:
            pr_pref = r.get("prefecture")
            pr_phone = (r.get("phone_number") or "").replace("-", "")
            pr_rep = (r.get("representative_name") or "").replace(" ", "").replace("　", "")
            pr_addr = (r.get("address") or "").replace(" ", "").replace("　", "")
            
            # Step 1: Filter by prefecture if available
            pref_filtered = [c for c in candidates if pr_pref and c.get("prefecture_name") and pr_pref in c["prefecture_name"]] if pr_pref else candidates
            pool = pref_filtered if pref_filtered else candidates
            
            # Step 2: Phone match (highest confidence)
            if pr_phone:
                for c in pool:
                    c_phone = (c.get("phone_number") or "").replace("-", "")
                    if c_phone and pr_phone == c_phone:
                        selected_match = c; break
            
            # Step 3: Representative name match
            if not selected_match and pr_rep:
                for c in pool:
                    c_rep = (c.get("representative_name") or "").replace(" ", "").replace("　", "")
                    if c_rep and (pr_rep in c_rep or c_rep in pr_rep):
                        selected_match = c; break
                        
            # Step 4: Address / Ward match
            if not selected_match and pr_addr:
                norm_pr = unicodedata.normalize('NFKC', pr_addr)
                for c in pool:
                    c_addr = (c.get("full_address") or "").replace(" ", "").replace("　", "")
                    norm_db = unicodedata.normalize('NFKC', c_addr)
                    m_town = re.search(r'([市区町村][^0-9０-９]+)', norm_pr)
                    if m_town and m_town.group(1) in norm_db:
                        selected_match = c; break
                        
            # Step 5: If exactly one candidate in prefecture
            if not selected_match and len(pref_filtered) == 1:
                selected_match = pref_filtered[0]

        if selected_match:
            matched += 1
            corp_num = selected_match["corporate_number"]
            r["matched_corp_num"] = corp_num
            db_web = selected_match["website_url"]
            db_email = selected_match["email_address"]
            db_form = selected_match["contact_form_url"]
            
            new_web = r.get("website_url") if not db_web and r.get("website_url") else db_web
            new_email = r.get("email_address") if not db_email and r.get("email_address") else db_email
            new_form = r.get("contact_form_url") if not db_form and r.get("contact_form_url") else db_form
            
            if new_web != db_web or new_email != db_email or new_form != db_form:
                cur.execute("""
                    UPDATE companies 
                    SET website_url = COALESCE(?, website_url),
                        email_address = COALESCE(?, email_address),
                        email_type = CASE WHEN ? IS NOT NULL AND ? != '' THEN 'PR' ELSE email_type END,
                        contact_form_url = COALESCE(?, contact_form_url),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE corporate_number = ?;
                """, (new_web, new_email, new_email, new_email, new_form, corp_num))
                updated += 1
                
            # Add Intent Signal: PR発信 with unique source_key
            if r.get("title"):
                sig_date = r.get("published_at")[:10] if r.get("published_at") else datetime.now().strftime("%Y-%m-%d")
                source_key = f"prtimes_{r['url']}"
                clean_title = r["title"].replace("\x00", "").strip()[:200]
                cur.execute("""
                    INSERT OR IGNORE INTO business_signals (corporate_number, signal_type, signal_title, signal_date, source_url, details, source_key)
                    VALUES (?, 'PR発信', ?, ?, ?, ?, ?);
                """, (corp_num, clean_title, sig_date, r.get("url"), json.dumps({"media": "PR TIMES"}, ensure_ascii=False), source_key))
                if cur.rowcount > 0:
                    signals_added += 1
                    
            # Mark raw_prtimes as matched
            cur.execute("UPDATE raw_prtimes SET corporate_number = ? WHERE url = ?;", (corp_num, r["url"]))
            
        if idx % 2000 == 0 or idx == total_to_process:
            conn.commit()
            log.info(f"   - Enrichment Progress: {idx:,} / {total_to_process:,} ({idx/total_to_process*100:.1f}%) | Matched: {matched:,} | Updated: {updated:,} | Signals: {signals_added:,}")
            
    conn.commit()
    conn.close()
    
    # Direct PostgreSQL Sync
    try:
        import psycopg2
        from psycopg2.extras import execute_values
        log.info("[*] Synchronizing enriched PR data directly to PostgreSQL...")
        p_conn = psycopg2.connect(PG_DSN, connect_timeout=3)
        p_cur = p_conn.cursor()
        
        pg_comp_updated = 0
        for r in valid_records:
            c_num = r.get("matched_corp_num")
            if not c_num: continue
            w = r.get("website_url")
            e = r.get("email_address")
            f = r.get("contact_form_url")
            if w or e or f:
                p_cur.execute("""
                    UPDATE companies
                    SET website_url = COALESCE(NULLIF(%s, ''), website_url),
                        email_address = COALESCE(NULLIF(%s, ''), email_address),
                        email_type = CASE WHEN %s IS NOT NULL AND %s != '' THEN 'PR' ELSE email_type END,
                        contact_form_url = COALESCE(NULLIF(%s, ''), contact_form_url),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE corporate_number = %s;
                """, (w, e, e, e, f, c_num))
                if p_cur.rowcount > 0: pg_comp_updated += 1
                
        p_cur.execute("SELECT corporate_number, signal_title FROM business_signals WHERE signal_type = 'PR発信';")
        existing_sigs = set(p_cur.fetchall())
        new_pg_sigs = []
        for r in valid_records:
            c_num = r.get("matched_corp_num")
            if not c_num or not r.get("title"): continue
            clean_t = r["title"].replace("\x00", "").strip()[:200]
            if (c_num, clean_t) not in existing_sigs:
                s_date = r.get("published_at")[:10] if r.get("published_at") else datetime.now().strftime("%Y-%m-%d")
                new_pg_sigs.append((c_num, "PR発信", clean_t, s_date, r.get("url"), json.dumps({"media": "PR TIMES"}, ensure_ascii=False)))
                
        if new_pg_sigs:
            execute_values(p_cur, """
                INSERT INTO business_signals (corporate_number, signal_type, signal_title, signal_date, source_url, details)
                VALUES %s;
            """, new_pg_sigs)
            
        p_conn.commit()
        p_conn.close()
        log.info(f"[+] PostgreSQL Synced: {pg_comp_updated} companies updated, {len(new_pg_sigs)} signals added.")
    except Exception as e:
        log.warning(f"[-] PostgreSQL direct sync error/skip: {e}")
    
    log.info(f"============================================================")
    log.info(f"🎉 MASTER DATABASE ENRICHMENT COMPLETE")
    log.info(f"   - Matched Companies:  {matched:,}")
    log.info(f"   - Newly Enriched:     {updated:,} (Email / Website / Contact Form)")
    log.info(f"   - PR Signals Created: {signals_added:,} (PR発信 Intent Signals)")
    log.info(f"============================================================")
    return {"matched": matched, "updated": updated, "signals_added": signals_added}

def main():
    parser = argparse.ArgumentParser(description="PR TIMES Full-Scale Multi-WARP Crawler & Enrichment Engine")
    parser.add_argument("--mode", choices=["all", "harvest", "crawl", "enrich", "enum"], default="all", help="Pipeline execution mode (default: all)")
    parser.add_argument("--cid-start", type=int, default=1, help="Start company ID for enumeration (default: 1)")
    parser.add_argument("--cid-end", type=int, default=192500, help="End company ID for enumeration (default: 192500)")
    parser.add_argument("--pages", type=int, default=15, help="Number of pages to harvest per category (default: 15)")
    parser.add_argument("--limit", type=int, default=500, help="Max articles to crawl in this run (0 = unlimited, default: 500)")
    parser.add_argument("--workers", type=int, default=38, help="Concurrent worker threads (default: 38)")
    parser.add_argument("--warp-ports", default="40011-40050", help="Range or comma-separated list of WARP ports (default: 40011-40050)")
    parser.add_argument("--no-warp", action="store_true", help="Disable WARP proxies and crawl directly")
    args = parser.parse_args()
    
    # 0. Initialize DB table
    init_raw_table(DB_PATH)
    
    # 1. Parse WARP Ports
    ports = []
    if not args.no_warp:
        if "-" in args.warp_ports:
            start_p, end_p = map(int, args.warp_ports.split("-"))
            ports = list(range(start_p, end_p + 1))
        else:
            ports = [int(p.strip()) for p in args.warp_ports.split(",") if p.strip()]
            
    warp_mgr = WarpClusterManager(ports, auto_start=True) if ports else None
    active_ports = warp_mgr.active_ports if warp_mgr and warp_mgr.active_ports else [0]
    actual_workers = min(args.workers, len(active_ports)) if active_ports != [0] else 5
    
    # Execute Pipeline based on Mode
    if args.mode in ["all", "enum"]:
        run_enum_companies(start_id=args.cid_start, end_id=args.cid_end, workers=actual_workers, warp_mgr=warp_mgr, active_ports=active_ports)

    if args.mode in ["all", "harvest"]:
        run_harvest(pages=args.pages, warp_mgr=warp_mgr, active_ports=active_ports)
        
    if args.mode in ["all", "crawl"]:
        run_crawl(limit=args.limit, workers=actual_workers, warp_mgr=warp_mgr, active_ports=active_ports)
        
    if args.mode in ["all", "enrich"]:
        run_enrich()
        
    log.info("[+] Pipeline Execution Finished Successfully!")

if __name__ == '__main__':
    main()
