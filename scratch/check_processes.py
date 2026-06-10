import subprocess
import sys

def check_python_processes():
    try:
        # Use wmic to get process ID and CommandLine
        cmd = ['wmic', 'process', 'where', "name like 'python%'", 'get', 'CommandLine,ProcessId']
        out = subprocess.check_output(cmd, text=True, errors='ignore')
        
        counts = {
            'daemon': 0,
            'watchdog': 0,
            'monitor': 0,
            'worker': 0,
            'pipeline': 0,
            'migrate': 0,
            'other': []
        }
        
        lines = out.strip().splitlines()
        if not lines:
            print("No python processes running.")
            return
            
        header = lines[0]
        # Find index of ProcessId in header
        pid_idx = header.find("ProcessId")
        
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
            if "wmic" in line:
                continue
                
            cmdline = line[:pid_idx].strip()
            pid = line[pid_idx:].strip()
            
            if 'run_yahoo_daemon.py' in cmdline:
                counts['daemon'] += 1
            elif 'yahoo_watchdog.py' in cmdline:
                counts['watchdog'] += 1
            elif 'monitor_yahoo.py' in cmdline:
                counts['monitor'] += 1
            elif 'yahoo_searcher.py' in cmdline:
                counts['worker'] += 1
            elif 'run_pipeline.py' in cmdline:
                counts['pipeline'] += 1
            elif 'migrate_to_postgres.py' in cmdline:
                counts['migrate'] += 1
            else:
                counts['other'].append(f"{pid}: {cmdline}")
                
        print("PYTHON PROCESS COUNTS:")
        for k, v in counts.items():
            if k == 'other':
                if v:
                    print(f"  other ({len(v)}):")
                    for o in v:
                        print(f"    - {o}")
            else:
                print(f"  {k}: {v}")
                
    except Exception as e:
        print(f"Error checking processes: {e}")

if __name__ == '__main__':
    check_python_processes()
