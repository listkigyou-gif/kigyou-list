import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 animate-pulse">
        {/* Dashboard Status Banner Skeleton */}
        <div className="bg-white border border-slate-200/90 dark:bg-[#1C2128] dark:border-slate-800 rounded-xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="h-3 w-32 bg-blue-100 dark:bg-blue-950/40 rounded-md" />
            <div className="h-7 w-64 bg-slate-300 dark:bg-slate-700 rounded-lg" />
            <div className="h-3.5 w-40 bg-slate-150 dark:bg-slate-800 rounded-md" />
          </div>

          <div className="h-20 w-full sm:w-72 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50 rounded-xl" />
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          {[1, 2, 3, 4, 5, 6].map((t) => (
            <div key={t} className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
          ))}
        </div>

        {/* Main Content Area Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((c) => (
            <div
              key={c}
              className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col gap-3"
            >
              <div className="h-5 w-48 bg-slate-250 dark:bg-slate-700 rounded-md" />
              <div className="h-3.5 w-32 bg-slate-150 dark:bg-slate-800 rounded-md" />
              <div className="h-3.5 w-40 bg-slate-150 dark:bg-slate-800 rounded-md" />
              <div className="h-8 w-full bg-slate-100 dark:bg-slate-800/60 rounded-lg mt-2" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
