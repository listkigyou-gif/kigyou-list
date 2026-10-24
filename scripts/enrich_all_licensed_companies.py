#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Automated Comprehensive License-to-Industry Auto-Tagger
===================================================================
Automatically maps all official government licenses in `company_licenses`
into Japan Standard Industrial Classification (JSIC - 日本標準産業分類)
in `company_industries` and updates `companies.jigyo_shumoku`.

License to Industry Mapping:
-------------------------------------------------------------------------------------------------
1. 宅地建物取引業     -> K (不動産業，物品賃貸業) / 68 (不動産取引業)       -> '不動産取引業'
2. 労働者派遣事業     -> R (サービス業)           / 91 (職業紹介・労働者派遣業) -> '職業紹介・労働者派遣業'
3. 有料職業紹介事業   -> R (サービス業)           / 91 (職業紹介・労働者派遣業) -> '職業紹介・労働者派遣業'
4. 古物商許可         -> I (卸売業，小売業)       / 60 (その他の小売業)         -> 'その他の小売業'
5. 建設業許可         -> D (建設業)               / 06 (総合工事業)             -> '総合工事業'
-------------------------------------------------------------------------------------------------
"""

import sys
import time
import os
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

PG_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")

MAPPING_CONFIGS = [
    {
        "name": "宅地建物取引業 (Real Estate Transaction)",
        "license_types": ["宅地建物取引業"],
        "major_code": "K",
        "major_path": "K",
        "medium_code": "68",
        "medium_path": "K.68",
        "shumoku_label": "不動産取引業",
        "flag_column": "has_real_estate_lic"
    },
    {
        "name": "労働者派遣事業 & 有料職業紹介事業 (HR Dispatch & Placement)",
        "license_types": ["労働者派遣事業", "有料職業紹介事業"],
        "major_code": "R",
        "major_path": "R",
        "medium_code": "91",
        "medium_path": "R.91",
        "shumoku_label": "職業紹介・労働者派遣業",
        "flag_column": None
    },
    {
        "name": "古物商許可 (Secondhand Goods Dealer)",
        "license_types": ["古物商許可"],
        "major_code": "I",
        "major_path": "I",
        "medium_code": "60",
        "medium_path": "I.60",
        "shumoku_label": "その他の小売業",
        "flag_column": "has_kobutsu_lic"
    },
    {
        "name": "建設業許可 (Construction Contractor)",
        "license_types": ["建設業許可"],
        "major_code": "D",
        "major_path": "D",
        "medium_code": "06",
        "medium_path": "D.06",
        "shumoku_label": "総合工事業",
        "flag_column": "has_construction_lic"
    }
]

def run_enrichment(target_types=None):
    t0 = time.time()
    print("=" * 80)
    print("KIGYOU-LIST: AUTOMATED COMPREHENSIVE LICENSE-TO-INDUSTRY AUTO-TAGGER")
    print(f"Target Database: PostgreSQL Production (VPS)")
    if target_types:
        print(f"Filter Targets: {target_types}")
    print("=" * 80)

    conn = psycopg2.connect(PG_URL)
    cur = conn.cursor()

    total_inserted_industries = 0
    total_updated_companies = 0

    for cfg in MAPPING_CONFIGS:
        if target_types and not any(t in target_types for t in cfg['license_types']):
            continue
        t_sub = time.time()
        print(f"\n[*] Processing group: {cfg['name']}...")
        lic_types = tuple(cfg['license_types'])

        # 1. Insert Major Code into company_industries
        cur.execute(f"""
            INSERT INTO company_industries (corporate_number, industry_code, industry_path, is_detailed, created_at)
            SELECT DISTINCT cl.corporate_number, %s, %s, false, NOW()
            FROM company_licenses cl
            WHERE cl.license_type IN %s
            ON CONFLICT (corporate_number, industry_code) DO NOTHING;
        """, (cfg['major_code'], cfg['major_path'], lic_types))
        inserted_major = cur.rowcount
        conn.commit()

        # 2. Insert Medium Code into company_industries
        cur.execute(f"""
            INSERT INTO company_industries (corporate_number, industry_code, industry_path, is_detailed, created_at)
            SELECT DISTINCT cl.corporate_number, %s, %s, false, NOW()
            FROM company_licenses cl
            WHERE cl.license_type IN %s
            ON CONFLICT (corporate_number, industry_code) DO NOTHING;
        """, (cfg['medium_code'], cfg['medium_path'], lic_types))
        inserted_medium = cur.rowcount
        conn.commit()

        total_inserted_industries += (inserted_major + inserted_medium)
        print(f"  [+] Inserted into `company_industries`: {inserted_major:,} major ({cfg['major_code']}) + {inserted_medium:,} medium ({cfg['medium_code']})")

        # 3. Update companies metadata and jigyo_shumoku
        label = cfg['shumoku_label']
        flag_clause = f", {cfg['flag_column']} = true" if cfg['flag_column'] else ""

        cur.execute(f"""
            UPDATE companies c
            SET has_license = true,
                primary_industry_code = COALESCE(c.primary_industry_code, %s),
                major_industry_code = COALESCE(c.major_industry_code, %s),
                industry_confidence = CASE 
                    WHEN c.industry_confidence IN ('UNCLASSIFIED', 'VERIFIED_WEB', NULL, '') THEN 'CONFIRMED_LICENSE'
                    ELSE COALESCE(c.industry_confidence, 'CONFIRMED_LICENSE')
                END,
                jigyo_shumoku = CASE 
                    WHEN c.jigyo_shumoku IS NULL OR c.jigyo_shumoku = '' THEN %s
                    WHEN c.jigyo_shumoku NOT LIKE %s THEN c.jigyo_shumoku || ', ' || %s
                    ELSE c.jigyo_shumoku
                END
                {flag_clause}
            FROM (
                SELECT DISTINCT corporate_number 
                FROM company_licenses 
                WHERE license_type IN %s
            ) cl
            WHERE c.corporate_number = cl.corporate_number
              AND (
                  c.primary_industry_code IS NULL 
                  OR c.major_industry_code IS NULL 
                  OR c.jigyo_shumoku IS NULL 
                  OR c.jigyo_shumoku NOT LIKE %s
                  OR c.has_license IS NOT TRUE
              );
        """, (
            cfg['medium_code'],
            cfg['major_code'],
            label,
            f"%{label}%",
            label,
            lic_types,
            f"%{label}%"
        ))
        updated_comps = cur.rowcount
        conn.commit()
        total_updated_companies += updated_comps
        print(f"  [+] Updated `companies`: {updated_comps:,} companies enriched with '{label}' ({time.time() - t_sub:.2f}s)")

    print("\n" + "=" * 80)
    print("ENRICHMENT SUMMARY:")
    print(f"  - Total industry links inserted: {total_inserted_industries:,}")
    print(f"  - Total companies updated: {total_updated_companies:,}")
    print(f"  - Execution Time: {time.time() - t0:.2f} seconds")
    print("=" * 80)

    # Final Verification
    cur.execute("""
        SELECT cl.license_type, 
               COUNT(DISTINCT cl.corporate_number) as total_license_holders,
               COUNT(DISTINCT ci.corporate_number) as now_tagged_in_industries
        FROM company_licenses cl
        LEFT JOIN company_industries ci ON cl.corporate_number = ci.corporate_number
        GROUP BY cl.license_type
        ORDER BY total_license_holders DESC;
    """)
    print("\nVERIFICATION REPORT:")
    for r in cur.fetchall():
        print(f"  - License: {r[0]:<20} | Total: {r[1]:>8,} | Tagged in Industries: {r[2]:>8,} ({(r[2]/r[1]*100):.1f}%)")

    conn.close()

if __name__ == '__main__':
    run_enrichment()
