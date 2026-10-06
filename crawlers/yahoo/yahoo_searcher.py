"""
Yahoo Map & Web Searcher (High-Concurrency Multi-WARP Engine)
-------------------------------------------------------------
Tự động tìm kiếm trang web chính thức, số điện thoại, và địa chỉ doanh nghiệp
qua Yahoo Japan Search & Maps, hỗ trợ cụm Proxy WARP đa luồng và kết nối trực tiếp SQLite DB.

Tính năng nổi bật:
- Đa luồng: 1 Worker = 1 Proxy Cloudflare WARP riêng biệt (tự động nhận diện cụm 40051-40060 + 40001).
- Trực tiếp Database: Tự động lọc doanh nghiệp thiếu website/SĐT từ kigyou-list.db.
- Chống chặn IP (Playwright Stealth + Proactive Rotation qua docker restart).
- Hàng đợi thử lại bền vững (yahoo_retry_queue.csv).
"""

import asyncio
import csv
import os
import re
import sys
import time
import socket
import sqlite3
import argparse
import logging
import random
import subprocess
from urllib.parse import quote
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "kigyou-list.db"))
HW_DB_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "hellowork", "data", "hellowork.db"))

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0"
]

DIRECTORY_BLACKLIST = [
    "cnavi.g-search.or.jp", "big-advance.site", "startup-db.com", 
    "navitime.co.jp", "itownpage.jp", "baseconnect.in", 
    "mapion.co.jp", "companydata.tsujigawa.com", "toukibo.ai-con.lawyer",
    "ivry.jp", "bgent.net", "ekiten.jp", "toushin.com", "yahoo.co.jp",
    "nikkei.com", "yelp.com", "info.gbiz.go.jp", "alarmbox.jp",
    "d-and-b.com", "tenshoku.news", "en-hyouban.com", "m-osaka.com",
    "facebook.com", "twitter.com", "x.com", "instagram.com", "youtube.com"
]

log = logging.getLogger("yahoo_searcher")

def parse_args():
    parser = argparse.ArgumentParser(description="Yahoo Searcher High-Concurrency Engine")
    parser.add_argument("--input", default="db", help="Input source: 'db' (default) or CSV file path")
    parser.add_argument("--output", default="data/companies_basic.csv", help="CSV backup output path")
    parser.add_argument("--headless", action="store_true", default=True, help="Run headless browser")
    parser.add_argument("--proxy-port", type=int, default=0, help="Specific proxy port (0 = Auto-detect WARP cluster)")
    parser.add_argument("--limit", type=int, default=0, help="Max companies to search (0 = all pending)")
    parser.add_argument("--log-file", default="yahoo_searcher.log", help="Log file path")
    return parser.parse_args()

def get_active_yahoo_proxies():
    """Tự động phát hiện các cổng Cloudflare WARP proxy SOCKS5 cho Yahoo."""
    active = []
    # Quét dải proxy chuyên dụng cho Yahoo: 40051 -> 40060, cộng thêm 40001
    candidate_ports = list(range(40051, 40061)) + [40001]
    for port in candidate_ports:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.2)
                if s.connect_ex(('127.0.0.1', port)) == 0:
                    active.append({
                        "server": f"socks5://127.0.0.1:{port}",
                        "port": port,
                        "container": f"warp-{port}"
                    })
        except Exception:
            pass
    return active

async def get_current_ip(port: int):
    """Lấy IP hiện tại của container qua proxy."""
    ip_services = ["https://api.ipify.org", "https://icanhazip.com", "https://ifconfig.me"]
    def _run_curl():
        for service in ip_services:
            try:
                cmd = ["curl.exe", "-s", "--proxy", f"socks5h://127.0.0.1:{port}", service]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=6)
                ip = res.stdout.strip()
                if ip and not any(x in ip.lower() for x in ["error", "html", "<"]):
                    return ip
            except Exception:
                continue
        return "Unknown"
    return await asyncio.to_thread(_run_curl)

