"""
Kigyou-list Official Python SDK for AI Sales Agents (Japan B2B Data Infrastructure)
Usage:
    from kigyoulist import KigyouListClient

    client = KigyouListClient(api_key="your_api_key")
    # 1. Resolve Identity & Compliance
    info = client.resolve(domain="sample.co.jp")

    # 2. Search Hot Leads with Signals
    leads = client.search(prefecture_code="13", has_hiring=True, limit=5)
"""

import urllib.request
import urllib.parse
import json
from typing import Dict, Any, Optional, List

class KigyouListClient:
    def __init__(self, api_key: str, base_url: str = "https://kigyoulist.com"):
        self.api_key = api_key.strip()
        self.base_url = base_url.rstrip("/")

    def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        if params:
            # Filter None
            clean_params = {k: v for k, v in params.items() if v is not None}
            query_str = urllib.parse.urlencode(clean_params)
            url = f"{url}?{query_str}"

        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "User-Agent": "KigyouList-Python-SDK/1.1.0"
            }
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            try:
                err_json = json.loads(error_body)
                raise RuntimeError(f"Kigyou-list API Error [{e.code}]: {err_json.get('error', error_body)}")
            except json.JSONDecodeError:
                raise RuntimeError(f"Kigyou-list API Error [{e.code}]: {error_body}")

    def resolve(
        self,
        domain: Optional[str] = None,
        name: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        corporate_number: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Tra cứu ngược danh tính doanh nghiệp từ domain, tên, email, sđt.
        Trả về 13 số 法人番号, điểm an toàn pháp lý Compliance Score và Form Fingerprint.
        """
        return self._get("/api/v1/enrich/resolve", {
            "domain": domain,
            "name": name,
            "phone": phone,
            "email": email,
            "corporate_number": corporate_number
        })

    def search(
        self,
        keyword: Optional[str] = None,
        prefecture_code: Optional[str] = None,
        industry_code: Optional[str] = None,
        has_hiring: Optional[bool] = None,
        has_subsidy: Optional[bool] = None,
        has_bidding: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Tìm kiếm doanh nghiệp kèm tín hiệu Intent và lời chào hàng Keigo (Prompt-Ready Context).
        """
        params: Dict[str, Any] = {
            "keyword": keyword,
            "prefecture_code": prefecture_code,
            "industry_code": industry_code,
            "limit": limit,
            "offset": offset
        }
        if has_hiring is not None:
            params["has_hiring"] = "true" if has_hiring else "false"
        if has_subsidy is not None:
            params["has_subsidy"] = "true" if has_subsidy else "false"
        if has_bidding is not None:
            params["has_bidding"] = "true" if has_bidding else "false"

        return self._get("/api/v1/companies", params)

    def semantic_search(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        Tìm kiếm doanh nghiệp bằng ngôn ngữ tự nhiên (Semantic Search).
        Tự động phân tích ngành, địa điểm, tín hiệu và tính điểm Semantic Relevance.
        """
        url = f"{self.base_url}/api/v1/companies/semantic-search"
        payload = json.dumps({"query": query, "limit": limit}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "KigyouList-Python-SDK/1.1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def subscribe_webhook(self, webhook_url: str, filter_events: Optional[List[str]] = None, filter_prefecture: Optional[str] = None) -> Dict[str, Any]:
        """
        Đăng ký nhận tín hiệu doanh nghiệp thời gian thực qua Webhook (Push Model).
        """
        url = f"{self.base_url}/api/v1/webhooks"
        payload = json.dumps({
            "webhook_url": webhook_url,
            "filter_events": filter_events or ["hiring", "subsidy", "bidding"],
            "filter_prefecture": filter_prefecture
        }).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "KigyouList-Python-SDK/1.1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def get_quota(self) -> Dict[str, Any]:
        """Lấy số dư hạn ngạch API còn lại."""
        return self._get("/api/v1/quota")
