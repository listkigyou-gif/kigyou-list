import psycopg2
import os

def get_postgres_url():
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    return os.environ.get("DATABASE_URL")

def main():
    url = get_postgres_url()
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM companies_p01;")
    print("Total rows in companies_p01:", cur.fetchone()[0])
    
    cur.execute("SELECT prefecture_code, corporate_number, company_name FROM companies_p01 WHERE corporate_number = '7430001046959';")
    print("Row with corporate_number '7430001046959':", cur.fetchall())
    
    conn.close()

if __name__ == '__main__':
    main()
