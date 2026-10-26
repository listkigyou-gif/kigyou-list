#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Kigyou-list: National Hospitality & Food Services Master Harvester
1. 旅館業許可 (Hotels, Ryokans, Lodging Facilities under Inns and Hotels Act)
2. 飲食店営業許可 (Restaurants, Eateries, Cafes under Food Sanitation Act)
====================================================================
Collects from official prefectural & municipal Open Data catalogs across Japan.
Performs Entity Resolution against NTA 5.07M corporate database.
Enriches company_licenses and syncs to VPS PostgreSQL.
"""

import os
import sys
import re
import csv
import io
import json
import time
import sqlite3
import datetime
import urllib.request
import unicodedata

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scripts.sync_delta_licenses_to_vps import sync_licenses

DATA_DIR = os.path.join(PROJECT_ROOT, "importdata", "open-data", "hospitality_food")
DB_PATH = os.path.join(PROJECT_ROOT, "kigyou-list.db")
os.makedirs(DATA_DIR, exist_ok=True)

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

def clean_corp_name(name):
    if not name:
        return "", ""
    text = unicodedata.normalize("NFKC", str(name)).strip()
    text = re.sub(r'[\s\u3000]+', '', text)
    norm = re.sub(r'(株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|一般財団法人|特定非営利活動法人|協同組合|\(株\)|\(有\)|\(同\)|株\)|有\))', '', text)
    return text, norm

def detect_prefecture(address, default_pref=""):
    if not address:
        return default_pref
    addr = unicodedata.normalize("NFKC", str(address)).strip()
    for pref_name, code in PREF_MAP.items():
        if addr.startswith(pref_name) or pref_name in addr[:6]:
            return code
    return default_pref

def download_file(url, local_path):
    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        return True
    try:
        print(f"[*] Downloading: {url}")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=45) as resp, open(local_path, "wb") as f:
            f.write(resp.read())
        print(f"[+] Download complete: {local_path} ({os.path.getsize(local_path):,} bytes)")
        return True
    except Exception as e:
        print(f"[-] Download failed for {url}: {e}")
        return False

# ==============================================================================
# 1. HARVEST RYOKAN & HOTELS (旅館業許可)
# ==============================================================================

RYOKAN_SOURCES = [
    {
        "id": "shizuoka",
        "url": "https://data.bodik.jp/dataset/e5c122bd-4195-4909-b5f5-11b023144a28/resource/f6ddbc17-3b7e-41e8-8677-7a3e1741bed3/download/ryokan20260331.csv",
        "encoding": "utf-8-sig",
        "delimiter": ",",
        "pref_code": "22",
        "authority": "静岡市保健所"
    },
    {
        "id": "tokyo_minato",
        "url": "https://opendata.city.minato.tokyo.jp/dataset/6adb6ec4-6cf8-4d4c-b68a-96c095728b0b/resource/71b05077-1f8c-459e-a17a-3789273bca08/download/ryokan.csv",
        "encoding": "utf-8-sig",
        "delimiter": ",",
        "pref_code": "13",
        "authority": "東京都港区みなと保健所"
    },
    {
        "id": "tokyo_meguro",
        "url": "https://data.bodik.jp/dataset/800b5b11-f0ad-42e1-92d0-e05ca81bf2be/resource/12b6d43c-cb1e-4dcb-97ff-a85fb0905a5e/download/131105_ryokan_20260331.csv",
        "encoding": "utf-8-sig",
        "delimiter": "\t",
        "pref_code": "13",
        "authority": "東京都目黒区保健所"
    },
    {
        "id": "otsu",
        "url": "https://data.bodik.jp/dataset/c91532cc-8c4e-406b-9f81-6196a92d4fc9/resource/1a588093-ddae-4453-9c11-d9e5e213575e/download/260930ryokan.csv",
        "encoding": "utf-8-sig",
        "delimiter": ",",
        "pref_code": "25",
        "authority": "大津市保健所"
    }
]

def harvest_ryokan_hotels():
    records = []
    print("\n" + "=" * 80)
    print("HARVESTING: 旅館業許可 (Hotels & Ryokans)")
    print("=" * 80)

    for src in RYOKAN_SOURCES:
        local_file = os.path.join(DATA_DIR, f"ryokan_{src['id']}.csv")
        if not download_file(src["url"], local_file):
            continue

        try:
            with open(local_file, "r", encoding=src["encoding"], errors="replace") as f:
                reader = csv.reader(f, delimiter=src["delimiter"])
                header = next(reader)
                
                # Normalize header names
                h_map = {col.strip().replace('\ufeff', ''): idx for idx, col in enumerate(header)}
                
                for row in reader:
                    if not row or len(row) < 3:
                        continue

                    facility_name = ""
                    corp_name = ""
                    address = ""
                    phone = ""
                    lic_num = ""
                    issue_date = ""
                    rep_name = ""
                    room_count = ""
                    facility_type = "旅館・ホテル"

                    # Parse by source specifics
                    if src["id"] == "shizuoka":
                        # ['許可年月日', '施設所在地', '施設電話番号', '施設名称', '営業者住所', '氏名(法人)', '代表者氏名', '業種名称']
                        issue_date = row[0] if len(row) > 0 else ""
                        address = row[1] if len(row) > 1 else ""
                        phone = row[2] if len(row) > 2 else ""
                        facility_name = row[3] if len(row) > 3 else ""
                        corp_name = row[5] if len(row) > 5 else ""
                        rep_name = row[6] if len(row) > 6 else ""
                        facility_type = row[7] if len(row) > 7 else "旅館・ホテル"
                        lic_num = f"静保環第{issue_date}"

                    elif src["id"] == "tokyo_minato":
                        # ['施設名称', '施設郵便番号', '施設所在地', '施設方書', '許可日', '許可番号', '施設種別', '客室数総計[室]', '客室定員総計[人]']
                        facility_name = row[0] if len(row) > 0 else ""
                        address = row[2] if len(row) > 2 else ""
                        issue_date = row[4] if len(row) > 4 else ""
                        lic_num = row[5] if len(row) > 5 else ""
                        facility_type = row[6] if len(row) > 6 else "旅館・ホテル営業"
                        room_count = row[7] if len(row) > 7 else ""
                        corp_name = facility_name # fallback

                    elif src["id"] == "tokyo_meguro":
                        # [No, 施設名称, 施設所在地, 施設方書, ＴＥＬ１, 許可日, 許可番号, 営業者名, 施設（種別）等]
                        facility_name = row[1] if len(row) > 1 else ""
                        address = row[2] if len(row) > 2 else ""
                        phone = row[4] if len(row) > 4 else ""
                        issue_date = row[5] if len(row) > 5 else ""
                        lic_num = row[6] if len(row) > 6 else ""
                        corp_name = row[7] if len(row) > 7 else facility_name
                        facility_type = row[8] if len(row) > 8 else "旅館・ホテル"

                    elif src["id"] == "otsu":
                        facility_name = row[0] if len(row) > 0 else ""
                        address = row[1] if len(row) > 1 else ""
                        phone = row[2] if len(row) > 2 else ""
                        facility_type = row[3] if len(row) > 3 else "旅館・ホテル"
                        corp_name = row[4] if len(row) > 4 else facility_name
                        issue_date = row[5] if len(row) > 5 else ""
                        lic_num = row[6] if len(row) > 6 else ""

                    if not corp_name:
                        corp_name = facility_name
                    if not corp_name:
                        continue

                    clean_name, norm_name = clean_corp_name(corp_name)
                    pref_code = detect_prefecture(address, src["pref_code"])

                    specs = {
                        "facility_name": facility_name,
                        "facility_type": facility_type,
                        "room_count": room_count
                    }

                    records.append({
                        "corp_name": corp_name,
                        "clean_name": clean_name,
                        "norm_name": norm_name,
                        "facility_name": facility_name,
                        "license_type": "旅館業許可",
                        "license_category": "宿泊・ホテル業",
                        "license_number": lic_num or f"旅館業-{facility_name}",
                        "issuing_authority": src["authority"],
                        "prefecture_code": pref_code,
                        "registered_address": address,
                        "office_phone": phone,
                        "representative_name": rep_name,
                        "issue_date": issue_date,
                        "specialties_json": json.dumps(specs, ensure_ascii=False)
                    })

        except Exception as e:
            print(f"[-] Error parsing {src['id']}: {e}")

    print(f"[+] Total Ryokan/Hotel records extracted: {len(records):,}")
    return records


# ==============================================================================
# 2. HARVEST FOOD SANITATION & RESTAURANTS (飲食店営業許可)
# ==============================================================================

FOOD_SOURCES = [
    {
        "id": "oita",
        "url": "https://data.bodik.jp/dataset/1b0a322a-6355-4b47-8fe7-478ec1b7d5e9/resource/b8d40e46-9b97-48cd-86a3-3183d78c629a/download/440001_food_business_all.csv",
        "pref_code": "44",
        "authority": "大分県保健所"
    },
    {
        "id": "tokyo_minato",
        "url": "https://opendata.city.minato.tokyo.jp/dataset/54d8c582-00e2-4730-a23f-4a5befec9ae5/resource/c9d0299e-8e05-4317-877f-83055709e41f/download/food_business_all.csv",
        "pref_code": "13",
        "authority": "東京都港区みなと保健所"
    },
    {
        "id": "higashiosaka",
        "url": "https://data.bodik.jp/dataset/b5eeed4c-cec0-4eef-8513-b4882d6a18ec/resource/a0416f70-bda0-46fe-a684-b22a95135c32/download/272272_food_business_all_20260401.csv",
        "pref_code": "27",
        "authority": "東大阪市保健所"
    },
    {
        "id": "toyonaka",
        "url": "https://data.bodik.jp/dataset/2d6870cc-3db8-4069-841e-2a6deeb173b4/resource/74c6e0d8-9fde-4503-8090-bada26639ae3/download/272035_food_business_all.csv",
        "pref_code": "27",
        "authority": "豊中市保健所"
    },
    {
        "id": "okazaki",
        "url": "https://data.bodik.jp/dataset/aabced9d-d86e-422d-8ad0-2781d0f30671/resource/a893c7d6-5c10-4fb4-b9fa-cb48edd81565/download/232025_food_business_all.csv",
        "pref_code": "23",
        "authority": "岡崎市保健所"
    },
    {
        "id": "kagoshima",
        "url": "https://data.bodik.jp/dataset/1bca2ed4-7d8f-4330-b8e6-a05d27ace017/resource/45852109-5986-45b2-88e5-b232d3650a8d/download/460001_food_business_all_2026_0630.csv",
        "pref_code": "46",
        "authority": "鹿児島県保健所"
    },
    {
        "id": "nagasaki",
        "url": "https://data.bodik.jp/dataset/4d70b9d1-9885-4045-9f59-9d1b99e02910/resource/1125a70b-ac9d-49f6-ba87-1011d0db4f1a/download/422011_food_business_all.csv",
        "pref_code": "42",
        "authority": "長崎市保健所"
    }
]

def harvest_food_restaurants():
    records = []
    print("\n" + "=" * 80)
    print("HARVESTING: 飲食店営業許可 (Restaurants & Food Sanitation)")
    print("=" * 80)

    for src in FOOD_SOURCES:
        local_file = os.path.join(DATA_DIR, f"food_{src['id']}.csv")
        if not download_file(src["url"], local_file):
            continue

        try:
            with open(local_file, "r", encoding="utf-8", errors="replace") as f:
                reader = csv.reader(f)
                header = next(reader)
                
                # Find index of columns
                # ['全国地方公共団体コード', 'ID', '地方公共団体名', '施設名称', '施設名称_カナ', ..., '所在地_連結表記', ..., '施設電話番号', ..., '法人名', '法人番号', '許可番号', '初回許可年月日', '許可年月日']
                col_facility = 3
                col_biz_type = 6
                col_biz_detail = 7
                col_address = 10
                col_pref = 11
                col_phone = 18
                col_corp_name = 23
                col_corp_num = 24
                col_lic_num = 25
                col_lic_date = 26

                count = 0
                for row in reader:
                    if not row or len(row) < 25:
                        continue

                    biz_type = row[col_biz_type] if len(row) > col_biz_type else ""
                    # Focus on eating & drinking establishments (飲食店営業, 喫茶店営業, 食肉販売, etc.)
                    if biz_type and "飲食店" not in biz_type and "喫茶店" not in biz_type and "営業" not in biz_type:
                        continue

                    facility_name = row[col_facility] if len(row) > col_facility else ""
                    corp_name = row[col_corp_name] if len(row) > col_corp_name else ""
                    corp_num_raw = row[col_corp_num] if len(row) > col_corp_num else ""
                    address = row[col_address] if len(row) > col_address else ""
                    phone = row[col_phone] if len(row) > col_phone else ""
                    lic_num = row[col_lic_num] if len(row) > col_lic_num else ""
                    lic_date = row[col_lic_date] if len(row) > col_lic_date else ""
                    biz_detail = row[col_biz_detail] if len(row) > col_biz_detail else ""

                    if not corp_name:
                        corp_name = facility_name
                    if not corp_name:
                        continue

                    clean_name, norm_name = clean_corp_name(corp_name)
                    pref_code = detect_prefecture(address, src["pref_code"])

                    # If corporate number is 13 digits
                    corp_num = corp_num_raw.strip() if corp_num_raw and len(corp_num_raw.strip()) == 13 and corp_num_raw.strip().isdigit() else None

                    specs = {
                        "facility_name": facility_name,
                        "business_type": biz_type or "飲食店営業",
                        "business_detail": biz_detail
                    }

                    records.append({
                        "corporate_number": corp_num,
                        "corp_name": corp_name,
                        "clean_name": clean_name,
                        "norm_name": norm_name,
                        "facility_name": facility_name,
                        "license_type": "飲食店営業許可",
                        "license_category": "飲食・フードサービス業",
                        "license_number": lic_num or f"食許-{facility_name}",
                        "issuing_authority": src["authority"],
                        "prefecture_code": pref_code,
                        "registered_address": address,
                        "office_phone": phone,
                        "issue_date": lic_date,
                        "specialties_json": json.dumps(specs, ensure_ascii=False)
                    })
                    count += 1

                print(f"[+] Extracted {count:,} records from {src['id']}")

        except Exception as e:
            print(f"[-] Error parsing {src['id']}: {e}")

    print(f"[+] Total Food/Restaurant records extracted: {len(records):,}")
    return records


# ==============================================================================
# 3. ENTITY RESOLUTION & DATABASE RESOLVER
# ==============================================================================

def resolve_and_persist(all_records):
    print("\n" + "=" * 80)
    print("RESOLVING & PERSISTING TO DATABASE (SQLite)")
    print("=" * 80)

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS company_licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        corporate_number TEXT NOT NULL,
        license_type TEXT NOT NULL,
        license_category TEXT NOT NULL,
        license_number TEXT NOT NULL,
        issuing_authority TEXT,
        prefecture_code TEXT,
        representative_name TEXT,
        office_phone TEXT,
        office_fax TEXT,
        registered_address TEXT,
        issue_date TEXT,
        valid_until TEXT,
        license_status TEXT DEFAULT '有効',
        specialties_json TEXT,
        source_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(corporate_number, license_type, license_number)
    );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_licenses_corp ON company_licenses(corporate_number);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_licenses_type_pref ON company_licenses(license_type, prefecture_code);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_licenses_cat_pref ON company_licenses(license_category, prefecture_code);")
    conn.commit()

    resolved_records = []
    matched_corp_nums = set()
    t0 = time.time()

    print(f"[*] Resolving {len(all_records):,} records against 5.07M companies...")

    for i, rec in enumerate(all_records):
        corp_num = rec.get("corporate_number")

        # If not already has 13-digit corporate number, perform indexed lookups
        if not corp_num:
            # 1. Exact match on clean_name + prefecture
            if rec["clean_name"]:
                cur.execute(
                    "SELECT corporate_number FROM companies WHERE company_name = ? AND prefecture_code = ? LIMIT 1",
                    (rec["clean_name"], rec["prefecture_code"])
                )
                row = cur.fetchone()
                if row:
                    corp_num = row[0]

            # 2. Match on norm_name + prefecture
            if not corp_num and rec["norm_name"]:
                cur.execute(
                    "SELECT corporate_number FROM companies WHERE company_name = ? AND prefecture_code = ? LIMIT 1",
                    (rec["norm_name"], rec["prefecture_code"])
                )
                row = cur.fetchone()
                if row:
                    corp_num = row[0]

            # 3. Match on facility_name + prefecture if facility is incorporated
            if not corp_num and rec.get("facility_name") and rec["facility_name"] != rec["clean_name"]:
                fn_clean, _ = clean_corp_name(rec["facility_name"])
                if fn_clean:
                    cur.execute(
                        "SELECT corporate_number FROM companies WHERE company_name = ? AND prefecture_code = ? LIMIT 1",
                        (fn_clean, rec["prefecture_code"])
                    )
                    row = cur.fetchone()
                    if row:
                        corp_num = row[0]

        if not corp_num:
            continue

        matched_corp_nums.add(corp_num)
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        resolved_records.append((
            corp_num,
            rec["license_type"],
            rec["license_category"],
            rec["license_number"],
            rec.get("issuing_authority"),
            rec["prefecture_code"],
            rec.get("representative_name"),
            rec.get("office_phone"),
            None,
            rec.get("registered_address"),
            rec.get("issue_date"),
            None,
            "VALID",
            rec.get("specialties_json"),
            "https://data.bodik.jp / municipal open data",
            now_ts,
            now_ts
        ))

        if i > 0 and i % 5000 == 0:
            print(f"[*] Processed {i:,}/{len(all_records):,} records... Matches: {len(resolved_records):,}")

    dt = time.time() - t0
    print(f"[+] Resolution complete in {dt:.1f}s: Found {len(resolved_records):,} corporate license matches!")

    # Insert into company_licenses
    if resolved_records:
        cur.executemany("""
        INSERT INTO company_licenses (
            corporate_number, license_type, license_category, license_number,
            issuing_authority, prefecture_code, representative_name, office_phone,
            office_fax, registered_address, issue_date, valid_until, license_status,
            specialties_json, source_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(corporate_number, license_type, license_number) DO UPDATE SET
            issuing_authority = COALESCE(excluded.issuing_authority, company_licenses.issuing_authority),
            representative_name = COALESCE(excluded.representative_name, company_licenses.representative_name),
            office_phone = COALESCE(excluded.office_phone, company_licenses.office_phone),
            registered_address = COALESCE(excluded.registered_address, company_licenses.registered_address),
            specialties_json = excluded.specialties_json,
            updated_at = excluded.updated_at;
        """, resolved_records)
        conn.commit()

        # Update has_license boolean in companies table
        corp_list = list(matched_corp_nums)
        for i in range(0, len(corp_list), 500):
            batch = corp_list[i:i+500]
            placeholders = ",".join(["?"] * len(batch))
            cur.execute(f"UPDATE companies SET has_license = 1 WHERE corporate_number IN ({placeholders})", batch)
        conn.commit()

        print(f"[+] Persisted {len(resolved_records):,} licenses to SQLite. Updated {len(matched_corp_nums):,} companies.")

    conn.close()
    return len(resolved_records)

def main():
    t0 = time.time()
    print("=" * 80)
    print("KIGYOU-LIST: HOSPITALITY (旅館業) & FOOD SERVICES (飲食店営業) HARVESTER")
    print(f"Started at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    ryokan_records = harvest_ryokan_hotels()
    food_records = harvest_food_restaurants()

    all_records = ryokan_records + food_records
    resolved_count = resolve_and_persist(all_records)

    # Sync delta licenses to VPS PostgreSQL
    print("\n" + "=" * 80)
    print("SYNCING DELTA TO VPS POSTGRESQL (kigyoulist.com)")
    print("=" * 80)
    try:
        sync_licenses()
        print("[+] VPS Delta sync complete!")
    except Exception as e:
        print(f"[-] VPS sync error: {e}")

    total_time = time.time() - t0
    print("\n" + "=" * 80)
    print(f"[SUCCESS] Finished in {total_time:.1f}s. Total resolved licenses added: {resolved_count:,}")
    print("=" * 80)

if __name__ == "__main__":
    main()
