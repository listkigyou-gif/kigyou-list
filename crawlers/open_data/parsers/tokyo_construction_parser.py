#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Tokyo Construction License Parser
==============================================
Parses the monthly Excel file from Tokyo Urban Development Bureau
(東京都都市整備局: 建設業許可業者名簿) and extracts structured data.
"""

import re
import datetime
import unicodedata
import openpyxl

SPECIALTY_NAMES = [
    '土木', '建築', '大工', '左官', 'とび', '石工', '屋根', '電気', '管',
    'タイル', '鋼構造物', '鉄筋', '舗装', 'しゅんせつ', '板金', 'ガラス',
    '塗装', '防水', '内装', '機械器具', '熱絶縁', '電気通信', '造園',
    'さく井', '建具', '水道施設', '消防施設', '清掃施設', '解体'
]

def normalize_text(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", str(text)).strip()
    text = re.sub(r"[\(（]株[\)）]", "株式会社", text)
    text = re.sub(r"[\(（]有[\)）]", "有限会社", text)
    text = re.sub(r"[\(（]合[\)）]", "合同会社", text)
    text = re.sub(r"\s+", "", text)
    return text

def parse_reiwa_date(date_str):
    """
    Parses Reiwa/Heisei dates like 'R08.05.30' or 'H30.01.15' or datetime objects.
    """
    if not date_str:
        return None
    if isinstance(date_str, (datetime.datetime, datetime.date)):
        return date_str.strftime("%Y-%m-%d")
        
    date_str = str(date_str).strip()
    match = re.match(r"^([RHSErhse])(\d{1,2})\.(\d{1,2})\.(\d{1,2})$", date_str)
    if match:
        era, era_year, month, day = match.groups()
        era = era.upper()
        era_year = int(era_year)
        month = int(month)
        day = int(day)
        
        if era == "R":
            year = 2018 + era_year
        elif era == "H":
            year = 1988 + era_year
        elif era == "S":
            year = 1925 + era_year
        else:
            year = 2000 + era_year
            
        return f"{year:04d}-{month:02d}-{day:02d}"
        
    return None

def parse_tokyo_construction_file(file_path):
    """
    Generator that yields structured company license records from Tokyo Excel file.
    """
    wb = openpyxl.load_workbook(file_path, read_only=True)
    sheet = wb.active
    
    # Iterate from row 4 (1-indexed, rows 1-3 are headers and notices)
    for row in sheet.iter_rows(min_row=4, values_only=True):
        raw_lic_num = row[0]
        raw_name = row[1]
        raw_kana = row[2]
        raw_phone = row[3]
        raw_postal = row[4]
        raw_pref_city = row[5]
        raw_street = row[6]
        raw_rep = row[7]
        is_corp = (row[8] == '法')
        raw_capital = row[10]
        raw_issue_date = row[12]
        raw_fiscal_date = row[42] if len(row) > 42 else None
        
        if not raw_name or not raw_lic_num:
            continue
            
        # Format License Number (e.g., 東京都知事許可 第000005号)
        lic_number_str = str(raw_lic_num).strip()
        formatted_lic_num = f"東京都知事許可 第{lic_number_str.zfill(6)}号"
        
        # Postal code (7 digits)
        postal_str = str(raw_postal).strip().zfill(7) if raw_postal else None
        
        # Capital amount in Yen (file stores in 1,000s of Yen)
        capital_yen = None
        if raw_capital is not None:
            try:
                capital_yen = int(raw_capital) * 1000
            except (ValueError, TypeError):
                capital_yen = None
                
        # Parse Dates
        issue_date = parse_reiwa_date(raw_issue_date)
        fiscal_date = parse_reiwa_date(raw_fiscal_date)
        
        # 29 Construction Specialties (Cols 13 to 41)
        active_specialties = {}
        has_tokutei = False
        has_ippan = False
        
        for idx, spec_name in enumerate(SPECIALTY_NAMES):
            col_idx = 13 + idx
            if col_idx < len(row):
                val = row[col_idx]
                if val == 1:
                    active_specialties[spec_name] = "一般"
                    has_ippan = True
                elif val == 2:
                    active_specialties[spec_name] = "特定"
                    has_tokutei = True
                    
        # License Category
        if has_tokutei and has_ippan:
            lic_category = "知事免許 (特定・一般)"
        elif has_tokutei:
            lic_category = "知事免許 (特定)"
        else:
            lic_category = "知事免許 (一般)"
            
        full_address = f"{raw_pref_city or ''}{raw_street or ''}".strip()
        
        yield {
            "license_number": formatted_lic_num,
            "raw_lic_num": lic_number_str,
            "company_name": str(raw_name).strip(),
            "norm_name": normalize_text(raw_name),
            "company_name_kana": str(raw_kana).strip() if raw_kana else None,
            "office_phone": str(raw_phone).strip() if raw_phone else None,
            "postal_code": postal_str,
            "prefecture_code": "13",
            "issuing_authority": "東京都",
            "registered_address": full_address,
            "representative_name": str(raw_rep).strip() if raw_rep else None,
            "is_corp": is_corp,
            "capital_amount": capital_yen,
            "issue_date": issue_date,
            "fiscal_date": fiscal_date,
            "license_category": lic_category,
            "specialties": active_specialties
        }

if __name__ == "__main__":
    import sys
    test_file = "importdata/open-data/13_tokyo/tokyo_kensetsu_kyokajun.xlsx"
    records = list(parse_tokyo_construction_file(test_file))
    print(f"Successfully parsed {len(records):,} records from {test_file}")
    if records:
        print("First sample record:")
        import pprint
        pprint.pprint(records[0])
