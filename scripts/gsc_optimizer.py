#!/usr/bin/env python3
"""
GSC Optimizer Engine for Kigyou-list (kigyoulist.com)
Advanced Google Search Console Analytics & Technical SEO Diagnostic Suite.
Distilled from top GitHub SEO architectures (Suganthans-GSC-MCP, advertools, joshcarty/google-searchconsole).
"""

import sys
import os
import json
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

KEY_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", r"c:\kigyou-list\google_credentials.json")
DEFAULT_SITE = "sc-domain:kigyoulist.com"
SCOPES = ['https://www.googleapis.com/auth/webmasters']


class GSCOptimizer:
    def __init__(self, key_file: str = KEY_FILE, site_url: str = DEFAULT_SITE):
        self.key_file = key_file
        self.site_url = site_url
        if not os.path.exists(self.key_file):
            raise FileNotFoundError(f"Google credentials file not found: {self.key_file}")
        
        self.creds = service_account.Credentials.from_service_account_file(self.key_file, scopes=SCOPES)
        self.service = build('searchconsole', 'v1', credentials=self.creds)

    def _query_analytics(self, start_date: str, end_date: str, dimensions: List[str], row_limit: int = 1000) -> List[Dict[str, Any]]:
        """Query raw search analytics with automatic row limit control."""
        body = {
            'startDate': start_date,
            'endDate': end_date,
            'dimensions': dimensions,
            'rowLimit': row_limit
        }
        try:
            resp = self.service.searchanalytics().query(siteUrl=self.site_url, body=body).execute()
            return resp.get('rows', [])
        except Exception as e:
            print(f"[-] GSC Query Error ({dimensions}): {e}", file=sys.stderr)
            return []

    def get_summary(self, days: int = 28) -> Dict[str, Any]:
        """Lấy tổng quan hiệu suất trong khoảng N ngày gần nhất (độ trễ 2-3 ngày của Google)."""
        end_date = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days + 2)).strftime('%Y-%m-%d')

        rows = self._query_analytics(start_date, end_date, [], 1)
        if not rows:
            return {"clicks": 0, "impressions": 0, "ctr": 0.0, "position": 0.0, "start_date": start_date, "end_date": end_date}
        
        r = rows[0]
        return {
            "clicks": int(r.get('clicks', 0)),
            "impressions": int(r.get('impressions', 0)),
            "ctr": round(float(r.get('ctr', 0)) * 100, 2),
            "position": round(float(r.get('position', 0)), 1),
            "start_date": start_date,
            "end_date": end_date,
            "days": days
        }

    def find_quick_wins(self, days: int = 28, min_impressions: int = 5, max_ctr: float = 3.5, min_pos: float = 4.0, max_pos: float = 20.0) -> List[Dict[str, Any]]:
        """
        [QUICK WINS CTR BOOSTER]
        Tìm các từ khóa có lượt hiển thị tiềm năng (Impressions >= min_imp),
        đang đứng ở trang 1-2 (Position từ min_pos đến max_pos) nhưng CTR còn thấp (<= max_ctr).
        Đây là cơ hội số 1 để giật traffic bằng cách tối ưu Title/Snippet tiếng Nhật.
        """
        end_date = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days + 2)).strftime('%Y-%m-%d')

        rows = self._query_analytics(start_date, end_date, ['query', 'page'], 2500)
        quick_wins = []

        for r in rows:
            keys = r.get('keys', [])
            if len(keys) < 2:
                continue
            query, page = keys[0], keys[1]
            clicks = int(r.get('clicks', 0))
            impressions = int(r.get('impressions', 0))
            ctr = round(float(r.get('ctr', 0)) * 100, 2)
            pos = round(float(r.get('position', 0)), 1)

            if impressions >= min_impressions and ctr <= max_ctr and min_pos <= pos <= max_pos:
                # Gợi ý tối ưu hóa Title/Snippet tiếng Nhật dựa trên loại Query
                recommendation = "Bổ sung từ khóa chính xác vào Title Tag và đẩy lên đầu câu."
                if "株式会社" in query or "会社" in query:
                    recommendation = "Bổ sung Số Đăng Ký Pháp Nhân (法人番号), Trụ sở chính (本社所在地) & Tra cứu nhanh vào Title."
                elif any(char.isdigit() for char in query) and ("-" in query or len(query) >= 10):
                    recommendation = "Truy vấn Mã số/Số điện thoại: Hiển thị ngay '電話番号・企業特定・公式情報' trong Meta Description."
                elif any(kw in query for kw in ["it", "建設", "派遣", "製造", "飲食", "不動産"]):
                    recommendation = "Truy vấn Ngành: Thêm số lượng công ty trong danh sách (vd: '東京都豊島区のIT企業一覧【〇〇件】')."

                quick_wins.append({
                    "query": query,
                    "page": page,
                    "clicks": clicks,
                    "impressions": impressions,
                    "ctr": ctr,
                    "position": pos,
                    "potential_score": round(impressions / max(pos, 1.0), 2),
                    "recommendation": recommendation
                })

        quick_wins.sort(key=lambda x: x['potential_score'], reverse=True)
        return quick_wins

    def detect_cannibalization(self, days: int = 28, min_impressions: int = 2) -> List[Dict[str, Any]]:
        """
        [CANNIBALIZATION DETECTOR]
        Phát hiện hiện tượng 'Ăn thịt từ khóa': 1 truy vấn tiếng Nhật nhưng Google hiển thị
        từ 2 URL khác nhau trở lên, gây phân tán sức mạnh SEO giữa các trang Hub và Company.
        """
        end_date = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days + 2)).strftime('%Y-%m-%d')

        rows = self._query_analytics(start_date, end_date, ['query', 'page'], 2500)
        query_map: Dict[str, List[Dict[str, Any]]] = {}

        for r in rows:
            keys = r.get('keys', [])
            if len(keys) < 2:
                continue
            query, page = keys[0], keys[1]
            query_map.setdefault(query, []).append({
                "page": page,
                "clicks": int(r.get('clicks', 0)),
                "impressions": int(r.get('impressions', 0)),
                "ctr": round(float(r.get('ctr', 0)) * 100, 2),
                "position": round(float(r.get('position', 0)), 1)
            })

        conflicts = []
        for query, pages in query_map.items():
            if len(pages) >= 2:
                total_impr = sum(p['impressions'] for p in pages)
                total_clicks = sum(p['clicks'] for p in pages)
                if total_impr >= min_impressions:
                    conflicts.append({
                        "query": query,
                        "pages_count": len(pages),
                        "total_impressions": total_impr,
                        "total_clicks": total_clicks,
                        "pages": sorted(pages, key=lambda x: x['impressions'], reverse=True)
                    })

        conflicts.sort(key=lambda x: x['total_impressions'], reverse=True)
        return conflicts

    def detect_content_decay(self, current_days: int = 28) -> List[Dict[str, Any]]:
        """
        [CONTENT DECAY MONITOR]
        So sánh hiệu suất chu kỳ hiện tại (28 ngày qua) với chu kỳ trước đó (28 ngày trước).
        Phát hiện các từ khóa/trang bị sụt giảm hiển thị hoặc lượt click để can thiệp kịp thời.
        """
        now = datetime.now()
        # Chu kỳ hiện tại
        curr_end = (now - timedelta(days=2)).strftime('%Y-%m-%d')
        curr_start = (now - timedelta(days=current_days + 2)).strftime('%Y-%m-%d')
        
        # Chu kỳ trước đó
        prev_end = (now - timedelta(days=current_days + 3)).strftime('%Y-%m-%d')
        prev_start = (now - timedelta(days=(current_days * 2) + 3)).strftime('%Y-%m-%d')

        curr_rows = {r['keys'][0]: r for r in self._query_analytics(curr_start, curr_end, ['query'], 2000)}
        prev_rows = {r['keys'][0]: r for r in self._query_analytics(prev_start, prev_end, ['query'], 2000)}

        decay_list = []
        for q, p_data in prev_rows.items():
            p_impr = int(p_data.get('impressions', 0))
            p_clicks = int(p_data.get('clicks', 0))
            p_pos = round(float(p_data.get('position', 0)), 1)

            c_data = curr_rows.get(q)
            c_impr = int(c_data.get('impressions', 0)) if c_data else 0
            c_clicks = int(c_data.get('clicks', 0)) if c_data else 0
            c_pos = round(float(c_data.get('position', 0)), 1) if c_data else 100.0

            impr_diff = c_impr - p_impr
            clicks_diff = c_clicks - p_clicks
            pos_diff = c_pos - p_pos  # Dương là bị tụt rank

            if (p_impr >= 5 and impr_diff <= -2) or (p_clicks >= 2 and clicks_diff <= -1) or (p_pos <= 20 and pos_diff >= 3.0):
                decay_list.append({
                    "query": q,
                    "prev_impressions": p_impr,
                    "curr_impressions": c_impr,
                    "impr_change": impr_diff,
                    "prev_clicks": p_clicks,
                    "curr_clicks": c_clicks,
                    "clicks_change": clicks_diff,
                    "prev_position": p_pos,
                    "curr_position": c_pos,
                    "position_change": pos_diff
                })

        decay_list.sort(key=lambda x: x['impr_change'])
        return decay_list

    def inspect_url(self, inspection_url: str) -> Dict[str, Any]:
        """
        [URL INSPECTION API]
        Kiểm tra trực tiếp tình trạng URL với cơ sở dữ liệu thật của Googlebot:
        Trạng thái index (coverageState), robots.txt, mã nguồn nạp được, Canonical và Rich Results.
        """
        try:
            body = {
                'inspectionUrl': inspection_url,
                'siteUrl': self.site_url
            }
            res = self.service.urlInspection().index().inspect(body=body).execute()
            data = res.get('inspectionResult', {})
            idx = data.get('indexStatusResult', {})
            rich = data.get('richResultsResult', {})
            mob = data.get('mobileUsabilityResult', {})

            return {
                "url": inspection_url,
                "verdict": idx.get('verdict', 'UNKNOWN'),
                "coverage_state": idx.get('coverageState', 'UNKNOWN'),
                "indexing_state": idx.get('indexingState', 'UNKNOWN'),
                "robots_txt_state": idx.get('robotsTxtState', 'UNKNOWN'),
                "last_crawl_time": idx.get('lastCrawlTime', 'Never'),
                "page_fetch_state": idx.get('pageFetchState', 'UNKNOWN'),
                "google_canonical": idx.get('googleCanonical', 'N/A'),
                "user_canonical": idx.get('userCanonical', 'N/A'),
                "referring_urls": idx.get('referringUrls', []),
                "sitemaps": idx.get('sitemap', []),
                "crawled_as": idx.get('crawledAs', 'N/A'),
                "rich_results_verdict": rich.get('verdict', 'N/A'),
                "rich_results_items": [item.get('richResultType') for item in rich.get('detectedItems', [])],
                "mobile_usability": mob.get('verdict', 'N/A'),
                "inspection_link": data.get('inspectionResultLink', '')
            }
        except Exception as e:
            return {"url": inspection_url, "error": str(e)}

    def audit_sitemaps(self) -> List[Dict[str, Any]]:
        """
        [SITEMAPS HEALTH AUDIT]
        Kiểm tra trạng thái nạp của tất cả 12 file sitemap matrix trên Google Search Console.
        """
        try:
            resp = self.service.sitemaps().list(siteUrl=self.site_url).execute()
            sitemaps = resp.get('sitemap', [])
            report = []
            for s in sitemaps:
                contents = s.get('contents', [])
                sub_cnt = contents[0].get('submitted', 0) if contents else 0
                idx_cnt = contents[0].get('indexed', 0) if contents else 0
                report.append({
                    "path": s.get('path', ''),
                    "last_submitted": s.get('lastSubmitted', 'N/A'),
                    "last_downloaded": s.get('lastDownloaded', 'N/A'),
                    "is_pending": s.get('isPending', False),
                    "warnings": int(s.get('warnings', 0)),
                    "errors": int(s.get('errors', 0)),
                    "submitted_urls": sub_cnt,
                    "indexed_urls": idx_cnt
                })
            return report
        except Exception as e:
            print(f"[-] Sitemap Audit Error: {e}", file=sys.stderr)
            return []


