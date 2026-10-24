#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Kigyou-list Database V2 Refactor & Sanitation Engine
- Zero Downtime: Upgrades PostgreSQL VPS and SQLite Local in-place without table dropping.
- Cleanses dirty data (strings like '-', 'None', 'null' to real NULL).
- Adds and backfills Faceted Boolean Flags and Range IDs.
- Creates Partial Covering Indexes for sub-10ms search performance.
"""

import sys
import os
import time
import argparse
import psycopg2
from psycopg2.extras import execute_values
import sqlite3

sys.stdout.reconfigure(encoding='utf-8')

DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"
LOCAL_SQLITE = "c:\\kigyou-list\\kigyou-list.db"

FLAG_COLUMNS = [
    ("has_phone", "BOOLEAN DEFAULT false"),
    ("has_email", "BOOLEAN DEFAULT false"),
    ("has_website", "BOOLEAN DEFAULT false"),
    ("has_contact_form", "BOOLEAN DEFAULT false"),
    ("has_invoice", "BOOLEAN DEFAULT false"),
    ("has_license", "BOOLEAN DEFAULT false"),
    ("has_construction_lic", "BOOLEAN DEFAULT false"),
    ("has_real_estate_lic", "BOOLEAN DEFAULT false"),
    ("has_kobutsu_lic", "BOOLEAN DEFAULT false"),
    ("has_haken_lic", "BOOLEAN DEFAULT false"),
    ("has_shokugyo_lic", "BOOLEAN DEFAULT false"),
    ("has_financial_report", "BOOLEAN DEFAULT false"),
    ("has_public_tender", "BOOLEAN DEFAULT false"),
    ("capital_range_id", "SMALLINT DEFAULT 0"),
    ("employee_range_id", "SMALLINT DEFAULT 0"),
    ("avg_salary_range_id", "SMALLINT DEFAULT 0")
]

SQLITE_COLUMNS = [
    ("has_phone", "INTEGER DEFAULT 0"),
    ("has_email", "INTEGER DEFAULT 0"),
    ("has_website", "INTEGER DEFAULT 0"),
    ("has_contact_form", "INTEGER DEFAULT 0"),
    ("has_invoice", "INTEGER DEFAULT 0"),
    ("has_license", "INTEGER DEFAULT 0"),
    ("has_construction_lic", "INTEGER DEFAULT 0"),
    ("has_real_estate_lic", "INTEGER DEFAULT 0"),
    ("has_kobutsu_lic", "INTEGER DEFAULT 0"),
    ("has_haken_lic", "INTEGER DEFAULT 0"),
    ("has_shokugyo_lic", "INTEGER DEFAULT 0"),
    ("has_financial_report", "INTEGER DEFAULT 0"),
    ("has_public_tender", "INTEGER DEFAULT 0"),
    ("capital_range_id", "INTEGER DEFAULT 0"),
    ("employee_range_id", "INTEGER DEFAULT 0"),
    ("avg_salary_range_id", "INTEGER DEFAULT 0")
]


def upgrade_vps():
    print("\n=======================================================")
    print("🚀 NÂNG CẤP VÀ LÀM SẠCH DATABASE POSTGRESQL (VPS PRODUCTION)")
    print("=======================================================")
    t_start = time.time()
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Thêm cột cờ Boolean Flags
    print("\n[Bước 1/5] Thêm cột Cờ Boolean Flags & Phân khúc Range IDs...")
    for col_name, col_type in FLAG_COLUMNS:
        t0 = time.time()
        cur.execute(f"ALTER TABLE companies ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
        print(f"  + Cột '{col_name}' ({col_type}): {(time.time() - t0)*1000:.1f}ms")

    # 2. Tạo bảng vệ tinh chuẩn
    print("\n[Bước 2/5] Đảm bảo cấu trúc Bảng Vệ tinh chuẩn...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS company_financials (
            id BIGSERIAL PRIMARY KEY,
            corporate_number VARCHAR(13) NOT NULL,
            fiscal_year VARCHAR(10) NOT NULL,
            revenue BIGINT,
            operating_income BIGINT,
            net_income BIGINT,
            avg_annual_salary INTEGER,
            avg_age NUMERIC(4, 1),
            avg_service_years NUMERIC(4, 1),
            employee_count INTEGER,
            source VARCHAR(50) DEFAULT 'EDINET',
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_comp_financial UNIQUE(corporate_number, fiscal_year)
        );
        CREATE INDEX IF NOT EXISTS idx_fin_corp ON company_financials (corporate_number, fiscal_year DESC);

        CREATE TABLE IF NOT EXISTS company_public_tenders (
            id BIGSERIAL PRIMARY KEY,
            corporate_number VARCHAR(13) NOT NULL,
            tender_title TEXT NOT NULL,
            contract_amount BIGINT,
            awarding_agency TEXT NOT NULL,
            award_date DATE NOT NULL,
            unified_qualification_grade VARCHAR(10),
            category VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_tenders_corp ON company_public_tenders (corporate_number, award_date DESC);
    """)
    print("  + Bảng company_financials & company_public_tenders đã sẵn sàng!")

    # 3. Làm sạch dữ liệu bẩn (Sanitize dirty strings to NULL)
    print("\n[Bước 3/5] Làm sạch Dữ liệu Bẩn (Data Sanitation)...")
    dirty_rules = [
        ("phone_number", "phone_number IN ('', '-', 'None', 'null', '未登録', 'なし', '未設定')"),
        ("email_address", "email_address IN ('', '-', 'None', 'null', '未登録', 'なし', '未設定')"),
        ("website_url", "website_url IN ('', '-', 'None', 'null', '未登録', 'なし', '未設定')"),
        ("contact_form_url", "contact_form_url IN ('', '-', 'None', 'null', '未登録', 'なし', '未設定')")
    ]
    for col, cond in dirty_rules:
        t0 = time.time()
        cur.execute(f"UPDATE companies SET {col} = NULL WHERE {cond};")
        print(f"  + Sanitize {col}: {cur.rowcount:,} chuỗi rác đã chuyển thành NULL trong {time.time() - t0:.2f}s")

    # 4. Tính toán và bật cờ hàng loạt (Batch Backfill Flags)
    print("\n[Bước 4/5] Tính toán và Bật Cờ Hàng Loạt (Fast Backfill)...")
    
    # 4.1 Contact Flags
    contact_flags = [
        ("has_phone", "phone_number IS NOT NULL AND phone_number != ''"),
        ("has_email", "email_address IS NOT NULL AND email_address != ''"),
        ("has_website", "website_url IS NOT NULL AND website_url != ''"),
        ("has_contact_form", "contact_form_url IS NOT NULL AND contact_form_url != ''")
    ]
    for flag, cond in contact_flags:
        t0 = time.time()
        print(f"  Đang bật cờ {flag}...")
        cur.execute(f"""
            UPDATE companies 
            SET {flag} = true 
            WHERE {cond} AND ({flag} IS NULL OR {flag} = false);
        """)
        print(f"  ✅ {flag}: {cur.rowcount:,} công ty được bật cờ trong {time.time() - t0:.2f}s")

    # 4.2 License Flags từ bảng company_licenses
    t0 = time.time()
    print("  Đang bật cờ Giấy phép Tổng quát (has_license)...")
    cur.execute("""
        UPDATE companies c
        SET has_license = true
        FROM (SELECT DISTINCT corporate_number FROM company_licenses) l
        WHERE c.corporate_number = l.corporate_number
          AND (c.has_license IS NULL OR c.has_license = false);
    """)
    print(f"  ✅ has_license: {cur.rowcount:,} công ty có giấy phép trong {time.time() - t0:.2f}s")

    lic_subtypes = [
        ("has_construction_lic", "建設業許可"),
        ("has_real_estate_lic", "宅地建物取引業"),
        ("has_kobutsu_lic", "古物商許可"),
        ("has_haken_lic", "労働者派遣事業"),
        ("has_shokugyo_lic", "有料職業紹介事業")
    ]
    for flag, lic_type in lic_subtypes:
        t0 = time.time()
        print(f"  Đang bật cờ phân loại {flag} ({lic_type})...")
        cur.execute(f"""
            UPDATE companies c
            SET {flag} = true
            FROM (SELECT DISTINCT corporate_number FROM company_licenses WHERE license_type = '{lic_type}') l
            WHERE c.corporate_number = l.corporate_number
              AND ({flag} IS NULL OR {flag} = false);
        """)
        print(f"  ✅ {flag} ({lic_type}): {cur.rowcount:,} công ty trong {time.time() - t0:.2f}s")

    # 4.3 Range IDs (Capital & Employees)
    print("  Đang phân loại capital_range_id...")
    t0 = time.time()
    cur.execute("""
        UPDATE companies SET capital_range_id = 
            CASE 
                WHEN capital_amount > 0 AND capital_amount < 10000000 THEN 1
                WHEN capital_amount >= 10000000 AND capital_amount < 50000000 THEN 2
                WHEN capital_amount >= 50000000 AND capital_amount < 100000000 THEN 3
                WHEN capital_amount >= 100000000 THEN 4
                ELSE 0
            END
        WHERE capital_amount IS NOT NULL AND capital_amount > 0 AND capital_range_id = 0;
    """)
    print(f"  ✅ capital_range_id: {cur.rowcount:,} công ty trong {time.time() - t0:.2f}s")

    print("  Đang phân loại employee_range_id...")
    t0 = time.time()
    cur.execute("""
        UPDATE companies SET employee_range_id = 
            CASE 
                WHEN employee_count >= 1 AND employee_count <= 10 THEN 1
                WHEN employee_count > 10 AND employee_count <= 50 THEN 2
                WHEN employee_count > 50 AND employee_count <= 300 THEN 3
                WHEN employee_count > 300 THEN 4
                ELSE 0
            END
        WHERE employee_count IS NOT NULL AND employee_count > 0 AND employee_range_id = 0;
    """)
    print(f"  ✅ employee_range_id: {cur.rowcount:,} công ty trong {time.time() - t0:.2f}s")

    # 5. Xây dựng Chỉ mục Partial Covering Indexes Siêu Tốc
    print("\n[Bước 5/5] Xây dựng Chỉ mục Partial Covering Indexes...")
    indexes = [
        ("idx_comp_phone_pref", "ON companies (prefecture_code) WHERE (has_phone = true)"),
        ("idx_comp_email_pref", "ON companies (prefecture_code) WHERE (has_email = true)"),
        ("idx_comp_website_pref", "ON companies (prefecture_code) WHERE (has_website = true)"),
        ("idx_comp_license_pref", "ON companies (prefecture_code) WHERE (has_license = true)"),
        ("idx_comp_construction_pref", "ON companies (prefecture_code) WHERE (has_construction_lic = true)"),
        ("idx_comp_takken_pref", "ON companies (prefecture_code) WHERE (has_real_estate_lic = true)"),
        ("idx_comp_kobutsu_pref", "ON companies (prefecture_code) WHERE (has_kobutsu_lic = true)"),
        ("idx_comp_cap_range", "ON companies (capital_range_id, prefecture_code)"),
        ("idx_comp_emp_range", "ON companies (employee_range_id, prefecture_code)")
    ]
    for idx_name, idx_def in indexes:
        t0 = time.time()
        print(f"  Tạo chỉ mục {idx_name}...")
        try:
            cur.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} {idx_def};")
            print(f"  ✅ {idx_name} hoàn tất trong {time.time() - t0:.2f}s")
        except Exception as e:
            print(f"  ⚠️ Lưu ý {idx_name}: {e}")

    # Chạy Analyze
    print("\n⚡ Chạy ANALYZE companies để cập nhật bộ tối ưu hóa truy vấn PostgreSQL...")
    t0 = time.time()
    cur.execute("ANALYZE companies;")
    print(f"  ✅ ANALYZE hoàn tất trong {time.time() - t0:.2f}s")

    conn.close()
    print(f"\n🎉 HOÀN TẤT NÂNG CẤP VPS PRODUCTION TRONG {time.time() - t_start:.2f} GIÂY!")


