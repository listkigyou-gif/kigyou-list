import { DatabaseSync } from 'node:sqlite';
import { Pool } from 'pg';
import path from 'path';
import crypto from 'crypto';
import { deleteFileFromR2 } from './r2';
import { loadEnvConfig } from '@next/env';

// Load env variables dynamically if running in standalone script scripts
loadEnvConfig(process.cwd());

// Connection parameters
const DATABASE_URL = process.env.DATABASE_URL;
let pgPool: Pool | null = null;
let sqliteInstance: DatabaseSync | null = null;

let allTablesInitialized = false;
async function ensureAllTablesInitialized() {
  if (allTablesInitialized) return;
  try {
    await initQuotaTables();
    await initCouponTables();
    await initAdminTables();
    await initAdminLogTable();
    await initBackupLogsTable();
    await initBlogPostsTable();
    await initBlockedIpsTable();
    allTablesInitialized = true;
  } catch (err) {
    console.error('Failed to initialize all database tables:', err);
  }
}

// Lightweight in-memory cache for static lookup queries (1 hour TTL)
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const cacheMap = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCachedData<T>(key: string): T | null {
  const entry = cacheMap.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  cacheMap.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL_MS
  });
}

/**
 * Returns a PostgreSQL Connection Pool singleton if DATABASE_URL is configured.
 */
function getPGPool(): Pool {
  if (!pgPool) {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not defined.');
    }
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pgPool;
}

/**
 * Returns the SQLite DatabaseSync singleton for local fallback.
 */
function getSQLiteDB(): DatabaseSync {
  if (!sqliteInstance) {
    const DB_PATH = path.resolve(process.cwd(), '../kigyou-list.db');
    try {
      sqliteInstance = new DatabaseSync(DB_PATH);
    } catch (error) {
      console.error('Failed to open SQLite database at:', DB_PATH, error);
      throw error;
    }
  }
  return sqliteInstance;
}

/**
 * Legacy export for backward compatibility or direct DB operations.
 */
export function getDB(): DatabaseSync {
  return getSQLiteDB();
}

/**
 * Helper to dynamically convert standard '?' SQL query placeholders 
 * to PostgreSQL '$1', '$2', '$3' numbered placeholders.
 */
function convertSqlForPG(sql: string): string {
  // Strip SQLite-specific INDEXED BY clauses
  const cleanSql = sql.replace(/INDEXED\s+BY\s+\w+/gi, '');
  let index = 1;
  return cleanSql.replace(/\?/g, () => `$${index++}`);
}

/**
 * Executes a SELECT query returning multiple rows, supporting both PostgreSQL and SQLite.
 */
export async function runQuery(sql: string, params: any[] = []): Promise<any[]> {
  await ensureAllTablesInitialized();
  const isPG = !!DATABASE_URL;
  if (isPG) {
    const pool = getPGPool();
    const convertedSql = convertSqlForPG(sql);
    const result = await pool.query(convertedSql, params);
    return result.rows;
  } else {
    const db = getSQLiteDB();
    const stmt = db.prepare(sql);
    const results = stmt.all(...params);
    return results;
  }
}

/**
 * Executes a SELECT query returning a single row, supporting both PostgreSQL and SQLite.
 */
export async function runGetQuery(sql: string, params: any[] = []): Promise<any | null> {
  await ensureAllTablesInitialized();
  const isPG = !!DATABASE_URL;
  if (isPG) {
    const pool = getPGPool();
    const convertedSql = convertSqlForPG(sql);
    const result = await pool.query(convertedSql, params);
    return result.rows[0] || null;
  } else {
    const db = getSQLiteDB();
    const stmt = db.prepare(sql);
    const result = stmt.get(...params);
    return result || null;
  }
}

export interface CompanyIndustryDetail {
  industry_code: string;
  industry_name: string;
  classification_level: string;
}

// Interface definitions based on Database Schema
export interface Company {
  corporate_number: string;
  company_name: string;
  company_name_kana: string | null;
  company_name_en: string | null;
  postal_code: string | null;
  prefecture_code: string | null;
  prefecture_name: string | null;
  city_name: string | null;
  street_address: string | null;
  full_address: string | null;
  representative_name: string | null;
  representative_position: string | null;
  establishment_date: string | null;
  capital_amount: number | null;
  employee_count: number | null;
  sales_amount: number | null;
  phone_number: string | null;
  fax_number: string | null;
  website_url: string | null;
  email_address: string | null;
  business_summary: string | null;
  jigyo_shumoku: string | null;
  branch_phone_numbers: string | null;
  status: string;
  is_detailed: boolean;
  created_at: string;
  updated_at: string;
  industries?: CompanyIndustryDetail[];
}

export interface Industry {
  industry_code: string;
  industry_name: string;
  classification_level: string;
  parent_code: string | null;
}

export interface BusinessSignal {
  id: number;
  corporate_number: string;
  signal_type: '求人あり' | '補助金受給' | '調達案件' | '特許取得' | string;
  signal_title: string;
  signal_date: string | null;
  source_url: string | null;
  details: string | null;
  total_count?: number;
}

export interface CompanyFinancial {
  corporate_number: string;
  fiscal_year: string;
  sequence_number: number; // Dynamically added index (0 = latest)
  period_number: number | null;
  revenue: number | null;
  sales_amount: number | null; // Compatibility alias
  operating_income: number | null;
  ordinary_income: number | null;
  net_income: number | null;
  capital: number | null;
  capital_amount: number | null; // Compatibility alias
  total_assets: number | null;
  net_assets: number | null;
  liquid_assets: number | null;
  fixed_assets: number | null;
  liquid_liabilities: number | null;
  fixed_liabilities: number | null;
  retained_earnings: number | null;
  shareholders_json: string | null;
  source_type: string;
}

export interface SearchFilters {
  prefecture_code?: string;
  city_name?: string;
  industry_code?: string;
  min_employees?: number;
  max_employees?: number;
  min_capital?: number;
  max_capital?: number;
  has_hiring?: boolean;
  has_subsidy?: boolean;
  has_bidding?: boolean;
  has_award?: boolean;
  has_certification?: boolean;
  has_patent?: boolean;
  has_financials?: boolean;
  min_establishment_year?: number;
  max_establishment_year?: number;
  min_sales?: number;
  max_sales?: number;
  has_email?: boolean;
  has_phone?: boolean;
  has_website?: boolean;
  has_fax?: boolean;
  company_status?: string;
  min_operating_income?: number;
  max_operating_income?: number;
  min_ordinary_income?: number;
  max_ordinary_income?: number;
  min_net_income?: number;
  max_net_income?: number;
  cursor_emp?: number;  // Keyset cursor: employee count of last item
  cursor_corp?: string; // Keyset cursor: corporate number of last item
}

/**
 * Maps database rows to Company interface to clean BIGINT representations from PostgreSQL
 */
function mapCompanyRow(row: any): Company {
  return {
    corporate_number: row.corporate_number,
    company_name: row.company_name,
    company_name_kana: row.company_name_kana || null,
    company_name_en: row.company_name_en || null,
    postal_code: row.postal_code || null,
    prefecture_code: row.prefecture_code || null,
    prefecture_name: row.prefecture_name || null,
    city_name: row.city_name || null,
    street_address: row.street_address || null,
    full_address: row.full_address || null,
    representative_name: row.representative_name || null,
    representative_position: row.representative_position || null,
    establishment_date: row.establishment_date || null,
    capital_amount: row.capital_amount !== null && row.capital_amount !== undefined ? Number(row.capital_amount) : null,
    employee_count: row.employee_count !== null && row.employee_count !== undefined ? Number(row.employee_count) : null,
    sales_amount: row.sales_amount !== null && row.sales_amount !== undefined ? Number(row.sales_amount) : null,
    phone_number: row.phone_number || null,
    fax_number: row.fax_number || null,
    website_url: row.website_url || null,
    email_address: row.email_address || null,
    business_summary: row.business_summary || null,
    jigyo_shumoku: row.jigyo_shumoku || null,
    branch_phone_numbers: row.branch_phone_numbers || null,
    status: row.status || '活動中',
    is_detailed: !!row.is_detailed,
    created_at: row.created_at ? String(row.created_at) : '',
    updated_at: row.updated_at ? String(row.updated_at) : '',
  };
}

/**
 * Maps database rows to CompanyFinancial interface
 */
function mapFinancialRow(row: any, idx: number): CompanyFinancial {
  return {
    corporate_number: row.corporate_number,
    fiscal_year: row.fiscal_year,
    sequence_number: idx,
    period_number: row.period_number !== null && row.period_number !== undefined ? Number(row.period_number) : null,
    revenue: row.revenue !== null && row.revenue !== undefined ? Number(row.revenue) : null,
    sales_amount: row.revenue !== null && row.revenue !== undefined ? Number(row.revenue) : null,
    operating_income: row.operating_income !== null && row.operating_income !== undefined ? Number(row.operating_income) : null,
    ordinary_income: row.ordinary_income !== null && row.ordinary_income !== undefined ? Number(row.ordinary_income) : null,
    net_income: row.net_income !== null && row.net_income !== undefined ? Number(row.net_income) : null,
    capital: row.capital !== null && row.capital !== undefined ? Number(row.capital) : null,
    capital_amount: row.capital !== null && row.capital !== undefined ? Number(row.capital) : null,
    total_assets: row.total_assets !== null && row.total_assets !== undefined ? Number(row.total_assets) : null,
    net_assets: row.net_assets !== null && row.net_assets !== undefined ? Number(row.net_assets) : null,
    liquid_assets: row.liquid_assets !== null && row.liquid_assets !== undefined ? Number(row.liquid_assets) : null,
    fixed_assets: row.fixed_assets !== null && row.fixed_assets !== undefined ? Number(row.fixed_assets) : null,
    liquid_liabilities: row.liquid_liabilities !== null && row.liquid_liabilities !== undefined ? Number(row.liquid_liabilities) : null,
    fixed_liabilities: row.fixed_liabilities !== null && row.fixed_liabilities !== undefined ? Number(row.fixed_liabilities) : null,
    retained_earnings: row.retained_earnings !== null && row.retained_earnings !== undefined ? Number(row.retained_earnings) : null,
    shareholders_json: row.shareholders_json || null,
    source_type: row.source_type || '',
  };
}

/**
 * Fetch a single company by corporate_number
 */
export async function getCompanyByNumber(corpNum: string): Promise<Company | null> {
  try {
    const row = await runGetQuery('SELECT * FROM companies WHERE corporate_number = ? LIMIT 1', [corpNum]);
    return row ? mapCompanyRow(row) : null;
  } catch (error) {
    console.error(`Error in getCompanyByNumber(${corpNum}):`, error);
    return null;
  }
}

/**
 * Fetch historical financial records for a company sorted by fiscal_year DESC
 */
export async function getCompanyFinancials(corpNum: string): Promise<CompanyFinancial[]> {
  try {
    const rows = await runQuery('SELECT * FROM financial_records WHERE corporate_number = ? ORDER BY fiscal_year DESC', [corpNum]);
    return rows.map((row, idx) => mapFinancialRow(row, idx));
  } catch (error) {
    console.error(`Error in getCompanyFinancials(${corpNum}):`, error);
    return [];
  }
}

/**
 * Fetch business signals for a company sorted by signal_date DESC
 */
export async function getCompanySignals(corpNum: string): Promise<BusinessSignal[]> {
  try {
    const rows = await runQuery(`
      SELECT id, corporate_number, signal_type, signal_title, signal_date, source_url, details, total_count
      FROM (
        SELECT *, 
               ROW_NUMBER() OVER (PARTITION BY signal_type ORDER BY signal_date DESC, id DESC) as rn,
               COUNT(*) OVER (PARTITION BY signal_type) as total_count
        FROM business_signals 
        WHERE corporate_number = ?
      ) t
      WHERE rn <= 20
      ORDER BY signal_date DESC, id DESC
    `, [corpNum]);
    return rows ? (rows as BusinessSignal[]) : [];
  } catch (error) {
    console.error(`Error in getCompanySignals(${corpNum}):`, error);
    return [];
  }
}

/**
 * Fetch related companies for internal linking (同業他社 & 近隣企業)
 */
export async function getRelatedCompanies(
  corpNum: string, 
  industryCodes: string[], 
  prefectureCode: string | null
): Promise<{ sameIndustry: Company[]; nearby: Company[] }> {
  const sameIndustry: Company[] = [];
  const nearby: Company[] = [];

  try {
    if (industryCodes && industryCodes.length > 0) {
      const placeholders = industryCodes.map(() => '?').join(',');
      const rows = await runQuery(`
        SELECT * FROM companies 
        WHERE corporate_number IN (
          SELECT ci.corporate_number 
          FROM company_industries ci 
          WHERE ci.industry_code IN (${placeholders})
        ) AND corporate_number != ?
        LIMIT 10
      `, [...industryCodes, corpNum]);
      sameIndustry.push(...rows.map(mapCompanyRow));
    }

    if (prefectureCode) {
      const excludeIds = [corpNum, ...sameIndustry.map(c => c.corporate_number)];
      const placeholder = excludeIds.map(() => '?').join(',');
      const rows = await runQuery(`
        SELECT * FROM companies 
        WHERE prefecture_code = ? 
        AND corporate_number NOT IN (${placeholder})
        LIMIT 10
      `, [prefectureCode, ...excludeIds]);
      nearby.push(...rows.map(mapCompanyRow));
    }
  } catch (error) {
    console.error(`Error in getRelatedCompanies(${corpNum}):`, error);
  }

  return { sameIndustry, nearby };
}

/**
 * Fetch all available prefectures with company counts for search sidebar
 */
export async function getPrefecturesWithCounts(): Promise<{ code: string; name: string; count: number }[]> {
  const cacheKey = 'prefectures_with_counts';
  const cached = getCachedData<{ code: string; name: string; count: number }[]>(cacheKey);
  if (cached) return cached;

  try {
    const rows = await runQuery(`
      SELECT prefecture_code as code, prefecture_name as name, company_count as count 
      FROM prefecture_counts
      ORDER BY company_count DESC
    `);
    const result = rows ? rows.map(r => ({ code: r.code, name: r.name, count: Number(r.count) })) : [];
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error in getPrefecturesWithCounts:', error);
    return [];
  }
}

/**
 * Fetch cities with company counts for a specific prefecture code
 */
export async function getCitiesWithCounts(prefectureCode: string): Promise<{ cityName: string; count: number }[]> {
  try {
    const rows = await runQuery(`
      SELECT city_name, company_count
      FROM city_counts
      WHERE prefecture_code = ?
      ORDER BY company_count DESC, city_name ASC
    `, [prefectureCode]);
    return rows ? rows.map(r => ({ cityName: r.city_name, count: Number(r.company_count) })) : [];
  } catch (error) {
    console.error(`Error in getCitiesWithCounts(${prefectureCode}):`, error);
    return [];
  }
}

/**
 * Fetch all industries with company counts for search sidebar
 */
export async function getIndustriesWithCounts(): Promise<{ code: string; name: string; count: number }[]> {
  try {
    const rows = await runQuery(`
      SELECT industry_code as code, industry_name as name, company_count as count
      FROM industry_counts
      ORDER BY company_count DESC
    `);
    return rows ? rows.map(r => ({ code: r.code, name: r.name, count: Number(r.count) })) : [];
  } catch (error) {
    console.error('Error in getIndustriesWithCounts:', error);
    return [];
  }
}

