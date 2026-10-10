import { DatabaseSync } from 'node:sqlite';
import { Pool } from 'pg';
import path from 'path';
import crypto from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL;
let pgPool: Pool | null = null;
let sqliteInstance: DatabaseSync | null = null;
let pgAvailable: boolean | null = null;

function getPGPool(): Pool {
  if (!pgPool) {
    if (!DATABASE_URL) throw new Error('DATABASE_URL is not defined.');
    pgPool = new Pool({ connectionString: DATABASE_URL, max: 10, connectionTimeoutMillis: 1500 });
  }
  return pgPool;
}

function getSQLiteDB(): DatabaseSync {
  if (!sqliteInstance) {
    const DB_PATH = path.resolve(process.cwd(), '../kigyou-list.db');
    sqliteInstance = new DatabaseSync(DB_PATH);
  }
  return sqliteInstance;
}

function convertSqlForPG(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

// ==========================================
// PRESET SYSTEM TEMPLATES (High-Converting)
// ==========================================
export const PRESET_TEMPLATES = [
  {
    id: "preset_b2b_saas",
    name: "【B2Bサービス・SaaS】業務効率化・営業DXのご提案",
    category: "b2b_service",
    subject: "【ご提案】貴社の業務効率化・コスト削減を支援するソリューションのご案内",
    body: `{{company_name}}
営業責任者様 / ご担当者様

貴社のWebサイト問い合わせ窓口より大変恐れ入ります。
[貴社名] の [ご担当者様氏名] と申します。

突然のご連絡にて誠に恐縮ではございますが、貴社の [業務効率化・営業DX・コスト削減] をご支援できるサービスのご案内でお問い合わせいたしました。

現在、多くの企業様において [人手不足 / 業務工数増 / コスト高騰] が課題となる中、弊社のソリューションをご導入いただくことで [月30〜40%の工数削減 / 受注率向上] などの成果を実現しております。

もし少しでもご興味をお持ちいただけましたら、事例資料の送付またはオンライン（Zoom等で15分ほど）にて詳細をご紹介させていただけますと幸いです。

▼ サービス概要・詳細はこちら：
[貴社サービスURL]

ご多忙の折恐縮ではございますが、ご検討のほど何卒よろしくお願い申し上げます。

--------------------------------------------------
※本メッセージがご不要な場合は、大変お手数ですがその旨ご返信いただけますと幸いです。以降の連絡を停止いたします。
[貴社名]
担当: [ご担当者様氏名]
Email: [返信用メールアドレス]
TEL: [電話番号]
--------------------------------------------------`
  },
  {
    id: "preset_it_offshore",
    name: "【IT・システム開発】開発リソース不足解消・受託開発のご案内",
    category: "it_dev",
    subject: "【エンジニア不足の解消】高スキル人材によるラボ型開発・システム受託のご案内",
    body: `{{company_name}}
開発責任者様 / DX推進ご担当者様

突然のご連絡失礼いたします。
[貴社名] の [ご担当者様氏名] と申します。

現在、IT人材の獲得難や開発コストの上昇でお困りではございませんでしょうか。
弊社では、日本国内および海外トップクラスのエンジニアチームによる【Webシステム・スマホアプリ・AI受託開発】を提供しております。

■ 弊社の強み：
・要件定義からPM、設計、実装まで日本語ネイティブが徹底サポート
・通常比30〜40%のコストメリットとスピード納品
・AI/クラウド（AWS・GCP）領域の開発実績多数

現在抱えていらっしゃる開発案件や保守運用の外注化について、概算見積もりやポートフォリオをご案内可能です。

ご興味をお持ちいただけましたら、まずはオンラインにてご挨拶を兼ねてお話しできれば幸いです。

--------------------------------------------------
※特定商取引法に基づく表記：配信停止をご希望の場合は大変恐縮ですが本返信にてお知らせください。
[貴社名]
URL: [貴社WebサイトURL]
Email: [返信用メールアドレス]
--------------------------------------------------`
  },
  {
    id: "preset_recruiting",
    name: "【採用・人材支援】即戦力中途採用・採用コスト削減のご提案",
    category: "recruiting",
    subject: "【完全成功報酬】貴社の優秀層採用・人材不足を解消する採用支援のご案内",
    body: `{{company_name}}
採用ご責任者様 / 人事担当者様

Webサイトより突然のご連絡にて失礼いたします。
[貴社名] の [ご担当者様氏名] と申します。

貴社の事業拡大に伴う採用活動にお役立ていただければと思い、ご連絡いたしました。
弊社は [専門職種 / 営業職 / エンジニア] に特化したダイレクトリクルーティング支援を行っております。

■ サービスの特徴：
・【完全成果報酬型】：採用決定まで初期費用・月額費用は一切かかりません
・貴社のターゲット要件に合致する即戦力候補者のみを厳選して推薦
・内定辞退率を抑える手厚いキャリアフォロー

現在の募集状況や採用課題について、15分ほど情報交換の機会を頂戴できますと幸いです。

▼ 採用支援実績・詳細：
[貴社サービスURL]

何卒よろしくお願い申し上げます。
--------------------------------------------------
[貴社名] / 担当: [ご担当者様氏名]
Email: [返信用メールアドレス]
--------------------------------------------------`
  },
  {
    id: "preset_alliance",
    name: "【業務提携・アライアンス】相互送客・代理店連携のご相談",
    category: "alliance",
    subject: "【協業・業務提携のご相談】相互の顧客価値向上に向けたご提案（{{company_name}}様）",
    body: `{{company_name}}
経営企画室様 / アライアンスご担当者様

貴社の問い合わせ窓口より大変恐れ入ります。
[貴社名] の [ご担当者様氏名] と申します。

突然のご連絡にて誠に恐縮ではございますが、貴社の素晴らしい事業実績を拝見し、弊社の [自社事業・プロダクト名] とのシナジー創出に向けた協業・業務提携のご相談でお問い合わせいたしました。

両社の顧客基盤や強みを相互活用することで、双方の売上拡大およびクロスセルが見込めると考えております。

まずは情報交換を兼ねて、オンライン（20分ほど）にて一度ご挨拶のお時間を頂戴できないでしょうか。

▼ 弊社事業概要：
[貴社WebサイトURL]

ご多忙のところ恐縮ですが、ご検討いただけますと幸いに存じます。

--------------------------------------------------
※本案内がご不要な場合は、お手数ですがその旨ご返信いただけますと幸いです。
[貴社名] / 担当: [ご担当者様氏名]
Email: [返信用メールアドレス]
--------------------------------------------------`
  }
];

// ==========================================
// TABLE INITIALIZATION
// ==========================================
let tablesInitialized = false;

export async function initFormCampaignTables(): Promise<void> {
  if (tablesInitialized) return;

  const createTemplatesSql = `
    CREATE TABLE IF NOT EXISTS user_form_templates (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'custom',
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createCampaignsSql = `
    CREATE TABLE IF NOT EXISTS user_form_campaigns (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      name TEXT NOT NULL,
      template_id TEXT,
      sender_company TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      sender_phone TEXT,
      sender_website TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      target_filters TEXT,
      target_count INTEGER DEFAULT 0,
      cost_jpy INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      runner_mode TEXT DEFAULT 'server',
      rejection_reason TEXT,
      sent_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      skipped_count INTEGER DEFAULT 0,
      report_file_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createCreditsSql = `
    CREATE TABLE IF NOT EXISTS user_form_credits (
      user_email TEXT PRIMARY KEY,
      balance INTEGER DEFAULT 0,
      total_purchased INTEGER DEFAULT 0,
      total_used INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createTransactionsSql = `
    CREATE TABLE IF NOT EXISTS user_form_credit_transactions (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      type TEXT NOT NULL,
      campaign_id TEXT,
      campaign_name TEXT,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  if (DATABASE_URL && pgAvailable !== false) {
    try {
      const pool = getPGPool();
      const client = await pool.connect();
      try {
        await client.query(createTemplatesSql);
        await client.query(createCampaignsSql);
        try {
          await client.query(`ALTER TABLE user_form_campaigns ADD COLUMN IF NOT EXISTS runner_mode TEXT DEFAULT 'server'`);
        } catch {}
        await client.query(createCreditsSql);
        await client.query(createTransactionsSql);
        pgAvailable = true;
      } finally {
        client.release();
      }
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.message?.includes('ECONNREFUSED')) {
        pgAvailable = false;
      } else {
        console.error('Error initializing PG form campaign tables:', e);
      }
    }
  }

  // Always initialize SQLite tables as reliable local fallback
  try {
    const db = getSQLiteDB();
    db.exec(createTemplatesSql);
    db.exec(createCampaignsSql);
    try {
      db.exec(`ALTER TABLE user_form_campaigns ADD COLUMN runner_mode TEXT DEFAULT 'server'`);
    } catch {}
    db.exec(createCreditsSql);
    db.exec(createTransactionsSql);
  } catch (e) {
    console.error('Error initializing SQLite form campaign tables:', e);
  }

  tablesInitialized = true;
}

// Unified query helpers with automatic fallback
async function queryAll(sql: string, params: any[] = []): Promise<any[]> {
  await initFormCampaignTables();
  if (DATABASE_URL && pgAvailable !== false) {
    try {
      const pool = getPGPool();
      const res = await pool.query(convertSqlForPG(sql), params);
      pgAvailable = true;
      return res.rows;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.message?.includes('ECONNREFUSED')) {
        pgAvailable = false;
      } else {
        throw e;
      }
    }
  }
  const db = getSQLiteDB();
  const rows = db.prepare(sql).all(...params);
  return rows.map((r: any) => ({ ...r }));
}

async function queryOne(sql: string, params: any[] = []): Promise<any | null> {
  await initFormCampaignTables();
  if (DATABASE_URL && pgAvailable !== false) {
    try {
      const pool = getPGPool();
      const res = await pool.query(convertSqlForPG(sql), params);
      pgAvailable = true;
      return res.rows[0] || null;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.message?.includes('ECONNREFUSED')) {
        pgAvailable = false;
      } else {
        throw e;
      }
    }
  }
  const db = getSQLiteDB();
  const row = db.prepare(sql).get(...params);
  return row ? { ...row } : null;
}

