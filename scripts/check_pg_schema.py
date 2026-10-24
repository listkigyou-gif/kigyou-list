import sys
import psycopg2
import sqlite3

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from crawlers.nta.sync_nta_invoices_to_vps import PG_URL

conn_pg = psycopg2.connect(PG_URL)
cur_pg = conn_pg.cursor()

cur_pg.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'companies'
    ORDER BY ordinal_position;
""")
cols_pg = cur_pg.fetchall()
print("=== POSTGRESQL COMPANIES COLUMNS ===")
for c, t in cols_pg:
    print(f"  {c}: {t}")

conn_pg.close()
