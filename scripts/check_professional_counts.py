import sys, psycopg2

sys.stdout.reconfigure(encoding='utf-8')
conn_pg = psycopg2.connect('postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list')
cur_pg = conn_pg.cursor()

keywords = [
    '税理士', '会計', '法律', '弁護士', '行政書士', '司法書士', '社会保険労務士', '社労士', '弁理士', '特許', '監査'
]

print("=== KHẢO SÁT CÁC TỪ KHÓA CHUYÊN MÔN (士業・会計・法律) TRÊN VPS POSTGRESQL ===")
for kw in keywords:
    cur_pg.execute("SELECT COUNT(*) FROM companies WHERE company_name LIKE %s", (f"%{kw}%",))
    cnt_name = cur_pg.fetchone()[0]
    cur_pg.execute("SELECT COUNT(*) FROM companies WHERE jigyo_shumoku LIKE %s", (f"%{kw}%",))
    cnt_shumoku = cur_pg.fetchone()[0]
    print(f"{kw:15}: Tên có {cnt_name:6,} | Ngành nghề/Mục vụ có {cnt_shumoku:6,}")

print("\n=== THỐNG KÊ TOÀN BỘ CÔNG TY TRONG BẢNG COMPANIES TRÊN VPS ===")
cur_pg.execute("SELECT COUNT(*) FROM companies")
print(f"Tổng số companies trên VPS: {cur_pg.fetchone()[0]:,}")

cur_pg.close()
conn_pg.close()
