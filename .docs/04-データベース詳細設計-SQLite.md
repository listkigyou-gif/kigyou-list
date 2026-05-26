# Tài liệu Chi tiết: Cấu trúc Cơ sở Dữ liệu SQLite (`kigyou-list.db`)

Tài liệu này lưu trữ toàn bộ thông tin chi tiết về cơ sở dữ liệu SQLite local (**`kigyou-list.db`**). Đây là **Source of Truth** (Nguồn tham chiếu gốc) giúp nhà phát triển nắm rõ chức năng của từng bảng, ý nghĩa của các cột dữ liệu, kiểu dữ liệu, khóa chính/ngoại và các chỉ mục (Indexes) phục vụ tối ưu hóa truy vấn.

---

## 📌 Tổng quan Kiến trúc Database
Database được thiết kế theo mô hình **Bronze ➔ Gold** (Thô ➔ Sạch) để lưu trữ đa nguồn và đảm bảo tính nhất quán:
1. **Lớp Sạch (Gold Layer):** Chứa các bảng dữ liệu đã được làm sạch, chuẩn hóa và hợp nhất từ nhiều nguồn. Đây là lớp dữ liệu duy nhất được đồng bộ lên máy chủ **Turso/Cloud** để phục vụ giao diện website UI và cho người dùng tìm kiếm/download.
2. **Lớp Thô (Bronze Layer):** Chứa các bảng đệm tạm thời để hứng dữ liệu do các Crawler cào về, phục vụ cho thuật toán đối soát hợp nhất (Consolidation) trước khi đẩy vào lớp Gold.

---

## 🗂️ Danh sách các Bảng Dữ liệu

| STT | Tên Bảng (Vật lý) | Tên tiếng Nhật | Tên tiếng Việt | Lớp Dữ liệu | Chức năng chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **`companies`** | 法人情報 | Thông tin Doanh nghiệp | **Gold (Sạch)** | Lưu trữ thông tin chi tiết chính thức của doanh nghiệp (đã làm sạch). |
| 2 | **`m_industries`** | 産業分類マスター | Danh mục Ngành nghề JSIC | **Gold (Sạch)** | Bảng danh mục ngành nghề chuẩn Nhật Bản (Đại/Trung phân loại). |
| 3 | **`company_industries`** | 企業_産業分類マッピング | Liên kết Ngành nghề | **Gold (Sạch)** | Bảng trung gian ánh xạ quan hệ Nhiều-Nhiều (1 công ty - nhiều ngành). |
| 4 | **`business_signals`** | 購買・採用シグナル | Tín hiệu Intent Data | **Gold (Sạch)** | Lưu trữ các tín hiệu tăng trưởng (Tuyển dụng, Trợ cấp, Đấu thầu...). |
| 5 | **`company_financials`** | 法人財務情報履歴 | Lịch sử Tài chính 5 Năm | **Gold (Sạch)** | Lưu trữ lịch sử tài chính 5 năm của doanh nghiệp phục vụ vẽ biểu đồ. |
| 6 | **`raw_hellowork`** | ハローワーク収集データ | HelloWork thô | **Bronze (Thô)** | Hứng dữ liệu cào thô từ các tin tuyển dụng của HelloWork. |
| 7 | **`raw_yahoo`** | Yahoo検索収集データ | Yahoo Maps thô | **Bronze (Thô)** | Hứng dữ liệu cào thô (SĐT, Website) từ Yahoo Maps. |
| 8 | **`raw_website`** | 公式ウェブサイト収集データ | Website thô | **Bronze (Thô)** | Hứng dữ liệu liên hệ trích xuất trực tiếp từ Official Website. |

---

## 📐 Chi tiết Cấu trúc Từng Bảng (Schema Details)

### 1. Bảng `companies` (法人情報 - Thông tin Doanh nghiệp chính thức)
* **Chức năng:** Bảng cốt lõi chứa thông tin định danh và liên hệ chuẩn nhất của doanh nghiệp. Dữ liệu liên hệ (SĐT, Fax, Email, Web) là kết quả hợp nhất tốt nhất từ nhiều nguồn thô.
* **Khóa chính (PK):** `corporate_number` (13 chữ số pháp nhân của Nhật Bản).

