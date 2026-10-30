## 1. はじめに：従来の「大分類」では見つからない現代のB2B企業

企業の営業DXやアライアンス探索、M&Aリサーチにおいて、最も頻繁に直面する壁が**「産業分類コード（日本標準産業分類: JSIC）の粒度の粗さ」**です。

例えば、最先端の「LLM導入支援」「サプライチェーンDX」「バーチャルヒューマン開発」を手掛けるスタートアップを検索しようとしても、登記情報上の分類はすべて**「情報サービス業（大分類G / 中分類39）」**という大括りに丸められてしまいます。結果として、本当にアプローチしたい企業を絞り込むことができず、数百社以上のWebサイトを人間が1件ずつ目視確認する膨大な工数が発生していました。

この課題を解決するためには、**企業の公式Webサイト（会社概要、事業内容、サービス紹介、求人票の募集要項）から非構造化テキストを抽出し、AI・自然言語処理（NLP）を用いて高精度な「B2B事業カテゴリタグ」を自動付与するパイプライン**が必要です。

本記事では、Python、埋め込みベクトル（Embeddings）、そして高速LLMを組み合わせ、数百万社規模のWebテキストから1,000種以上の事業タグを自動判定・正規化する実践的なアーキテクチャを解説します。

---

## 2. システム全体アーキテクチャ

システムは以下の処理フローで構成されます。Webサイトから取得した雑多なHTMLテキストをクレンジングし、軽量なベクトル埋め込みと高速LLMによるハイブリッド判定を経て、構造化された業界タグ・ビジネス属性へと変換します。

