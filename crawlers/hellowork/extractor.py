import asyncio
import sqlite3
import os
import sys
import httpx
from bs4 import BeautifulSoup
import logging
from datetime import datetime
import re
import random
import subprocess

# Reconfigure stdout and stderr to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from maintenance import is_hellowork_maintenance, async_wait_if_maintenance

from logging.handlers import RotatingFileHandler

# Configure logging
logger = logging.getLogger('extractor')
logger.setLevel(logging.INFO)
logger.propagate = False
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

fh = RotatingFileHandler('extractor.log', maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
fh.setFormatter(formatter)
logger.addHandler(fh)

sh = logging.StreamHandler()
sh.setFormatter(formatter)
logger.addHandler(sh)

DB_PATH = 'data/hellowork.db'

# --- CẤU HÌNH KÊNH PROXY MẶC ĐỊNH (DOCKER) ---
PROXY_CONFIGS = [{"server": f"socks5://127.0.0.1:{40000 + i}"} for i in range(1, 48)]
CONCURRENCY_PER_PROXY = 3 
TOTAL_CONCURRENCY = len(PROXY_CONFIGS) * CONCURRENCY_PER_PROXY

class HelloworkExtractor:
    def __init__(self, prefecture=None, concurrency=0, proxy=None, container=None):
        self.base_url = 'https://www.hellowork.mhlw.go.jp'
        self.prefecture = prefecture
        self.fixed_proxy = proxy
        self.fixed_container = container
        
        # Thiết lập các proxy configs
        if self.fixed_proxy:
            self.proxy_configs = [{"server": self.fixed_proxy}]
        else:
            self.proxy_configs = PROXY_CONFIGS
            
        # Thiết lập số luồng đồng thời
        if concurrency > 0:
            self.total_concurrency = concurrency
        else:
            if self.fixed_proxy:
                self.total_concurrency = 3  # mặc định 3 luồng khi dùng 1 proxy cố định
            else:
                self.total_concurrency = TOTAL_CONCURRENCY
                
        self.semaphore = asyncio.Semaphore(self.total_concurrency)
        self._init_db()
        self.conn = None
        self.processed_count = 0
        logger.info(f"SUPER ENGINE ACTIVATED. Channels: {len(self.proxy_configs)}. Total Threads: {self.total_concurrency}")
        if self.prefecture:
            logger.info(f"Filtering queue for Prefecture: {self.prefecture}")
        if self.fixed_proxy:
            logger.info(f"Using fixed proxy: {self.fixed_proxy}")
        if self.fixed_container:
            logger.info(f"Using fixed container: {self.fixed_container}")

    def _init_db(self):
        conn = sqlite3.connect(DB_PATH)
        conn.execute("PRAGMA journal_mode=WAL;")
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

    async def process_single_job(self, client, job_id):
        init_url = f"{self.base_url}/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "ja-JP,ja;q=0.9",
        }
        
        try:
            # Step 1: GET search form to establish session cookie
            resp_init = await client.get(init_url, headers=headers, timeout=30.0)
            if resp_init.status_code != 200:
                raise Exception(f"Failed to load search form. HTTP Status: {resp_init.status_code}")
                
            # Step 2: Submit search POST
            soup = BeautifulSoup(resp_init.text, "html.parser")
            form = soup.find("form", id="mainForm") or soup.find("form")
            if not form:
                raise Exception("Search form not found in initial page content.")
                
            action = form.get("action", "/kensaku/GECA110010.do")
            post_url = self.base_url + action if action.startswith("/") else action
            if not post_url.startswith("http"):
                post_url = f"{self.base_url}/kensaku/" + action
                
            form_data = {}
            for input_tag in form.find_all("input"):
                name = input_tag.get("name")
                value = input_tag.get("value", "")
                if name:
                    form_data[name] = value
                    
            form_data["kJNoJo1"] = job_id[:5]
            form_data["kJNoGe1"] = job_id[5:]
            form_data["searchNoBtn"] = "求人番号検索"
            form_data["action"] = "searchNoBtn"
            
            post_headers = headers.copy()
            post_headers["Referer"] = init_url
            post_headers["Content-Type"] = "application/x-www-form-urlencoded"
            
            resp_post = await client.post(post_url, data=form_data, headers=post_headers, timeout=30.0)
            if resp_post.status_code != 200:
                raise Exception(f"Failed to post search request. HTTP Status: {resp_post.status_code}")
                
            html = resp_post.text
            detail_html = None
            
            # Step 3: Analyze POST response
            if "ID_shokugyo" in html:
                detail_html = html
            elif f"kJNo={job_id}" in html:
                # Found search list containing the target job link, navigate to it
                post_soup = BeautifulSoup(html, "html.parser")
                link_el = post_soup.select_one(f"a[href*='kJNo={job_id}'][href*='action=dispDetailBtn']")
                if link_el and 'href' in link_el.attrs:
                    href = link_el['href']
                    if href.startswith('.'):
                        href = "/kensaku/" + href[2:]
                    detail_url = self.base_url + href if href.startswith("/") else href
                    if not detail_url.startswith("http"):
                        detail_url = f"{self.base_url}/kensaku/" + href
                        
                    resp_detail = await client.get(detail_url, headers=headers, timeout=30.0)
                    if resp_detail.status_code == 200:
                        detail_html = resp_detail.text
                        
            # Check if we successfully obtained the detail HTML
            if not detail_html or "ID_shokugyo" not in detail_html:
                # Check if job is confirmed dead
                is_dead_confirmed = False
                check_html = detail_html if detail_html else html
                if "ハローワーク" in check_html:
                    soup_check = BeautifulSoup(check_html, 'html.parser')
                    error_elements = soup_check.select(".msg_E")
                    for err_el in error_elements:
                        err_text = err_el.get_text()
                        if any(kw in err_text for kw in ["存在しません", "該当する", "公開されていません", "公開されておりません", "入力された求人番号", "見つかりませんでした", "合致する"]):
                            is_dead_confirmed = True
                            break
                    
                    if not is_dead_confirmed:
                        specific_dead_phrases = [
                            "指定された求人番号は存在しません",
                            "該当する求人情報はありません",
                            "該当する情報がありません",
                            "入力された求人番号に該当する求人情報はありません"
                        ]
                        if any(phrase in check_html for phrase in specific_dead_phrases):
                            is_dead_confirmed = True
                            
                if is_dead_confirmed:
                    logger.warning(f"JOB DEAD (Confirmed): {job_id} không tìm thấy bảng dữ liệu hoặc đã bị gỡ.")
                    await self.mark_failed(job_id, permanent=True)
                    return False
                else:
                    raise Exception("Page content incomplete or network timeout (not confirmed dead).")
                    
            # Parse and save
            data = self.parse_detail(detail_html, job_id)
            if data and data["job"].get("job_title"):
                return await self.save_to_db(data)
                
            logger.warning(f"DATA INVALID: {job_id} dữ liệu không hợp lệ.")
            return False
        except Exception as e:
            if is_hellowork_maintenance():
                logger.warning(f"Error during job processing: {str(e)} (HelloWork is in maintenance). Pausing extractor...")
                await async_wait_if_maintenance("HelloWork Extractor")
            logger.error(f"Lỗi khi xử lý {job_id}: {str(e)}")
            raise e

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
            "job_content": find_val(["仕事 nội dung"]),
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

    async def save_to_db(self, data):
        for attempt in range(5):
            conn = None
            try:
                conn = sqlite3.connect(DB_PATH, timeout=60)
                conn.execute("PRAGMA journal_mode=WAL;")
                cursor = conn.cursor()
                if data["company"].get("corporate_number"):
                    cols = ", ".join(data["company"].keys())
                    vals = list(data["company"].values())
                    upd = ", ".join([f"{k}=excluded.{k}" for k in data["company"].keys() if k != 'corporate_number'])
                    cursor.execute(f"INSERT INTO companies ({cols}) VALUES ({','.join(['?']*len(vals))}) ON CONFLICT(corporate_number) DO UPDATE SET {upd}, last_updated_at=CURRENT_TIMESTAMP", vals)

                cols_j = ", ".join(data["job"].keys())
                vals_j = list(data["job"].values())
                cursor.execute(f"INSERT OR REPLACE INTO jobs ({cols_j}) VALUES ({','.join(['?']*len(vals_j))})", vals_j)
                cursor.execute("UPDATE jobs_queue SET status='completed', updated_at=? WHERE job_id=?", (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), data["job"]["job_id"]))
                conn.commit()
                return True
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e).lower():
                    await asyncio.sleep(random.uniform(1, 3))
                    continue
                logger.error(f"Lỗi DB (Operational): {str(e)}")
                return False
            except Exception as e:
                logger.error(f"Lỗi DB: {str(e)}")
                return False
            finally:
                if conn: conn.close()
        return False

    async def mark_failed(self, job_id, permanent=False):
        for attempt in range(5):
            conn = None
            try:
                conn = sqlite3.connect(DB_PATH, timeout=60)
                conn.execute("PRAGMA journal_mode=WAL;")
                if permanent:
                    conn.execute("DELETE FROM jobs_queue WHERE job_id = ?", (job_id,))
                else:
                    cursor = conn.cursor()
                    cursor.execute("SELECT retry_count FROM jobs_queue WHERE job_id = ?", (job_id,))
                    row = cursor.fetchone()
                    if row:
                        current_retry = row[0] or 0
                        if current_retry >= 2:  # Đã thử 2 lần trước đó, lần này là lần thứ 3
                            conn.execute("UPDATE jobs_queue SET status = 'failed', updated_at = ?, retry_count = retry_count + 1 WHERE job_id = ?",
                                         (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), job_id))
                            logger.warning(f"JOB FAILED PERMANENTLY: {job_id} đã thử thất bại {current_retry + 1} lần, chuyển trạng thái sang failed (bỏ qua).")
                        else:
                            conn.execute("UPDATE jobs_queue SET status = 'pending', updated_at = ?, retry_count = retry_count + 1 WHERE job_id = ?", 
                                         (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), job_id))
                    else:
                        conn.execute("UPDATE jobs_queue SET status = 'pending', updated_at = ?, retry_count = retry_count + 1 WHERE job_id = ?", 
                                     (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), job_id))
                conn.commit()
                return True
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e).lower():
                    await asyncio.sleep(random.uniform(1, 3))
                    continue
                break
            except Exception as e:
                logger.error(f"Lỗi khi đánh dấu thất bại {job_id}: {str(e)}")
                break
            finally:
                if conn: conn.close()
        return False

    async def get_proxy_ip(self, proxy_url):
        """Lấy địa chỉ IP hiện tại của một proxy."""
        try:
            # Sử dụng curl để lấy IP qua proxy
            cmd = ["curl", "-s", "--proxy", proxy_url, "https://api.ipify.org"]
            process = await asyncio.create_subprocess_exec(*cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, _ = await process.communicate()
            return stdout.decode().strip() or "Unknown"
        except:
            return "Error"

    async def rotate_warp_ip(self):
        try:
            logger.info("--- BẮT ĐẦU QUÁ TRÌNH XOAY IP ---")
            
            # 1. Xác định các container cần restart và proxy cần kiểm tra
            if self.fixed_container:
                containers = [self.fixed_container]
                configs = [{"server": self.fixed_proxy}]
            else:
                containers = [f"warp-proxy-{i}" for i in range(1, 48)]
                configs = self.proxy_configs
                
            # 2. Lấy IP cũ để đối chiếu
            old_ips = []
            for cfg in configs:
                ip = await self.get_proxy_ip(cfg['server'])
                old_ips.append(ip)
            
            logger.info(f"IP hiện tại: {', '.join(old_ips)}")
            logger.info(f"Đang tiến hành restart các container: {', '.join(containers)}...")
            
            # 3. Restart các container
            subprocess.run(
                ["docker", "restart"] + containers,
                capture_output=True,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            
            # 4. Đợi container khởi động lại
            logger.info("Đang đợi các Warp container kết nối lại (15s)...")
            await asyncio.sleep(15) 
            
            # 5. Lấy IP mới để xác nhận
            new_ips = []
            for cfg in configs:
                ip = await self.get_proxy_ip(cfg['server'])
                new_ips.append(ip)
            
            # 6. Log kết quả so sánh
            for i in range(len(configs)):
                status = "THÀNH CÔNG" if old_ips[i] != new_ips[i] else "KHÔNG ĐỔI (Cảnh báo)"
                logger.info(f"Kênh {i+1} ({configs[i]['server']}): {old_ips[i]} -> {new_ips[i]} [{status}]")
            
            logger.info("--- XOAY IP HOÀN TẤT, TIẾP TỤC CÀO ---")
            return True
        except Exception as e:
            logger.error(f"Lỗi khi xoay IP qua Docker: {str(e)}")
            return False

    async def run_forever(self, limit=0):
        # Reset all processing jobs back to pending on startup to recover from crashes, and mark legacy/over-limit jobs as failed
        try:
            conn_reset = sqlite3.connect(DB_PATH, timeout=60)
            conn_reset.execute("PRAGMA journal_mode=WAL;")
            # Nếu chạy theo tỉnh cụ thể, chỉ reset các job thuộc tỉnh đó
            if self.prefecture:
                pref_code = f"{int(self.prefecture):02d}"
                conn_reset.execute("UPDATE jobs_queue SET status='pending' WHERE status='processing' AND prefecture_code = ?", (pref_code,))
                conn_reset.execute("UPDATE jobs_queue SET status='failed', updated_at=? WHERE retry_count >= 3 AND status != 'completed' AND prefecture_code = ?", (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), pref_code))
            else:
                conn_reset.execute("UPDATE jobs_queue SET status='pending' WHERE status='processing'")
                conn_reset.execute("UPDATE jobs_queue SET status='failed', updated_at=? WHERE retry_count >= 3 AND status != 'completed'", (datetime.now().strftime('%Y-%m-%d %H:%M:%S'),))
            conn_reset.commit()
            conn_reset.close()
            logger.info("Reset processing jobs in queue back to pending and failed old jobs with retry_count >= 3.")
        except Exception as e:
            logger.error(f"Error resetting processing jobs on startup: {str(e)}")

        rotation_threshold = random.randint(5000, 8000)
        count_since_rotation = 0

        while True:
            await async_wait_if_maintenance("HelloWork Extractor")
            # Kiểm tra xoay IP
            if count_since_rotation >= rotation_threshold:
                logger.info(f"Đã đạt ngưỡng {rotation_threshold} tin. Đang xoay IP...")
                await self.rotate_warp_ip()
                count_since_rotation = 0
                rotation_threshold = random.randint(5000, 8000)

            # Lấy job và chuyển trạng thái sang 'processing' ngay lập tức
            conn = sqlite3.connect(DB_PATH, timeout=60)
            conn.execute("PRAGMA journal_mode=WAL;")
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE")
            try:
                fetch_limit = self.total_concurrency
                if limit > 0:
                    remaining = limit - self.processed_count
                    if remaining <= 0:
                        jobs_data = []
                    else:
                        fetch_limit = min(self.total_concurrency, remaining)
                
                if limit <= 0 or remaining > 0:
                    if self.prefecture:
                        pref_code = f"{int(self.prefecture):02d}"
                        cursor.execute("SELECT job_id, retry_count FROM jobs_queue WHERE status='pending' AND prefecture_code = ? AND (retry_count IS NULL OR retry_count < 3) LIMIT ?", (pref_code, fetch_limit))
                    else:
                        cursor.execute("SELECT job_id, retry_count FROM jobs_queue WHERE status='pending' AND (retry_count IS NULL OR retry_count < 3) LIMIT ?", (fetch_limit,))
                    jobs_data = cursor.fetchall()
                    if jobs_data:
                        placeholders = ','.join(['?'] * len(jobs_data))
                        job_ids = [row[0] for row in jobs_data]
                        cursor.execute(f"UPDATE jobs_queue SET status='processing', updated_at=? WHERE job_id IN ({placeholders})", (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), *job_ids))
                else:
                    jobs_data = []
                cursor.execute("COMMIT")
            except Exception as e:
                cursor.execute("ROLLBACK")
                logger.error(f"Lỗi khi cập nhật trạng thái processing: {str(e)}")
                jobs_data = []
            finally:
                conn.close()

            if not jobs_data: 
                logger.info("No pending jobs found in queue. Extractor exiting...")
                break

            async def task_wrapper(jid, idx, retry_count):
                # Khởi động so le (Staggered Start) để tránh nghẽn server
                await asyncio.sleep(random.uniform(0.1, 3.0))
                
                async with self.semaphore:
                    # Xác định seed cố định từ jid để xoay vòng cổng proxy một cách nhất quán cho mỗi job
                    job_seed = int(''.join(filter(str.isdigit, jid))) if any(c.isdigit() for c in jid) else idx
                    
                    # Lấy cổng proxy
                    cfg_idx = (job_seed + retry_count) % len(self.proxy_configs)
                    cfg = self.proxy_configs[cfg_idx]
                    proxy_url = cfg["server"] if cfg else None
                    
                    # Thiết lập limits cho keep-alive và timeouts
                    limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
                    
                    async with httpx.AsyncClient(proxy=proxy_url, limits=limits, verify=False) as client:
                        try:
                            success = await self.process_single_job(client, jid)
                            if success:
                                return True
                            
                            # Kiểm tra xem có bị xóa vĩnh viễn (dead link) không
                            conn_check = sqlite3.connect(DB_PATH)
                            row = conn_check.execute("SELECT 1 FROM jobs_queue WHERE job_id = ?", (jid,)).fetchone()
                            conn_check.close()
                            if not row:
                                return False
                            
                            raise Exception("Job extraction returned False (possible DB write fail/invalid data)")
                        except Exception as e:
                            logger.warning(f"Lần thử {retry_count + 1}/3 thất bại cho {jid} qua proxy {proxy_url}: {str(e)}")
                            await self.mark_failed(jid, permanent=False)
                            return False

            results = await asyncio.gather(*[task_wrapper(row[0], i, row[1] or 0) for i, row in enumerate(jobs_data)])
            success_in_batch = sum(1 for r in results if r)
            self.processed_count += success_in_batch
            count_since_rotation += success_in_batch
            logger.info(f"ULTRA BATCH: {success_in_batch}/{len(jobs_data)} processed. Total: {self.processed_count} (IP Rotation: {count_since_rotation}/{rotation_threshold})")

if __name__ == "__main__":
    asyncio.run(HelloworkExtractor().run_forever())
