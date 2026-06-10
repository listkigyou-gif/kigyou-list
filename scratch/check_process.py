import subprocess

def list_python_processes():
    try:
        out = subprocess.check_output('wmic process where "name like \'python%\'" get Commandline, ProcessId', shell=True).decode('utf-8', errors='ignore')
        lines = out.strip().splitlines()
        
        workers = []
        daemon = None
        watchdog = None
        monitor = None
        others = []
        
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
            
            parts = line.split()
            if not parts:
                continue
            pid = parts[-1]
            cmd = " ".join(parts[:-1])
            
            if "run_yahoo_daemon.py" in cmd:
                daemon = (pid, cmd)
            elif "yahoo_watchdog.py" in cmd:
                watchdog = (pid, cmd)
            elif "monitor_yahoo.py" in cmd:
                monitor = (pid, cmd)
            elif "yahoo_searcher.py" in cmd:
                port = "Unknown"
                cmd_lower = cmd.lower()
                if "--proxy-port" in cmd_lower:
                    idx = cmd_lower.find("--proxy-port")
                    rest = cmd[idx + 12:].strip()
                    port_part = rest.split()[0]
                    port = port_part
                workers.append((port, pid, cmd))
            else:
                others.append((pid, cmd))
                
        print(f"Daemon: {daemon}")
        print(f"Watchdog: {watchdog}")
        print(f"Monitor: {monitor}")
        print(f"\nCrawlers ({len(workers)}):")
        for port, pid, cmd in sorted(workers, key=lambda x: int(x[0]) if x[0] and x[0].isdigit() else 99999):
            print(f"  Port {port}: PID {pid}")
            
        print(f"\nOthers ({len(others)}):")
        for pid, cmd in others:
            print(f"  PID {pid}: {cmd}")
            
    except Exception as e:
        print("Error listing python processes:", e)

if __name__ == "__main__":
    list_python_processes()