export interface MediumIndustry {
  code: string;
  name: string;
  count: number;
}

export interface MajorIndustry {
  code: string;
  name: string;
  totalCount: number;
  children: MediumIndustry[];
}

/**
 * Fetch JSIC hierarchy: 大分類 (A-T) with nested 中分類 (01-99) and counts.
 */
export async function getIndustriesHierarchy(): Promise<MajorIndustry[]> {
  const cacheKey = 'industries_hierarchy';
  const cached = getCachedData<MajorIndustry[]>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch industry definitions and count of companies from industry_counts table in a single query
    const rows = await runQuery(`
      SELECT 
        m.industry_code as code,
        m.industry_name as name,
        m.classification_level as level,
        m.parent_code as parent_code,
        COALESCE(ic.company_count, 0) as count
      FROM m_industries m
      LEFT JOIN industry_counts ic ON m.industry_code = ic.industry_code
      ORDER BY m.industry_code
    `);

    const majors = rows.filter(r => r.level === '大分類');
    const mediums = rows.filter(r => r.level === '中分類');

    // Aggregate counts in-memory to prevent N database round trips
    const result = majors.map((major) => {
      const children: MediumIndustry[] = mediums
        .filter(m => m.parent_code === major.code)
        .sort((a, b) => {
          const numA = parseInt(a.code, 10);
          const numB = parseInt(b.code, 10);
          if (isNaN(numA) || isNaN(numB)) {
            return a.code.localeCompare(b.code);
          }
          return numA - numB;
        })
        .map(m => ({ code: m.code, name: m.name, count: Number(m.count) }));

      const childrenSum = children.reduce((sum, child) => sum + child.count, 0);
      const totalCount = Number(major.count) + childrenSum;

      return {
        code: major.code,
        name: major.name,
        totalCount,
        children,
      };
    });

    const finalResult = result.sort((a, b) => a.code.localeCompare(b.code));
    setCachedData(cacheKey, finalResult);
    return finalResult;
  } catch (error) {
    console.error('Error in getIndustriesHierarchy:', error);
    return [];
  }
}

/**
 * Helper to build dynamic SQL queries for faceted search
 */
function buildSearchQuery(
  keyword: string, 
  filters: SearchFilters, 
  isCountOnly = false,
  useForcedIndex = false
): { sql: string; params: any[] } {
  const selectColumns = `
    c.corporate_number, c.company_name, c.company_name_kana, c.company_name_en, 
    c.postal_code, c.prefecture_code, c.prefecture_name, c.city_name, 
    c.street_address, c.full_address, c.representative_name, c.representative_position, 
    c.establishment_date, c.capital_amount, c.employee_count, c.sales_amount, 
    c.phone_number, c.fax_number, c.website_url, c.email_address, 
    c.jigyo_shumoku, c.branch_phone_numbers, c.status, c.is_detailed, c.created_at, c.updated_at
  `;
  const sql = isCountOnly 
    ? 'SELECT COUNT(*) as count FROM companies c' 
    : (useForcedIndex 
        ? `SELECT ${selectColumns} FROM companies c INDEXED BY idx_companies_employees_corp` 
        : `SELECT ${selectColumns} FROM companies c`);
  
  const params: any[] = [];
  const whereClauses: string[] = [];

  // Industry filter (rewritten to utilize materialized path for major industries and exact code for medium industries)
  if (filters.industry_code) {
    const isMajor = /^[A-Z]$/.test(filters.industry_code);
    if (isMajor) {
      whereClauses.push(
        'c.corporate_number IN (' +
        '  SELECT ci.corporate_number FROM company_industries ci' +
        '  WHERE ci.industry_path LIKE ?' +
        ')'
      );
      params.push(`${filters.industry_code}%`);
    } else {
      whereClauses.push(
        'c.corporate_number IN (' +
        '  SELECT ci.corporate_number FROM company_industries ci' +
        '  WHERE ci.industry_code = ?' +
        '  UNION' +
        '  SELECT ci.corporate_number FROM company_industries ci' +
        '  WHERE ci.industry_code = (SELECT parent_code FROM m_industries WHERE industry_code = ? LIMIT 1)' +
        '    AND ci.is_detailed = false' +
        ')'
      );
      params.push(filters.industry_code, filters.industry_code);
    }
  }

  // Text search keyword
  if (keyword) {
    const trimmed = `%${keyword.trim()}%`;
    whereClauses.push('(c.company_name LIKE ? OR c.jigyo_shumoku LIKE ? OR c.full_address LIKE ?)');
    params.push(trimmed, trimmed, trimmed);
  }

  // Location filter
  if (filters.prefecture_code) {
    whereClauses.push('c.prefecture_code = ?');
    params.push(filters.prefecture_code);
  }
  if (filters.city_name) {
    whereClauses.push('c.city_name = ?');
    params.push(filters.city_name);
  }

  // Employee count filter
  if (filters.min_employees !== undefined) {
    whereClauses.push('c.employee_count >= ?');
    params.push(filters.min_employees);
  }
  if (filters.max_employees !== undefined) {
    whereClauses.push('c.employee_count <= ?');
    params.push(filters.max_employees);
  }

  // Capital filter (inputs are in 万円, database stores in raw Yen, so multiply by 10,000)
  if (filters.min_capital !== undefined) {
    whereClauses.push('c.capital_amount >= ?');
    params.push(filters.min_capital * 10000);
  }
  if (filters.max_capital !== undefined) {
    whereClauses.push('c.capital_amount <= ?');
    params.push(filters.max_capital * 10000);
  }

  // Signal filters (rewritten to IN subqueries to utilize indexed search on signal_type)
  if (filters.has_hiring) {
    whereClauses.push("c.corporate_number IN (SELECT bs.corporate_number FROM business_signals bs WHERE bs.signal_type = '求人あり')");
  }
  if (filters.has_subsidy) {
    whereClauses.push("c.corporate_number IN (SELECT bs.corporate_number FROM business_signals bs WHERE bs.signal_type = '補助金受給')");
  }
  if (filters.has_bidding) {
    whereClauses.push("c.corporate_number IN (SELECT bs.corporate_number FROM business_signals bs WHERE bs.signal_type = '調達案件')");
  }
  if (filters.has_award) {
    whereClauses.push("c.corporate_number IN (SELECT bs.corporate_number FROM business_signals bs WHERE bs.signal_type = '表彰')");
  }
  if (filters.has_certification) {
    whereClauses.push("c.corporate_number IN (SELECT bs.corporate_number FROM business_signals bs WHERE bs.signal_type = '届出認定')");
  }
  if (filters.has_patent) {
    whereClauses.push("c.corporate_number IN (SELECT bs.corporate_number FROM business_signals bs WHERE bs.signal_type = '特許')");
  }
  if (filters.has_financials) {
    whereClauses.push("c.corporate_number IN (SELECT fr.corporate_number FROM financial_records fr)");
  }

  // Founding year range filters
  if (filters.min_establishment_year !== undefined) {
    whereClauses.push("c.establishment_date >= ?");
    params.push(String(filters.min_establishment_year));
  }
  if (filters.max_establishment_year !== undefined) {
    whereClauses.push("c.establishment_date < ?");
    params.push(String(filters.max_establishment_year + 1));
  }

  // Sales filter (inputs are in 億円, database stores in raw Yen, so multiply by 100,000,000)
  if (filters.min_sales !== undefined) {
    whereClauses.push('c.sales_amount >= ?');
    params.push(filters.min_sales * 100000000);
  }
  if (filters.max_sales !== undefined) {
    whereClauses.push('c.sales_amount <= ?');
    params.push(filters.max_sales * 100000000);
  }

  // Contact presence filters
  if (filters.has_email === true) {
    whereClauses.push("c.email_address IS NOT NULL AND c.email_address != ''");
  }
  if (filters.has_phone === true) {
    whereClauses.push("c.phone_number IS NOT NULL AND c.phone_number != ''");
  }
  if (filters.has_website === true) {
    whereClauses.push("c.website_url IS NOT NULL AND c.website_url != ''");
  }
  if (filters.has_fax === true) {
    whereClauses.push("c.fax_number IS NOT NULL AND c.fax_number != ''");
  }

  // Status filter
  if (filters.company_status) {
    whereClauses.push("c.status = ?");
    params.push(filters.company_status);
  }

  // Growth & Advanced Financial Filters
  const financialClauses: string[] = [];
  const financialParams: any[] = [];
  

  if (filters.min_operating_income !== undefined) {
    financialClauses.push('fr.operating_income >= ?');
    financialParams.push(filters.min_operating_income * 100000000);
  }
  if (filters.max_operating_income !== undefined) {
    financialClauses.push('fr.operating_income <= ?');
    financialParams.push(filters.max_operating_income * 100000000);
  }
  if (filters.min_ordinary_income !== undefined) {
    financialClauses.push('fr.ordinary_income >= ?');
    financialParams.push(filters.min_ordinary_income * 100000000);
  }
  if (filters.max_ordinary_income !== undefined) {
    financialClauses.push('fr.ordinary_income <= ?');
    financialParams.push(filters.max_ordinary_income * 100000000);
  }
  if (filters.min_net_income !== undefined) {
    financialClauses.push('fr.net_income >= ?');
    financialParams.push(filters.min_net_income * 100000000);
  }
  if (filters.max_net_income !== undefined) {
    financialClauses.push('fr.net_income <= ?');
    financialParams.push(filters.max_net_income * 100000000);
  }

  if (financialClauses.length > 0) {
    const isPG = !!DATABASE_URL;
    let subquery = '';
    if (isPG) {
      subquery = `c.corporate_number IN (
        SELECT fr.corporate_number
        FROM (
          SELECT DISTINCT ON (corporate_number) corporate_number, operating_income, ordinary_income, net_income
          FROM financial_records
          ORDER BY corporate_number, fiscal_year DESC
        ) fr
        WHERE ${financialClauses.join(' AND ')}
      )`;
    } else {
      let sqliteSubquery = `c.corporate_number IN (
        SELECT fr.corporate_number
        FROM financial_records fr
        JOIN (
          SELECT corporate_number, MAX(fiscal_year) AS max_year
          FROM financial_records
          GROUP BY corporate_number
        ) fr_latest ON fr.corporate_number = fr_latest.corporate_number
          AND fr.fiscal_year = fr_latest.max_year
      `;
      sqliteSubquery += ` WHERE ${financialClauses.join(' AND ')}`;
      sqliteSubquery += ')';
      subquery = sqliteSubquery;
    }
    
    whereClauses.push(subquery);
    params.push(...financialParams);
  }

  // Keyset Pagination Cursor Filter (only on data fetch, not count query)
  if (!isCountOnly && filters.cursor_emp !== undefined && filters.cursor_corp !== undefined) {
    whereClauses.push('((c.employee_count < ? OR c.employee_count IS NULL) OR (c.employee_count = ? AND c.corporate_number > ?))');
    params.push(filters.cursor_emp, filters.cursor_emp, filters.cursor_corp);
  }

  // Filter out hidden companies
  whereClauses.push("c.corporate_number NOT IN (SELECT corporate_number FROM hidden_companies)");

  let finalSql = sql;
  if (whereClauses.length > 0) {
    finalSql += ' WHERE ' + whereClauses.join(' AND ');
  }

  return { sql: finalSql, params };
}

export interface DatabaseStats {
  totalCompanies: number;
  totalPrefectures: number;
  totalIndustries: number;
  signalHiring: number;
  signalSubsidy: number;
  signalBidding: number;
  signalAward: number;
  signalCertification: number;
  signalPatent: number;
}

/**
 * Core search query executor with cursor-based Keyset Pagination support
 */
