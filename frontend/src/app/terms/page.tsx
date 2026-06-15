import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, ChevronRight } from "lucide-react";

export const metadata = {
  title: "利用規約 | Kigyou-list",
  description: "Kigyou-list（企業リスト）の利用規約です。当サービスをご利用になる前に必ずお読みください。",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  const sections = [
    { id: "art1", title: "第1条（適用）" },
    { id: "art2", title: "第2条（会員登録）" },
    { id: "art3", title: "第3条（サービスの利用）" },
    { id: "art4", title: "第4条（料金及び支払方法）" },
    { id: "art5", title: "第5条（禁止事項）" },
    { id: "art6", title: "第6条（退会・停止）" },
    { id: "art7", title: "第7条（免責事項）" },
    { id: "art8", title: "第8条（準拠法・管轄）" },
  ];

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
        "name": "利用規約",
        "item": "https://kigyoulist.com/terms"
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6">
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">ホーム</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">利用規約</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Navigation Sidebar (Desktop only) */}
          <aside className="hidden md:block w-64 shrink-0 h-[fit-content] sticky top-20 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              目次 (利用規約)
            </h2>
            <nav className="flex flex-col gap-2.5 text-xs font-bold">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="text-slate-600 hover:text-primary dark:text-slate-450 dark:hover:text-secondary flex items-center justify-between group transition-colors py-1"
                >
                  <span>{sec.title}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </nav>
          </aside>

          {/* Right Content Sheet */}
          <section className="flex-1 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-10 shadow-sm flex flex-col gap-6 leading-relaxed text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                利用規約
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                最終改訂日: 2026年5月20日
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            この利用規約（以下，「本規約」といいます。）は，TQC株式会社（以下，「当社」といいます。）が提供する「Kigyou-list」（以下，「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下，「ユーザー」といいます。）には，本規約に従って本サービスをご利用いただきます。
          </p>

          <div id="art1" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">第1条（適用）</h3>
            <p className="text-xs">
              本規約は，ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。当社が本サービスに関し、本規約のほかに個別規定や利用ルールを定めた場合、これらは本規約の一部を構成するものとします。
            </p>
          </div>

          <div id="art2" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">第2条（会員登録）</h3>
            <p className="text-xs">
              本サービスにおいては，登録希望者が本規約に同意の上，当社が定める方法によって会員登録を申請し，当社がこれを承認することによって，会員登録が完了するものとします。
            </p>
            <p className="text-xs">
              当社は，登録申請者に不適切な事由があると判断した場合，登録申請を承認しないことがあり，その理由については一切の開示義務を負わないものとします。
            </p>
          </div>

          <div id="art3" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">第3条（サービスの利用およびデータについて）</h3>
            <p className="text-xs">
              本サービスが提供する企業情報（FAX、メールアドレス、決算指標、営業シグナルを含む）は、公的機関が公開する情報および独自のAIクローリング技術等により収集されたものです。
            </p>
            <p className="text-xs">
              ユーザーは、本サービスから取得したデータを自己の内部的な営業分析や商談獲得の目的にのみ使用するものとし、競合サービスの立ち上げなど第三者へのデータの再販売・配布・開示は一切禁止されます。
            </p>
          </div>

          <div id="art4" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">第4条（利用料金および支払方法）</h3>
            <p className="text-xs">
              ユーザーは，本サービスの有料プランを利用する対価として，当社が定め，ウェブサイトに表示する利用料金を支払うものとします。
            </p>
            <p className="text-xs">
              利用料金は、別途定めるクレジットカード決済またはその他の手段にて期日までに決済されるものとし、理由の如何を問わず日割り計算や既払い料金の返金は行わないものとします。
            </p>
          </div>

          <div id="art5" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">第5条（禁止事項）</h3>
            <p className="text-xs">
              ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。
            </p>
            <ul className="list-disc pl-5 text-xs flex flex-col gap-1 text-slate-500 dark:text-slate-400">
              <li>クローラー、スクリプト、自動プログラムを使用した過度なアクセスおよび本サービスのサーバーへの負荷攻撃。</li>
              <li>本サービスが公開するデータのコピー、スクレイピング、その他バルク形式による二次配布行為。</li>
              <li>他のユーザーのアカウントを不正に利用または共有する行為。</li>
              <li>本サービスの運営を妨害するおそれのある一切の行為。</li>
            </ul>
          </div>

          <div id="art6" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">第6条（退会・利用停止）</h3>
            <p className="text-xs">
              ユーザーは，当社所定の手続きを経て，いつでも任意に会員登録を解除できるものとします。
            </p>
            <p className="text-xs">
              当社は，ユーザーが本規約のいずれかの条項に違反した場合，事前通知することなく直ちにアカウントの利用停止または強制退会の措置を取ることができるものとします。
            </p>
          </div>

          <div id="art7" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">第7条（免責事項）</h3>
            <p className="text-xs">
              当社は，本サービスで提供するすべての情報（企業基本情報、連絡先、財務情報、営業活動シグナル等）の真実性、正確性、完全性、最新性について、明示または黙示を問わずいかなる保証も行わないものとします。
            </p>
            <p className="text-xs">
              本サービスの利用に関して発生したユーザーの損害（PCの障害、営業活動上の損失、金銭的トラブル等）について、当社は一切の責任を負わないものとします。
            </p>
          </div>

          <div id="art8" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">第8条（準拠法・裁判管轄）</h3>
            <p className="text-xs">
              本規約の解釈にあたっては，日本法を準拠法とします。本サービスに関して紛争が生じた場合には，当社（TQC株式会社）の本店所在地を管轄する東京地方裁判所を専属的合意管轄とします。
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">運営事業者に関する表示</h3>
            <p className="font-semibold text-slate-800 dark:text-slate-200">運営会社：TQC株式会社 (TQC Corporation)</p>
            <p>所在地：〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F</p>
            <p>代表連絡先：(03) 6907-1219 / FAX (03) 6701-2399</p>
            <p>メールアドレス：info@kigyoulist.com</p>
            <p>ウェブサイト：https://kigyoulist.com</p>
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </div>
  );
}
