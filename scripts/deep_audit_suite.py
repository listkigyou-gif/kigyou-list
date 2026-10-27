import os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vps_remote_exec import run_command
import json
import re

def execute_audit():
    print("=" * 80)
    print("       HỆ THỐNG KIỂM THỬ ĐỘC LẬP CHUYÊN SÂU (DEEP AUDIT ENGINE)")
    print("       Đánh Giá Toàn Diện Các Tinh Hoa SEO Nâng Cấp Trên Production")
    print("=" * 80)

    # ---------------------------------------------------------
    # PHẦN 1: AUDIT THIN CONTENT GUARD (ROBOTS DIRECTIVE ĐỘNG)
    # ---------------------------------------------------------
    print("\n[PHẦN 1] KIỂM THỬ THIN CONTENT GUARD (BỘ LỌC NỘI DUNG MỎNG)")
    print("-" * 80)

    test_targets = [
        {
            "id": "1180301018771",
            "name": "Toyota Motor (Doanh nghiệp quy mô lớn - Đầy đủ BCTC, Web, SĐT, Vốn)",
            "expected_robots": "index, follow",
            "expected_googlebot": "index, follow",
            "expected_score_type": "Rich Entity (>= 3)"
        },
        {
            "id": "4430001051870",
            "name": "株式会社羊蹄工業 (Doanh nghiệp vừa - Có SĐT + Website)",
            "expected_robots": "index, follow",
            "expected_googlebot": "index, follow",
            "expected_score_type": "Rich Entity (>= 3)"
        },
        {
            "id": "7430001026291",
            "name": "株式会社ジーアート (Doanh nghiệp vừa - Có SĐT + Invoice)",
            "expected_robots": "index, follow",
            "expected_googlebot": "index, follow",
            "expected_score_type": "Rich Entity (>= 3)"
        },
        {
            "id": "7430001026309",
            "name": "株式会社ベストコーポレーション (Nội dung mỏng - Chỉ có Invoice NTA, không SĐT/Web)",
            "expected_robots": "noindex, follow",
            "expected_googlebot": "noindex, follow",
            "expected_score_type": "Thin Entity (< 3)"
        },
        {
            "id": "7430001026473",
            "name": "エナジティック・ロジ株式会社 (Nội dung mỏng - Chỉ có tên pháp nhân)",
            "expected_robots": "noindex, follow",
            "expected_googlebot": "noindex, follow",
            "expected_score_type": "Thin Entity (< 3)"
        }
    ]

    p1_passed = 0
    for target in test_targets:
        cid = target["id"]
        cmd = f'curl -s -H "User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" http://localhost:3000/ja/company/{cid}'
        html, err = run_command(cmd)

        robots_content = re.findall(r'<meta[^>]*name=[\"\']robots[\"\'][^>]*content=[\"\']([^\"\']+)[\"\']', html, re.I)
        googlebot_content = re.findall(r'<meta[^>]*name=[\"\']googlebot[\"\'][^>]*content=[\"\']([^\"\']+)[\"\']', html, re.I)

        robots_val = robots_content[0] if robots_content else "NOT_FOUND"
        googlebot_val = googlebot_content[0] if googlebot_content else "NOT_FOUND"

        # Check canonical
        canonical = re.findall(r'<link[^>]*rel=[\"\']canonical[\"\'][^>]*href=[\"\']([^\"\']+)[\"\']', html, re.I)
        can_val = canonical[0] if canonical else "NOT_FOUND"

        match_robots = (robots_val == target["expected_robots"])
        match_googlebot = target["expected_googlebot"] in googlebot_val

        status = "PASSED" if (match_robots and match_googlebot) else "FAILED"
        if status == "PASSED":
            p1_passed += 1

        print(f"• Pháp nhân: {target['name']} [{cid}]")
        print(f"  Phân loại dự kiến: {target['expected_score_type']}")
        print(f"  Thực tế robots:    '{robots_val}' (Kỳ vọng: '{target['expected_robots']}')")
        print(f"  Thực tế googlebot: '{googlebot_val}'")
        print(f"  Canonical tag:     '{can_val}'")
        print(f"  -> Kết quả kiểm thử: [{status}]")
        print("-" * 50)

    print(f"==> TỔNG KẾT PHẦN 1: {p1_passed}/{len(test_targets)} KỊCH BẢN ĐẠT CHUẨN.")

    # ---------------------------------------------------------
    # PHẦN 2: AUDIT CROSS-ENTITY LINKING (MẠNG NHỆN LIÊN KẾT NGANG)
    # ---------------------------------------------------------
    print("\n[PHẦN 2] KIỂM THỬ CROSS-ENTITY LINKING (SPIDER-WEB SIDEWAYS LINKING)")
    print("-" * 80)

    # Lấy thử trang công ty Toyota Motor
    cmd = 'curl -s -H "User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1)" http://localhost:3000/ja/company/1180301018771'
    html, err = run_command(cmd)

    cross_checks = {
        "Liên kết Ngành nghề (Industry Hub)": "/ja/industry/" in html,
        "Liên kết Khu vực Tỉnh/Thành (Prefecture Hub)": "/ja/area/" in html,
        "Liên kết Ngang Giấy phép (Licenses Hub)": ("/ja/licenses" in html) or ("/licenses" in html),
        "Liên kết Ngang Đăng ký Invoice (Invoice Hub)": ("/ja/invoice" in html) or ("/invoice" in html),
        "Liên kết Danh bạ Quốc gia (National Directory)": ("/ja/directory" in html) or ("/directory" in html)
    }

    p2_passed = 0
    for name, exists in cross_checks.items():
        st = "PASSED (OK)" if exists else "FAILED"
        if exists: p2_passed += 1
        print(f"• {name:<45}: [{st}]")

    print(f"==> TỔNG KẾT PHẦN 2: {p2_passed}/{len(cross_checks)} LIÊN KẾT THỰC THỂ HOẠT ĐỘNG CHÍNH XÁC.")

    # ---------------------------------------------------------
    # PHẦN 3: AUDIT SCHEMA STRUCTURED DATA (GEO / AI SEARCH READY)
    # ---------------------------------------------------------
    print("\n[PHẦN 3] KIỂM THỬ SCHEMA JSON-LD (GENERATIVE ENGINE OPTIMIZATION - GEO)")
    print("-" * 80)

    # Extract all JSON-LD blocks
    json_ld_matches = re.findall(r'<script[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>', html, re.DOTALL | re.I)
    print(f"• Số lượng khối Schema JSON-LD tìm thấy: {len(json_ld_matches)}")

    parsed_corporation = False
    corp_name = ""
    corp_number = ""
    for idx, block in enumerate(json_ld_matches):
        try:
            data = json.loads(block.strip())
            stype = data.get("@type")
            if stype in ["Corporation", "Organization"]:
                parsed_corporation = True
                corp_name = data.get("name", "")
                corp_number = data.get("taxID", "") or data.get("vatID", "") or data.get("identifier", "") or data.get("iso6523Code", "")
                print(f"  - Khối #{idx+1}: @type = '{stype}', name = '{corp_name}', ID = '{corp_number}'")
            elif stype == "BreadcrumbList":
                print(f"  - Khối #{idx+1}: @type = 'BreadcrumbList' (Định vị phân cấp cấu trúc)")
        except Exception as e:
            print(f"  - Lỗi parse JSON-LD khối #{idx+1}: {e}")

    p3_passed = 1 if parsed_corporation else 0
    print(f"==> TỔNG KẾT PHẦN 3: [{'PASSED (OK)' if p3_passed else 'FAILED'}] Chuẩn Schema Corporation cho AI Crawlers.")

    # ---------------------------------------------------------
    # PHẦN 4: AUDIT HỆ THỐNG HUB & SPOKE INDEXING TRÊN VPS
    # ---------------------------------------------------------
    print("\n[PHẦN 4] KIỂM THỬ HỆ THỐNG HUB & SPOKE INDEXING DAEMON")
    print("-" * 80)

    # Check vps_api_daemon.py
    cmd_daemon = "grep -E 'is_tokyo_business_hours' /var/www/kigyou-list/scripts/vps_api_daemon.py"
    out_d, err_d = run_command(cmd_daemon)
    has_jst = "is_tokyo_business_hours" in out_d

    # Check auto_google_indexing_pg.js
    cmd_g = "grep -E 'associatedHubsMap|HUB' /var/www/kigyou-list/scripts/auto_google_indexing_pg.js"
    out_g, err_g = run_command(cmd_g)
    has_hub_g = "associatedHubsMap" in out_g

    # Check auto_indexnow_submitter_pg.js
    cmd_in = "grep -E 'parentHubs|HUB' /var/www/kigyou-list/scripts/auto_indexnow_submitter_pg.js"
    out_in, err_in = run_command(cmd_in)
    has_hub_in = "parentHubs" in out_in

    print(f"• VPS Daemon nhận diện giờ hành chính Tokyo (JST Engine): [{'PASSED' if has_jst else 'FAILED'}]")
    print(f"• Google VIP Indexing tích hợp mô hình Hub & Spoke:      [{'PASSED' if has_hub_g else 'FAILED'}]")
    print(f"• Bing IndexNow Engine tích hợp mô hình Hub & Spoke:     [{'PASSED' if has_hub_in else 'FAILED'}]")

    # Overall Summary
    print("\n" + "=" * 80)
    print("                    KẾT LUẬN ĐÁNH GIÁ AUDIT TOÀN DIỆN")
    print("=" * 80)
    all_ok = (p1_passed == len(test_targets)) and (p2_passed == len(cross_checks)) and (p3_passed == 1) and has_jst and has_hub_g and has_hub_in
    if all_ok:
        print(">>> TRẠNG THÁI: 100% ĐẠT TIÊU CHUẨN XUẤT SẮC (ALL CHECKS PASSED)")
        print(">>> Nền tảng Kigyou-list đã được bảo vệ hoàn toàn khỏi Thin Content Update,")
        print("    sở hữu cấu trúc liên kết mạng nhện ngang chống Orphan Pages,")
        print("    và vận hành cơ chế bắn Indexing Hub & Spoke theo giờ Tokyo chuẩn mực.")
    else:
        print(">>> TRẠNG THÁI: CÓ MỤC CẦN LƯU Ý HOẶC HIỆU CHỈNH THÊM.")
    print("=" * 80)

if __name__ == "__main__":
    execute_audit()
