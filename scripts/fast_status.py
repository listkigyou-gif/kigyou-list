import sys
sys.stdout.reconfigure(encoding='utf-8')
import sqlite3
import datetime

print(f"=== FAST STATUS REPORT ({datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ===")

# 1. HelloWork
conn_hw = sqlite3.connect('crawlers/hellowork/data/hellowork.db', timeout=10)
c_hw = conn_hw.cursor()
c_hw.execute("SELECT status, COUNT(*) FROM jobs_queue GROUP BY status")
hw_queue = dict(c_hw.fetchall())
c_hw.execute("SELECT COUNT(*) FROM jobs")
hw_jobs = c_hw.fetchone()[0]
c_hw.execute("SELECT COUNT(DISTINCT corporate_number) FROM companies WHERE corporate_number IS NOT NULL AND corporate_number != ''")
hw_corps = c_hw.fetchone()[0]
c_hw.execute("SELECT COUNT(DISTINCT corporate_number) FROM companies WHERE website IS NOT NULL AND website != ''")
hw_corps_web = c_hw.fetchone()[0]
conn_hw.close()

# 2. Master DB & Yahoo
conn_m = sqlite3.connect('kigyou-list.db', timeout=10)
c_m = conn_m.cursor()
c_m.execute("SELECT COUNT(*) FROM raw_yahoo WHERE website_url IS NOT NULL AND website_url != ''")
yahoo_found_total = c_m.fetchone()[0]
c_m.execute("SELECT COUNT(DISTINCT corporate_number) FROM raw_yahoo WHERE website_url IS NOT NULL AND website_url != ''")
yahoo_found_corps = c_m.fetchone()[0]

c_m.execute("SELECT COUNT(*) FROM companies WHERE website_url IS NOT NULL AND website_url != ''")
master_websites = c_m.fetchone()[0]
c_m.execute("SELECT COUNT(*) FROM raw_website")
raw_web_scraped = c_m.fetchone()[0]
c_m.execute("SELECT COUNT(*) FROM companies WHERE business_summary IS NOT NULL AND business_summary != ''")
master_summaries = c_m.fetchone()[0]
conn_m.close()

print(f"HelloWork Extracted: {hw_jobs:,}")
print(f"HelloWork Pending: {hw_queue.get('pending', 0):,}")
print(f"HelloWork Completed Queue: {hw_queue.get('completed', 0):,}")
print(f"HelloWork Recruiting Corps: {hw_corps:,}")
print(f"HelloWork Corps with Web: {hw_corps_web:,}")
print(f"Yahoo Found Total: {yahoo_found_total:,} (Corps: {yahoo_found_corps:,})")
print(f"Master Corporate Websites: {master_websites:,}")
print(f"Raw Website Scraped: {raw_web_scraped:,}")
print(f"Master Summaries Scraped: {master_summaries:,}")
