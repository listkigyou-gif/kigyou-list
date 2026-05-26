import sqlite3

def main():
    conn = sqlite3.connect("kigyou-list.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("Tables:")
    for t in tables:
        table_name = t[0]
        print(f"\nTable: {table_name}")
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[1]} ({col[2]}) {'PRIMARY KEY' if col[5] else ''}")
    conn.close()

if __name__ == '__main__':
    main()
