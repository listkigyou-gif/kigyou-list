#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: G-Biz Info API v1 Incremental Sync Script
=====================================================
Fetches incremental corporate updates from Japan's METI gBizINFO REST API v1
using the provided API token. Implements strict rate-limiting (max 5 requests/sec)
to prevent token blocking (limit: 6000 requests / 10 minutes) and tracks last sync date.

What we import from G-Biz API v1 detail (/hojin/v1/hojin/{corp_number}):

[companies table]
  - corporate_number, name, kana, name_en
  - postal_code, location (parsed to prefecture/city/street)
  - representative_name, representative_position
  - date_of_establishment -> establishment_date
  - capital_stock         -> capital_amount
  - employee_number       -> employee_count
  - company_url           -> website_url
  - business_summary
  - status (+ close_cause/close_date -> mapped to status value)

[business_signals table]
  - subsidy[]     -> signal_type='補助金'
  - patent[]      -> signal_type='特許'
  - procurement[] -> signal_type='調達'
  - certification[]-> signal_type='届出・認定'
  - commendation[]-> signal_type='表彰'

[company_financials table]
  - finance.management_index[] -> one row per fiscal period (sequence_number)
    fields: net_sales, net_income, ordinary_income, capital_stock, net_assets,
            total_assets, number_of_employees

Console outputs are written in ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import sys
import re
import json
import time
import ssl
import urllib.request
import urllib.parse
import urllib.error
import sqlite3
from datetime import datetime, timedelta

# Reconfigure stdout to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = "kigyou-list.db"
STATE_FILE = "importdata/gbiz-data/gbiz_sync_state.json"
API_TOKEN = "wkEEhgj9URidoSvpfzzA4ZocL0iL8cEK"

# Target organization types based on digits 6-7 of NTA 13-digit corporate number:
# "01" = Kabushiki Gaisha (Joint stock company)
# "02" = Yugen Gaisha (Limited liability company)
# "05" = Godo Gaisha (Limited liability company / LLC)
TARGET_CORP_TYPES = {"01", "02", "05"}

# Japan 47 Prefectures mapping to ISO/JIS 2-digit codes
PREFECTURES = {
    "北海道": "01", "青森県": "02", "岩手県": "03", "宮城県": "04", "秋田県": "05",
    "山形県": "06", "福島県": "07", "茨城県": "08", "栃木県": "09", "群馬県": "10",
    "埼玉県": "11", "千葉県": "12", "東京都": "13", "神奈川県": "14", "新潟県": "15",
    "富山県": "16", "石川県": "17", "福井県": "18", "山梨県": "19", "長野県": "20",
    "岐阜県": "21", "静岡県": "22", "愛知県": "23", "三重県": "24", "滋賀県": "25",
    "京都府": "26", "大阪府": "27", "兵庫県": "28", "奈良県": "29", "和歌山県": "30",
    "鳥取県": "31", "島根県": "32", "岡山県": "33", "広島県": "34", "山口県": "35",
    "徳島県": "36", "香川県": "37", "愛媛県": "38", "高知県": "39", "福岡県": "40",
    "佐賀県": "41", "長崎県": "42", "熊本県": "43", "大分県": "44", "宮崎県": "45",
    "鹿児島県": "46", "沖縄県": "47"
}

# Close cause codes → Japanese status text
CLOSE_CAUSE_STATUS_MAP = {
    "1": "清算中",
    "2": "吸収合併",
    "3": "新設合併",
    "4": "破産手続",
    "5": "解散",
    "11": "登記記録閉鎖",
}


# =============================================================================
# DB CONNECTION
# =============================================================================

def get_db_connection():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA foreign_keys = OFF;")  # Disable for bulk import performance
        return conn
    except Exception as e:
        print(f"[-] Could not connect to SQLite database: {e}")
        sys.exit(1)


# =============================================================================
# STATE MANAGEMENT
# =============================================================================

def load_sync_state():
    """Load the last sync date from state file."""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                state = json.load(f)
                return state.get("last_sync_date")
        except Exception as e:
            print(f"[~] Warning loading state file: {e}")
    # Default fallback: 7 days ago
    default_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    return default_date


