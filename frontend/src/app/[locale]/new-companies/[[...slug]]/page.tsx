import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, Calendar, ExternalLink, ChevronRight,
  TrendingUp, ShieldCheck, Users, Coins, Download, Filter, Sparkles
} from 'lucide-react';
import { 
  getHubDynamicEvents, 
  getHubDynamicEventsCount, 
  getHubPrefectureCounts 
} from '@/lib/db';
import { 
  PREFECTURES, 
  parseHubSlug, 
  resolvePrefecture,
  getPrefectureLabel 
} from '@/lib/hubUtils';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

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
  const ymLabel = yearMonth ? `${yearMonth} ` : `${currentYear}年最新 `;

  const title = isVi
    ? `Danh sách doanh nghiệp mới thành lập tại ${prefLabel} (${currentYear}) | Kigyou-list`
    : isEn
    ? `${prefLabel} Newly Established Companies Directory (${currentYear}) | Kigyou-list`
    : `${prefLabel}の新設法人・新規設立企業一覧【${ymLabel}】 | Kigyou-list`;

  const description = isVi
    ? `Cơ sở dữ liệu các công ty mới thành lập và vừa được cấp mã số doanh nghiệp NTA tại ${prefLabel}. Tên công ty, địa chỉ trụ sở, vốn điều lệ, người đại diện và thông tin liên hệ B2B.`
    : isEn
    ? `Verified registry of newly incorporated businesses in ${prefLabel}. Corporate numbers, headquarters address, capital scale, executives, and verified contact intelligence.`
    : `${prefLabel}で直近に新規設立・法人番号指定登記が行われた企業のデータベース一覧です。会社名、法人番号、所在地、資本金、役員構成、連絡先情報を網羅。B2B新規開拓営業や取引先調査に最適。`;

  const canonicalPath = slug && slug.length > 0 ? `/new-companies/${slug.join('/')}` : '/new-companies';

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