| Tên Cột (Column) | Kiểu dữ liệu | Ràng buộc | Tên tiếng Nhật | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **`corporate_number`** | TEXT | PRIMARY KEY | 法人番号 | Mã số pháp nhân (13 chữ số duy nhất). |
| **`company_name`** | TEXT | NOT NULL | 商号又は名称 | Tên chính thức của doanh nghiệp (VD: 五洋建設株式会社). |
| **`company_name_kana`** | TEXT | NULL | 商号又は名称（カナ） | Tên doanh nghiệp viết bằng chữ Phóng âm (Frigana/Katakana). |
| **`company_name_en`** | TEXT | NULL | 商号又は名称（英語） | Tên tiếng Anh chính thức của doanh nghiệp. |
| **`postal_code`** | TEXT | NULL | 郵便番号 | Mã bưu điện (7 chữ số, đã loại bỏ dấu gạch ngang). |
| **`prefecture_code`** | TEXT | NULL | 都道府県コード | Mã tỉnh thành chuẩn (JIS X 0401, VD: Tokyo là 13). |
| **`prefecture_name`** | TEXT | NULL | 都道府県名 | Tên Tỉnh/Thành phố (VD: 東京都, 大阪府). |
| **`city_name`** | TEXT | NULL | 市区町村名 | Tên Quận/Huyện/Thành phố trực thuộc tỉnh (VD: 文京区). |
| **`street_address`** | TEXT | NULL | 丁目・番地以下 | Địa chỉ chi tiết từ cấp Phường/Số nhà trở đi. |
| **`full_address`** | TEXT | NULL | 登記住所 | Địa chỉ đăng ký kinh doanh đầy đủ. |
| **`representative_name`** | TEXT | NULL | 代表者の氏名 | Tên người đại diện pháp luật (Giám đốc/Chủ tịch). |
| **`representative_position`** | TEXT | NULL | 代表者の役職名 | Chức vụ người đại diện (VD: 代表取締役, 取締役). |
| **`establishment_date`** | TEXT | NULL | 設立年月日 | Ngày thành lập doanh nghiệp (Định dạng: `YYYY-MM-DD`). |
| **`capital_amount`** | INTEGER | NULL | 資本金 | Vốn điều lệ (Đơn vị tính: Yên Nhật). |
| **`employee_count`** | INTEGER | NULL | 従業員数 | Tổng số lượng nhân viên của doanh nghiệp. |
| **`sales_amount`** | INTEGER | NULL | 売上高 | Doanh thu năm gần nhất (Bổ sung từ Crawler - Yên Nhật). |
| **`phone_number`** | TEXT | NULL | 電話番号 | Số điện thoại đại diện đã làm sạch và hợp nhất chuẩn nhất. |
| **`fax_number`** | TEXT | NULL | FAX番号 | Số Fax chính thức (Bóc tách từ website). |
| **`website_url`** | TEXT | NULL | 公式ウェブサイトURL | Địa chỉ trang chủ chính thức (Đã chuẩn hóa giao thức http/https). |
| **`email_address`** | TEXT | NULL | メールアドレス | Địa chỉ Email liên hệ đại diện (Bóc tách từ website/HelloWork). |
| **`business_summary`** | TEXT | NULL | 事業概要 | Mô tả mô hình kinh doanh. Cột này sử dụng dữ liệu từ bảng master nếu có, nếu master NULL thì lấy mô tả business_summary từ bảng raw_website thô của dữ liệu cào về từ website. |
| **`jigyo_shumoku`** | TEXT | NULL | 事業種目 | Chứa thông tin AI-Tagging Output, gắn thẻ tag các ngành nghề (cách nhau bởi dấu phẩy hoặc lưu dạng mảng các tag) để làm bộ lọc phân loại ngành nghề cho doanh nghiệp. |
| **`branch_phone_numbers`**| TEXT | NULL | 支店電話番号 | Danh sách các số điện thoại chi nhánh khác được tìm thấy (dạng chuỗi JSON) để tránh làm nhiễu số điện thoại đại diện chính của trụ sở chính. |
| **`yahoo_last_crawled_at`**| TEXT / TIMESTAMP | NULL | Yahoo最終検索日 | Thời điểm gần nhất chạy cào Yahoo Search/Maps (dùng để kiểm soát chu kỳ 2 năm). |
| **`website_last_crawled_at`**| TEXT / TIMESTAMP | NULL | ウェブサイト最終収集日 | Thời điểm gần nhất chạy cào website chính thức (dùng để kiểm soát chu kỳ 2 năm). |
| **`status`** | TEXT | '活動中' | 状態 | Trạng thái hoạt động (VD: '活動中' - Đang chạy, '閉鎖' - Đã đóng). |
| **`created_at`** | TIMESTAMP | DEFAULT NOW | 新規登録日 | Ngày giờ doanh nghiệp được nạp vào hệ thống. |
| **`updated_at`** | TIMESTAMP | DEFAULT NOW | 最終更新日 | Ngày giờ cập nhật thông tin gần nhất. |

