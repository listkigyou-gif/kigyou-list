import subprocess
import os

def list_python():
    try:
        output = subprocess.check_output('wmic process where "name like \'python%\'" get ProcessID,CommandLine', shell=True)
        lines = output.decode('utf-8', errors='ignore').strip().split('\n')
        if not lines:
            print("No python processes found.")
            return
        
        # Print header
        print(f"{'PID':<8} | {'CommandLine'}")
        print("-" * 80)
        
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
            # Split from the right side because ProcessID is at the end (or vice versa depending on wmic)
            parts = line.split()
            if len(parts) >= 2:
                pid = parts[-1]
                cmd = " ".join(parts[:-1])
                print(f"{pid:<8} | {cmd}")
            else:
                print(line)
    except Exception as e:
        print("Error listing processes:", e)

if __name__ == "__main__":
    list_python()
