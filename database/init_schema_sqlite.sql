-- =============================================================================
-- Kigyou-list: SQLite Database Initial Schema (For Quick Local Testing)
-- =============================================================================

PRAGMA foreign_keys = ON;

-- 1. Bảng danh mục Ngành nghề JSIC (産業分類マスター)
CREATE TABLE IF NOT EXISTS m_industries (
    industry_code TEXT PRIMARY KEY,
    industry_name TEXT NOT NULL,
    classification_level TEXT NOT NULL, -- '大分類' hoặc '中分類'
    parent_code TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_code) REFERENCES m_industries(industry_code)
);

-- 2. Bảng chính: Thông tin Pháp nhân (法人情報テーブル - Lớp Gold)
CREATE TABLE IF NOT EXISTS companies (
    corporate_number TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_name_kana TEXT NULL,
    company_name_en TEXT NULL,
    
    -- Địa chỉ đăng ký
    postal_code TEXT NULL,
    prefecture_code TEXT NULL,
    prefecture_name TEXT NULL,
    city_name TEXT NULL,
    street_address TEXT NULL,
    full_address TEXT NULL,
    
    -- Đại diện & Pháp lý
    representative_name TEXT NULL,
    representative_position TEXT NULL,
    establishment_date TEXT NULL, -- SQLite lưu dạng YYYY-MM-DD TEXT
    
    -- Quy mô
    capital_amount INTEGER NULL,
    employee_count INTEGER NULL,
    sales_amount INTEGER NULL,
    
    -- Liên lạc
    phone_number TEXT NULL,
    fax_number TEXT NULL,
    website_url TEXT NULL,
    email_address TEXT NULL,
    
    -- Tóm tắt & Trạng thái
    business_summary TEXT NULL,
    jigyo_shumoku TEXT NULL, -- 事業種目
    branch_phone_numbers TEXT NULL, -- 支店電話番号
    yahoo_last_crawled_at TEXT NULL, -- Yahoo最終検索日 (Chu kỳ 2 năm)
    website_last_crawled_at TEXT NULL, -- 公式ウェブサイト最終収集日 (Chu kỳ 2 năm)
    website_crawl_status TEXT NULL, -- 公式ウェブサイト収集ステータス
    last_deep_tagged_at TEXT NULL, -- Thời điểm gán nhãn sâu dựa trên dữ liệu cào
    status TEXT DEFAULT '活動中',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng phụ: Mapping Nhiều - Nhiều (企業_産業分類マッピング)
CREATE TABLE IF NOT EXISTS company_industries (
    corporate_number TEXT,
    industry_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (corporate_number, industry_code),
    FOREIGN KEY (corporate_number) REFERENCES companies(corporate_number) ON DELETE CASCADE,
    FOREIGN KEY (industry_code) REFERENCES m_industries(industry_code) ON DELETE CASCADE
);

-- 4. Bảng Tín hiệu: Intent Data (シグナルテーブル)
CREATE TABLE IF NOT EXISTS business_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    corporate_number TEXT,
    signal_type TEXT NOT NULL,          -- '補助金', '調達', '特許', '届出・認定', '表彰', '求人中'
    signal_title TEXT NOT NULL,         -- 名称 / 件名 / 発明の名称
    signal_date TEXT NULL,              -- 証明日 / 受注日 / 出願年月日
    amount INTEGER NULL,                -- 金額 (補助金額, 落札価格)
    government_departments TEXT NULL,   -- 発行元 / 組織名 (府省・機関名)
    source_key TEXT NULL,               -- 重複チェック用ユニークキー (CSV: キー情報 / API: 複合キー)
    source_url TEXT NULL,
    details TEXT NULL,                  -- JSON String (追加フィールド)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (corporate_number) REFERENCES companies(corporate_number) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_signals_source_key ON business_signals(source_key) WHERE source_key IS NOT NULL;

-- 5. Bảng dữ liệu thô cào từ HelloWork (ハローワーク収集データ)
CREATE TABLE IF NOT EXISTS raw_hellowork (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_number TEXT NULL,                -- 求人番号
    receipt_date TEXT NULL,              -- 受付年月日
    job_title TEXT NULL,                 -- 職種
    office_name TEXT NULL,               -- 事業所名
    corporate_number TEXT NULL,          -- 法人番号
    representative_name TEXT NULL,       -- 役職／代表者名
    employment_status TEXT NULL,         -- 正社員／正社員以外
    wages TEXT NULL,                     -- 賃金
    work_location TEXT NULL,             -- 就業場所
    work_hours TEXT NULL,                -- 就業時間
    holidays TEXT NULL,                  -- 休日
    job_description TEXT NULL,           -- 仕事内容
    required_experience TEXT NULL,       -- 必要な経験等
    contact_person TEXT NULL,            -- 担当者
    phone_number TEXT NULL,              -- 電話番号
    fax_number TEXT NULL,                -- ＦＡＸ
    email_address TEXT NULL,             -- Ｅメール
    office_address TEXT NULL,            -- 所在地
    website_url TEXT NULL,               -- ホームページ
    industry TEXT NULL,                  -- 産業
    capital_amount TEXT NULL,            -- 資本金
    total_employees TEXT NULL,           -- 従業員数（全体）
    location_employees TEXT NULL,        -- 就業場所（従業員数）
    female_employees TEXT NULL,          -- うち女性
    parttime_employees TEXT NULL,        -- うちパート
    establishment_year TEXT NULL,        -- 設立年
    scraped_at TEXT NULL                 -- 収集日 / Ngày giờ cào dữ liệu
);

-- 6. Bảng dữ liệu thô cào từ Yahoo Search/Maps
CREATE TABLE IF NOT EXISTS raw_yahoo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    corporate_number TEXT NULL,
    company_name TEXT NULL,
    yahoo_name TEXT NULL,
    yahoo_address TEXT NULL,
    phone_number TEXT NULL,
    website_url TEXT NULL,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng dữ liệu thô cào từ Website chính thức
CREATE TABLE IF NOT EXISTS raw_website (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    corporate_number TEXT NULL,
    website_url TEXT NULL,
    phone_number TEXT NULL,
    fax_number TEXT NULL,
    email_address TEXT NULL,
    capital_amount TEXT NULL,            -- Vốn điều lệ cào thô
    employee_count TEXT NULL,            -- Số lượng nhân viên cào thô
    representative_name TEXT NULL,       -- Tên đại diện cào thô
    business_summary TEXT NULL,          -- Mô tả hoạt động / text thô để AI phân loại ngành nghề
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng Lịch sử Tài chính (法人財務情報履歴 - Lớp Gold)
CREATE TABLE IF NOT EXISTS company_financials (
    corporate_number TEXT NOT NULL,
    fiscal_year TEXT NOT NULL,          -- Chuỗi gốc ví dụ: '第75期(自 2024年4月1日 至 2025年3月31日)'
    sequence_number INTEGER NOT NULL,   -- '回次': 0 (Năm nay), 1 (Năm ngoái), 2, 3, 4
    fiscal_year_start TEXT NULL,        -- Ngày bắt đầu dương lịch đã chuẩn hóa: 'YYYY-MM-DD'
    fiscal_year_end TEXT NULL,          -- Ngày kết thúc dương lịch đã chuẩn hóa: 'YYYY-MM-DD'
    sales_amount INTEGER NULL,          -- Doanh thu hợp nhất (Yên Nhật)
    ordinary_income INTEGER NULL,       -- Lợi nhuận thường niên (経常利益 - Yen)
    net_income INTEGER NULL,            -- Lợi nhuận ròng sau thuế (当期純利益 - Yen)
    capital_amount INTEGER NULL,        -- Vốn điều lệ (資本金 - Yen)
    net_assets INTEGER NULL,            -- Giá trị tài sản ròng (純資産額 - Yen)
    total_assets INTEGER NULL,          -- Tổng tài sản (総資産額 - Yen)
    employee_count INTEGER NULL,        -- Số lượng nhân viên (従業員数)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (corporate_number, sequence_number),
    FOREIGN KEY (corporate_number) REFERENCES companies(corporate_number) ON DELETE CASCADE
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_companies_prefecture ON companies(prefecture_name);
CREATE INDEX IF NOT EXISTS idx_companies_capital ON companies(capital_amount);
CREATE INDEX IF NOT EXISTS idx_companies_employees ON companies(employee_count);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_signals_corp_num ON business_signals(corporate_number);
CREATE INDEX IF NOT EXISTS idx_signals_type ON business_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_comp_ind_ind_code ON company_industries(industry_code);
CREATE INDEX IF NOT EXISTS idx_comp_ind_corp_num ON company_industries(corporate_number);
CREATE INDEX IF NOT EXISTS idx_financials_corp_num ON company_financials(corporate_number);
CREATE INDEX IF NOT EXISTS idx_financials_seq_num ON company_financials(sequence_number);

-- Indexes for raw staging tables (Bronze Layer) to prevent ETL consolidation hangs
CREATE INDEX IF NOT EXISTS idx_raw_hellowork_corp_num ON raw_hellowork(corporate_number);
CREATE INDEX IF NOT EXISTS idx_raw_website_corp_num ON raw_website(corporate_number);
CREATE INDEX IF NOT EXISTS idx_raw_yahoo_corp_num ON raw_yahoo(corporate_number);

-- =============================================================================
-- METADATA TABLES & OPTIMIZED INDEXES FOR SEARCH OPTIMIZATION
-- =============================================================================

-- Table for pre-calculated prefecture counts
CREATE TABLE IF NOT EXISTS prefecture_counts (
    prefecture_code TEXT PRIMARY KEY,
    prefecture_name TEXT NOT NULL,
    company_count INTEGER NOT NULL
);

-- Table for pre-calculated industry counts
CREATE TABLE IF NOT EXISTS industry_counts (
    industry_code TEXT PRIMARY KEY,
    industry_name TEXT NOT NULL,
    company_count INTEGER NOT NULL
);

-- Table for database stats (home page counters)
CREATE TABLE IF NOT EXISTS database_stats (
    stat_key TEXT PRIMARY KEY,
    stat_value INTEGER NOT NULL
);

-- Composite index for sorting by employee count DESC and corporate number ASC without filesorts
CREATE INDEX IF NOT EXISTS idx_companies_employees_corp ON companies(employee_count DESC, corporate_number ASC);

-- Composite index for fast filtering by prefecture code and sorting by employee count + corporate number
CREATE INDEX IF NOT EXISTS idx_companies_pref_emp_corp ON companies(prefecture_code, employee_count DESC, corporate_number);

-- Index for fast range queries on founding year / establishment date
CREATE INDEX IF NOT EXISTS idx_companies_establishment ON companies(establishment_date) WHERE establishment_date IS NOT NULL;

-- Index for fast filtering by prefecture code
CREATE INDEX IF NOT EXISTS idx_companies_prefecture_code ON companies(prefecture_code);

-- Cache table for fast XML sitemap generation
CREATE TABLE IF NOT EXISTS sitemap_companies (
    corporate_number TEXT PRIMARY KEY,
    updated_at TEXT,
    employee_count INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sitemap_companies_employees ON sitemap_companies(employee_count DESC, corporate_number ASC);

-- Cache table for active industry-prefecture pairs in sitemaps
CREATE TABLE IF NOT EXISTS industry_prefecture_pairs (
    industry_code TEXT,
    prefecture_code TEXT,
    PRIMARY KEY (industry_code, prefecture_code)
);