export async function searchCompanies(
  keyword: string, 
  filters: SearchFilters, 
  limit = 20, 
  offset = 0
): Promise<{ companies: Company[]; totalCount: number }> {
  try {
    // 1. Get total count for pagination (ignores Keyset filters)
    // Count how many search criteria / filters are active to determine if we can use cached counts.
    const activeFiltersList: string[] = [];
    if (keyword) activeFiltersList.push('keyword');
    if (filters.prefecture_code) activeFiltersList.push('prefecture');
    if (filters.city_name) activeFiltersList.push('city');
    if (filters.industry_code) activeFiltersList.push('industry');
    if (filters.min_employees !== undefined || filters.max_employees !== undefined) activeFiltersList.push('employees');
    if (filters.min_capital !== undefined || filters.max_capital !== undefined) activeFiltersList.push('capital');
    if (filters.has_hiring) activeFiltersList.push('hiring');
    if (filters.has_subsidy) activeFiltersList.push('subsidy');
    if (filters.has_bidding) activeFiltersList.push('bidding');
    if (filters.has_award) activeFiltersList.push('award');
    if (filters.has_certification) activeFiltersList.push('certification');
    if (filters.has_patent) activeFiltersList.push('patent');
    if (filters.has_financials) activeFiltersList.push('financials');
    if (filters.min_establishment_year !== undefined || filters.max_establishment_year !== undefined) activeFiltersList.push('establishment_year');
    if (filters.min_sales !== undefined || filters.max_sales !== undefined) activeFiltersList.push('sales');
    if (filters.has_email) activeFiltersList.push('email');
    if (filters.has_phone) activeFiltersList.push('phone');
    if (filters.has_website) activeFiltersList.push('website');
    if (filters.has_fax) activeFiltersList.push('fax');
    if (filters.company_status) activeFiltersList.push('status');

    if (filters.min_operating_income !== undefined || filters.max_operating_income !== undefined) activeFiltersList.push('operating_income');
    if (filters.min_ordinary_income !== undefined || filters.max_ordinary_income !== undefined) activeFiltersList.push('ordinary_income');
    if (filters.min_net_income !== undefined || filters.max_net_income !== undefined) activeFiltersList.push('net_income');

    let totalCount = 0;
    
    if (activeFiltersList.length === 0) {
      // No active filters -> read total companies count from cache
      const stats = await getDatabaseStats();
      totalCount = stats.totalCompanies;
    } else if (activeFiltersList.length === 2 && activeFiltersList.includes('prefecture') && activeFiltersList.includes('city') && filters.prefecture_code && filters.city_name) {
      // Prefecture + City filter -> read from city_counts table (0ms)
      const row = await runGetQuery('SELECT company_count FROM city_counts WHERE prefecture_code = ? AND city_name = ?', [filters.prefecture_code, filters.city_name]);
      totalCount = row ? Number(row.company_count) : 0;
    } else if (activeFiltersList.length === 1) {
      // Exactly one filter -> read from metadata/stats tables if possible (0ms query)
      const singleFilter = activeFiltersList[0];
      
      if (singleFilter === 'prefecture' && filters.prefecture_code) {
        const row = await runGetQuery('SELECT company_count FROM prefecture_counts WHERE prefecture_code = ?', [filters.prefecture_code]);
        totalCount = row ? Number(row.company_count) : 0;
      } else if (singleFilter === 'city' && filters.prefecture_code && filters.city_name) {
        const row = await runGetQuery('SELECT company_count FROM city_counts WHERE prefecture_code = ? AND city_name = ?', [filters.prefecture_code, filters.city_name]);
        totalCount = row ? Number(row.company_count) : 0;
      } else if (singleFilter === 'industry' && filters.industry_code) {
        const row = await runGetQuery('SELECT company_count FROM industry_counts WHERE industry_code = ?', [filters.industry_code]);
        totalCount = row ? Number(row.company_count) : 0;
      } else if (singleFilter === 'hiring') {
        const stats = await getDatabaseStats();
        totalCount = stats.signalHiring;
      } else if (singleFilter === 'subsidy') {
        const stats = await getDatabaseStats();
        totalCount = stats.signalSubsidy;
      } else if (singleFilter === 'bidding') {
        const stats = await getDatabaseStats();
        totalCount = stats.signalBidding;
      } else if (singleFilter === 'award') {
        const stats = await getDatabaseStats();
        totalCount = stats.signalAward;
      } else if (singleFilter === 'certification') {
        const stats = await getDatabaseStats();
        totalCount = stats.signalCertification;
      } else if (singleFilter === 'patent') {
        const stats = await getDatabaseStats();
        totalCount = stats.signalPatent;
      } else if (singleFilter === 'financials') {
        const row = await runGetQuery(`
          SELECT COUNT(DISTINCT fr.corporate_number) as count 
          FROM financial_records fr 
          WHERE fr.corporate_number NOT IN (SELECT corporate_number FROM hidden_companies)
        `);
        totalCount = row ? Number(row.count) : 0;
      } else {
        // Not directly cached -> execute count query
        const countQuery = buildSearchQuery(keyword, filters, true);
        const countResult = await runGetQuery(countQuery.sql, countQuery.params);
        totalCount = countResult ? Number(countResult.count) : 0;
      }
    } else {
      // Multiple active filters -> execute count query
      const countQuery = buildSearchQuery(keyword, filters, true);
      const countResult = await runGetQuery(countQuery.sql, countQuery.params);
      totalCount = countResult ? Number(countResult.count) : 0;
    }

    if (totalCount === 0) {
      return { companies: [], totalCount: 0 };
    }

    // 2. Fetch page of results
    // We only force the sorting index if we have 0 or 1 active filters and no keyword text search.
    // This is because multiple filter combinations are highly selective, and forcing the index causes SQLite to scan the entire 5M row index.
    const useForcedIndex = !keyword && activeFiltersList.length <= 1;
    const dataQuery = buildSearchQuery(keyword, filters, false, useForcedIndex);
    let sql = dataQuery.sql;
    
    // Sort descending by employees, and ascending by corporate number as tie-breaker
    // If complex filters (signals, industry, keyword) are active on PostgreSQL, we use (c.employee_count + 0) 
    // to prevent the DB optimizer from choosing a slow nested loop index scan with LIMIT optimization.
    const isPG = !!DATABASE_URL;
    const hasComplexFilters = !!(
      keyword ||
      filters.industry_code
    );
    if (isPG) {
      if (hasComplexFilters) {
        sql += ' ORDER BY (c.employee_count + 0) DESC NULLS LAST, c.corporate_number ASC';
      } else {
        sql += ' ORDER BY c.employee_count DESC NULLS LAST, c.corporate_number ASC';
      }
    } else {
      sql += ' ORDER BY c.employee_count DESC, c.corporate_number ASC';
    }
    
    const params = [...dataQuery.params];
    if (filters.cursor_emp !== undefined && filters.cursor_corp !== undefined) {
      sql += ' LIMIT ?';
      params.push(limit);
    } else {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    
    const results = await runQuery(sql, params);
    const companies = results.map(mapCompanyRow);

    if (companies.length > 0) {
      const corpNums = companies.map(c => c.corporate_number);
      const placeholders = corpNums.map(() => '?').join(',');
      const indRows = await runQuery(`
        SELECT ci.corporate_number, ci.industry_code, m.industry_name, m.classification_level
        FROM company_industries ci
        JOIN m_industries m ON ci.industry_code = m.industry_code
        WHERE ci.corporate_number IN (${placeholders})
        ORDER BY LENGTH(ci.industry_code) ASC, ci.industry_code ASC
      `, corpNums);

      const indMap: Record<string, CompanyIndustryDetail[]> = {};
      for (const row of indRows) {
        const corp = String(row.corporate_number);
        if (!indMap[corp]) indMap[corp] = [];
        indMap[corp].push({
          industry_code: String(row.industry_code),
          industry_name: String(row.industry_name),
          classification_level: String(row.classification_level)
        });
      }

      for (const company of companies) {
        company.industries = indMap[company.corporate_number] || [];
      }
    }

    return {
      companies,
      totalCount
    };
  } catch (error) {
    console.error('Error in searchCompanies:', error, filters);
    return { companies: [], totalCount: 0 };
  }
}

/**
 * Fetch database metadata stats for homepage dynamic counters and signal filters
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const cacheKey = 'database_stats';
  const cached = getCachedData<DatabaseStats>(cacheKey);
  if (cached) return cached;

  try {
    const rows = await runQuery('SELECT stat_key, stat_value FROM database_stats');
    const stats: Record<string, number> = {};
    if (rows) {
      rows.forEach(r => {
        stats[r.stat_key] = Number(r.stat_value);
      });
    }
    const result = {
      totalCompanies: stats['total_companies'] || 0,
      totalPrefectures: stats['total_prefectures'] || 0,
      totalIndustries: stats['total_industries'] || 0,
      signalHiring: stats['signal_hiring'] || 0,
      signalSubsidy: stats['signal_subsidy'] || 0,
      signalBidding: stats['signal_bidding'] || 0,
      signalAward: stats['signal_award'] || 0,
      signalCertification: stats['signal_certification'] || 0,
      signalPatent: stats['signal_patent'] || 0,
    };
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error in getDatabaseStats:', error);
    return {
      totalCompanies: 5057330,
      totalPrefectures: 47,
      totalIndustries: 119,
      signalHiring: 83293,
      signalSubsidy: 75289,
      signalBidding: 21080,
      signalAward: 8154,
      signalCertification: 69745,
      signalPatent: 4465859,
    };
  }
}

/**
 * Fetch a single industry by industry_code
 */
export async function getIndustryByCode(code: string): Promise<Industry | null> {
  try {
    const result = await runGetQuery('SELECT * FROM m_industries WHERE industry_code = ? LIMIT 1', [code]);
    return result ? (result as Industry) : null;
  } catch (error) {
    console.error(`Error in getIndustryByCode(${code}):`, error);
    return null;
  }
}

/**
 * Fetch prefecture code and name by prefecture_code
 */
export async function getPrefectureByCode(code: string): Promise<{ code: string; name: string } | null> {
  try {
    const result = await runGetQuery('SELECT DISTINCT prefecture_code as code, prefecture_name as name FROM companies WHERE prefecture_code = ? LIMIT 1', [code]);
    return result ? { code: result.code, name: result.name } : null;
  } catch (error) {
    console.error(`Error in getPrefectureByCode(${code}):`, error);
    return null;
  }
}

/**
 * Fetch all unique pairs of active industry and prefecture that have at least 1 company
 */
export async function getActiveIndustryPrefecturePairs(): Promise<{ industry_code: string; prefecture_code: string }[]> {
  try {
    const results = await runQuery(`
      SELECT DISTINCT ci.industry_code, c.prefecture_code
      FROM company_industries ci
      JOIN companies c ON ci.corporate_number = c.corporate_number
      WHERE c.prefecture_code IS NOT NULL AND ci.industry_code IS NOT NULL
    `);
    return results ? (results as { industry_code: string; prefecture_code: string }[]) : [];
  } catch (error) {
    console.error('Error in getActiveIndustryPrefecturePairs:', error);
    return [];
  }
}

/**
 * Fetch aggregated statistics for an industry + prefecture category pair
 */
export async function getCategoryStats(industryCode: string, prefectureCode: string): Promise<{ count: number; avgCapital: number }> {
  try {
    const result = await runGetQuery(`
      SELECT COUNT(DISTINCT c.corporate_number) as count, AVG(c.capital_amount) as avgCapital
      FROM companies c
      JOIN company_industries ci ON c.corporate_number = ci.corporate_number
      WHERE ci.industry_code = ? AND c.prefecture_code = ?
    `, [industryCode, prefectureCode]);
    return {
      count: result ? Number(result.count) : 0,
      avgCapital: result && result.avgCapital ? Math.round(Number(result.avgCapital)) : 0
    };
  } catch (error) {
    console.error('Error in getCategoryStats:', error);
    return { count: 0, avgCapital: 0 };
  }
}

/**
 * Fetch company numbers, updated_at timestamps, and employee counts in chunks for high performance XML sitemaps
 */
export async function getSitemapCompanies(limit?: number, offset?: number): Promise<{ corporate_number: string; updated_at: string; employee_count: number | null }[]> {
  try {
    let sql = `
      SELECT corporate_number, updated_at, employee_count
      FROM sitemap_companies
      ORDER BY employee_count DESC, corporate_number ASC
    `;
    const params: any[] = [];
    if (limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    if (offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(offset);
    }
    const rows = await runQuery(sql, params);
    return rows ? rows.map(r => ({
      corporate_number: r.corporate_number,
      updated_at: r.updated_at ? String(r.updated_at) : '',
      employee_count: r.employee_count !== null && r.employee_count !== undefined ? Number(r.employee_count) : null,
    })) : [];
  } catch (error) {
    console.error('Error in getSitemapCompanies:', error);
    return [];
  }
}

/**
 * Fetch total count of companies that qualify for inclusion in the XML sitemaps
 */
export async function getSitemapCompaniesCount(): Promise<number> {
  try {
    const result = await runGetQuery(`
      SELECT COUNT(*) as count FROM sitemap_companies
    `);
    return result ? Number(result.count) : 0;
  } catch (error) {
    console.error('Error in getSitemapCompaniesCount:', error);
    return 0;
  }
}

/**
 * Preloads industry codes and names as a lookup dictionary
 */
export async function getIndustryMap(): Promise<Record<string, string>> {
  const cacheKey = 'industry_map';
  const cached = getCachedData<Record<string, string>>(cacheKey);
  if (cached) return cached;

  try {
    const rows = await runQuery('SELECT industry_code, industry_name FROM m_industries');
    const map: Record<string, string> = {};
    if (rows) {
      rows.forEach(row => {
        map[row.industry_code] = row.industry_name;
      });
    }
    setCachedData(cacheKey, map);
    return map;
  } catch (error) {
    console.error('Error in getIndustryMap:', error);
    return {};
  }
}

/**
 * Fetch sibling industries within the same prefecture to feed the SEO cross-linking matrix
 */
export async function getSiblingIndustries(prefectureCode: string, industryCode: string, limit = 5): Promise<{ code: string; name: string }[]> {
  try {
    const rows = await runQuery(`
      SELECT DISTINCT m.industry_code, m.industry_name 
      FROM m_industries m
      JOIN company_industries ci ON m.industry_code = ci.industry_code
      JOIN companies c ON ci.corporate_number = c.corporate_number
      WHERE c.prefecture_code = ? AND m.industry_code != ?
      LIMIT ?
    `, [prefectureCode, industryCode, limit]);
    return rows ? rows.map(r => ({ code: r.industry_code, name: r.industry_name })) : [];
  } catch (error) {
    console.error('Error in getSiblingIndustries:', error);
    return [];
  }
}

/**
 * Retrieves primary industry details tagged to a single company
 */
export async function getCompanyIndustry(corpNum: string): Promise<{ industry_code: string; industry_name: string } | null> {
  try {
    const row = await runGetQuery(`
      SELECT ci.industry_code, m.industry_name 
      FROM company_industries ci
      JOIN m_industries m ON ci.industry_code = m.industry_code
      WHERE ci.corporate_number = ? 
      ORDER BY LENGTH(ci.industry_code) ASC, ci.industry_code ASC
      LIMIT 1
    `, [corpNum]);
    return row ? { industry_code: row.industry_code, industry_name: row.industry_name } : null;
  } catch (error) {
    console.error('Error in getCompanyIndustry:', error);
    return null;
  }
}

// ==========================================
// PHASE 5: CSV EXPORT & QUOTA SYSTEMS
// ==========================================

export interface UserQuota {
  user_email: string;
  monthly_base_allowance: number;
  monthly_base_used: number;
  purchased_add_on_balance: number;
  plan?: string;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  subscription_status?: string | null;
}

export interface ExportJob {
  id: string;
  user_email: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filters_json: string | null;
  records_count: number;
  file_path: string | null;
  error_message: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface DepositRecord {
  id: string;
  user_email: string;
  pack_id: string;
  amount_jpy: number;
  lines_added: number;
  status: string;
  invoice_url: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

let tablesInitialized = false;

/**
 * Automatically initializes Quota and Export Job tracking schemas inside both SQLite and PostgreSQL.
 */
async function initQuotaTables(): Promise<void> {
  if (tablesInitialized) return;
  
  const isPG = !!DATABASE_URL;
  if (isPG) {
    const pool = getPGPool();
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_export_quotas (
          user_email VARCHAR(255) PRIMARY KEY,
          monthly_base_allowance INTEGER DEFAULT 20,
          monthly_base_used INTEGER DEFAULT 0,
          purchased_add_on_balance INTEGER DEFAULT 0,
          last_reset_date VARCHAR(10),
          plan VARCHAR(50) DEFAULT 'free',
          stripe_subscription_id VARCHAR(255),
          stripe_customer_id VARCHAR(255),
          subscription_status VARCHAR(50) DEFAULT 'inactive',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Attempt to alter table if columns don't exist (Postgres migrations)
      try {
        await client.query(`ALTER TABLE user_export_quotas ADD COLUMN last_reset_date VARCHAR(10);`);
      } catch {}
      try {
        await client.query(`ALTER TABLE user_export_quotas ADD COLUMN plan VARCHAR(50) DEFAULT 'free';`);
      } catch {}
      try {
        await client.query(`ALTER TABLE user_export_quotas ADD COLUMN stripe_subscription_id VARCHAR(255);`);
      } catch {}
      try {
        await client.query(`ALTER TABLE user_export_quotas ADD COLUMN stripe_customer_id VARCHAR(255);`);
      } catch {}
      try {
        await client.query(`ALTER TABLE user_export_quotas ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive';`);
      } catch {}

      await client.query(`
        CREATE TABLE IF NOT EXISTS export_jobs (
          id VARCHAR(50) PRIMARY KEY,
          user_email VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          filters_json TEXT,
          records_count INTEGER DEFAULT 0,
          file_path TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      try {
        await client.query(`ALTER TABLE export_jobs ADD COLUMN ip_address VARCHAR(50);`);
      } catch {}
      try {
        await client.query(`ALTER TABLE export_jobs ADD COLUMN user_agent TEXT;`);
      } catch {}

      await client.query(`
        CREATE TABLE IF NOT EXISTS deposit_history (
          id VARCHAR(100) PRIMARY KEY,
          user_email VARCHAR(255) NOT NULL,
          pack_id VARCHAR(50) NOT NULL,
          amount_jpy INTEGER NOT NULL,
          lines_added INTEGER NOT NULL,
          status VARCHAR(50) NOT NULL,
          invoice_url TEXT,
          ip_address VARCHAR(50),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      try {
        await client.query(`ALTER TABLE deposit_history ADD COLUMN ip_address VARCHAR(50);`);
      } catch {}
      try {
        await client.query(`ALTER TABLE deposit_history ADD COLUMN user_agent TEXT;`);
      } catch {}

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_billing_info (
          user_email VARCHAR(255) PRIMARY KEY,
          billing_name VARCHAR(255),
          billing_address TEXT,
          billing_tax_id VARCHAR(50),
          billing_phone VARCHAR(50),
          logo_url TEXT,
          is_featured_partner BOOLEAN DEFAULT false,
          contact_person VARCHAR(255),
          contact_phone VARCHAR(50),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      try {
        await client.query(`ALTER TABLE user_billing_info ADD COLUMN billing_phone VARCHAR(50);`);
      } catch {}
      try {
        await client.query(`ALTER TABLE user_billing_info ADD COLUMN logo_url TEXT;`);
      } catch {}
      try {
        await client.query(`ALTER TABLE user_billing_info ADD COLUMN is_featured_partner BOOLEAN DEFAULT false;`);
      } catch {}
      try {
        await client.query(`ALTER TABLE user_billing_info ADD COLUMN contact_person VARCHAR(255);`);
      } catch {}
      try {
        await client.query(`ALTER TABLE user_billing_info ADD COLUMN contact_phone VARCHAR(50);`);
      } catch {}

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_api_keys (
          id VARCHAR(100) PRIMARY KEY,
          user_email VARCHAR(255) NOT NULL,
          api_key_hash VARCHAR(255) NOT NULL UNIQUE,
          api_key_preview VARCHAR(50) NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_used_at TIMESTAMP,
          last_ip VARCHAR(50),
          last_user_agent TEXT
        );
      `);
      try {
        await client.query(`ALTER TABLE user_api_keys ADD COLUMN revoked_reason TEXT;`);
      } catch {}
      try {
        await client.query(`CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON user_api_keys(api_key_hash);`);
      } catch {}
      try {
        await client.query(`CREATE INDEX IF NOT EXISTS idx_api_keys_email ON user_api_keys(user_email);`);
      } catch {}

    } catch (e) {
      console.error('Error initializing PG quota tables:', e);
    } finally {
      client.release();
    }
  } else {
    try {
      const db = getSQLiteDB();
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_export_quotas (
          user_email TEXT PRIMARY KEY,
          monthly_base_allowance INTEGER DEFAULT 20,
          monthly_base_used INTEGER DEFAULT 0,
          purchased_add_on_balance INTEGER DEFAULT 0,
          last_reset_date TEXT,
          plan TEXT DEFAULT 'free',
          stripe_subscription_id TEXT,
          stripe_customer_id TEXT,
          subscription_status TEXT DEFAULT 'inactive',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Attempt to alter table if columns don't exist (SQLite migrations)
      try {
        db.exec(`ALTER TABLE user_export_quotas ADD COLUMN last_reset_date TEXT;`);
      } catch {}
      try {
        db.exec(`ALTER TABLE user_export_quotas ADD COLUMN plan TEXT DEFAULT 'free';`);
      } catch {}
      try {
        db.exec(`ALTER TABLE user_export_quotas ADD COLUMN stripe_subscription_id TEXT;`);
      } catch {}
      try {
        db.exec(`ALTER TABLE user_export_quotas ADD COLUMN stripe_customer_id TEXT;`);
      } catch {}
      try {
        db.exec(`ALTER TABLE user_export_quotas ADD COLUMN subscription_status TEXT DEFAULT 'inactive';`);
      } catch {}

      db.exec(`
        CREATE TABLE IF NOT EXISTS export_jobs (
          id TEXT PRIMARY KEY,
          user_email TEXT NOT NULL,
          status TEXT NOT NULL,
          filters_json TEXT,
          records_count INTEGER DEFAULT 0,
          file_path TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      try {
        db.exec(`ALTER TABLE export_jobs ADD COLUMN ip_address TEXT;`);
      } catch {}
      try {
        db.exec(`ALTER TABLE export_jobs ADD COLUMN user_agent TEXT;`);
      } catch {}

      db.exec(`
        CREATE TABLE IF NOT EXISTS deposit_history (
          id TEXT PRIMARY KEY,
          user_email TEXT NOT NULL,
          pack_id TEXT NOT NULL,
          amount_jpy INTEGER NOT NULL,
          lines_added INTEGER NOT NULL,
          status TEXT NOT NULL,
          invoice_url TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      try {
        db.exec(`ALTER TABLE deposit_history ADD COLUMN ip_address TEXT;`);
      } catch {}
      try {
        db.exec(`ALTER TABLE deposit_history ADD COLUMN user_agent TEXT;`);
      } catch {}

      db.exec(`
        CREATE TABLE IF NOT EXISTS user_billing_info (
          user_email TEXT PRIMARY KEY,
          billing_name TEXT,
          billing_address TEXT,
          billing_tax_id TEXT,
          billing_phone TEXT,
          logo_url TEXT,
          is_featured_partner INTEGER DEFAULT 0,
          contact_person TEXT,
          contact_phone TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      try {
        db.exec(`ALTER TABLE user_billing_info ADD COLUMN billing_phone TEXT;`);
      } catch {}
      try {
        db.exec(`ALTER TABLE user_billing_info ADD COLUMN logo_url TEXT;`);
      } catch {}
      try {
        db.exec(`ALTER TABLE user_billing_info ADD COLUMN is_featured_partner INTEGER DEFAULT 0;`);
      } catch {}
      try {
        db.exec(`ALTER TABLE user_billing_info ADD COLUMN contact_person TEXT;`);
      } catch {}
      try {
        db.exec(`ALTER TABLE user_billing_info ADD COLUMN contact_phone TEXT;`);
      } catch {}

      db.exec(`
        CREATE TABLE IF NOT EXISTS user_api_keys (
          id TEXT PRIMARY KEY,
          user_email TEXT NOT NULL,
          api_key_hash TEXT NOT NULL UNIQUE,
          api_key_preview TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_used_at TIMESTAMP,
          last_ip TEXT,
          last_user_agent TEXT
        );
      `);
      try {
        db.exec(`ALTER TABLE user_api_keys ADD COLUMN revoked_reason TEXT;`);
      } catch {}
      try {
        db.exec(`CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON user_api_keys(api_key_hash);`);
      } catch {}
      try {
        db.exec(`CREATE INDEX IF NOT EXISTS idx_api_keys_email ON user_api_keys(user_email);`);
      } catch {}

    } catch (e) {
      console.error('Error initializing SQLite quota tables:', e);
    }
  }
  
  tablesInitialized = true;
}

/**
 * Get or create the export quota for a user.
 */
export async function getUserQuota(email: string): Promise<UserQuota & { last_reset_date?: string }> {
  await initQuotaTables();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' });
    const currentJstDate = formatter.format(new Date()); // YYYY-MM-DD

    const sql = 'SELECT * FROM user_export_quotas WHERE user_email = ?';
    const row = await runGetQuery(sql, [email]);
    
    if (row) {
      let used = Number(row.monthly_base_used);
      let lastReset = row.last_reset_date;
      const plan = row.plan || 'free';

      // Lazy Reset Logic: 
      // - For 'free' plan: resets DAILY based on JST date.
      // - For paid plans: monthly reset fallback logic. If Stripe invoice.paid webhook fails,
      //   we check if 1 month has passed since the last JST reset date.
      if (plan === 'free' && lastReset !== currentJstDate) {
        used = 0;
        lastReset = currentJstDate;
        const updateSql = 'UPDATE user_export_quotas SET monthly_base_used = 0, last_reset_date = ? WHERE user_email = ?';
        if (DATABASE_URL) {
          const pool = getPGPool();
          await pool.query(convertSqlForPG(updateSql), [currentJstDate, email]);
        } else {
          const db = getSQLiteDB();
          db.prepare(updateSql).run(currentJstDate, email);
        }
      } else if (plan !== 'free') {
        if (!lastReset) {
          lastReset = currentJstDate;
          const updateSql = 'UPDATE user_export_quotas SET last_reset_date = ? WHERE user_email = ?';
          if (DATABASE_URL) {
            const pool = getPGPool();
            await pool.query(convertSqlForPG(updateSql), [currentJstDate, email]);
          } else {
            const db = getSQLiteDB();
            db.prepare(updateSql).run(currentJstDate, email);
          }
        } else {
          const [lastYear, lastMonth, lastDay] = lastReset.split('-').map(Number);
          const [currYear, currMonth, currDay] = currentJstDate.split('-').map(Number);
          const monthsPassed = (currYear - lastYear) * 12 + (currMonth - lastMonth);
          const isPastSameDay = currDay >= lastDay;
          
          if (monthsPassed > 1 || (monthsPassed === 1 && isPastSameDay)) {
            used = 0;
            lastReset = currentJstDate;
            const updateSql = 'UPDATE user_export_quotas SET monthly_base_used = 0, last_reset_date = ? WHERE user_email = ?';
            if (DATABASE_URL) {
              const pool = getPGPool();
              await pool.query(convertSqlForPG(updateSql), [currentJstDate, email]);
            } else {
              const db = getSQLiteDB();
              db.prepare(updateSql).run(currentJstDate, email);
            }
          }
        }
      }

      return {
        user_email: row.user_email,
        monthly_base_allowance: Number(row.monthly_base_allowance),
        monthly_base_used: used,
        purchased_add_on_balance: Number(row.purchased_add_on_balance),
        plan: row.plan || 'free',
        stripe_subscription_id: row.stripe_subscription_id || null,
        stripe_customer_id: row.stripe_customer_id || null,
        subscription_status: row.subscription_status || 'inactive',
        last_reset_date: lastReset
      };
    }
    
    // Create default quota for new user: 20 rows, reset today
    const insertSql = 'INSERT INTO user_export_quotas (user_email, monthly_base_allowance, monthly_base_used, purchased_add_on_balance, last_reset_date, plan, subscription_status) VALUES (?, 20, 0, 0, ?, \'free\', \'inactive\')';
    
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(insertSql), [email, currentJstDate]);
    } else {
      const db = getSQLiteDB();
      const stmt = db.prepare(insertSql);
      stmt.run(email, currentJstDate);
    }
    
    return {
      user_email: email,
      monthly_base_allowance: 20,
      monthly_base_used: 0,
      purchased_add_on_balance: 0,
      plan: 'free',
      stripe_subscription_id: null,
      stripe_customer_id: null,
      subscription_status: 'inactive',
      last_reset_date: currentJstDate
    };
  } catch (error) {
    console.error(`Error in getUserQuota(${email}):`, error);
    return {
      user_email: email,
      monthly_base_allowance: 20,
      monthly_base_used: 0,
      purchased_add_on_balance: 0,
      plan: 'free',
      stripe_subscription_id: null,
      stripe_customer_id: null,
      subscription_status: 'inactive'
    };
  }
}

/**
 * Deduct a specified amount of rows from user's quota.
 * Tiêu trừ monthly_base_allowance trước, sau đó trừ tiếp purchased_add_on_balance.
 */
export async function deductUserQuota(email: string, amount: number): Promise<boolean> {
  await initQuotaTables();
  try {
    const quota = await getUserQuota(email);
    const baseRemaining = quota.monthly_base_allowance - quota.monthly_base_used;
    const isFreePlan = (quota.plan === 'free');
    const addOnBalance = isFreePlan ? 0 : quota.purchased_add_on_balance;
    const totalAvailable = baseRemaining + addOnBalance;
    
    if (totalAvailable < amount) {
      return false; // Not enough quota
    }
    
    let baseDeduction = 0;
    let addOnDeduction = 0;
    
    if (baseRemaining >= amount) {
      baseDeduction = amount;
    } else {
      baseDeduction = baseRemaining;
      addOnDeduction = amount - baseRemaining;
    }
    
    const newBaseUsed = quota.monthly_base_used + baseDeduction;
    const newAddOnBalance = quota.purchased_add_on_balance - addOnDeduction;
    
    const updateSql = `
      UPDATE user_export_quotas 
      SET monthly_base_used = ?, purchased_add_on_balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_email = ?
    `;
    
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(updateSql), [newBaseUsed, newAddOnBalance, email]);
    } else {
      const db = getSQLiteDB();
      const stmt = db.prepare(updateSql);
      stmt.run(newBaseUsed, newAddOnBalance, email);
    }
    
    return true;
  } catch (error) {
    console.error(`Error in deductUserQuota(${email}, ${amount}):`, error);
    return false;
  }
}

/**
 * Add quota balance purchased through Stripe
 */
export async function addUserAddOnBalance(email: string, amount: number): Promise<void> {
  await initQuotaTables();
  try {
    const quota = await getUserQuota(email);
    const newAddOn = quota.purchased_add_on_balance + amount;
    
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' });
    const currentJstDate = formatter.format(new Date()); // YYYY-MM-DD
    
    const updateSql = `
      UPDATE user_export_quotas
      SET purchased_add_on_balance = ?, monthly_base_used = 0, last_reset_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_email = ?
    `;
    
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(updateSql), [newAddOn, currentJstDate, email]);
    } else {
      const db = getSQLiteDB();
      const stmt = db.prepare(updateSql);
      stmt.run(newAddOn, currentJstDate, email);
    }
  } catch (error) {
    console.error(`Error in addUserAddOnBalance(${email}, ${amount}):`, error);
  }
}

/**
 * Create a new background export job
 */
export async function createExportJob(
  id: string, 
  email: string, 
  filtersJson: string | null, 
  recordsCount: number,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  await initQuotaTables();
  try {
    const insertSql = `
      INSERT INTO export_jobs (id, user_email, status, filters_json, records_count, ip_address, user_agent)
      VALUES (?, ?, 'pending', ?, ?, ?, ?)
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(insertSql), [
        id, 
        email, 
        filtersJson, 
        recordsCount, 
        ipAddress || null, 
        userAgent || null
      ]);
    } else {
      const db = getSQLiteDB();
      const stmt = db.prepare(insertSql);
      stmt.run(id, email, filtersJson, recordsCount, ipAddress || null, userAgent || null);
    }
  } catch (error) {
    console.error(`Error in createExportJob(${id}):`, error);
  }
}

/**
 * Update the status and properties of an export job
 */
export async function updateExportJobStatus(
  id: string, 
  status: 'pending' | 'processing' | 'completed' | 'failed', 
  filePath: string | null, 
  errorMessage: string | null
): Promise<void> {
  await initQuotaTables();
  try {
    const updateSql = `
      UPDATE export_jobs
      SET status = ?, file_path = ?, error_message = ?
      WHERE id = ?
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(updateSql), [status, filePath, errorMessage, id]);
    } else {
      const db = getSQLiteDB();
      const stmt = db.prepare(updateSql);
      stmt.run(status, filePath, errorMessage, id);
    }
  } catch (error) {
    console.error(`Error in updateExportJobStatus(${id}):`, error);
  }
}

/**
 * Fetch all export jobs requested by a user email
 */
export async function getExportJobs(email: string): Promise<ExportJob[]> {
  await initQuotaTables();
  try {
    const sql = 'SELECT * FROM export_jobs WHERE user_email = ? ORDER BY created_at DESC';
    const rows = await runQuery(sql, [email]);
    if (!rows) return [];
    const cleanedRows = await lazyCleanupJobs(rows);
    return cleanedRows.map(r => ({
      id: r.id,
      user_email: r.user_email,
      status: r.status as any,
      filters_json: r.filters_json,
      records_count: Number(r.records_count),
      file_path: r.file_path,
      error_message: r.error_message,
      ip_address: r.ip_address || null,
      user_agent: r.user_agent || null,
      created_at: String(r.created_at)
    }));
  } catch (error) {
    console.error(`Error in getExportJobs(${email}):`, error);
    return [];
  }
}

/**
 * Fetch a single export job by its unique ID
 */
export async function getExportJobById(id: string): Promise<ExportJob | null> {
  await initQuotaTables();
  try {
    const sql = 'SELECT * FROM export_jobs WHERE id = ? LIMIT 1';
    const r = await runGetQuery(sql, [id]);
    if (!r) return null;
    
    // Lazy check: if file is older than 7 days and file_path is not null
    const now = new Date();
    if (r.file_path) {
      const createdDate = new Date(r.created_at);
      const diffMs = now.getTime() - createdDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 7) {
        const key = r.file_path.replace(/^(r2:\/\/|local:\/\/)/, "");
        deleteFileFromR2(key).catch(err => console.error("Lazy cleanup single job storage delete error:", err));
        const updateSql = 'UPDATE export_jobs SET file_path = NULL WHERE id = ?';
        if (DATABASE_URL) {
          const pool = getPGPool();
          pool.query(convertSqlForPG(updateSql), [id]).catch(err => console.error("Lazy cleanup single job DB update error:", err));
        } else {
          try {
            const db = getSQLiteDB();
            db.prepare(updateSql).run(id);
          } catch (err) {
            console.error("Lazy cleanup single job DB update error:", err);
          }
        }
        r.file_path = null;
      }
    }

    return {
      id: r.id,
      user_email: r.user_email,
      status: r.status as any,
      filters_json: r.filters_json,
      records_count: Number(r.records_count),
      file_path: r.file_path,
      error_message: r.error_message,
      ip_address: r.ip_address || null,
      user_agent: r.user_agent || null,
      created_at: String(r.created_at)
    };
  } catch (error) {
    console.error(`Error in getExportJobById(${id}):`, error);
    return null;
  }
}

