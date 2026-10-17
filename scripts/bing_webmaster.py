#!/usr/bin/env python3
"""
Bing Webmaster Tools & IndexNow API Integration for Kigyou-list
Direct API Client for querying search metrics, top queries, page performance, and submitting URLs for fast indexing.
"""

import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any, Optional

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DEFAULT_API_KEY = "7c742571ab6a4103aa339488f8220031"
DEFAULT_SITE_URL = "https://kigyoulist.com/"
API_BASE = "https://ssl.bing.com/webmaster/api.svc/json"

class BingWebmasterClient:
    def __init__(self, api_key: str = DEFAULT_API_KEY, site_url: str = DEFAULT_SITE_URL):
        self.api_key = api_key
        self.site_url = site_url

    def _call(self, endpoint: str, params: Optional[Dict[str, Any]] = None, post_data: Optional[Dict[str, Any]] = None) -> Any:
        if params is None:
            params = {}
        params["apikey"] = self.api_key
        query_str = urllib.parse.urlencode(params)
        url = f"{API_BASE}/{endpoint}?{query_str}"

        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Kigyoulist/1.0"}
        data_bytes = None
        if post_data is not None:
            data_bytes = json.dumps(post_data).encode("utf-8")
            headers["Content-Type"] = "application/json; charset=utf-8"

        req = urllib.request.Request(url, data=data_bytes, headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode("utf-8")
                if not raw:
                    return None
                parsed = json.loads(raw)
                return parsed.get("d", parsed)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise RuntimeError(f"Bing API HTTP {e.code}: {error_body}")
        except Exception as e:
            raise RuntimeError(f"Bing API Error: {str(e)}")

    def get_user_sites(self) -> List[Dict[str, Any]]:
        """Lấy danh sách các website đã được xác thực trong Bing Webmaster"""
        res = self._call("GetUserSites")
        return res or []

    def get_traffic_summary(self, site_url: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lấy thống kê Rank, Clicks, Impressions theo từng ngày gần nhất"""
        target = site_url or self.site_url
        res = self._call("GetRankAndTrafficStats", {"siteUrl": target})
        return res or []

    def get_query_stats(self, site_url: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Lấy danh sách từ khóa tìm kiếm (Queries) kèm số Click, Impression, Thứ hạng TB"""
        target = site_url or self.site_url
        res = self._call("GetQueryStats", {"siteUrl": target})
        if not res:
            return []
        # Sắp xếp theo Click giảm dần, rồi đến Impression
        sorted_res = sorted(res, key=lambda x: (x.get("Clicks", 0), x.get("Impressions", 0)), reverse=True)
        return sorted_res[:limit]

    def get_page_stats(self, site_url: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Lấy danh sách các trang (Pages/URLs) có lượt xem/click nhiều nhất trên Bing"""
        target = site_url or self.site_url
        res = self._call("GetPageStats", {"siteUrl": target})
        if not res:
            return []
        sorted_res = sorted(res, key=lambda x: (x.get("Clicks", 0), x.get("Impressions", 0)), reverse=True)
        return sorted_res[:limit]

    def get_submission_quota(self, site_url: Optional[str] = None) -> Dict[str, Any]:
        """Kiểm tra hạn mức submit URL hôm nay và tháng này"""
        target = site_url or self.site_url
        return self._call("GetUrlSubmissionQuota", {"siteUrl": target})

    def submit_url(self, url: str, site_url: Optional[str] = None) -> bool:
        """Gửi 1 URL cụ thể lên Bing để lập chỉ mục (index) siêu tốc"""
        target = site_url or self.site_url
        payload = {"siteUrl": target, "url": url}
        self._call("SubmitUrl", post_data=payload)
        return True

    def submit_url_batch(self, urls: List[str], site_url: Optional[str] = None) -> bool:
        """Gửi 1 danh sách nhiều URL (tối đa 100/lần) lên Bing để index hàng loạt"""
        target = site_url or self.site_url
        payload = {"siteUrl": target, "urlList": urls}
        self._call("SubmitUrlBatch", post_data=payload)
        return True

    def get_crawl_stats(self, site_url: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lấy số liệu bot Bing thu thập dữ liệu (Crawl) và lỗi nếu có"""
        target = site_url or self.site_url
        return self._call("GetCrawlStats", {"siteUrl": target}) or []


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Bing Webmaster Tools CLI for Kigyoulist")
    parser.add_argument("--action", choices=["summary", "queries", "pages", "quota", "submit", "batch"], default="summary")
    parser.add_argument("--url", help="URL to submit for indexing")
    parser.add_argument("--limit", type=int, default=20, help="Number of records to show")
    args = parser.parse_args()

    client = BingWebmasterClient()

    if args.action == "summary":
        stats = client.get_traffic_summary()
        quota = client.get_submission_quota()
        print(f"=== BING WEBMASTER REPORT: {DEFAULT_SITE_URL} ===")
        print(f"URL Quota còn lại hôm nay: {quota.get('DailyQuota')}/100 | Tháng: {quota.get('MonthlyQuota')}/1700")
        recent = stats[-7:] if len(stats) >= 7 else stats
        print("\n--- 7 NGÀY GẦN NHẤT ---")
        total_clicks = 0
        total_impr = 0
        for s in recent:
            clicks = s.get("Clicks", 0)
            impr = s.get("Impressions", 0)
            total_clicks += clicks
            total_impr += impr
            print(f"Clicks: {clicks:2d} | Impressions: {impr:4d}")
        print(f"-> Tổng 7 ngày: {total_clicks} clicks, {total_impr} impressions.")

    elif args.action == "queries":
        queries = client.get_query_stats(limit=args.limit)
        print(f"=== TOP {len(queries)} TỪ KHÓA BING SEARCH ===")
        for i, q in enumerate(queries, 1):
            query = q.get("Query")
            clicks = q.get("Clicks", 0)
            impr = q.get("Impressions", 0)
            pos = q.get("AvgImpressionPosition", 0)
            print(f"{i:2d}. '{query}' -> Clicks: {clicks} | Impr: {impr} | Vị trí TB: #{pos}")

    elif args.action == "pages":
        pages = client.get_page_stats(limit=args.limit)
        print(f"=== TOP {len(pages)} TRANG ĐƯỢC HIỂN THỊ TRÊN BING ===")
        for i, p in enumerate(pages, 1):
            url = p.get("Query")
            clicks = p.get("Clicks", 0)
            impr = p.get("Impressions", 0)
            pos = p.get("AvgImpressionPosition", 0)
            print(f"{i:2d}. {url} -> Clicks: {clicks} | Impr: {impr} | Vị trí TB: #{pos}")

    elif args.action == "quota":
        quota = client.get_submission_quota()
        print("Hạn mức gửi URL Bing:", json.dumps(quota, indent=2))

    elif args.action == "submit":
        if not args.url:
            print("Lỗi: Cần cung cấp --url <URL_CẦN_SUBMIT>")
            sys.exit(1)
        client.submit_url(args.url)
        print(f"Thành công! Đã gửi {args.url} lên Microsoft Bing để index siêu tốc.")

if __name__ == "__main__":
    main()
