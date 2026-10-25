import { runQuery, runGetQuery, searchCompanies, Company } from './db';
import { getPrefectureName } from './locale-mapping';

export interface LicenseHubFAQ {
  question: { ja: string; en: string; vi: string };
  answer: { ja: string; en: string; vi: string };
}

export interface LicenseHubConfig {
  slug: string;
  badge: { ja: string; en: string; vi: string };
  title: { ja: string; en: string; vi: string };
  shortName: { ja: string; en: string; vi: string };
  category: { ja: string; en: string; vi: string };
  authority: { ja: string; en: string; vi: string };
  statutoryAct: { ja: string; en: string; vi: string };
  description: { ja: string; en: string; vi: string };
  filterKey: 'has_tokutei_lic' | 'has_shigyo_lic' | 'has_real_estate_lic' | 'has_kobutsu_lic' | 'has_construction_lic' | 'has_haken_lic' | 'has_shokugyo_lic';
  licenseTypeClause: string; // for SQL matching in company_licenses
  iconColor: string;
  badgeBg: string;
  faqs: LicenseHubFAQ[];
}

export const JAPAN_PREFECTURES = [
  { code: '01', name: '北海道', region: '北海道' },
  { code: '02', name: '青森県', region: '東北' },
  { code: '03', name: '岩手県', region: '東北' },
  { code: '04', name: '宮城県', region: '東北' },
  { code: '05', name: '秋田県', region: '東北' },
  { code: '06', name: '山形県', region: '東北' },
  { code: '07', name: '福島県', region: '東北' },
  { code: '08', name: '茨城県', region: '関東' },
  { code: '09', name: '栃木県', region: '関東' },
  { code: '10', name: '群馬県', region: '関東' },
  { code: '11', name: '埼玉県', region: '関東' },
  { code: '12', name: '千葉県', region: '関東' },
  { code: '13', name: '東京都', region: '関東' },
  { code: '14', name: '神奈川県', region: '関東' },
  { code: '15', name: '新潟県', region: '中部' },
  { code: '16', name: '富山県', region: '中部' },
  { code: '17', name: '石川県', region: '中部' },
  { code: '18', name: '福井県', region: '中部' },
  { code: '19', name: '山梨県', region: '中部' },
  { code: '20', name: '長野県', region: '中部' },
  { code: '21', name: '岐阜県', region: '中部' },
  { code: '22', name: '静岡県', region: '中部' },
  { code: '23', name: '愛知県', region: '中部' },
  { code: '24', name: '三重県', region: '近畿' },
  { code: '25', name: '滋賀県', region: '近畿' },
  { code: '26', name: '京都府', region: '近畿' },
  { code: '27', name: '大阪府', region: '近畿' },
  { code: '28', name: '兵庫県', region: '近畿' },
  { code: '29', name: '奈良県', region: '近畿' },
  { code: '30', name: '和歌山県', region: '近畿' },
  { code: '31', name: '鳥取県', region: '中国' },
  { code: '32', name: '島根県', region: '中国' },
  { code: '33', name: '岡山県', region: '中国' },
  { code: '34', name: '広島県', region: '中国' },
  { code: '35', name: '山口県', region: '中国' },
  { code: '36', name: '徳島県', region: '四国' },
  { code: '37', name: '香川県', region: '四国' },
  { code: '38', name: '愛媛県', region: '四国' },
  { code: '39', name: '高知県', region: '四国' },
  { code: '40', name: '福岡県', region: '九州・沖縄' },
  { code: '41', name: '佐賀県', region: '九州・沖縄' },
  { code: '42', name: '長崎県', region: '九州・沖縄' },
  { code: '43', name: '熊本県', region: '九州・沖縄' },
  { code: '44', name: '大分県', region: '九州・沖縄' },
  { code: '45', name: '宮崎県', region: '九州・沖縄' },
  { code: '46', name: '鹿児島県', region: '九州・沖縄' },
  { code: '47', name: '沖縄県', region: '九州・沖縄' },
];

