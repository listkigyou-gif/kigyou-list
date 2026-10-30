#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
========================================================================================
KIGYOU-LIST: NTA INVOICE DAILY DIFF WORKER (国税庁 インボイス公表 差分自動取込)
========================================================================================
Runs every business morning (06:30 JST) on Production Cloud VPS.
1. Connects to official NTA Sabun Portal (https://www.invoice-kohyo.nta.go.jp/download/sabun)
2. Extracts latest daily diff ZIP (10KB - 50KB) published after 06:00 JST.
3. Streams CSV in-memory, updating PostgreSQL nta_invoices & companies.has_invoice.
4. Returns updated corporate numbers for instant Hub & Spoke Indexing.
========================================================================================
"""

import os
import sys
import io
import re
import csv
import time
import zipfile
import requests
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, date, timedelta

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PG_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list")
PORTAL_URL = "https://www.invoice-kohyo.nta.go.jp/download/sabun"
DOWNLOAD_BASE = "https://www.invoice-kohyo.nta.go.jp/download/sabun/dlfile"

# ======================================================================================
# AGENT 1: JAPAN HOLIDAY SENTINEL ENGINE (Nhận diện lịch làm việc & ngày nghỉ Nhật Bản)
# ======================================================================================

def get_nth_monday(year, month, n):
    """Lấy ngày của Thứ Hai lần thứ n trong tháng"""
    first_day = date(year, month, 1)
    days_until_monday = (0 - first_day.weekday()) % 7
    first_monday = 1 + days_until_monday
    return first_monday + (n - 1) * 7

def get_vernal_equinox(year):
    """Ngày Xuân phân (20 hoặc 21 tháng 3)"""
    return int(20.8431 + 0.242194 * (year - 1980) - int((year - 1980)/4))

def get_autumn_equinox(year):
    """Ngày Thu phân (22 hoặc 23 tháng 9)"""
    return int(23.2488 + 0.242194 * (year - 1980) - int((year - 1980)/4))

def get_japan_holidays(year):
    """Danh sách ngày Quốc lễ Nhật Bản (祝日) kèm ngày nghỉ bù (振替休日)"""
    holidays = {}
    fixed = [
        (1, 1, "元日"),
        (2, 11, "建国記念の日"),
        (2, 23, "天皇誕生日"),
        (3, get_vernal_equinox(year), "春分の日"),
        (4, 29, "昭和の日"),
        (5, 3, "憲法記念日"),
        (5, 4, "みどりの日"),
        (5, 5, "こどもの日"),
        (7, get_nth_monday(year, 7, 3), "海の日"),
        (8, 11, "山の日"),
        (9, get_nth_monday(year, 9, 3), "敬老の日"),
        (9, get_autumn_equinox(year), "秋分の日"),
        (10, get_nth_monday(year, 10, 2), "スポーツの日"),
        (11, 3, "文化の日"),
        (11, 23, "勤労感謝の日"),
        (1, get_nth_monday(year, 1, 2), "成人の日"),
    ]
    for m, d, name in fixed:
        dt = date(year, m, d)
        holidays[dt] = name
        # Nghỉ bù nếu rơi vào Chủ Nhật
        if dt.weekday() == 6:
            sub = dt + timedelta(days=1)
            holidays[sub] = f"{name} (振替休日)"
    return holidays

def is_japan_business_day(d=None):
    """
    Kiểm tra xem ngày chỉ định có phải ngày làm việc chính thức của cơ quan công quyền Nhật Bản không.
    Tuân thủ đúng định nghĩa NTA: Ngoại trừ Thứ Bảy, Chủ Nhật, Ngày Lễ (祝日) và Tết (12/29 - 01/03).
    """
    if d is None:
        d = (datetime.utcnow() + timedelta(hours=9)).date()
    elif isinstance(d, datetime):
        d = d.date()

    # 1. Cuối tuần
    if d.weekday() == 5:
        return False, "Thứ Bảy (Cuối tuần)"
    if d.weekday() == 6:
        return False, "Chủ Nhật (Cuối tuần)"

    # 2. Kỳ nghỉ Tết cuối năm / đầu năm (12/29 - 01/03)
    if (d.month == 12 and d.day >= 29) or (d.month == 1 and d.day <= 3):
        return False, f"Kỳ nghỉ Tết cuối năm/đầu năm ({d.month}/{d.day})"

    # 3. Ngày lễ quốc gia (祝日) & Nghỉ bù
    holidays = get_japan_holidays(d.year)
    if d in holidays:
        return False, f"Ngày Quốc lễ Nhật Bản: {holidays[d]}"

    return True, "Ngày làm việc bình thường (稼働日)"

def get_latest_diff_entries(limit=5):
    """
    Parses NTA Sabun portal to extract available daily diff file IDs and dates.
    """
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        resp = requests.get(PORTAL_URL, headers=headers, timeout=20)
        if resp.status_code != 200:
            print(f"[-] NTA Sabun portal HTTP {resp.status_code}")
            return []
        html = resp.text
    except Exception as e:
        print(f"[-] Failed to access NTA Sabun portal: {e}")
        return []

    # Parse rows in DLtableCsv
    # Row structure: 令和8年10月26日 ... doDownload('5256','01') ...
    entries = []
    # Match pattern: doDownload('(\d+)','01') and associated date
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL)
    for r in rows:
        m_dl = re.search(r"doDownload\('(\d+)',\s*'01'\)", r)
        if not m_dl:
            continue
        file_id = m_dl.group(1)
        
        # Extract date Reiwa/Heisei/YYYY
        m_date = re.search(r'(令和\s*\d+\s*年\s*\d+\s*月\s*\d+\s*日)', r)
        date_str = m_date.group(1) if m_date else ""
        
        # Convert Wareki to ISO
        iso_date = ""
        if date_str:
            clean_d = re.sub(r'\s+', '', date_str)
            m_w = re.search(r'令和(\d+)年(\d+)月(\d+)日', clean_d)
            if m_w:
                y = 2018 + int(m_w.group(1))
                m = int(m_w.group(2))
                d = int(m_w.group(3))
                iso_date = f"{y:04d}-{m:02d}-{d:02d}"

        entries.append({
            "file_id": file_id,
            "date_ja": date_str,
            "date_iso": iso_date
        })
        if len(entries) >= limit:
            break

    return entries

def process_single_diff(file_id, date_iso):
    """
    Downloads ZIP, unpacks CSV in memory, and updates PostgreSQL.
    Returns (active_corps, revoked_corps).
    """
    url = f"{DOWNLOAD_BASE}?dlFilKanriNo={file_id}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    
    t0 = time.time()
    resp = requests.get(url, headers=headers, timeout=60)
    if resp.status_code != 200:
        print(f"[-] Failed to download file {file_id}: HTTP {resp.status_code}")
        return [], []

    zip_bytes = resp.content
    print(f"  [+] Downloaded diff ZIP ({len(zip_bytes)/(1024):.1f} KB) in {time.time() - t0:.2f}s.")

    active_items = []
    revoked_items = []
    active_corps = []
    revoked_corps = []

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        csv_names = [n for n in z.namelist() if n.endswith(".csv") and not n.endswith(".asc")]
        if not csv_names:
            print("[-] No CSV file inside ZIP archive.")
            return [], []
        
        with z.open(csv_names[0]) as f:
            reader = csv.reader(io.TextIOWrapper(f, encoding='utf-8-sig', errors='replace'))
            for row in reader:
                if not row or len(row) < 12:
                    continue
                t_num = row[1].strip()
                if not t_num.startswith("T") or len(t_num) != 14:
                    continue
                corp_num = t_num[1:]
                jinkaku = row[4].strip() if len(row) > 4 else ""
                
                # We focus on corporations (jinkaku == '2') or 13-digit valid entities
                if jinkaku != '2' and len(corp_num) != 13:
                    continue

                eff_date = row[7].strip() if len(row) > 7 else None
                upd_date = row[8].strip() if len(row) > 8 else None
                disp_date = row[9].strip() if len(row) > 9 else ""
                exp_date = row[10].strip() if len(row) > 10 else ""
                address = row[11].strip() if len(row) > 11 else ""
                pref_code = row[12].strip() if len(row) > 12 else None
                comp_name = row[18].strip() if len(row) > 18 else ""

                is_valid = False if (disp_date or exp_date) else True

                if is_valid:
                    active_items.append((corp_num, t_num, pref_code, eff_date, upd_date, address, True))
                    active_corps.append(corp_num)
                else:
                    revoked_items.append((corp_num, t_num, pref_code, eff_date, upd_date, address, False))
                    revoked_corps.append(corp_num)

    print(f"  [+] Parsed {len(active_items):,} active invoices and {len(revoked_items):,} revoked/cancelled invoices.")

    if not active_items and not revoked_items:
        return [], []

    # Update PostgreSQL database
    conn = psycopg2.connect(PG_URL)
    cur = conn.cursor()

    # 1. Upsert into nta_invoices
    # Deduplicate all items by corporate_number to strictly avoid PostgreSQL error:
    # "ON CONFLICT DO UPDATE command cannot affect row a second time"
    deduped_dict = {}
    for item in (active_items + revoked_items):
        c_num = item[0]
        if c_num not in deduped_dict:
            deduped_dict[c_num] = item
        else:
            existing = deduped_dict[c_num]
            existing_upd = existing[4] or ""
            item_upd = item[4] or ""
            if item_upd >= existing_upd:
                deduped_dict[c_num] = item

    all_upsert = list(deduped_dict.values())
    active_corps = list(set(c for c, item in deduped_dict.items() if item[6] is True))
    revoked_corps = list(set(c for c, item in deduped_dict.items() if item[6] is False))

    upsert_sql = """
        INSERT INTO nta_invoices (
            corporate_number, registration_number, prefecture_code,
            effective_date, update_date, address, is_valid
        ) VALUES %s
        ON CONFLICT (corporate_number) DO UPDATE
        SET registration_number = EXCLUDED.registration_number,
            prefecture_code = COALESCE(EXCLUDED.prefecture_code, nta_invoices.prefecture_code),
            effective_date = EXCLUDED.effective_date,
            update_date = EXCLUDED.update_date,
            address = COALESCE(EXCLUDED.address, nta_invoices.address),
            is_valid = EXCLUDED.is_valid;
    """
    execute_values(cur, upsert_sql, all_upsert, page_size=2000)
    conn.commit()

    # 2. Bulk update companies partitions: has_invoice = true
    if active_corps:
        cur.execute("""
            UPDATE companies
            SET has_invoice = true,
                updated_at = NOW()
            WHERE corporate_number = ANY(%s)
              AND (has_invoice IS NULL OR has_invoice = false);
        """, (active_corps,))
        conn.commit()
        print(f"  [+] Updated companies table: {cur.rowcount} entities flagged has_invoice = true.")

    # 3. Bulk update companies partitions: has_invoice = false (for revoked)
    if revoked_corps:
        cur.execute("""
            UPDATE companies
            SET has_invoice = false,
                updated_at = NOW()
            WHERE corporate_number = ANY(%s)
              AND has_invoice = true;
        """, (revoked_corps,))
        conn.commit()
        print(f"  [+] Updated companies table: {cur.rowcount} entities revoked has_invoice = false.")

    conn.close()
    return active_corps, revoked_corps

def run_nta_invoice_diff_cycle(last_processed_file_id=None, force=False):
    """
    Main entry point for NTA Invoice Diff Harvester (Agent 1 + Agent 2).
    Checks portal, verifies File ID lock, processes if new, and returns:
    (affected_corps, latest_file_id, latest_date_iso)
    """
    print("\n" + "=" * 80)
    print(">>> [NTA INVOICE DIFF] CHECKING OFFICIAL DAILY SABUN ARCHIVE <<<")
    print("=" * 80)

    entries = get_latest_diff_entries(limit=3)
    if not entries:
        print("[-] No diff entries found on portal.")
        return [], None, None

    latest = entries[0]
    file_id = str(latest['file_id'])
    date_iso = latest['date_iso']
    date_ja = latest['date_ja']
    print(f"[*] Portal latest diff: {date_ja} ({date_iso}) | File ID: {file_id}")

    # Check File ID Lock (Idempotency)
    if not force and last_processed_file_id is not None and str(last_processed_file_id) == file_id:
        print(f"  [+] [FILE ID LOCK] File ID {file_id} has already been processed. Zero duplicate action needed.")
        return [], file_id, date_iso

    # Process latest diff
    active, revoked = process_single_diff(file_id, date_iso)
    total_affected = active + revoked
    print(f"[+] NTA Invoice Diff cycle complete. Total affected corporations: {len(total_affected):,}")
    return total_affected, file_id, date_iso

if __name__ == "__main__":
    force_run = ("--force" in sys.argv)
    run_nta_invoice_diff_cycle(force=force_run)