/**
 * Helper to run lazy cleanup for export jobs older than 7 days
 */
export async function lazyCleanupJobs(rows: any[]): Promise<any[]> {
  const now = new Date();
  const cleanedRows = [];
  for (const r of rows) {
    if (r.file_path) {
      const createdDate = new Date(r.created_at);
      const diffMs = now.getTime() - createdDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 7) {
        const key = r.file_path.replace(/^(r2:\/\/|local:\/\/)/, "");
        // Delete from storage (either R2 or local fallback is handled by deleteFileFromR2)
        deleteFileFromR2(key).catch(err => console.error("Lazy cleanup storage delete error:", err));
        
        // Update database record
        const updateSql = 'UPDATE export_jobs SET file_path = NULL WHERE id = ?';
        if (DATABASE_URL) {
          const pool = getPGPool();
          pool.query(convertSqlForPG(updateSql), [r.id]).catch(err => console.error("Lazy cleanup DB update PG error:", err));
        } else {
          try {
            const db = getSQLiteDB();
            db.prepare(updateSql).run(r.id);
          } catch (err) {
            console.error("Lazy cleanup DB update SQLite error:", err);
          }
        }
        r.file_path = null;
      }
    }
    cleanedRows.push(r);
  }
  return cleanedRows;
}

/**
 * Record a payment / package purchase
 */
