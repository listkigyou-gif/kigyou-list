import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, Calendar, ExternalLink, ChevronRight,
  AlertTriangle, ShieldAlert, Download, Filter, FileText
} from 'lucide-react';
import { 
  getHubDynamicEvents, 
  getHubDynamicEventsCount, 
  getHubPrefectureCounts 
} from '@/lib/db';
import { 
  PREFECTURES, 
  parseHubSlug 
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

  const prefLabel = prefecture ? prefecture.nameJa : '全国';
  const ymLabel = yearMonth ? `${yearMonth} ` : `${currentYear}年最新 `;

  const title = `${prefLabel}の倒産・解散・清算結了企業一覧【${ymLabel}】 | Kigyou-list`;
  const description = `${prefLabel}における企業の解散、清算結了、閉鎖等の異動登記速報データベースです。法人番号、商号、所在地、事由発生年月日を網羅。与信管理、債権回収、取引先リスク審査に最適。`;

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

  const { prefecture, yearMonth } = parseHubSlug(slug);
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const limit = 40;
  const offset = (currentPage - 1) * limit;

  // Query events from hub_dynamic_events for 'bankruptcies'
  const [events, totalCount, prefCounts] = await Promise.all([
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
    getHubPrefectureCounts('bankruptcies', yearMonth || undefined)
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const prefCountMap = new Map<string, number>();
  for (const pc of prefCounts) {
    prefCountMap.set(pc.prefecture_code, pc.count);
  }

  const prefLabel = prefecture ? prefecture.nameJa : '全国';
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
            'name': 'ホーム',
            'item': `${baseUrl}/${locale}`
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': '倒産・解散企業一覧',
            'item': `${baseUrl}/${locale}/status/bankruptcies`
          },
          ...(prefecture ? [{
            '@type': 'ListItem',
            'position': 3,
            'name': `${prefecture.nameJa}の解散企業`,
            'item': `${baseUrl}/${locale}/status/bankruptcies/${prefecture.slug}`
          }] : [])
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        'url': pageUrl,
        'name': `${prefLabel}の倒産・解散・清算企業一覧【${currentYear}年最新】`,
        'description': `${prefLabel}における企業の解散・清算登記データ一覧です。`,
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
                ホーム
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5 text-slate-400" /></li>
            <li>
              <Link 
                href={`/${locale}/status/bankruptcies`} 
                className={!prefecture ? "font-semibold text-slate-800 dark:text-slate-200" : "hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors"}
              >
                倒産・解散・清算結了企業一覧
              </Link>
            </li>
            {prefecture && (
              <>
                <li><ChevronRight className="w-3.5 h-3.5 text-slate-400" /></li>
                <li className="font-semibold text-slate-800 dark:text-slate-200">
                  {prefecture.nameJa}
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
              <span>商業登記簿 法人解散・清算結了等の公表データ同期</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              与信管理・リスクマネジメント速報
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white mb-3">
            {prefLabel}の倒産・解散・清算企業一覧
            <span className="text-base sm:text-lg font-normal text-slate-500 dark:text-slate-400 ml-2">
              （{currentYear}年最新速報）
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl mb-6">
            {prefLabel}内で法務局および国税庁へ解散・清算結了等の閉鎖登記が公示された法人のデータベースです。
            企業の信用調査、与信管理、売掛債権回収リスクの把握、取引先の事業継続性モニタリングに必須の公的データを速報でお届けします。
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">解散・清算公表件数</div>
              <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {totalCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">件</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">対象エリア</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {prefLabel}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">登記ステータス</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                閉鎖・清算 <span className="text-xs font-normal text-slate-500">公的記録</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">更新頻度</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                毎日 <span className="text-xs font-normal text-slate-500">Daily Sync</span>
              </div>
            </div>
          </div>
        </section>

        {/* 47 Prefectures Filter Chips */}
        <section className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              都道府県で絞り込む
            </h2>
            <span className="text-xs text-slate-500">
              （クリックで地域別の解散・倒産情報へ移動）
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
              全国すべて
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
                  <span>{p.nameJa}</span>
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

        {/* Bankruptcies Events List */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span>新着解散・閉鎖登記一覧（{totalCount.toLocaleString()} 件中 {events.length} 件表示）</span>
            </h2>
            <Link
              href={`/${locale}/search?status=解散`}
              className="text-xs text-[#1B4F8A] dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              詳細条件で絞り込み検索 ➔
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-slate-500">
              現在、指定された条件の解散・清算データはありません。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => (
                <article
                  key={ev.id}
                  className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 hover:border-rose-300 dark:hover:border-rose-900/60 transition-all hover:shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200/60">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>登記年月日：{ev.event_date}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        法人番号: {ev.corporate_number}
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
                        {ev.prefecture_name}{ev.city_name || ''}
                      </span>
                    </div>

                    {/* Status Note */}
                    <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 mb-3">
                      <div className="font-semibold">{ev.title_ja}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {ev.description_ja || '法務局より解散等の登記が公表されました。'}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      ステータス：解散・清算結了
                    </span>
                    <Link
                      href={`/${locale}/company/${ev.corporate_number}`}
                      className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                    >
                      企業詳細・登記履歴を見る
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
                  前へ
                </Link>
              )}

              <span className="text-xs text-slate-500 px-3">
                {currentPage} / {totalPages} ページ
              </span>

              {currentPage < totalPages && (
                <Link
                  href={`/${locale}/status/bankruptcies${slug ? '/' + slug.join('/') : ''}?page=${currentPage + 1}`}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B22] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  次へ
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Credit Risk Management Banner */}
        <section className="bg-gradient-to-r from-slate-900 to-rose-950 text-white rounded-xl p-8 mb-8 shadow-sm border border-rose-900/40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-xs font-medium text-rose-200 mb-3">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Credit Risk Management</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3">
              取引先の倒産・与信リスク審査とアラート監視
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed mb-6">
              取引先の突然の倒産や解散による連鎖倒産・貸倒れを防止するために、法務局の商業登記情報を毎日自動監視。Kigyou-listでは最新の解散・破産・清算結了情報を瞬時に照会可能です。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/pricing`}
                className="px-5 py-2.5 rounded-lg bg-white text-rose-900 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>無料プランで試す</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/search`}
                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-colors"
              >
                全国企業データベースを検索
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
