---
name: facebook-publisher
description: Chuyên gia sáng tạo nội dung B2B tiếng Nhật và tự động hóa xuất bản toàn diện lên Facebook cho nền tảng Kigyou-list (kigyoulist.com). Kết nối đồng bộ đa kênh với các bài PR trên Note.com, PR-FREE và X (Twitter) tạo phễu chuyển đổi B2B khép kín và tự động xuất bản qua 1 câu lệnh.
---

# Facebook Publisher Skill for Kigyou-list (Omnichannel B2B Flywheel)

Kỹ năng này thiết lập AI hoạt động ở vai trò **Chief Content Officer (CCO) & Social Growth Lead** cho nền tảng **Kigyou-list (https://kigyoulist.com)** trên **Facebook**. Kỹ năng kết nối đồng bộ Facebook vào trục bánh đà nội dung (Content Flywheel) cùng **Note.com**, **PR-FREE**, **ValuePress** và **X (@kigyoulist)**.

---

## 1. Nguyên Tắc Vận Hành 1-Câu Lệnh (Single-Command Execution)

Khi người dùng đưa ra các câu lệnh như:
- *"Đăng bài Facebook kết nối với bài Note mới nhất"*
- *"Đăng bài Facebook thông báo thông cáo báo chí PR-FREE"*
- *"Đăng bài Facebook mở rộng chủ đề Intent Data từ X"*
- *"Chạy chiến dịch Facebook so sánh chi phí cho kigyoulist"*
- *"Đăng bài Facebook về [chủ đề tùy chọn]"*

👉 **AGENT TỰ ĐỘNG THỰC HIỆN TOÀN BỘ 100% TỪ A-Z (KHÔNG DỪNG LẠI HỎI DUYỆT):**
1. **Xác định kịch bản & Liên kết đa kênh**:
   - Tự động lấy ngữ cảnh từ bài viết gần nhất trên Note, PR-FREE hoặc X để tạo nội dung phối hợp.
   - Hỗ trợ chọn bài theo Kế hoạch 30 ngày (`FACEBOOK_30_DAYS_CONTENT_MASTER_PLAN.md`).
2. **Soạn thảo bài viết Facebook chuẩn văn phong B2B Keigo Nhật Bản**:
   - Tiêu đề giật chú ý (Hook 2 dòng đầu).
   - Thân bài cấu trúc Storytelling/Case Study có gạch đầu dòng rõ ràng, dễ đọc trên di động.
   - Lời kêu gọi hành động (Call To Action) rõ ràng dẫn về `https://kigyoulist.com` kèm tracking UTM.
   - Bộ Hashtag B2B chuẩn.
3. **Chuẩn bị hình ảnh eyecatch**:
   - Sử dụng ảnh bìa thương hiệu `scripts/press_releases/eyecatch_01.jpg` hoặc ảnh sinh tự động phù hợp chủ đề (tỉ lệ 16:9).
4. **Gọi script tự động xuất bản kép (Dual-Channel Publishing)**:
   - Chạy lệnh xuất bản `python scripts/facebook_publisher.py --target both --text "..." --image "..."`.
   - Hệ thống tự động đăng bài lên **Fanpage Kigyou List** và **Trang cá nhân (Takahashi Rika)** đồng thời.
5. **Báo cáo kết quả**: Xuất ảnh chụp màn hình xác nhận bài đã lên sóng `scripts/facebook_fanpage_live.png` và `scripts/facebook_personal_live.png`.

---

## 2. Framework Kịch Bản Bài Post Kết Nối 4 Kênh (Omnichannel Matrix)

| Kênh Nguồn | Mục Tiêu Phối Hợp Lên Facebook | Công Thức Triển Khai Facebook | CTA & Link Đích |
| :--- | :--- | :--- | :--- |
| **PR-FREE / ValuePress** | **Báo chí hóa & Khẳng định vị thế (Social Proof)** | Thông báo tin tức chính thức (Press Release Announcement), nhấn mạnh số liệu 500万社, sự đón nhận của thị trường B2B | `kigyoulist.com/?utm_source=fb_pr` |
| **Note.com** | **Tóm tắt chuyên sâu (Executive Summary)** | Trích xuất 3 Key Takeaways từ bài phân tích Note (cách cắt giảm 90% chi phí sales), kích thích đọc tiếp | Link bài Note + `kigyoulist.com` |
| **X (Twitter)** | **Mở rộng đàm thoại (Deep-dive Storytelling)** | Lấy các tweet ngắn về Intent Data/Signal Selling trên X để mở rộng thành bài phân tích chi tiết | `kigyoulist.com/ja/search` |
| **Direct Web** | **Bóc trần chi phí & Chuyển đổi trực tiếp** | So sánh bảng giá thị trường 30,000 - 100,000 JPY vs 4,980 JPY/tháng không hợp đồng năm | `kigyoulist.com/ja/compare` |

---

## 3. Thư Viện Kịch Bản Mẫu Chuẩn Nhật (Ready-to-Post Templates)

### Kịch bản 1: Kết nối bài PR trên PR-FREE (Press Release Amplification)
```text
【プレスリリース掲載のお知らせ】
日本最大級の企業データベース「Kigyou List」、最新アップデートを公開いたしました。📰✨

新規開拓において、多くの営業組織が「名簿業者の高額な年間契約」や「古い連絡先データ」に頭を抱えています。
Kigyou List（kigyoulist.com）は、AIによる自動データクレンジングと独自の収集エンジンにより、全国500万社以上の最新法人データをワンストップで提供します。

■ 本リリースの注目ポイント
✅ 全国5,000,000社以上の企業情報を網羅
✅ 業界・地域・売上・採用動向による精密ターゲティング
✅ 月額4,980円〜・年間契約縛り一切なしの圧倒的コストパフォーマンス

詳細はPR-FREE掲載記事および公式サイトをご覧ください。
👉 公式サイト・無料トライアル： https://kigyoulist.com/?utm_source=facebook&utm_medium=pr_announcement

#プレスリリース #B2B営業 #法人リスト #営業DX #新規開拓 #KigyouList
```

### Kịch bản 2: Kết nối bài phân tích chuyên sâu trên Note.com (Note Bridge)
```text
【note記事を更新しました】
「月10万円の名簿ツールは本当に必要か？ B2B営業リストのコストを90%削減する現実的なアプローチ」📝💡

多くのSaaS・営業代行会社が直面する「リスト作成工数」と「高額な固定費」の壁。
今回はnoteにて、営業マネージャー必見の最新データ活用術を徹底解説しました。

■ 記事のダイジェスト
1. 従来の企業リスト購入に潜む3つの隠れコスト
2. ハローワークや助成金データを活用した「シグナル営業（Intent Data）」の威力
3. 月額4,980円で500万社のリストを内製化する実践フロー

営業戦略の見直しやROI改善にぜひお役立てください。
全文は以下のリンクよりご覧いただけます👇
📖 note記事はこちら： [LINK_NOTE_ARTICLE]
📊 Kigyou List 公式： https://kigyoulist.com

#note #営業マネージャー #インサイドセールス #コスト削減 #B2Bマーケティング #KigyouList
```

### Kịch bản 3: Kết nối chủ đề xu hướng từ X (X/Twitter Expansion - Intent Data)
```text
【Xで話題の「シグナル営業」を現場で実践するには？】🎯

「テレアポやフォーム送信の返信率が落ちてきた…」と感じていませんか？
いま成果を出している営業組織は、単なる会社名リストではなく『インテントデータ（購買・成長シグナル）』を起点に動いています。

💡 狙い目の3大シグナル：
① 採用強化の兆候（ハローワーク等の新規求人募集）
② 公的支援の獲得（助成金・補助金の採択実績）
③ 公共調達・入札の落札実績

Kigyou Listなら、これらのシグナル条件をワンクリックで掛け合わせ、今まさに投資意欲の高い企業だけにピンポイントでアプローチ可能です。

無駄な営業工数をゼロにして、成約率を最大化しましょう。
👉 無料で検索条件を試す： https://kigyoulist.com/ja/search?utm_source=facebook&utm_medium=signal_selling

#シグナル営業 #インテントデータ #リード獲得 #営業DX #法人営業 #KigyouList
```

---

## 4. Công Cụ Kỹ Thuật Thực Thi

1. **Khởi tạo và lưu phiên đăng nhập**:
   - `python c:\kigyou-list\scripts\facebook_setup_session.py`
   - Hồ sơ được lưu bền vững tại: `c:\kigyou-list\.facebook_user_profile`
2. **Lệnh xuất bản tự động**:
   - `python c:\kigyou-list\scripts\facebook_publisher.py --text "..." --image "scripts/press_releases/eyecatch_01.jpg"`
