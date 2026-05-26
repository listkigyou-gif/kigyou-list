# Skill: Cấu trúc File CSV Thông tin cơ bản của Pháp nhân (法人基本情報CSVファイル)

Tài liệu này định nghĩa cấu trúc của file CSV nền tảng từ G-Biz Info. Chúng ta sử dụng thông tin này để xây dựng Schema Database và Script Import.

## Danh sách các cột chính (Tổng 96 cột)

| 通番 (STT) | 項目名 (Tên cột) | データ型 | 説明 (Mô tả) |
| :--- | :--- | :--- | :--- |
| 1 | 法人番号 | String | Mã số pháp nhân (13 chữ số) - Khóa chính |
| 2 | 商号または名称 | String | Tên pháp nhân |
| 3 | 商号または名称（カナ） | String | Tên pháp nhân (Kana) |
| 4 | 商号または名称（英字） | String | Tên pháp nhân (Tiếng Anh) |
| 5 | 登記記録の閉鎖等年月日 | String | Ngày đóng hồ sơ |
| 6 | 登記記録 của 閉鎖等の事由 | String | Lý do đóng hồ sơ |
| 7 | 登記住所 | String | Địa chỉ đăng ký đầy đủ |
| 8 | 郵便番号 | String | Mã bưu điện |
| 9 | 都道府県 | String | Tỉnh/Thành phố (Tách sẵn) |
| 10 | 都道府県コード | String | Mã tỉnh (JIS X 0401) |
| 11 | 市区町村（郡） | String | Quận/Huyện/Thành phố (Tách sẵn) |
| 12 | 市区町村コード | String | Mã Quận/Huyện (JIS X 0402) |
| 13 | 番地以下 | String | Địa chỉ chi tiết sau Quận/Huyện |
| 14 | 組織種別 | String | Loại hình tổ chức (101: Nhà nước, 301: CP...) |
| 15 | 変更区分 | String | Loại thay đổi |
| 19 | 状態 | String | Trạng thái (Đang hoạt động, Đã đóng...) |
| 20 | 代表者名称 | String | Tên người đại diện |
| 21 | 代表者役職 | String | Chức vụ người đại diện |
| 22 | 設立年月日 | String | Ngày thành lập |
| 23 | 資本金 | String | Vốn điều lệ |
| 24 | 従業員数 | String | Số lượng nhân viên |
| 27 | 事業概要 | String | Tóm tắt hoạt động kinh doanh |
| 28 | WebサイトURL | String | Website chính thức |
| 30 | 事業種目 | String | Ngành nghề kinh doanh (Cách nhau bằng dấu `|`) |
| 84 | 最終更新日 | String | Ngày cập nhật tổng thể |
| 85-96 | (Cập nhật theo mục) | String | Ngày cập nhật cho từng trường thông tin cụ thể |

## Quy tắc xử lý dữ liệu (ETL Rules)
1. **Địa chỉ**: Ưu tiên lấy từ cột 9 (Tỉnh), 11 (Thành phố) và 13 (Địa chỉ chi tiết) để điền vào database thay vì tự tách từ chuỗi địa chỉ đầy đủ.
2. **Ngành nghề**: Cột 30 (`事業種目`) chứa các mã ngành phân cách bằng `|`. Cần khớp mã này với bảng `master_industries`.
3. **Quy mô**: Cột 23 (Vốn) và 24 (Nhân viên) cần chuyển về kiểu dữ liệu số (Integer) để phục vụ Filter.
4. **Trạng thái**: Chỉ nên import những pháp nhân có trạng thái "Đang hoạt động" để làm dữ liệu nền, hoặc đánh dấu rõ ràng trạng thái trong database.

## Nguồn tham khảo
- https://help.info.gbiz.go.jp/hc/ja/articles/4798567593630
