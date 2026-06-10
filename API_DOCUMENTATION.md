# Kigyou-list 外部データ連携 API 仕様書 (v1)

本仕様書は、Kigyou-list の **BUSINESSプラン** および **ENTERPRISEプラン** をご契約の方向けに提供されている外部連携 API の技術仕様をまとめたものです。
API キーの作成、管理は [マイページ(Dashboard)](/dashboard?tab=developer) から行うことができます。

---

## 1. 共通仕様

### 1.1 API ベース URL
本番環境の API エンドポイントのベースとなる URL です。

```http
https://kigyou-list.jp
```
*(※開発・検証時はローカル環境のポート番号などに変更して動作をご確認いただけます)*

### 1.2 認証方法 (Authentication)
API の認証には **Bearer 認証 (API キー)** を使用します。
HTTP リクエストヘッダーに `Authorization` ヘッダーを付与し、生成した API キーを設定してください。

```http
Authorization: Bearer kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

> [!WARNING]
> API キーはあなたのアカウントの権限を表す重要な情報です。クライアント側のフロントエンドコード(ブラウザ)に直接記述するのではなく、必ずサーバーサイド環境などの安全な場所で管理してください。

### 1.3 利用制限 & 流量制限 (Rate Limiting)
- **1分あたりの最大リクエスト数:** `60` リクエスト / 分 (キー単位)
- **制限超過時の挙動:** 制限を超過した場合、API は HTTP ステータスコード `429 Too Many Requests` を返し、一定時間アクセスがブロックされます。

### 1.4 クォータ（残りダウンロード枠）の消費
API を経由したデータ取得は、ご契約プランの「月間ダウンロード枠」または「追加購入パッケージ（買い切り枠）」の残り枠から差し引かれます。

- API から返却されたデータの**行数 (企業数またはシグナル数) 1件につき、1 クォータ**が消費されます。
- クォータが 0 に達した状態で検索リクエストを行うと、`403 Forbidden (Quota Exhausted)` エラーが返却されます。
- データの件数が 0 件で返却された場合は、クォータは消費されません。

---

## 2. API エンドポイント詳細

### 2.1 クォータ情報取得 API

現在のアカウントのプラン名や、ダウンロード可能な残り件数を取得します。このリクエスト自体ではクォータは消費されません。

- **メソッド:** `GET`
- **エンドポイント:** `/api/v1/quota`
- **認証:** 必須

#### リクエスト例 (cURL)
```bash
curl -X GET "https://kigyou-list.jp/api/v1/quota" \
  -H "Authorization: Bearer kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx"
```

#### レスポンス (200 OK)
```json
{
  "success": true,
  "plan": "business",
  "monthly_base_allowance": 10000,
  "monthly_base_used": 1420,
  "purchased_add_on_balance": 5000,
  "remaining_quota": 13580
}
```

---

### 2.2 企業情報検索 API

指定したフィルタ条件（業界分類、都道府県、キーワード、メールアドレスの有無、各種シグナルの有無）に一致する企業データを取得します。

- **メソッド:** `GET`
- **エンドポイント:** `/api/v1/companies`
- **認証:** 必須
- **クォータ消費:** 返却された企業数 $N$ 件につき $N$ クォータを消費。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 初期値 | 説明 |
| :--- | :--- | :--- | :--- | :--- |
| `keyword` | string | 任意 | - | 企業名、事業内容、住所などの曖昧検索キーワード |
| `prefecture_code` | string | 任意 | - | 都道府県コード (JISコード 2桁。例: `13` = 東京都, `27` = 大阪府) |
| `industry_code` | string | 任意 | - | 産業分類コード |
| `has_email` | string | 任意 | `false` | `"true"` の場合、メールアドレス情報が公開されている企業のみに絞り込み |
| `has_phone` | string | 任意 | `false` | `"true"` の場合、電話番号情報が存在する企業のみに絞り込み |
| `has_website` | string | 任意 | `false` | `"true"` の場合、ホームページURLが存在する企業のみに絞り込み |
| `has_hiring` | string | 任意 | `false` | `"true"` の場合、現在求人募集シグナルがある企業のみに絞り込み |
| `has_subsidy` | string | 任意 | `false` | `"true"` の場合、補助金採択・公募シグナルがある企業のみに絞り込み |
| `has_bidding` | string | 任意 | `false` | `"true"` の場合、入札・調達シグナルがある企業のみに絞り込み |
| `limit` | number | 任意 | `20` | 1回のリクエストで取得する件数上限。最小 `1`、最大 `100` まで設定可能。 |
| `offset` | number | 任意 | `0` | ページネーション時の開始位置（オフセット値）。 |

#### レスポンスヘッダー (Response Headers)
本 API のレスポンスには、リクエスト後に残っているクォータの残高がヘッダーとして追加されます。

- `X-Quota-Limit`: アカウントに付与されている現在の最大利用可能クォータ合計値
- `X-Quota-Remaining`: 本リクエストの処理完了時点での残りクォータ残高

#### リクエスト例 (cURL)
```bash
curl -X GET "https://kigyou-list.jp/api/v1/companies?prefecture_code=13&has_email=true&limit=2" \
  -H "Authorization: Bearer kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx"
