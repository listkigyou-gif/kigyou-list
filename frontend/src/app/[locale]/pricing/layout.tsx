import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en";

  return {
    title: isEn ? "Pricing Plans - B2B Company Database & Sales List | Kigyou-list" : "料金プラン - B2B企業データベース・営業リスト | Kigyou-list",
    description: isEn 
      ? "Kigyou-list pricing plans. Choose from our low-cost monthly plans, single-purchase additional packages, or start for free depending on your sales goals."
      : "Kigyou-listの料金プラン一覧です。業界最安値の月額プランから、営業リストのダウンロード上限数に応じた買い切り追加パッケージ、無料プランまで、ビジネスの規模や目的に合わせてお選びいただけます。",
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: {
        ja: "/ja/pricing",
        en: "/en/pricing",
      }
    }
  };
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
