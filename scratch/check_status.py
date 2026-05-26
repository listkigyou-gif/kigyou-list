import subprocess
import json
import re
import os

def check_status():
    print("=== DOCKER CONTAINERS STATUS ===")
    try:
        cmd = ["docker", "ps", "-a", "--filter", "name=warp", "--format", "{{.Names}}|||{{.Ports}}|||{{.Status}}"]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        warp_count = 0
        running_warp_count = 0
        if res.returncode == 0:
            for line in res.stdout.strip().splitlines():
                if not line.strip():
                    continue
                parts = line.split("|||")
                if len(parts) >= 3:
                    name, ports, status = parts[0], parts[1], parts[2]
                    if "_" in name: # skip temporary/extra containers if they are just created/residual
                        continue
                    warp_count += 1
                    is_running = "Up" in status
                    has_binding = "->" in ports
                    if is_running and has_binding:
                        running_warp_count += 1
                    else:
                        print(f"Container error: {name} (Status: {status}, Ports: {ports})")
            print(f"Total Warp Containers: {warp_count}, Active/Healthy: {running_warp_count}/30")
        else:
            print("Docker ps command failed:", res.stderr)
    except Exception as e:
        print("Error checking docker:", e)
        
    print("\n=== PYTHON PROCESSES STATUS ===")
    try:
        cmd = [
            "powershell", "-NoProfile", "-Command",
            "Get-CimInstance Win32_Process -Filter \"Name like 'python%'\" | "
            "Select-Object ProcessId, CommandLine | ConvertTo-Json"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if res.returncode == 0 and res.stdout.strip():
            try:
                data = json.loads(res.stdout.strip())
            except Exception as e:
                # Sometimes PowerShell output might contain trailing garbage or not be single JSON if empty
                data = []
            processes = data if isinstance(data, list) else [data]
            
            daemon_procs = []
            monitor_procs = []
            watchdog_procs = []
            worker_procs = []
            other_yahoo = []
            
            for p in processes:
                if not p:
                    continue
                cmdline = p.get("CommandLine") or ""
                pid = p.get("ProcessId")
                if "run_yahoo_daemon.py" in cmdline:
                    daemon_procs.append((pid, cmdline))
                elif "monitor_yahoo.py" in cmdline:
                    monitor_procs.append((pid, cmdline))
                elif "yahoo_watchdog.py" in cmdline:
                    watchdog_procs.append((pid, cmdline))
                elif "yahoo_searcher.py" in cmdline:
                    worker_procs.append((pid, cmdline))
                elif "yahoo" in cmdline.lower():
                    other_yahoo.append((pid, cmdline))
                    
            print(f"Daemon process count: {len(daemon_procs)}")
            for pid, cmd in daemon_procs:
                print(f"  - PID {pid}: {cmd}")
            print(f"Monitor process count: {len(monitor_procs)}")
            for pid, cmd in monitor_procs:
                print(f"  - PID {pid}: {cmd}")
            print(f"Watchdog process count: {len(watchdog_procs)}")
            for pid, cmd in watchdog_procs:
                print(f"  - PID {pid}: {cmd}")
            print(f"Worker processes count: {len(worker_procs)}")
            print(f"Other Yahoo processes count: {len(other_yahoo)}")
            for pid, cmd in other_yahoo:
                print(f"  - PID {pid}: {cmd}")
            
            total_procs = len(daemon_procs) + len(monitor_procs) + len(watchdog_procs) + len(worker_procs) + len(other_yahoo)
            print(f"Total Yahoo-related Python processes: {total_procs} (Expected: 33/34)")
        else:
            print("Failed to get Python processes via PowerShell:", res.stderr)
    except Exception as e:
        print("Error checking python processes:", e)

if __name__ == "__main__":
    check_status()
