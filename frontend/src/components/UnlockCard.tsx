"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface UnlockCardProps {
  children: React.ReactNode;
  fallbackText?: string;
  type?: "inline" | "block";
  requiredPlan?: "free" | "pro";
}

export const UnlockCard: React.FC<UnlockCardProps> = ({ 
  children, 
  fallbackText,
  type = "inline",
  requiredPlan = "free"
}) => {
  const { isLoggedIn, user, setAuthModalOpen } = useAuth();
  const { locale, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isProOrHigher = user && (user.role === 'pro' || user.role === 'business' || user.role === 'enterprise');
  const hasAccess = requiredPlan === 'pro' ? (isLoggedIn && isProOrHigher) : isLoggedIn;

  // Hydration safety: render blurred fallback initially on server & before hydration
  if (!mounted) {
    if (type === "inline") {
      return (
        <span className="blur-[5px] select-none opacity-50 relative cursor-pointer inline-flex items-center" onClick={() => setAuthModalOpen(true)}>
          {fallbackText || "xxxxxxxxxxxxxxxxxx"}
          <span className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
          </span>
        </span>
      );
    } else {
      return (
        <div className="relative p-5 rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-850 dark:border-slate-800 overflow-hidden cursor-pointer" onClick={() => setAuthModalOpen(true)}>
          <div className="blur-[6px] select-none opacity-30">
            {children}
          </div>
          <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-medium px-3 py-1.5 rounded-lg border border-amber-200/50 flex items-center gap-1 shadow-sm dark:bg-amber-955/80 dark:text-amber-300 dark:border-amber-900/50">
              <Lock className="w-3.5 h-3.5" />
              {requiredPlan === "pro" ? "Pro version required" : "Free registration required"}
            </span>
          </div>
        </div>
      );
    }
  }

  // If has access, show real contents beautifully!
  if (hasAccess) {
    return <>{children}</>;
  }

  const handleUnlockClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      setAuthModalOpen(true);
    } else if (requiredPlan === "pro" && !isProOrHigher) {
      router.push(`/${locale}/pricing`);
    }
  };

  // If restricted, show blurred contents with unlock trigger
  if (type === "inline") {
    return (
      <span 
        onClick={handleUnlockClick}
        className="group relative inline-flex items-center cursor-pointer select-none mx-1"
        title={isLoggedIn && requiredPlan === "pro" ? t.auth.unlockCardInlineProLock : t.auth.unlockCardInlineLock}
      >
        <span className="blur-[4.5px] group-hover:blur-[1.8px] transition-all duration-300 font-mono text-slate-400 dark:text-slate-500 font-semibold tracking-tight">
          {fallbackText || "info@example.co.jp"}
        </span>
        <span className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-955/40 border border-amber-250 dark:border-amber-900/50 flex items-center justify-center opacity-90 group-hover:scale-110 group-hover:bg-amber-100 group-hover:border-amber-300 dark:group-hover:bg-amber-900/60 transition-all duration-300 shadow-sm">
          <Lock className="w-2.5 h-2.5 text-amber-550 group-hover:rotate-12 transition-transform duration-300" />
        </span>
      </span>
    );
  }

  // Block level blur (for Signal details, shareholder list, financial sheets, etc.)
  return (
    <div 
      onClick={handleUnlockClick}
      className="group relative rounded-2xl border border-slate-150 bg-slate-50/50 dark:bg-[#151B22]/50 dark:border-slate-800/80 overflow-hidden cursor-pointer transition-all duration-300 hover:border-amber-300 dark:hover:border-amber-900/50 hover:shadow-lg hover:shadow-slate-100/10 dark:hover:shadow-none"
    >
      <div className="blur-[6px] group-hover:blur-[2.5px] transition-all duration-500 p-5 select-none opacity-30 group-hover:opacity-40">
        {children}
      </div>
      
      {/* Locked Overlay Card with Glassmorphic Premium Style */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/85 to-white/95 dark:from-[#0D1117]/70 dark:via-[#0D1117]/85 dark:to-[#0D1117]/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
        <div className="relative mb-3.5 flex items-center justify-center">
          {/* Outer glowing pulsing ring */}
          <span className="absolute inline-flex h-12 w-12 rounded-full bg-amber-400/25 dark:bg-amber-400/15 animate-ping"></span>
          <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 to-amber-550 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:from-amber-450 group-hover:to-amber-600 transition-all duration-300 border border-white/20">
            <Lock className="w-5 h-5 group-hover:rotate-6 transition-transform duration-300" />
          </div>
        </div>
        
        <h4 className="text-xs sm:text-sm font-bold text-slate-850 dark:text-white mb-2 flex items-center gap-1.5 tracking-tight">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-550/40 animate-pulse" />
          {requiredPlan === "pro" ? t.auth.unlockCardProTitle : t.auth.unlockCardFreeTitle}
        </h4>
        
        <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[320px] leading-relaxed mb-4">
          {fallbackText || (requiredPlan === "pro" ? t.auth.unlockCardProDesc : t.auth.unlockCardFreeDesc)}
        </p>
        
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary via-primary-hover to-secondary text-white text-[11px] font-bold shadow-sm hover:shadow-md group-hover:scale-105 group-hover:shadow-primary/10 transition-all duration-300 select-none">
          {requiredPlan === "pro" ? t.auth.unlockCardProBtn : t.auth.unlockCardFreeBtn}
        </span>
      </div>
    </div>
  );
};
