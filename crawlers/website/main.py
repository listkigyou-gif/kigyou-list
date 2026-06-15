#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Official Website Crawler
======================================
Asynchronously crawls corporate websites from kigyou-list.db targets,
extracts contact info, scale info, and business summaries via robust regex,
and saves the raw bronze layer records to the raw_website table.
"""

import os
import sys
import re
import sqlite3
import asyncio
import logging
import argparse
import time
from datetime import datetime
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup

# Setup paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "kigyou-list.db"))

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(CURRENT_DIR, "website_crawler.log"), encoding="utf-8"),
    ],
)
log = logging.getLogger("website_crawler")

# --- USER AGENTS & PROXY POOL ---
import random
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0"
]
# PROXY_PORTS is now dynamically initialized based on concurrency in run_crawler()

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
    r'(noreply|no-reply|donotreply|example|test@|admin@sentry|wix|wordpress)',
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


CONTACT_KEYWORDS = [
    "会社概要", "企業情報", "会社情報", "概要", "沿革", "プロフィール",
    "お問い合わせ", "問い合わせ", "コンタクト", "連絡先",
    "アクセス", "所在地", "地図",
    "Contact", "About", "Company", "Profile", "Access", "Info",
    "Inquiry", "Inquiries", "Office", "Gaiyou", "Corporate", "Kaisha",
    "History", "Store", "Shop", "Branch", "Location", "Toiawase",
    "Otoiawase", "Map", "Shokai", "Outline", "Concept"
]

def to_half_width(text):
    """Convert zenkaku characters to hankaku characters."""
    if not text:
        return ""
    text = str(text)
    zenkaku = "０１２３４５６７８９－ー（）＠．，"
    hankaku = "0123456789--()@.,"
    trans_table = str.maketrans(zenkaku, hankaku)
    text = text.translate(trans_table)
    return text.strip()

def clean_value(val):
    """Basic value cleaning."""
    if not val:
        return ""
    val = val.strip().replace("\n", " ").replace("\r", " ")
    val = re.sub(r'\s+', ' ', val)
    return val

def text_from_html_fallback(html: str) -> str:
    """Fallback parser using regex if BeautifulSoup fails."""
    if not html:
        return ""
    text = re.sub(r'<[^>]+>', '\n', html)
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return '\n'.join(lines)

def clean_boilerplate_html(html_content: str) -> str:
    """Parse HTML and strip common boilerplate tags (header, footer, nav, aside, menu) to extract clean text."""
    if not html_content:
        return ""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove script, style, noscript tags
        for element in soup(["script", "style", "noscript"]):
            element.decompose()
            
        # Remove common boilerplate tags
        boilerplate_tags = ["header", "footer", "nav", "aside"]
        for tag in boilerplate_tags:
            for element in soup.find_all(tag):
                element.decompose()
                
        # Remove elements with class/id containing 'menu', 'footer', 'header', 'navigation', 'sidebar', 'nav'
        boilerplate_patterns = re.compile(r'(menu|footer|header|navigation|sidebar|nav)', re.IGNORECASE)
        for element in soup.find_all(attrs={"class": boilerplate_patterns}):
            element.decompose()
        for element in soup.find_all(attrs={"id": boilerplate_patterns}):
            element.decompose()
            
        text = soup.get_text(separator="\n")
        
        # Clean up whitespace and empty lines
        lines = []
        for line in text.split("\n"):
            line = line.strip()
            if line:
                lines.append(line)
        return "\n".join(lines)
    except Exception:
        return text_from_html_fallback(html_content)

def extract_representative(text):
    """Extract representative name with robust checks."""
    for m in REPRESENTATIVE_PATTERN.finditer(text):
        rep = m.group(1).strip()
        
        # 1. Clean common prefixes iteratively
        prefixes = ["の", "である", "からの", "会長", "代表取締役社長", "代表取締役", "取締役", "代表", "社長", "所長", "副社長", "専務", "常務", "共同", "創業者", "管理者", "から", "と"]
        changed = True
        while changed:
            changed = False
            for p in prefixes:
                if rep.startswith(p):
                    rep = rep[len(p):].strip()
                    changed = True
                    break
                    
        # 2. Clean common suffixes iteratively
        suffixes = [
            "を務めております", "を務める", "を務め", "です", "と申します", "より", "は", "が", "と", "氏", "様",
            "に就任", "に就任いたしました", "に就任しました", "が退任", "が屋号エアクリ",
            "よりみなさまへ", "よりご挨拶", "からのご挨拶", "からのメッセ", "からのごあいさつ", "からの挨拶", "の挨拶", "のインタビュ",
            "される", "して", "する", "した", "から"
        ]
        changed = True
        while changed:
            changed = False
            for s in suffixes:
                if rep.endswith(s):
                    rep = rep[:-len(s)].strip()
                    changed = True
                    break
                    
        # 3. Clean any remaining leading/trailing particles/spaces
        rep = re.sub(r'^[のとにがは\s]+', '', rep)
        rep = re.sub(r'[のはがですよりと申します\s]+$', '', rep)
        rep = rep.strip()

        # 4. Blacklist generic non-name words
        blacklist = [
            "者名", "紹介", "氏名", "挨拶", "あいさつ", "ご挨拶", "メッセージ", "メッセ", "マネージャー", "マネ", 
            "プロフィール", "プロフィ", "インタビュ", "インタビュー", "設計", "屋号", "管理者", "会長", "社長", "代表", "役員",
            "お問合せ", "お問い合わせ", "案内", "沿革", "理念", "スタッフ", "ブログ", "一覧", "コラム", "される", "参戦",
            "独り言", "参加", "経歴", "理事", "監事", "職員", "従業員"
        ]
        
        # Check if any blacklist word is in the remaining string
        is_blacklisted = False
        for b in blacklist:
            if b in rep:
                is_blacklisted = True
                break
        if is_blacklisted:
            continue
                    
        # 5. Length & Character validations
        # Japanese name is typically 2 to 6 characters after cleaning
        if len(rep) < 2 or len(rep) > 6:
            continue
            
        # Must not contain common company/structural words
        if any(k in rep for k in ["会社", "有限", "株式", "合資", "組合", "インフォ", "info", "corp", "web"]):
            continue
            
        return rep
    return ""

def extract_business_summary(text: str) -> str:
    """Extract a highly relevant business summary block or first paragraphs."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    summary_lines = []
    found_section = False
    
    for i, line in enumerate(lines):
        # Identify start of business content headings
        if re.search(r'^(?:事業内容|業務内容|主な事業|事業紹介|SERVICE|Service)$', line, re.IGNORECASE):
            found_section = True
            for j in range(i + 1, min(i + 8, len(lines))):
                # Stop if we hit other basic fields
                if re.search(r'^(?:会社概要|代表|設立|資本金|従業員|住所|TEL|FAX)$', lines[j]):
                    break
                summary_lines.append(lines[j])
            break
            
    if found_section and summary_lines:
        res = " | ".join(summary_lines[:4])
        if len(res) > 20:
            return clean_value(res)[:1000]
            
    # Fallback: Find first three long paragraphs that describe business
    paragraphs = []
    for line in lines:
        if len(line) > 25 and not any(kw in line for kw in ["TEL", "FAX", "〒", "住所", "設立", "資本金", "従業員"]):
            paragraphs.append(line)
            if len(paragraphs) >= 3:
                break
    res = " | ".join(paragraphs)
    return clean_value(res)[:1000]