```

#### レスポンス (200 OK)
```json
{
  "success": true,
  "count": 2,
  "companies": [
    {
      "id": "cmp_90124",
      "corporate_number": "1010001002003",
      "name": "大和システム開発株式会社",
      "postal_code": "100-0005",
      "prefecture": "東京都",
      "address": "千代田区丸の内1丁目9-1",
      "phone": "03-1234-5678",
      "email": "contact@yamato-sys-dev.co.jp",
      "website": "https://yamato-sys-dev.co.jp",
      "representative": "山田 太郎",
      "industry_name": "情報処理サービス・ソフトウェア",
      "capital": "50,000,000円",
      "employees": "120人",
      "establishment_date": "2008-10-15",
      "has_hiring": true,
      "has_subsidy": false,
      "has_bidding": true
    },
    {
      "id": "cmp_10255",
      "corporate_number": "9010001003445",
      "name": "日本グローバルエージェンシー株式会社",
      "postal_code": "105-0004",
      "prefecture": "東京都",
      "address": "港区新橋2丁目10-2",
      "phone": "03-9876-5432",
      "email": "info@japan-global-agency.com",
      "website": "https://japan-global-agency.com",
      "representative": "鈴木 一郎",
      "industry_name": "人材紹介・派遣業",
      "capital": "20,000,000円",
      "employees": "45人",
      "establishment_date": "2012-05-20",
      "has_hiring": false,
      "has_subsidy": true,
      "has_bidding": false
    }
  ]
}
```

---

### 2.3 企業シグナル (インテント) 検索 API

企業の行動シグナル（求人掲載、補助金採択、特許申請、調達情報、入札情報など）に絞って履歴データを取得します。

- **メソッド:** `GET`
- **エンドポイント:** `/api/v1/signals`
- **認証:** 必須
- **クォータ消費:** 返却されたシグナルレコード $N$ 件につき $N$ クォータを消費。

#### クエリパラメータ

| パラメータ名 | 型 | 必須 | 初期値 | 説明 |
| :--- | :--- | :--- | :--- | :--- |
| `corporate_number` | string | 任意 | - | 特定企業(13桁の法人番号)に絞り込んで取得したい場合に指定 |
| `signal_type` | string | 任意 | - | シグナル種別によるフィルタ。下記のいずれかを指定可能：<br>`求人中`, `補助金`, `特許`, `調達`, `表彰`, `届出・認定` |

#### リクエスト例 (cURL)
```bash
curl -X GET "https://kigyou-list.jp/api/v1/signals?signal_type=%E6%B1%82%E4%BA%BA%E4%B8%AD" \
  -H "Authorization: Bearer kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx"
