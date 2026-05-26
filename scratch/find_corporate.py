import sqlite3
import json
import sys

def search():
    conn = sqlite3.connect("kigyou-list.db")
    cursor = conn.cursor()
    
    corp_num = "1010001000039"
    
    tables = [
        "companies",
        "company_industries",
        "business_signals",
        "raw_yahoo",
        "raw_website",
        "company_financials",
        "raw_hellowork",
        "financial_records"
    ]
    
    output = []
    
    for t in tables:
        output.append(f"--- Searching in table: {t} ---")
        try:
            cursor.execute(f"PRAGMA table_info({t})")
            cols = [col[1] for col in cursor.fetchall()]
            
            if "corporate_number" in cols:
                cursor.execute(f"SELECT * FROM {t} WHERE corporate_number = ?", (corp_num,))
                rows = cursor.fetchall()
                output.append(f"Found {len(rows)} row(s)")
                for row in rows:
                    for c, val in zip(cols, row):
                        if val is not None and len(str(val)) > 0:
                            val_str = str(val)
                            output.append(f"  {c}: {val_str}")
            else:
                output.append("  No corporate_number column in this table")
        except Exception as e:
            output.append(f"  Error: {e}")
            
    conn.close()
    
    with open("scratch/search_results.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(output))

if __name__ == "__main__":
    search()
