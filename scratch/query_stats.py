import subprocess
import sqlite3

# Available proxy ports
PORTS = [40002, 40003, 40004, 40005] + list(range(40006, 40013)) + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [p for p in range(40060, 40081)]

def run_checks():
    # 1. Warp container status
    try:
        out = subprocess.check_output('docker ps --filter name=warp- --filter status=running --format "{{.Names}}"', shell=True).decode('utf-8')
        running_names = set(line.strip() for line in out.strip().splitlines())
        
        running_warp = 0
        missing = []
        for port in PORTS:
            name = f"warp-{port}"
            if name in running_names:
                running_warp += 1
            else:
                missing.append(name)
                
        print(f"Active Warp Proxy Containers (excluding 40001): {running_warp}/56")
        if missing:
            print(f"Missing active containers: {missing}")
    except Exception as e:
        print("Error checking docker:", e)
        
    # 2. PostgreSQL Status
    try:
        pg_out = subprocess.check_output('docker ps -a --filter name=kigyou-postgres', shell=True).decode('utf-8')
        lines = pg_out.strip().splitlines()
        if len(lines) > 1:
            print("PostgreSQL container is UP:", "Up" in lines[1])
        else:
            print("PostgreSQL container NOT found!")
    except Exception as e:
        print("Error checking postgres:", e)
        
    # 3. Python process status
    try:
        proc_out = subprocess.check_output('tasklist', shell=True).decode('cp1252', errors='ignore')
        py_count = sum(1 for line in proc_out.splitlines() if line.lower().startswith('python'))
        print(f"Active Python processes: {py_count}")
    except Exception as e:
        print("Error checking python processes:", e)
        
    # 4. Fetch last 6 stats history records
    try:
        conn = sqlite3.connect('kigyou-list.db')
        cur = conn.cursor()
        cur.execute("SELECT * FROM yahoo_stats_history ORDER BY timestamp DESC LIMIT 6")
        rows = cur.fetchall()
        print("\nLast 6 stats records in yahoo_stats_history:")
        for r in rows:
            print(f"  {r}")
        conn.close()
    except Exception as e:
        print("Error checking SQLite history:", e)

if __name__ == "__main__":
    run_checks()
