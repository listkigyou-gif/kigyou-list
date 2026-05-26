import React from "react";
import { Header } from "@/components/Header";
import { ShieldCheck, ChevronRight } from "lucide-react";

export const metadata = {
  title: "プライバシーポリシー | Kigyou-list",
  description: "Kigyou-list（企業リスト）のプライバシーポリシーです。個人情報の取扱基準およびオプトアウト申請について記載しています。",
};

export default function PrivacyPage() {
  const sections = [
    { id: "sec1", title: "1. 個人情報の取得" },
    { id: "sec2", title: "2. 利用目的" },
    { id: "sec3", title: "3. 第三者提供の制限" },
    { id: "sec4", title: "4. 安全管理措置" },
    { id: "sec5", title: "5. オプトアウト申請" },
    { id: "sec6", title: "6. お問い合わせ窓口" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
        {/* Left Navigation Sidebar (Desktop only) */}
        <aside className="hidden md:block w-64 shrink-0 h-[fit-content] sticky top-20 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            目次 (プライバシー)
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
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                プライバシーポリシー
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                最終改訂日: 2026年5月20日
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Kigyou-list（以下，「当サービス」といいます。）は，本ウェブサイト上で提供するサービス（以下,「本サービス」といいます。）における，ユーザーの個人情報の取扱いについて，以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。当サービスは個人情報の保護に関する法律（以下「個人情報保護法」といいます）を遵守します。
          </p>

          <div id="sec1" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">1. 個人情報の取得</h3>
            <p className="text-xs">
              当サービスは、本サービスの利用登録時において、ユーザーの氏名、メールアドレス等の個人情報を適法かつ適切な手段によって取得いたします。
            </p>
            <p className="text-xs">
              また、本サービスが提供するデータベース内の企業情報は、Webクローリング等の技術を使用し、一般に公表されているウェブサイトおよび登記情報、公的公開データから収集しており、個人のプライバシー情報を不当に侵害する取得は行いません。
            </p>
          </div>

          <div id="sec2" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">2. 個人情報の利用目的</h3>
            <p className="text-xs">
              取得したユーザー情報は、以下の目的のためにのみ利用いたします。
            </p>
            <ul className="list-disc pl-5 text-xs flex flex-col gap-1 text-slate-500 dark:text-slate-400">
              <li>本サービスの維持・管理および本人確認・不正アクセスの防止。</li>
              <li>PROプラン（有料版）のご案内、請求処理、および決済処理。</li>
              <li>重要なお知らせやメンテナンス情報の配信、お問い合わせ対応。</li>
            </ul>
          </div>

          <div id="sec3" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">3. 個人情報の第三者提供の制限</h3>
            <p className="text-xs">
              当サービスは，次に掲げる場合を除いて，あらかじめユーザーの同意を得ることなく，第三者に個人情報を提供することはありません。
            </p>
            <ul className="list-disc pl-5 text-xs flex flex-col gap-1 text-slate-500 dark:text-slate-400">
              <li>人の生命，身体または財産の保護のために必要がある場合であって，本人の同意を得ることが困難であるとき。</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が，法令の定める事務を遂行することに対して協力する必要があるとき。</li>
              <li>決済代行会社など、決済事務の処理を委託する場合（適切な監督を実施します）。</li>
            </ul>
          </div>

          <div id="sec4" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">4. 安全管理措置</h3>
            <p className="text-xs">
              当サービスは，個人情報への不正アクセス，紛失，破壊，改ざんおよび漏洩を防止するため，パスワードのハッシュ化、SSL通信によるデータの暗号化、セキュリティパッチの適用など、適切な安全対策を講じます。
            </p>
          </div>

          <div id="sec5" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">5. 企業データのオプトアウト申請（情報掲載の停止手続き）</h3>
            <p className="text-xs">
              当サービスの企業データベースは、一般公開情報に基づいてクローリングを行っております。掲載されている企業情報の削除またはオプトアウトを希望される企業オーナー様は、当サービスのお問い合わせフォームより申請していただくことができます。
            </p>
            <p className="text-xs">
              申請受領後、ご本人様（代表者または情報管理責任者）であることを確認の上、速やかに掲載の削除または非公開化の処理を実行いたします。
            </p>
          </div>

          <div id="sec6" className="flex flex-col gap-2 pt-4 border-t border-slate-100/50 dark:border-slate-800/30">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">6. 個人情報に関するお問い合わせ窓口</h3>
            <p className="text-xs">
              個人情報の取扱いに関するご質問、苦情の申し立て、またはデータの開示・訂正・オプトアウトの申請は、当サービスのお問い合わせページよりご連絡いただきますようお願いいたします。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
