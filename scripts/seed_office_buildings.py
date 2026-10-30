# -*- coding: utf-8 -*-
"""
Kigyou-list: Office Building Directory & pSEO Hub Seeder
======================================================
Seeds Top Landmark Office Towers in Japan into SQLite and PostgreSQL VPS.
Scans companies by address pattern, assigns building_name and building_slug,
and calculates tenant counts for programmatic SEO hub pages (/ja/building/...).
"""

import os
import sys
import time
import sqlite3
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB_PATH = os.path.join(PROJECT_ROOT, 'kigyou-list.db')
sys.path.insert(0, PROJECT_ROOT)
from crawlers.nta.sync_nta_invoices_to_vps import PG_URL

BUILDINGS = [
    {
        "building_name": "恵比寿ガーデンプレイスタワー",
        "building_name_en": "Yebisu Garden Place Tower",
        "building_slug": "ebisu-garden-place-tower",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "渋谷区",
        "street_address": "東京都渋谷区恵比寿4-20-3",
        "postal_code": "150-6090",
        "total_floors": 40,
        "search_pattern": "%恵比寿ガーデンプレイス%",
        "description": "恵比寿ガーデンプレイスタワー（東京都渋谷区恵比寿）に入居する本社・支店・登記企業の最新一覧。売上高、従業員数、役員名、公式電話番号を網羅。"
    },
    {
        "building_name": "六本木ヒルズ森タワー",
        "building_name_en": "Roppongi Hills Mori Tower",
        "building_slug": "roppongi-hills-mori-tower",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "港区",
        "street_address": "東京都港区六本木6-10-1",
        "postal_code": "106-6190",
        "total_floors": 54,
        "search_pattern": "%六本木ヒルズ%",
        "description": "六本木ヒルズ森タワー（東京都港区六本木）に本社を置く上場企業・ITベンチャー・外資系企業の最新テナント一覧。"
    },
    {
        "building_name": "虎ノ門ヒルズ森タワー",
        "building_name_en": "Toranomon Hills Mori Tower",
        "building_slug": "toranomon-hills-mori-tower",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "港区",
        "street_address": "東京都港区虎ノ門1-23-1",
        "postal_code": "105-6390",
        "total_floors": 52,
        "search_pattern": "%虎ノ門ヒルズ%",
        "description": "虎ノ門ヒルズ森タワー（東京都港区虎ノ門）に入居する最新企業・グローバル企業一覧。法人番号、資本金、連絡先データを公開。"
    },
    {
        "building_name": "品川インターシティ",
        "building_name_en": "Shinagawa Intercity",
        "building_slug": "shinagawa-intercity",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "港区",
        "street_address": "東京都港区港南2-15-1",
        "postal_code": "108-6090",
        "total_floors": 32,
        "search_pattern": "%品川インターシティ%",
        "description": "品川インターシティ（東京都港区港南）に入居する大手メーカー・商社・IT企業の最新一覧。決算推移、従業員数を掲載。"
    },
    {
        "building_name": "横浜ランドマークタワー",
        "building_name_en": "Yokohama Landmark Tower",
        "building_slug": "yokohama-landmark-tower",
        "prefecture_code": "14",
        "prefecture_name": "神奈川県",
        "city_name": "横浜市西区",
        "street_address": "神奈川県横浜市西区みなとみらい2-2-1",
        "postal_code": "220-8190",
        "total_floors": 70,
        "search_pattern": "%ランドマークタワー%",
        "description": "横浜ランドマークタワー（横浜市西区みなとみらい）に入居する有力企業・支店一覧。電話番号、役員、財務データを検索。"
    },
    {
        "building_name": "丸の内ビルディング（丸ビル）",
        "building_name_en": "Marunouchi Building",
        "building_slug": "marunouchi-building",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "千代田区",
        "street_address": "東京都千代田区丸の内2-4-1",
        "postal_code": "100-6390",
        "total_floors": 37,
        "search_pattern": "%丸の内ビル%",
        "description": "丸の内ビルディング（東京都千代田区丸の内）に入居する大手金融・コンサル・商社の最新企業名鑑。"
    },
    {
        "building_name": "新丸の内ビルディング（新丸ビル）",
        "building_name_en": "Shin-Marunouchi Building",
        "building_slug": "shin-marunouchi-building",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "千代田区",
        "street_address": "東京都千代田区丸の内1-5-1",
        "postal_code": "100-6590",
        "total_floors": 38,
        "search_pattern": "%新丸の内ビル%",
        "description": "新丸の内ビルディング（東京都千代田区丸の内）に入居する法律事務所・投資ファンド・大手企業一覧。"
    },
    {
        "building_name": "渋谷スクランブルスクエア",
        "building_name_en": "Shibuya Scramble Square",
        "building_slug": "shibuya-scramble-square",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "渋谷区",
        "street_address": "東京都渋谷区渋谷2-24-12",
        "postal_code": "150-6101",
        "total_floors": 47,
        "search_pattern": "%渋谷スクランブルスクエア%",
        "description": "渋谷スクランブルスクエア（東京都渋谷区渋谷）に入居する急成長テック企業・メガベンチャーの最新一覧。"
    },
    {
        "building_name": "グランフロント大阪",
        "building_name_en": "Grand Front Osaka",
        "building_slug": "grand-front-osaka",
        "prefecture_code": "27",
        "prefecture_name": "大阪府",
        "city_name": "大阪市北区",
        "street_address": "大阪府大阪市北区大深町3-1",
        "postal_code": "530-0011",
        "total_floors": 38,
        "search_pattern": "%グランフロント大阪%",
        "description": "グランフロント大阪（大阪市北区梅田）タワーA・タワーB・タワーCに入居する関西・西日本中核企業一覧。"
    },
    {
        "building_name": "東京ミッドタウン（赤坂）",
        "building_name_en": "Tokyo Midtown Tower",
        "building_slug": "tokyo-midtown-tower",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "港区",
        "street_address": "東京都港区赤坂9-7-1",
        "postal_code": "107-6290",
        "total_floors": 54,
        "search_pattern": "%東京ミッドタウン%",
        "description": "東京ミッドタウン・タワー（東京都港区赤坂）に本社を構えるグローバル大手・総合商社一覧。"
    },
    {
        "building_name": "渋谷ヒカリエ",
        "building_name_en": "Shibuya Hikarie",
        "building_slug": "shibuya-hikarie",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "渋谷区",
        "street_address": "東京都渋谷区渋谷2-21-1",
        "postal_code": "150-8510",
        "total_floors": 34,
        "search_pattern": "%渋谷ヒカリエ%",
        "description": "渋谷ヒカリエ（東京都渋谷区渋谷）に本社・開発拠点を置くITインターネット・ゲーム・メディア企業一覧。"
    },
    {
        "building_name": "あべのハルカス",
        "building_name_en": "Abeno Harukas",
        "building_slug": "abeno-harukas",
        "prefecture_code": "27",
        "prefecture_name": "大阪府",
        "city_name": "大阪市阿倍野区",
        "street_address": "大阪府大阪市阿倍野区阿倍野筋1-1-43",
        "postal_code": "545-6016",
        "total_floors": 60,
        "search_pattern": "%あべのハルカス%",
        "description": "日本屈指の高層ビル「あべのハルカス」（大阪市阿倍野区）のオフィスフロアに入居する企業一覧。"
    },
    {
        "building_name": "汐留シティセンター",
        "building_name_en": "Shiodome City Center",
        "building_slug": "shiodome-city-center",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "港区",
        "street_address": "東京都港区東新橋1-5-2",
        "postal_code": "105-7101",
        "total_floors": 43,
        "search_pattern": "%汐留シティセンター%",
        "description": "汐留シティセンター（東京都港区東新橋）に入居する大手IT・通信・航空関連企業一覧。"
    },
    {
        "building_name": "赤坂インターシティAIR",
        "building_name_en": "Akasaka Intercity AIR",
        "building_slug": "akasaka-intercity-air",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "港区",
        "street_address": "東京都港区赤坂1-8-1",
        "postal_code": "107-0052",
        "total_floors": 38,
        "search_pattern": "%赤坂インターシティ%",
        "description": "赤坂インターシティAIR（東京都港区赤坂）に入居する大手外資系企業・製薬・コンサルティングファーム一覧。"
    },
    {
        "building_name": "サンシャイン60",
        "building_name_en": "Sunshine 60",
        "building_slug": "sunshine-60",
        "prefecture_code": "13",
        "prefecture_name": "東京都",
        "city_name": "豊島区",
        "street_address": "東京都豊島区東池袋3-1-1",
        "postal_code": "170-6090",
        "total_floors": 60,
        "search_pattern": "%サンシャイン６０%",
        "description": "池袋のランドマーク「サンシャイン60」（東京都豊島区東池袋）に入居する商社、サービス、IT企業一覧。"
    }
]

