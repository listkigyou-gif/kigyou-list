"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, Briefcase, DollarSign, Award, Lightbulb, FileText, Calendar
} from 'lucide-react';
import { UnlockCard } from './UnlockCard';
import { BusinessSignal } from '@/lib/db';
import { useLanguage } from '@/context/LanguageContext';

interface CompanySignalsTimelineProps {
  signals: BusinessSignal[];
}



// CSS-animated accordion panel — pre-renders content, toggles with max-height transition
// This avoids the JS re-render lag from conditional {isExpanded && (...)}
const AccordionPanel: React.FC<{ isExpanded: boolean; children: React.ReactNode }> = ({
  isExpanded,
  children,
}) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  useEffect(() => {
    if (innerRef.current) {
      setMaxHeight(isExpanded ? `${innerRef.current.scrollHeight}px` : "0px");
    }
  }, [isExpanded]);

  return (
    <div
      style={{ maxHeight, transition: "max-height 0.28s cubic-bezier(0.4,0,0.2,1)" }}
      className="overflow-hidden"
    >
      <div ref={innerRef}>
        {children}
      </div>
    </div>
  );
};

export const CompanySignalsTimeline: React.FC<CompanySignalsTimelineProps> = ({ signals }) => {
  const { locale, t } = useLanguage();
  // Group signals by type and track total counts
  const groupedSignals: Record<string, BusinessSignal[]> = {};
  const signalTotals: Record<string, number> = {};
  
  signals.forEach(sig => {
    const type = sig.signal_type || "その他";
    if (!groupedSignals[type]) {
      groupedSignals[type] = [];
    }
    groupedSignals[type].push(sig);
    if (sig.total_count !== undefined) {
      signalTotals[type] = Math.max(signalTotals[type] || 0, sig.total_count);
    }
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
          title: t.company.signalTypes.hiring,
          iconColor: "bg-emerald-500 text-white",
          IconComponent: Briefcase,
        };
      case '補助金受給':
        return {
          title: t.company.signalTypes.subsidy,
          iconColor: "bg-orange-500 text-white",
          IconComponent: DollarSign,
        };
      case '調達案件':
        return {
          title: t.company.signalTypes.bidding,
          iconColor: "bg-blue-500 text-white",
          IconComponent: DollarSign,
        };
      case '表彰':
        return {
          title: t.company.signalTypes.awards,
          iconColor: "bg-rose-500 text-white",
          IconComponent: Award,
        };
      case '届出認定':
        return {
          title: t.company.signalTypes.certifications,
          iconColor: "bg-teal-500 text-white",
          IconComponent: Award,
        };
      case '特許':
        return {
          title: t.company.signalTypes.patents,
          iconColor: "bg-amber-500 text-white",
          IconComponent: Lightbulb,
        };
      default:
        const translatedType = type === 'その他' ? (locale === 'vi' ? 'Khác' : locale === 'en' ? 'Other' : 'その他') : type;
        return {
          title: t.company.signalTypes.other.replace("{type}", translatedType),
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
        const isPatent = type === '特許';
        const totalCount = signalTotals[type] || list.length;

        return (
          <div 
            key={type} 
            className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1C2128]/25 shadow-sm"
          >
            {/* Group Header (Accordion Toggle) */}
            <button
              onClick={() => toggleGroup(type)}
              className="w-full px-5 py-4 flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/10 dark:hover:bg-slate-850/30 transition-colors focus:outline-none"
              aria-expanded={isExpanded}
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
                    {t.company.registeredCount.replace("{count}", totalCount.toLocaleString())}
                  </span>
                </div>
              </div>
              <div className={`text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>

            {/* Group Content — CSS-animated, content pre-rendered (no JS lag on toggle) */}
            <AccordionPanel isExpanded={isExpanded}>
              <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1C2128]/5">
                <UnlockCard
                  type="block"
                  fallbackText={
                    isPatent
                      ? t.company.patentDetailsPlaceholder
                      : t.company.signalDetailsPlaceholder
                  }
                >
                  <div className="relative border-l-2 border-dashed border-slate-200 dark:border-slate-800/80 ml-4 pl-6 flex flex-col gap-8">
                    {list.map((sig) => (
                      <div key={sig.id} className="relative group">
                        {/* Timeline circle with icon */}
                        <div className={`absolute -left-9 w-6 h-6 rounded-full ${meta.iconColor} flex items-center justify-center shadow-md border-2 border-white dark:border-[#1C2128] group-hover:scale-110 transition-transform duration-300 z-10`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        {/* Date */}
                        <span className="text-[10px] font-black text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1.5 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {sig.signal_date || t.company.dateUnregistered}
                        </span>

                        {/* Title */}
                        <h4 className="font-extrabold text-slate-850 dark:text-white text-sm tracking-tight mb-2">
                          {sig.signal_title}
                        </h4>

                        {/* Details */}
                        {sig.details && (
                          <div className="flex flex-col gap-1 max-w-2xl">
                            <span className="text-[9px] font-bold text-slate-400 block mb-0.5">{t.company.signalDetailsLabel}</span>
                            <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                              {(() => {
                                if (isPatent) {
                                  try {
                                    const parsed = JSON.parse(sig.details);
                                    let patentType = parsed.patent_type || "特許";
                                    if (locale === 'vi') {
                                      const patentTypeMap: Record<string, string> = {
                                        "特許": "Sáng chế",
                                        "実用新案": "Giải pháp hữu ích",
                                        "意匠": "Kiểu dáng công nghiệp",
                                        "商標": "Nhãn hiệu"
                                      };
                                      patentType = patentTypeMap[patentType] || patentType;
                                    } else if (locale === 'en') {
                                      const patentTypeMap: Record<string, string> = {
                                        "特許": "Patent",
                                        "実用新案": "Utility Model",
                                        "意匠": "Design",
                                        "商標": "Trademark"
                                      };
                                      patentType = patentTypeMap[patentType] || patentType;
                                    }
                                    const regNum = parsed.registration_number || "";
                                    const title = sig.signal_title || "";
                                    return `${patentType}: ${regNum} - ${title}`;
                                  } catch {
                                    return sig.details;
                                  }
                                }

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
                                          const label = t.company.signalLabels[key as keyof typeof t.company.signalLabels] || key;
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
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {totalCount > 20 && (
                    <div className="mt-5 pt-3 border-t border-slate-150 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-medium ml-4">
                      {t.company.recentRecordsNotice}
                    </div>
                  )}
                </UnlockCard>
              </div>
            </AccordionPanel>
          </div>
        );
      })}
    </div>
  );
};
