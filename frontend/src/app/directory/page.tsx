import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getPrefecturesWithCounts, getIndustriesHierarchy } from "@/lib/db";
import { MapPin, Briefcase, ChevronRight, Compass } from "lucide-react";

export const revalidate = 0; // Dynamic directory hub page, do not cache static

// Standard Japanese 8 regions
const REGIONS = [
  {
    name: "北海道・東北",
    prefectures: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  },
  {
    name: "関東",
    prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  },
  {
    name: "中部",
    prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  },
  {
    name: "近畿",
    prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  },
  {
    name: "中国",
    prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  },
  {
    name: "四国",
    prefectures: ["徳島県", "香川県", "愛媛県", "高知県"],
  },
  {
    name: "九州・沖縄",
    prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
  },
];

export const metadata = {
  title: "日本全国の企業データ一覧・カテゴリ別検索 | Kigyou-list",
  description:
    "日本全国47都道府県および全19種類のJSIC産業分類から企業データベースを検索できます。最新の会社情報、電話番号、財務指標、営業シグナル情報が豊富に収録されています。",
};

export default async function DirectoryPage() {
  const prefectures = await getPrefecturesWithCounts();

  // node:sqlite → null prototype → convert to plain objects
  const hierarchy: {
    code: string;
    name: string;
    totalCount: number;
    children: { code: string; name: string; count: number }[];
  }[] = JSON.parse(JSON.stringify(await getIndustriesHierarchy()));

  // Filter out 大分類 with 0 companies (no data yet) and sort alphabetically A->B->C...
  const activeHierarchy = hierarchy
    .filter((maj) => maj.totalCount > 0)
    .sort((a, b) => a.code.localeCompare(b.code));

  // Double check that children inside each major are sorted numerically 1-2-3...
  activeHierarchy.forEach((major) => {
    major.children.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));
  });

  // Map database prefectures by name for quick lookup
  const prefMap = new Map(prefectures.map((p) => [p.name, p]));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
        {/* Page Hero Banner */}
        <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-8 shadow-sm relative overflow-hidden text-center md:text-left">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/4 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
            <div className="flex flex-col gap-2.5 max-w-xl">
              <span className="text-[10px] font-bold text-primary dark:text-secondary uppercase tracking-wider block">
                SITEMAP INDEX &amp; DIRECTORY
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                企業データ一覧・カテゴリ検索
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                47都道府県の地域別およびJSIC標準産業大分類別に、登録企業を整理したディレクトリハブです。
                Google Botのインデックス化を促進し、ご希望のエリア・業界の企業データに素早くアクセスできます。
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl">
              <Compass className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-left text-[11px]">
                <strong className="text-amber-800 dark:text-amber-400 block font-bold">SEO内部リンク対応</strong>
                <span className="text-slate-500 dark:text-slate-400">PageRankを最適配分しています。</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT 2 COLUMNS: Regional Directory */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                地域別・都道府県から探す
              </h2>

              <div className="flex flex-col gap-6">
                {REGIONS.map((region) => {
                  const regionPrefs = region.prefectures
                    .map((pName) => prefMap.get(pName))
                    .filter((p): p is { code: string; name: string; count: number } => !!p);

                  if (regionPrefs.length === 0) return null;

                  return (
                    <div
                      key={region.name}
                      className="p-4 bg-slate-50 dark:bg-slate-800/10 rounded-2xl border border-slate-100 dark:border-slate-800/60"
                    >
                      <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                        {region.name}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {regionPrefs.map((pref) => (
                          <Link
                            key={pref.code}
                            href={`/search?prefecture=${pref.code}`}
                            className="p-2 bg-white dark:bg-[#151B22] border border-slate-200/60 dark:border-slate-800 hover:border-primary dark:hover:border-secondary rounded-xl text-left transition-all hover:shadow-sm flex items-center justify-between group"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-secondary truncate">
                                {pref.name}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                {pref.count}社
                              </span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT 1 COLUMN: JSIC Hierarchy Directory */}
          <div className="flex flex-col gap-8">
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                業界別・JSIC分類から探す
              </h2>

              <div className="flex flex-col gap-3">
                {activeHierarchy.map((major) => (
                  <div
                    key={major.code}
                    className="rounded-2xl border border-slate-150 dark:border-slate-800/80 overflow-hidden"
                  >
                    {/* 大分類 header — links to all companies in this major category */}
                    <Link
                      href={`/search?industry=${major.code}`}
                      className="flex items-center justify-between gap-2 px-3.5 py-3 bg-primary/5 hover:bg-primary/10 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* 大分類 code badge */}
                        <div className="w-7 h-7 rounded-lg bg-primary text-white shrink-0 flex items-center justify-center shadow-sm">
                          <span className="text-[11px] font-black">{major.code}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-primary dark:group-hover:text-secondary truncate leading-tight">
                            {major.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            計 {major.totalCount.toLocaleString()}社
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-primary/60 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    {/* 中分類 children — only show those with companies */}
                    {major.children.filter((c) => c.count > 0).length > 0 && (
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#151B22]">
                        {major.children
                          .filter((child) => child.count > 0)
                          .map((child) => (
                            <Link
                              key={child.code}
                              href={`/search?industry=${child.code}`}
                              className="flex items-center justify-between gap-2 pl-9 pr-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {/* 中分類 code badge — smaller, secondary style */}
                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono shrink-0">
                                  {child.code}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-secondary truncate">
                                  {child.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {child.count}社
                              </span>
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
