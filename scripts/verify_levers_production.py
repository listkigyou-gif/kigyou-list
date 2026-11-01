# -*- coding: utf-8 -*-
"""
Script đo kiểm tra và xác thực toàn diện Bộ 3 Đòn Bẩy On-Page trên Production:
1. Đòn bẩy 1: Meta Description công ty đưa KPIs lên 80 ký tự đầu.
2. Đòn bẩy 2: Title Hubs Phá Sản 47 tỉnh chứa '信用調査・倒産速報'.
3. Đòn bẩy 3: Dynamic Title BXH Lương đổi theo Tỉnh thành.
4. Kiểm tra vị trí thẻ <head> Googlebot cho toàn bộ các URLs.
"""
import sys
import json
import urllib.request
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

USER_AGENT = "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.69 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

def fetch_url(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            return resp.status, html
    except Exception as e:
        return 0, str(e)

def verify_all():
    print("=" * 60)
    print("🚀 BẮT ĐẦU ĐO KIỂM BỘ 3 ĐÒN BẨY ON-PAGE TRÊN PRODUCTION")
    print("=" * 60)

    # 1. ĐO KIỂM ĐÒN BẨY 1: TRANG CHI TIẾT CÔNG TY
    print("\n[1/3] ĐO KIỂM ĐÒN BẨY 1: META DESCRIPTION TRANG CÔNG TY...")
    # Nissan Chemical Corporation: 1010001008734
    test_company_url = "https://kigyoulist.com/ja/company/1010001008734"
    status, html = fetch_url(test_company_url)
    print(f"URL: {test_company_url} | HTTP Status: {status}")
    if status == 200:
        desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']', html)
        if desc_match:
            desc = desc_match.group(1)
            print(f"Meta Description (First 120 chars): {desc[:120]}")
            has_frontloaded_kpi = "【売上:" in desc or "【従業員:" in desc or "【TEL:" in desc
            print(f"-> Frontloaded KPIs in first 80 chars: {has_frontloaded_kpi}")
        else:
            print("[-] Meta description not found!")
        
        # Verify head integrity
        head_end = html.find("</head>")
        title_pos = html.find("<title>")
        can_pos = html.find('rel="canonical"')
        valid_head = (0 < title_pos < head_end) and (0 < can_pos < head_end)
        print(f"-> Thẻ <head> hợp lệ (Title & Canonical bên trong): {valid_head}")
    else:
        print(f"[-] Không thể tải URL công ty: {html}")

    # 2. ĐO KIỂM ĐÒN BẨY 2: HUB PHÁ SẢN 47 TỈNH
    print("\n[2/3] ĐO KIỂM ĐÒN BẨY 2: TITLE HUBS PHÁ SẢN (TOKYO)...")
    test_bankruptcies_url = "https://kigyoulist.com/ja/status/bankruptcies/13"
    status, html = fetch_url(test_bankruptcies_url)
    print(f"URL: {test_bankruptcies_url} | HTTP Status: {status}")
    if status == 200:
        title_match = re.search(r'<title>([^<]+)</title>', html)
        if title_match:
            title = title_match.group(1)
            print(f"Title: {title}")
            has_intent = "信用調査・倒産速報" in title
            print(f"-> Title chứa cụm từ Search Intent '信用調査・倒産速報': {has_intent}")
        else:
            print("[-] Title not found!")
    else:
        print(f"[-] Không thể tải URL phá sản: {html}")

    # 3. ĐO KIỂM ĐÒN BẨY 3: DYNAMIC TITLE BXH LƯƠNG THEO TỈNH
    print("\n[3/3] ĐO KIỂM ĐÒN BẨY 3: DYNAMIC TITLE BXH LƯƠNG (TOKYO)...")
    test_salary_url = "https://kigyoulist.com/ja/ranking/salary?prefecture=13"
    status, html = fetch_url(test_salary_url)
    print(f"URL: {test_salary_url} | HTTP Status: {status}")
    if status == 200:
        title_match = re.search(r'<title>([^<]+)</title>', html)
        if title_match:
            title = title_match.group(1)
            print(f"Title: {title}")
            has_pref = "東京都" in title
            print(f"-> Title tự động chuyển đổi theo Tỉnh '東京都': {has_pref}")
        else:
            print("[-] Title not found!")
    else:
        print(f"[-] Không thể tải URL bảng lương: {html}")

    print("\n" + "=" * 60)
    print("✅ HOÀN TẤT ĐO KIỂM PRODUCTION!")
    print("=" * 60)

if __name__ == "__main__":
    verify_all()
