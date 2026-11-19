import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass } from "lucide-react";
import type { GuideArticle } from "@/lib/guides";

interface GuideSectionsRendererProps {
  article: GuideArticle;
  locale: string;
}

function buildLocalizedHref(locale: string, path: string): string {
  if (/^\/(ja|en|vi)(\/|$)/.test(path) || path.startsWith("http")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

export function GuideSectionsRenderer({ article, locale }: GuideSectionsRendererProps) {
  const sections = article.sections || [];
  if (sections.length === 0) {
    return <p>コンテンツを準備中です。</p>;
  }

  return (
    <div className="space-y-9">
      {sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
            {section.title}
          </h2>

          <div className="space-y-4">
            {section.paragraphs.map((para, pIdx) => (
              <p
                key={pIdx}
                className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base"
              >
                {para}
              </p>
            ))}
          </div>

          {section.bullets && section.bullets.length > 0 && (
            <ul className="mt-4 space-y-2.5 pl-1">
              {section.bullets.map((b, bIdx) => (
                <li
                  key={bIdx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900 dark:text-white">{b.label}:</strong>{" "}
                    {b.text}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {section.table && (
            <div className="my-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                    {section.table.headers.map((header, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-2.5 font-bold whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {section.table.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-3.5 py-2.5 align-top ${
                            cIdx === 0
                              ? "font-semibold text-slate-900 dark:text-white"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section.hubLinks && section.hubLinks.length > 0 && (
            <div className="my-5">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>関連企業データベース・直接アクセスハブ</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.hubLinks.map((hub, hIdx) => (
                  <Link
                    key={hIdx}
                    href={buildLocalizedHref(locale, hub.href)}
                    className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 hover:border-[#1B4F8A] dark:hover:border-blue-400 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {hub.badge && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 mb-1.5">
                          {hub.badge}
                        </span>
                      )}
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors flex items-center justify-between gap-2">
                        <span>{hub.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-[#1B4F8A] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      {hub.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          {hub.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {section.callout && (
            <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
                  {section.callout.title}
                </strong>
                {section.callout.body}
              </div>
              <Link
                href={buildLocalizedHref(locale, section.callout.href)}
                className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
              >
                {section.callout.buttonText}
              </Link>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
