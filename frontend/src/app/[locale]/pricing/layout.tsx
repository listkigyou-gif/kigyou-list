import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title =
    locale === "en"
      ? "Pricing & Corporate Data Plans (From ¥4,980/mo) | Kigyou-list"
      : locale === "vi"
      ? "Bảng giá & Gói dữ liệu doanh nghiệp Nhật Bản (Từ 4.980 Yên/tháng) | Kigyou-list"
      : "料金プラン・法人リストCSVダウンロード（月額4,980円〜業界最安値水準） | Kigyou-list";

  const description =
    locale === "en"
      ? "Transparent B2B database pricing starting at ¥4,980/month. Access 5.6M+ Japanese company profiles, CSV exports, and automated contact form outreach."
      : locale === "vi"
      ? "Bảng giá minh bạch chỉ từ 4.980 Yên/tháng. Tải danh sách CSV hơn 5,6 triệu doanh nghiệp Nhật Bản kèm số điện thoại, tài chính và tín hiệu tuyển dụng."
      : "初期費用0円・月額4,980円（税込）から全国560万社以上の企業リスト作成・CSV一括出力が可能。無料プランから始められる業界最安値水準のB2B営業データベース料金表。";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: {
        ja: "/ja/pricing",
        "x-default": "/ja/pricing",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/pricing`,
    },
  };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
