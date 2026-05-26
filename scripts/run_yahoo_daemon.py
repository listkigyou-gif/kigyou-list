#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Independent Yahoo Crawler 24/7 Daemon
=================================================
Manages Yahoo crawler workers independently of the HelloWork orchestrator.
- Queries SQLite database for companies needing Yahoo crawling.
- Spawns and monitors up to 50 parallel yahoo_searcher.py workers.
- Periodically merges CSV results and runs incremental ETL (Staging Load,
  Consolidation, Postgres Sync) based on time (default: 2 hours) or record count
  (default: 5,000 new records).
- Re-queries queue and starts next batch automatically to run 24/7.
"""

import os
import sys
import time
import csv
import sqlite3
import subprocess
import argparse
import logging
from datetime import datetime
import urllib.request
import tarfile
import base64
import json

# Reconfigure stdout to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# Setup paths relative to workspace root
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(SCRIPTS_DIR, ".."))
DB_PATH = os.path.join(WORKSPACE_ROOT, "kigyou-list.db")

# Setup logging
log_file_path = os.path.join(WORKSPACE_ROOT, "yahoo_daemon.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_file_path, mode="a", encoding="utf-8")
    ]
)
logger = logging.getLogger("yahoo_daemon")

# Danh sách tất cả các cổng proxy có sẵn của Yahoo
ALL_PORTS = [40001, 40002, 40003, 40004, 40005] + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))

def log_banner(title):
    logger.info("=" * 80)
    logger.info(f"  {title}")
    logger.info("=" * 80)

def run_command(args, cwd, description):
    logger.info(f"[*] Running: {description}")
    logger.info(f"    Command: {' '.join(args)}")
    logger.info(f"    Directory: {cwd}")
    t0 = time.time()
    try:
        process = subprocess.Popen(
            args,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        
        for line in process.stdout:
            logger.info(f"  {line.rstrip()}")
            
        process.wait()
        duration = time.time() - t0
        
        if process.returncode != 0:
            logger.error(f"[-] Failed: {description} (Exit Code: {process.returncode}, Duration: {duration:.1f}s)")
            return False
            
        logger.info(f"[+] Completed: {description} in {duration:.1f}s")
        return True
    except Exception as e:
        logger.error(f"[-] Exception running command '{description}': {e}")
        return False

# global registry of running proxy containers status
DOCKER_PROXIES_OK = False

def ensure_yahoo_proxies(max_workers=None):
    log_banner("VERIFYING YAHOO DOCKER PROXY SERVICES")
    yahoo_dir = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo")
    
    logger.info("[*] Starting Yahoo proxy containers via Docker Compose...")
    try:
        # Run docker compose up -d to start all containers
        result = subprocess.run(
            ["docker", "compose", "up", "-d"],
            cwd=yahoo_dir,
            capture_output=True,
            text=True,
            check=True,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        logger.info("[+] Docker Compose completed successfully.")
        # Wait 3s for SOCKS5 connections to stabilize
        time.sleep(3.0)
        return True
    except Exception as e:
        logger.error(f"[-] Failed to start Docker proxy containers: {e}")
        return False


def query_companies_batch(batch_size):
    logger.info(f"[*] Querying DB for next batch of {batch_size} companies needing Yahoo Maps crawl...")
    companies = []
    
    if not os.path.exists(DB_PATH):
        logger.error(f"[-] Database not found at: {DB_PATH}")
        return []
        
    try:
        # Open connection with timeout=60 and enable WAL mode
        conn = sqlite3.connect(DB_PATH, timeout=60.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        cur = conn.cursor()
        
        # Load done companies from output CSVs first to ensure we don't repeat them
        done_companies = set()
        yahoo_data_dir = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo", "data")
        basic_csv = os.path.join(yahoo_data_dir, "companies_basic.csv")
        if os.path.exists(basic_csv):
            try:
                with open(basic_csv, "r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    for r in reader:
                        c_num = r.get("corp_num")
                        if c_num:
                            done_companies.add(c_num)
            except Exception:
                pass

        for port in ALL_PORTS:
            res_file = os.path.join(yahoo_data_dir, f"results_{port}.csv")
            if os.path.exists(res_file):
                try:
                    with open(res_file, "r", encoding="utf-8-sig") as f:
                        reader = csv.DictReader(f)
                        for r in reader:
                            c_num = r.get("corp_num")
                            if c_num:
                                done_companies.add(c_num)
                except Exception:
                    pass
                    
        logger.info(f"[+] Loaded {len(done_companies)} already-crawled corporate numbers in memory.")
        
        # Fetch matching rows from DB
        cur.execute("""
            SELECT corporate_number, company_name, full_address, prefecture_name, city_name
            FROM companies
            WHERE (yahoo_last_crawled_at IS NULL
               OR datetime(yahoo_last_crawled_at) < datetime('now', '-360 days'))
            LIMIT ?
        """, (batch_size + len(done_companies),))
        
        for row in cur.fetchall():
            c_num = row[0]
            if c_num and c_num not in done_companies:
                companies.append({
                    "corp_num": c_num,
                    "name": row[1] or "",
                    "address": row[2] or "",
                    "prefecture": row[3] or "",
                    "city": row[4] or "",
                    "corp_type": "",
                    "corp_type_name": ""
                })
                if len(companies) >= batch_size:
                    break
        conn.close()
        logger.info(f"[+] Retrieved {len(companies)} companies to crawl.")
    except Exception as e:
        logger.error(f"[-] Error querying SQLite database: {e}")
        
    return companies

def spawn_yahoo_workers(companies_todo, max_workers):
    yahoo_dir = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo")
    yahoo_data_dir = os.path.join(yahoo_dir, "data")
    ports = ALL_PORTS[:max_workers]
    
    # Split the todo list into partition CSVs
    parts_dir = os.path.join(yahoo_data_dir, "parts")
    os.makedirs(parts_dir, exist_ok=True)
    
    # Remove old parts
    for f_name in os.listdir(parts_dir):
        if f_name.endswith(".csv"):
            try:
                os.remove(os.path.join(parts_dir, f_name))
            except Exception:
                pass

    num_parts = len(ports)
    chunk_size = (len(companies_todo) + num_parts - 1) // num_parts
    fieldnames = ["corp_num", "name", "address", "prefecture", "city", "corp_type", "corp_type_name"]

    active_parts_count = 0
    for i in range(num_parts):
        chunk = companies_todo[i * chunk_size : (i + 1) * chunk_size]
        if not chunk:
            continue
        part_path = os.path.join(parts_dir, f"part_{i+1}.csv")
        try:
            with open(part_path, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(chunk)
            active_parts_count += 1
        except Exception as e:
            logger.error(f"[-] Failed to write partition file {part_path}: {e}")
            return None

    logger.info(f"[+] Wrote {active_parts_count} partition files under {parts_dir}.")

    # Spawn yahoo_searcher.py workers (non-blocking)
    logs_dir = os.path.join(yahoo_dir, "logs")
    os.makedirs(logs_dir, exist_ok=True)
    
    processes = []
    for i in range(active_parts_count):
        port = ports[i]
        part_file = os.path.join("data", "parts", f"part_{i+1}.csv")
        out_file = os.path.join("data", f"results_{port}.csv")
        log_file = os.path.join("logs", f"crawler_{port}.log")
        cmd = [
            sys.executable, "-u", "yahoo_searcher.py",
            "--input", part_file,
            "--output", out_file,
            "--proxy-port", str(port),
            "--log-file", log_file,
            "--headless"
        ]
        
        # Add staggered delay between worker startup (except the first one) to reduce CPU spikes
        if i > 0:
            time.sleep(1.5)
            
        try:
            p = subprocess.Popen(
                cmd,
                cwd=yahoo_dir,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            processes.append((p, port))
            logger.info(f"[+] Spawned worker for port {port} (PID: {p.pid}) - Staggered {i+1}/{active_parts_count}")
        except Exception as e:
            logger.error(f"[-] Failed to start Yahoo worker for port {port}: {e}")
            # Terminate already-started workers
            for started_p, _ in processes:
                started_p.terminate()
            return None

    logger.info(f"[*] Successfully spawned {len(processes)} Yahoo Maps crawler workers.")
    return processes

def count_crawled_records():
    yahoo_data_dir = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo", "data")
    total_records = 0
    for port in ALL_PORTS:
        res_file = os.path.join(yahoo_data_dir, f"results_{port}.csv")
        if os.path.exists(res_file):
            try:
                with open(res_file, "r", encoding="utf-8-sig") as f:
                    reader = csv.reader(f)
                    next(reader, None) # skip header
                    total_records += sum(1 for _ in reader)
            except Exception:
                pass
    return total_records

def merge_yahoo_results():
    yahoo_dir = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo")
    yahoo_data_dir = os.path.join(yahoo_dir, "data")
    basic_csv = os.path.join(yahoo_data_dir, "companies_basic.csv")

    logger.info("[*] Merging Yahoo partition CSVs into companies_basic.csv...")
    merged_rows = []
    if os.path.exists(basic_csv):
        try:
            with open(basic_csv, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    merged_rows.append(r)
        except Exception as e:
            logger.warning(f"[!] Warning reading existing companies_basic.csv: {e}")

    merged_corp_nums = {row["corp_num"] for row in merged_rows if row.get("corp_num")}
    new_rows_count = 0
    for port in ALL_PORTS:
        res_file = os.path.join(yahoo_data_dir, f"results_{port}.csv")
        if os.path.exists(res_file):
            try:
                with open(res_file, "r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    for r in reader:
                        c_num = r.get("corp_num")
                        if c_num and c_num not in merged_corp_nums:
                            merged_rows.append(r)
                            merged_corp_nums.add(c_num)
                            new_rows_count += 1
            except Exception as e:
                logger.error(f"[-] Error reading result CSV for port {port}: {e}")

    logger.info(f"[+] Merged {new_rows_count} new Yahoo rows (Total unique: {len(merged_rows)}).")
    out_fields = [
        "corp_num", "name", "address", "prefecture", "city", "corp_type", "corp_type_name",
        "gid", "y_name", "y_address", "phone", "website"
    ]
    try:
        with open(basic_csv, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=out_fields)
            writer.writeheader()
            for r in merged_rows:
                writer.writerow({k: r.get(k, "") for k in out_fields})
        logger.info(f"[+] Saved merged Yahoo results to {basic_csv}")
        return True
    except Exception as e:
        logger.error(f"[-] Failed to write companies_basic.csv: {e}")
        return False

def run_incremental_etl():
    log_banner("TRIGGERING INCREMENTAL ETL PIPELINE (STAGING, CONSOLIDATION, POSTGRES SYNC)")
    
    # 1. Merge CSVs first
    merge_yahoo_results()
    
    # 2. Run ETL pipeline steps 3, 5, 7
    pipeline_script = os.path.join(WORKSPACE_ROOT, "scripts/run_pipeline.py")
    logger.info("[*] Running ETL pipeline steps 3, 5, 7...")
    if not run_command([sys.executable, "-u", pipeline_script, "--steps", "3,5,7", "--limit", "0"], WORKSPACE_ROOT, "ETL Pipeline Orchestrator (Steps 3,5,7)"):
        logger.error("[-] Failed to run ETL pipeline steps 3,5,7.")
        return False

    logger.info("[+] Incremental ETL pipeline completed successfully.")
    return True

def terminate_workers(processes):
    if not processes:
        return
    logger.info(f"[*] Stopping all {len(processes)} Yahoo crawler processes...")
    for p, port in processes:
        if p.poll() is None:
            p.terminate()
    # Wait for clean exit
    deadline = time.time() + 15
    for p, port in processes:
        rem = max(0, deadline - time.time())
        try:
            p.wait(timeout=rem)
        except Exception:
            p.kill()
            logger.warning(f"    [!] Force killed Port {port}")

def main():
    parser = argparse.ArgumentParser(description="Kigyou-list Independent Yahoo Crawler Daemon")
    parser.add_argument("--batch-size", type=int, default=50000, help="Batch size of companies to crawl in one cycle")
    parser.add_argument("--interval-hours", type=float, default=2.0, help="Interval in hours for periodic ETL")
    parser.add_argument("--interval-records", type=int, default=5000, help="Record count threshold to trigger ETL")
    parser.add_argument("--limit", type=int, default=0, help="Maximum number of records to process overall (0 = no limit)")
    parser.add_argument("--max-workers", type=int, default=6, help="Maximum number of parallel Yahoo crawler workers to spawn")
    args = parser.parse_args()

    log_banner("YAHOO CRAWLER DAEMON SERVICE STARTING")
    logger.info(f"Batch Size:       {args.batch_size}")
    logger.info(f"Max Workers:      {args.max_workers}")
    logger.info(f"ETL Time Interval: {args.interval_hours} hours")
    logger.info(f"ETL Record Count:  {args.interval_records} records")
    logger.info(f"Overall Limit:    {args.limit or 'NONE'}")
    
    # 0. Ensure Docker Warp containers for Yahoo are running
    if not ensure_yahoo_proxies(args.max_workers):
        logger.error("[-] Yahoo proxies check failed. Exiting daemon.")
        sys.exit(1)

    total_processed_overall = 0
    cycle = 1

    # Khởi chạy Yahoo Watchdog Service chạy song song trọn đời
    watchdog_process = None
    try:
        watchdog_script = os.path.join(SCRIPTS_DIR, "yahoo_watchdog.py")
        logger.info("[*] Starting Yahoo Watchdog Service running in background...")
        watchdog_flags = subprocess.DETACHED_PROCESS
        if sys.platform == "win32":
            watchdog_flags |= subprocess.CREATE_NO_WINDOW
        watchdog_process = subprocess.Popen(
            [sys.executable, "-u", watchdog_script, "--interval-seconds", "120"],
            cwd=WORKSPACE_ROOT,
            creationflags=watchdog_flags
        )
    except Exception as e:
        logger.error(f"[-] Failed to start Yahoo Watchdog: {e}")

    try:
        while True:
            # Check overall limit
            if args.limit > 0 and total_processed_overall >= args.limit:
                logger.info(f"[+] Reached overall limit of {args.limit} companies. Daemon stopping.")
                break

            current_batch_size = args.batch_size
            if args.limit > 0:
                rem_limit = args.limit - total_processed_overall
                current_batch_size = min(args.batch_size, rem_limit)

            log_banner(f"DAEMON CYCLE {cycle} - FETCHING QUEUE")
            todo_companies = query_companies_batch(current_batch_size)
            
            if not todo_companies:
                logger.info("[~] Queue empty. No companies need Yahoo Maps crawing. Waiting 5 minutes...")
                time.sleep(300)
                continue

            log_banner(f"DAEMON CYCLE {cycle} - STARTING CRAWLERS")
            processes = spawn_yahoo_workers(todo_companies, args.max_workers)
            if not processes:
                logger.error("[-] Failed to spawn Yahoo workers. Retrying in 1 minute...")
                time.sleep(60)
                continue

            last_etl_time = time.time()
            last_etl_records = count_crawled_records()
            logger.info(f"[+] Initial record count in CSVs: {last_etl_records}")

            # Cooldown respawn registry (port -> next_allowed_spawn_time)
            pending_respawns = {}

            # Monitoring Loop
            while True:
                # Wait 10 seconds between checks
                time.sleep(10)
                
                # Check status of active workers
                alive_workers = []
                for p, port in processes:
                    if p.poll() is None:
                        alive_workers.append((p, port))
                    else:
                        if p.returncode != 0:
                            if port not in pending_respawns:
                                pending_respawns[port] = time.time() + 15.0
                                logger.warning(f"[!] Yahoo worker on port {port} exited with code {p.returncode}. Scheduled respawn in 15s cooldown.")
                        else:
                            logger.info(f"[+] Yahoo worker on port {port} finished cleanly.")
                
                # Handle pending respawns whose cooldown has expired
                now = time.time()
                for port in list(pending_respawns.keys()):
                    allowed_time = pending_respawns[port]
                    if now >= allowed_time:
                        logger.info(f"[*] Cooldown expired for port {port}. Respawning worker...")
                        try:
                            ports = ALL_PORTS[:args.max_workers]
                            part_index = ports.index(port) + 1
                            part_file = os.path.join("data", "parts", f"part_{part_index}.csv")
                            out_file = os.path.join("data", f"results_{port}.csv")
                            log_file = os.path.join("logs", f"crawler_{port}.log")
                            cmd = [
                                sys.executable, "-u", "yahoo_searcher.py",
                                "--input", part_file,
                                "--output", out_file,
                                "--proxy-port", str(port),
                                "--log-file", log_file,
                                "--headless"
                            ]
                            p_new = subprocess.Popen(
                                cmd,
                                cwd=os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo"),
                                stdout=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL,
                                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                            )
                            alive_workers.append((p_new, port))
                            logger.info(f"[+] Successfully respawned Yahoo worker on port {port} after cooldown (New PID: {p_new.pid})")
                            # Remove from pending queue
                            pending_respawns.pop(port, None)
                        except Exception as e:
                            logger.error(f"[-] Failed to respawn Yahoo worker on port {port}: {e}")
                            # Keep in pending_respawns to retry in next cycle (extend cooldown)
                            pending_respawns[port] = now + 15.0
                
                # Update active process list
                processes = alive_workers
                
                # Check record count and time elapsed for periodic ETL
                current_records = count_crawled_records()
                new_records_crawled = current_records - last_etl_records
                time_elapsed = time.time() - last_etl_time
                
                if (new_records_crawled >= args.interval_records) or (time_elapsed >= args.interval_hours * 3600):
                    logger.info(f"[*] ETL Trigger Met: New records={new_records_crawled}/{args.interval_records}, Elapsed time={time_elapsed/60:.1f}/{args.interval_hours*60:.1f} mins")
                    try:
                        run_incremental_etl()
                    except Exception as e:
                        logger.error(f"[-] Error during periodic ETL: {e}")
                    # Reset thresholds
                    last_etl_time = time.time()
                    last_etl_records = count_crawled_records()

                # Check if all workers are done (none running and none pending cooldown)
                if not processes and not pending_respawns:
                    logger.info("[+] All Yahoo crawler workers for this batch have finished.")
                    # Giải phóng tài nguyên: Dọn dẹp sạch sẽ các chrome headless mồ côi tích tụ
                    logger.info("[*] Cleaning up potential zombie chrome processes to free RAM...")
                    try:
                        subprocess.run(
                            ["taskkill", "/F", "/IM", "chrome-headless-shell.exe"],
                            capture_output=True,
                            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                        )
                    except Exception as e:
                        logger.warning(f"[!] Failed to clean zombie chromes: {e}")
                    break

            # Batch finished -> Run final ETL and merge for this batch
            logger.info("[*] Running final ETL sync for this batch...")
            try:
                run_incremental_etl()
            except Exception as e:
                logger.error(f"[-] Error during final ETL: {e}")
                
            total_processed_overall += len(todo_companies)
            logger.info(f"[+] Daemon Cycle {cycle} complete. Total processed overall: {total_processed_overall}")
            cycle += 1
            
            # Cooldown between batches
            logger.info("[*] Cooling down for 30 seconds before next batch...")
            time.sleep(30)

    except KeyboardInterrupt:
        logger.info("[!] Daemon interrupted by user. Stopping crawlers, watchdog and wireproxies...")
        if watchdog_process and watchdog_process.poll() is None:
            watchdog_process.terminate()
        terminate_workers(processes)
        terminate_wireproxies()
        sys.exit(0)
    except Exception as e:
        logger.error(f"[-] Fatal daemon error: {e}")
        if watchdog_process and watchdog_process.poll() is None:
            watchdog_process.terminate()
        terminate_workers(processes)
        terminate_wireproxies()
        sys.exit(1)

if __name__ == "__main__":
    main()
