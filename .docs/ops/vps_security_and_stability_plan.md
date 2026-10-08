# 🛡️ KẾ HOẠCH BẢO VỆ SERVER & PHÒNG CHỐNG SẬP WEBSITE (KIGYOU-LIST)

Tài liệu này cung cấp kế hoạch cấu hình chi tiết theo mô hình bảo vệ nhiều lớp (Multi-layer Defense) dành cho VPS Tokyo (1 vCPU - 2GB RAM) chạy Next.js và PostgreSQL của dự án **Kigyou-list**. 

Mục tiêu là chống lại tin tặc, tự động lọc bot xấu, hạn chế DDoS, và tối ưu hóa hệ thống để chịu tải cực tốt mà không gây treo/sập cơ sở dữ liệu.

---

## 🧭 Kiến trúc Bảo vệ Đa tầng (Defense in Depth)

```
[ Khách truy cập / Tin tặc ]
            │
            ▼ (DNS & HTTPS)
   ┌─────────────────┐
   │   LỚP 1: WAF    │  ► Màng lọc Cloudflare Proxy (Ẩn IP gốc, chặn DDoS, chặn SQLi/XSS)
   └────────┬────────┘
            │
            ▼ (Chỉ cho phép IP Cloudflare đi qua)
   ┌─────────────────┐
   │  LỚP 2: NGINX   │  ► Giới hạn tần suất (Rate Limit), Cache tĩnh/động, Chặn IP bằng Fail2ban
   └────────┬────────┘
            │
            ▼ (localhost)
   ┌─────────────────┐
   │ LỚP 3: OS & DB  │  ► Bộ nhớ ảo Swap (4GB), Tối ưu PG Connection Pool, Next.js ISR Caching
   └─────────────────┘
```

---

## 🔒 LỚP 1: MÀNG LỌC ĐẦU NGUỒN (CLOUDFLARE SECURE SHIELD)

Để chặn đứng các cuộc tấn công DDoS lớn (tầng 3/4/7) và bảo vệ IP thật của VPS:

### 1. Bật Cloudflare Proxy (Đám mây màu cam)
- **Hành động**: Đảm bảo tất cả các bản ghi DNS (`A`, `AAAA`, `CNAME`) trỏ về VPS đều ở trạng thái **Proxied**.
- **Lợi ích**: Hacker chỉ thấy địa chỉ IP của Cloudflare, không thể tấn công trực tiếp vào địa chỉ IP thật của VPS của bạn.

### 2. Thiết lập quy tắc tường lửa WAF (Cloudflare WAF)
Trong trang quản lý Cloudflare của tên miền `kigyoulist.com` -> **Security** -> **WAF** -> **Create rule**:
- **Chặn các công cụ quét tự động (Bad Bots)**:
  - *Expression*: `(cf.client.bot) or (http.user_agent contains "python") or (http.user_agent contains "curl")`
  - *Action*: `Block` hoặc `Managed Challenge` (Captcha).
- **Chặn truy cập trực tiếp bằng IP**:
  - Cấu hình chỉ cho phép các IP thuộc Cloudflare kết nối tới cổng 80/443 của VPS (xem cấu hình tường lửa IP ở Lớp 2).

### 3. Kích hoạt Rate Limiting trên Cloudflare
- Giới hạn tối đa **60 requests / 10 giây** cho mỗi IP truy cập vào các đường dẫn nhạy cảm như `/api/search`, `/api/stripe`, `/api/export`.

---

## 🚪 LỚP 2: BẢO VỆ WEB SERVER (NGINX & FAIL2BAN)

Nếu hacker vượt qua được Cloudflare hoặc cố gắng spam tải, Nginx trên VPS sẽ đảm nhận vai trò chốt chặn tiếp theo.

### 1. Giới hạn tần suất yêu cầu (Nginx Rate Limiting)
Mở file `/etc/nginx/nginx.conf` và thêm cấu hình giới hạn IP:

```nginx
http {
    # Định nghĩa vùng lưu trữ IP và giới hạn tần suất (10 requests mỗi giây)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;
    
    # Giới hạn số kết nối đồng thời từ 1 IP
    limit_conn_zone $binary_remote_addr zone=addr_limit:10m;
    
    ...
}
```

Áp dụng giới hạn này vào cấu hình site `/etc/nginx/sites-available/kigyou-list`:

```nginx
server {
    ...
    
    # Áp dụng cho các API tìm kiếm/gửi dữ liệu
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn addr_limit 10;
        
        proxy_pass http://localhost:3000;
        ...
    }

    # Áp dụng chung cho toàn bộ website
    location / {
        limit_req zone=general_limit burst=50;
        
        proxy_pass http://localhost:3000;
        ...
    }
}
```

### 2. Cài đặt và cấu hình Fail2ban
Fail2ban sẽ đọc log của Nginx. Nếu phát hiện một IP bị chặn bởi Nginx Rate Limit quá nhiều lần (ví dụ 5 lần trong 1 phút), Fail2ban sẽ tự động chặn IP đó ở cấp độ tường lửa hệ thống (iptables) trong 1 tiếng.

```bash
# 1. Cài đặt Fail2ban
sudo apt install fail2ban -y

# 2. Tạo file cấu hình jail.local
sudo nano /etc/fail2ban/jail.local
```

