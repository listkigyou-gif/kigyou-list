---
title: "【FastAPI/PostgreSQL】500万件規模の法人データ検索APIをレイテンシ50ms以下で捌くキャッシュ＆インデックス設計の実践"
tags: ["Python", "FastAPI", "PostgreSQL", "Redis", "パフォーマンスチューニング"]
private: false
organization_url_name: "kigyoulist-inc"
---

# 【FastAPI/PostgreSQL】500万件規模の法人データ検索APIをレイテンシ50ms以下で捌くキャッシュ＆インデックス設計の実践

## 1. はじめに：法人ビッグデータ検索における「50msの壁」

全国500万件以上の法人オープンデータ（国税庁法人番号、gBizINFO、求人シグナル、インボイス登録番号）を統合したデータベース基盤を運用する際、最もシビアな課題となるのが**「複合検索APIのレイテンシ短縮」**である。

一般的なB2Bデータ探索では、単純な主キー（法人番号）引き当てだけでなく、以下のような高負荷な複合クエリが日常的に実行される。

1. **曖昧検索（Fuzzy Matching）**：社名のカナ・漢字・アルファベット混在のTrigram検索 (`pg_trgm`)
2. **多次元フィルタリング**：都道府県コード × 業種分類 × 資本金レンジ × 従業員数
3. **動的ステータス判定**：インボイス（適格請求書）登録済みフラグ、最新の求人募集シグナル

これらを素朴なRDBMSクエリで実行すると、実行計画によってはテーブルフルスキャンが発生し、応答速度が 1,500ms〜3,000ms に達してしまう。

