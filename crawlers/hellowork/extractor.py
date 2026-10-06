import asyncio
import sqlite3
import os
import sys
import re
import time
import random
import socket
import logging
import traceback
from datetime import datetime
from logging.handlers import RotatingFileHandler
from bs4 import BeautifulSoup
from curl_cffi.requests import AsyncSession

# Reconfigure stdout and stderr to UTF-8 and line-buffering
try:
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    sys.stderr.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

from maintenance import is_hellowork_maintenance, async_wait_if_maintenance

# Configure logging
logger = logging.getLogger('extractor')
logger.setLevel(logging.INFO)
logger.propagate = False
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extractor.log')
fh = RotatingFileHandler(log_path, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
fh.setFormatter(formatter)
logger.addHandler(fh)

sh = logging.StreamHandler()
sh.setFormatter(formatter)
logger.addHandler(sh)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'hellowork.db')

# --- CẤU HÌNH KÊNH PROXY WARP CHUYÊN DỤNG (80+ CONTAINER) ---
CONCURRENCY_PER_PROXY = 5  # ~5 luồng đồng thời trên mỗi proxy IP độc lập (Tối ưu cực đại)

def get_active_warp_proxies(candidate_ports=None):
    """Tự động phát hiện các cổng Cloudflare WARP proxy SOCKS5 chuyên dụng của HelloWork."""
    active = []
    # Dải cổng chuyên dụng: 40001, 40008, 40011 -> 40090 (Toàn bộ cụm 80+ container WARP)
    if candidate_ports is None:
        candidate_ports = [40001, 40008] + list(range(40011, 40091))
    for port in candidate_ports:
        try:
            s = socket.socket()
            s.settimeout(0.1)
            if s.connect_ex(('127.0.0.1', port)) == 0:
                active.append({
                    "server": f"socks5://127.0.0.1:{port}",
                    "port": port,
                    "container": f"warp-{port}"
                })
            s.close()
        except:
            pass
    return active

