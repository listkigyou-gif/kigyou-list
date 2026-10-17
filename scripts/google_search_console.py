#!/usr/bin/env python3
"""
Google Search Console API Integration for Kigyou-list
Query real Google Search metrics, top queries, page performance, and rankings.
"""

import sys
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

KEY_FILE = r"c:\kigyou-list\google_credentials.json"
DEFAULT_SITE = "sc-domain:kigyoulist.com"
SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

class GoogleSearchConsoleClient:
    def __init__(self, key_file: str = KEY_FILE, site_url: str = DEFAULT_SITE):
        self.key_file = key_file
        self.site_url = site_url
        self.creds = service_account.Credentials.from_service_account_file(self.key_file, scopes=SCOPES)
        self.service = build('searchconsole', 'v1', credentials=self.creds)

    def get_search_analytics(self, days: int = 28, dimensions: Optional[List[str]] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Lấy dữ liệu Search Analytics theo các chiều (dimensions: query, page, date, device, country)"""
        if dimensions is None:
            dimensions = ['query']

        # Google Search Console có độ trễ khoảng 2-3 ngày
        end_date = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days + 2)).strftime('%Y-%m-%d')

        body = {
            'startDate': start_date,
            'endDate': end_date,
            'dimensions': dimensions,
            'rowLimit': limit
        }

        try:
            resp = self.service.searchanalytics().query(siteUrl=self.site_url, body=body).execute()
            return resp.get('rows', [])
        except Exception as e:
            raise RuntimeError(f"GSC API Query Error: {str(e)}")

    def get_summary(self, days: int = 28) -> Dict[str, Any]:
        """Lấy tổng số clicks, impressions, ctr, position trong khoảng thời gian"""
        end_date = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days + 2)).strftime('%Y-%m-%d')

        body = {
            'startDate': start_date,
            'endDate': end_date
        }

        try:
            resp = self.service.searchanalytics().query(siteUrl=self.site_url, body=body).execute()
            rows = resp.get('rows', [])
            if not rows:
                return {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0, "start_date": start_date, "end_date": end_date}
            r = rows[0]
            return {
                "clicks": r.get('clicks', 0),
                "impressions": r.get('impressions', 0),
                "ctr": round(r.get('ctr', 0) * 100, 2),
                "position": round(r.get('position', 0), 1),
                "start_date": start_date,
                "end_date": end_date
            }
        except Exception as e:
            raise RuntimeError(f"GSC API Summary Error: {str(e)}")

    def get_top_queries(self, days: int = 28, limit: int = 30) -> List[Dict[str, Any]]:
        """Lấy top từ khóa tìm kiếm trên Google"""
        rows = self.get_search_analytics(days=days, dimensions=['query'], limit=limit)
        results = []
        for r in rows:
            results.append({
                "query": r.get('keys', [''])[0],
                "clicks": r.get('clicks', 0),
                "impressions": r.get('impressions', 0),
                "ctr": round(r.get('ctr', 0) * 100, 2),
                "position": round(r.get('position', 0), 1)
            })
        return results

    def get_top_pages(self, days: int = 28, limit: int = 30) -> List[Dict[str, Any]]:
        """Lấy top các trang (URLs) có lượt click/hiển thị tốt nhất trên Google"""
        rows = self.get_search_analytics(days=days, dimensions=['page'], limit=limit)
        results = []
        for r in rows:
            results.append({
                "page": r.get('keys', [''])[0],
                "clicks": r.get('clicks', 0),
                "impressions": r.get('impressions', 0),
                "ctr": round(r.get('ctr', 0) * 100, 2),
                "position": round(r.get('position', 0), 1)
            })
        return results

    def get_daily_trend(self, days: int = 14) -> List[Dict[str, Any]]:
        """Lấy xu hướng clicks & impressions theo từng ngày"""
        rows = self.get_search_analytics(days=days, dimensions=['date'], limit=days)
        results = []
        for r in rows:
            results.append({
                "date": r.get('keys', [''])[0],
                "clicks": r.get('clicks', 0),
                "impressions": r.get('impressions', 0),
                "ctr": round(r.get('ctr', 0) * 100, 2),
                "position": round(r.get('position', 0), 1)
            })
        return results


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Google Search Console CLI for Kigyoulist")
    parser.add_argument("--action", choices=["summary", "queries", "pages", "trend"], default="summary")
    parser.add_argument("--days", type=int, default=28, help="Số ngày thống kê (Mặc định: 28)")
    parser.add_argument("--limit", type=int, default=20, help="Số lượng kết quả (Mặc định: 20)")
    args = parser.parse_args()

    client = GoogleSearchConsoleClient()

    if args.action == "summary":
        summary = client.get_summary(days=args.days)
        print(f"=== BÁO CÁO GOOGLE SEARCH CONSOLE: {DEFAULT_SITE} ===")
        print(f"Khoảng thời gian: {summary['start_date']} -> {summary['end_date']} ({args.days} ngày)")
        print(f"- Tổng lượt nhấp (Clicks)     : {summary['clicks']}")
        print(f"- Tổng lượt hiển thị (Impr)   : {summary['impressions']}")
        print(f"- Tỷ lệ nhấp trung bình (CTR) : {summary['ctr']}%")
        print(f"- Vị trí trung bình (Position): #{summary['position']}")

    elif args.action == "queries":
        queries = client.get_top_queries(days=args.days, limit=args.limit)
        print(f"=== TOP {len(queries)} TỪ KHÓA TÌM KIẾM TRÊN GOOGLE ({args.days} NGÀY QUA) ===")
        if not queries:
            print("Chưa có từ khóa nào được ghi nhận hoặc số liệu đang trong chu kỳ tổng hợp.")
        for i, q in enumerate(queries, 1):
            print(f"{i:2d}. '{q['query']}' -> Clicks: {q['clicks']} | Impr: {q['impressions']} | CTR: {q['ctr']}% | Vị trí TB: #{q['position']}")

    elif args.action == "pages":
        pages = client.get_top_pages(days=args.days, limit=args.limit)
        print(f"=== TOP {len(pages)} TRANG ĐƯỢC HIỂN THỊ TRÊN GOOGLE ===")
        for i, p in enumerate(pages, 1):
            print(f"{i:2d}. {p['page']} -> Clicks: {p['clicks']} | Impr: {p['impressions']} | CTR: {p['ctr']}% | Vị trí TB: #{p['position']}")

    elif args.action == "trend":
        trend = client.get_daily_trend(days=args.days)
        print(f"=== XU HƯỚNG TÌM KIẾM GOOGLE THEO NGÀY ===")
        for t in trend:
            print(f"{t['date']} | Clicks: {t['clicks']:2d} | Impr: {t['impressions']:3d} | Pos: #{t['position']}")

if __name__ == "__main__":
    main()
