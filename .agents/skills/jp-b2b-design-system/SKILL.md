---
name: jp-b2b-design-system
description: Quy chuẩn thiết kế giao diện (UI Design System) & Trải nghiệm người dùng (UX) chuẩn B2B Nhật Bản cho Kigyou-list (kigyoulist.com). Bắt buộc áp dụng cho mọi tác vụ chỉnh sửa giao diện (Admin, Dashboard, Search, Company Detail, Components). Đảm bảo tính tối giản, uy tín, thanh lịch, chuẩn mực doanh nghiệp Nhật Bản; tuyệt đối loại bỏ cảm giác lòe loẹt, phô trương của AI (anti-AI gimmick).
---

# Japanese B2B Minimalist UI Design System (日本B2B洗練デザインシステム)

Tài liệu này là **tiêu chuẩn thiết kế tối cao và bắt buộc** cho toàn bộ giao diện của **Kigyou-List (https://kigyoulist.com)**.

Bất cứ khi nào Agent tạo mới hoặc chỉnh sửa giao diện (Admin, Dashboard, Search, Detail, Landing Page, Dialog, Components), **BẮT BUỘC TUÂN THỦ 100% CÁC NGUYÊN TẮC TRONG SKILL NÀY**.

---

## 1. Triết Lý Thiết Kế Cốt Lõi (Design Philosophy)

Giao diện B2B Nhật Bản không cần phô diễn hiệu ứng hoạt họa phức tạp mà phải toát lên:
1. **信頼感 (Shinraikan - Tính Uy Tín & Đáng Tin Cậy)**: Mang phong thái của một tổ chức dữ liệu chính thống, ngân hàng dữ liệu doanh nghiệp tin cậy (như Teikoku Databank, Tokyo Shoko Research, Nikkei).
2. **洗練 (Seiren - Thanh Lịch & Tinh Tế)**: Không màu mè, mọi chi tiết sinh ra đều có mục đích rõ ràng.
3. **機能美 (Kinoubi - Vẻ Đẹp Từ Công Năng)**: Bố cục khoa học, mật độ hiển thị thông tin tối ưu (High Density Data), dễ quét mắt qua hàng nghìn dòng dữ liệu mà không mỏi mắt.
4. **余白の美 (Ma - Nghệ Thuật Khoảng Trắng)**: Khoảng trống được tính toán có nhịp điệu, không ngột ngạt nhưng không lãng phí không gian màn hình của chuyên gia.

---

## 2. QUY TẮC CẤM KỴ TUYỆT ĐỐI (ANTI-AI GIMMICK / NG RULE)

> [!CAUTION]
> **TẤT CẢ CÁC ĐẶC ĐIỂM "AI-LOOKING" SAU ĐÂY BỊ NGHIÊM CẤM:**
> 
> 1. ❌ **CẤM Các khối màu nền đen, xanh đậm gắt mắt (No Dark/Navy Black Blocks in Light Mode)**: Trong chế độ sáng thông thường, tuyệt đối không sử dụng các khối màu nền đen xì, xanh navy đậm (`#0F172A`, `#0B1221`) cho code block hay thẻ giao diện. Bắt buộc dùng **màu xám ngà dịu mắt (`bg-slate-50`, `bg-slate-100`) hoặc màu trắng (`bg-white`) kèm text xám than/đen (`text-slate-800`)** để tạo cảm giác êm dịu, chuẩn công sở Nhật.
> 2. ❌ **CẤM Lỗi tương phản chói lóa khi Google Chrome bật Chế độ Tối (Chrome Dark Mode Glitch)**: Tuyệt đối không để xảy ra tình trạng nền trang tối mà các thẻ Card lại giữ nguyên màu trắng bệch (`#FFFFFF`) gây chói mắt và phá vỡ bố cục. Không để thẻ này màu tối, thẻ kia màu trắng lộn xộn. Bắt buộc tương thích 100% với Google Chrome ở Chế độ Tối (cả qua class `.dark` lẫn qua Media Query `@media (prefers-color-scheme: dark)`).
> 3. ❌ **CẤM Lạm dụng Icon tràn lan**: Không gắn icon trước mọi dòng text hay danh sách một cách máy móc. Chỉ sử dụng icon khi thực sự có giá trị công năng (Functional Icons: Search, Copy, Download, Delete).
> 4. ❌ **CẤM Gradient Neon sặc sỡ**: Không dùng gradient tím - hồng - xanh cyan rực rỡ (kiểu OpenAI / Vercel futuristic / Web3 crypto).
> 5. ❌ **CẤM Viền phát sáng & Bóng đổ phóng đại (Glow / Heavy Shadows)**: Không dùng `shadow-2xl`, `drop-shadow-[0_0_20px_...]`, viền neon phát sáng.
> 6. ❌ **CẤM Kính mờ đục ngầu (Heavy Backdrop Glassmorphism)**: Hạn chế tối đa `backdrop-blur-xl bg-white/30`. Sử dụng nền đặc thanh lịch với viền dứt khoát 1px.
> 7. ❌ **CẤM Bo góc đồ chơi (Over-rounded)**: Không dùng `rounded-3xl` hoặc `rounded-[2rem]` tràn lan. Chuẩn mực là `rounded-lg` (8px) hoặc `rounded-md` (6px).
> 8. ❌ **CẤM Lạm dụng Icon "Magic / Sparkles / Bot"**: Không gắn icon ngôi sao lấp lánh (Sparkles ✨) ở khắp mọi nơi. Giao diện B2B cần sự điềm tĩnh và chuyên nghiệp.
> 9. ❌ **CẤM Text màu xám quá nhạt (Low Contrast Text)**: Luôn đảm bảo độ tương phản chuẩn WCAG AAA trên cả nền sáng lẫn nền tối.

---

## 3. Hệ Màu Chuẩn B2B Nhật Bản (Corporate Color Palette)

Lấy cảm hứng từ hệ màu truyền thống Nhật Bản (和色 - Washoku) kết hợp phong cách Modern Minimalist SaaS:

### 3.1. Màu Chủ Đạo (Primary & Dominant)
- **勝ち色 (Kachi-iro - Deep Indigo Navy)**: `#1B4F8A` (Hover: `#143D6C`)
  - *Ý nghĩa*: Màu áo giáp truyền thống của Samurai tượng trưng cho chiến thắng, uy tín, trầm ổn và cam kết dài lâu. Đây là màu thương hiệu chính của Kigyou-List.
- **濃藍 (Koiai - Deep Slate Navy)**: `#0F172A` (Text chính trong light mode).
- **藍白 (Aijiro - Soft Ice Mist)**: `#F0F4F9` hoặc `#E8EFF7` (Dùng cho hover, active tab background, chip nhẹ).

### 3.2. Màu Nền & Thẻ (Backgrounds & Surfaces)
- **Light Mode**:
  - Toàn trang (Background): `#F8FAFC` (Trắng ngà dịu mắt, tránh trắng tinh chói lóa `#FFFFFF`).
  - Thẻ/Card (Surface): `#FFFFFF` với viền `border border-slate-200/90`.
- **Dark Mode**:
  - Toàn trang (Background): `#0D1117` (Deep Obsidian của GitHub/Dev B2B, không dùng đen tuyệt đối `#000000`).
  - Thẻ/Card (Surface): `#151B22` với viền `border border-slate-800/90`.

### 3.3. Màu Nhấn & Trạng Thái (Accents & Semantic Status)
Màu sắc mang tính trầm, nhã nhặn, không chói chang:
- **Thành công (Success / Active)**: 常磐色 (Tokiwa-iro - Deep Pine Emerald) `#059669` (Light bg: `#ECFDF5`, Dark bg: `#064E3B/40`).
- **Cảnh báo (Warning / Pending Review)**: 琥珀色 (Kohaku-iro - Warm Amber) `#D97706` (Light bg: `#FFFBEB`, Dark bg: `#78350F/40`).
- **Từ chối / Nguy hiểm (Danger / Error)**: 茜色 (Akane-iro - Deep Crimson) `#E11D48` (Light bg: `#FFF1F2`, Dark bg: `#881337/40`).
- **Thông tin (Info / Notice)**: 縹色 (Hanada-iro - Corporate Sky) `#2563EB` (Light bg: `#EFF6FF`, Dark bg: `#1E3A8A/40`).
- **Nhãn Trung tính (Neutral / Metadata)**: `#64748B` (Light bg: `#F1F5F9`, Dark bg: `#1E293B`).

---

## 4. Quy Chuẩn Typography Tiếng Nhật B2B (Japanese Typography)

```css
/* Font Stack chuẩn B2B Nhật Bản */
font-family: var(--font-sans), "Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
```

### 4.1. Quy tắc bắt buộc:
1. **Bật Proportional Metrics (`font-feature-settings: "palt"`)**:
   - Luôn áp dụng cho body và tiêu đề tiếng Nhật để tự động tối ưu khoảng cách giữa các ký tự Kanji và Kana, giúp mặt chữ thanh thoát, chuẩn typography nhà xuất bản Nhật.
2. **Độ giãn dòng (Line Height)**:
   - Đoạn văn bản tiếng Nhật: Tối thiểu `leading-relaxed` (1.65 - 1.75). Tiếng Nhật ký tự vuông vức, nếu để line-height quá sát (1.3 - 1.4) sẽ rất nặng nề và khó đọc.
   - Tiêu đề: `leading-snug` (1.3 - 1.4).
3. **Cân nặng phông chữ (Font Weight)**:
   - Tiêu đề chính: `font-bold` (700). Hạn chế dùng `font-black` (900) vì làm nhòe nét Kanji.
   - Nội dung dữ liệu / bảng biểu: `font-medium` (500) hoặc `font-normal` (400).
   - Nhãn trạng thái / Metadata: `font-semibold` (600) với kích thước nhỏ `text-[11px]` hoặc `text-xs`.
4. **Hiển thị Số & Tiền Tệ**:
   - Toàn bộ số liệu (Mã số pháp nhân 法人番号, số tiền ¥, số điện thoại, ngày tháng) phải dùng phông Monospace hoặc kích hoạt `font-variant-numeric: tabular-nums` (`tabular-nums` trong Tailwind) để các con số thẳng hàng hoàn hảo khi xếp trong bảng.

---

## 5. Quy Chuẩn Bố Cục Bảng Biểu & Khối Dữ Liệu (Data Density & Tables)

Trang Admin và Dashboard B2B là công cụ làm việc hàng ngày của chuyên gia, do đó:
1. **Đường kẻ ranh giới (Borders)**:
   - Dùng đường kẻ mảnh 1px (`border-slate-200/90` trong light mode, `border-slate-800/90` trong dark mode).
   - Giữa các hàng trong bảng dữ liệu: dùng `divide-y divide-slate-100 dark:divide-slate-800/60`.
2. **Kích thước nút bấm (Buttons)**:
   - Chiều cao chuẩn: `h-9` (36px) cho nút chính, `h-8` (32px) cho nút thao tác trong bảng biểu.
   - Bo góc nút: `rounded-lg` (8px). Không dùng `rounded-full` cho nút hành động nghiệp vụ.
   - Hiệu ứng: Chuyển màu nhẹ nhàng (`transition-colors duration-150`), không dùng hiệu ứng phóng to giật nảy (`scale-105` quá đà).
3. **Thẻ trạng thái (Status Badges)**:
   - Nhỏ gọn, thanh mảnh: `px-2 py-0.5 rounded text-[11px] font-semibold border`.
   - Có dấu chấm tròn nhỏ (Status dot) bên cạnh để tăng khả năng nhận diện thị giác:
     ```tsx
     <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
       承認済み
     </span>
     ```

---

## 6. Tiêu Chuẩn Tương Thích Tuyệt Đối Với Google Chrome Ở Chế Độ Tối (Chrome Dark Mode)

Người dùng trình duyệt Google Chrome thường xuyên sử dụng tính năng **Chế độ Tối (Dark theme / Dark Mode)** qua cài đặt hệ điều hành (Windows/macOS dark mode) hoặc cờ duyệt web. 

Để tránh hiện tượng chói mắt hoặc vỡ giao diện (như lỗi nền đen nhưng thẻ card lại trắng bệch hoặc thẻ tối thẻ sáng lệch pha):

### 6.1. Quy tắc cốt lõi:
1. **Đồng bộ 100% bề mặt (Unified Surfaces)**:
   - Toàn bộ các thẻ Card (`.b2b-card`), container, modal, popup, sidebar phải tự động chuyển sang gam màu tối êm dịu (`#161B22` hoặc `#151B22`).
   - Viền thẻ trong dark mode: Dùng viền xám đậm mềm mại (`#30363D` hoặc `#334155`), tuyệt đối không để viền phát sáng hay viền trắng gắt.
   - Chữ chính trong dark mode: Dùng `#F8FAFC` hoặc `#E2E8F0`. Chữ phụ: Dùng `text-slate-400` hoặc `text-slate-300`.
2. **Cơ chế phòng thủ 2 lớp (Two-tier Dark Mode Architecture)**:
   - **Lớp 1 (Class-based Tailwind)**: Thẻ `<html>` tự động nhận class `dark` ngay từ `<head>` thông qua đoạn script siêu nhẹ `window.matchMedia('(prefers-color-scheme: dark)').matches` để đồng bộ toàn bộ CSS Tailwind (`dark:*`).
   - **Lớp 2 (Native Media Query Fallback)**: Trong `globals.css`, các class cốt lõi (`.b2b-card`, `.b2b-kicker`, `.b2b-btn-secondary`) được bảo vệ bằng `@media (prefers-color-scheme: dark)`. Dù trình duyệt có độ trễ hydrate Javascript thì giao diện vẫn lập tức render màu tối êm dịu, không bị chớp giật hay giữ màu trắng bệch.
3. **Cấm tuyệt đối thẻ card trắng trên nền tối**:
   - Khi trang đang hiển thị nền tối (`dark:bg-[#0D1117]`), không được để bất kỳ thẻ card nào có nền trắng (`bg-white` đơn độc). Mọi thẻ card bắt buộc dùng class chuẩn `.b2b-card` hoặc có cặp tương ứng `bg-white dark:bg-[#161B22]`.

---

## 7. Checklist Kiểm Duyệt Trước Khi Xuất Bản Giao Diện (Review Checklist)

Mỗi khi chỉnh sửa giao diện bất kỳ, hãy tự kiểm tra qua bảng checklist này:
- [ ] **Tương thích hoàn hảo trên Google Chrome ở Chế độ Tối (Dark Mode)**: Không bị lỗi thẻ trắng trên nền tối, không bị thẻ nọ màu tối thẻ kia màu trắng; chữ và icon sắc nét, tương phản êm dịu, không gây chói mắt.
- [ ] Không có màu gradient neon cyberpunk / AI hologram.
- [ ] Không có viền phát sáng (glow) hay bóng đổ phóng đại rực rỡ.
- [ ] Bo góc được kiểm soát: card dùng `rounded-xl` hoặc `rounded-lg`, nút dùng `rounded-lg`.
- [ ] Màu chủ đạo là `#1B4F8A` (Kachi-iro Navy), màu nền là `#F8FAFC` (Light) hoặc `#0D1117` (Dark).
- [ ] Typography có `font-feature-settings: "palt"`, chữ Hán rõ ràng, độ tương phản cao.
- [ ] Các con số thống kê, mã số doanh nghiệp có class `tabular-nums`.
- [ ] Biểu tượng (Icon) kích thước nhỏ gọn (`w-4 h-4` hoặc `w-4.5 h-4.5`), đúng ngữ cảnh, không dùng icon ngôi sao/magic bừa bãi.
- [ ] Giao diện mang lại cảm giác trang trọng, tin cậy, giống như sản phẩm tài chính/dữ liệu của tập đoàn Nhật Bản.

---

## 8. 5 Xung Đột Thị Giác Thường Gặp & Quy Chuẩn Bảng Hồ Sơ Doanh Nghiệp (Dossier Harmonization)

Khi thiết kế bảng hồ sơ chi tiết công ty (`企業基本情報・企業連絡先情報`), nghiêm cấm 5 lỗi xung đột thị giác (Visual Conflicts) sau:

### 8.1. Xung đột 1: Component con tự ý hardcode kích thước chữ (Component Font Size Drift)
- ❌ **Hiện tượng**: Component con (như `ObfuscatedPhone`) bị hardcode `text-base font-bold` (16px in đậm), trong khi toàn bộ bảng xung quanh dùng `text-sm` (14px). Hậu quả: số điện thoại to và đậm bất thường, phá vỡ cấu trúc mắt quét của người dùng.
- ✅ **Chuẩn hóa**: Tất cả các component hiển thị giá trị trong bảng bắt buộc đồng nhất kích thước:
  - Text thường: `text-sm font-medium text-slate-900 dark:text-slate-100`.
  - Giá trị số (Điện thoại, Fax, Mã số, Ngày tháng, Số tiền): `text-sm font-medium font-mono tabular-nums text-slate-900 dark:text-slate-100`.

### 8.2. Xung đột 2: Nhồi nhét câu chữ pháp lý & Phá vỡ lưới 2 cột đối xứng (Row Overcrowding)
- ❌ **Hiện tượng**: Dòng Invoice (T-Number) nhồi nhét cả: mã số `T801...` + nút chữ `登録番号をコピー` + đoạn giải thích dài `消費税法第57条の2に基づく公表登録済事業者`, đồng thời cho chiếm 2 cột (`col-span-2`), gây lệch nhịp và tạo ra một chuỗi chữ hỗn tạp.
- ✅ **Chuẩn hóa**: 
  - Đưa `インボイス登録番号` về 1 cột đơn (`col-span-1`), đặt đối xứng hoàn hảo cạnh `法人番号`.
  - Cấu trúc giá trị chỉ gồm: `T{corporate_number}` + icon copy nhỏ gọn + badge nhỏ `国税庁登録済`.
  - Tuyệt đối loại bỏ các đoạn văn giải thích luật dài dòng ở dòng giá trị.

### 8.3. Xung đột 3: Rò rỉ URL thô và chuỗi tham số dài (Raw URL Query String Leak)
- ❌ **Hiện tượng**: Website của doanh nghiệp hiển thị nguyên văn đường link 100 ký tự kèm tham số kỹ thuật (`https://as.chizumaru.com/jfc/detailMap?account=jfc&accmd=0&bid=348`), gây cảm giác cẩu thả, nghiệp dư.
- ✅ **Chuẩn hóa**: Bắt buộc lọc sạch qua hàm helper `cleanDisplayUrl(url)`:
  - Chỉ hiển thị Hostname và Path sạch (ví dụ: `as.chizumaru.com/jfc/detailMap`), tự động cắt bỏ query string `?account=...`.
  - Kèm biểu tượng `ExternalLink` (14px opacity-70) và hiệu ứng hover gạch chân thương hiệu `#1B4F8A`.

### 8.4. Xung đột 4: Nhãn trường bị gắn hậu tố lộn xộn (Inconsistent Label Suffixes)
- ❌ **Hiện tượng**: Trong cùng 1 bảng, các trường phía trên ghi ngắn gọn (`フリガナ`, `代表者名`), nhưng các trường phía dưới lại tự ý thêm hậu tố: `代表電話番号 (公開)`, `公式ウェブサイト (公開)`, `事業種目 (Tags)`.
- ✅ **Chuẩn hóa**: Bỏ toàn bộ các hậu tố thừa thãi. Chuẩn mực tiếng Nhật B2B:
  - Dùng `代表電話番号` (không dùng `(公開)`).
  - Dùng `公式ウェブサイト` (không dùng `(公開)`).
  - Dùng `事業種目` (không dùng `(Tags)`).
  - Dùng `インボイス登録番号` (không dùng cả câu dài `適格請求書発行事業者登録番号`).

### 8.5. Xung đột 5: Trộn lẫn kiểu nút Copy (Inconsistent Action Buttons)
- ❌ **Hiện tượng**: Trường thì dùng nút icon copy nhỏ gọn (`Copy` icon), trường thì dùng nút bấm chữ xám dài dòng (`[登録番号をコピー]`).
- ✅ **Chuẩn hóa**: Thống nhất 100% sử dụng icon-only copy button `<CopyTextButton text={...} />` cho tất cả các mã số và chuỗi dữ liệu trong bảng.

---

## 9. Quy Chuẩn Cổng Quản Lý & Chỉnh Sửa Thông Tin Doanh Nghiệp Hợp Nhất (Unified Management & Correction Portal)

Nghiêm cấm tạo ra nhiều nút bấm trùng lặp chức năng gây bối rối cho người dùng (ví dụ: vừa có nút `情報編集` trên Header, vừa có thanh `掲載情報の修正・追加を申請` ở dưới bảng). Bắt buộc tuân thủ 5 nguyên tắc sau:

### 9.1. Nguyên tắc Một Cổng Duy Nhất (Single Point of Entry)
- Không bao giờ phân tán luồng chỉnh sửa dữ liệu thành nhiều cửa sổ modal khác nhau.
- Gom toàn bộ tính năng: Sửa thông tin cơ bản, Xác thực chính chủ (Claim Badge), Đăng thông điệp PR, và Yêu cầu gỡ bỏ (Opt-out) vào duy nhất **Một Cổng Quản Trị**: `掲載情報の修正・管理`.

### 9.2. Chống Lỗi Rớt Chữ Hero Header (Whitespace-Nowrap Constraint)
- Nút bấm thứ 3 trên Hero Header bắt buộc phải có thuộc tính `whitespace-nowrap shrink-0 px-3.5 py-2 text-xs font-semibold`.
- Tuyệt đối cấm để xảy ra hiện tượng co hẹp dẫn đến rớt chữ như `情報編` ở dòng 1 và `集` ở dòng 2.
- Nhãn chuẩn B2B Nhật Bản: `掲載情報の修正・管理` (Tooltip: `掲載情報の修正・公式企業認証・掲載停止申請`).

### 9.3. Bỏ Khối Xám Chen Ngang Bảng Thông Tin (Eliminate Visual Disruptions)
- Không dùng các khối hộp màu xám cồng kềnh nằm chen giữa các bảng dữ liệu pháp lý.
- Thay thế bằng **1 dòng ghi chú pháp lý vi mô (Micro Footnote)** đặt ở đáy bảng hồ sơ cơ bản:
  `※ 掲載情報の誤り修正・最新情報の追加、または掲載停止の申請は [こちら（情報修正・管理センター）] から行えます。`
  Bấm vào link này sẽ mở trực tiếp Cổng Quản Lý Hợp Nhất.

### 9.4. Cơ Chế Đa Vai Trò Tự Động Trong Modal (Role-Aware Unified Modal)
- **Nếu là Quản trị viên (Admin Mode)**: Tự động nhận diện quyền Admin, hiển thị badge màu vàng `管理者特権モード（即時反映）`. Khi Admin sửa thông tin, hệ thống cho phép bấm lưu trực tiếp vào cơ sở dữ liệu (`Direct Save`) mà không cần mã OTP hay chờ phê duyệt.
- **Nếu là Doanh nghiệp / Khách truy cập (Public & Owner Mode)**: Giao diện phân chia 3 Tabs rõ ràng, trang nhã:
  1. `情報の修正・追加` (Chỉnh sửa SĐT, Fax, Web, Form liên hệ, Tuyển dụng, Vốn, Đại diện...).
  2. `公式企業認証 & PR` (Nhận tích xanh chính chủ & Đăng thông điệp giới thiệu doanh nghiệp).
  3. `掲載停止 (非公開)` (Yêu cầu gỡ bỏ/ẩn dữ liệu theo luật bảo mật thông tin).

### 9.5. Quy Trình Quản Trị Phê Duyệt Của Admin (Admin Back-office & Workflow Engine)
- **Hiển thị Bảng So Sánh Thay Đổi (Diff Viewer)**: Trong trang Admin (`/ja/admin` Tab お問い合わせ), yêu cầu chỉnh sửa từ doanh nghiệp phải hiển thị rõ ràng:
  - Cột 1: Tên hạng mục (SĐT, Website, Đại diện...).
  - Cột 2: Giá trị hiện tại trên trang (Old Value).
  - Cột 3: Giá trị mới do doanh nghiệp đề xuất (New Value - màu xanh nổi bật).
- **Hành động 1-Click Trực Quan**:
  - `[承認してDBに即時反映]`: Tự động UPDATE vào bảng `companies` và gửi email thông báo chúc mừng tới doanh nghiệp qua Resend.
  - `[却下]`: Cho phép Admin nhập lý do từ chối (hoặc chọn lý do mẫu) và gửi email giải thích rõ ràng tới doanh nghiệp.

---

## 10. Quy Chuẩn Nhất Quán Text & Trường Dữ Liệu Hồ Sơ Doanh Nghiệp (Data Field Uniformity & Anti-Clutter Standard)

Để loại bỏ hoàn toàn cảm giác chắp vá, lòe loẹt hay rối mắt khi người dùng xem hồ sơ doanh nghiệp (`/company/[id]`), toàn bộ các trường thông tin cơ bản và liên hệ (Invoice, Niêm yết, SĐT, Website, Fax, Email, Contact Form, Ngành nghề) bắt buộc tuân theo **1 Quy Chuẩn Hiển Thị Đồng Nhất 100%**:

### 10.1. Cấu Trúc Ô Dữ Liệu Đồng Bộ (Unified Cell Structure)
- **Tiêu đề trường (Label)**: Luôn dùng `text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1`.
- **Nội dung trường (Value)**: Luôn dùng `text-sm font-medium text-slate-900 dark:text-slate-100`.
- **Dữ liệu dạng số / mã / ngày tháng**: Bổ sung `font-mono tabular-nums`.

### 10.2. Triệt Tiêu Các Icon Thừa Thãi (Eliminate Gratuitous Icons)
- ❌ **CẤM icon khóa `Lock` tại trường Email**: Email có thể ghi rõ `あり (CSV出力で提供)` bằng text chuẩn `text-slate-900`, không dùng icon ổ khóa gây cảm giác hệ thống bị lỗi hoặc giấu giếm tiêu cực.
- ❌ **CẤM icon tích xanh `CheckCircle2` tràn lan**: Cả ở mục Form liên hệ lẫn Invoice. Không dùng icon check to tướng màu xanh lá. Nếu có form liên hệ, hiển thị text trang nhã `あり (営業代行対応)` cùng tông màu chuẩn `text-slate-900`.
- ❌ **CẤM icon liên kết ngoài `ExternalLink` dày đặc**: Website và Tuyển dụng hiển thị đường dẫn URL dạng text thanh lịch `text-[#1B4F8A] hover:underline`, không cần đính kèm icon mũi tên ngoài gây xao nhãng.
- ❌ **CẤM icon copy trùng lặp**: Chỉ giữ icon copy ở các mã số quan trọng hàng đầu (`法人番号`, `住所`), loại bỏ icon copy rườm rà ở T-number và số điện thoại.

### 10.3. Nhất Quán Màu Sắc - Không Phân Biệt Đối Xử (Uniform Color Rhythm)
- ❌ **CẤM chấm tròn xanh `w-2 h-2 rounded-full` và chữ xanh đậm tại 上場区分**: Trường Niêm yết (上場区分) phải có cùng font chữ và màu sắc với các trường khác (`text-sm font-medium text-slate-900`). Mã chứng khoán để trong ngoặc `（証券コード: xxxx）` bằng font mono xám `text-slate-500 text-xs`.
- ❌ **CẤM badge xanh lá cây chói lọi tại インボイス登録番号**: Trạng thái `国税庁登録済` để trong ngoặc đơn nhẹ nhàng `（国税庁登録済）` màu `text-slate-500 text-xs`, đặt liền sau số T-number màu đen chuẩn.
- **Thẻ Ngành nghề (事業種目)**: Sử dụng phong cách tag vi mô phẳng `bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70 text-xs font-normal px-2 py-0.5 rounded`, không dùng khối xám đậm dày cộm.

---

## 11. Quy Chuẩn Tích Hợp Tra Cứu Hóa Đơn & Đăng Ký Theo Dõi Tự Động (Embedded Compliance & Auto-Watch Standard)

Nhằm tối ưu hóa tỷ lệ giữ chân khách hàng (User Retention) và phục vụ trực tiếp nhu cầu đối soát kế toán hàng tháng của doanh nghiệp Nhật Bản:

### 11.1. Đồng Bộ Hạn Mức Tự Nhiên (100-Entity Cap Alignment)
- Hạn mức theo dõi biến động (Watchlist / 監視リスト) được mở rộng lên **100 công ty** (`無料枠: 最大100社`), đồng bộ 1:1 với giới hạn tra cứu hàng loạt của công cụ Invoice (`最大 100 件まで一括照会可能`).
- Hiển thị rõ ràng dung lượng theo dõi: `現在の登録数: X / 100 社`.

### 11.2. Luồng Chuyển Đổi Liền Mạch (Seamless Public-to-Watchlist Flow)
- Trên trang công khai (`/invoice`): Ngay tại bảng kết quả đối soát hợp lệ, cung cấp nút **`[一括ウォッチに追加 (最大100社)]`** cạnh nút `[CSV出力]`.
- Nếu chưa đăng nhập: Mở nhẹ nhàng Auth Modal với thông điệp giá trị: *"アカウント登録（無料）で、照会した企業が倒産・移転・インボイス失効した際に自動メール通知を受け取れます"*.
- Nếu đã đăng nhập: Kích hoạt hàm `saveCompaniesBatch` lưu trực tiếp vào danh sách theo dõi mà không làm gián đoạn trải nghiệm của người dùng.

### 11.3. Nhúng Trực Tiếp Công Cụ Tra Cứu Hàng Loạt Vào Dashboard (`[+ 一括追加]`)
- Tại cột quản lý doanh nghiệp theo dõi (`監視対象企業`), trang bị nút hành động chuyên biệt **`[+ 一括追加]`**.
- Cho phép người dùng paste tối đa 100 mã T-number hoặc 13 số pháp nhân trực tiếp từ file Excel kế toán, tra cứu tức thì qua Web-API Quốc thuế và tự động thêm vào danh sách theo dõi chỉ với 1 cú click.

### 11.4. Nút Đối Soát 1-Click Toàn Bộ Danh Sách Theo Dõi (`[全社照会]`)
- Tại đầu cột `監視対象企業`, khi người dùng đã có doanh nghiệp trong danh sách, trang bị nút hành động **`[全社照会]`** (icon `ShieldCheck`, tone màu xanh da trời `sky-50 / text-sky-700`).
- Khi bấm: Tự động gom toàn bộ mã số của các công ty trong danh sách theo dõi (tối đa 100 công ty), mở Modal đối soát và tự động chạy kiểm tra trạng thái chứng nhận Invoice với Cục Thuế.
- Kết quả đối soát phân loại rõ: **Hợp lệ (有効)** / **Bị thu hồi (失効・取消)** / **Chưa đăng ký (未登録)**, kèm nút xuất file Excel/CSV phục vụ lưu trữ kiểm toán.

---

## 12. Quy Chuẩn Sự Kiện Biến Động Giám Đốc (`代表者変更`) & Hóa Đơn (`インボイス公表・変動`) trên Timeline

Nhằm cung cấp tín hiệu kinh doanh (Sales Signals) và quản trị rủi ro thanh toán (Compliance Signals) đỉnh cao:

### 12.1. Sự Kiện Thay Đổi Giám Đốc Đại Diện (`代表者変更` - `representative_change`)
- **Nguồn dữ liệu:** FSA EDINET 臨時報告書 (Thời gian thực cho công ty niêm yết) & gBizINFO / 法人登記情報.
- **Badge giao diện:** Màu tím vương giả, uy tín (`bg-purple-50 text-purple-700 border-purple-200`).
- **Khối so sánh cũ - mới:** Bắt buộc hiển thị rõ ràng:
  - `変更前: {old_name} (前代表取締役)` (chữ gạch ngang màu đỏ xám `line-through text-slate-500`)
  - `変更後: {new_name} (現代表取締役・就任)` (chữ đậm màu xanh lục dịu `text-emerald-700 font-semibold`)
- **Giá trị B2B:** Thời điểm vàng tiếp cận bán hàng (New Decision Maker) và gửi thư/hoa chúc mừng nhậm chức.

### 12.2. Sự Kiện Biến Động Hóa Đơn (`インボイス公表・変動` - `invoice`)
- **Nguồn dữ liệu:** Cục Thuế Quốc gia Nhật Bản (国税庁 適格請求書発行事業者公表 Web-API).
- **Phân loại hiển thị:**
  - **Trường hợp bị hủy/thu hồi số (Hủy tư cách xuất hóa đơn):** Badge đỏ cảnh báo khẩn cấp `[インボイス失効警告]` (`bg-rose-50 text-rose-700 border-rose-200`). Khối so sánh: `変更前: 登録済 (T...) ➔ 変更後: 登録取消 (無効・仕入税額控除不可)`.
  - **Trường hợp đăng ký mới thành công:** Badge màu hổ phách/vàng đất `[インボイス登録公表]` (`bg-amber-50 text-amber-800 border-amber-200`). Khối so sánh: `変更前: 申請中 / 未登録 ➔ 変更後: 登録済 (T...)`.






