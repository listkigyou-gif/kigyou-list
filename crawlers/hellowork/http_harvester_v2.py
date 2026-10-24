#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: HelloWork High-Performance HTTP Harvester v2
=========================================================
Upgrades HelloWork Harvester from heavy Playwright headless browsers to
lightweight, blazing-fast HTTP Session Emulation using curl_cffi.

Key Features:
1. 100% Data Integrity: Preserves identical job_id (kJNo) extraction for extractor.py.
2. Zero Memory Leak: Pure async HTTP sockets (~5MB RAM per thread vs 300MB Playwright Chromium).
3. Delta / Incremental Ingestion: Early-stops upon hitting existing jobs in hellowork.db / kigyou-list.db.
4. Session & Form State Emulation: Automatically extracts and submits Java Struts tokens and pagination.
5. WARP Proxy & Docker Rotation: Fully compatible with the 80+ Cloudflare WARP proxy infrastructure.
6. HelloWork Maintenance Awareness: Automatically pauses during official system maintenance.
"""

import os
import sys
import re
import time
import random
import socket
import asyncio
import sqlite3
import logging
import argparse
from datetime import datetime
from urllib.parse import urlparse, parse_qs
from logging.handlers import RotatingFileHandler

from bs4 import BeautifulSoup
from curl_cffi.requests import AsyncSession

# Reconfigure stdout and stderr to UTF-8
try:
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    sys.stderr.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

# Import HelloWork maintenance helper
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from maintenance import is_hellowork_maintenance, async_wait_if_maintenance

# Configure logging
logger = logging.getLogger('http_harvester_v2')
logger.setLevel(logging.INFO)
logger.propagate = False
formatter = logging.Formatter('%(asctime)s - [%(levelname)s] - %(message)s')

log_path = os.path.join(CURRENT_DIR, 'http_harvester_v2.log')
fh = RotatingFileHandler(log_path, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
fh.setFormatter(formatter)
logger.addHandler(fh)

sh = logging.StreamHandler()
sh.setFormatter(formatter)
logger.addHandler(sh)

DB_PATH = os.path.join(CURRENT_DIR, "data", "hellowork.db")
SCHEMA_PATH = os.path.join(CURRENT_DIR, "schema.sql")
MAIN_DB_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "kigyou-list.db"))

BASE_URL = "https://www.hellowork.mhlw.go.jp"
SEARCH_INIT_URL = f"{BASE_URL}/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
SEARCH_POST_URL = f"{BASE_URL}/kensaku/GECA110010.do"

# Mapping of all 47 Japanese prefectures
PREFECTURE_NAMES = {
    "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県",
    "06": "山形県", "07": "福島県", "08": "茨城県", "09": "栃木県", "10": "群馬県",
    "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県", "15": "新潟県",
    "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
    "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県", "25": "滋賀県",
    "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県",
    "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県",
    "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
    "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県",
    "46": "鹿児島県", "47": "沖縄県"
}


class HelloworkHttpHarvester:
    """
    Blazing fast HelloWork Harvester v2 using pure HTTP session emulation.
    """
    def __init__(self, incremental_mode=True, prefecture=None, proxy=None, container=None,
                 consecutive_duplicate_threshold=30, page_limit=0):
        self.incremental_mode = incremental_mode
        self.prefecture = f"{int(prefecture):02d}" if prefecture is not None else None
        self.fixed_proxy = proxy
        self.fixed_container = container
        self.duplicate_threshold = consecutive_duplicate_threshold
        self.page_limit = page_limit
        self.db_lock = asyncio.Lock()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
            "Origin": BASE_URL,
            "Referer": SEARCH_INIT_URL,
        }

    async def init_db(self):
        """Ensures the SQLite database and schema exist with WAL mode."""
        os.makedirs(os.path.join(CURRENT_DIR, "data"), exist_ok=True)
        async with self.db_lock:
            conn = sqlite3.connect(DB_PATH, timeout=60.0)
            conn.execute("PRAGMA journal_mode = WAL;")
            conn.execute("PRAGMA synchronous = NORMAL;")
            conn.execute("PRAGMA busy_timeout = 60000;")
            if os.path.exists(SCHEMA_PATH):
                with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
                    conn.executescript(f.read())
            conn.commit()
            conn.close()
            logger.info("Database initialized with WAL mode at: %s", DB_PATH)

    def get_pending_prefectures(self):
        """Returns list of prefecture codes to scrape."""
        all_prefs = PREFECTURE_NAMES.copy()
        conn = sqlite3.connect(DB_PATH, timeout=60.0)
        cursor = conn.cursor()

        # Seed search_tasks for all prefectures
        for code, name in all_prefs.items():
            cursor.execute(
                "INSERT OR IGNORE INTO search_tasks (prefecture_code, prefecture_name) VALUES (?, ?)",
                (code, name)
            )

        # In incremental mode, reset tasks so we can scan from page 1 for fresh jobs
        if self.incremental_mode:
            if self.prefecture:
                cursor.execute(
                    "UPDATE search_tasks SET is_completed = 0, last_page_processed = 0 WHERE prefecture_code = ?",
                    (self.prefecture,)
                )
            else:
                cursor.execute("UPDATE search_tasks SET is_completed = 0, last_page_processed = 0")
        conn.commit()

        if self.prefecture:
            cursor.execute(
                "SELECT prefecture_code FROM search_tasks WHERE prefecture_code = ? AND is_completed = 0",
                (self.prefecture,)
            )
        else:
            cursor.execute(
                "SELECT prefecture_code FROM search_tasks WHERE is_completed = 0 ORDER BY prefecture_code ASC"
            )

        pending = [row[0] for row in cursor.fetchall()]
        conn.close()
        return pending

    def update_task_progress(self, pref_code, page, is_completed=False):
        """Thread-safe update of search_tasks progress."""
        try:
            conn = sqlite3.connect(DB_PATH, timeout=60.0)
            conn.execute("PRAGMA busy_timeout = 60000;")
            conn.execute(
                """UPDATE search_tasks 
                   SET last_page_processed = ?, is_completed = ?, updated_at = ? 
                   WHERE prefecture_code = ?""",
                (page, 1 if is_completed else 0, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), pref_code)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.warning("Error updating task progress for pref %s: %s", pref_code, e)

    def check_job_exists(self, kj_no):
        """
        Fast deduplication check:
        1. Checks jobs_queue in hellowork.db
        2. Checks raw_hellowork in kigyou-list.db
        """
        try:
            conn = sqlite3.connect(DB_PATH, timeout=10.0)
            exists = conn.execute("SELECT 1 FROM jobs_queue WHERE job_id = ? LIMIT 1", (kj_no,)).fetchone() is not None
            if not exists:
                exists = conn.execute("SELECT 1 FROM jobs WHERE job_id = ? LIMIT 1", (kj_no,)).fetchone() is not None
            conn.close()
            if exists:
                return True

            # Cross-check with central kigyou-list.db if available
            if os.path.exists(MAIN_DB_PATH):
                mconn = sqlite3.connect(MAIN_DB_PATH, timeout=10.0)
                # Check raw_hellowork
                try:
                    exists_main = mconn.execute(
                        "SELECT 1 FROM raw_hellowork WHERE job_number = ? LIMIT 1", (kj_no,)
                    ).fetchone() is not None
                    mconn.close()
                    if exists_main:
                        return True
                except sqlite3.OperationalError:
                    mconn.close()
            return False
        except Exception:
            return False

    def save_job_ids(self, kj_nos, pref_code):
        """Thread-safe batch insert of newly discovered job IDs into jobs_queue."""
        if not kj_nos:
            return 0
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        data = [(kj_no, 'pending', now_str, pref_code) for kj_no in kj_nos]

        for attempt in range(5):
            try:
                conn = sqlite3.connect(DB_PATH, timeout=60.0)
                conn.execute("PRAGMA journal_mode = WAL;")
                conn.execute("PRAGMA busy_timeout = 60000;")
                cur = conn.cursor()
                cur.executemany(
                    """INSERT OR IGNORE INTO jobs_queue (job_id, status, updated_at, prefecture_code) 
                       VALUES (?, ?, ?, ?)""",
                    data
                )
                inserted = cur.rowcount
                conn.commit()
                conn.close()
                return inserted
            except sqlite3.OperationalError as e:
                if "locked" in str(e).lower():
                    time.sleep(random.uniform(0.5, 1.5))
                    continue
                logger.error("DB OperationalError in save_job_ids: %s", e)
                break
            except Exception as e:
                logger.error("Error in save_job_ids: %s", e)
                break
        return 0

    async def _rotate_warp_proxy(self, container_name, proxy_url):
        """Restarts Docker WARP container to obtain a fresh IP."""
        if not container_name:
            return False
        logger.info("[WARP ROTATE] Restarting Docker container %s for proxy %s...", container_name, proxy_url)
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "restart", container_name,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc.communicate()
            await asyncio.sleep(12)  # Wait for WARP daemon to re-establish WireGuard handshake
            logger.info("[WARP ROTATE] Successfully restarted %s", container_name)
            return True
        except Exception as e:
            logger.error("[WARP ROTATE] Failed to restart %s: %s", container_name, e)
            return False

    def _extract_job_ids_from_html(self, html):
        """Parses HTML and extracts list of unique kJNo (Job IDs) from detail links."""
        soup = BeautifulSoup(html, "html.parser")
        job_links = soup.select('a[href*="action=dispDetailBtn"]')
        kj_nos = []
        for link in job_links:
            href = link.get('href', '')
            parsed = parse_qs(urlparse(href).query)
            kj_no = parsed.get('kJNo', [None])[0]
            if kj_no and kj_no not in kj_nos:
                kj_nos.append(kj_no)
        return kj_nos, soup

    async def harvest_prefecture(self, pref_code, proxy_url=None, container_name=None):
        """
        Executes pure HTTP session harvest for a single prefecture.
        """
        pref_name = PREFECTURE_NAMES.get(pref_code, f"Prefecture {pref_code}")
        logger.info(">>> [START HARVEST] Tỉnh %s (%s) - Incremental: %s", pref_code, pref_name, self.incremental_mode)

        # Determine proxy configuration
        proxies = None
        if proxy_url:
            proxies = {"http": proxy_url, "https": proxy_url}
        elif self.fixed_proxy:
            proxies = {"http": self.fixed_proxy, "https": self.fixed_proxy}
        else:
            # Automatic mapping: port 40000 + pref_num
            port = 40000 + int(pref_code)
            # Test if port is open locally
            s = socket.socket()
            s.settimeout(0.1)
            if s.connect_ex(('127.0.0.1', port)) == 0:
                p_str = f"socks5://127.0.0.1:{port}"
                proxies = {"http": p_str, "https": p_str}
                if not container_name:
                    container_name = f"warp-proxy-{int(pref_code)}"
            s.close()

        # Step 1: Initialize AsyncSession with Chrome impersonation
        session = AsyncSession(
            impersonate="chrome120",
            headers=self.headers,
            proxies=proxies,
            timeout=25.0
        )

        try:
            # Check maintenance window before hitting network
            await async_wait_if_maintenance(f"HelloWork Harvester ({pref_name})")

            # GET initial search form to acquire JSESSIONID and base form state
            init_resp = None
            for attempt in range(4):
                try:
                    init_resp = await session.get(SEARCH_INIT_URL)
                    if init_resp.status_code == 200:
                        break
                    logger.warning("Pref %s: Init GET status %d, retry %d...", pref_code, init_resp.status_code, attempt + 1)
                except Exception as e:
                    logger.warning("Pref %s: Init GET error: %s (attempt %d/4)", pref_code, e, attempt + 1)
                    if container_name and attempt == 2:
                        await self._rotate_warp_proxy(container_name, proxy_url)
                    await asyncio.sleep(3)

            if not init_resp or init_resp.status_code != 200:
                logger.error("Pref %s: Failed to initialize search page. Aborting prefecture.", pref_code)
                return 0

            # Parse base search form
            soup_init = BeautifulSoup(init_resp.text, "html.parser")
            form_init = soup_init.find("form")
            if not form_init:
                logger.error("Pref %s: No search form found in HTML.", pref_code)
                return 0

            # Extract base form parameters
            form_payload = []
            for inp in form_init.find_all("input"):
                name = inp.get("name")
                if not name or name in ["ippanCKBox", "todohukenHidden", "searchBtn"]:
                    continue
                itype = inp.get("type", "")
                val = inp.get("value", "")
                if itype in ["submit", "button", "image"]:
                    continue
                if itype in ["checkbox", "radio"] and not inp.has_attr("checked"):
                    continue
                form_payload.append((name, val))

            # Apply Search Filters:
            # 1. Target Prefecture
            form_payload.append(("todohukenHidden", pref_code))
            # 2. Both Full-Time & Part-Time jobs
            form_payload.append(("ippanCKBox", "1"))
            form_payload.append(("ippanCKBox", "2"))
            # 3. Search Action Trigger
            form_payload.append(("searchBtn", " 検索する"))

            post_headers = self.headers.copy()
            post_headers["Content-Type"] = "application/x-www-form-urlencoded"

            # Step 2: Submit initial Search POST
            search_resp = None
            for attempt in range(4):
                try:
                    search_resp = await session.post(
                        SEARCH_POST_URL,
                        data=form_payload,
                        headers=post_headers
                    )
                    if search_resp.status_code == 200:
                        break
                    logger.warning("Pref %s: Search POST returned %d, retry...", pref_code, search_resp.status_code)
                except Exception as e:
                    logger.warning("Pref %s: Search POST error: %s (attempt %d)", pref_code, e, attempt + 1)
                    await asyncio.sleep(3)

            if not search_resp or search_resp.status_code != 200:
                logger.error("Pref %s: Search POST failed. Aborting prefecture.", pref_code)
                return 0

            # Step 3: Pagination and Ingestion Loop
            current_page = 1
            duplicate_counter = 0
            new_jobs_total = 0
            current_html = search_resp.text

            while True:
                # Extract jobs on this page
                page_kjnos, soup_page = self._extract_job_ids_from_html(current_html)
                logger.info("Pref %s (%s) - Page %d: Found %d job links.", pref_code, pref_name, current_page, len(page_kjnos))

                new_kjnos_on_page = []
                early_stop_triggered = False

                for kj_no in page_kjnos:
                    if self.incremental_mode and self.check_job_exists(kj_no):
                        duplicate_counter += 1
                        if duplicate_counter >= self.duplicate_threshold:
                            logger.info(
                                "[EARLY-STOP] Pref %s (%s): Hit %d consecutive existing jobs on Page %d. "
                                "All subsequent pages are historical. Stopping harvest. New jobs: %d",
                                pref_code, pref_name, duplicate_counter, current_page, new_jobs_total
                            )
                            early_stop_triggered = True
                            break
                        continue

                    # Fresh job discovered!
                    duplicate_counter = 0
                    new_kjnos_on_page.append(kj_no)
                    new_jobs_total += 1

                # Save new job IDs to jobs_queue
                if new_kjnos_on_page:
                    inserted_cnt = self.save_job_ids(new_kjnos_on_page, pref_code)
                    logger.info("Pref %s - Page %d: Enqueued +%d new jobs (Total new: %d)",
                                pref_code, current_page, inserted_cnt, new_jobs_total)

                self.update_task_progress(pref_code, current_page, is_completed=early_stop_triggered)

                if early_stop_triggered:
                    break

                if self.page_limit > 0 and current_page >= self.page_limit:
                    logger.info("Pref %s: Reached requested page limit (%d). Stopping.", pref_code, self.page_limit)
                    self.update_task_progress(pref_code, current_page, is_completed=True)
                    break

                # Check Next Button
                next_btn = soup_page.find("input", attrs={"name": "fwListNaviBtnNext"})
                if not next_btn or next_btn.has_attr("disabled"):
                    logger.info("Pref %s (%s): Reached last page (%d). Total new jobs harvested: %d",
                                pref_code, pref_name, current_page, new_jobs_total)
                    self.update_task_progress(pref_code, current_page, is_completed=True)
                    break

                # Prepare Next Page POST payload
                form_result = soup_page.find("form")
                if not form_result:
                    logger.warning("Pref %s: Could not find form on result page %d.", pref_code, current_page)
                    break

                next_payload = []
                for inp in form_result.find_all("input"):
                    name = inp.get("name")
                    if not name:
                        continue
                    itype = inp.get("type", "")
                    val = inp.get("value", "")
                    if itype in ["submit", "button", "image"]:
                        continue
                    if itype in ["checkbox", "radio"] and not inp.has_attr("checked"):
                        continue
                    next_payload.append((name, val))

                next_payload.append(("fwListNaviBtnNext", "次へ＞"))

                # Polite delay between page requests (0.5s - 1.2s)
                await asyncio.sleep(random.uniform(0.5, 1.2))

                # Fetch next page
                next_resp = None
                for attempt in range(3):
                    try:
                        next_resp = await session.post(
                            SEARCH_POST_URL,
                            data=next_payload,
                            headers=post_headers
                        )
                        if next_resp.status_code == 200:
                            break
                        logger.warning("Pref %s: Next page POST status %d, retry...", pref_code, next_resp.status_code)
                    except Exception as e:
                        logger.warning("Pref %s: Next page POST error: %s (attempt %d)", pref_code, e, attempt + 1)
                        await asyncio.sleep(2)

                if not next_resp or next_resp.status_code != 200:
                    logger.error("Pref %s: Failed to fetch page %d. Stopping.", pref_code, current_page + 1)
                    break

                current_page += 1
                current_html = next_resp.text

            logger.info("<<< [FINISHED HARVEST] Tỉnh %s (%s) - Pages: %d, Total New Jobs: %d",
                        pref_code, pref_name, current_page, new_jobs_total)
            return new_jobs_total

        finally:
            await session.close()

    async def run(self, concurrency=5):
        """Orchestrates harvesting across all pending prefectures."""
        await self.init_db()
        pending_prefs = self.get_pending_prefectures()

        if not pending_prefs:
            logger.info("All prefectures are already completed. No pending tasks.")
            return

        logger.info("=" * 70)
        logger.info("HELLOWORK HTTP HARVESTER v2 STARTING")
        logger.info("Pending Prefectures: %d (Incremental Mode: %s)", len(pending_prefs), self.incremental_mode)
        logger.info("Duplicate Early-Stop Threshold: %d", self.duplicate_threshold)
        logger.info("=" * 70)

        t_start = time.time()
        total_new_harvested = 0

        if self.prefecture or len(pending_prefs) == 1:
            pref = pending_prefs[0]
            new_count = await self.harvest_prefecture(pref, proxy_url=self.fixed_proxy, container_name=self.fixed_container)
            total_new_harvested += (new_count or 0)
        else:
            semaphore = asyncio.Semaphore(concurrency)

            async def worker(pref):
                async with semaphore:
                    try:
                        cnt = await self.harvest_prefecture(pref)
                        return cnt or 0
                    except Exception as e:
                        logger.error("Unexpected error in worker for pref %s: %s", pref, e)
                        return 0

            results = await asyncio.gather(*[worker(p) for p in pending_prefs])
            total_new_harvested = sum(results)

        duration = time.time() - t_start
        logger.info("=" * 70)
        logger.info("ALL HARVESTING TASKS FINISHED IN %.2f SECONDS", duration)
        logger.info("Grand Total New Jobs Enqueued: +%d", total_new_harvested)
        logger.info("=" * 70)


# Backward-compatible alias for existing imports in main.py
HelloworkHarvester = HelloworkHttpHarvester


async def main_cli():
    parser = argparse.ArgumentParser(description="Kigyou-list HelloWork HTTP Harvester v2")
    parser.add_argument("--mode", choices=["full", "update"], default="update",
                        help="Mode: 'update' (Incremental delta) or 'full' (Scrape all pages)")
    parser.add_argument("--prefecture", type=str, default=None,
                        help="Prefecture code (e.g. '13' for Tokyo, '27' for Osaka)")
    parser.add_argument("--proxy", type=str, default=None,
                        help="Fixed SOCKS5 proxy URL (e.g. socks5://127.0.0.1:40013)")
    parser.add_argument("--container", type=str, default=None,
                        help="Docker container name to restart for IP rotation")
    parser.add_argument("--concurrency", type=int, default=5,
                        help="Number of concurrent prefectures (default: 5)")
    parser.add_argument("--threshold", type=int, default=30,
                        help="Consecutive duplicate threshold for early-stop in update mode (default: 30)")
    parser.add_argument("--page-limit", type=int, default=0,
                        help="Maximum pages to harvest per prefecture (0 = unlimited)")

    args = parser.parse_args()

    harvester = HelloworkHttpHarvester(
        incremental_mode=(args.mode == "update"),
        prefecture=args.prefecture,
        proxy=args.proxy,
        container=args.container,
        consecutive_duplicate_threshold=args.threshold,
        page_limit=args.page_limit
    )
    await harvester.run(concurrency=args.concurrency)


if __name__ == "__main__":
    try:
        asyncio.run(main_cli())
    except KeyboardInterrupt:
        logger.info("Harvester aborted by user.")
        sys.exit(0)
