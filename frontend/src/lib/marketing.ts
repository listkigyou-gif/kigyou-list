import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export interface TargetFilters {
  prefecture_name?: string;
  industry_code?: string;
  min_employees?: number;
  has_website?: boolean;
  exclude_recent_days?: number;
}

export interface CompanyRecipient {
  corporate_number: string;
  company_name: string;
  representative_name: string | null;
  email_address: string;
  prefecture_name: string | null;
  city_name: string | null;
  website_url: string | null;
  employee_count: number | null;
  last_emailed_at: string | null;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  target_filters: TargetFilters;
  total_targeted: number;
  sent_count: number;
  failed_count: number;
  status: 'draft' | 'sending' | 'completed' | 'paused' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface MarketingSendLog {
  id: number;
  campaign_id: string;
  corporate_number: string | null;
  company_name: string | null;
  recipient_email: string;
  status: 'sent' | 'failed' | 'suppressed';
  error_message: string | null;
  sent_at: string;
}

// Generate secure HMAC token for unsubscribe link
export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.AUTH_SECRET || 'kigyou_marketing_optout_secret_2026';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex').substring(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  const expected = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function buildUnsubscribeUrl(email: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kigyoulist.com';
  const token = generateUnsubscribeToken(email);
  return `${appUrl}/ja/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

// Generate secure HMAC token for 1-click Claim link from marketing email
export function generateClaimToken(corporateNumber: string, email: string): string {
  const secret = process.env.AUTH_SECRET || 'kigyou_company_claim_secret_2026';
  return crypto.createHmac('sha256', secret).update(`${corporateNumber.trim()}:${email.toLowerCase().trim()}`).digest('hex').substring(0, 32);
}

export function verifyClaimToken(corporateNumber: string, email: string, token: string): boolean {
  if (!corporateNumber || !email || !token) return false;
  const expected = generateClaimToken(corporateNumber, email);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function buildClaimUrl(corporateNumber: string, email: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kigyoulist.com';
  const token = generateClaimToken(corporateNumber, email);
  return `${appUrl}/ja/company/${corporateNumber}?claim=1&email=${encodeURIComponent(email)}&claim_token=${token}`;
}

// Built-in Japanese B2B Email Templates with proper Keigo & Tokushoho compliance
export const BUILTIN_TEMPLATES = [
  {
    id: 'intro_kigyou_list',
    name: '【標準】Kigyou-List プラットフォームご紹介（新規開拓・B2Bリサーチ）',
    subject: '【日本全国500万社】法人データベース「Kigyou-List」のご案内（{{company_name}}様）',
    body_html: `<div style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; line-height: 1.8; color: #2d3748; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
  <p style="margin-bottom: 16px;">
    <strong>{{company_name}} 御中</strong><br>
    ご担当者様（{{representative_name}}様）
  </p>
  
  <p style="margin-bottom: 16px;">
    突然のメールにて大変失礼いたします。<br>
    日本全国の企業情報・法人データベースを提供する<strong>「Kigyou-List（企業リスト）」</strong>運営事務局でございます。
  </p>

  <p style="margin-bottom: 16px;">
    弊社では国税庁法人番号公表サイト、官報、各種求人公募データ等を独自に統合し、日本全国500万社を超える最新の法人データベースを構築・提供しております。
  </p>

  <div style="background-color: #f7fafc; border-left: 4px solid #3182ce; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <p style="font-weight: bold; margin-top: 0; margin-bottom: 8px; color: #2b6cb0;">■ Kigyou-List（企業リスト）の主な特徴</p>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4a5568;">
      <li><strong>500万社超の網羅性：</strong>大手から中小企業、自治体まで最新の活動情報を毎日自動更新</li>
      <li><strong>精度の高い連絡先：</strong>電話番号、FAX、オフィシャルサイトURL、採用シグナルを完備</li>
      <li><strong>柔軟なターゲティング：</strong>都道府県、市区町村、資本金、従業員規模、産業中分類（JSIC）で自在に絞り込み</li>
      <li><strong>即時CSV/Excel出力：</strong>営業リスト作成や市場調査の工数を90%削減</li>
    </ul>
  </div>

