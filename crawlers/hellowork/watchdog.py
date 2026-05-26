import os
import time
import subprocess
import sqlite3
from datetime import datetime

# --- CẤU HÌNH ---
LOG_FILE = "extractor.log"
SCRIPT_TO_RUN = "extractor.py"
CHECK_INTERVAL = 60  # Kiểm tra mỗi 1 phút
TIMEOUT_LIMIT = 10 * 60  # 10 phút không có log mới thì restart
DB_PATH = "data/hellowork.db"

def get_pending_count():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) FROM jobs_queue WHERE status = 'pending'")
        count = cursor.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        print(f"[{datetime.now()}] Watchdog DB Error: {e}")
        return 0

def is_extractor_running():
    try:
        # Kiểm tra xem có tiến trình python đang chạy extractor.py không
        import sys
        creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        output = subprocess.check_output(
            'wmic process where "name=\'python.exe\'" get commandline', 
            shell=True,
            creationflags=creationflags
        ).decode()
        return SCRIPT_TO_RUN in output
    except:
        return False

def kill_extractor():
    print(f"[{datetime.now()}] !!! Detected hang. Killing extractor...")
    try:
        # Tìm và diệt các process python chạy extractor.py
        cmd = f'powershell "Get-Process | Where-Object {{$_.CommandLine -like \'*{SCRIPT_TO_RUN}*\'}} | Stop-Process -Force"'
        import sys
        creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        subprocess.run(cmd, shell=True, creationflags=creationflags)
        time.sleep(5)
    except Exception as e:
        print(f"Error killing process: {e}")

def start_extractor():
    print(f"[{datetime.now()}] >>> Starting {SCRIPT_TO_RUN}...")
    # Chạy extractor trong một tiến trình mới, không đợi nó kết thúc
    import sys
    creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
    subprocess.Popen(["python", SCRIPT_TO_RUN], creationflags=creationflags)

def monitor():
    print(f"[{datetime.now()}] Watchdog activated. Monitoring {SCRIPT_TO_RUN}...")
    count_since_last_log = 0
    
    while True:
        pending = get_pending_count()
        
        if pending == 0:
            # Nếu hết việc, chỉ in thông báo và đợi, không thoát script
            if count_since_last_log % 60 == 0: # Chỉ in mỗi tiếng 1 lần cho đỡ rác log
                 print(f"[{datetime.now()}] Queue empty. Waiting for new jobs from Harvester...")
            count_since_last_log += 1
            time.sleep(CHECK_INTERVAL)
            continue
        
        count_since_last_log = 0 # Reset bộ đếm khi có job lại

        # Kiểm tra thời gian cập nhật cuối của file log
        if os.path.exists(LOG_FILE):
            last_mod = os.path.getmtime(LOG_FILE)
            idle_time = time.time() - last_mod
            
            running = is_extractor_running()
            
            if idle_time > TIMEOUT_LIMIT:
                print(f"[{datetime.now()}] Log is idle for {int(idle_time)}s.")
                if running:
                    kill_extractor()
                start_extractor()
            else:
                if not running:
                    print(f"[{datetime.now()}] Extractor is not running but jobs are pending. Starting...")
                    start_extractor()
        else:
            # Nếu chưa có file log, khởi động luôn
            if not is_extractor_running():
                start_extractor()

        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    monitor()
