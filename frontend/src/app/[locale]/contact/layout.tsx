import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title =
    locale === "en"
      ? "Contact Us & Corporate Data Correction Request | Kigyou-list"
      : locale === "vi"
      ? "Liên hệ & Yêu cầu cập nhật thông tin doanh nghiệp | Kigyou-list"
      : "お問い合わせ・掲載企業情報の修正・削除申請窓口 | Kigyou-list";

  const description =
    locale === "en"
      ? "Contact TQC Corporation regarding Kigyou-list enterprise plans, API partnerships, or official corporate profile updates and opt-out requests."
      : locale === "vi"
      ? "Liên hệ với đội ngũ vận hành Kigyou-list (TQC株式会社) về gói dữ liệu B2B, tích hợp API hoặc yêu cầu chỉnh sửa thông tin hồ sơ doanh nghiệp."
      : "Kigyou-list（運営：TQC株式会社）へのお問い合わせ、法人プラン・API連携のご相談、および掲載されている企業情報の修正・更新・非表示申請はこちらから承ります。";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/contact`,
      languages: {
        ja: "/ja/contact",
        "x-default": "/ja/contact",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/contact`,
    },
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
