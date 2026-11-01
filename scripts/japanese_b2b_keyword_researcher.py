#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Japanese B2B Keyword Researcher & Search Intent Engine for Kigyou-list
Real-time Google Japan Suggestion Scraper with Intent Clustering & URL Mapping.
Author: Antigravity AI Engine
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
from typing import List, Dict, Set, Any
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_JSON = os.path.join(PROJECT_ROOT, "data", "japanese_b2b_keywords.json")
OUTPUT_MD = os.path.join(PROJECT_ROOT, "data", "japanese_b2b_keywords_report.md")

# Bộ lọc loại trừ các từ khóa truy vấn nội bộ của Developer / Đơn vị vận hành (TQC & Hotline)
INTERNAL_EXCLUSIONS = [
    "tqc", "03-6907-1219", "0369071219", "tcq", "tqa", "tqq", "tqcs", "tqi", "tqr", "ｔｑｃ", "豊島区"
]

def is_internal_query(q: str) -> bool:
    q_low = q.strip().lower()
    for pat in INTERNAL_EXCLUSIONS:
        if pat in q_low:
            return True
    return False

# 1. Danh sách từ khóa hạt giống cốt lõi ngành B2B Directory & Data Nhật Bản
CORE_SEEDS = [
    # Nhóm 1: B2B Lead Gen & Sales Lists
    "企業リスト",
    "営業リスト",
    "法人リスト",
    "テレアポ リスト",
    "問い合わせフォーム 営業",
    "新規開拓 リスト",
    # Nhóm 2: Quản trị rủi ro, Phá sản & Tín dụng
    "倒産情報",
    "倒産速報",
    "最近の倒産企業",
    "反社チェック",
    "信用調査 会社",
    # Nhóm 3: Tài chính, Doanh thu, Thu nhập, Nhân sự
    "売上高",
    "平均年収",
    "平均年収 ランキング",
    "従業員数",
    "会社概要",
    # Nhóm 4: Pháp lý & Định danh doanh nghiệp
    "法人番号 検索",
    "インボイス 登録番号",
    "新設法人",
    "本店移転",
    "代表者変更",
    # Nhóm 5: Giấy phép & Cơ quan nhà nước
    "登録支援機関 一覧",
    "宅建業者 名簿",
    "建設業許可 検索",
    "古物商 許可 検索",
    # Nhóm 6: Ngành nghề hot
    "IT企業 一覧",
    "製造業 リスト",
    "SaaS 企業"
]

# Các từ khóa mở rộng đệ quy chuyên sâu
PRIMARY_SEEDS = ["企業リスト", "営業リスト", "倒産情報", "売上高", "会社概要", "平均年収", "法人番号"]

# Modifiers mua hàng và tìm kiếm phổ biến tại Nhật
COMMON_MODIFIERS = [
    "無料", "作成", "エクセル", "ダウンロード", "購入", "最新", "速報", "ツール", "おすすめ", "一覧", "ランキング", "検索", "調べ方", "見方", "大阪", "東京", "愛知", "神奈川"
]

# Bảng Hiragana quét chiều sâu
HIRAGANA_ALPHABET = [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
    "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も",
    "や", "ゆ", "よ",
    "ら", "り", "る", "れ", "ろ",
    "わ"
]

def fetch_google_suggestions(query: str) -> List[str]:
    """Gọi trực tiếp Google Japan Suggestion Engine API thời gian thực."""
    encoded_q = urllib.parse.quote(query)
    url = f"https://suggestqueries.google.com/complete/search?client=chrome&hl=ja&gl=jp&q={encoded_q}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            "Accept-Language": "ja,en-US;q=0.9,en;q=0.8"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8', errors='ignore'))
            if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
                return [s.strip() for s in data[1] if isinstance(s, str)]
    except Exception as e:
        # Im lặng vượt qua lỗi mạng nhẹ
        pass
    return []