export async function createPaymentRecord(
  id: string,
  email: string,
  packId: string,
  amountJpy: number,
  linesAdded: number,
  status: string,
  invoiceUrl: string | null,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  await initQuotaTables();
  try {
    const insertSql = `
      INSERT INTO deposit_history (id, user_email, pack_id, amount_jpy, lines_added, status, invoice_url, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(insertSql), [id, email, packId, amountJpy, linesAdded, status, invoiceUrl, ipAddress || null, userAgent || null]);
    } else {
      const db = getSQLiteDB();
      const stmt = db.prepare(insertSql);
      stmt.run(id, email, packId, amountJpy, linesAdded, status, invoiceUrl, ipAddress || null, userAgent || null);
    }
  } catch (error) {
    console.error(`Error in createPaymentRecord(${id}):`, error);
  }
}

/**
 * Fetch purchase history for a specific user email
 */
export async function getPaymentHistory(email: string): Promise<DepositRecord[]> {
  await initQuotaTables();
  try {
    const sql = 'SELECT * FROM deposit_history WHERE user_email = ? ORDER BY created_at DESC';
    const rows = await runQuery(sql, [email]);
    return rows ? rows.map(r => ({
      id: r.id,
      user_email: r.user_email,
      pack_id: r.pack_id,
      amount_jpy: Number(r.amount_jpy),
      lines_added: Number(r.lines_added),
      status: r.status,
      invoice_url: r.invoice_url,
      ip_address: r.ip_address || null,
      user_agent: r.user_agent || null,
      created_at: String(r.created_at)
    })) : [];
  } catch (error) {
    console.error(`Error in getPaymentHistory(${email}):`, error);
    return [];
  }
}

/**
 * Fetch all payments across all users (for Admin)
 */
export async function getAllPayments(): Promise<DepositRecord[]> {
  await initQuotaTables();
  try {
    const sql = 'SELECT * FROM deposit_history ORDER BY created_at DESC';
    const rows = await runQuery(sql, []);
    return rows ? rows.map(r => ({
      id: r.id,
      user_email: r.user_email,
      pack_id: r.pack_id,
      amount_jpy: Number(r.amount_jpy),
      lines_added: Number(r.lines_added),
      status: r.status,
      invoice_url: r.invoice_url,
      ip_address: r.ip_address || null,
      user_agent: r.user_agent || null,
      created_at: String(r.created_at)
    })) : [];
  } catch (error) {
    console.error('Error in getAllPayments:', error);
    return [];
  }
}

/**
 * Fetch all export jobs across all users (for Admin) with lazy cleanup
 */
export async function adminGetAllExportJobs(): Promise<ExportJob[]> {
  await initQuotaTables();
  try {
    const sql = 'SELECT * FROM export_jobs ORDER BY created_at DESC';
    const rows = await runQuery(sql, []);
    if (!rows) return [];
    const cleanedRows = await lazyCleanupJobs(rows);
    return cleanedRows.map(r => ({
      id: r.id,
      user_email: r.user_email,
      status: r.status as any,
      filters_json: r.filters_json,
      records_count: Number(r.records_count),
      file_path: r.file_path,
      error_message: r.error_message,
      ip_address: r.ip_address || null,
      user_agent: r.user_agent || null,
      created_at: String(r.created_at)
    }));
  } catch (error) {
    console.error('Error in adminGetAllExportJobs:', error);
    return [];
  }
}

/**
 * Fetch a single payment record by its unique ID
 */
export async function getPaymentRecordById(id: string): Promise<DepositRecord | null> {
  await initQuotaTables();
  try {
    const sql = 'SELECT * FROM deposit_history WHERE id = ? LIMIT 1';
    const r = await runGetQuery(sql, [id]);
    if (!r) return null;
    return {
      id: r.id,
      user_email: r.user_email,
      pack_id: r.pack_id,
      amount_jpy: Number(r.amount_jpy),
      lines_added: Number(r.lines_added),
      status: r.status,
      invoice_url: r.invoice_url,
      ip_address: r.ip_address || null,
      user_agent: r.user_agent || null,
      created_at: String(r.created_at)
    };
  } catch (error) {
    console.error(`Error in getPaymentRecordById(${id}):`, error);
    return null;
  }
}

/**
 * Executes search query returning all matching companies without pagination limits (for CSV exports).
 */
export async function searchCompaniesAll(keyword: string, filters: SearchFilters): Promise<Company[]> {
  try {
    const filtersCopy = { ...filters, cursor_emp: undefined, cursor_corp: undefined };
    
    // Count how many search criteria / filters are active to determine if we should force the index
    const activeFiltersList: string[] = [];
    if (keyword) activeFiltersList.push('keyword');
    if (filtersCopy.prefecture_code) activeFiltersList.push('prefecture');
    if (filtersCopy.city_name) activeFiltersList.push('city');
    if (filtersCopy.industry_code) activeFiltersList.push('industry');
    if (filtersCopy.min_employees !== undefined || filtersCopy.max_employees !== undefined) activeFiltersList.push('employees');
    if (filtersCopy.min_capital !== undefined || filtersCopy.max_capital !== undefined) activeFiltersList.push('capital');
    if (filtersCopy.has_hiring) activeFiltersList.push('hiring');
    if (filtersCopy.has_subsidy) activeFiltersList.push('subsidy');
    if (filtersCopy.has_bidding) activeFiltersList.push('bidding');
    if (filtersCopy.has_award) activeFiltersList.push('award');
    if (filtersCopy.has_certification) activeFiltersList.push('certification');
    if (filtersCopy.has_patent) activeFiltersList.push('patent');
    if (filtersCopy.has_financials) activeFiltersList.push('financials');
    if (filtersCopy.min_establishment_year !== undefined || filtersCopy.max_establishment_year !== undefined) activeFiltersList.push('establishment_year');

    const useForcedIndex = !keyword && activeFiltersList.length <= 1;
    const dataQuery = buildSearchQuery(keyword, filtersCopy, false, useForcedIndex);
    let sql = dataQuery.sql;
    
    sql += ' ORDER BY c.employee_count DESC, c.corporate_number ASC';
    
    const results = await runQuery(sql, dataQuery.params);
    return results.map(mapCompanyRow);
  } catch (error) {
    console.error('Error in searchCompaniesAll:', error);
    return [];
  }
}

/**
 * Update the user's monthly quota and reset used balance when upgrading/downgrading plans.
 */
export async function updateUserPlanQuota(email: string, allowance: number, plan: string): Promise<boolean> {
  await initQuotaTables();
  try {
    const status = plan === 'free' ? 'inactive' : 'active';
    if (DATABASE_URL) {
      // PostgreSQL: Use native UPSERT with ON CONFLICT
      const pool = getPGPool();
      await pool.query(
        `INSERT INTO user_export_quotas (user_email, monthly_base_allowance, monthly_base_used, purchased_add_on_balance, plan, subscription_status, updated_at)
         VALUES ($1, $2, 0, 0, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (user_email)
         DO UPDATE SET monthly_base_allowance = $2, monthly_base_used = 0, plan = $3, subscription_status = $4, updated_at = CURRENT_TIMESTAMP`,
        [email, allowance, plan, status]
      );
    } else {
      // SQLite: INSERT OR REPLACE to handle both new and existing users
      const db = getSQLiteDB();
      // First check if user exists
      const existing = db.prepare('SELECT user_email FROM user_export_quotas WHERE user_email = ?').get(email);
      if (existing) {
        db.prepare(
          `UPDATE user_export_quotas
           SET monthly_base_allowance = ?, monthly_base_used = 0, plan = ?, subscription_status = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_email = ?`
        ).run(allowance, plan, status, email);
      } else {
        db.prepare(
          `INSERT INTO user_export_quotas (user_email, monthly_base_allowance, monthly_base_used, purchased_add_on_balance, plan, subscription_status)
           VALUES (?, ?, 0, 0, ?, ?)`
        ).run(email, allowance, plan, status);
      }
    }
    return true;
  } catch (error) {
    console.error(`Error in updateUserPlanQuota(${email}, ${allowance}, ${plan}):`, error);
    return false;
  }
}

/**
 * Downgrade a user's subscription back to free in database
 */
export async function cancelUserSubscriptionInDb(email: string): Promise<boolean> {
  await initQuotaTables();
  try {
    const updateSql = `
      UPDATE user_export_quotas
      SET plan = 'free', 
          monthly_base_allowance = 20, 
          monthly_base_used = 0,
          stripe_subscription_id = NULL,
          subscription_status = 'canceled',
          updated_at = CURRENT_TIMESTAMP
      WHERE user_email = ?
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(updateSql), [email]);
    } else {
      const db = getSQLiteDB();
      db.prepare(updateSql).run(email);
    }
    return true;
  } catch (error) {
    console.error(`Error in cancelUserSubscriptionInDb(${email}):`, error);
    return false;
  }
}

/**
 * Update user quota and subscription metadata (checkout session completed)
 */
export async function updateUserSubscription(
  email: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  plan: string,
  allowance: number,
  status: string
): Promise<boolean> {
  await initQuotaTables();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' });
    const currentJstDate = formatter.format(new Date()); // YYYY-MM-DD

    // Fetch existing quota to compute roll-over / carry-over of unused quota
    const selectSql = 'SELECT monthly_base_allowance, monthly_base_used, purchased_add_on_balance FROM user_export_quotas WHERE user_email = ?';
    const row = await runGetQuery(selectSql, [email]);

    let unusedQuota = 0;
    let currentAddOn = 0;

    if (row) {
      const oldAllowance = Number(row.monthly_base_allowance || 0);
      const oldUsed = Number(row.monthly_base_used || 0);
      currentAddOn = Number(row.purchased_add_on_balance || 0);
      // Only roll over positive remaining allowance
      unusedQuota = Math.max(0, oldAllowance - oldUsed);
    }

    const newAddOn = currentAddOn + unusedQuota;

    const updateSql = `
      UPDATE user_export_quotas
      SET stripe_customer_id = ?,
          stripe_subscription_id = ?,
          plan = ?,
          monthly_base_allowance = ?,
          monthly_base_used = 0,
          purchased_add_on_balance = ?,
          subscription_status = ?,
          last_reset_date = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_email = ?
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(updateSql), [
        stripeCustomerId, 
        stripeSubscriptionId, 
        plan, 
        allowance, 
        newAddOn,
        status, 
        currentJstDate, 
        email
      ]);
    } else {
      const db = getSQLiteDB();
      db.prepare(updateSql).run(
        stripeCustomerId, 
        stripeSubscriptionId, 
        plan, 
        allowance, 
        newAddOn,
        status, 
        currentJstDate, 
        email
      );
    }
    return true;
  } catch (error) {
    console.error(`Error in updateUserSubscription(${email}):`, error);
    return false;
  }
}

/**
 * Retrieve user quota by subscription ID (useful for invoice renewal webhook)
 */
export async function getUserQuotaBySubscriptionId(subscriptionId: string): Promise<UserQuota | null> {
  await initQuotaTables();
  try {
    const sql = 'SELECT * FROM user_export_quotas WHERE stripe_subscription_id = ? LIMIT 1';
    const row = await runGetQuery(sql, [subscriptionId]);
    if (!row) return null;
    return {
      user_email: row.user_email,
      monthly_base_allowance: Number(row.monthly_base_allowance),
      monthly_base_used: Number(row.monthly_base_used),
      purchased_add_on_balance: Number(row.purchased_add_on_balance),
      plan: row.plan || 'free',
      stripe_subscription_id: row.stripe_subscription_id || null,
      stripe_customer_id: row.stripe_customer_id || null,
      subscription_status: row.subscription_status || 'inactive'
    };
  } catch (error) {
    console.error(`Error in getUserQuotaBySubscriptionId(${subscriptionId}):`, error);
    return null;
  }
}

/**
 * Reset quota usage on monthly billing cycle renewal
 */
export async function resetUserQuotaUsage(email: string): Promise<boolean> {
  await initQuotaTables();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' });
    const currentJstDate = formatter.format(new Date()); // YYYY-MM-DD

    const updateSql = `
      UPDATE user_export_quotas
      SET monthly_base_used = 0,
          last_reset_date = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_email = ?
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(updateSql), [currentJstDate, email]);
    } else {
      const db = getSQLiteDB();
      db.prepare(updateSql).run(currentJstDate, email);
    }
    return true;
  } catch (error) {
    console.error(`Error in resetUserQuotaUsage(${email}):`, error);
    return false;
  }
}

/**
 * Cancel/downgrade subscription by Stripe subscription ID
 */
