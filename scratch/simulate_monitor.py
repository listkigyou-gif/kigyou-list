import os
import csv
import sys
import sqlite3

SCRIPTS_DIR = r"c:\TUHOCLAPTRINH\kigyou-list\scripts"
WORKSPACE_ROOT = r"c:\TUHOCLAPTRINH\kigyou-list"
DB_PATH = os.path.join(WORKSPACE_ROOT, "kigyou-list.db")
YAHOO_DATA_DIR = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo", "data")

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    master_crawled = 0
    master_phones = 0
    master_websites = 0
    basic_csv = os.path.join(YAHOO_DATA_DIR, "companies_basic.csv")
    print("Checking companies_basic.csv path:", basic_csv)
    print("File exists:", os.path.exists(basic_csv))
    
    if os.path.exists(basic_csv):
        print("File size:", os.path.getsize(basic_csv))
        for attempt in range(3):
            try:
                print(f"Attempt {attempt+1} to read CSV...")
                with open(basic_csv, "r", encoding="utf-8-sig") as f:
                    reader = csv.reader(f)
                    header = next(reader, None)
                    print("CSV Header:", header)
                    for i, row in enumerate(reader):
                        if len(row) >= 12:
                            master_crawled += 1
                            if row[10]: # phone
                                master_phones += 1
                            if row[11]: # website
                                master_websites += 1
                print("CSV Read successful.")
                break
            except Exception as e:
                print(f"Attempt {attempt+1} failed with error: {e}")
                if attempt < 2:
                    import time
                    time.sleep(1.0)
                else:
                    # Fallback to SQLite DB master count if CSV is locked
                    print("CSV read failed all attempts. Trying SQLite fallback...")
                    if os.path.exists(DB_PATH):
                        try:
                            conn = sqlite3.connect(DB_PATH, timeout=10)
                            cur = conn.cursor()
                            cur.execute("SELECT COUNT(*), COUNT(phone), COUNT(website) FROM companies WHERE yahoo_last_crawled_at IS NOT NULL;")
                            db_row = cur.fetchone()
                            print("SQLite fallback result:", db_row)
                            master_crawled = db_row[0] or 0
                            master_phones = db_row[1] or 0
                            master_websites = db_row[2] or 0
                            conn.close()
                        except Exception as e_sql:
                            print("SQLite fallback failed with error:", e_sql)
                            
    print("Final Master Crawled:", master_crawled)
    print("Final Master Phones:", master_phones)
    print("Final Master Websites:", master_websites)

if __name__ == '__main__':
    main()
