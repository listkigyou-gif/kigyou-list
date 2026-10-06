import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function DirectoryLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />

        {/* Hero banner skeleton */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-3">
          <div className="h-3.5 w-44 bg-blue-100 dark:bg-blue-950/40 rounded-full" />
          <div className="h-8 w-72 sm:w-96 bg-slate-300 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-4/5 bg-slate-150 dark:bg-slate-800 rounded" />
        </div>

        {/* 2-column + 1-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Regional Directory Skeleton */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col gap-6">
              <div className="h-6 w-52 bg-slate-200 dark:bg-slate-700 rounded-md pb-2 border-b border-slate-100 dark:border-slate-800" />

              {/* Region blocks */}
              {[1, 2, 3].map((r) => (
                <div
                  key={r}
                  className="p-4 bg-slate-50/70 dark:bg-slate-800/20 rounded-xl border border-slate-150 dark:border-slate-800/60 flex flex-col gap-3"
                >
                  <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((p) => (
                      <div
                        key={p}
                        className="h-14 bg-white dark:bg-[#151B22] border border-slate-200/70 dark:border-slate-800 rounded-xl p-2.5 flex flex-col justify-center gap-1.5"
                      >
                        <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-2.5 w-12 bg-slate-150 dark:bg-slate-800 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1 Col: JSIC Industry Skeleton */}
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-md pb-2 border-b border-slate-100 dark:border-slate-800" />

              {[1, 2, 3, 4, 5, 6].map((ind) => (
                <div
                  key={ind}
                  className="h-12 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="h-3 w-10 bg-slate-150 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