def seed_office_buildings():
    start_time = time.time()
    print("==================================================================")
    print(" KIGYOU-LIST: SEEDING OFFICE BUILDINGS & pSEO HUBS")
    print("==================================================================")
    
    # 1. Update SQLite
    print(f"[*] Updating Local SQLite: {DB_PATH}")
    sqlite_conn = sqlite3.connect(DB_PATH)
    cur_sq = sqlite_conn.cursor()
    
    cur_sq.execute("DROP TABLE IF EXISTS office_buildings;")
    cur_sq.execute("""
        CREATE TABLE office_buildings (
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
    """)
    sqlite_conn.commit()

    # 2. Connect to VPS PostgreSQL
    print("[*] Connecting to PostgreSQL VPS...")
    pg_conn = psycopg2.connect(PG_URL, connect_timeout=15)
    cur_pg = pg_conn.cursor()

    total_buildings_seeded = 0
    total_tenants_linked = 0

    for b in BUILDINGS:
        name = b["building_name"]
        name_en = b["building_name_en"]
        slug = b["building_slug"]
        pref = b["prefecture_code"]
        pref_name = b["prefecture_name"]
        city = b["city_name"]
        addr = b["street_address"]
        postal = b["postal_code"]
        floors = b["total_floors"]
        pat = b["search_pattern"]
        desc = b["description"]
        part_name = f"companies_p{pref}"

        print(f"\n[*] Processing Building: {name} ({slug}) in Prefecture {pref}...")

        # A) Update PostgreSQL Partition
        update_pg_sql = f"""
            UPDATE {part_name}
            SET building_name = %s,
                building_slug = %s,
                in_major_building = true
            WHERE full_address LIKE %s;
        """
        cur_pg.execute(update_pg_sql, (name, slug, pat))
        
        # Count actual tenants on VPS
        count_pg_sql = f"SELECT COUNT(*) FROM {part_name} WHERE building_slug = %s;"
        cur_pg.execute(count_pg_sql, (slug,))
        actual_tenant_count = cur_pg.fetchone()[0]

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
        cur_pg.execute(upsert_pg, (slug, name, name_en, pref, pref_name, city, addr, postal, floors, actual_tenant_count, desc))
        pg_conn.commit()

        # B) Update SQLite
        cur_sq.execute("""
            UPDATE companies 
            SET building_name = ?, building_slug = ?, in_major_building = 1
            WHERE full_address LIKE ?;
        """, (name, slug, pat))
        cur_sq.execute("SELECT COUNT(*) FROM companies WHERE building_slug = ?;", (slug,))
        sq_tenant_cnt = cur_sq.fetchone()[0]

        cur_sq.execute("""
            INSERT INTO office_buildings (
                building_slug, building_name, building_name_en, prefecture_code, 
                prefecture_name, city_name, street_address, postal_code, 
                total_floors, tenant_company_count, description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (slug, name, name_en, pref, pref_name, city, addr, postal, floors, sq_tenant_cnt, desc))
        sqlite_conn.commit()

        print(f"    [+] Linked {actual_tenant_count:,} tenants on VPS (SQLite: {sq_tenant_cnt:,} tenants).")
        total_buildings_seeded += 1
        total_tenants_linked += actual_tenant_count

    cur_sq.close()
    sqlite_conn.close()
    cur_pg.close()
    pg_conn.close()

    elapsed = time.time() - start_time
    print("\n==================================================================")
    print(f"[✓] SEEDING COMPLETED IN {elapsed:.2f} SECONDS!")
    print(f"    Total Landmark Buildings Seeded: {total_buildings_seeded}")
    print(f"    Total Tenant Companies Linked: {total_tenants_linked:,}")
    print("==================================================================")

if __name__ == '__main__':
    seed_office_buildings()