---

### 2. Bảng `m_industries` (産業分類マスター - Danh mục Ngành nghề JSIC)
* **Chức năng:** Lưu trữ danh sách phân loại ngành nghề theo Tiêu chuẩn Công nghiệp Nhật Bản (JSIC). Được dùng làm bộ lọc tìm kiếm trên giao diện.
* **Khóa chính (PK):** `industry_code` (Mã chữ cái đối với Đại phân loại, mã 2 chữ số đối với Trung phân loại).

| Tên Cột (Column) | Kiểu dữ liệu | Ràng buộc | Tên tiếng Nhật | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **`industry_code`** | TEXT | PRIMARY KEY | 産業分類コード | Mã phân loại ngành (Đại phân loại: A-T, Trung phân loại: 01-99). |
| **`industry_name`** | TEXT | NOT NULL | 分類項目名 | Tên tiếng Nhật của ngành nghề (VD: 情報サービス業). |
| **`classification_level`** | TEXT | NOT NULL | 分類階層 | Phân cấp ngành nghề: `'大分類'` hoặc `'中分類'`. |
| **`parent_code`** | TEXT | FK | 親分類コード | Mã cha liên kết Trung phân loại về Đại phân loại (Khóa ngoại). |
| **`created_at`** | TIMESTAMP | DEFAULT NOW | 作成日時 | Ngày tạo danh mục. |

---

### 3. Bảng `company_industries` (企業_産業分類マッピング - Bảng liên kết)
* **Chức năng:** Giải quyết quan hệ Nhiều-Nhiều. Một doanh nghiệp có thể đăng ký nhiều ngành nghề kinh doanh, và một ngành nghề chứa nhiều doanh nghiệp.
* **Khóa chính liên hợp:** `(corporate_number, industry_code)`.

| Tên Cột (Column) | Kiểu dữ liệu | Ràng buộc | Tên tiếng Nhật | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **`corporate_number`** | TEXT | FK | 法人番号 | Mã số pháp nhân liên kết đến bảng `companies` (Khóa ngoại). |
| **`industry_code`** | TEXT | FK | 産業分類コード | Mã ngành liên kết đến bảng `m_industries` (Khóa ngoại). |
| **`created_at`** | TIMESTAMP | DEFAULT NOW | 割当日時 | Ngày liên kết ngành nghề này cho doanh nghiệp. |

---

### 4. Bảng `business_signals` (購買・採用シグナル - Tín hiệu Intent Data)
* **Chức năng:** Lưu trữ các tín hiệu biến động doanh nghiệp (Intent Data) như đang tuyển dụng, mới trúng gói thầu, được nhận trợ cấp của Chính phủ... Phục vụ tính năng tìm kiếm Premium.
* **Khóa chính (PK):** `id` (Tự động tăng).

| Tên Cột (Column) | Kiểu dữ liệu | Ràng buộc | Tên tiếng Nhật | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | INTEGER | PRIMARY KEY | シグナルID | Mã số tự tăng của tín hiệu. |
| **`corporate_number`** | TEXT | FK | 法人番号 | Mã số pháp nhân phát sinh tín hiệu (Khóa ngoại). |
| **`signal_type`** | TEXT | NOT NULL | シグナルタイプ | Phân loại tín hiệu (VD: `'求人中'` - Tuyển dụng, `'補助金受給'` - Trợ cấp). |
| **`signal_title`** | TEXT | NOT NULL | シグナルタイトル | Tiêu đề của tín hiệu (VD: Tên công việc đang tuyển, Tên trợ cấp). |
| **`signal_date`** | TEXT | NULL | シグナル発生日 | Ngày phát sinh tín hiệu (Định dạng: `YYYY-MM-DD`). |
| **`source_url`** | TEXT | NULL | 情報源URL | Link nguồn thông tin chứng minh tín hiệu. |
| **`details`** | TEXT | NULL | 詳細データ | Chuỗi dữ liệu chi tiết cấu trúc JSON (mức lương, chi tiết gói thầu...). |
| **`created_at`** | TIMESTAMP | DEFAULT NOW | システム登録日時 | Ngày giờ phát hiện và ghi nhận tín hiệu. |

