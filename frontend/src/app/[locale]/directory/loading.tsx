import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function DirectoryLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded" />

        {/* Hero banner skeleton */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xs flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-2.5 max-w-2xl">
              <div className="h-4 w-36 bg-blue-100 dark:bg-blue-950/40 rounded-md" />
              <div className="h-7 w-72 sm:w-96 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-3.5 w-full sm:w-4/5 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-8 w-28 bg-[#1B4F8A]/30 rounded-lg" />
            </div>
          </div>

          {/* Key Metric Specs Matrix Skeleton */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 1: Regional Directory Skeleton */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-7 shadow-2xs flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-5 w-32 bg-slate-100 dark:bg-slate-800 rounded-md" />
          </div>

          {/* Region blocks */}
          {[1, 2, 3].map((r) => (
            <div
              key={r}
              className="p-3.5 sm:p-4.5 bg-slate-50/70 dark:bg-slate-800/20 rounded-lg border border-slate-200/70 dark:border-slate-800/70 flex flex-col gap-3"
            >
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
                {[1, 2, 3, 4, 5, 6].map((p) => (
                  <div
                    key={p}
                    className="h-14 bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-700 rounded-lg p-2.5 flex flex-col justify-center gap-1.5"
                  >
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-2.5 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 2: JSIC Industry Skeleton (2-Column Grid) */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-7 shadow-2xs flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-5 w-32 bg-slate-100 dark:bg-slate-800 rounded-md" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((ind) => (
              <div
                key={ind}
                className="h-12 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="h-3 w-16 bg-slate-150 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
