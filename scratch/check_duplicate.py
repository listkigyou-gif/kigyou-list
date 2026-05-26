import sqlite3

def main():
    conn = sqlite3.connect("kigyou-list.db")
    cursor = conn.cursor()
    cursor.execute("SELECT corporate_number FROM companies WHERE prefecture_code = '01'")
    rows = cursor.fetchall()
    print("Total rows fetched for prefecture 01:", len(rows))
    
    seen = set()
    duplicates = []
    for r in rows:
        corp = r[0]
        if corp in seen:
            duplicates.append(corp)
        seen.add(corp)
        
    print("Number of duplicate corporate numbers in query results:", len(duplicates))
    if duplicates:
        print("First 10 duplicates:", duplicates[:10])
        
    conn.close()

if __name__ == '__main__':
    main()