export default async function NewCompaniesHubPage({ params, searchParams }: PageProps) {
  const { locale = 'ja', slug } = await params;
  const { page } = await searchParams;

  const { prefecture, yearMonth } = parseHubSlug(slug);
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const limit = 40;
  const offset = (currentPage - 1) * limit;

  // Query events from hub_dynamic_events
  const [events, totalCount, prefCounts] = await Promise.all([
    getHubDynamicEvents({
      category: 'new_establishment',
      prefectureCode: prefecture?.code,
      yearMonth: yearMonth || undefined,
      limit,
      offset
    }),
    getHubDynamicEventsCount({
      category: 'new_establishment',
      prefectureCode: prefecture?.code,
      yearMonth: yearMonth || undefined,
    }),
    getHubPrefectureCounts('new_establishment', yearMonth || undefined)
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const prefCountMap = new Map<string, number>();
  for (const pc of prefCounts) {
    prefCountMap.set(pc.prefecture_code, pc.count);
  }

  const isVi = locale === 'vi';
  const isEn = locale === 'en';
  const prefLabel = getPrefectureLabel(prefecture, locale);
  const currentYear = new Date().getFullYear();

  // Structured Data Schema (CollectionPage + ItemList + BreadcrumbList)
  const baseUrl = 'https://kigyoulist.com';
  const pageUrl = `${baseUrl}/${locale}/new-companies${slug && slug.length > 0 ? '/' + slug.join('/') : ''}`;

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
            'name': isVi ? 'Doanh nghiệp mới thành lập' : isEn ? 'Newly Established Companies' : '新設法人・新規設立企業一覧',
            'item': `${baseUrl}/${locale}/new-companies`
          },
          ...(prefecture ? [{
            '@type': 'ListItem',
            'position': 3,
            'name': isVi ? `Pháp nhân mới tại ${prefLabel}` : isEn ? `New Companies in ${prefLabel}` : `${prefecture.nameJa}の新設法人`,
            'item': `${baseUrl}/${locale}/new-companies/${prefecture.slug}`
          }] : [])
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        'url': pageUrl,
        'name': isVi
          ? `Danh sách doanh nghiệp mới thành lập tại ${prefLabel} (${currentYear})`
          : isEn
          ? `${prefLabel} Newly Established Companies Directory (${currentYear})`
          : `${prefLabel}の新設法人・新規設立企業一覧【${currentYear}年最新】`,
        'description': isVi
          ? `Cơ sở dữ liệu các công ty mới thành lập tại ${prefLabel}.`
          : isEn
          ? `Official corporate directory of newly incorporated businesses in ${prefLabel}.`
          : `${prefLabel}における新設法人の登記公表データ一覧です。`,
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
                href={`/${locale}/new-companies`} 
                className={!prefecture ? "font-semibold text-slate-800 dark:text-slate-200" : "hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors"}
              >
                {isVi ? 'Doanh nghiệp mới thành lập' : isEn ? 'Newly Established Companies' : '新設法人・新規設立企業一覧'}
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isVi
                  ? 'Đồng bộ trực tiếp mã số doanh nghiệp từ Quốc thuế NTA'
                  : isEn
                  ? 'Synced with National Tax Agency Legal Entity Registry'
                  : '国税庁 法人番号登記データ同期済'}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isVi ? 'Cập nhật tự động hàng ngày' : isEn ? 'Daily Automated Sync' : '毎日自動更新・Programmatic SEO Dynamic Hub'}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white mb-3">
            {isVi
              ? `Danh sách doanh nghiệp mới thành lập tại ${prefLabel}`
              : isEn
              ? `${prefLabel} Newly Established Companies`
              : `${prefLabel}の新設法人・新規設立企業一覧`}
            <span className="text-base sm:text-lg font-normal text-slate-500 dark:text-slate-400 ml-2">
              {isVi ? `(${currentYear} Mới nhất)` : isEn ? `(${currentYear} Latest Updates)` : `（${currentYear}年最新速報）`}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl mb-6">
            {isVi
              ? `Cơ sở dữ liệu các công ty vừa hoàn tất thủ tục đăng ký thành lập mới và được cấp mã số thuế NTA tại ${prefLabel}. Doanh nghiệp mới thành lập có nhu cầu cao về thuê văn phòng, đăng ký internet, phần mềm kế toán, thiết kế website và tuyển dụng nhân sự ban đầu.`
              : isEn
              ? `Real-time database of newly incorporated enterprises registered with legal corporate numbers in ${prefLabel}. New businesses are in their golden period with high demand for office leases, telecom, accounting SaaS, web development, and corporate services.`
              : `${prefLabel}にて直近に法務局および国税庁へ新規設立・法人番号指定の登記公表が行われた企業データベースです。起業直後のスタートアップから新設法人まで、商号、本店所在地、法人番号、代表者名、資本金情報を網羅しています。新規顧客開拓（B2Bテレアポ・フォーム営業・郵送DM）や信用調査にご活用いただけます。`}
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isVi ? 'Số pháp nhân mới đăng ký' : isEn ? 'New Companies Count' : '登録新設法人数'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#1B4F8A] dark:text-blue-400 mt-0.5">
                {totalCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{isVi ? 'cty' : isEn ? 'companies' : '社'}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isVi ? 'Khu vực áp dụng' : isEn ? 'Target Region' : '対象エリア'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {prefLabel}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isVi ? 'Độ chính xác dữ liệu' : isEn ? 'Data Reliability' : 'データ信頼性'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                100% <span className="text-xs font-normal text-slate-500">{isVi ? 'Công chứng' : isEn ? 'Official' : '公的登記'}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isVi ? 'Tần suất cập nhật' : isEn ? 'Update Frequency' : '更新頻度'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {isVi ? 'Hàng ngày' : isEn ? 'Daily' : '毎日'} <span className="text-xs font-normal text-slate-500">Daily Sync</span>
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
              {isVi ? '(Bấm vào để xem danh sách từng địa phương)' : isEn ? '(Click to view new companies by prefecture)' : '（クリックで地域別の一覧へ瞬時に移動）'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/${locale}/new-companies`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !prefecture
                  ? 'bg-[#1B4F8A] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-[#F0F4F9] dark:hover:bg-slate-700/80'
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
                  href={`/${locale}/new-companies/${p.slug}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-[#1B4F8A] text-white shadow-sm'
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

        {/* Company List View */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>
                {isVi
                  ? `Doanh nghiệp mới thành lập (Hiển thị ${events.length} trên ${totalCount.toLocaleString()} công ty)`
                  : isEn
                  ? `Newly Established Companies (Showing ${events.length} of ${totalCount.toLocaleString()})`
                  : `新着設立法人一覧（${totalCount.toLocaleString()} 件中 ${events.length} 件表示）`}
              </span>
            </h2>
            <Link
              href={`/${locale}/search?prefecture=${prefecture?.code || ''}`}
              className="text-xs text-[#1B4F8A] dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              {isVi ? 'Tìm kiếm nâng cao ➔' : isEn ? 'Advanced Search ➔' : '詳細条件で絞り込み検索 ➔'}
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-slate-500">
              {isVi ? 'Hiện chưa có dữ liệu doanh nghiệp mới thành lập theo điều kiện đã chọn.' : isEn ? 'No newly established companies found for the selected criteria.' : '現在、指定された条件の新設法人データはありません。'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => (
                <article
                  key={ev.id}
                  className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 hover:border-[#1B4F8A]/60 dark:hover:border-blue-500/60 transition-all hover:shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isVi ? 'Ngày đăng ký: ' : isEn ? 'Incorporated: ' : '設立登記日：'}{ev.event_date}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
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
                    <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {ev.prefecture_name}{ev.city_name || ''} {ev.new_value || ''}
                      </span>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-3">
                      <div>
                        <span className="text-slate-400">{isVi ? 'Vốn điều lệ: ' : isEn ? 'Capital: ' : '資本金: '}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {ev.capital_amount ? (isVi ? `¥${(ev.capital_amount / 10000).toLocaleString()} vạn yên` : isEn ? `¥${ev.capital_amount.toLocaleString()}` : `¥${(ev.capital_amount / 10000).toLocaleString()}万円`) : (isVi ? 'Chưa công bố' : isEn ? 'Undisclosed' : '未公表')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">{isVi ? 'Người đại diện: ' : isEn ? 'Representative: ' : '代表者: '}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                          {ev.representative_name || (isVi ? 'Đang cập nhật' : isEn ? 'Pending registry' : '登記確認中')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {isVi ? 'Nguồn: Cơ quan Thuế Quốc gia Nhật Bản (NTA)' : isEn ? 'Source: National Tax Agency Japan (NTA)' : '出典：国税庁 法人番号公表サイト'}
                    </span>
                    <Link
                      href={`/${locale}/company/${ev.corporate_number}`}
                      className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                    >
                      {isVi ? 'Xem hồ sơ doanh nghiệp' : isEn ? 'View Company Profile' : '企業詳細データを見る'}
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
                  href={`/${locale}/new-companies${slug ? '/' + slug.join('/') : ''}?page=${currentPage - 1}`}
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
                  href={`/${locale}/new-companies${slug ? '/' + slug.join('/') : ''}?page=${currentPage + 1}`}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B22] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  {isVi ? 'Trang sau' : isEn ? 'Next' : '次へ'}
                </Link>
              )}
            </div>
          )}
        </section>

        {/* B2B Export / Lead Generation Call to Action Banner */}
        <section className="bg-gradient-to-r from-slate-900 to-[#1B4F8A] text-white rounded-xl p-8 mb-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-xs font-medium text-blue-200 mb-3">
              <Download className="w-3.5 h-3.5" />
              <span>B2B Sales List Download</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3">
              {isVi ? 'Tải trọn bộ danh sách doanh nghiệp mới thành lập (CSV / Excel)' : isEn ? 'Download New Companies B2B Lead List in CSV / Excel' : '新設法人の営業リストをCSV / Excel形式で一括ダウンロード'}
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed mb-6">
              {isVi ? 'Doanh nghiệp mới thành lập là đối tượng có nhu cầu mua sắm và trang bị cao nhất: thuê văn phòng, đăng ký mạng, phần mềm kế toán, thiết kế website, tuyển dụng nhân sự... Kigyou-list cho phép bạn trích xuất danh sách mới mỗi ngày.' : isEn ? 'Newly established companies have immediate purchasing needs: office leasing, telecom, accounting SaaS, web design, and hiring. Export fresh daily incorporation lists with Kigyou-list.' : '設立直後の企業は、オフィス賃貸、回線開通、会計ソフト、Webサイト制作、人材採用などあらゆる購買意欲が最も高いゴールデンタイムです。Kigyou-listでは最新の新設法人リストを毎日CSVで出力可能です。'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/pricing`}
                className="px-5 py-2.5 rounded-lg bg-white text-[#1B4F8A] hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>{isVi ? 'Dùng thử gói Miễn phí' : isEn ? 'Try Free Plan' : '無料プランで試す'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/search?establishment_from=2024`}
                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-colors"
              >
                {isVi ? 'Tìm kiếm với bộ lọc chi tiết' : isEn ? 'Custom Advanced Search' : '条件を指定して詳細検索'}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
