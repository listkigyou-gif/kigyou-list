import sqlite3
import os

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "kigyou-list.db"))
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

with open('scratch/db_schema.txt', 'w', encoding='utf-8') as f:
    for table in ['companies', 'raw_yahoo']:
        cursor.execute(f"SELECT sql FROM sqlite_master WHERE name='{table}';")
        f.write(cursor.fetchone()[0] + "\n\n")

conn.close()
