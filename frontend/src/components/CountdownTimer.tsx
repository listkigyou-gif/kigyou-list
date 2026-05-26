"use client";

import React, { useState, useEffect } from "react";
import { Flame, Sparkles } from "lucide-react";

export const CountdownTimer: React.FC = () => {
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
    // End of the current month: Year, Month + 1, Day 0 (last day), 23:59:59
    const year = now.getFullYear();
    const month = now.getMonth();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    
    // Set current month name (e.g. "5月")
    setCurrentMonthName(`${month + 1}月`);

    const difference = endOfMonth.getTime() - now.getTime();

    if (difference <= 0) {
      // If past the current month end (just rolled over), target the next month's end
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
  }, []);

  if (!mounted) {
    return (
      <div className="w-full py-3 bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        <span className="text-xs text-rose-500 dark:text-rose-400 font-bold">キャンペーン期間計算中...</span>
      </div>
    );
  }

  // Double digit helper
  const formatNum = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="relative overflow-hidden w-full py-4.5 px-6 bg-gradient-to-r from-slate-900/95 via-rose-950/80 to-slate-900/95 border border-rose-500/20 rounded-3xl shadow-xl shadow-rose-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(244,63,94,0.1),transparent_40%)] pointer-events-none" />
      
      {/* Campaign Intro Message */}
      <div className="flex items-center gap-3 relative shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 text-white shrink-0 animate-pulse">
          <Flame className="w-5 h-5 fill-rose-100/10" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 uppercase tracking-wider">
              {currentMonthName}限定特別枠
            </span>
            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-wider flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 animate-spin-slow" />
              最大30%OFF
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-black text-white mt-1 tracking-tight leading-relaxed">
            今期キャンペーン価格の適用終了まで、残り時間わずかです！
          </h4>
        </div>
      </div>

      {/* Countdown Grid (Glassmorphism look) */}
      <div className="flex items-center gap-2 relative justify-start md:justify-end shrink-0">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="min-w-[40px] sm:min-w-[46px] h-10 sm:h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
            <span className="text-sm sm:text-base font-black text-rose-450 font-mono tracking-tight text-white">
              {formatNum(timeLeft.days)}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-1">DAYS</span>
        </div>
        
        <span className="text-sm font-black text-slate-500 select-none pb-4 font-mono">:</span>

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="min-w-[40px] sm:min-w-[46px] h-10 sm:h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
            <span className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
              {formatNum(timeLeft.hours)}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-1">HOURS</span>
        </div>

        <span className="text-sm font-black text-slate-500 select-none pb-4 font-mono">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="min-w-[40px] sm:min-w-[46px] h-10 sm:h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
            <span className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
              {formatNum(timeLeft.minutes)}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-1">MINUTES</span>
        </div>

        <span className="text-sm font-black text-slate-500 select-none pb-4 font-mono">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="min-w-[40px] sm:min-w-[46px] h-10 sm:h-12 bg-rose-500/10 border border-rose-500/35 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden group">
            <span className="text-sm sm:text-base font-black text-rose-450 font-mono tracking-tight text-rose-450 dark:text-rose-400 animate-pulse">
              {formatNum(timeLeft.seconds)}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-1">SECONDS</span>
        </div>
      </div>
    </div>
  );
};
