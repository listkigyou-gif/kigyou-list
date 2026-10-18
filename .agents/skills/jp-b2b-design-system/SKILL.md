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
> 1. ❌ **CẤM Gradient Neon sặc sỡ**: Không dùng gradient tím - hồng - xanh cyan rực rỡ (kiểu OpenAI / Vercel futuristic / Web3 crypto).
> 2. ❌ **CẤM Viền phát sáng & Bóng đổ phóng đại (Glow / Heavy Shadows)**: Không dùng `shadow-2xl`, `drop-shadow-[0_0_20px_...]`, viền neon phát sáng.
> 3. ❌ **CẤM Kính mờ đục ngầu (Heavy Backdrop Glassmorphism)**: Hạn chế tối đa `backdrop-blur-xl bg-white/30` gây mờ đục chữ Nhật. Sử dụng nền màu đặc (solid) hoặc bán trong suốt nhẹ `bg-white/95 dark:bg-[#151B22]/95` với viền dứt khoát.
> 4. ❌ **CẤM Bo góc đồ chơi (Over-rounded)**: Không dùng `rounded-3xl` hoặc `rounded-[2rem]` tràn lan cho các card dữ liệu hay bảng biểu B2B. Chuẩn mực là `rounded-lg` (8px) hoặc `rounded-xl` (12px).
> 5. ❌ **CẤM Lạm dụng Icon "Magic / Sparkles / Bot"**: Không gắn icon ngôi sao lấp lánh (Sparkles ✨) ở khắp mọi nơi trừ khi thực sự là tính năng AI tạo sinh cốt lõi. Giao diện quản trị B2B cần sự điềm tĩnh và chuyên nghiệp.
> 6. ❌ **CẤM Text màu xám quá nhạt (Low Contrast Text)**: Tiếng Nhật có nhiều nét phức tạp (Kanji), chữ mờ sẽ cực kỳ khó đọc và tạo cảm giác thiếu chuyên nghiệp. Luôn đảm bảo độ tương phản chuẩn WCAG AAA.

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

## 6. Checklist Kiểm Duyệt Trước Khi Xuất Bản Giao Diện (Review Checklist)

Mỗi khi chỉnh sửa giao diện bất kỳ, hãy tự kiểm tra qua bảng checklist này:
- [ ] Không có màu gradient neon cyberpunk / AI hologram.
- [ ] Không có viền phát sáng (glow) hay bóng đổ phóng đại rực rỡ.
- [ ] Bo góc được kiểm soát: card dùng `rounded-xl` hoặc `rounded-lg`, nút dùng `rounded-lg`.
- [ ] Màu chủ đạo là `#1B4F8A` (Kachi-iro Navy), màu nền là `#F8FAFC` (Light) hoặc `#0D1117` (Dark).
- [ ] Typography có `font-feature-settings: "palt"`, chữ Hán rõ ràng, độ tương phản cao.
- [ ] Các con số thống kê, mã số doanh nghiệp có class `tabular-nums`.
- [ ] Biểu tượng (Icon) kích thước nhỏ gọn (`w-4 h-4` hoặc `w-4.5 h-4.5`), đúng ngữ cảnh, không dùng icon ngôi sao/magic bừa bãi.
- [ ] Giao diện mang lại cảm giác trang trọng, tin cậy, giống như sản phẩm tài chính/dữ liệu của tập đoàn Nhật Bản.
