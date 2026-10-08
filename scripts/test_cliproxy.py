#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script kiểm tra kết nối Cliproxy cho hệ thống gửi Form DM (DFY Outreach).
Kiểm tra xem proxy có kết nối được không và IP có đúng quốc gia Nhật Bản (JP) không.
"""

import sys
import requests
import json

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

def test_proxy(proxy_url: str):
    print("=" * 60)
    print("  KIỂM TRA KẾT NỐI CLIPROXY CHO LUỒNG GỬI FORM")
    print("=" * 60)
    print(f"[*] Proxy URL: {proxy_url}")
    
    proxies = {
        "http": proxy_url,
        "https": proxy_url
    }
    
    try:
        print("[*] Đang gửi request kiểm tra IP thực tế qua Proxy...")
        resp = requests.get("https://ipinfo.io/json", proxies=proxies, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            ip = data.get("ip")
            country = data.get("country")
            city = data.get("city")
            org = data.get("org")
            
            print("\n[+] KẾT NỐI PROXY THÀNH CÔNG!")
            print(f"    - IP xuất hiện: {ip}")
            print(f"    - Quốc gia:     {country} {'[CHUẨN NHẬT BẢN - JP]' if country == 'JP' else '[CẢNH BÁO: Không phải JP!]'}")
            print(f"    - Thành phố:    {city}")
            print(f"    - Nhà mạng/ISP: {org}")
            
            if country != "JP":
                print("\n[!] LƯU Ý: Để gửi form doanh nghiệp Nhật tốt nhất, bạn nên chọn Country/Region là 'Japan' (JP) trên Cliproxy.")
            else:
                print("\n[✓] Sẵn sàng tích hợp vào Playwright để gửi form!")
        else:
            print(f"[-] Lỗi phản hồi HTTP: {resp.status_code}")
    except Exception as e:
        print(f"[-] Lỗi kết nối Proxy: {e}")
        print("\n[Gợi ý khắc phục]:")
        print("1. Kiểm tra lại username, password, host:port.")
        print("2. Đảm bảo bạn đã chọn Host Châu Á (sg.arxlabs.io:3010).")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        proxy_url = sys.argv[1]
    else:
        # Ví dụ mẫu lấy từ dashboard của bạn:
        print("Sử dụng: python scripts/test_cliproxy.py \"http://username:password@host:port\"")
        print("Hoặc định dạng: python scripts/test_cliproxy.py \"http://scbnl247335-region-JP-sid-test-t-5:kim1234.@sg.arxlabs.io:3010\"")
        sys.exit(0)
        
    test_proxy(proxy_url)
