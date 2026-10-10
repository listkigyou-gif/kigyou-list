import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en";
  const isVi = locale === "vi";

  let title = "料金プラン - B2B企業データベース・営業リスト | Kigyou-list";
  let description = "Kigyou-listの料金プラン一覧です。業界最安値の月額プランから、営業リストのダウンロード上限数に応じた買い切り追加パッケージ、無料プランまで、ビジネスの規模や目的に合わせてお選びいただけます。";
  let ogLocale = "ja_JP";

  if (isEn) {
    title = "Pricing Plans - B2B Company Database & Sales List | Kigyou-list";
    description = "Kigyou-list pricing plans. Choose from our low-cost monthly plans, single-purchase additional packages, or start for free depending on your sales goals.";
    ogLocale = "en_US";
  } else if (isVi) {
    title = "Bảng Giá Dịch Vụ - Cơ Sở Dữ Liệu Doanh Nghiệp B2B | Kigyou-list";
    description = "Bảng giá dịch vụ tra cứu và tải dữ liệu doanh nghiệp Kigyou-list. Đa dạng gói cước từ dùng thử miễn phí, gói tháng giá tốt nhất thị trường đến gói tải thêm linh hoạt.";
    ogLocale = "vi_VN";
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: {
        ja: "/ja/pricing",
        en: "/en/pricing",
        vi: "/vi/pricing",
        "x-default": "/ja/pricing",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/pricing`,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Kigyou-list Pricing Plans",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

import { getTranslations } from "@/lib/i18n";

export default async function PricingLayout({
  children,
  params,
}: Readonly<LayoutProps>) {
  const { locale } = await params;
  const t = getTranslations(locale);

  // Product Schema with Offers
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Kigyou-list B2B Database & Sales List",
    "image": "https://kigyoulist.com/og-image.png",
    "description": "日本全国500万社以上の企業情報を網羅した国内最大級のB2Bデータベース・営業リスト",
    "brand": {
      "@type": "Brand",
      "name": "Kigyou-list"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "JPY",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Pro Monthly Plan",
        "price": "4980",
        "priceCurrency": "JPY",
        "availability": "https://schema.org/InStock",
        "priceValidUntil": "2027-12-31"
      }
    ]
  };

  // FAQPage Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": t.pricing.faqQ1,
        "acceptedAnswer": { "@type": "Answer", "text": t.pricing.faqA1 }
      },
      {
        "@type": "Question",
        "name": t.pricing.faqQ2,
        "acceptedAnswer": { "@type": "Answer", "text": t.pricing.faqA2 }
      },
      {
        "@type": "Question",
        "name": t.pricing.faqQ3,
        "acceptedAnswer": { "@type": "Answer", "text": t.pricing.faqA3 }
      },
      {
        "@type": "Question",
        "name": t.pricing.faqQ4,
        "acceptedAnswer": { "@type": "Answer", "text": t.pricing.faqA4 }
      },
      {
        "@type": "Question",
        "name": t.pricing.faqQ5,
        "acceptedAnswer": { "@type": "Answer", "text": t.pricing.faqA5 }
      },
      {
        "@type": "Question",
        "name": t.pricing.faqQ6,
        "acceptedAnswer": { "@type": "Answer", "text": t.pricing.faqA6 }
      },
      {
        "@type": "Question",
        "name": t.pricing.faqQ7,
        "acceptedAnswer": { "@type": "Answer", "text": t.pricing.faqA7 }
      },
      {
        "@type": "Question",
        "name": t.pricing.faqQ8,
        "acceptedAnswer": { "@type": "Answer", "text": t.pricing.faqA8 }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
