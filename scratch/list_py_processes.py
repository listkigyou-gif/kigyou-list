import subprocess
import json
import re

cmd = [
    "powershell", "-NoProfile", "-Command",
    "Get-CimInstance Win32_Process -Filter \"Name like 'python%'\" | "
    "Select-Object ProcessId, CommandLine | ConvertTo-Json"
]

res = subprocess.run(cmd, capture_output=True, text=True, errors="ignore")
if res.returncode == 0 and res.stdout.strip():
    try:
        data = json.loads(res.stdout.strip())
        processes = data if isinstance(data, list) else [data]
        
        workers = []
        daemon = None
        watchdog = None
        monitor = None
        others = []
        
        for p in processes:
            cmdline = p.get('CommandLine') or ""
            pid = p.get('ProcessId')
            if "run_yahoo_daemon.py" in cmdline:
                daemon = (pid, cmdline)
            elif "yahoo_watchdog.py" in cmdline:
                watchdog = (pid, cmdline)
            elif "monitor_yahoo.py" in cmdline:
                monitor = (pid, cmdline)
            elif "yahoo_searcher.py" in cmdline:
                workers.append((pid, cmdline))
            else:
                others.append((pid, cmdline))
                
        print(f"Daemon: {daemon}")
        print(f"Watchdog: {watchdog}")
        print(f"Monitor: {monitor}")
        print(f"Workers count: {len(workers)}")
        print(f"Others: {others}")
        print(f"Total Python Count: {len(processes)}")
    except Exception as e:
        print("Error parsing json:", e)
        print(res.stdout)
else:
    print("No output or error:", res.stderr)
