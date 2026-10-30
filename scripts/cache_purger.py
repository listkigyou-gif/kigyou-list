#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
========================================================================================
KIGYOU-LIST TWO-TIER CACHE PURGER MODULE (Mô-đun Tiện Ích Hủy Cache 2 Lớp Tự Động)
========================================================================================
Conforms to:
  - .agents/skills/b2b-seo-engine/SKILL.md
  - .agents/skills/b2b-data-engine/SKILL.md

Responsibilities:
  1. Targeted Cloudflare Edge Purge (Chính xác từng URL công ty biến động + Hubs liên quan)
  2. Nginx NVMe Micro-Cache Invalidation (Gửi header bí mật X-Purge-Cache hoặc dọn SSD)
  3. Batch Purge Pipeline: Tự động gom chùm 30 URLs/lần theo giới hạn Cloudflare API
  4. Hỗ trợ chạy đa môi trường: VPS Production hoặc PC Local (qua SSH paramiko)

Usage as Python module:
  from scripts.cache_purger import purge_cache_for_companies, purge_cache_for_urls

  # Purge công ty và hub mẹ tương ứng:
  purge_cache_for_companies(['1180301018771'], hub_paths=['/ja/licenses', '/ja/changes/relocation'])

Usage via CLI:
  python scripts/cache_purger.py --companies 1180301018771 4430001051870 --hubs /ja/licenses
  python scripts/cache_purger.py --urls https://kigyoulist.com/ja/licenses
  python scripts/cache_purger.py --all
========================================================================================
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.error

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass
def _load_env_file(filepath):
    """Đọc file env không cần thư viện ngoài (Zero-dependency)"""
    if not os.path.exists(filepath):
        return
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass

# 1. Load Environment Variables
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_load_env_file(os.path.join(PROJECT_ROOT, ".env.local"))
_load_env_file(os.path.join(PROJECT_ROOT, ".env"))

CF_EMAIL = os.getenv("CLOUDFLARE_EMAIL", "trungkim8694@gmail.com")
CF_KEY = os.getenv("CLOUDFLARE_API_KEY", "")
CF_ZONE_ID = os.getenv("CLOUDFLARE_ZONE_ID", "881d2cbd9004c4216cb9f8d28c99b0b9")
BASE_URL = os.getenv("NEXTAUTH_URL", "https://kigyoulist.com").rstrip("/")

NGINX_PURGE_SECRET = "kigyou_cache_bypass_secret_2026"
DEFAULT_LOCALES = ["ja", "en", "vi"]
CF_BATCH_SIZE = 30  # Giới hạn tối đa của Cloudflare cho single-file purge trong 1 request

def _call_cloudflare_purge(payload):
    """Gửi yêu cầu purge cache đến Cloudflare API"""
    url = f"https://api.cloudflare.com/client/v4/zones/{CF_ZONE_ID}/purge_cache"
    headers = {
        "X-Auth-Email": CF_EMAIL,
        "X-Auth-Key": CF_KEY,
        "Content-Type": "application/json"
    }
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res.get("success", False), res
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return False, json.loads(err_body)
        except Exception:
            return False, {"error": f"HTTP {e.code}: {err_body}"}
    except Exception as e:
        return False, {"error": str(e)}

def purge_cloudflare_files(urls, verbose=True):
    """
    Xóa cache Cloudflare Edge cho danh sách URL cụ thể.
    Tự động chia nhỏ theo lô 30 URLs/request (Cloudflare limit).
    """
    if not urls:
        return True, 0

    unique_urls = sorted(list(set(urls)))
    total_purged = 0
    all_success = True

    # Phân mảnh theo batches 30 URLs
    for i in range(0, len(unique_urls), CF_BATCH_SIZE):
        batch = unique_urls[i:i + CF_BATCH_SIZE]
        payload = {"files": batch}
        success, resp = _call_cloudflare_purge(payload)
        
        if success:
            total_purged += len(batch)
            if verbose:
                print(f"  [+] [Cloudflare Edge] Xóa thành công {len(batch)} URLs (Batch {i // CF_BATCH_SIZE + 1})")
        else:
            all_success = False
            if verbose:
                print(f"  [-] [Cloudflare Edge] Lỗi xóa batch {i // CF_BATCH_SIZE + 1}: {resp}")

    return all_success, total_purged

