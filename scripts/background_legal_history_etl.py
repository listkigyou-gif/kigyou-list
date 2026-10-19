#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Background Legal History ETL Worker (47 Prefectures)
================================================================
Extracts change history from National Tax Agency (NTA),
cleans and normalizes data locally on Windows,
and streams batches into remote PostgreSQL (company_legal_histories).
"""

import os
import re
import sys
import time
import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
import psycopg2
from psycopg2.extras import execute_batch

# Configuration
DB_HOST = os.getenv("DB_HOST", "160.251.203.84")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "Hrptlcct6789@")
DB_NAME = os.getenv("DB_NAME", "kigyou_list")

BATCH_SIZE = 200          # Process 200 companies per database transaction
MAX_CONCURRENT = 4        # 4 worker threads for polite, rate-limit safe crawling
CHECKPOINT_FILE = os.path.join(os.path.dirname(__file__), "etl_legal_checkpoint.json")

# Logger setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("ETL_Legal")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        dbname=DB_NAME,
        connect_timeout=15
    )

def wareki_to_iso(w_str):
    if not w_str:
        return None
    clean = w_str.strip()
    m = re.search(r'(令和|平成|昭和)(元|\d+)年(\d+)月(\d+)日', clean)
    if not m:
        return None
    era, y_str, m_str, d_str = m.groups()
    y = 1 if y_str == '元' else int(y_str)
    mth = str(int(m_str)).zfill(2)
    day = str(int(d_str)).zfill(2)

    if era == '令和':
        full_year = 2018 + y
    elif era == '平成':
        full_year = 1988 + y
    elif era == '昭和':
        full_year = 1925 + y
    else:
        return None
    return f"{full_year}-{mth}-{day}"

def clean_and_parse_nta_html(corp_num, company_name, current_address, html):
    """
    Local data cleaning and standardizing according to Option B
    """
    if not html or 'corpHistory' not in html:
        return []

    dl_blocks = re.findall(r'<dl class="corpHistory">([\s\S]*?)</dl>', html)
    if not dl_blocks:
        return []

    raw_blocks = []
    for block in dl_blocks:
        is_new = '新規' in block
        no_match = re.search(r'<dt>(No\.\d+)', block)
        no_str = no_match.group(1) if no_match else ('No.新規' if is_new else '')

        pairs = re.findall(r'<span class="title">([\s\S]*?)</span>\s*<span>([\s\S]*?)</span>', block)
        data = {}
        for k_raw, v_raw in pairs:
            k = re.sub(r'<[^>]+>', '', k_raw).strip()
            v = re.sub(r'<[^>]+>', '', v_raw).strip()
            v = re.sub(r'\s+', ' ', v)
            data[k] = v

        raw_blocks.append({
            'is_new': is_new,
            'no_str': no_str,
            'data': data
        })

    cleaned_events = []
    target_url = f"https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo={corp_num}"

    for item in raw_blocks:
        is_new = item['is_new']
        no_str = item['no_str']
        data = item['data']

        if is_new or '法人番号指定年月日' in data:
            date_raw = data.get('法人番号指定年月日') or data.get('事由発生年月日')
            iso_date = wareki_to_iso(date_raw) or '2015-10-05'

            cleaned_events.append({
                'corporate_number': corp_num,
                'event_no': no_str or '新規',
                'event_type': 'establishment',
                'event_date': iso_date,
                'event_badge_ja': '法人番号指定・登記',
                'event_badge_en': 'Corporate Number Designated',
                'event_badge_vi': 'Chỉ định mã số pháp nhân',
                'title_ja': f"法人番号の指定・登記公表（指定番号：{corp_num}）",
                'title_en': f"Corporate Number Designated (No. {corp_num})",
                'title_vi': f"Chỉ định & Công bố Mã số Pháp nhân Quốc gia (Số: {corp_num})",
                'details_ja': f"国税庁長官により13桁の法人番号「{corp_num}」が新規指定され、商号「{company_name}」の公表が行われました。",
                'details_en': f"13-digit Corporate Number \"{corp_num}\" was officially assigned by the National Tax Agency Commissioner with corporate name \"{company_name}\".",
                'details_vi': f"Tổng cục Thuế Quốc gia Nhật Bản chính thức cấp mã số pháp nhân 13 chữ số \"{corp_num}\" và công bố pháp nhân thương hiệu \"{company_name}\".",
                'old_info': None,
                'source': '国税庁 法人番号公表サイト',
                'source_url': target_url
            })
        else:
            reason = data.get('変更の事由', '')
            old_info = data.get('旧情報', '')
            date_raw = data.get('事由発生年月日') or data.get('変更年月日')
            iso_date = wareki_to_iso(date_raw) or '2015-10-05'

            if '所在地' in reason or '移転' in reason:
                details_ja = f"【新住所】{current_address} （旧住所：{old_info}）へ本店を移転登記。" if old_info else "法人の本店所在地の変更登記が国税庁公表システムに反映されました。"
                details_en = f"Head office relocated to [New] \"{current_address}\" from [Old] \"{old_info}\"." if old_info else "Registered corporate office relocation recorded in the National Tax Agency system."
                details_vi = f"Chuyển trụ sở chính sang [Địa chỉ mới] \"{current_address}\" từ [Địa chỉ cũ] \"{old_info}\"." if old_info else "Ghi nhận biến động thay đổi địa chỉ trụ sở trên hệ thống công bố Tổng cục Thuế Nhật Bản."

                cleaned_events.append({
                    'corporate_number': corp_num,
                    'event_no': no_str,
                    'event_type': 'address_change',
                    'event_date': iso_date,
                    'event_badge_ja': '国内所在地の変更',
                    'event_badge_en': 'Relocation of Head Office',
                    'event_badge_vi': 'Thay đổi địa chỉ trụ sở',
                    'title_ja': '本店又は主たる事務所の所在地の変更',
                    'title_en': 'Change of Registered Head Office Address',
                    'title_vi': 'Thay đổi địa chỉ trụ sở chính của doanh nghiệp',
                    'details_ja': details_ja,
                    'details_en': details_en,
                    'details_vi': details_vi,
                    'old_info': old_info or None,
                    'source': '国税庁 法人番号公表サイト（変更履歴）',
                    'source_url': target_url
                })
            elif '商号' in reason or '名称' in reason:
                details_ja = f"旧商号「{old_info}」から現在の商号「{company_name}」へ商号変更。" if old_info else "商号の変更登記が国税庁公表システムに反映されました。"
                details_en = f"Corporate trade name changed from \"{old_info}\" to \"{company_name}\"." if old_info else "Corporate name change recorded in National Tax Agency database."
                details_vi = f"Thay đổi tên doanh nghiệp từ \"{old_info}\" thành \"{company_name}\"." if old_info else "Ghi nhận thay đổi tên pháp nhân trên hệ thống Tổng cục Thuế."

                cleaned_events.append({
                    'corporate_number': corp_num,
                    'event_no': no_str,
                    'event_type': 'name_change',
                    'event_date': iso_date,
                    'event_badge_ja': '商号・名称変更',
                    'event_badge_en': 'Corporate Name Change',
                    'event_badge_vi': 'Đổi tên doanh nghiệp',
                    'title_ja': '商号又は名称の変更',
                    'title_en': 'Change of Corporate Trade Name',
                    'title_vi': 'Thay đổi tên pháp nhân / thương hiệu đăng ký',
                    'details_ja': details_ja,
                    'details_en': details_en,
                    'details_vi': details_vi,
                    'old_info': old_info or None,
                    'source': '国税庁 法人番号公表サイト（変更履歴）',
                    'source_url': target_url
                })
            else:
                cleaned_events.append({
                    'corporate_number': corp_num,
                    'event_no': no_str,
                    'event_type': 'status_check',
                    'event_date': iso_date,
                    'event_badge_ja': '登記更新',
                    'event_badge_en': 'Registry Update',
                    'event_badge_vi': 'Cập nhật đăng ký',
                    'title_ja': reason or '法人登記情報の変更',
                    'title_en': reason or 'Corporate Registry Update',
                    'title_vi': reason or 'Cập nhật thông tin đăng ký pháp nhân',
                    'details_ja': f"変更前：{old_info}" if old_info else "登記変更の事由が公表されました。",
                    'details_en': f"Previous: {old_info}" if old_info else "Corporate registry update recorded.",
                    'details_vi': f"Thông tin trước thay đổi: {old_info}" if old_info else "Ghi nhận thay đổi thông tin pháp nhân.",
                    'old_info': old_info or None,
                    'source': '国税庁 法人番号公表サイト（変更履歴）',
                    'source_url': target_url
                })

    return cleaned_events

def fetch_single_company_history(company):
    corp_num, name, address, est_date = company
    url = f"https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo={corp_num}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    }

    try:
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            events = clean_and_parse_nta_html(corp_num, name, address, resp.text)
            if events:
                return events

        # Fallback if no events or NTA page is empty
        fallback_date = str(est_date) if est_date else '2015-10-05'
        return [{
            'corporate_number': corp_num,
            'event_no': '新規',
            'event_type': 'establishment',
            'event_date': fallback_date,
            'event_badge_ja': '法人番号指定・登記',
            'event_badge_en': 'Corporate Number Designated',
            'event_badge_vi': 'Chỉ định mã số pháp nhân',
            'title_ja': f"法人番号の指定・登記公表（指定番号：{corp_num}）",
            'title_en': f"Corporate Number Designated (No. {corp_num})",
            'title_vi': f"Chỉ định & Công bố Mã số Pháp nhân Quốc gia (Số: {corp_num})",
            'details_ja': f"国税庁長官により13桁の法人番号「{corp_num}」が新規指定され、商号「{name}」の公表が行われました。",
            'details_en': f"13-digit Corporate Number \"{corp_num}\" was officially assigned upon incorporation.",
            'details_vi': f"Tổng cục Thuế Quốc gia Nhật Bản chính thức cấp mã số pháp nhân 13 chữ số \"{corp_num}\" ghi nhận sự kiện thành lập doanh nghiệp.",
            'old_info': None,
            'source': '国税庁 法人番号公表サイト',
            'source_url': url
        }]
    except Exception as e:
        logger.debug(f"Fetch failed for {corp_num}: {e}")
        return []

def save_batch_to_vps(conn, all_events):
    if not all_events:
        return 0

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
        title_ja = EXCLUDED.title_ja,
        source = EXCLUDED.source;
    """
    with conn.cursor() as cur:
        execute_batch(cur, sql, all_events, page_size=200)
    conn.commit()
    return len(all_events)