def parse_page_text(text: str) -> dict:
    """Extract all relevant corporate information from page text using heuristics."""
    text = to_half_width(text)
    data = {
        "phone_number": "",
        "fax_number": "",
        "email_address": "",
        "capital_amount": "",
        "employee_count": "",
        "representative_name": "",
        "business_summary": ""
    }
    
    # 1. Phone & Fax (Prefix-based)
    phone_match = PHONE_PATTERN.search(text)
    if phone_match:
        data["phone_number"] = phone_match.group(1)
        
    fax_match = FAX_PATTERN.search(text)
    if fax_match:
        data["fax_number"] = fax_match.group(1)

    # Fallback: Find general phone/fax numbers if prefix not matched
    if not data["phone_number"] or not data["fax_number"]:
        all_numbers = []
        for m in re.finditer(r'(0\d{1,4}[-－]\d{1,4}[-－]\d{4})', text):
            num = m.group(1)
            start_pos = max(0, m.start() - 30)
            context_text = text[start_pos:m.start()].lower()
            is_fax = any(k in context_text for k in ["fax", "ファックス", "ｆａｘ", "📠"])
            all_numbers.append((num, is_fax))
            
        if not data["phone_number"]:
            for num, is_fax in all_numbers:
                if not is_fax:
                    data["phone_number"] = num
                    break
            if not data["phone_number"] and all_numbers:
                data["phone_number"] = all_numbers[0][0]
                
        if not data["fax_number"]:
            for num, is_fax in all_numbers:
                if is_fax:
                    data["fax_number"] = num
                    break
            if not data["fax_number"] and len(all_numbers) > 1:
                for num, is_fax in all_numbers:
                    if num != data["phone_number"]:
                        data["fax_number"] = num
                        break
        
    # 2. Email Address
    for m in EMAIL_PATTERN.finditer(text):
        candidate = m.group(1)
        if not EMAIL_BLACKLIST.search(candidate):
            data["email_address"] = candidate.strip()
            break
            
    # 3. Capital Amount
    cap_match = CAPITAL_PATTERN.search(text)
    if cap_match:
        data["capital_amount"] = clean_value(cap_match.group(1))
        
    # 4. Employee Count
    emp_match = EMPLOYEE_PATTERN.search(text)
    if emp_match:
        data["employee_count"] = clean_value(emp_match.group(1))
        
    # 5. Representative
    data["representative_name"] = extract_representative(text)
    
    # 6. Business Summary
    data["business_summary"] = extract_business_summary(text)
    
    return data

