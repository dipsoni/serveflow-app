import React from 'react';

export default function StatusBadge({ status, type = 'default' }) {
  if (!status) return null;
  const s = String(status).toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  // Table Statuses
  if (s === 'available' || s === 'free') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'occupied' || s === 'busy') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'billing') {
    styles = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (s === 'reserved') {
    styles = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  // Order & KOT Statuses
  else if (s === 'completed' || s === 'paid' || s === 'healthy' || s === 'received' || s === 'active') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'serve_pending' || s === 'serve pending') {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-extrabold animate-pulse';
  } else if (s === 'served') {
    styles = 'bg-cyan-50 text-cyan-700 border-cyan-200 font-bold';
  } else if (s === 'billing_pending' || s === 'billing pending') {
    styles = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
  } else if (s === 'confirmed') {
    styles = 'bg-violet-50 text-violet-700 border-violet-200 font-bold';
  } else if (s === 'ready') {
    styles = 'bg-teal-50 text-teal-700 border-teal-200 font-bold';
  } else if (s === 'preparing' || s === 'low') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
  } else if (s === 'new' || s === 'pending' || s === 'kot_sent' || s === 'draft') {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (s === 'cancelled' || s === 'critical' || s === 'inactive' || s === 'unpaid') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  const label = status.replace(/_/g, ' ').toUpperCase();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
}
