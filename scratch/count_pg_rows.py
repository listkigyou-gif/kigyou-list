import os
import psycopg2
import sqlite3

def get_postgres_url():
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    return os.environ.get("DATABASE_URL")

try:
    url = get_postgres_url()
    conn = psycopg2.connect(url, connect_timeout=5)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM companies;")
    count = cur.fetchone()[0]
    print(f"PG_COMPANIES_COUNT: {count}")
    
    # Also check a few partitions to see if they are empty
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'companies_p%';")
    tables = [r[0] for r in cur.fetchall()]
    print(f"Partitions found: {len(tables)}")
    if tables:
        cur.execute(f"SELECT COUNT(*) FROM {tables[0]};")
        p_count = cur.fetchone()[0]
        print(f"First partition {tables[0]} count: {p_count}")
    
    conn.close()
except Exception as e:
    print(f"PG_ERROR: {e}")
