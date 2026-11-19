import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PressMediaSection } from "@/components/PressMediaSection";
import { ChevronRight, Building2, Mail } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale = "ja" } = await params;
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const title = isEn
    ? "Press Releases & Media Coverage | Kigyou-list"
    : isVi
    ? "Thông cáo báo chí & Truyền thông | Kigyou-list"
    : "プレスリリース・メディア掲載一覧 | Kigyou-list（500万社法人データベース）";

  const description = isEn
    ? "Official press releases, product announcements, and technical publications from TQC Corporation / Kigyou-list."
    : isVi
    ? "Tổng hợp thông cáo báo chí, bài viết truyền thông và công bố kỹ thuật chính thức của TQC Corporation / Kigyou-list."
    : "TQC株式会社が運営する全国500万社法人データベース『Kigyou-list』の公式プレスリリース、調査レポート、メディア掲載情報および技術解説記事の一覧です。";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/press`,
      languages: {
        ja: "/ja/press",
        "x-default": "/ja/press",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/press`,
      siteName: "Kigyou-list",
      locale: isEn ? "en_US" : isVi ? "vi_VN" : "ja_JP",
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function PressPage({ params }: PageProps) {
  const { locale = "ja" } = await params;
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const t = {
    home: isEn ? "Home" : isVi ? "Trang chủ" : "ホーム",
    press: isEn ? "Press & Media" : isVi ? "Báo chí & Truyền thông" : "プレスリリース・メディア掲載",
    title: isEn
      ? "Press Releases & Media Coverage"
      : isVi
      ? "Thông cáo báo chí & Truyền thông"
      : "プレスリリース・メディア掲載",
    subtitle: isEn
      ? "Official announcements, corporate data research, and media coverage of Kigyou-list (operated by TQC Corporation)."
      : isVi
      ? "Các thông cáo báo chí chính thức, báo cáo dữ liệu doanh nghiệp và bài viết chuyên sâu của Kigyou-list (vận hành bởi TQC株式会社)."
      : "TQC株式会社が運営する法人データベース『Kigyou-list』の公式プレスリリース、独自調査レポート、各種メディア掲載および技術公開記事を掲載しています。",
    operatorLabel: isEn
      ? "Operated by TQC Corporation"
      : isVi
      ? "Đơn vị vận hành: TQC株式会社"
      : "運営会社：TQC株式会社",
    tokushohoLink: isEn
      ? "Corporate & Legal Information"
      : isVi
      ? "Thông tin pháp lý công ty"
      : "運営会社・特定商取引法に基づく表記",
    inquiryTitle: isEn
      ? "Media & Press Inquiries"
      : isVi
      ? "Liên hệ Báo chí & Truyền thông"
      : "広報・取材に関するお問い合わせ",
    inquiryDesc: isEn
      ? "For press inquiries, data citation requests, or partnership proposals, please reach out via our contact form."
      : isVi
      ? "Mọi yêu cầu phỏng vấn, trích dẫn số liệu hoặc hợp tác truyền thông xin vui lòng liên hệ qua biểu mẫu chính thức."
      : "取材のご依頼、調査データの引用に関するお問い合わせ、業務提携のご相談は下記窓口よりご連絡ください。",
    contactBtn: isEn ? "Contact Press Desk" : isVi ? "Liên hệ truyền thông" : "広報窓口へ問い合わせる",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t.title,
    description: t.subtitle,
    url: `https://kigyoulist.com/${locale}/press`,
    publisher: {
      "@type": "Organization",
      name: "TQC株式会社 (Kigyou-list)",
      url: "https://kigyoulist.com/ja",
      sameAs: [
        "https://note.com/kigyoulist",
        "https://www.wantedly.com/companies/company_2368826",
        "https://www.itreview.jp/products/kigyou-list",
        "https://qiita.com/listkigyou",
        "https://x.com/kigyoulist",
        "https://www.facebook.com/kigyoulist",
      ],
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
            {t.home}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
            {t.press}
          </span>
        </nav>

        {/* Page Header Card */}
        <header className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-5 sm:p-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F0F4F9] text-[#1B4F8A] border border-[#1B4F8A]/15 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50">
              <Building2 className="w-3.5 h-3.5" />
              <span>{t.operatorLabel}</span>
            </span>
            <Link
              href={`/${locale}/tokushoho`}
              className="text-xs font-medium text-[#1B4F8A] hover:underline dark:text-blue-400"
            >
              {t.tokushohoLink}
            </Link>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            {t.subtitle}
          </p>
        </header>

        {/* Press & Media List */}
        <PressMediaSection locale={locale} enableFilter />

        {/* Media Inquiry Strip */}
        <section className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t.inquiryTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.inquiryDesc}
            </p>
          </div>
          <Link
            href={`/${locale}/contact`}
            className="h-9 px-4 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2 shrink-0"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{t.contactBtn}</span>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
