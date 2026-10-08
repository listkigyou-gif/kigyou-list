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
      <div className="py-10 border border-dashed border-slate-200 rounded-lg dark:border-slate-800 text-center text-slate-400 flex flex-col items-center justify-center gap-2.5 bg-slate-50/50 dark:bg-slate-900/20">
        <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-white text-xs mb-1">{t.company.financialChartUnregistered}</h4>
          <p className="text-[11px] max-w-xs mx-auto leading-relaxed">
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
      const formatted = millionVal.toLocaleString('en-US', { maximumFractionDigits: 2 });
      return useFull ? `¥${formatted} Million JPY` : `¥${formatted}M JPY`;
    }
    if (locale === 'vi') {
      const millionVal = val / 1000000;
      const formatted = millionVal.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
      return useFull ? `¥${formatted} triệu JPY` : `¥${formatted}tr JPY`;
    }
    if (Math.abs(val) >= 100000000) {
      return `${(val / 100000000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}億円`;
    }
    return `${(val / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}万円`;
  };

  const getSourceBadge = (source: string) => {
    if (source === 'BOTH') {
      return (
        <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1">
          <Info className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
          {t.company.govIntegrator}
        </span>
      );
    }
    return null;
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
          className="relative p-4 sm:p-5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-slate-300 dark:text-slate-700">
            {/* Gradients */}
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B4F8A" />
                <stop offset="100%" stopColor="#163E6D" />
              </linearGradient>
              <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D97706" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.0" />
              </linearGradient>
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
                    strokeDasharray="3 3" 
                    className="text-slate-200 dark:text-slate-800" 
                  />
                  <text 
                    x={paddingLeft - 12} 
                    y={y + 3.5} 
                    textAnchor="end" 
                    className="text-[10px] font-semibold font-mono fill-slate-500 dark:fill-slate-400"
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
                    fill={isHovered ? "#163E6D" : "#1B4F8A"} 
                    rx="2"
                    className="transition-all duration-200"
                    fillOpacity={isHovered ? 1 : 0.9}
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
                    className={`text-[10px] font-semibold transition-colors ${
                      isHovered 
                        ? 'fill-[#1B4F8A] dark:fill-blue-400 font-bold' 
                        : 'fill-slate-600 dark:fill-slate-400'
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
                stroke="#D97706" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none"
              />
            )}

            {/* Income dots with clean hover circle */}
            {salesBars.map((bar, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g 
                  key={idx} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                >
                  {isHovered && (
                    <circle
                      cx={bar.cx}
                      cy={bar.cy}
                      r="6"
                      fill="#D97706"
                      fillOpacity="0.2"
                    />
                  )}
                  
                  <circle 
                    cx={bar.cx} 
                    cy={bar.cy} 
                    r={isHovered ? "4.5" : "3"} 
                    fill="#D97706" 
                    stroke="white" 
                    strokeWidth="1.5"
                    className="transition-all duration-200"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Clean Interactive Tooltip */}
        {hoveredIndex !== null && sortedFinancials[hoveredIndex] && (
          <div 
            className="absolute bg-slate-900/95 text-white p-3 rounded-lg border border-slate-700 shadow-xl backdrop-blur-md text-xs pointer-events-none transition-all duration-200"
            style={{
              left: `${(paddingLeft + (chartWidth / sortedFinancials.length) * (hoveredIndex + 0.5)) / width * 100}%`,
              top: '12px',
              transform: 'translateX(-50%)',
              zIndex: 10
            }}
          >
            <div className="font-bold text-[10px] text-slate-400 mb-1.5 border-b border-slate-800 pb-1.5 flex items-center justify-between gap-4">
              <span>{t.company.fiscalYearTrend.replace("{year}", sortedFinancials[hoveredIndex].fiscal_year)}</span>
              <span className="text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                {t.company.confirmedStatus}
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5 text-[11px] min-w-[160px]">
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#1B4F8A]" />
                  {t.company.revenue}
                </span>
                <span className="font-bold font-mono text-white">
                  {formatAmount(sortedFinancials[hoveredIndex].revenue || sortedFinancials[hoveredIndex].sales_amount, true)}
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-0.5 bg-[#D97706]" />
                  {t.company.ordinaryIncome}
                </span>
                <span className={`font-bold font-mono ${ (sortedFinancials[hoveredIndex].ordinary_income || 0) >= 0 ? 'text-amber-400' : 'text-rose-400' }`}>
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
                      <span className="font-bold font-mono text-slate-200">
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
                        <span className={`font-bold font-mono ${growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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

        {/* Clean Corporate Legend */}
        <div className="flex items-center justify-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400 py-2.5 px-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#1B4F8A] rounded-xs" />
            {t.company.trendChartLegendRevenue}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-[#D97706] rounded-full inline-block relative -top-[1px]" />
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
        <div className="py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 text-center text-slate-400 flex flex-col items-center gap-2.5">
          <AlertCircle className="w-8 h-8 text-amber-500/70" />
          <div className="max-w-xs mx-auto">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-1">{t.company.bsUnregistered}</h4>
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
      <div className="flex flex-col gap-4 relative">
        <div 
          className="relative p-4 sm:p-5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden"
          onMouseLeave={() => setHoveredBsIndex(null)}
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-slate-300 dark:text-slate-700">
            {/* Gradients */}
            <defs>
              <linearGradient id="liquidAssetsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4A7BB0" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient id="fixedAssetsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#205999" />
                <stop offset="100%" stopColor="#1B4F8A" />
              </linearGradient>
              <linearGradient id="liquidLiabGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
              <linearGradient id="fixedLiabGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
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
                    strokeDasharray="3 3" 
                    className="text-slate-200 dark:text-slate-800" 
                  />
                  <text x={paddingLeft - 12} y={y + 3.5} textAnchor="end" className="text-[10px] font-semibold font-mono fill-slate-500 dark:fill-slate-400">
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
                    fill="#4A7BB0"
                    rx="1.5"
                    fillOpacity={isHovered ? 1 : 0.9}
                    className="transition-all duration-200"
                  />
                  {/* Fixed Assets (Top) */}
                  <rect 
                    x={bar.assets.x}
                    y={bar.assets.fixedY}
                    width={barWidth}
                    height={Math.max(1.5, bar.assets.fixedH)}
                    fill="#1B4F8A"
                    rx="1.5"
                    fillOpacity={isHovered ? 1 : 0.9}
                    className="transition-all duration-200"
                  />

                  {/* 2. LIABILITIES & EQUITY COLUMN */}
                  {/* Equity (Bottom) */}
                  <rect 
                    x={bar.liabilitiesEquity.x}
                    y={bar.liabilitiesEquity.equityY}
                    width={barWidth}
                    height={Math.max(1.5, bar.liabilitiesEquity.equityH)}
                    fill="#059669"
                    rx="1.5"
                    fillOpacity={isHovered ? 1 : 0.9}
                    className="transition-all duration-200"
                  />
                  {/* Liquid Liabilities (Middle) */}
                  <rect 
                    x={bar.liabilitiesEquity.x}
                    y={bar.liabilitiesEquity.liquidLiabY}
                    width={barWidth}
                    height={Math.max(1.5, bar.liabilitiesEquity.liquidLiabH)}
                    fill="#DC2626"
                    rx="1.5"
                    fillOpacity={isHovered ? 1 : 0.9}
                    className="transition-all duration-200"
                  />
                  {/* Fixed Liabilities (Top) */}
                  <rect 
                    x={bar.liabilitiesEquity.x}
                    y={bar.liabilitiesEquity.fixedLiabY}
                    width={barWidth}
                    height={Math.max(1.5, bar.liabilitiesEquity.fixedLiabH)}
                    fill="#D97706"
                    rx="1.5"
                    fillOpacity={isHovered ? 1 : 0.9}
                    className="transition-all duration-200"
                  />

                  {/* Axis Labels */}
                  <text 
                    x={bar.colX} 
                    y={height - paddingBottom + 18} 
                    textAnchor="middle" 
                    className={`text-[10px] font-semibold transition-colors ${
                      isHovered ? 'fill-[#1B4F8A] dark:fill-blue-400 font-bold' : 'fill-slate-600 dark:fill-slate-400'
                    }`}
                  >
                    {bar.yearStr}
                  </text>
                  <text x={bar.assets.x + barWidth / 2} y={height - paddingBottom + 29} textAnchor="middle" className="text-[8px] font-medium fill-slate-500 dark:fill-slate-400">
                    {t.company.bsAssetsAxis}
                  </text>
                  <text x={bar.liabilitiesEquity.x + barWidth / 2} y={height - paddingBottom + 29} textAnchor="middle" className="text-[8px] font-medium fill-slate-500 dark:fill-slate-400">
                    {t.company.bsLiabilitiesAxis}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* BS Floating Clean Tooltip */}
        {hoveredBsIndex !== null && xmlRecords[hoveredBsIndex] && (
          <div 
            className="absolute bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 rounded-lg border border-slate-700 shadow-xl backdrop-blur-md text-xs pointer-events-none transition-all duration-200"
            style={{
              left: `${(paddingLeft + (chartWidth / xmlRecords.length) * (hoveredBsIndex + 0.5)) / width * 100}%`,
              top: '12px',
              transform: 'translateX(-50%)',
              zIndex: 10
            }}
          >
            <div className="font-bold text-[10px] text-slate-400 mb-1.5 border-b border-slate-800 pb-1.5 flex items-center justify-between gap-4">
              <span>{t.company.fiscalYearBS.replace("{year}", xmlRecords[hoveredBsIndex].fiscal_year)}</span>
              <span className="text-sky-400 font-semibold bg-sky-500/10 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                {t.company.summaryStatus}
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5 text-[11px] min-w-[190px]">
              <div className="flex items-center justify-between gap-5 font-bold text-sky-400">
                <span>{t.company.bsTotalAssets}:</span>
                <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].total_assets, true)}</span>
              </div>
              
              <div className="pl-2 flex flex-col gap-1 text-[10px] text-slate-300 border-l border-sky-500/30 ml-1">
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
              
              <div className="flex items-center justify-between gap-5 font-bold text-slate-300 mt-1 border-t border-slate-800 pt-1.5">
                <span>{t.company.bsTotalLiabilities}:</span>
                <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].total_assets, true)}</span>
              </div>
              
              <div className="pl-2 flex flex-col gap-1 text-[10px] text-slate-400 border-l border-slate-500/30 ml-1">
                <div className="flex items-center justify-between gap-4 text-rose-400">
                  <span>・{t.company.bsLiquidLiabilities}:</span>
                  <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].liquid_liabilities, true)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-amber-400">
                  <span>・{t.company.bsFixedLiabilities}:</span>
                  <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].fixed_liabilities, true)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-emerald-400 font-bold">
                  <span>・{t.company.bsNetAssets}:</span>
                  <span className="font-mono">{formatAmount(xmlRecords[hoveredBsIndex].net_assets, true)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend Grid */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium py-2.5 px-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#4A7BB0] rounded-xs" />
            <span>{t.company.bsLiquidAssets}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#1B4F8A] rounded-xs" />
            <span>{t.company.bsFixedAssets}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#DC2626] rounded-xs" />
            <span>{t.company.bsLiquidLiabilities}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#D97706] rounded-xs" />
            <span>{t.company.bsFixedLiabilities}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#059669] rounded-xs" />
            <span>{t.company.bsNetAssets}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Tab Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60">
          <button 
            type="button"
            onClick={() => setActiveTab('trend')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
              activeTab === 'trend' 
                ? 'bg-white text-[#1B4F8A] shadow-xs dark:bg-slate-700 dark:text-blue-300 font-bold' 
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {t.company.financialTrendTab}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('balance')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
              activeTab === 'balance' 
                ? 'bg-white text-[#1B4F8A] shadow-xs dark:bg-slate-700 dark:text-blue-300 font-bold' 
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
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
      <div className="min-h-[160px] sm:min-h-[280px]">
        {activeTab === 'trend' ? renderTrendChart() : renderBalanceSheet()}
      </div>

      {/* Shareholders Section */}
      {shareholders.length > 0 && (
        <div className="mt-2 sm:mt-3 border border-slate-200 rounded-lg p-5 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3.5 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Users className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            {t.company.shareholdersTitle}
          </h3>
          <UnlockCard type="block" fallbackText={t.company.shareholdersFallback}>
            <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
                <thead className="text-[10px] text-slate-600 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800/60 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">{t.company.shareholderName}</th>
                    <th scope="col" className="px-4 py-2.5 text-right">{t.company.shareholderRatio}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {shareholders.map((sh, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{sh.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
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
