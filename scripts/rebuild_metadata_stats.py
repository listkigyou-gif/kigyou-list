import sqlite3
import time
import sys

def rebuild_metadata():
    db_path = "kigyou-list.db"
    print(f"Connecting to database: {db_path}...")
    t_start = time.time()
    
    conn = sqlite3.connect(db_path, timeout=30.0)
    
    # Configure WAL mode and other optimizations
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;") # 64MB Cache
    conn.execute("PRAGMA synchronous=NORMAL;")
    
    cursor = conn.cursor()
    
    # 1. Create Tables
    print("Creating metadata tables...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prefecture_counts (
            prefecture_code TEXT PRIMARY KEY,
            prefecture_name TEXT NOT NULL,
            company_count INTEGER NOT NULL
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS city_counts (
            prefecture_code TEXT,
            city_name TEXT,
            company_count INTEGER NOT NULL,
            PRIMARY KEY (prefecture_code, city_name)
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS industry_counts (
            industry_code TEXT PRIMARY KEY,
            industry_name TEXT NOT NULL,
            company_count INTEGER NOT NULL
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS database_stats (
            stat_key TEXT PRIMARY KEY,
            stat_value INTEGER NOT NULL
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sitemap_companies (
            corporate_number TEXT PRIMARY KEY,
            updated_at TEXT,
            employee_count INTEGER
        );
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS industry_prefecture_pairs (
            industry_code TEXT,
            prefecture_code TEXT,
            PRIMARY KEY (industry_code, prefecture_code)
        );
    """)
    
    # Add industry hierarchy columns if they do not exist
    cursor.execute("PRAGMA table_info(m_industries);")
    cols = [r[1] for r in cursor.fetchall()]
    if 'materialized_path' not in cols:
        print("Adding column materialized_path to m_industries...")
        cursor.execute("ALTER TABLE m_industries ADD COLUMN materialized_path TEXT;")
        
    cursor.execute("PRAGMA table_info(company_industries);")
    cols = [r[1] for r in cursor.fetchall()]
    if 'industry_path' not in cols:
        print("Adding column industry_path to company_industries...")
        cursor.execute("ALTER TABLE company_industries ADD COLUMN industry_path TEXT;")

    # Populate industry materialized paths
    print("Populating materialized_path in m_industries...")
    cursor.execute("""
        UPDATE m_industries 
        SET materialized_path = CASE 
            WHEN classification_level = '大分類' THEN industry_code
            WHEN classification_level = '中分類' THEN parent_code || '.' || industry_code
            ELSE industry_code
        END;
    """)
    
    print("Populating industry_path in company_industries...")
    cursor.execute("""
        UPDATE company_industries
        SET industry_path = (
            SELECT materialized_path 
            FROM m_industries 
            WHERE m_industries.industry_code = company_industries.industry_code
        );
    """)
    
    # 2. Create Indexes
    print("Creating indexes (this may take a moment if they do not exist)...")
    t_idx = time.time()
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_employees_corp 
        ON companies(employee_count DESC, corporate_number ASC);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_prefecture_code 
        ON companies(prefecture_code);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_pref_city 
        ON companies(prefecture_code, city_name);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_sales_amount 
        ON companies(sales_amount);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_status 
        ON companies(status);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_has_email 
        ON companies(email_address) WHERE email_address IS NOT NULL AND email_address != '';
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_has_phone 
        ON companies(phone_number) WHERE phone_number IS NOT NULL AND phone_number != '';
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_has_website 
        ON companies(website_url) WHERE website_url IS NOT NULL AND website_url != '';
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_has_fax 
        ON companies(fax_number) WHERE fax_number IS NOT NULL AND fax_number != '';
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_company_industries_path
        ON company_industries(industry_path);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_company_industries_corp
        ON company_industries(corporate_number);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_sitemap_companies_employees 
        ON sitemap_companies(employee_count DESC, corporate_number ASC);
    """)
    print(f"Indexes verified/created in {time.time() - t_idx:.2f} seconds.")
    
    # 3. Calculate and populate Prefecture Counts
    print("Calculating prefecture counts...")
    t_pref = time.time()
    cursor.execute("""
        SELECT prefecture_code, prefecture_name, COUNT(*) 
        FROM companies 
        WHERE prefecture_code IS NOT NULL AND prefecture_name IS NOT NULL
        GROUP BY prefecture_code, prefecture_name
    """)
    pref_rows = cursor.fetchall()
    print(f"Fetched {len(pref_rows)} prefectures in {time.time() - t_pref:.2f} seconds. Populating table...")
    
    cursor.execute("DELETE FROM prefecture_counts;")
    cursor.executemany("""
        INSERT INTO prefecture_counts (prefecture_code, prefecture_name, company_count)
        VALUES (?, ?, ?);
    """, pref_rows)
    
    # 3.1 Calculate and populate City Counts
    print("Calculating city counts...")
    t_city = time.time()
    cursor.execute("""
        SELECT prefecture_code, city_name, COUNT(*) 
        FROM companies 
        WHERE prefecture_code IS NOT NULL AND city_name IS NOT NULL AND city_name != ''
        GROUP BY prefecture_code, city_name
    """)
    city_rows = cursor.fetchall()
    print(f"Fetched {len(city_rows)} cities in {time.time() - t_city:.2f} seconds. Populating table...")
    
    cursor.execute("DELETE FROM city_counts;")
    cursor.executemany("""
        INSERT INTO city_counts (prefecture_code, city_name, company_count)
        VALUES (?, ?, ?);
    """, city_rows)
    
    # 4. Calculate and populate Industry Counts
    print("Calculating industry counts...")
    t_ind = time.time()
    cursor.execute("""
        SELECT m.industry_code, m.industry_name, COUNT(ci.corporate_number) 
        FROM m_industries m
        JOIN company_industries ci ON m.industry_code = ci.industry_code
        GROUP BY m.industry_code, m.industry_name
    """)
    ind_rows = cursor.fetchall()
    print(f"Fetched {len(ind_rows)} industries in {time.time() - t_ind:.2f} seconds. Populating table...")
    
    cursor.execute("DELETE FROM industry_counts;")
    cursor.executemany("""
        INSERT INTO industry_counts (industry_code, industry_name, company_count)
        VALUES (?, ?, ?);
    """, ind_rows)
    
    # 5. Calculate and populate General Database Stats
    print("Calculating general database stats...")
    t_stats = time.time()
    
    cursor.execute("SELECT COUNT(*) FROM companies;")
    total_companies = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT prefecture_code) FROM companies WHERE prefecture_code IS NOT NULL;")
    total_prefectures = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM m_industries;")
    total_industries = cursor.fetchone()[0]
    
    print(f"Stats calculated in {time.time() - t_stats:.2f} seconds. Populating table...")
    
    # 6. Calculate signal counts
    print("Calculating signal counts...")
    t_sigs = time.time()
    cursor.execute("""
        SELECT signal_type, COUNT(DISTINCT corporate_number)
        FROM business_signals
        GROUP BY signal_type;
    """)
    sig_rows = cursor.fetchall()
    sig_map = {row[0]: row[1] for row in sig_rows}
    print(f"Signal counts calculated in {time.time() - t_sigs:.2f} seconds.")
    
    cursor.execute("DELETE FROM database_stats;")
    cursor.executemany("""
        INSERT INTO database_stats (stat_key, stat_value)
        VALUES (?, ?);
    """, [
        ("total_companies", total_companies),
        ("total_prefectures", total_prefectures),
        ("total_industries", total_industries),
        ("signal_hiring", sig_map.get("求人あり", 0)),
        ("signal_subsidy", sig_map.get("補助金受給", 0)),
        ("signal_bidding", sig_map.get("調達案件", 0)),
        ("signal_award", sig_map.get("表彰", 0)),
        ("signal_certification", sig_map.get("届出認定", 0)),
        ("signal_patent", sig_map.get("特許", 0))
    ])
    
    # 7. Populate Sitemap Companies
    print("Populating sitemap companies table...")
    t_sitemap = time.time()
    cursor.execute("DELETE FROM sitemap_companies;")
    cursor.execute("""
        INSERT INTO sitemap_companies (corporate_number, updated_at, employee_count)
        SELECT corporate_number, updated_at, employee_count
        FROM companies
        WHERE employee_count IS NOT NULL
           OR corporate_number IN (SELECT DISTINCT corporate_number FROM business_signals);
    """)
    print(f"Sitemap companies populated in {time.time() - t_sitemap:.2f} seconds.")
    
    # 8. Populate Active Industry-Prefecture Pairs
    print("Populating active industry-prefecture pairs table...")
    t_pairs = time.time()
    cursor.execute("DELETE FROM industry_prefecture_pairs;")
    cursor.execute("""
        INSERT INTO industry_prefecture_pairs (industry_code, prefecture_code)
        SELECT DISTINCT ci.industry_code, c.prefecture_code
        FROM company_industries ci
        JOIN companies c ON ci.corporate_number = c.corporate_number
        WHERE c.prefecture_code IS NOT NULL AND ci.industry_code IS NOT NULL;
    """)
    print(f"Active industry-prefecture pairs populated in {time.time() - t_pairs:.2f} seconds.")
    
    conn.commit()
    conn.close()
    
    print(f"Success! Metadata stats rebuilt in {time.time() - t_start:.2f} seconds total.")

if __name__ == "__main__":
    rebuild_metadata()
