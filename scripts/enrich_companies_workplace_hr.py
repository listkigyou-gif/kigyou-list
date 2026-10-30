# -*- coding: utf-8 -*-
"""
Kigyou-list: Enrich Companies with Workplace HR, Age, Service Years & Employee Numbers
===================================================================================
1. Reads importdata/gbiz-data/sogo-data/Shokubajoho_UTF-8.csv (144,784 records)
   - 従業員の平均年齢 -> avg_age
   - 平均継続勤務年数 / 正社員の平均継続勤務年数 -> avg_service_years
2. Reads importdata/gbiz-data/Hojinjoho_20260516/Hojinjoho_*.json (80,000 records)
   - employee_number -> insured_employee_count & backfills employee_count if NULL
3. Updates kigyou-list.db (SQLite) and exports clean delta for PostgreSQL VPS.
"""

import os
import sys
import csv
import json
import glob
import sqlite3
import time

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB_PATH = os.path.join(PROJECT_ROOT, 'kigyou-list.db')
SHOKUBA_CSV = os.path.join(PROJECT_ROOT, 'importdata', 'gbiz-data', 'sogo-data', 'Shokubajoho_UTF-8.csv')
HOJIN_JSON_DIR = os.path.join(PROJECT_ROOT, 'importdata', 'gbiz-data', 'Hojinjoho_20260516')

def compute_employee_range_id(count):
    if count is None:
        return None
    try:
        c = int(count)
        if c <= 9: return 1
        if c <= 49: return 2
        if c <= 299: return 3
        if c <= 999: return 4
        return 5
    except Exception:
        return None

def main():
    start_time = time.time()
    print("==================================================================")
    print(" KIGYOU-LIST: WORKPLACE HR & EMPLOYEE METRICS ENRICHMENT ENGINE")
    print("==================================================================")
    
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    cur = conn.cursor()
    
    # 1. Parse Shokubajoho CSV
    workplace_data = {}
    if os.path.exists(SHOKUBA_CSV):
        print(f"[*] Reading Shokubajoho CSV: {SHOKUBA_CSV}")
        with open(SHOKUBA_CSV, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                corp_num = row.get('法人番号')
                if not corp_num or len(corp_num) != 13:
                    continue
                
                # Extract avg_age
                avg_age = None
                raw_age = row.get('従業員の平均年齢')
                if raw_age and raw_age.strip():
                    try:
                        avg_age = round(float(raw_age.strip()), 1)
                    except ValueError:
                        pass
                
                # Extract service_years
                service_years = None
                raw_sy = (row.get('正社員の平均継続勤務年数') or 
                          row.get('平均継続勤務年数-男性') or 
                          row.get('平均継続勤務年数-女性'))
                if raw_sy and raw_sy.strip():
                    try:
                        service_years = round(float(raw_sy.strip()), 1)
                    except ValueError:
                        pass
                
                if avg_age is not None or service_years is not None:
                    workplace_data[corp_num] = {
                        'avg_age': avg_age,
                        'avg_service_years': service_years
                    }
        print(f"[+] Loaded workplace metrics for {len(workplace_data):,} corporations.")
    else:
        print(f"[-] Shokubajoho CSV not found at {SHOKUBA_CSV}")

    # 2. Parse Hojinjoho JSON files
    employee_data = {}
    json_files = glob.glob(os.path.join(HOJIN_JSON_DIR, 'Hojinjoho_*.json'))
    print(f"[*] Reading {len(json_files)} Hojinjoho JSON files from {HOJIN_JSON_DIR}")
    for jf in json_files:
        try:
            with open(jf, 'r', encoding='utf-8') as f:
                data = json.loads(f.readline())
                for r in data:
                    corp_num = r.get('corporate_number')
                    if not corp_num or len(corp_num) != 13:
                        continue
                    
                    emp_num = r.get('employee_number')
                    if emp_num is not None:
                        try:
                            emp_val = int(emp_num)
                            if emp_val > 0:
                                employee_data[corp_num] = emp_val
                        except (ValueError, TypeError):
                            pass
        except Exception as e:
            print(f"[-] Error reading {jf}: {e}")
            
    print(f"[+] Loaded employee count data for {len(employee_data):,} corporations.")

    # 3. Combine and Update SQLite companies
    all_corps = set(workplace_data.keys()).union(set(employee_data.keys()))
    print(f"[*] Total unique corporations to enrich: {len(all_corps):,}")
    
    update_workplace_batch = []
    update_emp_batch = []
    
    for corp_num in all_corps:
        wp = workplace_data.get(corp_num, {})
        emp = employee_data.get(corp_num)
        
        avg_age = wp.get('avg_age')
        avg_sy = wp.get('avg_service_years')
        
        if avg_age is not None or avg_sy is not None:
            update_workplace_batch.append((avg_age, avg_sy, corp_num))
            
        if emp is not None:
            range_id = compute_employee_range_id(emp)
            update_emp_batch.append((emp, 1, range_id, emp, corp_num))
            
    print(f"[*] Executing SQLite batch updates...")
    if update_workplace_batch:
        cur.executemany("""
            UPDATE companies 
            SET avg_age = COALESCE(?, avg_age),
                avg_service_years = COALESCE(?, avg_service_years)
            WHERE corporate_number = ?
        """, update_workplace_batch)
        print(f"[+] Updated workplace metrics on {len(update_workplace_batch):,} companies.")
        
    if update_emp_batch:
        cur.executemany("""
            UPDATE companies 
            SET insured_employee_count = ?,
                has_insured_count = ?,
                employee_range_id = COALESCE(employee_range_id, ?),
                employee_count = COALESCE(employee_count, ?)
            WHERE corporate_number = ?
        """, update_emp_batch)
        print(f"[+] Updated employee count metrics on {len(update_emp_batch):,} companies.")
        
    conn.commit()
    conn.close()
    
    elapsed = time.time() - start_time
    print(f"==================================================================")
    print(f"[✓] ENRICHMENT COMPLETED in {elapsed:.2f} seconds.")
    print(f"==================================================================")

if __name__ == '__main__':
    main()

