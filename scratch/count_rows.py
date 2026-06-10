import os
import csv
import sys

YAHOO_DATA_DIR = r"c:\TUHOCLAPTRINH\kigyou-list\crawlers\yahoo\data"

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    basic_csv = os.path.join(YAHOO_DATA_DIR, "companies_basic.csv")
    
    lines_count = sum(1 for _ in open(basic_csv, encoding='utf-8-sig'))
    print("Basic line count:", lines_count)
    
    csv_rows_count = 0
    with open(basic_csv, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            csv_rows_count += 1
            
    print("CSV reader rows count:", csv_rows_count)

if __name__ == '__main__':
    main()
