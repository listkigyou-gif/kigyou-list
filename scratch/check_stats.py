import sqlite3
import os

db_path = "kigyou-list.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM database_stats")
        print("Rows in database_stats:")
        for r in cur.fetchall():
            print(r)
        
        # also print schema of database_stats
        cur.execute("PRAGMA table_info(database_stats)")
        print("Schema database_stats:")
        for c in cur.fetchall():
            print(c)
    except Exception as e:
        print("Error:", e)
    conn.close()
