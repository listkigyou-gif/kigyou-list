import psycopg2

DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def check_flags():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    flags = ['has_hiring', 'has_subsidy', 'has_bidding', 'has_award', 'has_certification', 'has_patent']
    for f in flags:
        cur.execute(f"SELECT COUNT(*) FROM company_signal_flags WHERE {f} = true;")
        print(f"{f}: {cur.fetchone()[0]:,} companies")
    conn.close()

if __name__ == '__main__':
    check_flags()
