# Sổ Tay Quản Lý Tài Khoản & Phương Thức Đăng Nhập Hệ Thống Backlink B2B (Kigyou-list)

Tài liệu này lưu trữ tập trung **phương thức đăng nhập, tài khoản liên kết và email sử dụng** cho toàn bộ các kênh Backlink & Nền tảng phân phối đã được khởi tạo cho dự án **Kigyou-list (kigyoulist.com)** và pháp nhân **TQC株式会社**.

*Cập nhật lần cuối: 14/11/2026*

---

## 1. Bảng Tổng Hợp Phương Thức Đăng Nhập

| Nền tảng (Platform) | DR / DA | Username / Mã Định Danh | Phương thức đăng nhập chính | Email liên kết | Ghi chú & Liên kết quản trị |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Gravatar** | **DR 94** | User: `@trungkim8694`<br>Display: `Kigyou-list \| TQC Inc.` | **1-Click Google OAuth (WordPress.com)** | `trungkim8694@gmail.com` | Profile Live: [gravatar.com/trungkim8694](https://gravatar.com/trungkim8694)<br>Admin / Editor: [gravatar.com/profile](https://gravatar.com/profile)<br>Mạng lưới nhận diện avatar & hồ sơ toàn cầu của Automattic / WordPress (DR 94). Chứa trọn bộ 3 liên kết chiến lược: Homepage (`kigyoulist.com/ja`), So sánh (`/ja/compare`), Bảng giá (`/ja/pricing`), Location Tokyo, Japan và Bio B2B chính thức. |
| **Disqus** | **DR 93** | User: `@kigyoulist`<br>Name: `Kigyou-list \| TQC Inc.` | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Profile Live: [disqus.com/by/kigyoulist/about/](https://disqus.com/by/kigyoulist/about/)<br>Settings: [disqus.com/home/settings/profile/](https://disqus.com/home/settings/profile/)<br>Chứa link trực tiếp `kigyoulist.com/ja`, Location Tokyo Japan, Bio tiếng Nhật B2B. |
| **GitBook** | **DR 88** | Org: `Kigyou-list`<br>User: `@trungkim8694-cmd` | **1-Click GitHub OAuth** | `trungkim8694@gmail.com` | Documentation Live: [kigyou-list.gitbook.io/kigyou-list-docs](https://kigyou-list.gitbook.io/kigyou-list-docs)<br>Admin Console: [app.gitbook.com](https://app.gitbook.com)<br>Trang tài liệu kỹ thuật chính thức chứa trọn bộ liên kết Homepage, Compare, Pricing, PyPI, npm và GitHub repo. |
| **Wellfound (AngelList)** | **DR 88** | Company: `kigyou-list`<br>User: `Kim Van Trung` | **1-Click Google OAuth / Password** | `trungkim8694@gmail.com`<br>Pass: `KigyouList@2026!jp` | Company Live: [wellfound.com/company/kigyou-list](https://wellfound.com/company/kigyou-list)<br>Recruiter Portal: [wellfound.com/recruit/dashboard](https://wellfound.com/recruit/dashboard)<br>Settings: [wellfound.com/company/kigyou-list/settings](https://wellfound.com/company/kigyou-list/settings)<br>Chứa link trực tiếp `kigyoulist.com/ja`, logo, trụ sở Toshima Tokyo, thị trường Data/Information Services và kết nối X, Facebook, Note. |
| **Crunchbase** | **DR 91** | Org: `kigyou-list`<br>User: `trungkim8694@gmail.com` | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Company Profile Live: [crunchbase.com/organization/kigyou-list](https://www.crunchbase.com/organization/kigyou-list)<br>Account Settings: [crunchbase.com/home](https://www.crunchbase.com/home)<br>Chứa liên kết website trực tiếp `kigyoulist.com/ja`, mô tả chi tiết, trụ sở Tokyo, industries B2B / Big Data và thông tin pháp lý TQC株式会社. |
| **npm (Node Package Manager)** | **DR 93** | User: `kigyoulist`<br>Name: `Kigyou-list \| TQC Inc.` | **Username + Password + Email OTP / Access Token** | `trungkim8694@gmail.com`<br>Pass: `KigyouList@2026!jp` | Package Live: [npmjs.com/package/kigyoulist](https://www.npmjs.com/package/kigyoulist)<br>Profile: [npmjs.com/~kigyoulist](https://www.npmjs.com/~kigyoulist)<br>Linked GitHub: `@trungkim8694-cmd`<br>Access Token: `npm_REDACTED_SECURE_TOKEN` (kigyoulist-publish) |
| **PyPI (Python Package Index)** | **DR 94** | User: `kigyoulist`<br>Name: `Kigyou-list \| TQC Inc.` | **Username + Password + TOTP 2FA** | `trungkim8694@gmail.com`<br>Pass: `KigyouList@2026!jp` | Package Live: [pypi.org/project/kigyoulist/](https://pypi.org/project/kigyoulist/)<br>Quản lý: [pypi.org/manage/projects/](https://pypi.org/manage/projects/)<br>API Token: `kigyoulist-release`<br>TOTP Secret: `FS2L3PPRZXXB7R7A3XHUBQ6ALBOWM6AP`<br>Recovery Codes: Đã lưu 7 mã dự phòng an toàn. |
| **YouTube** | **DR 99** | Channel: `@kigyoulist`<br>Name: `Kigyou-list \| 法人データベース` | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Kênh Brand: [youtube.com/@kigyoulist](https://www.youtube.com/@kigyoulist)<br>Quản trị: [studio.youtube.com](https://studio.youtube.com)<br>Header Link & Bio chứa trọn bộ anchor về kigyoulist.com/ja. |
| **Linktree** | **DR 93** | User: `kigyoulist`<br>Name: `Kigyou-list \| 法人データベース` | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Profile Hub: [linktr.ee/kigyoulist](https://linktr.ee/kigyoulist)<br>Quản trị: [linktr.ee/admin](https://linktr.ee/admin)<br>Chứa 3 liên kết chiến lược (Trang chủ, Compare, Pricing), Schema Person significantLink. |
| **Medium** | **DR 96** | User: `@kigyoulist`<br>Name: `Kigyou-list \| TQC Inc.` | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Profile: [medium.com/@kigyoulist](https://medium.com/@kigyoulist)<br>Story B2B Live: [500万社超の法人データベース『Kigyou-list』が拓く公的オープンデータ連携と次世代営業DX](https://medium.com/@kigyoulist/500%E4%B8%87%E7%A4%BE%E8%B6%85%E3%81%AE%E6%B3%95%E4%BA%BA%E3%83%87%E3%83%BC%E3%82%BF%E3%83%99%E3%83%BC%E3%82%B9-kigyou-list-%E3%81%8C%E6%8B%93%E3%81%8F%E5%85%AC%E7%9A%84%E3%82%AA%E3%83%BC%E3%83%97%E3%83%B3%E3%83%87%E3%83%BC%E3%82%BF%E9%80%A3%E6%90%BA%E3%81%A8%E6%AC%A1%E4%B8%96%E4%BB%A3%E5%96%B6%E6%A5%ADdx-fcff3446a1bc)<br>Chứa trọn bộ backlink Homepage, Compare, Pricing. |
| **Substack** | **DR 91** | User: `@kigyoulist`<br>Name: `Kigyou-list \| TQC Inc.` | **Magic Link / Google Session** | `trungkim8694@gmail.com` | Profile: [substack.com/@kigyoulist](https://substack.com/@kigyoulist)<br>Note B2B Live: [kigyou-list-note](https://substack.com/@kigyoulist/note/c-387900914)<br>Profile chứa link website, X handle và note kèm preview thẻ kigyoulist.com. |
| **Product Hunt** | **DR 91** | User: `@kigyoulist`<br>Name: `Kigyou-list \| TQC Inc.` | **1-Click GitHub OAuth** | `trungkim8694@gmail.com` | Profile: [producthunt.com/@kigyoulist](https://www.producthunt.com/@kigyoulist)<br>Profile Maker chứa liên kết Website `kigyoulist.com/ja`, liên kết X và bio hoàn chỉnh. |
| **DEV Community** | **DR 90** | User: `kigyoulist`<br>Name: `Kigyou-list \| TQC Inc.` | **1-Click GitHub OAuth** | `trungkim8694@gmail.com` | Profile: [dev.to/kigyoulist](https://dev.to/kigyoulist)<br>Technical Article Live: [Building Kigyou-list](https://dev.to/kigyoulist/building-kigyou-list-architecture-for-japans-5m-corporate-master-database-sales-dx-276g)<br>Profile chứa link website, location Tokyo và bài viết công nghệ chứa trọn bộ links. |
| **GitHub** | **DR 96** | Organization: `kigyou-list`<br>Owner: `trungkim8694-cmd` | **GitHub Account Login** | `trungkim8694@gmail.com`<br>Public: `info@kigyoulist.com` | Organization: [github.com/kigyou-list](https://github.com/kigyou-list)<br>Special Profile Repo: [kigyou-list/.github](https://github.com/kigyou-list/.github)<br>Profile README chứa 4 link Dofollow chuẩn B2B. |
| **Docker Hub** | **DR 92** | User: `trungkim`<br>Name: `Kigyou-list \| TQC Inc.` | **1-Click GitHub OAuth** | `trungkim8694@gmail.com` | Profile: [hub.docker.com/u/trungkim](https://hub.docker.com/u/trungkim)<br>Hiển thị Company TQC株式会社, link kigyoulist.com/ja. |
| **connpass** | **DR 78** | User: `kigyoulist`<br>Name: `Kigyou-list \| TQC株式会社` | **GitHub OAuth / Password** | `trungkim8694@gmail.com`<br>Pass: `KigyouList@2026!jp` | Profile: [connpass.com/user/kigyoulist/](https://connpass.com/user/kigyoulist/)<br>Đã verify email, chứa trọn bộ Hub & Spoke links. |
| **Findy Code** | **DR 72** | Display: `TQC | Kigyou-list`<br>Account: `KIM VAN TRUNG` | **1-Click GitHub OAuth** | `trungkim8694@gmail.com` | Portfolio Công khai: [findy-code.io/skills-share/IkJeEP9RzfZOQ](https://findy-code.io/skills-share/IkJeEP9RzfZOQ)<br>Chứa link trực tiếp kigyoulist.com/ja, TQC株式会社. |
| **CrowdWorks** | **DR 83** | `kigyoulist` (ID: 7330768) | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Hồ sơ: [crowdworks.jp/public/employers/7330768](https://crowdworks.jp/public/employers/7330768)<br>Đăng nhập chọn nút "Googleでログイン". |
| **Lancers** | **DR 85** | `kigyoulist` (ID: 3172901) | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Hồ sơ: [lancers.jp/client/kigyoulist](https://www.lancers.jp/client/kigyoulist)<br>Đăng nhập chọn nút "Googleでログイン". |
| **Wantedly** | **DR 88** | Admin TQC (`company_2368826`) | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Trang công ty: [wantedly.com/companies/company_2368826](https://www.wantedly.com/companies/company_2368826)<br>Đăng bài Story: [post_articles/new](https://www.wantedly.com/companies/company_2368826/post_articles/new) |
| **SlideShare / Scribd** | **DR 94** | `trungkim8694` / `TQC株式会社` | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Hồ sơ: [slideshare.net/trungkim8694](https://www.slideshare.net/trungkim8694)<br>Tài liệu Deck: [scribd.com/document/1096847166](https://www.scribd.com/document/1096847166) |
| **Speaker Deck** | **DR 92** | `kigyoulist` | **GitHub OAuth / Google OAuth** | `trungkim8694@gmail.com` | Hồ sơ: [speakerdeck.com/kigyoulist](https://speakerdeck.com/kigyoulist)<br>Slide Deck B2B: [kigyou-list-company-deck-2026](https://speakerdeck.com/kigyoulist/kigyou-list-company-deck-2026) |
| **Nicovideo** | **DR 90 / DA 93** | User: `kigyoulist`<br>ID: `145927959` | **Trình duyệt Chrome Profile / Account** | `trungkim8694@gmail.com` | Profile Live: [nicovideo.jp/user/145927959](https://www.nicovideo.jp/user/145927959)<br>Bio chứa thông tin TQC株式会社, 企業リスト.com và backlink `https://kigyoulist.com/ja`. |
| **Hatena (Bookmark & Blog)** | **DR 90 / DA 92** | User: `kigyoulist-jp`<br>Name: `kigyoulist.com` | **1-Click Google OAuth / Username + Password** | `trungkim8694@gmail.com`<br>Pass: `KigyouList@2026!jp` | Bookmark Live: [b.hatena.ne.jp/kigyoulist-jp/bookmark](https://b.hatena.ne.jp/kigyoulist-jp/bookmark)<br>Blog Domain: `kigyoulist-jp.hatenablog.com`<br>Đã ghim bookmark anchor và bio B2B chính thức trỏ về `https://kigyoulist.com/ja`. |
| **PROTOCOL.ooo** | **DR 72** | Công ty `tqc` (User ID: 62780a27...) | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Hồ sơ: [protocol.ooo/companies/tqc](https://protocol.ooo/companies/tqc) |
| **ITreview.jp** | **DR 78** | Vendor `tqc-jp` / Sản phẩm `kigyou-list` | **Google OAuth / Business Login** | `trungkim8694@gmail.com`<br>`info@kigyoulist.com` | Hồ sơ sản phẩm: [itreview.jp/products/kigyou-list](https://www.itreview.jp/products/kigyou-list) |
| **BOXIL SaaS** | **DR 76** | Đơn đăng ký Tayori Helpdesk SmartCamp | **Kênh Biên tập Form** | `info@kigyoulist.com` | Đã nộp hồ sơ niêm yết qua Helpdesk. Email xác nhận từ `helpdesk@boxil.jp`. |
| **ValuePress** | **DR 82** | Tài khoản Doanh nghiệp TQC株式会社 | **Email + Password / Google** | `info@kigyoulist.com` | Quản lý bài đăng: [value-press.com/users/articles](https://www.value-press.com/users/articles)<br>Bài PR Building đã lên lịch 16/11. |
| **Note.com** | **DR 92** | `kigyoulist` | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Blog: [note.com/kigyoulist](https://note.com/kigyoulist) |
| **Qiita** | **DR 85** | `kigyoulist` | **1-Click Google OAuth / API** | `trungkim8694@gmail.com` | Blog Kỹ thuật tự động hóa qua `QIITA_ACCESS_TOKEN`. |
| **Zenn.dev** | **DR 85** | `kigyoulist` | **1-Click Google OAuth** | `trungkim8694@gmail.com` | Kênh Blog Data Engineering B2B. |
| **Zero-Press** | **DR 58** | Tài khoản PR B2B | **Email xác nhận** | `info@kigyoulist.com` | Xuất bản 4 bài PR miễn phí. |
| **PRESSNOW** | **DR 65** | Tài khoản PR B2B | **Email xác nhận** | `info@kigyoulist.com` | Xuất bản 3 bài PR miễn phí. |
| **Tsunagugu** | **DR 45** | Tài khoản PR B2B | **Email xác nhận** | `info@kigyoulist.com` | Xuất bản 3 bài PR miễn phí. |
| **PR-FREE** | **DR 71** | Tài khoản PR B2B | **Email xác nhận** | `info@kigyoulist.com` | Xuất bản 3 bài PR miễn phí. |

---

| **Ameba Blog** | **DR 89 / DA 92** | User: kigyoulist-jp<br>Name: 企業リスト.com 公式 | **Ameba ID + Password / Google** | 	rungkim8694@gmail.com<br>Pass: KigyouList@2026!jp | Blog Live: [ameblo.jp/kigyoulist-jp](https://ameblo.jp/kigyoulist-jp/)<br>Bài viết 1st: [ameblo.jp/kigyoulist-jp/entry-12984975094.html](https://ameblo.jp/kigyoulist-jp/entry-12984975094.html)<br>Blog chính thức đăng tải cẩm nang B2B & backlink kigyoulist.com/ja. |

| **GitHub Pages** | **DR 94 / DA 96** | Repo: 	rungkim8694-cmd/kigyou-list-docs | **GitHub Account (Owner: trungkim8694-cmd)** | 	rungkim8694@gmail.com | Docs Live: [trungkim8694-cmd.github.io/kigyou-list-docs/](https://trungkim8694-cmd.github.io/kigyou-list-docs/)<br>Repo: [github.com/trungkim8694-cmd/kigyou-list-docs](https://github.com/trungkim8694-cmd/kigyou-list-docs)<br>Cổng tài liệu kỹ thuật API 500万社, chứa trọn bộ Deep Links Homepage, Search, Compare, Pricing. |

| **Livedoor** | **DR 90 / DA 92** | User: kigyoulist<br>Display: kigyoulist.com 公式 | **Livedoor ID + Password** | info@kigyoulist.com<br>Pass: KigyouList_2026#jp | Profile CMS: [livedoor.blogcms.jp/member/profile/edit](https://livedoor.blogcms.jp/member/profile/edit)<br>Đã cập nhật Bio giới thiệu chính thức kigyoulist.com & link https://kigyoulist.com/ja. |

| **FC2 (ID & Blog)** | **DR 88 / DA 91** | User: FC2USER927426JBF<br>Nickname: kigyoulist公式 | **Email + Password** | info@kigyoulist.com<br>Pass: KigyouList2026jp<br>Bảo mật: kigyoulist | CMS: [secure.id.fc2.com](https://secure.id.fc2.com/)<br>Đã hoàn tất hồ sơ Tokyo IT. Chờ giãn cách IP FC2 để thêm FC2 Blog kigyoulist.blog.fc2.com. |
| **Dealroom.co** | **DR 82 / DA 75** | Company: kigyoulist_com | **Email + Link Auth** | 	rung@kigyoulist.com | Company Live: [app.dealroom.co/companies/kigyoulist_com](https://app.dealroom.co/companies/kigyoulist_com)<br>Hồ sơ công ty SaaS/B2B Intelligence của TQC Inc., liên kết DoFollow website https://kigyoulist.com/ja, Social X (@kigyoulist), LinkedIn (tqc-inc), Note.com và Deep Links Product /ja/search, /ja/pricing. |
| **Tumblr** | **DR 92 / DA 98** | User: kigyoulist | **Email + Password** | info@kigyoulist.com<br>Pass: TQC_Japan#2026!PlatformDB | Blog Live: [kigyoulist.tumblr.com](https://kigyoulist.tumblr.com/)<br>Bài viết 1st: [kigyoulist.tumblr.com/post/833692725331279872 (Verified 100%)](https://kigyoulist.tumblr.com/post/833692725331279872 (Verified 100%))<br>Nền tảng Web 2.0 DoFollow hàng đầu thế giới (DA 98). Đã cắm backlink DoFollow trỏ về https://kigyoulist.com/ja. |
| **Peraichi (ペライチ)** | **DR 85 / DA 88** | User: 	rungkim8694@gmail.com<br>Subdomain: kigyoulist | **Email + Password** | 	rungkim8694@gmail.com<br>Pass: KigyouList@2026!jp | Landing Page Live: [kigyoulist.hp.peraichi.com/](https://kigyoulist.hp.peraichi.com/)<br>Admin Editor: [peraichiapp.com/landing_pages/edit/2487276](https://peraichiapp.com/landing_pages/edit/2487276)<br>Trang giới thiệu doanh nghiệp & giải pháp 500万社, liên kết DoFollow trực tiếp về https://kigyoulist.com/ja. |
| **Nihon Blog Mura** | **DR 89 / DA 91** | User: kigyoulist<br>Member ID: 11219840 | **Email + Password** | info@kigyoulist.com<br>Pass: KigyouList@2026!jp | Profile Live: [blogmura.com/profiles/11219840/](https://blogmura.com/profiles/11219840/?p_cid=11219840)<br>Cổng Blog & Directory lớn nhất Nhật Bản. Đã đăng ký blog chính thức & trỏ link https://kigyoulist.com/ja. |
| **JUGEM Blog** | **DR 83 / DA 86** | User: kigyoulist | **Email + Password** | info@kigyoulist.com<br>Pass: kigyoulist26 | Blog Live: [kigyoulist.jugem.jp](https://kigyoulist.jugem.jp/)<br>CMS: [kigyoulist.jugem.jp/manage/](https://kigyoulist.jugem.jp/manage/)<br>Đã tạo thành công & xác thực SMS. Đang chờ CloudFront cập nhật quyền POST để đăng bài DoFollow. |
| **Popular Blog Ranking (with2)** | **DR 84 / DA 88** | User: kigyoulist<br>Member ID: 2143517 | **Email + Password** | info@kigyoulist.com<br>Pass: KigyouList2026jp | Profile Live: [blog.with2.net/blog/2143517](https://blog.with2.net/blog/2143517)<br>Cổng xếp hạng blog uy tín lâu đời số 2 Nhật Bản. Đã niêm yết blog & trỏ link DoFollow https://kigyoulist.com/ja. |
| **Google Blogger** | **DR 94 / DA 99** | User: kigyoulist.com 公式<br>Domain: kigyoulist.blogspot.com | **1-Click Google Account** | 	rungkim8694@gmail.com | Blog Live: [kigyoulist.blogspot.com](https://kigyoulist.blogspot.com/)<br>Bài viết 1st: [kigyoulist.blogspot.com/2026/11/500kigyoulistcomblogger.html](https://kigyoulist.blogspot.com/2026/11/500kigyoulistcomblogger.html)<br>Nền tảng blog chính chủ của Google (DA 99). Chứa trọn bộ 6 liên kết DoFollow trỏ về Homepage & 5 Data Hubs cốt lõi. |
## 2. Quy Tắc Ghi Nhớ Khi Cần Đăng Nhập Lại

1. **Các nền tảng Quốc tế & Tech / Crowdsourcing (CrowdWorks, Lancers, Wantedly, Speaker Deck, PROTOCOL, Note, Qiita, Zenn):**
   * 👉 **Luôn chọn nút:** `Googleでログイン` (Sign in with Google).
   * 👉 **Tài khoản Google:** `trungkim8694@gmail.com`.
   * *Ưu điểm:* 1-click vào thẳng ngay lập tức, không bao giờ bị quên mật khẩu hay trễ mã OTP.

2. **Các cổng Báo chí & Thông cáo (ValuePress, BOXIL, Zero-Press, PRESSNOW, Tsunagugu, PR-FREE):**
   * 👉 **Luôn sử dụng Email công ty:** `info@kigyoulist.com`.
   * 👉 Thông báo duyệt bài, thông báo niêm yết sẽ được gửi thẳng về hộp thư của domain `kigyoulist.com`.

| **Seesaa Blog** | **DR 84** | Host: kigyoulist \| ?????.com | **Email + Session** | 	rungkim8694@gmail.com | Blog Live: [kigyoulist.seesaa.blog](https://kigyoulist.seesaa.blog)<br>CMS: [blog.seesaa.jp/cms/home/index](https://blog.seesaa.jp/cms/home/index)<br>Blog doanh nghi?p B2B chia s? d? li?u php nhn & backlink. |

- Bi vi?t Pillar Live: [kigyoulist.seesaa.blog/article/522063505.html](https://kigyoulist.seesaa.blog/article/522063505.html)
- Bi vi?t Hubs Pillar Live: [kigyoulist.seesaa.blog/article/522063525.html](https://kigyoulist.seesaa.blog/article/522063525.html)
- Bi vi?t Financial & Ranking Hub Live: [kigyoulist.seesaa.blog/article/522063588.html](https://kigyoulist.seesaa.blog/article/522063588.html)

| **Ameba Blog** | **DR 92** | User: kigyoulist-jp | **Cookie / Session** | 	rungkim8694@gmail.com | Blog Live: [ameblo.jp/kigyoulist-jp](https://ameblo.jp/kigyoulist-jp/)<br>Bi vi?t Data Hubs Live: [ameblo.jp/kigyoulist-jp/entry-12984977811.html](https://ameblo.jp/kigyoulist-jp/entry-12984977811.html)<br>Qu?n l: [blog.ameba.jp/ucs/top.do](https://blog.ameba.jp/ucs/top.do)<br>Knh Web 2.0 authority ko bot Google co 5 ?i Hubs kigyoulist.com. |

---

## 📌 VIỆC CẦN LÀM TIẾP THEO & BỐI CẢNH TRIỂN KHAI (PENDING ACTIONS & CONTEXT)

1. **JUGEM Blog (https://kigyoulist.jugem.jp/)**:
   - **Tài khoản**: info@kigyoulist.com / Pass: kigyoulist26 / ID: kigyoulist
   - **Bối cảnh & Trạng thái**: Đã đăng ký thành công và hoàn tất xác thực SMS (OTP: 9704). Blog đã online 200 OK.
   - **Lý do chờ**: CloudFront CDN của JUGEM đang phân phối quyền ghi (POST) cho subdomain mới (403 Cachable requests only).
   - **Hành động cần nhắc**: Sau 30-60 phút, truy cập https://kigyoulist.jugem.jp/manage/?mode=write&view=simple để xuất bản bài viết mở màn 国内500万社オープンデータ基盤「kigyoulist.com」公式JUGEMブログを開設しました kèm DoFollow link https://kigyoulist.com/ja.

2. **FC2 Blog (kigyoulist.blog.fc2.com)**:
   - **Tài khoản**: info@kigyoulist.com / Pass: KigyouList2026jp
   - **Bối cảnh & Trạng thái**: Đã đăng ký FC2 ID thành công (Member ID: FC2USER927426JBF), hoàn tất profile với Nickname kigyoulist公式 (Khu vực Tokyo IT).
   - **Lý do chờ**: Bị giới hạn IP rate limit của FC2 đối với tài khoản mới đăng ký.
   - **Hành động cần nhắc**: Sau thời gian giãn cách IP (cool-down), vào https://secure.id.fc2.com/add.php bấm 'Thêm dịch vụ FC2ブログ', đặt Blog ID kigyoulist và tiêu đề 【公式】kigyoulist.com｜国内500万社法人データベース để đăng bài DoFollow.

3. **Livedoor Blog (https://kigyoulist.livedoor.blog/)**:
   - **Tài khoản**: info@kigyoulist.com / Pass: KigyouList_2026#jp
   - **Bối cảnh & Trạng thái**: Đã đăng ký Livedoor ID kigyoulist, kích hoạt email và hoàn tất profile chính thức kigyoulist.com 公式.
   - **Lý do chờ**: Livedoor chặn tạo blog từ dải IP ngoài Nhật Bản.
   - **Hành động cần nhắc**: Khi bật VPN IP Nhật Bản, truy cập https://livedoor.blogcms.jp/member/blog/create bấm 'Tạo blog' để kích hoạt blog và bài viết DoFollow.

4. **Hatena Blog (kigyoulist-jp.hatenablog.com)**:
   - **Tài khoản**: 	rungkim8694@gmail.com / Pass: KigyouList@2026!jp / ID: kigyoulist-jp
   - **Bối cảnh & Trạng thái**: Đã tạo tài khoản Hatena và ghim Backlink trên Hatena Bookmark (.hatena.ne.jp/kigyoulist-jp/bookmark).
   - **Hành động cần nhắc**: Mở tab https://blog.hatena.ne.jp/register tích chọn reCAPTCHA và bấm 'Tạo blog' để kích hoạt Hatena Blog.
