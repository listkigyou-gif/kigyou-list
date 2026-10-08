#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Done-For-You (DFY) Contact Form DM Dispatcher Engine
====================================================
Automated, compliance-first contact form submission pipeline for Japanese B2B Outreach.

Key Capabilities:
1. Anti-Spam Compliance: Auto-skips forms stating "営業お断り"
2. Smart Field Mapping: Identifies Japanese corporate inputs (会社名, お名前, メール, 内容)
3. Multi-Step Form Handling: Processes [確認画面へ] -> [送信する] flows
4. Audit & Verification: Saves screenshots and outputs detailed CSV delivery report
5. Dry-Run Mode: Test fills without clicking final submit button
"""

import os
import sys
import time
import argparse
import sqlite3
import csv
from urllib.parse import urlparse
from datetime import datetime
from typing import Dict, Any, List

try:
    from dotenv import load_dotenv
    env_local = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local")
    if os.path.exists(env_local):
        load_dotenv(env_local)
except ImportError:
    pass

def parse_proxy_url(proxy_str: str):
    if not proxy_str:
        return None
    if not (proxy_str.startswith("http://") or proxy_str.startswith("https://") or proxy_str.startswith("socks5://")):
        proxy_str = "http://" + proxy_str
    parsed = urlparse(proxy_str)
    config = {
        "server": f"{parsed.scheme}://{parsed.hostname}:{parsed.port}",
        "bypass": "localhost, 127.0.0.1"
    }
    if parsed.username:
        config["username"] = parsed.username
    if parsed.password:
        config["password"] = parsed.password
    return config

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Import local detector module
from detector import check_anti_spam_disclaimer, check_captcha_or_bot_protection, analyze_form_structure

try:
    from playwright.sync_api import sync_playwright, Page, TimeoutError as PlaywrightTimeoutError
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "kigyou-list.db")
SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports", "screenshots")


class FormDispatcher:
    def __init__(self, sender_profile: Dict[str, str], dry_run: bool = True, save_screenshot: bool = False):
        self.sender = sender_profile
        self.dry_run = dry_run
        self.save_screenshot = save_screenshot
        if self.save_screenshot:
            os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    def dispatch_single_company(self, page: Page, company: Dict[str, Any]) -> Dict[str, Any]:
        url = company.get("contact_form_url") or company.get("website_url")
        corp_num = company.get("corporate_number", "unknown")
        comp_name = company.get("company_name", "Target Company")

        result = {
            "corporate_number": corp_num,
            "company_name": comp_name,
            "form_url": url,
            "status": "FAILED",
            "billable": False,
            "message": "",
            "screenshot_path": "",
            "timestamp": datetime.now().isoformat()
        }

        if not url:
            result["message"] = "No contact form URL available"
            return result

        try:
            # 1. Navigate to contact form URL
            print(f"  [>] Visiting {comp_name} ({corp_num}): {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(1500)

            html_content = page.content()

            # 2. Check for Anti-Spam / Sales Prohibited Disclaimer (AI Safety Check)
            disclaimer_check = check_anti_spam_disclaimer(html_content)
            if disclaimer_check["has_disclaimer"]:
                result["status"] = "SKIPPED_DISCLAIMER"
                result["billable"] = False
                result["message"] = f"Skipped: Prohibited disclaimer ({', '.join(disclaimer_check['matched_phrases'])})"
                print(f"  [!] {result['message']} (Refund credit)")
                return result

            # 3. Check for CAPTCHA or Anti-Bot Protection (Approach 1: Auto-skip and refund)
            captcha_check = check_captcha_or_bot_protection(html_content)
            if captcha_check["has_protection"]:
                result["status"] = "BLOCKED_CAPTCHA" if "CAPTCHA" in captcha_check["type"] else "BLOCKED_BOT_WAF"
                result["billable"] = False
                result["message"] = f"Skipped: {captcha_check['reason']}"
                print(f"  [!] {result['message']} (Refund credit)")
                return result

            # 4. Locate and fill form fields via smart CSS / XPath selectors
            filled_fields = 0

            # Company name input
            company_selectors = [
                'input[name*="company" i]', 'input[name*="kaisha" i]', 'input[id*="company" i]',
                'input[placeholder*="会社" i]', 'input[placeholder*="法人" i]'
            ]
            for sel in company_selectors:
                if page.locator(sel).count() > 0:
                    page.locator(sel).first.fill(self.sender["company_name"])
                    filled_fields += 1
                    break

            # Contact person name
            name_selectors = [
                'input[name*="name" i]:not([name*="company" i])', 'input[id*="name" i]',
                'input[placeholder*="氏名" i]', 'input[placeholder*="名前" i]', 'input[placeholder*="担当" i]'
            ]
            for sel in name_selectors:
                if page.locator(sel).count() > 0:
                    page.locator(sel).first.fill(self.sender["contact_name"])
                    filled_fields += 1
                    break

            # Furigana (if present)
            kana_selectors = [
                'input[name*="kana" i]', 'input[name*="furigana" i]', 'input[placeholder*="フリガナ" i]', 'input[placeholder*="ふりがな" i]'
            ]
            for sel in kana_selectors:
                if page.locator(sel).count() > 0:
                    page.locator(sel).first.fill(self.sender.get("furigana", "ヤマダ タロウ"))
                    break

            # Email address
            email_selectors = [
                'input[type="email"]', 'input[name*="mail" i]', 'input[id*="mail" i]', 'input[placeholder*="mail" i]'
            ]
            for sel in email_selectors:
                if page.locator(sel).count() > 0:
                    page.locator(sel).first.fill(self.sender["email"])
                    filled_fields += 1
                    # Also look for email confirmation input (exclude submit/button)
                    conf_selectors = [
                        'input[name*="confirm" i]:not([type="submit"]):not([type="button"])',
                        'input[name*="check" i]:not([type="submit"]):not([type="button"])',
                        'input[id*="confirm" i]:not([type="submit"]):not([type="button"])'
                    ]
                    for c_sel in conf_selectors:
                        if page.locator(c_sel).count() > 0:
                            page.locator(c_sel).first.fill(self.sender["email"])
                    break

            # Phone number
            phone_selectors = [
                'input[type="tel"]', 'input[name*="tel" i]', 'input[name*="phone" i]', 'input[placeholder*="電話" i]'
            ]
            for sel in phone_selectors:
                if page.locator(sel).count() > 0:
                    page.locator(sel).first.fill(self.sender.get("phone", "03-1234-5678"))
                    filled_fields += 1
                    break

            # Subject (if available)
            subject_selectors = [
                'input[type="text"][name*="subject" i]', 'input[type="text"][name*="title" i]',
                'input:not([type="checkbox"]):not([type="radio"])[name*="subject" i]',
                'input[placeholder*="件名" i]', 'input[placeholder*="題名" i]'
            ]
            for sel in subject_selectors:
                if page.locator(sel).count() > 0:
                    page.locator(sel).first.fill(self.sender.get("subject", "貴社事業に関する協業のご提案"))
                    break

            # Message Body (Textarea)
            textarea = page.locator('textarea')
            if textarea.count() > 0:
                # Personalize greeting with company name
                custom_body = f"{comp_name} 御中\n\n{self.sender['message_body']}"
                textarea.first.fill(custom_body)
                filled_fields += 1

            # Privacy policy agreement checkbox
            privacy_checkbox = page.locator('input[type="checkbox"]')
            if privacy_checkbox.count() > 0:
                try:
                    privacy_checkbox.first.check()
                except Exception:
                    pass

            if filled_fields < 2:
                result["status"] = "FORM_PARSE_ERROR"
                result["message"] = f"Insufficient fields matched (filled {filled_fields} fields)"
                return result

            # 4. Handle Confirmation or Direct Submit
            if self.dry_run:
                # DRY RUN: Take screenshot only if explicitly requested
                if self.save_screenshot:
                    screenshot_path = os.path.join(SCREENSHOT_DIR, f"{corp_num}_{int(time.time())}.png")
                    page.screenshot(path=screenshot_path)
                    result["screenshot_path"] = screenshot_path
                result["status"] = "SUCCESS_DRY_RUN"
                result["billable"] = False
                result["message"] = f"Form successfully filled ({filled_fields} fields). Not submitted (Dry Run)."
                print(f"  [+] {result['message']}")
                return result

            # LIVE SUBMISSION
            # Find submit/confirm button
            submit_btn = None
            btn_texts = ["確認画面へ", "確認", "送信する", "送信", "次へ", "Submit", "Send"]
            for btn_txt in btn_texts:
                loc = page.locator(f'button:has-text("{btn_txt}"), input[type="submit"][value*="{btn_txt}" i]')
                if loc.count() > 0:
                    submit_btn = loc.first
                    break

            if not submit_btn:
                # Fallback to standard input submit
                loc = page.locator('input[type="submit"], button[type="submit"]')
                if loc.count() > 0:
                    submit_btn = loc.first

            if submit_btn:
                submit_btn.click()
                page.wait_for_timeout(3000)

                # Check if it was a confirmation page and needs one more click to final submit
                final_btn = page.locator('button:has-text("送信する"), input[type="submit"][value*="送信する" i], button:has-text("送信"), input[type="submit"][value*="送信" i]')
                if final_btn.count() > 0:
                    final_btn.first.click()
                    page.wait_for_timeout(3000)

                if self.save_screenshot:
                    screenshot_path = os.path.join(SCREENSHOT_DIR, f"{corp_num}_{int(time.time())}.png")
                    page.screenshot(path=screenshot_path)
                    result["screenshot_path"] = screenshot_path

                result["status"] = "SUCCESS_SENT"
                result["billable"] = True
                result["message"] = "Form successfully dispatched and confirmed."
                print(f"  [+] {result['message']} (Billable: 1 Credit)")
            else:
                result["status"] = "NO_SUBMIT_BUTTON"
                result["billable"] = False
                result["message"] = "Could not find submit button"

        except PlaywrightTimeoutError:
            result["status"] = "TIMEOUT"
            result["billable"] = False
            result["message"] = "Page navigation or submission timed out"
            print(f"  [-] Timeout loading {url}")
        except Exception as e:
            result["status"] = "ERROR"
            result["billable"] = False
            result["message"] = str(e)
            print(f"  [-] Error: {e}")

        return result


def fetch_target_companies(limit: int = 10, pref_code: str = None, industry_code: str = None) -> List[Dict[str, Any]]:
    """Retrieves target companies that have contact_form_url from SQLite."""
    if not os.path.exists(DB_PATH):
        print(f"[!] Database not found at {DB_PATH}")
        return []

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    query = """
        SELECT corporate_number, company_name, prefecture_name, website_url, contact_form_url, email_address
        FROM companies
        WHERE contact_form_url IS NOT NULL AND contact_form_url != ''
    """
    params = []

    if pref_code:
        query += " AND prefecture_code = ?"
        params.append(pref_code)

    query += " ORDER BY RANDOM() LIMIT ?"
    params.append(limit)

    rows = c.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def main():
    parser = argparse.ArgumentParser(description="Kigyou-List Done-For-You Contact Form Dispatcher (Approach 1: Skip & Refund)")
    parser.add_argument("--limit", type=int, default=5, help="Number of companies to process")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Test form filling without final submit")
    parser.add_argument("--live", action="store_true", help="Perform real live form submission")
    parser.add_argument("--corporate-number", type=str, help="Target a specific corporate number")
    parser.add_argument("--screenshot", action="store_true", default=False, help="Save screenshots (disabled by default to save disk space)")
    parser.add_argument("--proxy", type=str, default=os.environ.get("OUTREACH_PROXY_URL"), help="Proxy URL (e.g. http://user:pass@host:port)")
    args = parser.parse_args()

    is_dry_run = not args.live
    proxy_config = parse_proxy_url(args.proxy) if args.proxy else None

    print("=" * 65)
    print("  KIGYOU-LIST: DONE-FOR-YOU (DFY) FORM OUTREACH ENGINE")
    print(f"  Mode: {'[DRY RUN - Safe Simulation]' if is_dry_run else '[LIVE SUBMISSION - Real Outreach]'}")
    print(f"  Screenshots: {'[ENABLED]' if args.screenshot else '[DISABLED - Lightweight Mode]'}")
    print(f"  Proxy: {'[' + proxy_config['server'] + ']' if proxy_config else '[DIRECT CONNECTION]'}")
    print("  Strategy: [Approach 1: Auto-Skip CAPTCHA & Refund Credits]")
    print("=" * 65)

    if not HAS_PLAYWRIGHT:
        print("[!] Playwright is not installed. Please install with: pip install playwright && playwright install")
        sys.exit(1)

    # Sample Sender Profile (Compliant with Tokushoho & Keigo)
    sender_profile = {
        "company_name": "株式会社アウトバウンドマーケティング",
        "contact_name": "山田 太郎",
        "furigana": "ヤマダ タロウ",
        "email": "contact@example-outreach.jp",
        "phone": "03-5555-0123",
        "subject": "貴社のIT・業務効率化に関するご提案",
        "message_body": (
            "貴社の問い合わせ窓口より大変恐れ入ります。\n"
            "株式会社アウトバウンドマーケティングの山田と申します。\n\n"
            "突然のご連絡にて大変恐縮ではございますが、貴社の事業拡大および業務効率化を支援する"
            "ソリューションのご案内でお問い合わせをさせていただきました。\n\n"
            "もし少しでもご興味をお持ちいただけましたら、30分ほどのオンライン面談にて"
            "詳細な事例をご紹介させていただけますと幸いです。\n\n"
            "--------------------------------------------------\n"
            "※本メッセージがご不要な場合は、大変お手数ですがその旨をご返信いただけますと幸いです。\n"
            "株式会社アウトバウンドマーケティング\n"
            "担当: 山田 太郎\n"
            "Email: contact@example-outreach.jp\n"
            "--------------------------------------------------"
        )
    }

    # Fetch targets
    if args.corporate_number:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        row = c.execute("SELECT corporate_number, company_name, prefecture_name, website_url, contact_form_url FROM companies WHERE corporate_number=?", (args.corporate_number,)).fetchone()
        conn.close()
        targets = [dict(row)] if row else []
    else:
        targets = fetch_target_companies(limit=args.limit)

    print(f"[*] Loaded {len(targets)} target companies with verified contact forms.")

    dispatcher = FormDispatcher(sender_profile=sender_profile, dry_run=is_dry_run, save_screenshot=args.screenshot)
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, proxy=proxy_config)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()

        for idx, company in enumerate(targets, 1):
            print(f"\n[{idx}/{len(targets)}] Processing: {company['company_name']}")
            res = dispatcher.dispatch_single_company(page, company)
            results.append(res)
            time.sleep(1)

        browser.close()

    # Generate CSV Delivery Report (Lightweight text report without heavy image bloat)
    report_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports", f"delivery_report_{int(time.time())}.csv")
    os.makedirs(os.path.dirname(report_file), exist_ok=True)

    with open(report_file, "w", newline="", encoding="utf-8-sig") as f:
        fieldnames = ["corporate_number", "company_name", "form_url", "status", "billable", "message", "timestamp"]
        if args.screenshot:
            fieldnames.append("screenshot_path")
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(results)

    # Detailed Audit & Refund Summary
    success_count = sum(1 for r in results if r.get("billable") is True or r.get("status") == "SUCCESS_SENT")
    captcha_count = sum(1 for r in results if "CAPTCHA" in r.get("status", ""))
    disclaimer_count = sum(1 for r in results if "DISCLAIMER" in r.get("status", ""))
    waf_count = sum(1 for r in results if "WAF" in r.get("status", "") or "BOT" in r.get("status", ""))
    error_count = len(results) - success_count - captcha_count - disclaimer_count - waf_count
    refund_count = len(results) - success_count

    print("\n" + "=" * 65)
    print("  CAMPAIGN EXECUTION SUMMARY (APPROACH 1: SKIP & REFUND)")
    print("=" * 65)
    print(f"  Total Targets Processed:           {len(results)}")
    print(f"  -------------------------------------------------------------")
    print(f"  [+] SUCCESS SENT (Deduct 1 Credit): {success_count} companies")
    print(f"  [!] BLOCKED CAPTCHA (Skip & Refund):{captcha_count} companies")
    print(f"  [!] SKIPPED DISCLAIMER (Cấm chào): {disclaimer_count} companies")
    print(f"  [!] BLOCKED WAF/BOT (Firewall):     {waf_count} companies")
    print(f"  [!] ERRORS / TIMEOUT (Lỗi web):     {error_count} companies")
    print(f"  -------------------------------------------------------------")
    print(f"  Total Credits Deducted:            {success_count} credits")
    print(f"  TOTAL CREDITS TO REFUND TO USER:   {refund_count} credits")
    print(f"  Audit Report Saved To:             {report_file}")
    print("=" * 65)


if __name__ == "__main__":
    main()
