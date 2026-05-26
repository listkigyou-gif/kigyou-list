-- =============================================================================
-- Kigyou-list: PostgreSQL Database Initial Schema
-- Quy tắc thiết kế: Tên vật lý tiếng Anh/Romaji - Comments & Meta 100% tiếng Nhật
-- Kiến trúc: Bronze Layer (Dữ liệu Thô) -> Gold Layer (Dữ liệu Hợp nhất Sạch)
-- =============================================================================

-- Bật extension để hỗ trợ UUID và các hàm JSONB nâng cao nếu cần
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- I. MASTER DATA & GOLD LAYER (Dữ liệu Hợp nhất Sạch - Phục vụ UI & Export)
-- =============================================================================

-- 1. Bảng danh mục Ngành nghề JSIC (産業分類マスター)
CREATE TABLE m_industries (
    industry_code VARCHAR(4) PRIMARY KEY,
    industry_name VARCHAR(255) NOT NULL,
    classification_level VARCHAR(10) NOT NULL, -- '大分類' (Đại phân loại) hoặc '中分類' (Trung phân loại)
    parent_code VARCHAR(4) NULL, -- Mã cha liên kết cấp Trung với cấp Đại
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE m_industries IS '日本標準産業分類（JSIC）マスタテーブル';
COMMENT ON COLUMN m_industries.industry_code IS '産業分類コード（大分類はアルファベット、中分類は2桁数値）';
COMMENT ON COLUMN m_industries.industry_name IS '分類項目名';
COMMENT ON COLUMN m_industries.classification_level IS '分類階層（大分類 / 中分類）';
COMMENT ON COLUMN m_industries.parent_code IS '親分類コード（中分類が属する大分類コードへの自己参照リンク）';
COMMENT ON COLUMN m_industries.created_at IS '作成日時';


-- 2. Bảng chính: Thông tin Pháp nhân (法人情報テーブル - Bảng Gold)
CREATE TABLE companies (
    corporate_number VARCHAR(13) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_name_kana VARCHAR(255) NULL,
    company_name_en VARCHAR(255) NULL,
    
    -- Thông tin địa chỉ đăng ký (登記住所情報)
    postal_code VARCHAR(7) NULL,
    prefecture_code VARCHAR(2) NULL, -- Mã tỉnh JIS
    prefecture_name VARCHAR(20) NULL,
    city_name VARCHAR(100) NULL,
    street_address VARCHAR(255) NULL,
    full_address VARCHAR(500) NULL, -- Địa chỉ đăng ký đầy đủ
    
    -- Thông tin đại diện & Pháp lý
    representative_name VARCHAR(100) NULL,
    representative_position VARCHAR(100) NULL,
    establishment_date DATE NULL,
    
    -- Quy mô doanh nghiệp (Điền từ G-Biz gốc hoặc HelloWork)
    capital_amount BIGINT NULL,
    employee_count INT NULL,
    sales_amount BIGINT NULL, -- Doanh thu (làm giàu từ crawler/quy đổi)
    
    -- Thông tin liên lạc (Hợp nhất tốt nhất từ các nguồn thô)
    phone_number VARCHAR(20) NULL,
    fax_number VARCHAR(20) NULL,
    website_url VARCHAR(500) NULL,
    email_address VARCHAR(255) NULL,
    
    -- Tóm tắt & Trạng thái hoạt động
    business_summary TEXT NULL,
    jigyo_shumoku TEXT NULL, -- 事業種目
    branch_phone_numbers TEXT NULL, -- 支店電話番号
    yahoo_last_crawled_at TIMESTAMP NULL, -- Yahoo最終検索日 (Chu kỳ 2 năm)
    website_last_crawled_at TIMESTAMP NULL, -- 公式ウェブサイト最終収集日 (Chu kỳ 2 năm)
    website_crawl_status VARCHAR(50) NULL, -- 公式ウェブサイト収集ステータス
    status VARCHAR(50) DEFAULT '活動中', -- Trạng thái (đóng cửa, hoạt động)
    
    -- Metadata hệ thống
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE companies IS '法人基本情報（クリーン＆統合済ゴールドデータ）';
COMMENT ON COLUMN companies.corporate_number IS '法人番号（国税庁から付yされた13桁の番号）';
COMMENT ON COLUMN companies.company_name IS '商号又は名称';
COMMENT ON COLUMN companies.company_name_kana IS '商号又は名称（フリガナ）';
COMMENT ON COLUMN companies.company_name_en IS '商号又は名称（英語）';
COMMENT ON COLUMN companies.postal_code IS '郵便番号（7桁、ハイフンなし）';
COMMENT ON COLUMN companies.prefecture_code IS '都道府県コード（JIS X 0401に準拠）';
COMMENT ON COLUMN companies.prefecture_name IS '都道府県名';
COMMENT ON COLUMN companies.city_name IS '市区町村名（郡名含む）';
COMMENT ON COLUMN companies.street_address IS '丁目・番地以下';
COMMENT ON COLUMN companies.full_address IS '登記住所（全体表記）';
COMMENT ON COLUMN companies.representative_name IS '代表者の氏名';
COMMENT ON COLUMN companies.representative_position IS '代表者の役職名';
COMMENT ON COLUMN companies.establishment_date IS '設立年月日';
COMMENT ON COLUMN companies.capital_amount IS '資本金（単位：円）';
COMMENT ON COLUMN companies.employee_count IS '従業員数';
COMMENT ON COLUMN companies.sales_amount IS '売上高（単位：円）';
COMMENT ON COLUMN companies.phone_number IS '電話番号（代表）';
COMMENT ON COLUMN companies.fax_number IS 'FAX番号';
COMMENT ON COLUMN companies.website_url IS '公式ウェブサイトURL';
COMMENT ON COLUMN companies.email_address IS 'メールアドレス（代表）';
COMMENT ON COLUMN companies.business_summary IS '事業概要';
COMMENT ON COLUMN companies.jigyo_shumoku IS '事業種目 (Mã/Tên ngành nghề phân loại hoặc thẻ tag từ AI)';
COMMENT ON COLUMN companies.branch_phone_numbers IS '支店電話番号 (Danh sách số điện thoại chi nhánh dạng JSON)';
COMMENT ON COLUMN companies.status IS '企業の活動ステータス（活動中、閉鎖等）';
COMMENT ON COLUMN companies.created_at IS 'システム登録日時';
COMMENT ON COLUMN companies.updated_at IS 'システム最終更新日時';


-- 3. Bảng phụ: Mapping Nhiều - Nhiều giữa Doanh nghiệp và Ngành nghề (企業_産業分類マッピング)
CREATE TABLE company_industries (
    corporate_number VARCHAR(13) REFERENCES companies(corporate_number) ON DELETE CASCADE,
    industry_code VARCHAR(4) REFERENCES m_industries(industry_code) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (corporate_number, industry_code)
);

COMMENT ON TABLE company_industries IS '企業と日本標準産業分類の中分類との多対多マッピングテーブル';
COMMENT ON COLUMN company_industries.corporate_number IS '法人番号';
COMMENT ON COLUMN company_industries.industry_code IS '産業分類コード';
COMMENT ON COLUMN company_industries.created_at IS '割当日時';


-- 4. Bảng Tín hiệu: Đấu thầu, Trợ cấp, Tuyển dụng (シグナルテーブル - Intent Data)
CREATE TABLE business_signals (
    id SERIAL PRIMARY KEY,
    corporate_number VARCHAR(13) REFERENCES companies(corporate_number) ON DELETE CASCADE,
    signal_type VARCHAR(50) NOT NULL, -- '求人中' (Tuyển dụng), '補助金受給' (Nhận trợ cấp), '調達案件' (Đấu thầu), '特許取得' (Bằng sáng chế)
    signal_title VARCHAR(500) NOT NULL, -- Tiêu đề tin tuyển dụng / tên gói thầu / tên trợ cấp
    signal_date DATE NULL, -- Ngày phát sinh tín hiệu
    source_url VARCHAR(1000) NULL, -- URL nguồn tín hiệu
    details JSONB NULL, -- Toàn bộ data chi tiết của tín hiệu dạng JSON (tiền lương, giá trị gói thầu...)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE business_signals IS '企業の購買意欲や成長性を示す各種シグナルデータテーブル';
COMMENT ON COLUMN business_signals.id IS 'シグナルユニークID';
COMMENT ON COLUMN business_signals.corporate_number IS '法人番号';
COMMENT ON COLUMN business_signals.signal_type IS 'シグナルタイプ（求人中、補助金受給、調達案件、特許取得など）';
COMMENT ON COLUMN business_signals.signal_title IS 'シグナルタイトル（求人名、補助金事業名など）';
COMMENT ON COLUMN business_signals.signal_date IS 'シグナル発生日（公告日、求人開始日など）';
COMMENT ON COLUMN business_signals.source_url IS 'シグナルの情報源URL';
COMMENT ON COLUMN business_signals.details IS 'シグナルの詳細データ（JSON形式で格納）';
COMMENT ON COLUMN business_signals.created_at IS 'システム登録日時';


-- =============================================================================
-- II. BRONZE LAYER (Lớp Dữ liệu Thô - Nơi hứng dữ liệu từ các Crawler và API)
-- =============================================================================

-- Note: Không cần bảng raw_gbiz vì file CSV 5 triệu dòng của G-Biz sẽ được script Python 
-- đọc trực tiếp (Stream) từ file vật lý, làm sạch trong bộ nhớ (In-memory ETL) và ghi thẳng 
-- vào bảng Gold (companies) để tiết kiệm dung lượng ổ cứng tối đa.

-- 1. Bảng dữ liệu thô cào từ HelloWork (ハローワーク収集データ)
CREATE TABLE raw_hellowork (
    id SERIAL PRIMARY KEY,
    job_number TEXT NULL,                -- 求人番号
    receipt_date TEXT NULL,              -- 受付年月日
    job_title TEXT NULL,                 -- 職種
    office_name TEXT NULL,               -- 事業所名
    corporate_number VARCHAR(13) NULL,   -- 法人番号
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
    scraped_at TEXT NULL                 -- 収集日
);

COMMENT ON TABLE raw_hellowork IS 'ハローワーク求人票からスクレイピングした生の収集データ';
COMMENT ON COLUMN raw_hellowork.job_number IS '求人番号';
COMMENT ON COLUMN raw_hellowork.receipt_date IS '受付年月日';
COMMENT ON COLUMN raw_hellowork.job_title IS '職種';
COMMENT ON COLUMN raw_hellowork.office_name IS '事業所名';
COMMENT ON COLUMN raw_hellowork.corporate_number IS '法人番号';
COMMENT ON COLUMN raw_hellowork.representative_name IS '役職／代表者名';
COMMENT ON COLUMN raw_hellowork.employment_status IS '正社員／正社員以外';
COMMENT ON COLUMN raw_hellowork.wages IS '賃金';
COMMENT ON COLUMN raw_hellowork.work_location IS '就業場所';
COMMENT ON COLUMN raw_hellowork.work_hours IS '就業時間';
COMMENT ON COLUMN raw_hellowork.holidays IS '休日';
COMMENT ON COLUMN raw_hellowork.job_description IS '仕事内容';
COMMENT ON COLUMN raw_hellowork.required_experience IS '必要な経験等';
COMMENT ON COLUMN raw_hellowork.contact_person IS '担当者';
COMMENT ON COLUMN raw_hellowork.phone_number IS '電話番号';
COMMENT ON COLUMN raw_hellowork.fax_number IS 'ＦＡＸ';
COMMENT ON COLUMN raw_hellowork.email_address IS 'Ｅメール';
COMMENT ON COLUMN raw_hellowork.office_address IS '所在地';
COMMENT ON COLUMN raw_hellowork.website_url IS 'ホームページ';
COMMENT ON COLUMN raw_hellowork.industry IS '産業';
COMMENT ON COLUMN raw_hellowork.capital_amount IS '資本金';
COMMENT ON COLUMN raw_hellowork.total_employees IS '従業員数（全体）';
COMMENT ON COLUMN raw_hellowork.location_employees IS '就業場所（従業員数）';
COMMENT ON COLUMN raw_hellowork.female_employees IS 'うち女性';
COMMENT ON COLUMN raw_hellowork.parttime_employees IS 'うちパート';
COMMENT ON COLUMN raw_hellowork.establishment_year IS '設立年';
COMMENT ON COLUMN raw_hellowork.scraped_at IS '収集日';


-- 3. Bảng dữ liệu thô cào từ Yahoo Search/Maps (Yahoo検索収集データ)
CREATE TABLE raw_yahoo (
    id SERIAL PRIMARY KEY,
    corporate_number VARCHAR(13) NULL,
    company_name TEXT NULL,
    yahoo_name TEXT NULL, -- Tên công ty tìm thấy trên Yahoo
    yahoo_address TEXT NULL, -- Địa chỉ trên Yahoo
    phone_number TEXT NULL,
    website_url TEXT NULL,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE raw_yahoo IS 'Yahooマップ・検索結果からスクレイピングした電話番号およびウェブサイトの生の収集データ';


-- 4. Bảng dữ liệu thô cào từ Website chính thức (公式ウェブサイト収集データ)
CREATE TABLE raw_website (
    id SERIAL PRIMARY KEY,
    corporate_number VARCHAR(13) NULL,
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

COMMENT ON TABLE raw_website IS '企業の公式ウェブサイトの問い合わせ・企業概要ページから抽出した生の連絡先データ';
COMMENT ON COLUMN raw_website.capital_amount IS '収集された生の資本金データ';
COMMENT ON COLUMN raw_website.employee_count IS '収集された生の従業員数データ';
COMMENT ON COLUMN raw_website.representative_name IS '収集された生の代表者氏名データ';
COMMENT ON COLUMN raw_website.business_summary IS '収集された生の事業概要・テキストデータ';


-- =============================================================================
-- III. INDEXES (Tối ưu hóa hiệu suất truy vấn - Đặc biệt cho Faceted Search)
-- =============================================================================

-- Tối ưu lọc tìm kiếm cơ bản trên Gold Layer
CREATE INDEX idx_companies_prefecture ON companies(prefecture_name);
CREATE INDEX idx_companies_capital ON companies(capital_amount) WHERE capital_amount IS NOT NULL;
CREATE INDEX idx_companies_employees ON companies(employee_count) WHERE employee_count IS NOT NULL;
CREATE INDEX idx_companies_pref_emp_corp ON companies(prefecture_code, employee_count DESC, corporate_number);
CREATE INDEX idx_companies_emp_nulls_last ON companies(employee_count DESC NULLS LAST, corporate_number ASC);
CREATE INDEX idx_companies_establishment ON companies(establishment_date) WHERE establishment_date IS NOT NULL;
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_email ON companies(email_address) WHERE email_address IS NOT NULL AND email_address != '';
CREATE INDEX idx_companies_phone ON companies(phone_number) WHERE phone_number IS NOT NULL AND phone_number != '';
CREATE INDEX idx_companies_website ON companies(website_url) WHERE website_url IS NOT NULL AND website_url != '';
CREATE INDEX idx_companies_fax ON companies(fax_number) WHERE fax_number IS NOT NULL AND fax_number != '';

-- Tối ưu tìm kiếm và join tín hiệu mua hàng
CREATE INDEX idx_signals_corp_num ON business_signals(corporate_number);
CREATE INDEX idx_signals_type ON business_signals(signal_type);

-- Tối ưu tìm kiếm quan hệ Nhiều-Nhiều với mã ngành
CREATE INDEX idx_comp_ind_ind_code ON company_industries(industry_code);
CREATE INDEX idx_comp_ind_corp_num ON company_industries(corporate_number);

-- Triggers tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Cache table for fast XML sitemap generation
CREATE TABLE sitemap_companies (
    corporate_number VARCHAR(13) PRIMARY KEY,
    updated_at TIMESTAMP,
    employee_count INT
);

CREATE INDEX idx_sitemap_companies_emp ON sitemap_companies(employee_count DESC, corporate_number ASC);
COMMENT ON TABLE sitemap_companies IS 'Sitemap掲載用法人キャッシュテーブル（ビルド高速化用）';

