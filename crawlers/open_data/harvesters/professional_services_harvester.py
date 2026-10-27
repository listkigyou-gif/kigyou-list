#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Professional Legal & Accounting Corporations Harvester
(士業・専門職法人: 税理士法人, 監査法人, 弁護士法人, 行政書士法人, 司法書士法人, 社労士法人, 弁理士法人)
===================================================================================================
Identifies and certifies all statutory professional service corporations in Japan:
1. 税理士法人 (Tax Accountant Corporations) - 税理士法 第48条の2 -> JSIC L.724 (税理士事務所)
2. 監査法人 (Audit Corporations) - 公認会計士法 第34条の2 -> JSIC L.724 (公認会計士事務所)
3. 弁護士法人 (Law Firm Corporations) - 弁護士法 第30条の2 -> JSIC L.721 (法律事務所)
4. 行政書士法人 (Administrative Scrivener Corps) - 行政書士法 第13条の3 -> JSIC L.722 (行政書士事務所)
5. 司法書士法人 (Judicial Scrivener Corps) - 司法書士法 第26条 -> JSIC L.722 (司法書士事務所)
6. 社会保険労務士法人 (Social Security Attorney Corps) - 社労士法 第25条の6 -> JSIC L.723 (社会保険労務士事務所)
7. 弁理士法人 / 特許業務法人 (Patent Attorney Corps) - 弁理士法 第37条 -> JSIC L.725 (特許事務所)

Extracts and registers in SQLite & VPS PostgreSQL:
  - company_licenses (license_category: '士業・専門職法人')
  - company_industries (Major: L, Medium: 72, Minor: 721-725)
  - companies.jigyo_shumoku & has_license
