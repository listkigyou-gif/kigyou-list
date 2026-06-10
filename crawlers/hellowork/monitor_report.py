import os
import sys
import time
import subprocess
import sqlite3
import asyncio
import httpx
from datetime import datetime

# Reconfigure stdout to UTF-8
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = "data/hellowork.db"
REPORT_PATH = "crawl_report.md"
LOG_DIR = "logs"
LOCK_DIR = "."

# Prefectures name mapping
PREFECTURES = {
    "01": "Hokkaido", "02": "Aomori", "03": "Iwate", "04": "Miyagi", "05": "Akita",
    "06": "Yamagata", "07": "Fukushima", "08": "Ibaraki", "09": "Tochigi", "10": "Gunma",
    "11": "Saitama", "12": "Chiba", "13": "Tokyo", "14": "Kanagawa", "15": "Niigata",
    "16": "Toyama", "17": "Ishikawa", "18": "Fukui", "19": "Yamanashi", "20": "Nagano",
    "21": "Gifu", "22": "Shizuoka", "23": "Aichi", "24": "Mie", "25": "Shiga",
    "26": "Kyoto", "27": "Osaka", "28": "Hyogo", "29": "Nara", "30": "Wakayama",
    "31": "Tottori", "32": "Shimane", "33": "Okayama", "34": "Hiroshima", "35": "Yamaguchi",
    "36": "Tokushima", "37": "Kagawa", "38": "Ehime", "39": "Kochi", "40": "Fukuoka",
    "41": "Saga", "42": "Nagasaki", "43": "Kumamoto", "44": "Oita", "45": "Miyazaki",
    "46": "Kagoshima", "47": "Okinawa"
}

def get_running_processes():
    """Get active python processes and search command line for running workers."""
    try:
        creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        output = subprocess.check_output(
            'wmic process where "name=\'python.exe\'" get commandline, processid', 
            shell=True,
            creationflags=creationflags
        ).decode()
        
        running_workers = {} # pref_code -> pid
        orchestrator_pid = None
        
        for line in output.splitlines():
            line = line.strip()
            if not line:
                continue
            
            # Check for orchestrator
            if "run_parallel.py" in line:
                parts = line.split()
                try:
                    orchestrator_pid = int(parts[-1])
                except ValueError:
                    pass
            
            # Check for worker
            if "main.py" in line and "--prefecture" in line:
                parts = line.split()
                try:
                    pid = int(parts[-1])
                    pref_idx = parts.index("--prefecture") + 1
                    if pref_idx < len(parts):
                        pref_code = f"{int(parts[pref_idx]):02d}"
                        running_workers[pref_code] = pid
                except (ValueError, IndexError):
                    pass
        return orchestrator_pid, running_workers
    except Exception as e:
        print(f"Error checking processes: {e}")
        return None, {}

async def test_proxy(pref_code):
    """Test if a prefecture's proxy is responsive and can reach HelloWork."""
    pref_num = int(pref_code)
    port = 40000 + pref_num
    proxy_url = f"socks5://127.0.0.1:{port}"
    target_url = "https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
    
    try:
        async with httpx.AsyncClient(proxy=proxy_url, verify=False, timeout=5.0) as client:
            resp = await client.head(target_url)
            if resp.status_code == 200:
                return True
    except Exception:
        pass
    return False

