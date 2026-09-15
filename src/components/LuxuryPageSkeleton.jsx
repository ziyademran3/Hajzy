import React from 'react'

export default function LuxuryPageSkeleton() {
  return (
    <div className="min-h-[70vh] w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-pulse space-y-6">
      {/* Top Banner Skeleton */}
      <div className="h-44 sm:h-56 w-full rounded-3xl bg-slate-200/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5" />

      {/* Filter / Tabs Skeleton */}
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-28 rounded-full bg-slate-200/80 dark:bg-white/5" />
        <div className="h-10 w-32 rounded-full bg-slate-200/80 dark:bg-white/5" />
        <div className="h-10 w-24 rounded-full bg-slate-200/80 dark:bg-white/5" />
        <div className="h-10 w-36 rounded-full bg-slate-200/80 dark:bg-white/5" />
      </div>

      {/* Grid of Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="rounded-[24px] border border-slate-200/70 dark:border-white/5 bg-white dark:bg-[#11161b] p-3 space-y-3 shadow-xs"
          >
            <div className="h-48 w-full rounded-2xl bg-slate-200/80 dark:bg-white/5" />
            <div className="space-y-2 px-1">
              <div className="h-4 w-3/4 rounded-md bg-slate-200/80 dark:bg-white/5" />
              <div className="h-3 w-1/2 rounded-md bg-slate-200/60 dark:bg-white/5" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-20 rounded-md bg-slate-200/80 dark:bg-white/5" />
                <div className="h-4 w-12 rounded-md bg-slate-200/80 dark:bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
