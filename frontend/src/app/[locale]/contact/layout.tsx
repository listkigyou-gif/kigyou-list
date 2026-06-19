import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';

  if (locale === 'en') {
    return {
      title: "Contact Us & Support | Kigyou-list",
      description: "Contact office for Kigyou-list. If you have any inquiries regarding the service usage, pricing plans, requests to add or update company details, please feel free to reach out to us.",
      alternates: {
        canonical: `/en/contact`,
        languages: {
          ja: "/ja/contact",
          en: "/en/contact",
        }
      },
    };
  } else {
    return {
      title: "お問い合わせ | Kigyou-list",
      description: "Kigyou-listに関するお問い合わせ窓口です。サービスのご利用方法、料金プランに関するご相談、企業データの掲載依頼や修正依頼、その他ご不明な点がございましたらお気軽にお問い合わせください。",
      alternates: {
        canonical: `/ja/contact`,
        languages: {
          ja: "/ja/contact",
          en: "/en/contact",
        }
      },
    };
  }
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
