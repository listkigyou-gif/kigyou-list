"use client";

import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, Briefcase, DollarSign, Award, Lightbulb, FileText, Calendar
} from 'lucide-react';
import { UnlockCard } from './UnlockCard';
import { BusinessSignal } from '@/lib/db';

interface CompanySignalsTimelineProps {
  signals: BusinessSignal[];
}

const keyLabels: Record<string, string> = {
  wages: "賃金",
  work_location: "就業場所",
  holidays: "休日",
  job_description: "仕事内容",
  required_experience: "必要な経験等",
};

export const CompanySignalsTimeline: React.FC<CompanySignalsTimelineProps> = ({ signals }) => {
  // Group signals by type
  const groupedSignals: Record<string, BusinessSignal[]> = {};
  signals.forEach(sig => {
    const type = sig.signal_type || "その他";
    if (!groupedSignals[type]) {
      groupedSignals[type] = [];
    }
    groupedSignals[type].push(sig);
  });

  // State to track expanded status of each group
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (type: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getGroupMetadata = (type: string) => {
    switch (type) {
      case '求人あり':
        return {
          title: "求人情報 (Hiring)",
          iconColor: "bg-emerald-500 text-white",
          IconComponent: Briefcase,
        };
      case '補助金受給':
        return {
          title: "国の補助金受給履歴 (Subsidy)",
          iconColor: "bg-orange-500 text-white",
          IconComponent: DollarSign,
        };
      case '調達案件':
        return {
          title: "公共機関の入札落札実績 (Bidding)",
          iconColor: "bg-blue-500 text-white",
          IconComponent: DollarSign,
        };
      case '表彰':
        return {
          title: "表彰受賞実績 (Awards)",
          iconColor: "bg-rose-500 text-white",
          IconComponent: Award,
        };
      case '届出認定':
        return {
          title: "行政の届出認定 (Certifications)",
          iconColor: "bg-teal-500 text-white",
          IconComponent: Award,
        };
      case '特許':
        return {
          title: "特許・商標の保有 (Patents/Trademarks)",
          iconColor: "bg-amber-500 text-white",
          IconComponent: Lightbulb,
        };
      default:
        return {
          title: `${type}情報`,
          iconColor: "bg-slate-500 text-white",
          IconComponent: FileText,
        };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groupedSignals).map(([type, list]) => {
        const isExpanded = !!expandedGroups[type];
        const meta = getGroupMetadata(type);
        const Icon = meta.IconComponent;

        return (
          <div 
            key={type} 
            className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1C2128]/25 shadow-sm transition-all"
          >
            {/* Group Header (Accordion Toggle) */}
            <button
              onClick={() => toggleGroup(type)}
              className="w-full px-5 py-4 flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/10 dark:hover:bg-slate-850/30 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${meta.iconColor} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-850 dark:text-white text-sm sm:text-base leading-tight">
                    {meta.title}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    登録件数: {list.length}件
                  </span>
                </div>
              </div>
              <div className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {/* Group Content */}
            {isExpanded && (
              <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1C2128]/5">
                <div className="relative border-l-2 border-dashed border-slate-200 dark:border-slate-800/80 ml-4 pl-6 flex flex-col gap-8">
                  {list.map((sig) => {
                    const isPatent = sig.signal_type === '特許';
                    return (
                      <div key={sig.id} className="relative group">
                        {/* Timeline double-ring circle with icon */}
                        <div className={`absolute -left-9 w-6 h-6 rounded-full ${meta.iconColor} flex items-center justify-center shadow-md border-2 border-white dark:border-[#1C2128] group-hover:scale-110 transition-transform duration-300 z-10`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        {/* Title and Date */}
                        <div className="flex flex-col gap-1 mb-2">
                          <span className="text-[10px] font-black text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {sig.signal_date || '日付未登録'}
                          </span>
                          <h4 className="font-extrabold text-slate-850 dark:text-white text-sm tracking-tight flex items-center gap-2">
                            {sig.signal_title}
                          </h4>
                        </div>

                        {/* Details (BLURRED VIA UNLOCKCARD) */}
                        {sig.details && (
                          <div className="flex flex-col gap-1 max-w-2xl">
                            <span className="text-[9px] font-bold text-slate-400 block mb-0.5">シグナル詳細内容 🔑</span>
                            <UnlockCard type="block" fallbackText={isPatent ? "特許の番号や詳細な登録情報、公開日、FIコード等がここに表示されます。" : "求人の詳細な募集要項、助成金の受給理由や調達内容がここに表示されます。"}>
                              <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                {(() => {
                                  if (isPatent) {
                                    try {
                                      const parsed = JSON.parse(sig.details);
                                      const patentType = parsed.patent_type || "特許";
                                      const regNum = parsed.registration_number || "";
                                      const title = sig.signal_title || "";
                                      return `${patentType}: ${regNum} - ${title}`;
                                    } catch {
                                      return sig.details;
                                    }
                                  }

                                  // Parse and format other JSON signals (excluding raw_industry and job_number)
                                  try {
                                    const parsed = JSON.parse(sig.details);
                                    if (typeof parsed === 'object' && parsed !== null) {
                                      const filteredEntries = Object.entries(parsed).filter(
                                        ([key]) => key !== 'raw_industry' && key !== 'job_number'
                                      );
                                      if (filteredEntries.length === 0) return null;
                                      return (
                                        <div className="flex flex-col gap-1.5 mt-1">
                                          {filteredEntries.map(([key, value]) => {
                                            const label = keyLabels[key] || key;
                                            return (
                                              <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1">
                                                <span className="font-bold text-slate-400 dark:text-slate-500 min-w-[80px] shrink-0 text-[10px]">{label}:</span>
                                                <span className="text-slate-700 dark:text-slate-300 text-xs whitespace-pre-wrap">{String(value)}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    }
                                  } catch {
                                    // Not JSON
                                  }
                                  return sig.details;
                                })()}
                              </div>
                            </UnlockCard>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
