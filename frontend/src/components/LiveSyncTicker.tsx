"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { LiveSyncFeed, LiveSyncItem } from "@/lib/db";

interface LiveSyncTickerProps {
  initialFeed: LiveSyncFeed;
  locale: string;
  className?: string;
}

export function LiveSyncTicker({
  initialFeed,
  locale,
  className = "",
}: LiveSyncTickerProps) {
  const [feed, setFeed] = useState<LiveSyncFeed>(initialFeed);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const items = feed?.items || [];

  // Auto-rotate ticker item every 5s unless hovered
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length, isPaused]);

  // Background refresh every 60s when tab is visible
  useEffect(() => {
    const interval = setInterval(async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      try {
        const res = await fetch("/api/companies/live-updates");
        if (!res.ok) return;
        const fresh: LiveSyncFeed = await res.json();
        if (fresh?.items?.length > 0) {
          setFeed(fresh);
        }
      } catch {
        // Silent fallback to existing feed
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!items.length) return null;

  const currentItem: LiveSyncItem = items[activeIndex % items.length];
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const eventLabel = isJa
    ? currentItem.event_label_ja
    : isVi
    ? currentItem.event_label_vi
    : currentItem.event_label_en;

  const syncText = isJa
    ? "リアルタイム同期中"
    : isVi
    ? "Đồng bộ thời gian thực"
    : "Live Sync";

  const countText = isJa
    ? `24時間以内の更新 ${feed.today_count.toLocaleString("ja-JP")}社`
    : isVi
    ? `Cập nhật 24h qua: ${feed.today_count.toLocaleString("vi-VN")} DN`
    : `${feed.today_count.toLocaleString("en-US")} updated (24h)`;

  const hubLinkText = isJa
    ? "変動速報一覧"
    : isVi
    ? "Tin biến động"
    : "Updates Hub";

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <div
      className={`w-full rounded-lg border border-slate-200/90 bg-slate-50/90 dark:border-slate-800 dark:bg-[#151B22] px-3 py-2 text-xs text-slate-700 dark:text-slate-300 transition-colors ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label={syncText}
    >
      <div className="flex flex-col gap-1.5">
        {/* Row 1: Live Sync Indicator & Controls / SEO Hub Link */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Live Sync Indicator & Count */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{syncText}</span>
            </span>
            {feed.today_count > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700 shrink-0">|</span>
                <span className="font-medium text-slate-500 dark:text-slate-400 tabular-nums truncate">
                  {countText}
                </span>
              </>
            )}
          </div>

          {/* Right: Controls & SEO Hub Link */}
          <div className="flex items-center gap-2 shrink-0">
            {items.length > 1 && (
              <div className="hidden sm:inline-flex items-center gap-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800/80 p-0.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-0.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded cursor-pointer transition-colors"
                  aria-label="Previous update"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-0.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded cursor-pointer transition-colors"
                  aria-label="Next update"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <Link
              href={`/${locale}/changes`}
              className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline whitespace-nowrap"
            >
              <span>{hubLinkText}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Row 2: Active Company Update Link (Full width so company name is never truncated away) */}
        <div className="w-full min-w-0 flex items-center gap-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800/70">
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-medium bg-white text-[#1B4F8A] border border-slate-200/90 dark:bg-slate-800 dark:text-blue-300 dark:border-slate-700">
            {eventLabel}
          </span>
          <Link
            href={`/${locale}/company/${currentItem.corporate_number}`}
            className="font-semibold text-slate-900 dark:text-white hover:text-[#1B4F8A] dark:hover:text-blue-400 hover:underline truncate transition-colors min-w-0"
            title={currentItem.company_name}
          >
            {currentItem.company_name}
          </Link>
          {(currentItem.prefecture_name || currentItem.synced_at || currentItem.event_date) && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 shrink-0 tabular-nums ml-auto"
              title={
                currentItem.synced_at
                  ? `${isJa ? "同期" : isVi ? "Đồng bộ" : "Synced"}: ${currentItem.synced_at} JST / ${isJa ? "発生日" : isVi ? "Ngày phát sinh" : "Event"}: ${currentItem.event_date}`
                  : currentItem.event_date
              }
            >
              <span>
                (
                {[
                  currentItem.prefecture_name,
                  currentItem.synced_at
                    ? `${isJa ? "同期 " : isVi ? "Đồng bộ " : "Synced "}${currentItem.synced_at.slice(5).replace("-", "/")}`
                    : currentItem.event_date,
                ]
                  .filter(Boolean)
                  .join("・")}
                )
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
