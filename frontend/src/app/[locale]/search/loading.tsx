import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function SearchLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Top search header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-7 w-64 bg-slate-300 dark:bg-slate-700 rounded-lg" />
          </div>
          <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>

        {/* Layout with Sidebar + Results */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Sidebar Skeleton */}
          <aside className="w-full lg:w-72 shrink-0 bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-12 bg-slate-150 dark:bg-slate-800 rounded" />
            </div>

            {/* Filter section 1 */}
            <div className="space-y-2">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-9 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            </div>

            {/* Filter section 2 */}
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-9 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            </div>

            {/* Filter checkboxes */}
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="h-3.5 w-32 bg-slate-150 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          </aside>

          {/* Right Results List Skeleton */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {/* Filter chips bar */}
            <div className="h-10 w-full bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 flex items-center gap-2 shadow-xs">
              <div className="h-5 w-24 bg-slate-150 dark:bg-slate-800 rounded-md" />
              <div className="h-5 w-32 bg-slate-150 dark:bg-slate-800 rounded-md" />
            </div>

            {/* Company Cards Skeletons */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-5 w-60 sm:w-80 bg-slate-250 dark:bg-slate-700 rounded" />
                      <div className="h-3 w-40 bg-slate-150 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="h-7 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
