## 1. はじめに：現代のB2Bクローリングを取り巻く技術的障壁

B2BセールスDXや企業データベースの運用において、企業の最新情報（代表番号、移転先住所、採用状況、問い合わせフォームURL等）を数万〜数十万社規模で定期巡回・更新するクローラーの構築は必須要件です。

しかし近年、企業のWebサイトやフォームページにおいて**「Cloudflare Turnstile」「Google reCAPTCHA v3」「WAFによるBot Challenge」**の導入が急速に進んでいます。これにより、従来の単純なHTTPクライアントやスクレイピング手法では、以下のような重大な障害が発生します：

1. **JavaScriptレンダリング必須化**: 静的HTMLクローラーではフォーム要素や動的DOMが一切取得できない
2. **Turnstile/WAFによる即時ブロック**: ヘッドレスブラウザ特有のシグネチャ（`navigator.webdriver` 等）が検知され、403 ForbiddenやChallenge画面に誘導される
3. **リソース枯渇とメモリリーク**: サイトごとにブラウザを新規起動すると、数千リクエストでサーバーのRAMが枯渇しプロセスがクラッシュする
4. **無駄なリトライによるIPレピュテーション低下**: 解決不可能なCAPTCHAに対して無理なリトライを繰り返し、プロキシIPが広範囲にBANされる