async def discover_contact_links(page, base_url: str) -> list[str]:
    """Find other relevant subpages like contact or profile."""
    def get_link_priority(text_val: str, href_part: str) -> int:
        text_lower = text_val.lower()
        # Priority 3 (High)
        high_kws = [
            "会社概要", "企業情報", "会社情報", "概要", "沿革", "プロフィール",
            "お問い合わせ", "問い合わせ", "コンタクト", "連絡先",
            "contact", "company", "profile", "inquiry", "inquiries", 
            "office", "corporate", "kaisha", "toiawase", "otoiawase", "outline", "gaiyou"
        ]
        for kw in high_kws:
            if kw in text_lower or kw in href_part:
                return 3
        # Priority 2 (Medium)
        med_kws = [
            "アクセス", "所在地", "地図",
            "about", "access", "location", "branch", "map", "shokai", "concept", "history"
        ]
        for kw in med_kws:
            if kw in text_lower or kw in href_part:
                return 2
        # Priority 1 (Low)
        low_kws = [
            "info", "store", "shop"
        ]
        for kw in low_kws:
            if kw in text_lower or kw in href_part:
                return 1
        return 0

    try:
        links = await page.eval_on_selector_all(
            "a[href]",
            "els => els.map(e => ({text: e.innerText, href: e.getAttribute('href')}))"
        )
    except Exception:
        return []
        
    contact_urls = []
    base_domain = urlparse(base_url).netloc
    
    for item in links:
        text = (item.get("text") or "").strip()
        href = (item.get("href") or "").strip()
        
        if not href or href.startswith("#") or href.startswith("javascript:") or href.startswith("mailto:"):
            continue
            
        # Standardize relative to absolute URLs
        if not href.startswith("http"):
            href = urljoin(base_url, href)
            
        # Restrict crawl to same host/domain
        if urlparse(href).netloc != base_domain:
            continue
            
        # Match against keywords (checking path + query + fragment to avoid domain false positives)
        parsed_href = urlparse(href)
        href_match_part = (parsed_href.path + parsed_href.query + parsed_href.fragment).lower()
        
        priority = get_link_priority(text, href_match_part)
        if priority > 0:
            contact_urls.append((href, priority))
            
    # Remove duplicates while keeping the highest priority for each unique URL
    unique_urls = {}
    for href, priority in contact_urls:
        if href not in unique_urls or priority > unique_urls[href]:
            unique_urls[href] = priority
            
    # Sort by priority score (descending)
    sorted_urls = sorted(unique_urls.items(), key=lambda x: x[1], reverse=True)
    return [url for url, _ in sorted_urls]


