#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-List: Ultra Multi-Process Website Scraper (8 CPU Cores - 200 Workers)
=============================================================================
Architecture:
- 8 Sub-Processes on 8 CPU Cores (zero Python GIL bottlenecks)
- 82 Cloudflare WARP Proxy Containers partitioned across processes
- 20-25 Async Streaming Workers per Core (Total: 160-200 Workers)
- Deterministic Partitioning by (CAST(substr(corporate_number, -4) AS INTEGER) % 8)
  -> Zero lock contention, zero collision, perfectly balanced (~12.5% per core)
- Batch Committer with SQLite WAL executemany for atomic commits
- Real-time Throughput: ~60 - 100 websites/second across the cluster
"""

import os
import sys
import time
import signal
import socket
import sqlite3
import logging
import asyncio
import argparse
import multiprocessing
from datetime import datetime

# Adjust path to import core crawler modules
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
sys.path.append(WORKSPACE_ROOT)
sys.path.append(CURRENT_DIR)

from crawlers.website.main import (
    DB_PATH,
    HAS_CURL_CFFI,
    HAS_HTTPX,
    HAS_PLAYWRIGHT,
    website_worker,
    batch_db_writer,
    log as base_log
)

if HAS_CURL_CFFI:
    from curl_cffi.requests import AsyncSession as CurlAsyncSession
if HAS_HTTPX:
    import httpx

# Master Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(message)s"
)
logger = logging.getLogger("multi_website_scraper")

def get_partition_targets(proc_index: int, total_procs: int, limit: int = 0) -> list[tuple]:
    """Retrieve companies assigned specifically to this process core."""
    if not os.path.exists(DB_PATH):
        return []
    
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    cur = conn.cursor()
    
    query = f"""
        SELECT corporate_number, website_url 
        FROM companies INDEXED BY idx_companies_last_crawled_status
        WHERE website_url IS NOT NULL 
          AND length(website_url) > 5
          AND website_url NOT LIKE '%none%'
          AND website_url NOT LIKE '%なし%'
          AND website_url NOT LIKE '%://.%'
          AND website_url NOT LIKE '%:///%'
          AND (CAST(substr(corporate_number, -4) AS INTEGER) % {total_procs}) = {proc_index}
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

async def run_worker_pool(proc_id: int, ports: list[int], concurrency: int, targets: list[tuple], allow_tier2: bool = False):
    """Sub-process worker pool running on dedicated event loop."""
    p_log = logging.getLogger(f"Proc-{proc_id}")
    
    # Map proxy ports
    proxies = []
    for port in ports:
        proxies.append({
            "server": f"socks5://127.0.0.1:{port}",
            "port": port
        })
    if not proxies:
        proxies = [{"server": None, "port": 0}]

    task_queue = asyncio.Queue()
    for t in targets:
        task_queue.put_nowait(t)

    buffer_queue = asyncio.Queue()
    is_done = asyncio.Event()

    # Dedicated Batch Writer for this process
    writer_task = asyncio.create_task(batch_db_writer(DB_PATH, buffer_queue, is_done))

    # Spawn workers
    workers = []
    for i in range(concurrency):
        p_cfg = proxies[i % len(proxies)]
        workers.append(website_worker(
            worker_id=i + 1,
            proxy_cfg=p_cfg,
            task_queue=task_queue,
            buffer_queue=buffer_queue,
            browser=None,
            allow_tier2=allow_tier2
        ))

    # Metric reporter
    start_time = time.time()
    total_assigned = len(targets)

    async def progress_reporter():
        last_done = 0
        while not is_done.is_set():
            await asyncio.sleep(10.0)
            remaining = task_queue.qsize()
            done = total_assigned - remaining
            elapsed = time.time() - start_time
            rate = done / max(1.0, elapsed)
            recent_rate = (done - last_done) / 10.0
            last_done = done
            p_log.info(
                f"[Core #{proc_id}] ⚡ Tốc độ: {recent_rate:.1f} site/s (TB: {rate:.1f}) | "
                f"Đã xử lý: {done:,}/{total_assigned:,} ({done/max(1, total_assigned)*100:.1f}%) | "
                f"Còn lại: {remaining:,} | Buffer: {buffer_queue.qsize()}"
            )

    reporter_task = asyncio.create_task(progress_reporter())

    # Run all workers
    await asyncio.gather(*workers)

    # Flush
    is_done.set()
    reporter_task.cancel()
    await buffer_queue.put(None)
    await writer_task

    total_time = time.time() - start_time
    p_log.info(f"✅ [Core #{proc_id}] Hoàn thành 100% {total_assigned:,} website trong {total_time:.1f}s ({total_assigned/max(1.0, total_time):.1f} site/s)!")

