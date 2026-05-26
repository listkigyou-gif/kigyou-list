import sqlite3

def main():
    conn = sqlite3.connect("kigyou-list.db")
    cursor = conn.cursor()
    cursor.execute("SELECT corporate_number, COUNT(*) FROM companies GROUP BY corporate_number HAVING COUNT(*) > 1 LIMIT 10")
    rows = cursor.fetchall()
    print("Duplicate corporate numbers in SQLite:", rows)
    conn.close()

if __name__ == '__main__':
    main()
