#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-List: HelloWork Extracted Data Inspector
==============================================
Xem chi tiết các trường dữ liệu cào về từ HelloWork trực quan.
Cách dùng:
    python scripts/view_crawled_data.py
    python scripts/view_crawled_data.py --limit 10
"""

import os
import sys
import sqlite3
import argparse

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if not os.path.exists(os.path.join(ROOT_DIR, "crawlers", "hellowork", "data", "hellowork.db")):
    ROOT_DIR = r"C:\kigyou-list"

DB_PATH = os.path.join(ROOT_DIR, "crawlers", "hellowork", "data", "hellowork.db")

def format_row(title, val):
    v = str(val).strip() if val is not None else ""
    if not v:
        v = "(Không có / Để trống)"
    v_lines = v.splitlines()
    if len(v_lines) == 1:
        return f"  * {title:<22}: {v}"
    else:
        res = [f"  * {title:<22}: {v_lines[0]}"]
        for line in v_lines[1:]:
            res.append(f"    {' ':<22}  {line}")
        return "\n".join(res)

def view_records(limit=5):
    if not os.path.exists(DB_PATH):
        print(f"[-] Không tìm thấy database tại: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    query = """
        SELECT j.*, 
               c.company_name, c.company_name_kana, c.address AS comp_address, 
               c.website, c.representative_name, c.phone_number, c.fax_number, 
               c.email, c.industry_name, c.capital, c.employee_count_total, 
               c.established_year
        FROM jobs j
        LEFT JOIN companies c ON j.corporate_number = c.corporate_number
        ORDER BY j.rowid DESC
        LIMIT ?
    """
    
    rows = c.execute(query, (limit,)).fetchall()
    conn.close()

    print("=" * 80)
    print(f"      DANH SÁCH {len(rows)} BẢN GHI VỪA ĐƯỢC BÓC TÁCH MỚI NHẤT TỪ HELLOWORK")
    print("=" * 80)

    for i, r in enumerate(rows, 1):
        print(f"\n╔{'═'*78}╗")
        print(f"║ BẢN GHI #{i:02d} | Mã tuyển dụng (kJNo): {r['job_id']:<15} | Ngày cào: {r['discovered_at']} ║")
        print(f"╠{'═'*78}╣")
        
        # 1. THÔNG TIN DOANH NGHIỆP
        print("║ [1] THÔNG TIN DOANH NGHIỆP TUYỂN DỤNG (BẢNG COMPANIES):")
        print("╟" + "─"*78)
        print(format_row("Tên công ty", r['company_name']))
        print(format_row("Mã số thuế / Pháp nhân", r['corporate_number']))
        print(format_row("Địa chỉ trụ sở", r['comp_address']))
        print(format_row("Website công ty", r['website']))
        print(format_row("Người đại diện", r['representative_name']))
        print(format_row("Số điện thoại", r['phone_number']))
        print(format_row("Số FAX", r['fax_number']))
        print(format_row("Email liên hệ", r['email']))
        print(format_row("Ngành nghề kinh doanh", r['industry_name']))
        print(format_row("Năm thành lập", r['established_year']))
        print(format_row("Tổng số nhân sự", f"{r['employee_count_total']} người" if r['employee_count_total'] else ""))
        
        # 2. THÔNG TIN CHI TIẾT VIỆC LÀM
        print("\n║ [2] THÔNG TIN CHI TIẾT VIỆC LÀM (BẢNG JOBS):")
        print("╟" + "─"*78)
        print(format_row("Chức danh tuyển dụng", r['job_title']))
        print(format_row("Hình thức làm việc", r['employment_type']))
        print(format_row("Ngày tiếp nhận tin", r['reception_date']))
        print(format_row("Mức lương & Trợ cấp", r['salary_remarks']))
        print(format_row("Địa điểm làm việc", r['work_location']))
        print(format_row("Thời gian làm việc", r['working_hours']))
        print(format_row("Chế độ ngày nghỉ", r['holiday_remarks']))
        print(format_row("Chế độ bảo hiểm", r['insurance_remarks']))
        print(format_row("Yêu cầu kinh nghiệm/bằng", r['requirements']))
        print(format_row("Quy trình tuyển chọn", r['selection_method']))
        print(format_row("Người / Bộ phận liên hệ", r['contact_person']))
        print(f"╚{'═'*78}╝")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Xem chi tiết các trường dữ liệu cào về")
    parser.add_argument("--limit", type=int, default=3, help="Số bản ghi muốn xem (mặc định: 3)")
    args = parser.parse_args()
    view_records(args.limit)