export async function cancelUserSubscriptionBySubId(subscriptionId: string): Promise<boolean> {
  await initQuotaTables();
  try {
    const updateSql = `
      UPDATE user_export_quotas
      SET plan = 'free', 
          monthly_base_allowance = 20, 
          monthly_base_used = 0,
          stripe_subscription_id = NULL,
          subscription_status = 'canceled',
          updated_at = CURRENT_TIMESTAMP
      WHERE stripe_subscription_id = ?
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(updateSql), [subscriptionId]);
    } else {
      const db = getSQLiteDB();
      db.prepare(updateSql).run(subscriptionId);
    }
    return true;
  } catch (error) {
    console.error(`Error in cancelUserSubscriptionBySubId(${subscriptionId}):`, error);
    return false;
  }
}

/**
 * Sweeps and deletes export ZIP files older than 7 days from R2 and marks them NULL in DB.
 */
export async function runCleanupCron(): Promise<{ success: boolean; affectedRows: number }> {
  await initQuotaTables();
  try {
    let rows: { id: string; file_path: string }[] = [];
    if (DATABASE_URL) {
      const pool = getPGPool();
      const res = await pool.query(
        "SELECT id, file_path FROM export_jobs WHERE file_path IS NOT NULL AND created_at < NOW() - INTERVAL '7 days'"
      );
      rows = res.rows;
    } else {
      const db = getSQLiteDB();
      rows = db.prepare(
        "SELECT id, file_path FROM export_jobs WHERE file_path IS NOT NULL AND created_at < datetime('now', '-7 days')"
      ).all() as any[];
    }

    let affectedRows = 0;
    for (const r of rows) {
      if (r.file_path) {
        const key = r.file_path.replace(/^(r2:\/\/|local:\/\/)/, "");
        // Delete from R2 storage
        await deleteFileFromR2(key).catch(err => console.error(`[Cron Cleanup] R2 deletion error for job ${r.id}:`, err));
      }
      
      // Update database record to NULL
      const updateSql = "UPDATE export_jobs SET file_path = NULL WHERE id = ?";
      if (DATABASE_URL) {
        const pool = getPGPool();
        await pool.query(convertSqlForPG(updateSql), [r.id]);
      } else {
        const db = getSQLiteDB();
        db.prepare(updateSql).run(r.id);
      }
      affectedRows++;
    }

    console.log(`[Cron Cleanup] Cleaned up ${affectedRows} expired jobs.`);
    return { success: true, affectedRows };
  } catch (error) {
    console.error("[Cron Cleanup] Error during DB cleanup execution:", error);
    return { success: false, affectedRows: 0 };
  }
}

// ==========================================
// PHASE 6: DISCOUNT COUPONS SYSTEM
// ==========================================

export interface Coupon {
  code: string;
  discount_percent: number;
  expires_at: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CouponRedemption {
  id: string;
  code: string;
  user_email: string;
  redeemed_at: string;
}

let couponTablesInitialized = false;

/**
 * Automatically initializes Coupon tracking schemas inside both SQLite and PostgreSQL.
 */
export async function initCouponTables(): Promise<void> {
  if (couponTablesInitialized) return;
  
  const isPG = !!DATABASE_URL;
  if (isPG) {
    const pool = getPGPool();
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS coupons (
          code VARCHAR(50) PRIMARY KEY,
          discount_percent INTEGER NOT NULL DEFAULT 60,
          expires_at TIMESTAMP NOT NULL,
          max_uses INTEGER NOT NULL DEFAULT 100,
          used_count INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS coupon_redemptions (
          id VARCHAR(50) PRIMARY KEY,
          code VARCHAR(50) NOT NULL REFERENCES coupons(code),
          user_email VARCHAR(255) NOT NULL,
          redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(code, user_email)
        );
      `);
    } catch (e) {
      console.error('Error initializing PG coupon tables:', e);
    } finally {
      client.release();
    }
  } else {
    try {
      const db = getSQLiteDB();
      db.exec(`
        CREATE TABLE IF NOT EXISTS coupons (
          code TEXT PRIMARY KEY,
          discount_percent INTEGER NOT NULL DEFAULT 60,
          expires_at TIMESTAMP NOT NULL,
          max_uses INTEGER NOT NULL DEFAULT 100,
          used_count INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      db.exec(`
        CREATE TABLE IF NOT EXISTS coupon_redemptions (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          user_email TEXT NOT NULL,
          redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (code) REFERENCES coupons(code),
          UNIQUE(code, user_email)
        );
      `);
    } catch (e) {
      console.error('Error initializing SQLite coupon tables:', e);
    }
  }
  
  couponTablesInitialized = true;
}

/**
 * Admin: Lấy danh sách tất cả mã giảm giá
 */
export async function getCoupons(): Promise<Coupon[]> {
  await initCouponTables();
  try {
    const sql = 'SELECT * FROM coupons ORDER BY created_at DESC';
    const rows = await runQuery(sql);
    return rows ? rows.map(r => ({
      code: r.code,
      discount_percent: Number(r.discount_percent),
      expires_at: String(r.expires_at),
      max_uses: Number(r.max_uses),
      used_count: Number(r.used_count),
      is_active: Boolean(r.is_active),
      created_at: String(r.created_at)
    })) : [];
  } catch (error) {
    console.error('Error in getCoupons:', error);
    return [];
  }
}

/**
 * Admin: Tạo mã giảm giá mới
 */
export async function createCoupon(code: string, discountPercent: number = 60, maxUses: number = 100, daysValid: number = 30): Promise<boolean> {
  await initCouponTables();
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);
    const expiresAtStr = expiresAt.toISOString();

    const insertSql = `
      INSERT INTO coupons (code, discount_percent, expires_at, max_uses, used_count, is_active)
      VALUES (?, ?, ?, ?, 0, true)
    `;
    
    // Convert boolean true to 1 for SQLite
    const isActiveVal = DATABASE_URL ? true : 1;
    
    const sqlWithCorrectBool = insertSql.replace('true', '?');

    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(sqlWithCorrectBool), [code, discountPercent, expiresAtStr, maxUses, isActiveVal]);
    } else {
      const db = getSQLiteDB();
      const stmt = db.prepare(sqlWithCorrectBool);
      stmt.run(code, discountPercent, expiresAtStr, maxUses, isActiveVal);
    }
    return true;
  } catch (error) {
    console.error(`Error in createCoupon(${code}):`, error);
    return false;
  }
}

/**
 * User: Kiểm tra tính hợp lệ của mã giảm giá
 */
export async function verifyCoupon(code: string, userEmail: string): Promise<{ valid: boolean; discount_percent?: number; error?: string }> {
  await initCouponTables();
  try {
    const sql = 'SELECT * FROM coupons WHERE code = ?';
    const row = await runGetQuery(sql, [code]);

    if (!row) {
      return { valid: false, error: 'クーポンコードが存在しません。' };
    }

    if (!Boolean(row.is_active)) {
      return { valid: false, error: 'このクーポンコードは無効化されています。' };
    }

    if (new Date(row.expires_at) < new Date()) {
      return { valid: false, error: 'このクーポンコードは有効期限切れです。' };
    }

    if (Number(row.used_count) >= Number(row.max_uses)) {
      return { valid: false, error: 'このクーポンコードは利用上限に達しました。' };
    }

    // Check if user already used this code
    const redemptionSql = 'SELECT * FROM coupon_redemptions WHERE code = ? AND user_email = ?';
    const redemptionRow = await runGetQuery(redemptionSql, [code, userEmail]);
    
    if (redemptionRow) {
      return { valid: false, error: 'このクーポンコードは既に利用済みです。' };
    }

    return { valid: true, discount_percent: Number(row.discount_percent) };
  } catch (error) {
    console.error(`Error in verifyCoupon(${code}, ${userEmail}):`, error);
    return { valid: false, error: 'システムの認証エラーが発生しました。' };
  }
}

/**
 * User/System: Ghi nhận việc sử dụng mã giảm giá
 */
export async function redeemCoupon(code: string, userEmail: string): Promise<boolean> {
  await initCouponTables();
  try {
    const verification = await verifyCoupon(code, userEmail);
    if (!verification.valid) {
      return false; // Cannot redeem invalid or already used coupon
    }

    const id = `${code}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (DATABASE_URL) {
      const pool = getPGPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        await client.query(
          `INSERT INTO coupon_redemptions (id, code, user_email) VALUES ($1, $2, $3)`,
          [id, code, userEmail]
        );
        
        await client.query(
          `UPDATE coupons SET used_count = used_count + 1 WHERE code = $1`,
          [code]
        );
        
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      const db = getSQLiteDB();
      // SQLite transaction workaround
      db.exec('BEGIN TRANSACTION');
      try {
        const stmt1 = db.prepare(`INSERT INTO coupon_redemptions (id, code, user_email) VALUES (?, ?, ?)`);
        stmt1.run(id, code, userEmail);
        
        const stmt2 = db.prepare(`UPDATE coupons SET used_count = used_count + 1 WHERE code = ?`);
        stmt2.run(code);
        
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    }
    return true;
  } catch (error) {
    console.error(`Error in redeemCoupon(${code}, ${userEmail}):`, error);
    return false;
  }
}

// ==========================================
// PHASE 7: ADMIN USERS & INQUIRIES SYSTEM
// ==========================================

export interface Inquiry {
  id: string;
  corporate_number: string;
  company_name: string;
  type: string; // 'hide', 'update', 'other'
  requester_email: string;
  message: string;
  status: string; // 'pending', 'resolved'
  created_at: string;
}
export interface UserAdminView {
  user_email: string;
  monthly_base_allowance: number;
  monthly_base_used: number;
  purchased_add_on_balance: number;
  plan: string;
  subscription_status: string;
  updated_at: string;
  contact_person?: string | null;
  contact_phone?: string | null;
}

let adminTablesInitialized = false;

export async function initAdminTables(): Promise<void> {
  if (adminTablesInitialized) return;
  const isPG = !!DATABASE_URL;
  if (isPG) {
    const pool = getPGPool();
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS inquiries (
          id VARCHAR(50) PRIMARY KEY,
          corporate_number VARCHAR(50) NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          requester_email VARCHAR(255) NOT NULL,
          message TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          ip_address VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Attempt to alter table if it already exists (Postgres)
      try {
        await client.query(`ALTER TABLE inquiries ADD COLUMN ip_address VARCHAR(50);`);
      } catch {
        // Column might already exist
      }
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS hidden_companies (
          corporate_number VARCHAR(50) PRIMARY KEY,
          reason TEXT,
          hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.error('Error initializing PG admin tables:', e);
    } finally {
      client.release();
    }
  } else {
    try {
      const db = getSQLiteDB();
      db.exec(`
        CREATE TABLE IF NOT EXISTS inquiries (
          id TEXT PRIMARY KEY,
          corporate_number TEXT NOT NULL,
          company_name TEXT NOT NULL,
          type TEXT NOT NULL,
          requester_email TEXT NOT NULL,
          message TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          ip_address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Attempt to alter table if it already exists (SQLite)
      try {
        db.exec(`ALTER TABLE inquiries ADD COLUMN ip_address TEXT;`);
      } catch {
        // Column might already exist
      }
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS hidden_companies (
          corporate_number TEXT PRIMARY KEY,
          reason TEXT,
          hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.error('Error initializing SQLite admin tables:', e);
    }
  }
  adminTablesInitialized = true;
}

// User Management functions
export async function getAllUsers(): Promise<UserAdminView[]> {
  await initQuotaTables();
  try {
    const rows = await runQuery(`
      SELECT ueq.*, ubi.contact_person, ubi.contact_phone 
      FROM user_export_quotas ueq
      LEFT JOIN user_billing_info ubi ON ueq.user_email = ubi.user_email
      ORDER BY ueq.updated_at DESC
    `);
    return rows ? rows.map(r => ({
      user_email: String(r.user_email),
      monthly_base_allowance: Number(r.monthly_base_allowance),
      monthly_base_used: Number(r.monthly_base_used),
      purchased_add_on_balance: Number(r.purchased_add_on_balance),
      plan: r.plan ? String(r.plan) : 'free',
      subscription_status: r.subscription_status ? String(r.subscription_status) : 'inactive',
      updated_at: String(r.updated_at),
      contact_person: r.contact_person ? String(r.contact_person) : null,
      contact_phone: r.contact_phone ? String(r.contact_phone) : null,
    })) : [];
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}

export async function adminUpdateUserQuota(email: string, allowance: number, addOnBalance?: number): Promise<boolean> {
  await initQuotaTables();
  try {
    let updateSql = '';
    let params: any[] = [];
    if (addOnBalance !== undefined) {
      updateSql = `
        UPDATE user_export_quotas 
        SET monthly_base_allowance = ?, purchased_add_on_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_email = ?
      `;
      params = [allowance, addOnBalance, email];
    } else {
      updateSql = `
        UPDATE user_export_quotas 
        SET monthly_base_allowance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_email = ?
      `;
      params = [allowance, email];
    }
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(updateSql), params);
    } else {
      const db = getSQLiteDB();
      db.prepare(updateSql).run(...params);
    }
    return true;
  } catch (error) {
    console.error(`Error in adminUpdateUserQuota(${email}):`, error);
    return false;
  }
}

// Inquiries & Hide Companies
export async function checkRateLimit(ip: string): Promise<boolean> {
  await initAdminTables();
  try {
    const isPG = !!DATABASE_URL;
    let count = 0;
    
    if (isPG) {
      const pool = getPGPool();
      const res = await pool.query(
        "SELECT COUNT(*) as cnt FROM inquiries WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '24 HOURS'", 
        [ip]
      );
      count = parseInt(res.rows[0].cnt, 10);
    } else {
      const db = getSQLiteDB();
      const row = db.prepare("SELECT COUNT(*) as cnt FROM inquiries WHERE ip_address = ? AND created_at > datetime('now', '-24 hours')").get(ip) as any;
      count = row ? row.cnt : 0;
    }
    
    // Max 3 requests per 24 hours per IP
    return count < 3;
  } catch (error) {
    console.error('Error in checkRateLimit:', error);
    return false; // Fail safe
  }
}

export async function createInquiry(
  corporate_number: string, 
  company_name: string, 
  type: string, 
  requester_email: string, 
  message: string,
  ip_address: string = ''
): Promise<boolean> {
  await initAdminTables();
  try {
    const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sql = `
      INSERT INTO inquiries (id, corporate_number, company_name, type, requester_email, message, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(sql), [id, corporate_number, company_name, type, requester_email, message, ip_address]);
    } else {
      const db = getSQLiteDB();
      db.prepare(sql).run(id, corporate_number, company_name, type, requester_email, message, ip_address);
    }
    return true;
  } catch (error) {
    console.error('Error in createInquiry:', error);
    return false;
  }
}

export async function getInquiries(): Promise<Inquiry[]> {
  await initAdminTables();
  try {
    const rows = await runQuery('SELECT * FROM inquiries ORDER BY created_at DESC');
    return rows ? rows.map(r => ({
      id: String(r.id),
      corporate_number: String(r.corporate_number),
      company_name: String(r.company_name),
      type: String(r.type),
      requester_email: String(r.requester_email),
      message: String(r.message),
      status: String(r.status),
      created_at: String(r.created_at)
    })) : [];
  } catch (error) {
    console.error('Error in getInquiries:', error);
    return [];
  }
}

export async function hideCompany(corporate_number: string, reason: string = 'Hidden by admin'): Promise<boolean> {
  await initAdminTables();
  try {
    // Upsert equivalent
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(`
        INSERT INTO hidden_companies (corporate_number, reason) VALUES ($1, $2)
        ON CONFLICT (corporate_number) DO UPDATE SET reason = $2
      `, [corporate_number, reason]);
    } else {
      const db = getSQLiteDB();
      db.prepare(`INSERT OR REPLACE INTO hidden_companies (corporate_number, reason) VALUES (?, ?)`).run(corporate_number, reason);
    }
    return true;
  } catch (error) {
    console.error(`Error in hideCompany(${corporate_number}):`, error);
    return false;
  }
}

export async function unhideCompany(corporate_number: string): Promise<boolean> {
  await initAdminTables();
  try {
    const sql = `DELETE FROM hidden_companies WHERE corporate_number = ?`;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(sql), [corporate_number]);
    } else {
      const db = getSQLiteDB();
      db.prepare(sql).run(corporate_number);
    }
    return true;
  } catch (error) {
    console.error(`Error in unhideCompany(${corporate_number}):`, error);
    return false;
  }
}

export async function resolveInquiry(id: string, newStatus: string = 'resolved'): Promise<boolean> {
  await initAdminTables();
  try {
    const sql = `UPDATE inquiries SET status = ? WHERE id = ?`;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(sql), [newStatus, id]);
    } else {
      const db = getSQLiteDB();
      db.prepare(sql).run(newStatus, id);
    }
    return true;
  } catch (error) {
    console.error(`Error in resolveInquiry(${id}):`, error);
    return false;
  }
}

