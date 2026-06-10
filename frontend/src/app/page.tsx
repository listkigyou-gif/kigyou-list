import Link from 'next/link';
import { Search, Building2, Briefcase, Award, TrendingUp, Sparkles, Lightbulb } from 'lucide-react';
import { getDatabaseStats, getFeaturedPartners, getMockPartners } from '@/lib/db';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const revalidate = 3600; // Cache for 1 hour for high performance

export default async function Home() {
  // Fetch real database counts dynamically
  const stats = await getDatabaseStats();
  const realPartners = await getFeaturedPartners();
  const mockPartners = await getMockPartners();
  // Gộp đối tác thật lên trước, sau đó tới 50 đối tác mẫu để danh sách luôn phong phú
  const partners = [...realPartners, ...mockPartners];

  // Split into 2 rows for a richer layout
  const halfLength = Math.ceil(partners.length / 2);
  const row1Partners = partners.slice(0, halfLength);
  const row2Partners = partners.slice(halfLength);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
      {/* Premium Sleek Header */}
      <Header />

      <main className="flex-1">
        {/* Dynamic Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 bg-gradient-to-b from-white to-slate-50 dark:from-[#0D1117] dark:to-[#0F172A] border-b border-slate-200/50 dark:border-slate-800/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,168,150,0.06),transparent_50%)]" />
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300 text-xs font-semibold mb-6 border border-slate-200/50 dark:border-slate-700/50">
              <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
              <span>国内最大級 500万社超の法人生の購買シグナルを可視化</span>
            </div>

            {/* H1 Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] text-slate-900 dark:text-white mb-6">
              500万社の企業データを、<br className="sm:hidden" />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                今すぐ無料で検索
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              高精度なJSIC業界分類、47都道府県別の検索に加え、<br className="hidden sm:inline" />
              最新の求人・助成金受給・公共入札などの「営業活動シグナル」でアプローチ。
            </p>

            {/* Centralized B2B Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <form action="/search" method="GET" className="relative flex items-center p-2 rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-200/80 dark:bg-[#1C2128] dark:border-slate-800 dark:shadow-none transition-all focus-within:ring-2 focus-within:ring-primary/20">
                <Search className="w-5 h-5 text-slate-400 ml-3" />
                <input
                  type="text"
                  name="q"
                  placeholder="企業名、業界、住所、キーワードを入力..."
                  className="w-full px-4 py-3 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
                />
                <button
                  type="submit"
                  className="px-6 py-3 font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-colors whitespace-nowrap"
                >
                  検索する
                </button>
              </form>
            </div>

            {/* Quick Filters (Chips) */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-400">人気の条件:</span>
              <Link href="/search?prefecture=13" className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary transition-all">
                #東京都
              </Link>
              <Link href="/search?industry=G" className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary transition-all">
                #IT・通信
              </Link>
              <Link href="/search?hiring=true" className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary transition-all">
                #求人活動中 🔑
              </Link>
              <Link href="/search?subsidy=true" className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary transition-all">
                #補助金受給 🔑
              </Link>
              <Link href="/search?patent=true" className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary transition-all">
                #特許・商標 🔑
              </Link>
            </div>
          </div>
        </section>

        {/* Dynamic Statistics Counters */}
        <section id="stats" className="py-16 bg-white dark:bg-[#0D1117] transition-colors border-b border-slate-200/50 dark:border-slate-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stat 1 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/30">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">収録企業数</span>
                <span className="text-4xl sm:text-5xl font-black text-primary font-mono tracking-tight dark:text-white">
                  {(stats.totalCompanies).toLocaleString()}+
                </span>
                <span className="text-xs text-slate-400 mt-2">独自データ収集・ AIクローリングパイプライン連携</span>
              </div>
              {/* Stat 2 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/30">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">都道府県カバー</span>
                <span className="text-4xl sm:text-5xl font-black text-secondary font-mono tracking-tight dark:text-white">
                  {stats.totalPrefectures}
                </span>
                <span className="text-xs text-slate-400 mt-2">北海道から沖縄まで全国完全網羅</span>
              </div>
              {/* Stat 3 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/30">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">JSIC 標準業界数</span>
                <span className="text-4xl sm:text-5xl font-black text-amber-500 font-mono tracking-tight dark:text-white">
                  {stats.totalIndustries}
                </span>
                <span className="text-xs text-slate-400 mt-2">AI-Tagging Pipeline による業界自動マッピング</span>
              </div>
              {/* Stat 4 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/30">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-500 animate-pulse" />
                  特許・商標保有
                </span>
                <span className="text-4xl sm:text-5xl font-black text-indigo-500 font-mono tracking-tight dark:text-white">
                  {(stats.signalPatent).toLocaleString()}+
                </span>
                <span className="text-xs text-slate-400 mt-2">特許庁公開データ・自社保有技術</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Partner Marquee Slider */}
        {partners && partners.length > 0 && (
          <section className="py-12 bg-white dark:bg-[#0D1117] transition-colors border-b border-slate-200/50 dark:border-slate-800/30 overflow-hidden relative">
            <div className="max-w-3xl mx-auto mb-12 text-center animate-in fade-in duration-300">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                多くの成長企業にご活用いただいています
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                +10,000社以上の企業に導入・信頼されています
              </p>
            </div>

            {/* Infinite Marquee Container */}
            <div className="relative w-full flex flex-col gap-6 overflow-hidden py-4">
              {/* Gradient masks for fading edges */}
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent dark:from-[#0D1117] z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent dark:from-[#0D1117] z-10 pointer-events-none" />

              {/* Row 1: Right to Left */}
              <div className="flex gap-16 custom-marquee-scroll whitespace-nowrap">
                {[...row1Partners, ...row1Partners].map((partner, index) => (
                  <div
                    key={`${partner.user_email}-row1-${index}`}
                    className="inline-flex items-center select-none hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 group shrink-0"
                  >
                    {(!partner.user_email.startsWith("mock_") && partner.logo_url && !partner.logo_url.startsWith("MOCK_SVG_")) ? (
                      <div className="h-8 max-w-[140px] flex items-center justify-center">
                        <img
                          src={partner.logo_url}
                          alt={partner.billing_name || "Partner Logo"}
                          className="max-h-full max-w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 dark:brightness-200 dark:group-hover:brightness-100"
                        />
                      </div>
                    ) : (
                      <span className="text-sm sm:text-base font-black text-slate-450 dark:text-slate-500 group-hover:text-primary dark:group-hover:text-secondary transition-colors tracking-wide">
                        {partner.billing_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Row 2: Left to Right */}
              {row2Partners.length > 0 && (
                <div className="flex gap-16 custom-marquee-scroll-reverse whitespace-nowrap">
                  {[...row2Partners, ...row2Partners].map((partner, index) => (
                    <div
                      key={`${partner.user_email}-row2-${index}`}
                      className="inline-flex items-center select-none hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 group shrink-0"
                    >
                      {(!partner.user_email.startsWith("mock_") && partner.logo_url && !partner.logo_url.startsWith("MOCK_SVG_")) ? (
                        <div className="h-8 max-w-[140px] flex items-center justify-center">
                          <img
                            src={partner.logo_url}
                            alt={partner.billing_name || "Partner Logo"}
                            className="max-h-full max-w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 dark:brightness-200 dark:group-hover:brightness-100"
                          />
                        </div>
                      ) : (
                        <span className="text-sm sm:text-base font-black text-slate-450 dark:text-slate-500 group-hover:text-primary dark:group-hover:text-secondary transition-colors tracking-wide">
                          {partner.billing_name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Feature Grid */}
        <section id="features" className="py-20 bg-slate-50 dark:bg-[#0F172A] transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                営業の成約率を跳ね上げる4つの特徴
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Kigyou-list は、静的な企業リストの枠を超え、購買意欲（インテント）に直結する生きたシグナルを提供します。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Card 1 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200/60 dark:bg-[#1C2128] dark:border-slate-800/60 group hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 dark:bg-primary/20 dark:text-white">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">超高速詳細検索</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  業界、地域、資本金、従業員数などの基本条件を瞬時に掛け合わせる超高速 Faceted Search を実装。
                </p>
              </div>
              {/* Card 2 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200/60 dark:bg-[#1C2128] dark:border-slate-800/60 group hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 dark:bg-secondary/20 dark:text-white">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">求人採用シグナル</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  最新のリアルタイム求人情報を解析。採用意欲が極めて高い、今アプローチすべき企業を特定。
                </p>
              </div>
              {/* Card 3 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200/60 dark:bg-[#1C2128] dark:border-slate-800/60 group hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 dark:bg-amber-500/20 dark:text-white">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">官公庁・補助金データ</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  公的機関への入札落札実績や補助金受給履歴を網羅。予算が潤沢な企業をあぶり出します。
                </p>
              </div>
              {/* Card 4 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200/60 dark:bg-[#1C2128] dark:border-slate-800/60 group hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 dark:bg-emerald-500/20 dark:text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">5年決算トレンド</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  企業の売上、経常利益、純資産の推移を5年間分可視化。成長フェーズの正確な分析を可能にします。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
