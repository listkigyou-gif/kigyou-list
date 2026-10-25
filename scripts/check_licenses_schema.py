import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect('kigyou-list.db')
cur = conn.cursor()
for row in cur.execute("SELECT type, name, sql FROM sqlite_master WHERE tbl_name='company_licenses'"):
    print(row)
