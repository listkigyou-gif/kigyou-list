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
          vi: "/vi/contact",
        }
      },
    };
  } else if (locale === 'vi') {
    return {
      title: "Liên hệ & Hỗ trợ | Kigyou-list",
      description: "Trang liên hệ chính thức của Kigyou-list. Nếu bạn có bất kỳ câu hỏi nào về cách sử dụng dịch vụ, gói cước, hoặc yêu cầu cập nhật/ẩn thông tin doanh nghiệp, vui lòng gửi yêu cầu cho chúng tôi.",
      alternates: {
        canonical: `/vi/contact`,
        languages: {
          ja: "/ja/contact",
          en: "/en/contact",
          vi: "/vi/contact",
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
          vi: "/vi/contact",
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
