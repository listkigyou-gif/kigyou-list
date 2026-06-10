import os
import csv
import sys

YAHOO_DATA_DIR = r"c:\TUHOCLAPTRINH\kigyou-list\crawlers\yahoo\data"

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    basic_csv = os.path.join(YAHOO_DATA_DIR, "companies_basic.csv")
    print("Reading", basic_csv)
    
    try:
        with open(basic_csv, "r", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for idx, row in enumerate(reader):
                try:
                    # just access fields to trigger any lazy parsing errors
                    if len(row) >= 12:
                        phone = row[10]
                        web = row[11]
                except Exception as row_err:
                    print(f"Error at line {idx+2}: {row_err}")
                    return
        print(f"Read complete. Total rows parsed successfully: {idx+1}")
    except Exception as e:
        print(f"General error: {e}")

if __name__ == '__main__':
    main()
