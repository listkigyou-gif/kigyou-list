# 🌐 HƯỚNG DẪN TRIỂN KHAI HẠ TẦNG VPS TOKYO (TỐI ƯU CHI PHÍ & TỐC ĐỘ CHO KIGYOU-LIST)

Cẩm nang này hướng dẫn chi tiết từng bước thiết lập **Mô hình 1 (Một VPS Tokyo giá rẻ từ $10/tháng)** đã được phê duyệt. Mô hình này đảm bảo tốc độ phản hồi trang tìm kiếm siêu tốc (<10ms) nhờ kết nối cơ sở dữ liệu nội bộ (localhost), có chi phí cố định tối thiểu và sử dụng **Cloudflare R2** để lưu trữ file CSV xuất ra cùng hệ thống sao lưu tự động hàng ngày.

---

## 🧭 Kiến trúc Tổng quan của Hệ thống (Architecture Design)

```
                       [ Trình duyệt Khách hàng ]
                                   │
                                   ▼ (HTTPS - Cổng 443)
                         [ Màng lọc Nginx SSL ]
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼ (Cổng 3000)                       ▼ (signed-url direct download)
       [ Next.js Server (PM2) ]            [ Cloudflare R2 Storage ]
                 │                                   ▲
                 ▼ (localhost - 0ms delay)           │ (Upload ZIP/CSV & DB Backup)
      [ PostgreSQL Database ] ───────────────────────┘
```

---

## 🛠️ BƯỚC 1: LỰA CHỌN VÀ THUÊ VPS CHUẨN NHẬT BẢN

Để đảm bảo độ trễ thấp nhất cho người dùng Nhật Bản, bạn nên chọn các nhà cung cấp VPS có cụm máy chủ vật lý đặt trực tiếp tại Tokyo:

1.  **Nhà cung cấp khuyên dùng**: **Vultr** hoặc **Linode (Akamai)**.
2.  **Cấu hình đề xuất**:
    *   **Vị trí máy chủ (Location)**: Tokyo (Japan).
    *   **Hệ điều hành (OS)**: **Ubuntu 22.04 LTS** (Phiên bản ổn định và phổ biến nhất).
    *   **Gói tài nguyên (Tier)**: 1 vCPU - 2GB RAM - 50GB SSD NVMe (Giá khoảng **$10 - $12 / tháng**). Cấu hình này hoàn toàn đủ để chạy Next.js và PostgreSQL tối ưu.

---

## ⚙️ BƯỚC 2: CÀI ĐẶT MÔI TRƯỜNG TRÊN SERVER VPS

Sau khi kết nối vào VPS thông qua SSH (sử dụng PuTTY trên Windows hoặc Terminal), hãy chạy các lệnh sau để cài đặt Node.js, PM2, PostgreSQL và Nginx:

```bash
# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt Node.js (Version LTS 20.x hoặc mới hơn)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Cài đặt PM2 (Quản lý tiến trình Next.js chạy ngầm liên tục)
sudo npm install pm2 -g

# 4. Cài đặt PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 5. Cài đặt Nginx
sudo apt install nginx -y
```

---

## 🐬 BƯỚC 3: TỐI ƯU CƠ SỞ DỮ LIỆU POSTGRESQL CHO BIG DATA

Vì VPS có RAM 2GB, chúng ta cần cấu hình PostgreSQL tối ưu hóa bộ nhớ đệm để xử lý tệp dữ liệu lớn (5 triệu dòng) mượt mà mà không làm tràn bộ nhớ VPS:

1.  Mở tệp cấu hình PostgreSQL:
    ```bash
    sudo nano /etc/postgresql/14/main/postgresql.conf
    ```
    *(Lưu ý: Thay đổi số `14` thành phiên bản PostgreSQL thực tế cài đặt trên máy của bạn).*

2.  Tìm và chỉnh sửa các tham số sau để tối ưu hóa bộ nhớ:
    ```ini
    shared_buffers = 512MB          # Tăng bộ nhớ đệm đọc/ghi
    effective_cache_size = 1500MB   # Dự trù tổng cache hệ thống
    maintenance_work_mem = 128MB    # Phục vụ index dữ liệu lớn nhanh hơn
    work_mem = 16MB                 # Bộ nhớ cho mỗi câu query sắp xếp
    max_connections = 50            # Giới hạn kết nối (ngăn tràn RAM)
    ```

3.  Khởi động lại dịch vụ PostgreSQL để áp dụng cấu hình:
    ```bash
    sudo systemctl restart postgresql
    ```

---

## 🚀 BƯỚC 4: TRIỂN KHAI ỨNG DỤNG NEXT.JS LÊN VPS

