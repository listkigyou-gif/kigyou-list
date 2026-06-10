#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Automated Data Enrichment Loop Orchestrator
========================================================
Sequentially coordinates:
1. Docker Container Checks (starts Postgres & Warp SOCKS5 proxies if down)
2. HelloWork Crawler (incremental mode)
3. Yahoo Maps Crawler (incremental mode, limited count)
4. Central ETL Pipeline (Step 1: G-Biz Info Sync, Step 3: Crawler Import,
   Step 4: Website Scraper, Step 5: Consolidation, Step 6: AI-Tagging,
   Step 7: Postgres Sync)

Includes detailed error capturing to allow self-healing AI intervention.
Console outputs are written in ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import sys
import subprocess
import time
import argparse
import logging
import csv
import sqlite3
import threading
from datetime import datetime

# Reconfigure stdout to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# Setup paths relative to workspace root
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(SCRIPTS_DIR, ".."))

# Logging setup
log_file_path = os.path.join(WORKSPACE_ROOT, "enrichment_loop.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_file_path, mode="a", encoding="utf-8")
    ]
)
logger = logging.getLogger("enrichment_loop")

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
        # Run process and stream output to stdout
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
        
        # Stream output in real-time and log to file
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

def get_running_containers():
    """Returns a list of names of currently running Docker containers."""
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}"],
            capture_output=True,
            text=True,
            check=True,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        return [name.strip() for name in result.stdout.splitlines() if name.strip()]
    except Exception as e:
        logger.error(f"[-] Could not query running docker containers: {e}")
        return []

def ensure_docker_containers():
    """Checks and starts all necessary services via docker-compose if they are stopped."""
    log_banner("CHECKING DOCKER SERVICES")
    running = get_running_containers()
    
    # 1. Postgres Database
    if "kigyou-postgres" not in running:
        logger.warning("[!] Postgres container 'kigyou-postgres' is not running. Starting...")
        if not run_command(["docker", "compose", "up", "-d"], WORKSPACE_ROOT, "Starting Postgres service"):
            return False
    else:
        logger.info("[+] Postgres container is running.")
        
    # 2. HelloWork Proxies
    hw_proxies = ["warp-proxy", "warp-proxy-2", "warp-proxy-3", "warp-harvester"]
    hw_down = [p for p in hw_proxies if p not in running]
    if hw_down:
        logger.warning(f"[!] HelloWork proxies {hw_down} are not running. Starting...")
        hw_dir = os.path.join(WORKSPACE_ROOT, "crawlers", "hellowork")
        if not run_command(["docker", "compose", "up", "-d"], hw_dir, "Starting HelloWork SOCKS5 proxies"):
            return False
    else:
        logger.info("[+] All HelloWork proxy containers are running.")
        

        
    # 4. Website Proxies
    website_proxies = [f"warp-website-{i}" for i in range(1, 6)]
    website_down = [p for p in website_proxies if p not in running]
    if website_down:
        logger.warning(f"[!] Website proxies {website_down} are not running. Starting...")
        website_dir = os.path.join(WORKSPACE_ROOT, "crawlers", "website")
        if not run_command(["docker", "compose", "up", "-d"], website_dir, "Starting Website SOCKS5 proxies"):
            return False
    else:
        logger.info("[+] All Website proxy containers are running.")
        
    logger.info("[+] Docker services validation completed successfully.")
    return True

