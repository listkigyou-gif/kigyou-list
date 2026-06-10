import sqlite3

def main():
    conn = sqlite3.connect('kigyou-list.db')
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(raw_yahoo)")
    print("raw_yahoo columns:", cur.fetchall())
    cur.execute("SELECT MAX(rowid) FROM raw_yahoo")
    print("raw_yahoo max rowid:", cur.fetchone()[0])
    cur.execute("SELECT COUNT(*) FROM raw_yahoo WHERE phone_number IS NOT NULL AND phone_number != ''")
    print("raw_yahoo with phone:", cur.fetchone()[0])
    cur.execute("SELECT COUNT(*) FROM raw_yahoo WHERE website_url IS NOT NULL AND website_url != ''")
    print("raw_yahoo with website:", cur.fetchone()[0])
    conn.close()

if __name__ == '__main__':
    main()
