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
        <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 bg-gradient-to-b from-white to-slate-50 dark:from-[#0D1117] dark:to-[#0F172A] border-b border-slate-200/50 dark:border-slate-800/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,168,150,0.06),transparent_50%)]" />
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300 text-xs font-semibold mb-6 border border-slate-200/50 dark:border-slate-700/50">
              <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
              <span>{t.home.tagline}</span>
            </div>

            {/* H1 Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] text-slate-900 dark:text-white mb-6">
              {t.home.title1}<br className="sm:hidden" />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t.home.title2}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t.home.desc}
            </p>

            {/* Centralized B2B Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <form action={`/${locale}/search`} method="GET" className="relative flex items-center p-2 rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-200/80 dark:bg-[#1C2128] dark:border-slate-800 dark:shadow-none transition-all focus-within:ring-2 focus-within:ring-primary/20">
                <Search className="w-5 h-5 text-slate-400 ml-3" />
                <input
                  type="text"
                  name="q"
                  placeholder={t.home.searchPlaceholder}
                  className="w-full px-4 py-3 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
                />
                <button
                  type="submit"
                  className="px-6 py-3 font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-colors whitespace-nowrap"
                >
                  {t.home.searchBtn}
                </button>
              </form>
            </div>

            {/* Quick Filters (Chips) */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-400">{t.home.popular}</span>
              <a href={`/${locale}/search?prefecture=13`} className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary transition-all">
                {t.home.prefectures}
              </a>
              <a href={`/${locale}/search?industry=G`} className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary transition-all">
                {t.home.industryIT}
              </a>
              <a href={`/${locale}/search?hiring=true`} className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary transition-all">
                {t.home.hiring}
              </a>
              <a href={`/${locale}/search?subsidy=true`} className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary transition-all">
                {t.home.subsidy}
              </a>
              <a href={`/${locale}/search?patent=true`} className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary transition-all">
                {t.home.patent}
              </a>
            </div>
          </div>
        </section>

        {/* Dynamic Statistics Counters */}
        <section id="stats" className="py-16 bg-white dark:bg-[#0D1117] transition-colors border-b border-slate-200/50 dark:border-slate-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stat 1 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/30">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t.home.statsTitle1}</span>
                <span className="text-4xl sm:text-5xl font-black text-primary font-mono tracking-tight dark:text-white">
                  {(stats.totalCompanies).toLocaleString()}+
                </span>
                <span className="text-xs text-slate-400 mt-2">{t.home.statsDesc1}</span>
              </div>
              {/* Stat 2 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/30">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t.home.statsTitle2}</span>
                <span className="text-4xl sm:text-5xl font-black text-secondary font-mono tracking-tight dark:text-white">
                  {stats.totalPrefectures}
                </span>
                <span className="text-xs text-slate-400 mt-2">{t.home.statsDesc2}</span>
              </div>
              {/* Stat 3 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/30">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t.home.statsTitle3}</span>
                <span className="text-4xl sm:text-5xl font-black text-amber-500 font-mono tracking-tight dark:text-white">
                  {stats.totalIndustries}
                </span>
                <span className="text-xs text-slate-400 mt-2">{t.home.statsDesc3}</span>
              </div>
              {/* Stat 4 */}
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/30">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-500 animate-pulse" />
                  {t.home.statsTitle4}
                </span>
                <span className="text-4xl sm:text-5xl font-black text-indigo-500 font-mono tracking-tight dark:text-white">
                  {(stats.signalPatent).toLocaleString()}+
                </span>
                <span className="text-xs text-slate-400 mt-2">{t.home.statsDesc4}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Partner Marquee Slider */}
        {partners && partners.length > 0 && (
          <section className="py-12 bg-white dark:bg-[#0D1117] transition-colors border-b border-slate-200/50 dark:border-slate-800/30 overflow-hidden relative">
            <div className="max-w-3xl mx-auto mb-12 text-center animate-in fade-in duration-300">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                {t.home.partnerTitle}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {t.home.partnerDesc}
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
                {t.home.featuresTitle}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                {t.home.featuresDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Card 1 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200/60 dark:bg-[#1C2128] dark:border-slate-800/60 group hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 dark:bg-primary/20 dark:text-white">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{t.home.feat1Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.home.feat1Desc}
                </p>
              </div>
              {/* Card 2 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200/60 dark:bg-[#1C2128] dark:border-slate-800/60 group hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 dark:bg-secondary/20 dark:text-white">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{t.home.feat2Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.home.feat2Desc}
                </p>
              </div>
              {/* Card 3 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200/60 dark:bg-[#1C2128] dark:border-slate-800/60 group hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 dark:bg-amber-500/20 dark:text-white">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{t.home.feat3Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.home.feat3Desc}
                </p>
              </div>
              {/* Card 4 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200/60 dark:bg-[#1C2128] dark:border-slate-800/60 group hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 dark:bg-emerald-500/20 dark:text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{t.home.feat4Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
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
