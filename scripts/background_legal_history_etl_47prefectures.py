#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: 47 Prefectures Legal History Background ETL Worker
================================================================
- Downloads official NTA Zenken ZIP files for all 47 Japanese prefectures
- Cleans and structures data locally on Windows (Option B - Exact Legal Timeline)
- Pushes cleaned batches directly to remote PostgreSQL VPS (company_legal_histories)
- Resilient checkpoint mechanism: resume anytime without duplicate work
"""

import os
import sys
import re
import json
import time
import zipfile
import io
import csv
import logging
import requests
import psycopg2
from psycopg2.extras import execute_batch

sys.stdout.reconfigure(encoding='utf-8')

# Database Configuration (Remote VPS)
DB_HOST = os.getenv("DB_HOST", "160.251.203.84")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "Hrptlcct6789@")
DB_NAME = os.getenv("DB_NAME", "kigyou_list")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRATCH_DIR = os.path.join(os.path.dirname(BASE_DIR), "scratch", "nta_zips")
CHECKPOINT_FILE = os.path.join(BASE_DIR, "etl_47pref_checkpoint.json")
META_FILE = os.path.join(BASE_DIR, "nta_47prefectures_meta.json")

os.makedirs(SCRATCH_DIR, exist_ok=True)

# Logger setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(BASE_DIR, "etl_47prefectures.log"), encoding='utf-8')
    ]
)
logger = logging.getLogger("ETL_47Pref")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        dbname=DB_NAME,
        connect_timeout=20
    )

def load_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"completed_prefectures": [], "total_events_synced": 0}

def save_checkpoint(data):
    try:
        with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Failed to save checkpoint: {e}")

def get_nta_session():
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    })
    logger.info("Connecting to NTA portal to fetch active CSRF security token...")
    resp = session.get("https://www.houjin-bangou.nta.go.jp/download/zenken/", timeout=20)
    match = re.search(r'name="jp\.go\.nta\.houjin_bangou\.framework\.web\.common\.CNSFWTokenProcessor\.request\.token" value="([^"]+)"', resp.text)
    if not match:
        raise RuntimeError("Unable to extract CSRF token from NTA download portal.")
    token = match.group(1)
    logger.info(f"✓ Obtained fresh NTA Session Token: {token}")
    return session, token

def clean_csv_row(row):
    """
    Cleans and structures a single NTA raw CSV row into standard legal timeline events.
    Option B compliant: Exact official timeline matching NTA portal.
    """
    try:
        corp_num = row[1]
        process = row[2]
        change_date = row[5].strip() if row[5] else None
        name = row[6].strip()
        pref = row[9].strip()
        city = row[10].strip()
        street = row[11].strip()
        full_addr = f"{pref}{city}{street}"
        close_date = row[18].strip() if len(row) > 18 and row[18] else None
        cause = row[21].strip() if len(row) > 21 and row[21] else None
        assign_date = row[22].strip() if len(row) > 22 and row[22] else (change_date or '2015-10-05')
        
        target_url = f"https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo={corp_num}"
        events = []
        
        # 1. Establishment Event
        events.append({
            'corporate_number': corp_num,
            'event_no': '新規',
            'event_type': 'establishment',
            'event_date': assign_date,
            'event_badge_ja': '法人番号指定・登記',
            'event_badge_en': 'Corporate Number Designated',
            'event_badge_vi': 'Chỉ định mã số pháp nhân',
            'title_ja': f"法人番号の指定・登記公表（指定番号：{corp_num}）",
            'title_en': f"Corporate Number Designated (No. {corp_num})",
            'title_vi': f"Chỉ định & Công bố Mã số Pháp nhân Quốc gia (Số: {corp_num})",
            'details_ja': f"国税庁長官により13桁の法人番号「{corp_num}」が新規指定され、商号「{name}」の公表が行われました。",
            'details_en': f"13-digit Corporate Number \"{corp_num}\" was officially assigned by the National Tax Agency Commissioner with corporate name \"{name}\".",
            'details_vi': f"Tổng cục Thuế Quốc gia Nhật Bản chính thức cấp mã số pháp nhân 13 chữ số \"{corp_num}\" và công bố pháp nhân thương hiệu \"{name}\".",
            'old_info': None,
            'source': '国税庁 法人番号公表サイト',
            'source_url': target_url
        })
        
        # 2. Modification Event (Relocation, Trade Name Change, Registry Update)
        if process in ('11', '12') and change_date:
            is_addr = cause and ('所在地' in cause or '移転' in cause)
            is_name = cause and ('商号' in cause or '名称' in cause)
            
            if is_addr:
                ev_type = 'address_change'
                badge_ja = '国内所在地の変更'
                badge_en = 'Relocation of Head Office'
                badge_vi = 'Thay đổi địa chỉ trụ sở'
                title_ja = '本店又は主たる事務所の所在地の変更'
                title_en = 'Change of Registered Head Office Address'
                title_vi = 'Thay đổi địa chỉ trụ sở chính của doanh nghiệp'
            elif is_name:
                ev_type = 'name_change'
                badge_ja = '商号・名称変更'
                badge_en = 'Corporate Name Change'
                badge_vi = 'Đổi tên doanh nghiệp'
                title_ja = '商号又は名称の変更'
                title_en = 'Change of Corporate Trade Name'
                title_vi = 'Thay đổi tên pháp nhân / thương hiệu đăng ký'
            else:
                ev_type = 'status_check'
                badge_ja = '登記更新'
                badge_en = 'Registry Update'
                badge_vi = 'Cập nhật đăng ký'
                title_ja = '法人登記情報の変更'
                title_en = 'Corporate Registry Update'
                title_vi = 'Cập nhật thông tin đăng ký pháp nhân'
                
            events.append({
                'corporate_number': corp_num,
                'event_no': '変更',
                'event_type': ev_type,
                'event_date': change_date,
                'event_badge_ja': badge_ja,
                'event_badge_en': badge_en,
                'event_badge_vi': badge_vi,
                'title_ja': title_ja,
                'title_en': title_en,
                'title_vi': title_vi,
                'details_ja': f"事由：{cause}" if cause else f"公表住所：{full_addr}",
                'details_en': f"Reason: {cause}" if cause else f"Registered address: {full_addr}",
                'details_vi': f"Lý do: {cause}" if cause else f"Địa chỉ công bố: {full_addr}",
                'old_info': None,
                'source': '国税庁 法人番号公表サイト（変更情報）',
                'source_url': target_url
            })
            
        # 3. Closure / Dissolution / Merger Event
        if process == '21' and (close_date or change_date):
            ev_date = close_date or change_date
            events.append({
                'corporate_number': corp_num,
                'event_no': '閉鎖',
                'event_type': 'dissolution',
                'event_date': ev_date,
                'event_badge_ja': '登記記録の閉鎖',
                'event_badge_en': 'Registry Closed / Dissolution',
                'event_badge_vi': 'Đóng hồ sơ đăng ký / Giải thể',
                'title_ja': '登記記録の閉鎖等（解散・清算・合併）',
                'title_en': 'Corporate Registry Closed (Dissolution / Liquidation / Merger)',
                'title_vi': 'Đóng hồ sơ pháp nhân (Giải thể, Thanh lý hoặc Sáp nhập)',
                'details_ja': f"事由：{cause}" if cause else "登記官により登記記録の閉鎖が行われました。",
                'details_en': f"Reason: {cause}" if cause else "Corporate registry closed by the registrar.",
                'details_vi': f"Lý do: {cause}" if cause else "Hồ sơ đăng ký doanh nghiệp đã chính thức đóng trên cổng Quốc thuế.",
                'old_info': None,
                'source': '国税庁 法人番号公表サイト（閉鎖情報）',
                'source_url': target_url
            })
            
        return events
    except Exception:
        return []

def download_and_ingest_prefecture(session, token, pref, conn):
    name = pref['name']
    file_no = pref['file_no']
    size = pref['size']
    
    logger.info(f"------------------------------------------------------------------")
    logger.info(f"[*] Processing Prefecture: {name} (FileNo: {file_no}, Expected Size: {size})")
    
    local_zip = os.path.join(SCRATCH_DIR, f"{file_no}_{name}.zip")
    
    # 1. Download ZIP to local scratch
    t0 = time.time()
    payload = {
        'jp.go.nta.houjin_bangou.framework.web.common.CNSFWTokenProcessor.request.token': token,
        'event': 'download',
        'selDlFileNo': file_no
    }
    
    resp = session.post("https://www.houjin-bangou.nta.go.jp/download/zenken/index.html", data=payload, timeout=90)
    if resp.status_code != 200 or len(resp.content) < 5000:
        logger.warning(f"Download failed for {name} (status {resp.status_code}). Refreshing session token...")
        session, token = get_nta_session()
        payload['jp.go.nta.houjin_bangou.framework.web.common.CNSFWTokenProcessor.request.token'] = token
        resp = session.post("https://www.houjin-bangou.nta.go.jp/download/zenken/index.html", data=payload, timeout=90)
        
    with open(local_zip, "wb") as f:
        f.write(resp.content)
    dl_sec = time.time() - t0
    logger.info(f"  -> Downloaded {os.path.getsize(local_zip)/(1024*1024):.2f} MB in {dl_sec:.2f}s.")
    
    # 2. Local Cleaning
    t1 = time.time()
    cleaned_events = []
    with zipfile.ZipFile(local_zip, 'r') as z:
        csv_filename = [n for n in z.namelist() if n.endswith('.csv')][0]
        with z.open(csv_filename) as zf:
            reader = csv.reader(io.TextIOWrapper(zf, encoding='utf-8'))
            for row in reader:
                evs = clean_csv_row(row)
                if evs:
                    cleaned_events.extend(evs)
    clean_sec = time.time() - t1
    logger.info(f"  -> Local Cleaning Finished: {len(cleaned_events)} events normalized in {clean_sec:.2f}s.")
    
    # 3. Stream to remote VPS PostgreSQL
    t2 = time.time()
    sql = """
    INSERT INTO company_legal_histories (
        corporate_number, event_no, event_type, event_date,
        event_badge_ja, event_badge_en, event_badge_vi,
        title_ja, title_en, title_vi,
        details_ja, details_en, details_vi,
        old_info, source, source_url
    ) VALUES (
        %(corporate_number)s, %(event_no)s, %(event_type)s, %(event_date)s,
        %(event_badge_ja)s, %(event_badge_en)s, %(event_badge_vi)s,
        %(title_ja)s, %(title_en)s, %(title_vi)s,
        %(details_ja)s, %(details_en)s, %(details_vi)s,
        %(old_info)s, %(source)s, %(source_url)s
    )
    ON CONFLICT (corporate_number, event_type, event_date) DO UPDATE SET
        details_ja = EXCLUDED.details_ja,
        source = EXCLUDED.source;
    """
    
    batch_size = 2000
    pushed = 0
    with conn.cursor() as cur:
        for i in range(0, len(cleaned_events), batch_size):
            chunk = cleaned_events[i:i+batch_size]
            execute_batch(cur, sql, chunk, page_size=1000)
            conn.commit()
            pushed += len(chunk)
            
    vps_sec = time.time() - t2
    speed = pushed / vps_sec if vps_sec > 0 else 0
    logger.info(f"  -> Successfully synced {pushed} clean records to VPS in {vps_sec:.2f}s ({speed:.0f} rec/s).")
    
    # 4. Clean up scratch zip file to save disk space
    try:
        os.remove(local_zip)
    except Exception:
        pass
        
    return pushed

def run():
    logger.info("==================================================================")
    logger.info("   STARTING 47 PREFECTURES LEGAL HISTORY BACKGROUND ETL WORKER   ")
    logger.info("   Strategy: Local Download & Clean -> Batch Stream to VPS PG     ")
    logger.info("==================================================================")
    
    with open(META_FILE, "r", encoding="utf-8") as f:
        prefectures = json.load(f)
        
    checkpoint = load_checkpoint()
    completed = set(checkpoint.get("completed_prefectures", []))
    total_synced = checkpoint.get("total_events_synced", 0)
    
    conn = get_db_connection()
    session, token = get_nta_session()
    
    try:
        for idx, pref in enumerate(prefectures, 1):
            name = pref['name']
            if name in completed:
                logger.info(f"[{idx}/47] Skipping {name} (Already synced in checkpoint).")
                continue
                
            logger.info(f"\n>>> [{idx}/47] Starting ETL for {name}...")
            count = download_and_ingest_prefecture(session, token, pref, conn)
            
            # Update checkpoint
            completed.add(name)
            total_synced += count
            save_checkpoint({
                "completed_prefectures": list(completed),
                "total_events_synced": total_synced,
                "last_prefecture": name,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
            })
            
            logger.info(f"✓ [{idx}/47] Finished {name}. (Overall Progress: {len(completed)}/47 Prefectures, {total_synced:,} total events in VPS)")
            time.sleep(1.0) # Polite pause between prefectures
            
        logger.info("\n==================================================================")
        logger.info(f"🎉 ALL 47 PREFECTURES FULLY INGESTED INTO POSTGRESQL! Total: {total_synced:,} events.")
        logger.info("==================================================================")
        
    except KeyboardInterrupt:
        logger.info("\n[!] Worker interrupted by user. Safe exit. Progress saved in checkpoint.")
    except Exception as e:
        logger.error(f"[-] ETL Worker encountered an error: {e}", exc_info=True)
    finally:
        conn.close()

if __name__ == "__main__":
    run()
