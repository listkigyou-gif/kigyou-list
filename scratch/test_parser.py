import asyncio
import sqlite3
import os
import sys
import httpx
import re
from bs4 import BeautifulSoup

# Reconfigure stdout/stderr to UTF-8
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = r"c:\TUHOCLAPTRINH\kigyou-list\crawlers\hellowork\data\hellowork.db"

# Import helper functions from extractor.py
def _clean_address(text):
    if not text: return None
    return re.sub(r'\s+', '', text)

def _clean_number(text):
    if not text: return None
    num_str = "".join(filter(lambda x: x.isdigit() or x == '.', text.replace(',', '')))
    if not num_str: return 0
    try:
        val = float(num_str)
        if "兆" in text: val *= 1000000000000
        elif "億" in text: val *= 100000000
        elif "万" in text: val *= 10000
        return val 
    except: return 0

def _convert_era_to_year(text):
    if not text: return None
    eras = {"明治": 1867, "大正": 1911, "昭和": 1925, "平成": 1988, "令和": 2018}
    for era, base in eras.items():
        if era in text:
            m = re.search(r'(\d+|元)年', text)
            if m:
                year_val = 1 if m.group(1) == "元" else int(m.group(1))
                return year_val + base
    return text

def _clean_representative(text):
    if not text: return None
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for i, line in enumerate(lines):
        if "代表者名" in line:
            if i + 1 < len(lines): return lines[i+1]
            return line.replace("代表者名", "").strip()
    return lines[-1] if lines else None

def parse_detail(html, job_id):
    soup = BeautifulSoup(html, 'html.parser')
    data = {"job": {"job_id": job_id}, "company": {}}
    all_details = {}
    for row in soup.find_all("tr"):
        th = row.find("th")
        tds = row.find_all("td")
        if th and tds:
            main_title = "".join(th.get_text().split())
            for td in tds:
                for a in td.find_all("a", string=re.compile("職種解説")): a.decompose()
                value = td.get_text("\n", strip=True)
                lines = [l.strip() for l in value.split('\n') if l.strip()]
                if len(lines) >= 2:
                    sub_title = lines[0]
                    sub_value = "\n".join(lines[1:])
                    if sub_title not in all_details: all_details[sub_title] = sub_value
                if main_title and main_title not in all_details: all_details[main_title] = value

    def find_val(keywords):
        for k in keywords:
            if k in all_details: return all_details[k]
        for k, v in all_details.items():
            for kw in keywords:
                if kw in k: return v
        return None

    data["company"].update({
        "company_name": find_val(["事業所名"]),
        "address": _clean_address(find_val(["所在地"])),
        "industry_name": find_val(["産業"]),
        "capital": _clean_number(find_val(["資本金"])),
        "employee_count_total": _clean_number(find_val(["企業全体", "従業員数"])),
        "employee_count_workplace": _clean_number(find_val(["就業場所"])),
        "employee_count_female": _clean_number(find_val(["うち女性"])),
        "employee_count_part_time": _clean_number(find_val(["うちパート"])),
        "established_year": _convert_era_to_year(find_val(["設立年"])),
        "representative_name": _clean_representative(find_val(["役職／代表者名", "代表者名"])),
        "website": (soup.select_one("#ID_hp").get_text(strip=True) if soup.select_one("#ID_hp") else None)
    })

    contact_id_map = {"email": "#ID_ttsEmail", "phone_number": "#ID_ttsTel", "fax_number": "#ID_ttsFax"}
    for key, selector in contact_id_map.items():
        el = soup.select_one(selector)
        if el: data["company"][key] = el.get_text(strip=True)

    data["job"].update({
        "reception_date": find_val(["受付年月日"]),
        "job_title": find_val(["職種"]),
        "job_content": find_val(["仕事内容", "仕事"]),
        "employment_type": find_val(["求人区分", "雇用形態"]),
        "contract_period": find_val(["雇用期間"]),
        "work_location": _clean_address(find_val(["就業場所"])),
        "salary_remarks": find_val(["基本給（ａ）", "基本給", "賃金", "手当", "ａ＋ｂ"]),
        "working_hours": find_val(["就業時間"]),
        "holiday_remarks": find_val(["休日"]),
        "insurance_remarks": find_val(["加入保険等"]),
        "requirements": find_val(["必要な経験", "必要な免許"]),
        "selection_method": find_val(["選考方法"]),
        "contact_person": find_val(["担当者"])
    })

    for k, v in all_details.items():
        if "法人番号" in k:
            num = "".join(filter(str.isdigit, v))
            if len(num) == 13:
                data["company"]["corporate_number"] = data["job"]["corporate_number"] = num
                break
    return data

async def main():
    job_ids = ["0101017129161", "0101017141461"]
    
    for job_id in job_ids:
        print(f"\n====================================")
        print(f"Testing job_id: {job_id}")
        
        url = f"https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?action=dispDetailBtn&kJNo={job_id}&kJobSNo=1&screenId=GECA110010"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "ja-JP,ja;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Referer": "https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
        }
        
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(url, headers=headers, timeout=20.0)
            html = resp.text
            if "ID_shokugyo" in html:
                data = parse_detail(html, job_id)
                print("\n--- PARSED DATA SUCCESS ---")
                print("Company Data:")
                for k, v in data["company"].items():
                    print(f"  {k}: {v}")
                print("\nJob Data:")
                for k, v in data["job"].items():
                    print(f"  {k}: {v}")
            else:
                print("Failed to fetch detail page.")
                print(f"Status Code: {resp.status_code}")
                print(f"Snippet: {html[:500]}")

if __name__ == "__main__":
    asyncio.run(main())
