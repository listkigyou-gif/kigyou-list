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
        
    base_url, db_name = pg_url.rsplit('/', 1)
    postgres_url = f"{base_url}/postgres"
    
    try:
        conn = psycopg2.connect(postgres_url)
        cur = conn.cursor()
        cur.execute("SELECT pid, usename, client_addr, state, query FROM pg_stat_activity WHERE datname = %s;", (db_name,))
        rows = cur.fetchall()
        print(f"\n--- ACTIVE CONNECTIONS ON '{db_name}' ---")
        for r in rows:
            print(f"PID: {r[0]} | User: {r[1]} | State: {r[3]} | Query: {r[4][:120]}...")
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