def classify_intent_and_map_url(keyword: str) -> Dict[str, str]:
    """Phân loại Ý định tìm kiếm (Search Intent) và ánh xạ URL đích trên Kigyou-list."""
    k = keyword.lower()
    
    # 1. Transactional (Tải data, mua list, tạo danh sách)
    if any(m in k for m in ["無料", "作成", "ツール", "ダウンロード", "エクセル", "excel", "購入", "比較", "サービス", "csv", "安い", "おすすめ", "テレアポ", "フォーム営業", "問い合わせ"]):
        return {
            "cluster": "1. TRANSACTIONAL (Mua/Tạo Lead List)",
            "intent_label": "High-Commercial Intent (Khách hàng tiềm năng cần data)",
            "target_url": "https://kigyoulist.com/ja/search (kết hợp /ja/form-marketing & /ja/pricing)",
            "page_action": "Tối ưu bộ lọc tìm kiếm nâng cao, xuất CSV và Form Marketing"
        }

    # 2. Risk & Compliance (Phá sản, nợ xấu, chuyển trụ sở, giải thể, uy tín)
    elif any(m in k for m in ["倒産", "破産", "民事再生", "解散", "休眠", "評判", "危ない", "反社", "移転", "代表者", "変更"]):
        if "倒産" in k or "破産" in k or "民事再生" in k:
            return {
                "cluster": "2. RISK & COMPLIANCE (Quản trị Rủi ro & Nợ xấu)",
                "intent_label": "Risk Investigation (Điều tra an toàn tín dụng)",
                "target_url": "https://kigyoulist.com/ja/status/bankruptcies (kết hợp Hub Tỉnh thành)",
                "page_action": "Mở rộng 47 Hubs Tỉnh thành cho thông tin phá sản/tín dụng"
            }
        else:
            return {
                "cluster": "2. RISK & COMPLIANCE (Quản trị Rủi ro & Nợ xấu)",
                "intent_label": "Corporate Governance & Signal (Biến động pháp lý)",
                "target_url": "https://kigyoulist.com/ja/changes/relocation (hoặc /ja/changes/merger)",
                "page_action": "Tối ưu hóa Lịch sử thay đổi pháp lý NTA và thông báo dời trụ sở"
            }

    # 3. Investigation (Doanh thu, tiền lương, quy mô nhân sự, tài chính)
    elif any(m in k for m in ["売上", "年収", "給料", "給与", "業績", "利益", "従業員", "資本金", "ランキング", "有報", "決算"]):
        return {
            "cluster": "3. INVESTIGATION (Tra cứu Tài chính & Nhân sự)",
            "intent_label": "Financial & HR Profiling (Nghiên cứu đối tác & ứng viên)",
            "target_url": "https://kigyoulist.com/ja/company/[id] (kết hợp /ja/ranking/salary)",
            "page_action": "Đẩy số liệu 売上高, 従業員数, 平均年収 lên vị trí đầu trong Title và Meta Description"
        }

    # 4. Programmatic Matrix (Ngành nghề x Địa phương, Giấy phép, Danh mục)
    else:
        return {
            "cluster": "4. PROGRAMMATIC MATRIX (Ngành nghề x Địa bàn)",
            "intent_label": "Directory Browsing (Duyệt danh bạ theo phân khúc)",
            "target_url": "https://kigyoulist.com/ja/area/[code] (kết hợp /ja/industry/[code] & /ja/licenses)",
            "page_action": "Tối ưu Title trang Tỉnh và Ngành kèm số lượng công ty 【〇〇件・最新リスト】"
        }

