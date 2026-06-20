import { createBlogPost, initBlogPostsTable, getBlogPosts, runQuery, runGetQuery } from '../lib/db';
import { getPrefectureName, getIndustryName } from '../lib/locale-mapping';

async function run() {
  console.log('--- STARTING BULK VIETNAMESE BLOG GENERATION JOB (6 POSTS) ---');
  await initBlogPostsTable();

  // 1. Fetch existing slugs to avoid collisions
  const existingRows = await getBlogPosts(1000, 0, 'vi');
  const existingSlugs = new Set(existingRows.map(r => r.slug));
  console.log('Existing Vietnamese slugs in DB:', Array.from(existingSlugs));

  const generatedSlugsInThisRun = new Set<string>();
  const postsToCreate: any[] = [];

  // 2. Loop until we have 6 unique new posts
  let postsCount = 0;
  let attempts = 0;
  const maxAttempts = 500;

  while (postsCount < 6 && attempts < maxAttempts) {
    attempts++;

    // Select a random prefecture from counts table with more than 10 companies
    const pref = await runGetQuery(`
      SELECT prefecture_code, prefecture_name 
      FROM prefecture_counts 
      WHERE company_count > 10 
      ORDER BY RANDOM() 
      LIMIT 1
    `) as { prefecture_code: string; prefecture_name: string } | null;

    // Select a random industry from m_industries (classification_level = '中分類')
    const ind = await runGetQuery(`
      SELECT industry_code, industry_name 
      FROM m_industries 
      WHERE classification_level = '中分類' 
      ORDER BY RANDOM() 
      LIMIT 1
    `) as { industry_code: string; industry_name: string } | null;

    if (!pref || !ind) continue;

    const slug = `${pref.prefecture_code}-${ind.industry_code}-companies-ranking-vi`;

    // Check if slug already exists or is generated in this run
    if (existingSlugs.has(slug) || generatedSlugsInThisRun.has(slug)) {
      continue;
    }

    // Check if we have at least 3 active companies matching this pair
    const countRes = await runGetQuery(`
      SELECT COUNT(*) as count
      FROM company_industries ci
      JOIN companies c ON ci.corporate_number = c.corporate_number
      WHERE ci.industry_code = ? AND c.prefecture_code = ? AND c.status = '活動中'
    `, [ind.industry_code, pref.prefecture_code]) as { count: number | string } | null;

    if (!countRes || Number(countRes.count) < 3) {
      continue;
    }

    const prefecture_code = pref.prefecture_code;
    const prefecture_name = pref.prefecture_name;
    const industry_code = ind.industry_code;
    const industry_name = ind.industry_name;
    const count = Number(countRes.count);

    // Map Japanese names to Vietnamese
    const prefVi = getPrefectureName(prefecture_name, 'vi');
    const indVi = getIndustryName(industry_name, 'vi');

    console.log(`[Post ${postsCount + 1}] Found Pair: ${prefecture_name} (${prefVi}) x ${industry_name} (${indVi}) (Total active: ${count}) - Slug: ${slug}`);

    // Fetch top 5 companies in this category sorted by employee_count DESC
    const companiesQuery = `
      SELECT c.corporate_number, c.company_name, c.employee_count, c.capital_amount, c.full_address, c.phone_number, c.website_url,
             c.prefecture_name, c.city_name, c.street_address, c.postal_code
      FROM companies c
      JOIN company_industries ci ON c.corporate_number = ci.corporate_number
      WHERE ci.industry_code = ? AND c.prefecture_code = ? AND c.status = '活動中'
      ORDER BY COALESCE(c.employee_count, 0) DESC, c.corporate_number ASC
      LIMIT 5
    `;
    const companies = await runQuery(companiesQuery, [industry_code, prefecture_code]) as any[];

    // Compute stats
    const avgCapitalQuery = `
      SELECT AVG(c.capital_amount) as avg_cap
      FROM companies c
      JOIN company_industries ci ON c.corporate_number = ci.corporate_number
      WHERE ci.industry_code = ? AND c.prefecture_code = ? AND c.capital_amount IS NOT NULL
    `;
    const statsRes = await runGetQuery(avgCapitalQuery, [industry_code, prefecture_code]) as { avg_cap: number | string | null } | null;
    const avgCapital = statsRes?.avg_cap ? Math.round(Number(statsRes.avg_cap)) : 0;
    const avgCapStr = avgCapital > 0 ? `¥${(avgCapital / 1000000).toLocaleString(undefined, {maximumFractionDigits: 1})} triệu JPY` : 'Đang cập nhật';

    // Distribute template selection
    const templateId = (postsCount + attempts) % 3;

    const dateStr = new Date().toISOString().slice(0, 10);

    let title = '';
    let summary = '';
    let content = '';

    const tableHeader = `| Hạng | Tên công ty | Số doanh nghiệp | Quy mô nhân sự | Vốn điều lệ | Địa chỉ đăng ký |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    let tableRows = '';
    companies.forEach((c, idx) => {
      const capStr = c.capital_amount ? `¥${(c.capital_amount).toLocaleString()} JPY` : 'Chưa công bố';
      const empStr = c.employee_count ? `${c.employee_count.toLocaleString()} nhân viên` : 'Chưa công bố';
      const address = c.full_address || 'Chưa đăng ký';
      tableRows += `| ${idx + 1} | [${c.company_name}](/vi/company/${c.corporate_number}) | \`${c.corporate_number}\` | ${empStr} | ${capStr} | ${address} |\n`;
    });

    if (templateId === 0) {
      title = `Top các công ty ${indVi} hàng đầu tại ${prefVi} | Danh bạ & Hướng dẫn kinh doanh 2026`;
      summary = `Khám phá các doanh nghiệp hoạt động hiệu quả nhất trong lĩnh vực ${indVi} tại khu vực ${prefVi}, Nhật Bản. Tìm hiểu thông tin chi tiết về quy mô nhân sự, cấu trúc vốn điều lệ và chiến lược tiếp cận bán hàng B2B hiệu quả.`;
      content = `## Giới thiệu chung

Việc xây dựng chiến lược tiếp thị và bán hàng B2B hiệu quả tại thị trường Nhật Bản đòi hỏi nguồn dữ liệu doanh nghiệp chính xác và được bản địa hóa tốt. Trong báo cáo phân tích này, chúng tôi sẽ đi sâu vào phân tích ngành **${indVi}** tại tỉnh/thành phố **${prefVi}**, dựa trên nguồn dữ liệu độc quyền từ hơn 5 triệu doanh nghiệp đang hoạt động tại Nhật Bản.

---

## 1. Tổng quan thị trường: ${indVi} tại ${prefVi}

Theo thống kê từ cơ sở dữ liệu Kigyou-list, hiện nay có khoảng **${count.toLocaleString()}** doanh nghiệp đang hoạt động trong lĩnh vực ${indVi} tại khu vực ${prefVi}.

* **Tổng số doanh nghiệp đang hoạt động:** ${count.toLocaleString()}
* **Vốn điều lệ trung bình:** ${avgCapStr}
* **Khu vực địa lý tiêu biểu:** Tỉnh ${prefVi}, Nhật Bản

---

## 2. Top 5 doanh nghiệp tiêu biểu ngành ${indVi} tại ${prefVi} (Xếp hạng theo Quy mô Nhân sự)

Dưới đây là danh sách 5 doanh nghiệp đại diện nổi bật nhất tại ${prefVi} trong lĩnh vực ${indVi}, được sắp xếp theo quy mô nhân viên nhằm phản ánh vị thế của các doanh nghiệp lớn.

${tableHeader}${tableRows}
*Lưu ý: Để xem hồ sơ doanh nghiệp đầy đủ, thông tin liên hệ chi tiết hoặc liên kết đến website trực tiếp của công ty, vui lòng nhấp vào tên công ty ở bảng trên.*

---

## 3. Chiến lược tiếp cận bán hàng B2B hiệu quả cao cho phân khúc này

Để tiếp cận thành công các doanh nghiệp Nhật Bản trong lĩnh vực ${indVi}, các phương pháp gửi email hàng loạt thiếu cá nhân hóa thường mang lại hiệu quả rất thấp. Thay vào đó, bạn nên áp dụng các hướng tiếp cận sau:

### ① Theo dõi tín hiệu tuyển dụng chủ động (HR Intent)
Các doanh nghiệp đang gia tăng nhân sự hoặc có tin tuyển dụng hoạt động tích cực thường có nhu cầu cao về công cụ quản lý quy trình, dịch vụ tuyển dụng và các giải pháp phần mềm tối ưu hiệu suất làm việc.

### ② Tận dụng chu kỳ nhận trợ cấp và ngân sách chính phủ
Tại Nhật Bản, các doanh nghiệp vừa nhận được trợ cấp giới thiệu CNTT (IT Introduction Subsidy) hoặc các khoản tài trợ sản xuất thường có sẵn ngân sách đầu tư rất lớn, giúp gia tăng tỷ lệ chuyển đổi khi bạn đề xuất giải pháp chuyển đổi số.

---

## 4. Tải xuống danh sách khách hàng tiềm năng tùy chỉnh

Danh sách xếp hạng trên đây chỉ là một phần nhỏ trong cơ sở dữ liệu khổng lồ của chúng tôi. Với Kigyou-list, bạn có thể dễ dàng xây dựng danh sách tùy chỉnh theo mã ngành JSIC, quy mô vốn, vị trí địa lý chi tiết, và các kênh liên hệ sẵn có (Email, Điện thoại, FAX).

Đăng ký ngay **[Tài khoản miễn phí](https://kigyoulist.com/vi/search)** để tìm kiếm và xuất danh sách khách hàng B2B chất lượng cao ngay hôm nay.
`;
    } else if (templateId === 1) {
      title = `Báo cáo thị trường ${indVi} tại ${prefVi} năm 2026 | Phân tích đối thủ B2B`;
      summary = `Phân tích sâu sắc về bối cảnh cạnh tranh của ngành ${indVi} tại khu vực ${prefVi}, Nhật Bản. Thông tin chi tiết về các nhà dẫn đầu thị trường và chiến lược tìm kiếm khách hàng B2B.`;
      content = `## Tóm tắt báo cáo

Đối với các doanh nghiệp quốc tế đang muốn mở rộng thị phần hoặc tìm kiếm đối tác, đại lý phân phối tại Nhật Bản, việc thấu hiểu bối cảnh cạnh tranh cấp khu vực là điều tối quan trọng. Báo cáo này cung cấp cái nhìn cấu trúc về ngành **${indVi}** tại tỉnh **${prefVi}**, nêu bật các doanh nghiệp dẫn đầu và phương pháp thu hút khách hàng B2B hiệu quả.

---

## 1. Xu hướng ngành nghề tại ${prefVi}

Dữ liệu của chúng tôi ghi nhận sự phát triển ổn định trong lĩnh vực ${indVi} tại ${prefVi}. Dưới đây là các chỉ số cơ bản quan trọng:

* **Số lượng bản ghi hoạt động:** ${count.toLocaleString()} doanh nghiệp
* **Mức vốn điều lệ trung bình:** ${avgCapStr}
* **Vai trò kinh tế:** Đóng góp đáng kể vào chuỗi cung ứng khu vực tại ${prefVi}.

---

## 2. Các doanh nghiệp dẫn đầu phân khúc (Top 5 theo Quy mô Nhân sự)

Đây là những nhà tuyển dụng lớn nhất trong phân khúc này tại địa phương, đóng vai trò là các tài khoản mục tiêu (target accounts) hoặc đối tác phân phối tiềm năng của bạn.

${tableHeader}${tableRows}
*Lưu ý: Bạn có thể truy cập hồ sơ chi tiết, bao gồm cả số điện thoại và website của từng công ty, thông qua liên kết tương ứng ở bảng trên.*

---

## 3. Chiến thuật tìm kiếm và tiếp cận người ra quyết định B2B

Khi tiếp cận các doanh nghiệp ${indVi} tại ${prefVi}:

### ① Phân khúc theo quy mô vốn
Doanh nghiệp có vốn điều lệ cao hơn mức trung bình khu vực (${avgCapStr}) thường có quy trình mua hàng và đấu thầu chặt chẽ. Ngược lại, các doanh nghiệp vừa và nhỏ (SMEs) có chu kỳ quyết định ngắn hơn, cho phép tiếp cận trực tiếp người sáng lập hoặc giám đốc đại diện.

### ② Kết hợp đa kênh liên hệ
Đảm bảo danh sách tiếp cận của bạn tích hợp nhiều kênh thông tin. Việc kết hợp thư gửi trực tiếp (Direct Mail) hoặc Fax truyền thống cùng với email và biểu mẫu liên hệ trực tuyến luôn mang lại tỷ lệ phản hồi cao nhất tại thị trường Nhật Bản.

---

## 4. Truy cập toàn bộ cơ sở dữ liệu doanh nghiệp

Tra cứu hàng triệu hồ sơ doanh nghiệp Nhật Bản trên nền tảng Kigyou-list. Lọc theo ngành nghề, khu vực, thông tin liên lạc và xuất tệp CSV nhanh chóng phục vụ cho đội ngũ bán hàng của bạn.

Bắt đầu **[Tìm kiếm doanh nghiệp miễn phí](https://kigyoulist.com/vi/search)** ngay.
`;
    } else {
      title = `Cách xây dựng danh sách khách hàng B2B ngành ${indVi} tại ${prefVi}`;
      summary = `Hướng dẫn thực tế giúp bạn xây dựng danh sách khách hàng B2B có tỷ lệ chuyển đổi cao trong ngành ${indVi} tại tỉnh ${prefVi}, sử dụng cơ sở dữ liệu doanh nghiệp Nhật Bản.`;
      content = `## Tổng quan

Một danh sách khách hàng tiềm năng chính xác và luôn cập nhật là nền tảng của mọi chiến dịch outbound sales thành công. Trong bài viết hướng dẫn này, chúng tôi sẽ chia sẻ cách phân khúc và nhắm mục tiêu các doanh nghiệp thuộc ngành **${indVi}** tại tỉnh **${prefVi}** dựa trên nguồn dữ liệu doanh nghiệp có cấu trúc.

---

## 1. Quy mô đối tượng và nhân khẩu học mục tiêu

Xác định tổng dung lượng thị trường khả dụng (TAM) giúp bạn lập kế hoạch phân bổ nguồn lực chiến dịch một cách hợp lý nhất:

* **Tổng dung lượng thị trường mục tiêu:** ${count.toLocaleString()} doanh nghiệp đang hoạt động
* **Mức vốn điều lệ trung bình:** ${avgCapStr}
* **Địa điểm trọng tâm:** Tỉnh ${prefVi}, Nhật Bản

---

## 2. Đánh giá các doanh nghiệp hàng đầu (Top 5 công ty tiêu biểu)

Việc phân tích các doanh nghiệp có quy mô lớn nhất trong ngành giúp bạn hình dung rõ ràng về quy mô hoạt động và nhu cầu của thị trường mục tiêu.

${tableHeader}${tableRows}
*Lưu ý: Nhấp vào liên kết của từng doanh nghiệp để xem chi tiết hồ sơ phân tích đầy đủ.*

---

## 3. Phương pháp phân khúc khách hàng tiềm năng tối ưu nhất

Tối đa hóa hiệu quả chiến dịch bằng cách chia nhỏ danh sách khách hàng của bạn thành các nhóm đối tượng cụ thể:

### ① Tiếp cận doanh nghiệp lớn vs. Doanh nghiệp vừa & nhỏ (SME)
Các doanh nghiệp lớn yêu cầu quy trình bán hàng dựa trên mối quan hệ lâu dài và sự đồng thuận của nhiều phòng ban (quy trình Ringi). Trong khi đó, các doanh nghiệp SME trong ngành ${indVi} phản hồi nhanh hơn với các đề xuất tiện ích sản phẩm và tối ưu chi phí tức thì.

### ② Lọc theo mức độ đầy đủ của thông tin liên hệ
Ưu tiên tiếp cận các doanh nghiệp có độ phủ thông tin cao (có đầy đủ website trực tiếp, số điện thoại và địa chỉ đăng ký rõ ràng) để tối ưu hóa thời gian thực hiện cuộc gọi hoặc gửi email chào hàng.

---

## 4. Xuất danh sách tệp CSV tùy chỉnh của bạn

Kigyou-list là công cụ đắc lực dành cho các doanh nghiệp quốc tế muốn tiếp cận thị trường Nhật Bản. Xây dựng, lưu trữ và xuất các danh sách khách hàng chất lượng cao từ cơ sở dữ liệu hơn 5 triệu doanh nghiệp.

Đăng ký **[Tài khoản miễn phí](https://kigyoulist.com/vi/search)** để trải nghiệm tìm kiếm và tải xuống danh sách tùy chỉnh ngay hôm nay.
`;
    }

    generatedSlugsInThisRun.add(slug);
    postsToCreate.push({
      slug,
      title,
      content,
      summary,
      category: `${indVi}`,
      published_at: dateStr,
      locale: 'vi'
    });
    postsCount++;
  }

  // 3. Insert into database
  for (const post of postsToCreate) {
    console.log(`Writing Vietnamese Post to database: "${post.title}"...`);
    await createBlogPost(post);
  }

  console.log(`--- BULK VIETNAMESE BLOG GENERATION SUCCESSFUL: SEEDED ${postsCount} POSTS ---`);
}

run().catch(err => {
  console.error('Failed bulk Vietnamese blog generation:', err);
  process.exit(1);
});
