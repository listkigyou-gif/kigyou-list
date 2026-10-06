"use client";

import React, { useState, useEffect } from "react";
import { Flame, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const CountdownTimer: React.FC = () => {
  const { locale } = useLanguage();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);
  const [currentMonthName, setCurrentMonthName] = useState("");

  const calculateTimeLeft = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    
    // Set current month name
    if (locale === "vi") {
      setCurrentMonthName(`Tháng ${month + 1}`);
    } else if (locale === "en") {
      const monthsEn = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      setCurrentMonthName(monthsEn[month]);
    } else {
      setCurrentMonthName(`${month + 1}月`);
    }

    const difference = endOfMonth.getTime() - now.getTime();

    if (difference <= 0) {
      const nextMonthEnd = new Date(year, month + 2, 0, 23, 59, 59);
      const diffNext = nextMonthEnd.getTime() - now.getTime();
      return {
        days: Math.floor(diffNext / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diffNext / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diffNext / 1000 / 60) % 60),
        seconds: Math.floor((diffNext / 1000) % 60),
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [locale]); // Recalculate if locale changes

  const d = locale === "vi" ? {
    calculating: "Đang tính toán thời gian kết thúc...",
    limitedOffer: `Ưu đãi giới hạn ${currentMonthName}`,
    discount: "Giảm tới 30%",
    hurry: "Nhanh lên, chương trình giảm giá sắp kết thúc!",
  } : locale === "en" ? {
    calculating: "Calculating campaign end time...",
    limitedOffer: `${currentMonthName} Limited Offer`,
    discount: "Up to 30% OFF",
    hurry: "Hurry, campaign pricing ends soon!",
  } : {
    calculating: "キャンペーン期間計算中...",
    limitedOffer: `${currentMonthName}限定特別枠`,
    discount: "最大30%OFF",
    hurry: "今期キャンペーン価格の適用終了まで、残り時間わずかです！",
  };

  if (!mounted) {
    return (
      <div className="w-full py-3 bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        <span className="text-xs text-rose-500 dark:text-rose-400 font-bold">
          {d.calculating}
        </span>
      </div>
    );
  }

  const formatNum = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="relative overflow-hidden w-full p-4 sm:p-5 bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
      {/* Campaign Intro Message */}
      <div className="flex items-center gap-3 relative shrink-0">
        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-center shrink-0">
          <Flame className="w-4.5 h-4.5" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-900/40 uppercase tracking-wider">
              {d.limitedOffer}
            </span>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              {d.discount}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 tracking-tight leading-snug">
            {d.hurry}
          </h4>
        </div>
      </div>

      {/* Countdown Grid */}
      <div className="flex items-center gap-2 relative justify-start md:justify-end shrink-0">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="min-w-[42px] sm:min-w-[48px] h-10 sm:h-11 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center">
            <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
              {formatNum(timeLeft.days)}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-1">DAYS</span>
        </div>
        
        <span className="text-xs font-bold text-slate-300 dark:text-slate-700 select-none pb-3 font-mono">:</span>

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="min-w-[42px] sm:min-w-[48px] h-10 sm:h-11 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center">
            <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
              {formatNum(timeLeft.hours)}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-1">HOURS</span>
        </div>

        <span className="text-xs font-bold text-slate-300 dark:text-slate-700 select-none pb-3 font-mono">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="min-w-[42px] sm:min-w-[48px] h-10 sm:h-11 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center">
            <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
              {formatNum(timeLeft.minutes)}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-1">MINUTES</span>
        </div>

        <span className="text-xs font-bold text-slate-300 dark:text-slate-700 select-none pb-3 font-mono">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="min-w-[42px] sm:min-w-[48px] h-10 sm:h-11 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-center">
            <span className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tight">
              {formatNum(timeLeft.seconds)}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-1">SECONDS</span>
        </div>
      </div>
    </div>
  );
};