def save_sync_state(sync_date):
    """Save the last sync date to state file."""
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump({"last_sync_date": sync_date, "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}, f, indent=2)
            print(f"[+] Saved sync state: {sync_date}")
    except Exception as e:
        print(f"[-] Error saving state file: {e}")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def parse_int(val):
    if val is None:
        return None
    try:
        cleaned = re.sub(r"[^\d\-]", "", str(val).strip())
        return int(cleaned) if cleaned and cleaned != "-" else None
    except (ValueError, OverflowError):
        return None


def parse_float(val):
    if val is None:
        return None
    try:
        return float(str(val).strip())
    except (ValueError, TypeError):
        return None


def parse_api_date(date_str):
    """Normalize Western/API date format to YYYY-MM-DD."""
    if not date_str:
        return None
    date_str = str(date_str).strip()
    m = re.match(r"^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})", date_str)
    if m:
        return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    return date_str[:10] if len(date_str) >= 10 else date_str


def extract_prefecture(location):
    """Extract prefecture name and code from Japanese full address."""
    if not location:
        return None, None
    location = location.strip()
    for pref_name, pref_code in PREFECTURES.items():
        if location.startswith(pref_name):
            return pref_code, pref_name
    for pref_name, pref_code in PREFECTURES.items():
        if pref_name in location[:10]:
            return pref_code, pref_name
    return None, None


def parse_address_components(location, pref_name):
    """Parse city_name and street_address from Japanese address string."""
    if not location:
        return None, None
    addr = location.strip()
    if pref_name and addr.startswith(pref_name):
        addr = addr[len(pref_name):].strip()
    # Designated cities: さいたま市緑区, 横浜市中区
    m = re.match(r'^([^市区町村]+市[^市区町村]+区)(.*)$', addr)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    # Standard: 文京区, 飯能市, 志木市
    m = re.match(r'^([^市区町村]+[市区町村])(.*)$', addr)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return addr, ""


# =============================================================================
# PARSE COMPANY RECORD
# =============================================================================

def map_hojin_to_company(hojin):
    """Parse G-Biz Info API v1 detail dict to companies schema format."""
    corp_num = hojin.get("corporate_number")
    if not corp_num:
        return None
    corp_num = str(corp_num).strip()
    if len(corp_num) != 13:
        return None

    # -- Basic info --
    company_name = hojin.get("name")
    company_name_kana = hojin.get("kana")
    company_name_en = hojin.get("name_en")

    postal_code = hojin.get("postal_code")
    if postal_code:
        postal_code = re.sub(r"[^\d]", "", str(postal_code))[:7]

    full_address = hojin.get("location")
    prefecture_code, prefecture_name = extract_prefecture(full_address)
    city_name, street_address = parse_address_components(full_address, prefecture_name)

    representative_name = hojin.get("representative_name")
    representative_position = hojin.get("representative_position")
    org_type = corp_num[5:7]
    if not representative_position:
        representative_position = "代表取締役" if org_type == "01" else "代表者"

    establishment_date = parse_api_date(hojin.get("date_of_establishment"))
    capital_amount = parse_int(hojin.get("capital_stock"))
    employee_count = parse_int(hojin.get("employee_number"))
    website_url = hojin.get("company_url")
    business_summary = hojin.get("business_summary")

    # -- Status: handle close_cause -> specific status text --
    close_cause = hojin.get("close_cause")
    close_date = parse_api_date(hojin.get("close_date"))
    if close_cause and str(close_cause).strip():
        status = CLOSE_CAUSE_STATUS_MAP.get(str(close_cause).strip(), "解散")
    else:
        raw_status = hojin.get("status", "")
        if not raw_status or raw_status.strip() in ("-", ""):
            status = "活動中"
        else:
            status = raw_status.strip()

    return {
        "corporate_number": corp_num,
        "company_name": company_name,
        "company_name_kana": company_name_kana,
        "company_name_en": company_name_en,
        "postal_code": postal_code,
        "prefecture_code": prefecture_code,
        "prefecture_name": prefecture_name,
        "city_name": city_name,
        "street_address": street_address,
        "full_address": full_address,
        "representative_name": representative_name,
        "representative_position": representative_position,
        "establishment_date": establishment_date,
        "capital_amount": capital_amount,
        "employee_count": employee_count,
        "website_url": website_url,
        "business_summary": business_summary,
        "status": status,
        "close_date": close_date,
    }


# =============================================================================
# PARSE SIGNALS
# =============================================================================

def parse_signals(hojin, corp_num):
    """Extract business_signals rows from API response."""
    signals = []

    # -- Subsidy (補助金) --
    # CSV equiv: Hojokinjoho_UTF-8.csv
    # Fields: title, amount, date_of_approval, government_departments, subsidy_resource, target, note, joint_signatures
    for item in hojin.get("subsidy", []) or []:
        title = item.get("title") or "補助金"
        signal_date = parse_api_date(item.get("date_of_approval"))
        gov = item.get("government_departments")
        amt = parse_int(item.get("amount"))
        source_key = f"{corp_num}_補助金_{signal_date}_{title[:40]}"
        details = {
            "subsidy_resource": item.get("subsidy_resource"),
            "target": item.get("target"),
            "note": item.get("note"),
            "joint_signatures": item.get("joint_signatures"),
        }
        signals.append({
            "corporate_number": corp_num,
            "signal_type": "補助金",
            "signal_title": title,
            "signal_date": signal_date,
            "amount": amt,
            "government_departments": gov,
            "source_key": source_key,
            "source_url": None,
            "details": json.dumps(details, ensure_ascii=False),
        })

    # -- Patent (特許・意匠・商標) --
    # CSV equiv: Tokkyojoho_UTF-8.csv
    # Fields: title, patent_type, application_number, application_date, classifications
    for item in hojin.get("patent", []) or []:
        title = item.get("title") or "特許"
        patent_type = item.get("patent_type", "特許")
        signal_date = parse_api_date(item.get("application_date"))
        app_num = item.get("application_number", "")
        source_key = f"{corp_num}_特許_{app_num}" if app_num else f"{corp_num}_特許_{signal_date}_{title[:30]}"
        details = {
            "patent_type": patent_type,
            "application_number": app_num,
            "classifications": item.get("classifications"),
        }
        signals.append({
            "corporate_number": corp_num,
            "signal_type": "特許",
            "signal_title": title,
            "signal_date": signal_date,
            "amount": None,
            "government_departments": None,
            "source_key": source_key,
            "source_url": None,
            "details": json.dumps(details, ensure_ascii=False),
        })

    # -- Procurement (調達・受注) --
    # CSV equiv: Chotatsujoho_UTF-8.csv
    # Fields: title, amount, date_of_order, government_departments, joint_signatures
    for item in hojin.get("procurement", []) or []:
        title = item.get("title") or "調達案件"
        signal_date = parse_api_date(item.get("date_of_order"))
        gov = item.get("government_departments")
        amt = parse_int(item.get("amount"))
        source_key = f"{corp_num}_調達_{signal_date}_{title[:40]}"
        details = {
            "joint_signatures": item.get("joint_signatures"),
        }
        signals.append({
            "corporate_number": corp_num,
            "signal_type": "調達",
            "signal_title": title,
            "signal_date": signal_date,
            "amount": amt,
            "government_departments": gov,
            "source_key": source_key,
            "source_url": None,
            "details": json.dumps(details, ensure_ascii=False),
        })

    # -- Certification (届出・認定) --
    # CSV equiv: TodokedeNinteijoho_UTF-8.csv
    # Fields: title, date_of_approval, expiration_date, government_departments, enterprise_scale, category, target
    for item in hojin.get("certification", []) or []:
        title = item.get("title") or "届出・認定"
        signal_date = parse_api_date(item.get("date_of_approval"))
        gov = item.get("government_departments")
        source_key = f"{corp_num}_届出認定_{signal_date}_{title[:40]}"
        details = {
            "expiration_date": item.get("expiration_date"),
            "enterprise_scale": item.get("enterprise_scale"),
            "category": item.get("category"),
            "target": item.get("target"),
        }
        signals.append({
            "corporate_number": corp_num,
            "signal_type": "届出・認定",
            "signal_title": title,
            "signal_date": signal_date,
            "amount": None,
            "government_departments": gov,
            "source_key": source_key,
            "source_url": None,
            "details": json.dumps(details, ensure_ascii=False),
        })

    # -- Commendation (表彰) --
    # CSV equiv: Hyoshojoho_UTF-8.csv
    # Fields: title, date_of_commendation, government_departments, category, target
    for item in hojin.get("commendation", []) or []:
        title = item.get("title") or "表彰"
        signal_date = parse_api_date(item.get("date_of_commendation"))
        gov = item.get("government_departments")
        source_key = f"{corp_num}_表彰_{signal_date}_{title[:40]}"
        details = {
            "category": item.get("category"),
            "target": item.get("target"),
        }
        signals.append({
            "corporate_number": corp_num,
            "signal_type": "表彰",
            "signal_title": title,
            "signal_date": signal_date,
            "amount": None,
            "government_departments": gov,
            "source_key": source_key,
            "source_url": None,
            "details": json.dumps(details, ensure_ascii=False),
        })

    return signals


# =============================================================================
# PARSE FINANCIALS
# =============================================================================

def parse_financials(hojin, corp_num):
    """Extract company_financials rows from finance.management_index array."""
    financials = []
    finance = hojin.get("finance")
    if not finance or not isinstance(finance, dict):
        return financials

    fiscal_year_cover = finance.get("fiscal_year_cover_page", "")
    management_index = finance.get("management_index", []) or []

    for idx, mi in enumerate(management_index):
        if not isinstance(mi, dict):
            continue

        # sequence_number: use "period" field (回次) if available, else index position
        period_str = mi.get("period")
        try:
            seq_num = int(str(period_str).strip()) - 1 if period_str else idx
        except (ValueError, TypeError):
            seq_num = idx

        # Revenue: prefer net_sales, fallback to operating_revenue1 or gross_operating_revenue
        sales_amount = (
            parse_int(mi.get("net_sales_summary_of_business_results")) or
            parse_int(mi.get("operating_revenue1_summary_of_business_results")) or
            parse_int(mi.get("operating_revenue2_summary_of_business_results")) or
            parse_int(mi.get("gross_operating_revenue_summary_of_business_results"))
        )

        # Ordinary income: prefer ordinary_income_loss, fallback to ordinary_income
        ordinary_income = (
            parse_int(mi.get("ordinary_income_loss_summary_of_business_results")) or
            parse_int(mi.get("ordinary_income_summary_of_business_results"))
        )

        net_income = parse_int(mi.get("net_income_loss_summary_of_business_results"))
        capital_amount = parse_int(mi.get("capital_stock_summary_of_business_results"))
        net_assets = parse_int(mi.get("net_assets_summary_of_business_results"))
        total_assets = parse_int(mi.get("total_assets_summary_of_business_results"))
        employee_count = parse_int(mi.get("number_of_employees"))

        # Skip entirely empty rows
        if all(v is None for v in [sales_amount, ordinary_income, net_income, capital_amount, net_assets, total_assets]):
            continue

        financials.append({
            "corporate_number": corp_num,
            "fiscal_year": fiscal_year_cover or f"Period-{seq_num}",
            "sequence_number": seq_num,
            "fiscal_year_start": None,  # Not provided in management_index
            "fiscal_year_end": None,
            "sales_amount": sales_amount,
            "ordinary_income": ordinary_income,
            "net_income": net_income,
            "capital_amount": capital_amount,
            "net_assets": net_assets,
            "total_assets": total_assets,
            "employee_count": employee_count,
        })

    return financials


# =============================================================================
# FETCH FROM API
# =============================================================================

def fetch_gbiz_updates(from_date, limit_max=None):
    """Query G-Biz API v1 updateInfo and fetch details with rate limiting."""
    headers = {
        "X-hojinInfo-api-token": API_TOKEN,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    from_param = re.sub(r"[^\d]", "", from_date)
    to_param = datetime.now().strftime("%Y%m%d")

    page = 1
    all_records = []

    print(f"[*] Querying G-Biz Info API v1 for updates from {from_param} to {to_param}")

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    while True:
        params = {"from": from_param, "to": to_param, "page": page}
        url = f"https://info.gbiz.go.jp/hojin/v1/hojin/updateInfo?{urllib.parse.urlencode(params)}"
        print(f"  -> Requesting update list Page {page}...")

        try:
            req = urllib.request.Request(url, headers=headers)
            t0 = time.time()
            with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
                hojin_list = data.get("hojin-infos", [])

            if not hojin_list:
                print("[*] No more update records found.")
                break

            print(f"    [+] {len(hojin_list)} update records on page {page} ({time.time()-t0:.2f}s)")

            for item in hojin_list:
                corp_number = item.get("corporate_number")
                if not corp_number:
                    continue
                corp_type = corp_number[5:7] if len(corp_number) == 13 else ""
                if corp_type not in TARGET_CORP_TYPES:
                    continue

                # Rate limit: 0.2s between detail requests
                time.sleep(0.2)

                detail_url = f"https://info.gbiz.go.jp/hojin/v1/hojin/{corp_number}"
                try:
                    detail_req = urllib.request.Request(detail_url, headers=headers)
                    with urllib.request.urlopen(detail_req, context=ctx, timeout=20) as detail_resp:
                        detail_data = json.loads(detail_resp.read().decode("utf-8"))
                        detail_hojins = detail_data.get("hojin-infos", [])
                        if not detail_hojins:
                            continue
                        h = detail_hojins[0]

                        comp = map_hojin_to_company(h)
                        if comp:
                            signals = parse_signals(h, corp_number)
                            financials = parse_financials(h, corp_number)
                            all_records.append({
                                "company": comp,
                                "signals": signals,
                                "financials": financials,
                            })
                            print(f"    [+] {corp_number} ({comp['company_name']}) | signals={len(signals)} finance={len(financials)}")

                except Exception as detail_err:
                    print(f"    [-] Error fetching detail for {corp_number}: {detail_err}")

                if limit_max and len(all_records) >= limit_max:
                    print(f"[*] Reached limit_max of {limit_max} records.")
                    break

            if limit_max and len(all_records) >= limit_max:
                break
            if len(hojin_list) < 1:
                break
            page += 1

        except urllib.error.HTTPError as e:
            try:
                error_body = e.read().decode("utf-8")
            except Exception:
                error_body = ""
            print(f"[-] G-Biz API HTTP Error {e.code}: {e.reason} | {error_body}")
            if e.code == 429:
                print("[-] Rate limit exceeded. Waiting 10s...")
                time.sleep(10)
            break
        except Exception as e:
            print(f"[-] Network/parse error: {e}")
            break

    return all_records


# =============================================================================
# SAVE TO DATABASE
# =============================================================================

def save_to_db(all_records):
    if not all_records:
        print("[*] No records to import.")
        return 0, 0, 0

    print(f"[*] Saving {len(all_records)} company records to SQLite...")
    conn = get_db_connection()
    cursor = conn.cursor()

    company_sql = """
        INSERT INTO companies (
            corporate_number, company_name, company_name_kana, company_name_en,
            postal_code, prefecture_code, prefecture_name, city_name, street_address, full_address,
            representative_name, representative_position, establishment_date,
            capital_amount, employee_count, website_url, business_summary, status,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (corporate_number) DO UPDATE
        SET company_name              = COALESCE(EXCLUDED.company_name, company_name),
            company_name_kana         = COALESCE(EXCLUDED.company_name_kana, company_name_kana),
            company_name_en           = COALESCE(EXCLUDED.company_name_en, company_name_en),
            postal_code               = COALESCE(EXCLUDED.postal_code, postal_code),
            prefecture_code           = COALESCE(EXCLUDED.prefecture_code, prefecture_code),
            prefecture_name           = COALESCE(EXCLUDED.prefecture_name, prefecture_name),
            city_name                 = COALESCE(EXCLUDED.city_name, city_name),
            street_address            = COALESCE(EXCLUDED.street_address, street_address),
            full_address              = COALESCE(EXCLUDED.full_address, full_address),
            representative_name       = COALESCE(EXCLUDED.representative_name, representative_name),
            representative_position   = COALESCE(EXCLUDED.representative_position, representative_position),
            establishment_date        = COALESCE(EXCLUDED.establishment_date, establishment_date),
            capital_amount            = COALESCE(EXCLUDED.capital_amount, capital_amount),
            employee_count            = COALESCE(EXCLUDED.employee_count, employee_count),
            website_last_crawled_at   = CASE 
                WHEN EXCLUDED.website_url IS NOT NULL AND EXCLUDED.website_url IS NOT website_url THEN NULL 
                ELSE website_last_crawled_at 
            END,
            website_crawl_status      = CASE 
                WHEN EXCLUDED.website_url IS NOT NULL AND EXCLUDED.website_url IS NOT website_url THEN NULL 
                ELSE website_crawl_status 
            END,
            website_url               = COALESCE(EXCLUDED.website_url, website_url),
            business_summary          = COALESCE(EXCLUDED.business_summary, business_summary),
            status                    = EXCLUDED.status,
            updated_at                = CURRENT_TIMESTAMP;
    """

    signal_sql = """
        INSERT INTO business_signals (
            corporate_number, signal_type, signal_title, signal_date,
            amount, government_departments, source_key, source_url, details
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (source_key) DO UPDATE
        SET signal_date           = COALESCE(EXCLUDED.signal_date, signal_date),
            amount                = COALESCE(EXCLUDED.amount, amount),
            government_departments= COALESCE(EXCLUDED.government_departments, government_departments),
            details               = EXCLUDED.details;
    """

    financial_sql = """
        INSERT INTO company_financials (
            corporate_number, fiscal_year, sequence_number,
            fiscal_year_start, fiscal_year_end,
            sales_amount, ordinary_income, net_income,
            capital_amount, net_assets, total_assets, employee_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (corporate_number, sequence_number) DO UPDATE
        SET fiscal_year      = EXCLUDED.fiscal_year,
            sales_amount     = COALESCE(EXCLUDED.sales_amount, sales_amount),
            ordinary_income  = COALESCE(EXCLUDED.ordinary_income, ordinary_income),
            net_income       = COALESCE(EXCLUDED.net_income, net_income),
            capital_amount   = COALESCE(EXCLUDED.capital_amount, capital_amount),
            net_assets       = COALESCE(EXCLUDED.net_assets, net_assets),
            total_assets     = COALESCE(EXCLUDED.total_assets, total_assets),
            employee_count   = COALESCE(EXCLUDED.employee_count, employee_count);
    """

    imported_companies = 0
    imported_signals = 0
    imported_financials = 0

    for record in all_records:
        comp = record["company"]
        corp_type = comp["corporate_number"][5:7]
        if corp_type not in TARGET_CORP_TYPES:
            continue

        # Insert company
        cursor.execute(company_sql, (
            comp["corporate_number"], comp["company_name"], comp["company_name_kana"], comp["company_name_en"],
            comp["postal_code"], comp["prefecture_code"], comp["prefecture_name"], comp["city_name"],
            comp["street_address"], comp["full_address"], comp["representative_name"],
            comp["representative_position"], comp["establishment_date"], comp["capital_amount"],
            comp["employee_count"], comp["website_url"], comp["business_summary"], comp["status"]
        ))
        imported_companies += 1

        # Insert signals (delete old ones for this company first to avoid duplicates on re-sync)
        # We use INSERT OR IGNORE via ON CONFLICT DO NOTHING for idempotency instead
        for sig in record.get("signals", []):
            try:
                cursor.execute(signal_sql, (
                    sig["corporate_number"], sig["signal_type"], sig["signal_title"],
                    sig["signal_date"], sig.get("amount"), sig.get("government_departments"),
                    sig.get("source_key"), sig["source_url"], sig["details"]
                ))
                imported_signals += 1
            except Exception as se:
                print(f"    [~] Signal insert error: {se}")

        # Insert financials
        for fin in record.get("financials", []):
            try:
                cursor.execute(financial_sql, (
                    fin["corporate_number"], fin["fiscal_year"], fin["sequence_number"],
                    fin["fiscal_year_start"], fin["fiscal_year_end"],
                    fin["sales_amount"], fin["ordinary_income"], fin["net_income"],
                    fin["capital_amount"], fin["net_assets"], fin["total_assets"], fin["employee_count"]
                ))
                imported_financials += 1
            except Exception as fe:
                print(f"    [~] Financial insert error: {fe}")

    conn.commit()
    conn.close()

    print(f"[+] Saved: {imported_companies} companies | {imported_signals} signals | {imported_financials} financials")
    return imported_companies, imported_signals, imported_financials


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 60)
    print("      G-BIZ INFO REST API V1 SYNC SYSTEM")
    print("=" * 60)

    from_date = None
    limit = None

    for arg in sys.argv[1:]:
        if arg.startswith("--from-date="):
            from_date = arg.split("=", 1)[1].strip()
        elif arg.startswith("--limit="):
            try:
                limit = int(arg.split("=", 1)[1].strip())
            except ValueError:
                pass

    if not from_date:
        from_date = load_sync_state()

    if not re.match(r"^\d{4}-\d{2}-\d{2}$", from_date):
        print(f"[-] Invalid date format: {from_date}. Must be YYYY-MM-DD.")
        sys.exit(1)

    t_start = time.time()
    all_records = fetch_gbiz_updates(from_date, limit)

    imported_companies, imported_signals, imported_financials = save_to_db(all_records)

    if all_records:
        save_sync_state(datetime.now().strftime("%Y-%m-%d"))

    duration = time.time() - t_start
    print(f"[+] Done in {duration:.1f}s | {len(all_records)} fetched | "
          f"{imported_companies} companies | {imported_signals} signals | {imported_financials} financials")
    print("=" * 60)


if __name__ == "__main__":
    main()
