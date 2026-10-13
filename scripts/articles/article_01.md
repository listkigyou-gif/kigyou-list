## 1. はじめに

B2Bの新規開拓やアライアンス提案において、企業の「問い合わせフォーム（Contact Form）」を通じたアプローチは重要なチャネルの1つです。しかし、企業のWebサイトごとにフォームのHTML構造や項目名、バリデーションルールが大きく異なるため、自動化やデータ整備において以下のような技術的課題が生じます。

- 入力欄のIDやname属性が命名規則化されていない（`field_1`, `textbox_3` など）
- お問い合わせ本文と件名（タイトル）の誤認
- 「営業お断り」文言（アンチスパム規定）の見落としによるクレーム・トラブル
- Cloudflare Turnstile等のBot対策検知による不要なリトライ負荷

本記事では、**Python、Playwright、BeautifulSoupを組み合わせ、企業フォームのDOM構造を自動解析・最適化するアーキテクチャ**について実践的なコードを交えて解説します。

---

## 2. システムアーキテクチャの概要

全体の判定パイプラインは以下の4ステップで構成されます。

1. **フォームページのロード & レンダリング (Playwright)**
2. **アンチスパム（営業お断り文言）の自然言語判定**
3. **入力フィールド（社名・氏名・メール・本文等）のセマンティック解析**
4. **CAPTCHA / Turnstileの事前検知と安全なハンドリング**

---

## 3. 実装：問い合わせフォーム構造の自動検知

### ① 入力項目のセマンティック解析

日本語のフォームで頻出する項目名パターンを正規表現で定義し、DOM要素の `name`, `id`, `placeholder`, `aria-label` および直前のラベルテキストからマッチングを行います。

```python
import re
from typing import Dict, Any
from bs4 import BeautifulSoup

FIELD_PATTERNS = {
    "company": [r"会社名", r"企業名", r"御社名", r"法人名", r"company", r"corp"],
    "name": [r"お名前", r"氏名", r"ご担当者", r"担当者名", r"name"],
    "furigana": [r"フリガナ", r"ふりがな", r"カナ", r"furigana", r"kana"],
    "email": [r"メールアドレス", r"メール", r"mail", r"e-mail"],
    "phone": [r"電話番号", r"電話", r"tel", r"phone"],
    "subject": [r"件名", r"タイトル", r"ご用件", r"subject", r"title"],
    "body": [r"お問い合わせ内容", r"ご相談内容", r"メッセージ", r"本文", r"message", r"body"],
    "agree": [r"同意", r"個人情報", r"プライバシー", r"利用規約", r"agree"]
}

def analyze_form_structure(html_content: str) -> Dict[str, str]:
    """
    HTML文字列からフォームの主要項目のセレクタ候補を抽出
    """
    soup = BeautifulSoup(html_content, "html.parser")
    detected_fields = {}
    
    # input, textarea を走査
    inputs = soup.find_all(["input", "textarea"])
    for el in inputs:
        tag_type = el.get("type", "text").lower()
        if tag_type in ["hidden", "submit", "button"]:
            continue
            
        attr_text = " ".join([
            el.get("name", ""),
            el.get("id", ""),
            el.get("placeholder", ""),
            el.get("aria-label", "")
        ]).lower()
        
        # 親要素や直前要素のテキストも補助的に取得
        parent_text = el.parent.get_text() if el.parent else ""
        combined_text = f"{attr_text} {parent_text}"
        
        for field_type, patterns in FIELD_PATTERNS.items():
            if field_type not in detected_fields:
                if any(re.search(pat, combined_text, re.IGNORECASE) for pat in patterns):
                    selector = f"#{el['id']}" if el.get("id") else f"[name='{el.get('name')}']"
                    detected_fields[field_type] = selector
                    break
                    
    return detected_fields
```

### ② 営業お断り（アンチスパム）免責事項の自動チェック

自動化において最も重要なのは、**「営業・セールスの一切を禁止します」**と明記している企業に対してアプローチを行わないことです。

```python
def check_anti_spam_disclaimer(html_text: str) -> bool:
    """
    ページ内に営業禁止文言が存在するかを判定
    """
    soup = BeautifulSoup(html_text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
        
    text = soup.get_text(separator=" ")
    
    # 営業関連キーワード
    has_sales_kw = any(k in text for k in ["営業", "セールス", "売り込み", "勧誘"])
    # 拒否関連キーワード
    has_reject_kw = any(k in text for k in ["お断り", "ご遠慮", "お控え", "禁止", "受け付けておりません"])
    
    if has_sales_kw and has_reject_kw:
        patterns = [
            r"営業[^\n。]{0,30}(お断り|ご遠慮|禁止|お控え|受け付け)",
            r"セールス[^\n。]{0,30}(お断り|ご遠慮|禁止)",
            r"売り込み[^\n。]{0,30}(お断り|ご遠慮|禁止)"
        ]
        for pat in patterns:
            if re.search(pat, text):
                return True
    return False
```

### ③ Cloudflare Turnstile / CAPTCHAの事前検知

送信実行前にBot検知スクリプト（Turnstile等）が存在するかを確認し、不要なリクエスト送信によるブロックを防止します。

```python
def check_turnstile_challenge(page) -> bool:
    """
    PlaywrightのPageオブジェクトからTurnstileのiframeまたはスクリプトを検出
    """
    turnstile_selectors = [
        "iframe[src*='challenges.cloudflare.com']",
        "div.cf-turnstile",
        "iframe[src*='recaptcha']"
    ]
    for selector in turnstile_selectors:
        if page.locator(selector).count() > 0:
            return True
    return False
```

---

## 4. 手動運用と自動最適化パイプラインの比較

自前でのスクレイピングや手作業によるリスト作成と、最適化された企業データベース基盤を活用した場合の効率比較です。

| 評価項目 | 手動での抽出・送信 | 単純なスクレイピング | 最適化パイプライン（[KigyouList](https://kigyoulist.com/) 連携） |
| :--- | :--- | :--- | :--- |
| **処理速度** | 1件 / 3〜5分 | 100件 / 10分 | 1,000件以上 / 分（並列非同期） |
| **法人番号突合** | 目視・手動 | なし（社名揺れ多発） | 国税庁DB完全一致（法人番号自動付与） |
| **フォーム判定率** | 100% | 40%〜50% | 85%〜92%（セマンティック解析） |
| **クレーム防止** | 属人的 | 未対応（リスク高） | アンチスパム自動判定により除外 |

> ※本検証で利用している全国規模の企業マスターデータおよび最新フォームURLデータセットには、国内500万社超の企業データを網羅した [KigyouList（企業リスト.com）](https://kigyoulist.com/) の検証データを利用しています。

---

## 5. まとめ

Playwrightとテキスト解析を組み合わせることで、問い合わせフォームの入力負荷を劇的に下げつつ、企業のポリシー（営業お断り等）を尊重したクリーンなアプローチが可能になります。

今後は、LLMを活用した「件名・本文のパーソナライズ生成」や、より高度なフォームバリデーション対応の仕組みについても解説していきます。
