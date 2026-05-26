#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: PostgreSQL Database Setup and Schema Initialization Helper
=======================================================================
All output is in plain English to avoid UnicodeEncodeErrors on Windows CP1252 consoles.
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")
TARGET_DB = "kigyou-list"
SQL_FILE_PATH = r"database/init_schema.sql"

def setup_database():
    print("="*60)
    print("      KIGYOU-LIST: POSTGRESQL DB SETUP & INITIALIZATION")
    print("="*60)

    # Step 1: Connect to default 'postgres' database
    print(f"[*] Connecting to PostgreSQL server ({DB_HOST}:{DB_PORT}) as user '{DB_USER}'...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
    except Exception as e:
        print(f"[-] Could not connect to PostgreSQL server: {e}")
        print("[!] Please verify PostgreSQL is running at localhost:5432 and the password is correct.")
        print("    You can configure the password by setting env variable: $env:DB_PASS=\"your_password\"")
        sys.exit(1)

    # Step 2: Create 'kigyou-list' database if not exists
    print(f"[*] Checking if database '{TARGET_DB}' exists...")
    try:
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{TARGET_DB}';")
        exists = cursor.fetchone()
        if not exists:
            print(f"[+] Creating database '{TARGET_DB}'...")
            cursor.execute(f'CREATE DATABASE "{TARGET_DB}";')
            print(f"[+] Database '{TARGET_DB}' created successfully!")
        else:
            print(f"[~] Database '{TARGET_DB}' already exists.")
    except Exception as e:
        print(f"[-] Error checking or creating database: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

    # Step 3: Connect to 'kigyou-list' database and run schema SQL
    print(f"\n[*] Connecting to database '{TARGET_DB}'...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            database=TARGET_DB
        )
        cursor = conn.cursor()
    except Exception as e:
        print(f"[-] Error connecting to database '{TARGET_DB}': {e}")
        sys.exit(1)

    print(f"[*] Reading SQL schema from file: {SQL_FILE_PATH}...")
    if not os.path.exists(SQL_FILE_PATH):
        print(f"[-] SQL schema file not found at: {SQL_FILE_PATH}")
        sys.exit(1)

    with open(SQL_FILE_PATH, "r", encoding="utf-8") as f:
        sql_script = f.read()

    print("[*] Executing SQL script to initialize tables, indexes, and triggers...")
    try:
        cursor.execute(sql_script)
        conn.commit()
        print("[+] SUCCESS! Tables, comments, indexes, and triggers initialized.")
    except Exception as e:
        conn.rollback()
        print(f"[-] Error executing SQL schema: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    setup_database()
