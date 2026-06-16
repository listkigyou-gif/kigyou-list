#!/bin/bash

# Hướng dẫn: Chạy script này trên VPS bằng lệnh: sudo bash scripts/vps_deploy.sh

echo "============================================="
echo "  Bắt đầu triển khai và cấu hình kigyou-list  "
echo "============================================="

# 1. Cập nhật mã nguồn mới nhất
echo "1. Đang pull code mới nhất từ GitHub..."
cd /var/www/kigyou-list || { echo "Lỗi: Không tìm thấy thư mục /var/www/kigyou-list"; exit 1; }
git pull origin main

# 2. Cài đặt dependency và build Next.js
echo "2. Đang cài đặt thư viện và build Next.js..."
cd frontend
npm install
npm run build

# 3. Tạo cấu hình Nginx
echo "3. Đang cấu hình Nginx..."
NGINX_CONF="/etc/nginx/sites-available/kigyou-list"

cat << 'EOF' | sudo tee $NGINX_CONF > /dev/null
server {
    listen 80;
    server_name kigyoulist.com www.kigyoulist.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Kích hoạt cấu hình Nginx
sudo ln -sf /etc/nginx/sites-available/kigyou-list /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# 4. Cài đặt SSL Let's Encrypt (Certbot)
echo "4. Đang kiểm tra và cài đặt SSL..."
if ! command -v certbot &> /dev/null; then
    sudo apt update
    sudo apt install certbot python3-certbot-nginx -y
fi

# Chạy Certbot để đăng ký và cấu hình HTTPS tự động
echo "Nhấn Enter để tiếp tục đăng ký SSL. Certbot sẽ hỏi email và lựa chọn redirect..."
sudo certbot --nginx -d kigyoulist.com -d www.kigyoulist.com

# 5. Khởi chạy PM2
echo "5. Đang cấu hình và chạy PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install pm2 -g
fi

# Chạy Next.js qua PM2 (nếu đã chạy thì restart, ngược lại start mới)
pm2 describe kigyou-list &> /dev/null
if [ $? -eq 0 ]; then
    pm2 restart kigyou-list
else
    pm2 start npm --name "kigyou-list" -- start
fi

pm2 save
pm2 startup

# 6. Cấu hình Cron Job cho file backup
echo "6. Đang cấu hình backup tự động lên Cloudflare R2..."
if ! command -v aws &> /dev/null; then
    sudo apt update
    sudo apt install awscli -y
fi

# Cấp quyền thực thi cho script backup
chmod +x /var/www/kigyou-list/scripts/db_backup.sh

# Cấu hình Cron Job (Chạy mỗi 6 tiếng một lần)
CRON_JOB="0 */6 * * * /var/www/kigyou-list/scripts/db_backup.sh >> /var/www/kigyou-list/scripts/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -F "db_backup.sh") &> /dev/null
if [ $? -ne 0 ]; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "Đã thêm Cron Job sao lưu định kỳ mỗi 6 tiếng một lần."
else
    echo "Cron Job sao lưu đã tồn tại."
fi

echo "============================================="
echo "     Đã hoàn tất quá trình thiết lập VPS!    "
echo "============================================="
