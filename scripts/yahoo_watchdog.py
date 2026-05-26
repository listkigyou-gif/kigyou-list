#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Yahoo Crawler Watchdog & Self-Healing Service (Active Windows Version)
==========================================================
Monitors yahoo crawler logs, detects proxy failures or stuck workers,
actively checks docker container ports health, and performs self-healing.
"""

import os
import sys
import time
import glob
import re
import subprocess
import argparse
import logging
import json
from datetime import datetime

# Setup paths relative to workspace root
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(SCRIPTS_DIR, ".."))
LOGS_DIR = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo", "logs")
YAHOO_DIR = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo")

# Reconfigure stdout to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# Configure logging
log_file_path = os.path.join(WORKSPACE_ROOT, "yahoo_watchdog.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_file_path, mode="a", encoding="utf-8")
    ]
)
logger = logging.getLogger("yahoo_watchdog")

def get_python_workers():
    """
    Sử dụng PowerShell để lấy danh sách các tiến trình Python đang chạy workers cào Yahoo.
    Trả về dict: {port: pid}
    """
    workers = {}
    try:
        cmd = [
            "powershell", "-NoProfile", "-Command",
            "Get-CimInstance Win32_Process -Filter \"Name like 'python%'\" | "
            "Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress"
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
            # Convert single object to list for consistency
            processes = data if isinstance(data, list) else [data]
            for p in processes:
                cmdline = p.get("CommandLine") or ""
                pid = p.get("ProcessId")
                if "yahoo_searcher.py" in cmdline and pid:
                    # Tìm port proxy trong Command Line
                    port_match = re.search(r"--proxy-port\s+(\d+)", cmdline)
                    if port_match:
                        port = int(port_match.group(1))
                        workers[port] = pid
    except Exception as e:
        logger.error(f"[-] Loi khi truy van danh sach tien trinh Python: {e}")
    return workers

ALL_PORTS = [40001, 40002, 40003, 40004, 40005] + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))
LAST_RESTART_TIME = {}

def restart_docker_container(port):
    """
    Tự động khởi động lại container Docker warp-{port} bị sự cố
    """
    now = time.time()
    last_time = LAST_RESTART_TIME.get(port, 0)
    if now - last_time < 120: # 2 minutes cool-down
        logger.info(f"[SELF-HEALING] Port {port} dang trong thoi gian cool-down ({now - last_time:.1f}s / 120s). Bo qua restart.")
        return False

    container_name = f"warp-{port}"
    logger.warning(f"[SELF-HEALING] Phat hien su co ket noi nghiem trong tai Port {port}. Dang khoi dong lai container {container_name}...")
    try:
        # Khởi động lại container bằng docker restart
        subprocess.run(
            ["docker", "restart", container_name],
            capture_output=True,
            timeout=20,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        
        # Chờ cho đến khi cổng thực sự trực tuyến (chờ tối đa 20 giây, kiểm tra mỗi 2 giây)
        port_ready = False
        t_end = time.time() + 20
        while time.time() < t_end:
            import socket
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(1.0)
                    s.connect(('127.0.0.1', port))
                port_ready = True
                break
            except (socket.error, ConnectionRefusedError):
                time.sleep(2.0)
                
        if port_ready:
            # Chờ thêm 2 giây để kết nối định tuyến định hình
            time.sleep(2.0)
            logger.info(f"[SELF-HEALING] Da tai tao container {container_name} va cong {port} da online.")
        else:
            logger.warning(f"[SELF-HEALING] Container {container_name} da tai tao nhung cong {port} chua online sau 20s.")
            
        LAST_RESTART_TIME[port] = now
        return True
    except Exception as e:
        logger.error(f"[SELF-HEALING] Loi khi tai tao container {container_name}: {e}")
    return False


def terminate_stuck_worker(port, pid):
    """
    Kill worker đang bị treo (stuck) để hệ thống tự động sinh luồng mới
    """
    logger.warning(f"[SELF-HEALING] Phat hien worker Port {port} (PID: {pid}) bi treo (Stuck). Dang ket lieu tien trinh de tu dong tai khoi dong...")
    try:
        subprocess.run(
            ["taskkill", "/F", "/PID", str(pid)],
            capture_output=True,
            text=True,
            timeout=10,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        logger.info(f"[SELF-HEALING] Da ket lieu thanh cong tien trinh worker PID: {pid}.")
        return True
    except Exception as e:
        logger.error(f"[SELF-HEALING] Khong the ket lieu tien trinh PID {pid}: {e}")
    return False

def check_docker_containers_health():
    """
    Quét chủ động tất cả các container warp-[port] đang chạy.
    """
    logger.info("[WATCHDOG] Kiem tra chu dong suc khoe cua cac container Docker proxy...")
    try:
        cmd = ["docker", "ps", "--filter", "name=warp-", "--format", "{{.Names}}"]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        
        running_ports = set()
        if result.returncode == 0 and result.stdout.strip():
            for line in result.stdout.strip().splitlines():
                match = re.search(r"warp-(\d+)", line)
                if match:
                    running_ports.add(int(match.group(1)))
                    
        # Check all ports we expect to be running
        # In watchdog, we only check ports that have active python workers cào Yahoo
        # to avoid starting unnecessary docker containers
        active_workers = get_python_workers()
        for port in active_workers.keys():
            if port not in running_ports:
                logger.warning(f"[WATCHDOG] Phat hien cong proxy {port} co worker cào nhung container warp-{port} khong chay!")
                if restart_docker_container(port):
                    pid = active_workers.get(port)
                    if pid:
                        terminate_stuck_worker(port, pid)
    except Exception as e:
        logger.error(f"[-] Loi khi kiem tra chu dong container Docker: {e}")

def check_and_heal():
    """
    Quét logs và thực hiện tự chữa lành lỗi
    """
    logger.info("[WATCHDOG] Bat dau chu ky quet logs cao du lieu...")
    
    if not os.path.exists(LOGS_DIR):
        logger.warning(f"[WATCHDOG] Thu muc logs khong ton tai: {LOGS_DIR}. Bo qua chu ky quet.")
        return
 
    log_files = glob.glob(os.path.join(LOGS_DIR, "crawler_*.log"))
    if not log_files:
        logger.info("[WATCHDOG] Khong tim thay file log crawler nao.")
        return
 
    active_workers = get_python_workers()
    now_ts = time.time()
    
    for log_path in log_files:
        filename = os.path.basename(log_path)
        port_match = re.search(r"crawler_(\d+)\.log", filename)
        if not port_match:
            continue
        port = int(port_match.group(1))
        
        # 1. Kiểm tra xem worker có đang hoạt động không
        pid = active_workers.get(port)
        if not pid:
            continue
            
        # 2. Kiểm tra treo luồng (Stuck Worker) dựa trên thời gian ghi file log
        try:
            mtime = os.path.getmtime(log_path)
            inactive_duration = now_ts - mtime
            if inactive_duration > 300: 
                logger.warning(f"[WATCHDOG] Luong {port} (PID: {pid}) khong phan hoi log trong {inactive_duration/60:.1f} phut!")
                terminate_stuck_worker(port, pid)
                continue
        except Exception as e:
            logger.error(f"[-] Khong the doc mtime cua {filename}: {e}")
            continue
 
        # 3. Phân tích nội dung log để tìm lỗi Proxy Connection nghiêm trọng (chỉ tính lỗi trong 3 phút gần đây)
        try:
            with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()[-30:]
                
            now_dt = datetime.now()
            proxy_err_count = 0
            last_err_ts = 0
            for line in lines:
                if any(err_str in line for err_str in ["net::ERR_SOCKS_CONNECTION_FAILED", "net::ERR_PROXY_CONNECTION_FAILED"]):
                    # Tìm timestamp dạng: 2026-05-25 20:17:59
                    match = re.match(r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})", line)
                    if match:
                        try:
                            log_time = datetime.strptime(match.group(1), "%Y-%m-%d %H:%M:%S")
                            log_ts = log_time.timestamp()
                            if (now_dt - log_time).total_seconds() < 180: # 3 minutes threshold
                                # Chỉ đếm nếu cách lỗi trước đó ít nhất 15 giây
                                if log_ts - last_err_ts >= 15:
                                    proxy_err_count += 1
                                    last_err_ts = log_ts
                        except Exception:
                            # Nếu không parse được time, tạm đếm để an toàn
                            proxy_err_count += 1
                    else:
                        proxy_err_count += 1
 
            if proxy_err_count >= 5:
                logger.warning(f"[WATCHDOG] Luong {port} gap lien tuc {proxy_err_count} loi ket noi proxy trong 3 phut qua!")
                if restart_docker_container(port):
                    terminate_stuck_worker(port, pid)
                    
        except Exception as e:
            logger.error(f"[-] Loi khi phan tich noi dung file {filename}: {e}")
 
def main():
    parser = argparse.ArgumentParser(description="Yahoo Crawler Watchdog Service")
    parser.add_argument("--once", action="store_true", help="Chay quet mot lan duy nhat roi thoat")
    parser.add_argument("--interval-seconds", type=int, default=120, help="Chu ky quet logs (mac dinh 2 phut)")
    args = parser.parse_args()
 
    if args.once:
        check_docker_containers_health()
        check_and_heal()
        logger.info("[WATCHDOG] Qua trinh quet mot lan hoan tat.")
        sys.exit(0)
 
    logger.info("================================================================================")
    logger.info(f"   YAHOO CRAWLER WATCHDOG STARTED (Interval: {args.interval_seconds}s)")
    logger.info("================================================================================")
 
    # Chạy vòng lặp vô hạn giám sát hệ thống
    try:
        while True:
            # 1. Kiểm tra chủ động container Docker
            check_docker_containers_health()
            
            # 2. Kiểm tra logs crawler
            check_and_heal()
            
            time.sleep(args.interval_seconds)
            
    except KeyboardInterrupt:
        logger.info("[!] Watchdog bi dung boi nguoi dung.")
        sys.exit(0)
    except Exception as e:
        logger.critical(f"[FATAL] Watchdog gap loi nghiem trong: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