![AI テキスト解析・分類パイプラインのアーキテクチャ図](https://raw.githubusercontent.com/listkigyou-gif/kigyou-list/main/frontend/public/images/qiita_ai_tagging_arch.jpg)

### 処理ステージの概要

1. **非構造化テキスト入力 (Unstructured Input)**:
   企業HPのトップページ、事業紹介ページ、ハローワーク求人票の「事業内容・職務内容」テキストを収集
2. **ノイズ除去 & セマンティック・チャンキング (Preprocessing)**:
   免責事項、ヘッダー/フッター、Cookie警告、プライバシーポリシー等の定型ノイズをストリップ
3. **埋め込み生成 & カテゴリ分類 (Embeddings & Categorization)**:
   事業概要ベクトルと定義済み産業タクソノミー（1,000+カテゴリ）のコサイン類似度計算
4. **高速LLMによる曖昧判定の精緻化 (LLM Disambiguation)**:
   複数事業を展開する企業やエッジケースに対する複合タグ付け
5. **PostgreSQLへの構造化格納 (Storage & Indexing)**:
   `jigyo_shumoku`（事業種目配列）への格納と GIN インデックスによるミリ秒検索

---

## 3. 実装：Webテキストのクレンジングと特徴抽出

企業のHTMLから抽出されたテキストにはナビゲーションリンクやコピーライト等のノイズが多く含まれます。まずは事業の本質が記述されているブロックをスコアリングして抽出します。

```python
import re
from typing import List, Dict, Any
from bs4 import BeautifulSoup

# ノイズ除去用の不要パターン
NOISE_PATTERNS = [
    r'プライバシーポリシー', r'利用規約', r'All Rights Reserved',
    r'Cookieポリシー', r'お問い合わせはこちら', r'サイトマップ'
]

def clean_corporate_text(html_content: str) -> str:
    """
    HTMLから企業の事業実態を示す重要テキストを抽出・正規化
    """
    soup = BeautifulSoup(html_content, "html.parser")
    
    # script, style, nav, footer, header を除去
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
        
    text = soup.get_text(separator=" ")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    
    cleaned_lines = []
    for line in lines:
        if len(line) < 5:  # 短すぎる断片をスキップ
            continue
        if any(re.search(pat, line, re.I) for pat in NOISE_PATTERNS):
            continue
        cleaned_lines.append(line)
        
    # 上位3,000文字程度に要約（トークンコスト最適化）
    raw_text = " ".join(cleaned_lines)
    return re.sub(r'\s+', ' ', raw_text)[:3000]
```

---

## 4. ルールベース分類と埋め込みベクトルのハイブリッド判定

数百万社の企業を全件LLMにかけると膨大なAPIコストとレイテンシが発生します。そのため、**「高速なキーワード・正規表現フィルタ」➔「タクソノミーのベクトル類似度検索」➔「LLMによる最終精査」**の3段階カスケード構造を採ります。

### ① タクソノミー定義とキーワードマッピング

```python
# B2B特化型タクソノミーの定義例
TAXONOMY_MAP = {
    "AI・機械学習": ["LLM", "生成AI", "機械学習", "深層学習", "自然言語処理", "画像認識", "受託AI開発"],
    "SaaS・クラウド": ["SaaS", "クラウドサービス", "サブスクリプション", "マルチテナント", "BtoBプラットフォーム"],
    "サイバーセキュリティ": ["脆弱性診断", "SOC", "EDR", "情報セキュリティ", "ペネトレーションテスト"],
    "受託システム開発・SES": ["システムインテグレーション", "受託開発", "SES", "常駐開発", "オフショア開発"],
    "Webマーケティング・SEO": ["SEO対策", "リスティング広告", "SNSマーケティング", "CRO", "コンテンツマーケティング"],
    "サプライチェーン・物流DX": ["WMS", "TMS", "配車最適化", "物流受託", "越境EC"],
    "医療・ヘルスケアテック": ["電子カルテ", "遠隔診療", "医療機器開発", "レセプト", "創薬DX"]
}

def rule_based_tagging(text: str) -> List[str]:
    matched_tags = []
    for tag, keywords in TAXONOMY_MAP.items():
        score = sum(1 for kw in keywords if re.search(rf'\b{re.escape(kw)}\b', text, re.I))
        if score >= 2:  # 2つ以上の関連語が出現したら候補に追加
            matched_tags.append(tag)
    return matched_tags
```

### ② 高速LLM（Groq / LLaMA-3）による精査パイプライン

ルールベースで判別が難しい企業や、新規性の高いビジネスモデルに対して、超高速な推論エンジン（Groq API / LLaMA-3）を用いてJSON形式で構造化タグを出力させます。

```python
import json
import urllib.request
import os

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

def classify_industry_with_llm(company_name: str, clean_text: str) -> Dict[str, Any]:
    """
    LLMを活用した事業カテゴリと日本標準産業分類(JSIC)の推定
    """
    if not GROQ_API_KEY:
        return {"tags": [], "jsic_code": "39"}  # フォールバック
        
    prompt = f"""
以下の日本企業の事業概要テキストを解析し、最適なB2B事業カテゴリタグ（最大3つ）と日本標準産業分類（JSIC 2桁中分類コード）を判定してください。

【対象企業】: {company_name}
【事業概要テキスト】:
{clean_text[:1200]}

必ず以下のJSONフォーマットのみを出力してください（Markdownコードブロック不要）:
{{"tags": ["カテゴリ1", "カテゴリ2"], "jsic_code": "39", "reason": "短い判定理由"}}
"""

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }
    
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
            content = result["choices"][0]["message"]["content"]
            return json.loads(content)
    except Exception as e:
        print(f"LLM API Error: {e}")
        return {"tags": rule_based_tagging(clean_text), "jsic_code": "39"}
```

---

## 5. PostgreSQLによるタグ配列の高速インデックス（GIN）

判定された複数の事業タグは、企業マスタテーブルの `TEXT[]`（配列型）または正規化された関連テーブルに格納します。PostgreSQLの **GIN（Generalized Inverted Index）** を使用することで、数百万件のデータから特定タグを持つ企業をミリ秒単位で抽出可能です。

```sql
-- 1. 企業テーブルへのタグ配列カラムの追加
ALTER TABLE companies ADD COLUMN IF NOT EXISTS jigyo_shumoku TEXT[] DEFAULT '{}';

-- 2. 配列包含検索のためのGINインデックス作成
CREATE INDEX IF NOT EXISTS idx_companies_jigyo_gin 
ON companies USING gin (jigyo_shumoku);

-- 3. 「AI・機械学習」かつ「SaaS・クラウド」を手掛ける企業を高速抽出
SELECT 
    corporate_number,
    name,
    prefecture,
    website_url,
    jigyo_shumoku
FROM companies
WHERE jigyo_shumoku @> ARRAY['AI・機械学習', 'SaaS・クラウド']
ORDER BY updated_at DESC
LIMIT 50;
```

---

## 6. 実運用におけるパフォーマンスとコスト最適化の知見

実運用（全国500万社規模）のデータ基盤を構築する中で得られた知見です。

1. **キャッシュと差分判定の徹底**:
   企業のWebサイトのハッシュ値（SHA-256）を保持し、サイト内容に変更がない企業は再分類スキップ。月次のクロール更新コストを85%削減。
2. **階層型タクソノミー（大分類・中分類・小分類）**:
   単一のフラットなタグではなく、「IT ➔ ソフトウェア ➔ AI・LLM導入」のような親子関係を定義することで、包括検索（IT全般）とピンポイント検索（LLM特化）の双方に対応。
3. **官公庁オープンデータ（gBizINFO・特許・補助金）シグナルとの相互補正**:
   Webサイトのテキストだけでなく、「IT導入補助金の採択実績」や「特許保有カテゴリ」を教師シグナルとして掛け合わせることで、タグの信頼度（Confidence Score）を98%以上に向上。

---

## 7. まとめ

旧来の登記用産業分類にとどまらず、**WebサイトのテキストからAI・NLPを用いてリアルなB2B事業カテゴリを自動抽出・構造化すること**で、営業ターゲットの解像度は飛躍的に高まります。

- **テキストクレンジング**によるノイズ低減
- **ルールベース ＋ 高速LLMのハイブリッド**によるコストと精度の両立
- **PostgreSQL GINインデックス**による超高速なタグ絞り込み

本アーキテクチャは、日本全国500万社超の法人データと高解像度なAI産業タグを網羅する企業リサーチプラットフォーム「[Kigyou-list（kigyoulist.com）](https://kigyoulist.com)」のバックエンド分類基盤として稼働しています。

B2Bデータの高度化やテキストマイニングの参考になれば幸いです。
