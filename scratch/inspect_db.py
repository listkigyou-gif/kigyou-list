import sqlite3

def inspect():
    conn = sqlite3.connect('kigyou-list.db')
    cur = conn.cursor()
    
    tables = ['raw_yahoo', 'raw_hellowork', 'raw_website', 'companies']
    for t in tables:
        print(f"=== Table: {t} ===")
        cur.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{t}';")
        row = cur.fetchone()
        if row:
            print(row[0])
        else:
            print("Table not found.")
            
        print(f"=== Indexes for: {t} ===")
        cur.execute(f"SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='{t}';")
        rows = cur.fetchall()
        for r in rows:
            print(r[0])
        print()
    conn.close()

if __name__ == '__main__':
    inspect()
