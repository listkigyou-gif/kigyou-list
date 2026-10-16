## 1. はじめに：なぜキーワード検索だけでは「競合・類似企業」が見つからないのか

B2Bセールスやアライアンス探索、M&Aリサーチにおいて、「ある成功企業（例：SmartHR）に類似したビジネスモデルを持つ企業」や「自社プロダクトの直接の競合他社」を発掘したいというニーズは極めて強いものがあります。

しかし、旧来のリレーショナルDBにおけるキーワード部分一致（`LIKE` 検索）や単純な業界カテゴリ検索では、以下のような致命的な課題が発生します：

1. **同義語・表現の不一致**: ある企業は「採用管理SaaS」、別の企業は「ATS・求人プラットフォーム」「採用DX支援」と表現しており、キーワード検索では漏れが発生する
2. **多面的な事業内容の捉え漏れ**: 大手からスタートアップまで、Webサイト上には複数のサービスが記載されており、登記簿上の1つの産業コードでは実態を表現しきれない
3. **「近さ（類似度）」の定量化が不可能**: キーワード検索は「含むか・含まないか」の0/1判定であり、どの企業がより似ているかをスコアリングしてランキングすることができない

この課題を解決するのが、**企業の事業概要テキストを密ベクトル（Dense Vector）に変換し、PostgreSQLの拡張機能である `pgvector` を用いて多次元空間上で類似度（コサイン距離）を瞬時に計算する「ベクトル検索アーキテクチャ」**です。