async def rotate_proxy(port: int):
    """Xoay IP độc lập cho container warp-{port}."""
    container_name = f"warp-{port}"
    old_ip = await get_current_ip(port)
    log.info(f"🔄 [ROTATION-{port}] Bắt đầu xoay IP cho {container_name} (IP cũ: {old_ip})...")
    
    for attempt in range(3):
        try:
            def _restart():
                subprocess.run(["docker", "restart", container_name], capture_output=True, timeout=25)
            await asyncio.to_thread(_restart)
            
            # Chờ cổng online
            t_end = time.time() + 20
            ready = False
            while time.time() < t_end:
                try:
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                        s.settimeout(0.5)
                        if s.connect_ex(('127.0.0.1', port)) == 0:
                            ready = True
                            break
                except Exception:
                    pass
                await asyncio.sleep(1.0)
                
            await asyncio.sleep(2.0)
            new_ip = await get_current_ip(port)
            if new_ip != "Unknown" and new_ip != old_ip:
                log.info(f"✅ [ROTATION-{port}] Thành công! {old_ip} -> {new_ip}")
                return True
            log.warning(f"⚠️ [ROTATION-{port}] IP mới ({new_ip}) chưa đổi, thử lại...")
        except Exception as e:
            log.error(f"❌ [ROTATION-{port}] Lỗi: {e}")
            await asyncio.sleep(5)
            
    return False

def load_companies_from_db(limit: int = 0):
    """Lấy danh sách các công ty thiếu Website hoặc SĐT trực tiếp từ Master DB và HelloWork DB."""
    if not os.path.exists(DB_PATH):
        log.error(f"Không tìm thấy database tại {DB_PATH}")
        return []
        
    targets = []
    seen_corps = set()

    # 1. Ưu tiên cao nhất: Các công ty đang tuyển dụng từ HelloWork mà thiếu Website
    if os.path.exists(HW_DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH, timeout=40.0)
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute(f"ATTACH DATABASE '{HW_DB_PATH}' AS hw")
            
            # 1.1 Đồng bộ tức thì: nếu Master DB đã có sẵn website, cập nhật ngay sang HelloWork DB
            try:
                sync_sql = """
                    UPDATE hw.companies
                    SET website = (
                        SELECT c.website_url FROM companies c 
                        WHERE c.corporate_number = hw.companies.corporate_number
                    )
                    WHERE (website IS NULL OR website = '' OR website LIKE '%なし%')
                      AND corporate_number IN (
                          SELECT c.corporate_number FROM companies c 
                          WHERE c.website_url IS NOT NULL AND c.website_url != '' AND c.website_url NOT LIKE '%なし%'
                      );
                """
                synced = conn.execute(sync_sql).rowcount
                if synced > 0:
                    conn.commit()
                    log.info(f"⚡ [INSTANT SYNC] Đã đồng bộ tức thì {synced:,} Website từ Master DB sang HelloWork DB!")
            except Exception as e_sync:
                log.warning(f"Bỏ qua bước instant sync: {e_sync}")

            # 1.2 Lấy các công ty HelloWork thực sự chưa có Website ở cả 2 DB
            hw_query = """
                SELECT hw_c.corporate_number, hw_c.company_name, c.prefecture_name, c.city_name, COALESCE(hw_c.address, c.full_address)
                FROM hw.companies hw_c
                LEFT JOIN companies c ON hw_c.corporate_number = c.corporate_number
                WHERE (hw_c.website IS NULL OR hw_c.website = '' OR hw_c.website LIKE '%なし%')
                  AND (c.website_url IS NULL OR c.website_url = '' OR c.website_url LIKE '%なし%')
            """
            if limit > 0:
                hw_query += f" LIMIT {limit}"
                
            for r in conn.execute(hw_query).fetchall():
                c_num = str(r[0] or "")
                if c_num and c_num not in seen_corps:
                    seen_corps.add(c_num)
                    targets.append({
                        "corp_num": c_num,
                        "name": str(r[1] or ""),
                        "prefecture": str(r[2] or ""),
                        "city": str(r[3] or ""),
                        "address": str(r[4] or ""),
                        "corp_type": "",
                        "corp_type_name": ""
                    })
            conn.close()
            log.info(f"🎯 Đã nạp {len(targets):,} công ty tuyển dụng HelloWork đang thiếu Website vào hàng đợi.")
        except Exception as e:
            log.warning(f"Lỗi khi liên kết HelloWork DB: {e}")

    # 2. Nếu chưa đạt limit hoặc cào rộng: Lấy thêm các công ty trong Master DB chưa từng cào Yahoo
    remaining_limit = limit - len(targets) if limit > 0 else 0
    if limit == 0 or remaining_limit > 0:
        try:
            conn = sqlite3.connect(DB_PATH, timeout=40.0)
            conn.execute("PRAGMA journal_mode=WAL;")
            c = conn.cursor()
            query = """
                SELECT corporate_number, company_name, prefecture_name, city_name, full_address
                FROM companies
                WHERE (website_url IS NULL OR website_url = '' OR website_url LIKE '%なし%' OR website_url LIKE '%none%')
                  AND yahoo_last_crawled_at IS NULL
                ORDER BY rowid ASC
            """
            if remaining_limit > 0:
                query += f" LIMIT {remaining_limit}"
            elif limit == 0:
                query += " LIMIT 50000"

            c.execute(query)
            for r in c.fetchall():
                c_num = str(r[0] or "")
                if c_num and c_num not in seen_corps:
                    seen_corps.add(c_num)
                    targets.append({
                        "corp_num": c_num,
                        "name": str(r[1] or ""),
                        "prefecture": str(r[2] or ""),
                        "city": str(r[3] or ""),
                        "address": str(r[4] or ""),
                        "corp_type": "",
                        "corp_type_name": ""
                    })
            conn.close()
        except Exception as e:
            log.warning(f"Lỗi khi đọc Master DB: {e}")

    log.info(f"Tổng số doanh nghiệp được đưa vào hàng đợi Yahoo Search: {len(targets):,} công ty.")
    return targets

