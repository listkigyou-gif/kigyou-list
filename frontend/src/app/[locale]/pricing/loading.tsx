import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PricingLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />

        {/* Hero Title Section */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
          <div className="h-5 w-40 bg-blue-100 dark:bg-blue-950/40 rounded-full" />
          <div className="h-10 w-80 sm:w-[500px] bg-slate-300 dark:bg-slate-700 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-slate-200 dark:bg-slate-800 rounded" />
        </div>

        {/* Pricing Cards Grid (4 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto w-full mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between h-[480px]"
            >
              <div className="flex flex-col gap-4">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-9 w-36 bg-slate-300 dark:bg-slate-700 rounded-lg" />
                <div className="h-4 w-full bg-slate-150 dark:bg-slate-800 rounded" />
                <div className="h-12 w-full bg-slate-50 dark:bg-[#0D1117] border border-slate-100 dark:border-slate-800 rounded-xl" />

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {[1, 2, 3, 4].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
                      <div className="h-3 w-4/5 bg-slate-150 dark:bg-slate-800 rounded" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-xl mt-6" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
