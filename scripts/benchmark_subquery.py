import psycopg2
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def compare_queries():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("=== TEST 1: CURRENT SUBQUERY WAY ===")
    sql1 = """
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT corporate_number, company_name, capital_amount, has_financials
    FROM companies c
    WHERE c.prefecture_code = '13'
      AND c.corporate_number IN (SELECT csf.corporate_number FROM company_signal_flags csf WHERE csf.has_hiring = true)
    ORDER BY c.has_financials DESC, c.capital_amount DESC NULLS LAST, c.corporate_number ASC
    LIMIT 15;
    """
    cur.execute(sql1)
    plan1 = cur.fetchall()
    for p in plan1:
        print("  ", p[0])

    conn.close()

if __name__ == '__main__':
    compare_queries()
