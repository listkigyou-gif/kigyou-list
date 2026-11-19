"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface HubMonthOption {
  year_month: string;
  count: number;
}

interface HubQuickToolbarProps {
  locale: string;
  basePath: string;
  currentYearMonth?: string;
  availableMonths: HubMonthOption[];
  totalCount: number;
  searchPlaceholder?: string;
}

function formatMonthLabel(ym: string, isJa: boolean): string {
  if (ym.length === 4) {
    return isJa ? `${ym}年` : ym;
  }
  const [year, month] = ym.split("-");
  if (!year || !month) return ym;
  const monthNum = parseInt(month, 10);
  return isJa ? `${year}年${monthNum}月` : ym;
}

export default function HubQuickToolbar({
  locale,
  basePath,
  currentYearMonth,
  availableMonths,
  totalCount,
  searchPlaceholder,
}: HubQuickToolbarProps) {
  const isJa = locale === "ja";
  const router = useRouter();
  const { savedCompanies, watchlistLimit } = useAuth();
  const [query, setQuery] = useState("");
  const [filteredVisibleCount, setFilteredVisibleCount] = useState<number | null>(null);

  useEffect(() => {
    const container = document.getElementById("hub-events-list");
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>("[data-hub-item]");
    const q = query.trim().toLowerCase();

    if (!q) {
      items.forEach((el) => {
        el.classList.remove("hidden");
      });
      setFilteredVisibleCount(null);
      return;
    }

    let visible = 0;
    items.forEach((el) => {
      const haystack = (el.getAttribute("data-hub-item") || "").toLowerCase();
      if (haystack.includes(q)) {
        el.classList.remove("hidden");
        visible += 1;
      } else {
        el.classList.add("hidden");
      }
    });
    setFilteredVisibleCount(visible);

    return () => {
      items.forEach((el) => el.classList.remove("hidden"));
    };
  }, [query]);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push(`/${locale}/search`);
      return;
    }
    if (/^\d{13}$/.test(trimmed)) {
      router.push(`/${locale}/company/${trimmed}`);
      return;
    }
    router.push(`/${locale}/search?q=${encodeURIComponent(trimmed)}`);
  };

  const monthChips = availableMonths.slice(0, 6);
  const hasCurrentInChips =
    !currentYearMonth || monthChips.some((m) => m.year_month === currentYearMonth);

  return (
    <div className="mb-6 space-y-3">
      {/* Compact 1-Line Watchlist Callout Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-md bg-[#F0F4F9] dark:bg-[#151B22] border border-[#1B4F8A]/20 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Bell className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-[#60A5FA] shrink-0" />
          <span>
            {isJa
              ? "取引先・競合の解散・移転・商号変更を自動で検知できます（10社まで無料）"
              : "Auto-detect partner dissolutions, relocations & name changes — up to 10 companies free."}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {savedCompanies.length > 0 && (
            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
              {isJa ? "登録中" : "Saved"}: {savedCompanies.length}
              {Number.isFinite(watchlistLimit) ? ` / ${watchlistLimit}` : ""}
            </span>
          )}
          <Link
            href={`/${locale}/watchlist`}
            className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-[#60A5FA] hover:underline"
          >
            <span>{isJa ? "企業監視・検知を開く" : "Open Watchlist"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-md p-3.5 space-y-3">
        {/* Search Input Row */}
        <form onSubmit={handleGlobalSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchPlaceholder ||
                (isJa
                  ? "ページ内を絞り込み、または法人番号(13桁)・企業名で560万社から照会..."
                  : "Filter list or search 5.6M companies by name or 13-digit Corp No...")
              }
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1B4F8A] dark:focus:border-[#60A5FA]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={isJa ? "検索条件をクリア" : "Clear filter"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-[#1B4F8A] hover:bg-[#163F70] text-white text-xs font-medium transition-colors shrink-0"
          >
            <span>
              {query.trim()
                ? isJa
                  ? "全560万社から照会"
                  : "Search All 5.6M"
                : isJa
                  ? "詳細検索へ"
                  : "Full Search"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Filtered feedback */}
        {filteredVisibleCount !== null && (
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="tabular-nums">
              {isJa
                ? `表示中のリスト内で「${query.trim()}」に一致: ${filteredVisibleCount}件`
                : `Matching "${query.trim()}" on this page: ${filteredVisibleCount}`}
            </span>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[#1B4F8A] dark:text-[#60A5FA] hover:underline"
            >
              {isJa ? "絞り込み解除" : "Reset"}
            </button>
          </div>
        )}

        {/* Month Filter Pills (Pure SEO Links) */}
        {(monthChips.length > 0 || currentYearMonth) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
              {isJa ? "時期で絞り込み:" : "Period:"}
            </span>
            <Link
              href={basePath}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors tabular-nums ${
                !currentYearMonth
                  ? "bg-[#1B4F8A] border-[#1B4F8A] text-white font-medium"
                  : "bg-[#F8FAFC] dark:bg-[#161B22] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA]"
              }`}
            >
              <span>{isJa ? "全期間" : "All"}</span>
              {!currentYearMonth && (
                <span className="opacity-85">({totalCount.toLocaleString()})</span>
              )}
            </Link>

            {!hasCurrentInChips && currentYearMonth && (
              <Link
                href={`${basePath}/${currentYearMonth}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border bg-[#1B4F8A] border-[#1B4F8A] text-white font-medium tabular-nums"
              >
                <span>{formatMonthLabel(currentYearMonth, isJa)}</span>
              </Link>
            )}

            {monthChips.map((m) => {
              const active = currentYearMonth === m.year_month;
              return (
                <Link
                  key={m.year_month}
                  href={`${basePath}/${m.year_month}`}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors tabular-nums ${
                    active
                      ? "bg-[#1B4F8A] border-[#1B4F8A] text-white font-medium"
                      : "bg-[#F8FAFC] dark:bg-[#161B22] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA]"
                  }`}
                >
                  <span>{formatMonthLabel(m.year_month, isJa)}</span>
                  <span className={active ? "opacity-85" : "text-slate-400 dark:text-slate-500"}>
                    ({m.count.toLocaleString()})
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
