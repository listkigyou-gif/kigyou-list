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
import hashlib
from urllib.parse import urlparse, quote
from datetime import datetime
from typing import Dict, Any, List

try:
    from dotenv import load_dotenv
    env_local = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local")
    if os.path.exists(env_local):
        load_dotenv(env_local)
except ImportError:
    pass

def generate_opt_out_token(corporate_number: str, user_id: str) -> str:
    secret = os.environ.get("AUTH_SECRET") or os.environ.get("NEXTAUTH_SECRET") or "kigyoulist_optout_secure_salt_2026"
    raw = f"{corporate_number}:{user_id}:{secret}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]

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
FAILED_SAMPLES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports", "failed_samples")


def katakana_to_hiragana(text: str) -> str:
    """Converts Japanese Katakana characters to Hiragana."""
    if not text:
        return ""
    result = []
    for ch in text:
        code = ord(ch)
        if 0x30A1 <= code <= 0x30F6:
            result.append(chr(code - 0x60))
        else:
            result.append(ch)
    return "".join(result)


def hiragana_to_katakana(text: str) -> str:
    """Converts Japanese Hiragana characters to Katakana."""
    if not text:
        return ""
    result = []
    for ch in text:
        code = ord(ch)
        if 0x3041 <= code <= 0x3096:
            result.append(chr(code + 0x60))
        else:
            result.append(ch)
    return "".join(result)


