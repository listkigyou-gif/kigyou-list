#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Enrich Company Name Kana (Furigana) - Resilient & High Speed
Automatically infers and updates `company_name_kana` in PostgreSQL for companies missing Furigana,
strictly adhering to the National Tax Agency (国税庁) standard:
- Stripping corporate entity forms (株式会社, 有限会社, 合同会社, 社会医療法人, etc.)
- Converting distinctive core name to Zen-kaku Katakana using pykakasi
- Auto-reconnect & retry on network/SSH tunnel drops
- TCP Keep-Alive configured to prevent idle disconnects
"""

import os
import sys
import re
import time
import argparse
import psycopg2
from psycopg2.extras import execute_values
import pykakasi
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(WORKSPACE_ROOT, 'frontend', '.env.local'))

# Initialize pykakasi
kks = pykakasi.kakasi()

# Corporate legal entities to strip according to NTA (国税庁) Furigana rules
LEGAL_ENTITIES = [
    r'株式会社', r'有限会社', r'合同会社', r'合資会社', r'合名会社',
    r'一般社団法人', r'公益社団法人', r'一般財団法人', r'公益財団法人',
    r'特定非営利活動法人', r'ＮＰＯ法人', r'NPO法人',
    r'社会医療法人財団', r'社会医療法人社団', r'社会医療法人',
    r'医療法人社団', r'医療法人財団', r'医療法人',
    r'社会福祉法人', r'学校法人', r'宗教法人',
    r'弁護士法人', r'税理士法人', r'行政書士法人', r'監査法人',
    r'国立大学法人', r'公立大学法人', r'公立学校法人',
    r'独立行政法人', r'地方独立行政法人',
    r'相互会社', r'農業協同組合', r'生活協同組合連合会', r'生活協同組合', r'事業協同組合', r'協同組合',
    r'\(株\)', r'\(有\)', r'\(同\)', r'（株）', r'（有）', r'（同）'
]

LEGAL_PATTERN = re.compile('|'.join(LEGAL_ENTITIES))

def infer_company_kana(name: str) -> str:
    if not name:
        return ""
    clean_name = LEGAL_PATTERN.sub('', name).strip()
    if not clean_name:
        clean_name = name
    clean_name = re.sub(r'^[・\s\-_]+|[・\s\-_]+$', '', clean_name)
    result = kks.convert(clean_name)
    kana = "".join([item['kana'] for item in result])
    return kana.strip()

def get_db_connection(db_url):
    return psycopg2.connect(
        db_url,
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5
    )

def run_enrichment(batch_size: int = 20000, limit: int = None):
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ LỖI: Không tìm thấy DATABASE_URL!")
        sys.exit(1)
        
    print("=" * 72)
    print("🚀 TIẾN TRÌNH SUY LUẬN & ĐIỀN TỰ ĐỘNG FURIGANA (フリガナ) - AUTO-RECONNECT")
    print("   • Chuẩn dữ liệu: Quốc gia Nhật Bản (国税庁 法人番号システム)")
    print("=" * 72)
    
    while True:
        try:
            conn = get_db_connection(db_url)
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM companies WHERE company_name_kana IS NULL OR company_name_kana = '';")
                remaining = cur.fetchone()[0]
            conn.close()
            break
        except Exception as e:
            print(f"⚠️ Đang kết nối lại Database... Lỗi: {e}")
            time.sleep(3)
            
    print(f"📊 Số công ty còn lại cần bổ sung: {remaining:,}")
    if remaining == 0:
        print("✅ Tất cả công ty đều đã có đầy đủ Furigana!")
        return

    target_total = min(remaining, limit) if limit else remaining
    print(f"🎯 Mục tiêu cập nhật: {target_total:,} bản ghi (Kích thước Batch: {batch_size:,})")
    print("-" * 72)

    total_processed = 0
    start_time = time.time()
    batch_idx = 0

    while total_processed < target_total:
        try:
            read_conn = get_db_connection(db_url)
            write_conn = get_db_connection(db_url)
            write_cur = write_conn.cursor()
            
            read_cur = read_conn.cursor(name='resilient_kana_cursor')
            read_cur.itersize = batch_size
            
            limit_sql = f" LIMIT {target_total - total_processed}"
            query = f"""
                SELECT corporate_number, company_name 
                FROM companies 
                WHERE company_name_kana IS NULL OR company_name_kana = ''
                {limit_sql};
            """
            read_cur.execute(query)
            
            update_query = """
                UPDATE companies AS c
                SET company_name_kana = d.kana
                FROM (VALUES %s) AS d(corporate_number, kana)
                WHERE c.corporate_number = d.corporate_number;
            """
            
            while total_processed < target_total:
                rows = read_cur.fetchmany(batch_size)
                if not rows:
                    break
                    
                batch_data = []
                for cn, name in rows:
                    kana = infer_company_kana(name)
                    if kana:
                        batch_data.append((cn, kana))
                        
                if batch_data:
                    execute_values(write_cur, update_query, batch_data)
                    write_conn.commit()
                    
                total_processed += len(rows)
                batch_idx += 1
                elapsed = time.time() - start_time
                rate = total_processed / elapsed if elapsed > 0 else 0
                percent = (total_processed / target_total) * 100
                rem_sec = (target_total - total_processed) / rate if rate > 0 else 0
                mins, secs = divmod(int(rem_sec), 60)
                
                print(f"⚡ Batch #{batch_idx:03d} | [{total_processed:>9,}/{target_total:,}] {percent:5.1f}% | "
                      f"Tốc độ: {rate:5.0f} rec/s | "
                      f"Đã chạy: {int(elapsed):3d}s | ETA: {mins:02d}m{secs:02d}s", 
                      flush=True)
                
            read_cur.close()
            read_conn.close()
            write_cur.close()
            write_conn.close()
            break
            
        except (psycopg2.OperationalError, psycopg2.DatabaseError) as err:
            print(f"\n⚠️ Mạng hoặc SSH Tunnel bị ngắt tạm thời ({err}). Tự động kết nối lại sau 5s...", flush=True)
            time.sleep(5)
            continue
            
    total_time = time.time() - start_time
    print("=" * 72)
    print(f"🎉 HOÀN THÀNH!")
    print(f"   • Đã cập nhật thành công: {total_processed:,} công ty")
    print(f"   • Thời gian chạy đợt này: {total_time:.1f} giây ({total_time/60:.2f} phút)")
    print("=" * 72)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Enrich missing company kana in PostgreSQL")
    parser.add_argument("--batch-size", type=int, default=20000, help="Batch size for updates (default: 20000)")
    parser.add_argument("--limit", type=int, default=None, help="Optional limit for dry-run/testing")
    args = parser.parse_args()
    
    run_enrichment(batch_size=args.batch_size, limit=args.limit)
