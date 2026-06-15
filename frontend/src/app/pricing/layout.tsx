import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "料金プラン - B2B企業データベース・営業リスト | Kigyou-list",
  description: "Kigyou-listの料金プラン一覧です。業界最安値の月額プランから、営業リストのダウンロード上限数に応じた買い切り追加パッケージ、無料プランまで、ビジネスの規模や目的に合わせてお選びいただけます。",
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