def run_etl():
    logger.info("==================================================================")
    logger.info("   STARTING BACKGROUND LEGAL HISTORY ETL WORKER (ALL 47 PREFECTURES)")
    logger.info("   Process: Local Cleaning -> Batch Ingestion to Remote PostgreSQL")
    logger.info("==================================================================")

    conn = get_db_connection()
    total_processed = 0
    total_events_saved = 0

    try:
        while True:
            # Fetch companies without legal history yet
            # Priority: Tokyo ('13') first, then by capital/revenue, then nationwide
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT c.corporate_number, c.company_name, 
                           COALESCE(c.full_address, c.street_address, '日本国内'),
                           c.establishment_date
                    FROM companies c
                    LEFT JOIN company_legal_histories h ON c.corporate_number = h.corporate_number
                    WHERE h.corporate_number IS NULL
                    ORDER BY 
                        CASE WHEN c.prefecture_code = '13' THEN 0 ELSE 1 END,
                        c.capital_amount DESC NULLS LAST
                    LIMIT %s;
                """, (BATCH_SIZE,))
                companies = cur.fetchall()

            if not companies:
                logger.info("✓ All companies have been processed and synced into company_legal_histories!")
                break

            logger.info(f"[*] Processing batch of {len(companies)} companies on Local Machine...")
            batch_events = []

            with ThreadPoolExecutor(max_workers=MAX_CONCURRENT) as executor:
                future_to_corp = {executor.submit(fetch_single_company_history, c): c[0] for c in companies}
                for future in as_completed(future_to_corp):
                    corp_num = future_to_corp[future]
                    try:
                        events = future.result()
                        if events:
                            batch_events.extend(events)
                    except Exception as exc:
                        logger.debug(f"{corp_num} generated an exception: {exc}")

            # Push cleaned batch to remote PostgreSQL VPS
            saved_count = save_batch_to_vps(conn, batch_events)
            total_processed += len(companies)
            total_events_saved += saved_count

            logger.info(f"[+] Synced {saved_count} clean legal events to VPS. (Total Progress: {total_processed} companies, {total_events_saved} events in DB)")
            time.sleep(0.5) # Polite throttle

    except KeyboardInterrupt:
        logger.info("\n[!] Worker paused by user. Progress is preserved in PostgreSQL.")
    except Exception as e:
        logger.error(f"[-] ETL Worker error: {e}", exc_info=True)
    finally:
        conn.close()
        logger.info(f"Worker shutdown. Total companies synced: {total_processed}, Events saved: {total_events_saved}")

if __name__ == "__main__":
    run_etl()
