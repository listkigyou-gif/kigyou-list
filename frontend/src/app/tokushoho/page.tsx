import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Scale, Building, Mail, Phone, ShieldAlert, FileText, Globe, ChevronRight } from "lucide-react";

export const metadata = {
  title: "特定商取引法に基づく表記 | Kigyou-list",
  description: "Kigyou-list（企業リスト）の特定商取引法に基づく表記です。当サービスのご利用に関する法的要件を記載しています。",
  alternates: {
    canonical: "/tokushoho",
  },
};

export default function TokushohoPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "ホーム",
        "item": "https://kigyoulist.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "特定商取引法に基づく表記",
        "item": "https://kigyoulist.com/tokushoho"
      }
    ]
  };
  const infoItems = [
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
      value: "各プラン紹介ページ（料金プラン）に記載の金額（消費税込み）"
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
  ];

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
          <Link href="/" className="hover:text-primary transition-colors">ホーム</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">特定商取引法に基づく表記</span>
        </nav>

        {/* Title Section */}
        <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm flex flex-col gap-6 leading-relaxed relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Scale className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                特定商取引法に基づく表記
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                特定商取引に関する法律に基づく法的開示義務情報
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            特定商取引に関する法律第11条に基づき、以下の通りサービス提供条件その他の事項を表記・開示いたします。当サービスをご利用の前に必ずご確認ください。
          </p>

          <div className="flex flex-col border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
            {infoItems.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-5 flex flex-col sm:flex-row gap-3 sm:gap-6 ${
                  item.label.includes("返品") ? "bg-rose-50/10 dark:bg-rose-950/5" : ""
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
          <div className="bg-slate-50 border border-slate-250/50 rounded-2xl p-4 text-[10px] text-slate-455 leading-relaxed dark:bg-[#151B22]/50 dark:border-slate-800 mt-2">
            ※ 上記開示情報に関してご不明な点がございましたら、サポート窓口（info@kigyoulist.com）までご連絡いただけますようお願い申し上げます。原則としてメールによる対応を優先させていただいております。
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