---

### 5. Bảng `raw_hellowork` (ハローワーク収集データ - Dữ liệu HelloWork Thô)
* **Chức năng:** Chứa dữ liệu thô cào từ cổng thông tin HelloWork (gồm đầy đủ 27 cột theo mẫu file cào quét thực tế) để lấy thông tin liên hệ, quy mô nhân sự và làm sạch thông tin phân loại ngành nghề.

| Tên Cột (Column) | Kiểu dữ liệu | Tên tiếng Nhật | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| **`id`** | INTEGER PRIMARY KEY | 収集ID | ID tự tăng của bản ghi cào thô. |
| **`job_number`** | TEXT | 求人番号 | Mã số tin tuyển dụng (ví dụ: '0107001676861'). |
| **`receipt_date`** | TEXT | 受付年月日 | Ngày tiếp nhận tin tuyển dụng (ví dụ: '2026年4月21日'). |
| **`job_title`** | TEXT | 職種 | Vị trí công việc đang tuyển dụng. |
| **`office_name`** | TEXT | 事業所名 | Tên văn phòng/chi nhánh/doanh nghiệp tuyển dụng. |
| **`corporate_number`** | TEXT | 法人番号 | **Khóa liên kết chính (Khóa ngoại)** với bảng master `companies` và bảng `business_signals` để xác định doanh nghiệp tuyển dụng. Quan hệ: 1-N (một doanh nghiệp có thể có nhiều đơn tuyển dụng active). |
| **`representative_name`**| TEXT | 役職／代表者名 | Tên Giám đốc/Người đại diện doanh nghiệp. |
| **`employment_status`** | TEXT | 正社員／正社員以外| Trạng thái: Chính thức hoặc làm bán thời gian (パート). |
| **`wages`** | TEXT | 賃金 | Chi tiết về mức lương, phụ cấp. |
| **`work_location`** | TEXT | 就業場所 | Địa chỉ nơi làm việc thực tế của nhân viên. |
| **`work_hours`** | TEXT | 就業時間 | Chi tiết giờ giấc làm việc hàng ngày. |
| **`holidays`** | TEXT | 休日 | Quy định về ngày nghỉ phép, ngày nghỉ lễ. |
| **`job_description`** | TEXT | 仕事内容 | Chi tiết công việc thực tế. Trường này được sử dụng kết hợp với `industry` và `job_title` gửi qua AI-Tagging Pipeline để làm giàu ngữ cảnh, giúp AI phân loại ngành nghề chính xác 100% sang mã JSIC chuẩn. |
| **`required_experience`**| TEXT | 必要な経験等 | Yêu cầu về bằng cấp, chứng chỉ và kinh nghiệm tối thiểu. |
| **`contact_person`** | TEXT | 担当者 | Chi tiết thông tin liên hệ của người phụ trách tuyển dụng. |
| **`phone_number`** | TEXT | 電話番号 | Số điện thoại ghi nhận trên tin tuyển dụng. |
| **`fax_number`** | TEXT | ＦＡＸ | Số FAX ghi nhận trên tin tuyển dụng. |
| **`email_address`** | TEXT | Ｅメール | Địa chỉ email liên hệ ghi nhận trên tin. |
| **`office_address`** | TEXT | 所在地 | Địa chỉ trụ sở đăng ký của doanh nghiệp tuyển dụng. |
| **`website_url`** | TEXT | ホームページ | Link trang chủ của doanh nghiệp tuyển dụng. |
| **`industry`** | TEXT | 産業 | **Ngành nghề phân loại thô của HelloWork.** Do từ ngữ ghi nhận thường không khớp hoàn toàn với danh mục ngành chuẩn JSIC, hệ thống sẽ sử dụng AI-Tagging đọc kết hợp trường này với `job_title` và `job_description` để phân loại và ánh xạ 100% chính xác sang mã JSIC chuẩn. |
| **`capital_amount`** | TEXT | 資本金 | Số tiền vốn điều lệ thô cào được (Yên). |
| **`total_employees`** | TEXT | 従業員数（全体）| Tổng số lượng nhân viên của toàn doanh nghiệp. |
| **`location_employees`**| TEXT | 就業場所（従業員数）| Số lượng nhân viên tại địa điểm làm việc thực tế này. |
| **`female_employees`** | TEXT | うち女性 | Số lượng nhân viên nữ trong cơ sở này. |
| **`parttime_employees`**| TEXT | うちパート | Số lượng nhân viên làm bán thời gian trong cơ sở này. |
| **`establishment_year`**| TEXT | 設立年 | Năm thành lập doanh nghiệp thô. |
| **`scraped_at`** | TEXT | 収集日 | Ngày giờ hệ thống cào quét dữ liệu này về. |

