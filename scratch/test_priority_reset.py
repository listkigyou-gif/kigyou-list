import sqlite3
import os
import sys

TEST_DB_PATH = "test_temp.db"
SCHEMA_PATH = "database/init_schema_sqlite.sql"

def init_test_db():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    
    conn = sqlite3.connect(TEST_DB_PATH)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()

def test_pipeline():
    print("[*] Running Priority & Crawl Reset Integration Test on TEMP DB...")
    init_test_db()
    
    # Verify column exists
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(companies);")
    columns = [row[1] for row in cursor.fetchall()]
    assert "website_crawl_status" in columns, "website_crawl_status column missing!"
    print("[+] Verified website_crawl_status column exists in SQLite companies table.")

    # Setup a clean test company
    test_corp_num = "9999999999999" # 13-digit test corporate number
    
    print("[*] Inserting mock G-Biz baseline (into companies) with URL: http://gbiz-baseline.jp")
    cursor.execute("""
        INSERT INTO companies (
            corporate_number, company_name, website_url, website_last_crawled_at, website_crawl_status, prefecture_code
        ) VALUES (?, 'Test Company LLC', 'http://gbiz-baseline.jp', '2026-01-01 10:00:00', 'SUCCESS', '13');
    """, (test_corp_num,))
    conn.commit()

    # Verify initial state
    cursor.execute("SELECT website_url, website_last_crawled_at, website_crawl_status FROM companies WHERE corporate_number = ?;", (test_corp_num,))
    row = cursor.fetchone()
    print(f"    Initial state: URL={row[0]}, Last Crawled={row[1]}, Status={row[2]}")
    assert row[0] == "http://gbiz-baseline.jp"
    assert row[1] == "2026-01-01 10:00:00"
    assert row[2] == "SUCCESS"

    # Insert a different Yahoo URL in staging raw_yahoo
    print("[*] Inserting Yahoo URL http://yahoo-secondary.jp in raw_yahoo...")
    cursor.execute("""
        INSERT INTO raw_yahoo (corporate_number, website_url, company_name)
        VALUES (?, 'http://yahoo-secondary.jp', 'Test Company LLC');
    """, (test_corp_num,))
    conn.commit()
    conn.close()

    # Patch DB_PATH in consolidate_data and run
    sys.path.append(os.path.abspath("scripts"))
    import consolidate_data
    consolidate_data.DB_PATH = TEST_DB_PATH
    
    print("[*] Running consolidate_data ETL...")
    consolidate_data.consolidate_data()

    # Verify that G-Biz baseline is prioritized and status is NOT reset
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT website_url, website_last_crawled_at, website_crawl_status FROM companies WHERE corporate_number = ?;", (test_corp_num,))
    row = cursor.fetchone()
    print(f"    After consolidation with G-Biz priority: URL={row[0]}, Last Crawled={row[1]}, Status={row[2]}")
    assert row[0] == "http://gbiz-baseline.jp", "Should prioritize G-Biz baseline URL!"
    assert row[1] == "2026-01-01 10:00:00", "Should NOT reset status if URL did not change!"
    assert row[2] == "SUCCESS", "Should NOT reset status if URL did not change!"

    # Simulating G-Biz URL removed, so Yahoo URL fallback happens
    print("[*] Simulating G-Biz URL removed: updating master URL to NULL...")
    cursor.execute("UPDATE companies SET website_url = NULL WHERE corporate_number = ?;", (test_corp_num,))
    conn.commit()

    print("[*] Running consolidate_data ETL again...")
    conn.close()
    consolidate_data.consolidate_data()

    # Now URL should be Yahoo URL: http://yahoo-secondary.jp, and status should be reset to NULL
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT website_url, website_last_crawled_at, website_crawl_status FROM companies WHERE corporate_number = ?;", (test_corp_num,))
    row = cursor.fetchone()
    print(f"    After consolidation with Yahoo fallback: URL={row[0]}, Last Crawled={row[1]}, Status={row[2]}")
    assert row[0] == "http://yahoo-secondary.jp", "Should fallback to Yahoo URL!"
    assert row[1] is None, "Should reset last crawled timestamp to NULL on URL change!"
    assert row[2] is None, "Should reset crawl status to NULL on URL change!"
    conn.close()

    # Test crawler's target filtering (get_crawl_targets) and error saving
    sys.path.append(os.path.abspath("crawlers/website"))
    import main as crawler_main
    crawler_main.DB_PATH = TEST_DB_PATH
    
    targets = crawler_main.get_crawl_targets(100)
    target_corp_nums = [t[0] for t in targets]
    print(f"    Loaded crawler targets: {len(targets)} targets. Test corporate number in targets? {test_corp_num in target_corp_nums}")
    assert test_corp_num in target_corp_nums, "Test company should be targeted for crawl!"

    # Save a crawler error status to verify error saving
    print("[*] Simulating crawler execution and saving ERR_TIMEOUT...")
    crawler_main.save_scraped_data(test_corp_num, "http://yahoo-secondary.jp", {
        "phone_number": "",
        "fax_number": "",
        "email_address": "",
        "capital_amount": "",
        "employee_count": "",
        "representative_name": "",
        "business_summary": "",
        "crawl_status": "ERR_TIMEOUT"
    })

    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT website_url, website_last_crawled_at, website_crawl_status FROM companies WHERE corporate_number = ?;", (test_corp_num,))
    row = cursor.fetchone()
    print(f"    After crawler save: URL={row[0]}, Last Crawled={row[1]}, Status={row[2]}")
    assert row[2] == "ERR_TIMEOUT", "Crawl status should be saved as ERR_TIMEOUT!"
    conn.close()
    
    # Try fetching targets again; should not be targeted since it was crawled just now (less than 30 days ago)
    targets = crawler_main.get_crawl_targets(100)
    target_corp_nums = [t[0] for t in targets]
    print(f"    Loaded crawler targets after save: test corporate number in targets? {test_corp_num in target_corp_nums}")
    assert test_corp_num not in target_corp_nums, "Should not recrawl failed URL within 30 days!"

    # Simulating G-Biz update resetting crawl status
    print("[*] Simulating G-Biz registry update with a new URL: http://gbiz-new.jp")
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO companies (
            corporate_number, company_name, website_url, website_last_crawled_at, website_crawl_status, prefecture_code
        ) VALUES (?, 'Test Company LLC', 'http://gbiz-new.jp', '2026-01-01 10:00:00', 'SUCCESS', '13')
        ON CONFLICT(corporate_number) DO UPDATE SET
            website_last_crawled_at = CASE 
                WHEN EXCLUDED.website_url IS NOT website_url THEN NULL 
                ELSE website_last_crawled_at 
            END,
            website_crawl_status = CASE 
                WHEN EXCLUDED.website_url IS NOT website_url THEN NULL 
                ELSE website_crawl_status 
            END,
            website_url = EXCLUDED.website_url;
    """, (test_corp_num,))
    conn.commit()

    cursor.execute("SELECT website_url, website_last_crawled_at, website_crawl_status FROM companies WHERE corporate_number = ?;", (test_corp_num,))
    row = cursor.fetchone()
    print(f"    After G-Biz conflict update with new URL: URL={row[0]}, Last Crawled={row[1]}, Status={row[2]}")
    assert row[0] == "http://gbiz-new.jp"
    assert row[1] is None, "Should reset last crawled timestamp to NULL on G-Biz URL change!"
    assert row[2] is None, "Should reset crawl status to NULL on G-Biz URL change!"
    conn.close()

    # Clean up test temp DB file
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        print("[*] Cleaned up temporary test database.")

    print("[+] ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_pipeline()
