import os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vps_remote_exec import run_command
import re

def audit_url(path, label, expected_status):
    # Test directly against Next.js on VPS localhost:3000 to bypass Cloudflare bot challenges
    cmd = f'curl -s -H "User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" http://localhost:3000{path}'
    html, err = run_command(cmd)
    
    robots_matches = re.findall(r'<meta[^>]*robots[^>]*>', html, re.I)
    robots_content = re.findall(r'<meta[^>]*name=[\"\']robots[\"\'][^>]*content=[\"\']([^\"\']+)[\"\']', html, re.I)
    
    # Cross links
    has_licenses_link = ('/ja/licenses' in html) or ('/licenses' in html)
    has_invoice_link = ('/ja/invoice' in html) or ('/invoice' in html)
    has_directory_link = ('/ja/directory' in html) or ('/directory' in html)
    
    # JSON-LD
    has_schema = ('"@type":"Corporation"' in html) or ('"@type": "Corporation"' in html) or ('"Corporation"' in html)
    
    print(f"==================================================")
    print(f"AUDIT TARGET: [{label}]")
    print(f"Path: {path}")
    print(f"Expected: {expected_status}")
    print(f"Robots Meta Tags found: {robots_matches}")
    print(f"Robots Content: {robots_content}")
    print(f"Cross-Entity Linking: Licenses={has_licenses_link}, Invoice={has_invoice_link}, Directory={has_directory_link}")
    print(f"Corporation Schema: {has_schema}")
    
    is_success = False
    if expected_status == "INDEX" and any("index" in c and "noindex" not in c for c in robots_content):
        is_success = True
    elif expected_status == "NOINDEX" and any("noindex" in c for c in robots_content):
        is_success = True
        
    print(f"STATUS VERIFICATION: {'PASSED (OK)' if is_success else 'FAILED'}")

if __name__ == "__main__":
    print("[*] MULTI-AGENT AUDIT REPORT: Thin Content Guard & Cross-Entity Linking")
    print("=" * 60)
    
    # 1. Rich Company 1: 株式会社羊蹄工業 (Phone + Web)
    audit_url('/ja/company/4430001051870', '株式会社羊蹄工業 (Rich: Phone+Web)', 'INDEX')

    # 2. Rich Company 2: 株式会社ジーアート (Phone)
    audit_url('/ja/company/7430001026291', '株式会社ジーアート (Rich: Phone)', 'INDEX')

    # 3. Thin Company 1: 株式会社ベストコーポレーション (No Phone, No Web, No Capital)
    audit_url('/ja/company/7430001026309', '株式会社ベストコーポレーション (Thin Content)', 'NOINDEX')

    # 4. Thin Company 2: エナジティック・ロジ株式会社 (Thin Content)
    audit_url('/ja/company/7430001026473', 'エナジティック・ロジ株式会社 (Thin Content)', 'NOINDEX')