本記事では、**全国500万社の法人データ基盤（[Kigyou-list](https://kigyoulist.com)）で実運用している、Python、埋め込みモデル（Embedding）、およびPostgreSQL pgvector（HNSWインデックス）を組み合わせた類似企業推薦システム**の実装とチューニング手法を解説します。

---

## 2. システム全体アーキテクチャ

システムは、テキスト埋め込みパイプラインと、pgvectorを活用した高速リトリーバル層の2つで構成されます。

![B2B企業ベクトル検索・類似企業推薦パイプラインのアーキテクチャ図](https://raw.githubusercontent.com/listkigyou-gif/kigyou-list/main/frontend/public/images/qiita_vector_search_arch.jpg)

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

まずはPostgreSQLで `pgvector` 拡張を有効化し、ベクトルカラムを持つ企業テーブルを定義します。

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

pgvectorには `ivfflat` と `hnsw` の2種類のインデックス方式があります。500万件規模の大規模データかつ高精度な検索が求められる環境では、**HNSWインデックス**が圧倒的に優れています。

- **IVFFlat**: 事前にクラスタリング（重心計算）が必要。データ追加時にリコール率が低下しやすい。
- **HNSW**: 事前トレーニング不要。メモリ消費は大きいが、検索時のリコール率が極めて高く、レイテンシが数ミリ秒と超高速。

```sql
-- コサイン距離（vector_cosine_ops）を用いたHNSWインデックスの作成
CREATE INDEX idx_company_embeddings_hnsw 
ON company_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (
    m = 16,               -- ノードあたりの双方向リンク数（16〜32推奨）
    ef_construction = 64  -- 構築時の探索深さ（64〜128推奨）
);

-- リレーショナル絞り込み用B-Tree複合インデックス
CREATE INDEX idx_company_pref_ind ON company_embeddings (prefecture, industry_category);
```

---

## 4. 実装：Pythonによるテキスト埋め込みとバルクUPSERT

企業テキストをベクトル化し、PostgreSQLへバッチ投入する実装例です。

```python
import os
import psycopg2
from psycopg2.extras import execute_values
from typing import List, Dict, Any
from openai import OpenAI

# OpenAIクライアント初期化
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    複数企業のテキストを一括してベクトル化（1536次元）
    """
    # 改行をスペースに置換（埋め込み精度の安定化）
    cleaned_texts = [t.replace("\n", " ").strip()[:3000] for t in texts]
    
    response = client.embeddings.create(
        input=cleaned_texts,
        model="text-embedding-3-small"
    )
    return [item.embedding for item in response.data]

def bulk_upsert_embeddings(conn, records: List[Dict[str, Any]]):
    """
    PostgreSQLへのバッチ挿入
    records = [{'corporate_number': '...', 'name': '...', 'prefecture': '...', 'summary': '...', 'embedding': [...]}, ...]
    """
    query = """
    INSERT INTO company_embeddings (
        corporate_number, name, prefecture, business_summary, embedding
    ) VALUES %s
    ON CONFLICT (corporate_number) DO UPDATE SET
        business_summary = EXCLUDED.business_summary,
        embedding = EXCLUDED.embedding,
        updated_at = NOW();
    """
    
    data_tuples = [
        (
            r["corporate_number"],
            r["name"],
            r["prefecture"],
            r["summary"],
            r["embedding"]  # pgvectorはPythonのlist[float]を直接受け取り可能
        )
        for r in records
    ]
    
    with conn.cursor() as cur:
        execute_values(cur, query, data_tuples, page_size=500)
    conn.commit()
```

---

## 5. 類似企業・競合他社の推薦クエリとベンチマーク

指定した特定企業（例：法人番号 `1234567890123`）と事業内容が最も類似している企業TOP10を抽出するSQLクエリです。

```sql
-- 対象企業のベクトルを取得し、全テーブルから最も類似する他社を検索
WITH target_corp AS (
    SELECT embedding 
    FROM company_embeddings 
    WHERE corporate_number = '1234567890123'
)
SELECT 
    c.corporate_number,
    c.name,
    c.prefecture,
    c.business_summary,
    -- コサイン類似度スコア（1 - コサイン距離）
    ROUND((1 - (c.embedding <=> t.embedding))::numeric, 4) AS similarity_score
FROM company_embeddings c, target_corp t
WHERE c.corporate_number != '1234567890123'    -- 自社自身は除外
  AND c.prefecture = '東京都'                  -- 地域絞り込み（メタデータフィルタ）
ORDER BY c.embedding <=> t.embedding ASC      -- コサイン距離が近い順
LIMIT 10;
```

### パフォーマンス検証結果（500万件データセット）

PostgreSQL 16 ＋ pgvector 0.7.0 環境における実測比較です：

| 検索実行方式 | 実行プラン (EXPLAIN ANALYZE) | クエリ実行時間 | リコール率 (Recall@10) |
|---|---|---|---|
| **インデックスなし（フルスキャン）** | Seq Scan on company_embeddings | **14,250 ms** (約14.2秒) | 100%（完全一致） |
| **IVFFlat インデックス** | Index Scan using ivfflat | **68.4 ms** | 88.5% |
| **HNSW インデックス** (`m=16`) | Index Scan using hnsw | **9.4 ms** | **99.2%** |

HNSWインデックスを適切に構成することで、**500万レコードの超多次元ベクトル空間であっても、わずか9.4ミリ秒という驚異的なレイテンシ**で類似企業を抽出できることが実証されました。

---

## 6. まとめと実運用のベストプラクティス

エンタープライズ規模の企業データ基盤でベクトル検索を安定運用するための重要知見です：

1. **プレフィルタリングの最適化**:
   すべての企業をベクトル計算する前に、都道府県や大まかな資本金規模、除外条件をインデックススキャンと組み合わせることで、不要な距離計算を大幅にスキップできる。
2. **テキスト生成（Embedding Input）の品質が命**:
   会社名だけをベクトル化しても意味がない。事業内容や展開プロダクト、求人票のキーワードを適切に集約・要約した「代表コンテキスト」を作成することが、推薦精度の9割を決める。
3. **ハイブリッド検索（Hybrid Search）の導入**:
   業界用語や固有名詞による完全一致が必要な場合は、前回解説した `pg_trgm` / B-Tree によるキーワード検索と、今回の `pgvector` によるセマンティック検索を「相互順位融合（RRF: Reciprocal Rank Fusion）」でマージする設計が最も頑健。

本アーキテクチャは、日本全国500万社超の法人オープンデータと求人・補助金インテントデータを網羅する企業検索プラットフォーム「[Kigyou-list（企業リスト.com）](https://kigyoulist.com)」の類似企業リサーチ・レコメンド機能の基盤として実稼働しています。

B2Bデータマイニングやベクトルデータベース活用の参考になれば幸いです。
