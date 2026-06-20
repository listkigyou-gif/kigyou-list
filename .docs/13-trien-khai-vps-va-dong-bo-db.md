# Hướng Dẫn Vận Hành: Đẩy Code GitHub, Triển Khai VPS và Đồng Bộ Database Production

Tài liệu này cung cấp quy trình chuẩn để cập nhật mã nguồn và đồng bộ hóa cơ sở dữ liệu cho dự án `Kigyou-list`. Khi người dùng yêu cầu thực hiện triển khai hoặc đồng bộ, AI có thể đọc trực tiếp tài liệu này để tự động chạy các lệnh tương ứng.

---

## Tóm Tắt Thông Tin Hệ Thống

* **Môi trường Phát triển (Local)**:
  * Cơ sở dữ liệu SQLite cục bộ: `kigyou-list.db` (lưu trữ thông tin cào và các bài viết Blog sinh ra cục bộ).
* **Môi trường Production (VPS)**:
  * IP VPS: `163.44.116.98` (Đăng nhập: `root` / Mật khẩu: `Hrptlcct6789@`).
  * Đường dẫn dự án trên VPS: `/var/www/kigyou-list`.
  * Cơ sở dữ liệu Production: PostgreSQL chạy trong Docker container trên cổng `5432` của VPS.
  * Chuỗi kết nối Postgres trực tiếp (truy cập từ local hoặc nội bộ):
    `postgresql://postgres:Hrptlcct6789@163.44.116.98:5432/kigyou_list`

---

## Quy Trình 1: Đẩy Code Mới Lên GitHub

Mục tiêu là cập nhật tất cả các file code đã chỉnh sửa ở máy local lên GitHub trước khi kéo về VPS.

### Các lệnh cần chạy ở máy Local:
AI hãy mở terminal tại thư mục gốc của dự án (`c:\TUHOCLAPTRINH\kigyou-list`) và chạy chuỗi lệnh sau:

```powershell
# 1. Kiểm tra trạng thái git
git status

# 2. Add tất cả các thay đổi (Loại trừ thư mục rác qua cấu hình .gitignore đã cập nhật)
git add .

# 3. Commit thay đổi với thông điệp mô tả cụ thể
git commit -m "feat: deploy updates and db sync configurations"

# 4. Push lên nhánh chính
git push origin main
```

---

## Quy Trình 2: Triển Khai Tự Động Lên VPS (163.44.116.98)

Mục tiêu là SSH vào VPS trực tuyến để kéo code mới từ GitHub, build lại giao diện Next.js và khởi động lại dịch vụ web.

### Phương pháp tự động qua Python (Chạy từ Local):
Dự án đã trang bị script tự động kết nối SSH và chạy lệnh qua thư viện `paramiko` tại: `scratch/deploy_to_vps.py`. 
AI chỉ cần chạy lệnh sau từ máy Local:

```powershell
python scratch/deploy_to_vps.py
```

### Phương pháp thủ công hoặc Lệnh SSH chạy trực tiếp:
Nếu chạy từng bước trên VPS, hãy SSH vào VPS (`root` / `Hrptlcct6789@`) và thực thi:

```bash
# 1. Vào thư mục dự án và kéo code mới
cd /var/www/kigyou-list
git pull origin main

# 2. Cài đặt thư viện và build Next.js Production
cd frontend
npm install
npm run build

# 3. Khởi động lại dịch vụ chạy web bằng PM2
pm2 restart kigyou-list

# 4. Đảm bảo thư viện psycopg2 cho Python đã được cài trên VPS
apt-get update && apt-get install -y python3-psycopg2
```

---

## Quy Trình 3: Đồng Bộ Cơ Sở Dữ Liệu Lên Postgres Production

> [!IMPORTANT]
> **Lưu ý đặc biệt về Cấu Trúc Cơ Sở Dữ Liệu**:
> - Cơ sở dữ liệu SQLite `kigyou-list.db` trên VPS **chỉ chứa thông tin cào doanh nghiệp** phục vụ crawlers, không có bảng `blog_posts` (do Next.js trên VPS chỉ kết nối trực tiếp với PostgreSQL trực tuyến).
> - Do đó, các bài viết Blog mới được sinh ra ở máy Local (trong SQLite cục bộ) cần được đẩy trực tiếp lên cơ sở dữ liệu PostgreSQL trực tuyến trên VPS từ máy Local của bạn.

### Lệnh chạy đồng bộ bài viết Blog (Chạy tại máy Local):
AI chạy lệnh sau từ máy Local để kết nối trực tiếp đến PostgreSQL trực tuyến của VPS và nạp dữ liệu bài viết (bảng `blog_posts`):

```powershell
# Thiết lập biến môi trường trỏ đến Postgres trực tuyến và chạy script đồng bộ
$env:DATABASE_URL="postgresql://postgres:Hrptlcct6789@163.44.116.98:5432/kigyou_list"; python scripts/sync_blog_posts.py
```

### Lệnh đồng bộ toàn bộ dữ liệu (Bao gồm cả thông tin Doanh nghiệp):
Nếu cần cập nhật toàn bộ cơ sở dữ liệu doanh nghiệp từ SQLite cục bộ lên PostgreSQL trực tuyến (lưu ý: tệp SQLite rất lớn, có thể mất nhiều thời gian):

```powershell
# Chạy đồng bộ toàn phần
$env:DATABASE_URL="postgresql://postgres:Hrptlcct6789@163.44.116.98:5432/kigyou_list"; python scripts/migrate_to_postgres.py
```
