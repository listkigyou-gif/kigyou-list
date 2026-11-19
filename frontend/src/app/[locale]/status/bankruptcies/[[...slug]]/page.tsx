import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, Calendar, ExternalLink, ChevronRight,
  AlertTriangle, ShieldAlert, Download, Filter, FileText
} from 'lucide-react';
import { 
  getHubDynamicEvents, 
  getHubDynamicEventsCount, 
  getHubPrefectureCounts,
  getHubAvailableMonths 
} from '@/lib/db';
import { 
  PREFECTURES, 
  parseHubSlug,
  getPrefectureLabel 
} from '@/lib/hubUtils';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import HubQuickToolbar from '@/components/hubs/HubQuickToolbar';
import HubWatchButton from '@/components/hubs/HubWatchButton';
import HubWatchlistGuideSection from '@/components/hubs/HubWatchlistGuideSection';

export const revalidate = 3600; // Cache for 1 hour with ISR

interface PageProps {
  params: Promise<{
    locale: string;
    slug?: string[];
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale = 'ja', slug } = await params;
  const { prefecture, yearMonth } = parseHubSlug(slug);
  const currentYear = new Date().getFullYear();
  const isVi = locale === 'vi';
  const isEn = locale === 'en';

  const prefLabel = getPrefectureLabel(prefecture, locale);
  const ymLabel = yearMonth
    ? `${yearMonth} `
    : isVi
    ? `${currentYear} mới nhất `
    : isEn
    ? `${currentYear} Latest `
    : `${currentYear}年最新 `;

  const title = isVi
    ? `【${ymLabel.trim()}】Doanh nghiệp phá sản, giải thể tại ${prefLabel} | Kigyou-list`
    : isEn
    ? `[${ymLabel.trim()}] Corporate Bankruptcies in ${prefLabel} | Kigyou-list`
    : `【${ymLabel.trim()}】${prefLabel}の倒産・破産・解散企業一覧 | Kigyou-list`;

  const description = isVi
    ? `【${currentYear} mới nhất】Cơ sở dữ liệu thông tin thay đổi doanh nghiệp: giải thể, phá sản, hoàn tất thanh lý tại ${prefLabel}. Tra cứu mã số pháp nhân, tên công ty, địa chỉ và ngày giải thể phục vụ quản trị rủi ro tín dụng và phòng ngừa nợ xấu.`
    : isEn
    ? `[${currentYear} Latest] Database of corporate bankruptcies, dissolutions, and liquidations registered in ${prefLabel}. Complete coverage of corporate numbers, trade names, addresses, and dissolution dates for credit risk assessment.`
    : `【${currentYear}年最新】${prefLabel}における企業の倒産・破産・解散・清算結了等の異動登記速報データベースです。法人番号、商号、所在地、事由発生年月日を網羅。与信管理、債権回収、取引先信用リスク審査に最適。`;

  const canonicalPath = slug && slug.length > 0 ? `/status/bankruptcies/${slug.join('/')}` : '/status/bankruptcies';