Thêm nội dung giám sát Nginx Rate Limit:

```ini
[nginx-limit-req]
enabled = true
port    = http,https
filter  = nginx-limit-req
logpath = /var/log/nginx/error.log
findtime = 60
bantime  = 3600
maxretry = 5
```

Khởi động lại Fail2ban:
```bash
sudo systemctl restart fail2ban
```

---

## 💾 LỚP 3: QUẢN LÝ BỘ NHỚ HỆ THỐNG (OS HARDENING - SWAP FILE)

Do VPS Tokyo có dung lượng RAM vật lý nhỏ (**2GB**), khi lượng truy cập tăng đột biến, PostgreSQL và Next.js sẽ cạnh tranh tài nguyên dẫn đến cạn kiệt RAM vật lý. Nếu không có Swap, Linux kernel sẽ kích hoạt cơ chế OOM-Killer để tự động tắt (kill) PostgreSQL để cứu hệ thống, gây mất kết nối database.

### Cách thiết lập bộ nhớ ảo Swap 4GB (Khuyên dùng):
Chạy các lệnh sau trên VPS thông qua SSH:

```bash
# 1. Tạo tệp tin swap dung lượng 4GB
sudo fallocate -l 4G /swapfile

# 2. Phân quyền chỉ cho phép root đọc/ghi
sudo chmod 600 /swapfile

# 3. Định dạng tệp tin thành Swap
sudo mkswap /swapfile

# 4. Kích hoạt Swap
sudo swapon /swapfile

# 5. Thiết lập tự động kích hoạt Swap khi reboot VPS
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 6. Kiểm tra lại trạng thái Swap
sudo free -h
```

---

## 🏎️ LỚP 4: TỐI ƯU CƠ CHẾ CACHE ỨNG DỤNG & DATABASE

Để hạn chế việc truy vấn PostgreSQL liên tục khi có hàng ngàn lượt xem trang cùng lúc:

### 1. Áp dụng Incremental Static Regeneration (ISR) trong Next.js
Các trang tĩnh hoặc trang ít thay đổi (Danh bạ, Chi tiết công ty, Bài viết Blog) cần được cache HTML tại server bằng cơ chế ISR. Thay vì truy vấn DB mỗi lần người dùng F5, Next.js sẽ trả về HTML tĩnh đã được dựng sẵn và chỉ tái dựng (rebuild) ngầm sau mỗi khoảng thời gian định trước (ví dụ: 1 tiếng).

*Ví dụ cấu hình tại trang danh mục blog hoặc sitemap:*
```typescript
// Định nghĩa thời gian tái dựng trang tĩnh (bằng giây)
export const revalidate = 3600; // Cache trang 1 tiếng
```
*Điều này giúp Next.js đáp ứng hàng triệu requests mà không tốn bất kỳ tài nguyên CPU/RAM nào của database.*

### 2. Tối ưu kết nối Database (Database Connection Pooling)
Đặt giới hạn kết nối PostgreSQL tối đa để tránh quá tải RAM, đồng thời tái sử dụng các kết nối thông qua Connection Pool:
- Đảm bảo tham số `max_connections` trong PostgreSQL đặt ở mức **50** (như hướng dẫn trong deployment guide).
- Trong ứng dụng Next.js `@/lib/db.ts`, sử dụng một kết nối Pool duy nhất (`new Pool()`) thay vì tạo kết nối mới cho mỗi query.

---

## 🚨 LỚP 5: TỰ ĐỘNG KHÔI PHỤC VÀ GIÁM SÁT (PM2 AUTOMATED RECOVERY)

Nếu Next.js gặp sự cố rò rỉ bộ nhớ hoặc crash do quá tải, PM2 phải tự động khởi động lại ứng dụng ngay lập tức.

Chạy Next.js bằng PM2 với cấu hình giới hạn RAM:
```bash
# PM2 sẽ tự động restart ứng dụng nếu Next.js chiếm dụng quá 500MB RAM
pm2 start npm --name "kigyou-list" --max-memory-restart 500M -- start
pm2 save
```

---

## 📅 KẾ HOẠCH BẢO TRÌ VÀ KHẮC PHỤC SỰ CỐ NHANH

1. **Sao lưu dữ liệu tự động**: Đảm bảo tệp tin sao lưu SQL được tự động tạo và đẩy lên Cloudflare R2 định kỳ mỗi 6 tiếng một lần (theo script trong `vps_tokyo_deployment_guide.md`).
2. **Kích hoạt cảnh báo thời gian thực**: Thiết lập cảnh báo Uptime miễn phí trên Cloudflare (Cloudflare Alerts) để nhận email ngay lập tức nếu website không phản hồi quá 1 phút.
3. **Lệnh khẩn cấp khi hệ thống bị nghẽn (RAM/CPU 100%)**:
   Đăng nhập SSH và chạy lệnh giải phóng bộ nhớ đệm cache của Linux để hạ tải ngay lập tức:
   ```bash
   sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
   ```
   Khởi động lại các dịch vụ PM2 và Nginx:
   ```bash
   pm2 restart all && sudo systemctl restart nginx
   ```
