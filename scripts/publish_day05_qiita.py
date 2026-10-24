# -*- coding: utf-8 -*-
"""
Script xuất bản bài viết kỹ thuật / Case Study Ngày 5 lên Qiita (qiita.com/listkigyou)
Chủ đề: Case Study & Đột phá ROI: Đội ngũ 3 người cắt giảm 90% chi phí tiếp cận & Tăng 1.8 lần cuộc hẹn
"""
import os
import sys

sys.path.append(os.path.dirname(__file__))
from qiita_publisher import post_article

title = "【Python/SaaS】営業3名のチームが名簿代を90%削減し、商談数を1.8倍にしたインハウスデータ基盤と自動パイプラインの実装"

body_markdown = """# はじめに：高額な外部名簿依存からの脱却

スタートアップや中小企業のB2B新規開拓において、最大のボトルネックとなるのが**「営業リストの調達コスト」**と**「手作業によるリサーチ時間」**です。

従来型の企業信用調査会社や名簿ベンダーでは、年間契約100万円規模（月額7万〜10万円）の固定費が発生し、さらに「提供データの電話番号やURLが古く、週10時間以上をWeb検索に費やす」という本末転倒な状況が頻発していました。

本稿では、営業メンバーわずか3名の都内成長中SaaS企業が、**「公的オープンデータ基盤」と「軽量なPythonスクリプト」を組み合わせて営業データ調達を完全内製化（インハウスDX）**し、月額コストを90%以上削減しながら商談獲得数を1.8倍に跳ね上げた実践アーキテクチャを解説します。

---

## 1. 抱えていた技術的・運用的課題

```mermaid
graph TD
    A[外部データベンダー 年間84万円] -->|静的CSV| B[営業担当3名]
    B -->|手作業Google検索 週10h| C[代表番号・フォーム確認]
    C -->|無作為コールドコール| D[成約率1%未満・低ROI]
```

1. **年間一括契約のサイロ化**：商談ピーク時以外も高額な月額費用が口座から引き落とされる。
2. **データの陳腐化**：年1回更新の静的データでは、移転・解散した企業への無駄コールが多発。
3. **リサーチ工数の肥大化**：電話番号やWebフォームの有無を1社ずつ手作業で確認し、本来の「顧客提案」にかける時間が圧迫される。

---

## 2. 刷新後のインハウスデータパイプライン構成

同社が採用したのは、全国500万社を網羅するオープンデータ基盤「[Kigyou-list](https://kigyoulist.com/)」のAPI・差分エクスポートと、Pythonによるシグナル判定スクリプトの連携です。

```mermaid
graph LR
    Sub1[(国税庁/オープンデータ)] --> K[Kigyou-list DB 500万社]
    Sub2[(ハローワーク求人)] --> K
    K -->|インテントデータ抽出| P[Python判定パイプライン]
    P -->|AIフォーム安全性チェック| L[成約確度の高いターゲットリスト]
    L --> S[営業3名: 高付加価値提案]
```

### コスト対比
- **従来ツール**：初期費用10万円〜30万円 ＋ 月額70,000円（年間縛り）
- **新アーキテクチャ**：初期費用0円 ＋ 初月わずか ¥1,260（通常 ¥4,200/月）
- **削減効果**：年間約78万円の経費削減（**リスト調達費90%以上カット**）

---

## 3. 実装のコア技術：求人シグナルとフォーム安全性の自動判定

### ① ハローワーク求人シグナルによる購買意欲のスコアリング
企業が求人票を出しているタイミングは、「投資余力がある」「業務効率化を求めている」という最強のインテントデータ（購買シグナル）です。

```python
import requests

def fetch_intent_leads(api_key: str, industry_code: str, min_employees: int = 10):
    \"\"\"
    Kigyou-listの検索パラメータを活用し、求人シグナルがアクティブな企業を抽出
    \"\"\"
    endpoint = "https://kigyoulist.com/api/v1/companies/search"
    params = {
        "industry": industry_code,
        "employees_min": min_employees,
        "has_recruitment": "true",  # ハローワーク求人ありフラグ
        "limit": 50
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    
    response = requests.get(endpoint, params=params, headers=headers)
    if response.status_code == 200:
        return response.json().get("results", [])
    return []
```

### ② 問い合わせフォームの「営業お断り」自動検知（クレームゼロ化）
Webフォーム経由のアプローチにおいて最も避けるべき「営業お断り」表記を、PlaywrightとNLP正規表現で事前にスクリーニングします。

```python
import re
from playwright.sync_api import sync_playwright

OPT_OUT_PATTERNS = [
    r"営業.*?(目的|連絡).*?(お断り|固く|ご遠慮|禁止)",
    r"セールス.*?(お断り|禁止|ご遠慮)",
    r"売り込み.*?ご遠慮",
    r"特定電子メール.*?拒否"
]

def check_form_safety(url: str) -> bool:
    \"\"\"
    問い合わせフォームページを走査し、営業お断り表記があるか判定
    \"\"\"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto(url, timeout=15000, wait_until="domcontentloaded")
            text = page.locator("body").inner_text()
            
            for pat in OPT_OUT_PATTERNS:
                if re.search(pat, text):
                    print(f"[-] オプトアウト検知: {url}")
                    browser.close()
                    return False  # アプローチ禁止
            browser.close()
            return True  # 安全にアプローチ可能
        except Exception:
            browser.close()
            return False
```

---

## 4. 導入後の成果：商談数1.8倍（12件 ➔ 22件）

1. **リスト作成時間の短縮**：週10時間かかっていたリサーチが、絞り込み実行により「週10分」へ激減。
2. **商談獲得数の伸長**：購買シグナル（求人あり）に絞ったことで、受付突破率が1.6倍、月間商談獲得数が12件から22件（1.83倍）へ拡大。
3. **提案品質の向上**：浮いた時間と経費を、ターゲット企業ごとの競合リサーチと提案書カスタマイズに投下可能に。

---

## まとめ

テクノロジーとオープンデータの進化により、大企業が年間数百万円で独占していたデータインフラは、中小企業やスタートアップでも月額数千円で内製化できるようになりました。

営業リストに年間数百万円を払い続ける時代は終わりました。適正なデータ基盤と自動化を活用し、高効率な営業チームを構築していきましょう。

- **全国500万社データベース「Kigyou-list」公式**：[https://kigyoulist.com/](https://kigyoulist.com/)
- **主要ツールとの料金・機能比較**：[https://kigyoulist.com/ja/compare](https://kigyoulist.com/ja/compare)
- **詳細検索デモ（毎月50件CSVダウンロード永久無料）**：[https://kigyoulist.com/ja/search](https://kigyoulist.com/ja/search)
"""

tags = ["Python", "SaaS", "営業DX", "オープンデータ", "自動化"]

if __name__ == "__main__":
    print("Bắt đầu xuất bản bài viết Ngày 5 lên Qiita...")
    res = post_article(title=title, body_markdown=body_markdown, tags=tags, is_private=False)
    if res:
        print(f"[QIITA RESULT] {res.get('url')}")
    else:
        print("[-] Qiita publication failed.")
