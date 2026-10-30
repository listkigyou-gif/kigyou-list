import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, Calendar, ExternalLink, ChevronRight,
  TrendingUp, ShieldCheck, ArrowRight, Download, Filter, MoveRight
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
    ? `Danh sách doanh nghiệp chuyển trụ sở tại ${prefLabel} (${currentYear}) | Kigyou-list`
    : isEn
    ? `${prefLabel} Corporate Relocations Directory (${currentYear}) | Kigyou-list`
    : `${prefLabel}の本社移転・オフィス移転企業一覧【${ymLabel}】 | Kigyou-list`;

  const description = isVi
    ? `Cơ sở dữ liệu cập nhật theo thời gian thực các doanh nghiệp vừa đăng ký chuyển địa chỉ trụ sở tại ${prefLabel}. So sánh địa chỉ cũ và mới, mã số thuế, đại diện và liên hệ B2B.`
    : isEn
    ? `Real-time database of registered corporate headquarters and office relocations in ${prefLabel}. Compare old vs new address, corporate numbers, and representative contacts.`
    : `${prefLabel}で直近に本店所在地の変更登記を行った企業の一覧速報データベースです。旧住所と新住所の対比、法人番号、代表者、連絡先を網羅。オフィス仲介、内装デザイン、引越し、B2B営業開拓に。`;

  const canonicalPath = slug && slug.length > 0 ? `/changes/relocation/${slug.join('/')}` : '/changes/relocation';

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

