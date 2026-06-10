import os
import sys
import subprocess
import json

def kill_processes():
    try:
        # Use wmic to get process ID and CommandLine
        cmd = ['wmic', 'process', 'where', "name like 'python%'", 'get', 'CommandLine,ProcessId']
        out = subprocess.check_output(cmd, text=True, errors='ignore')
        
        lines = out.strip().splitlines()
        if not lines:
            print("No python processes running.")
        else:
            header = lines[0]
            pid_idx = header.find("ProcessId")
            
            for line in lines[1:]:
                line = line.strip()
                if not line:
                    continue
                if "wmic" in line:
                    continue
                
                cmdline = line[:pid_idx].strip()
                pid = line[pid_idx:].strip()
                
                if any(x in cmdline for x in ['run_yahoo_daemon.py', 'yahoo_daemon.py', 'yahoo_watchdog.py', 'monitor_yahoo.py', 'yahoo_searcher.py']):
                    print(f"Killing process {pid}: {cmdline}")
                    try:
                        subprocess.run(['taskkill', '/F', '/PID', pid], capture_output=True)
                    except Exception as e:
                        print(f"Error killing {pid}: {e}")
                        
        # Also kill chrome-headless-shell
        print("Killing chrome-headless-shell...")
        subprocess.run(['taskkill', '/F', '/IM', 'chrome-headless-shell.exe'], capture_output=True)
        
        # Stop docker compose warp proxy containers
        print("Stopping docker compose containers...")
        subprocess.run(['docker', 'compose', '-f', 'crawlers/yahoo/docker-compose.yml', 'down'], capture_output=True)
        
        print("All processes stopped successfully.")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    kill_processes()
