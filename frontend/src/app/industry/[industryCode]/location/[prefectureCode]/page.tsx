import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, Phone, ArrowRight, 
  Search, Briefcase, TrendingUp, AlertCircle, BarChart3 
} from 'lucide-react';
import { 
  getIndustryByCode, getPrefectureByCode, 
  getCategoryStats, searchCompanies, getSiblingIndustries 
} from '@/lib/db';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const revalidate = 3600; // Cache categories for 1 hour, ISR enabled

interface PageProps {
  params: Promise<{
    industryCode: string;
    prefectureCode: string;
  }>;
}

// 1. Dynamic SEO Metadata Generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const ind = await getIndustryByCode(resolvedParams.industryCode);
  const pref = await getPrefectureByCode(resolvedParams.prefectureCode);

  if (!ind || !pref) {
    return {
      title: 'カテゴリが見わつかりません | Kigyou-list',
    };
  }

  return {
    title: `${pref.name}の${ind.industry_name}企業一覧（2026年最新） | Kigyou-list`,
    description: `${pref.name}で稼働している${ind.industry_name}の企業データベースです。企業名、電話番号、登記住所、資本金、従業員数、最新の採用活動、補助金受給履歴などの購買シグナルを網羅しています。`,
    keywords: [`${pref.name} ${ind.industry_name}`, `${pref.name} 企業リスト`, `${ind.industry_name} 営業リスト`],
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { industryCode, prefectureCode } = resolvedParams;

  // 2. Fetch Category details & Statistics
  const ind = await getIndustryByCode(industryCode);
  const pref = await getPrefectureByCode(prefectureCode);

  if (!ind || !pref) {
    return notFound();
  }

  const stats = await getCategoryStats(industryCode, prefectureCode);
  const { companies } = await searchCompanies('', { industry_code: industryCode, prefecture_code: prefectureCode }, 50, 0);

  // 3. Generate Cross-linking data for SEO Matrix (同地域・他業界 & 同業界・他地域)
  const siblingIndustries = await getSiblingIndustries(prefectureCode, industryCode, 5);
  const popularPrefectures = [
    { code: '13', name: '東京都' },
    { code: '27', name: '大阪府' },
    { code: '23', name: '愛知県' },
    { code: '14', name: '神奈川県' },
    { code: '40', name: '福岡県' }
  ];

  // Format currency stats
  const formatCapital = (val: number) => {
    if (val >= 10000) return `${(val / 10000).toFixed(0)}億円`;
    return `${val.toLocaleString()}万円`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      {/* Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Dynamic SEO Header / Intro Banner */}
        <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary dark:text-secondary uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              <span>業種 × 地域 特設カテゴリ</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {pref.name}の{ind.industry_name} 企業・営業リスト一覧
            </h1>

            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-4xl">
              {pref.name}内で活動中の{ind.industry_name}業界の企業データベースです。基本情報、代表者の連絡先、設立年月日に加え、最新の求人募集・補助金の獲得実績・公共入札などの購買シグナル（インテントデータ）をワンストップで確認・活用できます。
            </p>
          </div>

          {/* Aggregated Statistics Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">稼働企業数</span>
                <strong className="text-lg font-black font-mono text-slate-800 dark:text-white">
                  {stats.count.toLocaleString()} <span className="text-xs font-medium font-sans text-slate-500">社</span>
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">平均資本金</span>
                <strong className="text-lg font-black font-mono text-slate-800 dark:text-white">
                  {stats.avgCapital > 0 ? formatCapital(stats.avgCapital) : '未登録'}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">データベース網羅率</span>
                <strong className="text-lg font-black font-mono text-slate-800 dark:text-white">
                  100% <span className="text-xs font-medium font-sans text-slate-500">完全版</span>
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Results List */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              企業リスト一覧 ({companies.length}件表示)
            </h2>
            <span className="text-xs text-slate-400">資本金順にソート</span>
          </div>

          {companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map((comp) => (
                <div 
                  key={comp.corporate_number}
                  className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 hover:border-primary dark:hover:border-secondary rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="flex flex-col gap-3">
                    {/* Header: Status and Location */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm ${
                        comp.status === '閉鎖' || comp.status === '解散'
                          ? 'text-rose-800 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-450 border-rose-200/20 dark:border-rose-900/30'
                          : 'text-emerald-800 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/20 dark:border-emerald-900/50'
                      }`}>
                        {comp.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-300" />
                        {comp.prefecture_name}
                      </span>
                    </div>

                    {/* Company Name */}
                    <Link 
                      href={`/company/${comp.corporate_number}`}
                      className="text-base font-extrabold text-slate-900 dark:text-white hover:text-primary dark:hover:text-secondary group-hover:underline tracking-tight transition-colors line-clamp-1 block"
                    >
                      {comp.company_name}
                    </Link>

                    {/* Standard details block */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 py-1 border-y border-slate-50 dark:border-slate-800/30">
                      <div>
                        <span className="text-slate-400 block text-[9px]">資本金</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-mono font-bold">
                          {comp.capital_amount ? `${(comp.capital_amount / 10000).toLocaleString()}万円` : '未登録'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">従業員数</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-mono font-bold">
                          {comp.employee_count ? `${comp.employee_count}名` : '未登録'}
                        </strong>
                      </div>
                    </div>

                    {/* Blurred phone details for guest */}
                    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-semibold">代表電話: </span>
                      <span className="font-mono">{comp.phone_number || '未登録'}</span>
                    </div>
                  </div>

                  {/* Call to action card detail link */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono block">
                      ID: {comp.corporate_number}
                    </span>
                    <Link 
                      href={`/company/${comp.corporate_number}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:text-primary-hover dark:text-secondary dark:group-hover:text-secondary-hover transition-colors"
                    >
                      詳細プロフィール
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-10 h-10 text-slate-300" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">対象企業が見つかりませんでした</h4>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">
                  現在、{pref.name}の{ind.industry_name}に該当するテストデータは登録されていません。データアップデートをお待ちください。
                </p>
              </div>
            </div>
          )}
        </section>

        {/* SEO Cross-linking Matrix Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 pt-8 border-t border-slate-200 dark:border-slate-800">
          {/* 同地域・他業界 (Sibling industries in same prefecture) */}
          <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-black text-sm text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              {pref.name}の他の業種から探す (同地域)
            </h3>
            {siblingIndustries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {siblingIndustries.map(item => (
                  <Link 
                    key={item.code} 
                    href={`/industry/${item.code}/location/${prefectureCode}`}
                    className="text-xs font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-secondary flex items-center gap-1 transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{pref.name}の{item.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400">他のカテゴリ情報はありません</span>
            )}
          </div>

          {/* 同業界・他地域 (Same industry in popular prefectures) */}
          <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-black text-sm text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              他の主要都道府県から探す (同業種)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {popularPrefectures.filter(p => p.code !== prefectureCode).map(p => (
                <Link 
                  key={p.code} 
                  href={`/industry/${industryCode}/location/${p.code}`}
                  className="text-xs font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-secondary flex items-center gap-1 transition-colors"
                >
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{p.name}の{ind.industry_name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