export default async function RelocationHubPage({ params, searchParams }: PageProps) {
  const { locale = 'ja', slug } = await params;
  const { page } = await searchParams;

  const { prefecture, yearMonth } = parseHubSlug(slug);
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const limit = 40;
  const offset = (currentPage - 1) * limit;

  // Query events from hub_dynamic_events for 'relocation'
  const [events, totalCount, prefCounts] = await Promise.all([
    getHubDynamicEvents({
      category: 'relocation',
      prefectureCode: prefecture?.code,
      yearMonth: yearMonth || undefined,
      limit,
      offset
    }),
    getHubDynamicEventsCount({
      category: 'relocation',
      prefectureCode: prefecture?.code,
      yearMonth: yearMonth || undefined,
    }),
    getHubPrefectureCounts('relocation', yearMonth || undefined)
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
  const pageUrl = `${baseUrl}/${locale}/changes/relocation${slug && slug.length > 0 ? '/' + slug.join('/') : ''}`;

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
            'name': isVi ? 'Danh bạ chuyển trụ sở' : isEn ? 'HQ Relocations' : '本社移転・所在地変更企業一覧',
            'item': `${baseUrl}/${locale}/changes/relocation`
          },
          ...(prefecture ? [{
            '@type': 'ListItem',
            'position': 3,
            'name': isVi ? `Doanh nghiệp chuyển trụ sở tại ${prefLabel}` : isEn ? `${prefLabel} Corporate Relocations` : `${prefecture.nameJa}の本社移転企業`,
            'item': `${baseUrl}/${locale}/changes/relocation/${prefecture.slug}`
          }] : [])
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        'url': pageUrl,
        'name': isVi
          ? `Danh sách doanh nghiệp chuyển trụ sở tại ${prefLabel} (${currentYear})`
          : isEn
          ? `${prefLabel} Corporate HQ Relocations (${currentYear})`
          : `${prefLabel}の本社移転・オフィス移転企業一覧【${currentYear}年最新】`,
        'description': isVi
          ? `Cơ sở dữ liệu đăng ký chuyển địa chỉ trụ sở tại ${prefLabel}.`
          : isEn
          ? `Official corporate relocation registry in ${prefLabel}.`
          : `${prefLabel}における本店所在地の変更登記データ一覧です。`,
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
                href={`/${locale}/changes/relocation`} 
                className={!prefecture ? "font-semibold text-slate-800 dark:text-slate-200" : "hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors"}
              >
                {isVi ? 'Danh bạ chuyển trụ sở' : isEn ? 'HQ Relocations' : '本社移転・所在地変更企業一覧'}
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
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isVi
                  ? 'Đồng bộ trực tiếp thay đổi pháp lý từ Quốc thuế NTA'
                  : isEn
                  ? 'Synced with National Tax Agency Commercial Registry'
                  : '国税庁 法人登記変更履歴（事由発生登記）同期済'}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isVi ? 'Cập nhật tự động hàng ngày' : isEn ? 'Daily Automated Sync' : '毎日自動更新・Programmatic SEO Dynamic Hub'}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white mb-3">
            {isVi
              ? `Danh sách doanh nghiệp chuyển trụ sở tại ${prefLabel}`
              : isEn
              ? `${prefLabel} Corporate HQ Relocations`
              : `${prefLabel}の本社移転・オフィス移転企業一覧`}
            <span className="text-base sm:text-lg font-normal text-slate-500 dark:text-slate-400 ml-2">
              {isVi ? `(${currentYear} Mới nhất)` : isEn ? `(${currentYear} Latest Updates)` : `（${currentYear}年最新速報）`}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl mb-6">
            {isVi
              ? `Cơ sở dữ liệu các công ty đăng ký thay đổi địa chỉ trụ sở chính tại ${prefLabel}. Doanh nghiệp vừa chuyển văn phòng thường có nhu cầu lớn về nội thất, thiết bị văn phòng, dịch vụ viễn thông và dịch vụ B2B. So sánh địa chỉ cũ và mới theo thời gian thực.`
              : isEn
              ? `Verified registry of companies relocating their headquarters or main office in ${prefLabel}. Office relocations trigger significant B2B demand for interior design, IT infrastructure, telecom, and facilities. Compare old and new address diffs.`
              : `${prefLabel}にて本店または主たる事務所の所在地の移転登記を行った企業データベースです。オフィス移転・拡張移転は、オフィス家具・什器の購入、内装工事、通信インフラ、OA機器の導入など、B2Bの大型購買ニーズが発生する絶好のタイミングです。旧住所と新住所の対比データを速報でお届けします。`}
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isVi ? 'Tổng số công ty chuyển trụ sở' : isEn ? 'Total Relocations' : '移転登記企業総数'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#1B4F8A] dark:text-blue-400 mt-0.5">
                {totalCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{isVi ? 'cty' : isEn ? 'companies' : '件'}</span>
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
                {isVi ? 'Căn cứ pháp lý' : isEn ? 'Legal Source' : '登記根拠'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {isVi ? 'Đăng ký kinh doanh' : isEn ? 'Commercial Registry' : '商業登記簿'} <span className="text-xs font-normal text-slate-500">{isVi ? 'Công báo' : isEn ? 'Official' : '法定公示'}</span>
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
              {isVi ? '(Bấm vào để xem danh sách từng địa phương)' : isEn ? '(Click to view relocations by prefecture)' : '（クリックで各都道府県の移転企業一覧へ移動）'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/${locale}/changes/relocation`}
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
                  href={`/${locale}/changes/relocation/${p.slug}`}
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

        {/* Relocation Events List */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>
                {isVi
                  ? `Doanh nghiệp vừa chuyển trụ sở (Hiển thị ${events.length} trên tổng ${totalCount.toLocaleString()})`
                  : isEn
                  ? `Recent Relocations (Showing ${events.length} of ${totalCount.toLocaleString()})`
                  : `新着移転企業一覧（${totalCount.toLocaleString()} 件中 ${events.length} 件表示）`}
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
              {isVi
                ? 'Hiện chưa có dữ liệu chuyển trụ sở theo điều kiện đã chọn.'
                : isEn
                ? 'No relocation records found for the selected criteria.'
                : '現在、指定された条件の本社移転データはありません。'}
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
                        <span>{isVi ? `Ngày đăng ký: ${ev.event_date}` : isEn ? `Date: ${ev.event_date}` : `登記発生日：${ev.event_date}`}</span>
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

                  {/* Relocation Diff Box */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 mb-3 space-y-2 text-xs">
                    {ev.old_value && (
                      <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                          {isVi ? 'Địa chỉ cũ' : isEn ? 'Old Address' : '旧住所'}
                        </span>
                        <span className="line-through">{ev.old_value}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-slate-800 dark:text-slate-200 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-[#1B4F8A] text-white text-[10px] font-bold flex-shrink-0">
                        {isVi ? 'Địa chỉ mới' : isEn ? 'New Address' : '新住所'}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <MapPin className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400 flex-shrink-0" />
                        <span>{ev.new_value || `${ev.prefecture_name}${ev.city_name || ''}`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2">
                    <div className="flex items-center gap-3 text-slate-500">
                      {ev.representative_name && (
                        <span>{isVi ? `Đại diện: ${ev.representative_name}` : isEn ? `CEO: ${ev.representative_name}` : `代表：${ev.representative_name}`}</span>
                      )}
                      {ev.capital_amount && (
                        <span>
                          {isVi 
                            ? `Vốn điều lệ: ¥${(ev.capital_amount / 10000).toLocaleString()} vạn Yên`
                            : isEn
                            ? `Capital: ¥${(ev.capital_amount / 10000).toLocaleString()} 10k JPY`
                            : `資本金：¥${(ev.capital_amount / 10000).toLocaleString()}万円`}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/${locale}/company/${ev.corporate_number}`}
                      className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                    >
                      {isVi ? 'Xem chi tiết & Dòng thời gian biến động' : isEn ? 'View Company Profile & Timeline' : '企業詳細・移転履歴タイムラインを見る'}
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
                  href={`/${locale}/changes/relocation${slug ? '/' + slug.join('/') : ''}?page=${currentPage - 1}`}
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
                  href={`/${locale}/changes/relocation${slug ? '/' + slug.join('/') : ''}?page=${currentPage + 1}`}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B22] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  {isVi ? 'Sau' : isEn ? 'Next' : '次へ'}
                </Link>
              )}
            </div>
          )}
        </section>

        {/* B2B Relocation Sales Value Banner */}
        <section className="bg-gradient-to-r from-slate-900 to-[#1B4F8A] text-white rounded-xl p-8 mb-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-xs font-medium text-blue-200 mb-3">
              <Download className="w-3.5 h-3.5" />
              <span>Office Relocation Sales Signals</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3">
              {isVi
                ? 'Tiếp cận khách hàng B2B qua danh sách công ty vừa chuyển văn phòng'
                : isEn
                ? 'B2B Sales Outreach via Fresh Office Relocation Signals'
                : 'オフィス移転・拡張移転企業のリストを活用したB2Bアプローチ'}
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed mb-6">
              {isVi
                ? 'Các doanh nghiệp vừa chuyển hoặc mở rộng văn phòng có nhu cầu mua sắm thiết bị, viễn thông, thi công nội thất và dịch vụ giải pháp văn phòng rất lớn. Kigyou-list cung cấp dữ liệu tức thì giúp bạn đi trước đối thủ một bước.'
                : isEn
                ? 'Companies relocating their headquarters have urgent procurement needs for office furniture, telecommunications, IT infrastructure, and facilities. Kigyou-list delivers fresh leads in real time.'
                : '本店を移転した企業は、事業拡大や新拠点開設に伴いオフィス什器、通信回線、内装デザイン、セキュリティ機器、福利厚生などの購買意欲が顕著に高まります。Kigyou-listなら最新の移転企業リストをリアルタイムに絞り込み可能です。'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/pricing`}
                className="px-5 py-2.5 rounded-lg bg-white text-[#1B4F8A] hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>{isVi ? 'Trải nghiệm gói miễn phí' : isEn ? 'Try Free Tier' : '無料プランで試す'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/directory`}
                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-colors"
              >
                {isVi ? 'Xem danh bạ ngành nghề' : isEn ? 'Explore Industry Directory' : '企業名鑑・業界別一覧を見る'}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
