"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Newspaper, ExternalLink, ArrowRight } from "lucide-react";
import pressMediaData from "@/data/pressMedia.json";

export interface PressMediaItem {
  id: string;
  date: string;
  dateJa: string;
  source: string;
  category: "press" | "media" | "tech";
  title: string;
  url: string;
}

interface PressMediaSectionProps {
  locale?: string;
  limit?: number;
  showViewAll?: boolean;
  enableFilter?: boolean;
}

const ITEMS: PressMediaItem[] = pressMediaData as PressMediaItem[];

const CATEGORY_BADGE_STYLES: Record<PressMediaItem["category"], string> = {
  press:
    "bg-[#F0F4F9] text-[#1B4F8A] border-[#1B4F8A]/20 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50",
  media:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  tech:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
};

export const PressMediaSection: React.FC<PressMediaSectionProps> = ({
  locale = "ja",
  limit,
  showViewAll = false,
  enableFilter = false,
}) => {
  const [filter, setFilter] = useState<"all" | "press" | "media" | "tech">("all");
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const labels = {
    heading: isEn
      ? "Press Releases & Media"
      : isVi
      ? "Thông cáo báo chí & Truyền thông"
      : "プレスリリース・メディア掲載",
    subLabel: "Press & Media",
    viewAll: isEn ? "View all" : isVi ? "Xem tất cả" : "すべて見る",
    tabs: {
      all: isEn ? "All" : isVi ? "Tất cả" : "すべて",
      press: isEn ? "Press Releases" : isVi ? "Thông cáo báo chí" : "プレスリリース",
      media: isEn ? "Media & Articles" : isVi ? "Bài viết & Hồ sơ" : "メディア・解説",
      tech: isEn ? "Engineering" : isVi ? "Kỹ thuật" : "技術記事",
    },
  };

  const visibleItems = useMemo(() => {
    const filtered =
      filter === "all" ? ITEMS : ITEMS.filter((item) => item.category === filter);
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [filter, limit]);

  return (
    <section
      aria-labelledby="press-media-heading"
      className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#0D1117]/40">
        <div className="flex items-center gap-2 min-w-0">
          <Newspaper className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
          <h2
            id="press-media-heading"
            className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight"
          >
            {labels.heading}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {showViewAll ? (
            <Link
              href={`/${locale}/press`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4F8A] hover:text-[#143D6C] dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <span>{labels.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide">
              {labels.subLabel}
            </span>
          )}
        </div>
      </div>

      {/* Optional Filter Bar (for /press full page) */}
      {enableFilter && (
        <div className="px-4 py-2.5 sm:px-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5 bg-white dark:bg-[#151B22]">
          {(["all", "press", "media", "tech"] as const).map((tabKey) => {
            const active = filter === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setFilter(tabKey)}
                className={`h-8 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? "bg-[#1B4F8A] text-white dark:bg-blue-600 dark:text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80"
                }`}
              >
                {labels.tabs[tabKey]}
              </button>
            );
          })}
        </div>
      )}

      {/* List Rows */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/70">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener"
              className="group block px-4 py-3.5 sm:px-6 sm:py-4 hover:bg-[#F0F4F9]/60 dark:hover:bg-slate-800/40 transition-colors duration-150"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-4">
                {/* Date + Source Meta */}
                <div className="flex items-center gap-2 shrink-0 sm:w-52">
                  <time
                    dateTime={item.date}
                    className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums"
                  >
                    {isJaDate(locale) ? item.dateJa : item.date}
                  </time>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${CATEGORY_BADGE_STYLES[item.category]}`}
                  >
                    {item.source}
                  </span>
                </div>

                {/* Title + External Icon */}
                <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 leading-relaxed transition-colors break-words">
                    {item.title}
                  </span>
                  <ExternalLink
                    className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0 mt-1 transition-colors"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

function isJaDate(locale: string): boolean {
  return locale === "ja";
}