  <p style="margin-bottom: 20px;">
    貴社（{{prefecture}}）における新規取引先の開拓や、パートナー企業のリサーチ、アライアンス調査にぜひお役立ていただけますと幸いです。
  </p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="https://kigyoulist.com/ja?utm_source=cold_email&utm_medium=marketing&utm_campaign=intro" style="background-color: #2b6cb0; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      Kigyou-List 公式サイトを無料で見る →
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;">

  <div style="font-size: 12px; color: #718096; line-height: 1.6;">
    <p style="margin-bottom: 6px; font-weight: bold; color: #4a5568;">【配信者情報・お問い合わせ】</p>
    <p style="margin: 0;">Kigyou-List 運営事務局（TQC株式会社）</p>
    <p style="margin: 0;">担当責任者：栗本 賢之（クリモト ヨシユキ）</p>
    <p style="margin: 0;">公式サイト: <a href="https://kigyoulist.com" style="color: #3182ce;">https://kigyoulist.com</a></p>
    <p style="margin: 0;">お問い合わせ: <a href="mailto:info@kigyoulist.com" style="color: #3182ce;">info@kigyoulist.com</a></p>
    
    <p style="margin-top: 14px; margin-bottom: 4px; font-size: 11px; color: #a0aec0;">
      ※本メールは、公開されている企業情報および求人情報に基づき、企業活動・B2B支援のご案内として配信しております。<br>
      ※今後このようなご案内メールの配信を希望されない場合は、大変お手数ですが下記の配信停止リンクより解除をお願い申し上げます。
    </p>
    <p style="margin: 4px 0 0 0;">
      <a href="{{unsubscribe_url}}" style="color: #718096; text-decoration: underline;">配信停止（オプトアウト）はこちら</a>
    </p>
  </div>
</div>`
  },
  {
    id: 'free_trial_and_coupon',
    name: '【特典付】新規開拓応援・リストダウンロード無料枠プレゼント',
    subject: '【新規開拓支援】{{company_name}}様限定・法人データ無料ダウンロードのご案内',
    body_html: `<div style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; line-height: 1.8; color: #2d3748; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
  <p style="margin-bottom: 16px;">
    <strong>{{company_name}} 御中</strong><br>
    営業・事業企画ご責任者様（{{representative_name}}様）
  </p>
  
  <p style="margin-bottom: 16px;">
    突然のご連絡にて失礼いたします。<br>
    法人リスト検索・営業DXプラットフォーム<strong>「Kigyou-List」</strong>サポートデスクでございます。
  </p>

  <p style="margin-bottom: 16px;">
    現在、{{prefecture}}をはじめ日本全国でB2B事業を推進される企業様に向けて、営業効率化を支援する<strong>「無料リスト抽出枠プレゼントキャンペーン」</strong>を実施しております。
  </p>

  <div style="background-color: #ebf8ff; border: 1px solid #bee3f8; padding: 18px; margin: 20px 0; border-radius: 6px;">
    <p style="font-weight: bold; margin-top: 0; margin-bottom: 8px; color: #2b6cb0;">🎁 Kigyou-List 営業DX無料特典</p>
    <p style="margin: 0; font-size: 14px; color: #2d3748;">
      無料会員登録を行うだけで、全国500万社の中からご希望の条件（業界、エリア、従業員規模）で絞り込んだ企業リストを、即座にお試しダウンロードいただけます。
    </p>
  </div>

  <div style="text-align: center; margin: 28px 0;">
    <a href="https://kigyoulist.com/ja/pricing?utm_source=cold_email&utm_medium=campaign&utm_campaign=trial" style="background-color: #38a169; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      無料特典の詳細・リスト検索をお試し →
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;">

