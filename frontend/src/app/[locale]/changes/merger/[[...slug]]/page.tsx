import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, Calendar, ExternalLink, ChevronRight,
  GitMerge, RefreshCw, Download, Filter, ShieldCheck
} from 'lucide-react';
import { 
  getHubDynamicEvents, 
  getHubDynamicEventsCount, 
  getHubPrefectureCounts 
} from '@/lib/db';
import { 
  PREFECTURES, 
  parseHubSlug,
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
    ? `Danh sách doanh nghiệp đổi tên, sáp nhập & M&A tại ${prefLabel} (${currentYear}) | Kigyou-list`
    : isEn
    ? `${prefLabel} Corporate Name Changes & Mergers Directory (${currentYear}) | Kigyou-list`
    : `${prefLabel}の商号変更・企業合併・M&A一覧【${ymLabel}】 | Kigyou-list`;

  const description = isVi
    ? `Cơ sở dữ liệu cập nhật theo thời gian thực các doanh nghiệp vừa thực hiện đổi tên công ty, sáp nhập hoặc tái cơ cấu tổ chức tại ${prefLabel}. So sánh tên cũ và tên mới, mã số thuế và hồ sơ chi tiết.`
    : isEn
    ? `Real-time database of corporate name changes, mergers, and acquisitions in ${prefLabel}. Compare old vs new company trade names, corporate numbers, and legal filings.`
    : `${prefLabel}で商号変更（社名変更）、吸収合併、新設合併、会社分割等の組織再編登記を行った企業データベースです。旧社名と新社名の対比、法人番号、所在地、変更理由を網羅。`;

  const canonicalPath = slug && slug.length > 0 ? `/changes/merger/${slug.join('/')}` : '/changes/merger';

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

export default async function MergerHubPage({ params, searchParams }: PageProps) {
  const { locale = 'ja', slug } = await params;
  const { page } = await searchParams;

  const { prefecture, yearMonth } = parseHubSlug(slug);
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const limit = 40;
  const offset = (currentPage - 1) * limit;

  // Query events from hub_dynamic_events for 'merger'
  const [events, totalCount, prefCounts] = await Promise.all([
    getHubDynamicEvents({
      category: 'merger',
      prefectureCode: prefecture?.code,
      yearMonth: yearMonth || undefined,
      limit,
      offset
    }),
    getHubDynamicEventsCount({
      category: 'merger',
      prefectureCode: prefecture?.code,
      yearMonth: yearMonth || undefined,
    }),
    getHubPrefectureCounts('merger', yearMonth || undefined)
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

  // Structured Data Schema
  const baseUrl = 'https://kigyoulist.com';
  const pageUrl = `${baseUrl}/${locale}/changes/merger${slug && slug.length > 0 ? '/' + slug.join('/') : ''}`;

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
            'name': isVi ? 'Đổi tên & Sáp nhập doanh nghiệp' : isEn ? 'Name Changes & Mergers' : '商号変更・企業合併一覧',
            'item': `${baseUrl}/${locale}/changes/merger`
          },
          ...(prefecture ? [{
            '@type': 'ListItem',
            'position': 3,
            'name': isVi ? `Doanh nghiệp đổi tên tại ${prefLabel}` : isEn ? `${prefLabel} Corporate Name Changes` : `${prefecture.nameJa}の商号変更企業`,
            'item': `${baseUrl}/${locale}/changes/merger/${prefecture.slug}`
          }] : [])
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        'url': pageUrl,
        'name': isVi
          ? `Danh sách doanh nghiệp đổi tên, sáp nhập & M&A tại ${prefLabel} (${currentYear})`
          : isEn
          ? `${prefLabel} Corporate Name Changes & Mergers Directory (${currentYear})`
          : `${prefLabel}の商号変更・企業合併一覧【${currentYear}年最新】`,
        'description': isVi
          ? `Cơ sở dữ liệu đăng ký đổi tên, sáp nhập và tái cấu trúc doanh nghiệp tại ${prefLabel}.`
          : isEn
          ? `Corporate registry of trade name alterations, mergers and reorganizations in ${prefLabel}.`
          : `${prefLabel}において商号変更や組織再編を実施した企業のデータベース一覧です。`,
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
                href={`/${locale}/changes/merger`} 
                className={!prefecture ? "font-semibold text-slate-800 dark:text-slate-200" : "hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors"}
              >
                {isVi ? 'Đổi tên & Sáp nhập doanh nghiệp' : isEn ? 'Name Changes & Mergers' : '商号変更・企業合併一覧'}
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70">
              <GitMerge className="w-4 h-4" />
              <span>
                {isVi
                  ? 'Đồng bộ trực tiếp dữ liệu đổi tên & sáp nhập từ Quốc thuế NTA'
                  : isEn
                  ? 'Synced with NTA Legal Name Change & Reorganization Registry'
                  : '国税庁 商号変更・組織再編登記データ同期'}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isVi ? 'Giám sát tái cấu trúc & M&A' : isEn ? 'Reorganization & M&A Monitoring' : '企業組織再編・M&Aモニタリング速報'}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white mb-3">
            {isVi
              ? `Danh sách doanh nghiệp đổi tên, sáp nhập tại ${prefLabel}`
              : isEn
              ? `${prefLabel} Corporate Name Changes & Mergers`
              : `${prefLabel}の商号変更・社名変更・企業合併一覧`}
            <span className="text-base sm:text-lg font-normal text-slate-500 dark:text-slate-400 ml-2">
              {isVi ? `(${currentYear} Mới nhất)` : isEn ? `(${currentYear} Latest Updates)` : `（${currentYear}年最新速報）`}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl mb-6">
            {isVi
              ? `Cơ sở dữ liệu các công ty vừa hoàn tất thủ tục đăng ký đổi tên thương mại, sáp nhập hoặc tái cơ cấu tập đoàn tại ${prefLabel}. Nắm bắt xu hướng tái định vị thương hiệu, thâu tóm M&A và chuyển đổi mô hình kinh doanh qua bảng đối chiếu tên cũ và mới.`
              : isEn
              ? `Database of companies registered for corporate trade name alterations, statutory mergers, and acquisitions in ${prefLabel}. Track rebranding trends, M&A operations, and group restructurings through side-by-side name comparisons.`
              : `${prefLabel}にて商号変更（会社名変更）、吸収合併、グループ再編などの登記公表が行われた企業のデータベースです。リブランディングや企業買収（M&A）、ホールディングス化の動向を旧社名と新社名の対比形式で把握できます。`}
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isVi ? 'Tổng số lượt đổi tên/sáp nhập' : isEn ? 'Total Events' : '組織変更公表数'}
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
                {isVi ? 'Dữ liệu đối chiếu' : isEn ? 'Comparison Type' : '対比データ'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {isVi ? 'Tên cũ ➔ Tên mới' : isEn ? 'Old ➔ New Name' : '旧社名 ➔ 新社名'}
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
              {isVi ? '(Bấm vào để xem danh sách từng địa phương)' : isEn ? '(Click to view reorganizations by prefecture)' : '（クリックで地域別の商号変更一覧へ移動）'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/${locale}/changes/merger`}
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
              const pLabel = isVi ? p.nameEn : isEn ? p.nameEn : p.nameJa;
              return (
                <Link
                  key={p.code}
                  href={`/${locale}/changes/merger/${p.slug}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-[#1B4F8A] text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-[#F0F4F9] dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/70'
                  }`}
                >
                  <span>{pLabel}</span>
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

        {/* Merger Events List */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>
                {isVi
                  ? `Doanh nghiệp vừa đổi tên & sáp nhập (Hiển thị ${events.length} trên tổng ${totalCount.toLocaleString()})`
                  : isEn
                  ? `Recent Name Changes & Mergers (Showing ${events.length} of ${totalCount.toLocaleString()})`
                  : `商号変更・合併登記一覧（${totalCount.toLocaleString()} 件中 {events.length} 件表示）`}
              </span>
            </h2>
          </div>

          {events.length === 0 ? (
            <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-slate-500">
              {isVi
                ? 'Hiện chưa có dữ liệu đổi tên/sáp nhập theo điều kiện đã chọn.'
                : isEn
                ? 'No reorganization records found for the selected criteria.'
                : '現在、指定された条件の商号変更データはありません。'}
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((ev) => (
                <article
                  key={ev.id}
                  className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 hover:border-[#1B4F8A]/60 dark:hover:border-blue-500/60 transition-all hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/60">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isVi ? `Ngày đăng ký: ${ev.event_date}` : isEn ? `Date: ${ev.event_date}` : `登記年月日：${ev.event_date}`}</span>
                      </span>
                      <span className="inline-flex items-center text-xs text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {ev.prefecture_name}
                      </span>
                    </div>

                    <span className="font-mono text-[11px] text-slate-400">
                      {isVi ? 'Mã số thuế' : isEn ? 'ID' : '法人番号'}: {ev.corporate_number}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 hover:text-[#1B4F8A] transition-colors">
                    <Link href={`/${locale}/company/${ev.corporate_number}`}>
                      {ev.company_name}
                    </Link>
                  </h3>

                  {/* Name Diff Box */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 mb-3 space-y-2 text-xs">
                    {ev.old_value && (
                      <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                          {isVi ? 'Tên cũ' : isEn ? 'Former Name' : '旧商号'}
                        </span>
                        <span className="line-through">{ev.old_value}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-slate-800 dark:text-slate-200 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-[#1B4F8A] text-white text-[10px] font-bold flex-shrink-0">
                        {isVi ? 'Tên mới' : isEn ? 'New Name' : '新商号'}
                      </span>
                      <span className="font-bold text-[#1B4F8A] dark:text-blue-400">{ev.company_name}</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{ev.prefecture_name}{ev.city_name || ''}</span>
                    </div>

                    <Link
                      href={`/${locale}/company/${ev.corporate_number}`}
                      className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                    >
                      {isVi ? 'Xem chi tiết & Lịch sử đổi tên' : isEn ? 'View Profile & Reorganization History' : '企業詳細・商号変更履歴を見る'}
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
                  href={`/${locale}/changes/merger${slug ? '/' + slug.join('/') : ''}?page=${currentPage - 1}`}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B22] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  {isVi ? 'Trước' : isEn ? 'Previous' : '前へ'}
                </Link>
              )}

              <span className="text-xs text-slate-500 px-3">
                {isVi ? `Trang ${currentPage} / ${totalPages}` : isEn ? `Page ${currentPage} of ${totalPages}` : `${currentPage} / ${totalPages} ページ`}
              </span>

              {currentPage < totalPages && (
                <Link
                  href={`/${locale}/changes/merger${slug ? '/' + slug.join('/') : ''}?page=${currentPage + 1}`}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B22] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  {isVi ? 'Sau' : isEn ? 'Next' : '次へ'}
                </Link>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
