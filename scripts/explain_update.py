import psycopg2
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def explain_update():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
        EXPLAIN
        UPDATE companies c
        SET has_hiring = true
        FROM company_signal_flags csf
        WHERE c.corporate_number = csf.corporate_number
          AND csf.has_hiring = true;
    """)
    for r in cur.fetchall():
        print(r[0])
    conn.close()

if __name__ == '__main__':
    explain_update()
