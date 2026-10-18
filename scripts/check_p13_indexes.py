import psycopg2
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def check_p13_indexes():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'companies_p13'
        ORDER BY indexname;
    """)
    for row in cur.fetchall():
        print(f"{row[0]} -> {row[1]}")
    conn.close()

if __name__ == '__main__':
    check_p13_indexes()
