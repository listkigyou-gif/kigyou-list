import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Scale, Building, Mail, Phone, ShieldAlert, FileText, Globe, ChevronRight, AlertCircle } from "lucide-react";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en";
  return {
    title: isEn ? "Act on Specified Commercial Transactions | Kigyou-list" : "特定商取引法に基づく表記 | Kigyou-list",
    description: isEn 
      ? "Legal disclosures required under the Act on Specified Commercial Transactions for Kigyou-list."
      : "Kigyou-list（企業リスト）の特定商取引法に基づく表記です。当サービスのご利用に関する法的要件を記載しています。",
    alternates: {
      canonical: `/${locale}/tokushoho`,
      languages: {
        ja: "/ja/tokushoho",
        en: "/en/tokushoho",
      }
    }
  };
}

export default async function TokushohoPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';

  const d = locale === 'en' ? {
    home: "Home",
    tokushoho: "Act on Specified Commercial Transactions",
    title: "Act on Specified Commercial Transactions",
    subtitle: "Legal disclosures required under the Act on Specified Commercial Transactions",
    intro: "Pursuant to Article 11 of the Act on Specified Commercial Transactions, the terms of service provision and other matters are listed and disclosed below. Please review these terms before using our service.",
    footerNote: "※ If you have any questions regarding the above disclosures, please contact our support desk (info@kigyoulist.com). As a rule, we prioritize email communication.",
    infoItems: [
      {
        icon: <Building className="w-5 h-5 text-primary" />,
        label: "Distributor",
        value: "TQC Corporation"
      },
      {
        icon: <Building className="w-5 h-5 text-primary" />,
        label: "Representative / Director",
        value: "Van Trung Kim (キム バン チュン)"
      },
      {
        icon: <Scale className="w-5 h-5 text-primary" />,
        label: "Address",
        value: "3F Sato Bldg, 2-33-6 Minami-Ikebukuro, Toshima-ku, Tokyo 171-0022"
      },
      {
        icon: <Phone className="w-5 h-5 text-primary" />,
        label: "Phone Number",
        value: "+81-3-6907-1219 (Hours: Weekdays 10:00–18:00 JST)"
      },
      {
        icon: <Phone className="w-5 h-5 text-primary" />,
        label: "FAX Number",
        value: "+81-3-6701-2399"
      },
      {
        icon: <Mail className="w-5 h-5 text-primary" />,
        label: "Email Address",
        value: "info@kigyoulist.com"
      },
      {
        icon: <Globe className="w-5 h-5 text-primary" />,
        label: "Homepage URL",
        value: "https://kigyoulist.com"
      },
      {
        icon: <FileText className="w-5 h-5 text-primary" />,
        label: "Selling Price",
        value: "The amount specified on each plan page / pricing page (including tax)"
      },
      {
        icon: <FileText className="w-5 h-5 text-primary" />,
        label: "Additional Fees",
        value: "Communication costs such as internet connection charges and packet transmission fees (to be borne by the customer)"
      },
      {
        icon: <FileText className="w-5 h-5 text-primary" />,
        label: "Payment Method",
        value: "Credit card payment (processed securely via Stripe)"
      },
      {
        icon: <FileText className="w-5 h-5 text-primary" />,
        label: "Payment Timing",
        value: "[Monthly Plan] Charged at initial registration, then automatically billed monthly. \n[Additional Quota Pack] Billed on demand upon purchase."
      },
      {
        icon: <FileText className="w-5 h-5 text-primary" />,
        label: "Service Provision Timing",
        value: "Services are available immediately after the payment process is completed."
      },
      {
        icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
        label: "Returns, Refunds, & Cancellations",
        value: "Due to the nature of digital contents and services, refunds, returns, or cancellations after payment completion are not accepted for customer convenience. \nCancellation of a monthly subscription (stopping auto-renewal) can be requested at any time from the \"Settings\" tab in the dashboard. Users will continue to have access to the Service for the remainder of the billing period after cancellation."
      }
    ]
  } : {
    home: "ホーム",
    tokushoho: "特定商取引法に基づく表記",
    title: "特定商取引法に基づく表記",
    subtitle: "特定商取引に関する法律に基づく法的開示義務情報",
    intro: "特定商取引に関する法律第11条に基づき、以下の通りサービス提供条件その他の事項を表記・開示いたします。当サービスをご利用の前に必ずご確認ください。",
    footerNote: "※ 上記開示情報に関してご不明な点がございましたら、サポート窓口（info@kigyoulist.com）までご連絡いただけますようお願い申し上げます。原則としてメールによる対応を優先させていただいております。",
    infoItems: [
      {
        icon: <Building className="w-5 h-5 text-primary" />,
        label: "販売業者",
        value: "TQC株式会社 (TQC Corporation)"
      },
      {
        icon: <Building className="w-5 h-5 text-primary" />,
        label: "運営責任者",
        value: "キム　バン　チュン"
      },
      {
        icon: <Scale className="w-5 h-5 text-primary" />,
        label: "所在地",
        value: "〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F"
      },
      {
        icon: <Phone className="w-5 h-5 text-primary" />,
        label: "電話番号",
        value: "(03) 6907-1219 (受付時間：平日 10:00〜18:00)"
      },
      {
        icon: <Phone className="w-5 h-5 text-primary" />,
        label: "FAX番号",
        value: "(03) 6701-2399"
      },
      {
        icon: <Mail className="w-5 h-5 text-primary" />,
        label: "メールアドレス",
        value: "info@kigyoulist.com"
      },
      {
        icon: <Globe className="w-5 h-5 text-primary" />,
        label: "ホームページURL",
        value: "https://kigyoulist.com"
      },
      {
        icon: <FileText className="w-5 h-5 text-primary" />,
        label: "販売価格",
        value: "各プラン紹介ページ（料金プラン）に記載 of 金額（消費税込み）"
      },
      {
        icon: <FileText className="w-5 h-5 text-primary" />,
        label: "商品代金以外の必要料金",
        value: "インターネット接続料金、パケット通信料等の通信費用（お客様のご負担となります）"
      },
      {
        icon: <FileText className="w-5 h-5 text-primary" />,
        label: "お支払方法",
        value: "クレジットカード決済 (Stripe決済システムを利用)"
      },
      {
        icon: <FileText className="w-5 h-5 text-primary" />,
        label: "お支払時期",
        value: "【月額プラン】初回登録時、および翌月以降の毎月自動更新時\n【追加容量パック】購入時の都度決済"
      },
      {
        icon: <FileText className="w-5 h-5 text-primary" />,
        label: "サービスの提供時期",
        value: "お支払手続き完了後、即時にご利用可能となります。"
      },
      {
        icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
        label: "返品・返金・キャンセルについて",
        value: "デジタルコンテンツおよびサービスの特性上、決済完了後のお客様都合による返品・返金・キャンセルには一切応じられません。\n月額プランの解約（次回の自動更新停止）は、ダッシュボードの「設定」メニューよりいつでもお手続きいただけます。解約手続き完了後も、当月の残りの利用可能期間中は引き続きサービスをご利用いただけます。"
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": d.home,
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": d.tokushoho,
        "item": `https://kigyoulist.com/${locale}/tokushoho`
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6">
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">{d.home}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">{d.tokushoho}</span>
        </nav>

        {locale === 'en' && (
          <div className="bg-amber-50 border border-amber-200/60 dark:bg-amber-955/20 dark:border-amber-900/30 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 mb-2 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <span className="font-extrabold text-[11px] uppercase tracking-wider block mb-1">Official Language Disclaimer</span>
              <p className="leading-relaxed font-semibold">
                This is a translation of the official Japanese Act on Specified Commercial Transactions page. In case of any conflict or ambiguity between the English and Japanese versions, the original Japanese version shall prevail and remain legally binding.
              </p>
            </div>
          </div>
        )}

        {/* Title Section */}
        <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-850 rounded-3xl p-6 md:p-10 shadow-sm flex flex-col gap-6 leading-relaxed relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-slate-850">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {d.title}
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                {d.subtitle}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {d.intro}
          </p>

          <div className="flex flex-col border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden divide-y divide-slate-150 dark:divide-slate-850">
            {d.infoItems.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-5 flex flex-col sm:flex-row gap-3 sm:gap-6 ${
                  item.label.includes("返品") || item.label.includes("Returns") ? "bg-rose-500/5 dark:bg-rose-950/5" : ""
                }`}
              >
                <div className="sm:w-60 flex items-center gap-2.5 shrink-0">
                  <span className="shrink-0">{item.icon}</span>
                  <span className="text-xs font-extrabold text-slate-850 dark:text-slate-200">
                    {item.label}
                  </span>
                </div>
                <div className="flex-1 text-xs text-slate-600 dark:text-slate-355 font-medium whitespace-pre-wrap leading-relaxed">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Legal Notice note banner */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 text-[10.5px] text-slate-500 leading-relaxed dark:bg-[#151B22]/50 dark:border-slate-850 mt-2 font-medium">
            {d.footerNote}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
