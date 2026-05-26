import os
import sys
import sqlite3

# Adjust paths to match project structure
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(SCRIPTS_DIR, ".."))
sys.path.insert(0, WORKSPACE_ROOT)

def test_db_query():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    print("Testing DB query logic for Yahoo Maps crawler input...")
    db_path = os.path.join(WORKSPACE_ROOT, "kigyou-list.db")
    print(f"DB Path: {db_path}")
    
    if not os.path.exists(db_path):
        print("[-] kigyou-list.db not found!")
        sys.exit(1)
        
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Try fetching a small sample of companies
    cur.execute("""
        SELECT corporate_number, company_name, full_address, prefecture_name, city_name
        FROM companies
        WHERE (yahoo_last_crawled_at IS NULL
           OR datetime(yahoo_last_crawled_at) < datetime('now', '-360 days'))
        LIMIT 5
    """)
    
    rows = cur.fetchall()
    print(f"[+] Successfully fetched {len(rows)} sample records:")
    for row in rows:
        print(f"  Corp Num: {row[0]}")
        print(f"  Name:     {row[1]}")
        print(f"  Address:  {row[2]}")
        print(f"  Pref:     {row[3]}")
        print(f"  City:     {row[4]}")
        print("-" * 40)
        
    conn.close()

if __name__ == '__main__':
    test_db_query()