async def heal_system(orchestrator_pid, running_workers, db_stats):
    """Perform self-healing actions on proxies and workers."""
    actions = []
    
    # 1. Restart Orchestrator if it died but there are still pending jobs
    total_pending = db_stats.get("total_pending", 0)
    if total_pending > 0 and orchestrator_pid is None:
        print(f"[{datetime.now()}] [Self-Healing] Orchestrator run_parallel.py is NOT running! Restarting it...")
        try:
            creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            subprocess.Popen([sys.executable, "run_parallel.py", "--max-workers", "47", "--concurrency-per-worker", "1"], creationflags=creationflags)
            actions.append("Orchestrator run_parallel.py has been restarted.")
        except Exception as e:
            actions.append(f"Failed to restart orchestrator: {e}")
            
    # 2. Check each running worker's log modification time for hangs
    now = time.time()
    for pref, pid in list(running_workers.items()):
        log_path = os.path.join(LOG_DIR, f"worker_pref_{pref}.log")
        if os.path.exists(log_path):
            last_mod = os.path.getmtime(log_path)
            idle_time = now - last_mod
            
            # If a worker log hasn't been updated for > 10 mins, it's considered hung
            if idle_time > 10 * 60:
                print(f"[{datetime.now()}] [Self-Healing] Worker for prefecture {pref} (PID: {pid}) hasn't updated log in {int(idle_time)}s. Killing process...")
                try:
                    subprocess.run(["taskkill", "/F", "/PID", str(pid)], capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0)
                    actions.append(f"Worker for Prefecture {pref} (PID: {pid}) was killed due to inactivity (hung).")
                except Exception as e:
                    actions.append(f"Failed to kill worker {pref}: {e}")
                    
    # 3. Test proxies for all active workers
    tasks = []
    active_prefs = list(running_workers.keys())
    for pref in active_prefs:
        tasks.append(test_proxy(pref))
        
    if tasks:
        proxy_results = await asyncio.gather(*tasks)
        for pref, healthy in zip(active_prefs, proxy_results):
            if not healthy:
                container_name = f"warp-proxy-{int(pref)}"
                print(f"[{datetime.now()}] [Self-Healing] Proxy warp-proxy-{int(pref)} is offline! Restarting container...")
                try:
                    # Restart container
                    subprocess.run(["docker", "restart", container_name], capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0)
                    actions.append(f"Docker container {container_name} was restarted because its proxy port was unresponsive.")
                except Exception as e:
                    actions.append(f"Failed to restart container {container_name}: {e}")
                    
    return actions

def get_database_stats():
    """Calculate overall statistics from the jobs_queue database."""
    stats = {
        "total": 0,
        "completed": 0,
        "failed": 0,
        "pending": 0,
        "processing": 0,
        "prefectures": {}
    }
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 1. Total counts
        cursor.execute("SELECT status, COUNT(*) FROM jobs_queue GROUP BY status")
        for status, count in cursor.fetchall():
            stats[status] = count
            stats["total"] += count
            
        stats["total_pending"] = stats.get("pending", 0)
        
        # 2. Prefecture detailed counts
        cursor.execute(
            "SELECT prefecture_code, status, COUNT(*) FROM jobs_queue GROUP BY prefecture_code, status"
        )
        for code, status, count in cursor.fetchall():
            if not code:
                continue
            try:
                formatted_code = f"{int(code):02d}"
            except (ValueError, TypeError):
                continue
            if formatted_code not in stats["prefectures"]:
                stats["prefectures"][formatted_code] = {"pending": 0, "completed": 0, "failed": 0, "processing": 0}
            stats["prefectures"][formatted_code][status] = count
            
        conn.close()
    except Exception as e:
        print(f"Error reading database stats: {e}")
        
    return stats

def parse_last_errors():
    """Scan worker logs for recent error messages."""
    errors = []
    if not os.path.exists(LOG_DIR):
        return errors
        
    for file in os.listdir(LOG_DIR):
        if file.startswith("worker_pref_") and file.endswith(".log"):
            pref = file.replace("worker_pref_", "").replace(".log", "")
            log_path = os.path.join(LOG_DIR, file)
            try:
                # Read last 10 lines of the log file
                with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()[-20:]
                
                # Check for error keywords
                for line in lines:
                    if "ERROR" in line or "Lỗi" in line or "failed" in line.lower():
                        errors.append(f"**Pref {pref}**: {line.strip()}")
            except Exception:
                pass
    return errors[-10:] # Return top 10 most recent errors

