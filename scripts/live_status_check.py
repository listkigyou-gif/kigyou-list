import sys
sys.stdout.reconfigure(encoding='utf-8')
import sqlite3
import datetime

print(f"=== BÁO CÁO TIẾN ĐỘ THỜI GIAN THỰC ({datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ===")

# 1. HelloWork
print("\n[1] HELLOWORK CRAWLER (task-1555):")
try:
    conn_hw = sqlite3.connect('crawlers/hellowork/data/hellowork.db', timeout=30)
    c_hw = conn_hw.cursor()
    c_hw.execute("SELECT status, COUNT(*) FROM jobs_queue GROUP BY status")
    statuses = dict(c_hw.fetchall())
    c_hw.execute("SELECT COUNT(*) FROM jobs")
    jobs_count = c_hw.fetchone()[0]
    c_hw.execute("SELECT COUNT(*) FROM companies")
    hw_corps_total = c_hw.fetchone()[0]
    c_hw.execute("SELECT COUNT(*) FROM companies WHERE website IS NOT NULL AND website != ''")
    hw_corps_web = c_hw.fetchone()[0]
    conn_hw.close()

    total_queue = sum(statuses.values())
    done_queue = statuses.get('done', 0)
    pending_queue = statuses.get('pending', 0)
    processing_queue = statuses.get('processing', 0)
    failed_queue = statuses.get('failed', 0)

    print(f"  - Tổng số việc làm trong hàng đợi: {total_queue:,}")
    print(f"  - Đã cào chi tiết hoàn tất: {done_queue:,} ({done_queue/max(1,total_queue)*100:.2f}%)")
    print(f"  - Đang chờ xử lý trong hàng đợi: {pending_queue:,}")
    print(f"  - Đang được các luồng xử lý: {processing_queue:,}")
    if failed_queue > 0:
        print(f"  - Thất bại / Cần retry: {failed_queue:,}")
    print(f"  - Tổng số việc làm đã lưu vào bảng jobs: {jobs_count:,}")
    print(f"  - Doanh nghiệp tuyển dụng tìm thấy: {hw_corps_total:,} (trong đó {hw_corps_web:,} đã có sẵn web từ HelloWork)")
except Exception as e:
    print(f"  Lỗi đọc HelloWork DB: {e}")

# 2. Yahoo Searcher
print("\n[2] YAHOO SEARCHER ENGINE (task-2014):")
try:
    conn_m = sqlite3.connect('kigyou-list.db', timeout=30)
    c_m = conn_m.cursor()
    c_m.execute("SELECT COUNT(*) FROM raw_yahoo")
    raw_yahoo_total = c_m.fetchone()[0]
    c_m.execute("SELECT COUNT(*) FROM raw_yahoo WHERE website_url IS NOT NULL AND website_url != ''")
    raw_yahoo_web = c_m.fetchone()[0]
    
    # Check targets needing search: HelloWork corps without website
    # First check how many distinct recruiting corps exist in hellowork companies
    conn_hw = sqlite3.connect('crawlers/hellowork/data/hellowork.db', timeout=30)
    c_hw = conn_hw.cursor()
    c_hw.execute("SELECT corporate_number, company_name FROM companies WHERE corporate_number IS NOT NULL AND corporate_number != ''")
    all_hw_corps = c_hw.fetchall()
    conn_hw.close()
    
    # Check how many of these have website in raw_yahoo or companies or hellowork
    c_m.execute("SELECT corporate_number FROM raw_yahoo WHERE website_url IS NOT NULL AND website_url != ''")
    yahoo_found_corps = set(r[0] for r in c_m.fetchall())
    
    c_m.execute("SELECT corporate_number FROM companies WHERE website_url IS NOT NULL AND website_url != ''")
    master_web_corps = set(r[0] for r in c_m.fetchall())

    conn_hw = sqlite3.connect('crawlers/hellowork/data/hellowork.db', timeout=30)
    c_hw = conn_hw.cursor()
    c_hw.execute("SELECT corporate_number FROM companies WHERE website IS NOT NULL AND website != ''")
    hw_has_web = set(r[0] for r in c_hw.fetchall())
    conn_hw.close()

    total_recruiting_corps = len(all_hw_corps)
    corps_with_any_web = set()
    for corp, _ in all_hw_corps:
        if corp in hw_has_web or corp in yahoo_found_corps or corp in master_web_corps:
            corps_with_any_web.add(corp)
            
    needing_search = total_recruiting_corps - len(corps_with_any_web)

    print(f"  - Doanh nghiệp đã được Yahoo quét & lưu: {raw_yahoo_total:,}")
    print(f"  - Tìm thấy website thành công: {raw_yahoo_web:,} ({raw_yahoo_web/max(1,raw_yahoo_total)*100:.2f}%)")
    print(f"  - Tổng số DN tuyển dụng từ HelloWork: {total_recruiting_corps:,}")
    print(f"  - Số DN tuyển dụng ĐÃ CÓ website: {len(corps_with_any_web):,} ({len(corps_with_any_web)/max(1,total_recruiting_corps)*100:.2f}%)")
    print(f"  - Số DN tuyển dụng CÒN LẠI cần tìm website: {needing_search:,}")

except Exception as e:
    print(f"  Lỗi đọc Yahoo / Master DB: {e}")

# 3. Website Content Scraper
print("\n[3] WEBSITE CONTENT SCRAPER:")
try:
    c_m.execute("SELECT COUNT(*) FROM raw_website")
    raw_web_scraped = c_m.fetchone()[0]
    c_m.execute("SELECT COUNT(*) FROM companies WHERE website_url IS NOT NULL AND website_url != ''")
    master_with_web = c_m.fetchone()[0]
    c_m.execute("SELECT COUNT(*) FROM companies WHERE business_summary IS NOT NULL AND business_summary != ''")
    master_with_summary = c_m.fetchone()[0]
    c_m.execute("SELECT COUNT(*) FROM companies WHERE website_crawl_status = 'crawled'")
    crawled_status = c_m.fetchone()[0]
    
    print(f"  - Bảng raw_website đã thu thập: {raw_web_scraped:,} bản ghi website")
    print(f"  - Tổng doanh nghiệp có URL website trong Master DB: {master_with_web:,}")
    print(f"  - Đã bóc tách tóm tắt doanh nghiệp (business_summary): {master_with_summary:,}")
    conn_m.close()
except Exception as e:
    print(f"  Lỗi đọc Website DB: {e}")
