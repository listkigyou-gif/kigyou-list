// frontend/src/lib/guides.ts
// B2B Knowledge & Sales Guide Registry for Kigyou-list (kigyoulist.com)

export interface GuideTOCItem {
  id: string;
  title: string;
  level: number;
}

export interface GuideFAQ {
  question: string;
  answer: string;
}

export interface GuideArticle {
  slug: string;
  category: 'ai-sales' | 'sales-list' | 'form-marketing' | 'credit-risk' | 'corporate-analysis';
  categoryLabel: {
    ja: string;
    en: string;
    vi: string;
  };
  title: {
    ja: string;
    en: string;
    vi: string;
  };
  metaDescription: {
    ja: string;
    en: string;
    vi: string;
  };
  keywords: string[];
  publishedAt: string;
  updatedAt: string;
  readTimeMinutes: number;
  featured?: boolean;
  author: {
    name: string;
    role: string;
  };
  tableOfContents: GuideTOCItem[];
  faqs: GuideFAQ[];
  // Summary highlights for the header
  highlights: {
    ja: string[];
    en: string[];
    vi: string[];
  };
  // CTA Target configuration
  cta: {
    title: { ja: string; en: string; vi: string };
    desc: { ja: string; en: string; vi: string };
    buttonText: { ja: string; en: string; vi: string };
    href: string;
  };
}

export const GUIDE_CATEGORIES = [
  { id: 'all', label: { ja: 'すべて', en: 'All', vi: 'Tất cả' } },
  { id: 'ai-sales', label: { ja: 'AI営業・ChatGPT活用', en: 'AI Sales & Prompts', vi: 'AI & ChatGPT Sales' } },
  { id: 'sales-list', label: { ja: '営業リスト作成・Excel', en: 'Sales Lists & Excel', vi: 'Danh sách bán hàng & Excel' } },
  { id: 'form-marketing', label: { ja: 'フォーム営業・自動化', en: 'Form Outreach', vi: 'Gửi Form tự động' } },
  { id: 'credit-risk', label: { ja: '与信管理・倒産調査', en: 'Credit Due Diligence', vi: 'Thẩm định & Rủi ro phá sản' } },
  { id: 'corporate-analysis', label: { ja: '有報・企業分析', en: 'Securities & Analysis', vi: 'Phân tích Báo cáo tài chính' } },
] as const;

