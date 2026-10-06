import sqlite3
import sys
import time
import os
import ctypes
from datetime import datetime

# Đảm bảo mã hóa UTF-8 cho Windows console
sys.stdout.reconfigure(encoding='utf-8')

# Cố gắng thiết lập font MS Gothic qua Windows API nếu đang chạy trên CMD thực tế
try:
    from ctypes import wintypes
    class COORD(ctypes.Structure):
        _fields_ = [('X', wintypes.SHORT), ('Y', wintypes.SHORT)]
    class CONSOLE_FONT_INFOEX(ctypes.Structure):
        _fields_ = [
            ('cbSize', wintypes.ULONG),
            ('nFont', wintypes.ULONG),
            ('dwFontSize', COORD),
            ('FontFamily', wintypes.UINT),
            ('FontWeight', wintypes.UINT),
            ('FaceName', wintypes.WCHAR * 32)
        ]
    font = CONSOLE_FONT_INFOEX()
    font.cbSize = ctypes.sizeof(CONSOLE_FONT_INFOEX)
    font.FaceName = 'MS Gothic'
    font.dwFontSize.X = 0
    font.dwFontSize.Y = 16
    font.FontFamily = 54
    font.FontWeight = 400
    kernel32 = ctypes.windll.kernel32
    h_out = kernel32.GetStdHandle(-11)
    kernel32.SetCurrentConsoleFontEx(h_out, False, ctypes.byref(font))
except Exception:
    pass

DB_PATH = r"c:\kigyou-list\crawlers\hellowork\data\hellowork.db"

def clean_text(text, max_len=45):
    if not text:
        return ""
    text = " ".join(text.replace("\r", " ").replace("\n", " ").split())
    if len(text) > max_len:
        return text[:max_len] + "..."
    return text

def clean_salary(sal):
    if not sal:
        return "Thỏa thuận"
    sal = sal.replace("基本給（月額平均）又は時間額", "").strip()
    sal = " ".join(sal.replace("\r", " ").replace("\n", " ").split())
    if "円" in sal:
        sal = sal.replace("円", " JPY")
    return sal[:32]

def main():
    if not os.path.exists(DB_PATH):
        print(f"[-] Không tìm thấy database tại {DB_PATH}", flush=True)
        return

    print("=" * 82, flush=True)
    print("      >> KIGYOU-LIST: HELLOWORK REAL-TIME DATA STREAM (22 WARP PROXIES) <<", flush=True)
    print("      Dang bóc tách dữ liệu việc làm & công ty trực tiếp từ Nhật Bản...", flush=True)
    print("      MẸO: Để font tiếng Nhật nét nhất -> Chuột phải tiêu đề CMD -> Properties -> Font -> MS Gothic", flush=True)
    print("      (Nhấn Ctrl + C để dừng xem)", flush=True)
    print("=" * 82, flush=True)

    try:
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        c = conn.cursor()
        c.execute("SELECT MAX(rowid) FROM jobs")
        max_rowid = c.fetchone()[0] or 0
        
        print("\n--- 5 BẢN GHI VỪA BÓC TÁCH GẦN NHẤT ---", flush=True)
        q_init = """
            SELECT j.rowid, j.job_id, COALESCE(c.company_name, 'Doanh nghiệp tư nhân'),
                   j.job_title, j.salary_remarks, j.work_location, COALESCE(c.corporate_number, '')
            FROM jobs j
            LEFT JOIN companies c ON j.corporate_number = c.corporate_number
            WHERE j.rowid >= ?
            ORDER BY j.rowid ASC
        """
        c.execute(q_init, (max(0, max_rowid - 4),))
        for row in c.fetchall():
            rowid, jid, comp, title, sal, loc, corp = row
            sal_str = clean_salary(sal)
            loc_str = clean_text(loc, 30)
            comp_str = clean_text(comp, 32)
            title_str = clean_text(title, 35)
            corp_tag = f"[MST: {corp}]" if corp else "[Chưa có MST]"
            print(f"[{datetime.now().strftime('%H:%M:%S')}] #{rowid} | [CÔNG TY]: {comp_str} {corp_tag}", flush=True)
            print(f"           |-- [VỊ TRÍ]: {title_str} (ID: {jid})", flush=True)
            print(f"           +-- [LƯƠNG] : {sal_str}  |  [ĐỊA CHỈ]: {loc_str}", flush=True)
            print("-" * 82, flush=True)
        conn.close()
    except Exception as e:
        print(f"Lỗi khởi động stream: {e}", flush=True)
        max_rowid = 0

    print("\n>>> DÒNG DỮ LIỆU ĐANG CẬP NHẬT THEO THỜI GIAN THỰC (REAL-TIME):\n", flush=True)

    last_rowid = max_rowid
    jobs_count = 0
    start_time = time.time()

    while True:
        try:
            conn = sqlite3.connect(DB_PATH, timeout=5.0)
            c = conn.cursor()
            
            q = """
                SELECT j.rowid, j.job_id, COALESCE(c.company_name, 'Doanh nghiệp tư nhân'),
                       j.job_title, j.salary_remarks, j.work_location, COALESCE(c.corporate_number, '')
                FROM jobs j
                LEFT JOIN companies c ON j.corporate_number = c.corporate_number
                WHERE j.rowid > ?
                ORDER BY j.rowid ASC
                LIMIT 50
            """
            c.execute(q, (last_rowid,))
            new_rows = c.fetchall()
            conn.close()

            if new_rows:
                now_str = datetime.now().strftime("%H:%M:%S")
                for row in new_rows:
                    rowid, jid, comp, title, sal, loc, corp = row
                    sal_str = clean_salary(sal)
                    loc_str = clean_text(loc, 30)
                    comp_str = clean_text(comp, 32)
                    title_str = clean_text(title, 35)
                    corp_tag = f"[MST: {corp}]" if corp else "[Chưa có MST]"
                    
                    print(f"[{now_str}] #{rowid} | [CÔNG TY]: {comp_str} {corp_tag}", flush=True)
                    print(f"           |-- [VỊ TRÍ]: {title_str} (ID: {jid})", flush=True)
                    print(f"           +-- [LƯƠNG] : {sal_str}  |  [ĐỊA CHỈ]: {loc_str}", flush=True)
                    
                    last_rowid = max(last_rowid, rowid)
                    jobs_count += 1

                elapsed = time.time() - start_time
                if elapsed >= 30 and jobs_count > 0:
                    speed = jobs_count / elapsed
                    print(f"\n>>> [TỐC ĐỘ]: Vừa hoàn tất {jobs_count} tin mới ({speed:.2f} tin/giây ~ {speed*3600:,.0f} tin/giờ) <<<\n", flush=True)
                    jobs_count = 0
                    start_time = time.time()

            time.sleep(0.5)
        except sqlite3.OperationalError:
            time.sleep(0.3)
        except KeyboardInterrupt:
            print("\n[-] Đã dừng theo dõi stream.", flush=True)
            break
        except Exception:
            time.sleep(1.0)

if __name__ == "__main__":
    main()