  <div style="font-size: 12px; color: #718096; line-height: 1.6;">
    <p style="margin-bottom: 6px; font-weight: bold; color: #4a5568;">【送信元情報】</p>
    <p style="margin: 0;">Kigyou-List 運営事務局（TQC株式会社）</p>
    <p style="margin: 0;">担当責任者：栗本 賢之（クリモト ヨシユキ）</p>
    <p style="margin: 0;">公式サイト: <a href="https://kigyoulist.com" style="color: #3182ce;">https://kigyoulist.com</a></p>
    <p style="margin: 0;">お問い合わせ: <a href="mailto:info@kigyoulist.com" style="color: #3182ce;">info@kigyoulist.com</a></p>
    
    <p style="margin-top: 14px; margin-bottom: 4px; font-size: 11px; color: #a0aec0;">
      ※本メールは特定電子メール法および関係法令に基づき、企業公開連絡先へお送りしております。<br>
      ※今後のご案内がご不要な場合は、誠にお手数ですが下記のリンクより配信停止のお手続きをお願いいたします。
    </p>
    <p style="margin: 4px 0 0 0;">
      <a href="{{unsubscribe_url}}" style="color: #718096; text-decoration: underline;">配信停止（オプトアウト）</a>
    </p>
  </div>
</div>`
  },
  {
    id: 'verify_company_profile',
    name: '【公式認証＆特典】企業ページ公式オーナー認証と毎日50件無料ダウンロード枠のご案内',
    subject: '【重要・公式】{{company_name}}様 企業情報確認と公式パートナー認証（1日50件無料枠進呈）について',
    body_html: `<div style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; line-height: 1.8; color: #2d3748; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <p style="margin-bottom: 16px;">
    <strong>{{company_name}} 御中</strong><br>
    広報・総務・営業推進ご担当者様（{{representative_name}}様）
  </p>
  
  <p style="margin-bottom: 16px;">
    突然のご連絡にて大変失礼いたします。<br>
    日本全国500万社の法人データベースポータル<strong>「Kigyou-List」</strong>データ管理事務局でございます。
  </p>

  <p style="margin-bottom: 16px;">
    現在、当ポータル上に掲載されている貴社公式ページ（法人番号: {{corporate_number}}）は、月間多くのB2Bビジネスユーザー、新規取引先候補、および提携希望企業により閲覧されております。
  </p>

