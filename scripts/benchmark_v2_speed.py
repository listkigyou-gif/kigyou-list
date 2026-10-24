import psycopg2
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

test_queries = [
    ("Tìm công ty có Email tại Tokyo (p13)", 
     "SELECT corporate_number, company_name FROM companies WHERE prefecture_code = '13' AND has_email = true LIMIT 20;"),
    
    ("Tìm công ty có Website và SĐT tại Osaka (p27)", 
     "SELECT corporate_number, company_name FROM companies WHERE prefecture_code = '27' AND has_website = true AND has_phone = true LIMIT 20;"),
    
    ("Tìm công ty có Giấy phép BĐS Takken tại Tokyo", 
     "SELECT corporate_number, company_name FROM companies WHERE prefecture_code = '13' AND has_real_estate_lic = true LIMIT 20;"),

    ("Tìm công ty có Giấy phép Xây dựng tại Aichi (p23)", 
     "SELECT corporate_number, company_name FROM companies WHERE prefecture_code = '23' AND has_construction_lic = true LIMIT 20;"),

    ("Tìm công ty có Giấy phép Đồ cũ Kobutsu tại Tokyo", 
     "SELECT corporate_number, company_name FROM companies WHERE prefecture_code = '13' AND has_kobutsu_lic = true LIMIT 20;"),

    ("Tìm công ty có Form liên hệ & Vốn > 5000万 tại Tokyo", 
     "SELECT corporate_number, company_name FROM companies WHERE prefecture_code = '13' AND has_contact_form = true AND capital_range_id >= 3 LIMIT 20;")
]

print("=========================================================================")
print("⚡ BENCHMARK TỐC ĐỘ TRUY VẤN V2 FACETED SEARCH TRÊN 5 TRIỆU DOANH NGHIỆP")
print("=========================================================================")

for title, sql in test_queries:
    times = []
    # Chạy 3 lần để lấy thời gian trung bình
    for _ in range(3):
        t0 = time.time()
        cur.execute(sql)
        rows = cur.fetchall()
        elapsed_ms = (time.time() - t0) * 1000
        times.append(elapsed_ms)
    
    avg_ms = sum(times) / len(times)
    print(f"\n🔍 [Query] {title}")
    print(f"   SQL: {sql}")
    print(f"   Kết quả: {len(rows)} bản ghi")
    print(f"   ⏱️ Thời gian phản hồi: {avg_ms:.2f} ms (Lần 1: {times[0]:.2f}ms, Lần 2: {times[1]:.2f}ms, Lần 3: {times[2]:.2f}ms)")
    if avg_ms < 10.0:
        print("   🌟 TỐC ĐỘ ĐẠT CHUẨN SIÊU TỐC SUB-10MS!")

conn.close()