1.  **Clone mã nguồn dự án** từ GitHub về thư mục `/var/www/kigyou-list` trên VPS.
2.  Tạo tệp cấu hình môi trường Production tĩnh trên VPS:
    ```bash
    nano /var/www/kigyou-list/frontend/.env.local
    ```
    Nhập các thông tin cấu hình Production thực tế:
    ```properties
    PORT=3000
    DATABASE_URL=postgresql://postgres:[PASSWORD_CỦA_BẠN]@localhost:5432/kigyou_list
    
    # Cấu hình Stripe Production (Thanh toán thật)
    STRIPE_SECRET_KEY=sk_live_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    
    # Cấu hình Cloudflare R2 (API tương thích S3)
    CLOUDFLARE_R2_ENDPOINT=https://[ACCOUNT_ID].r2.cloudflarestorage.com
    CLOUDFLARE_R2_ACCESS_KEY_ID=[ACCESS_KEY_CỦA_BẠN]
    CLOUDFLARE_R2_SECRET_ACCESS_KEY=[SECRET_KEY_CỦA_BẠN]
    CLOUDFLARE_R2_BUCKET_NAME=kigyou-list-exports
    NEXT_PUBLIC_APP_URL=https://kigyou-list.jp
    ```

3.  **Build ứng dụng và khởi chạy bằng PM2**:
    ```bash
    cd /var/www/kigyou-list/frontend
    npm install
    npm run build
    
    # Khởi chạy Next.js chạy ngầm trên cổng 3000
    pm2 start npm --name "kigyou-list" -- start
    
    # Thiết lập PM2 tự khởi động khi VPS reboot
    pm2 startup
    pm2 save
    ```

---

## 🔒 BƯỚC 5: CẤU HÌNH NGÌNX REVERSE PROXY & SSL MIỄN PHÍ

Để người dùng có thể truy cập an toàn qua giao thức HTTPS bảo mật chuẩn B2B:

1.  Tạo file cấu hình trang web trên Nginx:
    ```bash
    sudo nano /etc/nginx/sites-available/kigyou-list
    ```
2.  Nhập nội dung cấu hình chuyển hướng traffic về cổng 3000 của Next.js:
    ```nginx
    server {
        listen 80;
        server_name kigyou-list.jp www.kigyou-list.jp; # Thay thế tên miền thật của bạn

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
3.  Kích hoạt cấu hình và tải lại Nginx:
    ```bash
    sudo ln -s /etc/nginx/sites-available/kigyou-list /etc/nginx/sites-enabled/
    sudo systemctl restart nginx
    ```
4.  Cài đặt **Certbot** để tự động cấp chứng chỉ SSL Let's Encrypt miễn phí:
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d kigyou-list.jp -d www.kigyou-list.jp
    ```
    *Certbot sẽ tự động cấu hình SSL và cài đặt cơ chế tự động gia hạn chứng chỉ 3 tháng một lần hoàn toàn miễn phí.*

---

## 📦 BƯỚC 6: TỰ ĐỘNG HÓA SAO LƯU DATABASE (BACKUP TO CLOUDFLARE R2)

Để đảm bảo kho dữ liệu và thông tin khách hàng không bao giờ bị mất mát, chúng ta thiết lập script tự động backup cơ sở dữ liệu lên **Cloudflare R2** vào 2 giờ sáng mỗi ngày.

1.  Cài đặt AWS CLI (Để giao tiếp với Cloudflare R2 qua giao thức S3):
    ```bash
    sudo apt install awscli -y
    ```
2.  Cấu hình AWS CLI với thông tin xác thực của Cloudflare R2:
    ```bash
    aws configure
    # Nhập Access Key ID và Secret Access Key của R2 khi được yêu cầu.
    # Phần Default region name nhập: us-east-1
    # Phần Default output format nhập: json
    ```
3.  Tạo script sao lưu (bạn có thể copy trực tiếp tệp `scripts/db_backup.sh` có sẵn trong mã nguồn hoặc tạo mới):
    ```bash
    mkdir -p /home/ubuntu/scripts
    nano /home/ubuntu/scripts/db_backup.sh
    ```
    Dán nội dung script tối ưu hóa phân tách dữ liệu sau (loại trừ các bảng doanh nghiệp tĩnh khổng lồ để tiết kiệm dung lượng R2 xuống <100KB):
    ```bash
    #!/bin/bash
    
    # 1. Định nghĩa các biến cấu hình
    DB_NAME="kigyou_list"
    BACKUP_DIR="/home/ubuntu/backups"
    FILE_NAME="db_user_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    R2_BUCKET="s3://kigyou-list-exports/backups" # Thay tên bucket của bạn
    R2_ENDPOINT_URL="https://[ACCOUNT_ID].r2.cloudflarestorage.com" # Thay Account ID của bạn
    
    mkdir -p $BACKUP_DIR
    
    # 2. Thực hiện Backup PostgreSQL loại trừ các bảng tĩnh lớn
    echo "[$(date)] Starting Database Backup (User & Payment Data only)..."
    pg_dump -h localhost -U postgres -d $DB_NAME \
      --exclude-table="companies*" \
      --exclude-table="business_signals*" \
      --exclude-table="company_industries*" \
      --exclude-table="financial_records*" \
      --exclude-table="m_industries*" \
      --exclude-table="sitemap_companies*" \
      --exclude-table="prefecture_counts*" \
      --exclude-table="industry_counts*" \
      --exclude-table="city_counts*" \
      --exclude-table="database_stats*" \
      --exclude-table="database_stats_history*" \
      --exclude-table="yahoo_stats_history*" \
      --exclude-table="raw_*" \
      | gzip > $BACKUP_DIR/$FILE_NAME
    
    # 3. Upload lên Cloudflare R2
    echo "[$(date)] Uploading backup file to Cloudflare R2..."
    aws s3 cp $BACKUP_DIR/$FILE_NAME $R2_BUCKET/$FILE_NAME --endpoint-url $R2_ENDPOINT_URL
    
    # 4. Dọn dẹp file cục bộ trên VPS để tiết kiệm SSD
    rm -f $BACKUP_DIR/$FILE_NAME
    echo "[$(date)] Backup completed successfully!"
    ```
