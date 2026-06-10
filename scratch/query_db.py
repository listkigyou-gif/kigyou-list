import sqlite3

def main():
    conn = sqlite3.connect('kigyou-list.db')
    print("Last 15 records in yahoo_stats_history:")
    for row in conn.execute('SELECT * FROM yahoo_stats_history ORDER BY timestamp DESC LIMIT 15').fetchall():
        print(row)
    
    print("\nMidnight (00:00) record:")
    midnight = conn.execute("SELECT * FROM yahoo_stats_history WHERE timestamp LIKE '2026-06-05 00:%' ORDER BY timestamp ASC LIMIT 1").fetchone()
    print(midnight)
    
    conn.close()

if __name__ == '__main__':
    main()
