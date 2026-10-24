import psycopg2
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def create_indexes():
    print("🚀 Connecting to PostgreSQL to create Industry Covering Indexes...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    indexes = [
        ("idx_comp_primary_ind", "CREATE INDEX IF NOT EXISTS idx_comp_primary_ind ON companies (primary_industry_code) WHERE (primary_industry_code IS NOT NULL);"),
        ("idx_comp_major_ind", "CREATE INDEX IF NOT EXISTS idx_comp_major_ind ON companies (major_industry_code) WHERE (major_industry_code IS NOT NULL);"),
        ("idx_comp_pref_primary_ind", "CREATE INDEX IF NOT EXISTS idx_comp_pref_primary_ind ON companies (prefecture_code, primary_industry_code) WHERE (primary_industry_code IS NOT NULL);")
    ]

    for name, sql in indexes:
        t0 = time.time()
        print(f"Creating {name}...")
        cur.execute(sql)
        print(f"✅ {name} created in {time.time() - t0:.2f}s")

    cur.close()
    conn.close()
    print("ALL INDEXES CREATED SUCCESSFULLY!")

if __name__ == '__main__':
    create_indexes()
