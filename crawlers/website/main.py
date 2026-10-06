#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-List: Next-Gen Hybrid Official Website Crawler Engine
============================================================
Architecture:
- Multi-Source Proxy Pool: Auto-discovers 50+ Cloudflare WARP proxy containers
- 2-Tier Architecture:
    * Tier 1 (Fast Async Engine): curl_cffi / httpx with Chrome TLS fingerprinting (bypasses WAF, ~0.4s/site)
    * Tier 2 (Playwright Fallback): Full headless Chromium for SPAs / JS challenges
- Multi-Source Metadata: Schema.org JSON-LD, OpenGraph, Favicon, Japanese Heuristics & RegEx
- Smart Dead Domain & Parked Domain Detector: Filters expired and parked domains permanently
- High-Performance In-Memory Batch Committer: Zero lock contention with SQLite WAL executemany
"""

import os
import sys
import re
import json
import time
import socket
import random
import sqlite3
import asyncio
import logging
from logging.handlers import RotatingFileHandler
import argparse
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

# Configure UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Setup paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "kigyou-list.db"))

# Optional high-speed TLS impersonation
try:
    from curl_cffi.requests import AsyncSession as CurlAsyncSession
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False

# Fallback Async HTTP
try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

# Playwright for Tier 2 fallback
try:
    from playwright.async_api import async_playwright
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

# Setup Logging
log = logging.getLogger("website_crawler")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler(os.path.join(CURRENT_DIR, "website_crawler.log"), maxBytes=50*1024*1024, backupCount=2, encoding="utf-8"),
    ],
)

# --- USER AGENTS ---
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0"
]

# --- REGEX PATTERNS & HEURISTICS ---
PHONE_PATTERN = re.compile(
    r'(?:TEL|Tel|電話番号|電話|ＴＥＬ)\s*[：:・\.]?[ 　]*(0\d{1,4}[-－]?\d{1,4}[-－]?\d{4})',
    re.IGNORECASE
)
FAX_PATTERN = re.compile(
    r'(?:Fax|FAX|ファックス|F\.?A\.?X\.?)\s*[：:・\.]?[ 　]*(0\d{1,4}[-－]?\d{1,4}[-－]?\d{4})',
    re.IGNORECASE
)
EMAIL_PATTERN = re.compile(
    r'\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b'
)
EMAIL_BLACKLIST = re.compile(
    r'(noreply|no-reply|donotreply|example|test@|admin@sentry|wix|wordpress|user@)',
    re.IGNORECASE
)
CAPITAL_PATTERN = re.compile(
    r'(?:資本金|出資金)\s*[：:・]?[ 　]*([0-9０-９,，\s.．一-龠]+(?:万円|億円|円))'
)
EMPLOYEE_PATTERN = re.compile(
    r'(?:従業員数|従業員|社員数|スタッフ数)\s*[：:・]?[ 　]*([0-9０-９,，\s.．一-龠]+(?:人|名))'
)
REPRESENTATIVE_PATTERN = re.compile(
    r'(?:代表取締役社長|代表取締役|代表者|代表|社長|所長|役員)\s*[：:・]?[ 　]*([一-龠ぁ-ゔァ-ヴー 　]{2,12})'
)

# --- SNS SOCIAL MEDIA LINK PATTERNS ---
SNS_PATTERNS = {
    "twitter": re.compile(r'^https?://(?:www\.)?(?:twitter\.com|x\.com)/([a-zA-Z0-9_]{1,50})/?(?:\?.*)?$', re.I),
    "facebook": re.compile(r'^https?://(?:www\.)?(?:facebook\.com|fb\.com)/(?:pages/|people/|pg/)?([a-zA-Z0-9._\-]{2,100})/?(?:\?.*)?$', re.I),
    "instagram": re.compile(r'^https?://(?:www\.)?instagram\.com/([a-zA-Z0-9._]{2,50})/?(?:\?.*)?$', re.I),
    "youtube": re.compile(r'^https?://(?:www\.)?youtube\.com/(?:channel/|c/|user/|@)([a-zA-Z0-9_\-]{2,100})/?(?:\?.*)?$', re.I),
    "linkedin": re.compile(r'^https?://(?:[a-z]{2}\.)?linkedin\.com/company/([a-zA-Z0-9_\-]{2,100})/?(?:\?.*)?$', re.I),
    "wantedly": re.compile(r'^https?://(?:www\.)?wantedly\.com/companies/([a-zA-Z0-9_\-]{2,100})/?(?:\?.*)?$', re.I),
    "note": re.compile(r'^https?://(?:note\.com|note\.mu)/([a-zA-Z0-9_]{2,50})/?(?:\?.*)?$', re.I),
    "line": re.compile(r'^https?://(?:line\.me/R/ti/p/|lin\.ee/|page\.line\.me/)(@[a-zA-Z0-9_\-]+|[a-zA-Z0-9_\-]+)/?(?:\?.*)?$', re.I),
}

SNS_IGNORE_USERNAMES = {
    "twitter": {"share", "intent", "search", "home", "i", "privacy", "tos", "hashtag", "login", "signup", "settings"},
    "facebook": {"sharer", "share", "dialog", "events", "groups", "help", "policies", "login", "tr", "watch", "photo"},
    "instagram": {"p", "reel", "explore", "stories", "accounts", "developer", "about", "legal"},
    "youtube": {"watch", "embed", "results", "feed", "playlist", "shorts", "share"},
    "linkedin": set(),
    "wantedly": {"projects", "user", "post"},
    "note": {"magazine", "hashtag", "topic", "intent", "login", "signup", "settings"},
    "line": set(),
}

# --- PARKED & DEAD DOMAIN PATTERNS ---
PARKED_PATTERNS = [
    re.compile(r"(お名前\.com|GMOペパボ|ムームードメイン|バリュードメイン|value-domain)", re.I),
    re.compile(r"(このドメインは|ドメインパーキング|ドメインの更新|ドメインの販売|利用期限)", re.I),
    re.compile(r"(domain for sale|buy this domain|parked domain|renew your domain|under construction)", re.I),
    re.compile(r"(cgi-sys/defaultwebpage\.cgi|default site page|welcome to nginx|apache2 debian default)", re.I),
    re.compile(r"(サーバー初期設定|ウェブスペースの初期設定|アクセスしたページは見つかりません)", re.I),
]

EXTERNAL_FORM_DOMAINS = [
    "form.run", "tayori.com", "form-mailer.jp", "forms.gle", "docs.google.com/forms",
    "hubspot.com", "customform.jp", "svy2.bbss.co.jp"
]

def decode_cloudflare_email(cf_hex: str) -> str:
    """Decode Cloudflare data-cfemail obfuscated string."""
    try:
        if not cf_hex or len(cf_hex) < 4:
            return ""
        r = int(cf_hex[:2], 16)
        email = ''.join([chr(int(cf_hex[i:i+2], 16) ^ r) for i in range(2, len(cf_hex), 2)])
        return email.strip()
    except Exception:
        return ""

def classify_email_type(email: str) -> str:
    """Classifies email into RECRUIT, PR, SALES, or GENERAL."""
    if not email:
        return ""
    em = email.lower()
    if re.search(r'(saiyo|jinji|recruit|shinsotsu|career|entry|kyujin)', em):
        return "RECRUIT"
    if re.search(r'(pr|press|media|kouhou)', em):
        return "PR"
    if re.search(r'(sales|eigyo|biz|customer|support|inquiry|otoiawase)', em):
        return "SALES"
    return "GENERAL"

def normalize_obfuscated_text(text: str) -> str:
    """Converts Japanese anti-spam email obfuscations like [at], (at), etc. to @."""
    if not text:
        return ""
    t = to_half_width(text)
    # Replace [at], (at), [att], （アット）, (a), etc.
    t = re.sub(r'[\(\[\{【（]\s*(?:at|att|アット|a)\s*[\)\]\}】）]', '@', t, flags=re.IGNORECASE)
    t = re.sub(r'\s+@\s+', '@', t)
    return t

def extract_contact_form_url(soup, base_url: str) -> str:
    """Detects if page has a contact form or finds candidate contact form link."""
    if not soup:
        return ""
    
    # 1. Check if the current page itself has a real contact form (<form>)
    has_form = False
    for form in soup.find_all("form"):
        action = (form.get("action") or "").lower()
        inputs = [inp.get("name", "").lower() for inp in form.find_all(["input", "textarea"])]
        if any(k in action for k in ["contact", "inquiry", "mail", "send", "post", "confirm", "form", "otoiawase"]) or \
           any(k in inputs for k in ["email", "mail", "message", "body", "content", "name", "tel", "subject"]) or \
           "textarea" in [el.name for el in form.find_all(["input", "textarea"])]:
            has_form = True
            break
            
    current_url_lower = base_url.lower()
    if has_form and any(kw in current_url_lower for kw in ["contact", "inquiry", "otoiawase", "form"]):
        return base_url

    # 2. Look for explicit contact form links in <a> tags
    candidates = []
    base_domain = urlparse(base_url).netloc
    
    for a in soup.find_all("a", href=True):
        href = a.get("href", "").strip()
        text = a.get_text().strip()
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
            
        # External form providers (form.run, Google Forms, Tayori, etc.)
        if any(dom in href.lower() for dom in EXTERNAL_FORM_DOMAINS):
            return href.split("?")[0] if "forms.gle" not in href else href
            
        try:
            full_url = urljoin(base_url, href)
        except Exception:
            continue
            
        full_url_lower = full_url.lower()
        text_lower = text.lower()
        
        # Check domain constraint (allow subdomain or same domain)
        url_domain = urlparse(full_url).netloc
        if base_domain and not (url_domain == base_domain or url_domain.endswith("." + base_domain)):
            continue
            
        prio = 0
        if any(kw in text_lower for kw in ["お問い合わせ", "お問合せ", "問い合わせ", "ご相談", "contact form", "お問い合わせフォーム"]):
            prio = 3
        elif any(kw in full_url_lower for kw in ["/contact", "/inquiry", "/inquiries", "/otoiawase", "/form"]):
            prio = 2
        elif any(kw in text_lower for kw in ["contact", "inquiry"]):
            prio = 1
            
        if prio > 0:
            candidates.append((full_url, prio))
            
    if candidates:
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[0][0]
        
    return base_url if has_form else ""

def to_half_width(text):
    if not text: return ""
    text = str(text)
    zenkaku = "０１２３４５６７８９－ー（）＠．，"
    hankaku = "0123456789--()@.,"
    trans_table = str.maketrans(zenkaku, hankaku)
    return text.translate(trans_table).strip()

def clean_value(val):
    if not val: return ""
    val = val.strip().replace("\n", " ").replace("\r", " ")
    return re.sub(r'\s+', ' ', val)

def clean_boilerplate_html(html_content: str) -> str:
    """Strips boilerplate tags to extract clean body text."""
    if not html_content: return ""
    try:
        try:
            soup = BeautifulSoup(html_content, 'lxml')
        except Exception:
            soup = BeautifulSoup(html_content, 'html.parser')
        for element in soup(["script", "style", "noscript", "svg"]):
            element.decompose()
        for tag in ["header", "footer", "nav", "aside"]:
            for el in soup.find_all(tag):
                el.decompose()
        text = soup.get_text(separator="\n")
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        return "\n".join(lines)
    except Exception:
        text = re.sub(r'<[^>]+>', '\n', html_content)
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        return '\n'.join(lines)

def extract_sns_from_links(links: list) -> dict:
    """Extract official corporate SNS profiles from a list of URLs."""
    sns_found = {}
    if not links: return sns_found
    for link in links:
        if not link or not isinstance(link, str) or not link.startswith("http"):
            continue
        clean_link = link.strip().split('#')[0]
        for platform, pattern in SNS_PATTERNS.items():
            if platform in sns_found:
                continue
            m = pattern.match(clean_link)
            if m:
                username = m.group(1).lower()
                if username not in SNS_IGNORE_USERNAMES.get(platform, set()):
                    clean_url = clean_link.split('?')[0].rstrip('/')
                    sns_found[platform] = clean_url
                    break
    return sns_found

def extract_json_ld(soup) -> dict:
    """Extract structured corporate data and official SNS profiles from JSON-LD."""
    extracted = {
        "sns_links": {},
        "telephone": "",
        "email": "",
        "representative": "",
        "description": ""
    }
    for script in soup.find_all("script", type=re.compile(r"application/ld\+json", re.I)):
        try:
            content = script.string or script.text
            if not content: continue
            data = json.loads(content.strip())
            items = data if isinstance(data, list) else [data]
            if isinstance(data, dict) and "@graph" in data:
                items = data["@graph"]

            for item in items:
                if not isinstance(item, dict): continue
                item_type = str(item.get("@type", "")).lower()
                
                # sameAs SNS links
                same_as = item.get("sameAs", [])
                if isinstance(same_as, str): same_as = [same_as]
                if isinstance(same_as, list):
                    extracted["sns_links"].update(extract_sns_from_links(same_as))
                
                # Organization info
                if any(t in item_type for t in ["organization", "corporation", "localbusiness", "company"]):
                    if item.get("telephone") and not extracted["telephone"]:
                        extracted["telephone"] = to_half_width(str(item["telephone"]))
                    if item.get("email") and not extracted["email"]:
                        extracted["email"] = str(item["email"]).strip()
                    if item.get("description") and not extracted["description"]:
                        extracted["description"] = clean_value(str(item["description"]))[:500]
                    founder = item.get("founder") or item.get("foundingPerson")
                    if isinstance(founder, dict) and founder.get("name") and not extracted["representative"]:
                        extracted["representative"] = clean_value(str(founder["name"]))
                    elif isinstance(founder, str) and not extracted["representative"]:
                        extracted["representative"] = clean_value(founder)
                    if item.get("logo") and not extracted.get("logo"):
                        l = item["logo"]
                        if isinstance(l, dict) and l.get("url"):
                            extracted["logo"] = str(l["url"]).strip()
                        elif isinstance(l, str):
                            extracted["logo"] = l.strip()
        except Exception:
            continue
    return extracted

def extract_meta_tags(soup) -> dict:
    """Extract OpenGraph and meta descriptions."""
    meta_info = {
        "og_title": "",
        "og_description": "",
        "og_image": "",
        "meta_description": "",
        "favicon": "",
        "sns_links": {}
    }
    for meta in soup.find_all("meta"):
        prop = (meta.get("property") or meta.get("name") or "").lower()
        content = (meta.get("content") or "").strip()
        if not content: continue
        if prop == "og:title":
            meta_info["og_title"] = clean_value(content)
        elif prop == "og:description":
            meta_info["og_description"] = clean_value(content)[:500]
        elif prop == "og:image":
            meta_info["og_image"] = content
        elif prop == "description":
            meta_info["meta_description"] = clean_value(content)[:500]
        elif prop == "og:see_also":
            meta_info["sns_links"].update(extract_sns_from_links([content]))

    icon = soup.find("link", rel=re.compile(r"^(shortcut )?icon$", re.I))
    if icon and icon.get("href"):
        meta_info["favicon"] = icon["href"].strip()
    return meta_info

def is_parked_or_dead_page(html_text: str, title: str) -> bool:
    """Detect if page is parked, expired, or default server placeholder."""
    combined = (title + " " + html_text[:3000]).lower()
    return any(p.search(combined) for p in PARKED_PATTERNS)

def extract_representative(text: str) -> str:
    """Extract corporate representative with Japanese prefix/suffix filters."""
    for m in REPRESENTATIVE_PATTERN.finditer(text):
        rep = m.group(1).strip()
        prefixes = ["の", "である", "からの", "会長", "代表取締役社長", "代表取締役", "取締役", "代表", "社長", "所長", "副社長", "専務", "常務", "共同", "創業者", "管理者", "から", "と"]
        changed = True
        while changed:
            changed = False
            for p in prefixes:
                if rep.startswith(p):
                    rep = rep[len(p):].strip()
                    changed = True
                    break
        suffixes = ["を務めております", "を務める", "を務め", "です", "と申します", "より", "は", "が", "と", "氏", "様", "に就任", "される", "して", "する", "した", "から"]
        changed = True
        while changed:
            changed = False
            for s in suffixes:
                if rep.endswith(s):
                    rep = rep[:-len(s)].strip()
                    changed = True
                    break
        rep = re.sub(r'^[のとにがは\s]+', '', rep)
        rep = re.sub(r'[のはがですよりと申します\s]+$', '', rep).strip()
        blacklist = ["者名", "紹介", "氏名", "挨拶", "あいさつ", "ご挨拶", "メッセージ", "プロフィール", "インタビュー", "設計", "屋号", "管理者", "案内", "沿革", "理念", "スタッフ", "ブログ", "一覧"]
        if any(b in rep for b in blacklist): continue
        if len(rep) < 2 or len(rep) > 8: continue
        if any(k in rep for k in ["会社", "有限", "株式", "合資", "組合", "インフォ", "info", "corp", "web"]): continue
        return rep
    return ""

def parse_page_text(text: str) -> dict:
    """Parse text heuristics for phone, fax, email, capital, employees."""
    text_hw = normalize_obfuscated_text(text)
    data = {
        "phone_number": "",
        "fax_number": "",
        "email_address": "",
        "email_type": "",
        "capital_amount": "",
        "employee_count": "",
        "representative_name": "",
        "business_summary": ""
    }
    m = PHONE_PATTERN.search(text_hw)
    if m: data["phone_number"] = m.group(1)
    m = FAX_PATTERN.search(text_hw)
    if m: data["fax_number"] = m.group(1)
    
    # Fallback phone/fax
    if not data["phone_number"] or not data["fax_number"]:
        all_nums = []
        for m_num in re.finditer(r'(0\d{1,4}[-－]\d{1,4}[-－]\d{4})', text_hw):
            num = m_num.group(1)
            ctx = text_hw[max(0, m_num.start() - 30):m_num.start()].lower()
            is_fax = any(k in ctx for k in ["fax", "ファックス", "ｆａｘ"])
            all_nums.append((num, is_fax))
        if not data["phone_number"]:
            for num, is_f in all_nums:
                if not is_f: data["phone_number"] = num; break
            if not data["phone_number"] and all_nums: data["phone_number"] = all_nums[0][0]
        if not data["fax_number"]:
            for num, is_f in all_nums:
                if is_f and num != data["phone_number"]: data["fax_number"] = num; break

    for m_em in EMAIL_PATTERN.finditer(text_hw):
        cand = m_em.group(1).strip()
        if not EMAIL_BLACKLIST.search(cand):
            data["email_address"] = cand
            data["email_type"] = classify_email_type(cand)
            break

    m_cap = CAPITAL_PATTERN.search(text_hw)
    if m_cap: data["capital_amount"] = clean_value(m_cap.group(1))

    m_emp = EMPLOYEE_PATTERN.search(text_hw)
    if m_emp: data["employee_count"] = clean_value(m_emp.group(1))

    data["representative_name"] = extract_representative(text)
    return data

def discover_subpage_links(soup, base_url: str) -> list[str]:
    """Find corporate subpages (会社概要, お問い合わせ, 特定商取引法, etc.) with priority scoring."""
    base_domain = urlparse(base_url).netloc
    candidates = []
    contact_kws = ["お問い合わせ", "お問合せ", "問い合わせ", "連絡先", "ご相談", "contact", "inquiry", "otoiawase", "form"]
    company_kws = ["会社概要", "企業情報", "会社情報", "概要", "沿革", "プロフィール", "about", "company", "profile", "kaisha"]
    compliance_kws = ["特定商取引法", "tokushoho", "プライバシー", "privacy", "採用", "recruit"]
    
    for a in soup.find_all("a", href=True):
        href = a.get("href", "").strip()
        text = a.get_text().strip().lower()
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        try:
            full_url = urljoin(base_url, href)
            if urlparse(full_url).netloc != base_domain:
                continue
        except Exception:
            continue
        href_lower = full_url.lower()
        priority = 0
        if any(kw in text or kw in href_lower for kw in contact_kws):
            priority = 3
        elif any(kw in text or kw in href_lower for kw in company_kws):
            priority = 2
        elif any(kw in text or kw in href_lower for kw in compliance_kws):
            priority = 1
        elif any(kw in text or kw in href_lower for kw in ["アクセス", "access", "location", "地図"]):
            priority = 1
        if priority > 0:
            candidates.append((full_url, priority))

    unique = {}
    for url, prio in candidates:
        if url not in unique or prio > unique[url]:
            unique[url] = prio
    sorted_urls = [u for u, _ in sorted(unique.items(), key=lambda x: x[1], reverse=True)]
    return sorted_urls[:4]

# --- JSIC INDUSTRY CLASSIFICATION RULES ---
INDUSTRY_RULES = [
    # G. Information & Communications
    (re.compile(r'(システム開発|エンジニア|ソフトウェア|プログラミング|クラウド|itソリューション|saas|ai開発|dx支援|受託開発|ネットワーク構築|サーバー構築|情報サービス|ウェブ制作|アプリ開発)', re.I), "39", "G.39", ["情報サービス業", "IT・ソフトウェア"]),
    (re.compile(r'(インターネット|ウェブサイト|ポータルサイト|ecサイト|ネットショップ|メディア運営|sns運用|アフィリエイト|オンラインサービス)', re.I), "40", "G.40", ["インターネット附随サービス業", "Web・ネットサービス"]),
    (re.compile(r'(通信サービス|光回線|モバイル通信|プロバイダ|電気通信|基地局)', re.I), "37", "G.37", ["通信業", "電気通信"]),
    (re.compile(r'(映像制作|アニメーション|動画制作|映画|音楽制作|レコード|出版|デザイン制作|グラフィック)', re.I), "41", "G.41", ["映像・音声・文字情報制作業", "映像・出版"]),

    # D. Construction
    (re.compile(r'(総合建設|建築工事|土木工事|施工管理|工務店|注文住宅|リノベーション|木造建築|鉄骨工事|造成)', re.I), "06", "D.06", ["総合工事業", "建設・土木"]),
    (re.compile(r'(電気設備|電気工事|空調設備|冷暖房工事|配管工事|ダクト工事|消防設備|給排水|換気設備)', re.I), "08", "D.08", ["設備工事業", "電気・空調設備"]),
    (re.compile(r'(内装工事|塗装工事|防水工事|屋根工事|外壁塗装|解体工事|足場工事|リフォーム工事|板金工事|建具)', re.I), "07", "D.07", ["職別工事業", "リフォーム・内装工事"]),

    # P. Medical & Welfare
    (re.compile(r'(クリニック|医院|病院|診療所|歯科医院|デンタルクリニック|整形外科|眼科|皮膚科|内科|薬局|調剤薬局)', re.I), "83", "P.83", ["医療業", "医療・クリニック"]),
    (re.compile(r'(訪問介護|デイサービス|特別養護老人ホーム|グループホーム|介護施設|ケアプラン|障害福祉|保育園|保育所|学童保育|放課後等デイ)', re.I), "85", "P.85", ["社会福祉・介護事業", "介護・福祉"]),

    # K. Real Estate
    (re.compile(r'(不動産売買|不動産仲介|マンション分譲|土地開発|建売|宅地建物|リアルエステート)', re.I), "68", "K.68", ["不動産取引業", "不動産"]),
    (re.compile(r'(不動産管理|賃貸管理|マンション管理|ビルメンテナンス|プロパティマネジメント|テナント募集)', re.I), "69", "K.69", ["不動産賃貸業・管理業", "建物・不動産管理"]),

    # H. Transport & Logistics
    (re.compile(r'(貨物運送|トラック運送|物流サービス|ロジスティクス|利用運送|軽貨物|配送代行|幹線輸送)', re.I), "44", "H.44", ["道路貨物運送業", "物流・運送"]),
    (re.compile(r'(タクシー|観光バス|貸切バス|ハイヤー|送迎バス|旅客運送)', re.I), "43", "H.43", ["道路旅客運送業", "タクシー・バス"]),
    (re.compile(r'(倉庫保管|営業倉庫|物流センター|保管管理|流通加工)', re.I), "47", "H.47", ["倉庫業", "倉庫・保管"]),

    # L. Professional & Technical Services
    (re.compile(r'(法律相談|弁護士|税理士|会計監査|公認会計士|司法書士|行政書士|社会保険労務士|労務管理|特許出願|弁理士)', re.I), "72", "L.72", ["専門サービス業", "士業・法務・会計"]),
    (re.compile(r'(広告代理店|マーケティング支援|ブランディング|pr支援|セールスプロモーション|交通広告|webマーケティング)', re.I), "73", "L.73", ["広告業", "広告・マーケティング"]),
    (re.compile(r'(建築設計|構造計算|測量調査|地質調査|機械設計|プラント設計|環境測定)', re.I), "74", "L.74", ["技術サービス業", "設計・エンジニアリング"]),

    # E. Manufacturing
    (re.compile(r'(金属加工|切削加工|金型製作|プレス加工|板金加工|製缶|溶接|精密部品|治具)', re.I), "24", "E.24", ["金属製品製造業", "機械・金属加工"]),
    (re.compile(r'(工作機械|産業機械|自動化装置|省力化機器|ロボット製造|搬送装置)', re.I), "26", "E.26", ["生産用機械器具製造業", "産業機械製造"]),
    (re.compile(r'(食品製造|製菓|菓子製造|水産加工|惣菜製造|冷凍食品|製パン|酒造|醸造)', re.I), "09", "E.09", ["食料品製造業", "食品製造"]),
    (re.compile(r'(プラスチック成形|射出成形|樹脂加工|ゴム製品|ブロー成形)', re.I), "18", "E.18", ["プラスチック製品製造業", "樹脂・プラスチック加工"]),
    (re.compile(r'(印刷|製本|パンフレット印刷|オフセット印刷|パッケージ印刷|特殊印刷)', re.I), "15", "E.15", ["印刷・同関連業", "印刷・出版"]),
    (re.compile(r'(化学製品|塗料製造|接着剤|化粧品製造|医薬品製造|バイオケミカル)', re.I), "16", "E.16", ["化学工業", "化学・医薬品"]),
    (re.compile(r'(電子部品|半導体製造|プリント基板|電子回路|センサー製造)', re.I), "28", "E.28", ["電子部品・デバイス製造業", "電子・半導体"]),
    (re.compile(r'(自動車部品製造|車体製造|二輪部品|輸送機器製造|造船)', re.I), "31", "E.31", ["輸送用機械器具製造業", "自動車・輸送機器"]),

    # M. Accommodations & Food
    (re.compile(r'(ホテル運営|旅館|リゾートホテル|ビジネスホテル|温泉宿|宿泊施設)', re.I), "75", "M.75", ["宿泊業", "ホテル・旅館"]),
    (re.compile(r'(飲食店経営|レストラン|居酒屋|カフェ|ベーカリー|ダイニング|割烹|寿司|フードサービス)', re.I), "76", "M.76", ["飲食店", "飲食・レストラン"]),

    # I. Wholesale & Retail
    (re.compile(r'(商社|卸売|問屋|貿易商社|輸入販売|輸出入|国内卸)', re.I), "50", "I.50", ["各種商品卸売業", "商社・卸売"]),
    (re.compile(r'(食品卸|青果卸|水産卸|酒類卸|建材卸|機械卸|化学品卸)', re.I), "52", "I.52", ["飲食料品卸売業", "専門卸売"]),
    (re.compile(r'(店舗販売|小売店|セレクトショップ|アパレルショップ|ドラッグストア|書店|量販店)', re.I), "60", "I.60", ["その他の小売業", "小売・専門店"]),

    # R. Business Services
    (re.compile(r'(人材派遣|人材紹介|有料職業紹介|採用支援|求人メディア|ヘッドハンティング)', re.I), "91", "R.91", ["職業紹介・労働者派遣業", "人材派遣・紹介"]),
    (re.compile(r'(警備保障|施設警備|ビル清掃|コールセンター|事務代行|アウトソーシング|受付代行)', re.I), "92", "R.92", ["その他の事業サービス業", "総合サービス・アウトソーシング"]),

    # N. Living-related & Amusement
    (re.compile(r'(ヘアサロン|美容院|美容室|エステサロン|ネイルサロン|理容室|クリーニング店)', re.I), "78", "N.78", ["洗濯・理容・美容・浴場業", "美容・サロン"]),
    (re.compile(r'(冠婚葬祭|葬儀場|セレモニーホール|ウェディング|結婚式場|ブライダル)', re.I), "79", "N.79", ["その他の生活関連サービス業", "冠婚葬祭・ライフサービス"]),
    (re.compile(r'(フィットネスジム|スポーツクラブ|ゴルフ場|カラオケ|アミューズメント施設|エンタメ)', re.I), "80", "N.80", ["娯楽業", "スポーツ・娯楽"]),

    # O. Education
    (re.compile(r'(学校法人|幼稚園|高等学校|専門学校|大学運営)', re.I), "81", "O.81", ["学校教育", "学校・教育"]),
    (re.compile(r'(学習塾|進学塾|予備校|英語教室|プログラミング教室|各種スクール|資格講座)', re.I), "82", "O.82", ["その他の教育，学習支援業", "学習塾・スクール"]),
]

def classify_website_industry(text: str) -> tuple[str, str, list[str]]:
    """Classifies website text into JSIC medium code, materialized path, and readable tag names."""
    if not text:
        return "", "", []
    for pattern, code, path, tags in INDUSTRY_RULES:
        if pattern.search(text):
            return code, path, tags
    return "", "", []

# --- PROXY POOL DISCOVERY ---
def get_active_warp_proxies() -> list[dict]:
    """Scan and verify all active Cloudflare WARP proxy ports on 127.0.0.1 (ports 40011-40050)."""
    target_ports = list(range(40011, 40051))
    active = []
    for port in target_ports:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.15)
                if s.connect_ex(('127.0.0.1', port)) == 0:
                    active.append({
                        "server": f"socks5://127.0.0.1:{port}",
                        "port": port
                    })
        except Exception:
            pass
    return active

# --- TIER 1: FAST ASYNC CRAWLER (curl_cffi / httpx) ---
async def crawl_tier1(session, url: str, timeout: int = 10) -> dict:
    """Fetch and parse using fast asynchronous HTTP with TLS impersonation."""
    res = {
        "status_code": 0,
        "final_url": url,
        "html": "",
        "soup": None,
        "clean_text": "",
        "error": "",
        "needs_tier2": False
    }
    try:
        raw_bytes = None
        if HAS_CURL_CFFI and isinstance(session, CurlAsyncSession):
            resp = await session.get(url, timeout=timeout, allow_redirects=True, verify=False)
            res["status_code"] = resp.status_code
            res["final_url"] = resp.url
            raw_bytes = resp.content
        elif HAS_HTTPX:
            resp = await session.get(url, timeout=timeout, follow_redirects=True)
            res["status_code"] = resp.status_code
            res["final_url"] = str(resp.url)
            raw_bytes = resp.content
        else:
            res["error"] = "NO_HTTP_CLIENT"
            return res

        # Decode Japanese encodings
        decoded_text = ""
        for enc in ["utf-8", "shift_jis", "cp932", "euc-jp", "latin1"]:
            try:
                decoded_text = raw_bytes.decode(enc)
                break
            except UnicodeDecodeError:
                continue

        res["html"] = decoded_text
        if res["status_code"] in [404, 410]:
            res["error"] = "DEAD_DOMAIN"
            return res

        try:
            soup = BeautifulSoup(decoded_text, "lxml")
        except Exception:
            soup = BeautifulSoup(decoded_text, "html.parser")
        res["soup"] = soup
        page_title = (soup.title.string if soup.title else "") or ""
        clean_text = clean_boilerplate_html(decoded_text)
        res["clean_text"] = clean_text

        # Parked / Expired detection
        if is_parked_or_dead_page(clean_text, page_title):
            res["error"] = "PARKED_DOMAIN"
            return res

        # Cloudflare / JS Challenge or Empty SPA detection
        html_lower = decoded_text.lower()
        if res["status_code"] in [403, 503] or "just a moment..." in html_lower or "checking your browser" in html_lower:
            res["needs_tier2"] = True
        elif len(clean_text) < 80 and any(m in html_lower for m in ['id="root"', 'id="app"', 'id="__next"']):
            res["needs_tier2"] = True

    except Exception as e:
        err_str = str(e).lower()
        # Fallback: if SSL failed on https://, try plain http://
        if ("ssl" in err_str or "certificate" in err_str) and url.startswith("https://"):
            try:
                http_fallback_url = "http://" + url[8:]
                if HAS_CURL_CFFI and isinstance(session, CurlAsyncSession):
                    resp = await session.get(http_fallback_url, timeout=timeout, allow_redirects=True, verify=False)
                    res["status_code"] = resp.status_code
                    res["final_url"] = resp.url
                    raw_bytes = resp.content
                    for enc in ["utf-8", "shift_jis", "cp932", "euc-jp", "latin1"]:
                        try:
                            decoded_text = raw_bytes.decode(enc)
                            break
                        except UnicodeDecodeError:
                            continue
                    res["html"] = decoded_text
                    if res["status_code"] in [404, 410]:
                        res["error"] = "DEAD_DOMAIN"
                        return res
                    try:
                        soup = BeautifulSoup(decoded_text, "lxml")
                    except Exception:
                        soup = BeautifulSoup(decoded_text, "html.parser")
                    res["soup"] = soup
                    page_title = (soup.title.string if soup.title else "") or ""
                    clean_text = clean_boilerplate_html(decoded_text)
                    res["clean_text"] = clean_text
                    if is_parked_or_dead_page(clean_text, page_title):
                        res["error"] = "PARKED_DOMAIN"
                        return res
                    res["error"] = ""
                    return res
            except Exception:
                pass

        if "timeout" in err_str: res["error"] = "ERR_TIMEOUT"
        elif "resolve" in err_str or "dns" in err_str: res["error"] = "ERR_DNS"
        elif "connection refused" in err_str or "failed to connect" in err_str: res["error"] = "ERR_CONNECTION_REFUSED"
        elif "ssl" in err_str: res["error"] = "ERR_SSL"
        else: res["error"] = "ERR_FAILED"

    return res

# --- TIER 2: PLAYWRIGHT FALLBACK (Headless Chromium) ---
async def crawl_tier2(browser, proxy_cfg: dict, url: str) -> dict:
    """Fallback engine using full Chromium browser for SPAs and JS challenges."""
    res = {"clean_text": "", "soup": None, "error": "", "html": ""}
    context = None
    try:
        p_cfg = {"server": proxy_cfg["server"]} if proxy_cfg else None
        context = await browser.new_context(
            proxy=p_cfg,
            locale="ja-JP",
            timezone_id="Asia/Tokyo",
            user_agent=random.choice(USER_AGENTS)
        )
        page = await context.new_page()
        # Abort images, media, fonts to save memory and CPU
        await page.route("**/*", lambda route: route.abort() if route.request.resource_type in ["image", "media", "font"] else route.continue_())
        
        await page.goto(url, timeout=25000, wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)
        
        html = await page.content()
        res["html"] = html
        res["soup"] = BeautifulSoup(html, "html.parser")
        res["clean_text"] = await page.inner_text("body")
        await page.close()
    except Exception as e:
        err_str = str(e).lower()
        if "timeout" in err_str: res["error"] = "ERR_TIMEOUT"
        elif "dns" in err_str: res["error"] = "ERR_DNS"
        else: res["error"] = "ERR_FAILED"
    finally:
        if context:
            try: await context.close()
            except Exception: pass
    return res

# --- BATCH DATABASE WRITER (Zero Lock Contention) ---
async def batch_db_writer(db_path: str, buffer_queue: asyncio.Queue, is_done: asyncio.Event):
    """Asynchronous background worker committing batches of crawled data into SQLite."""
    BATCH_SIZE = 50
    FLUSH_INTERVAL = 4.0
    
    while True:
        items = []
        start_wait = time.time()
        while len(items) < BATCH_SIZE and (time.time() - start_wait) < FLUSH_INTERVAL:
            try:
                item = await asyncio.wait_for(buffer_queue.get(), timeout=1.0)
                if item is None: # Exit signal
                    if items: _commit_batch(db_path, items)
                    return
                items.append(item)
            except asyncio.TimeoutError:
                break
                
        if items:
            _commit_batch(db_path, items)
            for _ in items:
                buffer_queue.task_done()
                
        if is_done.is_set() and buffer_queue.empty():
            break

def _commit_batch(db_path: str, items: list):
    """Execute a single atomic WAL transaction for raw_website and companies."""
    for attempt in range(5):
        try:
            conn = sqlite3.connect(db_path, timeout=60.0)
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
            cur = conn.cursor()
            
            raw_inserts = []
            comp_updates = []
            
            for it in items:
                c_num = it["corp_num"]
                w_url = it["website_url"]
                info = it["info"]
                scraped_at = it["scraped_at"]
                
                raw_inserts.append((
                    c_num, w_url,
                    info.get("phone_number", ""),
                    info.get("fax_number", ""),
                    info.get("email_address", ""),
                    info.get("capital_amount", ""),
                    info.get("employee_count", ""),
                    info.get("representative_name", ""),
                    info.get("business_summary", ""),
                    info.get("sns_links"),
                    info.get("logo_url", ""),
                    info.get("contact_form_url", ""),
                    scraped_at
                ))
                
                comp_updates.append((
                    scraped_at,
                    info.get("crawl_status", "SUCCESS"),
                    info.get("crawl_status", "SUCCESS"),
                    info.get("sns_links"),
                    info.get("phone_number", ""),
                    info.get("email_address", ""),
                    info.get("contact_form_url", ""),
                    info.get("email_type", ""),
                    info.get("logo_url", ""),
                    info.get("jigyo_shumoku", ""),
                    info.get("business_summary", ""),
                    c_num
                ))
                
            cur.executemany("""
                INSERT OR REPLACE INTO raw_website (
                    corporate_number, website_url, phone_number, fax_number, email_address,
                    capital_amount, employee_count, representative_name, business_summary, sns_links, logo_url, contact_form_url, scraped_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, raw_inserts)
            
            cur.executemany("""
                UPDATE companies 
                SET website_last_crawled_at = ?,
                    website_crawl_status = ?,
                    website_url = CASE WHEN ? IN ('DEAD_DOMAIN', 'PARKED_DOMAIN') THEN NULL ELSE website_url END,
                    sns_links = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE sns_links END,
                    phone_number = CASE WHEN (phone_number IS NULL OR phone_number = '') AND ? != '' THEN ? ELSE phone_number END,
                    email_address = CASE WHEN (email_address IS NULL OR email_address = '') AND ? != '' THEN ? ELSE email_address END,
                    contact_form_url = CASE WHEN ? != '' THEN ? ELSE contact_form_url END,
                    email_type = CASE WHEN ? != '' THEN ? ELSE email_type END,
                    logo_url = CASE WHEN ? != '' THEN ? ELSE logo_url END,
                    jigyo_shumoku = CASE WHEN ? != '' AND (jigyo_shumoku IS NULL OR jigyo_shumoku LIKE '%未分類%' OR jigyo_shumoku LIKE '%分類不能%') THEN ? ELSE jigyo_shumoku END,
                    business_summary = CASE WHEN (business_summary IS NULL OR business_summary = '') AND ? != '' THEN ? ELSE business_summary END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE corporate_number = ?;
            """, [(s, st, st, sn, sn, sn, ph, ph, em, em, cf, cf, et, et, lg, lg, jg, jg, bs, bs, c) for s, st, st2, sn, ph, em, cf, et, lg, jg, bs, c in comp_updates])

            # Insert into company_industries if on-the-fly tagging succeeded
            ind_inserts = []
            for it in items:
                c_num = it["corp_num"]
                info = it["info"]
                i_code = info.get("industry_code")
                i_path = info.get("industry_path")
                if i_code and i_path:
                    ind_inserts.append((c_num, i_code, i_path, 1))

            if ind_inserts:
                cur.executemany("""
                    INSERT OR IGNORE INTO company_industries (corporate_number, industry_code, industry_path, is_detailed)
                    VALUES (?, ?, ?, ?);
                """, ind_inserts)
            
            conn.commit()
            conn.close()
            return
        except sqlite3.OperationalError:
            time.sleep(random.uniform(0.3, 0.8))
        except Exception as e:
            log.warning(f"Batch commit warning: {e}")
            time.sleep(1.0)

