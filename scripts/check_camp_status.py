import os, psycopg2
from dotenv import load_dotenv

load_dotenv("frontend/.env.local")
db_url = os.environ.get("DATABASE_URL")
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cid = "3ae19e5b-e93d-446e-bcc7-40af0e09a6ee"
cur.execute("SELECT count(1) FROM internal_form_send_logs WHERE campaign_id = %s", (cid,))
print(f"Total campaign logs: {cur.fetchone()[0]:,}")

cur.execute("""
    SELECT status, count(1) 
    FROM internal_form_send_logs 
    WHERE campaign_id = %s 
    GROUP BY status 
    ORDER BY count(1) DESC
""", (cid,))
for st, cnt in cur.fetchall():
    print(f" - {st}: {cnt:,}")

cur.execute("SELECT count(1) FROM form_marketing_global_suppressions")
print(f"Total globally suppressed companies: {cur.fetchone()[0]:,}")

conn.close()
