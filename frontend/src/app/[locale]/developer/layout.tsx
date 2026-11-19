import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title =
    locale === "en"
      ? "Developer API & MCP Server Documentation | Kigyou-list"
      : locale === "vi"
      ? "Tài liệu tích hợp API & MCP Server dữ liệu doanh nghiệp Nhật Bản | Kigyou-list"
      : "開発者向け企業データAPI・MCPサーバー連携ドキュメント | Kigyou-list";

  const description =
    locale === "en"
      ? "Integrate 5.6M+ Japanese corporate profiles, NTA tax IDs, EDINET financials, and sales signals into your CRM or AI Agent via Kigyou-list REST API & MCP."
      : locale === "vi"
      ? "Tích hợp dữ liệu hơn 5,6 triệu pháp nhân Nhật Bản, báo cáo tài chính EDINET và tín hiệu B2B vào CRM hoặc AI Agent qua REST API của Kigyou-list."
      : "全国560万社の法人番号・インボイス・財務決算・営業シグナルをCRM・SFAやAIエージェント（MCP）へリアルタイム連携できるKigyou-list公式APIリファレンス。";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/developer`,
      languages: {
        ja: "/ja/developer",
        "x-default": "/ja/developer",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/developer`,
    },
  };
}

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