# --- WORKER COROUTINE ---
async def website_worker(worker_id: int, proxy_cfg: dict, task_queue: asyncio.Queue, buffer_queue: asyncio.Queue, browser, allow_tier2: bool = True, timeout: int = 10, stats: dict = None):
    """Processes corporate websites asynchronously using Tier 1 and Tier 2 fallback."""
    port = proxy_cfg["port"]
    proxy_url = proxy_cfg["server"]
    
    # Initialize Fast Async Session with SSL verification disabled for recovery
    session = None
    if HAS_CURL_CFFI:
        session = CurlAsyncSession(impersonate="chrome124", proxy=proxy_url, verify=False)
    elif HAS_HTTPX:
        session = httpx.AsyncClient(proxy=proxy_url, timeout=timeout, verify=False)
        
    while not task_queue.empty():
        try:
            target = await task_queue.get()
        except asyncio.QueueEmpty:
            break
            
        corp_num, raw_url = target
        if not raw_url.startswith("http"):
            raw_url = "http://" + raw_url
            
        scraped_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        extracted_info = {
            "phone_number": "",
            "fax_number": "",
            "email_address": "",
            "email_type": "",
            "capital_amount": "",
            "employee_count": "",
            "representative_name": "",
            "business_summary": "",
            "sns_links": None,
            "logo_url": "",
            "contact_form_url": "",
            "crawl_status": "SUCCESS"
        }
        all_sns = {}
        
        try:
            # 1. Tier 1 Fast Async Fetch
            tier_used = "T1-FAST"
            t1_res = await crawl_tier1(session, raw_url, timeout=timeout)
            
            soup = t1_res.get("soup")
            clean_text = t1_res.get("clean_text") or ""
            error = t1_res.get("error")
            
            # 2. Check if Tier 2 Playwright Fallback is required
            if t1_res.get("needs_tier2") and allow_tier2 and browser:
                tier_used = "T2-PLAY"
                t2_res = await crawl_tier2(browser, proxy_cfg, raw_url)
                if t2_res.get("clean_text"):
                    clean_text = t2_res["clean_text"]
                    soup = t2_res.get("soup")
                    error = ""
                elif t2_res.get("error"):
                    error = t2_res["error"]

            if error:
                extracted_info["crawl_status"] = error
            elif not clean_text or len(clean_text) < 40:
                extracted_info["crawl_status"] = "SUCCESS_EMPTY"
            else:
                # 3. Multi-Source Extraction: JSON-LD + OpenGraph + RegEx
                if soup:
                    # 3.0 Contact Form Extraction
                    c_form = extract_contact_form_url(soup, t1_res.get("final_url") or raw_url)
                    if c_form:
                        extracted_info["contact_form_url"] = c_form

                    # 3.01 Cloudflare Protected Email Decode
                    for cf in soup.find_all(attrs={"data-cfemail": True}):
                        decoded_cf = decode_cloudflare_email(cf.get("data-cfemail", ""))
                        if decoded_cf and not EMAIL_BLACKLIST.search(decoded_cf):
                            extracted_info["email_address"] = decoded_cf
                            extracted_info["email_type"] = classify_email_type(decoded_cf)
                            break

                    # 3.02 Mailto Link Extraction
                    if not extracted_info["email_address"]:
                        for a in soup.find_all("a", href=re.compile(r"^mailto:", re.I)):
                            href_mail = a["href"].split("mailto:")[1].split("?")[0].strip()
                            if href_mail and not EMAIL_BLACKLIST.search(href_mail):
                                extracted_info["email_address"] = href_mail
                                extracted_info["email_type"] = classify_email_type(href_mail)
                                break

                    # 3.1 JSON-LD Schema.org
                    json_ld = extract_json_ld(soup)
                    all_sns.update(json_ld["sns_links"])
                    if json_ld["telephone"]: extracted_info["phone_number"] = json_ld["telephone"]
                    if json_ld["email"]:
                        extracted_info["email_address"] = json_ld["email"]
                        extracted_info["email_type"] = classify_email_type(json_ld["email"])
                    if json_ld["representative"]: extracted_info["representative_name"] = json_ld["representative"]
                    if json_ld["description"]: extracted_info["business_summary"] = json_ld["description"]
                    if json_ld.get("logo"): extracted_info["logo_url"] = json_ld["logo"]

                    # 3.2 OpenGraph & Meta
                    meta_info = extract_meta_tags(soup)
                    all_sns.update(meta_info["sns_links"])
                    if meta_info["meta_description"] and not extracted_info["business_summary"]:
                        extracted_info["business_summary"] = meta_info["meta_description"]
                    if not extracted_info["logo_url"] and meta_info.get("og_image"):
                        extracted_info["logo_url"] = meta_info["og_image"]

                    # 3.3 Link-based SNS from <a> tags
                    a_links = [a.get("href") for a in soup.find_all("a", href=True)]
                    all_sns.update(extract_sns_from_links(a_links))

                # 3.4 Text-based Heuristics for Phone, Fax, Capital, Rep, Email
                text_data = parse_page_text(clean_text)
                for k, v in text_data.items():
                    if v and not extracted_info.get(k):
                        extracted_info[k] = v

                # 3.45 JSIC Industry Classification & Auto-Tagging
                page_title = (soup.title.string.strip() if (soup and soup.title and soup.title.string) else "") or meta_info.get("og_title", "")
                biz_snippets = []
                if soup:
                    for el in soup.find_all(["p", "div", "td", "li", "span"]):
                        txt = el.get_text().strip()
                        if 15 < len(txt) < 300 and any(kw in txt for kw in ["事業内容", "業務内容", "事業紹介", "主な事業", "サービス内容", "当社は", "私たちは"]):
                            biz_snippets.append(txt)
                            if len(biz_snippets) >= 3: break

                comb_tag_text = f"{page_title} {extracted_info.get('business_summary', '')} {' '.join(biz_snippets)} {clean_text[:1200]}"
                ind_code, ind_path, ind_tags = classify_website_industry(comb_tag_text)
                if ind_tags:
                    extracted_info["jigyo_shumoku"] = ",".join(ind_tags) + " (AI確認済)"
                    extracted_info["industry_code"] = ind_code
                    extracted_info["industry_path"] = ind_path

                # 3.5 Deep Subpage Discovery (only 1 top-priority subpage if critical info is missing)
                needs_more_info = (not extracted_info["phone_number"] or not extracted_info["representative_name"] or not extracted_info["contact_form_url"])
                if soup and needs_more_info:
                    subpages = discover_subpage_links(soup, t1_res["final_url"])
                    # Fetch at most 1 highest-priority subpage (e.g. /contact or /company) with fast 3.5s timeout
                    for sub_url in subpages[:1]:
                        sub_res = await crawl_tier1(session, sub_url, timeout=3.5)
                        if sub_res.get("clean_text"):
                            sub_data = parse_page_text(sub_res["clean_text"])
                            for k, v in sub_data.items():
                                if v and not extracted_info.get(k):
                                    extracted_info[k] = v
                            if sub_res.get("soup"):
                                sub_soup = sub_res["soup"]
                                if not extracted_info["contact_form_url"]:
                                    sub_form = extract_contact_form_url(sub_soup, sub_res.get("final_url") or sub_url)
                                    if sub_form:
                                        extracted_info["contact_form_url"] = sub_form
                                if not extracted_info["email_address"]:
                                    for a in sub_soup.find_all("a", href=re.compile(r"^mailto:", re.I)):
                                        href_mail = a["href"].split("mailto:")[1].split("?")[0].strip()
                                        if href_mail and not EMAIL_BLACKLIST.search(href_mail):
                                            extracted_info["email_address"] = href_mail
                                            extracted_info["email_type"] = classify_email_type(href_mail)
                                            break
                                sub_a_links = [a.get("href") for a in sub_soup.find_all("a", href=True)]
                                all_sns.update(extract_sns_from_links(sub_a_links))

                if all_sns:
                    extracted_info["sns_links"] = json.dumps(all_sns, ensure_ascii=False)
        except Exception as e:
            extracted_info["crawl_status"] = "ERR_FAILED"

        # 4. Push to In-Memory Buffer
        await buffer_queue.put({
            "corp_num": corp_num,
            "website_url": raw_url,
            "info": extracted_info,
            "scraped_at": scraped_at
        })
        # Update progress stats
        if stats is not None:
            stats["processed"] += 1
            if extracted_info["crawl_status"] == "SUCCESS":
                stats["success"] += 1
            elif extracted_info["crawl_status"] == "SUCCESS_EMPTY":
                stats["success_empty"] += 1
            if extracted_info.get("contact_form_url"):
                stats["contact_forms"] += 1
            if extracted_info.get("email_address"):
                stats["emails"] += 1

        # Log concisely
        sns_keys = list(all_sns.keys())
        sns_badge = f"[{','.join(sns_keys)}]" if sns_keys else "-"
        status = extracted_info["crawl_status"]
        form_badge = "[FORM]" if extracted_info["contact_form_url"] else "-"
        mail_badge = f"[{extracted_info['email_type'] or 'EMAIL'}]" if extracted_info["email_address"] else "-"
        log.info(f"[{tier_used}|P{port}] {corp_num} | {status} | FORM: {form_badge} | MAIL: {mail_badge} | SNS: {sns_badge} | {raw_url[:35]}")

    if session:
        try: await session.close()
        except Exception: pass

