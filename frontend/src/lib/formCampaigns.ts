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
      rejection_reason TEXT,
      sent_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      skipped_count INTEGER DEFAULT 0,
      report_file_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  if (DATABASE_URL && pgAvailable !== false) {
    try {
      const pool = getPGPool();
      const client = await pool.connect();
      try {
        await client.query(createTemplatesSql);
        await client.query(createCampaignsSql);
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
    status?: "draft" | "pending_approval";
  }
): Promise<FormCampaign> {
  const id = campaignData.id || `cmp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const filtersJson = campaignData.target_filters 
    ? (typeof campaignData.target_filters === 'string' ? campaignData.target_filters : JSON.stringify(campaignData.target_filters))
    : null;
  const targetCount = campaignData.target_count || 0;
  const costJpy = campaignData.cost_jpy || 0;
  const status = campaignData.status || 'draft';

  const checkSql = `SELECT id FROM user_form_campaigns WHERE id = ? AND user_email = ?`;
  const existing = await queryOne(checkSql, [id, email]);

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
      filtersJson,
      targetCount,
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
  const sql = `DELETE FROM user_form_campaigns WHERE id = ? AND user_email = ? AND status = 'draft'`;
  const count = await execute(sql, [id, email]);
  return count > 0;
}

// ==========================================
// ADMIN MODERATION
// ==========================================
export async function getAdminFormCampaigns(statusFilter?: string): Promise<FormCampaign[]> {
  let sql = `SELECT * FROM user_form_campaigns`;
  const params: any[] = [];
  if (statusFilter && statusFilter !== 'all') {
    sql += ` WHERE status = ?`;
    params.push(statusFilter);
  }
  sql += ` ORDER BY created_at DESC LIMIT 100`;

  const rows = await queryAll(sql, params);
  return rows.map(r => ({ ...r, created_at: String(r.created_at), updated_at: String(r.updated_at) }));
}

export async function adminUpdateCampaignStatus(
  campaignId: string,
  newStatus: 'approved' | 'rejected' | 'completed',
  reason?: string
): Promise<boolean> {
  const sql = `
    UPDATE user_form_campaigns
    SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const count = await execute(sql, [newStatus, reason || null, campaignId]);
  return count > 0;
}