/**
 * Suspend user account/quota (due to billing dispute/chargeback or refund)
 */
export async function suspendUserQuotaInDb(email: string): Promise<boolean> {
  await initQuotaTables();
  try {
    const updateSql = `
      UPDATE user_export_quotas
      SET subscription_status = 'suspended',
          monthly_base_allowance = 0,
          purchased_add_on_balance = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_email = ?
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(updateSql), [email]);
    } else {
      const db = getSQLiteDB();
      db.prepare(updateSql).run(email);
    }
    return true;
  } catch (error) {
    console.error(`Error in suspendUserQuotaInDb(${email}):`, error);
    return false;
  }
}

export async function unsuspendUserQuotaInDb(email: string, allowance: number, plan: string): Promise<boolean> {
  await initQuotaTables();
  try {
    const status = plan === 'free' ? 'inactive' : 'active';
    const updateSql = `
      UPDATE user_export_quotas
      SET subscription_status = ?,
          monthly_base_allowance = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_email = ?
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(updateSql), [status, allowance, email]);
    } else {
      const db = getSQLiteDB();
      db.prepare(updateSql).run(status, allowance, email);
    }
    return true;
  } catch (error) {
    console.error(`Error in unsuspendUserQuotaInDb(${email}):`, error);
    return false;
  }
}

/**
 * Fetch user's export jobs within the last X minutes
 */
export async function getRecentExportJobs(email: string, minutes: number): Promise<ExportJob[]> {
  await initQuotaTables();
  try {
    const isPG = !!DATABASE_URL;
    let sql = '';
    let params: any[] = [];
    if (isPG) {
      sql = `
        SELECT * FROM export_jobs 
        WHERE user_email = $1 
        AND created_at > NOW() - CAST($2 || ' MINUTE' AS INTERVAL)
        ORDER BY created_at DESC
      `;
      params = [email, minutes];
    } else {
      sql = `
        SELECT * FROM export_jobs 
        WHERE user_email = ? 
        AND created_at > datetime('now', '-' || ? || ' minutes')
        ORDER BY created_at DESC
      `;
      params = [email, minutes];
    }
    const rows = await runQuery(sql, params);
    return rows ? rows.map(r => ({
      id: r.id,
      user_email: r.user_email,
      status: r.status as any,
      filters_json: r.filters_json,
      records_count: Number(r.records_count),
      file_path: r.file_path,
      error_message: r.error_message,
      created_at: String(r.created_at)
    })) : [];
  } catch (error) {
    console.error(`Error in getRecentExportJobs(${email}):`, error);
    return [];
  }
}

export interface UserBillingInfo {
  user_email: string;
  billing_name: string | null;
  billing_address: string | null;
  billing_tax_id: string | null;
  billing_phone: string | null;
  logo_url?: string | null;
  is_featured_partner?: boolean | null;
  contact_person?: string | null;
  contact_phone?: string | null;
}

export async function getUserBillingInfo(email: string): Promise<UserBillingInfo | null> {
  await initQuotaTables();
  try {
    const sql = 'SELECT * FROM user_billing_info WHERE user_email = ?';
    const row = await runGetQuery(sql, [email]);
    if (!row) return null;
    return {
      user_email: row.user_email,
      billing_name: row.billing_name || null,
      billing_address: row.billing_address || null,
      billing_tax_id: row.billing_tax_id || null,
      billing_phone: row.billing_phone || null,
      logo_url: row.logo_url || null,
      is_featured_partner: row.is_featured_partner === 1 || row.is_featured_partner === true || row.is_featured_partner === 'true' || false,
      contact_person: row.contact_person || null,
      contact_phone: row.contact_phone || null,
    };
  } catch (error) {
    console.error(`Error in getUserBillingInfo(${email}):`, error);
    return null;
  }
}

export async function saveUserBillingInfo(info: UserBillingInfo): Promise<boolean> {
  await initQuotaTables();
  try {
    const exists = await runGetQuery('SELECT 1 FROM user_billing_info WHERE user_email = ?', [info.user_email]);
    const isFeaturedVal = info.is_featured_partner ? (DATABASE_URL ? true : 1) : (DATABASE_URL ? false : 0);
    
    if (exists) {
      const updateSql = 'UPDATE user_billing_info SET billing_name = ?, billing_address = ?, billing_tax_id = ?, billing_phone = ?, logo_url = ?, is_featured_partner = ?, contact_person = ?, contact_phone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_email = ?';
      if (DATABASE_URL) {
        const pool = getPGPool();
        await pool.query(convertSqlForPG(updateSql), [info.billing_name, info.billing_address, info.billing_tax_id, info.billing_phone, info.logo_url || null, isFeaturedVal, info.contact_person || null, info.contact_phone || null, info.user_email]);
      } else {
        const db = getSQLiteDB();
        db.prepare(updateSql).run(info.billing_name, info.billing_address, info.billing_tax_id, info.billing_phone, info.logo_url || null, isFeaturedVal, info.contact_person || null, info.contact_phone || null, info.user_email);
      }
    } else {
      const insertSql = 'INSERT INTO user_billing_info (user_email, billing_name, billing_address, billing_tax_id, billing_phone, logo_url, is_featured_partner, contact_person, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      if (DATABASE_URL) {
        const pool = getPGPool();
        await pool.query(convertSqlForPG(insertSql), [info.user_email, info.billing_name, info.billing_address, info.billing_tax_id, info.billing_phone, info.logo_url || null, isFeaturedVal, info.contact_person || null, info.contact_phone || null]);
      } else {
        const db = getSQLiteDB();
        db.prepare(insertSql).run(info.user_email, info.billing_name, info.billing_address, info.billing_tax_id, info.billing_phone, info.logo_url || null, isFeaturedVal, info.contact_person || null, info.contact_phone || null);
      }
    }
    return true;
  } catch (error) {
    console.error(`Error in saveUserBillingInfo(${info.user_email}):`, error);
    return false;
  }
}

/**
 * Lấy danh sách đối tác nổi bật hiển thị trên trang chủ
 */
export async function getFeaturedPartners(): Promise<UserBillingInfo[]> {
  await initQuotaTables();
  try {
    const isPG = !!DATABASE_URL;
    let sql = "";
    if (isPG) {
      sql = "SELECT * FROM user_billing_info WHERE is_featured_partner = true AND logo_url IS NOT NULL ORDER BY updated_at DESC";
    } else {
      sql = "SELECT * FROM user_billing_info WHERE is_featured_partner = 1 AND logo_url IS NOT NULL ORDER BY updated_at DESC";
    }
    const rows = await runQuery(sql);
    if (!rows) return [];
    return rows.map((row: any) => ({
      user_email: row.user_email,
      billing_name: row.billing_name || null,
      billing_address: row.billing_address || null,
      billing_tax_id: row.billing_tax_id || null,
      billing_phone: row.billing_phone || null,
      logo_url: row.logo_url || null,
      is_featured_partner: true,
    }));
  } catch (error) {
    console.error("Error in getFeaturedPartners:", error);
    return [];
  }
}

/**
 * Lấy tất cả thông tin thanh toán có chứa Logo phục vụ kiểm duyệt trong Admin
 */
export async function getAllPartnersForAdmin(): Promise<UserBillingInfo[]> {
  await initQuotaTables();
  try {
    const sql = "SELECT * FROM user_billing_info WHERE logo_url IS NOT NULL ORDER BY updated_at DESC";
    const rows = await runQuery(sql);
    if (!rows) return [];
    return rows.map((row: any) => ({
      user_email: row.user_email,
      billing_name: row.billing_name || null,
      billing_address: row.billing_address || null,
      billing_tax_id: row.billing_tax_id || null,
      billing_phone: row.billing_phone || null,
      logo_url: row.logo_url || null,
      is_featured_partner: row.is_featured_partner === 1 || row.is_featured_partner === true || row.is_featured_partner === 'true' || false,
    }));
  } catch (error) {
    console.error("Error in getAllPartnersForAdmin:", error);
    return [];
  }
}

/**
 * Admin duyệt/hủy duyệt đối tác hiển thị trên trang chủ
 */
export async function updatePartnerFeaturedStatus(email: string, isFeatured: boolean): Promise<boolean> {
  await initQuotaTables();
  try {
    const isPG = !!DATABASE_URL;
    const sql = "UPDATE user_billing_info SET is_featured_partner = ?, updated_at = CURRENT_TIMESTAMP WHERE user_email = ?";
    const isFeaturedVal = isPG ? isFeatured : (isFeatured ? 1 : 0);
    
    if (isPG) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(sql), [isFeaturedVal, email]);
    } else {
      const db = getSQLiteDB();
      db.prepare(sql).run(isFeaturedVal, email);
    }
    return true;
  } catch (error) {
    console.error(`Error in updatePartnerFeaturedStatus(${email}):`, error);
    return false;
  }
}

/**
 * Lấy danh sách 200 đối tác mẫu từ danh bạ doanh nghiệp đóng cửa (status = '閉鎖')
 */
export async function getMockPartners(): Promise<UserBillingInfo[]> {
  await initQuotaTables();
  try {
    const sql = "SELECT company_name, corporate_number FROM companies WHERE status = '閉鎖' LIMIT 200";
    const rows = await runQuery(sql);
    if (!rows) return [];
    return rows.map((row: any, index: number) => ({
      user_email: `mock_${row.corporate_number || index}@mock-partner.com`,
      billing_name: row.company_name,
      billing_address: null,
      billing_tax_id: null,
      billing_phone: null,
      logo_url: `MOCK_SVG_${index}`,
      is_featured_partner: true,
    }));
  } catch (error) {
    console.error("Error in getMockPartners:", error);
    return [];
  }
}


let adminLogTableInitialized = false;

export async function initAdminLogTable(): Promise<void> {
  if (adminLogTableInitialized) return;
  const isPG = !!DATABASE_URL;
  if (isPG) {
    const pool = getPGPool();
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_action_logs (
          id VARCHAR(50) PRIMARY KEY,
          admin_email VARCHAR(255) NOT NULL,
          action_type VARCHAR(100) NOT NULL,
          target_identifier VARCHAR(255) NOT NULL,
          details_json TEXT,
          ip_address VARCHAR(50),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.error('Error initializing PG admin log table:', e);
    } finally {
      client.release();
    }
  } else {
    try {
      const db = getSQLiteDB();
      db.exec(`
        CREATE TABLE IF NOT EXISTS admin_action_logs (
          id TEXT PRIMARY KEY,
          admin_email TEXT NOT NULL,
          action_type TEXT NOT NULL,
          target_identifier TEXT NOT NULL,
          details_json TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.error('Error initializing SQLite admin log table:', e);
    }
  }
  adminLogTableInitialized = true;
}

export interface AdminActionLog {
  id: string;
  admin_email: string;
  action_type: string;
  target_identifier: string;
  details_json: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export async function logAdminAction(
  adminEmail: string,
  actionType: string,
  targetIdentifier: string,
  detailsObj: any,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<boolean> {
  await initAdminLogTable();
  try {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const detailsJson = detailsObj ? JSON.stringify(detailsObj) : null;
    const sql = `
      INSERT INTO admin_action_logs (id, admin_email, action_type, target_identifier, details_json, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(sql), [
        id,
        adminEmail,
        actionType,
        targetIdentifier,
        detailsJson,
        ipAddress || null,
        userAgent || null
      ]);
    } else {
      const db = getSQLiteDB();
      db.prepare(sql).run(
        id,
        adminEmail,
        actionType,
        targetIdentifier,
        detailsJson,
        ipAddress || null,
        userAgent || null
      );
    }
    return true;
  } catch (error) {
    console.error("Error in logAdminAction:", error);
    return false;
  }
}

export async function getAdminActionLogs(): Promise<AdminActionLog[]> {
  await initAdminLogTable();
  try {
    const sql = "SELECT * FROM admin_action_logs ORDER BY created_at DESC LIMIT 500";
    const rows = await runQuery(sql);
    if (!rows) return [];
    return rows.map((r: any) => ({
      id: r.id,
      admin_email: r.admin_email,
      action_type: r.action_type,
      target_identifier: r.target_identifier,
      details_json: r.details_json,
      ip_address: r.ip_address || null,
      user_agent: r.user_agent || null,
      created_at: String(r.created_at)
    }));
  } catch (error) {
    console.error("Error in getAdminActionLogs:", error);
    return [];
  }
}

// ==========================================
// PHASE 6: API KEY & EXTERNAL DEVELOPER API
// ==========================================

export interface UserApiKey {
  id: string;
  user_email: string;
  api_key_hash: string;
  api_key_preview: string;
  status: 'active' | 'revoked';
  created_at: string;
  last_used_at: string | null;
  last_ip: string | null;
  last_user_agent: string | null;
  revoked_reason?: string | null;
}

/**
 * Gets all API keys for a specific user email.
 */
export async function getUserApiKeys(email: string): Promise<UserApiKey[]> {
  await initQuotaTables();
  try {
    const sql = "SELECT * FROM user_api_keys WHERE user_email = ? ORDER BY created_at DESC";
    const rows = await runQuery(sql, [email]);
    if (!rows) return [];
    return rows.map((r: any) => ({
      id: r.id,
      user_email: r.user_email,
      api_key_hash: r.api_key_hash,
      api_key_preview: r.api_key_preview,
      status: r.status as any,
      created_at: String(r.created_at),
      last_used_at: r.last_used_at ? String(r.last_used_at) : null,
      last_ip: r.last_ip || null,
      last_user_agent: r.last_user_agent || null,
      revoked_reason: r.revoked_reason || null
    }));
  } catch (error) {
    console.error(`Error in getUserApiKeys(${email}):`, error);
    return [];
  }
}

/**
 * Creates a new API key for a user. Generates a cryptographically secure random token,
 * hashes it using SHA-256 for DB storage, and returns the raw key to be displayed once.
 */
export async function createUserApiKey(email: string): Promise<{ rawKey: string; keyInfo: UserApiKey } | null> {
  await initQuotaTables();
  try {
    const id = `apikey_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const rawKey = `kigyou_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPreview = `...${rawKey.slice(-4)}`;

    const insertSql = `
      INSERT INTO user_api_keys (id, user_email, api_key_hash, api_key_preview, status)
      VALUES (?, ?, ?, ?, 'active')
    `;

    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(insertSql), [id, email, keyHash, keyPreview]);
    } else {
      const db = getSQLiteDB();
      db.prepare(insertSql).run(id, email, keyHash, keyPreview);
    }

    const keyInfo: UserApiKey = {
      id,
      user_email: email,
      api_key_hash: keyHash,
      api_key_preview: keyPreview,
      status: 'active',
      created_at: new Date().toISOString(),
      last_used_at: null,
      last_ip: null,
      last_user_agent: null
    };

    return { rawKey, keyInfo };
  } catch (error) {
    console.error(`Error in createUserApiKey(${email}):`, error);
    return null;
  }
}