def run_research():
    print("=" * 80)
    print("🔍 KHỞI ĐỘNG CỖ MÁY NGHIÊN CỨU TỪ KHÓA GOOGLE NHẬT BẢN THỜI GIAN THỰC")
    print("=" * 80)

    found_keywords: Set[str] = set()
    scan_log: List[Dict[str, Any]] = []

    # 1. Quét tầng 1: Danh sách từ khóa hạt giống cốt lõi
    print(f"[*] Tầng 1: Đang quét {len(CORE_SEEDS)} từ khóa hạt giống cốt lõi...")
    for seed in CORE_SEEDS:
        suggestions = fetch_google_suggestions(seed)
        valid = [s for s in suggestions if not is_internal_query(s)]
        for s in valid:
            found_keywords.add(s)
        time.sleep(0.08)

    print(f"    ↳ Đã tìm thấy {len(found_keywords)} từ khóa sau Tầng 1.")

    # 2. Quét tầng 2: Ghép Modifiers mua hàng phổ biến
    print(f"[*] Tầng 2: Mở rộng đệ quy với Modifiers mua hàng (Free, Download, Excel, Ranking...)...")
    for seed in PRIMARY_SEEDS:
        for mod in COMMON_MODIFIERS:
            q = f"{seed} {mod}"
            suggestions = fetch_google_suggestions(q)
            valid = [s for s in suggestions if not is_internal_query(s)]
            for s in valid:
                found_keywords.add(s)
            time.sleep(0.05)

    print(f"    ↳ Đã mở rộng lên {len(found_keywords)} từ khóa sau Tầng 2.")

    # 3. Quét tầng 3: Ghép bảng Hiragana (あ-わ) cho top seed để vét trọn Alphabet suggestions
    print(f"[*] Tầng 3: Quét vét bảng chữ cái Hiragana (あ〜わ) cho các từ khóa vàng...")
    hiragana_targets = ["企業リスト", "営業リスト", "倒産情報", "売上高"]
    for seed in hiragana_targets:
        for hira in HIRAGANA_ALPHABET:
            q = f"{seed} {hira}"
            suggestions = fetch_google_suggestions(q)
            valid = [s for s in suggestions if not is_internal_query(s)]
            for s in valid:
                found_keywords.add(s)
            time.sleep(0.05)

    print(f"\n[+] TỔNG KẾT: Đã thu hoạch thành công {len(found_keywords)} từ khóa tự nhiên 100% từ người dùng Nhật Bản!")

    # 4. Phân cụm và Ánh xạ URL
    clustered_data: Dict[str, List[Dict[str, str]]] = {
        "1. TRANSACTIONAL (Mua/Tạo Lead List)": [],
        "2. RISK & COMPLIANCE (Quản trị Rủi ro & Nợ xấu)": [],
        "3. INVESTIGATION (Tra cứu Tài chính & Nhân sự)": [],
        "4. PROGRAMMATIC MATRIX (Ngành nghề x Địa bàn)": []
    }

    all_results = []
    for kw in sorted(found_keywords):
        classification = classify_intent_and_map_url(kw)
        item = {
            "keyword": kw,
            "cluster": classification["cluster"],
            "intent_label": classification["intent_label"],
            "target_url": classification["target_url"],
            "page_action": classification["page_action"]
        }
        clustered_data[classification["cluster"]].append(item)
        all_results.append(item)

    # 5. Lưu ra file JSON
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_keywords": len(all_results),
            "clusters": {k: len(v) for k, v in clustered_data.items()},
            "keywords": all_results
        }, f, ensure_ascii=False, indent=2)

    # 6. Tạo Báo cáo Markdown chi tiết
    md_content = f"""# Báo Cáo Nghiên Cứu Từ Khóa B2B Nhật Bản & Bản Đồ Search Intent
*Dữ liệu trích xuất thời gian thực từ Google Japan Suggest Engine (Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')})*
*Tổng số từ khóa thu thập và phân loại: **{len(all_results)} từ khóa***

---

## 📊 THỐNG KÊ PHÂN BỔ Ý ĐỊNH TÌM KIẾM (SEARCH INTENT)

| Nhóm Ý Định Tìm Kiếm | Số Lượng Từ Khóa | Hành Vi Của Người Dùng Nhật Bản | Đích Đến Trên Kigyou-list |
| :--- | :--- | :--- | :--- |
| **1. Transactional (Mua & Tạo Lead List)** | **{len(clustered_data['1. TRANSACTIONAL (Mua/Tạo Lead List)'])}** | Tìm danh sách làm sales, tải excel, telesales, gửi form | `/ja/search`, `/ja/form-marketing`, `/ja/pricing` |
| **2. Risk & Compliance (Nợ xấu & Rủi ro)** | **{len(clustered_data['2. RISK & COMPLIANCE (Quản trị Rủi ro & Nợ xấu)'])}** | Tra cứu doanh nghiệp phá sản, dời cty, đổi đại diện, tín dụng | `/ja/status/bankruptcies`, `/ja/changes/relocation` |
| **3. Investigation (Tài chính & Nhân sự)** | **{len(clustered_data['3. INVESTIGATION (Tra cứu Tài chính & Nhân sự)'])}** | Tra cứu doanh thu, lương bổng, số nhân sự, công ty con | `/ja/company/[id]`, `/ja/ranking/salary` |
| **4. Programmatic Matrix (Ngành x Tỉnh)** | **{len(clustered_data['4. PROGRAMMATIC MATRIX (Ngành nghề x Địa bàn)'])}** | Lọc danh bạ theo tỉnh thành, theo giấy phép, mã JSIC | `/ja/area/[code]`, `/ja/industry/[code]`, `/ja/licenses` |

---

"""

    for cluster_name, kw_list in clustered_data.items():
        md_content += f"\n## {cluster_name} ({len(kw_list)} từ khóa)\n\n"
        md_content += "| Từ Khóa Gợi Ý Thực Tế | Nhãn Ý Định (Intent) | URL Đích Khuyến Nghị | Hành Động Tối Ưu Hóa On-Page |\n"
        md_content += "| :--- | :--- | :--- | :--- |\n"
        for item in kw_list[:25]:  # Top 25 đại diện trong MD
            md_content += f"| `{item['keyword']}` | {item['intent_label']} | {item['target_url']} | {item['page_action']} |\n"
        if len(kw_list) > 25:
            md_content += f"| *... và {len(kw_list) - 25} từ khóa khác (xem chi tiết trong japanese_b2b_keywords.json)* | | | |\n"

    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write(md_content)

    print("\n" + "=" * 80)
    print("🎯 BẢNG THỐNG KÊ KẾT QUẢ THU HOẠCH THEO CỤM Ý ĐỊNH:")
    print("=" * 80)
    for c_name, c_list in clustered_data.items():
        print(f" • {c_name:<50}: {len(c_list):>4} từ khóa")
    print(f"\n[+] Đã lưu toàn bộ dữ liệu cấu trúc vào: {OUTPUT_JSON}")
    print(f"[+] Đã tạo báo cáo phân tích chiến lược tại: {OUTPUT_MD}")
    print("=" * 80)

if __name__ == "__main__":
    run_research()