---

### 6. Bảng `raw_yahoo` (Yahoo検索収集データ - Dữ liệu Yahoo Maps Thô)
* **Chức năng:** Lưu trữ thông tin thô cào từ Yahoo Maps để lấy Website chính thức và Số điện thoại map card.

| Tên Cột (Column) | Kiểu dữ liệu | Tên tiếng Nhật | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| **`id`** | INTEGER PRIMARY KEY | 収集ID | ID tự tăng. |
| **`corporate_number`** | TEXT | 法人番号 | Mã số pháp nhân đối chiếu. |
| **`company_name`** | TEXT | 企業名 | Tên doanh nghiệp gốc. |
| **`yahoo_name`** | TEXT | Yahoo登録名 | Tên doanh nghiệp tìm thấy trên Yahoo Maps. |
| **`yahoo_address`** | TEXT | Yahoo登録住所 | Địa chỉ doanh nghiệp đăng ký trên Yahoo Maps. |
| **`phone_number`** | TEXT | 電話番号 | Số điện thoại tìm thấy trên Yahoo. |
| **`website_url`** | TEXT | WebサイトURL | Link website chính thức tìm thấy trên Yahoo. |
| **`scraped_at`** | TIMESTAMP | 収集日時 | Ngày giờ cào dữ liệu này về. |

---

### 7. Bảng `raw_website` (公式ウェブサイト収集データ - Dữ liệu Website Thô)
* **Chức năng:** Chứa thông tin thô thu thập bằng bot cào quét trực tiếp trang chủ của doanh nghiệp (nhắm vào trang thông tin công ty / liên hệ).

| Tên Cột (Column) | Kiểu dữ liệu | Tên tiếng Nhật | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| **`id`** | INTEGER PRIMARY KEY | 収集ID | ID tự tăng. |
| **`corporate_number`** | TEXT | 法人番号 | Mã số pháp nhân đối chiếu. |
| **`website_url`** | TEXT | 対象URL | Đường dẫn trang web đã thực hiện quét. |
| **`phone_number`** | TEXT | 抽出電話番号 | Số điện thoại trích xuất được từ HTML. |
| **`fax_number`** | TEXT | 抽出FAX番号 | Số Fax trích xuất được từ HTML (Rất có giá trị). |
| **`email_address`** | TEXT | 抽出メールアドレス| Địa chỉ Email trích xuất được từ HTML. |
| **`capital_amount`** | TEXT | 抽出資本金 | Vốn điều lệ cào thô từ trang giới thiệu. |
| **`employee_count`** | TEXT | 抽出従業員数 | Số lượng nhân viên cào thô từ trang giới thiệu. |
| **`representative_name`**| TEXT | 抽出代表者名 | Tên giám đốc/người đại diện cào thô từ trang giới thiệu. |
| **`business_summary`** | TEXT | 抽出事業概要 | Mô tả tóm tắt kinh doanh hoặc các đoạn văn bản thô phục vụ AI gắn tag phân loại ngành nghề. |
| **`scraped_at`** | TIMESTAMP | 収集日時 | Ngày giờ cào dữ liệu này về. |

---

### 8. Bảng `company_financials` (法人財務情報履歴 - Lịch sử Tài chính Doanh nghiệp)
* **Chức năng:** Lưu trữ trọn vẹn chuỗi số liệu tài chính lịch sử 5 năm phục vụ việc vẽ biểu đồ trực quan (Recharts/Chart.js) trên giao diện chi tiết công ty.
* **Khóa chính liên hợp:** `(corporate_number, sequence_number)` (đảm bảo tính duy nhất của đợt báo cáo theo thứ tự lịch sử).
* **Khóa ngoại (FK):** `corporate_number` kết nối đến bảng `companies(corporate_number) ON DELETE CASCADE`.

