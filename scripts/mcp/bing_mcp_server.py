#!/usr/bin/env python3
"""
Bing Webmaster Tools MCP Server
Standard stdio JSON-RPC 2.0 implementation for Antigravity & AI Agents.
Provides tools for querying search rankings, impressions, clicks, keywords, and fast URL indexing submission.
"""

import sys
import json
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Import Bing client from scripts
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from bing_webmaster import BingWebmasterClient, DEFAULT_SITE_URL, DEFAULT_API_KEY

SERVER_INFO = {
    "name": "bing-webmaster-tools",
    "version": "1.0.0"
}

TOOLS = [
    {
        "name": "bing_get_traffic_summary",
        "description": "Lấy báo cáo tổng hợp lưu lượng tìm kiếm trên Bing (Clicks, Impressions, Rank) và hạn mức quota submit URL.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "site_url": {
                    "type": "string",
                    "description": "URL website cần kiểm tra (Mặc định: https://kigyoulist.com/)",
                    "default": DEFAULT_SITE_URL
                },
                "days": {
                    "type": "integer",
                    "description": "Số ngày gần nhất cần xem (Mặc định: 7)",
                    "default": 7
                }
            }
        }
    },
    {
        "name": "bing_get_top_queries",
        "description": "Lấy danh sách các từ khóa tìm kiếm tiếng Nhật mang lại nhiều Click và Impression nhất trên Bing Search.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "site_url": {
                    "type": "string",
                    "description": "URL website (Mặc định: https://kigyoulist.com/)",
                    "default": DEFAULT_SITE_URL
                },
                "limit": {
                    "type": "integer",
                    "description": "Số lượng từ khóa cần lấy (Mặc định: 20)",
                    "default": 20
                }
            }
        }
    },
    {
        "name": "bing_get_top_pages",
        "description": "Lấy danh sách các trang/URL của website đang có thứ hạng và lượt hiển thị tốt nhất trên Bing.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "site_url": {
                    "type": "string",
                    "description": "URL website (Mặc định: https://kigyoulist.com/)",
                    "default": DEFAULT_SITE_URL
                },
                "limit": {
                    "type": "integer",
                    "description": "Số lượng URL cần lấy (Mặc định: 20)",
                    "default": 20
                }
            }
        }
    },
    {
        "name": "bing_submit_url_for_indexing",
        "description": "Gửi 1 URL cụ thể lên Microsoft Bing để ép lập chỉ mục (index) siêu tốc trong vài phút.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "URL của trang hoặc bài viết mới cần index (Ví dụ: https://kigyoulist.com/ja/pricing)"
                },
                "site_url": {
                    "type": "string",
                    "description": "URL website (Mặc định: https://kigyoulist.com/)",
                    "default": DEFAULT_SITE_URL
                }
            },
            "required": ["url"]
        }
    },
    {
        "name": "bing_submit_batch_urls",
        "description": "Gửi một danh sách nhiều URL (tối đa 100 URL) lên Bing để lập chỉ mục hàng loạt.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "urls": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Danh sách các URL cần index"
                },
                "site_url": {
                    "type": "string",
                    "description": "URL website (Mặc định: https://kigyoulist.com/)",
                    "default": DEFAULT_SITE_URL
                }
            },
            "required": ["urls"]
        }
    }
]

def handle_tool_call(name: str, arguments: dict) -> dict:
    client = BingWebmasterClient()
    site_url = arguments.get("site_url", DEFAULT_SITE_URL)

    if name == "bing_get_traffic_summary":
        days = arguments.get("days", 7)
        stats = client.get_traffic_summary(site_url)
        quota = client.get_submission_quota(site_url)
        recent = stats[-days:] if len(stats) >= days else stats
        return {
            "site": site_url,
            "quota": quota,
            "recent_days_count": len(recent),
            "stats": recent
        }

    elif name == "bing_get_top_queries":
        limit = arguments.get("limit", 20)
        queries = client.get_query_stats(site_url, limit=limit)
        return {"site": site_url, "count": len(queries), "queries": queries}

    elif name == "bing_get_top_pages":
        limit = arguments.get("limit", 20)
        pages = client.get_page_stats(site_url, limit=limit)
        return {"site": site_url, "count": len(pages), "pages": pages}

    elif name == "bing_submit_url_for_indexing":
        url = arguments["url"]
        client.submit_url(url, site_url)
        quota = client.get_submission_quota(site_url)
        return {
            "success": True,
            "submitted_url": url,
            "message": f"Successfully submitted {url} to Microsoft Bing for fast indexing.",
            "remaining_daily_quota": quota.get("DailyQuota")
        }

    elif name == "bing_submit_batch_urls":
        urls = arguments["urls"]
        client.submit_url_batch(urls, site_url)
        quota = client.get_submission_quota(site_url)
        return {
            "success": True,
            "submitted_count": len(urls),
            "remaining_daily_quota": quota.get("DailyQuota")
        }

    else:
        raise ValueError(f"Unknown tool: {name}")

def process_request(request: dict) -> dict:
    req_id = request.get("id")
    method = request.get("method")
    params = request.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": SERVER_INFO
            }
        }
    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": TOOLS}
        }
    elif method == "tools/call":
        name = params.get("name")
        args = params.get("arguments", {})
        try:
            result_data = handle_tool_call(name, args)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps(result_data, ensure_ascii=False, indent=2)}]
                }
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "isError": True,
                "error": {"code": -32000, "message": str(e)}
            }
    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method '{method}' not found"}
        }

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            resp = process_request(req)
            sys.stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": str(e)}}
            sys.stdout.write(json.dumps(err_resp, ensure_ascii=False) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
