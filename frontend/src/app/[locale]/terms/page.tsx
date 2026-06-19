import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, ChevronRight, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en";
  return {
    title: isEn ? "Terms of Service | Kigyou-list" : "利用規約 | Kigyou-list",
    description: isEn 
      ? "Terms of Service for Kigyou-list. Learn about your rights, responsibilities, and guidelines for using our B2B lead generation database."
      : "Kigyou-list（企業リスト）の利用規約です。当サービスをご利用いただくにあたっての条件、禁止事項、免責について規定しています。",
    alternates: {
      canonical: `/${locale}/terms`,
      languages: {
        ja: "/ja/terms",
        en: "/en/terms",
      }
    }
  };
}

export default async function TermsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';

  const d = locale === 'en' ? {
    home: "Home",
    terms: "Terms of Service",
    title: "Terms of Service",
    revisedDate: "Last Revised: May 20, 2026",
    intro: "These Terms of Service (hereinafter referred to as the \"Terms\") define the conditions for using \"Kigyou-list\" (hereinafter referred to as the \"Service\") provided by TQC Corporation (hereinafter referred to as the \"Company\"). Registered users (hereinafter referred to as \"Users\") shall use the Service in accordance with these Terms.",
    sections: [
      { id: "art1", title: "Article 1 (Applicability)", content: "These Terms shall apply to all relations between the User and the Company regarding the use of the Service. Any individual rules, guidelines, or conditions defined by the Company for the Service shall constitute a part of these Terms." },
      { id: "art2", title: "Article 2 (User Registration)", content: "Registration is completed when an applicant agrees to these Terms and applies for membership through the method defined by the Company, and the Company approves the application. The Company reserves the right to reject any application at its sole discretion and is not obligated to disclose the reasons for rejection." },
      { id: "art3", title: "Article 3 (Use of Service and Data)", content: "The company details (including FAX, email address, financials, and signals) provided in this Service are collected from public registry information and crawled via our proprietary AI pipeline. Users may use data obtained from the Service solely for internal sales analytics and business acquisition purposes. Redeploying, reselling, distributing, or disclosing data to third parties (including launching competing services) is strictly prohibited." },
      { id: "art4", title: "Article 4 (Usage Fees and Payment Method)", content: "Users shall pay the usage fees specified by the Company and displayed on the website as consideration for using paid plans. Fees shall be paid via credit card or other designated means. Fees are non-refundable and will not be prorated under any circumstances." },
      { id: "art5", title: "Article 5 (Prohibitive Conduct)", content: "Users shall not engage in the following conducts while using the Service: using crawlers, scripts, or automated programs to make excessive requests or place heavy load on the Service's servers; copying, scraping, or redistributing the Service's data in bulk formats; unauthorized use or sharing of other users' accounts; any other actions that interfere or risk interfering with the operation of the Service." },
      { id: "art6", title: "Article 6 (Account Termination & Suspension)", content: "Users may cancel their membership at any time through the prescribed procedures. If a User violates any clause of these Terms, the Company may suspend or terminate their account immediately without prior notice." },
      { id: "art7", title: "Article 7 (Disclaimer of Warranties & Limitation of Liability)", content: "The Company makes no warranties, express or implied, regarding the accuracy, completeness, validity, or timeliness of any information (including company profiles, contacts, financials, and signals) provided by the Service. The Company shall not be held liable for any damages (including system failures, business losses, or financial disputes) resulting from the use of the Service." },
      { id: "art8", title: "Article 8 (Governing Law and Jurisdiction)", content: "These Terms shall be governed by and construed in accordance with the laws of Japan. Any disputes arising out of the Service shall be subject to the exclusive jurisdiction of the Tokyo District Court in Japan." },
    ],
    operatorTitle: "Information regarding the Service Operator",
    companyName: "Company Name: TQC Corporation",
    address: "Address: 3F Sato Bldg, 2-33-6 Minami-Ikebukuro, Toshima-ku, Tokyo 171-0022",
    contact: "Contact: (03) 6907-1219 / FAX (03) 6701-2399",
    email: "Email: info@kigyoulist.com",
    website: "Website: https://kigyoulist.com"
  } : {
    home: "ホーム",
    terms: "利用規約",
    title: "利用規約",
    revisedDate: "最終改訂日: 2026年5月20日",
    intro: "この利用規約（以下，「本規約」といいます。）は，TQC株式会社（以下，「当社」といいます。）が提供する「Kigyou-list」（以下，「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下，「ユーザー」といいます。）には，本規約に従って本サービスをご利用いただきます。",
    sections: [
      { id: "art1", title: "第1条（適用）", content: "本規約は，ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。当社が本サービスに関し、本規約のほかに個別規定や利用ルールを定めた場合、これらは本規約の一部を構成するものとします。" },
      { id: "art2", title: "第2条（会員登録）", content: "本サービスにおいては，登録希望者が本規約に同意の上，当社が定める方法によって会員登録を申請し，当社がこれを承認することによって，会員登録が完了するものとします。当社は，登録申請者に不適切な事由があると判断した場合，登録申請を承認しないことがあり，その理由については一切の開示義務を負わないものとします。" },
      { id: "art3", title: "第3条（サービスの利用およびデータについて）", content: "本サービスが提供する企業情報（FAX、メールアドレス、決算指標、営業シグナルを含む）は、公的機関が公開する情報および独自のAIクローリング技術等により収集されたものです。ユーザーは、本サービスから取得したデータを自己の内部的な営業分析や商談獲得の目的にのみ使用するものとし、競合サービスの立ち上げなど第三者へのデータの再販売・配布・開示は一切禁止されます。" },
      { id: "art4", title: "第4条（利用料金および支払方法）", content: "ユーザーは，本サービスの有料プランを利用する対価として，当社が定め，ウェブサイトに表示する利用料金を支払うものとします。利用料金は、別途定めるクレジットカード決済またはその他の手段にて期日までに決済されるものとし、理由の如何を問わず日割り計算や既払い料金の返金は行わないものとします。" },
      { id: "art5", title: "第5条（禁止事項）", content: "ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。クローラー、スクリプト、自動プログラムを使用した過度なアクセスおよび本サービスのサーバーへの負荷攻撃；本サービスが公開するデータのコピー、スクレイピング、その他バルク形式による二次配布行為；他のユーザーのアカウントを不正に利用または共有する行為；本サービスの運営を妨害するおそれのある一切の行為。" },
      { id: "art6", title: "第6条（退会・利用停止）", content: "ユーザーは，当社所定の手続きを経て，いつでも任意に会員登録を解除できるものとします。当社は，ユーザーが本規約のいずれかの条項に違反した場合，事前通知することなく直ちにアカウントの利用停止または強制退会の措置を取ることができるものとします。" },
      { id: "art7", title: "第7条（免責事項）", content: "当社は，本サービスで提供するすべての情報（企業基本情報、連絡先、財務情報、営業活動シグナル等）の真実性、正確性、完全性、最新性について、明示または黙示を問わずいかなる保証も行わないものとします。本サービスの利用に関して発生したユーザーの損害（PCの障害、営業活動上の損失、金銭的トラブル等）について、当社は一切の責任を負わないものとします。" },
      { id: "art8", title: "第8条（準拠法・裁判管轄）", content: "本規約の解釈にあたっては，日本法を準拠法とします。本サービスに関して紛争が生じた場合には，当社（TQC株式会社）の本店所在地を管轄する東京地方裁判所を専属的合意管轄とします。" },
    ],
    operatorTitle: "運営事業者に関する表示",
    companyName: "運営会社：TQC株式会社 (TQC Corporation)",
    address: "所在地：〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F",
    contact: "代表連絡先：(03) 6907-1219 / FAX (03) 6701-2399",
    email: "メールアドレス：info@kigyoulist.com",
    website: "ウェブサイト：https://kigyoulist.com"
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
        "name": d.terms,
        "item": `https://kigyoulist.com/${locale}/terms`
      }
    ]
  };

  const menuSections = locale === 'en' ? [
    { id: "art1", title: "Article 1 (Applicability)" },
    { id: "art2", title: "Article 2 (User Registration)" },
    { id: "art3", title: "Article 3 (Use of Service)" },
    { id: "art4", title: "Article 4 (Usage Fees)" },
    { id: "art5", title: "Article 5 (Prohibitions)" },
    { id: "art6", title: "Article 6 (Termination)" },
    { id: "art7", title: "Article 7 (Disclaimers)" },
    { id: "art8", title: "Article 8 (Governing Law)" },
  ] : [
    { id: "art1", title: "第1条（適用）" },
    { id: "art2", title: "第2条（会員登録）" },
    { id: "art3", title: "第3条（サービスの利用）" },
    { id: "art4", title: "第4条（料金及び支払方法）" },
    { id: "art5", title: "第5条（禁止事項）" },
    { id: "art6", title: "第6条（退会・停止）" },
    { id: "art7", title: "第7条（免責事項）" },
    { id: "art8", title: "第8条（準拠法・管轄）" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6">
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">{d.home}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">{d.terms}</span>
        </nav>

        {locale === 'en' && (
          <div className="bg-amber-50 border border-amber-200/60 dark:bg-amber-955/20 dark:border-amber-900/30 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 mb-2 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <span className="font-extrabold text-[11px] uppercase tracking-wider block mb-1">Official Language Disclaimer</span>
              <p className="leading-relaxed font-semibold">
                This is a translation of the official Japanese Terms of Service. In case of any conflict or ambiguity between the English and Japanese versions, the original Japanese version shall prevail and remain legally binding.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Quick sitemap sitemaps side-menu */}
          <aside className="w-full md:w-56 shrink-0 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-850 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm md:sticky md:top-20">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 block mb-1">
              {locale === 'en' ? 'SITEMAP' : '目次'}
            </span>
            {menuSections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-primary hover:bg-slate-50 dark:text-slate-400 dark:hover:text-secondary dark:hover:bg-slate-800/40 transition-all"
              >
                {sec.title}
              </a>
            ))}
          </aside>

          {/* Main Content card */}
          <section className="flex-1 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-850 rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm flex flex-col gap-6">
            <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {d.title}
                </h1>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  {d.revisedDate}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {d.intro}
            </p>

            {d.sections.map((sec) => (
              <div key={sec.id} id={sec.id} className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{sec.title}</h3>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{sec.content}</p>
              </div>
            ))}

            <div className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30 text-xs">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{d.operatorTitle}</h3>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{d.companyName}</p>
              <p>{d.address}</p>
              <p>{d.contact}</p>
              <p>{d.email}</p>
              <p>{d.website}</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
