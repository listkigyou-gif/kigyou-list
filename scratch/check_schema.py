import psycopg2
conn = psycopg2.connect('postgresql://kigyou:kigyou_pass_2024@163.44.116.98:5432/kigyou_db')
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'company_financial_status';")
for row in cur.fetchall():
    print(row)
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'financial_records';")
for row in cur.fetchall():
    print(row)
