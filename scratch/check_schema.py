import sqlite3
import sys

def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

    conn = sqlite3.connect('kigyou-list.db')
    cur = conn.cursor()
    
    # Get table info
    cur.execute("PRAGMA table_info(companies);")
    print("Table columns:")
    for col in cur.fetchall():
        print(col)
        
    # Get indexes
    cur.execute("PRAGMA index_list(companies);")
    print("\nIndexes list:")
    for idx in cur.fetchall():
        print(idx)
        idx_name = idx[1]
        cur.execute(f"PRAGMA index_info({idx_name});")
        print(f"Index info for {idx_name}:", cur.fetchall())
        
    # Get CREATE TABLE statement
    cur.execute("SELECT sql FROM sqlite_master WHERE type='table' and name='companies';")
    print("\nCREATE TABLE statement:")
    sql = cur.fetchone()
    if sql:
        print(sql[0])
    
    conn.close()

if __name__ == '__main__':
    main()
