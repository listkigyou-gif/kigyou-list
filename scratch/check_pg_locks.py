import psycopg2
import sys
import os

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
        sys.exit(1)
        
    print("Database URL:", pg_url)
    
    # We want to connect to the 'postgres' database to terminate connections to 'kigyou-list'
    # Parse connection string
    # Let's replace the database name in the URL with 'postgres'
    # E.g. postgresql://user:pass@host:port/kigyou-list -> postgresql://user:pass@host:port/postgres
    base_url, db_name = pg_url.rsplit('/', 1)
    postgres_url = f"{base_url}/postgres"
    
    try:
        conn = psycopg2.connect(postgres_url)
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        print(f"\n--- ACTIVE CONNECTIONS ON '{db_name}' ---")
        cur.execute("SELECT pid, usename, client_addr, state, query FROM pg_stat_activity WHERE datname = %s;", (db_name,))
        rows = cur.fetchall()
        for r in rows:
            print(f"PID: {r[0]} | User: {r[1]} | Addr: {r[2]} | State: {r[3]} | Query: {r[4]}")
            
        print("\nTerminating other connections...")
        cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s AND pid <> pg_backend_pid();", (db_name,))
        terminated = cur.fetchall()
        print(f"Terminated {len(terminated)} connections.")
        
        conn.close()
    except Exception as e:
        print("Error connecting/executing:", e)

if __name__ == '__main__':
    main()
