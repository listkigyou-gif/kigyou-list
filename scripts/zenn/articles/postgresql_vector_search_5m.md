---
title: "【Python/pgvector】全国500万社規模の法人テキストを多次元空間に埋め込み、類似企業・競合をミリ秒で推薦するベクトル検索アーキテクチャ"
emoji: "⚡"
type: "tech"
topics: ["postgresql", "python", "ai", "database", "dx"]
published: true
---

## 1. はじめに：なぜキーワード検索だけでは「競合・類似企業」が見つからないのか

B2Bセールスやアライアンス探索、M&Aリサーチにおいて、「ある成功企業（例：SmartHR）に類似したビジネスモデルを持つ企業」や「自社プロダクトの直接の競合他社」を発掘したいというニーズは極めて強いものがある。

しかし、旧来のリレーショナルDBにおけるキーワード部分一致（`LIKE` 検索）や単純な業界カテゴリ検索では、以下のような致命的な課題が発生する：

1. **同義語・表現の不一致**: ある企業は「採用管理SaaS」、別の企業は「ATS・求人プラットフォーム」「採用DX支援」と表現しており、キーワード検索では漏れが発生する
2. **多面的な事業内容の捉え漏れ**: 大手からスタートアップまで、Webサイト上には複数のサービスが記載されており、登記簿上の1つの産業コードでは実態を表現しきれない
3. **「近さ（類似度）」の定量化が不可能**: キーワード検索は「含むか・含まないか」の0/1判定であり、どの企業がより似ているかをスコアリングしてランキングすることができない

この課題を解決するのが、**企業の事業概要テキストを密ベクトル（Dense Vector）に変換し、PostgreSQLの拡張機能である `pgvector` を用いて多次元空間上で類似度（コサイン距離）を瞬時に計算する「ベクトル検索アーキテクチャ」**である。

本記事では、**全国500万社の法人データ基盤（[Kigyou-list](https://kigyoulist.com)）で実運用している、Python、埋め込みモデル（Embedding）、およびPostgreSQL pgvector（HNSWインデックス）を組み合わせた類似企業推薦システム**の実装とチューニング手法を解説する。

---

## 2. システム全体アーキテクチャ

システムは、テキスト埋め込みパイプラインと、pgvectorを活用した高速リトリーバル層の2つで構成される。

### アーキテクチャの主要ステップ

1. **コーポレートテキストの生成**:
   会社概要、事業内容、主要サービス紹介、ハローワーク求人の募集要項を統合し、企業の事業実態を表すコンテキストテキスト（800〜1,500文字程度）を生成。
2. **埋め込みベクトルの生成 (Embedding)**:
   多言語対応モデル（`text-embedding-3-small` または Sentence-Transformers）を用いて、1,536次元（または768次元）の浮動小数点配列にエンコード。
3. **pgvector によるベクトル格納とHNSWインデックス**:
   PostgreSQLの `vector` 型カラムに格納し、階層型近傍グラフ（HNSW: Hierarchical Navigable Small World）インデックスを構築。
4. **ハイブリッド類似検索とリランキング**:
   対象企業のベクトルと全体のコサイン距離を計算し、所在地や業種属性によるプレフィルタリングを適用した上で、類似スコアTOP10社をミリ秒単位で抽出。

---

## 3. 実装：PostgreSQL & pgvector のセットアップとテーブル設計

まずはPostgreSQLで `pgvector` 拡張を有効化し、ベクトルカラムを持つ企業テーブルを定義する。

### ① 拡張機能の有効化とスキーマ定義

```sql
-- 1. pgvector 拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 企業ベクトルテーブルの作成（1536次元の例）
CREATE TABLE company_embeddings (
    corporate_number CHAR(13) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    prefecture VARCHAR(20),
    industry_category VARCHAR(100),
    business_summary TEXT,
    embedding vector(1536),                  -- 埋め込みベクトル
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### ② HNSWインデックスの構築（大規模データ向け最重要チューニング）

pgvectorには `ivfflat` と `hnsw` の2種類のインデックス方式がある。500万件規模の大規模データかつ高精度な検索が求められる環境では、**HNSWインデックス**が圧倒的に優れている。

```sql
-- コサイン距離（vector_cosine_ops）を用いたHNSWインデックスの構築
CREATE INDEX idx_company_embeddings_hnsw ON company_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

- `m`: グラフノードあたりの最大双方向リンク数（推奨値: 16〜64）。
- `ef_construction`: インデックス構築時の探索深さ（推奨値: 64〜128）。

---

## 4. Pythonによる埋め込みベクトルの生成とバルクUPSERT

テキストからベクトルを抽出し、PostgreSQLへバッチ保存するスクリプト例を示す。

```python
import psycopg2
from psycopg2.extras import execute_values
from openai import OpenAI

client = OpenAI()

def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """OpenAI APIを用いてテキスト群のベクトルを一括取得"""
    response = client.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )
    return [item.embedding for item in response.data]

def bulk_upsert_embeddings(conn, records: list[dict]):
    """pgvectorテーブルへのバルク挿入・更新"""
    query = """
    INSERT INTO company_embeddings (corporate_number, name, prefecture, industry_category, business_summary, embedding)
    VALUES %s
    ON CONFLICT (corporate_number) DO UPDATE SET
        business_summary = EXCLUDED.business_summary,
        embedding = EXCLUDED.embedding,
        updated_at = CURRENT_TIMESTAMP;
    """
    data = [
        (
            r["corporate_number"],
            r["name"],
            r["prefecture"],
            r["industry_category"],
            r["business_summary"],
            r["embedding"]
        )
        for r in records
    ]
    with conn.cursor() as cur:
        execute_values(cur, query, data, template="(%s, %s, %s, %s, %s, %s::vector)")
    conn.commit()
```

---

## 5. 類似企業抽出クエリの実践

特定の企業（例: 法人番号 `1234567890123`）を起点とし、その企業と事業内容が最も近いTOP5社をミリ秒単位で検索するSQLである。

```sql
WITH target AS (
    SELECT embedding FROM company_embeddings WHERE corporate_number = '1234567890123'
)
SELECT 
    c.corporate_number,
    c.name,
    c.prefecture,
    c.industry_category,
    -- コサイン類似度（1 - コサイン距離）
    1 - (c.embedding <=> target.embedding) AS similarity_score
FROM company_embeddings c, target
WHERE c.corporate_number != '1234567890123'
ORDER BY c.embedding <=> target.embedding ASC
LIMIT 5;
```

`<=>` 演算子はコサイン距離（Cosine Distance）を計算し、HNSWインデックスをフル活用して数十ミリ秒以内でレスポンスを返す。

---

## 6. まとめ

企業データの類似度検索に `pgvector` を導入することで、単語の一致に頼らない本質的な企業マッチングが可能となった。

- **同義語・表記揺れの吸収**: 自然言語埋め込みにより、業種タグを超えた類似性を発見できる。
- **PostgreSQL単一基盤の強み**: 外部の専用Vector DB（PineconeやMilvus等）を追加せず、リレーショナル属性（所在地や設立年）とのハイブリッド検索が単一トランザクションで完結する。
- **HNSWインデックス**: 500万件規模でもミリ秒台の高速リトリーバルを実現。

このベクトル検索パイプラインは、日本全国500万社を網羅する次世代型法人データベース「[Kigyou-list（kigyoulist.com）](https://kigyoulist.com)」のバックエンドとして実稼働している。企業検索や類似企業分析のさらなる詳細は、公式検索ポータル（[https://kigyoulist.com/ja/search](https://kigyoulist.com/ja/search)）にて確認されたい。
