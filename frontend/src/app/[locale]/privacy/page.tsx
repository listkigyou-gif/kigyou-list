import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldCheck, ChevronRight, AlertCircle } from "lucide-react";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en" || locale === "vi";
  return {
    title: isEn ? "Privacy Policy | Kigyou-list" : "プライバシーポリシー | Kigyou-list",
    description: isEn 
      ? "Privacy policy and opt-out request procedures for Kigyou-list B2B database."
      : "Kigyou-list（企業リスト）のプライバシーポリシーです。個人情報の取扱基準およびオプトアウト申請について記載しています。",
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: {
        ja: "/ja/privacy",
        en: "/en/privacy",
      }
    }
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';

  const d = (locale === 'en' || locale === 'vi') ? {
    home: "Home",
    privacy: "Privacy Policy",
    title: "Privacy Policy",
    revisedDate: "Last Revised: May 28, 2026",
    intro: "TQC Corporation (hereinafter referred to as the \"Company\") defines this Privacy Policy (hereinafter referred to as the \"Policy\") regarding the handling of personal information of users in the service \"Kigyou-list\" (hereinafter referred to as the \"Service\") provided on this website. The Company complies with the Act on the Protection of Personal Information (hereinafter referred to as the \"Act\").",
    sections: [
      {
        id: "sec1",
        title: "1. Acquisition of Personal Information",
        content: [
          "The Company will acquire user's personal information such as name and email address through lawful and appropriate means upon registration for the Service.",
          "Additionally, the Service may acquire Cookie information (behavioral cookies) related to browsing history and behavioral data for the purpose of improving usability and statistical analysis of service usage.",
          "The company details in the database provided by this Service are collected from publicly available websites, registry information, and public disclosure data using technologies like web crawling, and do not unreasonably violate individual privacy."
        ]
      },
      {
        id: "sec2",
        title: "2. Purpose of Use",
        content: [
          "The acquired user information and Cookie information will be used solely for the following purposes:"
        ],
        bullets: [
          "Maintenance, management, identity verification, and prevention of unauthorized access.",
          "Proposing optimized company information and providing recommendation features tailored to users' interests.",
          "Traffic analysis using access analysis and statistical analysis of usage patterns to improve the Service.",
          "Providing guidance on the PRO plan (paid version), billing, and payment processing.",
          "Distributing critical notices, maintenance information, and handling inquiries."
        ]
      },
      {
        id: "sec3",
        title: "3. Restrictions on Third-Party Provision",
        content: [
          "Except in the following cases, the Company will not provide personal information to third parties without the prior consent of the user. The Company will never illegally sell, rent, or transfer the acquired personal information."
        ],
        bullets: [
          "When necessary to protect human life, body, or property, and it is difficult to obtain consent.",
          "When collaborating with national or local government institutions in executing affairs specified by laws and regulations.",
          "When delegating payment processing to payment agencies (appropriate supervision will be implemented)."
        ]
      },
      {
        id: "sec4",
        title: "4. Security Control Measures",
        content: [
          "To prevent unauthorized access, loss, destruction, alteration, or leakage of personal information, the Company implements appropriate security measures, including password hashing, SSL data encryption, and regular security patching."
        ]
      },
      {
        id: "sec5",
        title: "5. Opt-out Request for Company Data (Information Removal Procedures)",
        content: [
          "Our corporate database crawls publicly available information. Business owners who wish to delete or opt-out their listed information can request this via our inquiry form.",
          "Upon receipt of the request and verification of identity (representative or information manager), we will promptly delete or hide the listing."
        ]
      },
      {
        id: "sec6",
        title: "6. Contact for Personal Information",
        content: [
          "For inquiries, complaints, requests for data disclosure, correction, or opt-out requests regarding personal information, please contact us via the Inquiry Page."
        ]
      },
      {
        id: "sec7",
        title: "7. Use of Cookies",
        content: [
          "The Company uses Cookies on the Service. A Cookie is a small text file saved by a website in the user's browser.",
          "Cookies are used to maintain login sessions, provide personalization, and measure website traffic. Users can disable cookies in browser settings, but some features of the Service may not function properly."
        ]
      }
    ],
    operatorTitle: "Information regarding Personal Information Handler",
    companyName: "Company Name: TQC Corporation",
    address: "Address: 3F Sato Bldg, 2-33-6 Minami-Ikebukuro, Toshima-ku, Tokyo 171-0022",
    contact: "Contact: (03) 6907-1219 / FAX (03) 6701-2399",
    email: "Email: info@kigyoulist.com"
  } : {
    home: "ホーム",
    privacy: "プライバシーポリシー",
    title: "プライバシーポリシー",
    revisedDate: "最終改訂日: 2026年5月28日",
    intro: "TQC株式会社（以下，「当社」といいます。）は，本ウェブサイト上で提供するサービス「Kigyou-list」（以下,「本サービス」といいます。）における，ユーザーの個人情報の取扱いについて，以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。当社は個人情報の保護に関する法律（以下「個人情報保護法」といいます）を遵守します。",
    sections: [
      {
        id: "sec1",
        title: "1. 個人情報の取得",
        content: [
          "当社は、本サービスの利用登録時において、ユーザーの氏名、メールアドレス等の個人情報を適法かつ適切な手段によって取得いたします。",
          "また、本サービスでは、サイトの利便性の向上や利用状況の統計的分析のために、閲覧履歴や行動データに関するCookie（クッキー）情報（行動クッキー）を取得する場合があります。",
          "なお、本サービスが提供するデータベース内の企業情報は、Webクローリング等の技術を使用し、一般に公表されているウェブサイトおよび登記情報、公的公開データから収集しており、個人のプライバシー情報を不当に侵害する取得は行いません。"
        ]
      },
      {
        id: "sec2",
        title: "2. 利用目的",
        content: [
          "取得したユーザー情報およびCookie情報は、以下の目的のためにのみ利用いたします。"
        ],
        bullets: [
          "本サービスの維持・管理および本人確認・不正アクセス防止。",
          "ユーザーの関心に合わせた最適な企業情報の提案やレコメンデーション機能の提供。",
          "アクセス解析を使用したトラフィック分析や利用状況の統計的分析を通じたサービス改善。",
          "PROプラン（有料版）のご案内、請求処理、および決済処理。",
          "重要なお知らせやメンテナンス情報の配信、お問い合わせ対応。"
        ]
      },
      {
        id: "sec3",
        title: "3. 第三者提供の制限",
        content: [
          "当社は，次に掲げる場合を除いて，あらかじめユーザーの同意を得ることなく，第三者に個人情報を提供することはありません。また、当社は、取得した個人情報を違法に販売、貸与、または譲渡することは一切いたしません。"
        ],
        bullets: [
          "人の生命，身体または財産の保護のために必要がある場合であって，本人の同意を得ることが困難であるとき。",
          "国の機関もしくは地方公共団体またはその委託を受けた者が，法令の定める事務を遂行することに対して協力する必要があるとき。",
          "決済代行会社など、決済事務の処理を委託する場合（適切な監督を実施します）。"
        ]
      },
      {
        id: "sec4",
        title: "4. 安全管理措置",
        content: [
          "当社は，個人情報への不正アクセス，紛失，破壊，改ざんおよび漏洩を防止するため，パスワードのハッシュ化、SSL通信によるデータの暗号化、セキュリティパッチの適用など、適切な安全対策を講じます。"
        ]
      },
      {
        id: "sec5",
        title: "5. オプトアウト申請",
        content: [
          "当社の企業データベースは、一般公開情報に基づいてクローリングを行っております。掲載されている企業情報の削除またはオプトアウトを希望される企業オーナー様は、当社のお問い合わせフォームより申請していただくことができます。",
          "申請受領後、ご本人様（代表者または情報管理責任者）であることを確認の上、速やかに掲載の削除または非公開化の処理を実行いたします。"
        ]
      },
      {
        id: "sec6",
        title: "6. お問い合わせ窓口",
        content: [
          "個人情報の取扱いに関するご質問、苦情の申し立て、またはデータの開示・訂正・オプトアウトの申請は、当社のお問い合わせページよりご連絡いただきますようお願いいたします。"
        ]
      },
      {
        id: "sec7",
        title: "7. Cookieの使用について",
        content: [
          "当社は、本サービスにおいてCookie（クッキー）を使用しています。Cookieは、ウェブサイトがユーザーのブラウザに保存する小さなテキストファイルです。",
          "Cookieを使用することで、ログイン状態の維持や各種パーソナライズ機能の提供、さらにはアクセス解析ツールを利用したサイト利用状況の測定が可能となります。ユーザーはブラウザの設定によってCookieの受け入れを無効にできますが、その場合、本サービスの一部の機能が正常に動作しない場合があります。"
        ]
      }
    ],
    operatorTitle: "個人情報取扱事業者に関する表示",
    companyName: "会社名：TQC株式会社 (TQC Corporation)",
    address: "所在地：〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F",
    contact: "代表連絡先：(03) 6907-1219 / FAX (03) 6701-2399",
    email: "メールアドレス：info@kigyoulist.com"
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
        "name": d.privacy,
        "item": `https://kigyoulist.com/${locale}/privacy`
      }
    ]
  };

  const menuSections = (locale === 'en' || locale === 'vi') ? [
    { id: "sec1", title: "1. Info Acquisition" },
    { id: "sec2", title: "2. Purpose of Use" },
    { id: "sec3", title: "3. Third-Party Restrictions" },
    { id: "sec4", title: "4. Security Measures" },
    { id: "sec5", title: "5. Opt-out Request" },
    { id: "sec6", title: "6. Contact Details" },
    { id: "sec7", title: "7. Cookie Policy" },
  ] : [
    { id: "sec1", title: "1. 個人情報の取得" },
    { id: "sec2", title: "2. 利用目的" },
    { id: "sec3", title: "3. 第三者提供の制限" },
    { id: "sec4", title: "4. 安全管理措置" },
    { id: "sec5", title: "5. オプトアウト申請" },
    { id: "sec6", title: "6. お問い合わせ窓口" },
    { id: "sec7", title: "7. Cookieの使用について" },
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
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">{d.privacy}</span>
        </nav>

        {(locale === 'en' || locale === 'vi') && (
          <div className="bg-amber-50 border border-amber-200/60 dark:bg-amber-955/20 dark:border-amber-900/30 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 mb-2 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <span className="font-extrabold text-[11px] uppercase tracking-wider block mb-1">Official Language Disclaimer</span>
              <p className="leading-relaxed font-semibold">
                This is a translation of the official Japanese Privacy Policy. In case of any conflict or ambiguity between the English and Japanese versions, the original Japanese version shall prevail and remain legally binding.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Navigation Sidebar (Desktop only) */}
          <aside className="w-full md:w-56 shrink-0 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-850 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm md:sticky md:top-20">
            <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 block mb-1">
              {locale === 'en' || locale === 'vi' ? 'SITEMAP' : '目次'}
            </h2>
            <nav className="flex flex-col gap-1">
              {menuSections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-primary hover:bg-slate-50 dark:text-slate-400 dark:hover:text-secondary dark:hover:bg-slate-800/40 transition-all"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Right Content Sheet */}
          <section className="flex-1 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-850 rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm flex flex-col gap-6">
            <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
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
                {sec.content.map((pText, idx) => (
                  <p key={idx} className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{pText}</p>
                ))}
                {sec.bullets && (
                  <ul className="list-disc pl-5 text-xs flex flex-col gap-1.5 text-slate-500 dark:text-slate-400 mt-1">
                    {sec.bullets.map((bText, idx) => (
                      <li key={idx} className="leading-relaxed">{bText}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30 text-xs">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{d.operatorTitle}</h3>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{d.companyName}</p>
              <p>{d.address}</p>
              <p>{d.contact}</p>
              <p>{d.email}</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
