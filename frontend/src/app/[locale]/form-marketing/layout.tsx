import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const isVi = locale === "vi";

  let title = "問い合わせフォーム送信代行サービス | 500万社DB連携の自動フォーム営業 | Kigyou-list";
  let description = "テレアポや迷惑メールを完全回避。500万社データベースからターゲット企業を抽出し、事前法令・NGワード審査付きで問い合わせフォームへ自動アプローチ。1通16.1円〜の業界最安値水準で新規商談を獲得。";
  let keywords = ["フォーム営業", "問い合わせフォーム代行", "フォームマーケティング", "新規開拓", "B2B営業", "営業リスト"];
  let ogLocale = "ja_JP";

  if (isEn) {
    title = "Automated Contact Form Marketing & Outreach in Japan | Kigyou-list";
    description = "Bypass spam filters and gatekeepers in Japan. Filter prospects from our 5M+ company database and automate compliant B2B contact form outreach starting at 16.1 JPY per submission.";
    keywords = ["form marketing japan", "b2b outreach japan", "contact form automation", "sales prospecting japan", "lead generation"];
    ogLocale = "en_US";
  } else if (isVi) {
    title = "Dịch Vụ Tự Động Gửi Form Liên Hệ Doanh Nghiệp Nhật Bản | Kigyou-list";
    description = "Tiếp cận trực tiếp lãnh đạo doanh nghiệp Nhật Bản qua form liên hệ website. Lọc khách hàng mục tiêu từ 5 triệu doanh nghiệp, kiểm duyệt nội dung Tokushoho chuẩn pháp lý, chi phí từ 16.1 JPY/lượt gửi thành công.";
    keywords = ["gửi form tự động", "form marketing nhật bản", "tiếp cận b2b nhật bản", "tìm kiếm khách hàng nhật", "danh sách doanh nghiệp nhật bản"];
    ogLocale = "vi_VN";
  }

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `/${locale}/form-marketing`,
      languages: {
        ja: "/ja/form-marketing",
        en: "/en/form-marketing",
        vi: "/vi/form-marketing",
        "x-default": "/ja/form-marketing",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/form-marketing`,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Kigyou-list Form Marketing",
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

export default async function FormMarketingLayout({
  children,
  params,
}: Readonly<LayoutProps>) {
  const { locale } = await params;

  // Schema Service
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "B2B Contact Form Outreach Service",
    "name": locale === 'en' ? "Automated Contact Form Marketing" : locale === 'vi' ? "Dịch vụ gửi Form Marketing tự động" : "問い合わせフォーム送信代行",
    "provider": {
      "@type": "Organization",
      "name": "Kigyou-list",
      "url": "https://kigyoulist.com"
    },
    "description": "500万社データベースから抽出した見込み顧客の問い合わせフォームへ営業文面を自動配信するB2B新規開拓代行プラットフォーム。",
    "areaServed": "JP",
    "offers": {
      "@type": "Offer",
      "price": "16.1",
      "priceCurrency": "JPY",
      "description": "従量課金 / 送信成功1件あたり¥16.1〜"
    }
  };

  // Schema FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "フォーム送信は特定商取引法や迷惑メール防止法に違反しませんか？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "本サービスは電子メール法ではなくWebフォーム送信に関する判例およびガイドラインに準拠しています。文面末尾への配信停止リンク（オプトアウト）の自動挿入および運営スタッフによる事前法令・NGワード審査により、高いコンプライアンスを維持して運用いただけます。"
        }
      },
      {
        "@type": "Question",
        "name": "送信完了のカウント基準はどうなっていますか？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "配信エンジンがフォーム送信後の完了画面（サンクスページ）への遷移または「送信完了」メッセージを検知した件数のみを『送信成功』として課金対象にカウントします。エラーやCAPTCHAで失敗した場合は課金されません。"
        }
      },
      {
        "@type": "Question",
        "name": "自社で保有している企業リストを持ち込んで配信できますか？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "はい、Enterpriseプランまたは大口案件にて自社保有のCSVリストを持ち込んでの配信代行にも対応しております。お問い合わせ窓口よりご相談ください。"
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
