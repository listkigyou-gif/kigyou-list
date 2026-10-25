import psycopg2
import sys

sys.stdout.reconfigure(encoding='utf-8')
PG_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

try:
    conn = psycopg2.connect(PG_URL)
    cur = conn.cursor()
    print("Connected to VPS PostgreSQL!")
    
    # Check duplicates in PG
    cur.execute("""
    DELETE FROM company_licenses a USING (
        SELECT MIN(ctid) as min_ctid, corporate_number, license_type, license_number
        FROM company_licenses 
        GROUP BY corporate_number, license_type, license_number HAVING COUNT(*) > 1
    ) b
    WHERE a.corporate_number = b.corporate_number 
      AND a.license_type = b.license_type 
      AND a.license_number = b.license_number 
      AND a.ctid <> b.min_ctid;
    """)
    conn.commit()
    print("Cleaned up any duplicates in VPS PostgreSQL.")
    
    cur.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_corp_type_num 
    ON company_licenses(corporate_number, license_type, license_number);
    """)
    conn.commit()
    print("Created unique index idx_licenses_corp_type_num on VPS PostgreSQL!")
    conn.close()
except Exception as e:
    print("Error:", e)