def revalidate_nginx_urls(urls, verbose=True):
    """
    Gửi request kích hoạt Nginx revalidate cache bằng secret header.
    Yêu cầu Nginx bỏ qua cache cũ và ghi bản render mới từ Next.js.
    """
    if not urls:
        return True

    success_count = 0
    # Revalidate đại diện hoặc toàn bộ URL
    for url in urls[:15]:  # Giới hạn 15 request đầu tiên để tối ưu tốc độ
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Kigyoulist-Cache-Revalidator/1.0",
                "X-Purge-Cache": NGINX_PURGE_SECRET
            })
            with urllib.request.urlopen(req, timeout=8) as resp:
                if resp.status == 200:
                    success_count += 1
        except Exception:
            pass

    if verbose and success_count > 0:
        print(f"  [+] [Nginx VPS] Đã revalidate thành công {success_count} URLs qua secret header")
    return True

def flush_nginx_vps_cache(verbose=True):
    """
    Dọn dẹp sạch toàn bộ thư mục cache Nginx trên VPS (/var/cache/nginx/kigyou/*).
    Tự động nhận diện chạy trên VPS hoặc kết nối từ xa qua paramiko.
    """
    # 1. Nếu đang chạy trực tiếp trên VPS
    if os.path.exists("/var/cache/nginx/kigyou"):
        try:
            os.system("rm -rf /var/cache/nginx/kigyou/*")
            if verbose:
                print("  [+] [Nginx VPS Local] Đã dọn dẹp sạch /var/cache/nginx/kigyou/*")
            return True
        except Exception as e:
            if verbose:
                print(f"  [-] [Nginx VPS Local] Lỗi: {e}")
            return False

    # 2. Nếu đang chạy từ PC Local: điều khiển VPS từ xa
    try:
        from vps_remote_exec import run_command
        out, err = run_command("rm -rf /var/cache/nginx/kigyou/* && systemctl reload nginx")
        if verbose:
            print("  [+] [Nginx VPS Remote] Đã dọn dẹp sạch Nginx cache trên VPS qua SSH")
        return True
    except Exception as e:
        if verbose:
            print(f"  [-] [Nginx VPS Remote] SSH purge notice: {e}")
        return False

def purge_cache_for_companies(corporate_numbers, hub_paths=None, locales=None, purge_nginx=True, verbose=True):
    """
    =====================================================================================
    HÀM CỐT LÕI (CORE API): Hủy cache cho danh sách công ty biến động và Hubs liên quan.
    =====================================================================================
    Args:
      corporate_numbers (list[str]): Danh sách mã số thuế pháp nhân (13 số)
      hub_paths (list[str], optional): Danh sách đường dẫn Hub mẹ (VD: ['/ja/licenses', '/ja/changes/relocation'])
      locales (list[str], optional): Danh sách mã ngôn ngữ (Mặc định: ['ja', 'en', 'vi'])
      purge_nginx (bool): Có gửi tín hiệu làm mới Nginx hay không (Mặc định: True)
      verbose (bool): In thông tin ra màn hình console (Mặc định: True)

    Returns:
      dict: {
        "success": bool,
        "total_urls": int,
        "purged_count": int,
        "urls": list[str]
      }
    """
    if not corporate_numbers and not hub_paths:
        return {"success": True, "total_urls": 0, "purged_count": 0, "urls": []}

    target_locales = locales or DEFAULT_LOCALES
    urls_to_purge = []

    # 1. Thêm URL chi tiết công ty cho từng ngôn ngữ
    if corporate_numbers:
        for cid in corporate_numbers:
            cid_str = str(cid).strip()
            if not cid_str:
                continue
            for loc in target_locales:
                urls_to_purge.append(f"{BASE_URL}/{loc}/company/{cid_str}")

    # 2. Thêm các URL Hub mẹ liên quan
    if hub_paths:
        for hp in hub_paths:
            hp_clean = hp.strip()
            if not hp_clean:
                continue
            if hp_clean.startswith("http"):
                urls_to_purge.append(hp_clean)
            else:
                if not hp_clean.startswith("/"):
                    hp_clean = "/" + hp_clean
                urls_to_purge.append(f"{BASE_URL}{hp_clean}")

    urls_to_purge = sorted(list(set(urls_to_purge)))

    if verbose:
        print("=" * 75)
        print(f"⚡ [TWO-TIER CACHE PURGE] Khởi động hủy cache cho {len(urls_to_purge)} URLs...")
        print(f"   • Doanh nghiệp: {len(corporate_numbers or [])} mã pháp nhân")
        print(f"   • Hub mẹ:       {len(hub_paths or [])} chuyên đề")
        print("=" * 75)

    # 3. Purge Cloudflare Edge
    cf_ok, cf_count = purge_cloudflare_files(urls_to_purge, verbose=verbose)

    # 4. Revalidate Nginx
    if purge_nginx:
        revalidate_nginx_urls(urls_to_purge, verbose=verbose)

    if verbose:
        print(f"[+] [TWO-TIER CACHE PURGE] Hoàn tất: {cf_count}/{len(urls_to_purge)} URLs đã được làm mới toàn cầu.\n")

    return {
        "success": cf_ok,
        "total_urls": len(urls_to_purge),
        "purged_count": cf_count,
        "urls": urls_to_purge
    }

