import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MoreVertical,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import api from '../../services/api';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Extend Modal
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extending, setExtending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/subscriptions');
      setSubscriptions(res.data.subscriptions || []);
    } catch (err) {
      console.error('Error fetching subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleExtend = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    setExtending(true);
    try {
      await api.post(`/super-admin/restaurants/${selectedSub.restaurant_id}/extend-subscription`, {
        days: Number(extendDays)
      });
      setSuccessMsg(`Extended subscription for ${selectedSub.restaurant_name} by ${extendDays} days!`);
      setExtendModalOpen(false);
      fetchSubscriptions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to extend subscription');
    } finally {
      setExtending(false);
    }
  };

  const filteredSubs = subscriptions.filter((s) => {
    const matchesSearch =
      (s.restaurant_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.restaurant_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.plan_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status, expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (status === 'expired' || diffDays <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3" /> Expired
        </span>
      );
    }
    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" /> Expires in {diffDays}d
        </span>
      );
    }
    if (status === 'trial') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Clock className="w-3 h-3" /> Trial ({diffDays}d)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" /> Active ({diffDays}d)
      </span>
    );
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-purple-400" />
            Subscriptions Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track active SaaS recurring agreements, license lifecycle, renewal deadlines, and grace periods.
          </p>
        </div>
      </div>

      {/* Success notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant name, ID, or plan..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No subscriptions matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Restaurant Tenant</th>
                  <th className="py-3.5 px-4">Plan / Package</th>
                  <th className="py-3.5 px-4">Billing Rate</th>
                  <th className="py-3.5 px-4">Activation Date</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{sub.restaurant_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{sub.restaurant_id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-lg text-white font-medium">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        <span>{sub.plan_name || 'Standard Plan'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-white">
                      {sub.price === 0 ? 'Free' : `₹${Number(sub.price || 0).toLocaleString()} / ${sub.billing_cycle || 'mo'}`}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {new Date(sub.start_date || sub.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {new Date(sub.expiry_date || sub.end_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(sub.status, sub.expiry_date || sub.end_date)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setExtendModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg font-semibold transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Extend</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Extend Modal */}
      {extendModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Extend Subscription
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Extend license duration for{' '}
              <strong className="text-white">{selectedSub.restaurant_name}</strong> ({selectedSub.restaurant_id}).
            </p>

            <form onSubmit={handleExtend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Extension Days
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[15, 30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDays(d)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        extendDays === d
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setExtendModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extending}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/25 disabled:opacity-50"
                >
                  {extending ? 'Extending...' : 'Confirm Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
