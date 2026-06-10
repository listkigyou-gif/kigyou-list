import os
import sys
import json
import subprocess
import re

def get_python_workers():
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
            errors="ignore"
        )
        if result.returncode == 0 and result.stdout.strip():
            data = json.loads(result.stdout.strip())
            processes = data if isinstance(data, list) else [data]
            for p in processes:
                cmdline = p.get("CommandLine") or ""
                pid = p.get("ProcessId")
                if "yahoo_searcher.py" in cmdline and pid:
                    port_match = re.search(r"--proxy-port\s+(\d+)", cmdline)
                    if port_match:
                        port = int(port_match.group(1))
                        workers[port] = pid
    except Exception as e:
        print(f"Error querying python processes: {e}")
    return workers

def get_docker_warp_containers():
    containers = []
    try:
        cmd = ["docker", "ps", "-a", "--filter", "name=warp-", "--format", "{{.Names}}||{{.Status}}"]
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if result.returncode == 0 and result.stdout.strip():
            for line in result.stdout.strip().splitlines():
                if line.strip():
                    parts = line.strip().split("||")
                    containers.append({
                        "name": parts[0],
                        "status": parts[1]
                    })
    except Exception as e:
        print(f"Error querying docker: {e}")
    return containers

def get_postgres_status():
    try:
        cmd = ["docker", "ps", "-a", "--filter", "name=kigyou-postgres", "--format", "{{.Status}}"]
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception as e:
        print(f"Error querying postgres docker: {e}")
    return "Not found"

def check_processes():
    status = {"etl": "NOT RUNNING", "monitor": "NOT RUNNING", "daemon": "NOT RUNNING"}
    try:
        cmd = [
            "powershell", "-NoProfile", "-Command",
            "Get-CimInstance Win32_Process -Filter \"Name like 'python%'\" | "
            "Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if result.returncode == 0 and result.stdout.strip():
            data = json.loads(result.stdout.strip())
            processes = data if isinstance(data, list) else [data]
            for p in processes:
                cmdline = p.get("CommandLine") or ""
                pid = p.get('ProcessId')
                if "migrate_to_postgres.py" in cmdline:
                    status["etl"] = f"RUNNING (PID {pid})"
                elif "monitor_yahoo.py" in cmdline:
                    status["monitor"] = f"RUNNING (PID {pid})"
                elif "run_yahoo_daemon.py" in cmdline or "yahoo_daemon.py" in cmdline:
                    status["daemon"] = f"RUNNING (PID {pid})"
    except Exception as e:
        pass
    return status

if __name__ == "__main__":
    workers = get_python_workers()
    containers = get_docker_warp_containers()
    pg_status = get_postgres_status()
    proc_status = check_processes()
    
    print("=== SYSTEM HEALTH CHECK ===")
    print(f"Python workers running: {len(workers)} (Expected: >= 53)")
    for port, pid in sorted(workers.items()):
        print(f"  Port {port}: PID {pid}")
    
    running_warp = [c for c in containers if "Up" in c["status"]]
    print(f"Warp Containers: {len(running_warp)} running / {len(containers)} total")
    print(f"PostgreSQL Status: {pg_status}")
    print(f"PostgreSQL Migration ETL status: {proc_status['etl']}")
    print(f"Monitor Yahoo status: {proc_status['monitor']}")
    print(f"Yahoo Daemon status: {proc_status['daemon']}")
