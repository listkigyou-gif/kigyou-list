-- Cấu trúc Database Chuẩn hóa cho dự án Hellowork & Kigyoulist

-- 1. Bảng lưu trữ thông tin Công ty (Dữ liệu cố định)
CREATE TABLE IF NOT EXISTS companies (
    corporate_number TEXT PRIMARY KEY, -- Mã số thuế/pháp nhân (13 chữ số)
    company_name TEXT NOT NULL,
    company_name_kana TEXT,
    postal_code TEXT,
    address TEXT,
    website TEXT,
    representative_name TEXT, -- Đại diện/Chức vụ
    phone_number TEXT,
    fax_number TEXT,
    email TEXT,
    industry_code TEXT,
    industry_name TEXT,
    capital TEXT, -- Vốn điều lệ
    employee_count_total TEXT, -- Tổng số nhân viên
    employee_count_workplace TEXT, -- Nhân viên tại nơi làm việc
    employee_count_female TEXT, -- Nhân viên nữ
    employee_count_part_time TEXT, -- Nhân viên bán thời gian
    established_year TEXT,
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng lưu trữ Đơn tuyển dụng (Dữ liệu thay đổi)
CREATE TABLE IF NOT EXISTS jobs (
    job_id TEXT PRIMARY KEY, -- kJNo
    corporate_number TEXT, -- Foreign Key
    reception_date TEXT, -- Ngày tiếp nhận
    job_title TEXT NOT NULL,
    job_content TEXT,
    employment_type TEXT, -- Hình thức tuyển dụng
    contract_period TEXT,
    work_location TEXT, -- Địa điểm làm việc cụ thể
    salary_type TEXT, -- Lương tháng/giờ
    salary_min INTEGER,
    salary_max INTEGER,
    salary_remarks TEXT,
    working_hours TEXT,
    holiday_remarks TEXT,
    insurance_remarks TEXT,
    requirements TEXT,
    selection_method TEXT,
    contact_person TEXT, -- Người liên hệ
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (corporate_number) REFERENCES companies(corporate_number)
);

-- 3. Bảng quản lý tiến độ cào ID (Giai đoạn 1)
CREATE TABLE IF NOT EXISTS search_tasks (
    prefecture_code TEXT PRIMARY KEY,
    prefecture_name TEXT,
    last_page_processed INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Hàng đợi chi tiết công việc (Giai đoạn 2)
CREATE TABLE IF NOT EXISTS jobs_queue (
    job_id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    prefecture_code TEXT,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tối ưu hóa: Chỉ mục để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_jobs_corporate_number ON jobs(corporate_number);
CREATE INDEX IF NOT EXISTS idx_jobs_queue_status ON jobs_queue(status);
CREATE INDEX IF NOT EXISTS idx_jobs_discovered_at ON jobs(discovered_at);
