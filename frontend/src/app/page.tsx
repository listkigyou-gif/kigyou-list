import Link from 'next/link';
import { Search, Building2, Briefcase, Award, TrendingUp, Sparkles, Lightbulb } from 'lucide-react';
import { getDatabaseStats } from '@/lib/db';
import { Header } from '@/components/Header';

export const revalidate = 3600; // Cache for 1 hour for high performance

export default async function Home() {
  // Fetch real database counts dynamically
  const stats = await getDatabaseStats();

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

      {/* Elegant B2B Footer */}
      <footer className="bg-white border-t border-slate-200 dark:bg-[#0D1117] dark:border-slate-800 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">Kigyou-list</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="/directory" className="hover:text-primary dark:hover:text-secondary transition-colors">企業データ一覧</Link>
            <Link href="/terms" className="hover:text-primary dark:hover:text-secondary transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-primary dark:hover:text-secondary transition-colors">プライバシーポリシー</Link>
            <Link href="/contact" className="hover:text-primary dark:hover:text-secondary transition-colors">お問い合わせ</Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Kigyou-list. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