  <p style="margin-bottom: 16px;">
    つきましては、貴社の企業情報の正確性と信頼性を高め、さらなるビジネス機会の創出にお役立ていただくため、<strong>「公式オーナー認証プログラム（完全無料）」</strong>のご案内を申し上げます。
  </p>

  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 24px 0; border-radius: 10px;">
    <p style="font-weight: bold; margin-top: 0; margin-bottom: 12px; color: #166534; font-size: 15px;">
      🛡️ 【完全無料】公式パートナー認証の3大特典
    </p>
    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #15803d; line-height: 1.8;">
      <li>
        <strong>公式認証企業バッジ（Verified）の付与：</strong><br>
        企業としての信頼性を公式に証明し、閲覧企業からの問い合わせ率を向上させます。
      </li>
      <li>
        <strong>自社PRメッセージ・専用問い合わせ窓口の直接掲載：</strong><br>
        貴社の強みやサービス紹介、商談受付連絡先をいつでも自由に編集・公開できます。
      </li>
      <li>
        <strong>【限定特別枠】企業リスト無料ダウンロード枠を「毎日50件（月間1,500件）」に永久拡大：</strong><br>
        貴社の新規開拓営業やパートナー発掘にお使いいただける法人リスト（電話・住所・業種等）の無料取得枠を、通常20件から<strong>毎日50件へ大幅アップグレード</strong>いたします。
      </li>
    </ul>
    <p style="margin: 12px 0 0 0; font-size: 11px; color: #15803d; font-weight: bold;">
      ※初期費用・月額費用は一切かかりません。自動で有料プランへ移行することもございません。
    </p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{claim_url}}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.3);">
      貴社公式ページを確認し、無料認証を完了する →
    </a>
    <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b;">
      ※本メール専用の安全な認証リンクです。最短30秒で完了いたします。
    </p>
  </div>

  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0; border-radius: 8px; font-size: 13px;">
    <p style="font-weight: bold; margin-top: 0; margin-bottom: 6px; color: #334155;">■ 現在掲載中の貴社基本情報ページ：</p>
    <p style="margin: 0; word-break: break-all;">
      <a href="{{company_page_url}}" style="color: #2563eb; text-decoration: underline;">{{company_page_url}}</a>
    </p>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
      ※メールアドレスの変更やWEBサイトのリニューアル等により上記リンクで認証できない場合でも、ページ内の<strong>「名刺・書類審査」</strong>より名刺画像をアップロードいただくことで簡単に認証いただけます。
    </p>
  </div>

  <p style="margin-bottom: 24px; font-size: 13px; color: #475569; line-height: 1.7;">
    万一、掲載内容の修正や掲載停止（非公開化）をご希望の場合も、上記ページ内の管理メニューより即時にお手続きいただけます。
  </p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;">

  <div style="font-size: 12px; color: #718096; line-height: 1.6;">
    <p style="margin-bottom: 6px; font-weight: bold; color: #4a5568;">【送信元・運営事務局】</p>
    <p style="margin: 0;">Kigyou-List（企業リスト）運営事務局（TQC株式会社）</p>
    <p style="margin: 0;">担当責任者：栗本 賢之（クリモト ヨシユキ）</p>
    <p style="margin: 0;">公式サイト: <a href="https://kigyoulist.com" style="color: #3182ce;">https://kigyoulist.com</a></p>
    <p style="margin: 0;">お問い合わせ窓口: <a href="mailto:info@kigyoulist.com" style="color: #3182ce;">info@kigyoulist.com</a></p>
    
    <p style="margin-top: 14px; margin-bottom: 4px; font-size: 11px; color: #a0aec0;">
      ※本メールは公知の企業情報（国税庁法人番号公表サイト・公式HP等）に基づき、企業活動・広報支援の一環として配信しております。<br>
      ※特定電子メール法に基づき、今後のご案内がご不要な場合は誠にお手数ですが下記の解除リンクよりお手続きをお願い申し上げます。
    </p>
    <p style="margin: 4px 0 0 0;">
      <a href="{{unsubscribe_url}}" style="color: #718096; text-decoration: underline;">配信停止（オプトアウト）はこちら</a>
    </p>
  </div>
