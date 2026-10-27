import psycopg2
import sys

sys.stdout.reconfigure(encoding='utf-8')
PG_URL = 'postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list'
conn = psycopg2.connect(PG_URL)
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'company_legal_histories'")
cols = cur.fetchall()
print(f"Total columns in company_legal_histories on VPS: {len(cols)}")
for c in cols:
    print(f" - {c[0]}: {c[1]}")
conn.close()