/**
 * Revokes a user's API Key.
 */
export async function revokeUserApiKey(email: string, keyId: string): Promise<boolean> {
  await initQuotaTables();
  try {
    const sql = "UPDATE user_api_keys SET status = 'revoked' WHERE id = ? AND user_email = ?";
    if (DATABASE_URL) {
      const pool = getPGPool();
      const res = await pool.query(convertSqlForPG(sql), [keyId, email]);
      return (res.rowCount ?? 0) > 0;
    } else {
      const db = getSQLiteDB();
      const info = db.prepare(sql).run(keyId, email);
      return info.changes > 0;
    }
  } catch (error) {
    console.error(`Error in revokeUserApiKey(${keyId}):`, error);
    return false;
  }
}

/**
 * Verifies an API Key by hashing it and checking if it's active.
 * Returns the key owner details and quota info.
 */
export async function verifyApiKey(rawKey: string): Promise<{ keyInfo: UserApiKey; plan: string; subscription_status: string } | null> {
  await initQuotaTables();
  try {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const sql = `
      SELECT k.*, q.plan, q.subscription_status
      FROM user_api_keys k
      JOIN user_export_quotas q ON k.user_email = q.user_email
      WHERE k.api_key_hash = ? AND k.status = 'active'
      LIMIT 1
    `;
    const row = await runGetQuery(sql, [keyHash]);
    if (!row) return null;

    return {
      keyInfo: {
        id: row.id,
        user_email: row.user_email,
        api_key_hash: row.api_key_hash,
        api_key_preview: row.api_key_preview,
        status: row.status as any,
        created_at: String(row.created_at),
        last_used_at: row.last_used_at ? String(row.last_used_at) : null,
        last_ip: row.last_ip || null,
        last_user_agent: row.last_user_agent || null
      },
      plan: row.plan || 'free',
      subscription_status: row.subscription_status || 'inactive'
    };
  } catch (error) {
    console.error('Error in verifyApiKey:', error);
    return null;
  }
}

/**
 * Updates the usage metadata of an API key.
 */
export async function updateApiKeyUsage(keyId: string, ip: string, ua: string): Promise<void> {
  try {
    const sql = `
      UPDATE user_api_keys 
      SET last_used_at = CURRENT_TIMESTAMP, last_ip = ?, last_user_agent = ?
      WHERE id = ?
    `;
    if (DATABASE_URL) {
      const pool = getPGPool();
      await pool.query(convertSqlForPG(sql), [ip, ua, keyId]);
    } else {
      const db = getSQLiteDB();
      db.prepare(sql).run(ip, ua, keyId);
    }
  } catch (error) {
    console.error(`Error in updateApiKeyUsage(${keyId}):`, error);
  }
}

/**
 * Admin: Get all API Keys in the system.
 */
export async function getAllApiKeysAdmin(): Promise<(UserApiKey & { plan: string })[]> {
  await initQuotaTables();
  try {
    const sql = `
      SELECT k.*, q.plan
      FROM user_api_keys k
      JOIN user_export_quotas q ON k.user_email = q.user_email
      ORDER BY k.created_at DESC
    `;
    const rows = await runQuery(sql);
    if (!rows) return [];
    return rows.map((r: any) => ({
      id: r.id,
      user_email: r.user_email,
      api_key_hash: r.api_key_hash,
      api_key_preview: r.api_key_preview,
      status: r.status as any,
      created_at: String(r.created_at),
      last_used_at: r.last_used_at ? String(r.last_used_at) : null,
      last_ip: r.last_ip || null,
      last_user_agent: r.last_user_agent || null,
      plan: r.plan || 'free',
      revoked_reason: r.revoked_reason || null
    }));
  } catch (error) {
    console.error('Error in getAllApiKeysAdmin:', error);
    return [];
  }
}

/**
 * Admin: Update API key status (revoke or activate).
 */
export async function adminUpdateApiKeyStatus(keyId: string, status: 'active' | 'revoked', reason?: string): Promise<boolean> {
  await initQuotaTables();
  try {
    const sql = "UPDATE user_api_keys SET status = ?, revoked_reason = ? WHERE id = ?";
    if (DATABASE_URL) {
      const pool = getPGPool();
      const res = await pool.query(convertSqlForPG(sql), [status, reason || null, keyId]);
      return (res.rowCount ?? 0) > 0;
    } else {
      const db = getSQLiteDB();
      const info = db.prepare(sql).run(status, reason || null, keyId);
      return info.changes > 0;
    }
  } catch (error) {
    console.error(`Error in adminUpdateApiKeyStatus(${keyId}, ${status}):`, error);
    return false;
  }
}

/**
 * Fetch business signals globally with optional filters, sorted by signal_date DESC.
 */
export async function getBusinessSignalsGlobal(
  filters: { corporate_number?: string; signal_type?: string },
  limit = 20,
  offset = 0
): Promise<{ signals: any[]; totalCount: number }> {
  await initQuotaTables();
  try {
    const params: any[] = [];
    let whereClause = "";
    const conditions: string[] = [];

    if (filters.corporate_number) {
      conditions.push("bs.corporate_number = ?");
      params.push(filters.corporate_number);
    }
    if (filters.signal_type) {
      conditions.push("bs.signal_type = ?");
      params.push(filters.signal_type);
    }

    if (conditions.length > 0) {
      whereClause = "WHERE " + conditions.join(" AND ");
    }

    const countSql = `SELECT COUNT(*) as count FROM business_signals bs ${whereClause}`;
    const countResult = await runGetQuery(countSql, params);
    const totalCount = countResult ? Number(countResult.count) : 0;

    let sql = `
      SELECT bs.*, c.company_name
      FROM business_signals bs
      JOIN companies c ON bs.corporate_number = c.corporate_number
      ${whereClause}
      ORDER BY bs.signal_date DESC, bs.id DESC
    `;
    
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rows = await runQuery(sql, params);
    return {
      signals: rows ? rows.map(r => ({
        id: r.id,
        corporate_number: r.corporate_number,
        company_name: r.company_name,
        signal_type: r.signal_type,
        signal_title: r.signal_title,
        signal_date: r.signal_date,
        amount: r.amount,
        government_departments: r.government_departments,
        source_url: r.source_url,
        details: r.details,
        created_at: String(r.created_at)
      })) : [],
      totalCount
    };
  } catch (error) {
    console.error('Error in getBusinessSignalsGlobal:', error);
    return { signals: [], totalCount: 0 };
  }
}

let backupLogsTableInitialized = false;
export async function initBackupLogsTable(): Promise<void> {
  if (backupLogsTableInitialized) return;
  const isPG = !!DATABASE_URL;
  if (isPG) {
    const pool = getPGPool();
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS backup_logs (
          id VARCHAR(50) PRIMARY KEY,
          backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) NOT NULL,
          file_name VARCHAR(255),
          file_size VARCHAR(50),
          error_message TEXT
        );
      `);
    } catch (e) {
      console.error('Error initializing PG backup log table:', e);
    } finally {
      client.release();
    }
  } else {
    try {
      const db = getSQLiteDB();
      db.exec(`
        CREATE TABLE IF NOT EXISTS backup_logs (
          id TEXT PRIMARY KEY,
          backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status TEXT NOT NULL,
          file_name TEXT,
          file_size TEXT,
          error_message TEXT
        );
      `);
    } catch (e) {
      console.error('Error initializing SQLite backup log table:', e);
    }
  }
  backupLogsTableInitialized = true;
}

export interface BackupLog {
  id: string;
  backup_time: string;
  status: string;
  file_name: string | null;
  file_size: string | null;
  error_message: string | null;
}

export async function getBackupLogs(): Promise<BackupLog[]> {
  try {
    const rows = await runQuery('SELECT * FROM backup_logs ORDER BY backup_time DESC LIMIT 50');
    return rows ? rows.map(r => ({
      id: String(r.id),
      backup_time: String(r.backup_time),
      status: String(r.status),
      file_name: r.file_name || null,
      file_size: r.file_size || null,
      error_message: r.error_message || null,
    })) : [];
  } catch (error) {
    console.error('Error in getBackupLogs:', error);
    return [];
  }
}

export async function getMajorIndustryNames(): Promise<string[]> {
  const cacheKey = 'major_industry_names';
  const cached = getCachedData<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const rows = await runQuery("SELECT DISTINCT industry_name FROM m_industries WHERE classification_level = '大分類'");
    const result = rows ? rows.map(r => ({ industry_code: r.industry_code, industry_name: r.industry_name })) : [];
    // Cache only the names for backward compatibility if needed, but since we are modifying the query let's keep it clean
    const names = rows ? rows.map(r => r.industry_name) : [];
    setCachedData(cacheKey, names);
    return names;
  } catch (error) {
    console.error('Error in getMajorIndustryNames:', error);
    return [];
  }
}

export interface CompanyIndustryDetail {
  industry_code: string;
  industry_name: string;
  classification_level: string;
}

export async function getCompanyIndustries(corpNum: string): Promise<CompanyIndustryDetail[]> {
  try {
    const rows = await runQuery(`
      SELECT ci.industry_code, m.industry_name, m.classification_level
      FROM company_industries ci
      JOIN m_industries m ON ci.industry_code = m.industry_code
      WHERE ci.corporate_number = ?
      ORDER BY LENGTH(ci.industry_code) ASC, ci.industry_code ASC
    `, [corpNum]);
    return rows ? rows.map(r => ({
      industry_code: String(r.industry_code),
      industry_name: String(r.industry_name),
      classification_level: String(r.classification_level)
    })) : [];
  } catch (error) {
    console.error(`Error in getCompanyIndustries(${corpNum}):`, error);
    return [];
  }
}

// =============================================================================
// BLOG SYSTEM DYNAMIC SCHEMAS & UTILITIES
// =============================================================================
let blogPostsTableInitialized = false;
export async function initBlogPostsTable(): Promise<void> {
  if (blogPostsTableInitialized) return;
  const isPG = !!DATABASE_URL;
  if (isPG) {
    const pool = getPGPool();
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id SERIAL PRIMARY KEY,
          slug VARCHAR(255) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          summary TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          published_at VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.error('Error initializing PG blog_posts table:', e);
    } finally {
      client.release();
    }
  } else {
    try {
      const db = getSQLiteDB();
      db.exec(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          summary TEXT NOT NULL,
          category TEXT NOT NULL,
          published_at TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.error('Error initializing SQLite blog_posts table:', e);
    }
  }
  blogPostsTableInitialized = true;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  published_at: string;
  created_at: string;
}

export async function getBlogPosts(limit = 10, offset = 0): Promise<BlogPost[]> {
  try {
    const rows = await runQuery(
      'SELECT * FROM blog_posts ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows ? rows.map(r => ({
      id: Number(r.id),
      slug: String(r.slug),
      title: String(r.title),
      content: String(r.content),
      summary: String(r.summary),
      category: String(r.category),
      published_at: String(r.published_at),
      created_at: String(r.created_at)
    })) : [];
  } catch (error) {
    console.error('Error in getBlogPosts:', error);
    return [];
  }
}

export async function getBlogPostsCount(): Promise<number> {
  try {
    const row = await runGetQuery('SELECT COUNT(*) as count FROM blog_posts');
    return row ? Number(row.count) : 0;
  } catch (error) {
    console.error('Error in getBlogPostsCount:', error);
    return 0;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const row = await runGetQuery('SELECT * FROM blog_posts WHERE slug = ?', [slug]);
    if (!row) return null;
    return {
      id: Number(row.id),
      slug: String(row.slug),
      title: String(row.title),
      content: String(row.content),
      summary: String(row.summary),
      category: String(row.category),
      published_at: String(row.published_at),
      created_at: String(row.created_at)
    };
  } catch (error) {
    console.error(`Error in getBlogPostBySlug(${slug}):`, error);
    return null;
  }
}

export async function createBlogPost(post: {
  slug: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  published_at: string;
}): Promise<void> {
  try {
    const isPG = !!DATABASE_URL;
    if (isPG) {
      const sql = `
        INSERT INTO blog_posts (slug, title, content, summary, category, published_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          summary = EXCLUDED.summary,
          category = EXCLUDED.category,
          published_at = EXCLUDED.published_at
      `;
      await runQuery(sql, [post.slug, post.title, post.content, post.summary, post.category, post.published_at]);
    } else {
      const sql = `
        INSERT INTO blog_posts (slug, title, content, summary, category, published_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          summary = excluded.summary,
          category = excluded.category,
          published_at = excluded.published_at
      `;
      await runQuery(sql, [post.slug, post.title, post.content, post.summary, post.category, post.published_at]);
    }
  } catch (error) {
    console.error('Error in createBlogPost:', error);
    throw error;
  }
}

// =============================================================================
// BLOCKED IPS FOR BOT SCRAMBLING & SECURITY SHIELD
// =============================================================================
const blockedIpsCache = new Set<string>();
let blockedIpsTableInitialized = false;

export async function initBlockedIpsTable(): Promise<void> {
  if (blockedIpsTableInitialized) return;
  const isPG = !!DATABASE_URL;
  if (isPG) {
    const pool = getPGPool();
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS blocked_ips (
          ip VARCHAR(50) PRIMARY KEY,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.error('Error initializing PG blocked_ips table:', e);
    } finally {
      client.release();
    }
  } else {
    try {
      const db = getSQLiteDB();
      db.exec(`
        CREATE TABLE IF NOT EXISTS blocked_ips (
          ip TEXT PRIMARY KEY,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.error('Error initializing SQLite blocked_ips table:', e);
    }
  }
  blockedIpsTableInitialized = true;
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  if (blockedIpsCache.has(ip)) return true;
  try {
    const row = await runGetQuery('SELECT ip FROM blocked_ips WHERE ip = ?', [ip]);
    if (row) {
      blockedIpsCache.add(ip);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error in isIpBlocked(${ip}):`, error);
    return false;
  }
}

export async function blockIp(ip: string, reason: string): Promise<boolean> {
  try {
    const isPG = !!DATABASE_URL;
    let sql = "";
    if (isPG) {
      sql = `
        INSERT INTO blocked_ips (ip, reason)
        VALUES (?, ?)
        ON CONFLICT(ip) DO UPDATE SET reason = EXCLUDED.reason
      `;
    } else {
      sql = `
        INSERT INTO blocked_ips (ip, reason)
        VALUES (?, ?)
        ON CONFLICT(ip) DO UPDATE SET reason = excluded.reason
      `;
    }
    await runQuery(sql, [ip, reason]);
    blockedIpsCache.add(ip);
    console.log(`[Security] Successfully blocked IP: ${ip} for reason: ${reason}`);
    return true;
  } catch (error) {
    console.error(`Error in blockIp(${ip}):`, error);
    return false;
  }
}






