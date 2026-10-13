import os
import csv
import time
import psycopg2
from dotenv import load_dotenv

load_dotenv("frontend/.env.local")
conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()
cid = "3ae19e5b-e93d-446e-bcc7-40af0e09a6ee"

cur.execute("""
    SELECT corporate_number, company_name, form_url, status, message, sent_at 
    FROM internal_form_send_logs 
    WHERE campaign_id = %s 
    ORDER BY sent_at DESC 
    LIMIT 5000
""", (cid,))
rows = cur.fetchall()

reports_dir = os.path.join("frontend", "public", "reports")
os.makedirs(reports_dir, exist_ok=True)
fname = f"internal_form_dm_{cid[:8]}_5000batch_{int(time.time())}.csv"
fpath = os.path.join(reports_dir, fname)

with open(fpath, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.writer(f)
    writer.writerow(["corporate_number", "company_name", "form_url", "status", "message", "sent_at"])
    for r in rows:
        writer.writerow(r)

print(f"Audit CSV successfully generated at: {fpath} with {len(rows)} records.")
cur.execute("UPDATE internal_form_campaigns SET report_file_url = %s WHERE id = %s", (f"/reports/{fname}", cid))
conn.commit()
conn.close()
