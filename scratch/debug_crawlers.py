import subprocess

def debug_crawlers():
    out = subprocess.check_output('wmic process where "name like \'python%\'" get Commandline, ProcessId', shell=True).decode('utf-8', errors='ignore')
    lines = out.strip().splitlines()
    for line in lines[1:]:
        if "yahoo_searcher.py" in line:
            print("Sample crawler command line:")
            print(line.strip())
            break

if __name__ == "__main__":
    debug_crawlers()
