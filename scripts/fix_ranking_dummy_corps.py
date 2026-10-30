# -*- coding: utf-8 -*-
"""
Fixes dummy corporate numbers in corporate_rankings table
and updates companies table with salary data for both VPS and SQLite.
"""

import os
import sys
import sqlite3
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB_PATH = os.path.join(PROJECT_ROOT, 'kigyou-list.db')
sys.path.insert(0, PROJECT_ROOT)
from crawlers.nta.sync_nta_invoices_to_vps import PG_URL

FIXES = [
    {
        "rank": 1,
        "name": "M&Aキャピタルパートナーズ株式会社",
        "corporate_number": "3010001107385",
        "salary_man": 2478,
        "prefecture_code": "13",
        "prefecture_name": "東京都"
    },
    {
        "rank": 7,
        "name": "伊藤忠商事株式会社",
        "corporate_number": "7120001077358",
        "salary_man": 1730,
        "prefecture_code": "27",
        "prefecture_name": "大阪府"
    },
    {
        "rank": 14,
        "name": "株式会社TBSホールディングス",
        "corporate_number": "5010401020855",
        "salary_man": 1449,
        "prefecture_code": "13",
        "prefecture_name": "東京都"
    },
    {
        "rank": 24,
        "name": "武田薬品工業株式会社",
        "corporate_number": "2120001077461",
        "salary_man": 1105,
        "prefecture_code": "27",
        "prefecture_name": "大阪府"
    },
    {
        "rank": 45,
        "name": "株式会社NTTデータグループ",
        "corporate_number": "9010601021385",
        "salary_man": 860,
        "prefecture_code": "13",
        "prefecture_name": "東京都"
    },
    {
        "rank": 46,
        "name": "KDDI株式会社",
        "corporate_number": "9011101031552",
        "salary_man": 955,
        "prefecture_code": "13",
        "prefecture_name": "東京都"
    },
    {
        "rank": 48,
        "name": "日本電信電話株式会社",
        "corporate_number": "7010001065142",
        "salary_man": 930,
        "prefecture_code": "13",
        "prefecture_name": "東京都"
    }
]

def main():
    print("[*] Connecting to VPS PostgreSQL...")
    pg_conn = psycopg2.connect(PG_URL, connect_timeout=15)
    cur_pg = pg_conn.cursor()

    print(f"[*] Connecting to SQLite Local: {DB_PATH}...")
    sq_conn = sqlite3.connect(DB_PATH)
    cur_sq = sq_conn.cursor()

    for item in FIXES:
        rank = item["rank"]
        name = item["name"]
        corp_num = item["corporate_number"]
        salary = item["salary_man"]
        pref = item["prefecture_code"]
        pref_name = item["prefecture_name"]
        part_name = f"companies_p{pref}"

        print(f"\n[*] Fixing Rank {rank:02d}: {name} -> {corp_num} ({pref_name})")

        # 1. Update corporate_rankings on VPS
        cur_pg.execute("""
            UPDATE corporate_rankings
            SET corporate_number = %s,
                prefecture_code = %s,
                prefecture_name = %s
            WHERE ranking_type = 'salary' AND rank_position = %s;
        """, (corp_num, pref, pref_name, rank))

        # 2. Update company on VPS
        cur_pg.execute(f"""
            UPDATE {part_name}
            SET avg_annual_salary = %s,
                has_salary_data = true
            WHERE corporate_number = %s;
        """, (salary, corp_num))

        # 3. Update corporate_rankings on SQLite
        cur_sq.execute("""
            UPDATE corporate_rankings
            SET corporate_number = ?,
                prefecture_code = ?,
                prefecture_name = ?
            WHERE ranking_type = 'salary' AND rank_position = ?;
        """, (corp_num, pref, pref_name, rank))

        # 4. Update company on SQLite
        cur_sq.execute("""
            UPDATE companies
            SET avg_annual_salary = ?,
                has_salary_data = 1
            WHERE corporate_number = ?;
        """, (salary, corp_num))

        print(f"    [+] Updated Rank {rank:02d} to {corp_num} in VPS & SQLite successfully.")

    pg_conn.commit()
    sq_conn.commit()

    cur_pg.close()
    pg_conn.close()
    cur_sq.close()
    sq_conn.close()

    print("\n[✓] ALL DUMMY CORPORATE NUMBERS HAVE BEEN PERMANENTLY REPLACED WITH REAL NTA NUMBERS!")

if __name__ == '__main__':
    main()

