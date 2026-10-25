import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  Building2, ShieldCheck, ArrowRight, Award, FileCheck2, 
  Users, MapPin, Download, CheckCircle2, ChevronRight, Sparkles, Scale, Landmark
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LICENSE_HUBS, getLicenseHubStats } from '@/lib/licenseHubs';

export const revalidate = 3600; // Cache 1 hour with ISR

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale = 'ja' } = await params;
  const isEn = locale === 'en';
  const isVi = locale === 'vi';
  const currentYear = new Date().getFullYear();

  const title = isVi
    ? `Cơ sở Dữ liệu Giấy phép Doanh nghiệp & Pháp nhân Chuyên môn Nhật Bản (${currentYear}) | Kigyou-list`
    : isEn
    ? `Official Government Licenses & Accredited Corporations in Japan (${currentYear}) | Kigyou-list`
    : `日本の公的許認可・士業登録 企業データベース一覧（${currentYear}年最新） | Kigyou-list`;

  const description = isVi
    ? `Tra cứu danh bạ hơn 510.000 doanh nghiệp sở hữu giấy phép chính phủ Nhật Bản: Cơ quan hỗ trợ Tokutei Gino (ISA), Giấy phép BĐS Takken, Xây dựng 29 ngành, Pháp nhân Kế toán - Thuế - Luật, Phái cử lao động.`
    : isEn
    ? `Comprehensive directory of over 510,000 officially licensed corporations in Japan across immigration support, real estate, construction, statutory professional legal & accounting corps, and staffing.`
    : `出入国在留管理庁の登録支援機関、宅地建物取引業（不動産免許）、国土交通省建設業許可（29業種）、税理士・弁護士等の士業法人など、全国51万件超の公的許認可・資格保有企業データベースです。`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://kigyoulist.com/${locale}/licenses`,
      languages: {
        'ja': 'https://kigyoulist.com/ja/licenses',
        'en': 'https://kigyoulist.com/en/licenses',
        'vi': 'https://kigyoulist.com/vi/licenses',
      }
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/licenses`,
      siteName: 'Kigyou-list',
      locale: isEn ? 'en_US' : isVi ? 'vi_VN' : 'ja_JP',
      type: 'website'
    }
  };
}

export default async function LicensesOverviewPage({ params }: PageProps) {
  const { locale = 'ja' } = await params;
  const isEn = locale === 'en';
  const isVi = locale === 'vi';

  // Fetch stats for all license hubs in parallel
  const hubsList = Object.values(LICENSE_HUBS);
  const statsEntries = await Promise.all(
    hubsList.map(async (hub) => {
      const stats = await getLicenseHubStats(hub.slug);
      return { slug: hub.slug, nationalCount: stats.nationalCount };
    })
  );

  const statsMap = new Map(statsEntries.map(s => [s.slug, s.nationalCount]));
  const grandTotal = statsEntries.reduce((sum, s) => sum + s.nationalCount, 0);

  const d = {
    badge: isVi ? 'CƠ SỞ DỮ LIỆU GIẤY PHÉP CHÍNH THỨC' : isEn ? 'OFFICIAL GOVERNMENT LICENSES DIRECTORY' : '日本国公的許認可・士業登録 総合ディレクトリ',
    heroTitle: isVi 
      ? 'Tra Cứu Doanh Nghiệp Sở Hữu Giấy Phép Chính Phủ & Pháp Nhân Chuyên Môn Nhật Bản'
      : isEn
      ? 'Verified Government Licenses & Professional Corps Directory in Japan'
      : '公的許認可・国家資格・士業専門職 法人データベース',
    heroDesc: isVi
      ? `Khám phá hơn ${grandTotal.toLocaleString()} pháp nhân sở hữu giấy phép hành nghề, kinh doanh hợp pháp từ các Bộ ban ngành Nhật Bản (出入国在留管理庁, 国土交通省, 厚生労働省, 公安委員会...). Tải dữ liệu CSV với đầy đủ số điện thoại và người đại diện.`
      : isEn
      ? `Explore over ${grandTotal.toLocaleString()} certified corporations holding authorized national operating licenses from Japanese ministries and government agencies. Export clean B2B prospecting lists with verified phone numbers and direct executives.`
      : `法務省出入国在留管理庁、国土交通省、厚生労働省、都道府県公安委員会などの公的機関から認可・登録を受けた全国 ${grandTotal.toLocaleString()} 件の正規許認可企業を横断検索。全社法人番号・直通連絡先・代表者名を網羅。`,
    exploreHub: isVi ? 'Xem danh bạ & Tải CSV' : isEn ? 'Explore Hub & Export CSV' : '専用ハブを開く・CSV出力',
    totalNationwide: isVi ? 'Toàn quốc' : isEn ? 'Nationwide' : '全国登録数',
    corps: isVi ? 'doanh nghiệp' : isEn ? 'companies' : '社',
    breadcrumbsHome: isVi ? 'Trang chủ' : isEn ? 'Home' : 'ホーム',
    breadcrumbsLicenses: isVi ? 'Giấy phép công' : isEn ? 'Licenses' : '公的許認可ハブ'
  };

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': d.breadcrumbsHome,
        'item': `https://kigyoulist.com/${locale}`
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': d.breadcrumbsLicenses,
        'item': `https://kigyoulist.com/${locale}/licenses`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header />

      {/* Structured Data Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
          <Link href={`/${locale}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {d.breadcrumbsHome}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold">{d.breadcrumbsLicenses}</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{d.badge}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {d.heroTitle}
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-650 dark:text-slate-350 leading-relaxed">
              {d.heroDesc}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-550 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{locale === 'ja' ? '国税庁法人番号 100% 照合済' : locale === 'vi' ? 'Khớp 100% Mã số thuế NTA' : '100% NTA Corporate Number Match'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{locale === 'ja' ? '47都道府県・自治体台帳連携' : locale === 'vi' ? 'Bao phủ 47 tỉnh thành' : '47 Prefectures Covered'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{locale === 'ja' ? 'CSV一括ダウンロード対応' : locale === 'vi' ? 'Hỗ trợ xuất file CSV tiện lợi' : 'Direct CSV Export Ready'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* License Hubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubsList.map((hub) => {
            const count = statsMap.get(hub.slug) || 0;
            const lang = locale as 'ja' | 'en' | 'vi';

            return (
              <div 
                key={hub.slug}
                className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Badge & Authority */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${hub.badgeBg}`}>
                      {hub.badge[lang] || hub.badge.ja}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                      {count.toLocaleString()} {d.corps}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <Link href={`/${locale}/license/${hub.slug}`}>
                      {hub.shortName[lang] || hub.shortName.ja}
                    </Link>
                  </h2>

                  {/* Authority & Legal Act */}
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{hub.authority[lang] || hub.authority.ja}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{hub.statutoryAct[lang] || hub.statutoryAct.ja}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs text-slate-650 dark:text-slate-350 line-clamp-3 leading-relaxed">
                    {hub.description[lang] || hub.description.ja}
                  </p>
                </div>

                {/* Bottom Action CTA */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-350">
                    {d.totalNationwide}: <strong className="text-slate-900 dark:text-white font-mono">{count.toLocaleString()}</strong>
                  </span>
                  
                  <Link
                    href={`/${locale}/license/${hub.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>{d.exploreHub}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