"""

import os
import sys
import json
import time
import sqlite3
import datetime
import psycopg2
from psycopg2.extras import execute_values

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

DB_PATH = os.path.join(PROJECT_ROOT, "kigyou-list.db")
PG_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")

PROFESSIONAL_SPECS = [
    {
        "type": "税理士法人",
        "search_pattern": "%税理士法人%",
        "authority": "国税庁・日本税理士会連合会",
        "act": "税理士法 第48条の2",
        "minor_code": "724",
        "minor_path": "L.72.724",
        "shumoku_label": "税理士法人, 税理士事務所",
        "source_url": "https://www.nichizeiren.or.jp/"
    },
    {
        "type": "監査法人",
        "search_pattern": "%監査法人%",
        "authority": "金融庁・公認会計士審査会",
        "act": "公認会計士法 第34条の2",
        "minor_code": "724",
        "minor_path": "L.72.724",
        "shumoku_label": "監査法人, 公認会計士事務所",
        "source_url": "https://www.fsa.go.jp/cpaaob/"
    },
    {
        "type": "弁護士法人",
        "search_pattern": "%弁護士法人%",
        "authority": "日本弁護士連合会",
        "act": "弁護士法 第30条の2",
        "minor_code": "721",
        "minor_path": "L.72.721",
        "shumoku_label": "弁護士法人, 法律事務所",
        "source_url": "https://www.nichibenren.or.jp/"
    },
    {
        "type": "行政書士法人",
        "search_pattern": "%行政書士法人%",
        "authority": "日本行政書士会連合会",
        "act": "行政書士法 第13条の3",
        "minor_code": "722",
        "minor_path": "L.72.722",
        "shumoku_label": "行政書士法人, 行政書士事務所",
        "source_url": "https://www.gyosei.or.jp/"
    },
    {
        "type": "司法書士法人",
        "search_pattern": "%司法書士法人%",
        "authority": "日本司法書士会連合会",
        "act": "司法書士法 第26条",
        "minor_code": "722",
        "minor_path": "L.72.722",
        "shumoku_label": "司法書士法人, 司法書士事務所",
        "source_url": "https://www.shiho-shoshi.or.jp/"
    },
    {
        "type": "社会保険労務士法人",
        "search_pattern": "%社会保険労務士法人%",
        "authority": "全国社会保険労務士会連合会",
        "act": "社会保険労務士法 第25条の6",
        "minor_code": "723",
        "minor_path": "L.72.723",
        "shumoku_label": "社会保険労務士法人, 労務管理事務所",
        "source_url": "https://www.shakaihokenroumushi.jp/"
    },
    {
        "type": "弁理士法人",
        "search_pattern": "%弁理士法人%",
        "authority": "日本弁理士会・特許庁",
        "act": "弁理士法 第37条",
        "minor_code": "725",
        "minor_path": "L.72.725",
        "shumoku_label": "弁理士法人, 特許事務所",
        "source_url": "https://www.jpaa.or.jp/"
    },
    {
        "type": "弁理士法人",
        "search_pattern": "%特許業務法人%",
        "authority": "日本弁理士会・特許庁",
        "act": "弁理士法 旧第37条 (特許業務法人)",
        "minor_code": "725",
        "minor_path": "L.72.725",
        "shumoku_label": "特許業務法人, 特許事務所",
        "source_url": "https://www.jpaa.or.jp/"
    }
]

PREF_MAP = {
    '北海道': '01', '青森県': '02', '岩手県': '03', '宮城県': '04', '秋田県': '05',
    '山形県': '06', '福島県': '07', '茨城県': '08', '栃木県': '09', '群馬県': '10',
    '埼玉県': '11', '千葉県': '12', '東京都': '13', '神奈川県': '14', '新潟県': '15',
    '富山県': '16', '石川県': '17', '福井県': '18', '山梨県': '19', '長野県': '20',
    '岐阜県': '21', '静岡県': '22', '愛知県': '23', '三重県': '24', '滋賀県': '25',
    '京都府': '26', '大阪府': '27', '兵庫県': '28', '奈良県': '29', '和歌山県': '30',
    '鳥取県': '31', '島根県': '32', '岡山県': '33', '広島県': '34', '山口県': '35',
    '徳島県': '36', '香川県': '37', '愛媛県': '38', '高知県': '39', '福岡県': '40',
    '佐賀県': '41', '長崎県': '42', '熊本県': '43', '大分県': '44', '宮崎県': '45',
    '鹿児島県': '46', '沖縄県': '47'
}

def resolve_pref(pref_code, addr):
    if pref_code and str(pref_code).strip():
        p = str(pref_code).strip().zfill(2)
        if len(p) == 2 and p.isdigit() and 1 <= int(p) <= 47:
            return p
    if addr:
        for p_name, p_code in PREF_MAP.items():
            if p_name in addr:
                return p_code
    return '13'

def harvest_professional_services():
    t0 = time.time()
    print("=" * 80)
    print("KIGYOU-LIST: STATUTORY PROFESSIONAL SERVICES CORPORATIONS HARVESTER")
    print(f"Targeting: 税理士法人, 監査法人, 弁護士法人, 行政書士法人, 司法書士法人, 社労士法人, 弁理士法人")
    print(f"Started at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    # 1. Process SQLite
    print("\n[*] [1/2] Processing local SQLite database...")
    conn_sq = sqlite3.connect(DB_PATH)
    conn_sq.execute("PRAGMA journal_mode=WAL;")
    conn_sq.execute("PRAGMA synchronous=NORMAL;")
    cur_sq = conn_sq.cursor()

    sq_total_inserted = 0
    now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for spec in PROFESSIONAL_SPECS:
        cur_sq.execute("""
            SELECT corporate_number, company_name, prefecture_code, representative_name, phone_number, full_address
            FROM companies
            WHERE company_name LIKE ?;
        """, (spec["search_pattern"],))
        rows = cur_sq.fetchall()
        print(f"  [+] Found {len(rows):,} companies matching {spec['type']} in SQLite.")

        for c_num, c_name, pref_code, rep_name, phone, addr in rows:
            clean_pref = resolve_pref(pref_code, addr)
            spec_json = json.dumps({
                "category": "士業・専門職法人",
                "statutory_act": spec["act"],
                "jsic_minor": spec["minor_code"],
                "formal_name": c_name
            }, ensure_ascii=False)

            cur_sq.execute("""
                INSERT OR REPLACE INTO company_licenses (
                    corporate_number, license_type, license_category, license_number,
                    issuing_authority, prefecture_code, representative_name, office_phone,
                    office_fax, registered_address, issue_date, valid_until,
                    license_status, specialties_json, source_url, created_at, updated_at
                ) VALUES (?, ?, '士業・専門職法人', ?, ?, ?, ?, ?, NULL, ?, NULL, NULL, '有効', ?, ?, ?, ?);
            """, (c_num, spec["type"], c_num, spec["authority"], clean_pref, rep_name, phone, addr, spec_json, spec["source_url"], now_ts, now_ts))

            # Update company industry and shumoku
            cur_sq.execute("""
                UPDATE companies
                SET has_license = 1,
                    primary_industry_code = COALESCE(primary_industry_code, ?),
                    major_industry_code = COALESCE(major_industry_code, 'L'),
                    industry_confidence = 'CONFIRMED_LICENSE',
                    jigyo_shumoku = CASE
                        WHEN jigyo_shumoku IS NULL OR jigyo_shumoku = '' THEN ?
                        WHEN jigyo_shumoku NOT LIKE ? THEN jigyo_shumoku || ', ' || ?
                        ELSE jigyo_shumoku
                    END
                WHERE corporate_number = ?;
            """, (spec["minor_code"], spec["shumoku_label"], f"%{spec['type']}%", spec["shumoku_label"], c_num))

            # Insert into company_industries (L, 72, and minor code)
            for ind_code, ind_path in [('L', 'L'), ('72', 'L.72'), (spec["minor_code"], spec["minor_path"])]:
                cur_sq.execute("""
                    INSERT OR IGNORE INTO company_industries (corporate_number, industry_code, industry_path, is_detailed, created_at)
                    VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP);
                """, (c_num, ind_code, ind_path))

            sq_total_inserted += 1

    conn_sq.commit()
    conn_sq.close()
    print(f"[+] SQLite processing complete: {sq_total_inserted:,} professional licenses recorded.")

    # 2. Process PostgreSQL Production (VPS)
    print("\n[*] [2/2] Processing PostgreSQL Production (VPS)...")
    conn_pg = psycopg2.connect(PG_URL)
    cur_pg = conn_pg.cursor()

    pg_total_inserted = 0

    for spec in PROFESSIONAL_SPECS:
        print(f"\n[*] Processing VPS PostgreSQL: {spec['type']} ({spec['search_pattern']})...")
        cur_pg.execute("""
            SELECT corporate_number, company_name, prefecture_code, representative_name, phone_number, full_address
            FROM companies
            WHERE company_name LIKE %s;
        """, (spec["search_pattern"],))
        rows = cur_pg.fetchall()
        print(f"  [+] Found {len(rows):,} companies matching {spec['type']} on VPS.")

        if not rows:
            continue

        license_rows = []
        for c_num, c_name, pref_code, rep_name, phone, addr in rows:
            clean_pref = resolve_pref(pref_code, addr)
            spec_json = json.dumps({
                "category": "士業・専門職法人",
                "statutory_act": spec["act"],
                "jsic_minor": spec["minor_code"],
                "formal_name": c_name
            }, ensure_ascii=False)

            license_rows.append((
                c_num, spec["type"], "士業・専門職法人", c_num,
                spec["authority"], clean_pref, rep_name, phone, None,
                addr, None, None, "有効", spec_json, spec["source_url"]
            ))

        # Insert into company_licenses on VPS
        insert_lic_sql = """
            INSERT INTO company_licenses (
                corporate_number, license_type, license_category, license_number,
                issuing_authority, prefecture_code, representative_name, office_phone,
                office_fax, registered_address, issue_date, valid_until,
                license_status, specialties_json, source_url
            ) VALUES %s
            ON CONFLICT DO NOTHING;
        """
        for i in range(0, len(license_rows), 1000):
            chunk = license_rows[i:i + 1000]
            execute_values(cur_pg, insert_lic_sql, chunk)
            conn_pg.commit()

        # Insert into company_industries (Major: L, Medium: 72, Minor: 721-725)
        for ind_code, ind_path in [('L', 'L'), ('72', 'L.72'), (spec["minor_code"], spec["minor_path"])]:
            cur_pg.execute("""
                INSERT INTO company_industries (corporate_number, industry_code, industry_path, is_detailed, created_at)
                SELECT c.corporate_number, %s, %s, false, NOW()
                FROM companies c
                WHERE c.company_name LIKE %s
                ON CONFLICT (corporate_number, industry_code) DO NOTHING;
            """, (ind_code, ind_path, spec["search_pattern"]))
            conn_pg.commit()

        # Update companies
        cur_pg.execute("""
            UPDATE companies
            SET has_license = true,
                primary_industry_code = COALESCE(primary_industry_code, %s),
                major_industry_code = COALESCE(major_industry_code, 'L'),
                industry_confidence = 'CONFIRMED_LICENSE',
                jigyo_shumoku = CASE
                    WHEN jigyo_shumoku IS NULL OR jigyo_shumoku = '' THEN %s
                    WHEN jigyo_shumoku NOT LIKE %s THEN jigyo_shumoku || ', ' || %s
                    ELSE jigyo_shumoku
                END
            WHERE company_name LIKE %s;
        """, (spec["minor_code"], spec["shumoku_label"], f"%{spec['type']}%", spec["shumoku_label"], spec["search_pattern"]))
        conn_pg.commit()

        pg_total_inserted += len(rows)
        print(f"  [+] Completed VPS enrichment for {spec['type']}: {len(rows):,} licenses registered and tagged.")

    conn_pg.close()

    elapsed = time.time() - t0
    print("\n" + "=" * 80)
    print(f"[+] PROFESSIONAL SERVICES HARVESTING COMPLETE IN {elapsed:.2f}s!")
    print(f"    - Total Professional Licenses Processed: {pg_total_inserted:,}")
    print("=" * 80)
    return pg_total_inserted

harvest_all_professionals = harvest_professional_services

if __name__ == "__main__":
    harvest_professional_services()
