import csv
import os

basic_csv = r"c:\TUHOCLAPTRINH\kigyou-list\crawlers\yahoo\data\companies_basic.csv"
if os.path.exists(basic_csv):
    print("CSV exists.")
    print("Size:", os.path.getsize(basic_csv))
    with open(basic_csv, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        print("Header:", header)
        line_count = 0
        valid_len_count = 0
        for row in reader:
            line_count += 1
            if len(row) >= 12:
                valid_len_count += 1
        print("Total lines (excluding header):", line_count)
        print("Lines with len >= 12:", valid_len_count)
else:
    print("CSV does not exist.")