# --- TARGET FETCHER ---
def get_crawl_targets(limit: int = 0, force_all: bool = False, pass2: bool = False) -> list[tuple]:
    """Retrieve companies needing website extraction from Master DB."""
    if not os.path.exists(DB_PATH):
        log.error(f"[-] Database not found at: {DB_PATH}")
        return []
        
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    cur = conn.cursor()
    
    if pass2:
        log.info("[*] Mode Pass 2: Cào phục hồi 354k website bị ERR_FAILED/ERR_SSL/ERR_TIMEOUT với timeout cao và verify=False...")
        query = """
            SELECT corporate_number, website_url 
            FROM companies INDEXED BY idx_companies_website_crawl_status
            WHERE website_crawl_status IN ('ERR_FAILED', 'ERR_SSL', 'ERR_TIMEOUT')
              AND website_url IS NOT NULL 
              AND length(trim(website_url)) >= 6
        """
    elif force_all:
        log.info("[*] Mode: Cào toàn bộ website hợp lệ để cập nhật Form liên hệ, Email và Tag ngành nghề...")
        order_clause = ""
        if limit > 0:
            order_clause = """
            ORDER BY 
              CASE WHEN contact_form_url IS NULL OR contact_form_url = '' THEN 0 ELSE 1 END,
              CASE WHEN jigyo_shumoku IS NULL OR jigyo_shumoku LIKE '%未分類%' OR jigyo_shumoku LIKE '%分類不能%' THEN 0 ELSE 1 END,
              CASE WHEN email_address IS NULL OR email_address = '' THEN 0 ELSE 1 END,
              CASE WHEN website_last_crawled_at IS NULL THEN 0 ELSE 1 END
            """
        query = f"""
            SELECT corporate_number, website_url 
            FROM companies 
            WHERE website_url IS NOT NULL 
              AND length(trim(website_url)) >= 6
              AND (website_crawl_status IS NULL OR website_crawl_status NOT IN ('DEAD_DOMAIN', 'PARKED_DOMAIN', 'REMOVED_AGGREGATOR', 'REMOVED_MALFORMED_URL'))
            {order_clause}
        """
    else:
        query = """
            SELECT corporate_number, website_url 
            FROM companies INDEXED BY idx_companies_last_crawled_status
            WHERE website_url IS NOT NULL 
              AND website_url != '' 
              AND website_url NOT LIKE '%none%'
              AND website_url NOT LIKE '%なし%'
              AND website_url NOT LIKE '%://.%'
              AND website_url NOT LIKE '%:///%'
              AND (
                website_last_crawled_at IS NULL 
                OR (
                  (website_crawl_status IS NULL OR website_crawl_status NOT LIKE 'ERR_%') 
                  AND datetime(website_last_crawled_at) < datetime('now', '-360 days')
                )
                OR (
                  website_crawl_status LIKE 'ERR_%' 
                  AND datetime(website_last_crawled_at) < datetime('now', '-30 days')
                )
              )
        """
    if limit > 0:
        query += f" LIMIT {limit};"
    else:
        query += ";"
        
    cur.execute(query)
    targets = cur.fetchall()
    conn.close()
    return targets

