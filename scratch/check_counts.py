import sqlite3
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('kigyou-list.db')
cursor = conn.cursor()

print("--- industry_counts table ---")
cursor.execute("SELECT * FROM industry_counts WHERE industry_code IN ('A', '01', '02')")
for r in cursor.fetchall():
    print(r)

print("\n--- Actual count in company_industries ---")
cursor.execute("""
    SELECT m.industry_code, m.industry_name, COUNT(ci.corporate_number)
    FROM m_industries m
    JOIN company_industries ci ON m.industry_code = ci.industry_code
    WHERE m.industry_code IN ('A', '01', '02')
    GROUP BY m.industry_code, m.industry_name
""")
for r in cursor.fetchall():
    print(r)
    
print("\n--- Actual count in company_industries with details ---")
cursor.execute("""
    SELECT count(*) FROM company_industries WHERE industry_code = 'A'
""")
print("Total with A:", cursor.fetchone()[0])
cursor.execute("""
    SELECT count(*) FROM company_industries WHERE industry_code = '01'
""")
print("Total with 01:", cursor.fetchone()[0])
cursor.execute("""
    SELECT count(*) FROM company_industries WHERE industry_code = '02'
""")
print("Total with 02:", cursor.fetchone()[0])

conn.close()
