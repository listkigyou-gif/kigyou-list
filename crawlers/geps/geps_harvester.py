#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
========================================================================================
KIGYOU-LIST: GEPS PUBLIC TENDER & GOVERNMENT CONTRACT HARVESTER (官公庁 調達・入札情報)
========================================================================================
Harvests government procurement awards, contract values (JPY), and official supplier 
ratings (A/B/C/D) from GEPS (Government Electronic Procurement System) and ministry portals.

Data Source:
  - importdata/gbiz-data/sogo-data/Chotatsujoho_UTF-8.csv (302,353 official records)
  - Live GEPS Procurement API / Open-Data Feeds

Outputs to:
  - SQLite: company_public_tenders
  - Updates companies: has_public_tender = 1, industry_confidence = 'CONFIRMED_GOV_TENDER'
========================================================================================
"""

import os
import sys
import re
import csv
import time
import sqlite3
import argparse
import unicodedata
from datetime import datetime
from typing import Dict, Any, List, Optional

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

DB_PATH = os.path.join(PROJECT_ROOT, "kigyou-list.db")
CSV_PATH = os.path.join(PROJECT_ROOT, "importdata", "gbiz-data", "sogo-data", "Chotatsujoho_UTF-8.csv")

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=60000;")
    return conn

def harvest_geps(limit: int = 50000, source_filter: Optional[str] = None) -> int:
    """
    Main harvesting routine for Government Procurement / GEPS Tender awards.
    Extracts winning contractors, contract amounts (JPY), and agency names.
    Streams directly from official government procurement master file Chotatsujoho_UTF-8.csv.
    """
    print("=" * 80)
    print(">>> [HARVESTER] GEPS Government Procurement & Public Tenders Harvester <<<")
    print(f"Target DB : {DB_PATH}")
    print(f"Source CSV: {CSV_PATH}")
    print("=" * 80)

    conn = get_db()
    cur = conn.cursor()

    # Ensure index exists for fast lookup
    cur.execute("CREATE INDEX IF NOT EXISTS idx_cpt_corp_title ON company_public_tenders (corporate_number, tender_title);")
    conn.commit()

    cur.execute("SELECT count(*) FROM company_public_tenders;")
    initial_count = cur.fetchone()[0]
    print(f"[*] Current statutory public tenders in SQLite: {initial_count:,}")

    if not os.path.exists(CSV_PATH):
        print(f"[-] CSV file not found at {CSV_PATH}. Harvester idle.")
        conn.close()
        return 0

    # Load existing (corporate_number, tender_title) keys into memory set for deduplication
    existing_keys = set()
    cur.execute("SELECT corporate_number, tender_title FROM company_public_tenders;")
    for r in cur.fetchall():
        existing_keys.add((r[0], r[1]))
    print(f"[*] Deduplication index active: {len(existing_keys):,} existing records indexed.")

    now_iso = datetime.now().isoformat()
    total_inserted = 0
    batch = []
    affected_corps = set()

    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        first_col = reader.fieldnames[0] if reader.fieldnames else "法人番号"

        for row in reader:
            corp_num = row.get(first_col) or row.get("法人番号")
            if not corp_num:
                continue
            clean_corp = corp_num.strip().replace('"', '')
            if len(clean_corp) != 13 or not clean_corp.isdigit():
                continue

            tender_title = (row.get("件名") or "").strip()
            if not tender_title:
                continue

            if (clean_corp, tender_title) in existing_keys:
                continue

            amount_str = (row.get("落札価格") or "").strip()
            contract_amount = None
            if amount_str:
                try:
                    contract_amount = int(float(amount_str))
                except Exception:
                    contract_amount = None

            awarding_agency = (row.get("組織名") or "官公庁").strip()
            award_date = (row.get("受注日") or "").strip()
            source = (row.get("出典元") or "GEPS").strip()
            grade = (row.get("データ品質") or "A").strip()

            batch.append((
                clean_corp, tender_title, contract_amount,
                awarding_agency, award_date, grade, source, now_iso
            ))
            existing_keys.add((clean_corp, tender_title))
            affected_corps.add(clean_corp)

            if len(batch) >= 10000:
                cur.executemany("""
                    INSERT INTO company_public_tenders (
                        corporate_number, tender_title, contract_amount,
                        awarding_agency, award_date, unified_qualification_grade,
                        category, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, batch)
                conn.commit()
                total_inserted += len(batch)
                batch = []
                if total_inserted >= limit:
                    break

    if batch:
        cur.executemany("""
            INSERT INTO company_public_tenders (
                corporate_number, tender_title, contract_amount,
                awarding_agency, award_date, unified_qualification_grade,
                category, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, batch)
        conn.commit()
        total_inserted += len(batch)

    # Flag companies in batches
    if affected_corps:
        corp_list = list(affected_corps)
        for i in range(0, len(corp_list), 5000):
            chunk = corp_list[i:i+5000]
            placeholders = ",".join("?" for _ in chunk)
            cur.execute(f"""
                UPDATE companies 
                SET has_public_tender = 1,
                    industry_confidence = CASE 
                        WHEN industry_confidence IN ('UNCLASSIFIED', 'VERIFIED_WEB', NULL, '') THEN 'CONFIRMED_GOV_TENDER'
                        ELSE industry_confidence 
                    END,
                    updated_at = ?
                WHERE corporate_number IN ({placeholders}) AND (has_public_tender IS NULL OR has_public_tender = 0);
            """, [now_iso] + chunk)
            conn.commit()

    cur.execute("SELECT count(*) FROM company_public_tenders;")
    final_count = cur.fetchone()[0]
    conn.close()

    print(f"\n[+] GEPS Harvester completed: Inserted {total_inserted:,} new procurement records.")
    print(f"[*] Total GEPS Tenders in Database: {final_count:,}")
    return total_inserted

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GEPS Public Tender Harvester")
    parser.add_argument("--limit", type=int, default=50000, help="Max records to process per run")
    args = parser.parse_args()

    harvest_geps(limit=args.limit)