export const GUIDE_ARTICLES: GuideArticle[] = [
  // =========================================================================
  // BÀI 1: ChatGPT・Claudeで作成する営業リスト活用ガイド
  // =========================================================================
  {
    slug: 'ai-sales-list',
    category: 'ai-sales',
    categoryLabel: {
      ja: 'AI営業・ChatGPT活用',
      en: 'AI Sales & Prompts',
      vi: 'AI & ChatGPT Sales'
    },
    title: {
      ja: '【2026年最新】ChatGPT・Claudeで作成する営業リスト活用ガイド｜500万社DB連携で精度最大化',
      en: '2026 Guide: Building High-Precision B2B Sales Lists with ChatGPT & Claude | 5M Corporate DB Integration',
      vi: 'Hướng dẫn tạo Danh sách Bán hàng B2B bằng ChatGPT & Claude 2026 | Tích hợp CSDL 5 triệu Doanh nghiệp'
    },
    metaDescription: {
      ja: 'ChatGPTやClaudeを活用した高精度な営業リスト作成手順とプロンプト集を公開。AIのハルシネーション（虚偽データ）を完全回避し、全国500万社の正規法人データベース（国税庁準拠・フォームURL・求人シグナル）を掛け合わせた成約率最大化のB2B営業手法を徹底解説。',
      en: 'Master B2B sales prospecting with ChatGPT and Claude. Prevent AI hallucinations by anchoring with verified corporate registries across 5M+ Japanese firms, contact forms, and hiring signals.',
      vi: 'Quy trình tạo danh sách khách hàng B2B bằng ChatGPT và Claude. Khắc phục hoàn toàn ảo giác AI nhờ kết hợp cơ sở dữ liệu 5 triệu doanh nghiệp Nhật Bản chuẩn Quốc thuế.'
    },
    keywords: [
      'ChatGPT 営業リスト',
      'Claude 営業リスト',
      'AI 営業リスト 作成',
      '営業リスト プロンプト',
      '企業リスト ai 活用',
      'B2B 営業 自動化'
    ],
    publishedAt: '2026-11-01',
    updatedAt: '2026-11-02',
    readTimeMinutes: 7,
    featured: true,
    author: {
      name: 'Kigyou-list データ戦略チーム',
      role: 'B2Bデータアナリスト & AIプロンプトエンジニア'
    },
    highlights: {
      ja: [
        '生成AI単体で企業リストを作ると約70%以上の確率で架空の社名や無効なURLが生成される（ハルシネーション問題）',
        '「公式一次データ（国税庁法人番号・資本金・公式URL）＋ AIプロンプト分析」の2層構造が唯一の正解',
        'コピペで即戦力になる「ターゲット抽出プロンプト」および「パーソナライズ文面生成プロンプト」を無料公開',
        '月50社まで無料出力可能なKigyou-listデータベースとの連携フロー'
      ],
      en: [
        'Standalone generative AI generates hallucinated company names and invalid URLs over 70% of the time',
        'Two-layer workflow: Official Primary Data (NTA registry) + AI Semantic Analysis is the only reliable path',
        'Copy-paste ready B2B targeting and personalized outreach prompts included',
        'Step-by-step integration with Kigyou-list 5M corporate database'
      ],
      vi: [
        'AI tạo sinh độc lập có xác suất tạo dữ liệu ảo (hallucination) hơn 70% nếu không có dữ liệu gốc đối soát',
        'Mô hình chuẩn: Dữ liệu công quyền (Mã số thuế, vốn, website) + Phân tích ngữ cảnh AI',
        'Bộ prompt mẫu sao chép dùng ngay để lọc tệp khách hàng và viết thư ngỏ cá nhân hóa',
        'Kết nối dữ liệu thực tế từ 5 triệu doanh nghiệp Kigyou-list'
      ]
    },
    tableOfContents: [
      { id: 'problem-hallucination', title: '1. なぜChatGPT単体での営業リスト作成は失敗するのか？', level: 2 },
      { id: 'two-tier-architecture', title: '2. 成功する「一次データ × 生成AI」の2層アーキテクチャ', level: 2 },
      { id: 'prompts-targeting', title: '3. 【実践】即戦力プロンプト集（ターゲティング＆文面自動生成）', level: 2 },
      { id: 'integration-steps', title: '4. Kigyou-list 500万社DBとの具体的な連携ステップ', level: 2 },
      { id: 'faq-section', title: '5. よくある質問（FAQ）', level: 2 }
    ],
    faqs: [
      {
        question: 'ChatGPTに「東京都のIT企業一覧を出して」と依頼するとどうなりますか？',
        answer: 'ChatGPTの学習データは過去のものであり、また最新の法人登記データと直結していないため、実在しない企業名や閉鎖済み法人、間違った電話番号を高確率で出力します。必ずKigyou-list等の公式一次データから企業名・法人番号・URLを取得した上で、AIには「文面作成やセグメント分類」を担当させるのが鉄則です。'
      },
      {
        question: 'Claude CodeやCursorなど最新コーディングAIでも活用できますか？',
        answer: 'はい。Kigyou-listからダウンロードしたCSVファイル（UTF-8）をClaude CodeやCursor、ChatGPT Advanced Data Analysisに読み込ませることで、従業員数や資本金、求人シグナルに応じた瞬時のクラスタリングが可能です。'
      },
      {
        question: '商用利用にあたって著作権や規約上の問題はありませんか？',
        answer: 'Kigyou-listのデータは国税庁法人番号公表サイトおよび各公的オープンデータを正規に集約・構造化したものであり、営業活動や市場分析への利用は完全に適法です。'
      }
    ],
    cta: {
      title: {
        ja: '高確度な企業リストを今すぐ無料作成',
        en: 'Create High-Precision Sales Lists for Free',
        vi: 'Tạo danh sách khách hàng doanh nghiệp miễn phí'
      },
      desc: {
        ja: '全国500万社の正規法人データベースから、業界・地域・求人シグナルで絞り込み。毎月50社まで無料ダウンロード可能。',
        en: 'Filter 5M verified Japanese corporations by industry, location, and hiring signals. Free monthly CSV exports.',
        vi: 'Lọc 5 triệu doanh nghiệp Nhật Bản theo ngành, địa bàn và tín hiệu tuyển dụng. Tải miễn phí 50 công ty mỗi tháng.'
      },
      buttonText: {
        ja: '企業データベースを無料検索する',
        en: 'Explore Database Now',
        vi: 'Tra cứu CSDL Miễn phí'
      },
      href: '/ja/search'
    }
  },

  // =========================================================================
  // BÀI 2: Excelで完結する高確度な営業リストの作り方
  // =========================================================================
  {
    slug: 'excel-sales-list-template',
    category: 'sales-list',
    categoryLabel: {
      ja: '営業リスト作成・Excel',
      en: 'Sales Lists & Excel',
      vi: 'Danh sách bán hàng & Excel'
    },
    title: {
      ja: '【無料テンプレート付】Excelで完結する高確度な営業リストの作り方｜項目設計と500万社DB活用法',
      en: 'Free Excel Template: How to Build High-Converting B2B Sales Lists in Excel | Essential Data Columns & 5M DB',
      vi: 'Hướng dẫn lập Danh sách Bán hàng bằng Excel kèm Mẫu Template Miễn phí | Thiết kế Cột Dữ liệu & CSDL 5M'
    },
    metaDescription: {
      ja: '営業リストをExcelやスプレッドシートで自作する際の必須項目設計（法人番号・代表者・TEL・問い合わせフォームURL）と重複排除のノウハウを徹底解説。営業成果を最大化する無料Excelテンプレートを配布中。Kigyou-listの500万社データ連携でリスト作成時間を90%削減。',
      en: 'Complete guide to building effective B2B sales lists in Excel. Standardize essential data columns, deduplicate records, and access our free Excel sales template powered by Kigyou-list.',
      vi: 'Cẩm nang thiết kế danh sách khách hàng B2B bằng Excel: các trường dữ liệu bắt buộc (mã pháp nhân, người đại diện, SĐT, Form URL) và phương pháp loại bỏ dữ liệu trùng lặp.'
    },
    keywords: [
      '営業リスト エクセル 無料',
      '企業リスト テンプレート',
      '営業リスト 作り方',
      '営業リスト 項目',
      'Excel 企業リスト 管理',
      '顧客リスト 作成 手順'
    ],
    publishedAt: '2026-11-01',
    updatedAt: '2026-11-02',
    readTimeMinutes: 6,
    featured: true,
    author: {
      name: 'Kigyou-list 営業DX推進部',
      role: 'シニアセールスオペレーションマネージャー'
    },
    highlights: {
      ja: [
        '売れない営業リストに共通する「電話番号だけ」「代表者名なし」「更新日時不明」の3大欠陥',
        'プロが設計する必須10項目（法人番号、商号、所在地、代表者、直通TEL、代表Mail、フォームURL、資本金、従業員数、営業ステータス）',
        'COUNTIF関数とXLOOKUPを活用した重複排除＆ブラックリスト自動突合テクニック',
        'Kigyou-listからCSVエクスポートしてそのまま貼れる標準互換フォーマット'
      ],
      en: [
        'The 3 fatal flaws of bad sales lists: phone-only, missing CEO names, and outdated timestamps',
        'The 10 essential data columns for high B2B response rates',
        'Deduplication and suppression matching formulas using COUNTIF and XLOOKUP',
        '100% compatible export format with Kigyou-list database'
      ],
      vi: [
        '3 sai lầm chí mạng khiến danh sách bán hàng không ra đơn: chỉ có SĐT, thiếu tên đại diện, dữ liệu lỗi thời',
        '10 trường dữ liệu cốt lõi giúp tăng tỷ lệ phản hồi B2B lên gấp 3 lần',
        'Kỹ thuật lọc trùng lặp và loại trừ khách hàng cũ bằng hàm COUNTIF và XLOOKUP',
        'Tương thích hoàn toàn với file xuất CSV của Kigyou-list'
      ]
    },
    tableOfContents: [
      { id: 'flaws-of-bad-lists', title: '1. 成果が出ない営業リストの3大原因', level: 2 },
      { id: 'essential-10-columns', title: '2. B2B営業を成功に導く「必須10項目」の設計基準', level: 2 },
      { id: 'excel-formulas-dedup', title: '3. 重複・過去接触企業を瞬時に排除するExcel実用テクニック', level: 2 },
      { id: 'kigyoulist-export-flow', title: '4. Kigyou-listを活用して最短5分でリストを完成させる方法', level: 2 },
      { id: 'faq-excel', title: '5. よくある質問（FAQ）', level: 2 }
    ],
    faqs: [
      {
        question: '手動でWeb検索して企業を集めるのと、データベースから出力する違いは何ですか？',
        answer: '手動検索の場合、1社の基本情報・電話番号・代表者名を調べるのに平均3〜5分かかり、100社集めるのに半日以上消費します。Kigyou-listを使えば、地域や業界、資本金規模を指定してワンクリックで100〜1,000社の正規リストを数秒でCSV一括出力できます。'
      },
      {
        question: 'ダウンロードしたCSVがExcelで文字化けする場合はどうすればよいですか？',
        answer: 'Kigyou-listのCSVは国際標準のUTF-8（BOM付き）で出力されているため、最新のMicrosoft Excelではそのままダブルクリックで文字化けせず開くことができます。万が一古いバージョン等で崩れる場合は、「データ」タブ→「テキストまたはCSVから」を選択して読み込んでください。'
      }
    ],
    cta: {
      title: {
        ja: 'Excel用 企業リストCSVを今すぐ出力',
        en: 'Export Excel-Ready Corporate Lists Now',
        vi: 'Xuất danh sách công ty chuẩn Excel ngay'
      },
      desc: {
        ja: '業種・地域・資本金や「フォームURLあり」企業をピンポイント抽出。Excelにそのまま取り込める形式でダウンロード。',
        en: 'Extract companies with verified contact forms, capital, and executives. Ready for immediate Excel import.',
        vi: 'Lọc doanh nghiệp có Form liên hệ, vốn điều lệ và ban lãnh đạo. Tải về định dạng chuẩn mở ngay bằng Excel.'
      },
      buttonText: {
        ja: '条件を指定して企業を探す',
        en: 'Search Companies Now',
        vi: 'Tìm kiếm doanh nghiệp ngay'
      },
      href: '/ja/search'
    }
  },

  // =========================================================================
  // BÀI 3: 問い合わせフォーム営業の返信率を3倍にする文面テンプレートと注意点
  // =========================================================================
  {
    slug: 'form-marketing-tips',
    category: 'form-marketing',
    categoryLabel: {
      ja: 'フォーム営業・自動化',
      en: 'Form Outreach',
      vi: 'Gửi Form tự động'
    },
    title: {
      ja: '問い合わせフォーム営業の返信率を3倍にする文面テンプレートと注意点｜特定電子メール法・NG回避ガイド',
      en: 'Triple Your Contact Form Outreach Reply Rates: B2B Copy Templates & Legal Compliance Guide (Japan Anti-Spam Act)',
      vi: 'Bí quyết Tăng gấp 3 lần Tỷ lệ Phản hồi khi Gửi Form Doanh nghiệp | Mẫu Thư ngỏ B2B & Tuân thủ Luật pháp Nhật Bản'
    },
    metaDescription: {
      ja: 'テレアポや迷惑メールと一線を画す「Web問い合わせフォーム営業（Form DM）」の成功ノウハウを公開。決裁権者の目に留まる件名・本文テンプレート、特定電子メール法や景品表示法の遵守ポイント、「営業お断り」サイトの安全な除外手法を徹底解説します。',
      en: 'Proven strategies for B2B contact form outreach in Japan. Includes battle-tested copy templates that reach decision-makers, legal compliance tips (Anti-Spam Act), and automated disclaimer screening.',
      vi: 'Chiến lược tiếp cận khách hàng qua Form website (Form DM). Mẫu thư ngỏ được kiểm chứng giúp tiếp cận trực tiếp cấp lãnh đạo, hướng dẫn tuân thủ luật chống thư rác của Nhật Bản.'
    },
    keywords: [
      'フォーム営業 コツ',
      '問い合わせフォーム 営業 例文',
      'フォーム営業 違法性',
      'フォームDM 返信率',
      '特定電子メール法 問い合わせフォーム',
      '新規開拓 営業 文面'
    ],
    publishedAt: '2026-11-01',
    updatedAt: '2026-11-02',
    readTimeMinutes: 8,
    featured: true,
    author: {
      name: 'Kigyou-list マーケティング法務監修チーム',
      role: 'B2Bアウトバウンド統括ディレクター'
    },
    highlights: {
      ja: [
        'なぜメール営業（開封率0.1〜0.5%）より問い合わせフォーム（到達・開封率50〜90%）が圧倒的に勝るのか',
        '【法律解説】問い合わせフォーム営業は「特定電子メール法」の対象か？弁護士見解と安全な配信ガイドライン',
        '決裁者の心を動かす「メリットファースト型」文面テンプレート3選（コスト削減／売上拡大／業務効率化）',
        'クレームをゼロにする「営業お断り文言検知」と配信停止（オプトアウト）の明記ルール'
      ],
      en: [
        'Why contact forms (50-90% read rate) vastly outperform cold emails (0.1-0.5% open rate)',
        'Legal analysis: Does the Japan Anti-Spam Act apply to web forms? Safe practices and disclaimer handling',
        '3 high-converting B2B outreach copy templates (Cost reduction, Revenue growth, Operational efficiency)',
        'Zero-complaint framework: automated disclaimer detection and opt-out transparency'
      ],
      vi: [
        'Vì sao gửi Form (tỷ lệ mở 50-90%) hiệu quả vượt trội so với Cold Email (tỷ lệ mở 0.1-0.5%)',
        'Phân tích pháp lý: Luật gửi email thương mại Nhật Bản và hướng dẫn gửi an toàn không bị phạt',
        '3 mẫu thư ngỏ B2B tỷ lệ chuyển đổi cao nhất: Giảm chi phí, Tăng doanh thu, Tối ưu vận hành',
        'Quy tắc tránh khiếu nại: Tự động loại bỏ website cấm quảng cáo và minh bạch thông tin rút lui (Opt-out)'
      ]
    },
    tableOfContents: [
      { id: 'channel-comparison', title: '1. テレアポ・メール・フォーム営業の費用対効果を徹底比較', level: 2 },
      { id: 'legal-compliance', title: '2. フォーム営業の適法性と守るべき法的ルール（特定電子メール法）', level: 2 },
      { id: 'templates-section', title: '3. 【実例公開】決裁権者から返信が届く文面テンプレート3選', level: 2 },
      { id: 'ng-filter-safety', title: '4. クレームを防ぐ「営業お断り」サイトの除外と安全な自動化', level: 2 },
      { id: 'faq-form-dm', title: '5. よくある質問（FAQ）', level: 2 }
    ],
    faqs: [
      {
        question: '問い合わせフォームへの営業送信は違法ですか？',
        answer: '特定電子メール法は主に電子メールアドレス宛ての送信を規制しており、Web上の問い合わせフォームへの入力は同法の直接の規制対象外と解釈されるのが一般的です。ただし、サイト上に「セールス・勧誘の一切をお断りします」と明記されている企業への送信は、クレームや業務妨害トラブルの原因となるため送信を控えるのが鉄則です。Kigyou-listの自動配信システムはこうしたNG文言を自動検知して除外します。'
      },
      {
        question: '返信率はどれくらい期待できますか？',
        answer: 'ターゲット企業の選定精度と文面によりますが、一般的なフォーム営業の返信率は0.3%〜1.5%程度です。業界特化のオファーや具体的な導入効果を提示することで、2.0%〜3.0%以上の返信率を獲得する事例も多数あります。'
      }
    ],
    cta: {
      title: {
        ja: '事前法令審査付き フォーム自動営業を開始',
        en: 'Launch Safe, Automated Form Outreach Today',
        vi: 'Khởi chạy Tiếp cận Khách hàng qua Form An toàn'
      },
      desc: {
        ja: '500万社DBからターゲットを抽出し、NGサイトをAI自動除外。1件あたり最安5.9円で決裁権者へアプローチ。',
        en: 'Filter targets from 5M companies and automatically bypass disclaimers. Rates as low as 5.9 JPY per send.',
        vi: 'Lọc tệp từ 5 triệu doanh nghiệp, tự động loại trừ website từ chối quảng cáo. Chi phí chỉ từ 5.9 JPY/form gửi thành công.'
      },
      buttonText: {
        ja: 'フォーム営業サービスの詳細を見る',
        en: 'Learn About Form Marketing',
        vi: 'Xem chi tiết Dịch vụ Form Marketing'
      },
      href: '/ja/form-marketing'
    }
  },

  // =========================================================================
  // BÀI 4: 取引先の倒産を見抜く5つの前兆シグナルと法人信用調査チェックリスト
  // =========================================================================
  {
    slug: 'bankruptcy-signs-check',
    category: 'credit-risk',
    categoryLabel: {
      ja: '与信管理・倒産調査',
      en: 'Credit Due Diligence',
      vi: 'Thẩm định & Rủi ro phá sản'
    },
    title: {
      ja: '取引先の倒産を見抜く5つの前兆シグナルと法人信用調査チェックリスト｜未回収リスク防止の手引き',
      en: '5 Early Warning Signs of Corporate Bankruptcy: B2B Credit Due Diligence Checklist for Risk Prevention',
      vi: '5 Dấu hiệu Cảnh báo Doanh nghiệp sắp Phá sản & Danh mục Thẩm định Tín dụng B2B Phòng ngừa Nợ xấu'
    },
    metaDescription: {
      ja: '取引先の突然の倒産・破産・解散による売掛金未回収を防ぐための信用調査チェックリスト。法務局登記の異動（代表者変更・本社移転）、インボイス登録取消、厚生年金被保険者数の急減など、公的データから倒産リスクを事前に察知する5大シグナルを徹底解説。',
      en: 'Protect your receivables from client insolvency. Comprehensive credit evaluation checklist covering legal registry changes, CEO turnover, sudden office moves, invoice status, and social pension declines.',
      vi: 'Danh mục thẩm định tín dụng đối tác phòng ngừa rủi ro mất trắng công nợ. 5 tín hiệu cảnh báo sớm từ dữ liệu công quyền: thay đổi giám đốc, dời trụ sở, hủy mã số Invoice, sụt giảm lao động.'
    },
    keywords: [
      '倒産 前兆',
      '企業 信用調査 やり方',
      '破産 兆候 見分け方',
      '与信管理 チェックリスト',
      '売掛金 未回収 防止',
      '取引先 倒産 対策'
    ],
    publishedAt: '2026-11-01',
    updatedAt: '2026-11-02',
    readTimeMinutes: 7,
    featured: false,
    author: {
      name: 'Kigyou-list 信用リスク調査室',
      role: '公認与信管理アナリスト'
    },
    highlights: {
      ja: [
        '倒産企業の80%以上が、事由発生の3〜6ヶ月前に公的登記や雇用データに「異変シグナル」を残している',
        '【シグナル1】頻繁な本店移転（雑居ビルやバーチャルオフィスへのダウングレード）',
        '【シグナル2】代表取締役の短期間での交代・親族以外の就任',
        '【シグナル3】適格インボイス番号の失効・取消（国税庁公表情報の変化）',
        '【シグナル4】厚生年金保険の被保険者数の急激な減少（実質的なリストラや社会保険料滞納）',
        'Kigyou-list「倒産速報ハブ」と「企業監視アラート」を活用した未回収ゼロ体制の構築'
      ],
      en: [
        'Over 80% of insolvent companies exhibit detectable legal registry anomalies 3-6 months beforehand',
        'Signal 1: Frequent office relocations to virtual or downgraded spaces',
        'Signal 2: Rapid CEO turnover and non-family management restructuring',
        'Signal 3: Invalidation or revocation of NTA Qualified Invoice registrations',
        'Signal 4: Abrupt drops in insured employee counts signaling layoffs or arrears',
        'Building a zero-bad-debt workflow with Kigyou-list Bankruptcy Hub and Monitoring Alerts'
      ],
      vi: [
        'Hơn 80% doanh nghiệp phá sản đều để lại các dấu hiệu bất thường trên sổ đăng ký pháp lý từ 3-6 tháng trước',
        'Tín hiệu 1: Liên tục đổi trụ sở hoặc chuyển về văn phòng ảo/tòa nhà kém chất lượng',
        'Tín hiệu 2: Thay đổi người đại diện liên tục trong thời gian ngắn',
        'Tín hiệu 3: Mã số hóa đơn Invoice bị hủy bỏ trên trang Quốc thuế',
        'Tín hiệu 4: Số lượng người đóng bảo hiểm xã hội giảm sút nghiêm trọng',
        'Quy trình phòng ngừa nợ xấu với Hub Phá sản và Tính năng Cảnh báo tự động của Kigyou-list'
      ]
    },
    tableOfContents: [
      { id: 'why-due-diligence-matters', title: '1. なぜB2B取引において事前の信用調査が死活問題なのか？', level: 2 },
      { id: 'five-warning-signals', title: '2. 公的データから見抜く「倒産前の5大前兆シグナル」', level: 2 },
      { id: 'credit-checklist', title: '3. 即実践できる「取引先信用調査チェックリスト7項目」', level: 2 },
      { id: 'automated-monitoring', title: '4. Kigyou-listの企業監視・倒産速報を活用したリスク自動検知', level: 2 },
      { id: 'faq-credit', title: '5. よくある質問（FAQ）', level: 2 }
    ],
    faqs: [
      {
        question: '帝国データバンクや東京商工リサーチの有料調査を依頼すべきですか？',
        answer: '数千万円〜数億円規模の大型取引や与信限度額の設定時には民間調査会社の詳細調査が推奨されます。しかし、日常的な数百万円以下の取引や新規開拓段階では、コストをかけずにKigyou-listで「法人登記の変更履歴」「インボイス有効性」「被保険者数推移」「倒産速報情報」をチェックするだけで、リスクの大部分を事前に遮断できます。'
      },
      {
        question: '倒産情報（破産・解散・清算）はどれくらいの頻度で更新されますか？',
        answer: 'Kigyou-listの倒産・解散速報データは法務局および官報の公示情報と直結しており、日次で自動同期・更新されています。'
      }
    ],
    cta: {
      title: {
        ja: '全国の倒産・解散企業速報を確認する',
        en: 'Inspect Latest Japan Bankruptcy Bulletins',
        vi: 'Kiểm tra Danh sách Doanh nghiệp Phá sản & Giải thể'
      },
      desc: {
        ja: '47都道府県別の解散・清算結了企業をリアルタイム集計。取引先の安全確認や未回収リスクの排除にご活用ください。',
        en: 'Real-time aggregation of dissolved and liquidated corporations across all 47 prefectures.',
        vi: 'Tổng hợp thời gian thực các công ty giải thể, phá sản trên 47 tỉnh thành Nhật Bản. Bảo vệ an toàn dòng tiền doanh nghiệp.'
      },
      buttonText: {
        ja: '倒産・解散企業一覧（47都道府県）を見る',
        en: 'View Bankruptcy Hub',
        vi: 'Xem Danh bạ Phá sản 47 Tỉnh'
      },
      href: '/ja/status/bankruptcies'
    }
  },

  // =========================================================================
  // BÀI 5: 金融庁EDINET有報データから読み解く優良企業・高年収ホワイト企業の特徴
  // =========================================================================
  {
    slug: 'edinet-salary-ranking-utilization',
    category: 'corporate-analysis',
    categoryLabel: {
      ja: '有報・企業分析',
      en: 'Securities & Analysis',
      vi: 'Phân tích Báo cáo tài chính'
    },
    title: {
      ja: '金融庁EDINET有報データから読み解く優良企業・高年収ホワイト企業の特徴と分析法｜転職・営業リスト活用',
      en: 'Analyzing Japan Premium & White Companies via FSA EDINET Securities Reports: Salary & Retention Insights',
      vi: 'Phương pháp Phân tích Doanh nghiệp Uy tín qua Báo cáo Tài chính EDINET | Bí quyết Tuyển dụng & Bán hàng B2B'
    },
    metaDescription: {
      ja: '金融庁EDINET開示の有価証券報告書や厚生労働省「職場情報総合サイト」のデータを元に、真の優良企業・高年収ホワイト企業を見極める分析手法を解説。平均年間給与、平均勤続年数、厚生年金被保険者数の3大指標を組み合わせた営業ターゲティングと企業選定基準。',
      en: 'Comprehensive guide to evaluating blue-chip and white companies in Japan using official FSA EDINET securities filings and MHLW workplace disclosures. Practical formulas for high-ticket B2B targeting.',
      vi: 'Kỹ thuật phân tích doanh nghiệp uy tín qua Báo cáo tài chính kiểm toán FSA EDINET và Bộ Lao động MHLW. Kết hợp bộ 3 chỉ số vàng: Thu nhập bình quân, Thâm niên lao động và Quy mô đóng bảo hiểm.'
    },
    keywords: [
      '平均年収 ランキング',
      '有報 企業分析',
      'ホワイト企業 見分け方',
      '勤続年数 企業',
      'EDINET 有価証券報告書 見方',
      '優良企業 ターゲティング'
    ],
    publishedAt: '2026-11-01',
    updatedAt: '2026-11-02',
    readTimeMinutes: 7,
    featured: false,
    author: {
      name: 'Kigyou-list 財務データ分析班',
      role: '有価証券報告書リサーチディレクター'
    },
    highlights: {
      ja: [
        '求人票の「見かけの年収」に騙されない：金融庁EDINET有報の監査済み「平均年間給与」こそが唯一の確定値',
        '「高年収 ＝ ホワイト企業」とは限らない：厚生労働省公表の「平均継続勤務年数」と組み合わせる重要性',
        '高額単価商材を扱うB2B営業チームが「年収ランキング上位企業」を優先ターゲットにすべき理由',
        '日本年金機構の被保険者数データを重ねることで、正規雇用の実質規模を100%正確に把握可能'
      ],
      en: [
        'Do not trust job ad salary ranges: Audited EDINET annual securities reports represent the single source of truth',
        'High salary does not equal a white company: Why combining MHLW employee tenure data is essential',
        'Why high-ticket B2B sales teams prioritize top-salary corporate rankings for enterprise deals',
        'Leveraging Japan Pension Service workforce records to verify actual full-time headcounts'
      ],
      vi: [
        'Đừng để tin tuyển dụng đánh lừa: Chỉ có thu nhập bình quân kiểm toán trên báo cáo EDINET mới là con số thực',
        'Lương cao chưa chắc là công ty tốt: Vì sao bắt buộc phải đối soát chỉ số thâm niên gắn bó từ Bộ Lao động MHLW',
        'Lý do các đội ngũ bán hàng B2B giá trị cao luôn ưu tiên danh sách doanh nghiệp có thu nhập bình quân đứng đầu',
        'Kiểm tra thực lực quy mô lao động qua dữ liệu đóng bảo hiểm xã hội của Cơ quan Hưu trí Nhật Bản'
      ]
    },
    tableOfContents: [
      { id: 'edinet-source-of-truth', title: '1. なぜ有価証券報告書（EDINET）が企業分析の最高峰なのか？', level: 2 },
      { id: 'three-golden-metrics', title: '2. 優良企業を見抜く「3大公的指標」（年収・勤続年数・被保険者数）', level: 2 },
      { id: 'sales-targeting-strategy', title: '3. 高単価B2B商材で成約率を跳ね上げる「高年収企業ターゲティング」', level: 2 },
      { id: 'ranking-matrix-how-to', title: '4. Kigyou-listのランキング一覧からCSVを出力して活用する手順', level: 2 },
      { id: 'faq-edinet', title: '5. よくある質問（FAQ）', level: 2 }
    ],
    faqs: [
      {
        question: '有価証券報告書が開示されていない未上場企業のデータはどう調べればよいですか？',
        answer: '未上場企業の場合は金融庁への有報提出義務がありませんが、Kigyou-listでは厚生労働省の「職場情報総合サイト」や日本年金機構の「厚生年金被保険者数」、国税庁の「資本金・設立年月」を統合しているため、非上場優良企業でも正確な実力値を推計・把握できます。'
      },
      {
        question: '年収ランキング上位企業に営業提案する際のポイントはありますか？',
        answer: '平均年収が1,000万円を超える企業は、1人あたりの生産性向上や高付加価値化に強い関心を持っています。単純な「安さ（コスト削減）」ではなく、「業務プロセスの自動化」「従業員の付加価値時間創出」を訴求した提案が非常に通りやすい傾向があります。'
      }
    ],
    cta: {
      title: {
        ja: '全国企業の平均年収ランキングを確認する',
        en: 'Inspect Top Average Salary Rankings in Japan',
        vi: 'Khám phá Bảng Xếp Hạng Thu Nhập Bình Quân Nhật Bản'
      },
      desc: {
        ja: '金融庁EDINET開示データに基づく全国上場企業の給与ランキングTOP50。役員名、公式電話番号付きのリストを閲覧可能。',
        en: 'Audited remuneration rankings from FSA securities filings with executive names and direct corporate contacts.',
        vi: 'Bảng xếp hạng thu nhập bình quân kiểm toán từ FSA EDINET kèm tên ban lãnh đạo và số điện thoại liên hệ chính thức.'
      },
      buttonText: {
        ja: '平均年収ランキングを見る',
        en: 'View Salary Ranking',
        vi: 'Xem BXH Thu nhập bình quân'
      },
      href: '/ja/ranking/salary'
    }
  }
];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find(article => article.slug === slug);
}

export function getAllGuideSlugs(): string[] {
  return GUIDE_ARTICLES.map(article => article.slug);
}

export function getGuidesByCategory(category: string): GuideArticle[] {
  if (category === 'all') return GUIDE_ARTICLES;
  return GUIDE_ARTICLES.filter(article => article.category === category);
}
