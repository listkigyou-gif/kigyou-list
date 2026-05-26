import sqlite3
import json

def fetch_companies():
    conn = sqlite3.connect("kigyou-list.db")
    cursor = conn.cursor()
    
    # Select 5 companies with raw data from raw_hellowork or raw_website
    cursor.execute("""
        SELECT DISTINCT c.corporate_number, c.company_name, c.business_summary, c.website_url 
        FROM companies c
        LEFT JOIN raw_hellowork hw ON c.corporate_number = hw.corporate_number
        LEFT JOIN raw_website rw ON c.corporate_number = rw.corporate_number
        WHERE (c.jigyo_shumoku IS NULL OR c.jigyo_shumoku = '' OR c.jigyo_shumoku = '未分類')
          AND (hw.corporate_number IS NOT NULL OR rw.corporate_number IS NOT NULL)
        LIMIT 5;
    """)
    companies = cursor.fetchall()
    
    results = []
    for corp_num, name, summary, url in companies:
        # Get raw hellowork data
        cursor.execute("SELECT industry, job_description FROM raw_hellowork WHERE corporate_number = ? LIMIT 2;", (corp_num,))
        hw_rows = cursor.fetchall()
        hw_info = [{"industry": r[0], "job_description": r[1]} for r in hw_rows]
        
        # Get raw website summary
        cursor.execute("SELECT business_summary FROM raw_website WHERE corporate_number = ? LIMIT 2;", (corp_num,))
        web_rows = cursor.fetchall()
        web_info = [r[0] for r in web_rows if r[0]]
        
        # Get business signals
        cursor.execute("SELECT signal_type, signal_title FROM business_signals WHERE corporate_number = ? LIMIT 3;", (corp_num,))
        signal_rows = cursor.fetchall()
        signals = [{"type": r[0], "title": r[1]} for r in signal_rows]
        
        results.append({
            "corporate_number": corp_num,
            "company_name": name,
            "business_summary": summary,
            "website_url": url,
            "hellowork": hw_info,
            "website_raw": web_info,
            "signals": signals
        })
        
    conn.close()
    
    # Save to JSON file
    with open("scratch/demo_output.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Done! Saved to scratch/demo_output.json")

if __name__ == '__main__':
    fetch_companies()