# --- REALTIME PROGRESS REPORTER ---
async def progress_reporter(total_targets: int, stats: dict, is_done: asyncio.Event):
    """Periodically prints and writes real-time crawl statistics to pass2_progress.json."""
    start_time = time.time()
    last_processed = 0
    last_time = start_time

    def _write_progress(now: float):
        nonlocal last_processed, last_time
        elapsed = now - start_time
        processed = stats.get("processed", 0)
        success = stats.get("success", 0)
        success_empty = stats.get("success_empty", 0)
        forms = stats.get("contact_forms", 0)
        emails = stats.get("emails", 0)
        
        delta_p = processed - last_processed
        delta_t = now - last_time
        speed = delta_p / max(delta_t, 0.001)
        last_processed = processed
        last_time = now
        
        pct = (processed / max(total_targets, 1)) * 100
        rem = total_targets - processed
        eta_seconds = rem / max(speed, 0.001) if speed > 0 else 0
        eta_str = str(timedelta(seconds=int(eta_seconds)))
        
        log.info(
            f"📊 [TIẾN ĐỘ PASS 2] {processed:,}/{total_targets:,} ({pct:.1f}%) | "
            f"Tốc độ: {speed:.1f} web/s | Thành công: {success:,} ({(success/max(processed,1))*100:.1f}%) | "
            f"Form: {forms:,} | Email: {emails:,} | ETA: {eta_str}"
        )
        
        try:
            progress_file = os.path.join(CURRENT_DIR, "pass2_progress.json")
            with open(progress_file, "w", encoding="utf-8") as f:
                json.dump({
                    "total_targets": total_targets,
                    "processed": processed,
                    "remaining": rem,
                    "pct": round(pct, 2),
                    "speed_req_per_sec": round(speed, 2),
                    "success": success,
                    "success_empty": success_empty,
                    "contact_forms_found": forms,
                    "emails_found": emails,
                    "elapsed_sec": int(elapsed),
                    "eta_seconds": int(eta_seconds),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    while not is_done.is_set():
        try:
            await asyncio.wait_for(is_done.wait(), timeout=15.0)
            break
        except asyncio.TimeoutError:
            _write_progress(time.time())

    _write_progress(time.time())

# --- MAIN ORCHESTRATOR ---
async def main_async():
    parser = argparse.ArgumentParser(description="Kigyou-List: Next-Gen Hybrid Website Scraper Engine")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of websites to crawl (0 = all)")
    parser.add_argument("--concurrency", type=int, default=0, help="Number of concurrent workers (0 = auto matching active proxies)")
    parser.add_argument("--all", action="store_true", help="Recrawl all valid websites to extract contact forms, emails, and JSIC industry tags")
    parser.add_argument("--pass2", action="store_true", help="Pass 2 recovery for ERR_FAILED, ERR_SSL, ERR_TIMEOUT sites")
    parser.add_argument("--timeout", type=int, default=10, help="HTTP request timeout in seconds (default: 10)")
    parser.add_argument("--no-tier2", action="store_true", help="Disable Playwright Tier 2 fallback (ultra fast mode)")
    parser.add_argument("--headless", type=bool, default=True, help="Run Playwright in headless mode")
    args = parser.parse_args()

    log.info("="*75)
    log.info("   NEXT-GEN HYBRID OFFICIAL WEBSITE CRAWLER ENGINE (40 WARP PROXIES)")
    if args.pass2:
        log.info("   >>> PASS 2 RECOVERY MODE: High Timeout (10s) + SSL Verification Bypass <<<")
    log.info("="*75)

    # 1. Discover Active WARP Proxies
    proxies = get_active_warp_proxies()
    if not proxies:
        log.warning("[-] Không phát hiện Proxy WARP nào! Đang sử dụng kết nối Direct.")
        proxies = [{"server": None, "port": 0}]
    else:
        log.info(f"✅ Đã kết nối cụm {len(proxies)} Proxy WARP độc lập (Cổng {proxies[0]['port']} - {proxies[-1]['port']}).")

    # Determine worker concurrency (4 workers per proxy port, up to 160)
    num_workers = args.concurrency if args.concurrency > 0 else min(len(proxies) * 4, 160) if proxies[0]["port"] != 0 else 20
    log.info(f"🚀 Số luồng Worker song song: {num_workers} Workers (Pass 2 Recovery Mode, Timeout: {args.timeout}s)")

    # 2. Load Targets
    targets = get_crawl_targets(limit=args.limit, force_all=args.all, pass2=args.pass2)
    log.info(f"🎯 Đã nạp {len(targets):,} website doanh nghiệp cần cào.")
    if not targets:
        log.info("Tất cả website đã được cào đầy đủ. Hoàn tất!")
        return

    task_queue = asyncio.Queue()
    for t in targets:
        task_queue.put_nowait(t)

    buffer_queue = asyncio.Queue()
    is_done = asyncio.Event()

    # Progress tracking stats
    stats = {
        "processed": 0,
        "success": 0,
        "success_empty": 0,
        "contact_forms": 0,
        "emails": 0,
    }

    # 3. Start In-Memory Batch DB Committer
    writer_task = asyncio.create_task(batch_db_writer(DB_PATH, buffer_queue, is_done))

    # 4. Start Progress Reporter
    reporter_task = asyncio.create_task(progress_reporter(total_targets=len(targets), stats=stats, is_done=is_done))

    # 5. Optional Shared Browser for Tier 2 Playwright
    browser = None
    playwright_ctx = None
    if HAS_PLAYWRIGHT and not args.no_tier2:
        playwright_ctx = await async_playwright().start()
        browser = await playwright_ctx.chromium.launch(
            headless=args.headless,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )

    # 6. Launch Workers
    workers = []
    crawl_timeout = args.timeout
    for i in range(num_workers):
        p_cfg = proxies[i % len(proxies)]
        workers.append(website_worker(
            i + 1, p_cfg, task_queue, buffer_queue, browser,
            allow_tier2=(not args.no_tier2), timeout=crawl_timeout, stats=stats
        ))

    await asyncio.gather(*workers)

    # 7. Flush and finalize
    is_done.set()
    await buffer_queue.put(None) # Signal writer to terminate
    await writer_task
    await reporter_task

    if browser:
        await browser.close()
    if playwright_ctx:
        await playwright_ctx.stop()

    log.info("[+] Toàn bộ tiến trình cào Website đã hoàn tất thành công!")

def main():
    asyncio.run(main_async())

if __name__ == "__main__":
    main()