async def crawl_single_website(page, website_url: str, logger=log) -> dict:
    """Crawls a corporate website home and its subpages asynchronously to extract info."""
    logger.info(f"[*] Crawling target URL: {website_url}")
    result = {
        "phone_number": "",
        "fax_number": "",
        "email_address": "",
        "capital_amount": "",
        "employee_count": "",
        "representative_name": "",
        "business_summary": "",
        "crawl_status": "SUCCESS"
    }
    
    def classify_url(url: str) -> str:
        url_lower = url.lower()
        if any(kw in url_lower for kw in ["company", "about", "gaiyou", "profile", "kaisha", "history", "outline"]):
            return "COMPANY_PROFILE"
        if any(kw in url_lower for kw in ["service", "product", "jigyou", "business", "concept"]):
            return "SERVICES"
        return "OTHER_INFO"

    page_contents = {
        "COMPANY_PROFILE": [],
        "SERVICES": [],
        "HOMEPAGE": [],
        "OTHER_INFO": []
    }
    
    # Step 1: Fetch Homepage
    try:
        await page.goto(website_url, timeout=60000, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
    except Exception as e:
        logger.warning(f"[-] Failed to load homepage {website_url}: {e}")
        err_msg = str(e).lower()
        if "timeout" in err_msg:
            result["crawl_status"] = "ERR_TIMEOUT"
        elif "err_name_not_resolved" in err_msg or "dns" in err_msg:
            result["crawl_status"] = "ERR_DNS"
        elif "connection_refused" in err_msg or "err_connection_refused" in err_msg:
            result["crawl_status"] = "ERR_CONNECTION_REFUSED"
        else:
            result["crawl_status"] = "ERR_FAILED"
        return result

    try:
        # Lấy nội dung body chính với thời gian chờ nhanh (5 giây)
        try:
            home_text = await page.inner_text("body", timeout=5000)
        except Exception:
            # Fallback cho các trang dạng <frameset> (trích xuất text từ các frame con)
            frame_texts = []
            for frame in page.frames:
                try:
                    if frame == page.main_frame:
                        continue
                    text = await frame.inner_text("body", timeout=3000)
                    if text:
                        frame_texts.append(text)
                except Exception:
                    continue
            home_text = "\n".join(frame_texts) if frame_texts else ""

        extracted = parse_page_text(home_text)
        for k, v in extracted.items():
            if k != "business_summary":
                result[k] = v
            
        # Extract from tel: links on homepage
        try:
            tel_links = await page.eval_on_selector_all(
                "a[href^='tel:']",
                "els => els.map(e => e.getAttribute('href'))"
            )
            for link in tel_links:
                clean_num = to_half_width(link.replace("tel:", "").strip())
                clean_num = re.sub(r"[^\d\-]", "", clean_num)
                if len(clean_num) >= 9:
                    result["phone_number"] = clean_num
                    break
        except Exception:
            pass
            
        # Extract homepage clean text
        try:
            home_html_contents = []
            main_html = await page.content()
            if main_html:
                home_html_contents.append(main_html)
            for frame in page.frames:
                if frame == page.main_frame:
                    continue
                try:
                    f_html = await frame.content()
                    if f_html:
                        home_html_contents.append(f_html)
                except Exception:
                    continue
            home_cleaned = [clean_boilerplate_html(html) for html in home_html_contents]
            home_cleaned = [t for t in home_cleaned if t]
            home_clean_text = "\n".join(home_cleaned) if home_cleaned else ""
            if home_clean_text:
                page_contents["HOMEPAGE"].append(home_clean_text)
        except Exception as e:
            logger.warning(f"[-] Error cleaning homepage text: {e}")
        
        # Step 2: Fetch subpages to gather clean text and missing details
        sub_links = await discover_contact_links(page, website_url)
        if sub_links:
            logger.info(f"  [+] Found {len(sub_links)} contact/profile subpages to enrich: {sub_links[:3]}")
            
            # Crawl up to 4 subpages to gather details
            for link in sub_links[:4]:
                try:
                    # Politeness delay between subpage transitions
                    await asyncio.sleep(random.uniform(0.5, 1.5))
                    await page.goto(link, timeout=30000, wait_until="domcontentloaded")
                    await page.wait_for_timeout(1000)
                    
                    try:
                        sub_text = await page.inner_text("body")
                    except Exception:
                        frame_texts = []
                        for frame in page.frames:
                            try:
                                if frame == page.main_frame:
                                    continue
                                t = await frame.inner_text("body", timeout=3000)
                                if t:
                                    frame_texts.append(t)
                            except Exception:
                                continue
                        sub_text = "\n".join(frame_texts) if frame_texts else ""
                        
                    sub_data = parse_page_text(sub_text)
                    
                    # Merge missing values
                    for key in result:
                        if key not in ("crawl_status", "business_summary") and not result[key] and sub_data[key]:
                            result[key] = sub_data[key]
                            
                    # Extract from tel: links on subpages
                    try:
                        sub_tel_links = await page.eval_on_selector_all(
                            "a[href^='tel:']",
                            "els => els.map(e => e.getAttribute('href'))"
                        )
                        for t_link in sub_tel_links:
                            clean_num = to_half_width(t_link.replace("tel:", "").strip())
                            clean_num = re.sub(r"[^\d\-]", "", clean_num)
                            if len(clean_num) >= 9 and not result["phone_number"]:
                                result["phone_number"] = clean_num
                                break
                    except Exception:
                        pass
                        
                    # Extract and classify clean text for AI business summary
                    try:
                        sub_html_contents = []
                        main_html = await page.content()
                        if main_html:
                            sub_html_contents.append(main_html)
                        for frame in page.frames:
                            if frame == page.main_frame:
                                continue
                            try:
                                f_html = await frame.content()
                                if f_html:
                                    sub_html_contents.append(f_html)
                            except Exception:
                                continue
                        sub_cleaned = [clean_boilerplate_html(html) for html in sub_html_contents]
                        sub_cleaned = [t for t in sub_cleaned if t]
                        sub_clean_text = "\n".join(sub_cleaned) if sub_cleaned else ""
                        if sub_clean_text:
                            cat = classify_url(link)
                            page_contents[cat].append(sub_clean_text)
                    except Exception as e:
                        logger.warning(f"[-] Error cleaning subpage text for {link}: {e}")
                except Exception as e:
                    logger.warning(f"[-] Error crawling subpage {link}: {e}")
                    continue
                    
        # Compile the final business_summary from classified pages up to 10,000 characters
        summary_parts = []
        categories_order = ["COMPANY_PROFILE", "SERVICES", "HOMEPAGE", "OTHER_INFO"]
        for cat in categories_order:
            if page_contents[cat]:
                cat_text = "\n\n".join(page_contents[cat]).strip()
                if cat_text:
                    summary_parts.append(f"--- [{cat}] ---\n{cat_text}")
                    
        final_summary = "\n\n".join(summary_parts).strip()
        result["business_summary"] = final_summary[:10000]
        
        # Fallback if final_summary is completely empty
        if not result["business_summary"] and extracted.get("business_summary"):
            result["business_summary"] = extracted["business_summary"][:10000]
                    
        # Check if we retrieved any useful info
        any_found = any(result[k] for k in ["phone_number", "fax_number", "email_address", "capital_amount", "employee_count", "representative_name", "business_summary"])
        result["crawl_status"] = "SUCCESS" if any_found else "SUCCESS_EMPTY"
                    
    except Exception as e:
        logger.error(f"[-] Parsing error for {website_url}: {e}")
        result["crawl_status"] = "ERR_PARSING_FAILED"
        
    return result

def get_crawl_targets(limit: int) -> list[tuple]:
    """Query targets from local SQLite database companies table."""
    if not os.path.exists(DB_PATH):
        log.error(f"[-] Master database not found at: {DB_PATH}")
        sys.exit(1)
        
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    cur = conn.cursor()
    
    # Query companies with website URLs that haven't been crawled recently (or never)
    # Success/empty status retry: 360 days; error status retry: 30 days.
    base_query = """
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
    if limit is not None and limit > 0:
        query = base_query + " LIMIT ?;"
        cur.execute(query, (limit,))
    else:
        query = base_query + ";"
        cur.execute(query)
        
    targets = cur.fetchall()
    conn.close()
    return targets

def save_scraped_data(corp_num: str, website_url: str, info: dict):
    """Idempotently save crawled bronze data to raw_website and update companies master table."""
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    cur = conn.cursor()
    
    # Ensure unique index exists on raw_website(corporate_number)
    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_website_corp_num ON raw_website(corporate_number);")
    
    # Insert or Replace in Staging table
    insert_sql = """
        INSERT OR REPLACE INTO raw_website (
            corporate_number, website_url, phone_number, fax_number, email_address,
            capital_amount, employee_count, representative_name, business_summary, scraped_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """
    scraped_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cur.execute(insert_sql, (
        corp_num, website_url, 
        info.get("phone_number", ""), 
        info.get("fax_number", ""), 
        info.get("email_address", ""),
        info.get("capital_amount", ""), 
        info.get("employee_count", ""), 
        info.get("representative_name", ""), 
        info.get("business_summary", ""),
        scraped_at
    ))
    
    # Update companies master crawl status timestamp and crawl status
    cur.execute("""
        UPDATE companies 
        SET website_last_crawled_at = ?,
            website_crawl_status = ?
        WHERE corporate_number = ?;
    """, (scraped_at, info.get("crawl_status"), corp_num))
    
    conn.commit()
    conn.close()

async def run_crawler(limit: int, concurrency: int, headless: bool, max_time: int = 7200):
    """Main crawler orchestration loop."""
    log.info("="*60)
    log.info("      OFFICIAL WEBSITE CRAWLER ENGINE STARTING")
    log.info("="*60)
    
    start_time = time.time()
    targets = get_crawl_targets(limit)
    log.info(f"[+] Loaded {len(targets)} target websites from companies table.")
    
    if not targets:
        log.info("[*] No targets to crawl. Exiting...")
        return
        
    queue = asyncio.Queue()
    for t in targets:
        queue.put_nowait(t)
        
    # Dynamically initialize the proxy ports based on concurrency and max generated containers (50)
    MAX_PROXIES = 50
    BASE_PORT = 41000
    num_proxies = min(concurrency, MAX_PROXIES)
    all_ports = list(range(BASE_PORT, BASE_PORT + num_proxies))
    log.info(f"[+] Proxy pool initialized: {len(all_ports)} ports ({BASE_PORT} to {BASE_PORT + len(all_ports) - 1})")
    
    async with async_playwright() as p:
        async def worker(worker_id):
            # Dedicated logger for each worker (writes cleanly to logs/worker_xx.log)
            logs_dir = os.path.join(CURRENT_DIR, "logs")
            os.makedirs(logs_dir, exist_ok=True)
            
            worker_log = logging.getLogger(f"worker_{worker_id:02d}")
            worker_log.setLevel(logging.INFO)
            worker_log.propagate = False  # Avoid duplicating worker logs to the global website_crawler.log
            
            if not worker_log.handlers:
                # File Handler for worker-specific file
                fh = logging.FileHandler(os.path.join(logs_dir, f"worker_{worker_id:02d}.log"), encoding="utf-8")
                fh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
                worker_log.addHandler(fh)
                
                # Stream Handler to console (with prefix so stdout stays readable)
                sh = logging.StreamHandler()
                sh.setFormatter(logging.Formatter(f"%(asctime)s [Worker {worker_id:02d}] [%(levelname)s] %(message)s"))
                worker_log.addHandler(sh)
                
            worker_log.info(f"Worker started.")
            
            browser = None
            targets_crawled = 0
            
            try:
                while not queue.empty():
                    # Check maximum execution duration
                    elapsed = time.time() - start_time
                    if max_time and elapsed > max_time:
                        worker_log.info(f"Stopping due to max duration limit ({max_time}s) exceeded.")
                        break
                        
                    target = queue.get_nowait()
                    corp_num, web_url = target
                    
                    # Periodic browser restart to prevent memory leak
                    if browser is None or targets_crawled >= 200:
                        if browser is not None:
                            worker_log.info(f"Recreating browser to prevent memory leaks (crawled {targets_crawled} targets).")
                            try:
                                await browser.close()
                            except Exception:
                                pass
                            browser = None
                        try:
                            browser = await p.chromium.launch(headless=headless)
                            targets_crawled = 0
                        except Exception as e:
                            worker_log.error(f"[-] Failed to launch browser process: {e}")
                            save_scraped_data(corp_num, web_url, {"crawl_status": "ERR_FAILED"})
                            queue.task_done()
                            continue
                            
                    targets_crawled += 1
                    success = False
                    last_info = None
                
                    # Retry loop up to 3 attempts (original attempt + 2 retries)
                    for attempt in range(1, 4):
                        # Dedicated proxy port on first attempt, rotate randomly on retries
                        if attempt == 1:
                            proxy_port = BASE_PORT + ((worker_id - 1) % len(all_ports))
                        else:
                            proxy_port = random.choice(all_ports)
                            
                        ua = random.choice(USER_AGENTS)
                        vw = {"width": random.randint(1280, 1920), "height": random.randint(800, 1080)}
                        
                        try:
                            # Disable JavaScript on first attempt to prevent infinite loop hangs, enable on retries
                            js_enabled = (attempt > 1)
                            
                            # Stealth browser context configuration
                            context = await browser.new_context(
                                user_agent=ua,
                                viewport=vw,
                                proxy={"server": f"socks5://127.0.0.1:{proxy_port}"},
                                locale="ja-JP",
                                timezone_id="Asia/Tokyo",
                                extra_http_headers={
                                    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8"
                                },
                                java_script_enabled=js_enabled
                            )
                            # WebDriver spoofing init script (only if JS is enabled)
                            if js_enabled:
                                await context.add_init_script("""
                                    Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                                    Object.defineProperty(navigator, 'deviceMemory', {get: () => 8});
                                    Object.defineProperty(navigator, 'hardwareConcurrency', {get: () => 8});
                                """)
                            page = await context.new_page()
                            
                            # Strict first-party routing to avoid third-party script/tracker hangs
                            from urllib.parse import urlparse
                            target_domain = urlparse(web_url).netloc.lower()
                            if target_domain.startswith("www."):
                                target_domain = target_domain[4:]
                                
                            async def route_handler(route):
                                req_url = route.request.url.lower()
                                try:
                                    parsed = urlparse(req_url)
                                    req_domain = parsed.netloc.lower()
                                    # Only allow first-party requests
                                    if req_domain == target_domain or req_domain.endswith("." + target_domain):
                                        if any(req_url.endswith(ext) or (ext + "?") in req_url for ext in [".png", ".jpg", ".jpeg", ".gif", ".svg", ".woff", ".woff2", ".mp4", ".webm", ".ico", ".css"]):
                                            await route.abort()
                                        else:
                                            await route.continue_()
                                    else:
                                        await route.abort()
                                except Exception:
                                    await route.continue_()
                                    
                            await page.route("**/*", route_handler)
                            
                            try:
                                info = await asyncio.wait_for(
                                    crawl_single_website(page, web_url, worker_log),
                                    timeout=120.0
                                )
                                last_info = info
                                
                                # Check if we successfully extracted any contact details
                                any_found = any(info.get(k) for k in ["phone_number", "fax_number", "email_address", "capital_amount", "employee_count", "representative_name", "business_summary"])
                                
                                # If successful and (we found data OR it is already the last attempt)
                                if not info.get("crawl_status", "").startswith("ERR_") and (any_found or attempt == 3):
                                    save_scraped_data(corp_num, web_url, info)
                                    status = "OK" if any_found else "MISS"
                                    worker_log.info(f"[+] SAVED | Corp Num: {corp_num} | Status: {status} | Phone: {info['phone_number']} | Fax: {info['fax_number']} | Email: {info['email_address']} (Attempt {attempt} using Proxy Port {proxy_port})")
                                    success = True
                                    break
                                else:
                                    if not info.get("crawl_status", "").startswith("ERR_"):
                                        worker_log.warning(f"[-] Attempt {attempt} succeeded but no data found (empty render) for {web_url}. Retrying with JS enabled.")
                                    else:
                                        worker_log.warning(f"[-] Attempt {attempt} failed for {web_url} on Proxy Port {proxy_port} with status: {info.get('crawl_status')}")
                            except asyncio.TimeoutError:
                                worker_log.warning(f"[-] Timeout of 120s exceeded during crawl attempt {attempt} for {corp_num} on Proxy Port {proxy_port}")
                                last_info = {"crawl_status": "ERR_TIMEOUT"}
                            except Exception as ex:
                                worker_log.error(f"[-] Exception during crawl attempt {attempt} for {corp_num} on Proxy Port {proxy_port}: {ex}")
                                last_info = {"crawl_status": "ERR_FAILED"}
                                if "closed" in str(ex).lower() or "connection" in str(ex).lower():
                                    browser = None
                            finally:
                                try:
                                    await context.close()
                                except Exception:
                                    pass
                        except Exception as ex:
                            worker_log.error(f"[-] Error creating browser context on attempt {attempt} using Proxy Port {proxy_port}: {ex}")
                            last_info = {"crawl_status": "ERR_FAILED"}
                            browser = None
                            
                    if not success:
                        # If all attempts failed, save the last failure status to SQLite
                        save_scraped_data(corp_num, web_url, last_info or {"crawl_status": "ERR_FAILED"})
                        worker_log.error(f"[-] ALL 3 ATTEMPTS FAILED for {web_url} (Last Status: {last_info.get('crawl_status') if last_info else 'ERR_FAILED'})")
                    
                    queue.task_done()
            finally:
                if browser is not None:
                    try:
                        await browser.close()
                    except Exception:
                        pass
                worker_log.info("Worker stopped.")
                    
        # Spawn concurrent workers
        workers = [asyncio.create_task(worker(i+1)) for i in range(concurrency)]
        await asyncio.gather(*workers)
        
    log.info("="*60)
    log.info("      WEBSITE CRAWLER OPERATION COMPLETED SUCCESSFULLY")
    log.info("="*60)

def main():
    parser = argparse.ArgumentParser(description="Official Website Crawler for Kigyou-list")
    parser.add_argument("--limit", type=int, default=50, help="Max number of websites to crawl")
    parser.add_argument("--concurrency", type=int, default=5, help="Number of concurrent browsers")
    parser.add_argument("--headless", type=str, default="true", help="Run browser in headless mode ('true' or 'false')")
    parser.add_argument("--max-time", type=int, default=7200, help="Max duration in seconds to run the crawler (default: 7200s = 2h)")
    
    args = parser.parse_args()
    headless_bool = args.headless.lower() == "true"
    
    asyncio.run(run_crawler(args.limit, args.concurrency, headless_bool, args.max_time))

if __name__ == "__main__":
    main()