</div>`
  }
];

// Variable replacement engine
export function renderTemplate(
  template: string,
  company: Partial<CompanyRecipient>,
  unsubscribeUrl: string
): string {
  const corporateNumber = company.corporate_number || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kigyoulist.com';
  const companyPageUrl = `${appUrl}/ja/company/${corporateNumber}`;
  const claimUrl = buildClaimUrl(corporateNumber, company.email_address || '');

  return template
    .replace(/\{\{company_name\}\}/g, company.company_name || '貴社')
    .replace(/\{\{representative_name\}\}/g, company.representative_name || '代表者')
    .replace(/\{\{prefecture\}\}/g, company.prefecture_name || '日本全国')
    .replace(/\{\{prefecture_name\}\}/g, company.prefecture_name || '日本全国')
    .replace(/\{\{city\}\}/g, company.city_name || '')
    .replace(/\{\{corporate_number\}\}/g, corporateNumber)
    .replace(/\{\{website_url\}\}/g, company.website_url || '')
    .replace(/\{\{company_page_url\}\}/g, companyPageUrl)
    .replace(/\{\{claim_url\}\}/g, claimUrl)
    .replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl);
}

// 1. Get Marketing Stats
export async function getMarketingStats() {
  const client = await pool.connect();
  try {
    const totalEmailRes = await client.query(`
      SELECT count(1) AS count 
      FROM companies 
      WHERE email_address IS NOT NULL AND email_address != ''
    `);

    const totalSuppressedRes = await client.query(`
      SELECT count(1) AS count FROM marketing_suppressions
    `);

    const totalSentRes = await client.query(`
      SELECT count(1) AS count FROM marketing_send_logs WHERE status = 'sent'
    `);

    const totalCampaignsRes = await client.query(`
      SELECT count(1) AS count FROM marketing_campaigns
    `);

    // Top prefectures with emails
    const prefBreakdownRes = await client.query(`
      SELECT prefecture_name, count(1) AS email_count
      FROM companies
      WHERE email_address IS NOT NULL AND email_address != '' AND prefecture_name IS NOT NULL
      GROUP BY prefecture_name
      ORDER BY email_count DESC
      LIMIT 15
    `);

    // Recent 5 campaigns
    const recentCampaignsRes = await client.query(`
      SELECT * FROM marketing_campaigns ORDER BY created_at DESC LIMIT 5
    `);

    // Major JSIC industries
    const industriesRes = await client.query(`
      SELECT industry_code, industry_name 
      FROM m_industries 
      WHERE classification_level = '大分類' 
      ORDER BY industry_code
    `);

    return {
      total_companies_with_email: parseInt(totalEmailRes.rows[0].count, 10),
      total_suppressed: parseInt(totalSuppressedRes.rows[0].count, 10),
      total_sent: parseInt(totalSentRes.rows[0].count, 10),
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
function buildAudienceWhere(filters: TargetFilters) {
  const conditions: string[] = [
    `c.email_address IS NOT NULL`,
    `c.email_address != ''`,
    `c.email_address LIKE '%@%.%'`,
    // Exclude suppressions
    `NOT EXISTS (
      SELECT 1 FROM marketing_suppressions s 
      WHERE LOWER(s.email) = LOWER(c.email_address)
    )`
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

  const excludeDays = filters.exclude_recent_days ?? 30;
  if (excludeDays > 0) {
    conditions.push(`(c.last_emailed_at IS NULL OR c.last_emailed_at < NOW() - INTERVAL '${excludeDays} days')`);
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
    nextParamIdx: paramIdx
  };
}

// 2. Count Target Audience
export async function countTargetAudience(filters: TargetFilters): Promise<number> {
  const client = await pool.connect();
  try {
    const { whereClause, params } = buildAudienceWhere(filters);
    const query = `SELECT count(1) AS count FROM companies c WHERE ${whereClause}`;
    const res = await client.query(query, params);
    return parseInt(res.rows[0].count, 10);
  } finally {
    client.release();
  }
}

// 3. Fetch Target Audience Batch
export async function getTargetAudienceBatch(
  filters: TargetFilters,
  limit: number = 20,
  offset: number = 0
): Promise<CompanyRecipient[]> {
  const client = await pool.connect();
  try {
    const { whereClause, params, nextParamIdx } = buildAudienceWhere(filters);
    const query = `
      SELECT 
        c.corporate_number,
        c.company_name,
        c.representative_name,
        c.email_address,
        c.prefecture_name,
        c.city_name,
        c.website_url,
        c.employee_count,
        c.last_emailed_at
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

// 4. Send Email via Resend API
export async function sendEmailViaResend({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY is not configured in .env.local' };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Kigyou List <auth@kigyoulist.com>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || JSON.stringify(data) };
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error calling Resend API' };
  }
}

