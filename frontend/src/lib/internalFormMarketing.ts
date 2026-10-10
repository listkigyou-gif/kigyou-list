import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export interface FormTargetFilters {
  prefecture_name?: string;
  industry_code?: string;
  min_employees?: number;
  has_website?: boolean;
  exclude_recent_days?: number;
}

export interface FormCompanyRecipient {
  corporate_number: string;
  company_name: string;
  representative_name: string | null;
  contact_form_url: string;
  prefecture_name: string | null;
  city_name: string | null;
  website_url: string | null;
  employee_count: number | null;
  last_form_dm_sent_at: string | null;
}

export interface InternalFormCampaign {
  id: string;
  name: string;
  sender_company: string;
  sender_name: string;
  sender_furigana: string | null;
  sender_email: string;
  sender_phone: string | null;
  sender_website: string | null;
  subject: string;
  message_body: string;
  target_filters: FormTargetFilters;
  total_targeted: number;
  sent_count: number;
  skipped_count: number;
  failed_count: number;
  status: 'draft' | 'ready' | 'processing' | 'completed' | 'failed' | 'paused';
  execution_mode: 'local_warp' | 'server_proxy';
  report_file_url: string | null;
  duration_seconds: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalFormSendLog {
  id: number;
  campaign_id: string;
  corporate_number: string | null;
  company_name: string | null;
  form_url: string;
  prefecture_name: string | null;
  website_url: string | null;
  status: 'SUCCESS_SENT' | 'SKIPPED_DISCLAIMER' | 'BLOCKED_CAPTCHA' | 'BLOCKED_WAF' | 'FAILED_SELECTOR' | 'FAILED_TIMEOUT';
  message: string | null;
  sent_at: string;
}

export interface InternalCampaignPreset {
  id: string;
  name: string;
  category: string;
  target_recommendation: string;
  default_filters: FormTargetFilters;
  sender_company: string;
  sender_name: string;
  sender_furigana: string;
  sender_email: string;
  sender_phone: string;
  sender_website: string;
  subject: string;
  body: string;
}

export const INTERNAL_CAMPAIGN_PRESETS: InternalCampaignPreset[] = [
  {
    id: "preset_kigyou_b2b_database",
    name: "【主力商品】500万社 法人リスト・新規開拓DX（コスト70%削減）",
    category: "b2b_database",
    target_recommendation: "B2B・卸売業・各種サービス業・不動産・広告代理店全般",
    default_filters: {
      prefecture_name: "all",
      industry_code: "all",
      min_employees: 10,
      has_website: true,
      exclude_recent_days: 60,
    },
    sender_company: "TQC株式会社（Kigyou-list 運営事務局）",
    sender_name: "栗本 賢之",
    sender_furigana: "クリモト ヨシユキ",
    sender_email: "info@kigyoulist.com",
    sender_phone: "03-6907-1219",
    sender_website: "https://kigyoulist.com",
    subject: "【新規開拓の効率化】国内500万社・Webフォーム窓口付き企業リストのご案内",
    body: `{{company_name}}
営業責任者様 / 新規事業開発ご担当者様

貴社Webサイトの問い合わせ窓口より大変恐れ入ります。
TQC株式会社・Kigyou-list運営事務局の栗本と申します。

突然のご連絡にて大変恐縮ではございますが、貴社の【新規顧客開拓・営業リスト収集のコスト削減】をご支援できる法人データベースサービスのご案内でお問い合わせをさせていただきました。

現在、多くの企業様において「営業リストの作成に工数がかかりすぎる」「大手調査会社の購入費用が高額すぎる」といった課題を抱えていらっしゃいます。

弊社が運営する「Kigyou-list（企業リスト）」は、国税庁法人番号公表サイトおよび経済産業省gBizINFOをベースとした【日本全国500万社超の法人データベース】を常時最新で提供しております。

■ サービスの特徴と強み：
1. 圧倒的なコストパフォーマンス：月額2,900円（税込）からご利用可能（従来比70%以上のコスト削減）
2. 精緻なターゲティング：47都道府県、99のJSIC産業分類、従業員規模、資本金等で瞬時に絞り込み
3. アプローチ窓口を完全網羅：会社名・所在地はもちろん、公式Webサイト・問い合わせフォームURL・代表電話をワンクリックでCSV一括出力

まずは無料登録にて、1日20件まで実際の企業リストを無料ダウンロードしてお試しいただけます。

▼ 500万社企業データベース・無料ダウンロードはこちら：
https://kigyoulist.com/ja?utm_source=form_dm&utm_medium=outreach&utm_campaign=b2b_db

ご多忙の折、大変恐縮ではございますが、新規開拓の一助としてご検討いただけますと幸いに存じます。

--------------------------------------------------
【特定商取引法第11条に基づく送信者情報】
販売業者：TQC株式会社（登録番号: T4013301048678）
サービス名：Kigyou-list（500万社企業データベース）
所在地：〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F
担当責任者：栗本 賢之
電話番号：03-6907-1219
メール：info@kigyoulist.com
URL：https://kigyoulist.com

※本メッセージは貴社のWebフォーム公開趣旨に基づきご提案をお送りしております。
※万が一、今後このようなご案内がご不要な場合は、大変お手数ですがその旨をご返信いただけますと幸いです。速やかに以降の送信除外リストへ登録いたします。
--------------------------------------------------`
  },
  {
    id: "preset_kigyou_form_agency",
    name: "【成約率UP】問い合わせフォーム営業代行（AI営業禁止自動除外付き）",
    category: "form_agency",
    target_recommendation: "IT・SaaS企業・Web制作・コンサルティング・B2Bサービス企業",
    default_filters: {
      prefecture_name: "東京都",
      industry_code: "G",
      min_employees: 10,
      has_website: true,
      exclude_recent_days: 60,
    },
    sender_company: "TQC株式会社（Kigyou-list 営業推進部）",
    sender_name: "栗本 賢之",
    sender_furigana: "クリモト ヨシユキ",
    sender_email: "info@kigyoulist.com",
    sender_phone: "03-6907-1219",
    sender_website: "https://kigyoulist.com/ja/form-marketing",
    subject: "【アポ獲得DX】AI安全除外付き・問い合わせフォーム営業代行のご提案",
    body: `{{company_name}}
営業推進責任者様 / マーケティングご担当者様

貴社のWeb問い合わせ窓口より突然のご連絡にて大変恐縮でございます。
TQC株式会社の栗本と申します。

貴社サービスの認知拡大および新規アポイント獲得をご支援したく、ご連絡を差し上げました。

現在、テレアポの接続率低下やコールドメールの迷惑メール（Spam）判定にお困りの企業様が増加しております。
そうした中、決裁権を持つ部署・担当者に直接メッセージが届く【問い合わせフォーム営業（Form DM Outreach）】が最も到達率の高いB2B開拓手法として注目されています。

弊社では、500万社データベースの基盤を活かした【完全自動化・フォーム営業代行ソリューション】を提供しております。

■ 弊社のフォーム営業代行の強み：
1. 業界最高水準の到達率（85〜90%）：受信用共有メールやSlackに直接通知され、高い精読率を実現
2. ブランドセーフティ（AI自動除外）：Webサイト上の「営業お断り」「セールス禁止」文言をAIが瞬時に判定し、クレームリスクのある企業を自動でスキップ
3. 圧倒的な低価格：1件あたり13.8円〜（成功課金型、未送信・スキップ分は100%返金）
4. 詳細な監査レポート：送信日時・送信先URL・ステータスを記載したCSVレポートを管理画面から即座にダウンロード可能

テスト配信（1,000件〜）から大規模アプローチまで柔軟に対応可能です。

▼ 問い合わせフォーム営業代行・詳細・お申し込みはこちら：
https://kigyoulist.com/ja/form-marketing?utm_source=form_dm&utm_medium=outreach&utm_campaign=form_agency

貴社のアポイント獲得数の最大化に貢献できれば幸いでございます。
何卒よろしくお願い申し上げます。

--------------------------------------------------
【特定商取引法第11条に基づく送信者情報】
販売業者：TQC株式会社（登録番号: T4013301048678）
所在地：〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F
担当責任者：栗本 賢之
電話番号：03-6907-1219
メール：info@kigyoulist.com
サービスURL：https://kigyoulist.com/ja/form-marketing

※本連絡が不要な場合は、大変お手数ですが本メール/返信にてその旨をお知らせいただけますと幸いです。
--------------------------------------------------`
  },
  {
    id: "preset_kigyou_free_claim",
    name: "【関係構築型】貴社企業ページの公式認証・無料掲載のご案内（クレームゼロ）",
    category: "free_claim",
    target_recommendation: "日本全国の中小企業・スタートアップ・地方企業（全業種）",
    default_filters: {
      prefecture_name: "all",
      industry_code: "all",
      min_employees: 5,
      has_website: true,
      exclude_recent_days: 90,
    },
    sender_company: "TQC株式会社（Kigyou-list 企業情報管理チーム）",
    sender_name: "栗本 賢之",
    sender_furigana: "クリモト ヨシユキ",
    sender_email: "info@kigyoulist.com",
    sender_phone: "03-6907-1219",
    sender_website: "https://kigyoulist.com",
    subject: "【公式認証・無料掲載】国内最大級企業DB「Kigyou-list」掲載情報のご確認のお願い",
    body: `{{company_name}}
広報ご担当者様 / 経営企画室様 / 代表者様

突然のご連絡にて大変恐縮でございます。
国内最大級の企業情報ポータル「Kigyou-list」運営事務局（TQC株式会社）の栗本と申します。

この度、公的オープンデータ（国税庁法人番号および経済産業省gBizINFO等）に基づき、
弊社プラットフォーム上に【{{company_name}} 様の企業詳細ページ】が開設・更新されましたことをご案内申し上げます。

現在、月間数十万人規模のビジネスユーザー（B2Bバイヤー、提携先検討企業、求職者）が弊社サイトを利用しております。

つきましては、貴社の情報発信力強化および認知度向上のため、
【公式企業認証（オーナー権限取得・完全無料）】をご案内させていただきたく存じます。

■ 公式認証（Claim）の無料メリット：
・自社公式ロゴ・事業概要・PR写真の自由な更新・編集
・貴社公式サイトへの被リンク（SEO効果・DoFollowリンク）の獲得
・取扱サービス・採用情報の無料アピール
・認証バッジの付与による社会的信頼性の向上

※一切の費用（初期費用・月額費用・維持費）はかかりません。完全無料でご利用いただけます。

貴社の掲載状況のご確認および公式認証は、以下の公式サイトよりご確認いただけます：
▼ Kigyou-list トップページより貴社名を検索してください：
https://kigyoulist.com/ja

貴社のWebプレゼンス拡大およびビジネスマッチングの一助となれば幸いに存じます。

--------------------------------------------------
【発信元・特定商取引法表示】
TQC株式会社・Kigyou-list 企業情報管理チーム
所在地：〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F
担当責任者：栗本 賢之
電話番号：03-6907-1219
メールアドレス：info@kigyoulist.com
URL：https://kigyoulist.com

※情報確認に関するご案内となりますが、今後の連絡が不要な場合は大変お手数ですがご返信にてお知らせください。
--------------------------------------------------`
  },
  {
    id: "preset_kigyou_corporate_api",
    name: "【技術・システム連携】国内500万社 法人データAPI・システム組込みのご案内",
    category: "api_solution",
    target_recommendation: "SaaS・CRM・ERP・フィンテック・会員登録制Webサービス企業",
    default_filters: {
      prefecture_name: "all",
      industry_code: "G",
      min_employees: 30,
      has_website: true,
      exclude_recent_days: 60,
    },
    sender_company: "TQC株式会社（Kigyou-list APIソリューション事業部）",
    sender_name: "栗本 賢之",
    sender_furigana: "クリモト ヨシユキ",
    sender_email: "info@kigyoulist.com",
    sender_phone: "03-6907-1219",
    sender_website: "https://kigyoulist.com",
    subject: "【開発工数削減】国内500万社・法人データAPI連携（REST API）のご案内",
    body: `{{company_name}}
開発責任者様 / プロダクトマネージャー様 / CTO様

貴社Web問い合わせ窓口より突然のご連絡失礼いたします。
TQC株式会社・Kigyou-list API事業部の栗本と申します。

貴社が開発・運営されているWebシステムやクラウドサービスにおいて、
「ユーザー登録時の法人情報自動補完」や「企業マスターデータのクレンジング」の効率化をご支援できればと思い、ご連絡いたしました。

弊社では、500万社以上の日本法人データを高速レスポンス（平均50ms）で取得できる【法人データ連携REST API】を提供しております。

■ Kigyou-list APIの主なユースケース：
1. 登録フォームの自動入力：法人番号や企業名を入力するだけで、住所・代表者・電話・URLを自動補完し、フォーム離脱率を大幅改善
2. CRM/SFAのデータエンリッチメント：リード情報に産業分類・規模・売上・資本金データを自動付与
3. 取引先審査・コンプライアンスチェックの自動化

■ 開発者向けメリット：
・モダンなREST API（JSONレスポンス、OpenAPI仕様準拠）
・高可用性（99.9%以上のSLA）
・従量課金または月額固定プランで、大手信用調査機関API比50%以上のコストカット

テスト環境（Sandbox APIキー）を即時発行可能です。

▼ 法人API仕様・お問い合わせはこちら：
https://kigyoulist.com/ja/pricing?utm_source=form_dm&utm_medium=outreach&utm_campaign=api

貴社サービスのUX向上・開発工数削減に貢献できれば幸いです。

--------------------------------------------------
【特定商取引法に基づく表記】
販売業者：TQC株式会社（登録番号: T4013301048678）
所在地：〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F
担当責任者：栗本 賢之
電話番号：03-6907-1219
メール：info@kigyoulist.com
URL：https://kigyoulist.com
※配信停止をご希望の場合は大変恐縮ですが本返信にてお知らせください。
--------------------------------------------------`
  },
  {
    id: "preset_kigyou_recruiting_intent",
    name: "【採用・求人連携】直近で求人募集中の企業リスト・人材紹介開拓のご案内",
    category: "recruitment",
    target_recommendation: "人材紹介・派遣会社・採用コンサルティング・求人広告代理店",
    default_filters: {
      prefecture_name: "all",
      industry_code: "L",
      min_employees: 10,
      has_website: true,
      exclude_recent_days: 60,
    },
    sender_company: "TQC株式会社（Kigyou-list 採用ソリューション部）",
    sender_name: "栗本 賢之",
    sender_furigana: "クリモト ヨシユキ",
    sender_email: "info@kigyoulist.com",
    sender_phone: "03-6907-1219",
    sender_website: "https://kigyoulist.com",
    subject: "【採用ニーズ検知】直近で求人募集中の企業リスト・人材紹介開拓のご案内",
    body: `{{company_name}}
人材紹介ご責任者様 / 営業推進担当者様

Webサイトより突然のご連絡にて大変恐縮でございます。
TQC株式会社の栗本と申します。

人材紹介・派遣ビジネスにおける新規求人案件の開拓をご支援したく、ご連絡を差し上げました。

「求人ニーズのない企業に電話・メールをしてしまい、営業効率が上がらない」
という課題をお持ちではございませんでしょうか。

弊社が運営する「Kigyou-list」では、日本全国500万社の企業情報に加え、
ハローワークや公的機関の採用シグナルを常時クローリング・解析し、【現在進行形で中途採用・求人募集を行っている企業のみを抽出したリスト】をご提供しております。

■ 採用支援特化リストのメリット：
1. 採用意欲の高い企業に絞り込み：無駄なコールドコールをゼロにし、求人案件獲得率を劇的に向上
2. 職種・勤務地・給与条件で検索可能：貴社の保有求職者属性にマッチした企業へ即時アプローチ
3. 採用担当窓口・問い合わせフォームURLを網羅：スムーズなアポイント獲得が可能

月額2,900円からすぐにリストダウンロードをご活用いただけます。

▼ 採用シグナル付き企業データベースの詳細はこちら：
https://kigyoulist.com/ja/search?utm_source=form_dm&utm_medium=outreach&utm_campaign=recruitment

何卒よろしくお願い申し上げます。

--------------------------------------------------
【特定商取引法第11条に基づく送信者情報】
販売業者：TQC株式会社（登録番号: T4013301048678）
所在地：〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F
担当責任者：栗本 賢之
電話番号：03-6907-1219
メール：info@kigyoulist.com
URL：https://kigyoulist.com
※配信停止をご希望の場合は本返信にてお知らせください。
--------------------------------------------------`
  }
];

// 1. Get Stats for Admin Dashboard
export async function getInternalFormMarketingStats() {
  const client = await pool.connect();
  try {
    const totalFormsRes = await client.query(`
      SELECT count(1) AS count 
      FROM companies 
      WHERE contact_form_url IS NOT NULL AND contact_form_url != ''
    `);

    const totalSentRes = await client.query(`
      SELECT count(1) AS count FROM internal_form_send_logs WHERE status = 'SUCCESS_SENT'
    `);

    const totalSkippedRes = await client.query(`
      SELECT count(1) AS count FROM internal_form_send_logs WHERE status LIKE 'SKIPPED%' OR status LIKE 'BLOCKED%'
    `);

    const totalCampaignsRes = await client.query(`
      SELECT count(1) AS count FROM internal_form_campaigns
    `);

    // Top prefectures with verified contact forms
    const prefBreakdownRes = await client.query(`
      SELECT prefecture_name, count(1) AS form_count
      FROM companies
      WHERE contact_form_url IS NOT NULL AND contact_form_url != '' AND prefecture_name IS NOT NULL
      GROUP BY prefecture_name
      ORDER BY form_count DESC
      LIMIT 15
    `);

    // Recent 5 campaigns
    const recentCampaignsRes = await client.query(`
      SELECT * FROM internal_form_campaigns ORDER BY created_at DESC LIMIT 5
    `);

    // Major JSIC industries
    const industriesRes = await client.query(`
      SELECT industry_code, industry_name 
      FROM m_industries 
      WHERE classification_level = '大分類' 
      ORDER BY industry_code
    `);

    return {
      total_companies_with_form: parseInt(totalFormsRes.rows[0].count, 10),
      total_sent: parseInt(totalSentRes.rows[0].count, 10),
      total_skipped: parseInt(totalSkippedRes.rows[0].count, 10),
      total_campaigns: parseInt(totalCampaignsRes.rows[0].count, 10),
      top_prefectures: prefBreakdownRes.rows,
      recent_campaigns: recentCampaignsRes.rows,
      industries: industriesRes.rows,
    };
  } finally {
    client.release();
  }
}

// Build query conditions for target audience
function buildFormAudienceWhere(filters: FormTargetFilters) {
  const conditions: string[] = [
    `c.contact_form_url IS NOT NULL`,
    `c.contact_form_url != ''`,
    `c.contact_form_url LIKE 'http%'`
  ];
  const params: any[] = [];
  let paramIdx = 1;

  if (filters.prefecture_name && filters.prefecture_name !== 'all') {
    conditions.push(`c.prefecture_name = $${paramIdx++}`);
    params.push(filters.prefecture_name);
  }

  if (filters.industry_code && filters.industry_code !== 'all') {
    const isMajor = /^[A-Z]$/.test(filters.industry_code);
    if (isMajor) {
      conditions.push(`EXISTS (
        SELECT 1 FROM company_industries ci
        WHERE ci.corporate_number = c.corporate_number
          AND (ci.industry_code = $${paramIdx} OR ci.industry_path LIKE $${paramIdx} || '%')
      )`);
      params.push(filters.industry_code);
      paramIdx++;
    } else {
      conditions.push(`EXISTS (
        SELECT 1 FROM company_industries ci
        WHERE ci.corporate_number = c.corporate_number
          AND (ci.industry_code = $${paramIdx} OR ci.industry_path LIKE '%' || $${paramIdx} || '%')
      )`);
      params.push(filters.industry_code);
      paramIdx++;
    }
  }

  if (filters.min_employees && filters.min_employees > 0) {
    conditions.push(`c.employee_count >= $${paramIdx++}`);
    params.push(filters.min_employees);
  }

  if (filters.has_website) {
    conditions.push(`c.website_url IS NOT NULL AND c.website_url != ''`);
  }

  // Cooldown / Anti-Spam exclusion
  if (filters.exclude_recent_days && filters.exclude_recent_days > 0) {
    conditions.push(`(
      c.last_form_dm_sent_at IS NULL 
      OR c.last_form_dm_sent_at < NOW() - INTERVAL '${Math.floor(filters.exclude_recent_days)} days'
    )`);
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
    nextParamIdx: paramIdx
  };
}

// 2. Count Target Audience
export async function countFormTargetAudience(filters: FormTargetFilters): Promise<number> {
  const client = await pool.connect();
  try {
    const { whereClause, params } = buildFormAudienceWhere(filters);
    const query = `SELECT count(1) AS count FROM companies c WHERE ${whereClause}`;
    const res = await client.query(query, params);
    return parseInt(res.rows[0].count, 10);
  } finally {
    client.release();
  }
}

// 3. Fetch Target Audience Batch
export async function getFormTargetAudienceBatch(
  filters: FormTargetFilters,
  limit: number = 50,
  offset: number = 0
): Promise<FormCompanyRecipient[]> {
  const client = await pool.connect();
  try {
    const { whereClause, params, nextParamIdx } = buildFormAudienceWhere(filters);
    const query = `
      SELECT 
        c.corporate_number,
        c.company_name,
        c.representative_name,
        c.contact_form_url,
        c.prefecture_name,
        c.city_name,
        c.website_url,
        c.employee_count,
        c.last_form_dm_sent_at
      FROM companies c
      WHERE ${whereClause}
      ORDER BY c.employee_count DESC NULLS LAST, c.corporate_number ASC
      LIMIT $${nextParamIdx} OFFSET $${nextParamIdx + 1}
    `;
    const fullParams = [...params, limit, offset];
    const res = await client.query(query, fullParams);
    return res.rows;
  } finally {
    client.release();
  }
}

// 4. Create Campaign
export async function createInternalFormCampaign({
  name,
  sender_company,
  sender_name,
  sender_furigana,
  sender_email,
  sender_phone,
  sender_website,
  subject,
  message_body,
  target_filters,
  total_targeted,
  execution_mode = 'local_warp',
}: {
  name: string;
  sender_company: string;
  sender_name: string;
  sender_furigana?: string;
  sender_email: string;
  sender_phone?: string;
  sender_website?: string;
  subject: string;
  message_body: string;
  target_filters: FormTargetFilters;
  total_targeted: number;
  execution_mode?: 'local_warp' | 'server_proxy';
}): Promise<InternalFormCampaign> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      INSERT INTO internal_form_campaigns (
        name, sender_company, sender_name, sender_furigana, sender_email, sender_phone, sender_website,
        subject, message_body, target_filters, total_targeted, execution_mode, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ready', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
      `,
      [
        name,
        sender_company,
        sender_name,
        sender_furigana || null,
        sender_email,
        sender_phone || null,
        sender_website || null,
        subject,
        message_body,
        JSON.stringify(target_filters),
        total_targeted,
        execution_mode,
      ]
    );
    return res.rows[0];
  } finally {
    client.release();
  }
}

// 5. Record Send Log
export async function recordInternalFormSendLog({
  campaign_id,
  corporate_number,
  company_name,
  form_url,
  prefecture_name,
  website_url,
  status,
  message,
}: {
  campaign_id: string;
  corporate_number?: string | null;
  company_name?: string | null;
  form_url: string;
  prefecture_name?: string | null;
  website_url?: string | null;
  status: 'SUCCESS_SENT' | 'SKIPPED_DISCLAIMER' | 'BLOCKED_CAPTCHA' | 'BLOCKED_WAF' | 'FAILED_SELECTOR' | 'FAILED_TIMEOUT';
  message?: string | null;
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert Log
    await client.query(
      `
      INSERT INTO internal_form_send_logs (
        campaign_id, corporate_number, company_name, form_url, prefecture_name, website_url, status, message, sent_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      `,
      [
        campaign_id,
        corporate_number || null,
        company_name || null,
        form_url,
        prefecture_name || null,
        website_url || null,
        status,
        message || null,
      ]
    );

    // Update Campaign Counter
    if (status === 'SUCCESS_SENT') {
      await client.query(
        `UPDATE internal_form_campaigns SET sent_count = sent_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [campaign_id]
      );
      if (corporate_number) {
        await client.query(
          `UPDATE companies SET last_form_dm_sent_at = CURRENT_TIMESTAMP WHERE corporate_number = $1`,
          [corporate_number]
        );
      }
    } else if (status.startsWith('SKIPPED') || status.startsWith('BLOCKED')) {
      await client.query(
        `UPDATE internal_form_campaigns SET skipped_count = skipped_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [campaign_id]
      );
    } else {
      await client.query(
        `UPDATE internal_form_campaigns SET failed_count = failed_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [campaign_id]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// 6. Complete Campaign
export async function completeInternalFormCampaign({
  campaign_id,
  duration_seconds,
  report_file_url,
}: {
  campaign_id: string;
  duration_seconds?: number;
  report_file_url?: string;
}) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      UPDATE internal_form_campaigns 
      SET status = 'completed', 
          duration_seconds = COALESCE($2, duration_seconds), 
          report_file_url = COALESCE($3, report_file_url),
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [campaign_id, duration_seconds || 0, report_file_url || null]
    );
    return res.rows[0];
  } finally {
    client.release();
  }
}

