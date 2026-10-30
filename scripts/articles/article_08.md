## 1. はじめに：500万社データを運用しながら「無停止」で最新化する難しさ

日本国内の登記法人約500万社を管理する企業データベースやB2B SaaS基盤において、データの鮮度維持はプロダクトの信頼性を左右する生命線です。国税庁の法人番号公表サイトや経済産業省の `gBizINFO`、ハローワーク求人などは、毎週数万〜数十万件規模で新設登記・商号変更・所在地移転・補助金採択などの更新情報を提供しています。

しかし、稼働中の本番データベース（Production DB）に対してこれらの差分を適用する際、以下のような技術的課題に直面します：

1. **フルインポート（全件洗替）によるダウンタイムの発生**:
   全データを `TRUNCATE` してインポートし直す旧来の手法では、数時間のサービス停止やテーブルロックが発生し、Web APIや検索サービスが利用不能になる
2. **1件ごとの逐次更新によるパフォーマンス破綻**:
   変更があった法人を1行ずつ `SELECT` して `UPDATE` すると、10万件の反映に十数時間以上かかり、CPUやI/Oを圧迫する
3. **インデックス再構築とメモリ枯渇**:
   大量更新によってB-TreeやGINインデックスの肥大化（Bloat）が発生し、検索レスポンスが徐々に劣化する

