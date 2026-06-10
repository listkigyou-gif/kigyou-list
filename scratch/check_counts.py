import subprocess
import json
import sys

def check():
    # Count Python processes
    cmd_py = [
        "powershell", "-NoProfile", "-Command",
        "Get-CimInstance Win32_Process -Filter \"Name like 'python%'\" | "
        "Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress"
    ]
    res_py = subprocess.run(cmd_py, capture_output=True, text=True, encoding="utf-8", errors="ignore")
    py_total = 0
    searcher_count = 0
    if res_py.returncode == 0 and res_py.stdout.strip():
        try:
            data = json.loads(res_py.stdout.strip())
            processes = data if isinstance(data, list) else [data]
            py_total = len(processes)
            for p in processes:
                cmdline = p.get("CommandLine") or ""
                if "yahoo_searcher.py" in cmdline:
                    searcher_count += 1
        except Exception as e:
            print(f"Error parsing python json: {e}")

    # Count Warp containers running
    cmd_docker = ["docker", "ps", "--filter", "name=warp-", "--filter", "status=running", "-q"]
    res_docker = subprocess.run(cmd_docker, capture_output=True, text=True)
    warp_running = 0
    if res_docker.returncode == 0:
        warp_running = len([line for line in res_docker.stdout.splitlines() if line.strip()])

    # Check postgres container status
    cmd_pg = ["docker", "inspect", "--format={{.State.Status}}", "kigyou-postgres"]
    res_pg = subprocess.run(cmd_pg, capture_output=True, text=True)
    pg_status = res_pg.stdout.strip() if res_pg.returncode == 0 else "unknown"

    print(f"PYTHON_TOTAL={py_total}")
    print(f"SEARCHER_COUNT={searcher_count}")
    print(f"WARP_RUNNING={warp_running}")
    print(f"POSTGRES_STATUS={pg_status}")

if __name__ == "__main__":
    check()
