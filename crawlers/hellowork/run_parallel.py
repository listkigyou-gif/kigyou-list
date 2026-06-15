import os
import sys
import time
import subprocess
import argparse
import sqlite3
from datetime import datetime

# Configure standard output to UTF-8
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = "data/hellowork.db"

# Proxy mappings are dynamically determined based on prefecture code:
# Port = 40000 + int(prefecture_code)
# Container = warp-proxy-{int(prefecture_code)}

def get_prefectures_with_pending_jobs():
    """Query the SQLite database for prefectures that have pending jobs in the queue."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT prefecture_code, COUNT(*) FROM jobs_queue "
            "WHERE status = 'pending' "
            "GROUP BY prefecture_code "
            "ORDER BY COUNT(*) DESC"
        )
        rows = cursor.fetchall()
        conn.close()
        return [{"code": f"{int(row[0]):02d}", "count": row[1]} for row in rows]
    except Exception as e:
        print(f"[{datetime.now()}] Error querying database: {e}")
        return []

def run_parallel_crawlers():
    parser = argparse.ArgumentParser(description="HelloWork Parallel Prefecture Crawlers Orchestrator")
    parser.add_argument("--stage", choices=["harvest", "extract", "both"], default="extract",
                        help="Giai đoạn chạy: 'harvest', 'extract' (mặc định), hoặc 'both'")
    parser.add_argument("--mode", choices=["full", "update"], default="full",
                        help="Chế độ chạy: 'full' (mặc định) hoặc 'update'")
    parser.add_argument("--concurrency-per-worker", type=int, default=1,
                        help="Số luồng song song bên trong mỗi worker tỉnh (mặc định: 1 để giãn cách requests)")
    parser.add_argument("--limit-per-worker", type=int, default=0,
                        help="Giới hạn số lượng tin cào của mỗi worker tỉnh (0 = không giới hạn)")
    parser.add_argument("--max-workers", type=int, default=47,
                        help="Số lượng worker chạy song song tối đa (mặc định: 47)")
    parser.add_argument("--prefectures", type=str, default=None,
                        help="Danh sách các tỉnh cần chạy (phân cách bằng dấu phẩy, ví dụ: 13,27,40). Nếu trống sẽ tự động lấy các tỉnh có job pending.")
    
    args = parser.parse_args()

    print("=" * 60)
    print(f"HELLOWORK PARALLEL CRAWL ORCHESTRATOR STARTING AT {datetime.now()}")
    print(f"Stage: {args.stage.upper()}")
    print(f"Mode: {args.mode.upper()}")
    print(f"Max Parallel Workers: {args.max_workers}")
    print(f"Concurrency per worker: {args.concurrency_per_worker}")
    print(f"Limit per worker: {args.limit_per_worker if args.limit_per_worker > 0 else 'Unlimited'}")
    print("=" * 60)

    # 1. Determine which prefectures to process
    target_prefs = []
    if args.prefectures:
        raw_prefs = [p.strip() for p in args.prefectures.split(",") if p.strip()]
        for p in raw_prefs:
            try:
                code_formatted = f"{int(p):02d}"
                target_prefs.append({"code": code_formatted, "count": "Unknown"})
            except ValueError:
                print(f"[Warning] Invalid prefecture code format: {p}")
    else:
        if args.stage in ["harvest", "both"]:
            print("[Info] Stage includes harvest. Targeting all 47 prefectures...")
            target_prefs = [{"code": f"{i:02d}", "count": "Harvesting"} for i in range(1, 48)]
        else:
            print("[Info] Scanning database for prefectures with pending jobs...")
            target_prefs = get_prefectures_with_pending_jobs()
            if not target_prefs:
                print("[Info] No pending jobs in jobs_queue. Exiting.")
                return

    print(f"\nFound {len(target_prefs)} prefectures to process:")
    for item in target_prefs:
        print(f" - Tỉnh {item['code']}: {item['count']} jobs pending/harvesting")
    print("-" * 60)

    # Queue of prefectures to process
    pref_queue = [item["code"] for item in target_prefs]

    # Active processes: pref -> { "proc": subprocess.Popen, "start_time": datetime, "port": port, "container": container, "log_file": log_file }
    active_processes = {}

    try:
        while pref_queue or active_processes:
            # 1. Check active processes and clean up finished ones
            finished_prefs = []
            for pref, info in active_processes.items():
                proc = info["proc"]
                status = proc.poll()
                if status is not None:
                    # Process has finished
                    duration = datetime.now() - info["start_time"]
                    print(f"[{datetime.now()}] [Worker Completed] Tỉnh {pref} (Proxy port {info['port']}) finished with status {status}. Duration: {duration}")
                    info["log_file"].close()
                    finished_prefs.append(pref)
            
            # Remove finished processes
            for pref in finished_prefs:
                active_processes.pop(pref)

            # 2. Spawn new workers if we have capacity and pending prefectures
            while pref_queue and len(active_processes) < args.max_workers:
                pref = pref_queue.pop(0)
                pref_num = int(pref)
                port = 40000 + pref_num
                container = f"warp-proxy-{pref_num}"
                proxy_url = f"socks5://127.0.0.1:{port}"

                print(f"[{datetime.now()}] [Worker Started] Launching Tỉnh {pref} on proxy port {port} (Container: {container})...")
                
                # Construct command line
                cmd = [
                    sys.executable, "main.py",
                    "--stage", args.stage,
                    "--mode", args.mode,
                    "--prefecture", pref,
                    "--proxy", proxy_url,
                    "--container", container,
                    "--concurrency", str(args.concurrency_per_worker),
                    "--limit", str(args.limit_per_worker)
                ]

                creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                
                # Start process and log stdout/stderr to a prefecture-specific log file
                log_dir = "logs"
                os.makedirs(log_dir, exist_ok=True)
                log_file_path = os.path.join(log_dir, f"worker_pref_{pref}.log")
                log_file = open(log_file_path, "w", encoding="utf-8")

                proc = subprocess.Popen(
                    cmd,
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    creationflags=creationflags
                )

                active_processes[pref] = {
                    "proc": proc,
                    "start_time": datetime.now(),
                    "port": port,
                    "container": container,
                    "log_file": log_file
                }

            # Sleep briefly before the next check loop
            time.sleep(2)

    except KeyboardInterrupt:
        print(f"\n[{datetime.now()}] [Interrupt] Received Ctrl+C. Terminating all running workers...")
        for pref, info in active_processes.items():
            proc = info["proc"]
            print(f" - Terminating worker for Tỉnh {pref} (PID: {proc.pid})")
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f" - Forcefully killing worker for Tỉnh {pref}")
                proc.kill()
            info["log_file"].close()
        print("All processes terminated. Exiting.")
        sys.exit(1)

    print("\n" + "=" * 60)
    print(f"ALL CRAWLERS FINISHED AT {datetime.now()}")
    print("=" * 60)

if __name__ == "__main__":
    run_parallel_crawlers()
