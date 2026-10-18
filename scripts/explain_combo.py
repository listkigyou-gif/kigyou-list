import psycopg2
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def explain_combo():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    sql = """
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT corporate_number, company_name, capital_amount, has_financials 
    FROM companies 
    WHERE prefecture_code = '13' 
      AND employee_count >= 50 
      AND email_address IS NOT NULL AND email_address != '' 
    ORDER BY has_financials DESC, capital_amount DESC NULLS LAST, corporate_number ASC 
    LIMIT 15;
    """
    cur.execute(sql)
    for row in cur.fetchall():
        print(row[0])
    conn.close()

if __name__ == '__main__':
    explain_combo()
