"use client";

import React, { useState } from 'react';
import { 
  BarChart3, PieChart, Users, AlertCircle, Info
} from 'lucide-react';
import { CompanyFinancial } from '@/lib/db';
import { UnlockCard } from './UnlockCard';
import { useLanguage } from '@/context/LanguageContext';

interface CompanyFinancialsProps {
  financials: CompanyFinancial[];
}

export const CompanyFinancials: React.FC<CompanyFinancialsProps> = ({ financials }) => {
  const { locale, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'trend' | 'balance'>('trend');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredBsIndex, setHoveredBsIndex] = useState<number | null>(null);

  const hasFinancials = financials && financials.length > 0;
  if (!hasFinancials) {
    return (
      <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl dark:border-slate-800 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <AlertCircle className="w-10 h-10 text-slate-300" />
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{t.company.financialChartUnregistered}</h4>
          <p className="text-xs max-w-xs mx-auto leading-relaxed">
            {t.company.financialChartUnregisteredDesc}
          </p>
        </div>
      </div>
    );
  }

  // 1. Sort chronologically (oldest to newest) for chart
  const sortedFinancials = [...financials].sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year));
  const latestFinancial = [...financials].sort((a, b) => b.fiscal_year.localeCompare(a.fiscal_year))[0];

  // 2. Parse Shareholders
  let shareholders: { name: string; ratio: number | null }[] = [];
  if (latestFinancial?.shareholders_json) {
    try {
      shareholders = JSON.parse(latestFinancial.shareholders_json);
    } catch (e) {
      console.error("Failed to parse shareholders_json", e);
    }
  }

  // Helpers
  const formatAmount = (val: number | null, useFull = false) => {
    if (val === null || val === undefined) return '-';
    if (locale === 'en') {
      const millionVal = val / 1000000;
      const formatted = millionVal.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return useFull ? `¥${formatted} Million JPY` : `¥${formatted}M JPY`;
    }
    if (locale === 'vi') {
      const millionVal = val / 1000000;
      const formatted = millionVal.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return useFull ? `¥${formatted} triệu JPY` : `¥${formatted}tr JPY`;
    }
    if (Math.abs(val) >= 100000000) {
      return `${(val / 100000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}億円`;
    }
    return `${(val / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}万円`;
  };

  const getSourceBadge = (source: string) => {
    if (source === 'BOTH') {
      return (
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-1 shadow-sm">
          <Info className="w-3 h-3" />
          {t.company.govIntegrator}
        </span>
      );
    } else if (source === 'XML') {
      return null;
    }
    return (
      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/20 dark:text-teal-400 px-2 py-0.5 rounded border border-teal-100 dark:border-teal-900/50 flex items-center gap-1 shadow-sm">
        <Info className="w-3 h-3" />
        {t.company.govCsv}
      </span>
    );
  };

  // --- SVG 1: Trend Chart (Revenue & Ordinary Income) ---
  const renderTrendChart = () => {
    const maxSales = Math.max(...sortedFinancials.map(f => f.revenue || f.sales_amount || 0), 1000000);
    const maxIncome = Math.max(...sortedFinancials.map(f => Math.abs(f.ordinary_income || 0)), 100000);
    const chartMax = Math.max(maxSales, maxIncome * 5); // scale income line if sales is much larger
    
    const width = 600;
    const height = 240;
    const paddingLeft = 70;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const barWidth = Math.min(30, chartWidth / sortedFinancials.length / 2.5);
    
    const points: string[] = [];
    const salesBars = sortedFinancials.map((f, i) => {
      const yearStr = locale === 'vi' ? `Năm ${f.fiscal_year}` : locale === 'en' ? `FY ${f.fiscal_year}` : `${f.fiscal_year}年`;
      const x = paddingLeft + (chartWidth / (sortedFinancials.length)) * (i + 0.5);
      
      const salesVal = f.revenue || f.sales_amount || 0;
      const barHeight = (salesVal / chartMax) * chartHeight;
      const y = height - paddingBottom - barHeight;

      const incomeVal = f.ordinary_income || 0;
      const lineY = height - paddingBottom - ((incomeVal / chartMax) * chartHeight);
      points.push(`${x},${lineY}`);

      return {
        x: x - barWidth / 2,
        y,
        w: barWidth,
        h: Math.max(2, barHeight),
        val: salesVal,
        incomeVal,
        label: yearStr,
        cx: x,
        cy: lineY
      };
    });

    // Generate area path coordinates
    const areaPathD = points.length > 1 
      ? `M ${salesBars[0].cx},${height - paddingBottom} L ${points.join(' L ')} L ${salesBars[salesBars.length - 1].cx},${height - paddingBottom} Z`
      : '';

    return (
      <div className="flex flex-col gap-4 relative">
        <div 
          className="relative p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-[#1C2128]/25 shadow-sm overflow-hidden"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-slate-300 dark:text-slate-700">
            {/* Gradients */}
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B4F8A" />
                <stop offset="100%" stopColor="#00A896" />
              </linearGradient>
              <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F2A30F" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#F2A30F" stopOpacity="0.0" />
              </linearGradient>
              {/* Drop Shadow for bars */}
              <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.06" />
              </filter>
            </defs>

            {/* Y Gridlines */}
            {Array.from({ length: 4 }).map((_, idx) => {
              const y = paddingTop + (chartHeight / 3) * idx;
              const gridVal = (chartMax / 3) * (3 - idx);
              return (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={width - paddingRight} 
                    y2={y} 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    strokeDasharray="4" 
                    className="text-slate-100 dark:text-slate-800/60" 
                  />
                  <text 
                    x={paddingLeft - 12} 
                    y={y + 3.5} 
                    textAnchor="end" 
                    className="text-[10px] font-bold font-mono fill-slate-400 dark:fill-slate-500"
                  >
                    {formatAmount(gridVal)}
                  </text>
                </g>
              );
            })}

            {/* Hover Vertical Guide Line */}
            {hoveredIndex !== null && salesBars[hoveredIndex] && (
              <line
                x1={salesBars[hoveredIndex].cx}
                y1={paddingTop - 5}
                x2={salesBars[hoveredIndex].cx}
                y2={height - paddingBottom}
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="opacity-40 dark:opacity-50"
              />
            )}

            {/* Sales Bars */}
            {salesBars.map((bar, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g 
                  key={idx} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                >
                  {/* Invisible broad hitbox for easy hovering */}
                  <rect
                    x={bar.cx - (chartWidth / sortedFinancials.length) / 2}
                    y={paddingTop}
                    width={chartWidth / sortedFinancials.length}
                    height={chartHeight + 10}
                    fill="transparent"
                  />

                  {bar.val > 0 ? (
                    <rect 
                      x={bar.x} 
                      y={bar.y} 
                      width={bar.w} 
                      height={bar.h} 
                      fill="url(#salesGrad)" 
                      filter="url(#shadow)"
                      rx="4"
                      className="transition-all duration-300"
                      fillOpacity={isHovered ? 0.9 : 0.75}
                      stroke={isHovered ? "#00A896" : "transparent"}
                      strokeWidth="1"
                    />
                  ) : (
                    <text x={bar.cx} y={height - paddingBottom - 10} textAnchor="middle" className="text-[8px] font-bold fill-slate-400 dark:fill-slate-600">
                      {t.company.nonDisclosed}
                    </text>
                  )}

                  {/* Year Label */}
                  <text 
                    x={bar.cx} 
                    y={height - paddingBottom + 18} 
                    textAnchor="middle" 
                    className={`text-[10px] font-bold transition-colors ${
                      isHovered 
                        ? 'fill-primary dark:fill-secondary' 
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {bar.label}
                  </text>
                </g>
              );
            })}

            {/* Income Area Fill Under the Line */}
            {areaPathD && (
              <path 
                d={areaPathD}
                fill="url(#incomeAreaGrad)"
                className="pointer-events-none"
              />
            )}

            {/* Income Line Overlay */}
            {points.length > 1 && (
              <path 
                d={`M ${points.join(' L ')}`} 
                fill="none" 
                stroke="#F2A30F" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none shadow-sm"
              />
            )}

            {/* Income dots with glowing effects */}
            {salesBars.map((bar, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g 
                  key={idx} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                >
                  {/* Outer halo for hovered dot */}
                  {isHovered && (
                    <circle
                      cx={bar.cx}
                      cy={bar.cy}
                      r="8"
                      fill="#F2A30F"
                      fillOpacity="0.25"
                      className="animate-pulse"
                    />
                  )}
                  
                  <circle 
                    cx={bar.cx} 
                    cy={bar.cy} 
                    r={isHovered ? "6" : "4.5"} 
                    fill="#F2A30F" 
                    stroke="white" 
                    strokeWidth="1.5"
                    className="transition-all duration-300 shadow-sm"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Premium Floating Interactive Tooltip */}
        {hoveredIndex !== null && sortedFinancials[hoveredIndex] && (
          <div 
            className="absolute bg-slate-900/90 dark:bg-slate-950/95 text-white p-3 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-md text-xs pointer-events-none transition-all duration-300"
            style={{
              left: `${(paddingLeft + (chartWidth / sortedFinancials.length) * (hoveredIndex + 0.5)) / width * 100}%`,
              top: '12px',
              transform: 'translateX(-50%)',
              zIndex: 10
            }}
          >
            <div className="font-black text-[10px] text-slate-400 mb-1.5 border-b border-slate-800 pb-1.5 flex items-center justify-between gap-4">
              <span>{t.company.fiscalYearTrend.replace("{year}", sortedFinancials[hoveredIndex].fiscal_year)}</span>
              <span className="text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                {t.company.confirmedStatus}
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5 text-[11px] min-w-[150px]">
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-[#1B4F8A] to-[#00A896]" />
                  {t.company.revenue}
                </span>
                <span className="font-extrabold font-mono text-emerald-400">
                  {formatAmount(sortedFinancials[hoveredIndex].revenue || sortedFinancials[hoveredIndex].sales_amount, true)}
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-0.5 bg-[#F2A30F]" />
                  {t.company.ordinaryIncome}
                </span>
                <span className={`font-extrabold font-mono ${ (sortedFinancials[hoveredIndex].ordinary_income || 0) >= 0 ? 'text-amber-400' : 'text-rose-450' }`}>
                  {formatAmount(sortedFinancials[hoveredIndex].ordinary_income, true)}
                </span>
              </div>

              {/* Profit Margin */}
              {(() => {
                const sales = sortedFinancials[hoveredIndex].revenue || sortedFinancials[hoveredIndex].sales_amount || 0;
                const income = sortedFinancials[hoveredIndex].ordinary_income || 0;
                if (sales > 0) {
                  const margin = (income / sales) * 100;
                  return (
                    <div className="flex items-center justify-between gap-6 text-[10px] text-slate-400">
                      <span>{t.company.operatingMargin}</span>
                      <span className="font-bold font-mono">
                        {margin.toFixed(1)}%
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Year-over-Year Growth */}
              {hoveredIndex > 0 && sortedFinancials[hoveredIndex - 1] && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>{t.company.yoyGrowth}</span>
                  {(() => {
                    const prevSales = sortedFinancials[hoveredIndex - 1].revenue || sortedFinancials[hoveredIndex - 1].sales_amount || 0;
                    const currSales = sortedFinancials[hoveredIndex].revenue || sortedFinancials[hoveredIndex].sales_amount || 0;
                    if (prevSales > 0) {
                      const growth = ((currSales - prevSales) / prevSales) * 100;
                      return (
                        <span className={`font-bold font-mono ${growth >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                          {growth >= 0 ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
                        </span>
                      );
                    }
                    return <span>-</span>;
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Legend */}
        <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
            <span className="w-3.5 h-3.5 bg-gradient-to-r from-[#1B4F8A] to-[#00A896] rounded-sm" />
            {t.company.trendChartLegendRevenue}
          </span>
          <span className="flex items-center gap-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
            <span className="w-4 h-1 bg-[#F2A30F] rounded-full inline-block relative -top-[1px]" />
            {t.company.trendChartLegendOrdinary}
          </span>
        </div>
      </div>
    );
  };

  // --- SVG 2: Balance Sheet Stacked Bar Chart ---
  const renderBalanceSheet = () => {
    // Only display B/S chart for years that contain XML data (with total_assets > 0)
    const xmlRecords = sortedFinancials.filter(f => (f.total_assets || 0) > 0);
    
    if (xmlRecords.length === 0) {
      return (
        <div className="py-12 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1C2128]/10 text-center text-slate-400 flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10 text-amber-500/70" />
          <div className="max-w-xs mx-auto">
            <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm mb-1">{t.company.bsUnregistered}</h4>
            <p className="text-[11px] leading-relaxed">
              {t.company.bsUnregisteredDesc}
            </p>
          </div>
        </div>
      );
    }

    const width = 600;
    const height = 260;
    const paddingLeft = 70;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const maxAssets = Math.max(...xmlRecords.map(f => f.total_assets || 0), 1000000);

    const columnWidth = chartWidth / xmlRecords.length;
    const groupWidth = Math.min(64, columnWidth * 0.8);
    const barWidth = groupWidth / 2 - 4;

    const bars = xmlRecords.map((f, i) => {
      const yearStr = locale === 'vi' ? `Năm ${f.fiscal_year}` : locale === 'en' ? `FY ${f.fiscal_year}` : `${f.fiscal_year}年`;
      const colX = paddingLeft + columnWidth * (i + 0.5);

      const totalVal = f.total_assets || 0;
      const liquidAssetsVal = f.liquid_assets || 0;
      const fixedAssetsVal = f.fixed_assets || (totalVal - liquidAssetsVal);

      const liquidLiabilitiesVal = f.liquid_liabilities || 0;
      const fixedLiabilitiesVal = f.fixed_liabilities || 0;

      // Scale heights
      const scale = chartHeight / maxAssets;
      const liquidAssetsH = liquidAssetsVal * scale;
      const fixedAssetsH = fixedAssetsVal * scale;

      const liquidLiabH = liquidLiabilitiesVal * scale;
      const fixedLiabH = fixedLiabilitiesVal * scale;
      const equityH = Math.max(0, totalVal - liquidLiabilitiesVal - fixedLiabilitiesVal) * scale;

      return {
        colX,
        yearStr,
        totalVal,
        assets: {
          x: colX - groupWidth / 2,
          liquidY: height - paddingBottom - liquidAssetsH,
          liquidH: liquidAssetsH,
          fixedY: height - paddingBottom - liquidAssetsH - fixedAssetsH,
          fixedH: fixedAssetsH
        },
        liabilitiesEquity: {
          x: colX + 4,
          equityY: height - paddingBottom - equityH,
          equityH: equityH,
          liquidLiabY: height - paddingBottom - equityH - liquidLiabH,
          liquidLiabH: liquidLiabH,
          fixedLiabY: height - paddingBottom - equityH - liquidLiabH - fixedLiabH,
          fixedLiabH: fixedLiabH
        }
      };
    });

    return (
      <div className="flex flex-col gap-6 relative">
        <div 
          className="relative p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-[#1C2128]/25 shadow-sm overflow-hidden"
          onMouseLeave={() => setHoveredBsIndex(null)}
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-slate-300 dark:text-slate-700">
            {/* Gradients */}
            <defs>
              <linearGradient id="liquidAssetsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00A896" />
                <stop offset="100%" stopColor="#028090" />
              </linearGradient>
              <linearGradient id="fixedAssetsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#028090" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#1B4F8A" />
              </linearGradient>
              <linearGradient id="liquidLiabGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F72585" />
                <stop offset="100%" stopColor="#B5179E" />
              </linearGradient>
              <linearGradient id="fixedLiabGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4CC9F0" />
                <stop offset="100%" stopColor="#4895EF" />
              </linearGradient>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7209B7" />
                <stop offset="100%" stopColor="#560BAD" />
              </linearGradient>
            </defs>

            {/* Y Gridlines */}
            {Array.from({ length: 4 }).map((_, idx) => {
              const y = paddingTop + (chartHeight / 3) * idx;
              const gridVal = (maxAssets / 3) * (3 - idx);
              return (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={width - paddingRight} 
                    y2={y} 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    strokeDasharray="4" 
                    className="text-slate-100 dark:text-slate-800/60" 
                  />
                  <text x={paddingLeft - 12} y={y + 3.5} textAnchor="end" className="text-[10px] font-bold font-mono fill-slate-400 dark:fill-slate-500">
                    {formatAmount(gridVal)}
                  </text>
                </g>
              );
            })}

            {/* Hover Vertical Guide Line */}
            {hoveredBsIndex !== null && bars[hoveredBsIndex] && (
              <line
                x1={bars[hoveredBsIndex].colX}
                y1={paddingTop - 5}
                x2={bars[hoveredBsIndex].colX}
                y2={height - paddingBottom + 10}
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="opacity-40 dark:opacity-50"
              />
            )}

            {/* Render Stacked Bars */}
            {bars.map((bar, idx) => {
              const isHovered = hoveredBsIndex === idx;
              return (
                <g 
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredBsIndex(idx)}
                >
                  {/* Broad transparent hitbox for hovering */}
                  <rect
                    x={bar.colX - columnWidth / 2}
                    y={paddingTop}
                    width={columnWidth}
                    height={chartHeight + 15}
                    fill="transparent"
                  />

                  {/* 1. ASSETS COLUMN */}
                  {/* Liquid Assets (Bottom) */}
                  <rect 
                    x={bar.assets.x}
                    y={bar.assets.liquidY}
                    width={barWidth}
                    height={Math.max(1.5, bar.assets.liquidH)}
                    fill="url(#liquidAssetsGrad)"
                    rx="1.5"
                    fillOpacity={isHovered ? 0.95 : 0.8}
                    className="transition-all duration-300"
                  />
                  {/* Fixed Assets (Top) */}
                  <rect 
                    x={bar.assets.x}
                    y={bar.assets.fixedY}
                    width={barWidth}
                    height={Math.max(1.5, bar.assets.fixedH)}
                    fill="url(#fixedAssetsGrad)"
                    rx="1.5"
                    fillOpacity={isHovered ? 0.95 : 0.8}
                    className="transition-all duration-300"
                  />

                  {/* 2. LIABILITIES & EQUITY COLUMN */}
                  {/* Equity (Bottom) */}
                  <rect 
                    x={bar.liabilitiesEquity.x}
                    y={bar.liabilitiesEquity.equityY}
                    width={barWidth}
                    height={Math.max(1.5, bar.liabilitiesEquity.equityH)}
                    fill="url(#equityGrad)"
                    rx="1.5"
                    fillOpacity={isHovered ? 0.95 : 0.8}
                    className="transition-all duration-300"
                  />
                  {/* Liquid Liabilities (Middle) */}
                  <rect 
                    x={bar.liabilitiesEquity.x}
                    y={bar.liabilitiesEquity.liquidLiabY}
                    width={barWidth}
                    height={Math.max(1.5, bar.liabilitiesEquity.liquidLiabH)}
                    fill="url(#liquidLiabGrad)"
                    rx="1.5"
                    fillOpacity={isHovered ? 0.95 : 0.8}
                    className="transition-all duration-300"
                  />
                  {/* Fixed Liabilities (Top) */}
                  <rect 
                    x={bar.liabilitiesEquity.x}
                    y={bar.liabilitiesEquity.fixedLiabY}
                    width={barWidth}
                    height={Math.max(1.5, bar.liabilitiesEquity.fixedLiabH)}
                    fill="url(#fixedLiabGrad)"
                    rx="1.5"
                    fillOpacity={isHovered ? 0.95 : 0.8}
                    className="transition-all duration-300"
                  />

                  {/* Axis Labels */}
                  <text 
                    x={bar.colX} 
                    y={height - paddingBottom + 18} 
                    textAnchor="middle" 
                    className={`text-[10px] font-bold transition-colors ${
                      isHovered ? 'fill-primary dark:fill-secondary' : 'fill-slate-600 dark:fill-slate-400'
                    }`}
                  >
                    {bar.yearStr}
                  </text>
                  <text x={bar.assets.x + barWidth / 2} y={height - paddingBottom + 29} textAnchor="middle" className="text-[8px] font-extrabold fill-slate-400 dark:fill-slate-500">
                    {t.company.bsAssetsAxis}
                  </text>
                  <text x={bar.liabilitiesEquity.x + barWidth / 2} y={height - paddingBottom + 29} textAnchor="middle" className="text-[8px] font-extrabold fill-slate-400 dark:fill-slate-500">
                    {t.company.bsLiabilitiesAxis}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* BS Floating Premium Tooltip */}
        {hoveredBsIndex !== null && xmlRecords[hoveredBsIndex] && (
          <div 
            className="absolute bg-slate-900/90 dark:bg-slate-950/95 text-white p-3.5 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-md text-xs pointer-events-none transition-all duration-300"
            style={{
              left: `${(paddingLeft + (chartWidth / xmlRecords.length) * (hoveredBsIndex + 0.5)) / width * 100}%`,
              top: '12px',
              transform: 'translateX(-50%)',
              zIndex: 10
            }}
          >
            <div className="font-black text-[10px] text-slate-400 mb-1.5 border-b border-slate-800 pb-1.5 flex items-center justify-between gap-4">
              <span>{t.company.fiscalYearBS.replace("{year}", xmlRecords[hoveredBsIndex].fiscal_year)}</span>
              <span className="text-teal-400 font-bold bg-teal-500/10 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                {t.company.summaryStatus}
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5 text-[10.5px] min-w-[180px]">
              <div className="flex items-center justify-between gap-5 font-extrabold text-emerald-400">
                <span>{t.company.bsTotalAssets}:</span>
                <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].total_assets, true)}</span>
              </div>
              
              <div className="pl-2 flex flex-col gap-1 text-[9.5px] text-slate-300 border-l border-emerald-500/30 ml-1">
                <div className="flex items-center justify-between gap-4">
                  <span>・{t.company.bsLiquidAssets}:</span>
                  <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].liquid_assets, true)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>・{t.company.bsFixedAssets}:</span>
                  <span className="font-mono">
                    {formatAmount(xmlRecords[hoveredBsIndex].fixed_assets || (xmlRecords[hoveredBsIndex].total_assets! - xmlRecords[hoveredBsIndex].liquid_assets!), true)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-5 font-extrabold text-indigo-400 mt-1 border-t border-slate-800 pt-1.5">
                <span>{t.company.bsTotalLiabilities}:</span>
                <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].total_assets, true)}</span>
              </div>
              
              <div className="pl-2 flex flex-col gap-1 text-[9.5px] text-slate-400 border-l border-indigo-500/30 ml-1">
                <div className="flex items-center justify-between gap-4">
                  <span>・{t.company.bsLiquidLiabilities}:</span>
                  <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].liquid_liabilities, true)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sky-400">
                  <span>・{t.company.bsFixedLiabilities}:</span>
                  <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].fixed_liabilities, true)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-purple-400 font-extrabold">
                  <span>・{t.company.bsNetAssets}:</span>
                  <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].net_assets, true)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-[#1C2128]/25 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/80 shadow-sm">
          <div className="flex items-center gap-2 justify-center">
            <span className="w-3.5 h-3.5 bg-gradient-to-tr from-[#00A896] to-[#028090] rounded-sm shadow-sm" />
            <span>{t.company.bsLiquidAssets}</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <span className="w-3.5 h-3.5 bg-gradient-to-tr from-[#028090] to-[#1B4F8A] rounded-sm shadow-sm" />
            <span>{t.company.bsFixedAssets}</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <span className="w-3.5 h-3.5 bg-gradient-to-tr from-[#F72585] to-[#B5179E] rounded-sm shadow-sm" />
            <span>{t.company.bsLiquidLiabilities}</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <span className="w-3.5 h-3.5 bg-gradient-to-tr from-[#4CC9F0] to-[#4895EF] rounded-sm shadow-sm" />
            <span>{t.company.bsFixedLiabilities}</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <span className="w-3.5 h-3.5 bg-gradient-to-tr from-[#7209B7] to-[#560BAD] rounded-sm shadow-sm" />
            <span>{t.company.bsNetAssets}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Controls */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('trend')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 ${
              activeTab === 'trend' 
                ? 'bg-primary text-white shadow-sm dark:bg-secondary' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {t.company.financialTrendTab}
          </button>
          <button 
            onClick={() => setActiveTab('balance')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 ${
              activeTab === 'balance' 
                ? 'bg-primary text-white shadow-sm dark:bg-secondary' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            {t.company.balanceSheetTab}
          </button>
        </div>
        
        <div>
          {getSourceBadge(latestFinancial.source_type)}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[280px]">
        {activeTab === 'trend' ? renderTrendChart() : renderBalanceSheet()}
      </div>

      {/* Retained Earnings Health Badge - Hidden by request */}

      {/* Shareholders Section */}
      {shareholders.length > 0 && (
        <div className="mt-4 border border-slate-100 rounded-2xl p-5 md:p-6 dark:border-slate-800 bg-white dark:bg-[#1C2128]/40 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800/50">
            <Users className="w-4.5 h-4.5 text-primary" />
            {t.company.shareholdersTitle}
          </h3>
          <UnlockCard type="block" fallbackText={t.company.shareholdersFallback}>
            <div className="overflow-hidden border border-slate-100 dark:border-slate-850 rounded-xl">
              <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/40 font-bold border-b border-slate-100 dark:border-slate-850">
                  <tr>
                    <th scope="col" className="px-4 py-3">{t.company.shareholderName}</th>
                    <th scope="col" className="px-4 py-3 text-right">{t.company.shareholderRatio}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {shareholders.map((sh, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{sh.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-450 font-mono">
                        {sh.ratio !== null ? `${sh.ratio}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </UnlockCard>
        </div>
      )}
    </div>
  );
};
