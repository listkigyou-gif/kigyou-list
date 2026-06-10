import sqlite3
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = r"c:\TUHOCLAPTRINH\kigyou-list\crawlers\hellowork\data\hellowork.db"

def main():
    if not os.path.exists(DB_PATH):
        print("DB not found.")
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("--- 5 Completed Jobs in DB ---")
    cursor.execute("SELECT job_id, job_title, working_hours FROM jobs LIMIT 5")
    for row in cursor.fetchall():
        print(f"Job ID: {row[0]} | Title: {row[1]} | Hours: {row[2]}")
        
    print("\n--- 5 Companies in DB ---")
    cursor.execute("SELECT corporate_number, company_name, address, phone_number FROM companies LIMIT 5")
    for row in cursor.fetchall():
        print(f"Corp No: {row[0]} | Name: {row[1]} | Address: {row[2]} | Phone: {row[3]}")
        
    conn.close()

if __name__ == "__main__":
    main()
