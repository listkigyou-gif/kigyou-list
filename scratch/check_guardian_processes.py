import subprocess
import os

def check():
    try:
        output = subprocess.check_output('wmic process where "name like \'python%\'" get ProcessID,CommandLine', shell=True)
        lines = output.decode('utf-8', errors='ignore').strip().split('\n')
        print("FOUND PROCESSES:")
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if any(kw in line.lower() for kw in ['daemon', 'monitor', 'watchdog', 'processid']):
                print(line)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check()