| Tên Cột (Column) | Kiểu dữ liệu | Ràng buộc | Tên tiếng Nhật | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **`corporate_number`** | TEXT | PRIMARY KEY / FK | 法人番号 | Mã số pháp nhân (13 chữ số liên kết đến bảng `companies`). |
| **`fiscal_year`** | TEXT | NOT NULL | 事業年度 | Tên chuỗi gốc kỳ báo cáo (Ví dụ: '第75期(自 2024年4月1日 至 2025年3月31日)'). |
| **`sequence_number`** | INTEGER | PRIMARY KEY | 回次 | Thứ tự niên độ lịch sử tài chính: `0` (Năm gần nhất), `1` (Năm trước đó), v.v. |
| **`fiscal_year_start`**| TEXT | NULL | 会計年度開始日 | Ngày bắt đầu niên độ tài chính đã chuẩn hóa Dương lịch (`YYYY-MM-DD`). |
| **`fiscal_year_end`** | TEXT | NULL | 会計年度終了日 | Ngày kết thúc niên độ tài chính đã chuẩn hóa Dương lịch (`YYYY-MM-DD`). |
| **`sales_amount`** | INTEGER | NULL | 売上高等 | Doanh thu hoặc thu nhập từ hoạt động kinh doanh (đã qua lọc và quy đổi). |
| **`ordinary_income`** | INTEGER | NULL | 経常利益 | Lợi nhuận thường niên kiếm được trong kỳ báo cáo (Yên Nhật). |
| **`net_income`** | INTEGER | NULL | 当期純利益 | Lợi nhuận sau thuế cuối cùng (có thể âm nếu lỗ - Yên Nhật). |
| **`capital_amount`** | INTEGER | NULL | 資本金 | Vốn điều lệ đăng ký tại thời điểm báo cáo (Yên Nhật). |
| **`net_assets`** | INTEGER | NULL | 純資産額 | Giá trị ròng thuộc sở hữu của chủ doanh nghiệp (Yên Nhật). |
| **`total_assets`** | INTEGER | NULL | 総資産額 | Tổng tài sản bao gồm nợ và vốn sở hữu (Yên Nhật). |
| **`employee_count`** | INTEGER | NULL | 従業員数 | Tổng số lượng nhân viên chính thức tại thời điểm quyết toán kỳ. |

---

## 🚀 Chỉ mục Tối ưu hóa Tìm kiếm (Indexes)
Để đảm bảo các bộ lọc tìm kiếm đa chiều (Faceted Search) và các lệnh kết nối JOIN chạy siêu tốc trên 5 triệu bản ghi, hệ thống đã tạo sẵn các chỉ mục sau trong SQLite:

1. **`idx_companies_prefecture`** trên `companies(prefecture_name)`: Lọc doanh nghiệp theo Tỉnh/Thành phố.
2. **`idx_companies_capital`** trên `companies(capital_amount)`: Phân loại theo quy mô Vốn điều lệ.
3. **`idx_companies_employees`** trên `companies(employee_count)`: Phân loại theo quy mô Nhân sự.
4. **`idx_companies_status`** trên `companies(status)`: Lọc nhanh các doanh nghiệp đang hoạt động.
5. **`idx_signals_corp_num`** trên `business_signals(corporate_number)`: Đẩy nhanh tốc độ kết nối (JOIN) thông tin tín hiệu tăng trưởng.
6. **`idx_signals_type`** trên `business_signals(signal_type)`: Lọc nhanh theo loại tín hiệu Intent (VD: tìm công ty đang tuyển dụng).
7. **`idx_comp_ind_ind_code`** trên `company_industries(industry_code)`: Lọc doanh nghiệp theo ngành nghề JSIC.
8. **`idx_comp_ind_corp_num`** trên `company_industries(corporate_number)`: Phục vụ truy vấn lấy danh sách ngành nghề của một doanh nghiệp cụ thể.
9. **`idx_financials_corp_num`** trên `company_financials(corporate_number)`: Truy vấn cực nhanh toàn bộ dữ liệu lịch sử của một doanh nghiệp để vẽ biểu đồ.
10. **`idx_financials_seq_num`** trên `company_financials(sequence_number)`: Hỗ trợ tìm kiếm hoặc lọc chéo theo niên độ lịch sử.
