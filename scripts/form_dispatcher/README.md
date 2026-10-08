# 問い合わせフォーム営業代行（Form DM Outreach Engine）
=============================================================

> **Kigyou-List B2B Outreach & Lead Acceleration Platform**  
> Hệ thống gửi thông điệp chào hàng B2B tự động qua Form liên hệ của doanh nghiệp Nhật Bản, kết nối trực tiếp với Database 5.000.000+ pháp nhân.

---

## 1. Tổng quan chiến lược kép (Dual-Strategy)

Nền tảng Kigyou-List cung cấp song song **2 lựa chọn cho khách hàng**:
1. **DIY (Bán dữ liệu CSV)**: Khách hàng tự lọc công ty có `[✓] お問い合わせフォームあり` $\rightarrow$ Tải file CSV gồm đầy đủ: Tên công ty, Đại diện, Điện thoại, Email, Website và **Link Contact Form** để đội ngũ nội bộ/telesales tự gửi thủ công.
2. **DFY (Dịch vụ Trọn Gói - 問い合わせフォーム営業代行)**: Khách hàng chỉ cần đưa nội dung thư ngỏ + chân dung mục tiêu $\rightarrow$ Hệ thống bot và chuyên viên của Kigyou-List sẽ thay khách gửi trực tiếp vào form của hàng nghìn doanh nghiệp mục tiêu, tự động lọc form cấm quảng cáo và trả báo cáo chi tiết.

---

## 2. Cấu trúc thư mục

```
scripts/form_dispatcher/
├── detector.py          # Module AI phân tích DOM & phát hiện từ khóa cấm chào hàng (営業お断り)
├── dispatcher.py        # Engine Playwright tự động điền form, xử lý form 2 bước & chụp ảnh xác nhận
├── README.md            # Tài liệu vận hành và hướng dẫn chạy chiến dịch
└── reports/             # Báo cáo CSV và ảnh chụp màn hình bằng chứng đã gửi
    └── screenshots/     # Ảnh chụp màn hình từng lượt gửi thành công / dry-run
```

---

## 3. Các tính năng cốt lõi của Engine

1. **AI Anti-Spam Disclaimer Filter (営業お断り自動除外)**:
   - Trước khi điền form, module `detector.py` quét toàn bộ DOM để tìm các cụm từ cấm quảng cáo:
     `営業目的`, `セールス`, `売り込み`, `お断り`, `ご遠慮`, `お控え`, `禁止`, `固くお断り`.
   - Nếu phát hiện, bot tự động ghi nhận `SKIPPED_DISCLAIMER` và bỏ qua công ty này, bảo vệ an toàn thương hiệu cho khách hàng.
2. **Smart Field Mapping (Nhận diện thông minh các trường)**:
   - Tự động map chính xác các trường tiếng Nhật:
     - Tên công ty (`会社名`, `企業名`, `御社名`)
     - Họ tên người gửi (`お名前`, `氏名`, `担当者名`)
     - Phiên âm Furigana (`フリガナ`, `ふりがな`)
     - Email (`メールアドレス`, `確認用メール`)
     - Số điện thoại (`電話番号`, `TEL`)
     - Tiêu đề (`件名`, `題名`)
     - Nội dung thông điệp (`お問い合わせ内容`, `本文`, `textarea`)
     - Checkbox đồng ý điều khoản (`プライバシーポリシーに同意する`)
3. **Multi-Step Form Handling (Quy trình nhiều bước)**:
   - Tự động xử lý luồng xác nhận phổ biến tại Nhật:
     `[ 入力 ] -> [ 確認画面へ (Confirm) ] -> [ 送信する (Final Submit) ]`
4. **Audit Proof & Lightweight CSV Reporting (Báo cáo nhẹ, không tốn ổ cứng)**:
   - Thay vì chụp hàng ngàn ảnh màn hình gây đầy ổ cứng, hệ thống ghi nhận mã trạng thái chuẩn xác (Status Code).
   - Xuất file CSV gồm: `corporate_number`, `company_name`, `form_url`, `status`, `billable`, `message`, `timestamp`.
   - **Cơ chế minh bạch tài chính (Cách 1: Bỏ qua & Hoàn Credit)**:
     - `SUCCESS_SENT` $\rightarrow$ Trừ 1 Credit.
     - `BLOCKED_CAPTCHA` $\rightarrow$ Tự động bỏ qua và **hoàn lại 100% credit** cho khách.
     - `SKIPPED_DISCLAIMER` $\rightarrow$ Tự động bỏ qua (cấm chào hàng) và **hoàn lại 100% credit**.
     - `BLOCKED_BOT_WAF` / `TIMEOUT` / `FORM_ERROR` $\rightarrow$ **Hoàn lại 100% credit**.

---

## 4. Hướng dẫn vận hành chiến dịch (SOP)

### Bước 1: Chuẩn bị thông tin khách hàng (Sender Profile)
Mở file `dispatcher.py` và cập nhật thông tin người gửi chuẩn Tokushoho:
```python
sender_profile = {
    "company_name": "Tên công ty khách hàng",
    "contact_name": "Họ tên người phụ trách",
    "furigana": "Tên phiên âm Katakana",
    "email": "Email nhận phản hồi của khách",
    "phone": "Số điện thoại liên hệ",
    "subject": "Tiêu đề thư ngỏ",
    "message_body": "Nội dung chào hàng (kèm câu xin phép liên hệ & opt-out)"
}
```

### Bước 2: Chạy thử nghiệm mô phỏng (Dry-Run Mode)
Chế độ này sẽ mở trình duyệt, tự động điền các trường nhưng **KHÔNG bấm nút gửi cuối cùng** để kỹ sư kiểm tra:
```bash
python scripts/form_dispatcher/dispatcher.py --limit 5 --dry-run
```

### Bước 3: Chạy chiến dịch thật (Live Mode - Cách 1: Bỏ qua & Hoàn credit)
Khi nội dung và luồng đã được kiểm tra chuẩn xác, chạy lệnh gửi chính thức:
```bash
# Gửi 100 công ty đầu tiên (mặc định không chụp ảnh, siêu nhẹ và nhanh)
python scripts/form_dispatcher/dispatcher.py --limit 100 --live

# Nếu cần chụp ảnh để debug kiểm tra
python scripts/form_dispatcher/dispatcher.py --limit 5 --live --screenshot
```

### Bước 4: Xuất báo cáo giao cho khách hàng
File CSV kết quả được tự động lưu tại:
`scripts/form_dispatcher/reports/delivery_report_<timestamp>.csv`
Gửi file này cho khách hàng (hoặc khách tải trực tiếp từ Dashboard). File phân loại rõ số lượng thành công và số credit được hoàn trả về ví.

---

## 5. Bảng giá dịch vụ đề xuất (Public Pricing)

| Gói dịch vụ | Số lượng Form tiếp cận | Đơn giá / Form | Tổng chi phí | Điểm nổi bật |
| :--- | :--- | :--- | :--- | :--- |
| **Starter** | 1,000 Form | 28 JPY | **28,000 JPY** (~4.7 triệu VNĐ) | Thử nghiệm độ phản hồi thị trường |
| **Standard (Khuyên dùng)** | 3,000 Form | 23 JPY | **69,000 JPY** (~11.6 triệu VNĐ) | Tư vấn kịch bản A/B Test, tối ưu cuộc hẹn |
| **Enterprise** | 5,000+ Form | 19.8 JPY | **99,000 JPY** (~16.7 triệu VNĐ) | Mức giá rẻ nhất, tiếp cận quy mô lớn |
