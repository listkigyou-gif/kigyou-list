import sqlite3

conn = sqlite3.connect('c:/kigyou-list/kigyou-list.db')
c = conn.cursor()
indexes = c.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index'").fetchall()
for idx in indexes:
    if idx[1] in ('companies', 'business_signals', 'sitemap_companies'):
        print(f"Index: {idx[0]} on {idx[1]}: {idx[2]}")
conn.close()
