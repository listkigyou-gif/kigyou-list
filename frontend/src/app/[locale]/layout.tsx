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
  const isEn = locale === "en";

  return {
    metadataBase: new URL("https://kigyoulist.com"),
    title: isEn
      ? "Kigyou-list | Over 5M Japanese Companies Database & Sales List"
      : "Kigyou-list | 500万社の日本企業データベース・営業リスト",
    description: isEn
      ? "Japan's largest B2B database covering over 5 million company profiles. Benefit from advanced filtering by JSIC industries, prefectures, capital, and active sales intent signals."
      : "日本全国500万社以上の企業情報を網羅した国内最大級 of B2Bデータベース。業界最安値の料金、JSIC産業分類や都道府県、資本金、従業員数による高度な絞り込みに加え、採用・助成金・入札などの最新 of 営業意欲（インテント）シグナルをご活用いただけます。",
    keywords: isEn
      ? ["corporate database", "sales list", "b2b database", "job hiring list", "subsidies list"]
      : ["企業リスト", "営業リスト", "企業データベース", "求人活動", "助成金", "補助金", "入札調達"],
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ja: "/ja",
        en: "/en",
      },
    },
    openGraph: {
      title: isEn
        ? "Kigyou-list | Over 5M Japanese Companies Database & Sales List"
        : "Kigyou-list | 500万社の日本企業データベース・営業リスト",
      description: isEn
        ? "Japan's largest B2B database covering over 5 million company profiles. Benefit from advanced filtering by JSIC industries, prefectures, capital, and active sales intent signals."
        : "日本全国500万社以上の B2B 企業情報を網羅した国内最大級 of 営業リスト・企業データベース。採用活動、助成金受給、入札結果などの購買インテントシグナルから最適なターゲット企業を特定します。",
      url: `https://kigyoulist.com/${locale}`,
      siteName: "Kigyou-list",
      locale: isEn ? "en_US" : "ja_JP",
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
      title: isEn
        ? "Kigyou-list | Over 5M Japanese Companies Database & Sales List"
        : "Kigyou-list | 500万社の日本企業データベース・営業リスト",
      description: isEn
        ? "Japan's largest B2B database covering over 5 million company profiles."
        : "日本全国500万社以上の B2B 企業情報を網羅した国内最大級 of 営業リスト・企業データベース。",
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

  return (
    <html
      lang={locale}
      className={`h-full antialiased ${notoSansJP.variable}`}
    >
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
