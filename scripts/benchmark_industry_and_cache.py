import psycopg2
import time
import requests
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def benchmark_db():
    print("=========================================================================")
    print("⚡ 1. BENCHMARK POSTGRESQL COVERING INDEXES & DUAL INDUSTRY SEARCH")
    print("=========================================================================")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    queries = [
        ("Tokyo (p13) + Ngành IT (39) qua Covering Index",
         "SELECT corporate_number, company_name, primary_industry_code FROM companies WHERE prefecture_code = '13' AND primary_industry_code = '39' LIMIT 20;"),
        
        ("Toàn quốc + Ngành Xây dựng (D) qua Major Industry Index",
         "SELECT corporate_number, company_name, major_industry_code FROM companies WHERE major_industry_code = 'D' LIMIT 20;"),
        
        ("Tokyo (p13) + Có Email + Ngành Bán buôn (G)",
         "SELECT corporate_number, company_name FROM companies WHERE prefecture_code = '13' AND has_email = true AND major_industry_code = 'G' LIMIT 20;"),
         
        ("Toàn quốc + Có Fax + Có Website",
         "SELECT corporate_number, company_name FROM companies WHERE has_fax = true AND has_website = true LIMIT 20;"),
         
        ("Toàn quốc + Đếm công ty ngành IT (Covering Index Index-Only Scan)",
         "SELECT COUNT(*) FROM companies WHERE primary_industry_code = '39';")
    ]

    for title, sql in queries:
        times = []
        for _ in range(3):
            t0 = time.time()
            cur.execute(sql)
            rows = cur.fetchall()
            ms = (time.time() - t0) * 1000
            times.append(ms)
        avg_ms = sum(times) / len(times)
        res_info = rows[0][0] if "COUNT" in sql else f"{len(rows)} bản ghi"
        print(f"\n🔍 [DB Query] {title}")
        print(f"   SQL: {sql}")
        print(f"   Kết quả: {res_info}")
        print(f"   ⏱️ Thời gian phản hồi TB: {avg_ms:.2f} ms (Min: {min(times):.2f}ms, Max: {max(times):.2f}ms)")
        if avg_ms < 10.0:
            print("   🌟 TỐC ĐỘ ĐẠT CHUẨN SIÊU TỐC SUB-10MS!")

    cur.close()
    conn.close()

def benchmark_http():
    print("\n=========================================================================")
    print("⚡ 2. BENCHMARK HTTP SEARCH ENDPOINT & TOTAL COUNT CACHE (kigyoulist.com)")
    print("=========================================================================")
    
    base_url = "https://kigyoulist.com/ja/search"
    tests = [
        ("Tìm kiếm Tokyo + Ngành IT (Lần đầu - Warm-up Cache)", f"{base_url}?prefecture=13&industry=39"),
        ("Tìm kiếm Tokyo + Ngành IT (Lần 2 - Page 1 - Cache Hit)", f"{base_url}?prefecture=13&industry=39&page=1"),
        ("Tìm kiếm Tokyo + Ngành IT (Page 2 - Total Count Cache Re-use)", f"{base_url}?prefecture=13&industry=39&page=2"),
        ("Tìm kiếm Toàn quốc có Fax + Website", f"{base_url}?fax=true&website=true"),
    ]

    for title, url in tests:
        times = []
        status_code = 0
        for _ in range(2):
            t0 = time.time()
            try:
                r = requests.get(url, timeout=15, headers={"User-Agent": "BenchmarkBot/1.0"})
                status_code = r.status_code
                times.append((time.time() - t0) * 1000)
            except Exception as e:
                print(f"   Error: {e}")
                times.append(9999)
        avg_ms = sum(times) / len(times)
        print(f"\n🌐 [HTTP] {title}")
        print(f"   URL: {url}")
        print(f"   Status: {status_code} | Phản hồi TB: {avg_ms:.2f} ms (Lần 1: {times[0]:.2f}ms, Lần 2: {times[1]:.2f}ms)")

if __name__ == '__main__':
    benchmark_db()
    benchmark_http()
