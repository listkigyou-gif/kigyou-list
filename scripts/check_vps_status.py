import psycopg2
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

try:
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=8)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM companies;")
    total = cur.fetchone()[0]
    print(f"VPS PostgreSQL connected successfully! Total companies: {total:,}")

    check_cols = ['primary_industry_code', 'major_industry_code', 'industry_confidence', 'is_hiring', 'manually_locked_fields', 'has_license', 'has_public_tender']
    cur.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'companies' 
          AND column_name = ANY(%s);
    """, (check_cols,))
    found = [r[0] for r in cur.fetchall()]
    print("Existing columns on VPS:", found)
    missing = [c for c in check_cols if c not in found]
    print("Missing columns on VPS:", missing)
    conn.close()
except Exception as e:
    print(f"VPS Connection Error: {e}")