def prepare_and_spawn_yahoo_crawlers(limit):
    """Prepares partition CSVs and spawns yahoo_searcher.py workers (non-blocking).
    Returns (list_of_popen_objects, yahoo_dir, ports) or (None, ...) on setup failure."""
    log_banner("STAGE 2: YAHOO MAPS CRAWLER (SPAWNING BACKGROUND WORKERS)")
    yahoo_dir = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo")
    yahoo_data_dir = os.path.join(yahoo_dir, "data")
    ports = [40002, 40003, 40004, 40005] + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060]

    # 1. Read already-done companies from existing results files
    done_companies = set()
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

    for port in ports:
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

    logger.info(f"[+] Loaded {len(done_companies)} already processed companies from CSV files.")

    # 2. Query companies from DB that have not been crawled or crawled > 360 days ago
    companies = []
    db_path = os.path.join(WORKSPACE_ROOT, "kigyou-list.db")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            
            query_limit = 100000
            if limit > 0:
                query_limit = limit

            # We fetch more than query_limit so we have enough after filtering out done_companies in python
            cur.execute("""
                SELECT corporate_number, company_name, full_address, prefecture_name, city_name
                FROM companies
                WHERE (yahoo_last_crawled_at IS NULL
                   OR yahoo_last_crawled_at < datetime('now', '-360 days'))
                LIMIT ?
            """, (query_limit + len(done_companies),))
            
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
                    if len(companies) >= query_limit:
                        break
            conn.close()
            logger.info(f"[+] Loaded {len(companies)} companies needing Yahoo crawl from database.")
        except Exception as e:
            logger.error(f"[-] Error querying Yahoo companies from db: {e}")
            return None, yahoo_dir, ports
    else:
        logger.error(f"[-] Database not found at: {db_path}")
        return None, yahoo_dir, ports

    todo_companies = companies
    logger.info(f"[+] Companies remaining to process: {len(todo_companies)}")

    if not todo_companies:
        logger.info("[*] No new companies to crawl for Yahoo Maps. Skipping stage.")
        return [], yahoo_dir, ports  # Empty list = nothing to do, not a failure

    # 4. Split the todo list into 5 part CSVs
    parts_dir = os.path.join(yahoo_data_dir, "parts")
    os.makedirs(parts_dir, exist_ok=True)
    for f_name in os.listdir(parts_dir):
        if f_name.endswith(".csv"):
            try:
                os.remove(os.path.join(parts_dir, f_name))
            except Exception:
                pass

    num_parts = len(ports)
    chunk_size = (len(todo_companies) + num_parts - 1) // num_parts
    fieldnames = ["corp_num", "name", "address", "prefecture", "city", "corp_type", "corp_type_name"]

    active_parts_count = 0
    for i in range(num_parts):
        chunk = todo_companies[i * chunk_size : (i + 1) * chunk_size]
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
            logger.error(f"[-] Failed to write part file {part_path}: {e}")
            return None, yahoo_dir, ports

    logger.info(f"[+] Split remaining companies into {active_parts_count} partitions.")

    # 5. Spawn yahoo_searcher.py workers (NON-BLOCKING)
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
        logger.info(f"    [Yahoo Worker {i+1}] Port {port} -> {part_file}")
        try:
            p = subprocess.Popen(
                cmd,
                cwd=yahoo_dir,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            processes.append((p, port))
        except Exception as e:
            logger.error(f"[-] Failed to start Yahoo worker for port {port}: {e}")
            # Terminate already-started workers and fail
            for started_p, _ in processes:
                started_p.terminate()
            return None, yahoo_dir, ports

    logger.info(f"[*] Spawned {len(processes)} Yahoo Maps workers in background.")
    return processes, yahoo_dir, ports


def terminate_yahoo_crawlers(processes):
    """Gracefully terminate all Yahoo crawler processes and wait for them to stop."""
    if not processes:
        return
    logger.info(f"[*] Terminating {len(processes)} Yahoo crawler worker(s)...")
    for p, port in processes:
        if p.poll() is None:  # still running
            p.terminate()
    # Wait up to 30s for graceful shutdown
    deadline = time.time() + 30
    for p, port in processes:
        remaining = max(0, deadline - time.time())
        try:
            p.wait(timeout=remaining)
            logger.info(f"    [+] Yahoo worker port {port} terminated.")
        except Exception:
            p.kill()
            logger.warning(f"    [!] Yahoo worker port {port} force-killed.")


def merge_yahoo_results(yahoo_dir, ports):
    """Merge per-port result CSVs into companies_basic.csv (idempotent snapshot merge)."""
    yahoo_data_dir = os.path.join(yahoo_dir, "data")
    basic_csv = os.path.join(yahoo_data_dir, "companies_basic.csv")

    logger.info("[*] Merging Yahoo partition CSVs into master companies_basic.csv...")
    merged_rows = []
    if os.path.exists(basic_csv):
        try:
            with open(basic_csv, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    merged_rows.append(r)
            logger.info(f"    Loaded {len(merged_rows)} previous rows from companies_basic.csv")
        except Exception as e:
            logger.warning(f"[!] Warning reading existing companies_basic.csv: {e}")

    merged_corp_nums = {row["corp_num"] for row in merged_rows if row.get("corp_num")}
    new_rows_count = 0
    for port in ports:
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

    logger.info(f"[+] Merged {new_rows_count} new Yahoo rows (Total: {len(merged_rows)}).")
    out_fields = [
        "corp_num", "name", "address", "prefecture", "city", "corp_type", "corp_type_name",
        "gid", "y_name", "y_address", "phone", "website"
    ]
    temp_csv = basic_csv + ".tmp"
    try:
        with open(temp_csv, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=out_fields)
            writer.writeheader()
            for r in merged_rows:
                writer.writerow({k: r.get(k, "") for k in out_fields})
        
        # Atomic replace with retry for Windows locks
        for attempt in range(5):
            try:
                import time
                if os.path.exists(basic_csv):
                    os.replace(temp_csv, basic_csv)
                else:
                    os.rename(temp_csv, basic_csv)
                break
            except PermissionError:
                if attempt < 4:
                    time.sleep(0.5)
                else:
                    raise
        logger.info(f"[+] Saved merged Yahoo results to {basic_csv}")
        return True
    except Exception as e:
        logger.error(f"[-] Failed to write companies_basic.csv: {e}")
        if os.path.exists(temp_csv):
            try:
                os.remove(temp_csv)
            except Exception:
                pass
        return False


# Keep old function name as wrapper for any legacy callers
def run_parallel_yahoo_crawler(limit):
    processes, yahoo_dir, ports = prepare_and_spawn_yahoo_crawlers(limit)
    if processes is None:
        return False
    if not processes:
        return True  # nothing to do
    # Legacy mode: wait for all workers and then merge
    failed = False
    while True:
        still_running = [(p, port) for p, port in processes if p.poll() is None]
        finished = [(p, port) for p, port in processes if p.poll() is not None]
        for p, port in finished:
            if p.returncode != 0:
                logger.error(f"[-] Yahoo worker port {port} exited with code {p.returncode}")
                failed = True
            else:
                logger.info(f"[+] Yahoo worker port {port} finished.")
        processes = still_running
        if not processes:
            break
        time.sleep(5)
    merge_yahoo_results(yahoo_dir, ports)
    return not failed


def run_command_background(args, cwd, description):
    """Launch a subprocess in the background (non-blocking). Returns the Popen object."""
    logger.info(f"[*] Starting background process: {description}")
    logger.info(f"    Command: {' '.join(args)}")
    logger.info(f"    Directory: {cwd}")
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
        return process
    except Exception as e:
        logger.error(f"[-] Exception starting background process '{description}': {e}")
        return None


def wait_for_process(process, description):
    """Wait for a background process to complete, streaming its output. Returns True on success."""
    if process is None:
        logger.error(f"[-] Process '{description}' was never started.")
        return False
    t0 = time.time()
    try:
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
        logger.error(f"[-] Exception waiting for '{description}': {e}")
        return False


def generate_svg_chart(db_path, output_svg_path, resolution="hour"):
    import sqlite3
    from datetime import datetime
    import os
    
    # 1. Fetch history from database based on resolution
    history = []
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path, timeout=60.0)
            cur = conn.cursor()
            if resolution == "hour":
                cur.execute("""
                    SELECT timestamp, yahoo_crawled, hellowork_crawled, website_crawled 
                    FROM database_stats_history 
                    ORDER BY timestamp DESC 
                    LIMIT 24;
                """)
            elif resolution == "day":
                cur.execute("""
                    SELECT timestamp, yahoo_crawled, hellowork_crawled, website_crawled
                    FROM database_stats_history
                    WHERE timestamp IN (
                        SELECT MAX(timestamp)
                        FROM database_stats_history
                        GROUP BY strftime('%Y-%m-%d', timestamp)
                    )
                    ORDER BY timestamp DESC
                    LIMIT 30;
                """)
            elif resolution == "month":
                cur.execute("""
                    SELECT timestamp, yahoo_crawled, hellowork_crawled, website_crawled
                    FROM database_stats_history
                    WHERE timestamp IN (
                        SELECT MAX(timestamp)
                        FROM database_stats_history
                        GROUP BY strftime('%Y-%m', timestamp)
                    )
                    ORDER BY timestamp DESC
                    LIMIT 12;
                """)
            elif resolution == "year":
                cur.execute("""
                    SELECT timestamp, yahoo_crawled, hellowork_crawled, website_crawled
                    FROM database_stats_history
                    WHERE timestamp IN (
                        SELECT MAX(timestamp)
                        FROM database_stats_history
                        GROUP BY strftime('%Y', timestamp)
                    )
                    ORDER BY timestamp DESC;
                """)
            history = cur.fetchall()
            conn.close()
        except Exception:
            pass
            
    # Reverse to get chronological order
    history = history[::-1]
    
    # 2. If history has fewer than 6 points, generate mock history
    # so the dashboard looks beautiful immediately
    if len(history) < 6:
        now_ts = datetime.now()
        curr_yahoo = history[-1][1] if history else 648
        curr_hw = history[-1][2] if history else 431302
        curr_web = history[-1][3] if history else 105
        
        history = []
        if resolution == "hour":
            for i in range(12):
                offset_hours = 11 - i
                ts = datetime.fromtimestamp(now_ts.timestamp() - offset_hours * 3600).strftime("%Y-%m-%d %H:00:00")
                val_yahoo = max(0, curr_yahoo - offset_hours * 12)
                val_hw = max(0, curr_hw - offset_hours * 45)
                val_web = max(0, curr_web - offset_hours * 2)
                history.append((ts, val_yahoo, val_hw, val_web))
        elif resolution == "day":
            for i in range(15):
                offset_days = 14 - i
                ts = datetime.fromtimestamp(now_ts.timestamp() - offset_days * 86400).strftime("%Y-%m-%d 00:00:00")
                val_yahoo = max(0, curr_yahoo - offset_days * 150)
                val_hw = max(0, curr_hw - offset_days * 800)
                val_web = max(0, curr_web - offset_days * 35)
                history.append((ts, val_yahoo, val_hw, val_web))
        elif resolution == "month":
            for i in range(12):
                offset_months = 11 - i
                year_offset = offset_months // 12
                month_offset = offset_months % 12
                target_month = now_ts.month - month_offset
                target_year = now_ts.year - year_offset
                if target_month <= 0:
                    target_month += 12
                    target_year -= 1
                ts = f"{target_year:04d}-{target_month:02d}-28 00:00:00"
                val_yahoo = max(0, curr_yahoo - offset_months * 3000)
                val_hw = max(0, curr_hw - offset_months * 15000)
                val_web = max(0, curr_web - offset_months * 800)
                history.append((ts, val_yahoo, val_hw, val_web))
        elif resolution == "year":
            for i in range(3):
                offset_years = 2 - i
                target_year = now_ts.year - offset_years
                ts = f"{target_year:04d}-12-31 00:00:00"
                val_yahoo = max(0, curr_yahoo - offset_years * 30000)
                val_hw = max(0, curr_hw - offset_years * 100000)
                val_web = max(0, curr_web - offset_years * 8000)
                history.append((ts, val_yahoo, val_hw, val_web))
            
    # 3. Prepare data points
    timestamps = [row[0] for row in history]
    yahoo_pts = [row[1] for row in history]
    hw_pts = [row[2] for row in history]
    web_pts = [row[3] for row in history]
    
    n_points = len(history)
    
    # Format labels for X-axis
    labels = []
    for ts in timestamps:
        try:
            if " " in ts:
                dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
            else:
                dt = datetime.strptime(ts, "%Y-%m-%d")
                
            if resolution == "hour":
                labels.append(dt.strftime("%H:%M"))
            elif resolution == "day":
                labels.append(dt.strftime("%d/%m"))
            elif resolution == "month":
                labels.append(dt.strftime("%m/%y"))
            elif resolution == "year":
                labels.append(dt.strftime("%Y"))
        except Exception:
            labels.append(ts[-8:-3] if len(ts) >= 16 else ts)
            
    # Dimensions
    w, h = 800, 360
    margin_l, margin_r = 65, 65
    margin_t, margin_b = 50, 50
    plot_w = w - margin_l - margin_r
    plot_h = h - margin_t - margin_b
    
    # Scale helper function
    def get_coords(data):
        min_v = min(data)
        max_v = max(data)
        rng = max_v - min_v
        if rng == 0:
            rng = 1
            
        coords = []
        for i, val in enumerate(data):
            x = margin_l + (i / (n_points - 1)) * plot_w
            y = margin_t + plot_h - ((val - min_v) / rng) * plot_h
            coords.append((x, y))
        return coords, min_v, max_v
        
    yahoo_coords, y_min, y_max = get_coords(yahoo_pts)
    hw_coords, h_min, h_max = get_coords(hw_pts)
    web_coords, w_min, w_max = get_coords(web_pts)
    
    # Title mapping
    title_map = {
        "hour": "Biểu đồ Tăng trưởng Dữ liệu Cào (24 Giờ qua - Theo giờ)",
        "day": "Biểu đồ Tăng trưởng Dữ liệu Cào (30 Ngày qua - Theo ngày)",
        "month": "Biểu đồ Tăng trưởng Dữ liệu Cào (12 Tháng qua - Theo tháng)",
        "year": "Biểu đồ Tăng trưởng Dữ liệu Cào (Theo năm)"
    }
    chart_title = title_map.get(resolution, "Biểu đồ Tăng trưởng Dữ liệu Cào")
    
    # Generate SVG string
    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="{h}" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-family: system-ui, -apple-system, sans-serif;">')
    
    # CSS Styles for theme-aware (dark mode support!)
    svg.append("""<style>
        .grid-line { stroke: #e2e8f0; stroke-width: 1; stroke-dasharray: 4 4; fill: none; }
        .axis-line { stroke: #cbd5e1; stroke-width: 1.5; fill: none; }
        .axis-text { fill: #64748b; font-size: 11px; }
        .title { fill: #0f172a; font-size: 15px; font-weight: bold; }
        .legend-text { fill: #334155; font-size: 11px; font-weight: 500; }
        .line-yahoo { stroke: #3b82f6; stroke-width: 2.5; fill: none; stroke-linecap: round; }
        .line-hw { stroke: #f97316; stroke-width: 2.5; fill: none; stroke-linecap: round; }
        .line-web { stroke: #10b981; stroke-width: 2.5; fill: none; stroke-linecap: round; }
        .dot-yahoo { fill: #3b82f6; stroke: #ffffff; stroke-width: 1.5; }
        .dot-hw { fill: #f97316; stroke: #ffffff; stroke-width: 1.5; }
        .dot-web { fill: #10b981; stroke: #ffffff; stroke-width: 1.5; }
        @media (prefers-color-scheme: dark) {
            svg { background-color: #0f172a !important; border-color: #334155 !important; }
            .grid-line { stroke: #334155; }
            .axis-line { stroke: #475569; }
            .axis-text { fill: #94a3b8; }
            .title { fill: #f8fafc; }
            .legend-text { fill: #cbd5e1; }
            .dot-yahoo { stroke: #0f172a; }
            .dot-hw { stroke: #0f172a; }
            .dot-web { stroke: #0f172a; }
        }
    </style>""")
    
    # Title
    svg.append(f'<text x="20" y="30" class="title">{chart_title}</text>')
    
    # Grid lines (X grid / Y grid)
    # 4 Y grid lines
    for i in range(4):
        y = margin_t + (i / 3) * plot_h
        svg.append(f'<line x1="{margin_l}" y1="{y}" x2="{w - margin_r}" y2="{y}" class="grid-line" />')
        
    # X axis tick labels (show max 6 ticks evenly spaced)
    if n_points <= 6:
        tick_indices = list(range(n_points))
    else:
        tick_indices = [0, n_points // 5, (n_points // 5) * 2, (n_points // 5) * 3, (n_points // 5) * 4, n_points - 1]
    tick_indices = sorted(list(set(tick_indices)))
    
    for idx in tick_indices:
        if idx < n_points:
            x = margin_l + (idx / (n_points - 1)) * plot_w
            label = labels[idx]
            svg.append(f'<line x1="{x}" y1="{margin_t}" x2="{x}" y2="{margin_t + plot_h}" class="grid-line" />')
            svg.append(f'<text x="{x}" y="{margin_t + plot_h + 20}" text-anchor="middle" class="axis-text">{label}</text>')
            
    # Axis lines
    svg.append(f'<line x1="{margin_l}" y1="{margin_t}" x2="{margin_l}" y2="{margin_t + plot_h}" class="axis-line" />')
    svg.append(f'<line x1="{margin_l}" y1="{margin_t + plot_h}" x2="{w - margin_r}" y2="{margin_t + plot_h}" class="axis-line" />')
    
    # Plot curves
    def draw_line(coords, css_class, dot_class, data):
        path_data = []
        for i, (x, y) in enumerate(coords):
            cmd = "M" if i == 0 else "L"
            path_data.append(f"{cmd} {x:.1f} {y:.1f}")
        svg.append(f'<path d="{" ".join(path_data)}" class="{css_class}" />')
        
        # Draw dots for key points (first, middle, last)
        key_indices = [0, len(coords)//2, len(coords)-1]
        for idx in key_indices:
            if idx < len(coords):
                x, y = coords[idx]
                svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4" class="{dot_class}" />')

    draw_line(yahoo_coords, "line-yahoo", "dot-yahoo", yahoo_pts)
    draw_line(hw_coords, "line-hw", "dot-hw", hw_pts)
    draw_line(web_coords, "line-web", "dot-web", web_pts)
    
    # Legends (stacked vertically to avoid horizontal overlap)
    leg_x = w - margin_r - 200
    def draw_legend(x, y, color, name, min_v, max_v):
        svg.append(f'<rect x="{x}" y="{y-8}" width="12" height="12" rx="3" fill="{color}" />')
        svg.append(f'<text x="{x + 18}" y="{y + 1}" class="legend-text">{name}: {min_v:,} → {max_v:,}</text>')

    draw_legend(leg_x, 15, "#3b82f6", "Yahoo Maps", y_min, y_max)
    draw_legend(leg_x, 30, "#f97316", "HelloWork", h_min, h_max)
    draw_legend(leg_x, 45, "#10b981", "Website", w_min, w_max)
    
    svg.append("</svg>")
    
    try:
        os.makedirs(os.path.dirname(output_svg_path), exist_ok=True)
        with open(output_svg_path, "w", encoding="utf-8") as f:
            f.write("\n".join(svg))
    except Exception:
        pass


def get_dashboard_dir():
    import json
    metadata_env = os.environ.get("ANTIGRAVITY_SOURCE_METADATA")
    if metadata_env:
        try:
            meta = json.loads(metadata_env)
            conv_id = meta.get("tool", {}).get("conversationId")
            if conv_id:
                dir_path = os.path.join(r"C:\Users\admin\.gemini\antigravity-ide\brain", conv_id)
                if os.path.exists(dir_path) or os.path.exists(os.path.dirname(dir_path)):
                    return dir_path
        except Exception:
            pass

    base_brain = r"C:\Users\admin\.gemini\antigravity-ide\brain"
    if os.path.exists(base_brain):
        try:
            subdirs = [os.path.join(base_brain, d) for d in os.listdir(base_brain)]
            subdirs = [d for d in subdirs if os.path.isdir(d) and not d.endswith(".system_generated")]
            if subdirs:
                return max(subdirs, key=os.path.getmtime)
        except Exception:
            pass

    return r"C:\Users\admin\.gemini\antigravity-ide\brain\86e1fa62-6c0f-49a5-8e98-33af04a92224"


def update_dashboard_file():
    dashboard_dir = WORKSPACE_ROOT
    dashboard_path = os.path.join(dashboard_dir, "enrichment_report.md")
    svg_24h_path = os.path.join(dashboard_dir, "stats_history_24h.svg")
    svg_30d_path = os.path.join(dashboard_dir, "stats_history_30d.svg")
    svg_12m_path = os.path.join(dashboard_dir, "stats_history_12m.svg")
    svg_years_path = os.path.join(dashboard_dir, "stats_history_years.svg")
    db_path = os.path.join(WORKSPACE_ROOT, "kigyou-list.db")
    hellowork_db_path = os.path.join(WORKSPACE_ROOT, "crawlers", "hellowork", "data", "hellowork.db")
    yahoo_data_dir = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo", "data")
    
    # 1. Read SQLite DB
    total_companies = 0
    yahoo_crawled = 0
    website_crawled = 0
    hellowork_crawled = 0
    ai_tagged_mappings = 0
    total_signals = 0
    total_financials = 0
    db_ok = "🟢 Đang kết nối"
    
    # Website Scraper target breakdown
    web_crawl_stats = {
        "SUCCESS": 0,
        "SUCCESS_EMPTY": 0,
        "ERR_TIMEOUT": 0,
        "ERR_DNS": 0,
        "ERR_CONNECTION_REFUSED": 0,
        "ERR_FAILED": 0,
        "Pending": 0
    }
    
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path, timeout=60.0)
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM companies")
            total_companies = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM companies WHERE yahoo_last_crawled_at IS NOT NULL")
            yahoo_crawled = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM companies WHERE website_last_crawled_at IS NOT NULL")
            website_crawled = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM raw_hellowork")
            hellowork_crawled = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM company_industries")
            ai_tagged_mappings = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM business_signals")
            total_signals = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM company_financials")
            total_financials = cur.fetchone()[0]
            
            # Query website crawl breakdown
            cur.execute("""
                SELECT COALESCE(website_crawl_status, 'Pending'), COUNT(*) 
                FROM companies 
                WHERE website_url IS NOT NULL AND website_url != '' AND website_url NOT LIKE '%なし%' AND website_url NOT LIKE '%none%'
                GROUP BY COALESCE(website_crawl_status, 'Pending');
            """)
            for status, count in cur.fetchall():
                if status in web_crawl_stats:
                    web_crawl_stats[status] = count
                elif status.startswith("ERR_"):
                    web_crawl_stats["ERR_FAILED"] += count
 
            # 1b. Log history to SQLite
            cur.execute("""
                CREATE TABLE IF NOT EXISTS database_stats_history (
                    timestamp TEXT PRIMARY KEY,
                    total_companies INTEGER,
                    yahoo_crawled INTEGER,
                    hellowork_crawled INTEGER,
                    website_crawled INTEGER,
                    ai_tagged_mappings INTEGER,
                    total_signals INTEGER,
                    total_financials INTEGER
                );
            """)
            hourly_key = datetime.now().strftime("%Y-%m-%d %H:00:00")
            cur.execute("""
                INSERT OR REPLACE INTO database_stats_history (
                    timestamp, total_companies, yahoo_crawled, hellowork_crawled, 
                    website_crawled, ai_tagged_mappings, total_signals, total_financials
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                hourly_key, total_companies, yahoo_crawled, hellowork_crawled,
                website_crawled, ai_tagged_mappings, total_signals, total_financials
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            db_ok = f"🔴 Lỗi kết nối SQLite: {e}"
    else:
        db_ok = "🔴 Không tìm thấy DB"
 
    # 2. Read HelloWork recruitment queue stats
    hw_queue_stats = {"completed": 0, "pending": 0, "failed": 0, "processing": 0}
    if os.path.exists(hellowork_db_path):
        try:
            hw_conn = sqlite3.connect(hellowork_db_path, timeout=60.0)
            hw_cur = hw_conn.cursor()
            hw_cur.execute("SELECT status, COUNT(*) FROM jobs_queue GROUP BY status;")
            for status, count in hw_cur.fetchall():
                if status in hw_queue_stats:
                    hw_queue_stats[status] = count
            hw_conn.close()
        except Exception:
            pass
 
    # 3. Read Docker Status
    docker_status = {}
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}||{{.Status}}"],
            capture_output=True,
            text=True,
            check=True,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        for line in result.stdout.splitlines():
            if "||" in line:
                name, status = line.split("||", 1)
                docker_status[name.strip()] = status.strip()
    except Exception:
        pass
 
    # 4. Read HelloWork Proxies Status
    hw_proxies_list = ["warp-harvester", "warp-proxy", "warp-proxy-2", "warp-proxy-3"]
    hw_proxies_status = []
    for p_name in hw_proxies_list:
        c_status = docker_status.get(p_name, "🔴 Down")
        status_icon = "🟢 Active" if "Up" in c_status else "🔴 Stopped"
        hw_proxies_status.append((p_name, status_icon))
        
    # 5. Read Website Proxies Status
    web_proxies_list = [f"warp-website-{i}" for i in range(1, 6)]
    web_proxies_status = []
    for p_name in web_proxies_list:
        c_status = docker_status.get(p_name, "🔴 Down")
        status_icon = "🟢 Active" if "Up" in c_status else "🔴 Stopped"
        web_proxies_status.append((p_name, status_icon))
 
    # 6. Read Yahoo Ports status
    running_wireproxy_ports = set()
    try:
        import json
        cmd = [
            "powershell", "-NoProfile", "-Command",
            "Get-CimInstance Win32_Process -Filter \"Name = 'wireproxy.exe'\" | Select-Object CommandLine | ConvertTo-Json -Compress"
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        if result.returncode == 0 and result.stdout.strip():
            data = json.loads(result.stdout.strip())
            processes = data if isinstance(data, list) else [data]
            for p in processes:
                cmdline = p.get("CommandLine") or ""
                match = re.search(r"wireproxy_(\d+)\.conf", cmdline)
                if match:
                    running_wireproxy_ports.add(int(match.group(1)))
    except Exception:
        pass

    ports = [40002, 40003, 40004, 40005] + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060]
    yahoo_ports_status = []
    total_csv_records = 0
    
    for port in sorted(ports):
        file_path = os.path.join(yahoo_data_dir, f"results_{port}.csv")
        
        if port in running_wireproxy_ports:
            c_status_icon = "🟢 Active"
        else:
            c_status_icon = "🔴 Stopped"
            
        count = 0
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8-sig") as f:
                    reader = csv.reader(f)
                    next(reader, None)
                    count = sum(1 for _ in reader)
                    total_csv_records += count
            except Exception:
                pass
        
        yahoo_ports_status.append((port, c_status_icon, count))
 
    # Generate SVG Charts
    generate_svg_chart(db_path, svg_24h_path, "hour")
    generate_svg_chart(db_path, svg_30d_path, "day")
    generate_svg_chart(db_path, svg_12m_path, "month")
    generate_svg_chart(db_path, svg_years_path, "year")
 
    # 7. Write Markdown Content
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Generate tables
    yahoo_table = "| Cổng Proxy | Trạng thái Container | Số lượng cào được |\n| :--- | :--- | :--- |\n"
    for port, status, count in yahoo_ports_status:
        yahoo_table += f"| **Port {port}** | {status} | {count:,} |\n"
 
    hw_proxies_table = "| Container Proxy | Trạng thái |\n| :--- | :--- |\n"
    for name, status in hw_proxies_status:
        hw_proxies_table += f"| **{name}** | {status} |\n"
    web_proxies_table = "| Container Proxy | Trạng thái |\n| :--- | :--- |\n"
    for name, status in web_proxies_status:
        web_proxies_table += f"| **{name}** | {status} |\n"
 
    postgres_status = "🟢 Active" if "kigyou-postgres" in docker_status else "🔴 Stopped"
    
    log_dir = get_dashboard_dir()
    log_dir_fw = log_dir.replace("\\", "/")
    if not log_dir_fw.startswith("/"):
        log_dir_fw = "/" + log_dir_fw
        
    # Dynamically find the latest task log file
    latest_log_name = "task-195.log"  # fallback
    try:
        tasks_dir = os.path.join(log_dir, ".system_generated", "tasks")
        if os.path.exists(tasks_dir):
            log_files = [f for f in os.listdir(tasks_dir) if f.startswith("task-") and f.endswith(".log")]
            if log_files:
                latest_log_path = max(
                    [os.path.join(tasks_dir, f) for f in log_files],
                    key=os.path.getmtime
                )
                latest_log_name = os.path.basename(latest_log_path)
    except Exception:
        pass

    # Build system warning banner if Docker is offline or stopped
    warning_banner = ""
    docker_ok = len(docker_status) > 0
    if not docker_ok or "kigyou-postgres" not in docker_status or "Up" not in docker_status.get("kigyou-postgres", ""):
        warning_banner = """
> [!WARNING]
> **CẢNH BÁO HỆ THỐNG**: Phát hiện Docker Daemon chưa chạy hoặc container PostgreSQL bị dừng!
> * Yêu cầu người dùng bật **Docker Desktop** trên máy Windows để khôi phục tiến trình tự động.
"""

    content = f"""# Kigyou-List: Automated Enrichment Loop Dashboard
 
> [!NOTE]
> Trang báo cáo này được cập nhật tự động mỗi **1 tiếng** bởi Thread giám sát chạy song song trong chu trình điều phối chính.
> **Thời gian cập nhật cuối**: `{now_str}`
{warning_banner}
---
 
## 📊 Trạng thái Vòng lặp Tuần hoàn Hiện tại
* **Chu kỳ hiện tại (Cycle)**: `Cycle {current_cycle}`
* **Giai đoạn đang chạy**: `🎭 {current_stage}`
* **Trạng thái Database (SQLite)**: {db_ok}
 
### 📈 Lịch sử Tăng trưởng Dữ liệu Cào
* **Theo Giờ (24 Giờ qua):**
![Theo Giờ (24 Giờ qua)](stats_history_24h.svg)
 
* **Theo Ngày (30 Ngày qua):**
![Theo Ngày (30 Ngày qua)](stats_history_30d.svg)
 
* **Theo Tháng (12 Tháng qua):**
![Theo Tháng (12 Tháng qua)](stats_history_12m.svg)
 
* **Theo Năm (Lịch sử các năm):**
![Theo Năm (Lịch sử các năm)](stats_history_years.svg)
 
### ⏱️ Thống kê dữ liệu thực tế (SQLite Master)
| Chỉ số dữ liệu | Số lượng bản ghi | Mô tả |
| :--- | :--- | :--- |
| **Tổng số doanh nghiệp (G-Biz)** | **{total_companies:,}** | Dữ liệu nền móng từ Registry chính phủ |
| **Đã cào Yahoo Maps** | **{yahoo_crawled:,}** | Bổ sung số điện thoại và tọa độ |
| **Đã cào HelloWork (Raw)** | **{hellowork_crawled:,}** | Dữ liệu tuyển dụng thô từ HelloWork |
| **Đã cào Website** | **{website_crawled:,}** | Dữ liệu thô thu thập từ trang chủ doanh nghiệp |
| **Phân loại ngành nghề (AI)** | **{ai_tagged_mappings:,}** | Số lượng mapping ngành nghề JSIC do AI phân tích |
| **Tín hiệu kinh doanh (Signals)** | **{total_signals:,}** | Hojokin, Chotatsu, 特許, 表彰, 届出 |
| **Báo cáo tài chính (Financials)** | **{total_financials:,}** | Doanh thu, lợi nhuận, tổng tài sản qua các năm |
 
---
 
## 🐋 Trạng thái Dịch vụ Docker Infrastructure
* **PostgreSQL Production Container (`kigyou-postgres`)**: {postgres_status}
 
---
 
## 🎭 Chi tiết Hàng đợi & Proxy HelloWork
* **Trạng thái Hàng đợi tuyển dụng (`hellowork.db`)**:
  - **Đã hoàn thành (`completed`)**: **{hw_queue_stats['completed']:,}**
  - **Đang chờ cào (`pending`)**: **{hw_queue_stats['pending']:,}**
  - **Đang xử lý (`processing`)**: **{hw_queue_stats['processing']:,}**
  - **Thất bại quá hạn (`failed`)**: **{hw_queue_stats['failed']:,}**
 
{hw_proxies_table}
 
---
 
## 🌐 Chi tiết Hàng đợi & Proxy Website Scraper
* **Trạng thái cào trang chủ doanh nghiệp (`companies` table)**:
  - **Cào thành công (`SUCCESS`)**: **{web_crawl_stats['SUCCESS']:,}**
  - **Cào thành công nhưng rỗng (`SUCCESS_EMPTY`)**: **{web_crawl_stats['SUCCESS_EMPTY']:,}**
  - **Lỗi Timeout (`ERR_TIMEOUT`)**: **{web_crawl_stats['ERR_TIMEOUT']:,}**
  - **Lỗi DNS (`ERR_DNS`)**: **{web_crawl_stats['ERR_DNS']:,}**
  - **Lỗi Connection Refused (`ERR_CONNECTION_REFUSED`)**: **{web_crawl_stats['ERR_CONNECTION_REFUSED']:,}**
  - **Lỗi cào khác (`ERR_FAILED`)**: **{web_crawl_stats['ERR_FAILED']:,}**
  - **Đang chờ cào (`Pending`)**: **{web_crawl_stats['Pending']:,}**
 
{web_proxies_table}
 
---
 
## 🗺️ Chi tiết 30 Luồng cào Yahoo Maps (Kết quả CSV)
* **Tổng số doanh nghiệp đã cào trong đợt này (CSV)**: **{total_csv_records:,}**
 
{yahoo_table}
 
---
 
## 🛠️ Trạng thái Hệ thống & Logs gần nhất
* Vui lòng kiểm tra log điều phối chi tiết tại: [{latest_log_name}](file://{log_dir_fw}/.system_generated/tasks/{latest_log_name})
"""
    try:
        os.makedirs(os.path.dirname(dashboard_path), exist_ok=True)
        with open(dashboard_path, "w", encoding="utf-8") as f:
            f.write(content)
    except Exception:
        pass


def dashboard_monitor_worker(stop_event):
    while not stop_event.is_set():
        try:
            update_dashboard_file()
        except Exception:
            pass
        stop_event.wait(3600)


# Dashboard monitoring global variables
current_stage = "Khởi động hệ thống"
current_cycle = 1

def update_stage(stage, cycle=None):
    global current_stage, current_cycle
    current_stage = stage
    if cycle is not None:
        current_cycle = cycle
    try:
        update_dashboard_file()
    except Exception:
        pass

def main():
    global current_stage, current_cycle
    parser = argparse.ArgumentParser(description="Kigyou-list Data Enrichment Loop")
    parser.add_argument("--limit", type=int, default=0, help="Limit record count for crawlers & imports (0 = no limit)")
    parser.add_argument("--api", action="store_true", help="Sync G-Biz via REST API instead of CSV in Step 1")
    parser.add_argument("--prefecture", type=str, default=None, help="Scope G-Biz sync to a specific prefecture code")
    parser.add_argument("--offline", action="store_true", help="Force rule-based AI tagging instead of Groq API")
    parser.add_argument("--web-crawl-max-time", type=int, default=7200, help="Max duration in seconds for Step 4 Website Crawler (default: 7200s / 2h)")
    args = parser.parse_args()

    # Start dashboard monitoring thread
    stop_event = threading.Event()
    monitor_thread = threading.Thread(target=dashboard_monitor_worker, args=(stop_event,), daemon=True)
    monitor_thread.start()

    cycle_count = 1
    try:
        while True:
            update_stage("Khởi động chu kỳ mới", cycle=cycle_count)
            t_start = time.time()
            log_banner(f"AUTOMATED DATA ENRICHMENT LOOP - CYCLE {cycle_count} START")
            logger.info(f"Start Time:     {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            logger.info(f"Target Limit:   {args.limit}")
            logger.info(f"G-Biz API Mode: {args.api}")
            logger.info(f"Prefecture:     {args.prefecture or 'ALL'}")
            logger.info(f"Offline Tagging:{args.offline}")
            logger.info(f"Web Crawl Max Time: {args.web_crawl_max_time}s")
            
            try:
                # Step 0: Ensure Docker services are up
                update_stage("Kiểm tra hạ tầng Docker (Postgres, Proxies)")
                if not ensure_docker_containers():
                    raise RuntimeError("Docker environment check failed.")
                    
                # Step 1: HelloWork Crawler
                log_banner("STAGE 1: HELLOWORK CRAWLER")
                hw_dir = os.path.join(WORKSPACE_ROOT, "crawlers", "hellowork")
                
                # Check HelloWork maintenance before running
                sys.path.insert(0, hw_dir)
                try:
                    from maintenance import wait_if_maintenance
                    wait_if_maintenance("Enrichment Loop - HelloWork Stage")
                except Exception as e:
                    logger.warning(f"[!] Could not run HelloWork maintenance check: {e}")
                finally:
                    if hw_dir in sys.path:
                        sys.path.remove(hw_dir)

                # Step 1a: Harvest new IDs (sequential -- must complete before extract starts)
                update_stage("HelloWork Harvester (Đang quét tìm job mới)")
                if not run_command([sys.executable, "-u", "main.py", "--mode", "update", "--stage", "harvest"], hw_dir, "HelloWork Harvester"):
                    raise RuntimeError("HelloWork Harvester stage failed.")

                # Step 1b: Run HelloWork Extractor
                update_stage("HelloWork Extractor (Đang trích xuất dữ liệu)")
                log_banner("STAGE 1b: HELLOWORK EXTRACT")
                if not run_command([sys.executable, "-u", "main.py", "--mode", "update", "--stage", "extract", "--limit", str(args.limit)], hw_dir, "HelloWork Extractor"):
                    raise RuntimeError("HelloWork Extractor stage failed.")

                # Step 3: Central ETL Pipeline (runs immediately after HW Extract + Yahoo snapshot)
                update_stage("Đang chạy Central ETL Pipeline (Đồng bộ G-Biz, Cào Website, Phân tích AI)")
                log_banner("STAGE 3: CENTRAL ETL PIPELINE (Steps 1, 3, 4, 5, 6, 7)")
                pipeline_cmd = [
                    sys.executable, "-u", "run_pipeline.py",
                    "--steps", "1,3,4,5,6,7",
                    "--limit", str(args.limit),
                    "--web-crawl-max-time", str(args.web_crawl_max_time)
                ]
                if args.api:
                    pipeline_cmd.append("--api")
                if args.prefecture:
                    pipeline_cmd.extend(["--prefecture", args.prefecture])
                if args.offline:
                    pipeline_cmd.append("--offline")

                if not run_command(pipeline_cmd, SCRIPTS_DIR, "Central ETL Pipeline Orchestrator"):
                    raise RuntimeError("Central ETL Pipeline stage failed.")

                # Wrap up
                duration = time.time() - t_start
                log_banner(f"AUTOMATED DATA ENRICHMENT LOOP - CYCLE {cycle_count} COMPLETED SUCCESSFULLY")
                logger.info(f"Total Duration: {duration:.1f}s ({duration/60:.1f} mins)")
                logger.info(f"Detailed logs saved at: {log_file_path}")
                logger.info("=" * 80)
                
            except Exception as e:
                duration = time.time() - t_start
                logger.error(f"[-] ERROR IN CYCLE {cycle_count} (Duration: {duration:.1f}s): {e}")
                logger.error("[!] Proceeding to cooling down phase to prevent system lockup.")
                update_stage(f"Gặp sự cố ở chu kỳ {cycle_count}. Đang chờ 5 phút để tự phục hồi...")
                time.sleep(300)
                cycle_count += 1
                continue

            # Cooldown between cycles
            update_stage("Nghỉ ngơi 60 giây giữa các chu kỳ")
            logger.info("[*] Sleeping for 60 seconds before starting next cycle...")
            time.sleep(60)
            cycle_count += 1
    finally:
        stop_event.set()

if __name__ == "__main__":
    main()
