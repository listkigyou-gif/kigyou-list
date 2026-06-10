import subprocess
import re

# List of expected ports mapping from ALL_PORTS[:50]
ALL_PORTS = [40002, 40003, 40004, 40005] + list(range(40009, 40013)) + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))
expected_ports = ALL_PORTS[:50]

try:
    cmd = ["wmic", "process", "where", "name like 'python%'", "get", "commandline"]
    out = subprocess.check_output(cmd, text=True, errors='ignore')
    lines = [line.strip() for line in out.splitlines() if line.strip()]
    
    running_ports = []
    for line in lines[1:]: # Skip header
        if "yahoo_searcher.py" in line:
            # Find the port number using regex: --proxy-port (\d+)
            match = re.search(r"--proxy-port\s+(\d+)", line)
            if match:
                running_ports.append(int(match.group(1)))
                
    print(f"Total searchers running: {len(running_ports)}")
    print(f"Running ports: {sorted(running_ports)}")
    
    missing_ports = [p for p in expected_ports if p not in running_ports]
    print(f"Missing ports from the active list: {missing_ports}")
    
except Exception as e:
    print(f"Error: {e}")
