"""
Yahoo Map Searcher & Extractor (Giai đoạn 1 - New Pipeline)
------------------------------------------------------------
Đọc danh sách công ty từ NTA CSV, tìm kiếm trên Yahoo Map 
và trích xuất SĐT + Website từ iframe.

Input: data/nta_companies.csv
Output: data/companies_basic.csv

Cách dùng:
    python yahoo_searcher.py --limit 100
"""
import asyncio
import csv
import os
import re
import time
import argparse
import logging
import random
from urllib.parse import quote
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

# Danh sách User-Agents thực tế để xoay vòng
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0"
]

INPUT_FILE = "data/nta_companies.csv"
OUTPUT_FILE = "data/companies_basic.csv"
CONCURRENT = 2
HEADLESS = True
# Khóa toàn cục để tránh xoay IP chồng chéo
rotation_lock = asyncio.Lock()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/nta_companies.csv")
    parser.add_argument("--output", default="data/companies_basic.csv")
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--proxy-port", type=int, default=40001)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--rotate-count", type=int, default=1000)
    parser.add_argument("--log-file", default="yahoo_searcher.log")
    return parser.parse_args()

# Khởi tạo log global nhưng sẽ được cấu hình trong main
log = logging.getLogger(__name__)

# parse_frame_text removed as we no longer use Yahoo Map iframes

def clean_company_name(name: str) -> str:
    """Xóa các loại hình doanh nghiệp để tìm kiếm trên Yahoo Map chính xác hơn."""
    patterns = [
        r"^株式会社", r"株式会社$",
        r"^有限会社", r"有限会社$",
        r"^合同会社", r"合同会社$",
        r"^\(株\)", r"\(株\)$",
        r"^\(有\)", r"\(有\)$",
    ]
    cleaned = name
    for p in patterns:
        cleaned = re.sub(p, "", cleaned)
    return cleaned.strip()

async def get_current_ip(port: int):
    """Lấy IP hiện tại thông qua Proxy bằng curl."""
    import subprocess
    import sys
    try:
        # Sử dụng curl --proxy socks5h://... để lấy IP qua proxy
        cmd = ["curl", "-s", "--proxy", f"socks5h://127.0.0.1:{port}", "https://api.ipify.org"]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        return result.stdout.strip() or "Unknown"
    except:
        return "Unknown"

async def rotate_proxy(port: int):
    """Xoay IP bằng cách khởi động lại container Docker warp-{port} tương ứng. Thử lại tối đa 3 lần nếu IP không đổi."""
    global rotation_lock
    async with rotation_lock:
        container_name = f"warp-{port}"
        
        # 1. Lấy IP cũ
        old_ip = await get_current_ip(port)
        log.info(f"🔄 [ROTATION] Bắt đầu xoay IP cho {container_name} | IP hiện tại: {old_ip}")
        
        # 2. Thử lại tối đa 3 lần để lấy IP thực sự khác biệt
        max_retries = 3
        for attempt in range(max_retries):
            log.info(f"⏳ [ROTATION] Khởi động lại container {container_name} (Lần thử {attempt + 1}/{max_retries})...")
            try:
                import subprocess
                import sys
                # Khởi động lại container bằng docker restart
                subprocess.run(
                    ["docker", "restart", container_name],
                    capture_output=True,
                    timeout=20,
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                )
                
                # Chờ cho đến khi cổng thực sự trực tuyến (chờ tối đa 20 giây, kiểm tra mỗi 2 giây)
                log.info(f"⏳ [ROTATION] Đang chờ cổng {port} trực tuyến trở lại...")
                
                port_ready = False
                t_end = time.time() + 20
                while time.time() < t_end:
                    import socket
                    try:
                        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                            s.settimeout(1.0)
                            s.connect(('127.0.0.1', port))
                        port_ready = True
                        break
                    except (socket.error, ConnectionRefusedError):
                        await asyncio.sleep(2.0)
                
                if not port_ready:
                    log.warning(f"⚠️ [ROTATION] Cổng {port} chưa sẵn sàng kết nối sau 20s.")
                
                # Chờ 2 giây để kết nối định tuyến định hình hoàn toàn
                await asyncio.sleep(2.0)
                
                # Lấy IP mới
                new_ip = await get_current_ip(port)
                
                if new_ip != "Unknown" and new_ip != old_ip:
                    log.info(f"✅ [ROTATION] Thành công! {container_name} | {old_ip} -> {new_ip}")
                    return True
                else:
                    log.warning(f"⚠️ [ROTATION] Lần thử {attempt + 1} thất bại. IP mới ({new_ip}) vẫn trùng với IP cũ hoặc không lấy được IP. Chờ thêm 12s và thử lại...")
                    await asyncio.sleep(12)
            except Exception as e:
                log.error(f"❌ [ROTATION] Lỗi khi xoay container {container_name} ở lần thử {attempt + 1}: {e}")
                await asyncio.sleep(12)
                
        log.error(f"💀 [ROTATION] Thất bại trong việc xoay IP khác biệt cho {container_name} sau {max_retries} lần thử.")
        return False



