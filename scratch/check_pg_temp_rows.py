import os
import psycopg2

def get_postgres_url():
    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    if os.path.exists("frontend/.env.local"):
        with open("frontend/.env.local", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    return os.environ.get("DATABASE_URL")

def main():
    pg_url = get_postgres_url()
    if not pg_url:
        print("Error: DATABASE_URL not found")
        return
        
    try:
        conn = psycopg2.connect(pg_url)
        cur = conn.cursor()
        
        # List all tables starting with companies_temp_p
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE 'companies_temp_p%'
            ORDER BY table_name ASC;
        """)
        tables = [r[0] for r in cur.fetchall()]
        
        print(f"Total temp partitions: {len(tables)}")
        
        populated_count = 0
        for t in tables:
            cur.execute(f"SELECT COUNT(*) FROM {t};")
            count = cur.fetchone()[0]
            if count > 0:
                print(f"  - {t}: {count} rows")
                populated_count += 1
            else:
                print(f"  -> Next pending partition is: {t}")
                break
        print(f"Total populated partitions: {populated_count}/47")
            
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
