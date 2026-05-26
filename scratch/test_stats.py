import sqlite3
conn = sqlite3.connect('kigyou-list.db')
cur = conn.cursor()
cur.execute("""
    SELECT timestamp, total_crawled, total_phones, total_websites 
    FROM yahoo_stats_history 
    WHERE timestamp >= '2026-05-25 19:40:00' AND timestamp <= '2026-05-25 21:00:00' 
    ORDER BY timestamp ASC
""")
for r in cur.fetchall():
    print(r)
conn.close()
