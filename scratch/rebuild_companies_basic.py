import sqlite3
import csv
import os
import sys

# Prevent CP1252 Windows encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

db_path = "kigyou-list.db"
out_path = r"c:\TUHOCLAPTRINH\kigyou-list\crawlers\yahoo\data\companies_basic.csv"
tmp_path = out_path + ".rebuild.tmp"

print("[*] Connecting to SQLite database...")
conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("[*] Querying database to rebuild companies_basic.csv...")
cur.execute("""
    SELECT 
        c.corporate_number,
        c.company_name,
        c.full_address,
        c.prefecture_name,
        c.city_name,
        r.yahoo_name,
        r.yahoo_address,
        r.phone_number,
        r.website_url
    FROM companies c
    JOIN raw_yahoo r ON c.corporate_number = r.corporate_number
    WHERE c.yahoo_last_crawled_at IS NOT NULL;
""")

out_fields = [
    "corp_num", "name", "address", "prefecture", "city", 
    "corp_type", "corp_type_name", "gid", "y_name", "y_address", 
    "phone", "website"
]

print("[*] Writing to temporary file...")
count = 0
with open(tmp_path, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=out_fields)
    writer.writeheader()
    
    while True:
        rows = cur.fetchmany(50000)
        if not rows:
            break
            
        for row in rows:
            corp_num, name, address, pref, city, y_name, y_address, phone, website = row
            
            # Deduce corp_type and corp_type_name
            corp_type = "301"
            corp_type_name = "株式会社"
            if name:
                if "有限会社" in name:
                    corp_type = "302"
                    corp_type_name = "有限会社"
                elif "合同会社" in name:
                    corp_type = "305"
                    corp_type_name = "合同会社"
            
            writer.writerow({
                "corp_num": corp_num or "",
                "name": name or "",
                "address": address or "",
                "prefecture": pref or "",
                "city": city or "",
                "corp_type": corp_type,
                "corp_type_name": corp_type_name,
                "gid": "",  # GID is empty as we don't store it in SQLite
                "y_name": y_name or "",
                "y_address": y_address or "",
                "phone": phone or "",
                "website": website or ""
            })
            count += 1

conn.close()
print(f"[+] Rebuilt {count:,} records.")

print("[*] Performing atomic replacement...")
for attempt in range(5):
    try:
        import time
        if os.path.exists(out_path):
            os.replace(tmp_path, out_path)
        else:
            os.rename(tmp_path, out_path)
        print("[+] Rebuild completed successfully! File replaced.")
        break
    except PermissionError as e:
        print(f"[!] PermissionError on attempt {attempt+1}: {e}")
        if attempt < 4:
            time.sleep(1.0)
        else:
            raise
