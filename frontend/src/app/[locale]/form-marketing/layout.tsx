import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title =
    locale === "en"
      ? "Automated B2B Contact Form Outreach Service in Japan | Kigyou-list"
      : locale === "vi"
      ? "Dịch vụ gửi Form tiếp thị B2B tự động tại Nhật Bản | Kigyou-list"
      : "お問い合わせフォーム営業代行・自動送信サービス（1件6.9円〜） | Kigyou-list";

  const description =
    locale === "en"
      ? "Compliant B2B contact form outreach across Japan with automatic NG-word filtering and opt-out management."
      : locale === "vi"
      ? "Giải pháp tiếp cận khách hàng B2B qua biểu mẫu liên hệ tại Nhật Bản với bộ lọc từ khóa tuân thủ pháp lý tự động."
      : "営業禁止文言の自動除外・配信停止（オプトアウト）管理に完全対応したコンプライアンス重視のお問い合わせフォーム営業支援サービス。";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/form-marketing`,
      languages: {
        ja: "/ja/form-marketing",
        "x-default": "/ja/form-marketing",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/form-marketing`,
    },
  };
}

export default function FormMarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
