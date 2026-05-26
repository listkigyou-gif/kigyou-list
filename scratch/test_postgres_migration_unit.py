import os
import psycopg2
import sqlite3
import csv
import sys

def get_postgres_url():
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    return os.environ.get("DATABASE_URL")

def main():
    url = get_postgres_url()
    if not url:
        print("[-] DATABASE_URL not found!")
        sys.exit(1)
        
    print("[*] Connecting to PostgreSQL...")
    pg_conn = psycopg2.connect(url)
    pg_cur = pg_conn.cursor()
    
    # 1. Recreate a temporary test table to verify the columns mapping and COPY works
    print("[*] Recreating test_companies_migration table...")
    pg_cur.execute("DROP TABLE IF EXISTS test_companies_migration CASCADE;")
    pg_cur.execute("""
    CREATE TABLE test_companies_migration (
        corporate_number VARCHAR(50),
        company_name TEXT NOT NULL,
        company_name_kana TEXT,
        company_name_en TEXT,
        postal_code VARCHAR(20),
        prefecture_code VARCHAR(10),
        prefecture_name VARCHAR(50),
        city_name TEXT,
        street_address TEXT,
        full_address TEXT,
        representative_name TEXT,
        representative_position TEXT,
        establishment_date VARCHAR(50),
        capital_amount BIGINT,
        employee_count INTEGER,
        sales_amount BIGINT,
        phone_number VARCHAR(50),
        fax_number VARCHAR(50),
        website_url TEXT,
        email_address TEXT,
        business_summary TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        jigyo_shumoku TEXT,
        branch_phone_numbers TEXT,
        yahoo_last_crawled_at TEXT,
        website_last_crawled_at TEXT,
        website_crawl_status TEXT,
        PRIMARY KEY (prefecture_code, corporate_number)
    );
    """)
    pg_conn.commit()
    print("[+] Created test_companies_migration table with website_crawl_status column.")

    # 2. Write mock test row to CSV
    row = [
        "9999999999999", "Test Company", "テストカンパニー", "Test Company EN", "100-0001",
        "13", "東京都", "千代田区", "大手町1-1-1", "東京都千代田区大手町1-1-1",
        "山田太郎", "代表取締役", "2020-01-01", 10000000,
        100, None, "03-1234-5678", "03-1234-5679", "http://test-comp.jp", "info@test-comp.jp",
        "It is a B2B SaaS startup.", "活動中", "2026-05-22 20:00:00", "2026-05-22 20:00:00",
        "IT Service", "[]", "2026-05-22 20:00:00", "2026-05-22 20:00:00", "SUCCESS"
    ]
    
    temp_file = "temp_migration_unit_test.csv"
    with open(temp_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL, doublequote=True)
        writer.writerow(row)
        
    # 3. COPY into test table
    columns = [
        "corporate_number", "company_name", "company_name_kana", "company_name_en", "postal_code",
        "prefecture_code", "prefecture_name", "city_name", "street_address", "full_address",
        "representative_name", "representative_position", "establishment_date", "capital_amount",
        "employee_count", "sales_amount", "phone_number", "fax_number", "website_url", "email_address",
        "business_summary", "status", "created_at", "updated_at", "jigyo_shumoku", "branch_phone_numbers",
        "yahoo_last_crawled_at", "website_last_crawled_at", "website_crawl_status"
    ]
    cols_str = ", ".join(columns)
    copy_sql = f"COPY test_companies_migration ({cols_str}) FROM STDIN WITH (FORMAT CSV, HEADER FALSE, NULL '')"
    
    print("[*] Executing COPY to PostgreSQL...")
    try:
        with open(temp_file, 'r', encoding='utf-8') as f:
            pg_cur.copy_expert(copy_sql, f)
        pg_conn.commit()
        print("[+] COPY completed successfully!")
    except Exception as e:
        pg_conn.rollback()
        print("[-] COPY failed:", e)
        if os.path.exists(temp_file):
            os.remove(temp_file)
        sys.exit(1)
        
    # 4. Verify count and value
    pg_cur.execute("SELECT website_crawl_status FROM test_companies_migration WHERE corporate_number = '9999999999999';")
    status = pg_cur.fetchone()[0]
    print(f"[+] Retrieved status from Postgres: {status}")
    assert status == "SUCCESS", f"Expected 'SUCCESS', got '{status}'"
    
    # Clean up test table and file
    pg_cur.execute("DROP TABLE IF EXISTS test_companies_migration CASCADE;")
    pg_conn.commit()
    pg_conn.close()
    
    if os.path.exists(temp_file):
        os.remove(temp_file)
        
    print("[+] POSTGRES MIGRATION UNIT TEST PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
