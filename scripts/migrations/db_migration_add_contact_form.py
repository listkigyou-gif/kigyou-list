#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Database Migration: Add contact_form_url and email_type
======================================================
Applies to both SQLite (kigyou-list.db) and PostgreSQL.
"""

import sys
import sqlite3
import psycopg2

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SQLITE_PATH = "kigyou-list.db"
PG_DSN = "postgresql://postgres:Hrptlcct6789%40@localhost:5432/kigyou_list"

def migrate_sqlite():
    print("[*] Migrating SQLite database...")
    conn = sqlite3.connect(SQLITE_PATH, timeout=30.0)
    cursor = conn.cursor()
    
    # 1. companies table
    cursor.execute("PRAGMA table_info(companies)")
    cols = [r[1] for r in cursor.fetchall()]
    if "contact_form_url" not in cols:
        cursor.execute("ALTER TABLE companies ADD COLUMN contact_form_url TEXT;")
        print("  [+] Added contact_form_url to SQLite companies table")
    else:
        print("  [-] contact_form_url already exists in SQLite companies")
        
    if "email_type" not in cols:
        cursor.execute("ALTER TABLE companies ADD COLUMN email_type TEXT;")
        print("  [+] Added email_type to SQLite companies table")
    else:
        print("  [-] email_type already exists in SQLite companies")

    # 2. raw_website table
    cursor.execute("PRAGMA table_info(raw_website)")
    raw_cols = [r[1] for r in cursor.fetchall()]
    if "contact_form_url" not in raw_cols:
        cursor.execute("ALTER TABLE raw_website ADD COLUMN contact_form_url TEXT;")
        print("  [+] Added contact_form_url to SQLite raw_website table")
    else:
        print("  [-] contact_form_url already exists in SQLite raw_website")

    conn.commit()
    conn.close()
    print("[+] SQLite migration completed.")

def migrate_postgres():
    print("[*] Migrating PostgreSQL database...")
    try:
        conn = psycopg2.connect(PG_DSN)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check companies table
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='companies' AND column_name='contact_form_url'")
        if not cur.fetchall():
            cur.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_form_url TEXT;")
            print("  [+] Added contact_form_url to Postgres companies table (and partitions)")
        else:
            print("  [-] contact_form_url already exists in Postgres companies")

        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='companies' AND column_name='email_type'")
        if not cur.fetchall():
            cur.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_type TEXT;")
            print("  [+] Added email_type to Postgres companies table (and partitions)")
        else:
            print("  [-] email_type already exists in Postgres companies")

        conn.close()
        print("[+] PostgreSQL migration completed.")
    except Exception as e:
        print(f"[-] PostgreSQL migration error: {e}")

if __name__ == '__main__':
    migrate_sqlite()
    migrate_postgres()
