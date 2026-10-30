## 1. はじめに：なぜ静的な企業データベースだけでは不十分なのか

法人営業（B2Bセールス）やマーケティングにおいて、企業名や電話番号、代表者名が並んだだけの「静的な企業名簿」を使ったアウトバウンド営業は、年々成約率が低下しています。

企業がサービスやソリューションを真に求めているタイミングは、以下のような**「事業拡大や投資のトリガー」**が発生した瞬間です。

- **新規採用の開始・拡大**: ハローワークや求人媒体に新規求人を掲載（人員不足、新規事業立ち上げの兆候）
- **補助金・助成金の採択**: IT導入補助金やものづくり補助金の採択（設備投資・DXツールの予算獲得）
- **公共調達・入札の落札**: 官公庁案件の受注（キャッシュフローの潤沢化、外注ニーズの発生）
- **プレリリース発表**: 新製品ローンチや資金調達

これらは**「インテントデータ（購買意欲・事業活動シグナル）」**と呼ばれます。本記事では、公的オープンデータ（ハローワーク求人、経産省 gBizINFO 補助金・調達データ）をPythonの非同期処理（`asyncio` + `httpx`）で高並列に収集し、13桁の法人番号をキーとしてPostgreSQLに時系列イベントとして蓄積・高速検索する実践的なアーキテクチャを解説します。

---

## 2. システム全体アーキテクチャ

システムは以下の4層構造で設計されています。

```text
[公的データソース]
 - ハローワーク求人 (Web Portal)
 - 経産省 gBizINFO API (補助金・調達・表彰)
         │
         ▼
[1. 非同期データ収集エンジン (AsyncIO Worker Pool)]
 - httpx.AsyncClient + asyncio.Semaphore による安全な並列クローリング
 - セッション・Cookie ハンドリングと Exponential Backoff
         │
         ▼
[2. 法人番号正規化 & 名寄せパイプライン]
 - 企業名正規化 (法人格剥奪, NFKC正規化)
 - 13桁法人番号チェックディジット検証 (Modulus 9)
         │
         ▼
[3. イベントストア (PostgreSQL & JSONB)]
 - company_signals テーブルへの UPSERT
 - GIN インデックスによる属性検索の高速化
         │
         ▼
[4. インテント検索 & アラート API]
 - 「直近30日以内にIT求人を出した企業」等のミリ秒抽出
```

---

## 3. Python/AsyncIOによる高並列シグナル収集の実装

公的機関のWebシステムやAPIを巡回する際、サーバーに負荷をかけずに高速かつ安定して収集するために、`asyncio.Semaphore` による同時実行数制御と `httpx` によるコネクションプーリングを実装します。

### ① 非同期クローラーの基底クラス

```python
import asyncio
import logging
from typing import List, Dict, Any, Optional
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SignalCrawler")

class AsyncSignalCrawler:
    def __init__(self, concurrency: int = 5, request_timeout: float = 15.0):
        # 相手サーバーに過度な負荷をかけないよう同時実行数を厳格に制御
        self.semaphore = asyncio.Semaphore(concurrency)
        self.timeout = httpx.Timeout(request_timeout, connect=5.0)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "ja,en-US;q=0.9,en;q=0.8"
        }

    async def fetch_page(self, client: httpx.AsyncClient, url: str, params: Optional[Dict[str, Any]] = None) -> Optional[str]:
        async with self.semaphore:
            for attempt in range(1, 4):
                try:
                    await asyncio.sleep(0.5)  # Politeness delay
                    response = await client.get(url, params=params, headers=self.headers, timeout=self.timeout)
                    if response.status_code == 200:
                        return response.text
                    elif response.status_code == 429:
                        wait_sec = 2 ** attempt
                        logger.warning(f"Rate limited (429). Retrying in {wait_sec}s...")
                        await asyncio.sleep(wait_sec)
                    else:
                        logger.warning(f"Request failed: {url} status={response.status_code}")
                except (httpx.RequestError, httpx.TimeoutException) as e:
                    logger.error(f"Attempt {attempt} failed for {url}: {e}")
                    await asyncio.sleep(1.0 * attempt)
            return None
```

### ② ハローワーク求人データの解析と抽出

ハローワーク等の求人票HTMLから、企業名、求人タイトル、職種、賃金、掲載日を抽出し、構造化データに変換します。

```python
from bs4 import BeautifulSoup
import re
from datetime import datetime

def parse_job_signal(html_content: str) -> List[Dict[str, Any]]:
    soup = BeautifulSoup(html_content, "html.parser")
    signals = []
    
    # 求人カードのパース例
    job_cards = soup.select(".job-item-card, tr.kyujin-row")
    for card in job_cards:
        company_name_el = card.select_one(".company-name, td.kyujin-company")
        title_el = card.select_one(".job-title, td.kyujin-title")
        date_el = card.select_one(".post-date, td.kyujin-date")
        wage_el = card.select_one(".wage-info, td.kyujin-wage")
        
        if not company_name_el or not title_el:
            continue
            
        raw_company_name = company_name_el.get_text(strip=True)
        job_title = title_el.get_text(strip=True)
        raw_date = date_el.get_text(strip=True) if date_el else ""
        
        # 日付フォーマットの正規化 (YYYY-MM-DD)
        match_date = re.search(r'(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})', raw_date)
        signal_date = f"{match_date.group(1)}-{int(match_date.group(2)):02d}-{int(match_date.group(3)):02d}" if match_date else datetime.today().strftime('%Y-%m-%d')
        
        signals.append({
            "source": "hellowork",
            "signal_type": "recruitment",
            "raw_company_name": raw_company_name,
            "title": job_title,
            "signal_date": signal_date,
            "details": {
                "wage": wage_el.get_text(strip=True) if wage_el else None,
                "is_tech_role": bool(re.search(r'(エンジニア|プログラマ|DX|開発|IT|システム|インフラ)', job_title, re.I))
            }
        })
    return signals
```

