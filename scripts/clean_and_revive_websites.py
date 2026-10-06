#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-List: Clean & Smart Revival Strategy (Phương án A)
=========================================================
1. Clean Malformed Syntax URLs (95 records)
2. Clean Aggregator / Directory / Portal URLs (20,224 records)
3. Clean Confirmed Dead & Expired Domains (9,993 records)
4. Revive Temporarily Failed Domains from Old Crawl (106,717 records)
5. Protect and Preserve 100% of Verified SUCCESS Domains
"""

import os
import sys
import time
import sqlite3
import logging

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger("clean_and_revive")

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(ROOT_DIR, "kigyou-list.db")

AGGREGATOR_DOMAINS = [
    'buffett-code.com', 'stanby.com', 'jp.stanby.com', 'salesnow.jp',
    'indeed.com', 'jp.indeed.com', 'hellowork.mhlw.go.jp', 'hellowork.careers',
    'careermine.jp', 'hw-jobs.careermine.jp', 'itp.ne.jp', 'kensetumap.com',
    'en-gage.net', 'plex-job.com', 'compalyze.co.jp', 'taxisite.com',
    'townwork.net', 'rikunabi.com', 'next.rikunabi.com', 'mynavi.jp',
    'doda.jp', 'job-medley.com', 'founded-today.com', 'kaigokensaku.mhlw.go.jp',
    'iryou.teikyouseido.mhlw.go.jp', 'wam.go.jp', 'minnanokaigo.com', 'tsukulink.net'
]

def main():
    t0 = time.time()
    log.info("=" * 75)
    log.info("   KIGYOU-LIST: THỰC THI PHƯƠNG ÁN A - DỌN DẸP & HỒI SINH WEBSITE")
    log.info("=" * 75)
    log.info(f"Database: {DB_PATH}")

    if not os.path.exists(DB_PATH):
        log.error(f"[-] Database not found at: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH, timeout=120.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=120000;")
    cur = conn.cursor()

    # --- BƯỚC 1: Dọn dẹp URL lỗi cú pháp / rỗng ---
    log.info("▶️ [BƯỚC 1/4] Dọn dẹp URL lỗi cú pháp / link rỗng...")
    cur.execute("""
        UPDATE companies 
        SET website_url = NULL,
            website_crawl_status = 'REMOVED_MALFORMED_URL'
        WHERE website_url IS NOT NULL 
          AND (
            length(trim(website_url)) < 6
            OR website_url LIKE '%none%'
            OR website_url LIKE '%なし%'
            OR website_url LIKE '%://.%'
            OR website_url LIKE '%:///%'
            OR website_url = 'http:'
            OR website_url = 'https:'
            OR trim(website_url) = ''
          )
    """)
    step1_cnt = cur.rowcount
    conn.commit()
    log.info(f"   ✅ Đã gỡ bỏ {step1_cnt:,} URL lỗi cú pháp.")

    # --- BƯỚC 2: Dọn dẹp URL danh bạ / nền tảng trung gian ---
    log.info("▶️ [BƯỚC 2/4] Gỡ bỏ URL nền tảng trung gian (Buffett-Code, Indeed, Kensetumap...)...")
    like_clauses = " OR ".join([f"website_url LIKE '%{d}%'" for d in AGGREGATOR_DOMAINS])
    cur.execute(f"""
        UPDATE companies 
        SET website_url = NULL,
            website_crawl_status = 'REMOVED_AGGREGATOR'
        WHERE website_url IS NOT NULL AND ({like_clauses})
    """)
    step2_cnt = cur.rowcount
    conn.commit()
    log.info(f"   ✅ Đã gỡ bỏ {step2_cnt:,} URL trung gian khỏi `website_url`.")

    # --- BƯỚC 3: Dọn dẹp Tên miền Chết thực sự ---
    log.info("▶️ [BƯỚC 3/4] Xử lý tên miền chết thực sự (DEAD_DOMAIN, ERR_DNS, PARKED_DOMAIN)...")
    cur.execute("""
        UPDATE companies 
        SET website_url = NULL,
            website_crawl_status = 'DEAD_DOMAIN'
        WHERE website_crawl_status IN ('DEAD_DOMAIN', 'PARKED_DOMAIN', 'ERR_DNS')
          AND website_url IS NOT NULL
    """)
    step3_cnt = cur.rowcount
    conn.commit()
    log.info(f"   ✅ Đã gỡ bỏ {step3_cnt:,} tên miền chết/hết hạn.")

    # --- BƯỚC 4: Hồi sinh nhóm lỗi mạng tạm thời ---
    log.info("▶️ [BƯỚC 4/4] HỒI SINH (Revival) nhóm lỗi mạng cũ để cào lại bằng 8 lõi + 82 Proxy...")
    cur.execute("""
        UPDATE companies 
        SET website_last_crawled_at = NULL,
            website_crawl_status = NULL
        WHERE website_url IS NOT NULL 
          AND length(website_url) >= 6
          AND website_crawl_status IN ('ERR_FAILED', 'ERR_TIMEOUT', 'ERR_SSL', 'ERR_CONNECTION_REFUSED', 'SUCCESS_EMPTY')
    """)
    step4_cnt = cur.rowcount
    conn.commit()
    log.info(f"   🎉 ĐÃ HỒI SINH THÀNH CÔNG: {step4_cnt:,} website đưa vào hàng đợi cào ưu tiên!")

    # --- TỔNG HỢP SỐ LIỆU SAU THỰC THI ---
    log.info("=" * 75)
    log.info("📊 SỐ LIỆU SAU KHI DỌN DẸP & HỒI SINH:")

    cur.execute("SELECT count(*) FROM companies WHERE website_url IS NOT NULL AND length(website_url) > 3")
    total_active_websites = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM companies WHERE website_crawl_status = 'SUCCESS'")
    verified_success = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM companies WHERE website_url IS NOT NULL AND website_last_crawled_at IS NULL")
    revived_pending_queue = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM companies WHERE website_crawl_status = 'REMOVED_AGGREGATOR'")
    agg_removed = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM companies WHERE website_crawl_status = 'DEAD_DOMAIN'")
    dead_removed = cur.fetchone()[0]

    log.info(f"  • Tổng website hợp lệ còn lại trong DB: {total_active_websites:,}")
    log.info(f"  • Website đã có dữ liệu SUCCESS hoàn hảo: {verified_success:,} ({verified_success/max(1, total_active_websites)*100:.1f}%)")
    log.info(f"  • Hàng đợi cào ưu tiên (Revived Pending Queue): {revived_pending_queue:,}")
    log.info(f"  • Đã gỡ bỏ URL trung gian/danh bạ: {agg_removed:,}")
    log.info(f"  • Đã gỡ bỏ tên miền chết/hết hạn: {dead_removed:,}")

    elapsed = time.time() - t0
    log.info(f"⏱️ Tổng thời gian thực thi: {elapsed:.2f}s")
    log.info("=" * 75)

    conn.close()

if __name__ == "__main__":
    main()