export const LICENSE_HUBS: Record<string, LicenseHubConfig> = {
  'tokutei': {
    slug: 'tokutei',
    badge: {
      ja: '出入国在留管理庁 登録機関',
      en: 'ISA Registered Support Org',
      vi: 'Cơ quan hỗ trợ Kỹ năng đặc định (ISA)'
    },
    title: {
      ja: '登録支援機関（特定技能外国人受入れ支援）企業一覧データベース',
      en: 'Registered Support Organizations for Specified Skilled Workers Directory',
      vi: 'Danh bạ Cơ quan hỗ trợ kỹ năng đặc định (登録支援機関)'
    },
    shortName: {
      ja: '登録支援機関',
      en: 'Registered Support Org',
      vi: 'Đơn vị hỗ trợ Tokutei'
    },
    category: {
      ja: '外国人人材・特定技能支援',
      en: 'Foreign Talent & Visa Support',
      vi: 'Nhân sự nước ngoài & Visa đặc định'
    },
    authority: {
      ja: '出入国在留管理庁（法務省）',
      en: 'Immigration Services Agency of Japan (MOJ)',
      vi: 'Cục Quản lý Xuất nhập cảnh & Lưu trú Nhật Bản (Bộ Tư pháp)'
    },
    statutoryAct: {
      ja: '出入国管理及び難民認定法 第19条の23',
      en: 'Immigration Control and Refugee Recognition Act Art. 19-23',
      vi: 'Luật Kiểm soát Xuất nhập cảnh & Công nhận Người tị nạn'
    },
    description: {
      ja: '出入国在留管理庁に登録された登録支援機関の全国企業データベース。特定技能外国人の受入れ支援、申請取次、対応可能言語（ベトナム語・英語・中国語・インドネシア語等）、直通電話番号、代表者名を網羅。',
      en: 'Comprehensive directory of Registered Support Organizations (RSOs) accredited by the Immigration Services Agency of Japan. Filter by prefecture and supported languages (Vietnamese, English, Chinese, etc.).',
      vi: 'Cơ sở dữ liệu các Cơ quan hỗ trợ Kỹ năng đặc định (登録支援機関) đã được Cục Xuất nhập cảnh Nhật Bản cấp phép. Bao gồm thông tin liên hệ trực tiếp, người đại diện và ngôn ngữ hỗ trợ (Tiếng Việt, Anh, Trung...).'
    },
    filterKey: 'has_tokutei_lic',
    licenseTypeClause: "license_type = '登録支援機関'",
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 border-indigo-200/80 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300',
    faqs: [
      {
        question: {
          ja: '登録支援機関とは具体的にどのような組織ですか？',
          en: 'What is a Registered Support Organization (RSO)?',
          vi: 'Cơ quan hỗ trợ kỹ năng đặc định (登録支援機関) là gì?'
        },
        answer: {
          ja: '深刻な人手不足に対応するため創設された「特定技能1号」制度において、外国人材が日本で円滑に就労・生活できるよう、受入れ機関（雇用企業）から委託を受けて事前ガイダンス、送迎、住居確保、生活オリエンテーションなどの総合支援を実施する専門機関です。出入国在留管理庁長官の登録を受ける必要があります。',
          en: 'Under the Specified Skilled Worker (SSW-1) program, an RSO is an officially accredited body contracted by host companies to provide mandatory integration support for foreign workers, including pre-arrival guidance, airport pickup, housing arrangement, and ongoing consultation.',
          vi: 'Là tổ chức chuyên môn được Cục Quản lý Xuất nhập cảnh Nhật Bản cấp phép để thay mặt doanh nghiệp tiếp nhận thực hiện các nghiệp vụ hỗ trợ toàn diện cho lao động Kỹ năng đặc định số 1 (đón sân bay, tìm nhà, làm thủ tục hành chính, hỗ trợ sinh hoạt đời sống).'
        }
      },
      {
        question: {
          ja: '登録支援機関の有効期限や更新要件は？',
          en: 'What is the validity period and renewal process?',
          vi: 'Thời hạn hiệu lực và điều kiện gia hạn giấy phép là gì?'
        },
        answer: {
          ja: '登録支援機関の登録有効期間は5年間です。満了後も業務を継続する場合は期間満了日の3か月前から更新申請を行う必要があります。過去2年間に適正な支援実績があることや、中立的な支援体制が維持されていることが要件となります。',
          en: 'The registration is valid for 5 years. Renewal applications must be submitted 3 months before expiration, subject to compliance records and impartial operational capability.',
          vi: 'Thời hạn hiệu lực của giấy phép đăng ký là 5 năm. Đơn vị cần nộp đơn gia hạn trước 3 tháng và đáp ứng đầy đủ điều kiện về kinh nghiệm hỗ trợ, không vi phạm pháp luật lao động và xuất nhập cảnh.'
        }
      },
      {
        question: {
          ja: '企業リストからベトナム語や英語の対応言語は確認できますか？',
          en: 'Can I check supported languages like Vietnamese or English?',
          vi: 'Có thể kiểm tra đơn vị có hỗ trợ Tiếng Việt hay Tiếng Anh trên danh bạ không?'
        },
        answer: {
          ja: 'はい。Kigyou-listでは、登録番号や所在地だけでなく、ベトナム語・英語・中国語・インドネシア語などの多言語対応状況を独自にデータ化して掲載しています。CSVダウンロード機能で一覧出力も可能です。',
          en: 'Yes. Kigyou-list uniquely tags supported languages (Vietnamese, English, Chinese, Indonesian, etc.) alongside contact phone numbers and executive names, with full CSV export availability.',
          vi: 'Có. Kigyou-list đã bóc tách dữ liệu chi tiết các ngôn ngữ hỗ trợ (Tiếng Việt, Tiếng Anh, Tiếng Trung, Indonesia...), kèm số điện thoại trực tiếp và họ tên người đại diện, hỗ trợ xuất file CSV tiện lợi.'
        }
      }
    ]
  },

  'shigyo': {
    slug: 'shigyo',
    badge: {
      ja: '法定専門職 登記法人',
      en: 'Statutory Professional Corps',
      vi: 'Pháp nhân Chuyên môn Luật định'
    },
    title: {
      ja: '士業・専門職法人（税理士法人・弁護士法人・社労士法人等）一覧データベース',
      en: 'Statutory Professional Corporations (Tax, Law, Labor & Accounting Corps) Directory',
      vi: 'Danh bạ Pháp nhân Kế toán, Thuế, Luật, Lao động & Sở hữu trí tuệ'
    },
    shortName: {
      ja: '士業専門職法人',
      en: 'Professional Corps',
      vi: 'Pháp nhân Kế toán & Luật'
    },
    category: {
      ja: '税務・会計・法務・労務',
      en: 'Tax, Accounting, Legal & HR',
      vi: 'Thuế vụ, Kế toán, Pháp lý & Nhân sự'
    },
    authority: {
      ja: '国税庁・法務省・厚生労働省・日本税理士会連合会・日本弁護士連合会',
      en: 'National Tax Agency, Ministry of Justice, MHLW & Professional Federations',
      vi: 'Cơ quan Thuế Quốc gia, Bộ Tư pháp & Các Liên đoàn Chuyên gia Nhật Bản'
    },
    statutoryAct: {
      ja: '税理士法、弁護士法、社会保険労務士法、行政書士法、司法書士法、公認会計士法',
      en: 'Certified Public Tax Accountant Act, Attorneys Act, Social Insurance Attorney Act, etc.',
      vi: 'Luật Thuế lý sĩ, Luật Luật sư, Luật Xã hội bảo hiểm lao động, Luật Kế toán'
    },
    description: {
      ja: '各士業法に基づき設立登記された税理士法人、弁護士法人、社会保険労務士法人、行政書士法人、司法書士法人、弁理士法人、監査法人の総合企業データベース。インボイス制度適格請求書発行事業者（T番号）と完全連携。',
      en: 'Official registry of incorporated professional practices in Japan, covering Tax Accountant Corporations, Law Firms, Labor & Social Security Attorney Corps, and Audit Corporations.',
      vi: 'Cơ sở dữ liệu các pháp nhân chuyên môn được thành lập theo luật định tại Nhật Bản (Pháp nhân Thuế lý sĩ, Pháp nhân Luật sư, Pháp nhân Lao động & BHXH, Kiểm toán độc lập). Đồng bộ hóa hóa đơn điện tử Invoice (T-Number).'
    },
    filterKey: 'has_shigyo_lic',
    licenseTypeClause: "license_category = '士業・専門職法人'",
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 border-amber-200/80 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
    faqs: [
      {
        question: {
          ja: '士業法人と個人事務所の法的な違いは何ですか？',
          en: 'What is the legal difference between a Professional Corporation and a Sole Proprietorship?',
          vi: 'Sự khác biệt giữa Pháp nhân chuyên môn (士業法人) và Văn phòng cá nhân là gì?'
        },
        answer: {
          ja: '士業法人は各士業法（税理士法、弁護士法等）に基づき登記された特別法人であり、国税庁の13桁の法人番号を保有します。個人事務所と異なり組織的な支援体制が整っており、複数拠点展開や事業承継、大規模な企業法務・税務顧問への対応力に優れています。',
          en: 'A Professional Corporation is an incorporated legal entity under statutory professional acts with a 13-digit corporate number, providing institutional continuity, branch offices, and multi-partner accountability.',
          vi: 'Pháp nhân chuyên môn (士業法人) là tổ chức được thành lập theo luật định và có Mã số doanh nghiệp 13 chữ số của Quốc thuế, sở hữu quy mô tổ chức bài bản, nhiều chi nhánh và năng lực tư vấn chuyên sâu hơn các văn phòng cá nhân nhỏ lẻ.'
        }
      },
      {
        question: {
          ja: '法人の適格請求書発行事業者（インボイス制度）登録は確認できますか？',
          en: 'Can I verify their Qualified Invoice Issuer status (T-number)?',
          vi: 'Có thể xác thực tư cách Hóa đơn hợp lệ Invoice (T-Number) của các pháp nhân này không?'
        },
        answer: {
          ja: 'はい。当データベース内の士業法人はすべて国税庁の法人番号に紐づいており、T番号（インボイス制度の適格請求書発行事業者）の公表情報と完全連携しています。',
          en: 'Yes. All professional corporations on Kigyou-list are fully verified with the National Tax Agency Invoice Issuer Registry (T-Number).',
          vi: 'Có. Tất cả các pháp nhân đều được liên kết trực tiếp với hệ thống Web-API của Quốc thuế Nhật Bản, đảm bảo 100% tình trạng hóa đơn hợp lệ (T-Number).'
        }
      }
    ]
  },

  'takken': {
    slug: 'takken',
    badge: {
      ja: '国土交通大臣・知事免許',
      en: 'MLIT Licensed Broker',
      vi: 'Giấy phép BĐS MLIT & Tỉnh trưởng'
    },
    title: {
      ja: '宅地建物取引業（不動産免許）企業一覧データベース',
      en: 'Licensed Real Estate Brokerage Companies Directory (MLIT)',
      vi: 'Danh bạ Doanh nghiệp Môi giới & Kinh doanh Bất động sản (宅建)'
    },
    shortName: {
      ja: '宅建業者',
      en: 'Real Estate Brokers',
      vi: 'Môi giới BĐS Takken'
    },
    category: {
      ja: '不動産・デベロッパー',
      en: 'Real Estate & Development',
      vi: 'Bất động sản & Môi giới'
    },
    authority: {
      ja: '国土交通省・各都道府県土木建築局',
      en: 'Ministry of Land, Infrastructure, Transport and Tourism (MLIT)',
      vi: 'Bộ Đất đai, Cơ sở hạ tầng, Giao thông & Du lịch Nhật Bản (MLIT)'
    },
    statutoryAct: {
      ja: '宅地建物取引業法 第3条',
      en: 'Real Estate Brokerage Act Art. 3',
      vi: 'Luật Kinh doanh Giao dịch Bất động sản Điều 3'
    },
    description: {
      ja: '国土交通大臣または各都道府県知事の免許を受けた宅地建物取引業者の全国企業データベース。免許証番号、更新回数（業歴の重要指標）、所在地、代表者、電話番号を網羅。',
      en: 'Comprehensive directory of licensed real estate brokerages in Japan accredited by MLIT or Prefectural Governors.',
      vi: 'Cơ sở dữ liệu toàn quốc các công ty môi giới và phát triển bất động sản sở hữu giấy phép hợp lệ từ Bộ MLIT và Tỉnh trưởng 47 tỉnh thành.'
    },
    filterKey: 'has_real_estate_lic',
    licenseTypeClause: "license_type = '宅地建物取引業'",
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
    faqs: [
      {
        question: {
          ja: '宅建免許番号のカッコ内の数字（1）や（5）は何を表していますか？',
          en: 'What does the number in parentheses, like (1) or (5), mean in a license number?',
          vi: 'Con số trong dấu ngoặc đơn (1) hay (5) trong số giấy phép BĐS có ý nghĩa gì?'
        },
        answer: {
          ja: '免許証番号の括弧内の数字は「免許の更新回数」を表します。宅建業免許の有効期間は5年間のため、（1）は新規参入（5年未満）、（5）は20年以上の業歴を持つ老舗企業であることを示し、企業の信頼性と実績を測る重要な指標となります。',
          en: 'The number in parentheses indicates the renewal count (validity is 5 years per term). (1) indicates a new company under 5 years, while (5) represents over 20 years of trusted industry tenure.',
          vi: 'Con số trong ngoặc đơn đại diện cho số lần gia hạn giấy phép (mỗi kỳ hạn là 5 năm). Số (1) nghĩa là công ty mới thành lập dưới 5 năm, trong khi số (5) thể hiện công ty có thâm niên trên 20 năm uy tín trên thị trường.'
        }
      }
    ]
  },

  'kensetsu': {
    slug: 'kensetsu',
    badge: {
      ja: '国土交通省 建設業許可',
      en: 'MLIT Construction License',
      vi: 'Giấy phép Xây dựng (MLIT)'
    },
    title: {
      ja: '建設業許可（29専門工事業種）企業一覧データベース',
      en: 'Licensed Construction Contractors Directory (MLIT 29 Trades)',
      vi: 'Danh bạ Doanh nghiệp Tổng thầu & Xây dựng (29 Ngành chuyên môn)'
    },
    shortName: {
      ja: '建設業許可業者',
      en: 'Construction Contractors',
      vi: 'Doanh nghiệp Xây dựng'
    },
    category: {
      ja: '建築・土木・設備工事',
      en: 'Construction, Civil & Engineering',
      vi: 'Xây dựng, Cầu đường & Cơ điện'
    },
    authority: {
      ja: '国土交通省・各都道府県都市整備局',
      en: 'Ministry of Land, Infrastructure, Transport and Tourism (MLIT)',
      vi: 'Bộ Đất đai, Cơ sở hạ tầng, Giao thông & Du lịch Nhật Bản (MLIT)'
    },
    statutoryAct: {
      ja: '建設業法 第3条',
      en: 'Construction Business Act Art. 3',
      vi: 'Luật Kinh doanh Xây dựng Điều 3'
    },
    description: {
      ja: '建設業法に基づく全国41万社超の建設業許可取得企業データベース。土木、建築、電気、管、塗装、内装など29の専門工事業種別許可情報を網羅。',
      en: 'Nationwide registry of over 410,000 licensed general contractors and specialized engineering firms across 29 designated construction trades.',
      vi: 'Kho dữ liệu hơn 410,000 doanh nghiệp sở hữu giấy phép xây dựng chính thức theo 29 chuyên ngành (Xây dựng tổng hợp, Điện, Cấp thoát nước, Sơn, Nội thất...).'
    },
    filterKey: 'has_construction_lic',
    licenseTypeClause: "license_type = '建設業許可'",
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-50 border-blue-200/80 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',
    faqs: [
      {
        question: {
          ja: '大臣許可と知事許可の違いは何ですか？',
          en: 'What is the difference between a Minister License and a Governor License?',
          vi: 'Sự khác biệt giữa Giấy phép do Bộ trưởng cấp và Tỉnh trưởng cấp là gì?'
        },
        answer: {
          ja: '2つ以上の都道府県に営業所を設けて営業する場合は「国土交通大臣許可」、1つの都道府県内にのみ営業所を置く場合はその「都道府県知事許可」となります。施工可能な現場の地域に制限はありません。',
          en: 'A Minister License is required for companies with branches in two or more prefectures, while a Governor License applies to firms with offices in only one prefecture.',
          vi: 'Giấy phép do Bộ trưởng MLIT cấp áp dụng cho các tổng thầu có văn phòng/chi nhánh tại từ 2 tỉnh trở lên, trong khi Giấy phép do Tỉnh trưởng cấp cho doanh nghiệp chỉ đặt trụ sở trong 1 tỉnh.'
        }
      }
    ]
  },

  'kobutsu': {
    slug: 'kobutsu',
    badge: {
      ja: '公安委員会 許可済',
      en: 'Public Safety Commission License',
      vi: 'Giấy phép Công an Tỉnh (NPA)'
    },
    title: {
      ja: '古物商許可（リユース・中古品売買・買取）企業一覧データベース',
      en: 'Licensed Secondhand Goods Dealers Directory (Public Safety Commission)',
      vi: 'Danh bạ Doanh nghiệp Kinh doanh Đồ cũ & Tái chế (古物商)'
    },
    shortName: {
      ja: '古物商許可業者',
      en: 'Secondhand Dealers',
      vi: 'Kinh doanh Đồ cũ / Tái chế'
    },
    category: {
      ja: 'リユース・リサイクル・買取',
      en: 'Reuse, Resale & Pawn',
      vi: 'Tái chế, Đồ cũ & Cầm đồ'
    },
    authority: {
      ja: '各都道府県公安委員会（警察庁所管）',
      en: 'Prefectural Public Safety Commission (National Police Agency)',
      vi: 'Ủy ban An toàn Công cộng các Tỉnh (Cơ quan Cảnh sát Quốc gia)'
    },
    statutoryAct: {
      ja: '古物営業法 第3条',
      en: 'Secondhand Articles Dealer Act Art. 3',
      vi: 'Luật Kinh doanh Cổ vật & Đồ cũ Điều 3'
    },
    description: {
      ja: '各都道府県公安委員会の許可を受けた古物商（リユース、リサイクルショップ、中古車売買、質屋、ブランド品買取）の企業一覧データベース。',
      en: 'Official registry of licensed secondhand goods traders, reuse shops, and auctioneers certified by Prefectural Police Departments.',
      vi: 'Cơ sở dữ liệu các doanh nghiệp được cấp phép kinh doanh hàng đã qua sử dụng, mua bán xe cũ, cửa hàng đồ cũ, thu mua hàng hiệu uy tín tại Nhật.'
    },
    filterKey: 'has_kobutsu_lic',
    licenseTypeClause: "license_type = '古物商許可'",
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 border-amber-200/80 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
    faqs: [
      {
        question: {
          ja: '古物商許可番号の管理体制はどうなっていますか？',
          en: 'How are secondhand dealer licenses monitored?',
          vi: 'Hệ thống quản lý giấy phép đồ cũ tại Nhật hoạt động như thế nào?'
        },
        answer: {
          ja: '古物商許可は各都道府県の公安委員会（所轄警察署）が厳格に管理しており、盗品流通の防止と迅速な被害回復を目的としています。番号は各警察署の台帳と連携しています。',
          en: 'Licenses are issued and strictly supervised by local police departments under the Public Safety Commission to prevent trade in stolen property.',
          vi: 'Giấy phép được quản lý nghiêm ngặt bởi Sở Cảnh sát từng tỉnh để ngăn ngừa hàng trộm cắp và bảo vệ quyền lợi người tiêu dùng.'
        }
      }
    ]
  },

  'haken': {
    slug: 'haken',
    badge: {
      ja: '厚生労働大臣 許可事業',
      en: 'MHLW Licensed Dispatch Agency',
      vi: 'Giấy phép Phái cử Lao động (MHLW)'
    },
    title: {
      ja: '労働者派遣事業（人材派遣・スタッフィング）企業一覧データベース',
      en: 'Licensed Worker Dispatch Agencies Directory (MHLW)',
      vi: 'Danh bạ Doanh nghiệp Phái cử Lao động & Nhân sự'
    },
    shortName: {
      ja: '労働者派遣事業',
      en: 'Worker Dispatch Agencies',
      vi: 'Phái cử lao động'
    },
    category: {
      ja: '人材派遣・アウトソーシング',
      en: 'Staffing & Outsourcing',
      vi: 'Phái cử & Thuê ngoài nhân sự'
    },
    authority: {
      ja: '厚生労働省・都道府県労働局',
      en: 'Ministry of Health, Labour and Welfare (MHLW)',
      vi: 'Bộ Y tế, Lao động & Phúc lợi Nhật Bản (MHLW)'
    },
    statutoryAct: {
      ja: '労働者派遣法 第5条',
      en: 'Worker Dispatching Act Art. 5',
      vi: 'Luật Phái cử Người lao động Điều 5'
    },
    description: {
      ja: '厚生労働大臣の許可（派マーク）を受けた適格な労働者派遣事業者の全国データベース。許可番号、所在地、代表者を網羅。',
      en: 'Directory of officially certified temporary staffing and worker dispatch agencies in Japan with valid MHLW permits.',
      vi: 'Cơ sở dữ liệu các công ty phái cử nhân lực được Bộ Lao động Nhật Bản cấp mã số giấy phép phái cử chính thức (派マーク).'
    },
    filterKey: 'has_haken_lic',
    licenseTypeClause: "license_type = '労働者派遣事業'",
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-50 border-cyan-200/80 text-cyan-700 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-300',
    faqs: [
      {
        question: {
          ja: '許可番号の「派」マークとは何ですか？',
          en: 'What does the "派" (Ha) prefix in license numbers indicate?',
          vi: 'Ký tự "派" trong số giấy phép phái cử có ý nghĩa gì?'
        },
        answer: {
          ja: '「派」マークは、厚生労働大臣が認可した正規の労働者派遣事業許可証番号（派XX-XXXXXX）の頭文字です。労働者派遣法に基づく資産要件やキャリア形成支援制度などの厳しい基準を満たした適格事業者にのみ付与されます。',
          en: 'The "派" prefix identifies a fully authorized worker dispatch agency meeting statutory net worth, training facility, and labor standard requirements.',
          vi: 'Ký tự "派" chỉ định đơn vị phái cử đã được Bộ Lao động thẩm định đạt tiêu chuẩn tài chính và năng lực đào tạo theo quy định của pháp luật.'
        }
      }
    ]
  },

  'shokugyo': {
    slug: 'shokugyo',
    badge: {
      ja: '厚生労働大臣 許可事業',
      en: 'MHLW Licensed Employment Agency',
      vi: 'Giấy phép Giới thiệu Việc làm (MHLW)'
    },
    title: {
      ja: '有料職業紹介事業（人材紹介・ヘッドハンティング）企業一覧データベース',
      en: 'Licensed Fee-Charging Employment Agencies Directory (MHLW)',
      vi: 'Danh bạ Doanh nghiệp Giới thiệu Việc làm & Headhunting'
    },
    shortName: {
      ja: '有料職業紹介事業',
      en: 'Employment Agencies',
      vi: 'Giới thiệu việc làm'
    },
    category: {
      ja: '人材紹介・エグゼクティブサーチ',
      en: 'Recruitment & Executive Search',
      vi: 'Tuyển dụng & Headhunting'
    },
    authority: {
      ja: '厚生労働省・都道府県労働局',
      en: 'Ministry of Health, Labour and Welfare (MHLW)',
      vi: 'Bộ Y tế, Lao động & Phúc lợi Nhật Bản (MHLW)'
    },
    statutoryAct: {
      ja: '職業安定法 第30条',
      en: 'Employment Security Act Art. 30',
      vi: 'Luật Ổn định Nghề nghiệp Điều 30'
    },
    description: {
      ja: '厚生労働大臣の許可（ユマーク）を受けた正規の有料職業紹介事業者（転職エージェント、人材紹介、ヘッドハンティング）の全国企業データベース。',
      en: 'Official registry of fee-charging employment placement agencies and executive search firms licensed by MHLW.',
      vi: 'Danh bạ các công ty môi giới việc làm và săn đầu người (Headhunter) được cấp phép chính thức bởi Bộ Lao động Nhật Bản (ユマーク).'
    },
    filterKey: 'has_shokugyo_lic',
    licenseTypeClause: "license_type = '有料職業紹介事業'",
    iconColor: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-50 border-teal-200/80 text-teal-700 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300',
    faqs: [
      {
        question: {
          ja: '許可番号の「ユ」マークとは何ですか？',
          en: 'What does the "ユ" (Yu) prefix signify?',
          vi: 'Ký tự "ユ" trong giấy phép có ý nghĩa gì?'
        },
        answer: {
          ja: '「ユ」マークは有料職業紹介事業の許可番号（ユXX-XXXXXX）の頭文字です。求人企業と求職者のマッチング業務を行う正規の転職エージェントであることを証明します。',
          en: 'The "ユ" prefix signifies an authorized fee-charging employment placement agency certified under the Employment Security Act.',
          vi: 'Ký tự "ユ" chứng nhận doanh nghiệp là công ty giới thiệu việc làm có thu phí hợp pháp theo Luật Ổn định Nghề nghiệp.'
        }
      }
    ]
  }
};

