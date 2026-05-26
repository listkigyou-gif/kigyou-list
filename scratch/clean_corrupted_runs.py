import os
import csv
import sqlite3

data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crawlers", "yahoo", "data"))
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "kigyou-list.db"))

print(f"Data directory: {data_dir}")
print(f"Database path: {db_path}")

deleted_corp_nums = set()

# Helper to check if a row is empty/blank
def is_blank(row):
    # If phone, website, y_address, and gid are all empty
    return (not row.get("phone", "").strip() and 
            not row.get("website", "").strip() and 
            not row.get("y_address", "").strip() and 
            not row.get("gid", "").strip())

# 1. Clean نتائج kết quả kết results_*.csv and companies_basic.csv
csv_files = []
if os.path.exists(data_dir):
    for f in os.listdir(data_dir):
        if f.endswith(".csv") and (f.startswith("results_") or f == "companies_basic.csv"):
            csv_files.append(os.path.join(data_dir, f))

print(f"Found {len(csv_files)} CSV files to inspect.")

for csv_file in csv_files:
    if not os.path.exists(csv_file):
        continue
    
    rows_to_keep = []
    file_deleted_count = 0
    
    try:
        with open(csv_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            for row in reader:
                if is_blank(row):
                    deleted_corp_nums.add(row.get("corp_num", ""))
                    file_deleted_count += 1
                else:
                    rows_to_keep.append(row)
        
        # If we deleted any rows, overwrite the file
        if file_deleted_count > 0:
            print(f"Cleaning {os.path.basename(csv_file)}: removed {file_deleted_count} blank rows.")
            with open(csv_file, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows_to_keep)
    except Exception as e:
        print(f"Error processing {csv_file}: {e}")

print(f"Total unique corporate numbers to reset: {len(deleted_corp_nums)}")

# 2. Reset database
if deleted_corp_nums and os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path, timeout=60.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        cur = conn.cursor()
        
        # Convert set to list for database queries
        corp_nums_list = list(deleted_corp_nums)
        
        # Delete from raw_yahoo
        print("Deleting blank staging records from raw_yahoo...")
        # Since the list can be large, we chunk the delete queries
        chunk_size = 900
        raw_deleted_total = 0
        for i in range(0, len(corp_nums_list), chunk_size):
            chunk = corp_nums_list[i : i + chunk_size]
            placeholders = ",".join(["?"] * len(chunk))
            # Delete only if they are indeed empty
            cur.execute(f"""
                DELETE FROM raw_yahoo 
                WHERE corporate_number IN ({placeholders})
                  AND (phone_number IS NULL OR phone_number = '')
                  AND (website_url IS NULL OR website_url = '')
                  AND (yahoo_address IS NULL OR yahoo_address = '')
            """, chunk)
            raw_deleted_total += cur.rowcount
        
        print(f"Deleted {raw_deleted_total} records from raw_yahoo table.")
        
        # Reset yahoo_last_crawled_at in companies
        print("Resetting yahoo_last_crawled_at in companies table...")
        companies_reset_total = 0
        for i in range(0, len(corp_nums_list), chunk_size):
            chunk = corp_nums_list[i : i + chunk_size]
            placeholders = ",".join(["?"] * len(chunk))
            cur.execute(f"""
                UPDATE companies 
                SET yahoo_last_crawled_at = NULL 
                WHERE corporate_number IN ({placeholders})
            """, chunk)
            companies_reset_total += cur.rowcount
            
        conn.commit()
        conn.close()
        print(f"Reset {companies_reset_total} companies in database successfully.")
        
    except Exception as e:
        print(f"Database error: {e}")
else:
    print("No database updates needed or database file missing.")

print("Clean-up operation completed.")
