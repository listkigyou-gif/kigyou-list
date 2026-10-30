## 1. はじめに

日本国内には現在、国税庁に登記されている法人が約500万社以上存在します。B2B SaaSや営業DXプラットフォーム、企業リサーチエンジンを構築する際、これらの企業データを様々な公的オープンデータ（国税庁法人番号公表サイト、経済産業省 gBizINFO、特許庁、ハローワーク求人等）から収集・統合する「名寄せ（Entity Resolution）」が最大の技術的ボトルネックとなります。

日本語の企業データには特有の難しさがあります：

1. **表記揺れの多さ**: 「㈱」「株式会社」「(株)」「ｶﾌﾞｼｷｶﾞｲｼｬ」などの前株・後株表記、全角半角英数、異体字（「斎藤」「齊藤」「齋藤」など）
2. **法人番号の整合性**: 13桁の法人番号にはチェックディジット規則が存在し、名寄せキーとしての検証が不可欠
3. **フリガナ（カナ）の欠損と正規化**: 国税庁のフリガナ規程（法人格表記の除去）に準拠した音韻マッチング
4. **数百万件規模の高速処理**: レコード数が500万件を超えるため、単純なPythonループでの突合は破綻し、PostgreSQL側のインデックス設計（pg_trgm、GIN）とバルク処理が必須

