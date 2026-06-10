import sqlite3
import time

def main():
    conn = sqlite3.connect('kigyou-list.db')
    conn.execute("PRAGMA journal_mode=WAL;")
    cur = conn.cursor()
    
    t0 = time.time()
    print("Starting optimized query...")
    try:
        cur.execute("""
            SELECT corporate_number, company_name, full_address, prefecture_name, city_name
            FROM companies
            WHERE (yahoo_last_crawled_at IS NULL
               OR yahoo_last_crawled_at < datetime('now', '-360 days'))
            LIMIT 10000;
        """)
        print("Optimized query executed in", time.time() - t0, "seconds.")
        t0 = time.time()
        rows = cur.fetchall()
        print("Fetched", len(rows), "rows in", time.time() - t0, "seconds.")
    except Exception as e:
        print("Error:", e)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
