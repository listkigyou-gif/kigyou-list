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
PROXY_PORTS = [40010, 40011, 40012, 40013, 40014]

# --- REGEX PATTERNS & HEURISTICS ---
PHONE_PATTERN = re.compile(
    r'(?:TEL|Tel|電話番号|電話|ＴＥＬ)\s*[：:・]?[ 　]*(0\d{1,4}[-－]?\d{1,4}[-－]?\d{4})',
    re.IGNORECASE
)
FAX_PATTERN = re.compile(
    r'(?:Fax|FAX|ファックス|F\.?A\.?X\.?)\s*[：:・]?[ 　]*(0\d{1,4}[-－]?\d{1,4}[-－]?\d{4})',
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
    r'(?:代表取締役社長|代表取締役|代表者|代表|社長|所長|役員)\s*[：:・]?[ 　]*([一-龠ぁ-ゔァ-ヴー[ 　]]{2,12})'
)

CONTACT_KEYWORDS = [
    "会社概要", "企業情報", "会社情報", "概要", "沿革", "プロフィール",
    "お問い合わせ", "問い合わせ", "コンタクト", "連絡先",
    "アクセス", "所在地", "地図",
    "Contact", "About", "Company", "Profile", "Access", "Info"
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

def extract_representative(text):
    """Extract representative name with robust checks."""
    m = REPRESENTATIVE_PATTERN.search(text)
    if m:
        rep = m.group(1).strip()
        # Clean up titles if they got caught in the match
        titles = ["代表取締役", "取締役", "代表", "社長", "所長"]
        for t in titles:
            rep = rep.replace(t, "")
        rep = re.sub(r'\s+', ' ', rep).strip()
        # Avoid matching random generic words
        if len(rep) >= 2 and len(rep) <= 8 and not any(k in rep for k in ["会社", "有限", "株式"]):
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
    data = {
        "phone_number": "",
        "fax_number": "",
        "email_address": "",
        "capital_amount": "",
        "employee_count": "",
        "representative_name": "",
        "business_summary": ""
    }
    
    # 1. Phone & Fax
    phone_match = PHONE_PATTERN.search(text)
    if phone_match:
        data["phone_number"] = to_half_width(phone_match.group(1))
        
    fax_match = FAX_PATTERN.search(text)
    if fax_match:
        data["fax_number"] = to_half_width(fax_match.group(1))
        
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
            
        # Match against keywords
        for kw in CONTACT_KEYWORDS:
            if kw in text or kw.lower() in href.lower():
                contact_urls.append(href)
                break
                
    return list(dict.fromkeys(contact_urls))  # Remove duplicates

async def crawl_single_website(page, website_url: str) -> dict:
    """Crawls a corporate website home and its subpages asynchronously to extract info."""
    log.info(f"[*] Crawling target URL: {website_url}")
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
    
    # Step 1: Fetch Homepage
    try:
        await page.goto(website_url, timeout=20000, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
    except Exception as e:
        log.warning(f"[-] Failed to load homepage {website_url}: {e}")
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
        home_text = await page.inner_text("body")
        extracted = parse_page_text(home_text)
        for k, v in extracted.items():
            result[k] = v
        
        # Step 2: Fetch subpages if some values are missing
        needs_more = not (result["phone_number"] and result["fax_number"] and result["email_address"] 
                          and result["capital_amount"] and result["employee_count"] and result["representative_name"])
        
        if needs_more:
            sub_links = await discover_contact_links(page, website_url)
            log.info(f"  [+] Found {len(sub_links)} contact/profile subpages to enrich: {sub_links[:3]}")
            
            # Crawl up to 4 subpages to gather missing details
            for link in sub_links[:4]:
                try:
                    await page.goto(link, timeout=12000, wait_until="domcontentloaded")
                    await page.wait_for_timeout(1000)
                    sub_text = await page.inner_text("body")
                    sub_data = parse_page_text(sub_text)
                    
                    # Merge missing values
                    for key in result:
                        if key != "crawl_status" and not result[key] and sub_data[key]:
                            result[key] = sub_data[key]
                            
                    # Exit early if we collected everything
                    if (result["phone_number"] and result["fax_number"] and result["email_address"] 
                        and result["capital_amount"] and result["employee_count"] and result["representative_name"]):
                        break
                except Exception:
                    continue
                    
        # Check if we retrieved any useful info
        any_found = any(result[k] for k in ["phone_number", "fax_number", "email_address", "capital_amount", "employee_count", "representative_name", "business_summary"])
        result["crawl_status"] = "SUCCESS" if any_found else "SUCCESS_EMPTY"
                    
    except Exception as e:
        log.error(f"[-] Parsing error for {website_url}: {e}")
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
        FROM companies 
        WHERE website_url IS NOT NULL 
          AND website_url != '' 
          AND website_url NOT LIKE '%none%'
          AND website_url NOT LIKE '%なし%'
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
        corp_num, website_url, info["phone_number"], info["fax_number"], info["email_address"],
        info["capital_amount"], info["employee_count"], info["representative_name"], info["business_summary"],
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
        
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        
        async def worker(worker_id):
            log.info(f"[Worker {worker_id}] Started.")
            while not queue.empty():
                # Check maximum execution duration
                elapsed = time.time() - start_time
                if max_time and elapsed > max_time:
                    log.info(f"[Worker {worker_id}] Stopping due to max duration limit ({max_time}s) exceeded.")
                    break
                    
                target = queue.get_nowait()
                corp_num, web_url = target
                
                success = False
                last_info = None
                
                # Retry loop up to 3 attempts (original attempt + 2 retries)
                for attempt in range(1, 4):
                    # Randomize proxy port and user agent for rotation on each attempt
                    proxy_port = random.choice(PROXY_PORTS)
                    ua = random.choice(USER_AGENTS)
                    vw = {"width": random.randint(1280, 1920), "height": random.randint(800, 1080)}
                    
                    try:
                        context = await browser.new_context(
                            user_agent=ua,
                            viewport=vw,
                            proxy={"server": f"socks5://127.0.0.1:{proxy_port}"}
                        )
                        page = await context.new_page()
                        
                        # Bandwidth optimizer: Intercept and abort heavy media assets
                        await page.route(
                            "**/*.{png,jpg,jpeg,gif,svg,woff,woff2,mp4,webm,ico,css}",
                            lambda r: r.abort()
                        )
                        
                        try:
                            info = await crawl_single_website(page, web_url)
                            last_info = info
                            
                            # If no error, we consider it a success and break retry loop
                            if not info.get("crawl_status", "").startswith("ERR_"):
                                save_scraped_data(corp_num, web_url, info)
                                status = "OK" if any(info.values()) else "MISS"
                                log.info(f"[+] SAVED | Corp Num: {corp_num} | Status: {status} | Phone: {info['phone_number']} | Email: {info['email_address']} (Attempt {attempt})")
                                success = True
                                break
                            else:
                                log.warning(f"[-] Attempt {attempt} failed for {web_url} with status: {info.get('crawl_status')}")
                        except Exception as ex:
                            log.error(f"[-] Exception during crawl attempt {attempt} for {corp_num}: {ex}")
                            last_info = {"crawl_status": "ERR_FAILED"}
                        finally:
                            await context.close()
                    except Exception as ex:
                        log.error(f"[-] Worker {worker_id} error creating browser context on attempt {attempt}: {ex}")
                        last_info = {"crawl_status": "ERR_FAILED"}
                        
                if not success:
                    # If all attempts failed, save the last failure status to SQLite
                    save_scraped_data(corp_num, web_url, last_info or {"crawl_status": "ERR_FAILED"})
                    log.error(f"[-] ALL 3 ATTEMPTS FAILED for {web_url} (Last Status: {last_info.get('crawl_status') if last_info else 'ERR_FAILED'})")
                
                queue.task_done()
                    
        # Spawn concurrent workers
        workers = [asyncio.create_task(worker(i+1)) for i in range(concurrency)]
        await asyncio.gather(*workers)
        
        await browser.close()
        
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
