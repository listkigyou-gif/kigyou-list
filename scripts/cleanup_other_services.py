#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: One-off JSIC fallback redundancy cleanup script.
Removes codes '95', '99', and 'T' from company_industries if there is another
specific category, and rebuilds jigyo_shumoku accordingly.
"""

import sqlite3
import sys

# Reconfigure stdout to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = "kigyou-list.db"

def main():
    print("="*60)
    print("      KIGYOU-LIST: JSIC FALLBACK REDUNDANCY CLEANUP")
    print("="*60)
    
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        cursor = conn.cursor()
        
        # 1. Delete fallback industry mappings ('95', '99', 'T') where the company has specific mappings
        print("[*] Deleting redundant JSIC fallback (95, 99, T) mappings...")
        cursor.execute("""
            DELETE FROM company_industries 
            WHERE industry_code IN ('95', '99', 'T')
              AND corporate_number IN (
                  SELECT corporate_number 
                  FROM company_industries 
                  WHERE industry_code NOT IN ('95', '99', 'T')
              );
        """)
        deleted_mappings = cursor.rowcount
        print(f"[+] Deleted {deleted_mappings} redundant mappings in company_industries.")
        
        # 2. Identify companies that have specific industry mappings but still have fallback terms in jigyo_shumoku
        print("[*] Finding companies with specific industries and redundant jigyo_shumoku tags...")
        cursor.execute("""
            SELECT DISTINCT c.corporate_number
            FROM companies c
            JOIN company_industries ci ON c.corporate_number = ci.corporate_number
            WHERE ci.industry_code NOT IN ('95', '99', 'T')
              AND (c.jigyo_shumoku LIKE '%その他のサービス業%' 
                   OR c.jigyo_shumoku LIKE '%その他サービス%'
                   OR c.jigyo_shumoku LIKE '%分類不能%');
        """)
        corp_nums = [row[0] for row in cursor.fetchall()]
        total_companies = len(corp_nums)
        print(f"[+] Found {total_companies} companies needing jigyo_shumoku cleanup.")
        
        # 3. Clean up jigyo_shumoku for each identified company
        updated_companies = 0
        for idx, corp_num in enumerate(corp_nums, 1):
            # Get all current industry names for the company from DB
            cursor.execute("""
                SELECT DISTINCT m.industry_name
                FROM company_industries ci
                JOIN m_industries m ON ci.industry_code = m.industry_code
                WHERE ci.corporate_number = ?
            """, (corp_num,))
            names = [row[0] for row in cursor.fetchall() if row[0]]
            
            if names:
                final_shumoku = ", ".join(names)
            else:
                final_shumoku = "その他のサービス業"
                
            cursor.execute("""
                UPDATE companies
                SET jigyo_shumoku = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE corporate_number = ?;
            """, (final_shumoku, corp_num))
            updated_companies += 1
            
            if idx % 1000 == 0 or idx == total_companies:
                conn.commit()
                print(f"  -> Cleaned {idx}/{total_companies} companies...")
                
        conn.commit()
        print(f"[+] Successfully updated jigyo_shumoku for {updated_companies} companies.")
        
    except Exception as e:
        print(f"[-] Error performing database cleanup: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()
            print("[*] Database connection closed.")
            
if __name__ == "__main__":
    main()
