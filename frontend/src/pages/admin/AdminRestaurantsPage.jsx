import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Eye,
  KeyRound,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  X,
  Store,
  Users2,
  Receipt,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Selected Restaurant for Details Drawer
  const [selectedRestId, setSelectedRestId] = useState(null);
  const [restDetail, setRestDetail] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('password123');
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/restaurants', {
        params: { search, status: statusFilter }
      });
      setRestaurants(res.data.restaurants || []);
    } catch (err) {
      console.error('Error fetching restaurants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [search, statusFilter]);

  const openDetails = async (id) => {
    setSelectedRestId(id);
    setDrawerTab('overview');
    setDetailLoading(true);
    try {
      const res = await api.get(`/super-admin/restaurants/${id}`);
      setRestDetail(res.data);
    } catch (err) {
      console.error('Error loading restaurant detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (restaurant, newStatus) => {
    try {
      await api.put(`/super-admin/restaurants/${restaurant.id}`, { status: newStatus });
      setStatusMsg(`Status for ${restaurant.name} changed to ${newStatus}`);
      fetchRestaurants();
      if (selectedRestId === restaurant.id) openDetails(restaurant.id);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedRestId) return;
    try {
      const res = await api.post(`/super-admin/restaurants/${selectedRestId}/reset-password`, { newPassword });
      alert(res.data.message || 'Password reset successfully');
      setResetModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedRestId) return;
    try {
      const res = await api.post(`/super-admin/restaurants/${selectedRestId}/extend-subscription`, { days: extendDays });
      alert(res.data.message || 'Subscription extended successfully');
      setExtendModalOpen(false);
      fetchRestaurants();
      openDetails(selectedRestId);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Restaurant Tenants & Businesses</h1>
          <p className="text-xs text-slate-400 mt-1">
            Governing enterprise multi-tenant restaurants, subscription status, and active branch quotas.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by restaurant, ID, owner..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['ALL', 'ACTIVE', 'TRIAL', 'EXPIRED', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Restaurant / Tenant</th>
                <th className="py-4 px-6">Owner Contact</th>
                <th className="py-4 px-6">Plan Tier</th>
                <th className="py-4 px-6">Outlets & Staff</th>
                <th className="py-4 px-6">Expiry</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading tenants...
                  </td>
                </tr>
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No restaurants found matching your filters.
                  </td>
                </tr>
              ) : (
                restaurants.map((rest) => (
                  <tr key={rest.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">{rest.name}</div>
                      <div className="text-[11px] font-mono text-orange-400 mt-0.5">{rest.business_id}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{rest.city}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{rest.owner_name}</div>
                      <div className="text-slate-400 text-[11px]">{rest.owner_email}</div>
                      <div className="text-slate-500 text-[10px]">{rest.owner_phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-white">{rest.plan_name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300">
                          <strong className="text-white">{rest.branches_count || 1}</strong> Branches
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-300">
                          <strong className="text-white">{rest.staff_count || 1}</strong> Staff
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-slate-300">{rest.subscription_expiry || 'Active'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          rest.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : rest.status === 'TRIAL'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {rest.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetails(rest.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-400" />
                          Inspect
                        </button>
                        {rest.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleToggleStatus(rest, 'SUSPENDED')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(rest, 'ACTIVE')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESTAURANT DETAILS SLIDE-OVER DRAWER */}
      {selectedRestId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedRestId(null)}
          />

          <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col z-10 shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white">{restDetail?.restaurant?.name || 'Restaurant Details'}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {restDetail?.restaurant?.business_id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Tenant Overview & Cross-Branch Inspection</p>
              </div>
              <button
                onClick={() => setSelectedRestId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap gap-2">
              <button
                onClick={() => setExtendModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 border border-slate-700"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Extend Subscription (+30d)
              </button>
              <button
                onClick={() => setResetModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 border border-slate-700"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                Reset Owner Password
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="px-6 border-b border-slate-800 flex gap-6 text-xs font-bold text-slate-400">
              {['overview', 'branches', 'staff', 'orders', 'payments', 'audit'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`py-3 capitalize transition-all border-b-2 ${
                    drawerTab === tab
                      ? 'border-purple-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'audit' ? 'Activity Audit' : tab}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {detailLoading ? (
                <div className="py-20 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading details...
                </div>
              ) : restDetail ? (
                <>
                  {/* OVERVIEW TAB */}
                  {drawerTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                        <div className="text-slate-400 uppercase text-[10px] font-bold">Business Information</div>
                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                          <div><span className="text-slate-500">Owner:</span> <strong className="text-white">{restDetail.restaurant?.owner_name}</strong></div>
                          <div><span className="text-slate-500">Email:</span> <span className="text-white">{restDetail.restaurant?.owner_email}</span></div>
                          <div><span className="text-slate-500">City:</span> <span className="text-white">{restDetail.restaurant?.city}</span></div>
                          <div><span className="text-slate-500">Status:</span> <span className="text-emerald-400 font-bold">{restDetail.restaurant?.status}</span></div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                        <div className="text-slate-400 uppercase text-[10px] font-bold">Subscription Plan & Limits</div>
                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                          <div><span className="text-slate-500">Active Tier:</span> <strong className="text-purple-400">{restDetail.restaurant?.plan_name}</strong></div>
                          <div><span className="text-slate-500">Validity Expiry:</span> <span className="text-white">{restDetail.restaurant?.subscription_expiry}</span></div>
                          <div><span className="text-slate-500">Allowed Outlets:</span> <span className="text-white font-bold">{restDetail.restaurant?.plan?.max_branches} Branches</span></div>
                          <div><span className="text-slate-500">Allowed Staff:</span> <span className="text-white font-bold">{restDetail.restaurant?.plan?.max_staff} Users</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BRANCHES TAB */}
                  {drawerTab === 'branches' && (
                    <div className="space-y-3">
                      <div className="text-slate-400 text-xs">Outlets under this tenant ({restDetail.branches?.length || 0}):</div>
                      {restDetail.branches?.map((b) => (
                        <div key={b.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-sm">{b.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{b.city} • {b.address}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* STAFF TAB */}
                  {drawerTab === 'staff' && (
                    <div className="space-y-3">
                      <div className="text-slate-400 text-xs">Employees & RBAC scopes ({restDetail.staff?.length || 0}):</div>
                      {restDetail.staff?.map((u) => (
                        <div key={u.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-400">{u.email} • Role: <span className="text-purple-400 font-semibold">{u.roleName}</span></div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {u.has_all_branch_access ? 'All Outlets' : `${u.branches?.length || 1} Outlets`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PAYMENTS TAB */}
                  {drawerTab === 'payments' && (
                    <div className="space-y-3">
                      <div className="text-slate-400 text-xs">Subscription billing receipts ({restDetail.payments?.length || 0}):</div>
                      {restDetail.payments?.map((p) => (
                        <div key={p.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs text-slate-400">{p.transaction_id}</span>
                            <div className="text-sm font-bold text-white mt-0.5">{p.plan_name}</div>
                            <div className="text-[10px] text-slate-500">Method: {p.payment_method?.toUpperCase()}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-bold text-emerald-400">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                            <div className="text-[10px] text-slate-500 mt-0.5">{new Date(p.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AUDIT TAB */}
                  {drawerTab === 'audit' && (
                    <div className="space-y-3">
                      <div className="text-slate-400 text-xs">Immutable security audit footprints:</div>
                      {restDetail.auditLogs?.map((a, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-purple-400">{a.action}</span>
                            <span className="text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
                          </div>
                          <div className="text-slate-300 mt-1 font-mono text-[11px]">
                            by {a.user_name} (IP: {a.ip_address})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* EXTEND SUBSCRIPTION MODAL */}
      {extendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Extend Subscription</h3>
            <p className="text-xs text-slate-400 mb-4">Grant extension days without changing tenant billing status.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Extension Days</label>
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
                >
                  <option value={15}>+15 Days</option>
                  <option value={30}>+30 Days (1 Month)</option>
                  <option value={90}>+90 Days (Quarterly)</option>
                  <option value={365}>+365 Days (1 Year)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setExtendModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExtendSubscription}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
                >
                  Confirm Extension
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET OWNER PASSWORD MODAL */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Reset Owner Password</h3>
            <p className="text-xs text-slate-400 mb-4">Set a temporary or new password for this restaurant's primary owner.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
                >
                  Save New Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