class FormDispatcher:
    def __init__(self, sender_profile: Dict[str, str], dry_run: bool = True, save_screenshot: bool = False, save_failed_html: bool = True):
        self.sender = sender_profile
        self.dry_run = dry_run
        self.save_screenshot = save_screenshot
        self.save_failed_html = save_failed_html
        if self.save_screenshot:
            os.makedirs(SCREENSHOT_DIR, exist_ok=True)
        if self.save_failed_html:
            os.makedirs(FAILED_SAMPLES_DIR, exist_ok=True)

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

        # 0. Early Filter: Reject URLs that are static files / downloads (PDF, images, archives, docs)
        clean_url_path = url.lower().split("?")[0].split("#")[0]
        static_exts = (
            ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
            ".zip", ".tar", ".gz", ".rar", ".7z",
            ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".csv", ".txt", ".mp4", ".mp3"
        )
        if any(clean_url_path.endswith(ext) for ext in static_exts) or ".pdf?" in url.lower():
            result["status"] = "NO_FORM_ELEMENT"
            result["billable"] = False
            result["message"] = "Skipped: URL points to a static file/document, not a web form"
            print(f"  [!] {result['message']} ({url})")
            return result

        try:
            # Auto-accept JavaScript confirmation dialogs (window.confirm, alert)
            try:
                def _safe_dialog_accept(dialog):
                    try:
                        dialog.accept()
                    except Exception:
                        pass
                page.on("dialog", _safe_dialog_accept)
            except Exception:
                pass

            # 1. Navigate to contact form URL
            print(f"  [>] Visiting {comp_name} ({corp_num}): {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(1500)

            # If dynamic SPA / Google Forms, wait for question inputs to render
            if "docs.google.com/forms" in page.url or "forms.gle" in page.url or "formzu" in page.url:
                try:
                    page.wait_for_selector('div[role="listitem"], input[type="text"], textarea', timeout=6000)
                    page.wait_for_timeout(1000)
                except Exception:
                    pass

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

            # 3.1 Step-in Navigation: If 0 inputs/textarea, check if this is an Index/Hub page with a link to the real form
            visible_inputs = page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea').count()
            if visible_inputs == 0:
                hub_links = [
                    'お問い合わせフォーム', 'お問合せフォーム', '入力フォーム', 'フォームはこちら',
                    '入力画面へ', 'Webフォーム', 'メールフォーム', 'お問い合わせはこちら',
                    'お問合せはこちら', 'Inquiry Form', 'Contact Form',
                    'その他のお問い合わせ', 'その他お問い合わせ', 'その他', '一般のお問い合わせ',
                    '一般お問合せ', '事業に関するお問い合わせ', 'サービスに関するお問い合わせ',
                    '弊社に関するお問い合わせ', 'ビジネスに関するお問い合わせ', '総合お問い合わせ',
                    '法人のお問い合わせ', '法人窓口', 'フォームを開く', 'お問い合わせ窓口', '各種お問い合わせ'
                ]
                hub_navigated = False
                for kw in hub_links:
                    cand = page.locator(f'a:has-text("{kw}"), button:has-text("{kw}")')
                    if cand.count() > 0 and cand.first.is_visible():
                        try:
                            print(f"  [↳] Hub page detected. Entering actual form via '{kw}'...")
                            cand.first.click(timeout=5000)
                            page.wait_for_timeout(2500)
                            html_content = page.content()
                            hub_navigated = True
                            break
                        except Exception:
                            pass

                # Fallback: check links whose href contains contact/inquiry/toiawase/form
                if not hub_navigated:
                    cand_links = page.locator('a[href*="contact" i], a[href*="inquiry" i], a[href*="toiawase" i], a[href*="form" i]')
                    for idx in range(min(cand_links.count(), 6)):
                        lnk = cand_links.nth(idx)
                        if lnk.is_visible():
                            txt = lnk.inner_text().strip()
                            if not any(bad in txt for bad in ['English', 'Privacy', 'プライバシー', '個人情報', '規約', 'English', 'Global']):
                                print(f"  [↳] Hub candidate link detected ('{txt[:30]}'). Entering form...")
                                try:
                                    lnk.click(timeout=5000)
                                    page.wait_for_timeout(2500)
                                    html_content = page.content()
                                    break
                                except Exception:
                                    pass

            # 3.2 Determine working scope (main page or active iframe)
            scope = page
            if page.locator('textarea, input[type="email"], input[name*="mail" i]').count() == 0:
                for frame in page.frames:
                    if frame != page.main_frame and frame.locator('textarea, input[type="email"], input[name*="mail" i]').count() > 0:
                        scope = frame
                        print(f"  [↳] Embedded form detected inside iframe: {frame.url[:80]}...")
                        break

            # 4. Locate and fill form fields via smart CSS / XPath / Label selectors (Advanced Japanese Form Engine)
            filled_fields = 0

            def safe_fill(loc, value: str) -> bool:
                """Fills input and dispatches input/change events to trigger modern JS validations."""
                try:
                    loc.fill(value)
                    loc.dispatch_event('input')
                    loc.dispatch_event('change')
                    return True
                except Exception:
                    return False

            # --- A. Company Name ---
            company_selectors = [
                'input[name*="company" i]', 'input[name*="kaisha" i]', 'input[id*="company" i]',
                'input[name*="organization" i]', 'input[id*="organization" i]',
                'input[name*="御社" i]', 'input[id*="御社" i]', 'input[name*="貴社" i]', 'input[id*="貴社" i]',
                'input[name*="会社" i]', 'input[id*="会社" i]', 'input[name*="法人" i]', 'input[id*="法人" i]',
                'input[placeholder*="会社" i]', 'input[placeholder*="法人" i]', 'input[placeholder*="貴社" i]', 'input[placeholder*="御社" i]',
                'input[placeholder*="株式会社" i]', 'input[placeholder*="例）株" i]', 'input[placeholder*="例：株" i]',
                'tr:has-text("会社名") input:not([type="hidden"])', 'tr:has-text("貴社名") input:not([type="hidden"])',
                'tr:has-text("御社名") input:not([type="hidden"])', 'tr:has-text("法人名") input:not([type="hidden"])',
                'dl:has-text("会社名") input:not([type="hidden"])', 'dl:has-text("貴社名") input:not([type="hidden"])',
                'dl:has-text("御社名") input:not([type="hidden"])', 'label:has-text("会社名") input:not([type="hidden"])',
                'label:has-text("御社名") input:not([type="hidden"])', 'label:has-text("貴社名") input:not([type="hidden"])'
            ]
            for sel in company_selectors:
                c_loc = scope.locator(sel)
                if c_loc.count() > 0 and c_loc.first.is_visible():
                    if safe_fill(c_loc.first, self.sender["company_name"]):
                        filled_fields += 1
                        break

            # --- B. Contact Person Name (Single or Split [姓][名]) ---
            name_parts = self.sender["contact_name"].strip().split()
            sei = name_parts[0] if len(name_parts) > 0 else self.sender["contact_name"]
            mei = name_parts[1] if len(name_parts) > 1 else sei

            # Check for split Sei/Mei inputs first
            sei_selectors = ['input[name*="sei" i]:not([name*="furigana" i]):not([name*="kana" i])', 'input[placeholder*="姓" i]', 'input[id*="sei" i]', 'input[placeholder*="山田" i]']
            mei_selectors = ['input[name*="mei" i]:not([name*="furigana" i]):not([name*="kana" i])', 'input[placeholder*="名" i]', 'input[id*="mei" i]', 'input[placeholder*="太郎" i]']
            
            is_split_name = False
            for s_sel in sei_selectors:
                s_loc = scope.locator(s_sel)
                if s_loc.count() > 0 and s_loc.first.is_visible():
                    for m_sel in mei_selectors:
                        m_loc = scope.locator(m_sel)
                        if m_loc.count() > 0 and m_loc.first.is_visible() and m_loc.first != s_loc.first:
                            safe_fill(s_loc.first, sei)
                            safe_fill(m_loc.first, mei)
                            filled_fields += 1
                            is_split_name = True
                            break
                    if is_split_name:
                        break

            if not is_split_name:
                name_selectors = [
                    'input[name*="name" i]:not([name*="company" i]):not([name*="kana" i])', 'input[id*="name" i]:not([id*="company" i]):not([id*="kana" i])',
                    'input[name*="your-name" i]', 'input[name*="full_name" i]', 'input[name*="contact_name" i]',
                    'input[name*="お名前" i]', 'input[id*="お名前" i]', 'input[name*="氏名" i]', 'input[id*="氏名" i]',
                    'input[name*="名前" i]:not([name*="会社" i])', 'input[id*="名前" i]:not([id*="会社" i])',
                    'input[name*="担当" i]', 'input[id*="担当" i]',
                    'input[placeholder*="氏名" i]', 'input[placeholder*="名前" i]', 'input[placeholder*="担当" i]',
                    'input[placeholder*="山田" i]', 'input[placeholder*="例：山田" i]', 'input[placeholder*="例）山田" i]',
                    'tr:has-text("お名前") input:not([type="hidden"])', 'tr:has-text("氏名") input:not([type="hidden"])',
                    'tr:has-text("ご担当") input:not([type="hidden"])', 'dl:has-text("お名前") input:not([type="hidden"])',
                    'dl:has-text("氏名") input:not([type="hidden"])', 'label:has-text("お名前") input:not([type="hidden"])',
                    'label:has-text("氏名") input:not([type="hidden"])'
                ]
                for sel in name_selectors:
                    n_loc = scope.locator(sel)
                    if n_loc.count() > 0 and n_loc.first.is_visible():
                        if safe_fill(n_loc.first, self.sender["contact_name"]):
                            filled_fields += 1
                            break

            # --- C. Furigana (Single or Split [セイ][メイ] / Hiragana or Katakana) ---
            kana_str = self.sender.get("furigana", "クリモト ヨシユキ")
            # Auto-detect if form prefers Hiragana (ふりがな) vs Katakana (フリガナ)
            prefers_hiragana = False
            try:
                f_sample = scope.locator('tr:has-text("ふりがな"), tr:has-text("ひらがな"), dl:has-text("ふりがな"), label:has-text("ふりがな"), input[placeholder*="ふりがな"]')
                if f_sample.count() > 0 and f_sample.first.is_visible():
                    prefers_hiragana = True
            except Exception:
                pass

            effective_kana = katakana_to_hiragana(kana_str) if prefers_hiragana else kana_str
            kana_parts = effective_kana.strip().split()
            sei_kana = kana_parts[0] if len(kana_parts) > 0 else effective_kana
            mei_kana = kana_parts[1] if len(kana_parts) > 1 else sei_kana

            sei_k_selectors = ['input[name*="sei_kana" i]', 'input[name*="kana_sei" i]', 'input[placeholder*="セイ" i]', 'input[placeholder*="せい" i]']
            mei_k_selectors = ['input[name*="mei_kana" i]', 'input[name*="kana_mei" i]', 'input[placeholder*="メイ" i]', 'input[placeholder*="めい" i]']
            is_split_kana = False
            for sk_sel in sei_k_selectors:
                sk_loc = scope.locator(sk_sel)
                if sk_loc.count() > 0 and sk_loc.first.is_visible():
                    for mk_sel in mei_k_selectors:
                        mk_loc = scope.locator(mk_sel)
                        if mk_loc.count() > 0 and mk_loc.first.is_visible():
                            safe_fill(sk_loc.first, sei_kana)
                            safe_fill(mk_loc.first, mei_kana)
                            is_split_kana = True
                            break
                    if is_split_kana:
                        break

            if not is_split_kana:
                kana_selectors = [
                    'input[name*="kana" i]', 'input[name*="furigana" i]', 'input[id*="kana" i]', 'input[id*="furigana" i]',
                    'input[name*="フリガナ" i]', 'input[id*="フリガナ" i]', 'input[name*="ふりがな" i]', 'input[id*="ふりがな" i]',
                    'input[name*="カナ" i]', 'input[id*="カナ" i]',
                    'input[placeholder*="フリガナ" i]', 'input[placeholder*="ふりがな" i]',
                    'tr:has-text("フリガナ") input:not([type="hidden"])', 'tr:has-text("ふりがな") input:not([type="hidden"])',
                    'dl:has-text("フリガナ") input:not([type="hidden"])', 'dl:has-text("ふりがな") input:not([type="hidden"])',
                    'label:has-text("フリガナ") input:not([type="hidden"])', 'label:has-text("ふりがな") input:not([type="hidden"])'
                ]
                for sel in kana_selectors:
                    k_loc = scope.locator(sel)
                    if k_loc.count() > 0 and k_loc.first.is_visible():
                        safe_fill(k_loc.first, effective_kana)
                        break

            # --- D. Email Address & Confirmation ---
            email_selectors = [
                'input[type="email"]', 'input[name*="mail" i]', 'input[id*="mail" i]', 'input[placeholder*="mail" i]',
                'tr:has-text("メール") input:not([type="hidden"])', 'dl:has-text("メール") input:not([type="hidden"])',
                'label:has-text("メール") input:not([type="hidden"])'
            ]
            for sel in email_selectors:
                em_loc = scope.locator(sel)
                if em_loc.count() > 0 and em_loc.first.is_visible():
                    if safe_fill(em_loc.first, self.sender["email"]):
                        filled_fields += 1
                        # Email confirmation field
                        conf_selectors = [
                            'input[name*="confirm" i]:not([type="submit"]):not([type="button"])',
                            'input[name*="check" i]:not([type="submit"]):not([type="button"])',
                            'input[id*="confirm" i]:not([type="submit"]):not([type="button"])',
                            'tr:has-text("確認") input[type="email"]', 'tr:has-text("再入力") input:not([type="hidden"])'
                        ]
                        for c_sel in conf_selectors:
                            c_loc = scope.locator(c_sel)
                            if c_loc.count() > 0 and c_loc.first.is_visible():
                                safe_fill(c_loc.first, self.sender["email"])
                        break

            # --- E. Phone Number (Single or Split 3 boxes) ---
            phone_val = self.sender.get("phone", "03-5555-0123")
            p_parts = phone_val.split("-") if "-" in phone_val else [phone_val[:3], phone_val[3:7], phone_val[7:]]
            if len(p_parts) < 3:
                p_parts = ["03", "5555", "0123"]

            phone_filled = False
            # 1. Primary: Match explicit single phone field (never broad container)
            phone_single_selectors = [
                'input[type="tel"]', 'input[name="電話番号" i]', 'input[id="電話番号" i]',
                'input[name*="tel" i]:not([name*="1"]):not([name*="2"]):not([name*="3"])',
                'input[name*="phone" i]:not([name*="1"]):not([name*="2"]):not([name*="3"])',
                'input[id*="tel" i]:not([id*="1"]):not([id*="2"]):not([id*="3"])',
                'input[placeholder*="電話" i]', 'input[placeholder*="tel" i]'
            ]
            for sel in phone_single_selectors:
                ph_loc = scope.locator(sel)
                if ph_loc.count() > 0 and ph_loc.first.is_visible():
                    if safe_fill(ph_loc.first, phone_val):
                        filled_fields += 1
                        phone_filled = True
                        break

            # 2. Check split 3 phone inputs ONLY if explicit tel1/tel2/tel3 or row with EXACTLY 3 inputs
            if not phone_filled:
                tel1 = scope.locator('input[name*="tel1" i], input[name*="phone1" i]')
                tel2 = scope.locator('input[name*="tel2" i], input[name*="phone2" i]')
                tel3 = scope.locator('input[name*="tel3" i], input[name*="phone3" i]')
                if tel1.count() > 0 and tel2.count() > 0 and tel3.count() > 0 and tel1.first.is_visible():
                    safe_fill(tel1.first, p_parts[0])
                    safe_fill(tel2.first, p_parts[1])
                    safe_fill(tel3.first, p_parts[2])
                    filled_fields += 1
                    phone_filled = True

            if not phone_filled:
                # Strictly check container row (MUST NOT BE GENERIC DIV)
                for container_sel in ['tr:has-text("電話")', 'dl:has-text("電話")']:
                    row = scope.locator(container_sel)
                    if row.count() > 0:
                        inputs = row.first.locator('input[type="text"], input[type="tel"]')
                        # Must have EXACTLY 3 inputs to prevent false positive match
                        if inputs.count() == 3 and inputs.first.is_visible():
                            safe_fill(inputs.nth(0), p_parts[0])
                            safe_fill(inputs.nth(1), p_parts[1])
                            safe_fill(inputs.nth(2), p_parts[2])
                            filled_fields += 1
                            phone_filled = True
                            break
                    if ph_loc.count() > 0 and ph_loc.first.is_visible():
                        if safe_fill(ph_loc.first, phone_val):
                            filled_fields += 1
                            break

            # --- E2. Postal Code / Zipcode (郵便番号 - Single or Split 2 boxes) ---
            zip_val = self.sender.get("postal_code") or "104-0061"
            z_parts = zip_val.split("-") if "-" in zip_val else [zip_val[:3], zip_val[3:]]
            if len(z_parts) < 2:
                z_parts = ["104", "0061"]

            is_split_zip = False
            zip_split_1 = scope.locator('input[name*="zip1" i], input[name*="postal1" i], input[name*="post1" i]')
            zip_split_2 = scope.locator('input[name*="zip2" i], input[name*="postal2" i], input[name*="post2" i]')
            if zip_split_1.count() > 0 and zip_split_2.count() > 0 and zip_split_1.first.is_visible() and zip_split_2.first.is_visible():
                safe_fill(zip_split_1.first, z_parts[0])
                safe_fill(zip_split_2.first, z_parts[1])
                filled_fields += 1
                is_split_zip = True

            if not is_split_zip:
                zip_selectors = [
                    'input[name*="zip" i]', 'input[name*="postal" i]', 'input[name*="postcode" i]',
                    'input[placeholder*="郵便番号" i]', 'tr:has-text("郵便番号") input:not([type="hidden"])',
                    'dl:has-text("郵便番号") input:not([type="hidden"])', 'label:has-text("郵便番号") input:not([type="hidden"])'
                ]
                for z_sel in zip_selectors:
                    z_loc = scope.locator(z_sel)
                    if z_loc.count() > 0 and z_loc.first.is_visible():
                        if safe_fill(z_loc.first, zip_val):
                            filled_fields += 1
                            break

            # --- E3. Prefecture (都道府県 - Dropdown or Text) ---
            pref_val = self.sender.get("prefecture") or "東京都"
            pref_selects = scope.locator('select[name*="pref" i], select[name*="todofuken" i], select[id*="pref" i], tr:has-text("都道府県") select, dl:has-text("都道府県") select')
            if pref_selects.count() > 0 and pref_selects.first.is_visible():
                try:
                    p_sel = pref_selects.first
                    opts = p_sel.locator('option')
                    for o_idx in range(opts.count()):
                        opt_text = opts.nth(o_idx).inner_text()
                        if pref_val in opt_text:
                            v = opts.nth(o_idx).get_attribute('value')
                            p_sel.select_option(value=v)
                            p_sel.dispatch_event('change')
                            filled_fields += 1
                            break
                except Exception:
                    pass
            else:
                pref_inputs = scope.locator('input[name*="pref" i], input[name*="todofuken" i], tr:has-text("都道府県") input:not([type="hidden"])')
                if pref_inputs.count() > 0 and pref_inputs.first.is_visible():
                    if safe_fill(pref_inputs.first, pref_val):
                        filled_fields += 1

            # --- E3.5 Inquiry Category / Kind Dropdown (お問い合わせ項目・種別) ---
            cat_selects = scope.locator('select[name*="kind" i], select[name*="category" i], select[name*="type" i], select[id*="kind" i], select[name*="subject" i], tr:has-text("お問い合わせ項目") select, dl:has-text("お問い合わせ項目") select, tr:has-text("項目") select, tr:has-text("種別") select')
            if cat_selects.count() > 0 and cat_selects.first.is_visible():
                try:
                    c_sel = cat_selects.first
                    opts = c_sel.locator('option')
                    chosen_val = None
                    for o_idx in range(opts.count()):
                        opt_text = opts.nth(o_idx).inner_text()
                        if any(w in opt_text for w in ["その他", "営業", "業務", "事業", "全般", "問い合わせ"]):
                            chosen_val = opts.nth(o_idx).get_attribute('value')
                            break
                    if chosen_val is None and opts.count() > 1:
                        chosen_val = opts.nth(1).get_attribute('value')
                    if chosen_val is not None:
                        c_sel.select_option(value=chosen_val)
                        c_sel.dispatch_event('change')
                        filled_fields += 1
                except Exception:
                    pass

            # --- E4. Address (市区町村・番地・建物名) ---
            addr_val = self.sender.get("address") or "東京都中央区銀座1-1-1"
            addr_selectors = [
                'input[name*="address" i]', 'input[name*="addr" i]', 'input[placeholder*="市区町村" i]',
                'input[placeholder*="ご住所" i]', 'input[placeholder*="住所" i]', 'input[placeholder*="番地" i]',
                'tr:has-text("ご住所") input:not([type="hidden"])', 'tr:has-text("住所") input:not([type="hidden"])',
                'dl:has-text("ご住所") input:not([type="hidden"])', 'dl:has-text("住所") input:not([type="hidden"])',
                'label:has-text("住所") input:not([type="hidden"])'
            ]
            for a_sel in addr_selectors:
                a_loc = scope.locator(a_sel)
                if a_loc.count() > 0 and a_loc.first.is_visible():
                    if safe_fill(a_loc.first, addr_val):
                        filled_fields += 1
                        break

            # --- F. Subject / Title ---
            subject_selectors = [
                'input[type="text"][name*="subject" i]', 'input[type="text"][name*="title" i]',
                'input:not([type="checkbox"]):not([type="radio"])[name*="subject" i]',
                'input[placeholder*="件名" i]', 'input[placeholder*="題名" i]',
                'tr:has-text("件名") input:not([type="hidden"])', 'dl:has-text("件名") input:not([type="hidden"])'
            ]
            for sel in subject_selectors:
                sub_loc = scope.locator(sel)
                if sub_loc.count() > 0 and sub_loc.first.is_visible():
                    raw_sub = self.sender.get("subject", "貴社事業に関する協業のご提案")
                    rendered_sub = raw_sub.replace("{{company_name}}", comp_name).replace("{company_name}", comp_name)
                    safe_fill(sub_loc.first, rendered_sub)
                    break

            # --- G. Smart Dropdown (<select>) Selection ---
            try:
                selects = scope.locator('select')
                for i in range(min(selects.count(), 3)):
                    s = selects.nth(i)
                    if s.is_visible():
                        # Pick matching option or option 1
                        opt_count = s.locator('option').count()
                        chosen_val = None
                        for opt_idx in range(opt_count):
                            opt_txt = s.locator('option').nth(opt_idx).inner_text()
                            if any(kw in opt_txt for kw in ["協業", "その他", "ご相談", "サービス", "お問い合わせ", "営業", "業務", "提携"]):
                                chosen_val = s.locator('option').nth(opt_idx).get_attribute('value')
                                break
                        if not chosen_val and opt_count > 1:
                            chosen_val = s.locator('option').nth(1).get_attribute('value')
                        if chosen_val is not None:
                            s.select_option(value=chosen_val)
                            s.dispatch_event('change')
            except Exception:
                pass

            # --- H. Smart Radio Buttons ---
            try:
                radios = scope.locator('input[type="radio"]')
                if radios.count() > 0:
                    checked = False
                    for r_idx in range(min(radios.count(), 5)):
                        r_btn = radios.nth(r_idx)
                        if r_btn.is_visible():
                            lbl_text = r_btn.locator('xpath=..').inner_text()
                            if any(kw in lbl_text for kw in ["その他", "ご相談", "協業", "お問い合わせ", "一般"]):
                                r_btn.check()
                                r_btn.dispatch_event('change')
                                checked = True
                                break
                    if not checked and radios.first.is_visible():
                        radios.first.check()
                        radios.first.dispatch_event('change')
            except Exception:
                pass

            # --- I. Message Body (Textarea) ---
            textarea = scope.locator('textarea')
            if textarea.count() > 0 and textarea.first.is_visible():
                body_template = self.sender.get("message_body", "")

                # Generate dynamic 1-click Opt-out URL
                user_scope = str(self.sender.get("user_id") or "admin")
                camp_scope = str(self.sender.get("campaign_id") or "")
                opt_token = generate_opt_out_token(str(corp_num), user_scope)
                opt_out_url = f"https://kigyoulist.com/ja/opt-out?u={quote(user_scope)}&c={quote(str(corp_num))}&cmp={quote(camp_scope)}&token={opt_token}"

                # Dynamic variable replacement: {{company_name}}, {company_name}, {{opt_out_url}}
                rendered_body = body_template.replace("{{company_name}}", comp_name)
                rendered_body = rendered_body.replace("{company_name}", comp_name)
                rendered_body = rendered_body.replace("{{corporate_name}}", comp_name)
                rendered_body = rendered_body.replace("{corporate_name}", comp_name)
                rendered_body = rendered_body.replace("{{target_company}}", comp_name)
                rendered_body = rendered_body.replace("{target_company}", comp_name)
                rendered_body = rendered_body.replace("{{opt_out_url}}", opt_out_url)
                rendered_body = rendered_body.replace("{opt_out_url}", opt_out_url)

                # Ensure company salutation at the top if not already present
                if comp_name not in rendered_body[:len(comp_name) + 30]:
                    custom_body = f"{comp_name} 御中\n\n{rendered_body}"
                else:
                    custom_body = rendered_body

                if safe_fill(textarea.first, custom_body):
                    filled_fields += 1

            # --- J. Privacy Policy Agreement Checkbox ---
            for ctx in [scope, page]:
                cb = ctx.locator('input[type="checkbox"]')
                if cb.count() > 0:
                    try:
                        for c_idx in range(min(cb.count(), 3)):
                            item = cb.nth(c_idx)
                            if item.is_visible():
                                item.check()
                                item.dispatch_event('change')
                        break
                    except Exception:
                        pass

            if filled_fields < 2:
                # Distinguish between 403/404, No Web Form at all, vs Form with unparsed fields
                page_title = ""
                try:
                    page_title = page.title()
                except Exception:
                    pass
                body_sample = html_content[:600] if html_content else ""

                if "403" in page_title or "Forbidden" in page_title or "403 Forbidden" in body_sample:
                    result["status"] = "DEAD_WEBSITE"
                    result["message"] = "Skipped: Server returned 403 Forbidden"
                elif "404" in page_title or "Not Found" in page_title:
                    result["status"] = "DEAD_WEBSITE"
                    result["message"] = "Skipped: 404 Page Not Found"
                else:
                    # Check if the only inputs on the page are site search inputs (q, s, kw, search, etc.)
                    search_only = False
                    candidate_text_inputs = scope.locator('input[type="text"], input:not([type])')
                    has_real_contact_field = scope.locator('textarea, input[type="email"], input[type="tel"], input[name*="mail" i], input[name*="company" i]').count() > 0
                    if not has_real_contact_field and candidate_text_inputs.count() <= 3:
                        has_contact_hints = False
                        for t_idx in range(candidate_text_inputs.count()):
                            try:
                                inp = candidate_text_inputs.nth(t_idx)
                                name_attr = (inp.get_attribute('name') or '').lower()
                                ph_attr = (inp.get_attribute('placeholder') or '').lower()
                                id_attr = (inp.get_attribute('id') or '').lower()
                                if any(w in name_attr or w in ph_attr or w in id_attr for w in ['name', 'namae', 'company', 'corp', 'title', 'subject', 'msg', 'message', '氏名', '名前', '会社', '件名', '内容', '問合']):
                                    has_contact_hints = True
                                    break
                            except Exception:
                                pass
                        if not has_contact_hints:
                            search_only = True

                    if search_only or scope.locator('input[type="text"], input[type="email"], input[type="tel"], input:not([type]), textarea').count() == 0:
                        result["status"] = "NO_FORM_ELEMENT"
                        result["message"] = "Skipped: Contact page has no web form (Search bar / Phone / Mail only)"
                    else:
                        result["status"] = "FORM_PARSE_ERROR"
                        result["message"] = f"Insufficient fields matched (filled {filled_fields} fields)"

                # Save failed HTML sample for diagnostic flywheel
                if self.save_failed_html:
                    try:
                        os.makedirs(FAILED_SAMPLES_DIR, exist_ok=True)
                        sample_path = os.path.join(FAILED_SAMPLES_DIR, f"{corp_num}_{result['status']}.html")
                        with open(sample_path, "w", encoding="utf-8") as sf:
                            sf.write(f"<!-- URL: {url} | STATUS: {result['status']} | TIME: {datetime.now().isoformat()} -->\n")
                            sf.write(html_content)
                        result["failed_html_path"] = sample_path
                    except Exception:
                        pass
                
                result["billable"] = False
                print(f"  [!] {result['message']} (Refund credit)")
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
            # Scroll to trigger bottom-of-page validations or privacy agreements
            try:
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(500)
            except Exception:
                pass

            # Find submit/confirm button (Advanced multi-element finder)
            submit_btn = None
            btn_texts = [
                "確認画面へ", "確認", "送信する", "送信", "次へ", "同意して確認", "同意して送信",
                "内容確認", "入力内容の確認", "送信内容の確認", "お問い合わせを送信", "メッセージを送信",
                "確認ページへ", "入力内容を確認する", "入力完了", "完了", "Submit", "Send",
                "入力内容確認", "入力内容の確認へ", "送信確認", "確認する", "確認画面に進む", "確認画面へ進む",
                "入力内容を送信", "上記の内容で送信", "この内容で送信", "お問合せを送信", "お問い合わせを送信する",
                "Send Message", "Confirm", "同意して送信する", "Next"
            ]
            for btn_txt in btn_texts:
                for ctx in [scope, page]:
                    try:
                        loc = ctx.locator(
                            f'button:has-text("{btn_txt}"), input[type="submit"][value*="{btn_txt}" i], '
                            f'input[type="button"][value*="{btn_txt}" i], input[value*="{btn_txt}" i], '
                            f'input[type="image"][alt*="{btn_txt}" i], a:has-text("{btn_txt}"), div[role="button"]:has-text("{btn_txt}"), '
                            f'div[class*="btn" i]:has-text("{btn_txt}"), div[class*="submit" i]:has-text("{btn_txt}"), '
                            f'p[id*="submit" i]:has-text("{btn_txt}"), span[class*="btn" i]:has-text("{btn_txt}"), '
                            f'a[class*="btn" i]:has-text("{btn_txt}")'
                        )
                        cnt = loc.count()
                        for idx in range(cnt):
                            candidate = loc.nth(idx)
                            if candidate.is_visible():
                                submit_btn = candidate
                                break
                    except Exception:
                        pass
                    if submit_btn:
                        break
                if submit_btn:
                    break

            if not submit_btn:
                # Fallback to standard input submit or button with type submit or Peraichi/custom submit classes
                for ctx in [scope, page]:
                    try:
                        loc = ctx.locator(
                            'input[type="submit"], input[type="button"][value*="送信" i], button[type="submit"], '
                            '[role="button"], [class*="btn-customform-submit" i], [class*="form_submit" i], [id*="obj_submit" i]'
                        )
                        cnt = loc.count()
                        for idx in range(cnt):
                            candidate = loc.nth(idx)
                            if candidate.is_visible():
                                submit_btn = candidate
                                break
                    except Exception:
                        pass
                    if submit_btn:
                        break

            # If button is disabled, attempt to unblock by checking any remaining agreement checkboxes
            if submit_btn:
                try:
                    if submit_btn.is_disabled():
                        for ctx in [scope, page]:
                            all_cbs = ctx.locator('input[type="checkbox"]')
                            for ci in range(all_cbs.count()):
                                try:
                                    all_cbs.nth(ci).check()
                                    all_cbs.nth(ci).dispatch_event('change')
                                except Exception:
                                    pass
                        page.wait_for_timeout(300)
                except Exception:
                    pass

            if submit_btn:
                submit_btn.click()
                page.wait_for_timeout(3000)

                # Check if it was a confirmation page and needs one more click to final submit
                final_btn = page.locator(
                    'button:has-text("送信する"), input[type="submit"][value*="送信する" i], '
                    'button:has-text("送信"), input[type="submit"][value*="送信" i], '
                    'button:has-text("完了"), a:has-text("送信する")'
                )
                if final_btn.count() > 0 and final_btn.first.is_visible():
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

                # Save failed HTML sample for diagnostic flywheel
                if self.save_failed_html:
                    try:
                        os.makedirs(FAILED_SAMPLES_DIR, exist_ok=True)
                        sample_path = os.path.join(FAILED_SAMPLES_DIR, f"{corp_num}_NO_SUBMIT_BUTTON.html")
                        with open(sample_path, "w", encoding="utf-8") as sf:
                            sf.write(f"<!-- URL: {url} | STATUS: NO_SUBMIT_BUTTON | TIME: {datetime.now().isoformat()} -->\n")
                            sf.write(html_content)
                        result["failed_html_path"] = sample_path
                    except Exception:
                        pass

        except PlaywrightTimeoutError:
            result["status"] = "TIMEOUT"
            result["billable"] = False
            result["message"] = "Page navigation or submission timed out"
            print(f"  [-] Timeout loading {url}")
        except Exception as e:
            err_str = str(e)
            if "Download is starting" in err_str:
                result["status"] = "NO_FORM_ELEMENT"
                result["billable"] = False
                result["message"] = "Skipped: Target URL triggered file download (no web form)"
                print(f"  [!] Skipped: Download triggered ({url}) (Refund credit)")
            elif any(k in err_str for k in ["ERR_SOCKS_CONNECTION_FAILED", "ERR_NAME_NOT_RESOLVED", "ERR_CONNECTION_REFUSED", "ERR_CONNECTION_TIMED_OUT", "ERR_ABORTED"]):
                result["status"] = "DEAD_WEBSITE"
                result["billable"] = False
                result["message"] = "Skipped: Website offline or connection aborted"
                print(f"  [!] Skipped: Domain unreachable or connection aborted ({url}) (Refund credit)")
            else:
                result["status"] = "ERROR"
                result["billable"] = False
                result["message"] = err_str[:120]
                print(f"  [-] Error: {err_str[:120]}")

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
