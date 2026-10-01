import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users2,
  Store,
  Layers,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/stats');
      setStats(res.data.stats || {});
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const s = stats || {};

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Platform Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Global metrics across all multi-tenant restaurant businesses, subscriptions, and revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
          <Link
            to="/super-admin/restaurants"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all"
          >
            <Building2 className="w-4 h-4" />
            Manage Restaurants
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Restaurants</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">{s.totalRestaurants || 0}</div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-emerald-400 font-semibold">{s.activeRestaurants || 0} Active</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-semibold">{s.trialRestaurants || 0} Trial</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400 font-semibold">{s.expiredRestaurants || 0} Expired</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Recurring (MRR)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">₹{(s.mrr || 0).toLocaleString('en-IN')}</div>
          <div className="mt-2 text-xs text-slate-400">
            Total Revenue: <span className="text-white font-semibold">₹{(s.totalRevenue || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Outlets & Staff</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">{s.totalBranches || 0}</div>
          <div className="mt-2 text-xs text-slate-400">
            Across <span className="text-white font-semibold">{s.totalStaff || 0} Total Staff</span> Accounts
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Platform Orders</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">{s.totalOrders || 0}</div>
          <div className="mt-2 text-xs text-slate-400">
            Serving <span className="text-white font-semibold">{s.totalCustomers || 0} Dining Guests</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Registrations & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Restaurants */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">Recent Tenant Registrations</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest restaurant onboarding signups</p>
            </div>
            <Link to="/super-admin/restaurants" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(s.recentRegistrations || []).map((rest) => (
              <div
                key={rest.id}
                className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">
                    {rest.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{rest.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {rest.business_id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Owner: {rest.owner_name} • {rest.city}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      rest.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : rest.status === 'TRIAL'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {rest.status}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">{rest.plan_name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payment Transactions */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">Subscription Billing Stream</h2>
              <p className="text-xs text-slate-400 mt-0.5">Verified server-side subscription payments</p>
            </div>
            <Link to="/super-admin/payments" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(s.recentPayments || []).map((pay) => (
              <div
                key={pay.id}
                className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{pay.transaction_id}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {pay.payment_status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-1">{pay.company_name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{pay.plan_name} • via {pay.payment_method?.toUpperCase()}</div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-emerald-400">₹{Number(pay.amount || 0).toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{new Date(pay.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
