import sys
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from crawlers.nta.sync_nta_invoices_to_vps import PG_URL

conn = psycopg2.connect(PG_URL)
cur = conn.cursor()

cur.execute("""
    SELECT pid, usename, state, query_start, query 
    FROM pg_stat_activity 
    WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%';
""")
rows = cur.fetchall()
print(f"Active queries ({len(rows)}):")
for pid, user, state, start, query in rows:
    print(f"PID: {pid} | State: {state} | Start: {start} | Query: {query[:100]}")

conn.close()