async def search_and_extract(page, company: dict) -> dict:
    """Tìm công ty trên Yahoo Web Search và trích xuất website + SĐT + Địa chỉ."""
    result = company.copy()
    result.update({"gid": "", "y_name": "", "y_address": "", "phone": "", "website": "", "is_blocked": False})
    
    # Sử dụng tên đầy đủ và địa chỉ đầy đủ từ NTA để tăng độ chính xác
    keyword = f"{company['name']} {company['prefecture']}{company['city']}"
    search_url = f"https://search.yahoo.co.jp/search?p={quote(keyword)}"
    
    # Danh sách các trang danh bạ cần loại bỏ để lấy website chính thức
    DIRECTORY_BLACKLIST = [
        "cnavi.g-search.or.jp", "big-advance.site", "startup-db.com", 
        "navitime.co.jp", "itownpage.jp", "baseconnect.in", 
        "mapion.co.jp", "companydata.tsujigawa.com", "toukibo.ai-con.lawyer",
        "ivry.jp", "bgent.net", "ekiten.jp", "toushin.com", "yahoo.co.jp",
        "nikkei.com", "yelp.com", "info.gbiz.go.jp", "alarmbox.jp",
        "d-and-b.com", "tenshoku.news", "en-hyouban.com", "m-osaka.com",
        "facebook.com", "twitter.com", "instagram.com", "youtube.com"
    ]
    
    try:
        response = await page.goto(search_url, timeout=30000, wait_until="domcontentloaded")
        
        # Giả lập cuộn trang ngẫu nhiên (Human behavior)
        await page.mouse.wheel(0, random.randint(300, 700))
        await asyncio.sleep(random.uniform(1.0, 2.0))
        
        status = response.status if response else 0
        html = await page.content()
        
        block_keywords = ["Access Denied", "一時的にアクセスを制限", "robot check", "captcha"]
        is_blocked = status in [403, 429]
        for kw in block_keywords:
            if kw.lower() in html.lower():
                is_blocked = True
                break
        
        if is_blocked:
            log.error(f"🚫 [BLOCKED] Phát hiện bị chặn tại keyword: {keyword} | Status: {status}")
            with open("block_debug.html", "w", encoding="utf-8") as f:
                f.write(html[:2000])
            result["is_blocked"] = True
            return result

        await page.wait_for_timeout(2000)
        soup = BeautifulSoup(html, 'html.parser')
        
        # 1. Khởi tạo kết quả trống
        result["y_address"] = ""
        result["phone"] = ""
        result["website"] = ""
        
        # 2. Xử lý thông tin từ Yahoo! Maps Card
        best_spot = None
        for spot in soup.select('.sw-MapCard, .AnswerLocalSpot, .AnswerGourmetListLocoMain'):
            # Kiểm tra nút "道案内" (Route) - Dấu hiệu đặc trưng nhất của Map Card
            if any("道案内" in a.get_text() for a in spot.find_all('a')):
                best_spot = spot
                
                # Trích xuất dữ liệu từ Card này ngay
                spot_text = spot.get_text(separator=' ')
                
                # A. Địa chỉ
                if "住所：" in spot_text:
                    addr_part = spot_text.split("住所：")[1]
                    for delimiter in ["TEL", "電話", "道案内", "公式サイト", "すべて見る", "最寄り駅"]:
                        addr_part = addr_part.split(delimiter)[0]
                    result["y_address"] = addr_part.strip()
                
                # B. Website
                for link in spot.find_all('a'):
                    if any(kw in link.get_text() for kw in ["公式サイト", "Webサイト"]):
                        href = link.get('href')
                        if href: result["website"] = href
                        break
                
                # C. Số điện thoại
                phone_match = re.search(r'(?<!\d)(0\d{1,4}[－\-]\d{1,4}[－\-]\d{3,4})(?!\d)', spot_text)
                if phone_match:
                    result["phone"] = phone_match.group(1).replace("－", "-")
                    # Nếu có SĐT từ Map Card rồi thì không cần tìm Fallback nữa
                    source_label = "YAHOO_MAP"
                    break 
                else:
                    # Nếu Map Card không có SĐT, chúng ta sẽ để vòng lặp tiếp tục 
                    # hoặc thoát ra nhưng KHÔNG break hoàn toàn để chạy xuống Fallback
                    log.info(f"ℹ️ Map Card của {company['name']} không có SĐT, sẽ tìm ở kết quả tự nhiên...")
                    break

        # 3. Chiến thuật dự phòng: Nếu hiện tại vẫn CHƯA CÓ SĐT (kể cả đã tìm thấy Map Card hay chưa)
        if not result["phone"]:
            if best_spot:
                source_label = "YAHOO_MAP" # Đã lấy được Address/Web từ Map
            
            log.info(f"🔍 [FALLBACK] Đang tìm kiếm SĐT dự phòng cho: {company['name']}")
            
            # Hàm phụ để xóa toàn bộ khoảng trắng, giúp so khớp chính xác bất kể định dạng
            def condense(text):
                return re.sub(r'\s+', '', str(text))

            target_name_condensed = condense(company['name'])
            target_addr_condensed = condense(f"{company['prefecture']}{company['city']}")

            for card in soup.select('.sw-Card'):
                card_text = card.get_text(separator=' ')
                card_text_condensed = condense(card_text)
                
                # Điều kiện: Chứa Tên công ty và Địa chỉ (Bất chấp khoảng trắng)
                if target_name_condensed in card_text_condensed and target_addr_condensed in card_text_condensed:
                    phone_match = re.search(r'(?<!\d)(0\d{1,4}[－\-]\d{1,4}[－\-]\d{3,4})(?!\d)', card_text)
                    if phone_match:
                        result["phone"] = phone_match.group(1).replace("－", "-")
                        log.info(f"💡 [FALLBACK] Tìm thấy SĐT dự phòng: {result['phone']}")
                        if not best_spot:
                            source_label = "FALLBACK_SEARCH"
                        else:
                            source_label = "YAHOO_MAP+FALLBACK"
                        break
        
        # 4. Nếu vẫn không tìm thấy gì (không SĐT, không Website, không Địa chỉ)
        if not result["phone"] and not result["website"] and not result["y_address"]:
            log.warning(f"NOT_FOUND | {keyword}")
            return result

        # 5. Cải thiện lấy GID (Global ID)
        # Quét tất cả các link Map trên trang
        for a in soup.select('a[href*="map.yahoo.co.jp/place?gid="]'):
            href = a.get('href', '')
            gid_m = re.search(r'gid=([A-Za-z0-9_\-]+)', href)
            if gid_m:
                result["gid"] = gid_m.group(1)
                # Nếu chưa có địa chỉ từ bước 2, thử lấy tên từ link Map
                if not result["y_name"]:
                    result["y_name"] = a.get_text(strip=True)
                break

        if result["website"] or result["phone"] or result["y_address"]:
            log.info(f"FOUND [{source_label}] | {keyword} -> Web: {result['website']} | Tel: {result['phone']} | Addr: {result['y_address']}")
        else:
            log.warning(f"NOT_FOUND | {keyword}")

    except Exception as e:
        log.error(f"ERROR | {keyword} | {e}")
        raise e

    return result