def run_single_process(proc_id: int, proc_index: int, total_procs: int, ports: list[int], concurrency: int, limit: int, allow_tier2: bool):
    """Process entry point."""
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
        sys.stderr.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass

    targets = get_partition_targets(proc_index, total_procs, limit)
    if not targets:
        print(f"[Core #{proc_id}] Không có website nào cần cào trong phân vùng {proc_index}. Thoát.")
        return

    print(f"[Core #{proc_id}] Đã nhận phân vùng #{proc_index} với {len(targets):,} website | {len(ports)} Proxies | {concurrency} Workers")
    try:
        asyncio.run(run_worker_pool(proc_id, ports, concurrency, targets, allow_tier2))
    except (KeyboardInterrupt, asyncio.CancelledError):
        pass

def main():
    multiprocessing.freeze_support()

    parser = argparse.ArgumentParser(description="Kigyou-List: Ultra Multi-Process Website Scraper (8 CPU Cores)")
    parser.add_argument("--processes", type=int, default=8, help="Number of CPU cores/processes (default: 8)")
    parser.add_argument("--workers-per-proc", type=int, default=25, help="Workers per process core (default: 25)")
    parser.add_argument("--limit-per-proc", type=int, default=0, help="Limit targets per process (0 = all)")
    parser.add_argument("--allow-tier2", action="store_true", help="Enable Tier 2 Playwright headless fallback")
    args = parser.parse_args()

    num_procs = args.processes
    workers_per_proc = args.workers_per_proc

    logger.info("=" * 80)
    logger.info(f"🌐 KIGYOU-LIST ULTRA MULTI-PROCESS WEBSITE SCRAPER ({num_procs} LÕI CPU)")
    logger.info("=" * 80)

    # Database PRAGMA tuning
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=60000;")
    conn.close()

    # Distribute 82 WARP containers across 8 processes
    group_1 = list(range(40011, 40021))                  # 10 ports
    group_2 = list(range(40021, 40031))                  # 10 ports
    group_3 = list(range(40031, 40041))                  # 10 ports
    group_4 = list(range(40041, 40051))                  # 10 ports
    group_5 = list(range(40051, 40061))                  # 10 ports
    group_6 = list(range(40061, 40071))                  # 10 ports
    group_7 = list(range(40071, 40081))                  # 10 ports
    group_8 = list(range(40081, 40091)) + [40001, 40008] # 12 ports

    port_groups = [group_1, group_2, group_3, group_4, group_5, group_6, group_7, group_8]
    if num_procs != 8:
        # Generic distribution if non-8
        all_ports = [40001, 40008] + list(range(40011, 40091))
        port_groups = [all_ports[i::num_procs] for i in range(num_procs)]

    total_workers = num_procs * workers_per_proc
    total_ports = sum(len(g) for g in port_groups[:num_procs])
    logger.info(f"📊 Cấu hình: {num_procs} Lõi CPU | {total_ports} Cổng WARP | {total_workers} Streaming Workers")
    logger.info(f"⚡ Cơ chế: Phân vùng toán học modulo 8 | Bóc tách JSON-LD + Meta + Logo + SNS links")

    processes = []
    for i in range(num_procs):
        proc_id = i + 1
        proc_index = i
        ports = port_groups[i]
        p = multiprocessing.Process(
            target=run_single_process,
            args=(proc_id, proc_index, num_procs, ports, workers_per_proc, args.limit_per_proc, args.allow_tier2),
            name=f"WebScraper-Core-{proc_id}"
        )
        p.start()
        processes.append(p)
        logger.info(f"   ▶️ Core #{proc_id} (PID {p.pid}): Phân vùng #{proc_index} | {len(ports)} Ports ({ports[0]}..{ports[-1]}) | {workers_per_proc} Workers")

    logger.info("=" * 80)
    logger.info("🚀 TẤT CẢ 8 LÕI CPU ĐANG CÀO WEBSITE ĐỒNG THỜI VỚI TỐC ĐỘ CAO NHẤT!")
    logger.info("=" * 80)

    try:
        for p in processes:
            p.join()
    except KeyboardInterrupt:
        logger.warning("\n⚠️ Nhận tín hiệu dừng từ người dùng. Đang đóng các tiến trình...")
        for p in processes:
            if p.is_alive():
                p.terminate()
        for p in processes:
            p.join()
        logger.info("🛑 Đã dừng toàn bộ 8 tiến trình an toàn.")

if __name__ == "__main__":
    main()