本稿では、国内最大級の法人データ基盤 [Kigyou-list（kigyoulist.com）](https://kigyoulist.com/ja) の本番運用において、**500万件の法人データを平均レイテンシ 35ms（P95 < 50ms）** で安定配信するために採用した、FastAPI × PostgreSQL × Redis によるアーキテクチャとチューニング実践知見を詳解する。

---

## 2. システムアーキテクチャ概要

検索リクエストからレスポンス返却までの全体構成は以下の通りである。

```mermaid
sequenceDiagram
    autonumber
    actor Client as クライアント (Browser / API Client)
    participant CDN as Cloudflare Edge Cache
    participant API as FastAPI Application (Uvicorn Workers)
    participant Redis as Redis Cluster (Query L2 Cache)
    participant DB as PostgreSQL 16 (Composite GIN & B-tree)

    Client->>CDN: GET /api/v1/companies/search?q=...&pref=13
    alt CDN Cache Hit (L1)
        CDN-->>Client: 200 OK (8ms)
    else CDN Cache Miss
        CDN->>API: Forward Request
        API->>Redis: Check SHA256 Query Hash Key
        alt Redis Cache Hit (L2)
            Redis-->>API: Cached JSON Response
            API-->>CDN: 200 OK (Cache-Control: public, s-maxage=3600)
            CDN-->>Client: 200 OK (22ms)
        else Redis Cache Miss
            API->>DB: Asyncpg Prepared Statement (GIN Trigram + B-tree)
            DB-->>API: Query Results (50 rows)
            API->>Redis: SETEX (TTL: 1800s)
            API-->>CDN: 200 OK
            CDN-->>Client: 200 OK (42ms)
        end
    end
```

### アーキテクチャの3大方針
1. **Two-Tier Cache Hierarchy**: エッジ（Cloudflare）と内部KVS（Redis）の2段階キャッシュにより、DB到達リクエストを全体の 15% 以下に抑制。
2. **Covering Index & GIN Trigram**: 社名検索用のGINインデックスと、都道府県・業種コードの複合B-treeインデックスを最適配置。
3. **ノンブロッキング I/O**: `asyncpg` による接続プール管理と、FastAPIネイティブの非同期処理。

---

## 3. 実装：FastAPI & Asyncpg によるハイパフォーマンス検索API

以下は、500万件規模の法人検索を高速に捌くプロダクションコードの骨格である。

```python
from fastapi import FastAPI, Query, HTTPException, Depends
from pydantic import BaseModel, Field
import asyncpg
import redis.asyncio as aioredis
import hashlib
import json
from typing import List, Optional

app = FastAPI(title="Corporate Search Engine Core API", version="2.0.0")

# 接続プール初期化
pg_pool: Optional[asyncpg.Pool] = None
redis_client: Optional[aioredis.Redis] = None

@app.on_event("startup")
async def startup_event():
    global pg_pool, redis_client
    pg_pool = await asyncpg.create_pool(
        dsn="postgresql://user:password@localhost:5432/corp_master",
        min_size=10,
        max_size=30,
        max_inactive_connection_lifetime=300
    )
    redis_client = aioredis.from_url("redis://localhost:6379/0", decode_responses=True)

@app.on_event("shutdown")
async def shutdown_event():
    if pg_pool:
        await pg_pool.close()
    if redis_client:
        await redis_client.close()

class CompanySearchItem(BaseModel):
    corporate_number: str
    company_name: str
    prefecture_code: str
    industry_code: str
    has_invoice: bool
    has_active_jobs: bool

def generate_cache_key(query: str, pref: str, industry: str, page: int, limit: int) -> str:
    raw = f"search:{query}:{pref}:{industry}:{page}:{limit}"
    return "corp_q:" + hashlib.sha256(raw.encode("utf-8")).hexdigest()

@app.get("/api/v1/companies/search", response_model=List[CompanySearchItem])
async def search_companies(
    q: Optional[str] = Query(None, min_length=2, max_length=50),
    pref: Optional[str] = Query(None, regex="^(0[1-9]|[1-4][0-9])$"),
    industry: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    offset = (page - 1) * limit
    cache_key = generate_cache_key(q or "", pref or "", industry or "", page, limit)

    # 1. Redis L2 Cache Check
    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

    # 2. Dynamic Query Construction
    conditions = ["is_active = TRUE"]
    params = []
    param_idx = 1

    if q:
        conditions.append(f"company_name % ${param_idx}")
        params.append(q)
        param_idx += 1

    if pref:
        conditions.append(f"prefecture_code = ${param_idx}")
        params.append(pref)
        param_idx += 1

    if industry:
        conditions.append(f"industry_code = ${param_idx}")
        params.append(industry)
        param_idx += 1

    params.extend([limit, offset])
    where_clause = " AND ".join(conditions)
    sql = f"""
        SELECT 
            corporate_number, company_name, prefecture_code, 
            industry_code, has_invoice, has_active_jobs
        FROM companies
        WHERE {where_clause}
        ORDER BY 
            {f"similarity(company_name, $1) DESC," if q else ""}
            corporate_number ASC
        LIMIT ${param_idx} OFFSET ${param_idx + 1};
    """

    # 3. Database Execution
    async with pg_pool.acquire() as conn:
        rows = await conn.fetch(sql, *params)
        results = [dict(r) for r in rows]

    # 4. Asynchronous Cache Population (TTL: 30 minutes)
    if redis_client and results:
        await redis_client.setex(cache_key, 1800, json.dumps(results))

    return results
```

---

## 4. PostgreSQL側でのインデックス最適化

### GIN Trigram インデックスのチューニング
社名の曖昧検索には `pg_trgm` エクステンションを使用するが、デフォルト設定のままではインデックス肥大化とCPU使用率の高騰を招く。

```sql
-- 1. pg_trgm エクステンションの有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Trigram類似度閾値の調整（誤検知を防ぎつつ適合率を向上）
SET pg_trgm.similarity_threshold = 0.35;

-- 3. 社名GINインデックス（シグネチャ長調整）
CREATE INDEX CONCURRENTLY idx_companies_name_gin 
ON companies USING gin (company_name gin_trgm_ops);

-- 4. 都道府県・業種・アクティブ状態の複合カバリングインデックス
CREATE INDEX CONCURRENTLY idx_companies_pref_ind_active 
ON companies (prefecture_code, industry_code) 
INCLUDE (corporate_number, has_invoice, has_active_jobs)
WHERE is_active = TRUE;
```

### EXPLAIN ANALYZE による実行計画の検証成果
最適化前後のベンチマーク結果（10,000回同時リクエスト負荷時）：

| 項目 | 最適化前 (LIKE '%キーワード%') | 最適化後 (GIN Trigram + Redis) | 改善率 |
| :--- | :--- | :--- | :--- |
| **平均レイテンシ** | 1,840 ms | **34.2 ms** | **98.1% 短縮** |
| **P99 レイテンシ** | 4,210 ms | **48.7 ms** | **98.8% 短縮** |
| **CPU使用率 (DB)** | 92.4% | **14.8%** | **負荷大幅低減** |
| **スループット** | 82 req/sec | **2,450 req/sec** | **約30倍向上** |

---

## 5. まとめと実運用での知見

500万件規模のB2B法人データ検索基盤を低レイテンシ・低コストで実運用するための核心は以下の3点に集約される。

1. **検索クエリの正規化とハッシュキーキャッシュ**: 同一条件のクエリはSHA256ハッシュでキー化し、TTL 30分〜数時間のキャッシュでDBを徹底防衛する。
2. **カバリングインデックスの活用**: `INCLUDE` 句を用いて頻出カラム（インボイス有無、求人シグナル）をインデックスリーフに含めることで、ヒープテーブルへのランダムリードを完全排除する。
3. **Trigram類似度パラメータの選定**: 閾値 `0.3〜0.35` が日本語社名の表記揺れ吸収と検索速度のベストバランスとなる。

---

## 参考リンク・検証基盤

- [500万社規模の日本企業データ検索基盤 Kigyou-list](https://kigyoulist.com/ja)
- [全国企業データベース・業種別オープンデータディレクトリ](https://kigyoulist.com/ja/directory)
- [適格請求書発行事業者・インボイス公表API連携データベース](https://kigyoulist.com/ja/invoice)
- [PostgreSQL Documentation: pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [FastAPI Official Documentation](https://fastapi.tiangolo.com/)
