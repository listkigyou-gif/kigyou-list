#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Data Consolidation ETL Script (SQLite Version)
===========================================================
Aggregates, normalizes, and merges raw corporate data from Bronze staging tables
(raw_hellowork, raw_website, raw_yahoo) into the Master table (companies)
and the Intent Signals table (business_signals) using source-prioritized rules.
Console outputs are written in ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import sys
import sqlite3
import json
import re
from datetime import datetime

DB_PATH = "kigyou-list.db"

def get_db_connection():
    """Establish SQLite database connection with WAL mode and timeout."""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA cache_size=-64000;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn
    except Exception as e:
        print(f"[-] Could not connect to SQLite database: {e}")
        sys.exit(1)

def to_half_width(text):
    """Convert zenkaku characters (full-width) to hankaku (half-width) for numbers, hyphens, and punctuation."""
    if not text:
        return ""
    text = str(text)
    zenkaku = "０１２３４５６７８９－ー（）＠．，"
    hankaku = "0123456789--()@.,"
    trans_table = str.maketrans(zenkaku, hankaku)
    text = text.translate(trans_table)
    text = text.replace("　", " ").replace("（", "(").replace("）", ")")
    return text.strip()

PREFECTURE_CODES = {
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

def parse_address(raw_address):
    """
    Parse a raw Japanese address into components:
    postal_code, prefecture_code, prefecture_name, city_name, street_address, full_address
    """
    if not raw_address:
        return None, None, None, None, None, None
        
    # Extract postal code
    postal_code = None
    addr_clean = raw_address.strip()
    
    # 3-digit and 4-digit separated by hyphen
    p_match = re.search(r"〒?\s*(\d{3})\s*-\s*(\d{4})", addr_clean)
    if p_match:
        postal_code = p_match.group(1) + p_match.group(2)
        addr_clean = addr_clean.replace(p_match.group(0), "").strip()
    else:
        # 7 digits consecutive
        p_match_7 = re.search(r"〒?\s*(\d{7})", addr_clean)
        if p_match_7:
            postal_code = p_match_7.group(1)
            addr_clean = addr_clean.replace(p_match_7.group(0), "").strip()
            
    # Clean leading symbols/spaces
    addr_clean = re.sub(r"^[〒\s\-,\.]+", "", addr_clean)
    
    # Extract prefecture
    pref_name = None
    pref_code = None
    for name, code in PREFECTURE_CODES.items():
        if addr_clean.startswith(name):
            pref_name = name
            pref_code = code
            addr_clean = addr_clean[len(name):].strip()
            break
            
    # Extract city and street
    city_name = None
    street_address = None
    
    if addr_clean:
        # Match city, ward, town, village or county-town/village
        m_city = re.match(r"^([^\s]+?郡[^\s]+?[町村]|[^\s]+?[市区町村])", addr_clean)
        if m_city:
            city_name = m_city.group(1)
            street_address = addr_clean[len(city_name):].strip()
        else:
            city_name = ""
            street_address = addr_clean
            
    # Full address is the cleaned address after stripping postal code
    full_address = (pref_name or "") + (city_name or "") + (street_address or "")
    if not full_address:
        full_address = raw_address
        
    return postal_code, pref_code, pref_name, city_name, street_address, full_address


def normalize_phone(phone_str):
    """Clean and standardize phone numbers to standard half-width formatted numbers, rejecting invalid placeholder/fake numbers."""
    if not phone_str:
        return None
    phone_str = to_half_width(phone_str).strip()
    if not phone_str:
        return None
        
    # 1. Reject common text placeholders
    lower_str = phone_str.lower()
    placeholders = ['なし', '非公開', '不明', '未設定', '未登録', '連絡不可', 'null', 'none', 'temp', 'dummy', 'テスト', 'test']
    for p in placeholders:
        if p in lower_str:
            return None
            
    # 2. Extract digits only to validate structure
    digits = re.sub(r'\D', '', phone_str)
    if not digits:
        return None
        
    # 3. Japanese phone numbers must start with '0' (except international prefix but representative numbers in JP should use domestic form)
    if not digits.startswith('0'):
        return None
        
    # 4. Must be of valid length (10 or 11 digits)
    if len(digits) not in (10, 11):
        return None
        
    # 5. Check if it consists of all identical digits (like 0000000000, 1111111111)
    if len(set(digits)) == 1:
        return None
        
    # 6. Check for dummy sequences
    if digits in ("0123456789", "1234567890"):
        return None
        
    # 7. Check if the suffix/local part is all zeros (e.g. 03-0000-0000 or 090-0000-0000)
    # The last 7 digits being all zeros is a clear indication of a fake/placeholder number
    if digits[-7:] == "0000000":
        return None

    # If valid, clean and return formatted number (digits and hyphens/parentheses)
    cleaned = re.sub(r"[^\d\-()]", "", phone_str)
    return cleaned if len(cleaned) >= 6 else None

def normalize_fax(fax_str):
    """Clean and standardize fax numbers."""
    return normalize_phone(fax_str)

def normalize_email(email_str):
    """Clean and standardize email addresses."""
    if not email_str:
        return None
    email_str = to_half_width(email_str).lower().strip()
    # Simple regex validation supporting + for sub-addressing
    if re.match(r"^[\w\.\-\+]+@[\w\.\-]+\.[\w]+$", email_str):
        return email_str
    return None

def normalize_url(url_str):
    """Clean and standardize URLs."""
    if not url_str:
        return None
    url_str = to_half_width(url_str).strip()
    if not url_str or url_str.lower() in ("なし", "none", "null", "-"):
        return None
    if not url_str.startswith(("http://", "https://")):
        url_str = "http://" + url_str
    if url_str.endswith("/"):
        url_str = url_str[:-1]
    return url_str

def safe_int(val):
    """Safely convert value to integer, ensuring it doesn't overflow SQLite 8-byte signed integer limits."""
    if val is None:
        return None
    try:
        val = int(val)
        if val > 9223372036854775807 or val < -9223372036854775808:
            return None
        return val
    except (ValueError, TypeError, OverflowError):
        return None

def normalize_capital(capital_str):
    """Convert various Japanese capital notations (e.g., 1000万円, 1.5億円, 5千万円) into clean integers in Yen."""
    if not capital_str:
        return None
    capital_str = to_half_width(capital_str)
    # Remove commas and spaces
    capital_str = capital_str.replace(",", "").replace(" ", "")
    if not capital_str or capital_str.lower() in ("なし", "none", "null", "-"):
        return None
        
    # Replace '千' with '000' if preceded by a digit, or '1000' if standalone
    capital_str = re.sub(r"(\d+)千", r"\g<1>000", capital_str)
    capital_str = capital_str.replace("千", "1000")
        
    try:
        # Match 億 (billion)
        m_oku = re.search(r"([\d\.]+)\s*億", capital_str)
        if m_oku:
            val = float(m_oku.group(1))
            # Check if there is a '万' part after '億', like 3億5000万円
            m_man_after = re.search(r"億\s*(\d+)\s*万?", capital_str)
            if m_man_after:
                val_man = float(m_man_after.group(1))
                return safe_int(val * 100000000 + val_man * 10000)
            return safe_int(val * 100000000)
        
        # Match 万 (ten-thousand)
        m_man = re.search(r"([\d\.]+)\s*万", capital_str)
        if m_man:
            val = float(m_man.group(1))
            return safe_int(val * 10000)
            
        # Match pure digits
        nums = "".join(re.findall(r"\d+", capital_str))
        if nums:
            return safe_int(nums)
    except Exception:
        pass
    return None

def normalize_employee(employee_str):
    """Convert employee counts (e.g., 150人, 150名) to clean integers."""
    if not employee_str:
        return None
    employee_str = to_half_width(employee_str)
    m = re.search(r"\d+", employee_str)
    if m:
        return safe_int(m.group(0))
    return None

def clean_representative_name(rep_name):
    """Clean representative names by removing titles and validating against invalid/suspicious patterns."""
    if not rep_name:
        return None
    rep_name = to_half_width(rep_name).strip()
    if not rep_name:
        return None
        
    # 1. Reject common text placeholders
    lower_str = rep_name.lower()
    placeholders = ['なし', '非公開', '不明', '未設定', '未登録', 'null', 'none', 'temp', 'dummy', 'テスト', 'test']
    for p in placeholders:
        if p in lower_str:
            return None
            
    # 2. Reject values containing digits or transition notes (Japanese names do not contain digits)
    if re.search(r'\d', rep_name) or re.search(r'[０-９]', rep_name):
        return None
        
    # 3. Reject values containing corporate or organization keywords
    corp_keywords = ['株式会社', '有限会社', '合同会社', '合資会社', '一般社団', '一般財団', '特定非営利', 'NPO', '組合', '事務局', '役場']
    for kw in corp_keywords:
        if kw in rep_name:
            return None
            
    # 4. Reject values containing email or URL patterns
    if '@' in rep_name or 'http' in lower_str or '.jp' in lower_str or '.com' in lower_str:
        return None
        
    # 5. Clean / remove titles from longest to shortest
    titles = [
        "代表取締役共同社長", "代表取締役社長", "代表取締役会長", "代表取締役副社長", "代表取締役",
        "共同代表取締役", "共同代表", "代表常務取締役", "代表専務取締役", "常務取締役", "専務取締役",
        "取締役", "代表役員", "代表社員", "代表者", "代表幹事", "代表理事", "代表",
        "会長執行役員", "社長執行役員", "副社長執行役員", "専務執行役員", "常務執行役員", "執行役員", "執行役",
        "チ-フオペレ-ティングオフィサ-", "最高経営責任者", "最高執行責任者",
        "Co-CEO", "Group CEO", "Group COO", "Group", "CEO", "COO",
        "会長", "社長", "副社長", "所長", "支店長", "管理者", "理事長", "理事", "監事",
        "兼", "務執行者", "職務執行者"
    ]
    
    # Strip titles
    for t in titles:
        rep_name = re.sub(re.escape(t), "", rep_name, flags=re.IGNORECASE)
        
    cleaned_name = rep_name.strip()
    
    # 6. Reject if the remaining string is empty
    if not cleaned_name:
        return None
        
    # Reject if it's too short (1 char) and not a common 1-kanji JP surname
    clean_len = len(re.sub(r'\s', '', cleaned_name))
    if clean_len <= 1 and cleaned_name not in ('林', '森', '原', '関', '辻', '東', '南', '西', '北'):
        return None
        
    # Reject if too long (e.g. > 15 characters, highly likely to be raw description or text error)
    if clean_len > 15:
        return None
        
    return cleaned_name

import difflib

def normalize_company_name(name):
    """Normalize Japanese company name for entity resolution."""
    if not name:
        return ""
    name = to_half_width(name)
    # Remove whitespace
    name = re.sub(r"\s+", "", name)
    # Remove common corporate type words
    org_keywords = [
        "株式会社", "有限会社", "合同会社", "合資会社", "合名会社",
        "一般社団法人", "一般財団法人", "公益社団法人", "公益財団法人",
        "特定非営利活動法人", "NPO法人", "医療法人", "学校法人", "社会福祉法人",
        "(株)", "（株）", "(有)", "（有）", "(合)", "（合）", "(名)", "（名）",
        "NPO", "npo"
    ]
    for kw in org_keywords:
        name = name.replace(kw, "")
    return name.lower()

def clean_phone_number_for_match(phone):
    """Clean phone numbers to numeric only digits for precise lookup."""
    if not phone:
        return None
    phone = to_half_width(phone)
    phone = re.sub(r"\D", "", phone)
    if len(phone) >= 9:
        return phone
    return None

def resolve_entities(conn):
    """Resolve entities by linking raw records without corporate numbers to master registries."""
    print("[*] Running Entity Resolution (Waterfall Matching)...")
    cursor = conn.cursor()
    
    # 1. Direct Bulk Phone Resolution via SQL
    print("  - Running phone-based auto-linkage...")
    
    # For raw_hellowork
    cursor.execute("""
        UPDATE raw_hellowork
        SET corporate_number = (
            SELECT c.corporate_number 
            FROM companies c 
            WHERE c.phone_number IS NOT NULL 
              AND replace(c.phone_number, '-', '') = replace(raw_hellowork.phone_number, '-', '')
            LIMIT 1
        )
        WHERE (corporate_number IS NULL OR length(corporate_number) != 13)
          AND phone_number IS NOT NULL 
          AND phone_number != '';
    """)
    hw_phone_updated = cursor.rowcount
    
    # For raw_yahoo
    cursor.execute("""
        UPDATE OR REPLACE raw_yahoo
        SET corporate_number = (
            SELECT c.corporate_number 
            FROM companies c 
            WHERE c.phone_number IS NOT NULL 
              AND replace(c.phone_number, '-', '') = replace(raw_yahoo.phone_number, '-', '')
            LIMIT 1
        )
        WHERE (corporate_number IS NULL OR length(corporate_number) != 13)
          AND phone_number IS NOT NULL 
          AND phone_number != '';
    """)
    yahoo_phone_updated = cursor.rowcount
    conn.commit()
    print(f"  [+] Linked {hw_phone_updated} HelloWork and {yahoo_phone_updated} Yahoo records by Phone Match.")
    
    # 2. Fuzzy Name & Address matching for remaining unresolved records
    cursor.execute("SELECT id, office_name, office_address FROM raw_hellowork WHERE corporate_number IS NULL OR length(corporate_number) != 13;")
    hw_unresolved = cursor.fetchall()
    
    resolved_hw_fuzzy = 0
    if hw_unresolved:
        print(f"  - Fuzzy matching {len(hw_unresolved)} remaining HelloWork records...")
        for row_id, office_name, address in hw_unresolved:
            if not office_name:
                continue
            _, pref_code, _, city_name, _, _ = parse_address(address)
            if pref_code:
                norm_name = normalize_company_name(office_name)
                
                # Fetch candidate companies
                if city_name:
                    cursor.execute("SELECT corporate_number, company_name FROM companies WHERE prefecture_code = ? AND city_name = ?;", (pref_code, city_name))
                else:
                    cursor.execute("SELECT corporate_number, company_name FROM companies WHERE prefecture_code = ?;", (pref_code,))
                
                candidates = cursor.fetchall()
                best_ratio = 0.0
                best_corp = None
                
                for c_corp, c_name in candidates:
                    c_norm = normalize_company_name(c_name)
                    if c_norm == norm_name:
                        best_corp = c_corp
                        break
                    ratio = difflib.SequenceMatcher(None, norm_name, c_norm).ratio()
                    if ratio > 0.88 and ratio > best_ratio:
                        best_ratio = ratio
                        best_corp = c_corp
                        
                if best_corp:
                    cursor.execute("UPDATE raw_hellowork SET corporate_number = ? WHERE id = ?;", (best_corp, row_id))
                    resolved_hw_fuzzy += 1
                    
        conn.commit()
        print(f"  [+] Linked {resolved_hw_fuzzy} HelloWork records by Fuzzy Name/Address Match.")
        
    cursor.execute("SELECT id, company_name, yahoo_name, yahoo_address FROM raw_yahoo WHERE corporate_number IS NULL OR length(corporate_number) != 13;")
    yahoo_unresolved = cursor.fetchall()
    
    resolved_yahoo_fuzzy = 0
    if yahoo_unresolved:
        print(f"  - Fuzzy matching {len(yahoo_unresolved)} remaining Yahoo records...")
        for row_id, comp_name, yah_name, address in yahoo_unresolved:
            name_to_use = comp_name or yah_name
            if not name_to_use:
                continue
            _, pref_code, _, city_name, _, _ = parse_address(address)
            if pref_code:
                norm_name = normalize_company_name(name_to_use)
                
                if city_name:
                    cursor.execute("SELECT corporate_number, company_name FROM companies WHERE prefecture_code = ? AND city_name = ?;", (pref_code, city_name))
                else:
                    cursor.execute("SELECT corporate_number, company_name FROM companies WHERE prefecture_code = ?;", (pref_code,))
                
                candidates = cursor.fetchall()
                best_ratio = 0.0
                best_corp = None
                
                for c_corp, c_name in candidates:
                    c_norm = normalize_company_name(c_name)
                    if c_norm == norm_name:
                        best_corp = c_corp
                        break
                    ratio = difflib.SequenceMatcher(None, norm_name, c_norm).ratio()
                    if ratio > 0.88 and ratio > best_ratio:
                        best_ratio = ratio
                        best_corp = c_corp
                        
                if best_corp:
                    cursor.execute("UPDATE OR REPLACE raw_yahoo SET corporate_number = ? WHERE id = ?;", (best_corp, row_id))
                    resolved_yahoo_fuzzy += 1
                    
        conn.commit()
        print(f"  [+] Linked {resolved_yahoo_fuzzy} Yahoo records by Fuzzy Name/Address Match.")

def parse_receipt_date(date_str):
    """Convert HelloWork date receipt format to standard YYYY-MM-DD."""
    if not date_str:
        return None
    date_str = to_half_width(date_str)
    
    # Format YYYY年MM月DD日
    m = re.match(r"^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?$", date_str)
    if m:
        return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
        
    # Format YYYY/MM/DD or YYYY-MM-DD
    m = re.match(r"^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$", date_str)
    if m:
        return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
        
    return None

def normalize_establishment_date(est_str):
    """Normalize establishment date raw strings (year, full date, or Japanese era formats) into standard YYYY-MM-DD."""
    if not est_str:
        return None
    
    # Convert zenkaku numbers to hankaku, strip
    est_str = to_half_width(est_str).strip()
    if not est_str or est_str.lower() in ("なし", "none", "null", "-"):
        return None
        
    # 1. Check for Japanese imperial eras
    # 昭和 (Showa), 平成 (Heisei), 令和 (Reiwa), 元年 (gannen = year 1)
    era_offsets = {
        "令和": 2018,
        "平成": 1988,
        "昭和": 1925,
        "大正": 1911
    }
    
    for era, offset in era_offsets.items():
        if era in est_str:
            # Extract year number, handle '元' as 1
            year_part = est_str.split(era)[1]
            m_year = re.search(r"(\d+|元)", year_part)
            if m_year:
                y_val = m_year.group(1)
                y_num = 1 if y_val == "元" else int(y_val)
                gregorian_year = offset + y_num
                
                # Check for month and day
                m_month_day = re.search(r"(\d+)\s*月\s*(\d+)\s*日?", year_part)
                if m_month_day:
                    month = int(m_month_day.group(1))
                    day = int(m_month_day.group(2))
                    return f"{gregorian_year:04d}-{month:02d}-{day:02d}"
                else:
                    # If only era year is provided, return YYYY
                    return f"{gregorian_year:04d}"
                    
    # 2. Check for Western formats
    # Format: YYYY年MM月DD日
    m_jp = re.match(r"^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?$", est_str)
    if m_jp:
        return f"{int(m_jp.group(1)):04d}-{int(m_jp.group(2)):02d}-{int(m_jp.group(3)):02d}"
        
    # Format: YYYY/MM/DD or YYYY-MM-DD or YYYY.MM.DD
    m_delim = re.match(r"^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$", est_str)
    if m_delim:
        return f"{int(m_delim.group(1)):04d}-{int(m_delim.group(2)):02d}-{int(m_delim.group(3)):02d}"
        
    # Format: YYYY/MM or YYYY-MM or YYYY.MM
    m_month = re.match(r"^(\d{4})[-\/\.](\d{1,2})$", est_str)
    if m_month:
        return f"{int(m_month.group(1)):04d}-{int(m_month.group(2)):02d}"
        
    # Format: Pure 4-digit year (e.g. 1977)
    m_year_only = re.match(r"^(\d{4})\s*(年|年度)?$", est_str)
    if m_year_only:
        return f"{int(m_year_only.group(1)):04d}"
        
    # Parse numbers sequentially if any 4-digit number is found
    m_fallback = re.search(r"(\d{4})", est_str)
    if m_fallback:
        return f"{int(m_fallback.group(1)):04d}"
        
    return None

def consolidate_data(incremental=False):
    """Main ETL orchestration logic (optimized to only process corporate numbers with raw staging records)."""
    print("[*] Connecting to database...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Enable WAL mode and synchronous settings for fast execution
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    
    # Ensure website_crawl_status and yahoo_last_crawled_at columns exist in companies table
    cursor.execute("PRAGMA table_info(companies);")
    columns = [row[1] for row in cursor.fetchall()]
    if "website_crawl_status" not in columns:
        print("[*] Migrating SQLite companies table: adding website_crawl_status column...")
        cursor.execute("ALTER TABLE companies ADD COLUMN website_crawl_status TEXT NULL;")
        conn.commit()
    if "yahoo_last_crawled_at" not in columns:
        print("[*] Migrating SQLite companies table: adding yahoo_last_crawled_at column...")
        cursor.execute("ALTER TABLE companies ADD COLUMN yahoo_last_crawled_at TEXT NULL;")
        conn.commit()
    
    # Run Entity Resolution first to link raw records
    resolve_entities(conn)
    
    # 1. Fetch all distinct corporate numbers from the raw tables (full or incremental)
    if incremental:
        print("[*] Gathering corporate numbers with new/unmerged raw data (incremental)...")
        cursor.execute("""
            SELECT DISTINCT hw.corporate_number FROM raw_hellowork hw
            LEFT JOIN business_signals bs ON hw.corporate_number = bs.corporate_number 
                 AND bs.signal_type = '求人あり' 
                 AND bs.signal_title = hw.job_title
            LEFT JOIN companies c ON hw.corporate_number = c.corporate_number
            WHERE hw.corporate_number IS NOT NULL AND length(hw.corporate_number) = 13
              AND (bs.id IS NULL OR hw.scraped_at > c.updated_at)
            
            UNION
            
            SELECT DISTINCT w.corporate_number FROM raw_website w
            LEFT JOIN companies c ON w.corporate_number = c.corporate_number
            WHERE w.corporate_number IS NOT NULL AND length(w.corporate_number) = 13
              AND (c.website_last_crawled_at IS NULL OR w.scraped_at > c.updated_at)
              
            UNION
            
            SELECT DISTINCT y.corporate_number FROM raw_yahoo y
            LEFT JOIN companies c ON y.corporate_number = c.corporate_number
            WHERE y.corporate_number IS NOT NULL AND length(y.corporate_number) = 13
              AND (c.yahoo_last_crawled_at IS NULL OR y.scraped_at > c.updated_at);
        """)
    else:
        print("[*] Gathering ALL corporate numbers from raw tables...")
        cursor.execute("""
            SELECT DISTINCT corporate_number FROM raw_hellowork 
            WHERE corporate_number IS NOT NULL AND length(corporate_number) = 13
            UNION
            SELECT DISTINCT corporate_number FROM raw_yahoo
            WHERE corporate_number IS NOT NULL AND length(corporate_number) = 13
            UNION
            SELECT DISTINCT corporate_number FROM raw_website
            WHERE corporate_number IS NOT NULL AND length(corporate_number) = 13;
        """)
    raw_corp_nums = [row[0] for row in cursor.fetchall()]
    total_nums = len(raw_corp_nums)
    print(f"[+] Found {total_nums} distinct corporate numbers in raw tables.")
    
    stats_updated = 0
    stats_inserted = 0
    stats_signals = 0
    
    print("[*] Processing each corporate number...")
    
    # We will process in batches and commit periodically
    for idx, corp_num in enumerate(raw_corp_nums, 1):
        # A. Query if company already exists in Master table
        cursor.execute("""
            SELECT corporate_number, company_name, phone_number, fax_number, website_url, 
                   email_address, representative_name, capital_amount, employee_count, 
                   business_summary, jigyo_shumoku, branch_phone_numbers, establishment_date,
                   website_last_crawled_at, website_crawl_status, yahoo_last_crawled_at
            FROM companies WHERE corporate_number = ?;
        """, (corp_num,))
        existing_comp = cursor.fetchone()
        
        # Query Bronze Layer staging records for this corporate number
        # A. HelloWork (Selecting job_description too)
        cursor.execute("""
            SELECT phone_number, fax_number, email_address, website_url, representative_name, 
                   capital_amount, total_employees, job_title, receipt_date, wages, 
                   work_location, holidays, industry, scraped_at, establishment_year,
                   office_name, office_address, job_number, job_description
            FROM raw_hellowork WHERE corporate_number = ?;
        """, (corp_num,))
        hellowork_records = cursor.fetchall()
        
        # B. Official Website
        cursor.execute("""
            SELECT phone_number, fax_number, email_address, website_url, representative_name, capital_amount, employee_count, business_summary
            FROM raw_website WHERE corporate_number = ?;
        """, (corp_num,))
        website_records = cursor.fetchall()
        
        # C. Yahoo Search/Maps
        cursor.execute("""
            SELECT phone_number, website_url, company_name, yahoo_name, yahoo_address, scraped_at
            FROM raw_yahoo WHERE corporate_number = ?;
        """, (corp_num,))
        yahoo_records = cursor.fetchall()
        
        # --- SOURCE PRIORITIZATION INTERPOLATION ---
        
        # 1. PHONE NUMBER (HelloWork -> Website -> G-Biz/Master -> Yahoo)
        phone_candidates = []
        for r in hellowork_records:
            if r[0]: phone_candidates.append(normalize_phone(r[0]))
        for r in website_records:
            if r[0]: phone_candidates.append(normalize_phone(r[0]))
        if existing_comp and existing_comp[2]:
            phone_candidates.append(normalize_phone(existing_comp[2]))
        for r in yahoo_records:
            if r[0]: phone_candidates.append(normalize_phone(r[0]))
            
        final_phone = next((p for p in phone_candidates if p), None)
        
        # 2. FAX NUMBER (Website -> HelloWork -> Master)
        fax_candidates = []
        for r in website_records:
            if r[1]: fax_candidates.append(normalize_fax(r[1]))
        for r in hellowork_records:
            if r[1]: fax_candidates.append(normalize_fax(r[1]))
        if existing_comp and existing_comp[3]:
            fax_candidates.append(normalize_fax(existing_comp[3]))
            
        final_fax = next((f for f in fax_candidates if f), None)
        
        # 3. WEBSITE URL (G-Biz -> Yahoo -> HelloWork)
        gbiz_url = None
        if existing_comp and existing_comp[4]:
            master_url = normalize_url(existing_comp[4])
            hw_urls = [normalize_url(r[3]) for r in hellowork_records if r[3]]
            yahoo_urls = [normalize_url(r[1]) for r in yahoo_records if r[1]]
            if master_url and (master_url not in hw_urls) and (master_url not in yahoo_urls):
                gbiz_url = master_url
                
        yahoo_url = next((normalize_url(r[1]) for r in yahoo_records if r[1]), None)
        hellowork_url = next((normalize_url(r[3]) for r in hellowork_records if r[3]), None)
        
        final_url = gbiz_url or yahoo_url or hellowork_url
        if not final_url and existing_comp and existing_comp[4]:
            final_url = normalize_url(existing_comp[4])
        
        # 4. EMAIL ADDRESS (Website -> HelloWork -> Master)
        email_candidates = []
        for r in website_records:
            if r[2]: email_candidates.append(normalize_email(r[2]))
        for r in hellowork_records:
            if r[2]: email_candidates.append(normalize_email(r[2]))
        if existing_comp and existing_comp[5]:
            email_candidates.append(normalize_email(existing_comp[5]))
            
        final_email = next((e for e in email_candidates if e), None)
        
        # 5. REPRESENTATIVE NAME (Master -> HelloWork -> Website)
        rep_candidates = []
        if existing_comp and existing_comp[6]:
            rep_candidates.append(clean_representative_name(existing_comp[6]))
        for r in hellowork_records:
            if r[4]: rep_candidates.append(clean_representative_name(r[4]))
        for r in website_records:
            if r[4]: rep_candidates.append(clean_representative_name(r[4]))
            
        final_rep = next((rp for rp in rep_candidates if rp), None)
        
        # 6. CAPITAL AMOUNT (Master -> Website -> HelloWork)
        capital_candidates = []
        if existing_comp and existing_comp[7] and existing_comp[7] > 0:
            capital_candidates.append(existing_comp[7])
        for r in website_records:
            if r[5]:
                val = normalize_capital(r[5])
                if val and val > 0:
                    capital_candidates.append(val)
        for r in hellowork_records:
            if r[5]:
                val = normalize_capital(r[5])
                if val and val > 0:
                    capital_candidates.append(val)
            
        final_capital = next((c for c in capital_candidates if c), None)
        
        # 6b. ESTABLISHMENT DATE (Master -> HelloWork)
        establishment_candidates = []
        if existing_comp and existing_comp[12]:
            establishment_candidates.append(normalize_establishment_date(existing_comp[12]))
        for r in hellowork_records:
            if r[14]: # establishment_year is column 14
                establishment_candidates.append(normalize_establishment_date(r[14]))
                
        final_establishment = next((d for d in establishment_candidates if d), None)
        
        # 7. EMPLOYEE COUNT (Website -> HelloWork -> Master)
        employee_candidates = []
        for r in website_records:
            if r[6]: employee_candidates.append(normalize_employee(r[6]))
        for r in hellowork_records:
            if r[6]: employee_candidates.append(normalize_employee(r[6]))
        if existing_comp and existing_comp[8]:
            employee_candidates.append(existing_comp[8])
            
        final_employee = next((em for em in employee_candidates if em), None)
        
        # 8. BUSINESS SUMMARY (Combine Website and HelloWork job description to maximize AI context)
        summary_parts = []
        for r in website_records:
            if r[7] and r[7].strip() and r[7].strip() not in summary_parts:
                summary_parts.append(r[7].strip())
        for r in hellowork_records:
            if len(r) > 18 and r[18] and r[18].strip() and r[18].strip() not in summary_parts:
                summary_parts.append(r[18].strip())
        if existing_comp and existing_comp[9] and existing_comp[9].strip() and existing_comp[9].strip() not in summary_parts:
            summary_parts.append(existing_comp[9].strip())
            
        final_summary = "\n".join(summary_parts) if summary_parts else None
        
        # 9. BRANCH PHONE NUMBERS (Collect unique phone candidates other than final_phone)
        distinct_phones = []
        for p in phone_candidates:
            if p and p != final_phone and p not in distinct_phones:
                distinct_phones.append(p)
        final_branch_phones = json.dumps(distinct_phones, ensure_ascii=False) if distinct_phones else None
        
        # Determine latest Yahoo crawl timestamp
        yahoo_scraped_ats = [r[5] for r in yahoo_records if len(r) > 5 and r[5]]
        latest_yahoo_scraped_at = max(yahoo_scraped_ats) if yahoo_scraped_ats else None

        # --- UPDATE OR INSERT MASTER ---
        if existing_comp:
            # Check if any changes are present compared to the old Master record
            master_phone = existing_comp[2]
            master_fax = existing_comp[3]
            master_url = existing_comp[4]
            master_email = existing_comp[5]
            master_rep = existing_comp[6]
            master_capital = existing_comp[7]
            master_employee = existing_comp[8]
            master_summary = existing_comp[9]
            master_branch_phones = existing_comp[11]
            master_establishment = existing_comp[12]
            master_last_crawled = existing_comp[13] if len(existing_comp) > 13 else None
            master_crawl_status = existing_comp[14] if len(existing_comp) > 14 else None
            master_yahoo_last_crawled = existing_comp[15] if len(existing_comp) > 15 else None
            
            # Reset website crawl status if URL changed
            if final_url != master_url:
                final_last_crawled = None
                final_crawl_status = None
            else:
                final_last_crawled = master_last_crawled
                final_crawl_status = master_crawl_status
                
            final_yahoo_last_crawled = master_yahoo_last_crawled
            if latest_yahoo_scraped_at:
                if not master_yahoo_last_crawled or latest_yahoo_scraped_at > master_yahoo_last_crawled:
                    final_yahoo_last_crawled = latest_yahoo_scraped_at
            
            if (final_phone != master_phone or final_fax != master_fax or 
                final_url != master_url or final_email != master_email or 
                final_rep != master_rep or final_capital != master_capital or 
                final_employee != master_employee or final_summary != master_summary or
                final_branch_phones != master_branch_phones or
                final_establishment != master_establishment or
                final_last_crawled != master_last_crawled or
                final_crawl_status != master_crawl_status or
                final_yahoo_last_crawled != master_yahoo_last_crawled):
                
                cursor.execute("""
                    UPDATE companies
                    SET phone_number = ?,
                        fax_number = ?,
                        website_url = ?,
                        email_address = ?,
                        representative_name = ?,
                        capital_amount = ?,
                        employee_count = ?,
                        business_summary = ?,
                        branch_phone_numbers = ?,
                        establishment_date = ?,
                        website_last_crawled_at = ?,
                        website_crawl_status = ?,
                        yahoo_last_crawled_at = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE corporate_number = ?;
                """, (final_phone, final_fax, final_url, final_email, final_rep, final_capital, final_employee, final_summary, final_branch_phones, final_establishment, final_last_crawled, final_crawl_status, final_yahoo_last_crawled, corp_num))
                stats_updated += 1
        else:
            # Company Name priority: HelloWork office_name -> Yahoo company_name -> Yahoo yahoo_name -> Fallback
            company_name_candidates = []
            for r in hellowork_records:
                if r[15]: company_name_candidates.append(r[15].strip()) # office_name
            for r in yahoo_records:
                if r[2]: company_name_candidates.append(r[2].strip()) # company_name
                if r[3]: company_name_candidates.append(r[3].strip()) # yahoo_name
            final_company_name = next((n for n in company_name_candidates if n), "不明な企業")
            
            # Address priority: HelloWork office_address -> Yahoo yahoo_address
            address_candidates = []
            for r in hellowork_records:
                if r[16]: address_candidates.append(r[16].strip()) # office_address
            for r in yahoo_records:
                if r[4]: address_candidates.append(r[4].strip()) # yahoo_address
            
            final_address_raw = next((a for a in address_candidates if a), None)
            postal_code, pref_code, pref_name, city_name, street_address, full_address = None, None, None, None, None, None
            if final_address_raw:
                postal_code, pref_code, pref_name, city_name, street_address, full_address = parse_address(final_address_raw)
                
            cursor.execute("""
                INSERT INTO companies (
                    corporate_number, company_name, postal_code, prefecture_code, prefecture_name,
                    city_name, street_address, full_address, representative_name, establishment_date,
                    capital_amount, employee_count, phone_number, fax_number, website_url,
                    email_address, business_summary, branch_phone_numbers, yahoo_last_crawled_at, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '活動中', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            """, (corp_num, final_company_name, postal_code, pref_code, pref_name, city_name, street_address, full_address, final_rep, final_establishment, final_capital, final_employee, final_phone, final_fax, final_url, final_email, final_summary, final_branch_phones, latest_yahoo_scraped_at))
            stats_inserted += 1
            
        # --- RECRUITMENT SIGNAL INTEGRATION ---
        # Generate B2B intent signals (求人あり) for HelloWork recruitment ads
        for hw in hellowork_records:
            phone, fax, email, url, rep, cap, emp, job_title, receipt_date, wages, work_location, holidays, raw_industry, scraped_at, est_yr, office_name, office_address, job_number, job_desc = hw
            if not job_title:
                continue
                
            parsed_date = parse_receipt_date(receipt_date)
            sig_date = parsed_date if parsed_date else scraped_at
            
            # Pack nested details as JSON
            details = {
                "wages": wages,
                "work_location": work_location,
                "holidays": holidays,
                "raw_industry": raw_industry,
                "job_number": job_number
            }
            details_json = json.dumps(details, ensure_ascii=False)
            
            # Prevent duplicate signal insertion for the same job posting number
            cursor.execute("""
                SELECT id FROM business_signals 
                WHERE corporate_number = ? AND signal_type = '求人あり' AND signal_title = ? AND signal_date = ?;
            """, (corp_num, job_title, sig_date))
            
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO business_signals (corporate_number, signal_type, signal_title, signal_date, source_url, details)
                    VALUES (?, '求人あり', ?, ?, ?, ?);
                """, (corp_num, job_title, sig_date, final_url, details_json))
                stats_signals += 1
                
        # Commit batch every 1000 records
        if idx % 1000 == 0:
            conn.commit()
            print(f"[+] Consolidated {idx}/{total_nums} records...")
            
    conn.commit()
    conn.close()
    
    print("\n" + "="*50)
    print("      SUMMARY OF DATA CONSOLIDATION (ETL)")
    print("="*50)
    print(f"  - Master companies updated       : {stats_updated} records")
    print(f"  - Master companies inserted      : {stats_inserted} records")
    print(f"  - Recruitment signals generated  : {stats_signals} records")
    print("="*50)

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Kigyou-list Data Consolidation ETL")
    parser.add_argument("--incremental", action="store_true", help="Only process corporate numbers with new raw staging data")
    args = parser.parse_args()

    print("="*60)
    print("      KIGYOU-LIST: DATA CONSOLIDATION SYSTEM (ETL)")
    if args.incremental:
        print("      MODE: INCREMENTAL CONSOLIDATION")
    print("="*60)
    
    start_time = datetime.now()
    try:
        consolidate_data(incremental=args.incremental)
        duration = datetime.now() - start_time
        print(f"[+] Consolidation ETL completed successfully in: {duration}")
        
        # Trigger rebuilding of metadata stats
        print("[*] Triggering rebuild of metadata stats...")
        try:
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            from rebuild_metadata_stats import rebuild_metadata
            rebuild_metadata()
        except Exception as e:
            print(f"[-] Error rebuilding metadata stats: {e}")
            
    except Exception as e:
        print(f"[-] Fatal error during consolidation: {e}")
        
if __name__ == "__main__":
    main()

