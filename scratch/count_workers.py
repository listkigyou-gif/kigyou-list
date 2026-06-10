import subprocess
import json
import sys
import re

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
        
        workers = 0
        daemon = 0
        watchdog = 0
        monitor = 0
        others = []
        
        for p in processes:
            cmdline = p.get("CommandLine") or ""
            pid = p.get("ProcessId")
            if "yahoo_searcher.py" in cmdline:
                workers += 1
            elif "run_yahoo_daemon.py" in cmdline:
                daemon += 1
            elif "yahoo_watchdog.py" in cmdline:
                watchdog += 1
            elif "monitor_yahoo.py" in cmdline:
                monitor += 1
            else:
                others.append((pid, cmdline))
                
        print(f"Workers: {workers}")
        print(f"Daemon: {daemon}")
        print(f"Watchdog: {watchdog}")
        print(f"Monitor: {monitor}")
        print(f"Total Python: {len(processes)}")
        print(f"Others Count: {len(others)}")
        for pid, cmdline in others[:10]:
            print(f"  - PID {pid}: {cmdline}")
    else:
        print("No output from PowerShell command or exit code not 0.")
except Exception as e:
    print(f"Error: {e}")
