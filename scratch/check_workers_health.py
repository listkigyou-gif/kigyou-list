import os
import glob
import datetime
import subprocess
import csv
import sys
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

WORKSPACE_ROOT = r"c:\TUHOCLAPTRINH\kigyou-list"
YAHOO_DATA_DIR = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo", "data")
YAHOO_LOGS_DIR = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo", "logs")

ALL_PORTS = [40002, 40003, 40004, 40005] + list(range(40009, 40013)) + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))

def get_running_workers():
    workers = {}
    try:
        output = subprocess.check_output('wmic process where "name like \'python%\'" get ProcessID,CommandLine', shell=True)
        lines = output.decode('utf-8', errors='ignore').strip().split('\n')
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) >= 2:
                pid = parts[-1]
                cmd = " ".join(parts[:-1])
                if "yahoo_searcher.py" in cmd:
                    # extract port from command line
                    import re
                    match = re.search(r"--proxy-port\s+(\d+)", cmd)
                    if match:
                        port = int(match.group(1))
                        workers[port] = pid
    except Exception as e:
        print("Error getting running workers:", e)
    return workers

def analyze():
    running = get_running_workers()
    print(f"Active worker processes: {len(running)}")
    print(f"{'Port':<6} | {'PID':<8} | {'Part Size':<9} | {'Results Size':<12} | {'Log Last Modified':<19} | {'Last Log Line'}")
    print("-" * 100)
    
    for port in ALL_PORTS:
        pid = running.get(port, "DEAD")
        
        # Check part file
        # Find which part corresponds to the port
        part_file = None
        ports = ALL_PORTS[:50] # Daemon max-workers is 50, so ports are ALL_PORTS[:50]
        if port in ports:
            part_idx = ports.index(port) + 1
            part_file = os.path.join(YAHOO_DATA_DIR, "parts", f"part_{part_idx}.csv")
        
        part_size = 0
        if part_file and os.path.exists(part_file):
            part_size = os.path.getsize(part_file)
            
        # Check results file
        res_file = os.path.join(YAHOO_DATA_DIR, f"results_{port}.csv")
        res_size = 0
        if os.path.exists(res_file):
            res_size = os.path.getsize(res_file)
            
        # Check log file
        log_file = os.path.join(YAHOO_LOGS_DIR, f"crawler_{port}.log")
        log_mtime = "N/A"
        last_line = ""
        if os.path.exists(log_file):
            mtime = os.path.getmtime(log_file)
            log_mtime = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
            try:
                with open(log_file, "r", encoding="utf-8", errors="ignore") as lf:
                    lines = lf.readlines()
                    if lines:
                        last_line = lines[-1].strip()
            except Exception:
                pass
                
        print(f"{port:<6} | {pid:<8} | {part_size:<9} | {res_size:<12} | {log_mtime:<19} | {last_line[:50]}")

if __name__ == "__main__":
    analyze()