  return {
    title,
    description,
    alternates: {
      canonical: `https://kigyoulist.com/${locale}${canonicalPath}`,
      languages: {
        'ja': `https://kigyoulist.com/ja${canonicalPath}`,
        'en': `https://kigyoulist.com/en${canonicalPath}`,
        'vi': `https://kigyoulist.com/vi${canonicalPath}`,
      }
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}${canonicalPath}`,
      siteName: 'Kigyou-list',
      locale: locale === 'ja' ? 'ja_JP' : locale === 'en' ? 'en_US' : 'vi_VN',
      type: 'website',
    }
  };
}

export default async function BankruptciesHubPage({ params, searchParams }: PageProps) {
  const { locale = 'ja', slug } = await params;
  const { page } = await searchParams;
  const isJa = locale === 'ja';
  const isVi = locale === 'vi';
  const isEn = !isJa && !isVi;

  const { prefecture, yearMonth } = parseHubSlug(slug);
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const limit = 40;
  const offset = (currentPage - 1) * limit;

  // Query events from hub_dynamic_events for 'bankruptcies'
  const [events, totalCount, prefCounts, availableMonths] = await Promise.all([
    getHubDynamicEvents({
      category: 'bankruptcies',
      prefectureCode: prefecture?.code,
      yearMonth: yearMonth || undefined,
      limit,
      offset
    }),
    getHubDynamicEventsCount({
      category: 'bankruptcies',
      prefectureCode: prefecture?.code,
      yearMonth: yearMonth || undefined,
    }),
    getHubPrefectureCounts('bankruptcies', yearMonth || undefined),
    getHubAvailableMonths('bankruptcies', prefecture?.code, 8)
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const prefCountMap = new Map<string, number>();
  for (const pc of prefCounts) {
    prefCountMap.set(pc.prefecture_code, pc.count);
  }

  const prefLabel = getPrefectureLabel(prefecture, locale);
  const currentYear = new Date().getFullYear();

  // Structured Data Schema
  const baseUrl = 'https://kigyoulist.com';
  const pageUrl = `${baseUrl}/${locale}/status/bankruptcies${slug && slug.length > 0 ? '/' + slug.join('/') : ''}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': isVi ? 'Trang chủ' : isEn ? 'Home' : 'ホーム',
            'item': `${baseUrl}/${locale}`
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': isVi ? 'Doanh nghiệp giải thể & phá sản' : isEn ? 'Bankruptcies & Dissolutions' : '倒産・解散企業一覧',
            'item': `${baseUrl}/${locale}/status/bankruptcies`
          },
          ...(prefecture ? [{
            '@type': 'ListItem',
            'position': 3,
            'name': isVi ? `Doanh nghiệp giải thể tại ${prefLabel}` : isEn ? `Dissolved Companies in ${prefLabel}` : `${prefecture.nameJa}の解散企業`,
            'item': `${baseUrl}/${locale}/status/bankruptcies/${prefecture.slug}`
          }] : [])
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        'url': pageUrl,
        'name': isVi
          ? `Danh sách công ty giải thể & thanh lý tại ${prefLabel} 【${currentYear}】`
          : isEn
          ? `Bankruptcies & Dissolutions in ${prefLabel} [${currentYear}]`
          : `${prefLabel}の倒産・解散・清算企業一覧【${currentYear}年最新】`,
        'description': isVi
          ? `Danh sách doanh nghiệp hoàn tất giải thể & thanh lý tại ${prefLabel}.`
          : isEn
          ? `Public registry records of corporate dissolutions and liquidations in ${prefLabel}.`
          : `${prefLabel}における企業の解散・清算登記データ一覧です。`,
        'isBasedOn': 'https://www.houjin-bangou.nta.go.jp/',
        'creditText': `出典: Kigyou-list（企業リスト） - ${prefLabel}の倒産・解散・清算企業一覧 (${pageUrl})`,
        'copyrightNotice': `© Kigyou-list (TQC株式会社) - 引用時は出典URL（${pageUrl}）を明記してください。`,
        'mainEntity': {
          '@type': 'ItemList',
          'numberOfItems': events.length,
          'itemListElement': events.map((ev, idx) => ({
            '@type': 'ListItem',
            'position': offset + idx + 1,
            'item': {
              '@type': 'Corporation',
              'name': ev.company_name,
              'identifier': ev.corporate_number,
              'address': `${ev.prefecture_name}${ev.city_name || ''}`,
              'url': `${baseUrl}/${locale}/company/${ev.corporate_number}`
            }
          }))
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-[#0F172A] dark:text-[#F8FAFC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="border-b border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-[#151B22]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap">
            <li>
              <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                {isVi ? 'Trang chủ' : isEn ? 'Home' : 'ホーム'}
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5 text-slate-400" /></li>
            <li>
              <Link 
                href={`/${locale}/status/bankruptcies`} 
                className={!prefecture ? "font-semibold text-slate-800 dark:text-slate-200" : "hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors"}
              >
                {isVi ? 'Doanh nghiệp giải thể & thanh lý' : isEn ? 'Bankruptcies & Liquidations' : '倒産・解散・清算結了企業一覧'}
              </Link>
            </li>
            {prefecture && (
              <>
                <li><ChevronRight className="w-3.5 h-3.5 text-slate-400" /></li>
                <li className="font-semibold text-slate-800 dark:text-slate-200">
                  {prefLabel}
                </li>
              </>
            )}
            {yearMonth && (
              <>
                <li><ChevronRight className="w-3.5 h-3.5 text-slate-400" /></li>
                <li className="font-semibold text-[#1B4F8A] dark:text-blue-400">
                  {yearMonth}
                </li>
              </>
            )}
          </ol>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Hero Section */}
        <section className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/70">
              <ShieldAlert className="w-4 h-4" />
              <span>
                {isVi
                  ? 'Đồng bộ dữ liệu đăng ký kinh doanh: Giải thể, thanh lý pháp nhân'
                  : isEn
                  ? 'Commercial Registry Sync: Corporate Dissolutions & Liquidations'
                  : '商業登記簿 法人解散・清算結了等の公表データ同期'}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isVi ? 'Quản trị rủi ro tín dụng & giám sát phá sản' : isEn ? 'Credit Risk Management & Bankruptcy Alert' : '与信管理・リスクマネジメント速報'}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white mb-3">
            {isVi
              ? `Danh sách doanh nghiệp phá sản & giải thể tại ${prefLabel}`
              : isEn
              ? `Bankruptcies & Dissolved Companies in ${prefLabel}`
              : `${prefLabel}の倒産・解散・清算企業一覧`}
            <span className="text-base sm:text-lg font-normal text-slate-500 dark:text-slate-400 ml-2">
              {isVi ? `(Cập nhật mới nhất ${currentYear})` : isEn ? `(${currentYear} Latest Updates)` : `（${currentYear}年最新速報）`}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl mb-6">
            {isVi
              ? `Dữ liệu công bố từ Cục Pháp vụ và Cơ quan Thuế Quốc gia Nhật Bản về các pháp nhân tiến hành đăng ký đóng cửa, giải thể, tất toán thanh lý tại ${prefLabel}. Cung cấp thông tin xác thực hỗ trợ điều tra tín dụng, thu hồi công nợ và đánh giá rủi ro đối tác kinh doanh.`
              : isEn
              ? `Official registry data from the Legal Affairs Bureau and National Tax Agency regarding corporate dissolutions and liquidations in ${prefLabel}. Vital intelligence for credit management, debt recovery, and business continuity risk assessment.`
              : `${prefLabel}内で法務局および国税庁へ解散・清算結了等の閉鎖登記が公示された法人のデータベースです。企業の信用調査、与信管理、売掛債権回収リスクの把握、取引先の事業継続性モニタリングに必須の公的データを速報でお届けします。`}
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isVi ? 'Số lượng giải thể / thanh lý' : isEn ? 'Dissolutions / Liquidations' : '解散・清算公表件数'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {totalCount.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {isVi ? 'công ty' : isEn ? 'entities' : '件'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isVi ? 'Khu vực' : isEn ? 'Target Area' : '対象エリア'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {prefLabel}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isVi ? 'Trạng thái pháp lý' : isEn ? 'Registry Status' : '登記ステータス'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {isVi ? 'Đóng cửa / Giải thể' : isEn ? 'Dissolved / Liquidated' : '閉鎖・清算'}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {isVi ? 'Hồ sơ pháp lý' : isEn ? 'Public Record' : '公的記録'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isVi ? 'Tần suất cập nhật' : isEn ? 'Update Frequency' : '更新頻度'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {isVi ? 'Hàng ngày' : isEn ? 'Daily' : '毎日'}{' '}
                <span className="text-xs font-normal text-slate-500">Daily Sync</span>
              </div>
            </div>
          </div>
        </section>

        {/* 47 Prefectures Filter Chips */}
        <section className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isVi ? 'Lọc theo tỉnh thành' : isEn ? 'Filter by Prefecture' : '都道府県で絞り込む'}
            </h2>
            <span className="text-xs text-slate-500">
              {isVi ? '(Bấm vào để xem danh sách từng địa phương)' : isEn ? '(Click to view bankruptcies by prefecture)' : '（クリックで地域別の解散・倒産情報へ移動）'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/${locale}/status/bankruptcies`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !prefecture
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80'
              }`}
            >
              {isVi ? 'Tất cả toàn quốc' : isEn ? 'All Japan' : '全国すべて'}
            </Link>

            {PREFECTURES.map((p) => {
              const count = prefCountMap.get(p.code) || 0;
              const isActive = prefecture?.code === p.code;
              return (
                <Link
                  key={p.code}
                  href={`/${locale}/status/bankruptcies/${p.slug}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-[#F0F4F9] dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/70'
                  }`}
                >
                  <span>{getPrefectureLabel(p, locale)}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        <HubQuickToolbar
          locale={locale}
          basePath={`/${locale}/status/bankruptcies${prefecture ? '/' + prefecture.slug : ''}`}
          currentYearMonth={yearMonth || undefined}
          availableMonths={availableMonths}
          totalCount={totalCount}
        />

        {/* Bankruptcies Events List */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span>
                {isVi
                  ? `Danh sách giải thể & đóng cửa mới nhất (Hiển thị ${events.length} trên ${totalCount.toLocaleString()} công ty)`
                  : isEn
                  ? `Latest Dissolutions & Liquidations (Showing ${events.length} of ${totalCount.toLocaleString()})`
                  : `新着解散・閉鎖登記一覧（${totalCount.toLocaleString()} 件中 ${events.length} 件表示）`}
              </span>
            </h2>
            <Link
              href={`/${locale}/search?status=解散`}
              className="text-xs text-[#1B4F8A] dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              {isVi ? 'Tìm kiếm nâng cao ➔' : isEn ? 'Advanced Search ➔' : '詳細条件で絞り込み検索 ➔'}
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-slate-500">
              {isVi ? 'Hiện chưa có dữ liệu giải thể hoặc thanh lý theo điều kiện đã chọn.' : isEn ? 'No bankruptcy or dissolution records found for the selected criteria.' : '現在、指定された条件の解散・清算データはありません。'}
            </div>
          ) : (
            <div id="hub-events-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => (
                <article
                  key={ev.id}
                  data-hub-item={`${ev.company_name} ${ev.corporate_number} ${ev.city_name || ''} ${ev.representative_name || ''}`.toLowerCase()}
                  className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 hover:border-rose-300 dark:hover:border-rose-900/60 transition-all hover:shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200/60 tabular-nums">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isVi ? 'Ngày đăng ký: ' : isEn ? 'Registry Date: ' : '登記年月日：'}{ev.event_date}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {isVi ? 'Mã số pháp nhân: ' : isEn ? 'Corp No: ' : '法人番号: '}{ev.corporate_number}
                      </span>
                    </div>

                    {/* Company Name */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 hover:text-[#1B4F8A] transition-colors">
                      <Link href={`/${locale}/company/${ev.corporate_number}`}>
                        {ev.company_name}
                      </Link>
                    </h3>

                    {/* Location */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {ev.prefecture_name}{ev.city_name || ''}
                      </span>
                    </div>

                    {/* Company Scale Metadata */}
                    {(ev.representative_name || ev.capital_amount || ev.employee_count) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 mb-3 tabular-nums">
                        {ev.representative_name && (
                          <span>
                            {isVi ? `Đại diện: ${ev.representative_name}` : isEn ? `Rep: ${ev.representative_name}` : `代表：${ev.representative_name}`}
                          </span>
                        )}
                        {ev.capital_amount && (
                          <span>
                            {isVi
                              ? `Vốn: ¥${(ev.capital_amount / 10000).toLocaleString()} vạn`
                              : isEn
                              ? `Capital: ¥${(ev.capital_amount / 10000).toLocaleString()}0k`
                              : `資本金：${(ev.capital_amount / 10000).toLocaleString()}万円`}
                          </span>
                        )}
                        {ev.employee_count && (
                          <span>
                            {isVi
                              ? `Nhân sự: ${ev.employee_count.toLocaleString()}`
                              : isEn
                              ? `Employees: ${ev.employee_count.toLocaleString()}`
                              : `従業員：${ev.employee_count.toLocaleString()}名`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Status Note */}
                    <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 mb-3">
                      <div className="font-semibold">{ev.title_ja}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {ev.description_ja || (isVi ? 'Cục Pháp vụ đã công bố đăng ký giải thể / tất toán.' : isEn ? 'Legal Affairs Bureau has officially registered the corporate dissolution.' : '法務局より解散等の登記が公表されました。')}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <HubWatchButton
                      corporateNumber={ev.corporate_number}
                      companyName={ev.company_name}
                      locale={locale}
                    />
                    <Link
                      href={`/${locale}/company/${ev.corporate_number}`}
                      className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                    >
                      {isVi ? 'Xem hồ sơ & lịch sử thay đổi' : isEn ? 'View Profile & Registry History' : '企業詳細・登記履歴を見る'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {currentPage > 1 && (
                <Link
                  href={`/${locale}/status/bankruptcies${slug ? '/' + slug.join('/') : ''}?page=${currentPage - 1}`}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B22] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  {isVi ? 'Trang trước' : isEn ? 'Previous' : '前へ'}
                </Link>
              )}

              <span className="text-xs text-slate-500 px-3">
                {isVi ? `Trang ${currentPage} / ${totalPages}` : isEn ? `Page ${currentPage} of ${totalPages}` : `${currentPage} / ${totalPages} ページ`}
              </span>

              {currentPage < totalPages && (
                <Link
                  href={`/${locale}/status/bankruptcies${slug ? '/' + slug.join('/') : ''}?page=${currentPage + 1}`}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B22] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  {isVi ? 'Trang sau' : isEn ? 'Next' : '次へ'}
                </Link>
              )}
            </div>
          )}
        </section>

        <HubWatchlistGuideSection
          locale={locale}
          category="bankruptcy"
          prefectureCode={prefecture?.code}
          prefectureName={prefecture ? (isJa ? prefecture.nameJa : prefLabel) : undefined}
        />
      </main>

      <Footer />
    </div>
  );
}