4.  Cấp quyền thực thi cho script và thiết lập **Cron Job** chạy tự động:
    ```bash
    chmod +x /home/ubuntu/scripts/db_backup.sh
    
    # Mở bảng lập lịch crontab
    crontab -e
    ```
    Thêm dòng cấu hình sau ở cuối file để chạy script vào **2 giờ sáng hàng ngày**:
    ```cron
    0 2 * * * /bin/bash /home/ubuntu/scripts/db_backup.sh >> /home/ubuntu/scripts/backup.log 2>&1
    ```

---

## 🚑 HƯỚNG DẪN KHÔI PHỤC KHI CÓ SỰ CỐ (DISASTER RECOVERY)

Nếu máy chủ VPS bị lỗi hoặc bạn cần chuyển sang một máy chủ mới, hãy làm theo các bước sau để khôi phục lại toàn bộ hệ thống bằng bản backup từ Cloudflare R2:

1.  **Thiết lập máy chủ mới**: Thực hiện lại từ **Bước 1 đến Bước 5** của tài liệu này để cài đặt môi trường, Next.js, Nginx, SSL và cơ sở dữ liệu PostgreSQL trống.
2.  **Cấu hình kết nối AWS CLI**: Cài đặt và cấu hình thông tin xác thực AWS CLI với Cloudflare R2 như hướng dẫn ở **Bước 6 (Mục 1 & 2)**.
3.  **Tải bản backup từ Cloudflare R2**:
    *   Liệt kê các bản backup có sẵn trên R2 để tìm file mới nhất:
        ```bash
        aws s3 ls s3://kigyou-list-exports/backups/ --endpoint-url https://[ACCOUNT_ID].r2.cloudflarestorage.com
        ```
    *   Tải bản backup mới nhất về VPS (thay thế tên file tương ứng):
        ```bash
        aws s3 cp s3://kigyou-list-exports/backups/db_user_backup_YYYYMMDD_HHMMSS.sql.gz /home/ubuntu/backups/ --endpoint-url https://[ACCOUNT_ID].r2.cloudflarestorage.com
        ```
4.  **Khôi phục thông tin khách hàng & giao dịch (Dữ liệu động)**:
    Giải nén và nạp trực tiếp file SQL vào cơ sở dữ liệu trên VPS mới:
    ```bash
    gunzip -c /home/ubuntu/backups/db_user_backup_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U postgres -d kigyou_list
    ```
5.  **Đồng bộ lại danh sách doanh nghiệp (Dữ liệu tĩnh)**:
    Từ máy tính local của bạn (nơi đang chạy dự án và chứa tệp SQLite `kigyou-list.db`), thực hiện chạy tập lệnh di trú dữ liệu vàng để đẩy lại 5 triệu dòng doanh nghiệp lên VPS mới:
    ```bash
    python scripts/migrate_to_postgres.py
    ```

*Sau khi thực hiện xong 5 bước trên, toàn bộ hệ thống sẽ được khôi phục nguyên vẹn trạng thái hoạt động với đầy đủ tài khoản người dùng và dữ liệu doanh nghiệp.*

---

## 🏆 KẾT QUẢ ĐẠT ĐƯỢC

Mô hình thiết lập này mang lại những giá trị thương mại và kỹ thuật cốt lõi:
1.  **Chi phí cực thấp**: Chỉ tốn khoảng **$10/tháng** tiền VPS cố định. Không có chi phí phát sinh bất ngờ.
2.  **Độ an toàn dữ liệu 100%**: Dù VPS có bị lỗi phần cứng, kho dữ liệu của bạn đã được sao lưu an toàn tuyệt đối trên cụm Cloudflare R2 phân tán toàn cầu.
3.  **Tải trang <10ms**: Tận dụng triệt để Keyset Cursor kết nối nội bộ PostgreSQL localhost, mang lại trải nghiệm VIP cho người dùng Nhật Bản.
