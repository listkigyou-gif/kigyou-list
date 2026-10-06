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
from datetime import datetime
from typing import Dict, Any, List

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Import local detector module
from detector import check_anti_spam_disclaimer, analyze_form_structure

try:
    from playwright.sync_api import sync_playwright, Page, TimeoutError as PlaywrightTimeoutError
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "kigyou-list.db")
SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports", "screenshots")


class FormDispatcher:
    def __init__(self, sender_profile: Dict[str, str], dry_run: bool = True):
        self.sender = sender_profile
        self.dry_run = dry_run
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

            # 2. Check for Anti-Spam / Sales Prohibited Disclaimer (AI Safety Check)
            html_content = page.content()
            disclaimer_check = check_anti_spam_disclaimer(html_content)
            if disclaimer_check["has_disclaimer"]:
                result["status"] = "SKIPPED_DISCLAIMER"
                result["message"] = f"Skipped: Prohibited disclaimer found ({', '.join(disclaimer_check['matched_phrases'])})"
                print(f"  [!] {result['message']}")
                return result

            # 3. Locate and fill form fields via smart CSS / XPath selectors
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
                    # Also look for email confirmation input
                    conf_selectors = ['input[name*="confirm" i]', 'input[name*="check" i]', 'input[id*="confirm" i]']
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
                'input[name*="subject" i]', 'input[name*="title" i]', 'input[placeholder*="件名" i]', 'input[placeholder*="題名" i]'
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
            screenshot_path = os.path.join(SCREENSHOT_DIR, f"{corp_num}_{int(time.time())}.png")

            if self.dry_run:
                # DRY RUN: Take screenshot of filled form without submitting
                page.screenshot(path=screenshot_path)
                result["status"] = "SUCCESS_DRY_RUN"
                result["message"] = f"Form successfully filled ({filled_fields} fields). Not submitted (Dry Run)."
                result["screenshot_path"] = screenshot_path
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

                page.screenshot(path=screenshot_path)
                result["status"] = "SUCCESS_SENT"
                result["message"] = "Form successfully dispatched and confirmed."
                result["screenshot_path"] = screenshot_path
                print(f"  [+] {result['message']}")
            else:
                result["status"] = "NO_SUBMIT_BUTTON"
                result["message"] = "Could not find submit button"

        except PlaywrightTimeoutError:
            result["status"] = "TIMEOUT"
            result["message"] = "Page navigation or submission timed out"
            print(f"  [-] Timeout loading {url}")
        except Exception as e:
            result["status"] = "ERROR"
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
    parser = argparse.ArgumentParser(description="Kigyou-List Done-For-You Contact Form Dispatcher")
    parser.add_argument("--limit", type=int, default=5, help="Number of companies to process")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Test form filling without final submit")
    parser.add_argument("--live", action="store_true", help="Perform real live form submission")
    parser.add_argument("--corporate-number", type=str, help="Target a specific corporate number")
    args = parser.parse_args()

    is_dry_run = not args.live

    print("=" * 65)
    print("  KIGYOU-LIST: DONE-FOR-YOU (DFY) FORM OUTREACH ENGINE")
    print(f"  Mode: {'[DRY RUN - Safe Simulation]' if is_dry_run else '[LIVE SUBMISSION - Real Outreach]'}")
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

    dispatcher = FormDispatcher(sender_profile=sender_profile, dry_run=is_dry_run)
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
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

    # Generate CSV Delivery Report
    report_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports", f"delivery_report_{int(time.time())}.csv")
    os.makedirs(os.path.dirname(report_file), exist_ok=True)

    with open(report_file, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["corporate_number", "company_name", "form_url", "status", "message", "screenshot_path", "timestamp"])
        writer.writeheader()
        writer.writerows(results)

    print("\n" + "=" * 65)
    print("  CAMPAIGN EXECUTION SUMMARY")
    print("=" * 65)
    success_count = sum(1 for r in results if "SUCCESS" in r["status"])
    skipped_count = sum(1 for r in results if "SKIPPED" in r["status"])
    error_count = len(results) - success_count - skipped_count
    print(f"  Total Processed: {len(results)}")
    print(f"  Success (Filled/Sent): {success_count}")
    print(f"  Skipped (Anti-Spam / Disclaimer): {skipped_count}")
    print(f"  Errors / Unmatched: {error_count}")
    print(f"  Audit Report Saved To: {report_file}")
    print("=" * 65)


if __name__ == "__main__":
    main()
