#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
========================================================================================
KIGYOU-LIST: NTA OFFICIAL INVOICE ZENKEN BULK IMPORTER (国税庁 インボイス全件データ一括取込)
========================================================================================
Directly downloads official NTA Zenken CSV ZIP archives (all 5 files for corporations),
extracts all registered Invoice issuers (T-Numbers), and bulk merges them into:
  1. SQLite: nta_invoices & companies.has_invoice = 1
  2. VPS PostgreSQL: companies.has_invoice = true (using high-speed partition keys)
========================================================================================
"""

import os
import sys
import io
import csv
import time
import zipfile
import logging
import sqlite3
import argparse
import requests
import psycopg2
from psycopg2.extras import execute_values

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SQLITE_DB = os.path.join(PROJECT_ROOT, "kigyou-list.db")
PG_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")
SCRATCH_DIR = os.path.join(PROJECT_ROOT, "scratch", "nta_invoice")
os.makedirs(SCRATCH_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("NTA_Invoice_Zenken")

# NTA Zenken File IDs for 法人 (Corporations - 5 files covering all 47 prefectures)
ZENKEN_FILES = [
    {"id": "5176", "part": "001", "name": "Hokkaido & Tohoku (北海道・東北)"},
    {"id": "5175", "part": "002", "name": "Kanto (Tokyo, Kanagawa, etc. 関東)"},
    {"id": "5181", "part": "003", "name": "Chubu (Aichi, Shizuoka, etc. 中部)"},
    {"id": "5178", "part": "004", "name": "Kinki (Osaka, Hyogo, Kyoto, etc. 近畿)"},
    {"id": "5185", "part": "005", "name": "Chugoku, Shikoku & Kyushu (中国・四国・九州・沖縄)"}
]

def get_sqlite_conn():
    conn = sqlite3.connect(SQLITE_DB, timeout=120.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=120000;")
    return conn

def init_tables(conn_sq):
    cur = conn_sq.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS nta_invoices (
            corporate_number TEXT PRIMARY KEY,
            registration_number TEXT NOT NULL,
            prefecture_code TEXT,
            effective_date TEXT,
            update_date TEXT,
            address TEXT,
            is_valid INTEGER DEFAULT 1,
            synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_nta_inv_pref ON nta_invoices(prefecture_code);")
    conn_sq.commit()

def download_and_import_zenken():
    logger.info("=" * 80)
    logger.info(">>> [NTA INVOICE ZENKEN] DOWNLOADING OFFICIAL BULK CSV FILES FROM NTA <<<")
    logger.info("=" * 80)

    conn_sq = get_sqlite_conn()
    init_tables(conn_sq)
    cur_sq = conn_sq.cursor()

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    })

    # Warmup session cookie
    try:
        session.get("https://www.invoice-kohyo.nta.go.jp/download/zenken", timeout=20)
    except Exception as e:
        logger.warning(f"Session warmup note: {e}")

    total_invoices_saved = 0
    t0_all = time.time()

    insert_sql = """
        INSERT OR REPLACE INTO nta_invoices (
            corporate_number, registration_number, prefecture_code,
            effective_date, update_date, address, is_valid
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
    """

    for item in ZENKEN_FILES:
        fil_id = item["id"]
        part = item["part"]
        desc = item["name"]

        url = f"https://www.invoice-kohyo.nta.go.jp/download/zenken/dlfile?dlFilKanriNo={fil_id}&jinkakukbn=2&type=01"
        zip_path = os.path.join(SCRATCH_DIR, f"h_all_csv_{part}.zip")

        logger.info(f"\n[*] Downloading Zenken Part {part}/005 ({desc})...")
        t0 = time.time()

        if not os.path.exists(zip_path) or os.path.getsize(zip_path) < 1000000:
            resp = session.get(url, stream=True, timeout=120)
            if resp.status_code != 200:
                logger.error(f"[-] Failed to download file {fil_id} (HTTP {resp.status_code})")
                continue
            with open(zip_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=65536):
                    f.write(chunk)
            dl_sec = time.time() - t0
            logger.info(f"    ✓ Downloaded {os.path.getsize(zip_path)/(1024*1024):.1f} MB in {dl_sec:.2f}s.")
        else:
            logger.info(f"    ✓ Using cached archive: {zip_path} ({os.path.getsize(zip_path)/(1024*1024):.1f} MB)")

        # Unpack and parse CSV directly from ZIP stream
        try:
            with zipfile.ZipFile(zip_path, "r") as z:
                csv_files = [n for n in z.namelist() if n.endswith(".csv")]
                if not csv_files:
                    logger.warning(f"[-] No CSV found in {zip_path}")
                    continue
                csv_name = csv_files[0]
                logger.info(f"    Parsing {csv_name}...")

                with z.open(csv_name) as f_in:
                    text_stream = io.TextIOWrapper(f_in, encoding="utf-8-sig", errors="replace")
                    reader = csv.reader(text_stream)

                    batch = []
                    part_count = 0

                    for row in reader:
                        if not row or len(row) < 12:
                            continue
                        t_num = row[1].strip()
                        if not t_num.startswith("T") or len(t_num) != 14:
                            continue
                        corp_num = t_num[1:]
                        pref_code = row[2].strip() if len(row) > 2 else None
                        eff_date = row[7].strip() if len(row) > 7 else None
                        upd_date = row[8].strip() if len(row) > 8 else None
                        address = row[11].strip() if len(row) > 11 else ""

                        # disposalDate (row[9]) or expireDate (row[10])
                        disp_date = row[9].strip() if len(row) > 9 else ""
                        is_valid = 0 if disp_date else 1

                        batch.append((corp_num, t_num, pref_code, eff_date, upd_date, address, is_valid))
                        part_count += 1

                        if len(batch) >= 25000:
                            cur_sq.execute("BEGIN TRANSACTION;")
                            cur_sq.executemany(insert_sql, batch)
                            cur_sq.execute("COMMIT;")
                            batch.clear()

                    if batch:
                        cur_sq.execute("BEGIN TRANSACTION;")
                        cur_sq.executemany(insert_sql, batch)
                        cur_sq.execute("COMMIT;")
                        batch.clear()

                    total_invoices_saved += part_count
                    logger.info(f"    ✓ Imported {part_count:,} records from Part {part} (Total: {total_invoices_saved:,})")

        except Exception as e:
            logger.error(f"[-] Error processing {zip_path}: {e}", exc_info=True)

    # Update has_invoice = 1 for companies in SQLite
    logger.info("\n[*] Updating has_invoice = 1 in SQLite companies table...")
    cur_sq.execute("""
        UPDATE companies
        SET has_invoice = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE (has_invoice IS NULL OR has_invoice = 0)
          AND corporate_number IN (
              SELECT corporate_number 
              FROM nta_invoices 
              WHERE is_valid = 1
          );
    """)
    sqlite_updated = cur_sq.rowcount
    conn_sq.commit()
    logger.info(f"[+] Local SQLite: Updated {sqlite_updated:,} companies to has_invoice = 1.")

    cur_sq.execute("SELECT COUNT(*) FROM nta_invoices WHERE is_valid = 1;")
    total_valid = cur_sq.fetchone()[0]
    conn_sq.close()

    elapsed_all = time.time() - t0_all
    logger.info("=" * 80)
    logger.info(f"[+] NTA INVOICE ZENKEN MERGE COMPLETE in {elapsed_all:.2f}s!")
    logger.info(f"[+] Total Active Certified Invoices in Master Table: {total_valid:,}")
    logger.info("=" * 80)
    return total_valid

def sync_to_vps_pg():
    """Pushes has_invoice = true to VPS PostgreSQL using high-speed partition batches."""
    logger.info("=" * 80)
    logger.info(">>> [VPS SYNC] PUSHING T-NUMBER CERTIFICATIONS TO POSTGRESQL VPS <<<")
    logger.info("=" * 80)

    conn_sq = get_sqlite_conn()
    cur_sq = conn_sq.cursor()

    cur_sq.execute("""
        SELECT corporate_number, prefecture_code
        FROM nta_invoices
        WHERE is_valid = 1
          AND prefecture_code IS NOT NULL;
    """)
    rows = cur_sq.fetchall()
    conn_sq.close()
    logger.info(f"[*] Loaded {len(rows):,} valid invoices with prefecture keys from SQLite.")

    conn_pg = psycopg2.connect(PG_URL, connect_timeout=20)
    cur_pg = conn_pg.cursor()

    batch_size = 20000
    total_batches = (len(rows) + batch_size - 1) // batch_size
    t0 = time.time()
    total_updated = 0

    update_sql = """
        UPDATE companies AS c
        SET has_invoice = true,
            updated_at = CURRENT_TIMESTAMP
        FROM (VALUES %s) AS v(corp_num, pref_code)
        WHERE c.prefecture_code = v.pref_code
          AND c.corporate_number = v.corp_num
          AND (c.has_invoice IS NULL OR c.has_invoice = false);
    """

    for b_idx in range(total_batches):
        chunk = rows[b_idx * batch_size : (b_idx + 1) * batch_size]
        execute_values(cur_pg, update_sql, chunk)
        conn_pg.commit()
        total_updated += len(chunk)

        pct = ((b_idx + 1) / total_batches) * 100
        speed = total_updated / (time.time() - t0) if time.time() > t0 else 0
        logger.info(f"  Batch {b_idx + 1}/{total_batches} ({pct:.1f}%) | Synced: {total_updated:,} | Speed: {speed:.0f} rows/sec")

    cur_pg.execute("SELECT COUNT(*) FROM companies WHERE has_invoice = true;")
    vps_total = cur_pg.fetchone()[0]

    cur_pg.close()
    conn_pg.close()

    logger.info("=" * 80)
    logger.info(f"[+] VPS T-NUMBER INVOICE SYNC COMPLETE in {time.time() - t0:.2f}s!")
    logger.info(f"[+] Total Companies on VPS with has_invoice = true: {vps_total:,}")
    logger.info("=" * 80)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NTA Official Invoice Zenken Importer")
    parser.add_argument("--vps-sync", action="store_true", help="Push to VPS PostgreSQL after local merge")
    args = parser.parse_args()

    download_and_import_zenken()
    if args.vps_sync:
        sync_to_vps_pg()