def generate_report(orchestrator_pid, running_workers, db_stats, actions, recent_errors):
    """Generate the markdown report file."""
    total = db_stats.get("total", 1)
    completed = db_stats.get("completed", 0)
    failed = db_stats.get("failed", 0)
    pending = db_stats.get("pending", 0)
    processing = db_stats.get("processing", 0)
    progress_percent = (completed / total) * 100 if total > 0 else 0
    
    # Calculate Estimated Time to Completion (ETC)
    # Read previous run count to calculate rate of change if possible,
    # otherwise assume a default rate from logs.
    rate_per_sec = 4.0 # Default fallback speed is 4 jobs/sec across all workers
    etc_str = "Unknown"
    if pending > 0:
        etc_seconds = pending / rate_per_sec
        hours = int(etc_seconds // 3600)
        minutes = int((etc_seconds % 3600) // 60)
        etc_str = f"{hours}h {minutes}m"
        
    lines = []
    lines.append("# HelloWork Crawl Status & Monitoring Report")
    lines.append(f"*Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
    lines.append("")
    
    # System Status Section
    lines.append("## 🖥️ System Status Dashboard")
    lines.append(f"- **Orchestrator Status:** {'🟢 Running (PID: ' + str(orchestrator_pid) + ')' if orchestrator_pid else '🔴 Stopped'}")
    lines.append(f"- **Active Prefecture Workers:** {len(running_workers)} / 47")
    lines.append(f"- **Overall Progress:** {progress_percent:.2f}% ({completed:,} / {total:,} completed)")
    lines.append(f"- **Queue Status:** ⏳ Pending: {pending:,} | ⚙️ Processing: {processing:,} | ❌ Failed: {failed:,}")
    lines.append(f"- **Estimated Time to Completion (ETC):** {etc_str} (at {rate_per_sec} jobs/sec)")
    lines.append("")
    
    # AI Recovery Actions Section
    lines.append("## 🤖 AI Self-Healing & Recovery Actions")
    if actions:
        for act in actions:
            lines.append(f"- ✅ {act}")
    else:
        lines.append("- No issues detected. System is running healthy.")
    lines.append("")
    
    # Recent Errors Section
    lines.append("## ⚠️ Recent Error Logs")
    if recent_errors:
        for err in recent_errors:
            lines.append(f"- {err}")
    else:
        lines.append("- No errors found in recent log lines.")
    lines.append("")
    
    # Detailed Prefecture Status Table
    lines.append("## 🗺️ Prefecture Crawl Details")
    lines.append("| Code | Prefecture | Status | Pending | Completed | Failed | Progress |")
    lines.append("| :--- | :--- | :---: | :---: | :---: | :---: | :---: |")
    
    for code in sorted(PREFECTURES.keys()):
        name = PREFECTURES[code]
        status_info = db_stats["prefectures"].get(code, {"pending": 0, "completed": 0, "failed": 0, "processing": 0})
        pref_pending = status_info.get("pending", 0)
        pref_completed = status_info.get("completed", 0)
        pref_failed = status_info.get("failed", 0)
        pref_total = pref_pending + pref_completed + pref_failed + status_info.get("processing", 0)
        
        pref_progress = (pref_completed / pref_total) * 100 if pref_total > 0 else 100.0
        
        is_active = code in running_workers
        status_icon = "🟢 Active" if is_active else ("✅ Finished" if pref_pending == 0 else "💤 Idle")
        
        lines.append(f"| {code} | {name} | {status_icon} | {pref_pending:,} | {pref_completed:,} | {pref_failed:,} | {pref_progress:.1f}% |")
        
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
        
    print(f"Successfully generated status report at {REPORT_PATH}")

async def main():
    print(f"[{datetime.now()}] Monitoring script running...")
    
    # 1. Check processes
    orchestrator_pid, running_workers = get_running_processes()
    
    # 2. Get database stats
    db_stats = get_database_stats()
    
    # 3. Heal system if needed
    actions = await heal_system(orchestrator_pid, running_workers, db_stats)
    
    # 4. Re-check processes after healing to reflect in the report
    orchestrator_pid, running_workers = get_running_processes()
    
    # 5. Parse errors from logs
    recent_errors = parse_last_errors()
    
    # 6. Generate report
    generate_report(orchestrator_pid, running_workers, db_stats, actions, recent_errors)

if __name__ == "__main__":
    asyncio.run(main())
