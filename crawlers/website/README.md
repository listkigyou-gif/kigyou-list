# Official Website Crawler (公式Webサイトクローラー)
===================================================

Trình cào thông tin bất đồng bộ sử dụng Playwright và BeautifulSoup để cào trang chủ & trang liên hệ/giới thiệu của doanh nghiệp từ URL website có sẵn trong cơ sở dữ liệu `kigyou-list.db`.

## Chức năng
1. **Lọc tự động**: Truy vấn cơ sở dữ liệu lấy các doanh nghiệp có `website_url` hợp lệ mà chưa được cào (hoặc cào đã quá hạn).
2. **Cào đa luồng**: Hỗ trợ giới hạn luồng song song (concurrency) bất đồng bộ.
3. **Tiết kiệm băng thông**: Chặn toàn bộ ảnh, video, và font chữ để tải trang cực nhanh.
4. **Heuristics thông minh**: Bóc tách Số điện thoại, Số Fax, Email, Vốn điều lệ, Quy mô nhân sự, Tên người đại diện, và Mô tả hoạt động doanh nghiệp bằng biểu thức chính quy tiếng Nhật.
5. **Ghi thô**: Lưu trữ kết quả thô vào bảng `raw_website` dưới dạng `INSERT OR REPLACE` và cập nhật cột trạng thái `website_last_crawled_at` trong bảng chính `companies`.

## Hướng dẫn sử dụng

### 1. Cài đặt thư viện
```powershell
pip install -r requirements.txt
playwright install chromium
```

### 2. Chạy Crawler
* **Chạy mặc định (Cào tối đa 50 công ty mới, 5 luồng song song)**:
  ```powershell
  python main.py
  ```
* **Chạy giới hạn 10 công ty**:
  ```powershell
  python main.py --limit 10
  ```
* **Điều chỉnh số luồng song song**:
  ```powershell
  python main.py --concurrency 2
  ```
* **Hiển thị trình duyệt (Non-headless)**:
  ```powershell
  python main.py --headless false
  ```