/**
 * Fetch total count and prefecture distribution for a given license hub
 */
export async function getLicenseHubStats(slug: string, prefCode?: string): Promise<{
  totalCount: number;
  nationalCount: number;
  prefCounts: { code: string; name: string; count: number }[];
}> {
  const config = LICENSE_HUBS[slug];
  if (!config) {
    return { totalCount: 0, nationalCount: 0, prefCounts: [] };
  }

  try {
    // 1. Get prefecture distribution
    const prefSql = `
      SELECT prefecture_code, COUNT(DISTINCT corporate_number) as cnt
      FROM company_licenses
      WHERE ${config.licenseTypeClause}
      GROUP BY prefecture_code
    `;
    const prefRows = await runQuery(prefSql, []);
    const prefMap = new Map<string, number>();
    let nationalCount = 0;

    prefRows.forEach((r: any) => {
      const code = String(r.prefecture_code || '').padStart(2, '0');
      const count = Number(r.cnt || 0);
      prefMap.set(code, count);
      nationalCount += count;
    });

    const prefCounts = JAPAN_PREFECTURES.map(p => ({
      code: p.code,
      name: p.name,
      count: prefMap.get(p.code) || 0
    })).filter(p => p.count > 0);

    const totalCount = prefCode ? (prefMap.get(prefCode) || 0) : nationalCount;

    return { totalCount, nationalCount, prefCounts };
  } catch (error) {
    console.error(`Error in getLicenseHubStats for ${slug}:`, error);
    return { totalCount: 0, nationalCount: 0, prefCounts: [] };
  }
}

