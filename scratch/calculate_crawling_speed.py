import os
import glob
from datetime import datetime, timedelta

def main():
    logs_dir = r"c:\TUHOCLAPTRINH\kigyou-list\crawlers\yahoo\logs"
    log_files = glob.glob(os.path.join(logs_dir, "crawler_*.log"))
    
    now = datetime.now()
    time_window = timedelta(minutes=5)
    start_time = now - time_window
    
    count = 0
    for path in log_files:
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                # Read last 1000 lines should be plenty for 5 minutes of logs
                lines = f.readlines()[-1000:]
                for line in lines:
                    if "Writing to CSV:" in line:
                        parts = line.split(" [INFO] ")
                        if len(parts) >= 2:
                            ts_str = parts[0]
                            try:
                                ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S,%f")
                                if ts >= start_time:
                                    count += 1
                            except Exception:
                                pass
        except Exception:
            pass
            
    print(f"Total crawled in last 5 minutes: {count}")
    print(f"Average speed: {count / 5.0:.2f} companies/minute")

if __name__ == "__main__":
    main()
