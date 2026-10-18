import psycopg2
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def check_activity():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
        SELECT pid, state, query_start, now() - query_start AS duration, query
        FROM pg_stat_activity
        WHERE query NOT LIKE '%pg_stat_activity%'
          AND state != 'idle';
    """)
    rows = cur.fetchall()
    print("--- RUNNING QUERIES ---")
    for r in rows:
        print(f"PID: {r[0]} | State: {r[1]} | Duration: {r[3]} | Query: {r[4][:120]}...")
    conn.close()

if __name__ == '__main__':
    check_activity()
