# -*- coding: utf-8 -*-
"""
Kigyou-list: Office Building Directory & pSEO Hub Seeder (Top 100 Landmarks)
==========================================================================
Seeds Top 100 Landmark Office Towers in Japan into SQLite and PostgreSQL VPS.
Scans companies by address pattern targeting specific prefecture partitions,
assigns building_name and building_slug, and calculates tenant counts for
programmatic SEO hub pages (/ja/building/...).
"""

import os
import sys
import time
import json
import argparse
import sqlite3
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB_PATH = os.path.join(PROJECT_ROOT, 'kigyou-list.db')
JSON_PATH = os.path.join(PROJECT_ROOT, 'data', 'top_100_office_buildings.json')
sys.path.insert(0, PROJECT_ROOT)
from crawlers.nta.sync_nta_invoices_to_vps import PG_URL

def to_zenkaku(text):
    zen = ""
    for ch in text:
        code = ord(ch)
        if 0x21 <= code <= 0x7E:
            zen += chr(code + 0xFEE0)
        elif code == 0x20:
            zen += "\u3000"
        else:
            zen += ch
    return zen

def to_hankaku(text):
    han = ""
    for ch in text:
        code = ord(ch)
        if 0xFF01 <= code <= 0xFF5E:
            han += chr(code - 0xFEE0)
        elif code == 0x3000:
            han += " "
        else:
            han += ch
    return han

def expand_patterns(patterns):
    """
    Expands search patterns to include both Zen-kaku and Han-kaku variations,
    as well as variations without spaces (e.g. Otemachi One vs ＯｔｅｍａｃｈｉＯｎｅ).
    """
    expanded = set()
    for pat in patterns:
        clean = pat.strip()
        if not clean:
            continue
        expanded.add(clean)
        
        # Strip '%' for transformation
        inner = clean.strip('%')
        zen = f"%{to_zenkaku(inner)}%"
        han = f"%{to_hankaku(inner)}%"
        no_space = f"%{inner.replace(' ', '').replace('\u3000', '')}%"
        zen_no_space = f"%{to_zenkaku(inner.replace(' ', '').replace('\u3000', ''))}%"
        
        expanded.add(zen)
        expanded.add(han)
        expanded.add(no_space)
        expanded.add(zen_no_space)

    return sorted(list(expanded))

def load_buildings(json_path=JSON_PATH):
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Buildings dataset not found at {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def init_sqlite_schema(conn):
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS office_buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            building_slug TEXT NOT NULL UNIQUE,
            building_name TEXT NOT NULL,
            building_name_en TEXT,
            prefecture_code TEXT NOT NULL,
            prefecture_name TEXT,
            city_name TEXT,
            street_address TEXT,
            postal_code TEXT,
            total_floors INTEGER,
            tenant_company_count INTEGER DEFAULT 0,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_office_buildings_slug ON office_buildings(building_slug);
        CREATE INDEX IF NOT EXISTS idx_office_buildings_pref ON office_buildings(prefecture_code);
    """)
    conn.commit()
    cur.close()

def init_pg_schema(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS office_buildings (
            id SERIAL PRIMARY KEY,
            building_slug VARCHAR(120) NOT NULL UNIQUE,
            building_name VARCHAR(255) NOT NULL,
            building_name_en VARCHAR(255),
            prefecture_code VARCHAR(2) NOT NULL,
            prefecture_name VARCHAR(50),
            city_name VARCHAR(100),
            street_address VARCHAR(255),
            postal_code VARCHAR(10),
            total_floors INTEGER,
            tenant_company_count INTEGER DEFAULT 0,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_office_buildings_slug ON office_buildings(building_slug);
        CREATE INDEX IF NOT EXISTS idx_office_buildings_pref ON office_buildings(prefecture_code);
        CREATE INDEX IF NOT EXISTS idx_office_buildings_tenants ON office_buildings(tenant_company_count DESC);
    """)
    conn.commit()
    cur.close()

