import sqlite3
import os

hw_db = "crawlers/hellowork/data/hellowork.db"
main_db = "kigyou-list.db"

print("--- HELLOWORK DB ---")
if os.path.exists(hw_db):
    try:
        conn = sqlite3.connect(hw_db)
        cur = conn.cursor()
        tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        print("Tables:", tables)
        for t in tables:
            cnt = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            print(f"  Table {t}: {cnt} rows")
            if t == 'jobs_queue':
                status_cnts = cur.execute("SELECT status, COUNT(*) FROM jobs_queue GROUP BY status").fetchall()
                print("    Queue status counts:", status_cnts)
        conn.close()
    except Exception as e:
        print("Error reading hellowork.db:", e)
else:
    print("hellowork.db does not exist at:", hw_db)

print("\n--- MAIN DB ---")
if os.path.exists(main_db):
    try:
        conn = sqlite3.connect(main_db)
        cur = conn.cursor()
        tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        if 'raw_hellowork' in tables:
            cnt = cur.execute("SELECT COUNT(*) FROM raw_hellowork").fetchone()[0]
            print(f"  raw_hellowork: {cnt} rows")
        else:
            print("  raw_hellowork table not found in main DB")
        conn.close()
    except Exception as e:
        print("Error reading main DB:", e)
else:
    print("main DB does not exist at:", main_db)
