import sqlite3
import os
import psycopg2
import sys
import csv
import time

# Define SQLite source path
SQLITE_DB = "kigyou-list.db"

# Retrieve PostgreSQL URL from environment or .env file
def get_postgres_url():
    # Attempt to read .env first
    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    
    # Attempt to read .env.local
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
                    
    # Fallback to system env
    return os.environ.get("DATABASE_URL")

def main():
    pg_url = get_postgres_url()
    if not pg_url:
        print("Error: DATABASE_URL not found in .env, .env.local, or system environment.", flush=True)
        print("Please configure DATABASE_URL=postgresql://user:password@host:port/database in your .env file.", flush=True)
        sys.exit(1)

    print(f"Connecting to SQLite: {SQLITE_DB}...", flush=True)
    lite_conn = sqlite3.connect(SQLITE_DB)
    lite_cur = lite_conn.cursor()

    print("Connecting to PostgreSQL...", flush=True)
    try:
        pg_conn = psycopg2.connect(
            pg_url,
            keepalives=1,
            keepalives_idle=30,
            keepalives_interval=10,
            keepalives_count=5
        )
        pg_cur = pg_conn.cursor()
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}", flush=True)
        lite_conn.close()
        sys.exit(1)

    # 1. Create schemas and tables in PostgreSQL
    print("Dropping existing temp tables to prepare for clean run...", flush=True)
    pg_cur.execute("""
    DROP TABLE IF EXISTS companies_temp CASCADE;
    DROP TABLE IF EXISTS m_industries_temp CASCADE;
    DROP TABLE IF EXISTS company_industries_temp CASCADE;
    DROP TABLE IF EXISTS business_signals_temp CASCADE;
    DROP TABLE IF EXISTS financial_records_temp CASCADE;
    DROP TABLE IF EXISTS prefecture_counts_temp CASCADE;
    DROP TABLE IF EXISTS industry_counts_temp CASCADE;
    DROP TABLE IF EXISTS database_stats_temp CASCADE;
    DROP TABLE IF EXISTS city_counts_temp CASCADE;
    DROP TABLE IF EXISTS sitemap_companies_temp CASCADE;
    """)
    pg_conn.commit()

    print("Initializing temp schemas in PostgreSQL...", flush=True)

    # Bảng 1: m_industries_temp
    pg_cur.execute("""
    CREATE TABLE m_industries_temp (
        industry_code VARCHAR(50) PRIMARY KEY,
        industry_name TEXT NOT NULL,
        classification_level VARCHAR(50),
        parent_code VARCHAR(50),
        materialized_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Bảng 2: companies_temp (Partitioned Table)
    pg_cur.execute("""
    CREATE TABLE companies_temp (
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
        last_deep_tagged_at VARCHAR(50),
        PRIMARY KEY (prefecture_code, corporate_number)
    ) PARTITION BY LIST (prefecture_code);
    """)

    # Tự động tạo 47 phân vùng vật lý: companies_temp_p01 -> companies_temp_p47
    for i in range(1, 48):
        pref_code = f"{i:02d}"
        pg_cur.execute(f"CREATE TABLE companies_temp_p{pref_code} PARTITION OF companies_temp FOR VALUES IN ('{pref_code}');")
    
    # Tạo phân vùng mặc định cho các prefecture_code ngoại lệ
    pg_cur.execute("CREATE TABLE companies_temp_default PARTITION OF companies_temp DEFAULT;")

    # Bảng 3: company_industries_temp
    pg_cur.execute("""
    CREATE TABLE company_industries_temp (
        corporate_number VARCHAR(50),
        industry_code VARCHAR(50),
        industry_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (corporate_number, industry_code)
    );
    """)

    # Bảng 4: business_signals_temp
    pg_cur.execute("""
    CREATE TABLE business_signals_temp (
        id SERIAL PRIMARY KEY,
        corporate_number VARCHAR(50),
        signal_type VARCHAR(100),
        signal_title TEXT,
        signal_date VARCHAR(50),
        source_url TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Bảng 5: financial_records_temp
    pg_cur.execute("""
    CREATE TABLE financial_records_temp (
        corporate_number VARCHAR(50),
        fiscal_year VARCHAR(10),
        period_number INTEGER,
        revenue DOUBLE PRECISION,
        operating_income DOUBLE PRECISION,
        ordinary_income DOUBLE PRECISION,
        net_income DOUBLE PRECISION,
        capital DOUBLE PRECISION,
        total_assets DOUBLE PRECISION,
        net_assets DOUBLE PRECISION,
        liquid_assets DOUBLE PRECISION,
        fixed_assets DOUBLE PRECISION,
        liquid_liabilities DOUBLE PRECISION,
        fixed_liabilities DOUBLE PRECISION,
        retained_earnings DOUBLE PRECISION,
        shareholders_json TEXT,
        source_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (corporate_number, fiscal_year)
    );
    """)

    # Bảng 6: prefecture_counts_temp
    pg_cur.execute("""
    CREATE TABLE prefecture_counts_temp (
        prefecture_code VARCHAR(10) PRIMARY KEY,
        prefecture_name VARCHAR(50) NOT NULL,
        company_count INTEGER NOT NULL
    );
    """)

    # Bảng 7: industry_counts_temp
    pg_cur.execute("""
    CREATE TABLE industry_counts_temp (
        industry_code VARCHAR(50) PRIMARY KEY,
        industry_name TEXT NOT NULL,
        company_count INTEGER NOT NULL
    );
    """)

    # Bảng 8: database_stats_temp
    pg_cur.execute("""
    CREATE TABLE database_stats_temp (
        stat_key VARCHAR(50) PRIMARY KEY,
        stat_value BIGINT NOT NULL
    );
    """)

    # Bảng 9: city_counts_temp
    pg_cur.execute("""
    CREATE TABLE city_counts_temp (
        prefecture_code VARCHAR(10),
        city_name TEXT,
        company_count INTEGER NOT NULL,
        PRIMARY KEY (prefecture_code, city_name)
    );
    """)

    # Bảng 10: sitemap_companies_temp
    pg_cur.execute("""
    CREATE TABLE sitemap_companies_temp (
        corporate_number VARCHAR(50) PRIMARY KEY,
        updated_at TIMESTAMP,
        employee_count INTEGER
    );
    """)

    pg_conn.commit()
    print("PostgreSQL temp tables successfully initialized.", flush=True)

    # 2. Safe File Remove for Windows
    def safe_remove(file_path):
        import time
        for _ in range(10):
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                return
            except PermissionError:
                time.sleep(0.2)
        # Final fallback attempt
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"[!] Warning: Could not remove temporary file {file_path}: {e}", flush=True)

    # 3. Optimized CSV Migration Function (Chunked to prevent PostgreSQL OOM / Connection Termination)
    def migrate_table_csv(table_name, select_query, columns, nullable_non_text_indices=None, chunk_size=500000):
        temp_table_name = f"{table_name}_temp"
        print(f"Migrating table {temp_table_name} via CSV COPY (Chunk size: {chunk_size})...", flush=True)
        
        print(f"  Executing SQLite query...", flush=True)
        lite_cur.execute(select_query)
        
        t_start = time.time()
        total_count = 0
        chunk_index = 0
        
        cols_str = ", ".join(columns)
        copy_sql = f"COPY {temp_table_name} ({cols_str}) FROM STDIN WITH (FORMAT CSV, HEADER FALSE, NULL '')"
        
        while True:
            # Fetch a chunk of rows
            rows = lite_cur.fetchmany(chunk_size)
            if not rows:
                break
                
            chunk_index += 1
            temp_file = f"temp_{table_name}_chunk_{chunk_index}.csv"
            
            # Process and write this chunk
            cleaned_rows = []
            for row in rows:
                r = list(row)
                if nullable_non_text_indices:
                    for idx in nullable_non_text_indices:
                        if idx < len(r):
                            val = r[idx]
                            if val == "" or val == "None" or val is None:
                                r[idx] = None
                if table_name == "companies":
                    if r[5] is None or r[5] == "" or r[5] == "None":
                        r[5] = "00"
                    if r[6] is None or r[6] == "" or r[6] == "None":
                        r[6] = "未登録"
                cleaned_rows.append(r)
                
            with open(temp_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL, doublequote=True)
                writer.writerows(cleaned_rows)
                
            # Load this chunk into PG
            t_chunk_load = time.time()
            with open(temp_file, 'r', encoding='utf-8') as f:
                pg_cur.copy_expert(copy_sql, f)
            pg_conn.commit()
            
            safe_remove(temp_file)
            
            total_count += len(rows)
            print(f"    Uploaded chunk {chunk_index}: {total_count} records total (This chunk in {time.time() - t_chunk_load:.2f}s)", flush=True)
            
        print(f"Successfully migrated {total_count} records into {table_name} in {time.time() - t_start:.2f} seconds!\n", flush=True)

    def migrate_companies_partitioned(lite_cur, pg_cur, pg_conn, chunk_size=500000):
        print("Migrating companies table partition-by-partition to avoid PG routing crash...", flush=True)
        
        columns = [
            "corporate_number", "company_name", "company_name_kana", "company_name_en", "postal_code",
            "prefecture_code", "prefecture_name", "city_name", "street_address", "full_address",
            "representative_name", "representative_position", "establishment_date", "capital_amount",
            "employee_count", "sales_amount", "phone_number", "fax_number", "website_url", "email_address",
            "business_summary", "status", "created_at", "updated_at", "jigyo_shumoku", "branch_phone_numbers",
            "yahoo_last_crawled_at", "website_last_crawled_at", "website_crawl_status", "last_deep_tagged_at"
        ]
        cols_str = ", ".join(columns)
        nullable_non_text_indices = [13, 14, 15, 22, 23]
        
        t_start = time.time()
        total_copied = 0
        
        # We will loop through prefecture codes 01 to 47
        for p in range(1, 48):
            pref_code = f"{p:02d}"
            target_table = f"companies_temp_p{pref_code}"
            
            print(f"  Querying SQLite for prefecture {pref_code}...", flush=True)
            t_pref_start = time.time()
            
            select_query = f"""
                SELECT 
                    corporate_number, company_name, company_name_kana, company_name_en, postal_code,
                    prefecture_code, prefecture_name, city_name, street_address, full_address,
                    representative_name, representative_position, establishment_date, capital_amount,
                    employee_count, sales_amount, phone_number, fax_number, website_url, email_address,
                    business_summary, status, created_at, updated_at, jigyo_shumoku, branch_phone_numbers,
                    yahoo_last_crawled_at, website_last_crawled_at, website_crawl_status, last_deep_tagged_at
                FROM companies WHERE prefecture_code = ?
            """
            
            lite_cur.execute(select_query, (pref_code,))
            
            pref_copied = 0
            chunk_index = 0
            while True:
                rows = lite_cur.fetchmany(chunk_size)
                if not rows:
                    break
                
                chunk_index += 1
                temp_file = f"temp_companies_p{pref_code}_chunk_{chunk_index}.csv"
                
                cleaned_rows = []
                for row in rows:
                    r = list(row)
                    for idx in nullable_non_text_indices:
                        if idx < len(r):
                            val = r[idx]
                            if val == "" or val == "None" or val is None:
                                r[idx] = None
                    # Clean prefecture code / name just in case
                    if r[5] is None or r[5] == "" or r[5] == "None":
                        r[5] = pref_code
                    cleaned_rows.append(r)
                
                with open(temp_file, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL, doublequote=True)
                    writer.writerows(cleaned_rows)
                
                copy_sql = f"COPY {target_table} ({cols_str}) FROM STDIN WITH (FORMAT CSV, HEADER FALSE, NULL '')"
                with open(temp_file, 'r', encoding='utf-8') as f:
                    pg_cur.copy_expert(copy_sql, f)
                pg_conn.commit()
                
                safe_remove(temp_file)
                pref_copied += len(rows)
                total_copied += len(rows)
                
            if pref_copied > 0:
                print(f"    Uploaded {pref_copied} records directly to {target_table} in {time.time() - t_pref_start:.2f}s", flush=True)

        # Now migrate rows where prefecture_code is NOT IN ('01', ..., '47') or IS NULL
        print("  Querying SQLite for remaining companies (default partition)...", flush=True)
        t_def_start = time.time()
        placeholders = ", ".join(f"'{p:02d}'" for p in range(1, 48))
        select_query = f"""
            SELECT 
                corporate_number, company_name, company_name_kana, company_name_en, postal_code,
                prefecture_code, prefecture_name, city_name, street_address, full_address,
                representative_name, representative_position, establishment_date, capital_amount,
                employee_count, sales_amount, phone_number, fax_number, website_url, email_address,
                business_summary, status, created_at, updated_at, jigyo_shumoku, branch_phone_numbers,
                yahoo_last_crawled_at, website_last_crawled_at, website_crawl_status, last_deep_tagged_at
            FROM companies WHERE prefecture_code NOT IN ({placeholders}) OR prefecture_code IS NULL
        """
        lite_cur.execute(select_query)
        
        def_copied = 0
        chunk_index = 0
        target_table = "companies_temp_default"
        
        while True:
            rows = lite_cur.fetchmany(chunk_size)
            if not rows:
                break
            
            chunk_index += 1
            temp_file = f"temp_companies_default_chunk_{chunk_index}.csv"
            
            cleaned_rows = []
            for row in rows:
                r = list(row)
                for idx in nullable_non_text_indices:
                    if idx < len(r):
                        val = r[idx]
                        if val == "" or val == "None" or val is None:
                            r[idx] = None
                
                # Make sure prefecture_code is safe
                if r[5] is None or r[5] == "" or r[5] == "None":
                    r[5] = "00"
                if r[6] is None or r[6] == "" or r[6] == "None":
                    r[6] = "未登録"
                cleaned_rows.append(r)
                
            with open(temp_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL, doublequote=True)
                writer.writerows(cleaned_rows)
            
            copy_sql = f"COPY {target_table} ({cols_str}) FROM STDIN WITH (FORMAT CSV, HEADER FALSE, NULL '')"
            with open(temp_file, 'r', encoding='utf-8') as f:
                pg_cur.copy_expert(copy_sql, f)
            pg_conn.commit()
            
            safe_remove(temp_file)
            def_copied += len(rows)
            total_copied += len(rows)
            
        if def_copied > 0:
            print(f"    Uploaded {def_copied} records to {target_table} in {time.time() - t_def_start:.2f}s", flush=True)
            
        print(f"Successfully migrated {total_copied} companies in {time.time() - t_start:.2f} seconds!\n", flush=True)

    # Execute table migrations
    try:
        # Table 1: m_industries
        migrate_table_csv(
            "m_industries",
            "SELECT industry_code, industry_name, classification_level, parent_code, materialized_path, created_at FROM m_industries",
            ["industry_code", "industry_name", "classification_level", "parent_code", "materialized_path", "created_at"],
            [5]
        )

        # Table 2: companies (partitioned)
        migrate_companies_partitioned(lite_cur, pg_cur, pg_conn)

        # Table 3: company_industries
        migrate_table_csv(
            "company_industries",
            "SELECT corporate_number, industry_code, industry_path, created_at FROM company_industries",
            ["corporate_number", "industry_code", "industry_path", "created_at"],
            [3]
        )

        # Table 4: business_signals
        migrate_table_csv(
            "business_signals",
            "SELECT corporate_number, signal_type, signal_title, signal_date, source_url, details, created_at FROM business_signals",
            ["corporate_number", "signal_type", "signal_title", "signal_date", "source_url", "details", "created_at"],
            [6]
        )

        # Table 5: financial_records
        migrate_table_csv(
            "financial_records",
            """SELECT 
                corporate_number, fiscal_year, period_number, revenue, operating_income,
                ordinary_income, net_income, capital, total_assets, net_assets,
                liquid_assets, fixed_assets, liquid_liabilities, fixed_liabilities,
                retained_earnings, shareholders_json, source_type, created_at
            FROM financial_records""",
            [
                "corporate_number", "fiscal_year", "period_number", "revenue", "operating_income",
                "ordinary_income", "net_income", "capital", "total_assets", "net_assets",
                "liquid_assets", "fixed_assets", "liquid_liabilities", "fixed_liabilities",
                "retained_earnings", "shareholders_json", "source_type", "created_at"
            ],
            [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17]
        )

        # Table 6: prefecture_counts
        migrate_table_csv(
            "prefecture_counts",
            "SELECT prefecture_code, prefecture_name, company_count FROM prefecture_counts",
            ["prefecture_code", "prefecture_name", "company_count"],
            [2]
        )

        # Table 7: industry_counts
        migrate_table_csv(
            "industry_counts",
            "SELECT industry_code, industry_name, company_count FROM industry_counts",
            ["industry_code", "industry_name", "company_count"],
            [2]
        )

        # Table 8: database_stats
        migrate_table_csv(
            "database_stats",
            "SELECT stat_key, stat_value FROM database_stats",
            ["stat_key", "stat_value"],
            [1]
        )

        # Table 9: city_counts
        migrate_table_csv(
            "city_counts",
            "SELECT prefecture_code, city_name, company_count FROM city_counts",
            ["prefecture_code", "city_name", "company_count"],
            [2]
        )

        # Table 10: sitemap_companies
        migrate_table_csv(
            "sitemap_companies",
            "SELECT corporate_number, updated_at, employee_count FROM sitemap_companies",
            ["corporate_number", "updated_at", "employee_count"],
            [1, 2]
        )

        # 3. Create indices for performance
        print("Creating performance indices in PostgreSQL on temp tables...", flush=True)
        t_indices = time.time()
        
        # Enable pg_trgm extension for fast LIKE '%keyword%' text search
        pg_cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
        
        # Standard indexes on partitioned companies_temp table
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_pref_emp_corp_temp ON companies_temp(prefecture_code, employee_count DESC NULLS LAST, corporate_number ASC);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_emp_temp ON companies_temp(employee_count DESC NULLS LAST, corporate_number ASC);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_pref_city_temp ON companies_temp(prefecture_code, city_name);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_capital_amount_temp ON companies_temp(capital_amount);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_status_temp ON companies_temp(status);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_sales_amount_temp ON companies_temp(sales_amount);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_has_email_temp ON companies_temp(email_address) WHERE email_address IS NOT NULL AND email_address <> '';")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_has_phone_temp ON companies_temp(phone_number) WHERE phone_number IS NOT NULL AND phone_number <> '';")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_has_website_temp ON companies_temp(website_url) WHERE website_url IS NOT NULL AND website_url <> '';")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_has_fax_temp ON companies_temp(fax_number) WHERE fax_number IS NOT NULL AND fax_number <> '';")
        
        # Trigram GIN indexes for fast text search
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_name_trgm_temp ON companies_temp USING gin (company_name gin_trgm_ops);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_address_trgm_temp ON companies_temp USING gin (full_address gin_trgm_ops);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_jigyo_trgm_temp ON companies_temp USING gin (jigyo_shumoku gin_trgm_ops);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_companies_summary_trgm_temp ON companies_temp USING gin (business_summary gin_trgm_ops);")
        
        # Indexes on related tables
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_financials_corp_temp ON financial_records_temp(corporate_number, fiscal_year DESC);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_signals_corp_temp ON business_signals_temp(corporate_number, signal_date DESC);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_signals_type_corp_temp ON business_signals_temp(signal_type, corporate_number);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_comp_ind_code_corp_temp ON company_industries_temp(industry_code, corporate_number);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_company_industries_path_temp ON company_industries_temp(industry_path);")
        pg_cur.execute("CREATE INDEX IF NOT EXISTS idx_sitemap_companies_emp_temp ON sitemap_companies_temp(employee_count DESC, corporate_number ASC);")
        
        pg_conn.commit()
        print(f"Indices successfully created in {time.time() - t_indices:.2f} seconds.", flush=True)

        # 4. Atomic Swapping in a single transaction
        print("Swapping shadow tables to live production tables in PostgreSQL...", flush=True)
        t_swap = time.time()
        
        # Drop old live tables
        pg_cur.execute("""
        DROP TABLE IF EXISTS companies CASCADE;
        DROP TABLE IF EXISTS m_industries CASCADE;
        DROP TABLE IF EXISTS company_industries CASCADE;
        DROP TABLE IF EXISTS business_signals CASCADE;
        DROP TABLE IF EXISTS financial_records CASCADE;
        DROP TABLE IF EXISTS prefecture_counts CASCADE;
        DROP TABLE IF EXISTS industry_counts CASCADE;
        DROP TABLE IF EXISTS database_stats CASCADE;
        DROP TABLE IF EXISTS city_counts CASCADE;
        DROP TABLE IF EXISTS sitemap_companies CASCADE;
        """)
        
        # Rename temp tables to main tables
        pg_cur.execute("""
        ALTER TABLE companies_temp RENAME TO companies;
        ALTER TABLE m_industries_temp RENAME TO m_industries;
        ALTER TABLE company_industries_temp RENAME TO company_industries;
        ALTER TABLE business_signals_temp RENAME TO business_signals;
        ALTER TABLE financial_records_temp RENAME TO financial_records;
        ALTER TABLE prefecture_counts_temp RENAME TO prefecture_counts;
        ALTER TABLE industry_counts_temp RENAME TO industry_counts;
        ALTER TABLE database_stats_temp RENAME TO database_stats;
        ALTER TABLE city_counts_temp RENAME TO city_counts;
        ALTER TABLE sitemap_companies_temp RENAME TO sitemap_companies;
        """)
        
        # Rename physical partitions
        for i in range(1, 48):
            pref_code = f"{i:02d}"
            pg_cur.execute(f"ALTER TABLE companies_temp_p{pref_code} RENAME TO companies_p{pref_code};")
        pg_cur.execute("ALTER TABLE companies_temp_default RENAME TO companies_default;")
        
        # Rename indexes back to standard names
        pg_cur.execute("""
        ALTER INDEX idx_companies_pref_emp_corp_temp RENAME TO idx_companies_pref_emp_corp;
        ALTER INDEX idx_companies_emp_temp RENAME TO idx_companies_emp;
        ALTER INDEX idx_companies_pref_city_temp RENAME TO idx_companies_pref_city;
        ALTER INDEX idx_companies_capital_amount_temp RENAME TO idx_companies_capital_amount;
        ALTER INDEX idx_companies_status_temp RENAME TO idx_companies_status;
        ALTER INDEX idx_companies_sales_amount_temp RENAME TO idx_companies_sales_amount;
        ALTER INDEX idx_companies_has_email_temp RENAME TO idx_companies_has_email;
        ALTER INDEX idx_companies_has_phone_temp RENAME TO idx_companies_has_phone;
        ALTER INDEX idx_companies_has_website_temp RENAME TO idx_companies_has_website;
        ALTER INDEX idx_companies_has_fax_temp RENAME TO idx_companies_has_fax;
        ALTER INDEX idx_companies_name_trgm_temp RENAME TO idx_companies_name_trgm;
        ALTER INDEX idx_companies_address_trgm_temp RENAME TO idx_companies_address_trgm;
        ALTER INDEX idx_companies_jigyo_trgm_temp RENAME TO idx_companies_jigyo_trgm;
        ALTER INDEX idx_companies_summary_trgm_temp RENAME TO idx_companies_summary_trgm;
        ALTER INDEX idx_financials_corp_temp RENAME TO idx_financials_corp;
        ALTER INDEX idx_signals_corp_temp RENAME TO idx_signals_corp;
        ALTER INDEX idx_signals_type_corp_temp RENAME TO idx_signals_type_corp;
        ALTER INDEX idx_comp_ind_code_corp_temp RENAME TO idx_comp_ind_code_corp;
        ALTER INDEX idx_company_industries_path_temp RENAME TO idx_company_industries_path;
        ALTER INDEX idx_sitemap_companies_emp_temp RENAME TO idx_sitemap_companies_emp;
        """)
        
        pg_conn.commit()
        print(f"Shadow table swap completed successfully in {time.time() - t_swap:.2f} seconds!", flush=True)

        print("\nMigration Completed Successfully! SQLite data is now fully synchronized with PostgreSQL.", flush=True)

    except Exception as e:
        pg_conn.rollback()
        import traceback
        print("\nMigration failed with error:", flush=True)
        traceback.print_exc()
    finally:
        lite_conn.close()
        pg_conn.close()

if __name__ == '__main__':
    main()
