import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Check,
  Edit2,
  Trash2,
  AlertCircle,
  Building2,
  Users2,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import api from '../../services/api';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    billing_cycle: 'monthly',
    max_branches: 1,
    max_staff: 5,
    max_orders_per_month: 500,
    features: '',
    is_active: true,
    is_popular: false
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/plans');
      setPlans(res.data.plans || []);
    } catch (err) {
      console.error('Error fetching plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      price: 999,
      billing_cycle: 'monthly',
      max_branches: 2,
      max_staff: 15,
      max_orders_per_month: 2500,
      features: 'POS Billing, QR Contactless Menu, Kitchen Display (KOT), Table Floor Management',
      is_active: true,
      is_popular: false
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      price: plan.price,
      billing_cycle: plan.billing_cycle || 'monthly',
      max_branches: plan.max_branches,
      max_staff: plan.max_staff,
      max_orders_per_month: plan.max_orders_per_month || 10000,
      features: Array.isArray(plan.features) ? plan.features.join(', ') : (plan.features || ''),
      is_active: plan.is_active !== false,
      is_popular: !!plan.is_popular
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        max_branches: Number(formData.max_branches),
        max_staff: Number(formData.max_staff),
        max_orders_per_month: Number(formData.max_orders_per_month),
        features: formData.features
          ? formData.features.split(',').map((f) => f.trim()).filter(Boolean)
          : []
      };

      if (editingPlan) {
        await api.put(`/super-admin/plans/${editingPlan.id}`, payload);
        setSuccessMsg(`Plan "${payload.name}" updated successfully!`);
      } else {
        await api.post('/super-admin/plans', payload);
        setSuccessMsg(`Plan "${payload.name}" created successfully!`);
      }

      setModalOpen(false);
      fetchPlans();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${name}"?`)) return;
    try {
      await api.delete(`/super-admin/plans/${id}`);
      setSuccessMsg(`Plan "${name}" deleted.`);
      fetchPlans();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-purple-400" />
            Subscription Tiers & Plans
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure multi-tenant SaaS tiers, quota limits, pricing rules, and feature flags.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Tier</span>
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Plans */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Subscription Plans Found</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Get started by creating your first subscription package for restaurant owners.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
          >
            Create Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const features = Array.isArray(plan.features) ? plan.features : [];
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 ${
                  plan.is_popular
                    ? 'bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border-purple-500/50 shadow-xl shadow-purple-950/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Popular Badge */}
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </div>
                )}

                <div>
                  {/* Top: Name & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400 font-mono uppercase">{plan.code}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        plan.is_active !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {plan.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-4 mb-4 pb-4 border-b border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">
                        {plan.price === 0 ? 'Free' : `₹${Number(plan.price).toLocaleString()}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-xs text-slate-400 font-medium">
                          /{plan.billing_cycle || 'month'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {plan.description || 'Standard multi-tenant restaurant package.'}
                    </p>
                  </div>

                  {/* Quotas & Limits */}
                  <div className="space-y-2.5 mb-6 text-xs text-slate-300">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Branches Allowed</span>
                      </div>
                      <span className="font-bold text-white">{plan.max_branches}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Staff Accounts</span>
                      </div>
                      <span className="font-bold text-white">{plan.max_staff}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Monthly Orders</span>
                      </div>
                      <span className="font-bold text-white">
                        {plan.max_orders_per_month ? plan.max_orders_per_month.toLocaleString() : 'Unlimited'}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Included Capabilities
                    </p>
                    {features.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Standard features enabled</p>
                    ) : (
                      features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Tier</span>
                  </button>

                  <button
                    onClick={() => handleDeletePlan(plan.id, plan.name)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingPlan ? `Edit Tier: ${editingPlan.name}` : 'Create Subscription Tier'}
                </h3>
                <p className="text-xs text-slate-400">
                  Define pricing, branch caps, and feature unlocks for this SaaS tier.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plan Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Enterprise Plus"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unique Plan Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. enterprise_plus"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Target audience or short summary"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monthly Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              {/* Hard Quotas */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Enforced Tenant Limits
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Max Branches
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.max_branches}
                      onChange={(e) => setFormData({ ...formData, max_branches: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Max Staff Seats
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.max_staff}
                      onChange={(e) => setFormData({ ...formData, max_staff: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Max Monthly Orders
                    </label>
                    <input
                      type="number"
                      min="100"
                      required
                      value={formData.max_orders_per_month}
                      onChange={(e) => setFormData({ ...formData, max_orders_per_month: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Features (Comma-separated) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Feature Highlights (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="POS Billing, Contactless QR Menu, Inventory Tracking, Multi-Branch Analytics"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-800"
                  />
                  <span className="text-xs font-medium text-slate-300">Available to Customers</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-800"
                  />
                  <span className="text-xs font-medium text-purple-400 font-bold">Highlight as Popular</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingPlan ? 'Update Plan Tier' : 'Save & Publish Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
