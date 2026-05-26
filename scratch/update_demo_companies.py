import sqlite3
import sys

# Force sys.stdout to write UTF-8 to prevent UnicodeEncodeErrors on Windows CMD
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def update_companies():
    conn = sqlite3.connect("kigyou-list.db")
    cursor = conn.cursor()
    
    # Classifications mapping: corporate_number -> (list of codes, list of tags)
    updates = {
        "2122001000460": (["54", "53"], "機械器具卸売業, 建築材料，鉱物・金属材料等卸売業"),
        "2140001057759": (["25"], "はん用機械器具製造業"),
        "3260001026800": (["73"], "広告業"),
        "4021001024916": (["06", "07"], "総合工事業, 職別工事業"),
        "4122001015077": (["05"], "鉱業，採石業，砂利採取業")
    }
    
    print("Updating database...")
    for corp_num, (codes, tag_str) in updates.items():
        # 1. Update companies table
        cursor.execute("""
            UPDATE companies 
            SET jigyo_shumoku = ?,
                last_deep_tagged_at = datetime('now', 'localtime'),
                updated_at = CURRENT_TIMESTAMP
            WHERE corporate_number = ?;
        """, (tag_str, corp_num))
        
        # 2. Insert into company_industries
        for code in codes:
            cursor.execute("""
                INSERT OR IGNORE INTO company_industries (corporate_number, industry_code)
                VALUES (?, ?);
            """, (corp_num, code))
            
        print(f"[+] Updated {corp_num} -> successfully")
        
    conn.commit()
    
    # Verify update and output to file to avoid stdout crashes
    print("\nVerification:")
    cursor.execute("""
        SELECT corporate_number, company_name, jigyo_shumoku 
        FROM companies 
        WHERE corporate_number IN ('2122001000460', '2140001057759', '3260001026800', '4021001024916', '4122001015077');
    """)
    rows = cursor.fetchall()
    
    results = []
    for row in rows:
        results.append({
            "corporate_number": row[0],
            "company_name": row[1],
            "jigyo_shumoku": row[2]
        })
        
    import json
    with open("scratch/update_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print("Done! Verification results written to scratch/update_results.json")
    conn.close()

if __name__ == '__main__':
    update_companies()
