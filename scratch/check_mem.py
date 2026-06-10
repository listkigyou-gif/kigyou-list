import subprocess
import sys
import json

def get_mem_usage():
    try:
        # Use wmic to get process Name, ProcessId, and WorkingSetSize
        cmd = ['wmic', 'process', 'get', 'Name,ProcessId,WorkingSetSize']
        out = subprocess.check_output(cmd, text=True, errors='ignore')
        
        lines = out.strip().splitlines()
        if not lines:
            print("No processes found.")
            return
            
        header = lines[0]
        name_idx = header.find("Name")
        pid_idx = header.find("ProcessId")
        ws_idx = header.find("WorkingSetSize")
        
        processes = []
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
            
            # Extract fields based on header indices
            # Since WMIC returns columns, we can split them or extract by slices
            # Slices are safer because columns have fixed widths
            # Slices:
            # Name: from start to pid_idx
            # ProcessId: from pid_idx to ws_idx
            # WorkingSetSize: from ws_idx to end
            name = line[:pid_idx].strip()
            pid = line[pid_idx:ws_idx].strip()
            ws = line[ws_idx:].strip()
            
            if name and pid and ws.isdigit():
                mem_mb = int(ws) / (1024 * 1024)
                processes.append({
                    'name': name,
                    'pid': pid,
                    'mem_mb': mem_mb
                })
                
        # Sort by memory descending
        processes.sort(key=lambda x: x['mem_mb'], reverse=True)
        
        # Aggregate memory by name
        agg_mem = {}
        for p in processes:
            agg_mem[p['name']] = agg_mem.get(p['name'], 0.0) + p['mem_mb']
            
        print("TOP 15 PROCESSES BY MEMORY USAGE:")
        print(f"{'Name':<30} | {'PID':<8} | {'Memory (MB)':<12}")
        print("-" * 55)
        for p in processes[:15]:
            print(f"{p['name']:<30} | {p['pid']:<8} | {p['mem_mb']:,.2f} MB")
            
        print("\nAGGREGATED MEMORY USAGE BY PROCESS NAME:")
        print(f"{'Process Name':<30} | {'Total Memory (MB)':<17}")
        print("-" * 52)
        sorted_agg = sorted(agg_mem.items(), key=lambda x: x[1], reverse=True)
        for name, total in sorted_agg[:15]:
            print(f"{name:<30} | {total:,.2f} MB")
            
        # Also check system total memory
        print("\nSYSTEM TOTAL MEMORY (via systeminfo):")
        sys_info = subprocess.check_output(['systeminfo'], text=True, errors='ignore')
        for line in sys_info.splitlines():
            if "Total Physical Memory" in line or "Available Physical Memory" in line:
                print(line.strip())
                
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    get_mem_usage()