---

## 4. 経産省 gBizINFO APIからの補助金・調達シグナルの統合

経済産業省が提供する `gBizINFO REST API` を活用し、法人番号をキーに「ものづくり補助金」「IT導入補助金」等の採択実績を取得します。

```python
async def fetch_gbiz_signals(client: httpx.AsyncClient, corporate_number: str) -> List[Dict[str, Any]]:
    """
    gBizINFO APIから補助金・調達シグナルを取得
    """
    url = f"https://info.gbiz.go.jp/hojin/v1/hojin/{corporate_number}/subsidy"
    headers = {"Accept": "application/json"}
    
    signals = []
    try:
        resp = await client.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("hojin-infos", []):
                for sub in item.get("subsidy", []):
                    signals.append({
                        "corporate_number": corporate_number,
                        "source": "gbizinfo",
                        "signal_type": "subsidy",
                        "title": sub.get("title") or sub.get("subsidy_name"),
                        "signal_date": sub.get("decision_date") or sub.get("date"),
                        "details": {
                            "amount": sub.get("amount"),
                            "ministry": sub.get("ministry")
                        }
                    })
    except Exception as e:
        logger.error(f"gBizINFO fetch error for {corporate_number}: {e}")
    return signals
```

---

## 5. PostgreSQLによる時系列イベントストアの設計

インテントデータは、一度記録したら変更されない「イミュータブルなイベント」として記録するのが設計の鉄則です。企業マスタと紐付け、日付範囲やシグナル種別、JSONB内の特定フラグで瞬時に絞り込めるテーブルスキーマを構築します。

```sql
-- 1. シグナルテーブルの作成
CREATE TABLE company_signals (
    id BIGSERIAL PRIMARY KEY,
    corporate_number CHAR(13) NOT NULL,
    source VARCHAR(50) NOT NULL,            -- 'hellowork', 'gbizinfo', 'prtimes'
    signal_type VARCHAR(50) NOT NULL,       -- 'recruitment', 'subsidy', 'procurement'
    title VARCHAR(255) NOT NULL,
    signal_date DATE NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,      -- 金額、募集要件、職種メタデータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 同一ソース・同一日付・同一内容の重複投入を防止
    CONSTRAINT uq_company_signal UNIQUE (corporate_number, source, signal_date, title)
);

-- 2. 検索速度向上のための複合インデックス
CREATE INDEX idx_signals_corp_date ON company_signals (corporate_number, signal_date DESC);
CREATE INDEX idx_signals_type_date ON company_signals (signal_type, signal_date DESC);

-- 3. JSONB 内部キー検索用 GIN インデックス
CREATE INDEX idx_signals_details_gin ON company_signals USING gin (details);
```

### 高速なインテント抽出クエリの例

「東京都内に所在し、直近60日以内にIT系求人を出している、またはIT導入補助金の採択を受けた企業」を一括抽出するクエリ：

```sql
SELECT 
    c.corporate_number,
    c.name,
    c.prefecture,
    c.phone,
    s.signal_type,
    s.title,
    s.signal_date,
    s.details
FROM companies c
JOIN company_signals s ON c.corporate_number = s.corporate_number
WHERE c.prefecture = '東京都'
  AND s.signal_date >= CURRENT_DATE - INTERVAL '60 days'
  AND (
      (s.signal_type = 'recruitment' AND (s.details->>'is_tech_role')::boolean = true)
      OR 
      (s.signal_type = 'subsidy' AND s.title LIKE '%IT導入%')
  )
ORDER BY s.signal_date DESC
LIMIT 50;
```

---

## 6. 実運用におけるパフォーマンスと信頼性の担保

数百万社規模の企業に対して日次でインテントシグナルを同期する際のエンジニアリング知見です。

1. **冪等性（Idempotency）の担保**:
   スクレイピングやバッチは途中でネットワークエラー等によりリトライが発生します。`ON CONFLICT (corporate_number, source, signal_date, title) DO NOTHING` を徹底することで、二重カウントやデータの不整合を防ぎます。
2. **名寄せの信頼度（Confidence Score）による分離**:
   gBizINFOのように法人番号が確定している公的APIのデータは直接紐付けを行い、ハローワーク等「社名と所在地のみ」のソースは前回の名寄せパイプライン（`clean_name` + `pg_trgm`）を通し、類似度90%以上の場合のみ自動結合、それ以外はステージングテーブルに分離します。
3. **データ鮮度の管理（TTL）**:
   営業のアプローチにおいて、半年前の求人情報は価値が著しく落ちます。シグナルデータには最新フラグを付与し、マスタ側には「最新シグナル発生日時（`last_intent_at`）」をキャッシュしておくことで、一覧検索クエリのJOINコストを最小限に抑えます。

---

## 7. まとめ

単なる企業名簿の収集から脱却し、**「企業の直近のアクション（Intent）」**をリアルタイムに補足・構造化することで、営業の成約確度とアプローチ効率は劇的に向上します。

- **非同期I/O（AsyncIO）**により、相手先サーバーに負荷をかけない礼儀正しい並列収集と高スループットを両立。
- **法人番号13桁**をハブとした正確な名寄せ統合。
- **PostgreSQL JSONB & GIN**による柔軟かつ高速なイベント検索基盤。

本アーキテクチャは、日本全国500万社超の法人データと求人・補助金・公共調達インテントデータを網羅する企業リサーチプラットフォーム「[Kigyou-list（kigyoulist.com）](https://kigyoulist.com)」のバックエンドデータエンジンとして日々実運用されています。

企業の動的データ活用やセールステック開発の参考になれば幸いです。
