import sys
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from crawlers.nta.sync_nta_invoices_to_vps import PG_URL

conn_pg = psycopg2.connect(PG_URL)
cur_pg = conn_pg.cursor()

cur_pg.execute("SELECT COUNT(*) FROM companies WHERE is_listed = TRUE;")
cnt = cur_pg.fetchone()[0]
print(f"VPS active is_listed count: {cnt:,}")

conn_pg.close()
