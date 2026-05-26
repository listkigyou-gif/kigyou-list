import asyncio
import sqlite3
import os
import sys
from playwright.async_api import async_playwright
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
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

fh = RotatingFileHandler('extractor.log', maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
fh.setFormatter(formatter)
logger.addHandler(fh)

sh = logging.StreamHandler()
sh.setFormatter(formatter)
logger.addHandler(sh)

DB_PATH = 'data/hellowork.db'

# --- CẤU HÌNH 3 KÊNH PROXY SIÊU TỐC (DOCKER) ---
PROXY_CONFIGS = [
    {"server": "socks5://127.0.0.1:40000"},
    {"server": "socks5://127.0.0.1:40006"},
    {"server": "socks5://127.0.0.1:40007"},
]
CONCURRENCY_PER_PROXY = 3 
TOTAL_CONCURRENCY = len(PROXY_CONFIGS) * CONCURRENCY_PER_PROXY

class HelloworkExtractor:
    def __init__(self):
        self.base_url = 'https://www.hellowork.mhlw.go.jp'
        self.semaphore = asyncio.Semaphore(TOTAL_CONCURRENCY)
        self._init_db()
        self.conn = None
        self.processed_count = 0
        logger.info(f"SUPER ENGINE ACTIVATED. Channels: {len(PROXY_CONFIGS)}. Total Threads: {TOTAL_CONCURRENCY}")

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

    async def process_single_job(self, page, job_id):
        try:
            # Tăng timeout lên 90s để bù đắp cho mạng chậm
            await page.goto(f"{self.base_url}/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010", wait_until='domcontentloaded', timeout=90000)
            await page.fill("#ID_kJNoJo1", job_id[:5])
            await page.fill("#ID_kJNoGe1", job_id[5:])
            # Click bằng JS và đợi cho đến khi bảng dữ liệu xuất hiện
            await page.evaluate('() => document.getElementById("ID_searchNoBtn").click()')
            
            # Đợi trang chuyển hướng xong và dữ liệu xuất hiện
            try:
                # Đợi cho đến khi URL thay đổi hoặc trạng thái tải hoàn tất
                await page.wait_for_load_state("domcontentloaded", timeout=20000)
                await page.wait_for_selector("#ID_shokugyo", timeout=10000, state="attached")
            except:
                pass 
            
            # Thử lấy content với cơ chế retry nếu đang trong quá trình navigate
            html = ""
            for retry in range(5):
                try:
                    html = await page.content()
                    if html: break
                except Exception as e:
                    if "navigating" in str(e).lower():
                        await asyncio.sleep(2)
                        continue
                    raise e

            if "ID_shokugyo" not in html:
                soup = BeautifulSoup(html, 'html.parser')
                link_el = soup.select_one(f"a[href*='kJNo={job_id}'][href*='action=dispDetailBtn']")
                if link_el and 'href' in link_el.attrs:
                    href = link_el['href']
                    if href.startswith('.'): href = "/kensaku/" + href[2:]
                    await page.goto(self.base_url + href, wait_until='domcontentloaded')
                    html = await page.content()

            if "ID_shokugyo" not in html:
                # Chỉ đánh dấu chết nếu đã tải trang HelloWork thành công và có thông báo lỗi cụ thể
                is_dead_confirmed = False
                if "ハローワーク" in html:
                    soup = BeautifulSoup(html, 'html.parser')
                    # Tìm các thông báo lỗi có class msg_E
                    error_elements = soup.select(".msg_E")
                    for err_el in error_elements:
                        err_text = err_el.get_text()
                        if any(kw in err_text for kw in ["存在しません", "該当する", "公開されていません", "公開されておりません", "入力された求人番号"]):
                            is_dead_confirmed = True
                            break
                    
                    # Thêm kiểm tra các cụm từ lỗi cụ thể trong toàn bộ HTML để phòng ngừa
                    if not is_dead_confirmed:
                        specific_dead_phrases = [
                            "指定された求人番号は存在しません",
                            "該当する求人情報はありません",
                            "該当する情報がありません",
                            "入力された求人番号に該当する求人情報はありません"
                        ]
                        if any(phrase in html for phrase in specific_dead_phrases):
                            is_dead_confirmed = True
                
                if is_dead_confirmed:
                    logger.warning(f"JOB DEAD (Confirmed): {job_id} không tìm thấy bảng dữ liệu hoặc đã bị gỡ.")
                    await self.mark_failed(job_id, permanent=True) # Đánh dấu chết vĩnh viễn, không cào lại
                    return False
                else:
                    # Gặp lỗi mạng hoặc tải trang không đầy đủ, ném lỗi để cào lại sau
                    raise Exception("Page content incomplete or network timeout (not confirmed dead).")

            data = self.parse_detail(html, job_id)
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
            
            # 1. Lấy IP cũ để đối chiếu
            old_ips = []
            for cfg in PROXY_CONFIGS:
                ip = await self.get_proxy_ip(cfg['server'])
                old_ips.append(ip)
            
            logger.info(f"IP hiện tại: {', '.join(old_ips)}")
            logger.info("Đang tiến hành restart các Warp container...")
            
            # 2. Restart các container
            subprocess.run(
                ["docker", "restart", "warp-proxy", "warp-proxy-2", "warp-proxy-3"],
                capture_output=True,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            
            # 3. Đợi container khởi động lại
            logger.info("Đang đợi các Warp container kết nối lại (15s)...")
            await asyncio.sleep(15) 
            
            # 4. Lấy IP mới để xác nhận
            new_ips = []
            for cfg in PROXY_CONFIGS:
                ip = await self.get_proxy_ip(cfg['server'])
                new_ips.append(ip)
            
            # 5. Log kết quả so sánh
            for i in range(len(PROXY_CONFIGS)):
                status = "THÀNH CÔNG" if old_ips[i] != new_ips[i] else "KHÔNG ĐỔI (Cảnh báo)"
                logger.info(f"Kênh {i+1} ({PROXY_CONFIGS[i]['server']}): {old_ips[i]} -> {new_ips[i]} [{status}]")
            
            logger.info("--- XOAY IP HOÀN TẤT, TIẾP TỤC CÀO ---")
            return True
        except Exception as e:
            logger.error(f"Lỗi khi xoay IP qua Docker: {str(e)}")
            return False

    async def run_forever(self, limit=0):
        # Reset all processing jobs back to pending on startup to recover from crashes, and mark legacy/over-limit jobs as failed
        try:
            conn_reset = sqlite3.connect(DB_PATH)
            conn_reset.execute("UPDATE jobs_queue SET status='pending' WHERE status='processing'")
            conn_reset.execute("UPDATE jobs_queue SET status='failed', updated_at=? WHERE retry_count >= 3 AND status != 'completed'", (datetime.now().strftime('%Y-%m-%d %H:%M:%S'),))
            conn_reset.commit()
            conn_reset.close()
            logger.info("Reset processing jobs in queue back to pending and failed old jobs with retry_count >= 3.")
        except Exception as e:
            logger.error(f"Error resetting processing jobs on startup: {str(e)}")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            logger.info(f"SUPER ENGINE ready. Running {TOTAL_CONCURRENCY} workers across {len(PROXY_CONFIGS)} channels.")

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
                cursor = conn.cursor()
                cursor.execute("BEGIN TRANSACTION")
                try:
                    fetch_limit = TOTAL_CONCURRENCY
                    if limit > 0:
                        remaining = limit - self.processed_count
                        if remaining <= 0:
                            jobs_data = []
                        else:
                            fetch_limit = min(TOTAL_CONCURRENCY, remaining)
                    
                    if limit <= 0 or remaining > 0:
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

                if not jobs_data: break

                async def task_wrapper(jid, idx, retry_count):
                    # Khởi động so le (Staggered Start) để tránh nghẽn server
                    await asyncio.sleep(random.uniform(0.1, 3.0))
                    
                    async with self.semaphore:
                        # Xác định seed cố định từ jid để xoay vòng một cách nhất quán cho mỗi job
                        job_seed = int(''.join(filter(str.isdigit, jid))) if any(c.isdigit() for c in jid) else idx
                        
                        # Xoay cổng proxy tương ứng với retry_count và job_seed
                        cfg_idx = (job_seed + retry_count) % len(PROXY_CONFIGS)
                        cfg = PROXY_CONFIGS[cfg_idx]
                        
                        # Định nghĩa 3 cấu hình profile trình duyệt hoàn toàn khác biệt để giả lập các thiết bị khác nhau
                        PROFILES = [
                            {
                                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
                                "viewport": {"width": 1920, "height": 1080},
                                "device_scale_factor": 1.0,
                            },
                            {
                                "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
                                "viewport": {"width": 1440, "height": 900},
                                "device_scale_factor": 2.0,
                            },
                            {
                                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
                                "viewport": {"width": 1366, "height": 768},
                                "device_scale_factor": 1.25,
                            }
                        ]
                        
                        # Lấy profile tương ứng với retry_count và job_seed
                        profile_idx = (job_seed + retry_count) % len(PROFILES)
                        profile = PROFILES[profile_idx]
                        ua = profile["user_agent"]
                        
                        # Thiết lập thông số profile trình duyệt
                        ctx_args = {
                            "user_agent": ua,
                            "viewport": profile["viewport"],
                            "device_scale_factor": profile["device_scale_factor"],
                            "is_mobile": False,
                            "has_touch": False,
                            "locale": "ja-JP",
                            "timezone_id": "Asia/Tokyo"
                        }
                        if cfg: ctx_args["proxy"] = cfg
                        
                        # Tạo context và page mới hoàn toàn với profile khác nhau
                        temp_ctx = await browser.new_context(**ctx_args)
                        temp_ctx.set_default_timeout(60000)
                        
                        async def block_resources(route):
                            if route.request.resource_type in ["image", "stylesheet", "font", "media"]:
                                await route.abort()
                            else: await route.continue_()
                        await temp_ctx.route("**/*", block_resources)
                        
                        page = await temp_ctx.new_page()
                        try:
                            success = await self.process_single_job(page, jid)
                            if success:
                                return True
                            
                            # Nếu process_single_job trả về False, kiểm tra xem nó có bị xóa (do chết vĩnh viễn) không
                            conn_check = sqlite3.connect(DB_PATH)
                            row = conn_check.execute("SELECT 1 FROM jobs_queue WHERE job_id = ?", (jid,)).fetchone()
                            conn_check.close()
                            if not row:
                                # Đã bị xóa vĩnh viễn (dead link), dừng retry
                                return False
                            
                            raise Exception("Job extraction returned False (possible DB write fail/invalid data)")
                        except Exception as e:
                            logger.warning(f"Lần thử {retry_count + 1}/3 thất bại cho {jid} qua proxy {cfg['server']} (UA: {ua[:30]}...): {str(e)}")
                            await self.mark_failed(jid, permanent=False)
                            return False
                        finally:
                            await page.close()
                            await temp_ctx.close()

                results = await asyncio.gather(*[task_wrapper(row[0], i, row[1] or 0) for i, row in enumerate(jobs_data)])
                success_in_batch = sum(1 for r in results if r)
                self.processed_count += success_in_batch
                count_since_rotation += success_in_batch
                logger.info(f"ULTRA BATCH: {success_in_batch}/{len(jobs_data)} processed. Total: {self.processed_count} (IP Rotation: {count_since_rotation}/{rotation_threshold})")

            await browser.close()

if __name__ == "__main__":
    asyncio.run(HelloworkExtractor().run_forever())

