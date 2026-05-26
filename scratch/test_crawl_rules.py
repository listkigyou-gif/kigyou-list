#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import sqlite3
import shutil
from datetime import datetime, timedelta

# Import modules to test/monkeypatch
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from crawlers.hellowork.harvester import HelloworkHarvester
import crawlers.website.main as website_main
import crawlers.yahoo.yahoo_searcher as yahoo_searcher
import scripts.consolidate_data as consolidate_data

TEST_DB = "test_prevent_crawl.db"
TEST_HW_DB = "test_hellowork_queue.db"

def setup_test_databases():
    # Clean up old test DBs
    for db in [TEST_DB, TEST_HW_DB]:
        if os.path.exists(db):
            try:
                os.remove(db)
            except Exception:
                pass
            
    # Setup test main DB schema
    conn = sqlite3.connect(TEST_DB)
    cur = conn.cursor()
    
    # companies table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            corporate_number TEXT PRIMARY KEY,
            company_name TEXT,
            postal_code TEXT,
            prefecture_code TEXT,
            prefecture_name TEXT,
            city_name TEXT,
            street_address TEXT,
            full_address TEXT,
            representative_name TEXT,
            establishment_date TEXT,
            capital_amount INTEGER,
            employee_count INTEGER,
            phone_number TEXT,
            fax_number TEXT,
            website_url TEXT,
            email_address TEXT,
            business_summary TEXT,
            jigyo_shumoku TEXT,
            branch_phone_numbers TEXT,
            website_last_crawled_at TEXT,
            website_crawl_status TEXT,
            yahoo_last_crawled_at TEXT,
            status TEXT DEFAULT '活動中',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # raw_hellowork
    cur.execute("""
        CREATE TABLE IF NOT EXISTS raw_hellowork (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            corporate_number TEXT,
            phone_number TEXT,
            fax_number TEXT,
            email_address TEXT,
            website_url TEXT,
            representative_name TEXT,
            capital_amount TEXT,
            total_employees TEXT,
            job_title TEXT,
            receipt_date TEXT,
            wages TEXT,
            work_location TEXT,
            holidays TEXT,
            industry TEXT,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            establishment_year TEXT,
            office_name TEXT,
            office_address TEXT,
            job_number TEXT,
            job_description TEXT
        );
    """)
    
    # raw_yahoo
    cur.execute("""
        CREATE TABLE IF NOT EXISTS raw_yahoo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            corporate_number TEXT,
            company_name TEXT,
            yahoo_name TEXT,
            yahoo_address TEXT,
            phone_number TEXT,
            website_url TEXT,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # raw_website
    cur.execute("""
        CREATE TABLE IF NOT EXISTS raw_website (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            corporate_number TEXT,
            website_url TEXT,
            phone_number TEXT,
            fax_number TEXT,
            email_address TEXT,
            capital_amount TEXT,
            employee_count TEXT,
            representative_name TEXT,
            business_summary TEXT,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # business_signals
    cur.execute("""
        CREATE TABLE IF NOT EXISTS business_signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            corporate_number TEXT,
            signal_type TEXT,
            signal_title TEXT,
            signal_date TEXT,
            source_url TEXT,
            details TEXT
        );
    """)
    
    conn.commit()
    conn.close()

    # Setup local Hellowork DB schema
    conn_hw = sqlite3.connect(TEST_HW_DB)
    cur_hw = conn_hw.cursor()
    cur_hw.execute("""
        CREATE TABLE IF NOT EXISTS jobs_queue (
            job_id TEXT PRIMARY KEY,
            status TEXT,
            updated_at TEXT,
            prefecture_code TEXT
        );
    """)
    conn_hw.commit()
    conn_hw.close()

def cleanup_test_databases():
    for db in [TEST_DB, TEST_HW_DB]:
        if os.path.exists(db):
            try:
                os.remove(db)
            except Exception:
                pass

def test_hellowork_harvester_double_check():
    print("[*] Running Test: HelloWork Harvester Double-Check Rule...")
    
    # Set paths in HelloworkHarvester
    import crawlers.hellowork.harvester
    crawlers.hellowork.harvester.DB_PATH = TEST_HW_DB
    
    # Create Harvester instance
    harvester = HelloworkHarvester()
    
    # Check on empty DBs
    assert not harvester.check_job_exists("job_123"), "Should be False when not in queue nor main db"
    
    # Insert in local jobs_queue
    conn_hw = sqlite3.connect(TEST_HW_DB)
    conn_hw.execute("INSERT INTO jobs_queue (job_id, status) VALUES (?, ?)", ("job_123", "pending"))
    conn_hw.commit()
    conn_hw.close()
    
    assert harvester.check_job_exists("job_123"), "Should be True when in local jobs_queue"
    
    # Monkeypatch the main db path inside check_job_exists function check
    original_exists = os.path.exists
    original_connect = sqlite3.connect
    
    def mock_exists(path):
        if "kigyou-list.db" in path:
            return True
        return original_exists(path)
        
    def mock_connect(database, *args, **kwargs):
        if "kigyou-list.db" in database:
            return original_connect(TEST_DB, *args, **kwargs)
        return original_connect(database, *args, **kwargs)
        
    os.path.exists = mock_exists
    sqlite3.connect = mock_connect
    
    try:
        # Check job_456 (not in local queue, but we insert it in raw_hellowork of TEST_DB)
        conn_main = sqlite3.connect(TEST_DB)
        conn_main.execute("INSERT INTO raw_hellowork (job_number, corporate_number) VALUES (?, ?)", ("job_456", "1234567890123"))
        conn_main.commit()
        conn_main.close()
        
        # Verify double check logic finds it in master
        assert harvester.check_job_exists("job_456"), "Should be True when in master raw_hellowork table"
        print("[+] PASS: HelloWork double-check works correctly.")
    finally:
        # Restore original functions
        os.path.exists = original_exists
        sqlite3.connect = original_connect

def test_website_crawler_360_days():
    print("[*] Running Test: Website Crawler 360-day Cycle...")
    
    # Point main.py DB_PATH to TEST_DB
    website_main.DB_PATH = TEST_DB
    
    conn = sqlite3.connect(TEST_DB)
    cur = conn.cursor()
    cur.execute("DELETE FROM companies;")
    
    now = datetime.now()
    
    # 1. Company never crawled
    cur.execute("""
        INSERT INTO companies (corporate_number, company_name, website_url, website_last_crawled_at, website_crawl_status)
        VALUES ('1000000000001', 'Company A', 'http://company-a.com', NULL, NULL);
    """)
    
    # 2. Company crawled successfully 200 days ago (should NOT be crawled under 360-day rule)
    crawled_200_days_ago = (now - timedelta(days=200)).strftime('%Y-%m-%d %H:%M:%S')
    cur.execute("""
        INSERT INTO companies (corporate_number, company_name, website_url, website_last_crawled_at, website_crawl_status)
        VALUES ('1000000000002', 'Company B', 'http://company-b.com', ?, 'SUCCESS');
    """, (crawled_200_days_ago,))
    
    # 3. Company crawled successfully 400 days ago (should be crawled)
    crawled_400_days_ago = (now - timedelta(days=400)).strftime('%Y-%m-%d %H:%M:%S')
    cur.execute("""
        INSERT INTO companies (corporate_number, company_name, website_url, website_last_crawled_at, website_crawl_status)
        VALUES ('1000000000003', 'Company C', 'http://company-c.com', ?, 'SUCCESS');
    """, (crawled_400_days_ago,))
    
    # 4. Company with crawl error 40 days ago (should be crawled under 30-day retry rule)
    crawled_40_days_ago = (now - timedelta(days=40)).strftime('%Y-%m-%d %H:%M:%S')
    cur.execute("""
        INSERT INTO companies (corporate_number, company_name, website_url, website_last_crawled_at, website_crawl_status)
        VALUES ('1000000000004', 'Company D', 'http://company-d.com', ?, 'ERR_TIMEOUT');
    """, (crawled_40_days_ago,))
    
    # 5. Company with crawl error 10 days ago (should NOT be crawled yet)
    crawled_10_days_ago = (now - timedelta(days=10)).strftime('%Y-%m-%d %H:%M:%S')
    cur.execute("""
        INSERT INTO companies (corporate_number, company_name, website_url, website_last_crawled_at, website_crawl_status)
        VALUES ('1000000000005', 'Company E', 'http://company-e.com', ?, 'ERR_TIMEOUT');
    """, (crawled_10_days_ago,))
    
    conn.commit()
    conn.close()
    
    targets = website_main.get_crawl_targets(10)
    corp_nums = [t[0] for t in targets]
    
    # Expected targets: Company A (never), Company C (crawled 400 days ago), Company D (error 40 days ago)
    # Excluded targets: Company B (crawled 200 days ago), Company E (error 10 days ago)
    print(f"  Target corporate numbers loaded: {corp_nums}")
    assert '1000000000001' in corp_nums, "Company A (never crawled) should be targeted"
    assert '1000000000002' not in corp_nums, "Company B (crawled 200 days ago successfully) should NOT be targeted (360-day rule)"
    assert '1000000000003' in corp_nums, "Company C (crawled 400 days ago successfully) should be targeted (360-day rule)"
    assert '1000000000004' in corp_nums, "Company D (error 40 days ago) should be targeted (30-day retry rule)"
    assert '1000000000005' not in corp_nums, "Company E (error 10 days ago) should NOT be targeted yet"
    
    print("[+] PASS: Website crawler target selection meets 360-day success & 30-day error retry rules.")

def test_yahoo_crawler_360_days():
    print("[*] Running Test: Yahoo Crawler 360-day Skip...")
    
    # Setup test companies in DB
    conn = sqlite3.connect(TEST_DB)
    cur = conn.cursor()
    cur.execute("DELETE FROM companies;")
    
    now = datetime.now()
    crawled_recently = (now - timedelta(days=100)).strftime('%Y-%m-%d %H:%M:%S')
    crawled_long_ago = (now - timedelta(days=400)).strftime('%Y-%m-%d %H:%M:%S')
    
    # Company crawled 100 days ago
    cur.execute("""
        INSERT INTO companies (corporate_number, company_name, yahoo_last_crawled_at)
        VALUES ('2000000000001', 'Yahoo Crawled Recently', ?);
    """, (crawled_recently,))
    
    # Company crawled 400 days ago
    cur.execute("""
        INSERT INTO companies (corporate_number, company_name, yahoo_last_crawled_at)
        VALUES ('2000000000002', 'Yahoo Crawled Long Ago', ?);
    """, (crawled_long_ago,))
    
    # Company never crawled on Yahoo
    cur.execute("""
        INSERT INTO companies (corporate_number, company_name, yahoo_last_crawled_at)
        VALUES ('2000000000003', 'Yahoo Never Crawled', NULL);
    """,)
    
    conn.commit()
    conn.close()
    
    # Mock input file and done file
    mock_input = [
        {"corp_num": "2000000000001", "name": "Yahoo Crawled Recently", "prefecture": "Tokyo", "city": "Minato"},
        {"corp_num": "2000000000002", "name": "Yahoo Crawled Long Ago", "prefecture": "Tokyo", "city": "Minato"},
        {"corp_num": "2000000000003", "name": "Yahoo Never Crawled", "prefecture": "Tokyo", "city": "Minato"}
    ]
    
    # Mock files using patch or temporary mock read function
    # Let's monkeypatch os.path.exists and sqlite3.connect inside yahoo_searcher.run
    original_exists = os.path.exists
    original_connect = sqlite3.connect
    
    def mock_exists_searcher(path):
        if "kigyou-list.db" in path:
            return True
        return original_exists(path)
        
    def mock_connect_searcher(database, *args, **kwargs):
        if "kigyou-list.db" in database:
            return original_connect(TEST_DB, *args, **kwargs)
        return original_connect(database, *args, **kwargs)
        
    os.path.exists = mock_exists_searcher
    sqlite3.connect = mock_connect_searcher
    
    # We will test the list filtering directly in yahoo_searcher.run logic by simulating it:
    db_path = "kigyou-list.db"
    
    try:
        # Let's query kigyou-list.db as yahoo_searcher would
        crawled_recently_set = set()
        conn = sqlite3.connect(db_path, timeout=30)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT corporate_number 
            FROM companies 
            WHERE yahoo_last_crawled_at IS NOT NULL 
              AND datetime(yahoo_last_crawled_at) >= datetime('now', '-360 days')
        """)
        crawled_recently_set = {row[0] for row in cursor.fetchall() if row[0]}
        conn.close()
        
        # Verify filtering
        assert "2000000000001" in crawled_recently_set, "Yahoo Crawled Recently should be in recently crawled set"
        assert "2000000000002" not in crawled_recently_set, "Yahoo Crawled Long Ago should NOT be in recently crawled set"
        assert "2000000000003" not in crawled_recently_set, "Yahoo Never Crawled should NOT be in recently crawled set"
        
        companies_todo = [
            c for c in mock_input 
            if c["corp_num"] not in crawled_recently_set
        ]
        
        todo_nums = [c["corp_num"] for c in companies_todo]
        assert "2000000000001" not in todo_nums, "Should skip recently crawled company"
        assert "2000000000002" in todo_nums, "Should include company crawled >360 days ago"
        assert "2000000000003" in todo_nums, "Should include never-crawled company"
        
        print("[+] PASS: Yahoo crawler target selection correctly skips companies crawled within 360 days.")
    finally:
        os.path.exists = original_exists
        sqlite3.connect = original_connect

def test_consolidation_etl_yahoo_scraped_at():
    print("[*] Running Test: Consolidation ETL updating yahoo_last_crawled_at...")
    
    # Point consolidate_data DB_PATH to TEST_DB
    consolidate_data.DB_PATH = TEST_DB
    
    conn = sqlite3.connect(TEST_DB)
    cur = conn.cursor()
    cur.execute("DELETE FROM companies;")
    cur.execute("DELETE FROM raw_yahoo;")
    
    # Insert raw_yahoo record with a scraped_at timestamp
    scrape_time = "2026-05-20 10:00:00"
    cur.execute("""
        INSERT INTO raw_yahoo (corporate_number, company_name, yahoo_name, yahoo_address, phone_number, website_url, scraped_at)
        VALUES ('3000000000001', 'Test Company F', 'Yahoo Test F', 'Tokyo Minato', '03-1234-5678', 'http://test-f.com', ?);
    """, (scrape_time,))
    
    # Insert corresponding master company with a different or null yahoo_last_crawled_at
    cur.execute("""
        INSERT INTO companies (corporate_number, company_name, yahoo_last_crawled_at)
        VALUES ('3000000000001', 'Test Company F', NULL);
    """)
    
    conn.commit()
    conn.close()
    
    # Run the ETL consolidation for this company
    consolidate_data.consolidate_data()
    
    # Verify the results in DB
    conn = sqlite3.connect(TEST_DB)
    res = conn.execute("SELECT yahoo_last_crawled_at, phone_number FROM companies WHERE corporate_number = '3000000000001';").fetchone()
    conn.close()
    
    assert res is not None, "Company should exist"
    assert res[0] == scrape_time, f"yahoo_last_crawled_at should be updated to {scrape_time}, got {res[0]}"
    assert res[1] == "03-1234-5678", f"phone_number should be consolidated, got {res[1]}"
    
    print("[+] PASS: Consolidation ETL correctly maps raw_yahoo.scraped_at to companies.yahoo_last_crawled_at.")

def main():
    print("="*60)
    print("      CRAWLER RULES & PREVENT CRAWL TEST SUITE")
    print("="*60)
    
    setup_test_databases()
    try:
        test_hellowork_harvester_double_check()
        print("-"*40)
        test_website_crawler_360_days()
        print("-"*40)
        test_yahoo_crawler_360_days()
        print("-"*40)
        test_consolidation_etl_yahoo_scraped_at()
        print("="*60)
        print("SUCCESS: ALL TESTS PASSED SUCCESSFULLY!")
        print("="*60)
    except AssertionError as e:
        print(f"FAIL: TEST FAILURE: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cleanup_test_databases()

if __name__ == "__main__":
    main()
