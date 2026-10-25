import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect('kigyou-list.db')
cur = conn.cursor()

# Check duplicates
cur.execute("""
SELECT corporate_number, license_type, license_number, COUNT(*)
FROM company_licenses
GROUP BY corporate_number, license_type, license_number
HAVING COUNT(*) > 1
""")
dups = cur.fetchall()
print(f"Duplicates count: {len(dups)}")
if dups:
    print("Sample duplicate:", dups[0])
    # Delete duplicates keeping min(id)
    cur.execute("""
    DELETE FROM company_licenses
    WHERE id NOT IN (
        SELECT MIN(id)
        FROM company_licenses
        GROUP BY corporate_number, license_type, license_number
    )
    """)
    conn.commit()
    print("Duplicates cleaned up.")

# Now create unique index
cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_corp_type_num ON company_licenses(corporate_number, license_type, license_number)")
conn.commit()
print("Unique index idx_licenses_corp_type_num created successfully!")
