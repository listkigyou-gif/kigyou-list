import os, sys
import psycopg2
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv('.env.local')
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list')

print("Connecting to PostgreSQL VPS...", flush=True)
conn = psycopg2.connect(db_url, connect_timeout=15)
conn.autocommit = True
cur = conn.cursor()

print("Creating table hub_dynamic_events if not exists...", flush=True)
cur.execute("""
CREATE TABLE IF NOT EXISTS hub_dynamic_events (
    id BIGSERIAL PRIMARY KEY,
    corporate_number VARCHAR(13) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    prefecture_code VARCHAR(2) NOT NULL,
    prefecture_name VARCHAR(50) NOT NULL,
    city_name TEXT,
    event_category VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    title_ja TEXT NOT NULL,
    description_ja TEXT,
    old_value TEXT,
    new_value TEXT,
    source VARCHAR(100) DEFAULT '国税庁 / 商業登記',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_hub_event UNIQUE (corporate_number, event_category, event_date)
);
""")

print("Creating indexes on hub_dynamic_events...", flush=True)
cur.execute("CREATE INDEX IF NOT EXISTS idx_hub_cat_date ON hub_dynamic_events (event_category, event_date DESC);")
cur.execute("CREATE INDEX IF NOT EXISTS idx_hub_pref_cat_date ON hub_dynamic_events (prefecture_code, event_category, event_date DESC);")
cur.execute("CREATE INDEX IF NOT EXISTS idx_hub_corp_num ON hub_dynamic_events (corporate_number);")
cur.execute("CREATE INDEX IF NOT EXISTS idx_hub_date ON hub_dynamic_events (event_date DESC);")

print("Checking created table schema...", flush=True)
cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'hub_dynamic_events'
    ORDER BY ordinal_position;
""")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]} (nullable: {row[2]})", flush=True)

print("Checking created indexes...", flush=True)
cur.execute("""
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'hub_dynamic_events';
""")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}", flush=True)

conn.close()
print("PostgreSQL migration completed successfully!", flush=True)
