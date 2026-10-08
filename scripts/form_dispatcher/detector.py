#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Form Detector & Safety Compliance Analyzer
==========================================
Analyzes Japanese corporate contact form pages:
1. Anti-spam / Disclaimer detection (営業お断り検知)
2. Field semantic mapping (Company, Name, Furigana, Email, Tel, Subject, Body, Privacy Checkbox)
3. Step verification (Confirmation page vs Direct submit)
"""

import re
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup

# Strict anti-sales warning keywords used by Japanese companies
SPAM_DISCLAIMER_KEYWORDS = [
    "営業目的", "セールス", "売り込み", "営業メール",
    "営業関係", "ご提案等", "お断り", "ご遠慮", 
    "お控え", "禁止", "固くお断り", "受け付けておりません"
]

# Common patterns for field matching in Japanese forms
FIELD_PATTERNS = {
    "company": [
        r"会社名", r"御社名", r"貴社名", r"法人名", r"企業名", 
        r"company", r"organization", r"corp"
    ],
    "furigana": [
        r"フリガナ", r"ふりがな", r"カナ", r"かな", r"furigana", r"kana"
    ],
    "name": [
        r"お名前", r"氏名", r"ご担当者", r"担当者名", r"氏", r"名",
        r"your-name", r"name", r"fullname"
    ],
    "email": [
        r"メールアドレス", r"メール", r"mail", r"email", r"e-mail", r"e_mail"
    ],
    "email_confirm": [
        r"確認用", r"再入力", r"確認", r"confirm", r"repeat"
    ],
    "phone": [
        r"電話番号", r"電話", r"tel", r"phone", r"連絡先"
    ],
    "postal_code": [
        r"郵便番号", r"〒", r"zip", r"postal"
    ],
    "address": [
        r"ご住所", r"住所", r"所在地", r"address"
    ],
    "subject": [
        r"件名", r"題名", r"タイトル", r"ご用件", r"subject", r"title"
    ],
    "body": [
        r"お問い合わせ内容", r"お問合せ内容", r"ご相談内容", r"メッセージ", 
        r"内容", r"本文", r"ご質問", r"message", r"body", r"inquiry", r"content"
    ],
    "agree": [
        r"同意", r"個人情報", r"プライバシー", r"規約", r"agree", r"privacy"
    ]
}


def check_anti_spam_disclaimer(html_text: str) -> Dict[str, Any]:
    """
    Scans the page text to see if there is an explicit disclaimer prohibiting sales pitches.
    Returns:
        {
            "has_disclaimer": bool,
            "matched_phrases": List[str],
            "risk_level": "HIGH" | "NONE"
        }
    """
    if not html_text:
        return {"has_disclaimer": False, "matched_phrases": [], "risk_level": "NONE"}
    
    # Strip HTML tags for clean text analysis
    soup = BeautifulSoup(html_text, "html.parser")
    # Remove script and style tags
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    
    clean_text = soup.get_text(separator=" ")
    
    # Look for compound phrases: (営業 | セールス | 売り込み) AND (お断り | ご遠慮 | 禁止)
    has_sales_kw = any(k in clean_text for k in ["営業", "セールス", "売り込み", "勧誘"])
    has_reject_kw = any(k in clean_text for k in ["お断り", "ご遠慮", "お控え", "禁止", "不可", "お受けできません"])
    
    matched = []
    if has_sales_kw and has_reject_kw:
        # Check proximity or explicit regex patterns
        patterns = [
            r"営業[^\n。]{0,30}(お断り|ご遠慮|禁止|お控え|受け付け)",
            r"セールス[^\n。]{0,30}(お断り|ご遠慮|禁止|お控え)",
            r"売り込み[^\n。]{0,30}(お断り|ご遠慮|禁止|お控え)",
            r"(お断り|ご遠慮)[^\n。]{0,20}営業",
        ]
        for p in patterns:
            m = re.findall(p, clean_text)
            if m:
                matched.append(p)
                
    is_risky = len(matched) > 0
    return {
        "has_disclaimer": is_risky,
        "matched_phrases": matched,
        "risk_level": "HIGH" if is_risky else "NONE"
    }


def analyze_form_structure(soup: BeautifulSoup, form_url: str) -> Dict[str, Any]:
    """
    Parses <form> tags on the page and identifies target input selectors.
    """
    forms = soup.find_all("form")
    if not forms:
        return {"found_form": False, "error": "No <form> tag found"}

    best_form = None
    best_score = -1

    for f in forms:
        # Score based on presence of textarea, email, name inputs
        inputs = f.find_all(["input", "textarea", "select"])
        score = len(inputs)
        if f.find("textarea"):
            score += 10
        if score > best_score:
            best_score = score
            best_form = f

    if not best_form or best_score < 2:
        return {"found_form": False, "error": "No interactive contact form detected"}

    mapped_fields = {
        "company": None,
        "furigana": None,
        "name": None,
        "email": None,
        "email_confirm": None,
        "phone": None,
        "subject": None,
        "body": None,
        "agree_checkbox": None,
        "submit_button": None
    }

    # Inspect all elements in form
    for el in best_form.find_all(["input", "textarea"]):
        el_type = (el.get("type") or "text").lower()
        if el_type in ["hidden", "submit", "image", "button", "reset"]:
            continue

        el_name = (el.get("name") or "").lower()
        el_id = (el.get("id") or "").lower()
        el_placeholder = (el.get("placeholder") or "").lower()
        
        # Look for associated <label> text or table <th>
        parent_text = ""
        parent = el.find_parent(["td", "tr", "div", "dl", "li", "p"])
        if parent:
            parent_text = parent.get_text()

        combined_desc = f"{el_name} {el_id} {el_placeholder} {parent_text}".lower()

        # Check Checkbox for Privacy Policy
        if el_type == "checkbox":
            if any(re.search(pat, combined_desc) for pat in FIELD_PATTERNS["agree"]):
                mapped_fields["agree_checkbox"] = el.get("name") or el.get("id")
            continue

        # Check Body (Textarea gets high priority)
        if el.name == "textarea":
            mapped_fields["body"] = el.get("name") or el.get("id") or "textarea"
            continue

        # Check Email Confirm vs Regular Email
        if any(re.search(pat, combined_desc) for pat in FIELD_PATTERNS["email"]):
            if any(re.search(pat, combined_desc) for pat in FIELD_PATTERNS["email_confirm"]):
                mapped_fields["email_confirm"] = el.get("name") or el.get("id")
            elif not mapped_fields["email"]:
                mapped_fields["email"] = el.get("name") or el.get("id")
            continue

        # Check other fields
        for field_key in ["company", "furigana", "name", "phone", "subject", "body"]:
            if not mapped_fields[field_key]:
                if any(re.search(pat, combined_desc) for pat in FIELD_PATTERNS[field_key]):
                    mapped_fields[field_key] = el.get("name") or el.get("id")
                    break

    # Find submit/confirm button
    for btn in best_form.find_all(["button", "input"]):
        b_type = (btn.get("type") or "").lower()
        b_text = (btn.get_text() or btn.get("value") or "").strip()
        if b_type in ["submit", "button"] or btn.name == "button":
            if any(k in b_text for k in ["確認", "次へ", "送信", "confirm", "submit", "send"]):
                mapped_fields["submit_button"] = btn.get("name") or btn.get("id") or b_text
                break

    return {
        "found_form": True,
        "action": best_form.get("action") or "",
        "method": (best_form.get("method") or "post").upper(),
        "mapped_fields": mapped_fields
    }


def check_captcha_or_bot_protection(html_text: str) -> Dict[str, Any]:
    """
    Scans HTML for CAPTCHA (reCAPTCHA, Turnstile, hCaptcha, image/math verification)
    or anti-bot WAF challenges.
    
    Approach 1: Auto-skip and refund credits rather than getting stuck or failing silently.
    """
    if not html_text:
        return {"has_protection": False, "type": None, "reason": ""}
        
    lower = html_text.lower()
    
    # 1. Google reCAPTCHA
    if "recaptcha" in lower or "g-recaptcha" in lower or "google.com/recaptcha" in lower:
        return {
            "has_protection": True,
            "type": "CAPTCHA_RECAPTCHA",
            "reason": "Google reCAPTCHA detected"
        }
        
    # 2. Cloudflare Turnstile / Bot Management
    if "cf-turnstile" in lower or "challenges.cloudflare.com" in lower:
        return {
            "has_protection": True,
            "type": "CAPTCHA_TURNSTILE",
            "reason": "Cloudflare Turnstile challenge detected"
        }
    if "just a moment..." in lower and "cloudflare" in lower:
        return {
            "has_protection": True,
            "type": "BLOCKED_WAF",
            "reason": "Cloudflare WAF / Bot challenge screen"
        }

    # 3. hCaptcha
    if "hcaptcha" in lower or "h-captcha" in lower:
        return {
            "has_protection": True,
            "type": "CAPTCHA_HCAPTCHA",
            "reason": "hCaptcha protection detected"
        }

    # 4. Japanese Image/Text Captcha Keywords
    jp_captcha_keywords = [
        "画像認証", "セキュリティコードを入力", "ひらがな認証", 
        "スパム防止のため", "文字認証", "キャプチャ"
    ]
    for kw in jp_captcha_keywords:
        if kw in html_text:
            return {
                "has_protection": True,
                "type": "CAPTCHA_IMAGE_TEXT",
                "reason": f"Japanese CAPTCHA keyword '{kw}' detected"
            }

    return {"has_protection": False, "type": None, "reason": ""}
