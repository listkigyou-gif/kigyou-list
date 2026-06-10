import subprocess

def main():
    try:
        cmd = ["wmic", "process", "where", "name like 'python%'", "get", "CommandLine,ProcessId"]
        res = subprocess.run(cmd, capture_output=True, text=True)
        lines = res.stdout.splitlines()
        
        crawlers = []
        daemon = []
        watchdog = []
        monitor = []
        other = []
        
        for line in lines:
            line = line.strip()
            if not line or "CommandLine" in line:
                continue
            
            if "yahoo_searcher.py" in line:
                crawlers.append(line)
            elif "run_yahoo_daemon.py" in line:
                daemon.append(line)
            elif "yahoo_watchdog.py" in line:
                watchdog.append(line)
            elif "monitor_yahoo.py" in line:
                monitor.append(line)
            else:
                other.append(line)
                
        print(f"Total Python Processes: {len(crawlers) + len(daemon) + len(watchdog) + len(monitor) + len(other)}")
        print(f"  - Yahoo Searcher Crawlers: {len(crawlers)}")
        print(f"  - Daemon processes: {len(daemon)}")
        print(f"  - Watchdog processes: {len(watchdog)}")
        print(f"  - Monitor processes: {len(monitor)}")
        print(f"  - Other processes: {len(other)}")
        print("\nDetail of other processes:")
        for o in other:
            print(f"    * {o}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
