import psycopg2

DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def check_version():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print(cur.fetchone()[0])
    conn.close()

if __name__ == '__main__':
    check_version()
