import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { SessionProvider } from "next-auth/react";
import { getTranslations } from "@/lib/i18n";
import { LanguageProvider } from "@/context/LanguageContext";
import { Suspense } from "react";
import { TopProgressBar } from "@/components/TopProgressBar";
import Script from "next/script";

const VALID_LOCALES = ["ja", "en", "vi"];

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
  if (!VALID_LOCALES.includes(locale)) {
    return notFound();
  }
  
  let title = "企業リスト・企業データ検索ならKigyou-list | 全国500万社の営業リスト作成・無料ダウンロード";
  let description = "【無料DLあり】日本全国500万社以上の企業リスト・企業データを網羅した国内最大級のB2Bデータベース。業界・地域・資本金や求人・補助金・入札シグナルで高確度ターゲティング。電話番号・HP・お問い合わせフォームURL付きの最新営業リストを即時作成＆CSV一括出力可能です。";
  let keywords = [
    "企業リスト",
    "企業データ",
    "営業リスト",
    "全国企業リスト",
    "企業情報 検索",
    "日本企業データベース",
    "B2B営業リスト",
    "法人リスト 無料",
    "テレアポ リスト",
    "問い合わせフォーム営業"
  ];
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

  const isIndexableLocale = locale === "ja";

  return {
    metadataBase: new URL("https://kigyoulist.com"),
    title,
    description,
    keywords,
    alternates: {
      types: {
        "text/plain": [
          { url: "/llms.txt", title: "LLMs Context" },
          { url: "/llms-full.txt", title: "Full LLMs Context" },
        ],
      },
    },
    openGraph: {
      title,
      description,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Kigyou-list - 500万社の日本企業データベース・営業リスト",
        },
      ],
    },
    robots: {
      index: isIndexableLocale,
      follow: isIndexableLocale,
      googleBot: {
        index: isIndexableLocale,
        follow: isIndexableLocale,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      other: {
        'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '',
      },
    },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [
        { url: "/icon.svg" },
      ],
    },
  };
}

export default async function LocalizedLayout({
  children,
  params,
}: Readonly<LayoutParams>) {
  const { locale } = await params;
  if (!VALID_LOCALES.includes(locale)) {
    notFound();
  }
  const translations = getTranslations(locale);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kigyou-list",
    legalName: "TQC株式会社",
    taxID: "4013301048678",
    alternateName: ["Kigyou List", "kigyoulist.com", "企業リスト", "Kigyou-list（企業リスト）"],
    url: "https://kigyoulist.com/ja",
    logo: "https://kigyoulist.com/og-image.png",
    publishingPrinciples: "https://kigyoulist.com/llms.txt",
    creditText: "出典: Kigyou-list（企業リスト） https://kigyoulist.com/ja",
    copyrightNotice: "© Kigyou-list (TQC株式会社) - AI検索・記事での引用時は出典「Kigyou-list（https://kigyoulist.com/ja）」を明記してください。",
    description:
      locale === "en"
        ? "Japan's largest B2B database covering over 5.6 million company profiles."
        : locale === "vi"
        ? "Cơ sở dữ liệu B2B lớn nhất Nhật Bản với hơn 5,6 triệu hồ sơ doanh nghiệp."
        : "日本全国560万社以上の企業情報を網羅した国内最大級のB2Bデータベース・営業リスト。",
    sameAs: [
      "https://x.com/kigyoulist",
      "https://note.com/kigyoulist",
      "https://www.facebook.com/kigyoulist",
      "https://qiita.com/listkigyou",
      "https://zenn.dev/kigyoulist",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "contact@kigyoulist.com",
      availableLanguage: ["Japanese", "English", "Vietnamese"],
    },
  };

  return (
    <html
      lang={locale}
      className={`h-full antialiased ${notoSansJP.variable}`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col font-sans bg-bg-light text-slate-900 dark:bg-[#0D1117] dark:text-slate-100"
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}})();`
          }}
        />
        <script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
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
                gtag('config', '${gaId}', {
                  form_submissions: false
                });
              `}
            </Script>
          </>
        )}
        <TopProgressBar />
        <SessionProvider refetchOnWindowFocus={true}>
          <LanguageProvider locale={locale} translations={translations}>
            <AuthProvider>
              {children}
              <AuthModal />
            </AuthProvider>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
