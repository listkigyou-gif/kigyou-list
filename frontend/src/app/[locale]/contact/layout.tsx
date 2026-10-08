import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';

  let title = "お問い合わせ・各種法人ご相談 | Kigyou-list (企業リスト)";
  let description = "日本全国500万社データベース「Kigyou-list」の公式お問い合わせ窓口。完全自動フォーム営業のご相談・文面添削、法人API連携・データ一括購入、自社情報の公式オーナー認証・非公開申請、請求書払いなどお気軽にご相談ください。";
  let ogLocale = "ja_JP";

  if (locale === 'en') {
    title = "Contact & B2B Inquiry | Kigyou-list";
    description = "Official contact desk for Kigyou-list. Consult about automated form marketing outreach, 5M+ company database API feeds, corporate ownership claims, custom CSV exports, and enterprise billing.";
    ogLocale = "en_US";
  } else if (locale === 'vi') {
    title = "Liên hệ & Hỗ trợ Doanh nghiệp | Kigyou-list";
    description = "Trung tâm liên hệ chính thức của Kigyou-list. Tư vấn chiến dịch gửi form tự động B2B, tích hợp API cơ sở dữ liệu 5 triệu doanh nghiệp, xác thực quyền sở hữu công ty và xuất dữ liệu doanh nghiệp theo yêu cầu.";
    ogLocale = "vi_VN";
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/contact`,
      languages: {
        ja: "/ja/contact",
        en: "/en/contact",
        vi: "/vi/contact",
        "x-default": "/ja/contact",
      }
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/contact`,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
