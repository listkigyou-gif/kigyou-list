#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: HelloWork 24/7 Drip-Feed Crawler & PostgreSQL Direct Sync Daemon
=============================================================================
Continuously cycles across all 47 Japanese prefectures (prioritizing major business
hubs first), extracts fresh job postings from HelloWork (including reception_date
and expiry_date), and syncs directly into PostgreSQL:
  - business_signals (signal_type = '求人あり')
  - companies (has_hiring = true, updated_at = NOW())
  - hub_dynamic_events (event_category = 'hiring', event_type = '求人募集')

Designed to run 24/7 under PM2 on the Production Ubuntu VPS (160.251.203.84).
Supports CLI flags for immediate testing:
  python scripts/hellowork_drip_daemon.py --once --limit 5
"""

import os
import re
import sys
import json
import time
import random
import logging
import argparse
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse, parse_qs
from logging.handlers import RotatingFileHandler

import requests
from bs4 import BeautifulSoup
import psycopg2

try:
    from dotenv import load_dotenv
    load_dotenv(".env.local")
    load_dotenv(".env")
except Exception:
    pass

# Reconfigure stdout/stderr for UTF-8
try:
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_PATH = os.path.join(BASE_DIR, "hellowork_drip_daemon.log")

logger = logging.getLogger("hellowork_drip_daemon")
logger.setLevel(logging.INFO)
logger.propagate = False
formatter = logging.Formatter("%(asctime)s - [%(levelname)s] - %(message)s")

fh = RotatingFileHandler(LOG_PATH, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8")
fh.setFormatter(formatter)
logger.addHandler(fh)

sh = logging.StreamHandler(sys.stdout)
sh.setFormatter(formatter)
logger.addHandler(sh)

BASE_URL = "https://www.hellowork.mhlw.go.jp"
SEARCH_INIT_URL = f"{BASE_URL}/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
SEARCH_POST_URL = f"{BASE_URL}/kensaku/GECA110010.do"

DEFAULT_LOCAL_PG_URL = "postgresql://postgres:Hrptlcct6789%40@127.0.0.1:5432/kigyou_list"
FALLBACK_VPS_PG_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

PREFECTURE_NAMES = {
    "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県",
    "06": "山形県", "07": "福島県", "08": "茨城県", "09": "栃木県", "10": "群馬県",
    "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県", "15": "新潟県",
    "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
    "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県", "25": "滋賀県",
    "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県",
    "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県",
    "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
    "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県",
    "46": "鹿児島県", "47": "沖縄県"
}

PRIORITY_PREFECTURES = ["13", "27", "23", "14", "40", "01"]
ALL_PREFECTURES_ORDERED = PRIORITY_PREFECTURES + [
    f"{i:02d}" for i in range(1, 48) if f"{i:02d}" not in PRIORITY_PREFECTURES
]


# ============================================================================
# Maintenance Window Helpers (JST)
# ============================================================================
def is_hellowork_maintenance(now_jst=None):
    """
    Checks if HelloWork is currently in its scheduled maintenance window:
      1. Weekly: Sunday 00:00 - 06:00 JST
      2. Monthly: Last day of month 21:30 JST to 1st day of next month 06:00 JST
    """
    if now_jst is None:
        now_utc = datetime.now(timezone.utc)
        now_jst = now_utc + timedelta(hours=9)

    # Sunday 00:00 - 06:00 JST
    if now_jst.weekday() == 6 and 0 <= now_jst.hour < 6:
        return True

    # Last day of month 21:30 - 24:00 JST
    next_day = now_jst + timedelta(days=1)
    is_last_day = next_day.month != now_jst.month
    if is_last_day:
        if now_jst.hour > 21 or (now_jst.hour == 21 and now_jst.minute >= 30):
            return True

    # 1st day of month 00:00 - 06:00 JST
    if now_jst.day == 1 and 0 <= now_jst.hour < 6:
        return True

    return False


def get_maintenance_remaining_seconds(now_jst=None):
    if now_jst is None:
        now_utc = datetime.now(timezone.utc)
        now_jst = now_utc + timedelta(hours=9)

    if not is_hellowork_maintenance(now_jst):
        return 0

    if now_jst.weekday() == 6 and 0 <= now_jst.hour < 6:
        target = now_jst.replace(hour=6, minute=0, second=0, microsecond=0)
        return max(int((target - now_jst).total_seconds()), 60)

    if now_jst.day == 1 and 0 <= now_jst.hour < 6:
        target = now_jst.replace(hour=6, minute=0, second=0, microsecond=0)
        return max(int((target - now_jst).total_seconds()), 60)

    next_day = now_jst + timedelta(days=1)
    if next_day.month != now_jst.month:
        tomorrow_6am = next_day.replace(hour=6, minute=0, second=0, microsecond=0)
        return max(int((tomorrow_6am - now_jst).total_seconds()), 60)

    return 0


def get_adaptive_cycle_sleep_seconds(new_signals_count):
    """
    Computes optimal resting time between nationwide cycles based on:
      1. JST Time of day (Business hours 08:30-18:00 vs Night 22:00-06:00)
      2. Weekend vs Weekday (HelloWork offices are closed on weekends)
      3. Signal discovery rate in the cycle just completed
    """
    now_utc = datetime.now(timezone.utc)
    now_jst = now_utc + timedelta(hours=9)
    jst_hour = now_jst.hour
    is_weekend = now_jst.weekday() in [5, 6]  # Saturday, Sunday

    # 1. Nighttime (22:00 - 06:00 JST): HelloWork offices are closed, no new jobs published
    if jst_hour >= 22 or jst_hour < 6:
        if jst_hour < 6:
            target_6am = now_jst.replace(hour=6, minute=0, second=0, microsecond=0)
            secs_until_6am = int((target_6am - now_jst).total_seconds())
            # Rest 30 - 45 mins before next check or until 06:00 AM JST
            return min(max(secs_until_6am, 1800), 2700)
        return 2400  # 40 minutes (22:00 - 24:00)

    # 2. Weekends (Sat / Sun): Offices closed nationwide
    if is_weekend:
        return 2700 if new_signals_count == 0 else 1800  # 30 - 45 mins

    # 3. Prime Business Hours (08:30 - 18:00 JST on Weekdays):
    if 8 <= jst_hour < 18:
        if new_signals_count == 0:
            return 900   # 15 mins (check again soon as new branch approvals arrive)
        elif new_signals_count < 10:
            return 600   # 10 mins
        else:
            return 300   # 5 mins (active stream of new postings)

    # 4. Evening (18:00 - 22:00 JST):
    return 1800 if new_signals_count == 0 else 900  # 15 - 30 mins


def check_maintenance_in_response(resp_text, status_code=200):
    """
    Detects unannounced system maintenance pages, 503 Service Unavailable,
    or 429 Too Many Requests from HelloWork.
    """
    if status_code in [503, 502, 429]:
        return True
    if not resp_text:
        return False
    maintenance_patterns = [
        "ただいまメンテナンス中",
        "システムメンテナンス中",
        "メンテナンスのお知らせ",
        "サービスを一時停止",
        "システムを停止しております",
        "アクセスが集中しております",
    ]
    return any(p in resp_text for p in maintenance_patterns)


def wait_if_maintenance():
    """Sleeps until HelloWork maintenance window ends."""
    while True:
        now_utc = datetime.now(timezone.utc)
        now_jst = now_utc + timedelta(hours=9)
        if not is_hellowork_maintenance(now_jst):
            break
        secs = get_maintenance_remaining_seconds(now_jst)
        sleep_secs = secs + 60
        resume_time = (now_jst + timedelta(seconds=sleep_secs)).strftime("%Y-%m-%d %H:%M:%S")
        logger.info(
            "[MAINTENANCE] HelloWork scheduled maintenance window active. Sleeping %ds (~%.1fm) until %s JST.",
            sleep_secs, sleep_secs / 60.0, resume_time
        )
        time.sleep(sleep_secs)


# ============================================================================
# Date & Text Normalization Helpers
# ============================================================================
def normalize_jp_date(text):
    """
    Converts Japanese dates such as '2026年12月31日' or '令和6年12月31日'
    into ISO 'YYYY-MM-DD'. Returns None if empty or unparseable.
    """
    if not text:
        return None
    s = str(text).strip()
    zenkaku = "０１２３４５６７８９"
    hankaku = "0123456789"
    s = s.translate(str.maketrans(zenkaku, hankaku))

    eras = {"令和": 2018, "平成": 1988, "昭和": 1925, "大正": 1911, "明治": 1867}
    for era, base in eras.items():
        if era in s:
            m = re.search(era + r"\s*(\d+|元)\s*[年/\-\.]\s*(\d{1,2})\s*[月/\-\.]\s*(\d{1,2})日?", s)
            if m:
                y_val = 1 if m.group(1) == "元" else int(m.group(1))
                return f"{base + y_val:04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"

    m_iso = re.search(r"(\d{4})\s*[年/\-\.]\s*(\d{1,2})\s*[月/\-\.]\s*(\d{1,2})日?", s)
    if m_iso:
        return f"{int(m_iso.group(1)):04d}-{int(m_iso.group(2)):02d}-{int(m_iso.group(3)):02d}"

    return None


def format_job_number(raw_kjno):
    """Normalizes 13-digit kJNo ('0401058308161') to hyphenated format ('04010-58308161')."""
    if not raw_kjno:
        return None
    s = str(raw_kjno).strip()
    digits = "".join(filter(str.isdigit, s))
    if len(digits) > 5 and "-" not in s:
        return f"{digits[:5]}-{digits[5:]}"
    return s


def clean_job_title(raw_title):
    """Strips leading '職種解説' and normalizes whitespace."""
    if not raw_title:
        return None
    s = re.sub(r"^\s*職種解説\s*", "", str(raw_title).strip())
    s = re.sub(r"\s+", " ", s).strip()
    return s or None


def clean_employment_type(kubun, keitai):
    """Produces a clean employment_type summary (e.g., 'フルタイム（正社員）' or 'フルタイム' / 'パート')."""
    kubun_s = (kubun or "").strip()
    keitai_s = (keitai or "").strip()

    # Extract clean primary employment type before verbose metadata
    primary_keitai = None
    for kw in ["正社員以外", "正社員", "パート労働者", "有期雇用派遣労働者", "無期雇用派遣労働者", "契約社員", "派遣労働者"]:
        if keitai_s.startswith(kw):
            primary_keitai = kw
            break

    if kubun_s and primary_keitai:
        if kubun_s == primary_keitai:
            return kubun_s
        return f"{kubun_s}（{primary_keitai}）"
    if kubun_s:
        return kubun_s
    if primary_keitai:
        return primary_keitai
    return keitai_s[:40] if keitai_s else None


def clean_work_location(raw_loc):
    """Strips '地図表示' and trailing smoking notes if overly long."""
    if not raw_loc:
        return None
    s = str(raw_loc).strip()
    s = re.split(r"地図表示|受動喫煙対策", s)[0].strip()
    s = re.sub(r"\s+", " ", s).strip()
    return s[:200] if s else None


def clean_wages(kihonkyu, chingin_keitai, ab_total=None):
    """Extracts a clean wages string from 基本給（ａ） or 賃金形態等."""
    base = (kihonkyu or ab_total or "").strip()
    if base:
        base = re.sub(r"^基本給（月額平均）又は時間額\s*", "", base)
        base = re.split(r"※フルタイム求人の場合は", base)[0].strip()
        base = re.sub(r"\s+", " ", base).strip()
    keitai = (chingin_keitai or "").strip()
    if base and keitai and keitai not in base:
        return f"{base}（{keitai}）"
    return base or keitai or None


def clean_working_hours(raw_hours):
    if not raw_hours:
        return None
    s = str(raw_hours).strip()
    s = re.split(r"就業時間に関する特記事項", s)[0].strip()
    s = re.sub(r"\s+", " ", s).strip()
    return s[:200] if s else None


def clean_holidays(raw_holidays):
    if not raw_holidays:
        return None
    s = str(raw_holidays).strip()
    s = re.sub(r"^休日\s*", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:200] if s else None


def parse_hellowork_detail_html(html, fallback_kjno=None):
    """
    Parses a HelloWork job detail HTML page and returns a dictionary with:
      corporate_number, job_number, job_title, reception_date, expiry_date,
      employment_type, wages, work_location, working_hours, holidays,
      job_description, raw_industry
    """
    soup = BeautifulSoup(html, "html.parser")
    fields = {}

    for tr in soup.select("table tr"):
        th = tr.find("th")
        tds = tr.find_all("td")
        if not th or not tds:
            continue
        k = "".join(th.get_text().split())
        if not k:
            continue

        # Take the first td text; remove 職種解説 link if present
        td = tds[0]
        for a in td.find_all("a", string=re.compile("職種解説")):
            a.decompose()
        val = td.get_text(" ", strip=True)

        # Keep first clean occurrence for work_location if shorter/cleaner, or store all
        if k not in fields or (k == "就業場所" and "地図表示" in fields[k] and "地図表示" not in val):
            fields[k] = val

    def get_field(keys):
        for k in keys:
            if k in fields and fields[k]:
                return fields[k]
        for fk, fv in fields.items():
            for k in keys:
                if k in fk and fv:
                    return fv
        return None

    # Corporate number (13 digits)
    raw_corp = get_field(["法人番号"])
    corp_digits = "".join(filter(str.isdigit, raw_corp or ""))
    corporate_number = corp_digits if len(corp_digits) == 13 else None

    # Job number
    raw_job_no = get_field(["求人番号"]) or fallback_kjno
    job_number = format_job_number(raw_job_no)

    # Job title
    job_title = clean_job_title(get_field(["職種"]))

    # Dates
    reception_date = normalize_jp_date(get_field(["受付年月日"]))
    expiry_date = normalize_jp_date(get_field(["紹介期限日", "有効期限"]))

    # Employment type
    employment_type = clean_employment_type(get_field(["求人区分"]), get_field(["雇用形態"]))

    # Wages
    wages = clean_wages(
        get_field(["基本給（ａ）"]),
        get_field(["賃金形態等"]),
        get_field(["ａ＋ｂ"])
    )

    # Work location, hours, holidays
    work_location = clean_work_location(get_field(["就業場所"]))
    working_hours = clean_working_hours(get_field(["就業時間"]))
    holidays = clean_holidays(get_field(["休日等", "休日"]))

    # Job description (up to 300 chars)
    raw_desc = get_field(["仕事内容", "仕事の内容"])
    job_description = re.sub(r"\s+", " ", raw_desc).strip()[:300] if raw_desc else None

    # Raw industry
    raw_industry = get_field(["産業分類", "産業"])

    return {
        "corporate_number": corporate_number,
        "job_number": job_number,
        "job_title": job_title,
        "reception_date": reception_date,
        "expiry_date": expiry_date,
        "employment_type": employment_type,
        "wages": wages,
        "work_location": work_location,
        "working_hours": working_hours,
        "holidays": holidays,
        "job_description": job_description,
        "raw_industry": raw_industry,
    }


# ============================================================================
# PostgreSQL Connection & Sync Logic
# ============================================================================
class HelloWorkDripDaemon:
    def __init__(self, once=False, limit=0, max_pages=3, sleep_min=8.0, sleep_max=15.0, target_pref=None):
        self.once = once
        self.limit = limit
        self.max_pages = max_pages
        self.sleep_min = sleep_min
        self.sleep_max = sleep_max
        self.target_pref = f"{int(target_pref):02d}" if target_pref else None

        self.pg_conn = None
        self.seen_job_numbers = set()

        self.total_detail_fetched = 0
        self.total_matched_companies = 0
        self.total_signals_inserted = 0
        self.total_signals_updated = 0
        self.total_hub_events_inserted = 0

    def connect_pg(self):
        """Connects to PostgreSQL (tries DATABASE_URL / local 127.0.0.1 first, then VPS IP fallback)."""
        if self.pg_conn is not None:
            try:
                with self.pg_conn.cursor() as cur:
                    cur.execute("SELECT 1;")
                return self.pg_conn
            except Exception:
                try:
                    self.pg_conn.close()
                except Exception:
                    pass
                self.pg_conn = None

        candidates = []
        env_url = os.environ.get("DATABASE_URL")
        if env_url:
            candidates.append(env_url)
        if DEFAULT_LOCAL_PG_URL not in candidates:
            candidates.append(DEFAULT_LOCAL_PG_URL)
        if FALLBACK_VPS_PG_URL not in candidates:
            candidates.append(FALLBACK_VPS_PG_URL)

        last_err = None
        for url in candidates:
            try:
                conn = psycopg2.connect(
                    url,
                    connect_timeout=15,
                    keepalives=1,
                    keepalives_idle=30,
                    keepalives_interval=10,
                    keepalives_count=5
                )
                conn.autocommit = False
                self.pg_conn = conn
                masked_url = re.sub(r":([^:@]+)@", ":***@", url)
                logger.info("Connected to PostgreSQL: %s", masked_url)
                self._ensure_schema()
                return self.pg_conn
            except Exception as e:
                last_err = e

        raise RuntimeError(f"Could not connect to PostgreSQL: {last_err}")

    def _ensure_schema(self):
        """Ensures hub_dynamic_events has event_type column and preloads recent job_numbers."""
        try:
            with self.pg_conn.cursor() as cur:
                cur.execute("""
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'hub_dynamic_events' AND column_name = 'event_type'
                    LIMIT 1;
                """)
                if not cur.fetchone():
                    cur.execute("ALTER TABLE hub_dynamic_events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50);")
            self.pg_conn.commit()
        except Exception:
            self.pg_conn.rollback()

        if not self.seen_job_numbers:
            try:
                with self.pg_conn.cursor() as cur:
                    cur.execute("SET LOCAL statement_timeout = 5000;")
                    cur.execute("""
                        SELECT substring(details from '"job_number"\\s*:\\s*"([^"]+)"')
                        FROM business_signals
                        WHERE id > (SELECT COALESCE(MAX(id), 0) - 50000 FROM business_signals)
                          AND signal_type = '求人あり'
                          AND details IS NOT NULL;
                    """)
                    for (jno,) in cur.fetchall():
                        if jno:
                            self.seen_job_numbers.add(jno)
                self.pg_conn.commit()
                logger.info("Preloaded %d recent HelloWork job_numbers into memory cache.", len(self.seen_job_numbers))
            except Exception as e:
                self.pg_conn.rollback()
                logger.warning("Could not preload recent job_numbers (continuing without preload): %s", e)

    def check_job_number_exists_in_db(self, job_number):
        """Checks in-memory cache first for O(1) deduplication before HTTP detail fetch."""
        if not job_number:
            return False
        norm_no = format_job_number(job_number)
        return norm_no in self.seen_job_numbers

    def sync_job_to_postgres(self, job_data, detail_url):
        """
        Syncs an extracted HelloWork job into PostgreSQL:
          1. Verifies company exists in `companies`
          2. Upserts `business_signals` (signal_type = '求人あり')
          3. Sets `has_hiring = true, updated_at = NOW()` on `companies`
          4. Inserts into `hub_dynamic_events` (event_category = 'hiring', event_type = '求人募集')
        Returns True if matched and synced to a company in PostgreSQL.
        """
        corp_num = job_data.get("corporate_number")
        job_number = job_data.get("job_number")
        job_title = job_data.get("job_title")

        if not corp_num or len(corp_num) != 13 or not job_title:
            return False

        conn = self.connect_pg()
        try:
            with conn.cursor() as cur:
                # 1. Check if company exists in companies table
                cur.execute("""
                    SELECT company_name,
                           COALESCE(prefecture_code, '13'),
                           COALESCE(prefecture_name, '東京都'),
                           city_name,
                           website_url
                    FROM companies
                    WHERE corporate_number = %s
                    LIMIT 1;
                """, (corp_num,))
                comp_row = cur.fetchone()
                if not comp_row:
                    conn.commit()
                    return False

                company_name, pref_code, pref_name, city_name, website_url = comp_row
                self.total_matched_companies += 1

                sig_date = job_data.get("reception_date") or datetime.now().strftime("%Y-%m-%d")
                details_dict = {
                    "wages": job_data.get("wages"),
                    "work_location": job_data.get("work_location"),
                    "working_hours": job_data.get("working_hours"),
                    "holidays": job_data.get("holidays"),
                    "employment_type": job_data.get("employment_type"),
                    "job_description": job_data.get("job_description"),
                    "expiry_date": job_data.get("expiry_date"),
                    "raw_industry": job_data.get("raw_industry"),
                    "job_number": job_number,
                }
                details_json = json.dumps(details_dict, ensure_ascii=False)
                source_url = website_url or detail_url

                # 2. Check if signal already exists for this corporate_number + (job_number OR job_title)
                cur.execute("""
                    SELECT id
                    FROM business_signals
                    WHERE corporate_number = %s
                      AND signal_type = '求人あり'
                      AND (
                          (details IS NOT NULL AND details LIKE '{%%' AND details::jsonb->>'job_number' = %s)
                          OR signal_title = %s
                      )
                    ORDER BY id DESC
                    LIMIT 1;
                """, (corp_num, job_number, job_title))
                existing_sig = cur.fetchone()

                if existing_sig:
                    sig_id = existing_sig[0]
                    cur.execute("""
                        UPDATE business_signals
                        SET details = %s,
                            signal_date = %s,
                            signal_title = %s
                        WHERE id = %s;
                    """, (details_json, sig_date, job_title, sig_id))
                    self.total_signals_updated += 1
                    sig_action = "UPDATED"
                else:
                    cur.execute("""
                        INSERT INTO business_signals (
                            corporate_number, signal_type, signal_title, signal_date, source_url, details
                        ) VALUES (%s, '求人あり', %s, %s, %s, %s);
                    """, (corp_num, job_title, sig_date, source_url, details_json))
                    self.total_signals_inserted += 1
                    sig_action = "INSERTED"

                # 3. Update companies has_hiring flag
                cur.execute("""
                    UPDATE companies
                    SET has_hiring = true,
                        is_hiring = true,
                        updated_at = NOW()
                    WHERE corporate_number = %s;
                """, (corp_num,))

                # 4. Insert into hub_dynamic_events if not already recorded for this corporate_number + title_ja on event_date
                cur.execute("""
                    SELECT id
                    FROM hub_dynamic_events
                    WHERE corporate_number = %s
                      AND event_category = 'hiring'
                      AND event_date = %s::date
                      AND title_ja = %s
                    LIMIT 1;
                """, (corp_num, sig_date, job_title))
                if not cur.fetchone():
                    cur.execute("""
                        INSERT INTO hub_dynamic_events (
                            corporate_number,
                            company_name,
                            prefecture_code,
                            prefecture_name,
                            city_name,
                            event_category,
                            event_type,
                            event_date,
                            title_ja,
                            description_ja,
                            source
                        ) VALUES (%s, %s, %s, %s, %s, 'hiring', '求人募集', %s::date, %s, %s, 'ハローワーク')
                        ON CONFLICT (corporate_number, event_category, event_date)
                        DO UPDATE SET
                            event_type = EXCLUDED.event_type,
                            title_ja = EXCLUDED.title_ja,
                            description_ja = EXCLUDED.description_ja;
                    """, (
                        corp_num,
                        company_name,
                        pref_code,
                        pref_name,
                        city_name,
                        sig_date,
                        job_title,
                        details_json,
                    ))
                    self.total_hub_events_inserted += 1

            conn.commit()
            if job_number:
                self.seen_job_numbers.add(job_number)

            logger.info(
                "[%s] %s (%s) | Job: %s (%s) | Reception: %s | Expiry: %s",
                sig_action, company_name, corp_num, job_title[:35], job_number,
                sig_date, job_data.get("expiry_date")
            )
            return True

        except Exception as e:
            conn.rollback()
            logger.error("PostgreSQL sync error for corp %s (job %s): %s", corp_num, job_number, e)
            return False

    def _build_session(self):
        s = requests.Session()
        s.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        })
        return s

    def _extract_detail_links(self, soup):
        """Returns list of (kj_no, detail_url) from a search results page."""
        results = []
        seen_on_page = set()
        for a in soup.select('a[href*="action=dispDetailBtn"]'):
            href = a.get("href", "")
            if not href:
                continue
            parsed = parse_qs(urlparse(href).query)
            raw_kjno = parsed.get("kJNo", [None])[0]
            job_no = format_job_number(raw_kjno)
            if not job_no or job_no in seen_on_page:
                continue
            seen_on_page.add(job_no)

            if href.startswith("."):
                href = "/kensaku/" + href[2:]
            detail_url = BASE_URL + href if href.startswith("/") else f"{BASE_URL}/kensaku/{href}"
            results.append((job_no, detail_url))
        return results

    def crawl_prefecture(self, pref_code):
        """Crawls the first 1-3 pages of newest jobs for a single prefecture."""
        wait_if_maintenance()
        pref_name = PREFECTURE_NAMES.get(pref_code, f"Pref-{pref_code}")
        logger.info(">>> Scanning Prefecture %s (%s) (max_pages=%d)...", pref_code, pref_name, self.max_pages)

        session = self._build_session()
        try:
            # 1. GET initial search form
            r_init = session.get(SEARCH_INIT_URL, timeout=20)
            if check_maintenance_in_response(r_init.text, r_init.status_code):
                logger.warning("[MAINTENANCE] Detected active maintenance or service pause on HelloWork init GET. Sleeping 15m...")
                time.sleep(900)
                return
            if r_init.status_code != 200:
                logger.warning("Pref %s: Init GET returned HTTP %d", pref_code, r_init.status_code)
                return

            soup_init = BeautifulSoup(r_init.text, "html.parser")
            form = soup_init.find("form")
            if not form:
                logger.warning("Pref %s: Search form not found on init page.", pref_code)
                return

            form_payload = []
            for inp in form.find_all("input"):
                name = inp.get("name")
                if not name or name in ["ippanCKBox", "todohukenHidden", "searchBtn"]:
                    continue
                itype = inp.get("type", "")
                val = inp.get("value", "")
                if itype in ["submit", "button", "image"]:
                    continue
                if itype in ["checkbox", "radio"] and not inp.has_attr("checked"):
                    continue
                form_payload.append((name, val))

            form_payload.append(("todohukenHidden", pref_code))
            form_payload.append(("ippanCKBox", "1"))
            form_payload.append(("ippanCKBox", "2"))
            form_payload.append(("searchBtn", " 検索する"))

            # 2. POST search for prefecture
            r_search = session.post(SEARCH_POST_URL, data=form_payload, timeout=20)
            if check_maintenance_in_response(r_search.text, r_search.status_code):
                logger.warning("[MAINTENANCE] Detected active maintenance or service pause on HelloWork search POST. Sleeping 15m...")
                time.sleep(900)
                return
            if r_search.status_code != 200:
                logger.warning("Pref %s: Search POST returned HTTP %d", pref_code, r_search.status_code)
                return

            current_html = r_search.text

            for page_num in range(1, self.max_pages + 1):
                wait_if_maintenance()
                soup_page = BeautifulSoup(current_html, "html.parser")
                detail_links = self._extract_detail_links(soup_page)
                logger.info("Pref %s (%s) - Page %d: Found %d job detail links.", pref_code, pref_name, page_num, len(detail_links))

                if not detail_links:
                    break

                # Process each job on the page
                for job_no, detail_url in detail_links:
                    if self.limit > 0 and self.total_detail_fetched >= self.limit:
                        logger.info("Reached --limit %d detail pages fetched. Stopping.", self.limit)
                        return

                    if self.check_job_number_exists_in_db(job_no):
                        continue

                    wait_if_maintenance()
                    sleep_time = random.uniform(self.sleep_min, self.sleep_max)
                    time.sleep(sleep_time)

                    try:
                        r_detail = session.get(detail_url, timeout=20)
                        if check_maintenance_in_response(r_detail.text, r_detail.status_code):
                            logger.warning("[MAINTENANCE] Detected active maintenance or rate limit on job %s. Sleeping 10m...", job_no)
                            time.sleep(600)
                            continue
                        if r_detail.status_code != 200:
                            logger.warning("Detail GET HTTP %d for job %s", r_detail.status_code, job_no)
                            continue
                        self.total_detail_fetched += 1
                        job_data = parse_hellowork_detail_html(r_detail.text, fallback_kjno=job_no)

                        if not job_data.get("corporate_number"):
                            # Cache job_no in RAM so we don't re-fetch jobs without corporate_number in this session
                            self.seen_job_numbers.add(job_no)
                            continue

                        self.sync_job_to_postgres(job_data, detail_url)
                    except Exception as e:
                        logger.warning("Error fetching/parsing detail %s: %s", job_no, e)

                if page_num >= self.max_pages:
                    break

                # Check Next page button
                next_btn = soup_page.find("input", attrs={"name": "fwListNaviBtnNext"})
                if not next_btn or next_btn.has_attr("disabled"):
                    break

                form_result = soup_page.find("form")
                if not form_result:
                    break

                next_payload = []
                for inp in form_result.find_all("input"):
                    name = inp.get("name")
                    if not name:
                        continue
                    itype = inp.get("type", "")
                    val = inp.get("value", "")
                    if itype in ["submit", "button", "image"]:
                        continue
                    if itype in ["checkbox", "radio"] and not inp.has_attr("checked"):
                        continue
                    next_payload.append((name, val))
                next_payload.append(("fwListNaviBtnNext", "次へ＞"))

                time.sleep(random.uniform(1.5, 3.0))
                r_next = session.post(SEARCH_POST_URL, data=next_payload, timeout=20)
                if r_next.status_code != 200:
                    logger.warning("Pref %s: Next page POST returned HTTP %d", pref_code, r_next.status_code)
                    break
                current_html = r_next.text

        except Exception as e:
            logger.error("Error crawling prefecture %s: %s", pref_code, e)
        finally:
            session.close()

    def run(self):
        logger.info("=" * 68)
        logger.info("🚀 STARTING HELLOWORK 24/7 DRIP-FEED DAEMON")
        logger.info("   Mode       : %s", "ONCE (Test/Single Pass)" if self.once else "24/7 CONTINUOUS DAEMON")
        logger.info("   Limit      : %s", self.limit if self.limit > 0 else "Unlimited")
        logger.info("   Pages/Pref : %d", self.max_pages)
        logger.info("   Sleep Range: %.1fs - %.1fs", self.sleep_min, self.sleep_max)
        logger.info("=" * 68)

        self.connect_pg()

        prefs = [self.target_pref] if self.target_pref else ALL_PREFECTURES_ORDERED
        cycle = 0

        while True:
            cycle += 1
            cycle_start_inserted = self.total_signals_inserted
            logger.info("=== Starting Nationwide Cycle #%d (%d prefectures) ===", cycle, len(prefs))
            for pref_code in prefs:
                self.crawl_prefecture(pref_code)
                if self.limit > 0 and self.total_detail_fetched >= self.limit:
                    break
                if not self.once:
                    time.sleep(random.uniform(5.0, 10.0))

            new_in_cycle = self.total_signals_inserted - cycle_start_inserted
            logger.info(
                "=== Cycle #%d Summary: Fetched=%d | MatchedCompanies=%d | InsertedSignals=%d (+%d new this cycle) | UpdatedSignals=%d | HubEvents=%d ===",
                cycle,
                self.total_detail_fetched,
                self.total_matched_companies,
                self.total_signals_inserted,
                new_in_cycle,
                self.total_signals_updated,
                self.total_hub_events_inserted,
            )

            if self.once or (self.limit > 0 and self.total_detail_fetched >= self.limit):
                break

            sleep_secs = get_adaptive_cycle_sleep_seconds(new_in_cycle)
            now_utc = datetime.now(timezone.utc)
            now_jst = now_utc + timedelta(hours=9)
            resume_time = (now_jst + timedelta(seconds=sleep_secs)).strftime("%Y-%m-%d %H:%M:%S")
            logger.info(
                "[SMART REST] Cycle #%d completed (%d new jobs). Sleeping %ds (~%.1fm) until %s JST before next cycle.",
                cycle, new_in_cycle, sleep_secs, sleep_secs / 60.0, resume_time
            )
            time.sleep(sleep_secs)


def main():
    parser = argparse.ArgumentParser(description="HelloWork 24/7 Drip-Feed Crawler & PostgreSQL Sync Daemon")
    parser.add_argument("--once", action="store_true", help="Run a single pass and exit (useful for testing)")
    parser.add_argument("--limit", type=int, default=0, help="Maximum number of detail pages to fetch before exiting")
    parser.add_argument("--pages", type=int, default=3, help="Number of newest search result pages per prefecture (default: 3)")
    parser.add_argument("--prefecture", type=str, default=None, help="Specific prefecture code (01-47) to crawl")
    args = parser.parse_args()

    # In --once mode with --limit, use fast polite 1.5s sleep for quick verification
    if args.once and args.limit > 0:
        sleep_min, sleep_max = 1.5, 1.5
    else:
        sleep_min, sleep_max = 8.0, 15.0

    daemon = HelloWorkDripDaemon(
        once=args.once,
        limit=args.limit,
        max_pages=args.pages,
        sleep_min=sleep_min,
        sleep_max=sleep_max,
        target_pref=args.prefecture,
    )
    daemon.run()


if __name__ == "__main__":
    main()
