import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, Calendar, ExternalLink, ChevronRight,
  Briefcase, Users, Coins, Download, Filter, UserCheck, ArrowUpRight
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

  const title = `${prefLabel}の求人募集中・新着採用企業一覧【${ymLabel}】 | Kigyou-list`;
  const description = `${prefLabel}で現在、積極採用・求人募集を行っている企業のデータベース一覧です。公式採用ページURL、ハローワーク求人、法人番号、所在地、資本金、従業員規模を網羅。人材紹介、人材派遣、中途採用リサーチに。`;

  const canonicalPath = slug && slug.length > 0 ? `/jobs/latest/${slug.join('/')}` : '/jobs/latest';

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

export default async function LatestJobsHubPage({ params, searchParams }: PageProps) {
  const { locale = 'ja', slug } = await params;
  const { page } = await searchParams;

  const { prefecture, yearMonth } = parseHubSlug(slug);
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const limit = 40;
  const offset = (currentPage - 1) * limit;

  // Query events from hub_dynamic_events for 'hiring'
  const [events, totalCount, prefCounts] = await Promise.all([
    getHubDynamicEvents({
      category: 'hiring',
      prefectureCode: prefecture?.code,
      yearMonth: yearMonth || undefined,
      limit,
      offset
    }),
    getHubDynamicEventsCount({
      category: 'hiring',
      prefectureCode: prefecture?.code,
      yearMonth: yearMonth || undefined,
    }),
    getHubPrefectureCounts('hiring', yearMonth || undefined)
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
  const pageUrl = `${baseUrl}/${locale}/jobs/latest${slug && slug.length > 0 ? '/' + slug.join('/') : ''}`;

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
            'name': '求人募集中企業一覧',
            'item': `${baseUrl}/${locale}/jobs/latest`
          },
          ...(prefecture ? [{
            '@type': 'ListItem',
            'position': 3,
            'name': `${prefecture.nameJa}の採用企業`,
            'item': `${baseUrl}/${locale}/jobs/latest/${prefecture.slug}`
          }] : [])
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        'url': pageUrl,
        'name': `${prefLabel}の求人募集中企業一覧【${currentYear}年最新】`,
        'description': `${prefLabel}において求人採用を実施している企業のデータベース一覧です。`,
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
                href={`/${locale}/jobs/latest`} 
                className={!prefecture ? "font-semibold text-slate-800 dark:text-slate-200" : "hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors"}
              >
                求人募集中企業一覧
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70">
              <Briefcase className="w-4 h-4" />
              <span>公式採用ページ & ハローワーク求人シグナル検知</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              毎日自動更新・Hiring Intent Data Hub
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white mb-3">
            {prefLabel}の求人募集中・新着採用企業一覧
            <span className="text-base sm:text-lg font-normal text-slate-500 dark:text-slate-400 ml-2">
              （{currentYear}年最新速報）
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl mb-6">
            {prefLabel}にて現在、中途採用・正社員募集・新卒採用を積極的に行っている企業のデータベースです。
            採用活動中の企業は事業拡大期にあり、人材紹介、人事SaaS、研修サービス、オフィス拡大など様々なB2B商材の導入意欲が旺盛です。公式リクルートページやハローワーク求人を検知した企業を毎日更新。
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">採用中企業総数</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {totalCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">社</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">対象エリア</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {prefLabel}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">シグナル種別</div>
              <div className="text-xl sm:text-2xl font-bold text-[#1B4F8A] dark:text-blue-400 mt-0.5">
                求人中 <span className="text-xs font-normal text-slate-500">Intent Signal</span>
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
              （クリックで地域別の採用企業一覧へ移動）
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/${locale}/jobs/latest`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !prefecture
                  ? 'bg-[#1B4F8A] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-[#F0F4F9] dark:hover:bg-slate-700/80'
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
                  href={`/${locale}/jobs/latest/${p.slug}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-[#1B4F8A] text-white shadow-sm'
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

        {/* Jobs List View */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>求人募集中企業一覧（{totalCount.toLocaleString()} 件中 {events.length} 件表示）</span>
            </h2>
            <Link
              href={`/${locale}/search?has_hiring=true&prefecture=${prefecture?.code || ''}`}
              className="text-xs text-[#1B4F8A] dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              求人シグナルで詳細検索 ➔
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-slate-500">
              現在、指定された条件の求人企業データはありません。
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
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>求人募集中速報</span>
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

                    {/* Hiring Context Box */}
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs mb-3">
                      <div className="text-emerald-900 dark:text-emerald-300 font-medium">
                        {ev.description_ja || '採用活動を実施中。'}
                      </div>
                      {ev.new_value && ev.new_value.startsWith('http') && (
                        <div className="mt-1">
                          <a
                            href={ev.new_value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#1B4F8A] dark:text-blue-400 font-semibold hover:underline"
                          >
                            <span>公式採用ページを開く</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      確認日：{ev.event_date}
                    </span>
                    <Link
                      href={`/${locale}/company/${ev.corporate_number}`}
                      className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                    >
                      企業詳細・連絡先を見る
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
                  href={`/${locale}/jobs/latest${slug ? '/' + slug.join('/') : ''}?page=${currentPage - 1}`}
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
                  href={`/${locale}/jobs/latest${slug ? '/' + slug.join('/') : ''}?page=${currentPage + 1}`}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B22] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  次へ
                </Link>
              )}
            </div>
          )}
        </section>

        {/* HR & B2B Sales Call to Action Banner */}
        <section className="bg-gradient-to-r from-slate-900 to-[#1B4F8A] text-white rounded-xl p-8 mb-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-xs font-medium text-blue-200 mb-3">
              <Download className="w-3.5 h-3.5" />
              <span>Hiring Intent Sales Leads</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3">
              採用活動中の企業リストをCSVで一括ダウンロード
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed mb-6">
              求人を公開している企業は、成長に伴う予算があり意思決定スピードが極めて早い優良見込み顧客です。人材紹介やHRTech、B2Bサービスの提案先として高い成約率を期待できます。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/pricing`}
                className="px-5 py-2.5 rounded-lg bg-white text-[#1B4F8A] hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>無料プランで試す</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/search?has_hiring=true`}
                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-colors"
              >
                求人シグナル企業を詳細検索
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
