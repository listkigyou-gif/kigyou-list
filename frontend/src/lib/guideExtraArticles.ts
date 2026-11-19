import type { GuideArticle } from './guides';

export const EXTRA_GUIDE_ARTICLES: GuideArticle[] = [
  // =========================================================================
  // BÀI 6: 法人番号 検索・API連携・一括名寄せ完全ガイド
  // =========================================================================
  {
    slug: 'corporate-number-search-api-guide',
    category: 'data-compliance',
    categoryLabel: {
      ja: '法人番号・インボイス・許認可',
      en: 'Registries & Compliance',
      vi: 'Pháp lý & Mã số thuế',
    },
    title: {
      ja: '国税庁「13桁法人番号」の仕組みと検索・CRM一括名寄せ・API連携完全ガイド',
      en: 'Japan 13-Digit Corporate Number Guide: Search, Bulk CRM Deduplication & API Integration',
      vi: 'Hướng dẫn Mã số Pháp nhân 13 chữ số NTA: Tra cứu, Chuẩn hóa CRM và Tích hợp API',
    },
    metaDescription: {
      ja: '国税庁が指定する13桁法人番号の構造（チェックデジット＋12桁登記番号）から、表記揺れ（「(株)」・全角半角・旧商号）によるCRM重複データの名寄せ手順、Kigyou-list REST APIを使った自動補完まで徹底解説。',
      en: 'Understand the 13-digit National Tax Agency Corporate Number structure, solve CRM entity duplication caused by Japanese name variants, and automate enrichment via REST API.',
      vi: 'Giải mã cấu trúc mã số pháp nhân 13 chữ số của Quốc thuế Nhật Bản, quy trình gộp trùng lặp dữ liệu CRM và tích hợp tự động hóa qua REST API.',
    },
    keywords: [
      '法人番号 検索',
      '法人番号 API',
      '13桁 法人番号 チェックデジット',
      '企業名 名寄せ 方法',
      '国税庁 法人番号 一括取得',
      'CRM 企業データ 重複排除',
    ],
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    readTimeMinutes: 7,
    featured: true,
    author: {
      name: 'Kigyou-list データ設計チーム',
      role: 'マスターデータ・APIアーキテクト',
    },
    highlights: {
      ja: [
        '法人番号は全国500万社超に割り当てられた不変の「13桁キー」であり、商号変更・移転でも維持される',
        '先頭1桁のチェックデジット検証ロジックにより、Excel入力ミスやOCR誤読を機械的に即検知可能',
        '「株式会社／(株)」「全角・半角」「旧漢字」の表記揺れは企業名マッチではなく法人番号キーで一掃',
        'Kigyou-list API v1と連携すれば、法人番号を渡すだけで最新住所・インボイス番号・財務・許認可を自動同期',
      ],
      en: [
        'The 13-digit Corporate Number remains immutable across company name changes and headquarters relocations',
        'Leading check-digit validation catches manual entry and OCR errors automatically',
        'Resolve Japanese naming variations using corporate numbers instead of fragile string matching',
        'Use Kigyou-list API v1 to enrich CRM records with verified addresses, T-Numbers, financials, and licenses',
      ],
      vi: [
        'Mã số pháp nhân 13 chữ số là khóa định danh bất biến ngay cả khi doanh nghiệp đổi tên hoặc chuyển trụ sở',
        'Chữ số kiểm tra (check digit) đầu tiên giúp phát hiện ngay lỗi nhập tay trong Excel/CRM',
        'Loại bỏ triệt để lỗi trùng lặp tên viết tắt hoặc full-width/half-width tiếng Nhật bằng chuẩn hóa 13 số',
        'Tích hợp API v1 của Kigyou-list để tự động làm giàu địa chỉ, mã Invoice, tài chính và giấy phép',
      ],
    },
    tableOfContents: [
      { id: 'what-is-houjin-bangou', title: '1. 13桁法人番号の構造と「不変キー」としての価値', level: 2 },
      { id: 'why-crm-duplicates', title: '2. 日本語企業データでCRM・Excelの重複が起きる4つの原因', level: 2 },
      { id: 'bulk-matching-workflow', title: '3. 既存リストを法人番号で一括名寄せする実務ステップ', level: 2 },
      { id: 'api-integration', title: '4. REST API連携によるリアルタイム企業マスター同期', level: 2 },
    ],
    sections: [
      {
        id: 'what-is-houjin-bangou',
        title: '1. 13桁法人番号の構造と「不変キー」としての価値',
        paragraphs: [
          '法人番号（Houjin Bangou）は、マイナンバー法に基づき国税庁長官が設立登記法人や国の機関、地方公共団体等に指定する「1法人1つ・原則変更されない13桁の識別子」です。末尾12桁が法務局の会社法人等番号をベースとした固有番号、先頭1桁が計算によって導かれる検査用数字（チェックデジット）で構成されています。',
          '営業管理や与信管理において決定的に重要なのは、社名変更や本店移転を行っても「組織そのものが存続する限り法人番号は変わらない」という点です。逆に、合併による消滅や清算結了の際には閉鎖登記日が記録されるため、法人のライフサイクルを追跡する最も確実な主キー（Primary Key）となります。',
        ],
        table: {
          headers: ['番号の種類', '桁数', '対象範囲', '用途上の注意点'],
          rows: [
            ['法人番号（国税庁）', '13桁数字', '全国の株式会社・合同会社・NPO・官公庁等 500万社超', '先頭1桁がチェックデジット。SFA/CRMの主キーに最適'],
            ['会社法人等番号（法務局）', '12桁数字', '設立登記法人', '先頭の検査数字を除いた下12桁。登記簿謄本取得時に使用'],
            ['インボイス登録番号', 'T＋13桁', '適格請求書発行事業者の登録を受けた法人', '法人の場合は必ず「T」＋「13桁の法人番号」と一致する'],
          ],
        },
      },
      {
        id: 'why-crm-duplicates',
        title: '2. 日本語企業データでCRM・Excelの重複が起きる4つの原因',
        paragraphs: [
          'SalesforceやHubSpot、あるいは部署ごとに管理しているExcel営業リストにおいて、「同じ取引先に別々の営業担当者が重複架電してしまった」「売上が2社分に分断されている」という事故の9割以上は、企業名文字列をキーにしてしまっていることが原因です。',
        ],
        bullets: [
          { label: '法人格表記の揺れ', text: '「株式会社〇〇」「(株)〇〇」「〇〇株式会社」の前後位置・略称違いにより、システム上は別会社として登録される。' },
          { label: '全角・半角・スペース混在', text: '「ＴＭＪ」と「TMJ」、あるいは社名内の全角スペース有無によってVLOOKUPや重複判定が一致しない。' },
          { label: '商号変更・リブランディング', text: '旧社名時代のリードと改称後の問い合わせレコードが別企業として残り、過去商談履歴が引き継がれない。' },
          { label: '支店・営業所の誤登録', text: '「〇〇株式会社 東京支社」と本社が別マスターとして作られ、グループ全体での取引上限管理が破綻する。' },
        ],
      },
      {
        id: 'bulk-matching-workflow',
        title: '3. 既存リストを法人番号で一括名寄せする実務ステップ',
        paragraphs: [
          '過去の商談リストや展示会名刺データをクリーンアップする際は、まず国税庁公式データと突合して全行に13桁の法人番号を付与します。法人番号が埋まれば、同一番号の行をマージするだけで重複を100%機械的に排除でき、最新の本店所在地・代表者・資本金・許認可情報まで同時に補完できます。',
        ],
        hubLinks: [
          {
            badge: '全国企業インデックス',
            label: '全国法人ディレクトリ・都道府県別検索',
            href: '/directory',
            description: '500万社超の正規法人番号・所在地・業種データを体系的にブラウザ照会。',
          },
          {
            badge: '商号変更・移転履歴',
            label: '法人番号異動・変更履歴ハブ',
            href: '/changes',
            description: '本店移転・合併・新規設立の最新登記履歴を法人番号単位でトラッキング。',
          },
        ],
      },
      {
        id: 'api-integration',
        title: '4. REST API連携によるリアルタイム企業マスター同期',
        paragraphs: [
          'SaaSの登録フォームや社内CRMに新しい取引先が入力された瞬間、企業名やドメイン・13桁法人番号をKigyou-list APIへ送信して企業マスターを自動補完する設計にすると、そもそも入力段階で表記揺れや誤登録が発生しなくなります。さらに適格請求書（T番号）の有効性や有報財務・許認可データも同時にCRMへ書き戻せるため、与信チェック工数を大幅に削減できます。',
        ],
        callout: {
          title: '⚡ 開発者向け企業データAPI（REST API v1）を確認する',
          body: '法人番号13桁からの高速照会、条件フィルタ検索、日次差分シグナル連携のエンドポイント仕様・レート制限を公開しています。',
          buttonText: 'APIドキュメントを見る',
          href: '/developer',
        },
      },
    ],
    faqs: [
      {
        question: '法人番号の先頭1桁（チェックデジット）をExcelで検証できますか？',
        answer: 'はい、可能です。下12桁の各桁に対し右から順に1と2を交互に乗じて総和を求め、9で割った余りを9から引く（モジュラス9）計算式で先頭1桁と一致するか検証できます。不一致の場合は入力ミスの番号です。',
      },
      {
        question: '個人事業主にも13桁の法人番号は割り当てられますか？',
        answer: 'いいえ。13桁の法人番号は登記法人等にのみ指定されます。ただし個人事業主がインボイス制度に登録した場合は、法人番号とは重複しない13桁の数値に「T」を付したインボイス登録番号が発行されます。',
      },
    ],
    cta: {
      title: {
        ja: '全国500万社の法人番号データベースを検索する',
        en: 'Search Over 5 Million Japanese Corporate Numbers',
        vi: 'Tra cứu CSDL 5 triệu Mã số Pháp nhân Nhật Bản',
      },
      desc: {
        ja: '社名・住所・電話番号・インボイス番号から13桁の正規法人番号を瞬時に特定し、CRM名寄せ用CSVとして活用できます。',
        en: 'Identify 13-digit NTA corporate numbers instantly by name, phone, or address for clean CRM deduplication.',
        vi: 'Tìm chính xác mã số pháp nhân 13 số theo tên, SĐT, địa chỉ và xuất dữ liệu chuẩn hóa cho CRM.',
      },
      buttonText: {
        ja: '法人検索画面へ',
        en: 'Open Corporate Search',
        vi: 'Mở công cụ tra cứu',
      },
      href: '/ja/search',
    },
  },

  // =========================================================================
  // BÀI 7: インボイス制度（適格請求書）T番号一括確認ガイド
  // =========================================================================
  {
    slug: 'invoice-system-t-number-bulk-check',
    category: 'data-compliance',
    categoryLabel: {
      ja: '法人番号・インボイス・許認可',
      en: 'Registries & Compliance',
      vi: 'Pháp lý & Mã số thuế',
    },
    title: {
      ja: 'インボイス登録番号（T番号）一括確認・失効検知ガイド｜経理・購買・反社チェック実務',
      en: 'Japan Qualified Invoice (T-Number) Bulk Verification & Revocation Check Guide',
      vi: 'Hướng dẫn Xác minh hàng loạt Mã Invoice (T-Number) & Cảnh báo hủy hiệu lực cho Kế toán B2B',
    },
    metaDescription: {
      ja: '仕入税額控除の要件となる適格請求書発行事業者登録番号（T＋13桁）の正しい確認方法。取引先の登録失効・取消リスクや法人番号との不整合をExcel/CSVで一括チェックする手順を解説。',
      en: 'Step-by-step playbook for accountants and procurement teams to bulk-verify Qualified Invoice T-Numbers, detect revocations, and reconcile corporate numbers.',
      vi: 'Quy trình kiểm tra hàng loạt mã hóa đơn hợp lệ (T-Number), phát hiện đối tác bị hủy đăng ký Invoice và đối chiếu mã pháp nhân NTA.',
    },
    keywords: [
      'インボイス 登録番号 一括確認',
      '適格請求書発行事業者 検索',
      'T番号 確認 方法',
      'インボイス 失効 チェック',
      '取引先 インボイス 登録状況',
      'インボイス CSV 照合',
    ],
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    readTimeMinutes: 6,
    featured: true,
    author: {
      name: 'Kigyou-list 税務・法令リサーチ班',
      role: '適格請求書システム分析チーム',
    },
    highlights: {
      ja: [
        '仕入税額控除を確実に受けるには、受領した請求書の「T番号が支払日時点で有効か」の確認が必須',
        '登録の取りやめ・解散・税務署による登録取消があると、過去は有効だったT番号も失効する',
        '法人取引では「T＋13桁」の下13桁が国税庁法人番号と完全一致するかを見れば、なりすまし請求を防止可能',
        'Kigyou-listのインボイス一括照会ツールと企業監視を使えば、数千社の取引先も数秒で全件チェック完了',
      ],
      en: [
        'Input tax credit requires verifying that the vendor T-Number is active on the transaction date',
        'Previously valid T-Numbers can be revoked upon business closure, opt-out, or tax authority cancellation',
        'Cross-checking T + 13 digits against the NTA Corporate Number catches spoofed vendor invoices',
        'Verify thousands of vendors simultaneously with Kigyou-list Bulk Invoice Lookup and Watchlist alerts',
      ],
      vi: [
        'Để được khấu trừ thuế đầu vào hợp lệ, doanh nghiệp phải xác minh T-Number còn hiệu lực tại ngày giao dịch',
        'Mã T-Number có thể bị thu hồi hoặc hết hiệu lực khi đối tác giải thể hoặc rút đăng ký',
        'Đối chiếu 13 số sau chữ T với mã số pháp nhân NTA giúp phát hiện hóa đơn giả mạo',
        'Kiểm tra cùng lúc hàng nghìn nhà cung cấp qua công cụ Tra cứu Invoice hàng loạt & Theo dõi biến động',
      ],
    },
    tableOfContents: [
      { id: 'invoice-risks', title: '1. なぜ一度確認した取引先のT番号を再チェックする必要があるのか？', level: 2 },
      { id: 't-number-rules', title: '2. 請求書受領時に必ず確認すべき3つのチェックポイント', level: 2 },
      { id: 'bulk-verification', title: '3. 数百〜数千社の取引先をCSV一括で自動照合する方法', level: 2 },
      { id: 'continuous-monitoring', title: '4. 登録取消・閉鎖を翌日に察知する継続モニタリング体制', level: 2 },
    ],
    sections: [
      {
        id: 'invoice-risks',
        title: '1. なぜ一度確認した取引先のT番号を再チェックする必要があるのか？',
        paragraphs: [
          'インボイス制度（適格請求書等保存方式）の導入以降、経理・購買部門では新規取引開始時に「T＋13桁」の番号を確認する運用が定着しました。しかし見落とされがちなのが、一度登録された適格請求書発行事業者であっても「登録取消」「事業廃止」「法人解散・吸収合併」によって有効期限が切れるケースです。',
          'もし取引先がT番号を取り下げた後や合併消滅した後に受け取った請求書をそのまま課税仕入れとして処理してしまうと、税務調査で仕入税額控除が否認され、追徴課税や決算修正の原因となります。また、休眠法人のT番号を悪用した架空請求を防ぐうえでも、取引時点のステータス確認が欠かせません。',
        ],
      },
      {
        id: 't-number-rules',
        title: '2. 請求書受領時に必ず確認すべき3つのチェックポイント',
        paragraphs: [
          '実務上、1件ずつ国税庁サイトへ手打ちして目視確認するのは負担が大きいため、システム化を見据えて以下の3点をチェック基準として明文化しておきます。',
        ],
        bullets: [
          { label: '番号整合性（T＋法人番号）', text: '取引先が法人の場合、請求書に記載されたT番号（13桁）がマスター上の国税庁法人番号と一致しているか。' },
          { label: '登録有効日・失効日の確認', text: '現在有効（公表済）であるかだけでなく、取引年月日（納品日）が登録日以降かつ失効日前であるか。' },
          { label: '商号・所在地の一致', text: 'T番号が別会社のものとすり替えられていないか、登録公表上の法人名称・本店所在地と請求書差出人が一致するか。' },
        ],
      },
      {
        id: 'bulk-verification',
        title: '3. 数百〜数千社の取引先をCSV一括で自動照合する方法',
        paragraphs: [
          '毎月の支払締め前に、会計ソフトや購買システムから取引先コード・法人番号・T番号の一覧を書き出し、一括照会ハブにアップロードまたは貼り付けることで、有効／失効／未登録を瞬時に判定できます。',
        ],
        hubLinks: [
          {
            badge: '一括照会エンジン',
            label: 'インボイス番号一括照会ツール（/ja/invoice）',
            href: '/invoice',
            description: 'T番号または13桁法人番号をまとめて照合し、最新の適格請求書発行事業者ステータスを即時確認。',
          },
          {
            badge: '与信・ステータス連携',
            label: '倒産・閉鎖・解散法人速報ハブ',
            href: '/status/bankruptcies',
            description: 'インボイス失効の前触れとなる解散・閉鎖登記や官報情報を一覧で確認。',
          },
        ],
      },
      {
        id: 'continuous-monitoring',
        title: '4. 登録取消・閉鎖を翌日に察知する継続モニタリング体制',
        paragraphs: [
          '取引先数が500社を超えると、毎月の手動一括チェックにも工数がかかります。主要な仕入先や外注先は「企業監視ウォッチリスト」に登録しておき、国税庁の差分更新と連動してT番号取消や法人閉鎖が公表された瞬間にアラートを受け取る運用が最も安全です。',
        ],
        callout: {
          title: '🔍 インボイス登録済み企業・未登録企業を条件検索',
          body: '業種や都道府県を掛け合わせてインボイス登録企業のみを抽出したり、一括照会画面から既存ベンダーリストの有効性を確認できます。',
          buttonText: 'インボイス一括照会へ',
          href: '/invoice',
        },
      },
    ],
    faqs: [
      {
        question: '吸収合併された取引先のT番号は合併後もそのまま使えますか？',
        answer: '原則として消滅法人の法人番号およびT番号は効力を失い、存続法人の登録番号に切り替わります。合併登記日以降の取引では存続会社名義・新T番号の請求書を受領する必要があります。',
      },
      {
        question: '取引先が登録年月日を遡って有効になることはありますか？',
        answer: '通常の申請では登録通知後の指定日（申請日から一定期間後など）から有効となります。取引日に登録が間に合っていない場合は適格請求書の要件を満たさないため、必ず事前に登録日を確認してください。',
      },
    ],
    cta: {
      title: {
        ja: '取引先のT番号をまとめて無料一括確認する',
        en: 'Bulk Verify Vendor T-Numbers for Free',
        vi: 'Kiểm tra hàng loạt mã Invoice (T-Number) miễn phí',
      },
      desc: {
        ja: '国税庁公表データとリアルタイム同期。登録年月日・有効ステータス・法人番号の一致を一括でチェックできます。',
        en: 'Synchronized with official National Tax Agency registries to validate active T-Numbers in bulk.',
        vi: 'Đồng bộ trực tiếp với Quốc thuế Nhật Bản NTA giúp xác minh trạng thái hiệu lực T-Number chỉ trong vài giây.',
      },
      buttonText: {
        ja: 'インボイス一括照会を開く',
        en: 'Open Invoice Checker',
        vi: 'Mở công cụ Invoice',
      },
      href: '/ja/invoice',
    },
  },

  // =========================================================================
  // BÀI 8: 反社チェック・取引先コンプライアンス審査手順
  // =========================================================================
  {
    slug: 'anti-social-forces-check-procedure',
    category: 'credit-risk',
    categoryLabel: {
      ja: '与信管理・倒産調査',
      en: 'Credit Due Diligence',
      vi: 'Thẩm định & Rủi ro phá sản',
    },
    title: {
      ja: '取引先の新規開拓で行う「反社チェック・実在確認」実践手順｜登記異動・許認可・公告の読み解き方',
      en: 'Practical Due Diligence & Compliance Screening Procedure for New Japanese B2B Vendors',
      vi: 'Quy trình Kiểm tra Tuân thủ & Xác minh Đối tác Nhật Bản (Hansha Check & KYB) từ dữ liệu công',
    },
    metaDescription: {
      ja: '日本企業と新規契約を結ぶ前に必須となる反社チェック（コンプライアンス確認）と実在性審査の実務フロー。公的登記の異常パターン、許認可番号照合、代表者変更履歴の確認ポイントを体系化。',
      en: 'Structured KYB and compliance check workflow for evaluating new B2B partners in Japan using statutory registries, address history, and license records.',
      vi: 'Quy trình thẩm định KYB và kiểm tra rủi ro tuân thủ trước khi ký hợp đồng với doanh nghiệp Nhật Bản qua lịch sử đăng ký và giấy phép.',
    },
    keywords: [
      '反社チェック 手順',
      '反社チェック 企業 実在確認',
      '新規取引先 審査 チェックリスト',
      'KYB 法人確認 日本',
      '登記履歴 異常 見分け方',
      '取引先 コンプライアンス チェック',
    ],
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    readTimeMinutes: 8,
    featured: false,
    author: {
      name: 'Kigyou-list コンプライアンス調査班',
      role: '法務・与信デューデリジェンス担当',
    },
    highlights: {
      ja: [
        '反社チェックと実在性審査は「記事検索（ネガティブ報道）」と「公的登記の履歴分析」の両輪が不可欠',
        '短期間での商号変更・不可解な業種転換・連続的な本店移転はペーパーカンパニーの典型シグナル',
        '建設業・宅建・古物商・登録支援機関などの業法許認可を公的表と照合し「無許可営業」リスクを遮断',
        '契約後も年1回または異動発生時の定期再チェックを自動化することで上場準備・内部統制に対応',
      ],
      en: [
        'Combine adverse media screening with official corporate registry history analysis',
        'Frequent name changes and rapid unrelated headquarters moves are key shell-company red flags',
        'Verify statutory business licenses (construction, real estate, secondhand goods) against official registries',
        'Automate ongoing post-contract change detection to meet IPO and internal audit standards',
      ],
      vi: [
        'Kết hợp tìm kiếm thông tin tiêu cực trên báo chí và phân tích lịch sử biến động đăng ký pháp nhân',
        'Đổi tên liên tục, đổi ngành nghề bất thường hoặc dời trụ sở dày đặc là dấu hiệu công ty vỏ bọc',
        'Xác minh giấy phép hành nghề chuyên ngành (xây dựng, BĐS, đồ cũ) để tránh ký nhầm đối tác hoạt động chui',
        'Tự động theo dõi biến động sau ký kết phục vụ kiểm soát nội bộ và chuẩn bị niêm yết',
      ],
    },
    tableOfContents: [
      { id: 'kyb-two-pillars', title: '1. 公的データに基づく取引先実在確認・反社スクリーニングの2軸', level: 2 },
      { id: 'registry-red-flags', title: '2. 登記履歴から見抜く「実態不透明企業」5つの危険パターン', level: 2 },
      { id: 'license-and-office', title: '3. 許認可ステータスと本店所在地の現況照合', level: 2 },
      { id: 'ongoing-audit-trail', title: '4. 内部統制・IPO審査に耐える記録保存と継続監視', level: 2 },
    ],
    sections: [
      {
        id: 'kyb-two-pillars',
        title: '1. 公的データに基づく取引先実在確認・反社スクリーニングの2軸',
        paragraphs: [
          'B2B取引において「契約書に反社排除条項を入れること」は当然の前提ですが、形式的な誓約書だけではリスクを防げません。上場審査や大企業との取引要件を満たすためには、取引開始前（オンボーディング時）に客観的な公的データを用いて「その企業が実態を持って適法に活動しているか」を検証し、証跡を残すプロセスが必要です。',
          '実務上のスクリーニングは、（A）ニュース・官報・行政処分等のネガティブ情報検索と、（B）国税庁法人番号・法務局登記異動・インボイス・許認可といった「構造的データの整合性検証」の2軸で実施します。',
        ],
      },
      {
        id: 'registry-red-flags',
        title: '2. 登記履歴から見抜く「実態不透明企業」5つの危険パターン',
        paragraphs: [
          '法人番号の異動履歴（主な変更履歴）を時系列で遡ると、表面上のWebサイトからは見えない組織の健全性が浮かび上がります。以下のパターンが複数重なる場合は、取引先へ追加ヒアリングや前払い条件の検討を行うべきサインです。',
        ],
        bullets: [
          { label: '1〜2年以内の複数回商号変更', text: '悪評やトラブルの履歴をリセットするために社名だけを変更している休眠買収法人の可能性。' },
          { label: '県境をまたぐ頻繁な本店移転', text: '管轄法務局や税務署の監視を逃れる目的で、関連性の薄い地域へ短期間に転々と移転するケース。' },
          { label: '資本金と事業規模の著しい乖離', text: '数億円規模の大型案件を受注しようとするにもかかわらず、資本金・被保険者数が極端に少ない、あるいは連絡先が固定電話でない。' },
          { label: 'インボイス登録の未登録または取消', text: '課税事業者規模でありながらT番号を保持していない、あるいは過去に取消歴がある。' },
          { label: '合併・分割の直後で承継元が不透明', text: '不採算・係争事業だけを切り離すスキーム直後の新設・分割法人。' },
        ],
        hubLinks: [
          {
            badge: '登記変更トレース',
            label: '本店移転・所在地変更履歴一覧',
            href: '/changes/relocation',
            description: '直近の本店移転・住所変更登記を都道府県別・月別で即座に確認。',
          },
          {
            badge: '組織再編リスク',
            label: '合併・会社分割・商号変更一覧',
            href: '/changes/merger',
            description: '吸収合併や新設分割による法人格の引き継ぎ関係をタイムラインで確認。',
          },
        ],
      },
      {
        id: 'license-and-office',
        title: '3. 許認可ステータスと本店所在地の現況照合',
        paragraphs: [
          '建設工事の下請発注、不動産仲介、人材紹介・派遣、産業廃棄物・古物取引など、法律上の許可・登録が必須となる業種と契約する場合、無許可業者との取引は発注側にも監督責任やコンプライアンス違反が波及します。名刺やHPに書かれた番号を鵜呑みにせず、国土交通省・厚生労働省・出入国在留管理庁などの許認可マスターと照合することが不可欠です。',
        ],
        hubLinks: [
          {
            badge: '法定許認可照合',
            label: '全国公的許認可・登録企業ハブ',
            href: '/licenses',
            description: '建設業・宅建業・古物商・労働者派遣・登録支援機関の保有企業を公的登録ベースで確認。',
          },
          {
            badge: 'ビル入居実態',
            label: '主要オフィスビル入居企業名鑑',
            href: '/building',
            description: '主要ビジネスビル・タワーに入居する正規法人の所在実態を確認。',
          },
        ],
      },
      {
        id: 'ongoing-audit-trail',
        title: '4. 内部統制・IPO審査に耐える記録保存と継続監視',
        paragraphs: [
          '審査結果は「いつ・どの情報源を確認し・誰が承認したか」の記録を残すことで内部統制上のエビデンスとなります。また、一度合格した取引先であっても、代表者の交代や休眠・解散・合併が発生した際は再評価が必要です。Kigyou-listのウォッチリスト機能を使えば、登録取引先の法定変更・リスク兆候を自動検知できます。',
        ],
        callout: {
          title: '🛡️ 取引先の異動・倒産リスクを自動ウォッチ',
          body: '審査済み取引先をウォッチリストへ登録しておけば、移転・合併・解散・インボイス変更を毎日自動で把握できます。',
          buttonText: '企業監視ウォッチリストへ',
          href: '/watchlist',
        },
      },
    ],
    faqs: [
      {
        question: '休眠会社を買い取った「休眠法人買収（箱買い）」は登記履歴で分かりますか？',
        answer: '多くの場合、設立年から長期間変更がなかった法人が、ある日を境に「商号変更・本店移転（別都道府県へ）・事業目的の全面書き換え」を同時に行っている履歴として国税庁データや登記履歴に明確に現れます。',
      },
      {
        question: '個人事業主や小規模フリーランスとの契約でも実在確認は必要ですか？',
        answer: 'はい。インボイスT番号の有無や本人確認書類に加え、反社チェックと業務実態の証拠（過去実績・Webサイト等）を社内規定に沿って確認・保存することが推奨されます。',
      },
    ],
    cta: {
      title: {
        ja: '倒産速報・リスク異動企業を今すぐチェックする',
        en: 'Inspect Insolvency & Risk Signals Now',
        vi: 'Kiểm tra Cảnh báo Phá sản & Biến động Rủi ro ngay',
      },
      desc: {
        ja: '官報公告・閉鎖登記・移転・合併履歴を公的データ直結で無料検索できます。',
        en: 'Check official dissolution, relocation, merger, and compliance histories in real time.',
        vi: 'Tra cứu thông tin giải thể, chuyển trụ sở, sáp nhập trực tiếp từ dữ liệu công bố chính thức.',
      },
      buttonText: {
        ja: '倒産・閉鎖速報ハブを見る',
        en: 'View Risk & Bankruptcy Hub',
        vi: 'Xem Hub Phá sản & Rủi ro',
      },
      href: '/ja/status/bankruptcies',
    },
  },

  // =========================================================================
  // BÀI 9: 東京都 B2B営業・主要オフィスビル攻略ガイド
  // =========================================================================
  {
    slug: 'tokyo-b2b-prospecting-area-building-strategy',
    category: 'sales-list',
    categoryLabel: {
      ja: '営業リスト作成・Excel',
      en: 'Sales Lists & Excel',
      vi: 'Danh sách bán hàng & Excel',
    },
    title: {
      ja: '東京都のB2B企業リスト作成＆主要オフィスビル別ピンポイント攻略ガイド｜都心5区・IT企業開拓',
      en: 'Tokyo B2B Prospecting Playbook: Targeting Central Wards, Tech Hubs & Landmark Office Towers',
      vi: 'Chiến lược Lập danh sách Khách hàng B2B tại Tokyo: Khai thác 5 Quận trung tâm & Tòa nhà cao ốc',
    },
    metaDescription: {
      ja: '日本最大級の法人集積地である東京都（千代田区・港区・渋谷区・新宿区・豊島区等）で精度の高い営業リストを作る方法。丸ビルや六本木ヒルズ等の高層ビル入居企業を一網打尽にするビル攻略戦術を公開。',
      en: 'Maximize B2B sales efficiency in Tokyo by targeting companies by ward, JSIC industry code, and Grade-A skyscraper tenant directories.',
      vi: 'Tối ưu hóa hiệu suất bán hàng B2B tại Tokyo thông qua phân nhóm theo quận lõi, mã ngành JSIC và danh bạ doanh nghiệp đặt trụ sở tại các cao ốc hạng A.',
    },
    keywords: [
      '東京 企業リスト 営業',
      '東京都 IT企業 一覧',
      'オフィスビル 入居企業 営業',
      '港区 渋谷区 千代田区 企業一覧',
      '法人営業 テレワーク 訪問効率化',
      '東京 中小企業 大手 データベース',
    ],
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    readTimeMinutes: 7,
    featured: true,
    author: {
      name: 'Kigyou-list 首都圏マーケット分析チーム',
      role: 'エリアマーケティングディレクター',
    },
    highlights: {
      ja: [
        '東京都だけで日本の主要上場企業・高単価IT企業の過半数が集中。ただし都内全社に無差別に当てると効率が落ちる',
        '千代田・中央（大企業・金融）、港・渋谷（IT・スタートアップ・外資）、新宿・豊島（中小・サービス）の区別特性で切り分ける',
        '高層オフィスビルに入居する企業は「一定以上の賃料負担力 ＝ 予算決済力」を持つ優良顧客の確率が極めて高い',
        '訪問営業や郵送DMなら、同一ビル内の入居企業リストをまとめて抽出して移動コストをゼロにできる',
      ],
      en: [
        'Over half of Japan’s major SaaS, tech, and listed headquarters sit in Tokyo, requiring sharp ward-level segmentation',
        'Distinct buyer personas across Chiyoda/Chuo (enterprise), Minato/Shibuya (tech/VC), and Shinjuku/Toshima (SME/services)',
        'Grade-A office tower tenancy acts as a strong proxy for financial stability and B2B SaaS purchasing power',
        'Batch-extract tenants inside the same landmark tower to eliminate field sales transit overhead',
      ],
      vi: [
        'Tokyo tập trung phần lớn trụ sở doanh nghiệp niêm yết và IT tại Nhật, đòi hỏi phân khúc chính xác theo từng quận',
        'Tách biệt chân dung khách hàng: Chiyoda/Chuo (tập đoàn), Minato/Shibuya (IT/Startup), Shinjuku/Toshima (SME/Dịch vụ)',
        'Doanh nghiệp đặt trụ sở trong các cao ốc hạng A đồng nghĩa với năng lực chi trả và ngân sách đầu tư cao',
        'Trích xuất danh sách doanh nghiệp theo từng tòa nhà giúp tối ưu hóa tuyệt đối chi phí tiếp cận & gửi thư',
      ],
    },
    tableOfContents: [
      { id: 'tokyo-ward-matrix', title: '1. 東京都心エリア別：B2B商材との相性マトリクス', level: 2 },
      { id: 'building-based-abm', title: '2. 「ビル入居企業リスト」が最強のABM指標になる理由', level: 2 },
      { id: 'tokyo-it-targeting', title: '3. 渋谷区・港区のIT/SaaS企業を業種コードで精密抽出する', level: 2 },
      { id: 'multi-touch-execution', title: '4. 電話・フォーム・郵送DMを組み合わせた都内攻略ルート', level: 2 },
    ],
    sections: [
      {
        id: 'tokyo-ward-matrix',
        title: '1. 東京都心エリア別：B2B商材との相性マトリクス',
        paragraphs: [
          '全国で最も企業数が多く市場規模が大きい東京都では、単に「都道府県＝東京都」で絞っただけでは数百万社近い候補が並んでしまいます。商材の単価や決裁スピードに合わせ、まずは主要区ごとの産業集積を理解してセグメントを切ることが鉄則です。',
        ],
        table: {
          headers: ['主要エリア・区', '集積している主な企業層', '相性の良いB2B商材・提案切り口'],
          rows: [
            ['千代田区・中央区', '上場大企業本社、メガバンク、総合商社、老舗メーカー、士業', 'セキュリティ、監査・ガバナンス、大型ERP、役員向け福利厚生'],
            ['港区・渋谷区', '急成長スタートアップ、SaaS/Web企業、外資系日本法人、広告代理店', '採用支援、リード獲得自動化、DXコンサル、クラウドインフラ'],
            ['新宿区・豊島区', '成長中の不動産・建設、人材派遣、システム受託、店舗運営本部', '営業リスト作成、インサイドセールス代行、業務効率化SaaS'],
            ['品川区・大田区', '大手SIer、精密製造・物流拠点、B2B技術系メーカー', 'サプライチェーン管理、工場DX、技術職採用、ISO/品質支援'],
          ],
        },
        hubLinks: [
          {
            badge: '東京都マスターハブ',
            label: '東京都の企業一覧・経済指標データ（/ja/area/13）',
            href: '/area/13',
            description: '東京都内の全主要企業・区別分布・主要業種・求人企業を網羅したハブ。',
          },
          {
            badge: '東京 × 情報通信業',
            label: '東京都のIT・情報通信企業一覧',
            href: '/industry/39/location/13',
            description: 'JSIC中分類39（情報サービス業）に該当する東京都内のIT企業リストへ直行。',
          },
        ],
      },
      {
        id: 'building-based-abm',
        title: '2. 「ビル入居企業リスト」が最強のABM指標になる理由',
        paragraphs: [
          '非上場の中堅・スタートアップ企業の中には、決算書を公開しておらず売上規模が外から見えにくい会社が多数あります。そうした企業の購買力を測る上で極めて有効なのが「入居しているオフィスビルのグレード」です。',
          '坪単価の高いランドマークタワーや再開発ビル（丸の内ビルディング、六本木ヒルズ森タワー、渋谷スクランブルスクエア、新宿野村ビル等）に登記・入居している企業は、採用ブランド力や事業成長力を維持するために相応の固定費を払える財務基盤を持っています。ビル単位で企業をまとめれば、1回の訪問や配送で同じ建物内の数十社へ同時にアプローチできます。',
        ],
        hubLinks: [
          {
            badge: 'ビル別名鑑TOP100',
            label: '全国主要オフィスビル・タワー名鑑',
            href: '/building',
            description: '東京・大阪・横浜・名古屋・福岡の主要高層ビル別に入居法人一覧を検索。',
          },
          {
            badge: '港区ランドマーク',
            label: '六本木ヒルズ森タワー 入居企業一覧',
            href: '/building/roppongi-hills-mori-tower',
            description: 'ITメガベンチャー・外資・投資ファンドが集積する六本木ヒルズ内の企業データ。',
          },
          {
            badge: '丸の内エリア',
            label: '丸の内ビルディング 入居企業一覧',
            href: '/building/marunouchi-building',
            description: '東京駅直結のビジネス中枢「丸ビル」に拠点を置く有力法人一覧。',
          },
        ],
      },
      {
        id: 'tokyo-it-targeting',
        title: '3. 渋谷区・港区のIT/SaaS企業を業種コードで精密抽出する',
        paragraphs: [
          'IT・Web企業は変化が激しく、事業拡大に伴うオフィス増床移転や中途採用が頻繁に発生します。東京都内のIT業界を狙う際は、「情報通信業（JSIC 39等）」×「求人あり（採用シグナル）」または「本店移転履歴あり」を掛け合わせることで、いままさに予算を投下している成長企業をピンポイントで抽出できます。',
        ],
        callout: {
          title: '🏢 東京都内の「ビル名・区名・業種」で今すぐ絞り込む',
          body: '詳細検索画面では市区町村（港区・渋谷区など）や資本金・電話番号ありを掛け合わせて、高精度な東京都営業リストを即時作成できます。',
          buttonText: '東京の企業を検索する',
          href: '/search?prefecture=13',
        },
      },
      {
        id: 'multi-touch-execution',
        title: '4. 電話・フォーム・郵送DMを組み合わせた都内攻略ルート',
        paragraphs: [
          '都心の成長企業は代表電話が自動音声だったり受付代行が入っていたりするケースも増えているため、フォーム営業（問い合わせフォーム送信）と、決裁者宛ての簡潔な手紙・DM、そしてフォローコールの3段構えが有効です。特にオフィスビル単位のリストを使えば「同じビル内の企業導入事例」を文面に添えるだけで開封率と商談化率が大きく向上します。',
        ],
      },
    ],
    faqs: [
      {
        question: 'バーチャルオフィスやシェアオフィス住所をリストから除外できますか？',
        answer: 'はい。詳細検索で資本金・従業員数・厚生年金被保険者数・電話番号あり（固定番号）等のフィルタ条件を組み合わせることで、実態のある事業拠点を持つ企業を優先的に抽出できます。',
      },
      {
        question: '東京都以外の関東圏（神奈川・埼玉・千葉）も同時に抽出可能ですか？',
        answer: '可能です。都道府県フィルタで東京・神奈川・埼玉・千葉を複数選択することで、首都圏一都三県を網羅した営業リストを一括作成できます。',
      },
    ],
    cta: {
      title: {
        ja: '東京都の優良企業・オフィスビル別リストを見る',
        en: 'Explore Tokyo Corporate & Tower Directories',
        vi: 'Khám phá Danh bạ Doanh nghiệp & Tòa nhà tại Tokyo',
      },
      desc: {
        ja: '都心エリアの主要法人・高層ビル入居企業・IT/SaaS企業を国税庁・公的データ基準で今すぐ閲覧できます。',
        en: 'Browse verified Tokyo enterprises, major wards, and landmark skyscraper tenant lists.',
        vi: 'Tra cứu doanh nghiệp đầu tàu, theo quận và theo từng cao ốc biểu tượng tại Tokyo.',
      },
      buttonText: {
        ja: '東京都エリアハブへ',
        en: 'Go to Tokyo Hub',
        vi: 'Đến Hub Tokyo',
      },
      href: '/ja/area/13',
    },
  },

  // =========================================================================
  // BÀI 10: 大阪府・関西エリア 製造業・商業B2B企業リスト開拓ガイド
  // =========================================================================
  {
    slug: 'kansai-osaka-manufacturing-b2b-list',
    category: 'sales-list',
    categoryLabel: {
      ja: '営業リスト作成・Excel',
      en: 'Sales Lists & Excel',
      vi: 'Danh sách bán hàng & Excel',
    },
    title: {
      ja: '大阪府・関西圏の「製造業・卸売・中小企業」営業リスト構築と取引先開拓戦略',
      en: 'Osaka & Kansai B2B Prospecting Guide: Manufacturing, Wholesale & SME Database Strategy',
      vi: 'Chiến lược Lập danh sách Doanh nghiệp Sản xuất & Thương mại vùng Osaka – Kansai',
    },
    metaDescription: {
      ja: '西日本最大の経済圏である大阪府（大阪市・東大阪市・堺市）および兵庫・京都のモノづくり・卸売企業に向けたB2B営業リスト作成ノウハウ。公的許認可とJSIC業種分類を活用した高精度ターゲティング。',
      en: 'Practical strategies for building high-converting B2B sales lists across Osaka, Hyogo, and Kyoto manufacturing and wholesale sectors.',
      vi: 'Phương pháp khai thác cơ sở dữ liệu doanh nghiệp B2B vùng Kansai (Osaka, Hyogo, Kyoto) trọng tâm ngành chế tạo và bán buôn.',
    },
    keywords: [
      '大阪 企業一覧 営業リスト',
      '関西 製造業 データベース',
      '東大阪 堺 製造業 企業リスト',
      '大阪 中小企業 開拓 方法',
      '梅田 グランフロント 入居企業',
      '関西 B2B 営業 ターゲット',
    ],
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    readTimeMinutes: 6,
    featured: false,
    author: {
      name: 'Kigyou-list 関西産業リサーチ班',
      role: '西日本B2Bマーケットアナリスト',
    },
    highlights: {
      ja: [
        '大阪府は日本有数の「ものづくり中小企業・専門商社・卸売」が集積し、決裁スピードが速い実利重視の市場',
        '東京一極集中の営業ツールに比べ、関西圏では「電話・FAX・訪問」と「公式フォーム」の併用が依然として強力',
        '大阪（梅田・本町・東大阪）× 兵庫（神戸・尼崎）× 京都（精密機械・老舗テック）の2府1県セット設計が最適',
        '建設業・製造業では公的許認可・公共入札資格の有無を見ることで、下請けから元請け・優良企業を選別可能',
      ],
      en: [
        'Osaka hosts dense clusters of specialized manufacturers and wholesalers known for pragmatic, fast decision cycles',
        'Combining phone/FAX outreach with web contact forms outperforms email-only sequences in Kansai SME markets',
        'Segment Osaka, Hyogo, and Kyoto together to cover Western Japan’s core industrial supply chains',
        'Use public tender qualifications and statutory licenses to separate established prime contractors from micro-shops',
      ],
      vi: [
        'Osaka quy tụ mật độ dày đặc doanh nghiệp chế tạo và thương mại bán buôn SME với tốc độ ra quyết định thực dụng, nhanh chóng',
        'Tại vùng Kansai, kết hợp gọi điện trực tiếp với gửi Form doanh nghiệp cho hiệu quả cao hơn hẳn chỉ gửi email đơn thuần',
        'Kết hợp Osaka – Hyogo – Kyoto thành cụm thị trường Tây Nhật Bản hoàn chỉnh theo mã ngành JSIC',
        'Dựa vào lịch sử đấu thầu công và giấy phép để chọn lọc các nhà thầu chính có thực lực tài chính',
      ],
    },
    tableOfContents: [
      { id: 'kansai-characteristics', title: '1. 関西B2B市場（大阪・兵庫・京都）の構造と営業アプローチの特徴', level: 2 },
      { id: 'manufacturing-wholesale', title: '2. 大阪の製造業（JSIC E/C）と専門商社・卸売の絞り込み方', level: 2 },
      { id: 'umeda-landmarks', title: '3. 梅田・淀屋橋・本町の主要オフィス拠点企業へのアクセス', level: 2 },
      { id: 'contact-channel-mix', title: '4. 電話番号・FAX・フォームURLを揃えたリスト運用術', level: 2 },
    ],
    sections: [
      {
        id: 'kansai-characteristics',
        title: '1. 関西B2B市場（大阪・兵庫・京都）の構造と営業アプローチの特徴',
        paragraphs: [
          '西日本の中核である大阪府と隣接する兵庫県・京都府には、高度技術を持つ町工場や部品メーカー、繊維・食品・機械系の専門商社が網の目のように集積しています。東京と比べて老舗のオーナー企業比率が高く、「費用対効果（実利）」と「人対人の信頼感」が商談成約の鍵を握ります。',
          'そのため、営業リスト作成の段階でも単に社名を集めるだけでなく、代表者名・創業規模（設立年・資本金）・代表電話番号・公式サイトURLが正しく揃っている高品質なマスターデータを用いることが重要です。',
        ],
        hubLinks: [
          {
            badge: '大阪府エリア',
            label: '大阪府の企業データベース（/ja/area/27）',
            href: '/area/27',
            description: '大阪市（中央区・北区・西区）や東大阪市・堺市など大阪府全域の企業データハブ。',
          },
          {
            badge: '兵庫県・京都府',
            label: '兵庫県の企業一覧（/ja/area/28）',
            href: '/area/28',
            description: '神戸・尼崎・姫路の重工業・製造業・物流企業データを確認。',
          },
          {
            badge: '京都府エリア',
            label: '京都府の企業一覧（/ja/area/26）',
            href: '/area/26',
            description: '電子部品・精密機器・観光・老舗中堅企業が集積する京都府ハブ。',
          },
          {
            badge: '大阪×業種マトリクス',
            label: '大阪府の製造業（JSIC）企業一覧',
            href: '/industry/E/location/27',
            description: '大阪府内の製造・建設関連企業の主要リストを業種×地域で直接参照。',
          },
        ],
      },
      {
        id: 'manufacturing-wholesale',
        title: '2. 大阪の製造業（JSIC E/C）と専門商社・卸売の絞り込み方',
        paragraphs: [
          '東大阪・八尾・堺といったモノづくり集積地の中堅メーカーへ設備・DX・採用支援を提案する場合、従業員数10名〜100名クラスに絞ってターゲット設計すると決裁者（社長・工場長）へ直接届きやすくなります。また、厚生年金被保険者数が把握できるデータを使えば、幽霊会社や休業状態を除外して実稼働している工場だけをリスト化できます。',
        ],
      },
      {
        id: 'umeda-landmarks',
        title: '3. 梅田・淀屋橋・本町の主要オフィス拠点企業へのアクセス',
        paragraphs: [
          '大阪の大手・成長企業の本社機能や西日本支社は、JR大阪駅周辺（梅田）および御堂筋ライン（淀屋橋・本町）の大型複合ビルに集中しています。特にグランフロント大阪などの大型タワー入居企業をピックアップすれば、西日本のハイエンドB2Bターゲット層へ効率的にアプローチできます。',
        ],
        hubLinks: [
          {
            badge: '梅田ランドマーク',
            label: 'グランフロント大阪 入居企業名鑑',
            href: '/building/grand-front-osaka',
            description: '西日本最大級のビジネス複合拠点「グランフロント大阪」入居法人のデータを確認。',
          },
        ],
      },
      {
        id: 'contact-channel-mix',
        title: '4. 電話番号・FAX・フォームURLを揃えたリスト運用術',
        paragraphs: [
          '関西圏の伝統的な製造業・建設業・卸売業では、コーポレートサイトのフォームだけでなく代表電話やFAXへの一次接触が今なお高い反応率を示します。Kigyou-listの詳細検索では「電話番号あり」「Webフォームあり」を併用して抽出できるため、先方の窓口文化に合わせたチャネル選択が可能です。',
        ],
        callout: {
          title: '⚙️ 大阪府内のターゲット企業を今すぐ絞り込む',
          body: '電話番号あり・インボイス登録済み・求人ありなどの実務フィルタを組み合わせて、大阪府の営業リストを即座に生成できます。',
          buttonText: '大阪府で条件検索する',
          href: '/search?prefecture=27',
        },
      },
    ],
    faqs: [
      {
        question: '大阪市内の区単位（中央区・北区・西区など）でリストを分けられますか？',
        answer: 'はい。詳細検索画面で都道府県を「大阪府」に選択したあと、市区町村フィルタで大阪市の各行政区や東大阪市・堺市等を指定して絞り込めます。',
      },
      {
        question: '関西の中小企業向けリストはどのくらいの頻度で更新されますか？',
        answer: '国税庁の法人番号差分データや官公庁の許認可・求人データを毎日自動同期しているため、新規設立や移転もタイムリーに反映されます。',
      },
    ],
    cta: {
      title: {
        ja: '大阪府の主要企業データハブを確認する',
        en: 'Explore Osaka Corporate Directory Hub',
        vi: 'Khám phá Danh bạ Doanh nghiệp Tỉnh Osaka',
      },
      desc: {
        ja: '大阪府内の製造・商業・IT企業ランキングと最新動態データをリアルタイムで閲覧できます。',
        en: 'Access real-time corporate rankings, addresses, and verified business signals across Osaka Prefecture.',
        vi: 'Tra cứu bảng xếp hạng và dữ liệu doanh nghiệp cập nhật liên tục tại Osaka.',
      },
      buttonText: {
        ja: '大阪府エリアページを見る',
        en: 'View Osaka Hub',
        vi: 'Xem Hub Osaka',
      },
      href: '/ja/area/27',
    },
  },

  // =========================================================================
  // BÀI 11: 建設業許可・宅建業保有企業へのB2B営業リスト活用ガイド
  // =========================================================================
  {
    slug: 'construction-license-kensetsu-sales-guide',
    category: 'data-compliance',
    categoryLabel: {
      ja: '法人番号・インボイス・許認可',
      en: 'Registries & Compliance',
      vi: 'Pháp lý & Mã số thuế',
    },
    title: {
      ja: '「建設業許可・宅建業免許」保有企業リストの調べ方とB2B営業活用ガイド｜国土交通省データ直結',
      en: 'How to Leverage MLIT Construction & Real Estate License Directories for B2B Sales',
      vi: 'Bí quyết Khai thác Danh sách Doanh nghiệp có Giấy phép Xây dựng & BĐS (MLIT) cho Sales B2B',
    },
    metaDescription: {
      ja: '建設業許可（一般・特定／大臣・知事）や宅地建物取引業免許を持つ企業は、法令上一定の資産要件・専任技術者をクリアした優良ターゲットです。公的許認可データを使った絞り込みと商材提案のポイントを解説。',
      en: 'Target financially qualified contractors and real estate firms holding active MLIT construction and brokerage licenses across all 47 Japanese prefectures.',
      vi: 'Nhắm chính xác tệp nhà thầu xây dựng và sàn BĐS đủ điều kiện vốn pháp định thông qua cơ sở dữ liệu giấy phép Bộ Đất đai & Giao thông (MLIT).',
    },
    keywords: [
      '建設業許可 会社 一覧 調べ方',
      '特定建設業 企業リスト',
      '宅建業者 一覧 営業リスト',
      '建設会社 営業 リスト作成',
      '工事 施工管理 SaaS ターゲット',
      '国土交通省 建設業者 検索',
    ],
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    readTimeMinutes: 7,
    featured: false,
    author: {
      name: 'Kigyou-list 官公庁許認可リサーチ班',
      role: '業法・免許データベースアナリスト',
    },
    highlights: {
      ja: [
        '建設業許可の取得企業は「500万円以上の資金調達能力・専任技術者・社会保険加入」の法定要件を満たしている',
        '特に「特定建設業許可」保有企業は元請けとして大型発注を行う立場にあり、B2B高単価商材の最有力ターゲット',
        'JSIC業種コード単体では混ざってしまう「名ばかり建設会社」も、許可レコード照合で確実に選別可能',
        '施工管理SaaS・安全機材・外国人特定技能人材・損害保険などの営業では、許可区分別セグメントが成約率を劇的に改善',
      ],
      en: [
        'Construction license holders pass statutory capital, technical staff, and social insurance thresholds',
        'Special Construction License (特定建設業) holders act as prime contractors with substantial procurement budgets',
        'License registry matching filters out inactive firms that merely carry a generic construction JSIC tag',
        'Ideal segmentation for site management SaaS, equipment leasing, skilled labor staffing, and commercial insurance',
      ],
      vi: [
        'Doanh nghiệp có Giấy phép Xây dựng đã vượt qua thẩm định năng lực vốn, kỹ sư chuyên trách và bảo hiểm xã hội bắt buộc',
        'Nhóm Giấy phép Xây dựng Đặc biệt (特定建設業) là các tổng thầu lớn có ngân sách đầu tư DX & thiết bị rất cao',
        'Đối soát thẳng vào sổ bộ giấy phép giúp loại bỏ hoàn toàn các công ty rỗng chỉ khai ngành xây dựng trên danh nghĩa',
        'Tệp khách hàng vàng cho phần mềm quản lý công trường, vật tư, nhân sự nước ngoài và bảo hiểm doanh nghiệp',
      ],
    },
    tableOfContents: [
      { id: 'why-license-data', title: '1. なぜ「業種分類」より「公的許認可データ」の営業リストが強いのか？', level: 2 },
      { id: 'kensetsu-and-takken', title: '2. 建設業許可と宅建業免許で狙える顧客層の違い', level: 2 },
      { id: 'prefecture-targeting', title: '3. 都道府県別・保有許認可別の精密ターゲティング実務', level: 2 },
      { id: 'pitch-angles', title: '4. 建設・不動産企業の決裁者に刺さる3つの提案切り口', level: 2 },
    ],
    sections: [
      {
        id: 'why-license-data',
        title: '1. なぜ「業種分類」より「公的許認可データ」の営業リストが強いのか？',
        paragraphs: [
          '一般的な法人リストで「建設業」「不動産業」を検索すると、定款に事業目的として書いただけの休眠会社や、軽微な作業のみを行う個人規模の法人が大量に混入します。営業現場で架電しても「今はやっていない」「担当者がいない」と空振りが続く最大の原因です。',
          '対照的に、国土交通大臣または都道府県知事から正式に「建設業許可」や「宅地建物取引業免許」の交付・更新を受けている企業は、経営業務の管理責任者や専任技術者の在籍、財産的基礎、欠格事由なしという厳しい審査を継続的に通過しています。すなわち、許認可データで絞るだけで「確実に実業が動いている有資格企業」だけを抽出できるのです。',
        ],
      },
      {
        id: 'kensetsu-and-takken',
        title: '2. 建設業許可と宅建業免許で狙える顧客層の違い',
        paragraphs: [
          '同じ建設・不動産領域でも、保有している免許の種類によって抱えている経営課題と導入しやすいツールは明確に異なります。',
        ],
        table: {
          headers: ['公的許認可区分', '対象となる企業の特徴', '優先提案すべきB2Bソリューション'],
          rows: [
            ['特定建設業許可', '4,500万円（建築一式は7,000万円）以上の下請契約を発注する元請ゼネコン・大型専門工事業', '安全書類電子化、協力業者管理、BIM/施工管理DX、CCUS連携、特定技能人材'],
            ['一般建設業許可', '地域密着の工務店・リフォーム・電気/管/内装工事等の専門施工会社', '見積/原価管理クラウド、Web集客支援、作業服・工具EC、車両リース・保険'],
            ['宅地建物取引業免許', '不動産売買仲介、賃貸管理、デベロッパー・買取再販業者', '電子契約・重説DX、物件追客CRM、空室対策リノベーション、法人社宅連携'],
          ],
        },
        hubLinks: [
          {
            badge: '建設業許可（全国）',
            label: '建設業許可保有企業一覧（全国ハブ）',
            href: '/license/kensetsu',
            description: '国土交通省データの建設業許可保有企業を全国・47都道府県別に即時閲覧。',
          },
          {
            badge: '東京 × 建設業許可',
            label: '東京都の建設業許可企業一覧（/ja/license/kensetsu/13）',
            href: '/license/kensetsu/13',
            description: '東京都内の一般・特定建設業許可保有企業の最新マスターへ直接アクセス。',
          },
          {
            badge: '大阪 × 建設業許可',
            label: '大阪府の建設業許可企業一覧（/ja/license/kensetsu/27）',
            href: '/license/kensetsu/27',
            description: '大阪府に本店を置く建設業許可取得法人リスト。',
          },
          {
            badge: '東京 × 宅建業者',
            label: '東京都の宅地建物取引業者一覧（/ja/license/takken/13）',
            href: '/license/takken/13',
            description: '東京都内の宅建免許保有企業を所在地・連絡先付きで一括閲覧。',
          },
        ],
      },
      {
        id: 'prefecture-targeting',
        title: '3. 都道府県別・保有許認可別の精密ターゲティング実務',
        paragraphs: [
          '建設業界では現場への資材搬入や法規制（時間外労働の上限規制、2024年問題など）が地域や許可種別によって密接に連動します。まずは自社がサポート可能な都道府県単位（例：関東エリアなら東京・神奈川・埼玉・千葉）で許可保有企業を抽出し、そのうえで「求人中（現場監督や職人を積極採用中）」の条件を重ねると、人手不足対策や業務省力化ツールの提案に極めて高い反応が得られます。',
        ],
        callout: {
          title: '🏗️ 許認可 × 都道府県 × 求人シグナルで建設企業を抽出',
          body: '建設業許可だけでなく古物商・宅建・労働者派遣など9大公的許認可ハブから都道府県別にターゲットリストを閲覧できます。',
          buttonText: '公的許認可ハブ全体を見る',
          href: '/licenses',
        },
      },
      {
        id: 'pitch-angles',
        title: '4. 建設・不動産企業の決裁者に刺さる3つの提案切り口',
        paragraphs: [
          '現場が忙しい建設・不動産会社の社長や現場責任者にアプローチする際は、長々とした会社説明を避け、「残業規制対応・事務作業の圧縮」「協力会社の確保・採用強化」「施工品質・電子帳簿対応」の3点に絞って簡潔にメリットを提示することが重要です。許認可番号や最近の公共入札実績に触れると、先方に「自社をよく調べているプロ」という信頼感を与えられます。',
        ],
      },
    ],
    faqs: [
      {
        question: '5年ごとの建設業許可更新や廃業もデータに反映されますか？',
        answer: 'はい。官公庁公表の許認可データベース更新に合わせて新規登録・更新・失効状況を同期しているため、常に稼働中の許可業者を優先して抽出できます。',
      },
      {
        question: '建設業以外の許認可（古物商や旅館業、飲食店営業など）も検索できますか？',
        answer: '可能です。Kigyou-listでは建設業・宅建業のほか、登録支援機関、古物商、労働者派遣事業、有料職業紹介、士業登録、旅館業など幅広い許認可別ハブを提供しています。',
      },
    ],
    cta: {
      title: {
        ja: '全国47都道府県の公的許認可企業リストを開く',
        en: 'Explore Licensed Corporate Hubs Across 47 Prefectures',
        vi: 'Khám phá CSDL Doanh nghiệp theo Giấy phép trên toàn Nhật Bản',
      },
      desc: {
        ja: '建設業許可・宅建・古物商・登録支援機関などの公式許可保有企業を地域別に一括検索できます。',
        en: 'Browse verified businesses holding official government licenses in construction, real estate, staffing, and more.',
        vi: 'Tra cứu các doanh nghiệp được cấp phép chính thức từ Bộ ngành Nhật Bản theo từng tỉnh thành.',
      },
      buttonText: {
        ja: '許認可ハブを見る',
        en: 'View Licenses Hub',
        vi: 'Xem Hub Giấy phép',
      },
      href: '/ja/licenses',
    },
  },

  // =========================================================================
  // BÀI 12: 登録支援機関・特定技能・外国人採用企業リスト活用ガイド
  // =========================================================================
  {
    slug: 'tokutei-ginou-registered-support-org-guide',
    category: 'data-compliance',
    categoryLabel: {
      ja: '法人番号・インボイス・許認可',
      en: 'Registries & Compliance',
      vi: 'Pháp lý & Mã số thuế',
    },
    title: {
      ja: '「登録支援機関」一覧の調べ方と特定技能・外国人採用企業へのB2B営業・アライアンス戦略',
      en: 'Guide to ISA Registered Support Organizations & Specified Skilled Worker Hiring Markets',
      vi: 'Hướng dẫn Khai thác Danh bạ Tổ chức Hỗ trợ Tokutei Ginou & Doanh nghiệp Tuyển dụng Nhân sự Nước ngoài',
    },
    metaDescription: {
      ja: '出入国在留管理庁が認定する「登録支援機関（特定技能）」の公式登録企業リストを活用したB2B開拓ガイド。人材紹介・監理団体・多言語SaaS・外国人向け住宅・通信事業者が成約を伸ばす絞り込み法を解説。',
      en: 'How HR agencies, multilingual SaaS, housing, and compliance vendors find and partner with Registered Support Organizations (登録支援機関) across Japan.',
      vi: 'Chiến lược tìm kiếm đối tác & bán hàng B2B tới các Tổ chức hỗ trợ Tokutei Ginou được Cục Xuất nhập cảnh Nhật Bản (ISA) công nhận.',
    },
    keywords: [
      '登録支援機関 一覧',
      '登録支援機関 調べ方 営業',
      '特定技能 受け入れ企業 リスト',
      '外国人採用 企業 営業リスト',
      '人材派遣 有料職業紹介 企業一覧',
      '出入国在留管理庁 登録支援機関 データベース',
    ],
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    readTimeMinutes: 7,
    featured: false,
    author: {
      name: 'Kigyou-list 人材・特定技能リサーチ班',
      role: '外国人材マーケットアナリスト',
    },
    highlights: {
      ja: [
        '全国の登録支援機関は出入国在留管理庁に登録された正規事業者であり、特定技能外国人の受入れ実務の中核',
        '人材会社・日本語教育・翻訳ツール・住宅保証・金融送金サービスにとって、極めて相性の良いB2Bアライアンス先',
        '登録支援機関ハブに加え「労働者派遣事業」「建設業許可」「積極採用企業（求人あり）」を組み合わせると商談機会が倍増',
        '都道府県別（東京・大阪・愛知・福岡等）で現地の支援機関を抽出し、地域別の人材紹介パートナー網を即構築',
      ],
      en: [
        'ISA Registered Support Organizations sit at the center of Japan’s Specified Skilled Worker recruitment pipeline',
        'High-value B2B partner channel for staffing firms, EdTech, translation SaaS, housing guarantees, and fintech services',
        'Cross-filter with staffing licenses and active hiring signals to pinpoint firms with immediate placement demand',
        'Build localized regional partnership lists across Tokyo, Osaka, Aichi, and Fukuoka in seconds',
      ],
      vi: [
        'Tổ chức hỗ trợ đăng ký (登録支援機関) là mắt xích trung tâm tiếp nhận lao động Kỹ năng đặc định (Tokutei Ginou) tại Nhật',
        'Kênh đối tác B2B lý tưởng cho công ty nhân sự, đào tạo tiếng Nhật, phần mềm đa ngôn ngữ, nhà ở và tài chính',
        'Kết hợp dữ liệu giấy phép Haken và tín hiệu tuyển dụng (求人あり) để tìm đúng doanh nghiệp đang thiếu nhân lực ngay lập tức',
        'Dễ dàng lọc danh sách đối tác từng tỉnh như Tokyo, Osaka, Aichi, Fukuoka chỉ trong vài giây',
      ],
    },
    tableOfContents: [
      { id: 'what-is-tokutei-org', title: '1. 登録支援機関データベースが持つB2B営業上の価値', level: 2 },
      { id: 'who-should-target', title: '2. 登録支援機関・受入れ企業への提案で成約しやすい5領域', level: 2 },
      { id: 'combining-hr-licenses', title: '3. 「登録支援機関 × 労働者派遣 × 求人シグナル」の掛け合わせ法', level: 2 },
      { id: 'regional-outreach', title: '4. 地域別の協業・開拓パートナーリスト作成ステップ', level: 2 },
    ],
    sections: [
      {
        id: 'what-is-tokutei-org',
        title: '1. 登録支援機関データベースが持つB2B営業上の価値',
        paragraphs: [
          '少子高齢化による深刻な人手不足を背景に、特定技能（1号・2号）制度を活用した外国人材の採用は、建設・製造・介護・外食・宿泊・物流などあらゆる現場に広がっています。その受入れ企業から委託を受けて生活オリエンテーション、住居確保、定期面談などの義務的支援を実施するのが、出入国在留管理庁に登録された「登録支援機関」です。',
          '登録支援機関として登録されている法人は、特定技能の受入れ企業のネットワークと決裁ルートをすでに保有している「ハブ企業」そのものです。そのため、外国人関連商材の販路拡大を目指す企業にとって、1社の登録支援機関と提携できれば背後にある数十社の受入れ企業へ一気にリーチできる高いレバレッジが働きます。',
        ],
        hubLinks: [
          {
            badge: 'ISA 登録支援機関',
            label: '登録支援機関 企業一覧（全国ハブ）',
            href: '/license/tokutei',
            description: '出入国在留管理庁の最新登録に基づく全国の登録支援機関一覧。',
          },
          {
            badge: '東京 × 登録支援機関',
            label: '東京都の登録支援機関一覧（/ja/license/tokutei/13）',
            href: '/license/tokutei/13',
            description: '東京都内に拠点を持つ登録支援機関・人材支援企業リスト。',
          },
          {
            badge: '大阪 × 登録支援機関',
            label: '大阪府の登録支援機関一覧（/ja/license/tokutei/27）',
            href: '/license/tokutei/27',
            description: '関西圏の外国人雇用・受入れ支援を担う大阪府内の登録支援機関リスト。',
          },
          {
            badge: '労働者派遣許可',
            label: '労働者派遣事業 許可企業一覧',
            href: '/license/haken',
            description: '厚生労働省許可の派遣会社マスター。人材系アライアンス開拓に直結。',
          },
        ],
      },
      {
        id: 'who-should-target',
        title: '2. 登録支援機関・受入れ企業への提案で成約しやすい5領域',
        paragraphs: [
          '登録支援機関および特定技能を受け入れている法人では、ビザ管理や多言語コミュニケーションの事務負担が急増しています。以下の5領域は特に明確なペイン（課題）が存在し、商談化しやすいテーマです。',
        ],
        bullets: [
          { label: '1. 送り出し・海外人材紹介パートナーシップ', text: '現地（ベトナム・インドネシア・フィリピン等）の人材候補者供給ネットワーク連携・募集代行。' },
          { label: '2. 支援業務効率化SaaS・労務管理ツール', text: '出入国在留管理局への四半期定期届出・在留期限管理・3ヶ月ごとの面談記録作成の自動化ツール。' },
          { label: '3. 外国人向け賃貸住宅・保証・インフラ', text: '社宅手配・賃貸保証・携帯SIM・銀行口座開設サポート・生活立ち上げ支援サービス。' },
          { label: '4. 多言語翻訳・日本語教育eラーニング', text: '特定技能1号から2号への試験合格支援、現場安全マニュアルの多言語化プラットフォーム。' },
          { label: '5. 医療・労災フォロー・福利厚生', text: '外国人労働者の通訳付き医療相談や緊急時サポートパッケージ。' },
        ],
      },
      {
        id: 'combining-hr-licenses',
        title: '3. 「登録支援機関 × 労働者派遣 × 求人シグナル」の掛け合わせ法',
        paragraphs: [
          '登録支援機関の中には「本業は別の事業（例：協同組合やコンサル）で登録だけ持っている法人」と、「本気で人材事業に投資して拡大している法人」があります。最も商談になりやすい後者を見極めるには、登録支援機関リストに加えて「有料職業紹介・労働者派遣の許可を併有しているか」「ハローワーク等で実際に今スタッフを募集しているか（求人ありシグナル）」を確認するのが近道です。',
        ],
        callout: {
          title: '🤝 いま積極採用・人手不足が顕在化している企業を探す',
          body: '最新のハローワーク求人シグナルハブでは、現在進行形で採用ニーズが発生している都道府県別の求人企業を毎日確認できます。',
          buttonText: '最新求人・採用企業ハブを見る',
          href: '/jobs/latest',
        },
      },
      {
        id: 'regional-outreach',
        title: '4. 地域別の協業・開拓パートナーリスト作成ステップ',
        paragraphs: [
          'まずは製造・建設・介護需要の大きいエリア（東京都・愛知県・大阪府・福岡県など）の登録支援機関一覧をそれぞれリストアップし、代表電話または公式サイトのお問い合わせフォームから「特定技能候補者のご紹介／支援事務の効率化ツールのご案内」として地域特化の打診を行うのが最も高い返信率につながります。',
        ],
      },
    ],
    faqs: [
      {
        question: '登録支援機関ではなく、実際に特定技能外国人を採用しそうな「受入れ側企業」も探せますか？',
        answer: 'はい。「建設業許可一覧」「介護・外食・製造業（JSIC分類）」に「求人あり（積極採用中）」や「都道府県」フィルタを掛け合わせることで、現在人材確保に動いている受入れ候補企業を直接抽出できます。',
      },
      {
        question: '登録支援機関の代表者名や電話番号も確認できますか？',
        answer: 'はい。Kigyou-listの各企業詳細ページでは、許認可保有情報とあわせて13桁法人番号・本社住所・代表電話・公式サイトURL等を統合して確認できます。',
      },
    ],
    cta: {
      title: {
        ja: '登録支援機関（特定技能）データベースを検索する',
        en: 'Browse ISA Registered Support Organizations',
        vi: 'Tra cứu Cơ sở dữ liệu Tổ chức Hỗ trợ Tokutei Ginou',
      },
      desc: {
        ja: '都道府県別の登録支援機関一覧と関連許可（派遣・職業紹介）データを無料で閲覧できます。',
        en: 'Explore nationwide ISA-registered support organizations segmented by prefecture and dual staffing licenses.',
        vi: 'Xem danh sách các cơ quan hỗ trợ Kỹ năng đặc định theo từng tỉnh thành và các giấy phép nhân sự liên quan.',
      },
      buttonText: {
        ja: '登録支援機関ハブを見る',
        en: 'View Support Org Hub',
        vi: 'Xem Hub Tokutei',
      },
      href: '/ja/license/tokutei',
    },
  },

  // =========================================================================
  // BÀI 13: 新設法人リスト営業の黄金タイミング戦略
  // =========================================================================
  {
    slug: 'newly-established-companies-sales-timing',
    category: 'sales-list',
    categoryLabel: {
      ja: '営業リスト作成・Excel',
      en: 'Sales Lists & Excel',
      vi: 'Danh sách bán hàng & Excel',
    },
    title: {
      ja: '「新設法人リスト」営業が最も成約しやすい理由と設立直後の黄金タイミング攻略法',
      en: 'New Company Prospecting Strategy: Capitalizing on the Golden Window After Incorporation',
      vi: 'Chiến lược Tiếp cận Doanh nghiệp Mới thành lập (新設法人) đúng Thời điểm Vàng sau Đăng ký',
    },
    metaDescription: {
      ja: '登記されたばかりの新設法人は「まだ既存取引先・導入ツールが決まっていない」ブルーオーシャン市場です。会計SaaS・Web制作・ネット回線・オフィス環境・法人カード等のB2B営業で返信率を最大化するタイミングと文面設計を解説。',
      en: 'Why newly incorporated Japanese companies convert at 3x higher rates when approached within 30 days for SaaS, banking, office, and web services.',
      vi: 'Vì sao tiếp cận doanh nghiệp mới thành lập trong 30 ngày đầu giúp tăng gấp 3 tỷ lệ chuyển đổi cho dịch vụ kế toán, Web, văn phòng và viễn thông.',
    },
    keywords: [
      '新設法人 リスト 営業',
      '新設法人 アプローチ タイミング',
      '創業直後 企業 営業方法',
      '新設法人 フォーム営業 文面',
      '開業 直後 B2B サービス',
      '国税庁 新設法人 データベース',
    ],
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    readTimeMinutes: 6,
    featured: false,
    author: {
      name: 'Kigyou-list 営業戦略編集部',
      role: 'スタートアップ・新設法人アナリスト',
    },
    highlights: {
      ja: [
        '設立30日以内の新設法人は「銀行口座・会計・Webサイト・通信・採用」のすべてをゼロから選ぶ真っ白な状態',
        '既存ベンダーとのしがらみ（乗り換えコスト）がないため、スタートアップでも大手と同等に比較検討されやすい',
        '法人登記日の翌営業日には国税庁から法人番号が公表されるため、競合より1日でも早く接触するスピードが勝負',
        '株式会社と合同会社（LLC）の違いを押さえ、初期投資フェーズに合ったライトプランを提示するのが成約のコツ',
      ],
      en: [
        'Firms incorporated within 30 days have zero legacy vendor lock-in across accounting, web, telecom, and HR tools',
        'Lower switching friction allows emerging B2B vendors to win deals alongside incumbents',
        'Speed matters: National Tax Agency publishes new corporate numbers shortly after registration',
        'Tailor offer tiers between Kabushiki Kaisha (KK) and Godo Kaisha (GK) based on early capitalization',
      ],
      vi: [
        'Doanh nghiệp mới thành lập dưới 30 ngày chưa có ràng buộc nhà cung cấp cũ về kế toán, Web, viễn thông hay nhân sự',
        'Không gặp rào cản chi phí chuyển đổi (switching cost), giúp nhà cung cấp mới dễ chốt hợp đồng nhanh',
        'Tốc độ là vũ khí: tiếp cận càng sớm ngay khi Quốc thuế NTA vừa công bố mã số pháp nhân càng thắng lớn',
        'Phân loại gói chào hàng phù hợp giữa mô hình cổ phần (Kabushiki) và TNHH (Godo Kaisha)',
      ],
    },
    tableOfContents: [
      { id: 'blue-ocean-new-firms', title: '1. 既存企業への営業と「新設法人営業」の決定的な違い', level: 2 },
      { id: 'buying-timeline-30days', title: '2. 設立後0日〜90日で必ず発生するB2B購買ニーズ一覧', level: 2 },
      { id: 'daily-extraction-flow', title: '3. 毎日更新の新設法人ハブから最短でアプローチする手順', level: 2 },
      { id: 'outreach-tips-new', title: '4. 設立祝いの好印象を与えつつ商談化するアプローチの工夫', level: 2 },
    ],
    sections: [
      {
        id: 'blue-ocean-new-firms',
        title: '1. 既存企業への営業と「新設法人営業」の決定的な違い',
        paragraphs: [
          '設立から何年も経過している企業へ営業する場合、相手はすでに「税理士・会計ソフト・ホームページ制作会社・ネット回線・複合機」などを契約済みです。そのため営業担当者はまず「現在の不満を引き出し、乗り換えの面倒さを乗り越えてもらう」という高いハードルを超えなければなりません。',
          '一方、登記されたばかりの新設法人はインフラがほぼ白紙であり、代表者自身が「今すぐ用意しなければならないもの」を自発的に探している段階です。この「純粋な新規導入ニーズ」とタイミングが重なるため、押し売りではなく「立ち上げの助け」として歓迎されやすいのが最大の特徴です。',
        ],
      },
      {
        id: 'buying-timeline-30days',
        title: '2. 設立後0日〜90日で必ず発生するB2B購買ニーズ一覧',
        paragraphs: [
          '新設法人のニーズは設立からの経過日数によって順番に現れます。自社の商材がどのフェーズに当たるかを把握して接触タイミングを調整しましょう。',
        ],
        table: {
          headers: ['設立からの時期', '社長が直面している実務タスク', '受注率が高いB2B商材・サービス'],
          rows: [
            ['設立直後（1〜14日）', '法人口座開設、税理士選定、名刺・印鑑、法人クレカ手配', '会計ソフト、顧問税理士紹介、法人カード、ネットバンキング連携'],
            ['立ち上げ期（15〜45日）', 'コーポレートサイト公開、営業ツール・ネット電話整備', 'Webサイト制作、フォーム送信/名刺CRM、クラウドPBX、ドメイン/メール'],
            ['事業始動期（45〜90日）', '初期メンバー募集、助成金申請、オフィス増床・設備拡張', '採用媒体/求人支援、創業融資・補助金コンサル、賃貸オフィス・什器'],
          ],
        },
        hubLinks: [
          {
            badge: '全国新設法人（毎日同期）',
            label: '新設法人一覧データベース（/ja/new-companies）',
            href: '/new-companies',
            description: '国税庁の最新登記差分に連動し、全国の新規設立法人を地域・月別で即把握。',
          },
          {
            badge: '2026年11月最新',
            label: '今月（2026年11月）の新設法人リスト',
            href: '/new-companies/2026-11',
            description: '当月指定された出来立ての新設法人を時系列で一覧チェック。',
          },
          {
            badge: '東京都 新設法人',
            label: '東京都の新設法人一覧（/ja/new-companies/tokyo）',
            href: '/new-companies/tokyo',
            description: '新規創業・スタートアップ設立数が日本一の東京都限定リスト。',
          },
          {
            badge: '大阪府 新設法人',
            label: '大阪府の新設法人一覧（/ja/new-companies/osaka）',
            href: '/new-companies/osaka',
            description: '関西圏の新設法人・独立開業企業を毎日自動集約。',
          },
        ],
      },
      {
        id: 'daily-extraction-flow',
        title: '3. 毎日更新の新設法人ハブから最短でアプローチする手順',
        paragraphs: [
          '新設法人営業では「情報鮮度」がすべてです。同じリストを使っていても、登記公表から3日以内にアプローチする会社と、2ヶ月後に連絡する会社では反応率に数倍の差がつきます。Kigyou-listでは国税庁差分システム（NTA Diff Sync）により新規法人番号の指定を日次で自動取り込みしているため、週次または毎日のルーチンとして新着エリアハブをチェックし、対象地域の新設法人へタイムリーに提案を届けることが可能です。',
        ],
      },
      {
        id: 'outreach-tips-new',
        title: '4. 設立祝いの好印象を与えつつ商談化するアプローチの工夫',
        paragraphs: [
          '新設法人の多くはまだ固定電話を引いていなかったり、ホームページを公開中だったりするため、郵送ハガキ・封書DMや、公開直後のWebフォームからの送信が有効です。文面には「このたびのご設立、誠におめでとうございます」という簡潔な祝辞に加え、創業期特有の割引・無料トライアル枠を明示すると返信率が飛躍的に高まります。',
        ],
        callout: {
          title: '🚀 フォーム営業 × 新設法人リストで立ち上げ期企業へ即アプローチ',
          body: '新設法人の最新データを抽出したあとは、企業サイトのお問い合わせフォームや郵送DM向けに営業リストを整理して迅速に初回接点を作れます。',
          buttonText: 'フォーム営業活用ページへ',
          href: '/form-marketing',
        },
      },
    ],
    faqs: [
      {
        question: '株式会社と合同会社（LLC）を絞り込んで区別できますか？',
        answer: 'はい。企業名および法人番号上の種別区分により、株式会社・合同会社・一般社団法人などを把握した上でターゲティングできます。',
      },
      {
        question: '過去に遡って数ヶ月前の新設法人（設立半年以内の企業）も探せますか？',
        answer: 'はい。新設法人ハブでは月別アーカイブ（例：2026-11、2026-10等）を切り替えることで、立ち上げフェーズから成長期に移行した企業も段階別に抽出できます。',
      },
    ],
    cta: {
      title: {
        ja: '全国・最新の新設法人リストを今すぐ閲覧する',
        en: 'Browse Newly Incorporated Companies in Japan',
        vi: 'Xem ngay Danh sách Doanh nghiệp Mới thành lập tại Nhật',
      },
      desc: {
        ja: '国税庁日次差分と連動。設立直後のニュービジネス企業を都道府県別・年月別に無料確認できます。',
        en: 'Updated daily from official National Tax Agency incorporation records across all 47 prefectures.',
        vi: 'Cập nhật hàng ngày trực tiếp từ dữ liệu công bố mã số pháp nhân mới của Quốc thuế Nhật Bản.',
      },
      buttonText: {
        ja: '新設法人ハブを開く',
        en: 'Open New Companies Hub',
        vi: 'Mở Hub Doanh nghiệp mới',
      },
      href: '/ja/new-companies',
    },
  },

  // =========================================================================
  // BÀI 14: 本店移転・合併（トリガーベース営業）戦略ガイド
  // =========================================================================
  {
    slug: 'headquarters-relocation-merger-buying-signals',
    category: 'form-marketing',
    categoryLabel: {
      ja: 'フォーム営業・自動化',
      en: 'Form Outreach',
      vi: 'Gửi Form tự động',
    },
    title: {
      ja: '「本店移転・合併」を購買シグナルに変えるB2Bトリガーベース営業戦略｜変化の瞬間に提案する',
      en: 'Trigger-Based B2B Sales: Converting HQ Relocations & M&A Events into High-Intent Deals',
      vi: 'Chiến lược Bán hàng theo Biến động (Trigger-Based Sales): Chốt đơn từ Chuyển trụ sở & Sáp nhập',
    },
    metaDescription: {
      ja: 'ランダムなテレアポ・一斉配信を脱却し、「本店移転」「合併・組織再編」という公的イベントが発生した企業だけを狙うトリガーベース営業手法。発生直後に発生する設備・IT・人材ニーズと最適なメッセージ例を解説。',
      en: 'Stop cold-blasting static lists. Use official headquarters relocation and corporate merger events as high-intent B2B buying triggers.',
      vi: 'Chấm dứt gửi spam danh sách nguội: tận dụng sự kiện chuyển trụ sở và sáp nhập doanh nghiệp làm tín hiệu mua hàng B2B tỷ lệ chốt cao.',
    },
    keywords: [
      '本店移転 企業 営業',
      'トリガー営業 B2B',
      '移転企業 リスト 作成',
      '合併 組織再編 営業チャンス',
      'インテントデータ 日本 企業',
      '法人 変更履歴 営業活用',
    ],
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    readTimeMinutes: 7,
    featured: false,
    author: {
      name: 'Kigyou-list インテントデータ分析班',
      role: 'ABM・トリガー営業ディレクター',
    },
    highlights: {
      ja: [
        '「何も起きていない企業」に比べ、「本店移転や組織再編が起きた企業」は社内予算と見直し機運が動いている',
        '本店移転 ＝ オフィス回線・内装・防犯・印刷物・保険・近隣拠点開発などの大規模な刷新ニーズが発生',
        '吸収合併・社名変更 ＝ 複数社のSaaS統合・経理CRM刷新・人事評価統一といった大型システム投資のサイン',
        'Kigyou-listの本店移転ハブ・合併ハブを使えば、毎日自動で発生する変更登記をそのまま営業トリガーに変換',
      ],
      en: [
        'Companies undergoing relocation or merger actively re-evaluate budgets and internal vendor stacks',
        'Relocations immediately trigger IT network, interior, security, printing, and insurance procurement',
        'Mergers and reorganizations drive ERP/CRM consolidation, HR integration, and compliance upgrades',
        'Convert live NTA commercial registry changes directly into automated ABM triggers via Kigyou-list hubs',
      ],
      vi: [
        'Doanh nghiệp vừa chuyển trụ sở hoặc sáp nhập đang ở trạng thái chủ động rà soát ngân sách và thay mới nhà cung cấp',
        'Chuyển trụ sở kéo theo nhu cầu tức thì về mạng IT, nội thất, an ninh, in ấn bảng biển và bảo hiểm',
        'Sáp nhập / M&A thúc đẩy các dự án hợp nhất hệ thống ERP, CRM, kế toán và nhân sự quy mô lớn',
        'Theo dõi biến động đăng ký pháp lý hàng ngày trên Kigyou-list để biến sự kiện thành cơ hội bán hàng',
      ],
    },
    tableOfContents: [
      { id: 'why-triggers-convert', title: '1. なぜ「今変化が起きた企業」は商談化率が圧倒的に高いのか？', level: 2 },
      { id: 'relocation-needs', title: '2. 本店移転企業に発生する7つの確実なB2B需要', level: 2 },
      { id: 'merger-needs', title: '3. 吸収合併・商号変更時に動くシステム統合・コンサル案件', level: 2 },
      { id: 'trigger-workflow', title: '4. Kigyou-listでトリガー営業リストを毎日運用するワークフロー', level: 2 },
    ],
    sections: [
      {
        id: 'why-triggers-convert',
        title: '1. なぜ「今変化が起きた企業」は商談化率が圧倒的に高いのか？',
        paragraphs: [
          'B2B営業において最も成約を阻む壁は「競合他社」ではなく「現状維持バイアス（今のままでいいや）」です。どれほど優れた製品を提案しても、社内に変化が起きていない時期には稟議を通す動機が生まれません。',
          'しかし、「オフィスを移転した」「他社を吸収合併した」「代表者が交代した」というタイミングは、これまでの業務ルールや契約を見直さざるを得ない強制的な転換点（Trigger Event）です。この変化を登記データから誰よりも早く捉え、「まさに今、それが必要でした」と言われるタイミングで連絡するのが、最も洗練された現代のABM（アカウントベースドマーケティング）です。',
        ],
      },
      {
        id: 'relocation-needs',
        title: '2. 本店移転企業に発生する7つの確実なB2B需要',
        paragraphs: [
          '法務局へ本店移転登記が出された企業（特に同区内から大規模ビルへの移転、あるいは地方から東京・大阪への進出移転）は、事業拡大・人員増加の勢いに乗っている有望企業が多く、以下の設備・サービス需要が連鎖的に生まれます。',
        ],
        bullets: [
          { label: 'IT・ネットワークインフラ', text: '法人光回線、VPN再設計、複合機・クラウド電話の移設または新規導入。' },
          { label: 'オフィス環境・設備', text: 'オフィス家具追加、グリーンレンタル、ウォーターサーバー、入退室管理セキュリティ。' },
          { label: '印刷・コーポレート変更', text: '新住所記載の名刺・封筒・会社パンフレットの刷り直し、Googleマップ・Web表記改修支援。' },
          { label: '労務・通勤・保険見直し', text: '拠点変更に伴う火災/賠償保険の改定や、新エリアでの人材再採用。' },
        ],
        hubLinks: [
          {
            badge: '毎日同期・移転リスト',
            label: '本店移転・所在地変更企業ハブ',
            href: '/changes/relocation',
            description: '旧住所 ➔ 新住所の変更履歴とともに全国の本店移転企業をリアルタイム閲覧。',
          },
          {
            badge: '東京の本店移転',
            label: '東京都 本店移転企業一覧（/ja/changes/relocation/tokyo）',
            href: '/changes/relocation/tokyo',
            description: '東京都内の増床・移転企業を最新順でトラッキング。',
          },
        ],
      },
      {
        id: 'merger-needs',
        title: '3. 吸収合併・商号変更時に動くシステム統合・コンサル案件',
        paragraphs: [
          '合併・事業承継・社名変更が行われたグループ企業では、「旧A社と旧B社でバラバラだった会計ソフト・勤怠ツール・営業CRMを1つに統一する」「ブランド変更に合わせてWebサイト・営業資料を刷新する」といった、単価数百万円〜数千万円規模の統合プロジェクトが必ず走ります。',
        ],
        hubLinks: [
          {
            badge: '組織再編・M&A',
            label: '合併・組織再編企業ハブ（/ja/changes/merger）',
            href: '/changes/merger',
            description: '国税庁処理区分で検知された全国の吸収合併・組織再編の最新企業リスト。',
          },
          {
            badge: '全異動まとめ',
            label: '全法人変更アーカイブ（/ja/changes）',
            href: '/changes',
            description: '移転・合併・商号変更の月次・日次推移を一括把握。',
          },
        ],
      },
      {
        id: 'trigger-workflow',
        title: '4. Kigyou-listでトリガー営業リストを毎日運用するワークフロー',
        paragraphs: [
          '毎週月曜日に「本店移転ハブ」「合併ハブ」の最新更新を確認し、自社商圏のエリア（例：東京都・大阪府）で絞ってフォーム送信または電話フォローを行うだけで、闇雲なコールドコールに比べて少ない工数で商談パイプラインを維持できます。既存のお客様やターゲット大手100社は「企業監視ウォッチリスト」に登録しておけば、動きがあった瞬間を見逃しません。',
        ],
        callout: {
          title: '🎯 ターゲット企業リストに動きがあったら即通知',
          body: '重要見込み客（ABMリスト）をウォッチリストに登録して、移転・合併・求人開始の瞬間を自動でキャッチしましょう。',
          buttonText: '企業監視ウォッチリストを使う',
          href: '/watchlist',
        },
      },
    ],
    faqs: [
      {
        question: '登記が反映されたということは、すでにお引越しが終わった後ではないですか？',
        answer: 'オフィス家具やインフラの手配は移転前後にわたりますが、移転完了直後の1〜2ヶ月は「新しい環境でまだ足りないもの・変更手続きが漏れているもの（名刺・印刷・周辺B2B契約・増員採用）」が大量に残っているため、むしろ決裁が下りやすい好機です。',
      },
      {
        question: '移転前後の住所の違い（旧住所 ➔ 新住所）も見られますか？',
        answer: 'はい。Kigyou-listの本店移転ハブおよび企業詳細タイムラインでは「旧所在地」と「新所在地」の両方を明記しているため、同県内移転か他県からの進出かも即座に判別できます。',
      },
    ],
    cta: {
      title: {
        ja: '全国の本店移転・組織再編企業データを見る',
        en: 'Explore Live Corporate Relocation & Merger Signals',
        vi: 'Theo dõi Doanh nghiệp Chuyển trụ sở & Sáp nhập mới nhất',
      },
      desc: {
        ja: '商業登記簿・国税庁データと毎日自動同期。変化が起きたばかりのホットな見込み客を抽出できます。',
        en: 'Daily commercial registry triggers to power precision trigger-based B2B outbound campaigns.',
        vi: 'Đồng bộ hàng ngày từ hồ sơ thay đổi đăng ký kinh doanh giúp săn đón khách hàng có nhu cầu nóng nhất.',
      },
      buttonText: {
        ja: '本店移転企業一覧を見る',
        en: 'View Relocated Companies',
        vi: 'Xem DN Chuyển trụ sở',
      },
      href: '/ja/changes/relocation',
    },
  },

  // =========================================================================
  // BÀI 15: 官公庁入札（GEPS）・補助金採択企業への優良B2B開拓ガイド
  // =========================================================================
  {
    slug: 'public-procurement-geps-subsidy-targeting',
    category: 'corporate-analysis',
    categoryLabel: {
      ja: '有報・企業分析',
      en: 'Securities & Analysis',
      vi: 'Phân tích Báo cáo tài chính',
    },
    title: {
      ja: '「官公庁入札実績・補助金採択企業」を狙う高単価B2B開拓戦略｜資金力・信用力が高い優良顧客の見極め方',
      en: 'Targeting Government Contractors (GEPS) & Subsidy Winners: High-Trust B2B Sales Strategy',
      vi: 'Chiến lược Săn Khách hàng B2B Giá trị Cao: Nhắm Doanh nghiệp Trúng thầu Công (GEPS) & Nhận Trợ cấp',
    },
    metaDescription: {
      ja: '国の統一資格・調達ポータル（GEPS）で官公庁の入札案件を落札している企業や、国の補助金に採択された企業は「公的信用力と支払い能力が保証された」最強のターゲットです。絞り込み活用法を詳解。',
      en: 'Why public procurement winners and government-subsidized SMEs represent Japan’s lowest-default, highest-budget B2B segment, and how to filter them.',
      vi: 'Vì sao doanh nghiệp trúng thầu nhà nước (GEPS) và nhận trợ cấp chính phủ là tệp khách hàng ít rủi ro công nợ nhất và có ngân sách đầu tư DX lớn nhất.',
    },
    keywords: [
      '官公庁 入札 企業 一覧',
      '政府調達 GEPS 企業 検索',
      '補助金 採択企業 営業リスト',
      '全省庁統一資格 企業 営業',
      '与信 良い 企業 見つけ方',
      'B2B ターゲット 支払い能力',
    ],
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    readTimeMinutes: 7,
    featured: false,
    author: {
      name: 'Kigyou-list 官公需データ分析班',
      role: '公共調達・財務アナリスト',
    },
    highlights: {
      ja: [
        '国・省庁の入札を落札した企業は「納税証明・社会保険・財務健全性・実績」の厳しい政府審査を通過済み',
        '官公庁からの安定した発注収入があるため、B2B取引における売掛金未回収（貸倒）リスクが極めて低い',
        '補助金採択企業は「今まさに新しい投資（IT・設備・海外展開等）を実行する予算が確定している」状態',
        '平均年収や従業員数データと組み合わせることで、大企業から優良中堅までピンポイントでABMリスト化可能',
      ],
      en: [
        'GEPS procurement winners pass strict government checks for tax compliance, social insurance, and financial solvency',
        'Backed by sovereign government receivables, these firms carry drastically lower payment default risk',
        'Subsidy grantees hold earmarked budgets ready for immediate deployment on IT, equipment, or expansion',
        'Combine with EDINET salary and insured headcount rankings to construct high-precision ABM target lists',
      ],
      vi: [
        'Doanh nghiệp trúng thầu GEPS đã vượt qua vòng thẩm định khắt khe của chính phủ về thuế, bảo hiểm và tài chính',
        'Nhờ nguồn thu ổn định từ ngân sách công, nhóm khách hàng này có tỷ lệ rủi ro nợ xấu cực kỳ thấp',
        'Doanh nghiệp được duyệt trợ cấp là nhóm đã có ngân sách sẵn sàng giải ngân cho chuyển đổi số và thiết bị',
        'Kết hợp với bảng xếp hạng thu nhập & nhân sự EDINET để xây dựng tệp khách hàng ABM tinh hoa',
      ],
    },
    tableOfContents: [
      { id: 'why-gov-contractors', title: '1. なぜ「官公庁入札企業（GEPS）」はB2B営業のプラチナ顧客なのか？', level: 2 },
      { id: 'subsidy-intent', title: '2. 補助金採択履歴が示す「投資意欲の高さ」を読み解く', level: 2 },
      { id: 'filtering-high-quality', title: '3. 財務・被保険者数・入札実績を掛け合わせる精密リスト設計', level: 2 },
      { id: 'trust-in-outreach', title: '4. 公共取引実績のある企業への信頼性を高めるアプローチ法', level: 2 },
    ],
    sections: [
      {
        id: 'why-gov-contractors',
        title: '1. なぜ「官公庁入札企業（GEPS）」はB2B営業のプラチナ顧客なのか？',
        paragraphs: [
          '新規営業でせっかく大型契約を受注できても、数ヶ月後に取引先の資金繰りが悪化して代金回収が滞ってしまっては元も子もありません。B2Bビジネスにおいて「単価が高く」「継続率が高く」「支払いサイトが確実な」理想の顧客を見つける上で、最も信頼できる公的シグナルの一つが「国の調達（GEPS：政府電子調達システム）での落札実績」です。',
          '全省庁統一資格を取得して実際に官公庁の物品製造・役務提供・コンサルティング案件を落札している企業は、反社会的勢力の排除はもちろん、直近の納税完了や適正な帳簿管理が前提となっています。すなわち、国が「この会社は公的事業を任せられる」と裏書したリストに他なりません。',
        ],
      },
      {
        id: 'subsidy-intent',
        title: '2. 補助金採択履歴が示す「投資意欲の高さ」を読み解く',
        paragraphs: [
          '入札実績と並んで注目すべきなのが「国の補助金・助成金（経済産業省・中小企業庁など）への採択企業」です。補助金を申請し採択される企業は、明確な事業計画書を作成できるだけの経営管理力があり、かつ「業務改善や新規事業に今まさに外部投資を行う明確な意思」を持っています。DXツールや外部プロフェッショナルサービスの導入提案に対して最も耳を傾けやすい企業群です。',
        ],
        hubLinks: [
          {
            badge: '詳細条件検索',
            label: '公共入札・補助金実績で企業を絞り込む（/ja/search）',
            href: '/search',
            description: '500万社データベースから「入札実績あり」「決算・財務開示あり」「求人あり」を組み合わせて検索。',
          },
          {
            badge: '給与・資本力指標',
            label: '平均年間給与ランキング（/ja/ranking/salary）',
            href: '/ranking/salary',
            description: '金融庁EDINET有報に基づく高付加価値・高収益企業ランキングを確認。',
          },
          {
            badge: '雇用実力指標',
            label: '厚生年金被保険者数ランキング（/ja/ranking/employees）',
            href: '/ranking/employees',
            description: '正規雇用規模が大きく組織的購買力のある優良企業トップリスト。',
          },
          {
            badge: 'ツール選定ガイド',
            label: '法人リスト作成ツール徹底比較（/ja/compare）',
            href: '/compare',
            description: 'Kigyou-listの公的データ網羅性と他社データベースの仕様を比較。',
          },
        ],
      },
      {
        id: 'filtering-high-quality',
        title: '3. 財務・被保険者数・入札実績を掛け合わせる精密リスト設計',
        paragraphs: [
          'Kigyou-listの詳細検索画面や企業詳細プロフィールでは、GEPSの過去調達落札情報とEDINETの売上・経常利益・平均年収、さらに日本年金機構の厚生年金被保険者数をワンストップで確認できます。「公共調達あり × 被保険者数30名〜300名 × 該当地域」のように絞れば、大企業ほど稟議が重すぎず、それでいて確かな予算と信用力を持つ「日本の中核優良企業」だけを正確に抽出できます。',
        ],
        callout: {
          title: '💼 導入コストと取得件数に応じたプランを確認する',
          body: '無料検索でのターゲット件数シミュレーションから、CSV一括出力・API・自動フォーム営業まで利用規模に合わせた料金プランを用意しています。',
          buttonText: '料金プランを見る',
          href: '/pricing',
        },
      },
      {
        id: 'trust-in-outreach',
        title: '4. 公共取引実績のある企業への信頼性を高めるアプローチ法',
        paragraphs: [
          '官公庁案件を手がける企業は、取引相手にもコンプライアンス遵守・個人情報保護・セキュリティ意識の高さを求めます。アプローチの際は軽率な営業トークではなく、自社の実績やセキュリティ基準、適切な法令遵守姿勢を明確に伝えることが信頼獲得への最短ルートです。',
        ],
      },
    ],
    faqs: [
      {
        question: '官公庁の入札情報（落札履歴）はどのような省庁が含まれますか？',
        answer: '政府電子調達システム（GEPS）等で公表される各府省庁・外局・関連機関における物品・役務等の落札企業データを法人番号ベースで紐づけて集約しています。',
      },
      {
        question: '入札実績のある企業で、今まさに採用を増やしている会社だけを絞れますか？',
        answer: 'はい。詳細検索または各企業プロフィールで「公共入札実績あり」と「求人あり（積極採用シグナル）」を併用することで、事業拡大中の優良受託企業を抽出できます。',
      },
    ],
    cta: {
      title: {
        ja: '500万社データベースで優良ターゲットを検索する',
        en: 'Filter High-Trust Government Contractors Now',
        vi: 'Lọc ngay Danh sách Doanh nghiệp Uy tín & Trúng thầu Công',
      },
      desc: {
        ja: '入札実績・財務指標・許認可・インボイス番号を一元管理する日本企業データベースをお試しください。',
        en: 'Search Japan’s unified corporate database combining public tenders, financials, licenses, and T-Numbers.',
        vi: 'Trải nghiệm CSDL 5 triệu doanh nghiệp Nhật Bản tích hợp đấu thầu công, tài chính, giấy phép và Invoice.',
      },
      buttonText: {
        ja: '企業検索ツールを開く',
        en: 'Open Corporate Search',
        vi: 'Mở công cụ Tìm kiếm',
      },
      href: '/ja/search',
    },
  },
];