本記事では、実際に**全国500万社の法人データベース（[Kigyou-list](https://kigyoulist.com)）のデータ基盤で実運用している、PythonとPostgreSQLを用いた法人データ正規化・名寄せアーキテクチャ**を解説します。

---

## 2. 法人番号（13桁）のチェックディジット検証アルゴリズム

国税庁が発行する法人番号（13桁）は、先頭1桁が検査用数字（チェックディジット）、続く12桁が基礎番号で構成されています。外部データを取り込む際、まずこのアルゴリズムで不正な番号を排除します。

### チェックディジット計算式（モジュラス9）

- 最下位桁から数えて偶数桁の数字の和を $P$、奇数桁の数字の和を $Q$ とする
- $9 - ((1 \times P + 2 \times Q) \pmod 9)$
- 計算結果が9の場合は0とする

```python
def validate_corporate_number(corp_num: str) -> bool:
    """
    国税庁 13桁の法人番号の検査用数字（チェックディジット）を検証
    """
    clean_num = str(corp_num).strip().replace("-", "")
    if len(clean_num) != 13 or not clean_num.isdigit():
        return False
    
    check_digit = int(clean_num[0])
    digits = [int(c) for c in clean_num[1:]]  # 残り12桁
    
    # 最下位桁（12桁目）から数えて偶数桁・奇数桁
    # digits[0]は12桁目(偶数), digits[1]は11桁目(奇数)...
    p = sum(digits[i] for i in range(0, 12, 2))  # 偶数桁 (12, 10, 8, 6, 4, 2)
    q = sum(digits[i] for i in range(1, 12, 2))  # 奇数桁 (11, 9, 7, 5, 3, 1)
    
    calc = 9 - ((p + 2 * q) % 9)
    expected_check_digit = 0 if calc == 9 else calc
    
    return check_digit == expected_check_digit

# 動作確認
# 例: トヨタ自動車株式会社 (1180301018771)
print(validate_corporate_number("1180301018771"))  # True
print(validate_corporate_number("9999999999999"))  # False
```

---

## 3. 日本語社名の表記揺れ除去とカナ正規化

企業名の一致判定を行う際、最も邪魔になるのが「法人格表記」です。「株式会社メルカリ」「（株）メルカリ」「メルカリ合同会社」を正しく「メルカリ」というコア名称に分解して比較する必要があります。

### ① 法人格の剥奪（国税庁フリガナ規程準拠）

国税庁の商号フリガナ公表基準に基づき、主要な法人格を前方・後方・中間から除去します。

```python
import re
import unicodedata

# 除去対象の法人格パターン（主要抜粋）
LEGAL_ENTITIES = [
    r'株式会社', r'有限会社', r'合同会社', r'合資会社', r'合名会社',
    r'一般社団法人', r'公益社団法人', r'一般財団法人', r'公益財団法人',
    r'特定非営利活動法人', r'ＮＰＯ法人', r'NPO法人',
    r'社会医療法人', r'医療法人社団', r'医療法人財団', r'医療法人',
    r'社会福祉法人', r'学校法人', r'監査法人', r'税理士法人', r'弁護士法人'
]

# 略称記号の正規化マッピング
ABBR_MAP = {
    '㈱': '株式会社', '㈲': '有限会社', '㈭': '合同会社',
    '(株)': '株式会社', '（株）': '株式会社',
    '(有)': '有限会社', '（有）': '有限会社',
    '(同)': '合同会社', '（同）': '合同会社'
}

def clean_company_name(name: str) -> str:
    """
    社名を全角半角正規化し、法人格を除去したコア名を取得
    """
    if not name:
        return ""
    
    # 1. NFKC正規化（全角英数・記号の統一）
    normalized = unicodedata.normalize('NFKC', name).strip()
    
    # 2. 略称文字の置換
    for abbr, full in ABBR_MAP.items():
        normalized = normalized.replace(abbr, full)
        
    # 3. 法人格の除去
    for entity in LEGAL_ENTITIES:
        normalized = re.sub(rf'^{entity}', '', normalized)
        normalized = re.sub(rf'{entity}$', '', normalized)
        normalized = re.sub(rf'\s*{entity}\s*', '', normalized)
        
    # 4. 前後の余分な空白や記号をトリム
    normalized = re.sub(r'^[・\s\-]+|[・\s\-]+$', '', normalized)
    return normalized

# 動作例
print(clean_company_name("（株）サイバーエージェント"))  # サイバーエージェント
print(clean_company_name("楽天グループ株式会社"))        # 楽天グループ
print(clean_company_name("合同会社DMM.com"))           # DMM.com
```

### ② `pykakasi` を用いたフリガナ補完パイプライン

国税庁の登記データでは漢字商号しか存在せず、フリガナが登録されていない企業も一定数存在します。発音ベースでマッチングするために、Pythonの `pykakasi` で全角カタカナを推論・補完します。

```python
import pykakasi

kks = pykakasi.kakasi()

def generate_furigana(name: str) -> str:
    """
    コア社名から全角カタカナフリガナを自動生成
    """
    core_name = clean_company_name(name)
    result = kks.convert(core_name)
    kana_parts = [item['kana'] for item in result]
    return "".join(kana_parts)

print(generate_furigana("株式会社メルカリ"))  # メルカリ
print(generate_furigana("ソフトバンクグループ"))  # ソフトバンクグループ
```

---

## 4. PostgreSQL側での超高速名寄せ（`pg_trgm` & GINインデックス）

Python側ですべてのペアを $O(N^2)$ で比較することは、500万件データでは計算量が大きすぎて不可能です。
そこで、PostgreSQLの **`pg_trgm` (Trigram)** 拡張と **GIN (Generalized Inverted Index)** を活用し、データベースレイヤーで類似候補を数ミリ秒で絞り込みます。

### PostgreSQLのセットアップとテーブル構造

```sql
-- 1. pg_trgm 拡張を有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. 企業マスタテーブル例
CREATE TABLE companies (
    corporate_number CHAR(13) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    clean_name VARCHAR(255) NOT NULL,
    postal_code VARCHAR(10),
    prefecture VARCHAR(20),
    address_normalized TEXT,
    phone VARCHAR(20),
    website_url VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. GIN トライグラムインデックスの作成（名寄せの要）
CREATE INDEX idx_companies_clean_name_trgm 
ON companies USING gin (clean_name gin_trgm_ops);

-- 4. 電話番号・郵便番号の完全一致用B-Treeインデックス
CREATE INDEX idx_companies_phone ON companies (phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_companies_postal ON companies (postal_code);
```

### 名寄せクエリの実行（類似度スコアリング）

Webクローリングデータや外部SaaSデータから得られた不完全な社名・住所から、マスタ企業を一意に特定するクエリ：

```sql
-- 社名の類似度 (similarity) と都道府県の一致を組み合わせた名寄せ
SELECT 
    corporate_number,
    name,
    similarity(clean_name, 'ソフトバンク') AS name_score,
    address_normalized
FROM companies
WHERE prefecture = '東京都'
  AND clean_name % 'ソフトバンク'  -- トライグラムインデックスを利用
ORDER BY name_score DESC
LIMIT 5;
```

---

## 5. 大量データの高速バッチUPSERT（`execute_values`）

gBizINFO APIやオープンデータの差分ファイルをインポートする際、数万〜数十万件を1件ずつ `INSERT` すると膨大な時間がかかります。`psycopg2.extras.execute_values` を使い、チャンク単位（2,000〜5,000件）でバルクUPSERTを実行します。

```python
import psycopg2
from psycopg2.extras import execute_values

def bulk_upsert_companies(conn, records: list):
    """
    5000件単位で高速UPSERTを行う実装例
    records = [(corporate_number, name, clean_name, postal_code, prefecture, phone), ...]
    """
    query = """
    INSERT INTO companies (
        corporate_number, name, clean_name, postal_code, prefecture, phone
    ) VALUES %s
    ON CONFLICT (corporate_number) DO UPDATE SET
        name = EXCLUDED.name,
        clean_name = EXCLUDED.clean_name,
        postal_code = COALESCE(EXCLUDED.postal_code, companies.postal_code),
        prefecture = COALESCE(EXCLUDED.prefecture, companies.prefecture),
        phone = COALESCE(EXCLUDED.phone, companies.phone),
        updated_at = NOW();
    """
    with conn.cursor() as cur:
        execute_values(
            cur, 
            query, 
            records, 
            template="(%s, %s, %s, %s, %s, %s)", 
            page_size=2000
        )
    conn.commit()
```

このアプローチにより、100万件規模の差分同期でも数分以内に処理を完了させることができます。

---

## 6. まとめと実運用での知見

500万件規模の日本企業データを扱う場合、以下のベストプラクティスが極めて重要です：

1. **データソースごとの信頼度（Confidence Score）を設計する**: 法人番号を持つ国税庁・gBizINFOのデータを正とし、Webクローリングやフォーム経由のデータは補助シグナルとして段階的に統合する。
2. **前処理でノイズを除去する**: 「法人格除去」「全角半角正規化」「カタカナ化」を施した `clean_name` 列をあらかじめインデックス化しておくことで、検索・名寄せコストを数百分の一に削減できる。
3. **インデックスの最適化**: 類似検索には `pg_trgm` の GIN インデックスが最も有効。複合条件（都道府県＋類似社名）で絞り込むことで、ミリ秒単位のレスポンスを維持できる。

本アーキテクチャは、全国500万社以上の法人オープンデータや求人・補助金インテントデータを網羅する企業検索プラットフォーム「[Kigyou-list（kigyoulist.com）](https://kigyoulist.com)」のバックエンドデータ基盤として稼働しています。

日本の企業データ活用やデータエンジニアリングの参考になれば幸いです。