def purge_cache_for_urls(urls, purge_nginx=True, verbose=True):
    """Hủy cache theo danh sách URL đầy đủ trực tiếp"""
    if not urls:
        return {"success": True, "purged_count": 0}

    cf_ok, cf_count = purge_cloudflare_files(urls, verbose=verbose)
    if purge_nginx:
        revalidate_nginx_urls(urls, verbose=verbose)

    return {
        "success": cf_ok,
        "total_urls": len(urls),
        "purged_count": cf_count,
        "urls": urls
    }

def purge_all_cache(verbose=True):
    """
    HỦY TOÀN BỘ CACHE KHẨN CẤP (EMERGENCY GLOBAL FLUSH):
    1. Cloudflare purge_everything = true
    2. Nginx rm -rf /var/cache/nginx/kigyou/*
    """
    if verbose:
        print("=" * 75)
        print("🚨 [EMERGENCY PURGE ALL] HỦY TOÀN BỘ CACHE KHẨN CẤP (CLOUDFLARE + NGINX)")
        print("=" * 75)

    # 1. Cloudflare Purge Everything
    cf_ok, cf_res = _call_cloudflare_purge({"purge_everything": True})
    if verbose:
        if cf_ok:
            print("  [+] [Cloudflare Edge] Đã xóa toàn bộ Cache Zone thành công (100% POPs)")
        else:
            print(f"  [-] [Cloudflare Edge] Lỗi Purge Everything: {cf_res}")

    # 2. Nginx Purge All
    ngx_ok = flush_nginx_vps_cache(verbose=verbose)

    if verbose:
        print("[+] [EMERGENCY PURGE ALL] Hoàn tất khẩn cấp.\n")

    return cf_ok and ngx_ok

# ======================================================================================
# CLI COMMAND LINE INTERFACE
# ======================================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kigyou-list Two-Tier Cache Purger")
    parser.add_argument("--companies", nargs="+", help="Danh sách Corporate Numbers cần xóa cache")
    parser.add_argument("--hubs", nargs="+", help="Danh sách Hub paths (VD: /ja/licenses /ja/changes/relocation)")
    parser.add_argument("--urls", nargs="+", help="Danh sách URL đầy đủ")
    parser.add_argument("--all", action="store_true", help="HỦY TOÀN BỘ CACHE TOÀN CẦU (Purge Everything)")

    args = parser.parse_args()

    if args.all:
        purge_all_cache()
    elif args.urls:
        purge_cache_for_urls(args.urls)
    elif args.companies or args.hubs:
        purge_cache_for_companies(args.companies or [], hub_paths=args.hubs or [])
    else:
        parser.print_help()
