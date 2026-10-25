#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Kigyou-list: Nationwide Hospitality & Food Services Master Pipeline (Phase 2)
=============================================================================
1. 旅館業許可 (Hotels, Ryokans, Lodging Facilities under Inns and Hotels Act)
2. 飲食店営業許可 (Restaurants, Eateries, Cafes under Food Sanitation Act)

Automated Multi-Agent Harvester across 47 Prefectures & Major Japanese Cities:
- Universal Column Normalization (handles 34-col BODIK standard, Tokyo Metro, and municipal variations)
- Encoding auto-detection (utf-8-sig, cp932, euc-jp)
- Fast Indexed Entity Resolution against 5.07M NTA Corporate Records
- High-throughput SQLite batch upsert with UNIQUE constraints
- Syncs delta licenses to VPS PostgreSQL (kigyou_list)
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

DATA_DIR = os.path.join(PROJECT_ROOT, "importdata", "open-data", "hospitality_food", "downloads")
DB_PATH = os.path.join(PROJECT_ROOT, "kigyou-list.db")
SOURCES_FILE = os.path.join(PROJECT_ROOT, "importdata", "open-data", "hospitality_food", "clean_sources.json")
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
    # Remove corporate type affixes
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
    if os.path.exists(local_path) and os.path.getsize(local_path) > 300:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=30) as resp, open(local_path, "wb") as f:
            f.write(resp.read())
        return True
    except Exception as e:
        return False

def parse_csv_file(filepath):
    for enc in ['utf-8-sig', 'cp932', 'euc-jp']:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                content = f.read(4096)
                if '\x00' in content:
                    continue
                dialect = csv.Sniffer().sniff(content)
                f.seek(0)
                reader = csv.reader(f, dialect)
                header = next(reader)
                rows = list(reader)
                return header, rows, enc
        except Exception:
            continue
    return None, None, None

def find_col_index(header, candidates):
    norm_header = [re.sub(r'[\s\u3000\ufeff_\-\(\)（）]+', '', str(c)).lower() for c in header]
    for cand in candidates:
        norm_cand = re.sub(r'[\s\u3000\ufeff_\-\(\)（）]+', '', cand).lower()
        for idx, col in enumerate(norm_header):
            if norm_cand in col or col in norm_cand:
                return idx
    return -1

def extract_record_fields(header, row):
    idx_corp = find_col_index(header, ['法人名', '営業者氏名', '氏名法人', '申請者氏名', '営業者名', '氏名又は名称', '開設者氏名', '営業者'])
    idx_corp_num = find_col_index(header, ['法人番号', '13桁', '国税庁法人番号'])
    idx_facility = find_col_index(header, ['施設名称', '営業所の名称', '施設名', '店名', '商号又は名称'])
    idx_addr = find_col_index(header, ['所在地連結表記', '施設所在地', '営業所所在地', '所在地', '営業所所在地1'])
    idx_phone = find_col_index(header, ['施設電話番号', '営業所電話番号', '施設電話番号', '電話番号', 'tel', 'ｔｅｌ'])
    idx_lic_num = find_col_index(header, ['許可番号', '届出番号', '登録番号', '許認可番号'])
    idx_issue_date = find_col_index(header, ['初回許可年月日', '許可年月日', '許可日', '新規許可日', '指定年月日'])
    idx_type = find_col_index(header, ['業種名称', '業務種別', '業種', '施設種別', '営業の種類'])
    idx_rep = find_col_index(header, ['代表者氏名', '代表者名', '代表者'])
    
    corp_name = row[idx_corp].strip() if idx_corp != -1 and idx_corp < len(row) else ""
    corp_num = row[idx_corp_num].strip() if idx_corp_num != -1 and idx_corp_num < len(row) else ""
    facility_name = row[idx_facility].strip() if idx_facility != -1 and idx_facility < len(row) else ""
    address = row[idx_addr].strip() if idx_addr != -1 and idx_addr < len(row) else ""
    phone = row[idx_phone].strip() if idx_phone != -1 and idx_phone < len(row) else ""
    lic_num = row[idx_lic_num].strip() if idx_lic_num != -1 and idx_lic_num < len(row) else ""
    issue_date = row[idx_issue_date].strip() if idx_issue_date != -1 and idx_issue_date < len(row) else ""
    facility_type = row[idx_type].strip() if idx_type != -1 and idx_type < len(row) else ""
    rep_name = row[idx_rep].strip() if idx_rep != -1 and idx_rep < len(row) else ""
    
    # Clean corporate number (must be 13 digits)
    if corp_num:
        digits = re.sub(r'\D', '', corp_num)
        corp_num = digits if len(digits) == 13 else ""
        
    return {
        'corp_name': corp_name,
        'corp_num': corp_num,
        'facility_name': facility_name,
        'address': address,
        'phone': phone,
        'lic_num': lic_num,
        'issue_date': issue_date,
        'facility_type': facility_type,
        'rep_name': rep_name
    }