// 7. Get Campaigns List
export async function getInternalFormCampaigns(limit = 20, offset = 0) {
  const client = await pool.connect();
  try {
    const countRes = await client.query(`SELECT count(1) AS count FROM internal_form_campaigns`);
    const listRes = await client.query(
      `SELECT * FROM internal_form_campaigns ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return {
      total: parseInt(countRes.rows[0].count, 10),
      campaigns: listRes.rows,
    };
  } finally {
    client.release();
  }
}

// 8. Get Campaign Logs
export async function getInternalFormSendLogs({
  campaign_id,
  status,
  limit = 100,
  offset = 0,
}: {
  campaign_id: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const client = await pool.connect();
  try {
    let query = `SELECT * FROM internal_form_send_logs WHERE campaign_id = $1`;
    const params: any[] = [campaign_id];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY sent_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const res = await client.query(query, params);

    const countQuery = status && status !== 'all'
      ? `SELECT count(1) AS count FROM internal_form_send_logs WHERE campaign_id = $1 AND status = $2`
      : `SELECT count(1) AS count FROM internal_form_send_logs WHERE campaign_id = $1`;
    const countParams = status && status !== 'all' ? [campaign_id, status] : [campaign_id];
    const countRes = await client.query(countQuery, countParams);

    return {
      total: parseInt(countRes.rows[0].count, 10),
      logs: res.rows,
    };
  } finally {
    client.release();
  }
}