def save_result_to_db(result: dict):
    """Lưu kết quả cào được trực tiếp vào companies, raw_yahoo và hellowork.db."""
    corp_num = result.get("corp_num")
    if not corp_num:
        return

    web = (result.get("website") or "").strip()
    phone = (result.get("phone") or "").strip()
    y_name = (result.get("y_name") or "").strip()
    y_addr = (result.get("y_address") or "").strip()
    c_name = (result.get("name") or "").strip()

    # 1. Cập nhật Master DB
    if os.path.exists(DB_PATH):
        for attempt in range(5):
            try:
                conn = sqlite3.connect(DB_PATH, timeout=30.0)
                conn.execute("PRAGMA journal_mode=WAL;")
                c = conn.cursor()

                # Cập nhật bảng companies
                c.execute("""
                    UPDATE companies
                    SET yahoo_last_crawled_at = CURRENT_TIMESTAMP,
                        website_url = CASE WHEN (website_url IS NULL OR website_url = '' OR website_url LIKE '%なし%') AND ? != '' THEN ? ELSE website_url END,
                        phone_number = CASE WHEN (phone_number IS NULL OR phone_number = '') AND ? != '' THEN ? ELSE phone_number END
                    WHERE corporate_number = ?;
                """, (web, web, phone, phone, corp_num))

                # Lưu bản ghi thô vào raw_yahoo
                c.execute("""
                    INSERT OR REPLACE INTO raw_yahoo 
                    (corporate_number, company_name, yahoo_name, yahoo_address, phone_number, website_url, scraped_at)
                    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
                """, (corp_num, c_name, y_name, y_addr, phone, web))

                conn.commit()
                conn.close()
                break
            except sqlite3.OperationalError:
                time.sleep(random.uniform(0.3, 0.8))
            except Exception as e:
                log.warning(f"Lỗi khi lưu DB cho {corp_num}: {e}")
                break

    # 2. Cập nhật đồng bộ sang HelloWork DB nếu tìm được website
    if web and os.path.exists(HW_DB_PATH):
        for attempt in range(5):
            try:
                hw_conn = sqlite3.connect(HW_DB_PATH, timeout=20.0)
                hw_conn.execute("PRAGMA journal_mode=WAL;")
                hw_conn.execute("""
                    UPDATE companies 
                    SET website = ? 
                    WHERE corporate_number = ? 
                      AND (website IS NULL OR website = '' OR website LIKE '%なし%');
                """, (web, corp_num))
                hw_conn.commit()
                hw_conn.close()
                break
            except sqlite3.OperationalError:
                time.sleep(random.uniform(0.2, 0.5))
            except Exception:
                break

