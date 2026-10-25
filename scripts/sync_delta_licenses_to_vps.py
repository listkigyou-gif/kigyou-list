#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: High-Speed Delta License Synchronizer to PostgreSQL VPS
===================================================================
Streams and bulk-syncs all new real estate (宅地建物取引業) and secondhand
(古物商許可) licenses from local SQLite to production PostgreSQL.
Uses psycopg2 execute_values with batch_size=2000 for maximum throughput.
"""

import sys
import time
import sqlite3
import psycopg2
from psycopg2.extras import execute_values

sys.stdout.reconfigure(encoding='utf-8')

SQLITE_DB = "kigyou-list.db"
PG_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"
BATCH_SIZE = 2000

def sync_licenses(target_types=None):
    t0 = time.time()
    print("=" * 75)
    print("KIGYOU-LIST: BULK SYNCING LICENSES TO VPS POSTGRESQL PRODUCTION")
    print(f"Target VPS: 160.251.203.84:5432/kigyou_list")
    if target_types:
        print(f"Target Types: {target_types}")
    print("=" * 75)

    conn_sq = sqlite3.connect(SQLITE_DB)
    cur_sq = conn_sq.cursor()

    conn_pg = psycopg2.connect(PG_URL)
    cur_pg = conn_pg.cursor()

    types_list = target_types if target_types else ['宅地建物取引業', '古物商許可', '登録支援機関', '税理士法人', '監査法人', '弁護士法人', '行政書士法人', '司法書士法人', '社会保険労務士法人', '弁理士法人']
    types_tuple = tuple(types_list)

    # 1. Check existing licenses in PG to find deltas
    cur_pg.execute("SELECT corporate_number, license_number FROM company_licenses WHERE license_type IN %s;", (types_tuple,))
    existing_pg = set(cur_pg.fetchall())
    print(f"[*] Current existing licenses in VPS PostgreSQL for target types: {len(existing_pg):,}")

    # 2. Fetch all from SQLite
    cur_sq.execute(f"""
        SELECT corporate_number, license_type, license_category, license_number,
               issuing_authority, prefecture_code, representative_name, office_phone,
               office_fax, registered_address, issue_date, valid_until, license_status,
               specialties_json, source_url
        FROM company_licenses
        WHERE license_type IN ({','.join(['?']*len(types_list))});
    """, types_list)
    sqlite_rows = cur_sq.fetchall()
    print(f"[*] Total licenses in SQLite for target types: {len(sqlite_rows):,}")

    delta_rows = [r for r in sqlite_rows if (r[0], r[3]) not in existing_pg]
    print(f"[*] Delta rows to insert: {len(delta_rows):,}")

    if delta_rows:
        insert_sql = """
            INSERT INTO company_licenses (
                corporate_number, license_type, license_category, license_number,
                issuing_authority, prefecture_code, representative_name, office_phone,
                office_fax, registered_address, issue_date, valid_until, license_status,
                specialties_json, source_url
            ) VALUES %s
            ON CONFLICT DO NOTHING;
        """
        for i in range(0, len(delta_rows), BATCH_SIZE):
            chunk = delta_rows[i:i + BATCH_SIZE]
            execute_values(cur_pg, insert_sql, chunk)
            conn_pg.commit()
            print(f"  [+] Synced chunk {i + len(chunk):,}/{len(delta_rows):,}")

    # 3. Synchronize company website & shumoku enrichment
    print("[*] Synchronizing enriched company websites and business summaries to VPS...")
    cur_sq.execute("""
        SELECT corporate_number, website_url, jigyo_shumoku 
        FROM companies 
        WHERE jigyo_shumoku LIKE '%古物商許可%' OR jigyo_shumoku LIKE '%宅地建物取引業%';
    """)
    enriched_comps = cur_sq.fetchall()
    print(f"[*] Enriched companies in SQLite: {len(enriched_comps):,}")

    update_sql = """
        UPDATE companies AS c
        SET website_url = COALESCE(c.website_url, v.website_url),
            jigyo_shumoku = v.jigyo_shumoku
        FROM (VALUES %s) AS v(corporate_number, website_url, jigyo_shumoku)
        WHERE c.corporate_number = v.corporate_number;
    """
    for i in range(0, len(enriched_comps), BATCH_SIZE):
        chunk = enriched_comps[i:i + BATCH_SIZE]
        execute_values(cur_pg, update_sql, chunk)
        conn_pg.commit()
        print(f"  [+] Synced company metadata chunk {i + len(chunk):,}/{len(enriched_comps):,}")

    # 4. Final verify counts on VPS
    cur_pg.execute("""
        SELECT license_type, count(*) 
        FROM company_licenses 
        GROUP BY license_type 
        ORDER BY count(*) DESC;
    """)
    counts = cur_pg.fetchall()
    print("\n" + "=" * 75)
    print("VPS POSTGRESQL PRODUCTION LICENSE SUMMARY:")
    total_pg = 0
    for l_type, cnt in counts:
        print(f"  - {l_type:20s}: {cnt:>10,}")
        total_pg += cnt
    print("-" * 75)
    print(f"  TOTAL ALL LICENSES ON VPS : {total_pg:>10,}")
    print(f"  Total Sync Time          : {time.time() - t0:.2f} seconds")
    print("=" * 75)

    conn_sq.close()
    conn_pg.close()

    # 5. Automatically trigger comprehensive license-to-industry tagging on VPS
    try:
        from scripts.enrich_all_licensed_companies import run_enrichment
        print("\n[*] Triggering automated license-to-industry tagging on VPS...")
        enrich_targets = target_types if target_types else ['古物商許可', '宅地建物取引業', '登録支援機関', '税理士法人', '監査法人', '弁護士法人', '行政書士法人', '司法書士法人', '社会保険労務士法人', '弁理士法人']
        run_enrichment(target_types=enrich_targets)
    except Exception as e:
        print(f"[!] Warning: Auto-tagging hook failed: {e}")

if __name__ == "__main__":
    sync_licenses()
