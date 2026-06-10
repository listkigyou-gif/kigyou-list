import sqlite3
import sys

def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
        
    conn = sqlite3.connect('kigyou-list.db')
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(companies)")
    columns = [row[1] for row in cur.fetchall()]
    print("companies column names:", columns)
    cur.execute("SELECT COUNT(*), COUNT(phone), COUNT(website) FROM companies WHERE yahoo_last_crawled_at IS NOT NULL")
    print("companies query result:", cur.fetchone())
    conn.close()

if __name__ == '__main__':
    main()
