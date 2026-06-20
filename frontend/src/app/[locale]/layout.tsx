import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { CookieBanner } from "@/components/CookieBanner";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { getTranslations } from "@/lib/i18n";
import { LanguageProvider } from "@/context/LanguageContext";
import Script from "next/script";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-sans",
});

interface LayoutParams {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  let title = "Kigyou-list | 500万社の日本企業データベース・営業リスト";
  let description = "日本全国500万社以上の企業情報を網羅した国内最大級 of B2Bデータベース。業界最安値の料金、JSIC産業分類や都道府県、資本金、従業員数による高度な絞り込みに加え、採用・助成金・入札などの最新 of 営業意欲（インテント）シグナルをご活用いただけます。";
  let keywords = ["企業リスト", "営業リスト", "企業データベース", "求人活動", "助成金", "補助金", "入札調達"];
  let ogLocale = "ja_JP";

  if (locale === "en") {
    title = "Kigyou-list | Over 5M Japanese Companies Database & Sales List";
    description = "Japan's largest B2B database covering over 5 million company profiles. Benefit from advanced filtering by JSIC industries, prefectures, capital, and active sales intent signals.";
    keywords = ["corporate database", "sales list", "b2b database", "job hiring list", "subsidies list"];
    ogLocale = "en_US";
  } else if (locale === "vi") {
    title = "Kigyou-list | Cơ sở dữ liệu & Danh sách doanh nghiệp Nhật Bản";
    description = "Cơ sở dữ liệu B2B lớn nhất Nhật Bản với hơn 5 triệu hồ sơ doanh nghiệp. Hỗ trợ lọc nâng cao theo ngành nghề JSIC, tỉnh thành, vốn điều lệ và tín hiệu tuyển dụng/trợ cấp/đấu thầu.";
    keywords = ["cơ sở dữ liệu doanh nghiệp", "danh sách doanh nghiệp Nhật Bản", "danh sách công ty", "tuyển dụng", "trợ cấp", "đấu thầu"];
    ogLocale = "vi_VN";
  }

  return {
    metadataBase: new URL("https://kigyoulist.com"),
    title,
    description,
    keywords,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ja: "/ja",
        en: "/en",
        vi: "/vi",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}`,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: "/icon.svg",
          width: 512,
          height: 512,
          alt: "Kigyou-list Logo",
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/icon.svg"],
    },
  };
}

export default async function LocalizedLayout({
  children,
  params,
}: Readonly<LayoutParams>) {
  const session = await auth();
  const { locale } = await params;
  const translations = getTranslations(locale);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html
      lang={locale}
      className={`h-full antialiased ${notoSansJP.variable}`}
    >
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}
      <body className="min-h-full flex flex-col font-sans bg-bg-light text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
        <SessionProvider session={session}>
          <LanguageProvider locale={locale} translations={translations}>
            <AuthProvider>
              {children}
              <AuthModal />
              <CookieBanner />
            </AuthProvider>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
