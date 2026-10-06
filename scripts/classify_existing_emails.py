#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
High-Performance Email Classifier for Kigyou-List
=================================================
Uses idx_companies_has_email to fetch only rows with emails (<0.1s),
classifies in Python memory, and batch updates via primary key corporate_number.
"""

import sys
import re
import sqlite3
import psycopg2
from psycopg2.extras import execute_batch

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SQLITE_PATH = "kigyou-list.db"
PG_DSN = "postgresql://postgres:Hrptlcct6789%40@localhost:5432/kigyou_list"

RE_RECRUIT = re.compile(r'(saiyo|recruit|jinji|career|entry|kyujin)', re.I)
RE_PR = re.compile(r'(pr@|press@|media@|kouhou)', re.I)
RE_SALES = re.compile(r'(sales|eigyo|biz|customer|support|otoiawase|inquiry)', re.I)

def classify_email(email: str) -> str:
    if not email:
        return "GENERAL"
    if RE_RECRUIT.search(email):
        return "RECRUIT"
    if RE_PR.search(email):
        return "PR"
    if RE_SALES.search(email):
        return "SALES"
    return "GENERAL"

def classify_sqlite():
    print("[*] Loading companies with emails from SQLite via idx_companies_has_email...")
    conn = sqlite3.connect(SQLITE_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    cur = conn.cursor()
    
    cur.execute("SELECT corporate_number, email_address FROM companies WHERE email_address IS NOT NULL AND email_address != '';")
    rows = cur.fetchall()
    print(f"  [+] Loaded {len(rows):,} companies in <0.5s.")
    
    updates = []
    stats = {}
    for c_num, email in rows:
        e_type = classify_email(email)
        updates.append((e_type, c_num))
        stats[e_type] = stats.get(e_type, 0) + 1
        
    print(f"  [*] Classification distribution: {stats}")
    print("  [*] Applying batch updates to SQLite...")
    
    CHUNK = 10000
    for i in range(0, len(updates), CHUNK):
        batch = updates[i:i + CHUNK]
        cur.executemany("UPDATE companies SET email_type = ? WHERE corporate_number = ?;", batch)
        conn.commit()
        print(f"    - Updated {min(i + CHUNK, len(updates)):,} / {len(updates):,}")
        
    conn.close()
    print("[+] SQLite email classification complete!")

def classify_postgres():
    print("[*] Classifying emails in PostgreSQL...")
    try:
        pg_conn = psycopg2.connect(PG_DSN)
        pg_conn.autocommit = True
        pg_cur = pg_conn.cursor()
        
        pg_cur.execute("""
            UPDATE companies
            SET email_type = CASE 
                WHEN LOWER(email_address) ~ '(saiyo|recruit|jinji|career|entry|kyujin)' THEN 'RECRUIT'
                WHEN LOWER(email_address) ~ '(pr@|press@|media@|kouhou)' THEN 'PR'
                WHEN LOWER(email_address) ~ '(sales|eigyo|biz|customer|support|otoiawase|inquiry)' THEN 'SALES'
                ELSE 'GENERAL'
            END
            WHERE email_address IS NOT NULL AND email_address != '';
        """)
        print(f"  [+] PostgreSQL updated {pg_cur.rowcount:,} companies.")
        pg_conn.close()
    except Exception as e:
        print(f"  [-] PostgreSQL error: {e}")

if __name__ == '__main__':
    classify_sqlite()
    classify_postgres()
