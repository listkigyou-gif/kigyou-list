import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RankingIndexPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  redirect(`/${locale}/ranking/salary`);
}