本記事では、実際に**全国500万社の法人データ基盤（[Kigyou-list](https://kigyoulist.com)）で実運用している、HTTPXとPlaywrightを組み合わせた「デュアルエンジン・クローラーアーキテクチャ」**について、Turnstile検知・ハンドリングとブラウザプールの最適化設計をコードを交えて解説します。

---

## 2. デュアルエンジン・クローラーの全体アーキテクチャ

すべてのアクセスをヘッドレスブラウザで処理すると、1リクエストあたり数秒のレイテンシと膨大なCPU/メモリを消費します。
そこで、**「超軽量な非同期HTTP層（HTTPX）」と「動的ブラウザ層（Playwright）」を分離し、必要な場合のみ動的エンジンにエスカレーションする2段階パイプライン**を設計します。

![B2Bクローラー・Turnstile検知パイプラインのアーキテクチャ図](https://raw.githubusercontent.com/listkigyou-gif/kigyou-list/main/frontend/public/images/qiita_turnstile_arch.jpg)

### パイプラインの設計原則

1. **Tier 1 (Fast HTTPX Layer)**:
   まずはコネクションプールを効かせた非同期HTTPXで高速にHTMLを取得。静的フォームやテキスト情報が取得できれば、ブラウザを起動せず数ミリ秒で完了（全体の約85〜90%）。
2. **Turnstile / WAF 事前判定**:
   取得したHTMLまたはレスポンスヘッダー（`cf-mitigated`, `challenges.cloudflare.com`）から、保護状態をミリ秒単位で判定。
3. **Tier 2 (Playwright Stealth Pool)**:
   JavaScriptの動的実行やフォーム遷移が必要なページのみ、あらかじめウォームアップされたブラウザコンテキストプールに委譲。
4. **コンプライアンス & 安全スキップ**:
   解決できないCAPTCHAや「営業お断り」文言を検知した場合は、無理に突破せず安全にスキップして監査ログに記録。

---

## 3. 実装：Turnstile & Bot保護の高速判定エンジン

相手先サイトに負荷をかけず、自社ワーカーのスタックを防ぐため、HTMLパース段階でボット対策の種別を特定する検知ロジックを実装します。

```python
import re
from typing import Dict, Any, Optional

def analyze_bot_protection(html_text: str, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    HTMLおよびレスポンスヘッダーからBot保護・CAPTCHAを判定
    """
    if not html_text:
        return {"has_protection": False, "type": None, "reason": ""}
        
    lower = html_text.lower()
    headers_lower = {k.lower(): v.lower() for k, v in (headers or {}).items()}
    
    # 1. Cloudflare WAF チャレンジ画面（Just a moment...）
    if "just a moment..." in lower and "cloudflare" in lower:
        return {
            "has_protection": True,
            "type": "CLOUDFLARE_WAF_INTERSTITIAL",
            "action": "SKIP_OR_ESCALATE",
            "reason": "Cloudflare WAF Interstitial Screen"
        }
        
    # 2. Cloudflare Turnstile ウィジェット
    if "challenges.cloudflare.com" in lower or "cf-turnstile" in lower:
        return {
            "has_protection": True,
            "type": "CAPTCHA_TURNSTILE",
            "action": "EVALUATE_DYNAMIC",
            "reason": "Cloudflare Turnstile Widget Detected"
        }
        
    # 3. Google reCAPTCHA
    if "google.com/recaptcha" in lower or "g-recaptcha" in lower:
        return {
            "has_protection": True,
            "type": "CAPTCHA_RECAPTCHA",
            "action": "SKIP_SAFELY",
            "reason": "Google reCAPTCHA Detected"
        }

    # 4. レスポンスヘッダーによる検知（Cloudflare Mitigated）
    if headers_lower.get("cf-mitigated") == "challenge":
        return {
            "has_protection": True,
            "type": "CF_HEADER_CHALLENGE",
            "action": "ESCALATE",
            "reason": "Cloudflare Mitigated Challenge Header"
        }

    return {"has_protection": False, "type": None, "action": "PROCEED", "reason": "No Protection"}
```

---

## 4. 実装：Playwright ブラウザコンテキストプールとコネクション最適化

Tier 2でPlaywrightを動かす際、**「ブラウザプロセス（Browser）は常駐させ、ページコンテキスト（BrowserContext）をプール＆軽量リサイクルする」**ことで、起動オーバーヘッドを約80%削減し、メモリリークを根絶します。

### ① ステルス設定と不要アセット遮断（Request Interception）

クローリングやフォーム判定に不要な「画像」「フォント」「動画」「アナリティクス広告」をネットワーク層で即座に遮断（Abort）することで、ページ読み込み速度を3〜5倍に高速化します。

```python
import asyncio
from playwright.async_api import async_playwright, Browser, BrowserContext

class ResilientBrowserPool:
    def __init__(self, max_concurrent_contexts: int = 4):
        self.max_contexts = max_concurrent_contexts
        self.semaphore = asyncio.Semaphore(max_concurrent_contexts)
        self.playwright = None
        self.browser: Optional[Browser] = None

    async def initialize(self):
        self.playwright = await async_playwright().start()
        # ヘッドレスモード起動、フィンガープリントを自然な状態に偽装
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote"
            ]
        )

    async def fetch_page_with_stealth(self, url: str) -> Optional[str]:
        async with self.semaphore:
            # コンテキストごとに独立したCookie/ストレージを確保
            context: BrowserContext = await self.browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                locale="ja-JP",
                timezone_id="Asia/Tokyo"
            )
            
            # navigator.webdriver を隠蔽する init script
            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)

            page = await context.new_page()

            # 不要アセットの通信遮断（高速化とトラフィック節約）
            async def block_unnecessary_resources(route):
                if route.request.resource_type in ["image", "media", "font", "stylesheet"]:
                    await route.abort()
                else:
                    await route.continue_()

            await page.route("**/*", block_unnecessary_resources)

            content = None
            try:
                # domcontentloaded を待機（networkidleは過剰に待たされるため避ける）
                await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                
                # Turnstileなどのiframe生成を待機する短い待機
                await asyncio.sleep(1.0)
                content = await page.content()
            except Exception as e:
                print(f"[BrowserPool] Error fetching {url}: {e}")
            finally:
                # ページとコンテキストを速やかに破棄してメモリ回収
                await page.close()
                await context.close()

            return content

    async def shutdown(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
```

---

## 5. 法人コンプライアンスと「営業お断り」自動検知の連携

Turnstileを回避できたとしても、企業がWebサイト上に明記しているアンチスパム規定（「営業目的の連絡はお断り」「セールス禁止」）を無視してアプローチを自動化すると、企業の信頼を損ないクレームに直結します。

クローラーパイプラインには、DOM解析と同時に自然言語によるコンプライアンスチェックを必ず直列で結合させます。

```python
DISCLAIMER_KEYWORDS = [
    "営業目的", "セールス", "売り込み", "営業メール",
    "ご提案等", "お断り", "ご遠慮", "お控え", "固くお断り", "受け付けておりません"
]

def check_anti_sales_disclaimer(html_text: str) -> bool:
    """
    フォーム文面中の営業拒絶・アンチスパム規定を判定
    """
    text = re.sub(r'\s+', ' ', html_text)
    for kw in DISCLAIMER_KEYWORDS:
        if kw in text:
            # 前後の文脈を判定
            match = re.search(rf'([^。、\n]{{0,30}}{kw}[^。、\n]{{0,30}})', text)
            if match:
                # 「営業目的の送信はご遠慮ください」等のフレーズに合致
                return True
    return False
```

コンプライアンス違反が検知されたドメインには、データベース上で `opt_out = TRUE` や `compliance_restricted = TRUE` フラグを即座に付与し、以降の巡回対象から恒久的に除外します。

---

## 6. まとめと実運用での知見

500万社規模の日本企業Webデータを長期的に運用する中で得られた、実戦的なアーキテクチャの要点です：

1. **HTTPX と Playwright の役割分担**:
   全ページをブラウザで開くのはコストの無駄。静的GET（HTTPX）で全体の9割を瞬時に捌き、動的JS・WAF判定が必要な残りの1割だけをPlaywrightに委譲する。
2. **コンテキスト単位のリサイクルとアセット遮断**:
   `route.abort()` による画像・フォントの遮断でスループットは3倍以上向上。Browserプロセスは再利用し、Contextを毎回破棄することでメモリリークはゼロになる。
3. **コンプライアンス第一の安全設計**:
   Turnstile等のボット対策が強固なフォームや「営業お断り」が明記されたフォームは、無理に突破せず安全に検知・記録・スキップする体制を作ることが、持続可能なシステム運用の最大の秘訣。

本アーキテクチャは、日本全国500万社超の企業オープンデータや高精度なフォーム連携を支えるセールステック基盤「[Kigyou-list（企業リスト.com）](https://kigyoulist.com)」のバックエンドエンジンとして稼働しています。

大規模Webクローリングやフォーム解析パイプライン構築の参考になれば幸いです。
