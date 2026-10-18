#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Migration: Add boolean signal and contact flags directly to 'companies' table
and create partial indexes for 10x - 100x search speedup.
"""

import psycopg2
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def run_migration():
    print("🚀 Starting Database Optimization Migration on PostgreSQL 16...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Add boolean columns to companies if they don't exist
    columns = [
        ("has_hiring", "BOOLEAN DEFAULT false"),
        ("has_subsidy", "BOOLEAN DEFAULT false"),
        ("has_bidding", "BOOLEAN DEFAULT false"),
        ("has_award", "BOOLEAN DEFAULT false"),
        ("has_certification", "BOOLEAN DEFAULT false"),
        ("has_patent", "BOOLEAN DEFAULT false"),
        ("has_contact_form", "BOOLEAN DEFAULT false"),
        ("has_email", "BOOLEAN DEFAULT false"),
        ("has_phone", "BOOLEAN DEFAULT false"),
        ("has_website", "BOOLEAN DEFAULT false"),
        ("has_fax", "BOOLEAN DEFAULT false")
    ]

    print("\n--- STEP 1: Add Columns to 'companies' ---")
    for col_name, col_type in columns:
        t0 = time.time()
        cur.execute(f"ALTER TABLE companies ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
        print(f"  ✅ Added/Verified column '{col_name}' ({col_type}) in {(time.time() - t0)*1000:.2f}ms")

    # 2. Backfill Signals from company_signal_flags
    print("\n--- STEP 2: Backfill Signals from company_signal_flags ---")
    signals = ["has_hiring", "has_subsidy", "has_bidding", "has_award", "has_certification", "has_patent"]
    for s in signals:
        t0 = time.time()
        print(f"  Backfilling {s}...")
        cur.execute(f"""
            UPDATE companies c
            SET {s} = true
            FROM company_signal_flags csf
            WHERE c.corporate_number = csf.corporate_number
              AND csf.{s} = true
              AND (c.{s} IS NULL OR c.{s} = false);
        """)
        updated_rows = cur.rowcount
        print(f"  ✅ {s}: {updated_rows:,} companies updated in {time.time() - t0:.2f}s")

    # 3. Backfill Contact Presence Flags from existing columns
    print("\n--- STEP 3: Backfill Contact Presence Flags ---")
    contact_updates = [
        ("has_contact_form", "contact_form_url IS NOT NULL AND contact_form_url != ''"),
        ("has_email", "email_address IS NOT NULL AND email_address != ''"),
        ("has_phone", "phone_number IS NOT NULL AND phone_number != ''"),
        ("has_website", "website_url IS NOT NULL AND website_url != ''"),
        ("has_fax", "fax_number IS NOT NULL AND fax_number != ''")
    ]
    for flag, condition in contact_updates:
        t0 = time.time()
        print(f"  Backfilling {flag}...")
        cur.execute(f"""
            UPDATE companies
            SET {flag} = true
            WHERE {condition}
              AND ({flag} IS NULL OR {flag} = false);
        """)
        updated_rows = cur.rowcount
        print(f"  ✅ {flag}: {updated_rows:,} companies updated in {time.time() - t0:.2f}s")

    # 4. Create Partial Indexes on 'companies'
    print("\n--- STEP 4: Create Fast Partial Covering Indexes ---")
    indexes = [
        ("idx_comp_hiring_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_hiring = true)"),
        ("idx_comp_subsidy_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_subsidy = true)"),
        ("idx_comp_bidding_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_bidding = true)"),
        ("idx_comp_patent_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_patent = true)"),
        ("idx_comp_cert_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_certification = true)"),
        ("idx_comp_award_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_award = true)"),
        ("idx_comp_form_fast", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_contact_form = true)"),
        ("idx_comp_email_fast", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_email = true)")
    ]

    for idx_name, idx_def in indexes:
        t0 = time.time()
        print(f"  Creating {idx_name}...")
        try:
            cur.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} {idx_def};")
            print(f"  ✅ {idx_name} created in {time.time() - t0:.2f}s")
        except Exception as e:
            print(f"  ⚠️ Note on {idx_name}: {e}")

    conn.close()
    print("\n🎉 MIGRATION COMPLETED SUCCESSFULLY!")

if __name__ == '__main__':
    run_migration()