/**
 * Fetch companies possessing the license with license details joined
 */
export async function getLicenseHubCompanies(
  slug: string,
  prefCode?: string,
  limit = 30,
  offset = 0
): Promise<{ companies: any[]; totalCount: number }> {
  const config = LICENSE_HUBS[slug];
  if (!config) {
    return { companies: [], totalCount: 0 };
  }

  try {
    const filters: any = {
      [config.filterKey]: true
    };
    if (prefCode) {
      filters.prefecture_code = prefCode;
    }

    const { companies, totalCount } = await searchCompanies('', filters, limit, offset);

    if (companies.length === 0) {
      return { companies: [], totalCount };
    }

    // Fetch license specifics for these companies
    const corpNumbers = companies.map(c => c.corporate_number);
    const placeholders = corpNumbers.map(() => '?').join(',');
    const licenseSql = `
      SELECT corporate_number, license_type, license_number, license_authority, specialties_json, source_url, issue_date
      FROM company_licenses
      WHERE corporate_number IN (${placeholders}) AND ${config.licenseTypeClause}
    `;

    const licenseRows = await runQuery(licenseSql, corpNumbers);
    const licenseMap = new Map<string, any>();
    licenseRows.forEach((lic: any) => {
      if (!licenseMap.has(lic.corporate_number)) {
        let parsedSpec = null;
        if (lic.specialties_json) {
          try {
            parsedSpec = typeof lic.specialties_json === 'string' ? JSON.parse(lic.specialties_json) : lic.specialties_json;
          } catch (e) {
            // ignore
          }
        }
        licenseMap.set(lic.corporate_number, {
          ...lic,
          specialties: parsedSpec
        });
      }
    });

    const enrichedCompanies = companies.map(c => ({
      ...c,
      license_detail: licenseMap.get(c.corporate_number) || null
    }));

    return { companies: enrichedCompanies, totalCount };
  } catch (error) {
    console.error(`Error in getLicenseHubCompanies for ${slug}:`, error);
    return { companies: [], totalCount: 0 };
  }
}
