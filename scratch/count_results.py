import os
import glob
import csv

data_dir = r"c:\TUHOCLAPTRINH\kigyou-list\crawlers\yahoo\data"
csv_files = glob.glob(os.path.join(data_dir, "results_*.csv"))

total_records = 0
total_phones = 0
total_websites = 0

for file_path in csv_files:
    try:
        with open(file_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_records += 1
                if row.get("phone") and row.get("phone").strip():
                    total_phones += 1
                if row.get("website") and row.get("website").strip():
                    total_websites += 1
    except Exception as e:
        pass

print(f"Total: {total_records}")
print(f"Phones: {total_phones}")
print(f"Websites: {total_websites}")
