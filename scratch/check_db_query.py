import sqlite3
import time

def main():
    db_path = 'kigyou-list.db'
    conn = sqlite3.connect(db_path, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    cur = conn.cursor()
    
    t0 = time.time()
    print("Starting query...")
    try:
        cur.execute("""
            SELECT corporate_number, company_name, full_address, prefecture_name, city_name
            FROM companies
            WHERE (yahoo_last_crawled_at IS NULL
               OR datetime(yahoo_last_crawled_at) < datetime('now', '-360 days'))
            LIMIT 3476754;
        """)
        print("Query executed in", time.time() - t0, "seconds.")
        
        t0 = time.time()
        rows = cur.fetchall()
        print("Fetched", len(rows), "rows in", time.time() - t0, "seconds.")
    except Exception as e:
        print("Error during query:", e)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