class NationwideHarvester:
    def __init__(self):
        self.conn = sqlite3.connect(DB_PATH)
        self.cur = self.conn.cursor()
        self.stats = {
            'files_processed': 0,
            'files_failed': 0,
            'raw_rows': 0,
            'matched_food': 0,
            'matched_ryokan': 0,
            'new_licenses_inserted': 0,
            'companies_updated': 0
        }

    def resolve_entity(self, fields, pref_code):
        # 1. Match by 13-digit corporate number if provided in Open Data
        if fields['corp_num']:
            self.cur.execute(
                "SELECT corporate_number, company_name, prefecture_code FROM companies WHERE corporate_number = ?",
                (fields['corp_num'],)
            )
            row = self.cur.fetchone()
            if row:
                return row[0], row[1], row[2]

        # 2. Match by clean corporate name + prefecture
        target_names = []
        if fields['corp_name']:
            clean_c, norm_c = clean_corp_name(fields['corp_name'])
            if len(clean_c) >= 3:
                target_names.append(clean_c)
            if len(norm_c) >= 3 and norm_c != clean_c:
                target_names.append(norm_c)
                
        if fields['facility_name']:
            clean_f, norm_f = clean_corp_name(fields['facility_name'])
            if len(clean_f) >= 3 and clean_f not in target_names:
                target_names.append(clean_f)

        for name in target_names:
            if pref_code:
                self.cur.execute(
                    "SELECT corporate_number, company_name, prefecture_code FROM companies WHERE company_name = ? AND prefecture_code = ? LIMIT 1",
                    (name, pref_code)
                )
                row = self.cur.fetchone()
                if row:
                    return row[0], row[1], row[2]
            
            # Fallback exact name match
            self.cur.execute(
                "SELECT corporate_number, company_name, prefecture_code FROM companies WHERE company_name = ? LIMIT 1",
                (name,)
            )
            row = self.cur.fetchone()
            if row:
                return row[0], row[1], row[2]

        return None, None, None

    def process_source(self, source_info):
        url = source_info['url']
        lic_type = source_info['type'] # '飲食店営業許可' or '旅館業許可'
        authority = source_info.get('authority', '地方公共団体')
        default_pref = source_info.get('prefecture_code', '')
        
        # Local filename
        safe_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', os.path.basename(url).split('?')[0])
        if not safe_name.endswith('.csv'):
            safe_name += '.csv'
        local_path = os.path.join(DATA_DIR, f"{lic_type[:2]}_{source_info.get('portal', 'bodik')}_{safe_name}")
        
        if not download_file(url, local_path):
            self.stats['files_failed'] += 1
            return 0
            
        header, rows, enc = parse_csv_file(local_path)
        if not header or not rows:
            self.stats['files_failed'] += 1
            return 0
            
        self.stats['files_processed'] += 1
        self.stats['raw_rows'] += len(rows)
        
        category = "宿泊・ホテル業" if lic_type == "旅館業許可" else "飲食・フードサービス業"
        batch_records = []
        matched_corps = set()
        
        for r in rows:
            if not r or len(r) < 2:
                continue
                
            fields = extract_record_fields(header, r)
            if not fields['corp_name'] and not fields['facility_name'] and not fields['corp_num']:
                continue
                
            pref = detect_prefecture(fields['address'], default_pref)
            corp_num, comp_name, comp_pref = self.resolve_entity(fields, pref)
            
            if not corp_num:
                continue
                
            matched_corps.add(corp_num)
            if lic_type == "旅館業許可":
                self.stats['matched_ryokan'] += 1
            else:
                self.stats['matched_food'] += 1
                
            lic_num = fields['lic_num'] or f"{lic_type[:2]}-{fields['facility_name'] or corp_num}"
            specs = {
                "facility_name": fields['facility_name'],
                "facility_type": fields['facility_type'] or lic_type,
                "operator_name": fields['corp_name']
            }
            
            batch_records.append((
                corp_num,
                lic_type,
                category,
                lic_num,
                authority,
                comp_pref or pref or '13',
                fields['rep_name'],
                fields['phone'],
                '',
                fields['address'],
                fields['issue_date'],
                '',
                '有効',
                json.dumps(specs, ensure_ascii=False),
                url
            ))
            
        # Batch insert into company_licenses
        if batch_records:
            self.cur.executemany("""
                INSERT OR IGNORE INTO company_licenses (
                    corporate_number, license_type, license_category, license_number,
                    issuing_authority, prefecture_code, representative_name, office_phone,
                    office_fax, registered_address, issue_date, valid_until,
                    license_status, specialties_json, source_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, batch_records)
            self.conn.commit()
            self.stats['new_licenses_inserted'] += len(batch_records)
            
            # Update has_license = 1
            corp_list = list(matched_corps)
            for chunk_start in range(0, len(corp_list), 500):
                chunk = corp_list[chunk_start:chunk_start+500]
                placeholders = ','.join(['?'] * len(chunk))
                self.cur.execute(f"UPDATE companies SET has_license = 1 WHERE corporate_number IN ({placeholders})", chunk)
            self.conn.commit()
            self.stats['companies_updated'] += len(corp_list)
            
        return len(batch_records)

    def run_pipeline(self, max_sources=150):
        print("=" * 80)
        print("STARTING NATIONWIDE MULTI-AGENT HARVESTER")
        print("=" * 80)
        
        with open(SOURCES_FILE, "r", encoding="utf-8") as f:
            sources_data = json.load(f)
            
        all_sources = []
        # Interleave Ryokan and Food to progress both evenly
        ryokan_list = sources_data.get('ryokan', [])
        food_list = sources_data.get('food', [])
        
        # Prioritize master / all datasets
        def score_src(s):
            u = s['url'].lower()
            n = s['resource_name'].lower()
            p = s['package_title'].lower()
            comb = f"{u} {n} {p}"
            sc = 0
            if any(k in comb for k in ['_all', 'all.csv', '全件', 'zenken', '台帳']):
                sc += 40
            if any(k in comb for k in ['2026', '2025', '2024', 'r8', 'r7', 'r6']):
                sc += 20
            if any(k in comb for k in ['新規', '月分', 'shinki']):
                sc -= 30
            return sc

        ryokan_list.sort(key=score_src, reverse=True)
        food_list.sort(key=score_src, reverse=True)
        
        selected_sources = ryokan_list[:60] + food_list[:120]
        print(f"Total Sources Queued: {len(selected_sources)} (Ryokan: 60, Food: 120)")
        
        start_time = time.time()
        for idx, src in enumerate(selected_sources):
            print(f"\n[{idx+1}/{len(selected_sources)}] Processing: {src['type']} | {src['authority']} ({src['resource_name'][:30]})")
            matched = self.process_source(src)
            print(f"    -> Matched & Saved: {matched:,} licenses | Total Matched: {self.stats['new_licenses_inserted']:,}")
            
        elapsed = time.time() - start_time
        print("\n" + "=" * 80)
        print(f"PIPELINE COMPLETE IN {elapsed:.1f}s")
        print(f"- Files Processed: {self.stats['files_processed']}")
        print(f"- Files Failed: {self.stats['files_failed']}")
        print(f"- Raw Rows Inspected: {self.stats['raw_rows']:,}")
        print(f"- Matched 飲食店営業許可: {self.stats['matched_food']:,}")
        print(f"- Matched 旅館業許可: {self.stats['matched_ryokan']:,}")
        print(f"- Total Resolved Licenses: {self.stats['new_licenses_inserted']:,}")
        print(f"- Total Companies Updated: {self.stats['companies_updated']:,}")
        print("=" * 80)
        
        # Sync delta to VPS
        print("\n[*] Synchronizing Delta Licenses to VPS PostgreSQL...")
        sync_licenses()
        print("[+] VPS Synchronization Complete!")

if __name__ == '__main__':
    harvester = NationwideHarvester()
    harvester.run_pipeline(max_sources=180)