def upgrade_local_sqlite():
    if not os.path.exists(LOCAL_SQLITE):
        print(f"Local SQLite not found at {LOCAL_SQLITE}, skipping.")
        return

    print("\n=======================================================")
    print("🛠️ ĐỒNG BỘ CẤU TRÚC VÀ CỜ LÊN SQLITE LOCAL")
    print("=======================================================")
    conn = sqlite3.connect(LOCAL_SQLITE)
    cur = conn.cursor()

    # 1. Thêm cột cờ
    cur.execute("PRAGMA table_info(companies);")
    existing_cols = {r[1] for r in cur.fetchall()}
    
    for col_name, col_type in SQLITE_COLUMNS:
        if col_name not in existing_cols:
            print(f"  + Thêm cột '{col_name}' ({col_type}) vào SQLite...")
            cur.execute(f"ALTER TABLE companies ADD COLUMN {col_name} {col_type};")

    # 2. Tạo bảng vệ tinh
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS company_financials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            corporate_number TEXT NOT NULL,
            fiscal_year TEXT NOT NULL,
            revenue INTEGER,
            operating_income INTEGER,
            net_income INTEGER,
            avg_annual_salary INTEGER,
            avg_age REAL,
            avg_service_years REAL,
            employee_count INTEGER,
            source TEXT DEFAULT 'EDINET',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(corporate_number, fiscal_year)
        );
        CREATE TABLE IF NOT EXISTS company_public_tenders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            corporate_number TEXT NOT NULL,
            tender_title TEXT NOT NULL,
            contract_amount INTEGER,
            awarding_agency TEXT NOT NULL,
            award_date TEXT NOT NULL,
            unified_qualification_grade TEXT,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 3. Tạo bảng company_licenses nếu chưa có trên SQLite
    cur.execute("""
        CREATE TABLE IF NOT EXISTS company_licenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            corporate_number TEXT NOT NULL,
            license_type TEXT NOT NULL,
            license_number TEXT NOT NULL,
            representative_name TEXT,
            valid_until TEXT,
            issue_date TEXT,
            authority TEXT,
            prefecture TEXT,
            raw_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(corporate_number, license_type, license_number)
        );
    """)

    conn.commit()
    conn.close()
    print("🎉 Hoàn tất cấu trúc SQLite Local!")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Kigyou-list V2 Refactor & Sanitation Engine")
    parser.add_argument("--target", choices=["all", "vps", "local"], default="all")
    args = parser.parse_args()

    if args.target in ["all", "vps"]:
        upgrade_vps()
    if args.target in ["all", "local"]:
        upgrade_local_sqlite()
