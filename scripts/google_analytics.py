#!/usr/bin/env python3
"""
Google Analytics 4 (GA4) API Integration for Kigyou-list
Query real visitor traffic, acquisition sources, top viewed pages, realtime engagement and conversions.
"""

import sys
import os
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
    RunRealtimeReportRequest,
    OrderBy
)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

KEY_FILE = r"c:\kigyou-list\google_credentials.json"
DEFAULT_PROPERTY_ID = "523628725"

class GoogleAnalyticsClient:
    def __init__(self, key_file: str = KEY_FILE, property_id: str = DEFAULT_PROPERTY_ID):
        self.key_file = key_file
        self.property_id = property_id
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self.key_file
        self.client = BetaAnalyticsDataClient()

    def get_summary(self, days: int = 28) -> Dict[str, Any]:
        """Lấy tổng quan truy cập toàn trang: Users, New Users, Sessions, Views, Engagement Rate"""
        req = RunReportRequest(
            property=f"properties/{self.property_id}",
            metrics=[
                Metric(name="activeUsers"),
                Metric(name="newUsers"),
                Metric(name="sessions"),
                Metric(name="screenPageViews"),
                Metric(name="engagementRate"),
                Metric(name="userEngagementDuration"),
                Metric(name="bounceRate")
            ],
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")]
        )
        resp = self.client.run_report(req)
        if not resp.rows:
            return {}
        
        row = resp.rows[0]
        active_users = int(row.metric_values[0].value)
        new_users = int(row.metric_values[1].value)
        sessions = int(row.metric_values[2].value)
        pageviews = int(row.metric_values[3].value)
        eng_rate = float(row.metric_values[4].value)
        duration_sec = float(row.metric_values[5].value)
        bounce_rate = float(row.metric_values[6].value)
        avg_duration = duration_sec / active_users if active_users > 0 else 0

        return {
            "period": f"Last {days} days",
            "active_users": active_users,
            "new_users": new_users,
            "sessions": sessions,
            "pageviews": pageviews,
            "engagement_rate": f"{eng_rate * 100:.1f}%",
            "bounce_rate": f"{bounce_rate * 100:.1f}%",
            "avg_engagement_sec": f"{avg_duration:.1f}s"
        }

    def get_traffic_sources(self, days: int = 28, limit: int = 20) -> List[Dict[str, Any]]:
        """Lấy danh sách các kênh traffic dẫn đến website (Source / Medium)"""
        req = RunReportRequest(
            property=f"properties/{self.property_id}",
            dimensions=[
                Dimension(name="sessionSource"),
                Dimension(name="sessionMedium")
            ],
            metrics=[
                Metric(name="activeUsers"),
                Metric(name="sessions"),
                Metric(name="screenPageViews"),
                Metric(name="engagementRate")
            ],
            order_bys=[
                OrderBy(metric=OrderBy.MetricOrderBy(metric_name="activeUsers"), desc=True)
            ],
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")],
            limit=limit
        )
        resp = self.client.run_report(req)
        results = []
        for row in resp.rows:
            results.append({
                "source": row.dimension_values[0].value,
                "medium": row.dimension_values[1].value,
                "users": int(row.metric_values[0].value),
                "sessions": int(row.metric_values[1].value),
                "pageviews": int(row.metric_values[2].value),
                "engagement_rate": f"{float(row.metric_values[3].value) * 100:.1f}%"
            })
        return results

    def get_top_pages(self, days: int = 28, limit: int = 25) -> List[Dict[str, Any]]:
        """Lấy các trang có lượt xem nhiều nhất (Page Path)"""
        req = RunReportRequest(
            property=f"properties/{self.property_id}",
            dimensions=[
                Dimension(name="pagePath")
            ],
            metrics=[
                Metric(name="screenPageViews"),
                Metric(name="activeUsers"),
                Metric(name="engagementRate")
            ],
            order_bys=[
                OrderBy(metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"), desc=True)
            ],
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")],
            limit=limit
        )
        resp = self.client.run_report(req)
        results = []
        for row in resp.rows:
            results.append({
                "page_path": row.dimension_values[0].value,
                "pageviews": int(row.metric_values[0].value),
                "users": int(row.metric_values[1].value),
                "engagement_rate": f"{float(row.metric_values[2].value) * 100:.1f}%"
            })
        return results

    def get_realtime(self) -> Dict[str, Any]:
        """Xem lượng người dùng đang online (Realtime 30 phút qua)"""
        req = RunRealtimeReportRequest(
            property=f"properties/{self.property_id}",
            dimensions=[Dimension(name="unifiedScreenName")],
            metrics=[Metric(name="activeUsers")]
        )
        try:
            resp = self.client.run_realtime_report(req)
            total_active = sum(int(r.metric_values[0].value) for r in resp.rows) if resp.rows else 0
            pages = []
            for row in resp.rows:
                pages.append({
                    "screen": row.dimension_values[0].value,
                    "active_users": int(row.metric_values[0].value)
                })
            return {
                "active_users_now": total_active,
                "active_screens": pages
            }
        except Exception as e:
            return {"active_users_now": 0, "error": str(e)}

    def get_events(self, days: int = 28, limit: int = 20) -> List[Dict[str, Any]]:
        """Thống kê các sự kiện người dùng tương tác (Events)"""
        req = RunReportRequest(
            property=f"properties/{self.property_id}",
            dimensions=[Dimension(name="eventName")],
            metrics=[
                Metric(name="eventCount"),
                Metric(name="totalUsers")
            ],
            order_bys=[
                OrderBy(metric=OrderBy.MetricOrderBy(metric_name="eventCount"), desc=True)
            ],
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")],
            limit=limit
        )
        resp = self.client.run_report(req)
        results = []
        for row in resp.rows:
            results.append({
                "event_name": row.dimension_values[0].value,
                "count": int(row.metric_values[0].value),
                "users": int(row.metric_values[1].value)
            })
        return results

def main():
    parser = argparse.ArgumentParser(description="Google Analytics 4 API Client for Kigyou-list")
    parser.add_argument("--action", choices=["summary", "sources", "pages", "realtime", "events"], default="summary", help="Report to generate")
    parser.add_argument("--days", type=int, default=28, help="Number of days to analyze (default: 28)")
    parser.add_argument("--limit", type=int, default=20, help="Max rows to return")
    parser.add_argument("--property-id", default=DEFAULT_PROPERTY_ID, help=f"GA4 Property ID (default: {DEFAULT_PROPERTY_ID})")

    args = parser.parse_args()
    client = GoogleAnalyticsClient(property_id=args.property_id)

    print("=" * 75)
    print(f"📊 GOOGLE ANALYTICS 4 (GA4) REPORT - PROPERTY ID: {args.property_id}")
    print("=" * 75)

    if args.action == "summary":
        summary = client.get_summary(days=args.days)
        print(f"\n📈 Tổng quan lưu lượng truy cập ({summary.get('period', '')}):")
        print(f"  • Người dùng hoạt động (Active Users):  {summary.get('active_users', 0):,}")
        print(f"  • Người dùng mới (New Users):           {summary.get('new_users', 0):,}")
        print(f"  • Phiên truy cập (Sessions):            {summary.get('sessions', 0):,}")
        print(f"  • Số lượt xem trang (Pageviews):        {summary.get('pageviews', 0):,}")
        print(f"  • Tỷ lệ tương tác (Engagement Rate):     {summary.get('engagement_rate', '0%')}")
        print(f"  • Tỷ lệ thoát (Bounce Rate):            {summary.get('bounce_rate', '0%')}")
        print(f"  • Thời gian tương tác TB / người dùng:  {summary.get('avg_engagement_sec', '0s')}")

    elif args.action == "sources":
        sources = client.get_traffic_sources(days=args.days, limit=args.limit)
        print(f"\n🌐 Nguồn lưu lượng truy cập (Top {len(sources)} nguồn trong {args.days} ngày qua):")
        print(f"{'Source':<25} | {'Medium':<12} | {'Users':<8} | {'Sessions':<10} | {'Eng. Rate':<10}")
        print("-" * 75)
        for s in sources:
            print(f"{s['source'][:24]:<25} | {s['medium'][:11]:<12} | {s['users']:<8} | {s['sessions']:<10} | {s['engagement_rate']:<10}")

    elif args.action == "pages":
        pages = client.get_top_pages(days=args.days, limit=args.limit)
        print(f"\n📄 Top trang được xem nhiều nhất ({args.days} ngày qua):")
        print(f"{'Page Path':<45} | {'Views':<8} | {'Users':<8} | {'Eng. Rate':<10}")
        print("-" * 75)
        for p in pages:
            print(f"{p['page_path'][:44]:<45} | {p['pageviews']:<8} | {p['users']:<8} | {p['engagement_rate']:<10}")

    elif args.action == "realtime":
        rt = client.get_realtime()
        print(f"\n⚡ Lượng truy cập thời gian thực (Realtime - 30 phút qua):")
        print(f"  • Số người đang online: {rt.get('active_users_now', 0)}")
        screens = rt.get('active_screens', [])
        if screens:
            print(f"\n  Các màn hình đang xem:")
            for sc in screens:
                print(f"    - {sc['screen']}: {sc['active_users']} users")

    elif args.action == "events":
        events = client.get_events(days=args.days, limit=args.limit)
        print(f"\n🎯 Sự kiện tương tác trên website (Top {len(events)} sự kiện trong {args.days} ngày qua):")
        print(f"{'Event Name':<30} | {'Count':<10} | {'Total Users':<12}")
        print("-" * 60)
        for ev in events:
            print(f"{ev['event_name']:<30} | {ev['count']:<10} | {ev['users']:<12}")

if __name__ == "__main__":
    main()
