import type { Metadata } from "next";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "日本企業ランキング（平均年収・従業員数・勤続年数） | Kigyou-list",
    alternates: {
      canonical: `/${locale}/ranking/salary`,
    },
  };
}

export default async function RankingIndexPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  redirect(`/${locale}/ranking/salary`);
}