本記事では、**全国500万社の法人データ基盤（[Kigyou-list](https://kigyoulist.com)）で実運用している、PythonとPostgreSQLを組み合わせた「無停止・高スループット差分同期（Zero-Downtime Delta ETL）アーキテクチャ」**の実装と運用ノウハウを解説します。

---

## 2. システム全体アーキテクチャ

本番稼働中のサービスに一切の読み取りロック（Read Lock）をかけず、ミリ秒単位の検索性能を維持したまま数万件の差分を流し込むため、**「差分抽出（CDC）」➔「ステージング処理」➔「チャンク単位UPSERT」**の分離パイプラインを構築しています。

![高スループット・無停止DELTA ETL＆企業データベース同期パイプライン](https://raw.githubusercontent.com/listkigyou-gif/kigyou-list/main/frontend/public/images/qiita_delta_etl_arch.jpg)

### パイプラインの4ステージ

1. **ステージ1：公的オープンデータ取得 (Data Ingestion)**:
   国税庁の週次差分CSVファイルおよび gBizINFO REST API から更新差分データを非同期にダウンロード
2. **ステージ2：差分検知とハッシュ比較 (CDC & Deduplication)**:
   企業ごとの重要項目（商号・所在地・代表者等）からハッシュ値（SHA-256）を算出し、変更があったレコードのみを特定
3. **ステージ3：ステージング環境でのデータ正規化 (Staging & Enrichment)**:
   法人格の剥奪、カタカナフリガナ補完、AI業界タグ付けを中間ストレージで事前実行（本番DBのCPU負荷をゼロに抑える）
4. **ステージ4：本番PostgreSQLへの無停止バルクUPSERT (Production Sync)**:
   `ON CONFLICT (corporate_number) DO UPDATE` を用い、2,000〜5,000件単位で並行コミット

---

## 3. 実装：Pythonによる差分検知（CDC）とハッシュ比較

数百万行の差分判定を高速に行うため、データベースをフルスキャンするのではなく、レコードの内容からハッシュ値を計算して「実質的な変更」のみを瞬時に抽出します。

```python
import hashlib
import json
from typing import Dict, Any, Tuple

def compute_record_hash(record: Dict[str, Any]) -> str:
    """
    企業の重要項目の値を正規化してSHA-256ハッシュを生成
    空白の違いや表記揺れによる偽陽性（False Positive）更新を防止
    """
    core_values = [
        str(record.get("name", "")).strip(),
        str(record.get("postal_code", "")).strip().replace("-", ""),
        str(record.get("prefecture", "")).strip(),
        str(record.get("city", "")).strip(),
        str(record.get("street_number", "")).strip(),
        str(record.get("representative_name", "")).strip()
    ]
    raw_str = "|".join(core_values)
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

def detect_delta(existing_hash: str, new_record: Dict[str, Any]) -> Tuple[bool, str]:
    """
    既存の保存ハッシュと新規データのハッシュを比較し、更新要否を判定
    """
    new_hash = compute_record_hash(new_record)
    has_changed = (existing_hash != new_hash)
    return has_changed, new_hash
```

この処理により、毎週配布されるオープンデータのうち「実際に情報が更新された企業（通常5万〜10万件程度）」だけを絞り込み、以降の重いDB更新処理を10分の1に削減します。

---

## 4. 実装：PostgreSQLへの無停止バルクUPSERT

本番テーブルに対してロックを発生させず、高速に差分を反映させるためのSQLおよびPythonの実装です。`psycopg2.extras.execute_values` を活用し、単一トランザクションあたりの処理件数を適切に制限します。

### ① 高速UPSERTクエリとロック競合回避設定

```sql
-- トランザクションがWeb検索APIのクエリをブロックしないようlock_timeoutを設定
SET LOCAL lock_timeout = '2s';

-- 差分バルクUPSERTクエリ
INSERT INTO companies (
    corporate_number,
    name,
    clean_name,
    name_kana,
    postal_code,
    prefecture,
    address,
    content_hash,
    updated_at
) VALUES %s
ON CONFLICT (corporate_number) DO UPDATE SET
    name = EXCLUDED.name,
    clean_name = EXCLUDED.clean_name,
    name_kana = COALESCE(EXCLUDED.name_kana, companies.name_kana),
    postal_code = EXCLUDED.postal_code,
    prefecture = EXCLUDED.prefecture,
    address = EXCLUDED.address,
    content_hash = EXCLUDED.content_hash,
    updated_at = CURRENT_TIMESTAMP
WHERE companies.content_hash IS DISTINCT FROM EXCLUDED.content_hash;
```

> **ポイント**: `WHERE companies.content_hash IS DISTINCT FROM EXCLUDED.content_hash` を付与することで、PostgreSQL内部での不要な行ロックとWALログ出力を完全に抑制します。

### ② Pythonによるチャンク分割実行

```python
import psycopg2
from psycopg2.extras import execute_values
from typing import List, Tuple

def sync_chunked_delta(conn, delta_tuples: List[Tuple], chunk_size: int = 3000):
    """
    3,000件ごとのチャンクに分割して本番DBへ無停止UPSERTを実行
    """
    query = """
    INSERT INTO companies (
        corporate_number, name, clean_name, name_kana, postal_code, prefecture, address, content_hash, updated_at
    ) VALUES %s
    ON CONFLICT (corporate_number) DO UPDATE SET
        name = EXCLUDED.name,
        clean_name = EXCLUDED.clean_name,
        name_kana = COALESCE(EXCLUDED.name_kana, companies.name_kana),
        postal_code = EXCLUDED.postal_code,
        prefecture = EXCLUDED.prefecture,
        address = EXCLUDED.address,
        content_hash = EXCLUDED.content_hash,
        updated_at = NOW()
    WHERE companies.content_hash IS DISTINCT FROM EXCLUDED.content_hash;
    """
    
    total = len(delta_tuples)
    for i in range(0, total, chunk_size):
        chunk = delta_tuples[i:i + chunk_size]
        with conn.cursor() as cur:
            # 検索クエリを長時間ブロックしないよう設定
            cur.execute("SET LOCAL lock_timeout = '2000ms';")
            execute_values(cur, query, chunk, page_size=chunk_size)
        conn.commit()
        print(f"[Sync Progress] {min(i + chunk_size, total):,}/{total:,} records synced.")
```

---

## 5. 運用自動化とパイプライン監視（Orchestrator）

このETLパイプラインは、週次でCronやSystemdによって自動トリガーされます。途中でネットワーク切断やAPIエラーが発生しても安全に自動再開（Auto-Resume）できるよう、**「冪等性（Idempotency）」**を確保したオーケストレーターを構成しています。

```python
import subprocess
import time
import sys

def run_step(step_name: str, command: list):
    print(f"\n[*] Starting: {step_name}...")
    t0 = time.time()
    res = subprocess.run(command, text=True, capture_output=True)
    if res.returncode != 0:
        print(f"[-] Failed at {step_name} with error:\n{res.stderr}")
        sys.exit(1)
    print(f"[+] Completed: {step_name} ({time.time() - t0:.1f}s)")

if __name__ == "__main__":
    print("=== Weekly Corporate Data Delta ETL Pipeline ===")
    
    # 1. 国税庁・gBizINFOの差分ファイル取得
    run_step("Fetch Delta Files", ["python", "scripts/fetch_gov_delta.py"])
    
    # 2. ハッシュ比較とステージングDB統合
    run_step("Consolidate Staging", ["python", "scripts/consolidate_data.py", "--delta-only"])
    
    # 3. 新規・更新法人のAIタグ付け
    run_step("AI Tagging Enrichment", ["python", "scripts/ai_tagging_pipeline.py", "--incremental"])
    
    # 4. 本番PostgreSQLへのバルクUPSERT
    run_step("Production PostgreSQL Sync", ["python", "scripts/migrate_to_postgres_incremental.py"])
    
    print("\n[SUCCESS] 5M Corporate DB successfully synchronized without downtime.")
```

---

## 6. まとめと実運用での知見

500万社規模のエンタープライズDBを24時間365日無停止で最新化し続けるためのベストプラクティスです：

1. **本番DBで重い正規化やAI処理を行わない**:
   住所のクレンジング、カタカナ推論、LLMによる業種タグ付けなどはすべて独立したステージング環境（SQLiteや一時ワーカー）で完了させておき、本番DBには完成したタプルのみを流し込む。
2. **チャンクサイズは2,000〜5,000件がスイートスポット**:
   小さすぎるとトランザクションオーバーヘッドが増大し、大きすぎるとロック時間が伸びてWeb検索APIのレイテンシに悪影響を与える。
3. **`IS DISTINCT FROM` による不要更新の遮断**:
   ハッシュ比較によってデータに変更がない行の更新をスキップすることで、PostgreSQLのテーブルBloatとレプリケーション負荷を極小化できる。

本アーキテクチャは、日本全国500万社超の法人オープンデータや求人・補助金インテントデータを最新の状態で提供する企業検索プラットフォーム「[Kigyou-list（kigyoulist.com）](https://kigyoulist.com)」のバックエンドデータエンジンとして日々無停止で稼働しています。

大規模データ基盤のETL設計や継続的インジェスチョンの参考になれば幸いです。