def seed_office_buildings(sqlite_only=False, vps_only=False, filter_pref=None, limit=None):
    start_time = time.time()
    buildings = load_buildings()

    if filter_pref:
        buildings = [b for b in buildings if b["prefecture_code"] == filter_pref]
    if limit:
        buildings = buildings[:limit]

    print("==================================================================", flush=True)
    print(f" KIGYOU-LIST: SEEDING TOP {len(buildings)} OFFICE BUILDINGS & pSEO HUBS", flush=True)
    print("==================================================================", flush=True)

    # Connections
    sqlite_conn = None
    cur_sq = None
    if not vps_only:
        print(f"[*] Connecting to SQLite Local: {DB_PATH}", flush=True)
        sqlite_conn = sqlite3.connect(DB_PATH)
        init_sqlite_schema(sqlite_conn)
        cur_sq = sqlite_conn.cursor()

    pg_conn = None
    cur_pg = None
    if not sqlite_only:
        print("[*] Connecting to PostgreSQL VPS...", flush=True)
        pg_conn = psycopg2.connect(PG_URL, connect_timeout=15)
        init_pg_schema(pg_conn)
        cur_pg = pg_conn.cursor()

    total_buildings = len(buildings)
    total_tenants_vps = 0
    total_tenants_sqlite = 0

    for idx, b in enumerate(buildings, start=1):
        name = b["building_name"]
        name_en = b.get("building_name_en", "")
        slug = b["building_slug"]
        pref = str(b["prefecture_code"]).zfill(2)
        pref_name = b.get("prefecture_name", "")
        city = b.get("city_name", "")
        addr = b.get("street_address", "")
        postal = b.get("postal_code", "")
        floors = b.get("total_floors", 0)
        
        raw_patterns = b.get("search_patterns", [])
        if not raw_patterns and "search_pattern" in b:
            raw_patterns = [b["search_pattern"]]
        patterns = expand_patterns(raw_patterns)
        
        desc = b.get("description", "")
        part_name = f"companies_p{pref}"

        t0 = time.time()
        vps_count = 0
        sq_count = 0

        # --- A) PostgreSQL Partition Update ---
        if cur_pg:
            try:
                conditions = " OR ".join(["full_address LIKE %s" for _ in patterns])
                update_pg_sql = f"""
                    UPDATE {part_name}
                    SET building_name = %s,
                        building_slug = %s,
                        in_major_building = true
                    WHERE ({conditions});
                """
                cur_pg.execute(update_pg_sql, [name, slug] + patterns)
                
                # Count actual tenants on VPS
                count_pg_sql = f"SELECT COUNT(*) FROM {part_name} WHERE building_slug = %s;"
                cur_pg.execute(count_pg_sql, (slug,))
                vps_count = cur_pg.fetchone()[0]

                # Upsert office_buildings in PostgreSQL
                upsert_pg = """
                    INSERT INTO office_buildings (
                        building_slug, building_name, building_name_en, prefecture_code, 
                        prefecture_name, city_name, street_address, postal_code, 
                        total_floors, tenant_company_count, description, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (building_slug) DO UPDATE SET
                        building_name = EXCLUDED.building_name,
                        building_name_en = EXCLUDED.building_name_en,
                        prefecture_code = EXCLUDED.prefecture_code,
                        prefecture_name = EXCLUDED.prefecture_name,
                        city_name = EXCLUDED.city_name,
                        street_address = EXCLUDED.street_address,
                        postal_code = EXCLUDED.postal_code,
                        total_floors = EXCLUDED.total_floors,
                        tenant_company_count = EXCLUDED.tenant_company_count,
                        description = EXCLUDED.description,
                        updated_at = CURRENT_TIMESTAMP;
                """
                cur_pg.execute(upsert_pg, (slug, name, name_en, pref, pref_name, city, addr, postal, floors, vps_count, desc))
                pg_conn.commit()
                total_tenants_vps += vps_count
            except Exception as e:
                pg_conn.rollback()
                print(f"    [!] VPS PG Error on {slug}: {e}", flush=True)

        # --- B) SQLite Local Update ---
        if cur_sq:
            try:
                conditions_sq = " OR ".join(["full_address LIKE ?" for _ in patterns])
                cur_sq.execute(f"""
                    UPDATE companies 
                    SET building_name = ?, building_slug = ?, in_major_building = 1
                    WHERE prefecture_code = ? AND ({conditions_sq});
                """, [name, slug, pref] + patterns)

                cur_sq.execute("SELECT COUNT(*) FROM companies WHERE prefecture_code = ? AND building_slug = ?;", (pref, slug))
                sq_count = cur_sq.fetchone()[0]

                cur_sq.execute("""
                    INSERT INTO office_buildings (
                        building_slug, building_name, building_name_en, prefecture_code, 
                        prefecture_name, city_name, street_address, postal_code, 
                        total_floors, tenant_company_count, description, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(building_slug) DO UPDATE SET
                        building_name = excluded.building_name,
                        building_name_en = excluded.building_name_en,
                        prefecture_code = excluded.prefecture_code,
                        prefecture_name = excluded.prefecture_name,
                        city_name = excluded.city_name,
                        street_address = excluded.street_address,
                        postal_code = excluded.postal_code,
                        total_floors = excluded.total_floors,
                        tenant_company_count = excluded.tenant_company_count,
                        description = excluded.description,
                        updated_at = CURRENT_TIMESTAMP;
                """, (slug, name, name_en, pref, pref_name, city, addr, postal, floors, sq_count, desc))
                sqlite_conn.commit()
                total_tenants_sqlite += sq_count
            except Exception as e:
                sqlite_conn.rollback()
                print(f"    [!] SQLite Error on {slug}: {e}", flush=True)

        dur = time.time() - t0
        print(f"[{idx:03d}/{total_buildings:03d}] {name} ({pref_name} / {slug}) -> VPS: {vps_count:,} | SQLite: {sq_count:,} ({dur:.2f}s)", flush=True)

    if cur_sq:
        cur_sq.close()
        sqlite_conn.close()
    if cur_pg:
        cur_pg.close()
        pg_conn.close()

    elapsed = time.time() - start_time
    print("\n==================================================================", flush=True)
    print(f"[✓] TOP 100 SEEDING COMPLETED IN {elapsed:.2f} SECONDS!", flush=True)
    print(f"    Towers Seeded: {total_buildings}", flush=True)
    if not sqlite_only:
        print(f"    Total VPS PostgreSQL Tenants Linked: {total_tenants_vps:,}", flush=True)
    if not vps_only:
        print(f"    Total Local SQLite Tenants Linked:   {total_tenants_sqlite:,}", flush=True)
    print("==================================================================", flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Seed Top 100 Office Buildings")
    parser.add_argument("--sqlite-only", action="store_true", help="Only update SQLite local")
    parser.add_argument("--vps-only", action="store_true", help="Only update VPS PostgreSQL")
    parser.add_argument("--pref", type=str, help="Filter by prefecture code (e.g. 13)")
    parser.add_argument("--limit", type=int, help="Limit number of buildings to seed")
    args = parser.parse_args()

    seed_office_buildings(
        sqlite_only=args.sqlite_only,
        vps_only=args.vps_only,
        filter_pref=args.pref,
        limit=args.limit
    )