class HelloworkExtractor:
    def __init__(self, prefecture=None, concurrency=0, proxy=None, container=None, process_id=1, candidate_ports=None):
        self.base_url = 'https://www.hellowork.mhlw.go.jp'
        self.prefecture = prefecture
        self.fixed_proxy = proxy
        self.fixed_container = container
        self.process_id = process_id
        
        # Thiết lập danh sách proxy
        if self.fixed_proxy:
            self.proxy_configs = [{"server": self.fixed_proxy, "port": 0, "container": self.fixed_container or "warp-fixed"}]
        else:
            self.proxy_configs = get_active_warp_proxies(candidate_ports=candidate_ports)
            if not self.proxy_configs:
                # Fallback nếu docker chưa khởi tạo
                ports_fallback = candidate_ports or range(40011, 40081)
                self.proxy_configs = [{"server": f"socks5://127.0.0.1:{p}", "port": p, "container": f"warp-{p}"} for p in ports_fallback]

        # Thiết lập số worker (Mặc định 40 workers cho mỗi Sub-Process)
        if concurrency > 0:
            self.total_concurrency = concurrency
        else:
            if self.fixed_proxy:
                self.total_concurrency = 5
            else:
                self.total_concurrency = len(self.proxy_configs) * 2  # ~2 workers/proxy
                
        self._init_db()
        self.job_queue = asyncio.Queue(maxsize=1000)
        self.write_queue = asyncio.Queue(maxsize=5000)
        self.stop_event = asyncio.Event()
        
        self.total_dispatched = 0
        self.total_saved = 0
        self.total_failed = 0
        self.total_limit = 0
        
        avg_concurrency = self.total_concurrency / max(1, len(self.proxy_configs))
        logger.info(f"🚀 [PROCESS-{self.process_id}] KÍCH HOẠT EXTRACTOR ENGINE TRÊN LÕI CPU #{self.process_id}!")
        logger.info(f"   - Dedicated Proxy Pools : {len(self.proxy_configs)} IPs")
        logger.info(f"   - Concurrency per Proxy : ~{avg_concurrency:.1f} luồng/IP (Tối ưu phản hồi)")
        logger.info(f"   - Tổng số luồng song song: {self.total_concurrency} Streaming Workers")
        logger.info(f"   - Engine Mạng           : curl_cffi Chrome 124 TLS Impersonate (Keep-Alive)")
        logger.info(f"   - Ghi Database          : In-Memory WAL Batch Buffer (Zero SQLite Lock)")
        if self.prefecture:
            logger.info(f"   - Lọc theo tỉnh        : Mã {self.prefecture}")

    def _init_db(self):
        conn = sqlite3.connect(DB_PATH, timeout=60)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA busy_timeout=60000;")
        conn.close()

    def _clean_address(self, text):
        if not text: return None
        return re.sub(r'\s+', '', text)

    def _clean_number(self, text):
        if not text: return None
        num_str = "".join(filter(lambda x: x.isdigit() or x == '.', text.replace(',', '')))
        if not num_str: return 0
        try:
            val = float(num_str)
            if "兆" in text: val *= 1000000000000
            elif "億" in text: val *= 100000000
            elif "万" in text: val *= 10000
            return val 
        except: return 0

    def _convert_era_to_year(self, text):
        if not text: return None
        eras = {"明治": 1867, "大正": 1911, "昭和": 1925, "平成": 1988, "令和": 2018}
        for era, base in eras.items():
            if era in text:
                m = re.search(r'(\d+|元)年', text)
                if m:
                    year_val = 1 if m.group(1) == "元" else int(m.group(1))
                    return year_val + base
        return text

    def _clean_representative(self, text):
        if not text: return None
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for i, line in enumerate(lines):
            if "代表者名" in line:
                if i + 1 < len(lines): return lines[i+1]
                return line.replace("代表者名", "").strip()
        return lines[-1] if lines else None

    def parse_detail(self, html, job_id):
        soup = BeautifulSoup(html, 'html.parser')
        data = {"job": {"job_id": job_id}, "company": {}}
        all_details = {}
        for row in soup.find_all("tr"):
            th = row.find("th")
            tds = row.find_all("td")
            if th and tds:
                main_title = "".join(th.get_text().split())
                for td in tds:
                    for a in td.find_all("a", string=re.compile("職種解説")): a.decompose()
                    value = td.get_text("\n", strip=True)
                    lines = [l.strip() for l in value.split('\n') if l.strip()]
                    if len(lines) >= 2:
                        sub_title = lines[0]
                        sub_value = "\n".join(lines[1:])
                        if sub_title not in all_details: all_details[sub_title] = sub_value
                    if main_title and main_title not in all_details: all_details[main_title] = value

        def find_val(keywords):
            for k in keywords:
                if k in all_details: return all_details[k]
            for k, v in all_details.items():
                for kw in keywords:
                    if kw in k: return v
            return None

        data["company"].update({
            "company_name": find_val(["事業所名"]),
            "address": self._clean_address(find_val(["所在地"])),
            "industry_name": find_val(["産業"]),
            "capital": self._clean_number(find_val(["資本金"])),
            "employee_count_total": self._clean_number(find_val(["企業全体", "従業員数"])),
            "employee_count_workplace": self._clean_number(find_val(["就業場所"])),
            "employee_count_female": self._clean_number(find_val(["うち女性"])),
            "employee_count_part_time": self._clean_number(find_val(["うちパート"])),
            "established_year": self._convert_era_to_year(find_val(["設立年"])),
            "representative_name": self._clean_representative(find_val(["役職／代表者名", "代表者名"])),
            "website": (soup.select_one("#ID_hp").get_text(strip=True) if soup.select_one("#ID_hp") else None)
        })

        contact_id_map = {"email": "#ID_ttsEmail", "phone_number": "#ID_ttsTel", "fax_number": "#ID_ttsFax"}
        for key, selector in contact_id_map.items():
            el = soup.select_one(selector)
            if el: data["company"][key] = el.get_text(strip=True)

        data["job"].update({
            "reception_date": find_val(["受付年月日"]),
            "job_title": find_val(["職種"]),
            "job_content": find_val(["仕事の内容", "仕事内容"]),
            "employment_type": find_val(["求人区分", "雇用形態"]),
            "contract_period": find_val(["雇用期間"]),
            "work_location": self._clean_address(find_val(["就業場所"])),
            "salary_remarks": find_val(["基本給（ａ）", "賃金", "手当", "ａ＋ｂ"]),
            "working_hours": find_val(["就業時間"]),
            "holiday_remarks": find_val(["休日"]),
            "insurance_remarks": find_val(["加入保険等"]),
            "requirements": find_val(["必要な経験", "必要な免許"]),
            "selection_method": find_val(["選考方法"]),
            "contact_person": find_val(["担当者"])
        })

        for k, v in all_details.items():
            if "法人番号" in k:
                num = "".join(filter(str.isdigit, v))
                if len(num) == 13:
                    data["company"]["corporate_number"] = data["job"]["corporate_number"] = num
                    break
        return data

    async def process_single_job(self, session: AsyncSession, job_id: str):
        """Bóc tách chi tiết 1 job qua Persistent Session Keep-Alive với Chrome 124."""
        init_url = f"{self.base_url}/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "ja-JP,ja;q=0.9",
        }
        
        try:
            # Step 1: GET search form (Reuses existing TLS socket via Keep-Alive)
            resp_init = await session.get(init_url, headers=headers, timeout=20.0)
            if resp_init.status_code != 200:
                return False, None, False
                
            soup = BeautifulSoup(resp_init.text, "html.parser")
            form = soup.find("form", id="mainForm") or soup.find("form")
            if not form:
                return False, None, False
                
            action = form.get("action", "/kensaku/GECA110010.do")
            post_url = self.base_url + action if action.startswith("/") else f"{self.base_url}/kensaku/{action}"
            
            form_data = {inp.get("name"): inp.get("value", "") for inp in form.find_all("input") if inp.get("name")}
            form_data["kJNoJo1"] = job_id[:5]
            form_data["kJNoGe1"] = job_id[5:]
            form_data["searchNoBtn"] = "求人番号検索"
            form_data["action"] = "searchNoBtn"
            
            post_headers = headers.copy()
            post_headers["Referer"] = init_url
            post_headers["Content-Type"] = "application/x-www-form-urlencoded"
            
            # Step 2: POST search form
            resp_post = await session.post(post_url, data=form_data, headers=post_headers, timeout=20.0)
            if resp_post.status_code != 200:
                return False, None, False
                
            html = resp_post.text
            detail_html = None
            if "ID_shokugyo" in html:
                detail_html = html
            elif f"kJNo={job_id}" in html:
                post_soup = BeautifulSoup(html, "html.parser")
                link_el = post_soup.select_one(f"a[href*='kJNo={job_id}'][href*='action=dispDetailBtn']")
                if link_el and 'href' in link_el.attrs:
                    href = link_el['href']
                    if href.startswith('.'): href = "/kensaku/" + href[2:]
                    detail_url = self.base_url + href if href.startswith("/") else f"{self.base_url}/kensaku/{href}"
                    resp_detail = await session.get(detail_url, headers=headers, timeout=20.0)
                    if resp_detail.status_code == 200:
                        detail_html = resp_detail.text
                        
            # Check dead job or invalid
            if not detail_html or "ID_shokugyo" not in detail_html:
                check_html = detail_html if detail_html else html
                is_dead = False
                dead_phrases = [
                    "指定された求人番号は存在しません",
                    "該当する求人情報はありません",
                    "該当する情報がありません",
                    "入力された求人番号に該当する求人情報はありません"
                ]
                if any(p in check_html for p in dead_phrases):
                    is_dead = True
                elif "msg_E" in check_html:
                    soup_check = BeautifulSoup(check_html, 'html.parser')
                    for err in soup_check.select(".msg_E"):
                        if any(kw in err.get_text() for kw in ["存在しません", "該当する", "公開されていません", "見つかりませんでした"]):
                            is_dead = True
                            break
                return False, None, is_dead
                
            data = self.parse_detail(detail_html, job_id)
            if data and data["job"].get("job_title"):
                return True, data, False
            return False, None, False
        except Exception as e:
            if is_hellowork_maintenance():
                await async_wait_if_maintenance("HelloWork Extractor")
            return False, None, False

    async def _job_prefetcher(self, limit: int = 0):
        """Luồng ngầm nạp trước việc: Đảm bảo job_queue luôn có sẵn việc cho 76 workers."""
        conn = sqlite3.connect(DB_PATH, timeout=60)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA busy_timeout=60000;")
        
        threshold = max(50, self.total_concurrency * 2)
        fetch_size = max(100, self.total_concurrency * 4)

        while not self.stop_event.is_set():
            if limit > 0 and self.total_dispatched >= limit:
                break
                
            # Duy trì hàng đợi RAM có đủ job cho workers
            if self.job_queue.qsize() < threshold:
                fetch_count = fetch_size
                if limit > 0:
                    fetch_count = min(fetch_count, limit - self.total_dispatched)
                    
                cursor = conn.cursor()
                cursor.execute("BEGIN IMMEDIATE")
                try:
                    if self.prefecture:
                        pref_code = f"{int(self.prefecture):02d}"
                        cursor.execute(
                            "SELECT job_id, retry_count FROM jobs_queue WHERE status='pending' AND prefecture_code=? AND (retry_count IS NULL OR retry_count < 3) LIMIT ?",
                            (pref_code, fetch_count)
                        )
                    else:
                        cursor.execute(
                            "SELECT job_id, retry_count FROM jobs_queue WHERE status='pending' AND (retry_count IS NULL OR retry_count < 3) LIMIT ?",
                            (fetch_count,)
                        )
                    rows = cursor.fetchall()
                    if rows:
                        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        placeholders = ','.join(['?'] * len(rows))
                        job_ids = [r[0] for r in rows]
                        cursor.execute(f"UPDATE jobs_queue SET status='processing', updated_at=? WHERE job_id IN ({placeholders})", (now_str, *job_ids))
                        conn.commit()
                        
                        for r in rows:
                            await self.job_queue.put(r)
                            self.total_dispatched += 1
                    else:
                        conn.commit()
                        if self.job_queue.qsize() == 0:
                            logger.info("🏁 Đã quét hết toàn bộ hàng đợi trong cơ sở dữ liệu.")
                            break
                        await asyncio.sleep(2.0)
                except Exception as e:
                    cursor.execute("ROLLBACK")
                    logger.error(f"Lỗi prefetcher: {e}")
                    await asyncio.sleep(2.0)
            else:
                await asyncio.sleep(0.15)
                
        conn.close()

    def _flush_batch(self, conn, batch_success, batch_failed):
        """Ghi atomic toàn bộ lô thành công & thất bại vào SQLite trong 1 transaction."""
        cursor = conn.cursor()
        cursor.execute("BEGIN IMMEDIATE")
        try:
            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # 1. Ghi bảng companies
            companies = [item["company"] for item in batch_success if item.get("company", {}).get("corporate_number")]
            if companies:
                comp_cols = [
                    'corporate_number', 'company_name', 'company_name_kana', 'postal_code', 
                    'address', 'website', 'representative_name', 'phone_number', 'fax_number', 
                    'email', 'industry_code', 'industry_name', 'capital', 'employee_count_total', 
                    'employee_count_workplace', 'employee_count_female', 'employee_count_part_time', 
                    'established_year', 'last_updated_at'
                ]
                upd_clause = ", ".join([f"{k}=COALESCE(excluded.{k}, companies.{k})" for k in comp_cols if k not in ('corporate_number', 'last_updated_at')])
                upd_clause += ", last_updated_at=CURRENT_TIMESTAMP"
                
                comp_rows = []
                for c in companies:
                    row = [c.get(col) for col in comp_cols[:-1]] + [now_str]
                    comp_rows.append(row)
                    
                placeholders = ", ".join(["?"] * len(comp_cols))
                cursor.executemany(
                    f"INSERT INTO companies ({', '.join(comp_cols)}) VALUES ({placeholders}) "
                    f"ON CONFLICT(corporate_number) DO UPDATE SET {upd_clause}",
                    comp_rows
                )
                
            # 2. Ghi bảng jobs
            job_cols = [
                'job_id', 'corporate_number', 'reception_date', 'job_title', 'job_content', 
                'employment_type', 'contract_period', 'work_location', 'salary_type', 
                'salary_min', 'salary_max', 'salary_remarks', 'working_hours', 'holiday_remarks', 
                'insurance_remarks', 'requirements', 'selection_method', 'contact_person', 
                'discovered_at', 'last_seen_at'
            ]
            jobs = [item["job"] for item in batch_success if item.get("job", {}).get("job_id")]
            if jobs:
                job_rows = []
                for j in jobs:
                    row = [j.get(col) for col in job_cols[:-2]] + [now_str, now_str]
                    job_rows.append(row)
                placeholders_j = ", ".join(["?"] * len(job_cols))
                cursor.executemany(
                    f"INSERT OR REPLACE INTO jobs ({', '.join(job_cols)}) VALUES ({placeholders_j})",
                    job_rows
                )
                
            # 3. Đánh dấu jobs_queue thành 'completed'
            completed_ids = [(now_str, item["job"]["job_id"]) for item in batch_success if item.get("job", {}).get("job_id")]
            if completed_ids:
                cursor.executemany(
                    "UPDATE jobs_queue SET status='completed', updated_at=? WHERE job_id=?",
                    completed_ids
                )
                self.total_saved += len(completed_ids)
                
            # 4. Xử lý các job thất bại
            for job_id, retry_count, is_permanent in batch_failed:
                self.total_failed += 1
                if is_permanent:
                    cursor.execute("UPDATE jobs_queue SET status='failed', last_error='DEAD_JOB', updated_at=? WHERE job_id=?", (now_str, job_id))
                elif retry_count >= 2:
                    cursor.execute("UPDATE jobs_queue SET status='failed', retry_count=retry_count+1, updated_at=? WHERE job_id=?", (now_str, job_id))
                else:
                    cursor.execute("UPDATE jobs_queue SET status='pending', retry_count=retry_count+1, updated_at=? WHERE job_id=?", (now_str, job_id))
                    
            conn.commit()
        except Exception as e:
            cursor.execute("ROLLBACK")
            logger.error(f"Lỗi commit batch DB: {e}")

    async def _db_committer(self):
        """Tiến trình gom và ghi dữ liệu hàng loạt ngầm."""
        conn = sqlite3.connect(DB_PATH, timeout=60)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA busy_timeout=60000;")
        
        last_flush = time.time()
        batch_success = []
        batch_failed = []
        
        start_time = time.time()
        last_stat_time = time.time()
        last_saved_stat = self.total_saved
        
        while not self.stop_event.is_set() or not self.write_queue.empty():
            try:
                try:
                    item = await asyncio.wait_for(self.write_queue.get(), timeout=0.3)
                    action = item[0]
                    if action == 'success':
                        batch_success.append(item[1])
                    elif action == 'failed':
                        batch_failed.append(item[1:])
                    self.write_queue.task_done()
                except asyncio.TimeoutError:
                    pass
                    
                now = time.time()
                total_in_batch = len(batch_success) + len(batch_failed)
                if total_in_batch >= 50 or (now - last_flush >= 0.8 and total_in_batch > 0):
                    self._flush_batch(conn, batch_success, batch_failed)
                    batch_success.clear()
                    batch_failed.clear()
                    last_flush = now
                    
                # In thông số tốc độ thời gian thực mỗi 10 giây
                if now - last_stat_time >= 10.0:
                    delta_saved = self.total_saved - last_saved_stat
                    current_speed = delta_saved / max(1.0, (now - last_stat_time))
                    avg_speed = self.total_saved / max(1.0, (now - start_time))
                    logger.info(
                        f"[P{self.process_id}] ⚡ [ULTRA SPEED] Hiện tại: {current_speed:.1f} tin/s | Trung bình: {avg_speed:.1f} tin/s | "
                        f"Đã lưu: {self.total_saved:,} | Thất bại: {self.total_failed:,} | Q-RAM: {self.job_queue.qsize()} | Write-Buf: {self.write_queue.qsize()}"
                    )
                    sys.stdout.flush()
                    last_stat_time = now
                    last_saved_stat = self.total_saved
            except Exception as e:
                logger.error(f"Lỗi trong db_committer loop: {e}\n{traceback.format_exc()}")
                sys.stdout.flush()
                await asyncio.sleep(0.5)
                
        # Flush lần cuối khi dừng
        if batch_success or batch_failed:
            self._flush_batch(conn, batch_success, batch_failed)
        conn.close()

    async def _worker_loop(self, worker_id: int, proxy_cfg: dict):
        """Worker độc lập: Kết nối persistent HTTP/2 session, kéo việc liên tục."""
        proxy_url = proxy_cfg["server"]
        session = AsyncSession(
            proxy=proxy_url,
            impersonate="chrome124",
            verify=False,
            timeout=25.0
        )
        
        consecutive_errors = 0
        try:
            while not self.stop_event.is_set():
                try:
                    try:
                        job_item = await asyncio.wait_for(self.job_queue.get(), timeout=1.0)
                    except asyncio.TimeoutError:
                        if self.total_dispatched >= self.total_limit > 0 and self.job_queue.empty():
                            break
                        continue
                        
                    job_id, retry_count = job_item
                    retry_count = retry_count or 0
                    
                    success, data, is_dead = await self.process_single_job(session, job_id)
                    if success:
                        consecutive_errors = 0
                        await self.write_queue.put(('success', data))
                    else:
                        consecutive_errors += 1
                        await self.write_queue.put(('failed', job_id, retry_count, is_dead))
                        
                    self.job_queue.task_done()
                    
                    # Nếu gặp 5 lỗi liên tiếp, reset session để refresh kết nối proxy
                    if consecutive_errors >= 5:
                        logger.warning(f"[W-{worker_id:02d}|{proxy_cfg['port']}] 5 lỗi liên tiếp, reset connection...")
                        await session.close()
                        session = AsyncSession(proxy=proxy_url, impersonate="chrome124", verify=False, timeout=25.0)
                        consecutive_errors = 0
                        await asyncio.sleep(1.0)
                        
                    # Giãn cách 0.3 - 0.5s giữa các request trên cùng 1 worker
                    await asyncio.sleep(random.uniform(0.3, 0.5))
                except Exception as e:
                    logger.error(f"[W-{worker_id:02d}] Lỗi worker: {e}")
                    await asyncio.sleep(0.5)
        finally:
            await session.close()

    async def run_forever(self, limit=0):
        self.total_limit = limit
        
        # 1. Khôi phục các job bị kẹt ở trạng thái 'processing' từ phiên trước
        try:
            conn_reset = sqlite3.connect(DB_PATH, timeout=60)
            conn_reset.execute("PRAGMA journal_mode=WAL;")
            if self.prefecture:
                pref_code = f"{int(self.prefecture):02d}"
                conn_reset.execute("UPDATE jobs_queue SET status='pending' WHERE status='processing' AND prefecture_code=?", (pref_code,))
            else:
                conn_reset.execute("UPDATE jobs_queue SET status='pending' WHERE status='processing'")
            conn_reset.commit()
            conn_reset.close()
            logger.info("✅ Đã khôi phục các job dở dang sang trạng thái 'pending' sẵn sàng cào.")
        except Exception as e:
            logger.error(f"Lỗi reset processing: {e}")

        # 2. Khởi tạo Prefetcher và DB Committer
        prefetcher_task = asyncio.create_task(self._job_prefetcher(limit=limit))
        committer_task = asyncio.create_task(self._db_committer())

        # 3. Khởi tạo đội Worker Streaming (400 Streaming Workers - Gói 2 Turbo)
        workers = []
        worker_id = 1
        while len(workers) < self.total_concurrency:
            for proxy_cfg in self.proxy_configs:
                if len(workers) >= self.total_concurrency:
                    break
                w_task = asyncio.create_task(self._worker_loop(worker_id, proxy_cfg))
                workers.append(w_task)
                worker_id += 1
                
        logger.info(f"🔥 ĐÃ XUẤT QUÂN {len(workers)} STREAMING WORKERS TRÊN {len(self.proxy_configs)} PROXIES (GÓI 2 TURBO)!")

        try:
            # 1. Chờ prefetcher nạp hết việc từ DB vào hàng đợi RAM
            await prefetcher_task
            logger.info("📦 Prefetcher đã nạp xong toàn bộ jobs cần cào vào RAM.")
            # 2. Chờ toàn bộ workers xử lý xong hết các job trong job_queue
            await self.job_queue.join()
            logger.info("⚡ Workers đã xử lý xong toàn bộ jobs trong hàng đợi.")
            # 3. Chờ committer ghi toàn bộ lô dữ liệu vào SQLite
            await self.write_queue.join()
            logger.info("🎉 DB Committer đã hoàn tất lưu trữ dữ liệu.")
        except (KeyboardInterrupt, asyncio.CancelledError):
            logger.info("\n🛑 Nhận tín hiệu dừng. Đang lưu toàn bộ dữ liệu...")
        finally:
            self.stop_event.set()
            for w in workers:
                w.cancel()
            await asyncio.gather(*workers, return_exceptions=True)
            
            # Đợi DB Committer dừng hẳn và commit nốt lô cuối
            await committer_task
            
            # Nếu còn job nào trong RAM chưa được worker cào, reset lại về pending trong SQLite
            abandoned = []
            while not self.job_queue.empty():
                try:
                    abandoned.append(self.job_queue.get_nowait()[0])
                except:
                    break
            if abandoned:
                try:
                    conn_fix = sqlite3.connect(DB_PATH)
                    placeholders = ','.join(['?'] * len(abandoned))
                    conn_fix.execute(f"UPDATE jobs_queue SET status='pending' WHERE job_id IN ({placeholders})", abandoned)
                    conn_fix.commit()
                    conn_fix.close()
                    logger.info(f"✅ Đã trả {len(abandoned)} job chưa cào về lại pending trong DB an toàn.")
                except Exception as e:
                    logger.error(f"Lỗi trả job về pending: {e}")
                    
            logger.info(f"🏁 ĐÃ DỪNG AN TOÀN. Tổng số tin đã lưu thành công trong phiên: {self.total_saved:,}")

if __name__ == "__main__":
    asyncio.run(HelloworkExtractor().run_forever())
