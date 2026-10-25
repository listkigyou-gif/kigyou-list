import psycopg2
import sys

sys.stdout.reconfigure(encoding='utf-8')
PG_URL = 'postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list'
conn = psycopg2.connect(PG_URL)
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companies'")
cols = [r[0] for r in cur.fetchall()]
print(f"Total columns in companies on VPS: {len(cols)}")
for c in cols:
    if any(k in c.lower() for k in ['lic', 'tag', 'ind', 'has']):
        print(f" - {c}")