async function execute(sql: string, params: any[] = []): Promise<number> {
  await initFormCampaignTables();
  if (DATABASE_URL && pgAvailable !== false) {
    try {
      const pool = getPGPool();
      const res = await pool.query(convertSqlForPG(sql), params);
      pgAvailable = true;
      return res.rowCount || 0;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.message?.includes('ECONNREFUSED')) {
        pgAvailable = false;
      } else {
        throw e;
      }
    }
  }
  const db = getSQLiteDB();
  const res = db.prepare(sql).run(...params);
  return res.changes;
}

// ==========================================
// TEMPLATES CRUD
// ==========================================
export interface FormTemplate {
  id: string;
  user_email: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export async function getUserTemplates(email: string): Promise<FormTemplate[]> {
  const sql = `SELECT * FROM user_form_templates WHERE user_email = ? ORDER BY updated_at DESC`;
  const rows = await queryAll(sql, [email]);
  return rows.map(r => ({ ...r, created_at: String(r.created_at), updated_at: String(r.updated_at) }));
}

export async function saveUserTemplate(
  email: string,
  templateData: { id?: string; name: string; category?: string; subject: string; body: string }
): Promise<FormTemplate> {
  const id = templateData.id || `tpl_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const category = templateData.category || 'custom';

  const checkSql = `SELECT id FROM user_form_templates WHERE id = ? AND user_email = ?`;
  const existing = await queryOne(checkSql, [id, email]);

  if (existing) {
    const updateSql = `
      UPDATE user_form_templates 
      SET name = ?, category = ?, subject = ?, body = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_email = ?
    `;
    await execute(updateSql, [templateData.name, category, templateData.subject, templateData.body, id, email]);
  } else {
    const insertSql = `
      INSERT INTO user_form_templates (id, user_email, name, category, subject, body, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    await execute(insertSql, [id, email, templateData.name, category, templateData.subject, templateData.body]);
  }

  return {
    id,
    user_email: email,
    name: templateData.name,
    category,
    subject: templateData.subject,
    body: templateData.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function deleteUserTemplate(email: string, id: string): Promise<boolean> {
  const sql = `DELETE FROM user_form_templates WHERE id = ? AND user_email = ?`;
  const count = await execute(sql, [id, email]);
  return count > 0;
}

// ==========================================
// CAMPAIGNS CRUD
// ==========================================
export interface FormCampaign {
  id: string;
  user_email: string;
  name: string;
  template_id: string | null;
  sender_company: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  sender_website: string | null;
  subject: string;
  body: string;
  target_filters: string | null;
  target_count: number;
  cost_jpy: number;
  status: "draft" | "pending_approval" | "approved" | "processing" | "completed" | "rejected" | "cancelled";
  rejection_reason: string | null;
  sent_count: number;
  success_count: number;
  skipped_count: number;
  report_file_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserCampaigns(email: string): Promise<FormCampaign[]> {
  const sql = `SELECT * FROM user_form_campaigns WHERE user_email = ? ORDER BY created_at DESC`;
  const rows = await queryAll(sql, [email]);
  return rows.map(r => ({ ...r, created_at: String(r.created_at), updated_at: String(r.updated_at) }));
}

export async function saveUserCampaign(
  email: string,
  campaignData: {
    id?: string;
    name: string;
    template_id?: string | null;
    sender_company: string;
    sender_name: string;
    sender_email: string;
    sender_phone?: string | null;
    sender_website?: string | null;
    subject: string;
    body: string;
    target_filters?: any;
    target_count?: number;
    cost_jpy?: number;
    status?: "draft" | "pending_approval" | "pending_review";
  }
): Promise<FormCampaign> {
  const id = campaignData.id || `cmp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const filtersJson = campaignData.target_filters 
    ? (typeof campaignData.target_filters === 'string' ? campaignData.target_filters : JSON.stringify(campaignData.target_filters))
    : null;
  const targetCount = Number(campaignData.target_count || 0);
  const costJpy = Number(campaignData.cost_jpy || 0);
  
  // Normalize status
  let status: "draft" | "pending_approval" = 'draft';
  if (campaignData.status === 'pending_approval' || campaignData.status === 'pending_review') {
    status = 'pending_approval';
  }

  const checkSql = `SELECT id, status, target_count, target_filters FROM user_form_campaigns WHERE id = ? AND user_email = ?`;
  const existing = await queryOne(checkSql, [id, email]);

  // When editing an existing campaign, target conditions and counts are locked
  const finalTargetCount = existing ? Number(existing.target_count || 0) : targetCount;
  const finalFiltersJson = existing ? (existing.target_filters || filtersJson) : filtersJson;

  // Credit wallet deduction logic:
  // If moving to pending_approval from draft or new campaign, deduct credits
  if (status === 'pending_approval') {
    const isAlreadyPendingOrActive = existing && ['pending_approval', 'approved', 'processing'].includes(existing.status);
    if (!isAlreadyPendingOrActive) {
      if (finalTargetCount < 100) {
        throw new Error("MIN_TARGET_100: 1キャンペーンあたりの配信件数は最低100件以上を指定してください（過剰申請の防止およびアプローチ効果担保のため）。");
      }
      if (!finalFiltersJson || finalFiltersJson === 'null' || finalFiltersJson === '{}' || finalFiltersJson === '""') {
        throw new Error("TARGET_REQUIRED: 配信対象（ターゲット条件）が設定されていません。ターゲットを指定してください。");
      }
      const deducted = await deductFormCredits(email, finalTargetCount);
      if (!deducted) {
        const currentCredits = await getUserFormCredits(email);
        throw new Error(`INSUFFICIENT_CREDITS: 保有クレジットが不足しています (必要: ${finalTargetCount} 件 / 保有: ${currentCredits.balance} 件)。クレジットを購入してください。`);
      }
      const after = await getUserFormCredits(email);
      await recordCreditTransaction(email, {
        amount: -finalTargetCount,
        balance_after: after.balance,
        type: 'reserve',
        campaign_id: id,
        campaign_name: campaignData.name,
        note: `審査申請に伴う仮押さえ (${finalTargetCount.toLocaleString()}件)`
      });
    }
  } else if (status === 'draft' && existing && existing.status === 'pending_approval') {
    // Reverting from pending_approval to draft -> refund reserved credits
    if (Number(existing.target_count) > 0) {
      await refundFormCredits(email, Number(existing.target_count));
      const after = await getUserFormCredits(email);
      await recordCreditTransaction(email, {
        amount: +Number(existing.target_count),
        balance_after: after.balance,
        type: 'refund',
        campaign_id: id,
        campaign_name: existing.name || campaignData.name,
        note: `審査申請の取下げ（下書き復帰）による返還`
      });
    }
  }

  if (existing) {
    const updateSql = `
      UPDATE user_form_campaigns
      SET name = ?, template_id = ?, sender_company = ?, sender_name = ?,
          sender_email = ?, sender_phone = ?, sender_website = ?, subject = ?,
          body = ?, target_filters = ?, target_count = ?, cost_jpy = ?,
          status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_email = ?
    `;
    await execute(updateSql, [
      campaignData.name,
      campaignData.template_id || null,
      campaignData.sender_company,
      campaignData.sender_name,
      campaignData.sender_email,
      campaignData.sender_phone || null,
      campaignData.sender_website || null,
      campaignData.subject,
      campaignData.body,
      finalFiltersJson,
      finalTargetCount,
      costJpy,
      status,
      id,
      email
    ]);
  } else {
    const insertSql = `
      INSERT INTO user_form_campaigns (
        id, user_email, name, template_id, sender_company, sender_name,
        sender_email, sender_phone, sender_website, subject, body,
        target_filters, target_count, cost_jpy, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    await execute(insertSql, [
      id,
      email,
      campaignData.name,
      campaignData.template_id || null,
      campaignData.sender_company,
      campaignData.sender_name,
      campaignData.sender_email,
      campaignData.sender_phone || null,
      campaignData.sender_website || null,
      campaignData.subject,
      campaignData.body,
      filtersJson,
      targetCount,
      costJpy,
      status
    ]);
  }

  return {
    id,
    user_email: email,
    name: campaignData.name,
    template_id: campaignData.template_id || null,
    sender_company: campaignData.sender_company,
    sender_name: campaignData.sender_name,
    sender_email: campaignData.sender_email,
    sender_phone: campaignData.sender_phone || null,
    sender_website: campaignData.sender_website || null,
    subject: campaignData.subject,
    body: campaignData.body,
    target_filters: filtersJson,
    target_count: targetCount,
    cost_jpy: costJpy,
    status,
    rejection_reason: null,
    sent_count: 0,
    success_count: 0,
    skipped_count: 0,
    report_file_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function deleteUserCampaign(email: string, id: string): Promise<boolean> {
  const checkSql = `SELECT id, name, target_count, status FROM user_form_campaigns WHERE id = ? AND user_email = ?`;
  const existing = await queryOne(checkSql, [id, email]);
  if (!existing) return false;

  // Allow deleting draft, pending_approval, or rejected campaigns
  // Disallow deleting active/completed campaigns ('processing', 'approved', 'completed')
  if (!['draft', 'pending_approval', 'pending_review', 'rejected'].includes(existing.status)) {
    return false;
  }

  // If campaign was pending approval, refund reserved credits to the user's wallet
  if ((existing.status === 'pending_approval' || existing.status === 'pending_review') && Number(existing.target_count) > 0) {
    await refundFormCredits(email, Number(existing.target_count));
    const after = await getUserFormCredits(email);
    await recordCreditTransaction(email, {
      amount: +Number(existing.target_count),
      balance_after: after.balance,
      type: 'refund',
      campaign_id: id,
      campaign_name: existing.name || null,
      note: `申請中キャンペーンの削除・取消による返還`
    });
  }

  const sql = `DELETE FROM user_form_campaigns WHERE id = ? AND user_email = ?`;
  const count = await execute(sql, [id, email]);
  return count > 0;
}

export async function revertCampaignToDraft(email: string, id: string): Promise<boolean> {
  const checkSql = `SELECT id, name, target_count, status FROM user_form_campaigns WHERE id = ? AND user_email = ?`;
  const existing = await queryOne(checkSql, [id, email]);
  if (!existing) return false;

  // Only allow reverting pending_approval campaigns
  if (existing.status !== 'pending_approval') {
    return false;
  }

  // Refund reserved credits
  if (Number(existing.target_count) > 0) {
    await refundFormCredits(email, Number(existing.target_count));
    const after = await getUserFormCredits(email);
    await recordCreditTransaction(email, {
      amount: +Number(existing.target_count),
      balance_after: after.balance,
      type: 'refund',
      campaign_id: id,
      campaign_name: existing.name || null,
      note: `審査申請の取下げ（下書き復帰）による返還`
    });
  }

  const updateSql = `UPDATE user_form_campaigns SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_email = ?`;
  const count = await execute(updateSql, [id, email]);
  return count > 0;
}

// ==========================================
// ADMIN MODERATION
// ==========================================
export async function getAdminFormCampaigns(statusFilter?: string): Promise<any[]> {
  let sql = `SELECT * FROM user_form_campaigns`;
  const params: any[] = [];
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'server' || statusFilter === 'local') {
      sql += ` WHERE runner_mode = ?`;
      params.push(statusFilter);
    } else {
      sql += ` WHERE status = ?`;
      params.push(statusFilter);
    }
  }
  sql += ` ORDER BY created_at DESC LIMIT 100`;

  const rows = await queryAll(sql, params);
  return rows.map(r => ({
    ...r,
    runner_mode: r.runner_mode || 'server',
    title: r.name,
    pitch_subject: r.subject,
    pitch_body: r.body,
    sender_company_name: r.sender_company,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at)
  }));
}

export async function adminUpdateCampaignStatus(
  campaignId: string,
  newStatus: 'approved' | 'rejected' | 'completed' | 'processing',
  reason?: string,
  metrics?: { 
    success_count?: number; 
    skipped_count?: number; 
    report_file_url?: string;
    runner_mode?: 'server' | 'local';
  }
): Promise<boolean> {
  const checkSql = `SELECT user_email, name, target_count, status, success_count FROM user_form_campaigns WHERE id = ?`;
  const cmp = await queryOne(checkSql, [campaignId]);
  if (!cmp) return false;

  const targetCount = Number(cmp.target_count || 0);

  // If campaign is rejected by admin, refund reserved credits back to the customer's wallet
  if (newStatus === 'rejected' && (cmp.status === 'pending_approval' || cmp.status === 'approved')) {
    if (targetCount > 0) {
      await refundFormCredits(cmp.user_email, targetCount);
      const after = await getUserFormCredits(cmp.user_email);
      await recordCreditTransaction(cmp.user_email, {
        amount: +targetCount,
        balance_after: after.balance,
        type: 'refund',
        campaign_id: campaignId,
        campaign_name: cmp.name || null,
        note: `管理者による却下・差し戻しに伴う全額返還`
      });
    }
  }

  // If campaign is marked completed (Approach 1: Auto-settle & Refund unsent targets)
  let successCount = metrics?.success_count !== undefined ? Number(metrics.success_count) : Number(cmp.success_count || 0);
  let skippedCount = metrics?.skipped_count !== undefined ? Number(metrics.skipped_count) : Math.max(0, targetCount - successCount);
  let reportUrl = metrics?.report_file_url || null;

  if (newStatus === 'completed' && ['approved', 'processing', 'pending_approval', 'sending'].includes(cmp.status)) {
    const delivered = Math.min(successCount, targetCount);
    const unused = Math.max(0, targetCount - delivered);

    // Record delivered transaction
    if (delivered > 0) {
      const current = await getUserFormCredits(cmp.user_email);
      await recordCreditTransaction(cmp.user_email, {
        amount: -delivered,
        balance_after: current.balance,
        type: 'delivered',
        campaign_id: campaignId,
        campaign_name: cmp.name || null,
        note: `配信完了による実消化（送信成功: ${delivered} 件）`
      });
    }

    // Refund unused portion (due to Captcha, Disclaimer, Timeout)
    if (unused > 0) {
      await refundFormCredits(cmp.user_email, unused);
      const after = await getUserFormCredits(cmp.user_email);
      await recordCreditTransaction(cmp.user_email, {
        amount: +unused,
        balance_after: after.balance,
        type: 'refund',
        campaign_id: campaignId,
        campaign_name: cmp.name || null,
        note: `配信完了時の未達分返還（CAPTCHA・営業禁止等によるスキップ: ${unused} 件）`
      });
    }
  }

  const sql = `
    UPDATE user_form_campaigns
    SET status = ?, 
        runner_mode = COALESCE(?, runner_mode, 'server'),
        rejection_reason = ?, 
        success_count = COALESCE(?, success_count),
        skipped_count = COALESCE(?, skipped_count),
        report_file_url = COALESCE(?, report_file_url),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const count = await execute(sql, [
    newStatus, 
    metrics?.runner_mode || null,
    reason || null, 
    metrics?.success_count !== undefined ? metrics.success_count : null,
    metrics?.skipped_count !== undefined ? metrics.skipped_count : null,
    reportUrl,
    campaignId
  ]);
  return count > 0;
}

// ==========================================
// FORM CREDIT WALLET SYSTEM (Ví Tín Dụng Gửi Form)
// ==========================================
export interface UserFormCredits {
  user_email: string;
  balance: number;
  reserved: number; // Credits held for pending_approval campaigns
  total_purchased: number;
  total_used: number; // Actual forms sent
}

export async function getUserFormCredits(email: string): Promise<UserFormCredits> {
  await initFormCampaignTables();
  const sql = `SELECT user_email, balance, total_purchased, total_used FROM user_form_credits WHERE user_email = ?`;
  const row = await queryOne(sql, [email]);
  
  // Calculate reserved credits in pending_approval
  const reservedRow = await queryOne(
    `SELECT COALESCE(SUM(target_count), 0) as reserved FROM user_form_campaigns WHERE user_email = ? AND status = 'pending_approval'`,
    [email]
  );
  const reserved = Number(reservedRow?.reserved || 0);

  // Calculate actual delivered forms
  const sentRow = await queryOne(
    `SELECT COALESCE(SUM(success_count), 0) as sent FROM user_form_campaigns WHERE user_email = ?`,
    [email]
  );
  const realSent = Number(sentRow?.sent || 0);

  if (!row) {
    return {
      user_email: email,
      balance: 0,
      reserved,
      total_purchased: 0,
      total_used: realSent
    };
  }
  return {
    user_email: row.user_email,
    balance: Number(row.balance || 0),
    reserved,
    total_purchased: Number(row.total_purchased || 0),
    total_used: realSent
  };
}

export async function addFormCredits(email: string, amount: number): Promise<number> {
  await initFormCampaignTables();
  const current = await getUserFormCredits(email);
  const newBalance = current.balance + amount;
  const newPurchased = current.total_purchased + amount;

  const checkSql = `SELECT user_email FROM user_form_credits WHERE user_email = ?`;
  const existing = await queryOne(checkSql, [email]);

  if (existing) {
    const updateSql = `
      UPDATE user_form_credits
      SET balance = ?, total_purchased = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_email = ?
    `;
    await execute(updateSql, [newBalance, newPurchased, email]);
  } else {
    const insertSql = `
      INSERT INTO user_form_credits (user_email, balance, total_purchased, total_used, created_at, updated_at)
      VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    await execute(insertSql, [email, newBalance, newPurchased]);
  }

  await recordCreditTransaction(email, {
    amount: +amount,
    balance_after: newBalance,
    type: 'charge',
    note: 'クレジット購入・チャージ'
  });

  return newBalance;
}

export async function deductFormCredits(email: string, amount: number): Promise<boolean> {
  await initFormCampaignTables();
  const current = await getUserFormCredits(email);
  if (current.balance < amount) {
    return false;
  }
  const newBalance = Math.max(0, current.balance - amount);

  const updateSql = `
    UPDATE user_form_credits
    SET balance = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_email = ?
  `;
  const affected = await execute(updateSql, [newBalance, email]);
  return affected > 0;
}

export async function refundFormCredits(email: string, amount: number): Promise<number> {
  await initFormCampaignTables();
  const current = await getUserFormCredits(email);
  const newBalance = current.balance + amount;

  const updateSql = `
    UPDATE user_form_credits
    SET balance = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_email = ?
  `;
  await execute(updateSql, [newBalance, email]);
  return newBalance;
}

export async function getAllUserFormCredits(): Promise<Record<string, UserFormCredits>> {
  await initFormCampaignTables();
  const sql = `SELECT user_email, balance, total_purchased, total_used FROM user_form_credits`;
  const rows = await queryAll(sql);
  const map: Record<string, UserFormCredits> = {};
  for (const r of rows) {
    const reservedRow = await queryOne(
      `SELECT COALESCE(SUM(target_count), 0) as reserved FROM user_form_campaigns WHERE user_email = ? AND status = 'pending_approval'`,
      [r.user_email]
    );
    const sentRow = await queryOne(
      `SELECT COALESCE(SUM(success_count), 0) as sent FROM user_form_campaigns WHERE user_email = ?`,
      [r.user_email]
    );
    map[r.user_email] = {
      user_email: r.user_email,
      balance: Number(r.balance || 0),
      reserved: Number(reservedRow?.reserved || 0),
      total_purchased: Number(r.total_purchased || 0),
      total_used: Number(sentRow?.sent || 0)
    };
  }
  return map;
}

export async function adminSetFormCredits(
  email: string, 
  balance: number, 
  totalPurchased?: number
): Promise<boolean> {
  await initFormCampaignTables();
  const current = await getUserFormCredits(email);
  const safeBalance = Math.max(0, Math.floor(balance));
  const newPurchased = typeof totalPurchased === 'number' 
    ? Math.max(0, Math.floor(totalPurchased)) 
    : Math.max(current.total_purchased, safeBalance);

  const checkSql = `SELECT user_email FROM user_form_credits WHERE user_email = ?`;
  const existing = await queryOne(checkSql, [email]);

  if (existing) {
    const updateSql = `
      UPDATE user_form_credits
      SET balance = ?, total_purchased = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_email = ?
    `;
    await execute(updateSql, [safeBalance, newPurchased, email]);
  } else {
    const insertSql = `
      INSERT INTO user_form_credits (user_email, balance, total_purchased, total_used, created_at, updated_at)
      VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    await execute(insertSql, [email, safeBalance, newPurchased]);
  }
  return true;
}

// ==========================================
// CREDIT TRANSACTION LOGS & AUDIT TRAIL
// ==========================================
export interface FormCreditTransaction {
  id: string;
  user_email: string;
  amount: number;
  balance_after: number;
  type: 'charge' | 'reserve' | 'refund' | 'delivered';
  campaign_id: string | null;
  campaign_name: string | null;
  note: string | null;
  created_at: string;
}

export async function recordCreditTransaction(
  email: string,
  data: {
    amount: number;
    balance_after: number;
    type: 'charge' | 'reserve' | 'refund' | 'delivered';
    campaign_id?: string | null;
    campaign_name?: string | null;
    note?: string | null;
  }
): Promise<void> {
  try {
    await initFormCampaignTables();
    const id = `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const insertSql = `
      INSERT INTO user_form_credit_transactions 
      (id, user_email, amount, balance_after, type, campaign_id, campaign_name, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    await execute(insertSql, [
      id,
      email,
      data.amount,
      data.balance_after,
      data.type,
      data.campaign_id || null,
      data.campaign_name || null,
      data.note || null
    ]);
  } catch (err) {
    console.error("Failed to record credit transaction:", err);
  }
}

export async function getUserCreditTransactions(
  email: string, 
  limit: number = 100
): Promise<FormCreditTransaction[]> {
  await initFormCampaignTables();
  const sql = `
    SELECT * FROM user_form_credit_transactions
    WHERE user_email = ?
    ORDER BY created_at DESC
    LIMIT ?
  `;
  const rows = await queryAll(sql, [email, limit]);
  return rows.map(r => ({
    id: String(r.id),
    user_email: String(r.user_email),
    amount: Number(r.amount || 0),
    balance_after: Number(r.balance_after || 0),
    type: r.type,
    campaign_id: r.campaign_id || null,
    campaign_name: r.campaign_name || null,
    note: r.note || null,
    created_at: String(r.created_at)
  }));
}

export async function submitCampaignForApproval(
  email: string, 
  id: string
): Promise<{ success: boolean; error?: string }> {
  await initFormCampaignTables();
  const checkSql = `SELECT * FROM user_form_campaigns WHERE id = ? AND user_email = ?`;
  const existing = await queryOne(checkSql, [id, email]);
  if (!existing) return { success: false, error: "Campaign not found" };

  if (existing.status !== 'draft' && existing.status !== 'rejected') {
    return { success: false, error: "Campaign is already submitted or approved." };
  }

  const targetCount = Number(existing.target_count || 0);
  if (targetCount < 100) {
    return { success: false, error: "MIN_TARGET_100: 1キャンペーンあたりの配信件数は最低100件以上必要です。" };
  }

  const currentCredits = await getUserFormCredits(email);
  if (currentCredits.balance < targetCount) {
    return { 
      success: false, 
      error: `INSUFFICIENT_CREDITS: 保有クレジット残高が不足しています (必要: ${targetCount.toLocaleString()} 件 / 保有: ${currentCredits.balance.toLocaleString()} 件)。クレジットを購入してください。` 
    };
  }

  const deducted = await deductFormCredits(email, targetCount);
  if (!deducted) {
    return { success: false, error: "クレジットの差し引きに失敗しました。" };
  }

  const updateSql = `
    UPDATE user_form_campaigns 
    SET status = 'pending_approval', rejection_reason = null, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND user_email = ?
  `;
  await execute(updateSql, [id, email]);

  const after = await getUserFormCredits(email);
  await recordCreditTransaction(email, {
    amount: -targetCount,
    balance_after: after.balance,
    type: 'reserve',
    campaign_id: id,
    campaign_name: existing.name || null,
    note: `審査申請に伴う仮押さえ (${targetCount.toLocaleString()}件)`
  });

  return { success: true };
}