// 5. Add Suppression (Unsubscribe)
export async function addSuppression(email: string, reason: string = 'unsubscribe', corporate_number?: string) {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO marketing_suppressions (email, reason, corporate_number, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (email) DO UPDATE SET reason = EXCLUDED.reason, created_at = NOW()
    `, [email.toLowerCase().trim(), reason, corporate_number || null]);
  } finally {
    client.release();
  }
}

// 6. Remove Suppression
export async function removeSuppression(email: string) {
  const client = await pool.connect();
  try {
    await client.query(`
      DELETE FROM marketing_suppressions WHERE LOWER(email) = LOWER($1)
    `, [email.trim()]);
  } finally {
    client.release();
  }
}

// 7. Get Suppressions List
export async function getSuppressions(limit: number = 50, offset: number = 0) {
  const client = await pool.connect();
  try {
    const countRes = await client.query(`SELECT count(1) AS count FROM marketing_suppressions`);
    const listRes = await client.query(`
      SELECT * FROM marketing_suppressions 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return {
      total: parseInt(countRes.rows[0].count, 10),
      items: listRes.rows,
    };
  } finally {
    client.release();
  }
}

// 8. Create Campaign
export async function createMarketingCampaign({
  name,
  subject,
  body_html,
  target_filters,
  total_targeted,
}: {
  name: string;
  subject: string;
  body_html: string;
  target_filters: TargetFilters;
  total_targeted: number;
}): Promise<MarketingCampaign> {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      INSERT INTO marketing_campaigns (name, subject, body_html, target_filters, total_targeted, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'sending', NOW(), NOW())
      RETURNING *
    `, [name, subject, body_html, JSON.stringify(target_filters), total_targeted]);
    return res.rows[0];
  } finally {
    client.release();
  }
}

// 9. Record Send Log & Update Company last_emailed_at
export async function recordMarketingSendLog({
  campaign_id,
  corporate_number,
  company_name,
  recipient_email,
  status,
  error_message,
}: {
  campaign_id: string;
  corporate_number: string | null;
  company_name: string | null;
  recipient_email: string;
  status: 'sent' | 'failed' | 'suppressed';
  error_message?: string | null;
}) {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO marketing_send_logs (campaign_id, corporate_number, company_name, recipient_email, status, error_message, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [campaign_id, corporate_number, company_name, recipient_email, status, error_message || null]);

    if (status === 'sent') {
      if (corporate_number) {
        await client.query(`
          UPDATE companies 
          SET last_emailed_at = NOW() 
          WHERE corporate_number = $1
        `, [corporate_number]);
      } else {
        await client.query(`
          UPDATE companies 
          SET last_emailed_at = NOW() 
          WHERE LOWER(email_address) = LOWER($1)
        `, [recipient_email]);
      }

      await client.query(`
        UPDATE marketing_campaigns 
        SET sent_count = sent_count + 1, updated_at = NOW()
        WHERE id = $1
      `, [campaign_id]);
    } else {
      await client.query(`
        UPDATE marketing_campaigns 
        SET failed_count = failed_count + 1, updated_at = NOW()
        WHERE id = $1
      `, [campaign_id]);
    }
  } finally {
    client.release();
  }
}

// 10. Update Campaign Status
export async function updateCampaignStatus(
  campaign_id: string,
  status: 'draft' | 'sending' | 'completed' | 'paused' | 'failed'
) {
  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE marketing_campaigns 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2
    `, [status, campaign_id]);
  } finally {
    client.release();
  }
}

// 11. Get Campaigns List with Logs
export async function getCampaignsList(limit: number = 20, offset: number = 0) {
  const client = await pool.connect();
  try {
    const countRes = await client.query(`SELECT count(1) AS count FROM marketing_campaigns`);
    const listRes = await client.query(`
      SELECT * FROM marketing_campaigns 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return {
      total: parseInt(countRes.rows[0].count, 10),
      items: listRes.rows,
    };
  } finally {
    client.release();
  }
}

// 12. Get Campaign Send Logs
export async function getCampaignSendLogs(campaign_id: string, limit: number = 50) {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT * FROM marketing_send_logs 
      WHERE campaign_id = $1 
      ORDER BY sent_at DESC 
      LIMIT $2
    `, [campaign_id, limit]);
    return res.rows;
  } finally {
    client.release();
  }
}
