import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { CookieBanner } from "@/components/CookieBanner";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kigyoulist.com"),
  title: "Kigyou-list | 500万社の日本企業データベース・営業リスト",
  description: "日本全国500万社以上の企業情報を網羅した国内最大級 of B2Bデータベース。業界最安値の料金、JSIC産業分類や都道府県、資本金、従業員数による高度な絞り込みに加え、採用・助成金・入札などの最新 of 営業意欲（インテント）シグナルをご活用いただけます。",
  keywords: ["企業リスト", "営業リスト", "企業データベース", "求人活動", "助成金", "補助金", "入札調達"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kigyou-list | 500万社の日本企業データベース・営業リスト",
    description: "日本全国500万社以上の B2B 企業情報を網羅した国内最大級 of 営業リスト・企業データベース。採用活動、助成金受給、入札結果などの購買インテントシグナルから最適なターゲット企業を特定します。",
    url: "https://kigyoulist.com",
    siteName: "Kigyou-list",
    locale: "ja_JP",
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
    title: "Kigyou-list | 500万社の日本企業データベース・営業リスト",
    description: "日本全国500万社以上の B2B 企業情報を網羅した国内最大級 of 営業リスト・企業データベース。",
    images: ["/icon.svg"],
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html
      lang="ja"
      className={`h-full antialiased ${notoSansJP.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans bg-bg-light text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
        <SessionProvider session={session}>
          <AuthProvider>
            {children}
            <AuthModal />
            <CookieBanner />
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
