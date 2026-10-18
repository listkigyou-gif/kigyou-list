import psycopg2, time, sys

sys.stdout.reconfigure(encoding='utf-8')
conn = psycopg2.connect('postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list')
cur = conn.cursor()

cur.execute("""
    SELECT pid, state, now() - query_start as duration, wait_event_type, wait_event, left(query, 80)
    FROM pg_stat_activity 
    WHERE state != 'idle' AND query NOT ILIKE '%pg_stat_activity%';
""")
rows = cur.fetchall()
print(f"Total active queries: {len(rows)}", flush=True)
for r in rows:
    print(r, flush=True)
