import sys
import os
import time
import signal
import sqlite3
import logging
import asyncio
import multiprocessing
from datetime import datetime

# Adjust path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from extractor import HelloworkExtractor, DB_PATH

# Configure master logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s'
)
logger = logging.getLogger("multi_extractor")

def run_single_process(proc_id: int, ports: list[int], concurrency: int, prefecture: str = None, limit: int = 0):
    """Sub-process entry point running on its own dedicated CPU core."""
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
        sys.stderr.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass

    # Each sub-process runs its own independent asyncio event loop
    extractor = HelloworkExtractor(
        prefecture=prefecture,
        concurrency=concurrency,
        process_id=proc_id,
        candidate_ports=ports
    )
    try:
        asyncio.run(extractor.run_forever(limit=limit))
    except (KeyboardInterrupt, asyncio.CancelledError):
        pass

def init_master_database():
    """Initial database cleanup and WAL verification."""
    conn = sqlite3.connect(DB_PATH, timeout=60)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=60000;")
    cur = conn.cursor()
    cur.execute("UPDATE jobs_queue SET status='pending' WHERE status='processing'")
    reset_count = cur.rowcount
    conn.commit()
    conn.close()
    if reset_count > 0:
        logger.info(f"🔄 Đã khôi phục {reset_count:,} job 'processing' dở dang về trạng thái 'pending'.")

def main():
    multiprocessing.freeze_support()
    
    logger.info("=" * 75)
    logger.info("🔥 HELLOWORK ULTRA MULTI-PROCESS TURBO ENGINE (8 LÕI CPU) KHỞI ĐỘNG!")
    logger.info("=" * 75)

    init_master_database()

    # Phân bổ 82 Cổng Cloudflare WARP thành 8 Cụm độc lập trên 8 Lõi CPU
    group_1 = list(range(40011, 40021))                  # 10 ports (40011 -> 40020)
    group_2 = list(range(40021, 40031))                  # 10 ports (40021 -> 40030)
    group_3 = list(range(40031, 40041))                  # 10 ports (40031 -> 40040)
    group_4 = list(range(40041, 40051))                  # 10 ports (40041 -> 40050)
    group_5 = list(range(40051, 40061))                  # 10 ports (40051 -> 40060)
    group_6 = list(range(40061, 40071))                  # 10 ports (40061 -> 40070)
    group_7 = list(range(40071, 40081))                  # 10 ports (40071 -> 40080)
    group_8 = list(range(40081, 40091)) + [40001, 40008] # 12 ports (40081 -> 40090, 40001, 40008)

    process_configs = [
        {"id": 1, "ports": group_1, "workers": 25},
        {"id": 2, "ports": group_2, "workers": 25},
        {"id": 3, "ports": group_3, "workers": 25},
        {"id": 4, "ports": group_4, "workers": 25},
        {"id": 5, "ports": group_5, "workers": 25},
        {"id": 6, "ports": group_6, "workers": 25},
        {"id": 7, "ports": group_7, "workers": 25},
        {"id": 8, "ports": group_8, "workers": 25},
    ]

    total_workers = sum(c["workers"] for c in process_configs)
    total_ports = sum(len(c["ports"]) for c in process_configs)
    logger.info(f"📊 Kiến Trúc: 8 Tiến Trình Python | {total_ports} Cổng WARP | {total_workers} Streaming Workers")
    logger.info(f"⚡ Đa Nhân Tối Ưu: 8 Lõi CPU Song Song | ~2.5 Workers/Proxy IP (An toàn tuyệt đối)")

    processes = []
    for cfg in process_configs:
        p = multiprocessing.Process(
            target=run_single_process,
            args=(cfg["id"], cfg["ports"], cfg["workers"]),
            name=f"Extractor-Process-{cfg['id']}"
        )
        p.start()
        processes.append(p)
        logger.info(f"   ▶️ Kích hoạt Process #{cfg['id']} (PID {p.pid}) phụ trách {len(cfg['ports'])} ports ({cfg['ports'][0]}..{cfg['ports'][-1]})")

    logger.info("🚀 Toàn bộ 8 Sub-Processes đã xuất quân thành công trên 8 Lõi CPU!")

    def shutdown_handler(signum, frame):
        logger.info("\n🛑 Nhận tín hiệu dừng! Đang thu hồi các Sub-Processes...")
        for p in processes:
            if p.is_alive():
                p.terminate()
        for p in processes:
            p.join(timeout=5)
        logger.info("🏁 Đã dừng toàn bộ 8 Tiến Trình an toàn.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    # Vòng lặp giám sát Master: Giữ cho các Sub-Processes luôn sống
    try:
        while True:
            time.sleep(5)
            # Kiểm tra nếu bất kỳ process nào bị dừng
            for i, p in enumerate(processes):
                if not p.is_alive():
                    exit_code = p.exitcode
                    cfg = process_configs[i]
                    if exit_code == 0:
                        logger.info(f"Process #{cfg['id']} hoàn thành công việc.")
                    else:
                        logger.warning(f"⚠️ Process #{cfg['id']} thoát với code {exit_code}. Tự động hồi sinh trên Core #{cfg['id']}...")
                        new_p = multiprocessing.Process(
                            target=run_single_process,
                            args=(cfg["id"], cfg["ports"], cfg["workers"]),
                            name=f"Extractor-Process-{cfg['id']}"
                        )
                        new_p.start()
                        processes[i] = new_p
            # Nếu tất cả đã kết thúc bình thường
            if all(not p.is_alive() and p.exitcode == 0 for p in processes):
                logger.info("🎉 Tất cả 8 tiến trình cào đã hoàn tất toàn bộ hàng đợi!")
                break
    except KeyboardInterrupt:
        shutdown_handler(None, None)

if __name__ == "__main__":
    main()
