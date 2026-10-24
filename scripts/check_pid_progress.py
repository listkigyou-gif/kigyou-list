import psycopg2
import sys

conn = psycopg2.connect('postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list')
cur = conn.cursor()
cur.execute("""
    SELECT pid, usename, state, wait_event_type, wait_event, 
           extract(epoch from (now() - query_start)) as seconds_running,
           query
    FROM pg_stat_activity 
    WHERE pid = 3309153;
""")
row = cur.fetchone()
if row:
    print(f"PID: {row[0]} | State: {row[2]} | Wait: {row[3]}:{row[4]} | Running for: {row[5]:.1f}s")
else:
    print("PID 3309153 has finished or is not active!")
conn.close()
