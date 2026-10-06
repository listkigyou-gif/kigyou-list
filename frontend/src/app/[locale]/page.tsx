import { Search, Briefcase, Award, TrendingUp, Sparkles, Lightbulb } from "lucide-react";
import { getDatabaseStats, getFeaturedPartners, getMockPartners } from "@/lib/db";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getTranslations } from "@/lib/i18n";

export const revalidate = 3600; // Cache for 1 hour for high performance

interface PageParams {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: PageParams) {
  const { locale } = await params;
  const t = getTranslations(locale);

  // Fetch real database counts dynamically
  const stats = await getDatabaseStats();
  const realPartners = await getFeaturedPartners();
  const mockPartners = await getMockPartners();
  const partners = [...realPartners, ...mockPartners];

  // Split into 2 rows for a richer layout
  const halfLength = Math.ceil(partners.length / 2);
  const row1Partners = partners.slice(0, halfLength);
  const row2Partners = partners.slice(halfLength);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kigyou-list",
    "url": `https://kigyoulist.com/${locale}`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://kigyoulist.com/${locale}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kigyou-list",
    "url": `https://kigyoulist.com/${locale}`,
    "logo": "https://kigyoulist.com/icon.svg"
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* Premium Sleek Header */}
      <Header />

      <main className="flex-1">
        {/* Dynamic Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 bg-white dark:bg-[#0D1117] border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold mb-6 border border-slate-200/80 dark:border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{t.home.tagline}</span>
            </div>

            {/* H1 Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.2] text-slate-900 dark:text-white mb-6">
              {t.home.title1}<br className="sm:hidden" />
              <span className="text-[#1B4F8A] dark:text-blue-400">
                {t.home.title2}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              {t.home.desc}
            </p>

            {/* Centralized B2B Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <form action={`/${locale}/search`} method="GET" className="relative flex items-center p-1.5 rounded-2xl bg-white shadow-xs border border-slate-300 dark:bg-[#1C2128] dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#1B4F8A]/20 focus-within:border-[#1B4F8A] transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-3" />
                <input
                  type="text"
                  name="q"
                  placeholder={t.home.searchPlaceholder}
                  className="w-full px-4 py-3 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white text-sm"
                />
                <button
                  type="submit"
                  className="px-6 py-3 font-semibold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-xl shadow-xs transition-colors whitespace-nowrap"
                >
                  {t.home.searchBtn}
                </button>
              </form>
            </div>

            {/* Quick Filters (Chips) */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-400">{t.home.popular}</span>
              <a href={`/${locale}/search?prefecture=13`} className="px-3 py-1 rounded-lg bg-white border border-slate-200/80 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors">
                {t.home.prefectures}
              </a>
              <a href={`/${locale}/search?industry=G`} className="px-3 py-1 rounded-lg bg-white border border-slate-200/80 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors">
                {t.home.industryIT}
              </a>
              <a href={`/${locale}/search?hiring=true`} className="px-3 py-1 rounded-lg bg-white border border-slate-200/80 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors">
                {t.home.hiring}
              </a>
              <a href={`/${locale}/search?subsidy=true`} className="px-3 py-1 rounded-lg bg-white border border-slate-200/80 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors">
                {t.home.subsidy}
              </a>
              <a href={`/${locale}/search?patent=true`} className="px-3 py-1 rounded-lg bg-white border border-slate-200/80 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors">
                {t.home.patent}
              </a>
            </div>
          </div>
        </section>

        {/* Dynamic Statistics Counters */}
        <section id="stats" className="py-14 bg-slate-50 dark:bg-[#0F172A] transition-colors border-b border-slate-200/70 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stat 1 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white border border-slate-200/80 dark:bg-slate-850 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t.home.statsTitle1}</span>
                <span className="text-4xl sm:text-5xl font-bold text-[#1B4F8A] font-mono tracking-tight dark:text-blue-400">
                  {(stats.totalCompanies).toLocaleString()}+
                </span>
                <span className="text-xs text-slate-400 mt-2">{t.home.statsDesc1}</span>
              </div>
              {/* Stat 2 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white border border-slate-200/80 dark:bg-slate-850 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t.home.statsTitle2}</span>
                <span className="text-4xl sm:text-5xl font-bold text-slate-900 font-mono tracking-tight dark:text-white">
                  {stats.totalPrefectures}
                </span>
                <span className="text-xs text-slate-400 mt-2">{t.home.statsDesc2}</span>
              </div>
              {/* Stat 3 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white border border-slate-200/80 dark:bg-slate-850 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t.home.statsTitle3}</span>
                <span className="text-4xl sm:text-5xl font-bold text-slate-900 font-mono tracking-tight dark:text-white">
                  {stats.totalIndustries}
                </span>
                <span className="text-xs text-slate-400 mt-2">{t.home.statsDesc3}</span>
              </div>
              {/* Stat 4 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white border border-slate-200/80 dark:bg-slate-850 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {t.home.statsTitle4}
                </span>
                <span className="text-4xl sm:text-5xl font-bold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                  {(stats.signalPatent).toLocaleString()}+
                </span>
                <span className="text-xs text-slate-400 mt-2">{t.home.statsDesc4}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Partner Marquee Slider */}
        {partners && partners.length > 0 && (
          <section className="py-12 bg-slate-50/60 dark:bg-[#0B0F17] transition-colors border-y border-slate-200/80 dark:border-slate-800 overflow-hidden relative">
            <div className="max-w-3xl mx-auto mb-10 text-center animate-in fade-in duration-300 px-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                {t.home.partnerTitle}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t.home.partnerDesc}
              </p>
            </div>

            {/* Infinite Marquee Container */}
            <div className="relative w-full flex flex-col gap-6 overflow-hidden py-2">
              {/* Fade masks for edges */}
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50 dark:from-[#0B0F17] to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 dark:from-[#0B0F17] to-transparent z-10 pointer-events-none" />

              {/* Row 1: Right to Left */}
              <div className="flex gap-14 custom-marquee-scroll whitespace-nowrap">
                {[...row1Partners, ...row1Partners].map((partner, index) => (
                  <div
                    key={`${partner.user_email}-row1-${index}`}
                    className="inline-flex items-center select-none opacity-70 hover:opacity-100 transition-opacity duration-200 group shrink-0"
                  >
                    {(!partner.user_email.startsWith("mock_") && partner.logo_url && !partner.logo_url.startsWith("MOCK_SVG_")) ? (
                      <div className="h-8 max-w-[140px] flex items-center justify-center">
                        <img
                          src={partner.logo_url}
                          alt={partner.billing_name || "Partner Logo"}
                          className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-200 dark:brightness-200 dark:group-hover:brightness-100"
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors tracking-wide">
                        {partner.billing_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Row 2: Left to Right */}
              {row2Partners.length > 0 && (
                <div className="flex gap-14 custom-marquee-scroll-reverse whitespace-nowrap">
                  {[...row2Partners, ...row2Partners].map((partner, index) => (
                    <div
                      key={`${partner.user_email}-row2-${index}`}
                      className="inline-flex items-center select-none opacity-70 hover:opacity-100 transition-opacity duration-200 group shrink-0"
                    >
                      {(!partner.user_email.startsWith("mock_") && partner.logo_url && !partner.logo_url.startsWith("MOCK_SVG_")) ? (
                        <div className="h-8 max-w-[140px] flex items-center justify-center">
                          <img
                            src={partner.logo_url}
                            alt={partner.billing_name || "Partner Logo"}
                            className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-200 dark:brightness-200 dark:group-hover:brightness-100"
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors tracking-wide">
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
        <section id="features" className="py-20 bg-white dark:bg-[#0D1117] transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                {t.home.featuresTitle}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                {t.home.featuresDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="p-7 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs group">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center mb-5 border border-blue-100/80 dark:border-blue-900/40">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t.home.feat1Title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.home.feat1Desc}
                </p>
              </div>
              {/* Card 2 */}
              <div className="p-7 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs group">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center mb-5 border border-indigo-100/80 dark:border-indigo-900/40">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t.home.feat2Title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.home.feat2Desc}
                </p>
              </div>
              {/* Card 3 */}
              <div className="p-7 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs group">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center mb-5 border border-amber-100/80 dark:border-amber-900/40">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t.home.feat3Title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.home.feat3Desc}
                </p>
              </div>
              {/* Card 4 */}
              <div className="p-7 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs group">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center mb-5 border border-emerald-100/80 dark:border-emerald-900/40">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t.home.feat4Title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.home.feat4Desc}
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