def save_to_retry_queue(retry_file: str, company: dict):
    try:
        os.makedirs(os.path.dirname(retry_file) or ".", exist_ok=True)
        existing = set()
        if os.path.exists(retry_file):
            with open(retry_file, "r", encoding="utf-8-sig") as f:
                for r in csv.DictReader(f):
                    existing.add(r.get("corp_num", ""))
        c_num = company.get("corp_num", "")
        if c_num and c_num not in existing:
            write_header = not os.path.exists(retry_file) or os.path.getsize(retry_file) == 0
            with open(retry_file, "a", newline="", encoding="utf-8-sig") as f:
                writer = csv.DictWriter(f, fieldnames=["corp_num", "name", "address", "prefecture", "city", "corp_type", "corp_type_name"], extrasaction="ignore")
                if write_header: writer.writeheader()
                writer.writerow(company)
    except Exception:
        pass

def remove_from_retry_queue(retry_file: str, corp_num: str):
    try:
        if not os.path.exists(retry_file) or not corp_num: return
        rows = []
        with open(retry_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            fields = reader.fieldnames
            for r in reader:
                if r.get("corp_num") != corp_num: rows.append(r)
        with open(retry_file, "w", newline="", encoding="utf-8-sig") as f:
            if fields:
                writer = csv.DictWriter(f, fieldnames=fields)
                writer.writeheader()
                writer.writerows(rows)
    except Exception:
        pass

async def search_and_extract(page, company: dict) -> dict:
    """Bóc tách thông tin từ Yahoo Search và Yahoo Maps."""
    result = company.copy()
    result.update({"gid": "", "y_name": "", "y_address": "", "phone": "", "website": "", "is_blocked": False})
    
    keyword = f"{company['name']} {company.get('prefecture', '')}{company.get('city', '')}".strip()
    search_url = f"https://search.yahoo.co.jp/search?p={quote(keyword)}"
    
    try:
        response = await page.goto(search_url, timeout=25000, wait_until="domcontentloaded")
        await page.mouse.wheel(0, random.randint(200, 500))
        await asyncio.sleep(random.uniform(0.8, 1.5))
        
        status = response.status if response else 0
        html = await page.content()
        
        block_keywords = ["Access Denied", "一時的にアクセスを制限", "robot check", "captcha"]
        is_blocked = status in [403, 429] or any(kw.lower() in html.lower() for kw in block_keywords)
        
        if is_blocked:
            result["is_blocked"] = True
            return result

        soup = BeautifulSoup(html, 'html.parser')
        
        # 1. Thẻ Yahoo! Maps Card (.sw-MapCard)
        for spot in soup.select('.sw-MapCard, .AnswerLocalSpot, .AnswerGourmetListLocoMain'):
            spot_text = spot.get_text(separator=' ')
            if "住所：" in spot_text:
                addr_part = spot_text.split("住所：")[1]
                for d in ["TEL", "電話", "道案内", "公式サイト", "すべて見る", "最寄り駅"]:
                    addr_part = addr_part.split(d)[0]
                result["y_address"] = addr_part.strip()
            
            for link in spot.find_all('a'):
                if any(kw in link.get_text() for kw in ["公式サイト", "Webサイト"]):
                    href = link.get('href')
                    if href: result["website"] = href
                    break
            
            phone_m = re.search(r'(?<!\d)(0\d{1,4}[－\-]\d{1,4}[－\-]\d{3,4})(?!\d)', spot_text)
            if phone_m:
                result["phone"] = phone_m.group(1).replace("－", "-")
                break

        # 2. Tìm kiếm tự nhiên Fallback (nếu chưa có SĐT)
        if not result["phone"]:
            c_name_clean = re.sub(r'\s+', '', company['name'])
            for card in soup.select('.sw-Card'):
                card_text = re.sub(r'\s+', '', card.get_text(separator=' '))
                if c_name_clean in card_text:
                    phone_m = re.search(r'(?<!\d)(0\d{1,4}[－\-]\d{1,4}[－\-]\d{3,4})(?!\d)', card.get_text())
                    if phone_m:
                        result["phone"] = phone_m.group(1).replace("－", "-")
                        break

        # 3. Tìm link website tự nhiên nếu Map card chưa có
        if not result["website"]:
            for a in soup.select('.sw-Card a'):
                href = a.get('href', '')
                if href.startswith("http") and not any(bad in href.lower() for bad in DIRECTORY_BLACKLIST):
                    result["website"] = href
                    break

        # 4. GID Map
        for a in soup.select('a[href*="map.yahoo.co.jp/place?gid="]'):
            gid_m = re.search(r'gid=([A-Za-z0-9_\-]+)', a.get('href', ''))
            if gid_m:
                result["gid"] = gid_m.group(1)
                break

    except Exception as e:
        raise e

    return result

async def run_worker(worker_id: int, proxy_cfg: dict, queue: asyncio.Queue, browser, output_file: str, retry_queue_file: str, csv_lock: asyncio.Lock):
    """Một Worker độc lập vận hành trên 1 IP WARP duy nhất."""
    port = proxy_cfg["port"]
    proxy_url = proxy_cfg["server"]
    
    current_context = None
    request_counter = 0
    rotate_threshold = random.randint(40, 80)

    async def create_context():
        nonlocal current_context
        if current_context:
            try: await current_context.close()
            except Exception: pass
        ua = random.choice(USER_AGENTS)
        ctx = await browser.new_context(
            user_agent=ua,
            proxy={"server": proxy_url},
            locale="ja-JP",
            timezone_id="Asia/Tokyo",
            extra_http_headers={"Accept-Language": "ja,en-US;q=0.9,en;q=0.8", "Referer": "https://www.yahoo.co.jp/"}
        )
        await ctx.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
        current_context = ctx
        return ctx

    await create_context()
    log.info(f"🟢 [WORKER-{worker_id:02d}] Sẵn sàng trên cổng {port} | Ngưỡng xoay: {rotate_threshold} reqs")

    while not queue.empty():
        try:
            company = await queue.get()
        except asyncio.QueueEmpty:
            break

        # Giãn cách an toàn 3.5 - 6.0 giây giữa các request trên cùng 1 IP
        await asyncio.sleep(random.uniform(3.5, 6.0))

        # Kiểm tra xoay IP chủ động
        request_counter += 1
        if request_counter >= rotate_threshold:
            log.info(f"🕒 [WORKER-{worker_id:02d}] Đã đạt {request_counter}/{rotate_threshold} requests. Đang xoay IP...")
            try: await current_context.close()
            except Exception: pass
            await rotate_proxy(port)
            await create_context()
            request_counter = 0
            rotate_threshold = random.randint(40, 80)

        # Xử lý cào với retry
        success = False
        for attempt in range(3):
            try:
                page = await current_context.new_page()
                # Chặn ảnh và media
                await page.route("**/*", lambda route: route.abort() if route.request.resource_type in ["image", "media"] else route.continue_())
                
                res = await search_and_extract(page, company)
                await page.close()

                if res.get("is_blocked"):
                    log.warning(f"⚠️ [BLOCKED] Worker {worker_id} (Port {port}) bị Yahoo từ chối tại '{company['name']}'. Xoay IP...")
                    try: await current_context.close()
                    except Exception: pass
                    await rotate_proxy(port)
                    await create_context()
                    continue

                # Lưu kết quả
                save_result_to_db(res)
                remove_from_retry_queue(retry_queue_file, company.get("corp_num"))
                
                async with csv_lock:
                    with open(output_file, "a", newline="", encoding="utf-8-sig") as f:
                        w = csv.DictWriter(f, fieldnames=["corp_num", "name", "address", "prefecture", "city", "corp_type", "corp_type_name", "gid", "y_name", "y_address", "phone", "website"], extrasaction="ignore")
                        res.pop("is_blocked", None)
                        w.writerow(res)

                web_str = res.get("website") or "Không có"
                tel_str = res.get("phone") or "Không có"
                log.info(f"[{time.strftime('%H:%M:%S')}] [W-{worker_id:02d}|P{port}] 🏢 {company['name'][:28]} | 🌐 {web_str[:30]} | 📞 {tel_str}")
                success = True
                break

            except Exception as e:
                err_str = str(e)
                if "ERR_SOCKS_CONNECTION_FAILED" in err_str:
                    await asyncio.sleep(12)
                else:
                    log.warning(f"Lỗi Worker {worker_id} lần {attempt+1}: {e}")
                    await asyncio.sleep(3)

        if not success:
            log.error(f"💀 [FAIL] Worker {worker_id} thất bại 3 lần trên '{company['name']}'. Lưu vào retry queue.")
            save_to_retry_queue(retry_queue_file, company)

        queue.task_done()

    if current_context:
        try: await current_context.close()
        except Exception: pass
    log.info(f"🏁 [WORKER-{worker_id:02d}] Đã hoàn tất công việc trên cổng {port}.")

async def main_async():
    args = parse_args()
    os.makedirs("data", exist_ok=True)
    
    # 1. Phát hiện Proxy WARP
    if args.proxy_port > 0:
        proxies = [{"server": f"socks5://127.0.0.1:{args.proxy_port}", "port": args.proxy_port, "container": f"warp-{args.proxy_port}"}]
    else:
        proxies = get_active_yahoo_proxies()
        
    if not proxies:
        log.error("Không tìm thấy Proxy WARP nào đang mở cho Yahoo!")
        return

    print("=" * 75)
    print("      YAHOO SEARCHER: HIGH-CONCURRENCY MULTI-WARP ENGINE")
    print(f"      Số luồng Proxy WARP độc lập : {len(proxies)} Ports ({', '.join(str(p['port']) for p in proxies)})")
    print(f"      Nguồn dữ liệu               : {'SQLite kigyou-list.db' if args.input == 'db' else args.input}")
    print(f"      Giới hạn xử lý              : {'Toàn bộ' if args.limit == 0 else f'{args.limit} công ty'}")
    print("=" * 75)

    # 2. Nạp dữ liệu
    retry_file = os.path.join(CURRENT_DIR, "data", "yahoo_retry_queue.csv")
    if args.input == "db":
        companies = load_companies_from_db(args.limit)
    else:
        companies = []
        with open(args.input, "r", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f): companies.append(r)
        if args.limit > 0: companies = companies[:args.limit]

    # Ưu tiên các công ty trong retry queue
    retry_list = []
    if os.path.exists(retry_file):
        try:
            with open(retry_file, "r", encoding="utf-8-sig") as f:
                for r in csv.DictReader(f): retry_list.append(r)
            if retry_list:
                log.info(f"🔁 Nạp {len(retry_list)} công ty từ retry queue để ưu tiên cào trước!")
        except Exception:
            pass

    seen_corps = set()
    queue = asyncio.Queue()
    for c in retry_list + companies:
        c_num = c.get("corp_num")
        if c_num and c_num not in seen_corps:
            seen_corps.add(c_num)
            queue.put_nowait(c)

    log.info(f"Tổng số công ty nạp vào hàng đợi xử lý: {queue.qsize():,} công ty")

    # 3. Chuẩn bị file CSV backup
    output_file = os.path.join(CURRENT_DIR, args.output)
    if not os.path.exists(output_file) or os.path.getsize(output_file) == 0:
        with open(output_file, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=["corp_num", "name", "address", "prefecture", "city", "corp_type", "corp_type_name", "gid", "y_name", "y_address", "phone", "website"])
            w.writeheader()

    csv_lock = asyncio.Lock()

    # 4. Khởi động Playwright và các Workers
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=args.headless,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"]
        )

        workers = [
            run_worker(i + 1, proxy_cfg, queue, browser, output_file, retry_file, csv_lock)
            for i, proxy_cfg in enumerate(proxies)
        ]

        await asyncio.gather(*workers)
        await browser.close()

    print("\n[+] Toàn bộ tiến trình Yahoo Searcher đã hoàn tất thành công!")

def main():
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stderr.reconfigure(encoding='utf-8')
        except Exception:
            pass
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(os.path.join(CURRENT_DIR, "yahoo_searcher.log"), encoding="utf-8")
        ]
    )
    asyncio.run(main_async())

if __name__ == "__main__":
    main()

