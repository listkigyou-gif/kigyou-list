import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  ShieldCheck, 
  ChevronRight, 
  AlertCircle, 
  Lock, 
  Database, 
  Send, 
  FileText, 
  Building2, 
  Mail, 
  Phone, 
  CheckCircle2, 
  ExternalLink,
  Scale,
  Sparkles,
  ArrowRight,
  UserCheck,
  EyeOff,
  Server
} from "lucide-react";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const pageTitle = isEn
    ? "Privacy Policy & Data Protection | Kigyou-list"
    : isVi
    ? "Chính Sách Bảo Mật & Bảo Vệ Dữ Liệu | Kigyou-list"
    : "プライバシーポリシー（個人情報保護方針） | Kigyou-list（500万社企業データベース・自動フォーム営業）";

  const pageDesc = isEn
    ? "Official Privacy Policy of Kigyou-list. Learn about our compliance with Japan's Act on the Protection of Personal Information (APPI), automated form outreach safeguards, public data processing, and instant opt-out procedures."
    : isVi
    ? "Chính sách bảo vệ thông tin cá nhân và dữ liệu doanh nghiệp của Kigyou-list. Tuân thủ Luật Bảo vệ Thông tin Cá nhân Nhật Bản (APPI), quy định gửi form tự động, xử lý dữ liệu mở công khai và quy trình ẩn/xóa thông tin (Opt-out)."
    : "Kigyou-list（企業リスト）のプライバシーポリシーです。個人情報の保護に関する法律（個人情報保護法）および特定電子メール法に準拠した情報管理体制、公的オープンデータの適正利用、フォーム営業の配信拒否、自社情報のオプトアウト（非公開申請）手続きについて定めています。";

  const ogLocale = isEn ? "en_US" : isVi ? "vi_VN" : "ja_JP";

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: {
        ja: "/ja/privacy",
        en: "/en/privacy",
        vi: "/vi/privacy",
        "x-default": "/ja/privacy",
      }
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `https://kigyoulist.com/${locale}/privacy`,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      images: ["/og-image.png"],
    },
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';
  const isJa = locale === 'ja';
  const isVi = locale === 'vi';
  const isEn = locale === 'en';

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": isJa ? "ホーム" : isVi ? "Trang chủ" : "Home",
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": isJa ? "プライバシーポリシー" : isVi ? "Chính sách bảo mật" : "Privacy Policy",
        "item": `https://kigyoulist.com/${locale}/privacy`
      }
    ]
  };

  // Navigation Sitemap Items
  const menuSections = isJa ? [
    { id: "sec1", title: "第1条 基本方針および適用範囲" },
    { id: "sec2", title: "第2条 取得する情報および取得方法" },
    { id: "sec3", title: "第3条 情報の利用目的" },
    { id: "sec4", title: "第4条 安全管理措置（セキュリティ）" },
    { id: "sec5", title: "第5条 第三者提供および委託" },
    { id: "sec6", title: "第6条 オプトアウト・掲載非公開の手続き" },
    { id: "sec7", title: "第7条 フォーム営業における配信停止体制" },
    { id: "sec8", title: "第8条 保有個人データの開示・訂正・利用停止" },
    { id: "sec9", title: "第9条 Cookieおよび外部送信規律" },
    { id: "sec10", title: "第10条 個人情報取扱事業者および窓口" },
  ] : isVi ? [
    { id: "sec1", title: "Điều 1: Nguyên tắc cơ bản & Phạm vi" },
    { id: "sec2", title: "Điều 2: Thông tin thu thập & Phương thức" },
    { id: "sec3", title: "Điều 3: Mục đích sử dụng thông tin" },
    { id: "sec4", title: "Điều 4: Biện pháp quản lý an toàn" },
    { id: "sec5", title: "Điều 5: Cung cấp bên thứ ba & Ủy thác" },
    { id: "sec6", title: "Điều 6: Thủ tục Opt-out & Ẩn thông tin" },
    { id: "sec7", title: "Điều 7: Cơ chế từ chối nhận Form marketing" },
    { id: "sec8", title: "Điều 8: Quyền yêu cầu công khai/chỉnh sửa" },
    { id: "sec9", title: "Điều 9: Quy định Cookie & Truyền dữ liệu" },
    { id: "sec10", title: "Điều 10: Đơn vị quản lý & Cổng liên hệ" },
  ] : [
    { id: "sec1", title: "Art. 1 Basic Policy & Scope" },
    { id: "sec2", title: "Art. 2 Information Collected & Methods" },
    { id: "sec3", title: "Art. 3 Purpose of Information Use" },
    { id: "sec4", title: "Art. 4 Security Control Measures" },
    { id: "sec5", title: "Art. 5 Third-Party Provision & Delegation" },
    { id: "sec6", title: "Art. 6 Opt-Out & Listing Removal" },
    { id: "sec7", title: "Art. 7 Form Marketing Compliance & Unsubscribe" },
    { id: "sec8", title: "Art. 8 Disclosure, Correction & Cease of Use" },
    { id: "sec9", title: "Art. 9 Cookies & External Transmission" },
    { id: "sec10", title: "Art. 10 Data Handler & Contact Office" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 font-sans antialiased selection:bg-[#1B4F8A]/15 selection:text-[#1B4F8A]">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />

      <main className="flex-1">
        {/* ========================================================
            1. HERO SECTION (Synchronized with Homepage /ja)
            ======================================================== */}
        <section className="relative overflow-hidden pt-12 pb-14 lg:pt-16 lg:pb-18 bg-white dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          {/* Subtle grid pattern background matching /ja */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#161b22_1px,transparent_1px),linear-gradient(to_bottom,#161b22_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 relative text-center">
            {/* Kicker Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold mb-5 tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#1B4F8A] dark:bg-blue-400 animate-pulse" />
              <span>
                {isJa 
                  ? "個人情報保護法・特定電子メール法準拠 / 法令遵守宣言" 
                  : isVi 
                  ? "Tuân Thủ Luật Bảo Vệ Thông Tin Cá Nhân & Đạo Luật Chống Thư Rác Nhật Bản" 
                  : "Compliance with Japan APPI & Act on Regulation of Specified Electronic Mail"}
              </span>
            </div>

            {/* H1 Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.25] text-slate-900 dark:text-white mb-5">
              {isJa ? (
                <>
                  プライバシーポリシー<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">（個人情報保護方針）</span>
                </>
              ) : isVi ? (
                <>
                  Chính Sách Bảo Mật<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">（Bảo Vệ Dữ Liệu Cá Nhân & Doanh Nghiệp）</span>
                </>
              ) : (
                <>
                  Privacy Policy<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">& Corporate Data Protection Policy</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
              {isJa
                ? "TQC株式会社（以下「当社」）は、日本全国500万社企業データベースおよびセルフ型フォーム営業プラットフォーム「Kigyou-list」の運営にあたり、個人情報の適正な取り扱い、公的オープンデータの適法利用、およびオプトアウト権の尊重を徹底いたします。"
                : isVi
                ? "Công ty Cổ phần TQC (TQC Corporation) cam kết tuân thủ nghiêm ngặt Luật Bảo vệ Thông tin Cá nhân Nhật Bản trong quá trình vận hành nền tảng cơ sở dữ liệu 5 triệu doanh nghiệp và dịch vụ gửi Form marketing tự động Kigyou-list."
                : "TQC Corporation defines this Privacy Policy for Kigyou-list, adhering strictly to Japan's Act on the Protection of Personal Information, public open data regulations, and transparent opt-out rights."}
            </p>

            {/* Date Badge */}
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>
                {isJa 
                  ? "最終改定日: 2026年10月8日（制定日: 2025年4月1日）" 
                  : isVi 
                  ? "Cập nhật lần cuối: 08/10/2026 (Ban hành: 01/04/2025)" 
                  : "Last Revised: October 8, 2026 (Enacted: April 1, 2025)"}
              </span>
            </div>

            {/* 4 Compliance Badges Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mt-8 pt-6 border-t border-slate-150 dark:border-slate-800 text-left">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 dark:bg-[#161B22]/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  {isJa ? "個人情報保護法準拠" : "APPI Compliant"}
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 dark:bg-[#161B22]/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <Lock className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  {isJa ? "256-bit SSL暗号化" : "256-bit SSL Encrypted"}
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 dark:bg-[#161B22]/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  {isJa ? "特定電子メール法対応" : "Opt-out Safeguards"}
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 dark:bg-[#161B22]/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  {isJa ? "即時非公開（除外）対応" : "Instant Delist Available"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            2. MAIN CONTENT WITH DESKTOP STICKY SIDEBAR
            ======================================================== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          
          {/* Breadcrumb Navigation */}
          <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mb-6" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-[#1B4F8A] transition-colors">
              {isJa ? "ホーム" : isVi ? "Trang chủ" : "Home"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200" aria-current="page">
              {isJa ? "プライバシーポリシー" : isVi ? "Chính sách bảo mật" : "Privacy Policy"}
            </span>
          </nav>

          {/* Official Language Disclaimer for EN and VI */}
          {!isJa && (
            <div className="bg-amber-50 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3 mb-8 shadow-2xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-extrabold text-[11px] uppercase tracking-wider block mb-1">
                  {isVi ? "Thông Báo Hiệu Lực Pháp Lý Ngôn Ngữ" : "Official Language Disclaimer"}
                </span>
                <p className="leading-relaxed">
                  {isVi 
                    ? "Đây là bản dịch tham khảo của Chính sách bảo mật tiếng Nhật gốc. Trong trường hợp có bất kỳ sự khác biệt hoặc mâu thuẫn nào giữa bản dịch và bản tiếng Nhật, bản tiếng Nhật gốc sẽ là văn bản có giá trị pháp lý cao nhất và có hiệu lực ràng buộc." 
                    : "This document is a reference translation of the official Japanese Privacy Policy. In the event of any discrepancies or ambiguities between this translation and the Japanese original, the Japanese version shall prevail and govern."}
                </p>
              </div>
            </div>
          )}

          {/* Fast Action Opt-Out Callout Box */}
          <div className="mb-10 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-blue-50/50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-blue-950/20 border-2 border-emerald-300 dark:border-emerald-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isJa ? "企業関係者様・掲載取り下げ窓口" : isVi ? "Dành cho chủ doanh nghiệp: Yêu cầu ẩn thông tin" : "Corporate Delisting Desk"}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {isJa ? "自社情報の非公開（オプトアウト）または掲載内容の更新をご希望の方へ" : isVi ? "Yêu cầu ẩn thông tin doanh nghiệp (Opt-out) hoặc cập nhật hồ sơ chính chủ" : "Request Listing Removal (Opt-Out) or Update Corporate Profile"}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isJa 
                  ? "Kigyou-Listでは、掲載企業のプライバシーおよび自己情報コントロール権を尊重し、法人番号（13桁）による公式オーナー認証を経て、即時〜速やかに検索結果からの除外（非公開化）やフォーム営業配信除外を承っております。" 
                  : isVi 
                  ? "Chúng tôi tôn trọng quyền kiểm soát thông tin của doanh nghiệp. Bạn có thể sử dụng mã số pháp nhân 13 số để xác thực chính chủ và yêu cầu ẩn thông tin khỏi cơ sở dữ liệu ngay lập tức." 
                  : "We honor your right to information control. Verified corporate owners can delist from public search results or request exclusion from form outreach via our dedicated portal."}
              </p>
            </div>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer active:scale-98"
            >
              <EyeOff className="w-4 h-4" />
              <span>{isJa ? "非公開・オプトアウト申請はこちら →" : isVi ? "Gửi yêu cầu ẩn thông tin →" : "Request Delisting Here →"}</span>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Desktop Sticky Table of Contents Sidebar */}
            <aside className="w-full md:w-64 shrink-0 bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl p-4 shadow-2xs md:sticky md:top-24">
              <div className="flex items-center gap-2 px-2 pb-3 mb-2 border-b border-slate-150 dark:border-slate-800">
                <FileText className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <h2 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {isJa ? "目次 (SITEMAP)" : "Table of Contents"}
                </h2>
              </div>
              <nav className="flex flex-col gap-1">
                {menuSections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-[#1B4F8A] hover:bg-slate-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800/40 transition-colors leading-snug"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>

              <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800 text-[11px] text-slate-400 space-y-1 px-1">
                <div className="font-bold text-slate-600 dark:text-slate-300">
                  {isJa ? "運営: TQC株式会社" : "TQC Corporation"}
                </div>
                <div>適格請求書: T4013301048678</div>
              </div>
            </aside>

            {/* Right Main Legal Articles Sheet */}
            <div className="flex-1 bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm space-y-10">
              
              {/* Introduction Header */}
              <div className="border-b border-slate-150 dark:border-slate-800 pb-6">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  {isJa 
                    ? "Kigyou-list 個人情報保護方針（プライバシーポリシー）" 
                    : isVi 
                    ? "Chính sách Bảo vệ Thông tin Cá nhân & Dữ liệu Kigyou-list" 
                    : "Kigyou-list Personal Information Protection Policy"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                  {isJa ? (
                    <>
                      TQC株式会社（以下「当社」といいます）は、日本全国500万社の法人データベース、営業リスト作成、API提供、および完全自動フォーム営業プラットフォーム「Kigyou-list」（以下「本サービス」といいます）の運営にあたり、ユーザーおよび掲載企業の個人情報ならびに法人データの重要性を深く認識し、個人情報の保護に関する法律（平成15年法律第57号、以下「個人情報保護法」といいます）、特定電子メールの送信の適正化等に関する法律（平成14年法律第26号、以下「特定電子メール法」といいます）、電気通信事業法その他の関係法令および個人情報保護委員会の各種ガイドラインを遵守し、以下の通りプライバシーポリシー（以下「本ポリシー」といいます）を定めて適正な取り扱いと保護に努めます。
                    </>
                  ) : isVi ? (
                    <>
                      Công ty Cổ phần TQC (sau đây gọi là &quot;Công ty&quot;) trong quá trình cung cấp dịch vụ cơ sở dữ liệu 5 triệu doanh nghiệp, tạo danh sách khách hàng tiềm năng, cung cấp API và nền tảng gửi Form tự động Kigyou-list (sau đây gọi là &quot;Dịch vụ&quot;), cam kết tuân thủ đầy đủ Luật Bảo vệ Thông tin Cá nhân Nhật Bản (APPI), Luật Điều tiết Email Điện tử Đặc định và các quy chuẩn pháp lý hiện hành, bảo vệ tối đa quyền riêng tư và quyền bảo mật dữ liệu của người dùng và các doanh nghiệp liên quan.
                    </>
                  ) : (
                    <>
                      TQC Corporation (hereinafter referred to as the &quot;Company&quot;) operates &quot;Kigyou-list&quot; (5M+ corporate database, sales targeting, API feeds, and automated form marketing). We are committed to handling personal data and business information responsibly in strict accordance with Japan&apos;s Act on the Protection of Personal Information (APPI), the Act on Regulation of Transmission of Specified Electronic Mail, the Telecommunications Business Act, and guidelines issued by the Personal Information Protection Commission (PPC).
                    </>
                  )}
                </p>
              </div>

              {/* ARTICLE 1 */}
              <div id="sec1" className="space-y-3 pt-2 scroll-mt-24">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                  <Scale className="w-4 h-4" />
                  <span>{isJa ? "第1条（基本方針および適用範囲）" : isVi ? "Điều 1: Nguyên tắc cơ bản & Phạm vi áp dụng" : "Article 1 (Basic Policy & Scope)"}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isJa ? "1. 基本方針および本ポリシーの適用範囲" : "1. Basic Policy and Scope"}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                  <p>
                    {isJa 
                      ? "1. 当社は、個人情報の保護に関する法令、国が定める指針その他の規範を遵守し、公正かつ適法な手段によって個人情報および法人データを取得、利用、管理いたします。" 
                      : "1. The Company complies with all laws, state guidelines, and regulatory standards concerning personal data protection."}
                  </p>
                  <p>
                    {isJa 
                      ? "2. 本ポリシーは、本サービス（ウェブサイト、API、および関連するすべての付帯機能）をご利用になるすべてのユーザー（閲覧者、無料会員、有料会員、および掲載企業の代表者・関係者）に適用されます。" 
                      : "2. This Policy applies to all users (visitors, members, corporate administrators) utilizing any features of the Service."}
                  </p>
                  <p>
                    {isJa 
                      ? "3. 本サービスからリンクされている外部サイト（外部決済サービス、提携企業サイト、掲載企業の公式ホームページ等）における個人情報の取り扱いについては、リンク先各社のプライバシーポリシーが適用され、当社はその責任を負いません。" 
                      : "3. External websites linked from the Service are subject to their own respective privacy policies."}
                  </p>
                </div>
              </div>

              {/* ARTICLE 2 */}
              <div id="sec2" className="space-y-3 pt-4 border-t border-slate-150 dark:border-slate-800 scroll-mt-24">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                  <Database className="w-4 h-4" />
                  <span>{isJa ? "第2条（取得する情報および取得方法）" : isVi ? "Điều 2: Thông tin thu thập & Phương thức thu thập" : "Article 2 (Information Collected & Methods)"}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isJa ? "2. 取得する情報の項目および適法な取得方法" : "2. Items of Information Collected and Lawful Collection Methods"}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
                  <p>
                    {isJa 
                      ? "当社は、本サービスにおいて以下の情報を適法かつ適切な手段によって取得いたします。" 
                      : "The Company lawfully acquires the following categories of information:"}
                  </p>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      {isJa ? "(1) ユーザーが直接提供する情報" : "(1) User-Provided Personal Information"}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {isJa 
                        ? "アカウント登録、有料プラン契約、お問い合わせ、および自社オーナー認証時に提供いただく氏名、貴社名・屋号、所属部署・役職、メールアドレス、電話番号、請求先住所、およびお問い合わせ内容。" 
                        : "Name, organization, title, email, phone number, billing address, and inquiry messages provided during signup or contact."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      {isJa ? "(2) データベースに収録される公的オープンデータおよび公表情報" : "(2) Official Public Data and Open Records in Corporate Database"}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {isJa 
                        ? "国税庁法人番号公表サイト、法務省商業登記オープンデータ、経済産業省gBizINFO、厚生労働省（求人・助成金等シグナル）、特許庁（特許・知財情報）、および各企業が公式ウェブサイト等を通じて公衆に公開している企業属性情報（法人番号、法人名、所在地、代表者氏名、電話番号、FAX番号、公表メールアドレス、問い合わせフォームURL等）。個人の要配慮個人情報や私生活上の秘密に属する情報は一切収録いたしません。" 
                        : "Official NTA corporate registry data, MOJ registry records, METI gBizINFO, public business contact URLs, and public signals. No sensitive private individual data is ever collected."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      {isJa ? "(3) 自動的に生成・記録されるアクセス情報・通信ログ" : "(3) Automated System Logs and Telemetry"}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {isJa 
                        ? "本サービスの利用に伴い自動的に記録されるIPアドレス、ブラウザ種別、アクセス日時、Cookie情報、リファラーURL、および操作ログ（不正アクセス検知およびサービス改善用）。" 
                        : "IP addresses, browser type, timestamp logs, session cookies, and security telemetry."}
                    </p>
                  </div>
                </div>
              </div>

              {/* ARTICLE 3 */}
              <div id="sec3" className="space-y-3 pt-4 border-t border-slate-150 dark:border-slate-800 scroll-mt-24">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                  <Send className="w-4 h-4" />
                  <span>{isJa ? "第3条（情報の利用目的）" : isVi ? "Điều 3: Mục đích sử dụng thông tin" : "Article 3 (Purpose of Information Use)"}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isJa ? "3. 個人情報および法人データの利用目的" : "3. Purpose of Using Personal and Corporate Data"}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                  <p>
                    {isJa 
                      ? "当社は、取得した個人情報および法人データを以下の正当な事業目的にのみ利用し、目的外利用を行いません。" 
                      : "The Company uses personal and corporate information strictly for the following purposes:"}
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2">
                    <li>
                      <strong>{isJa ? "本サービスの提供・運営:" : "Service Provision:"}</strong>{" "}
                      {isJa ? "日本全国500万社データベースの検索、リスト作成、CSVダウンロード、および法人API連携機能の提供。" : "Operating 5M+ company search, CSV export, and API integrations."}
                    </li>
                    <li>
                      <strong>{isJa ? "セルフ型フォーム営業機能の提供:" : "Automated Form Marketing:"}</strong>{" "}
                      {isJa ? "ユーザーによる企業問い合わせフォームへの安全な営業メッセージ配信代行、配信結果レポーティング、および特定電子メール法に基づくオプトアウト（配信停止）リストの厳格な管理。" : "Enabling automated contact form outreach, delivery analytics, and opt-out list management."}
                    </li>
                    <li>
                      <strong>{isJa ? "自社企業情報の公式認証・情報更新:" : "Corporate Claim & Verification:"}</strong>{" "}
                      {isJa ? "企業オーナーによる本人確認（メールOTP認証）、公式認証バッジの付与、PR情報・連絡先の反映、または検索結果からの非公開処理。" : "Verifying company ownership via OTP, granting verified badges, and updating company PR data."}
                    </li>
                    <li>
                      <strong>{isJa ? "料金請求および決済事務:" : "Billing & Invoicing:"}</strong>{" "}
                      {isJa ? "有料プラン（Starter、Pro、Enterprise等）およびフォーム営業チケットの販売、請求書発行、領収書発行、および決済代行会社を通じた決済処理。" : "Processing subscriptions, one-off credit packs, invoices, and payment verification."}
                    </li>
                    <li>
                      <strong>{isJa ? "セキュリティおよび不正防止:" : "Security & Fraud Prevention:"}</strong>{" "}
                      {isJa ? "不正アクセス、スパム送信、スクレイピング荒らし、および利用規約違反行為の検知・防止・調査。" : "Preventing unauthorized access, abusive scraping, and platform misuse."}
                    </li>
                    <li>
                      <strong>{isJa ? "お問い合わせ・サポート対応:" : "Customer Support:"}</strong>{" "}
                      {isJa ? "ユーザーからのお問い合わせ、見積依頼、技術相談、およびシステム障害・メンテナンス等の重要なお知らせの配信。" : "Responding to inquiries, quotations, technical support, and critical service notifications."}
                    </li>
                  </ul>
                </div>
              </div>

              {/* ARTICLE 4 */}
              <div id="sec4" className="space-y-3 pt-4 border-t border-slate-150 dark:border-slate-800 scroll-mt-24">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>{isJa ? "第4条（安全管理措置）" : isVi ? "Điều 4: Biện pháp quản lý an toàn thông tin" : "Article 4 (Security Control Measures)"}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isJa ? "4. 安全管理措置（セキュリティ体制）" : "4. Security Control Measures"}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                  <p>
                    {isJa 
                      ? "当社は、個人情報および保有データの漏洩、滅失、毀損、または不正アクセスを防止するため、以下の通り組織的・人的・物理的・技術的な安全管理措置を講じております。" 
                      : "The Company enforces strict technical and organizational measures to safeguard all data:"}
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <li>
                      <strong>通信の暗号化:</strong> 全てのウェブ通信およびAPI通信に256-bit SSL/TLSプロトコルを適用。
                    </li>
                    <li>
                      <strong>認証情報の保護:</strong> パスワードの不可逆ソルト付きハッシュ化（bcrypt等）保存。
                    </li>
                    <li>
                      <strong>アクセス権の最小化:</strong> データベースおよびサーバーへのアクセス権限を厳格に限定し、2要素認証（2FA）および操作監査ログを常時記録。
                    </li>
                    <li>
                      <strong>定期バックアップと脆弱性対策:</strong> 定期的なデータベースバックアップの暗号化保管、ファイアウォール（WAF）および定期セキュリティパッチの適用。
                    </li>
                  </ul>
                </div>
              </div>

              {/* ARTICLE 5 */}
              <div id="sec5" className="space-y-3 pt-4 border-t border-slate-150 dark:border-slate-800 scroll-mt-24">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                  <Server className="w-4 h-4" />
                  <span>{isJa ? "第5条（第三者提供および委託）" : isVi ? "Điều 5: Cung cấp bên thứ ba & Ủy thác dịch vụ" : "Article 5 (Third-Party Provision & Delegation)"}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isJa ? "5. 第三者提供の制限および業務委託" : "5. Restrictions on Third-Party Provision and Outsourcing"}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                  <p>
                    {isJa 
                      ? "1. 当社は、個人情報保護法その他の法令により認められる場合を除き、あらかじめご本人の同意を得ることなく、個人情報を第三者に提供いたしません。また、個人情報の不正な売買、譲渡、貸与は一切行いません。" 
                      : "1. The Company does not provide personal information to third parties without prior consent, except as permitted by law."}
                  </p>
                  <p>
                    {isJa 
                      ? "2. 当社は、本サービスの円滑な運営のため、信頼できる外部事業者に業務の一部（クラウドインフラ、オンライン決済処理等）を委託する場合があります。この場合、委託先選定にあたり十分な安全管理基準を満たすことを確認し、適切な契約の締結および監督を実施します。" 
                      : "2. The Company may outsource technical infrastructure and payment processing to trusted vendors under strict confidentiality supervision."}
                  </p>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">主な外部委託事業者:</span>
                    <ul className="list-disc pl-5 text-slate-500 dark:text-slate-400 space-y-0.5">
                      <li><strong>オンライン決済代行:</strong> Stripe, Inc.（国際セキュリティ基準 PCI-DSS Level 1 準拠。当社サーバー内にクレジットカード情報は一切保持されません）</li>
                      <li><strong>クラウドサーバー・CDN基盤:</strong> 国際セキュリティ認証（ISO 27001、SOC 2）を取得したデータセンター</li>
                      <li><strong>トランザクションメール配信:</strong> Resend, Inc.（システム通知・認証コード送信専用）</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ARTICLE 6 */}
              <div id="sec6" className="space-y-3 pt-4 border-t border-slate-150 dark:border-slate-800 scroll-mt-24">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <EyeOff className="w-4 h-4" />
                  <span>{isJa ? "第6条（オプトアウト・掲載非公開の手続き）" : isVi ? "Điều 6: Thủ tục Opt-out & Yêu cầu ẩn thông tin" : "Article 6 (Opt-Out & Listing Removal)"}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isJa ? "6. 法人データのオプトアウト（掲載取り下げ・非公開）申請" : "6. Corporate Listing Opt-Out and Delisting Procedures"}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                  <p>
                    {isJa 
                      ? "1. 当社の企業データベースは、一般公開情報および国税庁等の公的オープンデータに基づき構築されておりますが、掲載されている企業情報の非公開（オプトアウト）または掲載取り下げを希望される企業様につきましては、速やかに対応する体制を整えております。" 
                      : "1. While our database is compiled from official open public registries, we fully respect corporate privacy and provide prompt delisting mechanisms."}
                  </p>
                  <p>
                    {isJa 
                      ? "2. 掲載取り下げをご希望の場合は、以下の公式お問い合わせ窓口より、貴社の13桁法人番号を入力の上でお手続きいただけます。ご本人様確認（公式ドメインメールへのワンタイム認証コード照合等）の完了後、即座に検索結果および個別企業ページより非公開処理（除外）が実行されます。" 
                      : "2. To request listing removal, corporate administrators can submit an opt-out request using their 13-digit corporate number."}
                  </p>
                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                        {isJa ? "公式オプトアウト（非公開申請）窓口" : "Official Delisting Portal"}
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                        {isJa ? "手数料無料・本人確認完了後速やかに自動除外" : "Free of charge, processed promptly upon identity verification"}
                      </span>
                    </div>
                    <Link
                      href={`/${locale}/contact`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                      <span>{isJa ? "自社情報管理・非公開申請へ" : "Go to Delisting Desk"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* ARTICLE 7 */}
              <div id="sec7" className="space-y-3 pt-4 border-t border-slate-150 dark:border-slate-800 scroll-mt-24">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <Send className="w-4 h-4" />
                  <span>{isJa ? "第7条（フォーム営業における配信停止体制）" : isVi ? "Điều 7: Tuân thủ Luật gửi form & Cơ chế từ chối tiếp cận" : "Article 7 (Form Outreach Compliance & Unsubscribe)"}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isJa ? "7. 問い合わせフォーム営業における配信停止（NGリスト）体制" : "7. Form Outreach Safeguards & Global Do-Not-Contact List"}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                  <p>
                    {isJa 
                      ? "1. 当社が提供するセルフ型フォーム営業機能は、特定電子メール法および関連法規の趣旨を尊重し、営業メッセージの配信を希望されない企業様に対する配信停止（オプトアウト）機能をシステムレベルで徹底しております。" 
                      : "1. Our automated contact form outreach incorporates strict anti-spam compliance and automated opt-out mechanisms."}
                  </p>
                  <p>
                    {isJa 
                      ? "2. 配信メッセージを受信した企業様が今後の配信停止をご希望される場合、メッセージ内に明記された配信停止URL（オプトアウト導線）または当社窓口より申請いただくことで、グローバル送信禁止リスト（NGリスト）に登録され、以降のすべてのユーザーからの送信対象から恒久的に自動除外されます。" 
                      : "2. Any business requesting to opt out from form outreach will be immediately placed onto our permanent global Do-Not-Contact list."}
                  </p>
                </div>
              </div>

              {/* ARTICLE 8 */}
              <div id="sec8" className="space-y-3 pt-4 border-t border-slate-150 dark:border-slate-800 scroll-mt-24">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                  <UserCheck className="w-4 h-4" />
                  <span>{isJa ? "第8条（保有個人データの開示・訂正・利用停止）" : isVi ? "Điều 8: Quyền yêu cầu công khai, đính chính & ngừng sử dụng" : "Article 8 (Disclosure, Correction & Cease of Use)"}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isJa ? "8. 保有個人データの開示・訂正・利用停止等の請求手続き" : "8. Requests for Disclosure, Correction, or Suspension of Use"}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                  <p>
                    {isJa 
                      ? "当社は、保有個人データのご本人様から、個人情報保護法の定めに従い、開示、内容の訂正、追加、削除、利用の停止、または第三者提供の停止（以下「開示等」といいます）を求められた場合、ご本人様であることを確認の上、遅滞なく調査を行い、法令に従って適切に対応いたします。" 
                      : "Upon request by the individual under the APPI, the Company will promptly disclose, correct, or cease use of their personal data upon identity verification."}
                  </p>
                </div>
              </div>

              {/* ARTICLE 9 */}
              <div id="sec9" className="space-y-3 pt-4 border-t border-slate-150 dark:border-slate-800 scroll-mt-24">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                  <Globe className="w-4 h-4" />
                  <span>{isJa ? "第9条（Cookieおよび外部送信規律）" : isVi ? "Điều 9: Quy định Cookie & Truyền dữ liệu đối tác" : "Article 9 (Cookies & External Transmission)"}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isJa ? "9. Cookieの使用および外部送信規律に関する表示" : "9. Cookie Usage and External Transmission Regulations"}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                  <p>
                    {isJa 
                      ? "1. 本サービスでは、ログイン状態の維持、セッション管理、セキュリティの確保、およびトラフィックの統計的分析のためにCookieを使用しております。Cookie単体からは個人を特定することはできません。" 
                      : "1. The Service uses cookies for maintaining login sessions, security tokens, and aggregate traffic analysis."}
                  </p>
                  <p>
                    {isJa 
                      ? "2. 電気通信事業法に基づく外部送信規律に従い、本サービスにおいて第三者の解析ツール（Google Analytics、Cloudflare等）を利用し、閲覧履歴や端末属性等の情報が外部サーバーへ送信される場合があります。これらの情報はサービス品質の改善および障害解析の目的にのみ使用されます。" 
                      : "2. Under Japan's amended Telecommunications Business Act external transmission regulations, aggregate telemetry may be transmitted to analytics providers (Google Analytics, Cloudflare) strictly for performance optimization."}
                  </p>
                  <p>
                    {isJa 
                      ? "3. ユーザーは、ブラウザの設定によりCookieの受け入れを拒否または無効化することができます。ただし、その場合、本サービスの一部の機能が正常にご利用いただけなくなる場合があります。" 
                      : "3. Users can disable cookies in browser settings, which may impact certain features."}
                  </p>
                </div>
              </div>

              {/* ARTICLE 10 */}
              <div id="sec10" className="space-y-4 pt-4 border-t border-slate-150 dark:border-slate-800 scroll-mt-24">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>{isJa ? "第10条（個人情報取扱事業者および窓口）" : isVi ? "Điều 10: Thông tin đơn vị quản lý & Cổng liên hệ" : "Article 10 (Data Handler & Contact Details)"}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isJa ? "10. 個人情報取扱事業者に関する表示およびお問い合わせ窓口" : "10. Identity of Personal Information Handler & Official Contact Desk"}
                </h3>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700 space-y-3 text-xs leading-relaxed">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">販売業者 / 事業者名</span>
                      <strong className="text-sm text-slate-900 dark:text-white">TQC株式会社 (TQC Corporation)</strong>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">適格請求書発行事業者登録番号</span>
                      <strong className="text-sm font-mono text-slate-900 dark:text-white">T4013301048678</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">代表者 / 運営統括責任者</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">キム　バン　チュン (Van Trung Kim)</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">個人情報保護管理責任者</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Kigyou-List 個人情報管理推進責任者</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div>
                      <span className="text-slate-400">所在地: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F</span>
                    </div>
                    <div>
                      <span className="text-slate-400">代表電話番号: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">(03) 6907-1219 / FAX (03) 6701-2399</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">公式メール窓口: </span>
                      <a href="mailto:contact@kigyoulist.com" className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline font-mono">
                        contact@kigyoulist.com
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400">窓口受付時間: </span>
                      <span className="text-slate-700 dark:text-slate-300">平日 9:30 〜 18:00（土日・祝日・年末年始を除く）</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/${locale}/contact`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{isJa ? "お問い合わせ・オプトアウト窓口を開く →" : "Contact & Support Desk →"}</span>
                  </Link>

                  <Link
                    href={`/${locale}/tokushoho`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>{isJa ? "特定商取引法に基づく表記を見る" : "Commercial Disclosures (Tokushoho)"}</span>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Globe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
