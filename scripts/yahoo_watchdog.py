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

ALL_PORTS = [40002, 40003, 40004, 40005] + list(range(40006, 40013)) + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))
LAST_RESTART_TIME = {}

def restart_docker_container(port):
    """
    Tự động tái tạo container Docker warp-{port} bị sự cố để lấy IP mới
    """
    now = time.time()
    last_time = LAST_RESTART_TIME.get(port, 0)
    if now - last_time < 120: # 2 minutes cool-down
        logger.info(f"[SELF-HEALING] Port {port} dang trong thoi gian cool-down ({now - last_time:.1f}s / 120s). Bo qua restart.")
        return False

    SPECIAL_CONTAINERS = {
        40006: "warp-proxy-2",
        40007: "warp-proxy-3",
        40008: "warp-harvester"
    }
    container_name = SPECIAL_CONTAINERS.get(port, f"warp-{port}")
    logger.warning(f"[SELF-HEALING] Phat hien su co ket noi nghiem trong tai Port {port}. Dang tai tao container {container_name} de lay IP moi...")
    try:
        # Tái tạo container bằng docker compose để xoá writable layer (buộc đăng ký thiết bị mới với Cloudflare)
        try:
            subprocess.run(
                ["docker", "compose", "-f", "crawlers/yahoo/docker-compose.yml", "up", "-d", "--force-recreate", container_name],
                cwd=WORKSPACE_ROOT,
                capture_output=True,
                timeout=90,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
        except subprocess.TimeoutExpired:
            logger.warning(f"[SELF-HEALING] Tai tao container {container_name} bi timeout 90s. Thu fallback sang khoi dong lai container bang docker restart...")
            subprocess.run(
                ["docker", "restart", container_name],
                capture_output=True,
                timeout=30,
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
            logger.info(f"[SELF-HEALING] Da tai tao/khoi dong lai container {container_name} va cong {port} da online.")
        else:
            logger.warning(f"[SELF-HEALING] Container {container_name} da tai tao/khoi dong lai nhung cong {port} chua online sau 20s.")
            
        LAST_RESTART_TIME[port] = now
        return True
    except Exception as e:
        logger.error(f"[SELF-HEALING] Loi khi phuc hoi container {container_name}: {e}")
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
    Quét chủ động tất cả các container warp-[port] đang chạy và kiểm tra xem có container nào bị unhealthy hoặc không chạy không.
    """
    logger.info("[WATCHDOG] Kiem tra chu dong suc khoe cua cac container Docker proxy...")
    try:
        cmd = ["docker", "ps", "-a", "--filter", "name=warp-", "--format", "{{.Names}}||{{.Status}}"]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        
        SPECIAL_CONTAINERS = {
            "warp-proxy-2": 40006,
            "warp-proxy-3": 40007,
            "warp-harvester": 40008
        }
        
        running_ports = set()
        unhealthy_containers = []
        
        if result.returncode == 0 and result.stdout.strip():
            for line in result.stdout.strip().splitlines():
                if not line.strip():
                    continue
                parts = line.strip().split("||")
                if len(parts) < 2:
                    continue
                name, status = parts[0], parts[1]
                
                port = None
                match = re.search(r"warp-(\d+)", name)
                if match:
                    port = int(match.group(1))
                elif name in SPECIAL_CONTAINERS:
                    port = SPECIAL_CONTAINERS[name]
                    
                if port and port in ALL_PORTS:
                    if "Up" in status and "unhealthy" not in status:
                        running_ports.add(port)
                    else:
                        unhealthy_containers.append((port, name, status))
                        
        # 1. Tự động khắc phục (Auto-Healing) cho các container bị unhealthy hoặc tắt
        for port, name, status in unhealthy_containers:
            logger.warning(f"[WATCHDOG] Phat hien container {name} (cong {port}) gap su co: {status}. Dang tu dong khoi dong lai...")
            if restart_docker_container(port):
                active_workers = get_python_workers()
                pid = active_workers.get(port)
                if pid:
                    terminate_stuck_worker(port, pid)
                    
        # 2. Kiểm tra xem có cổng nào đang chạy worker mà container bị thiếu hoàn toàn (offline) không
        active_workers = get_python_workers()
        for port in active_workers.keys():
            if port not in running_ports and port not in [item[0] for item in unhealthy_containers]:
                logger.warning(f"[WATCHDOG] Phat hien cong proxy {port} co worker cào nhung container proxy offline!")
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
 
        # 3. Phân tích nội dung log để tìm lỗi Proxy Connection nghiêm trọng và lỗi bị chặn liên tục
        try:
            with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                # Đọc 200 dòng cuối cùng để phân tích cả lỗi kết nối và lỗi bị chặn (Block)
                lines = f.readlines()[-200:]
                
            now_dt = datetime.now()
            proxy_err_count = 0
            last_err_ts = 0
            
            block_count = 0
            last_restart_epoch = LAST_RESTART_TIME.get(port, 0)
            
            for line in lines:
                # A. Phân tích lỗi kết nối Proxy (chỉ tính trong 3 phút gần đây)
                if any(err_str in line for err_str in ["net::ERR_SOCKS_CONNECTION_FAILED", "net::ERR_PROXY_CONNECTION_FAILED"]):
                    match = re.match(r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})", line)
                    if match:
                        try:
                            log_time = datetime.strptime(match.group(1), "%Y-%m-%d %H:%M:%S")
                            log_ts = log_time.timestamp()
                            if (now_dt - log_time).total_seconds() < 180: # 3 minutes threshold
                                if log_ts - last_err_ts >= 15:
                                    proxy_err_count += 1
                                    last_err_ts = log_ts
                        except Exception:
                            proxy_err_count += 1
                    else:
                        proxy_err_count += 1
                
                # B. Phân tích lỗi bị chặn (chỉ tính trong 15 phút gần đây và sau lần restart gần nhất)
                if "🚫 [BLOCKED]" in line or "BLOCK_429" in line:
                    match = re.match(r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})", line)
                    if match:
                        try:
                            log_time = datetime.strptime(match.group(1), "%Y-%m-%d %H:%M:%S")
                            log_ts = log_time.timestamp()
                            if log_ts > last_restart_epoch and (now_dt - log_time).total_seconds() < 900:
                                block_count += 1
                        except Exception:
                            if now_ts - last_restart_epoch > 900:
                                block_count += 1
                    else:
                        if now_ts - last_restart_epoch > 900:
                            block_count += 1
            
            # Thực hiện Tự Chữa Lành (Self-Healing)
            triggered = False
            if proxy_err_count >= 5:
                logger.warning(f"[WATCHDOG] Luong {port} gap lien tuc {proxy_err_count} loi ket noi proxy trong 3 phut qua!")
                triggered = True
            elif block_count >= 15:
                logger.warning(f"[WATCHDOG] Luong {port} gap {block_count} lan canh bao chan (Blocked) trong 15 phut qua!")
                triggered = True
                
            if triggered:
                if restart_docker_container(port):
                    terminate_stuck_worker(port, pid)
                    
        except Exception as e:
            logger.error(f"[-] Loi khi phan tich noi dung file {filename}: {e}")
 
def clean_orphaned_chromes():
    """
    Quét và đóng tất cả các tiến trình 'chrome-headless-shell' mồ côi.
    Một tiến trình được coi là mồ côi nếu tổ tiên của nó không có python.exe hoạt động.
    """
    logger.info("[WATCHDOG] Quet don dep cac tien trinh Chrome headless mo coi...")
    try:
        cmd = [
            "powershell", "-NoProfile", "-Command",
            "Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name | ConvertTo-Json -Compress"
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        if result.returncode != 0 or not result.stdout.strip():
            return
            
        data = json.loads(result.stdout.strip())
        processes = data if isinstance(data, list) else [data]
        
        active_pids = set()
        pid_map = {}
        for p in processes:
            pid = p.get("ProcessId")
            if pid:
                active_pids.add(pid)
                pid_map[pid] = {
                    "parent_pid": p.get("ParentProcessId"),
                    "name": p.get("Name")
                }
                
        cleaned_count = 0
        for pid, info in pid_map.items():
            if info["name"] == "chrome-headless-shell.exe":
                parent_pid = info["parent_pid"]
                is_orphan = False
                
                if not parent_pid or parent_pid not in active_pids:
                    is_orphan = True
                else:
                    curr_parent = parent_pid
                    has_python_ancestor = False
                    visited = set()
                    while curr_parent in active_pids and curr_parent not in visited:
                        visited.add(curr_parent)
                        parent_info = pid_map[curr_parent]
                        p_name = parent_info["name"].lower() if parent_info["name"] else ""
                        if "python" in p_name:
                            has_python_ancestor = True
                            break
                        curr_parent = parent_info["parent_pid"]
                    
                    if not has_python_ancestor:
                        is_orphan = True
                        
                if is_orphan:
                    logger.warning(f"[SELF-HEALING] Phat hien Chrome headless mo coi (PID: {pid}, Parent PID: {parent_pid}). Dang ket lieu...")
                    try:
                        subprocess.run(
                            ["taskkill", "/F", "/PID", str(pid)],
                            capture_output=True,
                            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                        )
                        cleaned_count += 1
                    except Exception:
                        pass
        if cleaned_count > 0:
            logger.info(f"[SELF-HEALING] Da quet va ket lieu {cleaned_count} tien trinh Chrome headless mo coi.")
    except Exception as e:
        logger.error(f"[-] Loi khi don dep Chrome mo coi: {e}")

def main():
    parser = argparse.ArgumentParser(description="Yahoo Crawler Watchdog Service")
    parser.add_argument("--once", action="store_true", help="Chay quet mot lan duy nhat roi thoat")
    parser.add_argument("--interval-seconds", type=int, default=120, help="Chu ky quet logs (mac dinh 2 phut)")
    args = parser.parse_args()
 
    if args.once:
        check_docker_containers_health()
        check_and_heal()
        clean_orphaned_chromes()
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
            
            # 3. Dọn dẹp Chrome headless mồ côi
            clean_orphaned_chromes()
            
            time.sleep(args.interval_seconds)
            
    except KeyboardInterrupt:
        logger.info("[!] Watchdog bi dung boi nguoi dung.")
        sys.exit(0)
    except Exception as e:
        logger.critical(f"[FATAL] Watchdog gap loi nghiem trong: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
