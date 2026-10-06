#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Create raw_prtimes table in SQLite kigyou-list.db
"""

import sqlite3

DB_PATH = "kigyou-list.db"

def init_raw_prtimes():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS raw_prtimes (
            url TEXT PRIMARY KEY,
            category TEXT,
            title TEXT,
            status TEXT DEFAULT 'pending',
            company_name TEXT,
            corporate_number TEXT,
            website_url TEXT,
            email_address TEXT,
            contact_form_url TEXT,
            phone_number TEXT,
            representative_name TEXT,
            address TEXT,
            prefecture TEXT,
            published_at TEXT,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            crawled_at DATETIME
        );
    """)
    
    cur.execute("CREATE INDEX IF NOT EXISTS idx_raw_prtimes_status ON raw_prtimes(status);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_raw_prtimes_company ON raw_prtimes(company_name);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_raw_prtimes_corp_num ON raw_prtimes(corporate_number);")
    
    conn.commit()
    conn.close()
    print("[+] Table raw_prtimes initialized successfully with indexes.")

if __name__ == '__main__':
    init_raw_prtimes()
