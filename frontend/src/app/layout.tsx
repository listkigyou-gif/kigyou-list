import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Kigyou-list | 500万社の日本企業データベース・営業リスト",
  description: "日本全国500万社以上の企業情報を網羅した国内最大級 of B2B database. Industry lowest price, advanced filtering by JSIC industry, prefectures, capital, employee counts, plus buying intent signal (hiring, subsidies, bidding).",
  keywords: ["企業リスト", "営業リスト", "企業データベース", "求人活動", "助成金", "補助金", "入札調達"],
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans bg-bg-light text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
        <SessionProvider session={session}>
          <AuthProvider>
            {children}
            <AuthModal />
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
