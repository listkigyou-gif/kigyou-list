import subprocess
import json
import re

def get_python_workers():
    workers = {}
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
                pid = p.get("ProcessId")
                if "yahoo_searcher.py" in cmdline and pid:
                    port_match = re.search(r"--proxy-port\s+(\d+)", cmdline)
                    if port_match:
                        port = int(port_match.group(1))
                        workers[port] = pid
    except Exception as e:
        print("Error getting workers:", e)
    return workers

def get_unhealthy_containers():
    unhealthy = []
    try:
        cmd = ["docker", "ps", "--filter", "name=warp-", "--format", "{{.Names}} {{.Status}}"]
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if result.returncode == 0 and result.stdout.strip():
            for line in result.stdout.strip().splitlines():
                if "unhealthy" in line:
                    match = re.search(r"warp-(\d+)", line)
                    if match:
                        unhealthy.append(int(match.group(1)))
    except Exception as e:
        print("Error getting docker status:", e)
    return unhealthy

def main():
    workers = get_python_workers()
    unhealthy = get_unhealthy_containers()
    print("Active workers ports:", sorted(list(workers.keys())))
    print("Unhealthy containers ports:", sorted(unhealthy))
    
    unhealthy_with_workers = [p for p in unhealthy if p in workers]
    print("Unhealthy containers that have active workers:", unhealthy_with_workers)
    
if __name__ == '__main__':
    main()