async def run(input_file: str, output_file: str, limit: int, headless: bool, proxy_port: int, rotate_count: int):
    proxy_url = f"socks5://127.0.0.1:{proxy_port}"
    log.info(f"Using Proxy: {proxy_url}")
    companies = []
    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            companies.append(row)

    # Resume processing
    done_corp_nums = set()
    if os.path.exists(output_file):
        with open(output_file, "r", encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                done_corp_nums.add(row.get("corp_num", ""))
    
    # Query companies recently crawled on Yahoo from main database to avoid recrawling within 360 days
    crawled_recently = set()
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "kigyou-list.db"))
    if os.path.exists(db_path):
        try:
            import sqlite3
            conn = sqlite3.connect(db_path, timeout=30)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT corporate_number 
                FROM companies 
                WHERE yahoo_last_crawled_at IS NOT NULL 
                  AND datetime(yahoo_last_crawled_at) >= datetime('now', '-360 days')
            """)
            crawled_recently = {row[0] for row in cursor.fetchall() if row[0]}
            conn.close()
            log.info(f"Loaded {len(crawled_recently)} companies recently crawled on Yahoo from database.")
        except Exception as e:
            log.error(f"Error querying crawled companies from main DB: {e}")

    companies_todo = [
        c for c in companies 
        if c["corp_num"] not in done_corp_nums and c["corp_num"] not in crawled_recently
    ]
    if limit:
        companies_todo = companies_todo[:limit]
        
    log.info(f"Total companies: {len(companies)}, Already processed: {len(done_corp_nums)}")
    if crawled_recently:
        log.info(f"Filtered out due to 360-day rule: {len(crawled_recently)}")
    log.info(f"To process now: {len(companies_todo)}")

    if not companies_todo:
        return

    os.makedirs(os.path.dirname(output_file) or ".", exist_ok=True)
    
    # Include both NTA original fields and Yahoo Map extracted fields
    fieldnames = [
        "corp_num", "name", "address", "prefecture", "city", "corp_type", "corp_type_name",
        "gid", "y_name", "y_address", "phone", "website"
    ]
    
    write_header = not os.path.exists(output_file)
    request_counter = 0
    # Ngưỡng xoay IP ngẫu nhiên từ 200-500
    current_rotate_threshold = random.randint(200, 500)
    log.info(f"🔄 [INIT] Ngưỡng xoay IP chủ động cho luồng này: {current_rotate_threshold} requests.")

    sem = asyncio.Semaphore(CONCURRENT)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=headless,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-software-rasterizer",
                "--disable-extensions",
                "--disable-blink-features=AutomationControlled"
            ],
        )

        async def process(company):
            nonlocal request_counter, current_rotate_threshold
            async with sem:
                # 0. Nghỉ ngẫu nhiên dài hơn (15-30s) để cực kỳ an toàn
                delay = random.uniform(15.0, 30.0)
                await asyncio.sleep(delay)

                # 1. Kiểm tra xoay IP chủ động
                request_counter += 1
                if request_counter >= current_rotate_threshold:
                    log.info(f"🕒 [PROACTIVE] Đã đạt {request_counter}/{current_rotate_threshold} requests. Đang xoay IP chủ động...")
                    await rotate_proxy(proxy_port)
                    # Reset bộ đếm và tạo ngưỡng ngẫu nhiên mới
                    request_counter = 0
                    current_rotate_threshold = random.randint(200, 500)
                    log.info(f"🆕 [NEW THRESHOLD] Ngưỡng xoay tiếp theo: {current_rotate_threshold} requests.")

                # 2. Logic thử lại (Retry) khi bị chặn hoặc lỗi
                max_retries = 3
                for attempt in range(max_retries):
                    # Ngẫu nhiên hóa User-Agent và Viewport
                    ua = random.choice(USER_AGENTS)
                    vw = {"width": random.randint(1280, 1920), "height": random.randint(800, 1080)}
                    
                    # Fake fingerprint properties ngẫu nhiên để chống bot chuyên sâu
                    device_mem = random.choice([4, 8, 16])
                    cpu_cores = random.choice([4, 8, 12, 16])
                    platform = random.choice(["Win32", "MacIntel"])
                    
                    context = await browser.new_context(
                        user_agent=ua,
                        viewport=vw,
                        proxy={"server": proxy_url} if proxy_url else None,
                        locale="ja-JP",
                        timezone_id="Asia/Tokyo",
                        extra_http_headers={
                            "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
                            "Referer": "https://www.yahoo.co.jp/"
                        }
                    )
                    # Stealth script để ẩn danh Playwright và fake dấu vân tay trình duyệt ngẫu nhiên
                    await context.add_init_script(f"""
                        Object.defineProperty(navigator, 'webdriver', {{get: () => undefined}});
                        Object.defineProperty(navigator, 'deviceMemory', {{get: () => {device_mem}}});
                        Object.defineProperty(navigator, 'hardwareConcurrency', {{get: () => {cpu_cores}}});
                        Object.defineProperty(navigator, 'platform', {{get: () => '{platform}'}});
                    """)
                    
                    page = await context.new_page()
                    # Chặn tải hình ảnh và media để tiết kiệm RAM/CPU, cho phép tải CSS và Font để tránh bị Yahoo phát hiện bot
                    async def block_resources(route):
                        if route.request.resource_type in ["image", "media"]:
                            await route.abort()
                        else:
                            await route.continue_()
                    await page.route("**/*", block_resources)
                    try:
                        result = await search_and_extract(page, company)
                        if result.get("is_blocked"):
                            log.warning(f"⚠️ [BLOCK_429] Luồng {proxy_port} bị Yahoo từ chối. Đang xoay IP ngay lập tức...")
                            await rotate_proxy(proxy_port)
                            request_counter = 0
                            current_rotate_threshold = random.randint(200, 500)
                            continue
                        
                        # Thành công -> Xóa cookies trước khi đóng
                        await context.clear_cookies()
                        return result
                    except Exception as e:
                        err_msg = str(e)
                        log.error(f"❌ [RETRY] Lần thử {attempt + 1} cho keyword '{company['name']}' gặp lỗi: {err_msg}")
                        # Nếu là lỗi mất kết nối SOCKS do proxy đang restart, ta chỉ cần chờ proxy online lại
                        if "ERR_SOCKS_CONNECTION_FAILED" in err_msg or "ERR_CONNECTION_REFUSED" in err_msg:
                            log.warning(f"⏳ Kết nối Proxy {proxy_port} đang gián đoạn (có thể đang xoay IP). Chờ 15s để kết nối tự phục hồi...")
                            await asyncio.sleep(15)
                        else:
                            # Chỉ xoay IP đối với các lỗi khác (ví dụ: Timeout, lỗi trang, v.v.)
                            log.info(f"🔄 Đang xoay IP cho luồng {proxy_port}...")
                            await rotate_proxy(proxy_port)
                            # Reset bộ đếm khi xoay IP khẩn cấp
                            request_counter = 0
                            current_rotate_threshold = random.randint(200, 500)
                        continue
                    finally:
                        try:
                            await context.close()
                        except Exception:
                            pass
                
                raise RuntimeError(
                    f"💀 [FATAL] Luồng {proxy_port} liên tục thất bại {max_retries} lần trên keyword '{company['name']}'. "
                    f"Dừng luồng để tự động reset proxy."
                )

        tasks = [process(c) for c in companies_todo]

        with open(output_file, "a", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            if write_header:
                writer.writeheader()

            for coro in asyncio.as_completed(tasks):
                result = await coro
                if result:
                    # Xóa cờ nội bộ trước khi ghi CSV
                    result.pop("is_blocked", None)
                    writer.writerow(result)
                    f.flush()

        await browser.close()

    log.info(f"Done! Results saved to '{output_file}'")

if __name__ == "__main__":
    args = parse_args()
    
    # Cấu hình logging động dựa trên tham số dòng lệnh
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(args.log_file, encoding="utf-8")
        ]
    )
    
    if not os.path.exists(args.input):
        log.error(f"Cannot find {args.input}")
    else:
        asyncio.run(run(args.input, args.output, args.limit, args.headless, args.proxy_port, args.rotate_count))