```

#### レスポンス (200 OK)
```json
{
  "success": true,
  "count": 1,
  "signals": [
    {
      "id": "sig_55041",
      "corporate_number": "1010001002003",
      "company_name": "大和システム開発株式会社",
      "signal_type": "求人中",
      "title": "自社WebサービスのNext.jsフルスタックエンジニア募集",
      "description": "主要求人媒体に新規で開発エンジニアの採用募集が掲載されました。想定年収は500万〜800万円で、リモートワーク可の案件です。",
      "source_url": "https://example-jobs.com/detail/12345",
      "published_at": "2026-05-25T15:00:00.000Z",
      "created_at": "2026-05-26T01:23:45.000Z"
    }
  ]
}
```

---

## 3. エラーレスポンス (Errors)

API の処理中にエラーが発生した場合は、対応する HTTP ステータスコードと共に下記の形式で JSON レスポンスが返却されます。

```json
{
  "error": "エラーメッセージの内容がここに表示されます。"
}
```

### 主な HTTP ステータスコード

| ステータスコード | エラータイプ | 説明 / 対処法 |
| :--- | :--- | :--- |
| `400 Bad Request` | パラメータ不正 | `limit` に 100 を超える値を指定した場合や、パラメータの型が誤っている場合。 |
| `401 Unauthorized` | 認証エラー | `Authorization` ヘッダーが存在しない、または API キーが失効 (Revoked) している場合。 |
| `403 Forbidden` | 権限・容量エラー | BUSINESS以上の契約プランに達していない(FREE/PRO等)、またはクォータの残高が 0 の場合。 |
| `429 Too Many Requests` | 流量制限エラー | 1分間あたりのリクエスト制限 (60回) を超過した場合。少し時間を置いて再試行してください。 |
| `500 Internal Server Error`| サーバー内エラー | システム内部で予kぬ問題が発生した場合。サポート窓口までご連絡ください。 |

---

## 4. プログラミング言語別の実装コードサンプル

### 4.1 Python (requests パッケージを使用)

```python
import requests

api_key = "kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx"
headers = {
    "Authorization": f"Bearer {api_key}"
}

# 1. 残りクォータの確認
quota_response = requests.get("https://kigyou-list.jp/api/v1/quota", headers=headers)
print("Quota details:", quota_response.json())

# 2. 東京都(13)でメールアドレスありの企業を5件取得
params = {
    "prefecture_code": "13",
    "has_email": "true",
    "limit": 5
}
companies_response = requests.get(
    "https://kigyou-list.jp/api/v1/companies",
    headers=headers,
    params=params
)

if companies_response.status_code == 200:
    data = companies_response.json()
    print(f"取得件数: {data['count']} 件")
    for company in data['companies']:
        print(f"- {company['name']} ({company['email']})")
    
    # レスポンスヘッダーから残りのクォータを取得
    remaining = companies_response.headers.get("X-Quota-Remaining")
    print(f"残クォータ: {remaining}")
else:
    print("エラーが発生しました:", companies_response.json())
```

### 4.2 Node.js (fetch API - ES Modules / Next.js)

```javascript
const apiKey = "kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx";

async function fetchCompanies() {
  const url = new URL("https://kigyou-list.jp/api/v1/companies");
  url.searchParams.append("prefecture_code", "13");
  url.searchParams.append("has_email", "true");
  url.searchParams.append("limit", "5");

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`API Error: ${err.error}`);
    }

    const data = await response.json();
    console.log(`取得件数: ${data.count} 件`);
    data.companies.forEach(company => {
      console.log(`- ${company.name} (${company.email || 'メールアドレスなし'})`);
    });

    // クォータ残量の確認
    console.log("残りクォータ(ヘッダー):", response.headers.get("x-quota-remaining"));
  } catch (error) {
    console.error("エラーが発生しました:", error.message);
  }
}

fetchCompanies();
```
