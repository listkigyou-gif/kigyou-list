import sqlite3
import time

def main():
    db_path = "kigyou-list.db"
    print(f"Connecting to database: {db_path}...")
    conn = sqlite3.connect(db_path, timeout=60.0)
    cursor = conn.cursor()
    
    # Configure WAL mode and other optimizations
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;") # 64MB Cache
    conn.execute("PRAGMA synchronous=NORMAL;")
    
    print("Creating new indexes...")
    t_start = time.time()
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_sales_amount 
        ON companies(sales_amount);
    """)
    print("Created idx_companies_sales_amount")
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_status 
        ON companies(status);
    """)
    print("Created idx_companies_status")
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_has_email 
        ON companies(email_address) WHERE email_address IS NOT NULL AND email_address != '';
    """)
    print("Created idx_companies_has_email")
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_has_phone 
        ON companies(phone_number) WHERE phone_number IS NOT NULL AND phone_number != '';
    """)
    print("Created idx_companies_has_phone")
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_has_website 
        ON companies(website_url) WHERE website_url IS NOT NULL AND website_url != '';
    """)
    print("Created idx_companies_has_website")
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_companies_has_fax 
        ON companies(fax_number) WHERE fax_number IS NOT NULL AND fax_number != '';
    """)
    print("Created idx_companies_has_fax")
    
    conn.commit()
    conn.close()
    
    print(f"All indexes applied successfully in {time.time() - t_start:.2f} seconds!")

if __name__ == "__main__":
    main()