# ==============================================================================
# CLI INTERFACE
# ==============================================================================

def print_header(title: str):
    print("=" * 80)
    print(f"🔍 {title.upper()}")
    print("=" * 80)

def main():
    parser = argparse.ArgumentParser(description="Google Search Console Optimizer for Kigyou-list")
    subparsers = parser.add_subparsers(dest="action", help="Chọn lệnh hành động")

    # 1. Summary
    p_sum = subparsers.add_parser("summary", help="Tổng quan hiệu suất Clicks, Impressions, CTR, Position")
    p_sum.add_argument("--days", type=int, default=28, help="Số ngày thống kê (mặc định: 28)")

    # 2. Quick Wins
    p_qw = subparsers.add_parser("quick-wins", help="Tìm từ khóa vàng: Impressions cao, Rank 4-20, CTR thấp cần tối ưu")
    p_qw.add_argument("--days", type=int, default=28, help="Số ngày thống kê")
    p_qw.add_argument("--min-impr", type=int, default=3, help="Lượt hiển thị tối thiểu")
    p_qw.add_argument("--max-ctr", type=float, default=5.0, help="Ngưỡng CTR tối đa (%)")

    # 3. Cannibalization
    p_can = subparsers.add_parser("cannibalization", help="Phát hiện hiện tượng 'Ăn thịt từ khóa' giữa các trang")
    p_can.add_argument("--days", type=int, default=28, help="Số ngày thống kê")
    p_can.add_argument("--min-impr", type=int, default=2, help="Lượt hiển thị tối thiểu")

    # 4. Decay
    p_dec = subparsers.add_parser("decay", help="Phát hiện từ khóa/trang bị tụt traffic/rank so với chu kỳ trước")
    p_dec.add_argument("--days", type=int, default=28, help="Chu kỳ so sánh số ngày")

    # 5. Inspect
    p_ins = subparsers.add_parser("inspect", help="Thanh tra URL trực tiếp từ Googlebot qua URL Inspection API")
    p_ins.add_argument("url", type=str, help="URL đầy đủ cần thanh tra (vd: https://kigyoulist.com/ja)")

    # 6. Sitemaps
    p_sm = subparsers.add_parser("sitemaps", help="Kiểm tra trạng thái nạp của toàn bộ sitemaps trên GSC")

    # 7. Full Health Report
    p_rep = subparsers.add_parser("report", help="Xuất báo cáo toàn diện GSC Health & Optimization")
    p_rep.add_argument("--json", action="store_true", help="Xuất dạng JSON thô")

    args = parser.parse_args()
    if not args.action:
        parser.print_help()
        sys.exit(1)

    opt = GSCOptimizer()

    if args.action == "summary":
        res = opt.get_summary(days=args.days)
        print_header(f"Hiệu Suất Tìm Kiếm Google Search Console ({res['days']} Ngày: {res['start_date']} -> {res['end_date']})")
        print(f"• Domain Target              : {DEFAULT_SITE}")
        print(f"• Tổng lượt nhấp (Clicks)     : {res['clicks']:,}")
        print(f"• Tổng lượt hiển thị (Impr)   : {res['impressions']:,}")
        print(f"• Tỷ lệ nhấp trung bình (CTR) : {res['ctr']}%")
        print(f"• Vị trí trung bình (Rank)   : #{res['position']}")

    elif args.action == "quick-wins":
        qw = opt.find_quick_wins(days=args.days, min_impressions=args.min_impr, max_ctr=args.max_ctr)
        print_header(f"Cơ Hội Vàng Quick-Wins CTR (Tìm thấy {len(qw)} cụm từ khóa)")
        if not qw:
            print("Không có từ khóa nào thỏa mãn điều kiện lọc. Thử hạ --min-impr.")
        for i, item in enumerate(qw[:25], 1):
            print(f"\n[{i:02d}] Từ khóa: '{item['query']}'")
            print(f"     Trang đích : {item['page']}")
            print(f"     Số liệu    : {item['impressions']} Impr | {item['clicks']} Clicks | CTR: {item['ctr']}% | Pos: #{item['position']}")
            print(f"     💡 Gợi ý   : {item['recommendation']}")

    elif args.action == "cannibalization":
        conflicts = opt.detect_cannibalization(days=args.days, min_impressions=args.min_impr)
        print_header(f"Cảnh Báo Xung Đột Từ Khóa - Cannibalization ({len(conflicts)} trường hợp)")
        if not conflicts:
            print("Tuyệt vời! Không phát hiện hiện tượng xung đột từ khóa giữa các URL.")
        for i, item in enumerate(conflicts[:15], 1):
            print(f"\n[{i:02d}] Từ khóa: '{item['query']}' ({item['pages_count']} URLs cùng cạnh tranh | Tổng Impr: {item['total_impressions']})")
            for p in item['pages']:
                print(f"     -> {p['page']} (Impr: {p['impressions']} | Clicks: {p['clicks']} | Pos: #{p['position']})")
            print(f"     🛠️ Hành động: Đặt Canonical tag dứt khoát hoặc củng cố Internal Link về 1 URL đại diện chính.")

    elif args.action == "decay":
        decay = opt.detect_content_decay(current_days=args.days)
        print_header(f"Cảnh Báo Sụt Giảm Hiệu Suất - Content Decay ({len(decay)} mục)")
        if not decay:
            print("Không có từ khóa nào bị suy giảm đáng kể so với chu kỳ trước.")
        for i, item in enumerate(decay[:15], 1):
            print(f"[{i:02d}] '{item['query']}'")
            print(f"     Impr   : {item['prev_impressions']} -> {item['curr_impressions']} ({item['impr_change']:+d})")
            print(f"     Clicks : {item['prev_clicks']} -> {item['curr_clicks']} ({item['clicks_change']:+d})")
            print(f"     Rank   : #{item['prev_position']} -> #{item['curr_position']} ({item['position_change']:+.1f})")

    elif args.action == "inspect":
        info = opt.inspect_url(args.url)
        print_header(f"Kết Quả Thanh Tra Googlebot - URL Inspection")
        if "error" in info:
            print(f"❌ Lỗi: {info['error']}")
        else:
            verdict_icon = "✅" if info['verdict'] == "PASS" else "⚠️"
            print(f"• URL Kiểm Tra        : {info['url']}")
            print(f"• Phán Quyết Google   : {verdict_icon} {info['verdict']}")
            print(f"• Trạng Thái Chỉ Mục  : {info['coverage_state']}")
            print(f"• Indexing Cho Phép   : {info['indexing_state']}")
            print(f"• Robots.txt          : {info['robots_txt_state']}")
            print(f"• Lần Crawl Gần Nhất  : {info['last_crawl_time']}")
            print(f"• User Canonical      : {info['user_canonical']}")
            print(f"• Google Canonical    : {info['google_canonical']}")
            print(f"• Sitemaps Nạp        : {', '.join(info['sitemaps']) if info['sitemaps'] else 'None'}")
            print(f"• Rich Results        : {info['rich_results_verdict']} ({', '.join(info['rich_results_items']) if info['rich_results_items'] else 'None'})")
            print(f"• Link Chi Tiết GSC   : {info['inspection_link']}")

    elif args.action == "sitemaps":
        sms = opt.audit_sitemaps()
        print_header(f"Tình Trạng Ma Trận Sitemaps Trên GSC ({len(sms)} Sitemaps)")
        print(f"{'Sitemap Path':<42} | {'Pending':<7} | {'Errors':<6} | {'Warn':<5} | {'Submitted'}")
        print("-" * 80)
        for s in sms:
            p = s['path'].replace("https://kigyoulist.com", "")
            print(f"{p:<42} | {str(s['is_pending']):<7} | {s['errors']:<6} | {s['warnings']:<5} | {s['submitted_urls']}")

    elif args.action == "report":
        summary = opt.get_summary(days=28)
        qw = opt.find_quick_wins(days=28, min_impressions=3)
        conflicts = opt.detect_cannibalization(days=28, min_impressions=2)
        sitemaps = opt.audit_sitemaps()

        data = {
            "summary": summary,
            "quick_wins_count": len(qw),
            "quick_wins": qw[:10],
            "cannibalization_count": len(conflicts),
            "cannibalization": conflicts[:10],
            "sitemaps_count": len(sitemaps),
            "sitemaps": sitemaps
        }

        if args.json:
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print_header("Báo Cáo Tổng Hợp Tối Ưu Hóa Google Search Console")
            print(f"1. Tổng quan: {summary['clicks']} clicks, {summary['impressions']} impressions, CTR: {summary['ctr']}%, Pos: #{summary['position']}")
            print(f"2. Quick Wins phát hiện: {len(qw)} từ khóa tiềm năng.")
            print(f"3. Xung đột từ khóa: {len(conflicts)} truy vấn bị cạnh tranh nội bộ.")
            print(f"4. Sitemaps quản lý: {len(sitemaps)} files đã đăng ký.")


if __name__ == "__main__":
    main()
