import React from 'react';

// ─── Base shimmer pulse class ───────────────────────────────────────────────
const S = 'animate-pulse';

// ─── Primitive skeleton block ─────────────────────────────────────────────
export function SkeletonBlock({ className = '' }) {
  return <div className={`bg-slate-200 rounded ${className}`} />;
}

// ─── Stat KPI Card (Dashboard) ─────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm ${S}`}>
      <div className="flex justify-between items-start mb-3">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
      </div>
      <SkeletonBlock className="h-7 w-32 mb-2" />
      <SkeletonBlock className="h-3 w-20" />
    </div>
  );
}

// ─── Page Header Skeleton ──────────────────────────────────────────────────
export function SkeletonPageHeader({ hasButton = true, hasTabs = false }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 ${S}`}>
      <div>
        <SkeletonBlock className="h-6 w-44 mb-2" />
        <SkeletonBlock className="h-3 w-64" />
      </div>
      {hasButton && (
        <div className="flex gap-2">
          <SkeletonBlock className="h-8 w-28 rounded-lg" />
          {hasTabs && <SkeletonBlock className="h-8 w-24 rounded-lg" />}
        </div>
      )}
    </div>
  );
}

// ─── Filter / Search Bar Skeleton ─────────────────────────────────────────
export function SkeletonFilters({ pills = 5, hasSearch = true }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 mb-4 ${S}`}>
      {hasSearch && <SkeletonBlock className="h-8 w-52 rounded-lg" />}
      {Array.from({ length: pills }).map((_, i) => (
        <SkeletonBlock key={i} className={`h-7 rounded-full ${i === 0 ? 'w-14' : 'w-20'}`} />
      ))}
    </div>
  );
}

// ─── Table with header skeleton ──────────────────────────────────────────
export function SkeletonTable({ rows = 6, showHeader = true }) {
  const widths = ['w-1/4', 'w-1/6', 'w-1/5', 'w-1/8', 'w-1/12'];
  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm ${S}`}>
      {showHeader && (
        <div className="h-11 bg-slate-50 border-b border-slate-200 flex items-center gap-6 px-5">
          {widths.map((w, i) => (
            <SkeletonBlock key={i} className={`h-3 ${w}`} />
          ))}
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="px-5 py-3.5 flex items-center gap-6">
            <SkeletonBlock className="h-4 w-1/4" />
            <SkeletonBlock className="h-4 w-1/6" />
            <SkeletonBlock className="h-4 w-1/5" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
            <SkeletonBlock className="h-4 w-1/12 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card Grid Skeleton (Menu, Inventory grid views) ─────────────────────
export function SkeletonGrid({ count = 8 }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 ${S}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-slate-200 p-3">
          <SkeletonBlock className="w-full h-28 rounded-lg mb-3" />
          <SkeletonBlock className="h-4 w-3/4 mb-2" />
          <SkeletonBlock className="h-3 w-1/2 mb-2" />
          <SkeletonBlock className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ─── KOT Card Skeleton ─────────────────────────────────────────────────────
export function SkeletonKOTCard() {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${S}`}>
      <div className="flex justify-between items-center mb-3">
        <SkeletonBlock className="h-5 w-20 rounded-full" />
        <SkeletonBlock className="h-4 w-16" />
      </div>
      <SkeletonBlock className="h-3 w-24 mb-3" />
      <div className="space-y-2 mb-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-3 w-8" />
          </div>
        ))}
      </div>
      <SkeletonBlock className="h-8 w-full rounded-lg" />
    </div>
  );
}

// ─── Table Floor Plan Skeleton ────────────────────────────────────────────
export function SkeletonTableGrid({ count = 12 }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 ${S}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2">
          <SkeletonBlock className="h-5 w-16 mx-auto rounded-full" />
          <SkeletonBlock className="h-3 w-12 mx-auto" />
          <SkeletonBlock className="h-3 w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}

// ─── Stat Cards Row (Dashboard 4-across) ─────────────────────────────────
export function SkeletonStatRow({ count = 4 }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${S}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─── Full Dashboard Skeleton ──────────────────────────────────────────────
export function SkeletonDashboard() {
  return (
    <div className="p-5 space-y-5">
      <SkeletonPageHeader hasButton={true} />
      <SkeletonStatRow count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 ${S}`}>
          <SkeletonBlock className="h-5 w-40 mb-4" />
          <div className="flex items-end gap-2 h-32">
            {[60, 80, 45, 90, 70, 85, 55].map((h, i) => (
              <SkeletonBlock key={i} className={`flex-1 rounded-t`} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className={`bg-white rounded-xl border border-slate-200 p-5 ${S}`}>
          <SkeletonBlock className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between items-center">
                <SkeletonBlock className="h-3 w-32" />
                <SkeletonBlock className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Full generic module page skeleton ───────────────────────────────────
export function SkeletonModulePage({ type = 'table', rows = 7 }) {
  return (
    <div className="p-5 space-y-4">
      <SkeletonPageHeader />
      <SkeletonFilters />
      {type === 'table' && <SkeletonTable rows={rows} />}
      {type === 'grid' && <SkeletonGrid />}
      {type === 'kot' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonKOTCard key={i} />)}
        </div>
      )}
      {type === 'tables' && <SkeletonTableGrid />}
    </div>
  );
}
