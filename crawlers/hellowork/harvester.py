import asyncio
import sqlite3
import os
import logging
import random
import subprocess
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

from logging.handlers import RotatingFileHandler
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

from maintenance import is_hellowork_maintenance, async_wait_if_maintenance

# Cấu hình logging
logger = logging.getLogger('harvester')
logger.setLevel(logging.INFO)
logger.propagate = False
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

# Rotating File Handler (10MB per file, max 5 backups)
fh = RotatingFileHandler('harvester.log', maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
fh.setFormatter(formatter)
logger.addHandler(fh)

# Stream Handler
sh = logging.StreamHandler()
sh.setFormatter(formatter)
logger.addHandler(sh)

DB_PATH = "data/hellowork.db"
SCHEMA_PATH = "schema.sql"

class HelloworkHarvester:
    def __init__(self, incremental_mode=False, prefecture=None, proxy=None, container=None):
        self.base_url = "https://www.hellowork.mhlw.go.jp"
        self.search_url = f"{self.base_url}/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
        self.incremental_mode = incremental_mode
        self.prefecture = prefecture
        self.fixed_proxy = proxy
        self.fixed_container = container
        self.conn = None
        self.processed_pages = 0
        self.rotation_threshold = random.randint(500, 1000)
        self.rotation_lock = asyncio.Lock() # Khóa để chỉ 1 luồng xoay IP
        
    async def init_db(self):
        os.makedirs("data", exist_ok=True)
        if not self.conn:
            self.conn = sqlite3.connect(DB_PATH)
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            self.conn.executescript(f.read())
        self.conn.execute("PRAGMA journal_mode=WAL;")
        self.conn.commit()
        logger.info("Database initialized.")

    def get_pending_prefectures(self):
        all_prefs = {f"{i:02d}": f"Prefecture {i}" for i in range(1, 48)}
        if not self.conn:
            self.conn = sqlite3.connect(DB_PATH)
        cursor = self.conn.cursor()
        
        # Nếu chỉ cào 1 tỉnh cụ thể, giới hạn danh sách all_prefs
        if self.prefecture:
            pref_code = f"{int(self.prefecture):02d}"
            all_prefs = {pref_code: all_prefs.get(pref_code, f"Prefecture {pref_code}")}
            
        for code, name in all_prefs.items():
            cursor.execute("INSERT OR IGNORE INTO search_tasks (prefecture_code, prefecture_name) VALUES (?, ?)", (code, name))
        
        # Nếu ở chế độ incremental, reset trạng thái để quét lại từ đầu trang 1
        if self.incremental_mode:
            logger.info("Incremental Mode: Resetting search tasks to scan prefectures for new jobs.")
            if self.prefecture:
                pref_code = f"{int(self.prefecture):02d}"
                cursor.execute("UPDATE search_tasks SET is_completed = 0, last_page_processed = 0 WHERE prefecture_code = ?", (pref_code,))
            else:
                cursor.execute("UPDATE search_tasks SET is_completed = 0, last_page_processed = 0")
        
        self.conn.commit()
        
        if self.prefecture:
            pref_code = f"{int(self.prefecture):02d}"
            cursor.execute("SELECT prefecture_code FROM search_tasks WHERE prefecture_code = ? AND is_completed = 0", (pref_code,))
        else:
            cursor.execute("SELECT prefecture_code FROM search_tasks WHERE is_completed = 0 ORDER BY prefecture_code")
            
        pending = [row[0] for row in cursor.fetchall()]
        return pending

    def update_task_progress(self, pref_code, page, is_completed=False):
        if not self.conn:
            self.conn = sqlite3.connect(DB_PATH)
        self.conn.execute(
            "UPDATE search_tasks SET last_page_processed = ?, is_completed = ?, updated_at = ? WHERE prefecture_code = ?",
            (page, 1 if is_completed else 0, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), pref_code)
        )
        self.conn.commit()

    def check_job_exists(self, kj_no):
        try:
            # 1. Check local jobs_queue first
            conn = sqlite3.connect(DB_PATH, timeout=60)
            exists = conn.execute("SELECT 1 FROM jobs_queue WHERE job_id = ?", (kj_no,)).fetchone() is not None
            conn.close()
            if exists:
                return True
                
            # 2. Check main kigyou-list.db database raw_hellowork table
            main_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "kigyou-list.db"))
            if os.path.exists(main_db_path):
                main_conn = sqlite3.connect(main_db_path, timeout=60)
                exists_main = main_conn.execute("SELECT 1 FROM raw_hellowork WHERE job_number = ? LIMIT 1", (kj_no,)).fetchone() is not None
                main_conn.close()
                return exists_main
            return False
        except Exception:
            return False

    def save_job_ids(self, kj_nos, pref_code):
        for attempt in range(5):
            try:
                conn = sqlite3.connect(DB_PATH, timeout=60)
                conn.execute("PRAGMA journal_mode=WAL;")
                data = [(kj_no, 'pending', datetime.now().strftime('%Y-%m-%d %H:%M:%S'), pref_code) for kj_no in kj_nos]
                conn.executemany("INSERT OR IGNORE INTO jobs_queue (job_id, status, updated_at, prefecture_code) VALUES (?, ?, ?, ?)", data)
                conn.commit()
                conn.close()
                return True
            except sqlite3.OperationalError as e:
                if "locked" in str(e).lower():
                    time.sleep(random.uniform(1, 3))
                    continue
                logger.error(f"Harvester DB Error: {str(e)}")
                break
            except Exception as e:
                logger.error(f"Harvester Error: {str(e)}")
                break
        return False

    def _check_warp_lock(self):
        """Kiểm tra xem có tiến trình nào đang xoay IP cho container này không."""
        container_to_restart = self.fixed_container if self.fixed_container else "warp-harvester"
        lock_file = f".warp_{container_to_restart}.lock"
        if not os.path.exists(lock_file):
            return False
        try:
            with open(lock_file, "r") as f:
                content = f.read().strip()
                if not content:
                    raise ValueError("Empty lock file")
                pid = int(content)
        except Exception:
            # Nếu file rỗng hoặc không đọc được PID, coi như không có lock hợp lệ
            try:
                os.remove(lock_file)
            except Exception:
                pass
            return False

        # Kiểm tra xem PID có đang chạy không
        import sys
        if sys.platform == "win32":
            try:
                out = subprocess.run(
                    ["tasklist", "/FI", f"PID eq {pid}"],
                    capture_output=True,
                    text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
                )
                if str(pid) in out.stdout:
                    return True
            except Exception:
                return True # Fallback an toàn nếu có lỗi
        else:
            try:
                os.kill(pid, 0)
                return True
            except OSError:
                pass
        
        # Nếu PID không còn chạy, xóa lock file và tiếp tục
        logger.info(f"Harvester: Phát hiện lock file cũ của container {container_to_restart} từ tiến trình đã chết (PID: {pid}). Đang dọn dẹp...")
        try:
            os.remove(lock_file)
        except Exception:
            pass
        return False

    async def get_proxy_ip(self, proxy_url):
        """Lấy địa chỉ IP hiện tại của một proxy."""
        try:
            cmd = ["curl", "-s", "--proxy", proxy_url, "https://api.ipify.org"]
            process = await asyncio.create_subprocess_exec(*cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, _ = await process.communicate()
            return stdout.decode().strip() or "Unknown"
        except:
            return "Error"

    async def rotate_ip(self):
        """Xoay IP bằng cách restart Docker container."""
        container_to_restart = self.fixed_container if self.fixed_container else "warp-harvester"
        lock_file = f".warp_{container_to_restart}.lock"
        if self._check_warp_lock():
            logger.info(f"Harvester ({container_to_restart}): Đang có tiến trình khác xoay IP, chờ đợi...")
            return False

        async with self.rotation_lock:
            try:
                proxy_url = self.fixed_proxy if self.fixed_proxy else "socks5://127.0.0.1:40008"
                # Lấy IP cũ
                old_ip = await self.get_proxy_ip(proxy_url)
                
                # Tạo file lock để báo hiệu cho các tiến trình khác
                with open(lock_file, "w") as f: f.write(str(os.getpid()))
                
                logger.info(f"Harvester: Bắt đầu xoay IP cho container {container_to_restart} (IP cũ: {old_ip})...")
                # Restart container warp
                process = await asyncio.create_subprocess_exec("docker", "restart", container_to_restart, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                await process.communicate()
                
                # Chờ container khởi động lại và kết nối (thường mất 15s)
                logger.info(f"Harvester: Đang đợi Warp container {container_to_restart} khởi động lại...")
                await asyncio.sleep(15)

                # Lấy IP mới
                new_ip = await self.get_proxy_ip(proxy_url)
                status = "THÀNH CÔNG" if old_ip != new_ip else "KHÔNG ĐỔI"
                logger.info(f"Harvester: Xoay IP xong cho {container_to_restart}. {old_ip} -> {new_ip} [{status}]")
                
                if os.path.exists(lock_file): os.remove(lock_file)
                return True
            except Exception as e:
                logger.error(f"Harvester: Lỗi khi xoay IP {container_to_restart} qua Docker: {str(e)}")
                if os.path.exists(lock_file): os.remove(lock_file)
                return False

    async def harvest_prefecture(self, browser, pref_code):
        logger.info(f">>> Processing Prefecture: {pref_code}")
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0")
        
        # Tối ưu hóa: Chặn các tài nguyên nặng
        async def block_resources(route):
            if route.request.resource_type in ["image", "stylesheet", "font"]:
                await route.abort()
            else: await route.continue_()
        await context.route("**/*", block_resources)

        page = await context.new_page()
        
        # Thử lại 3 lần cho bước khởi tạo tìm kiếm
        success_setup = False
        for setup_attempt in range(3):
            try:
                # Kiểm tra Lock IP trước khi vào
                while self._check_warp_lock():
                    await asyncio.sleep(5)

                # 1. Đi tới trang tìm kiếm
                await page.goto(self.search_url, wait_until='domcontentloaded')
                
                # 2. Mở Modal chọn tỉnh thành
                await page.click("#ID_todohukenHiddenAccoBtn")
                await page.wait_for_selector("#ID_ok4", timeout=10000)
                
                # 3. Tích chọn tỉnh
                await page.evaluate(f"document.getElementById('ID_skCheck{pref_code}9{pref_code}').checked = true")
                
                # 4. Nhấn xác nhận
                await page.click("#ID_ok4")
                await asyncio.sleep(0.5)
                
                # 5. Chọn Full-time & Part-time
                await page.check("#ID_ippanCKBox1")
                await page.check("#ID_ippanCKBox2")
                
                # 6. Nhấn Tìm kiếm
                await page.click("#ID_searchBtn")
                await page.wait_for_load_state("domcontentloaded")
                success_setup = True
                break
            except Exception as e:
                if is_hellowork_maintenance():
                    logger.warning(f"Pref {pref_code}: Setup error during HelloWork maintenance: {str(e)}. Pausing harvester...")
                    await async_wait_if_maintenance("HelloWork Harvester")
                    continue
                if setup_attempt < 2:
                    logger.warning(f"Pref {pref_code}: Lỗi khởi tạo, đang thử lại lần {setup_attempt+1}...")
                    await asyncio.sleep(10)
                    continue
                else:
                    logger.error(f"Error in {pref_code} setup: {str(e)}")
                    return # Thất bại hoàn toàn sau 3 lần

        try:
            if not success_setup: return
            
            start_page = 1
            if not self.incremental_mode:
                if not self.conn:
                    self.conn = sqlite3.connect(DB_PATH)
                res = self.conn.execute("SELECT last_page_processed FROM search_tasks WHERE prefecture_code = ?", (pref_code,)).fetchone()
                start_page = (res[0] + 1) if res and res[0] > 0 else 1

            current_page = 1
            duplicate_count = 0 # Khởi tạo bộ đếm trùng lặp
            new_jobs_total = 0 # Khởi tạo tổng số tin mới thu thập được
            while True:
                if current_page >= start_page:
                    logger.info(f"Scraping Prefecture {pref_code} - Page {current_page}")
                    
                    # Thử lại tối đa 3 lần nếu lỗi kết nối
                    for attempt in range(3):
                        try:
                            # Kiểm tra nếu đang có tiến trình khác xoay IP thì chờ
                            while self._check_warp_lock():
                                await asyncio.sleep(5)
                                
                            html = await page.content()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Trích xuất kJNo
                            job_links = soup.select('a[href*="action=dispDetailBtn"]')
                            kj_nos = []
                            stop_early = False
                            
                            for link in job_links:
                                from urllib.parse import urlparse, parse_qs
                                parsed = parse_qs(urlparse(link.get('href', '')).query)
                                kj_no = parsed.get('kJNo', [None])[0]
                                if not kj_no: continue
                                
                                if self.incremental_mode and self.check_job_exists(kj_no):
                                    duplicate_count += 1
                                    if duplicate_count >= 30: # Chỉ dừng nếu gặp 30 tin cũ liên tiếp (tránh tin cũ đăng lại)
                                        logger.info(f"Pref {pref_code}: Đạt ngưỡng 30 tin trùng liên tiếp. Dừng cào tỉnh này. Tổng tin mới: {new_jobs_total}")
                                        stop_early = True
                                        break
                                    continue
                                
                                # Nếu là tin mới, reset bộ đếm trùng lặp
                                duplicate_count = 0
                                kj_nos.append(kj_no)
                                new_jobs_total += 1
                            
                            if kj_nos: self.save_job_ids(kj_nos, pref_code)
                            self.update_task_progress(pref_code, current_page, is_completed=False)
                            if stop_early:
                                self.update_task_progress(pref_code, current_page, is_completed=True)
                                return 
                            break # Thành công, thoát vòng lặp attempt
                        except Exception as e:
                            if is_hellowork_maintenance():
                                logger.warning(f"Pref {pref_code} - Page {current_page}: Scrape error during HelloWork maintenance: {str(e)}. Pausing harvester...")
                                await async_wait_if_maintenance("HelloWork Harvester")
                                continue
                            if "net::ERR_SOCKS_CONNECTION_FAILED" in str(e) or "Unable to retrieve content" in str(e):
                                logger.warning(f"Pref {pref_code} - Page {current_page}: Lỗi proxy, đang thử lại ({attempt+1}/3)...")
                                await asyncio.sleep(10) # Chờ Warp xoay xong
                                continue
                            raise e

                # Chuyển trang (Kiểm tra xem có nút Next và nút đó phải đang hoạt động)
                next_btn = page.locator("input[name='fwListNaviBtnNext']").first
                is_available = await next_btn.count() > 0
                if is_available:
                    # Kiểm tra xem nút có bị disabled không
                    is_disabled = await next_btn.get_attribute("disabled") is not None
                    if is_disabled:
                        is_available = False
                
                if is_available:
                    for attempt in range(3):
                        try:
                            await next_btn.first.click(timeout=10000) # Giảm timeout xuống 10s cho nhanh
                            await page.wait_for_load_state("domcontentloaded")
                            break
                        except Exception as e:
                            if is_hellowork_maintenance():
                                logger.warning(f"Pref {pref_code}: Next page error during HelloWork maintenance: {str(e)}. Pausing harvester...")
                                await async_wait_if_maintenance("HelloWork Harvester")
                                continue
                            if attempt < 2:
                                logger.warning(f"Pref {pref_code}: Lỗi chuyển trang, thử lại...")
                                await asyncio.sleep(10)
                                continue
                            raise e
                    current_page += 1
                else:
                    logger.info(f"Finished Prefecture {pref_code} (Last page reached). Tổng tin mới: {new_jobs_total}")
                    self.update_task_progress(pref_code, current_page, is_completed=True)
                    break
                
                # Tăng bộ đếm trang và kiểm tra xoay IP
                self.processed_pages += 1
                if self.processed_pages >= self.rotation_threshold:
                    await self.rotate_ip()
                    self.processed_pages = 0
                    self.rotation_threshold = random.randint(500, 1000)
        finally: await context.close()
    async def run(self):
        await async_wait_if_maintenance("HelloWork Harvester")
        await self.init_db()
        pending_prefs = self.get_pending_prefectures()
        
        if not pending_prefs:
            logger.info("No pending prefectures to harvest.")
            if self.conn:
                self.conn.close()
            return

        proxy_url = self.fixed_proxy if self.fixed_proxy else "socks5://127.0.0.1:40008"
        logger.info(f"Harvester starting with proxy: {proxy_url}")

        async with async_playwright() as p:
            # Mở trình duyệt với Warp Proxy dành riêng cho Harvester
            browser = await p.chromium.launch(
                headless=True,
                proxy={"server": proxy_url}
            )
            
            # Nếu chạy cào 1 tỉnh cụ thể, không cần chạy song song
            if self.prefecture:
                try:
                    await self.harvest_prefecture(browser, pending_prefs[0])
                except Exception as e:
                    logger.error(f"Error in {pending_prefs[0]}: {str(e)}")
            else:
                # Tăng tốc: Chạy 5 tỉnh song song
                semaphore = asyncio.Semaphore(5)
                
                async def task_wrapper(pref):
                    async with semaphore:
                        try:
                            await self.harvest_prefecture(browser, pref)
                        except Exception as e:
                            logger.error(f"Error in {pref}: {str(e)}")
                            await asyncio.sleep(5)

                await asyncio.gather(*[task_wrapper(pref) for pref in pending_prefs])
            
            if self.conn:
                self.conn.close()
            await browser.close()

if __name__ == "__main__":
    # Mặc định bật incremental_mode=True để chỉ cào các link mới
    harvester = HelloworkHarvester(incremental_mode=True)
    asyncio.run(harvester.run())
