import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function GlobalLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-md mb-6" />

        {/* Hero banner skeleton */}
        <div className="h-28 w-full bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl mb-8 p-6 flex flex-col justify-center gap-3 shadow-xs">
          <div className="h-4 w-32 bg-blue-100 dark:bg-blue-950/40 rounded-full" />
          <div className="h-7 w-72 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-3.5 w-96 max-w-full bg-slate-150 dark:bg-slate-800 rounded" />
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-5 w-56 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3.5 w-36 bg-slate-150 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                </div>
                <div className="h-4 w-4/5 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="h-64 bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
