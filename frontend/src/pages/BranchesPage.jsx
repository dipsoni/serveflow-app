import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  X,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function BranchesPage() {
  const { user, restaurant, refreshProfile, switchBranch } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [maxBranches, setMaxBranches] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: 'Ahmedabad',
    address: '',
    phone: '',
    manager_name: '',
    opening_time: '11:00 AM',
    closing_time: '11:30 PM',
    is_active: true
  });

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/restaurant/branches');
      setBranches(res.data.branches || []);
      setMaxBranches(res.data.max_branches || 1);
    } catch (err) {
      console.error('Error fetching branches', err);
      showToast('Failed to load branches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openCreateModal = () => {
    if (branches.length >= maxBranches) {
      showToast(`Branch limit reached (${maxBranches} max). Please upgrade your subscription plan.`, 'warning');
      return;
    }
    setEditingBranch(null);
    setFormData({
      name: '',
      code: `BR-${branches.length + 1}`,
      city: 'Ahmedabad',
      address: '',
      phone: '',
      manager_name: '',
      opening_time: '11:00 AM',
      closing_time: '11:30 PM',
      is_active: true
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      city: branch.city || 'Ahmedabad',
      address: branch.address || '',
      phone: branch.phone || '',
      manager_name: branch.manager_name || '',
      opening_time: branch.opening_time || '11:00 AM',
      closing_time: branch.closing_time || '11:30 PM',
      is_active: branch.is_active !== false
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      if (editingBranch) {
        await api.put(`/restaurant/branches/${editingBranch.id}`, formData);
        showToast('Branch updated successfully', 'success');
      } else {
        await api.post('/restaurant/branches', formData);
        showToast('New branch added successfully', 'success');
      }
      setModalOpen(false);
      fetchBranches();
      if (refreshProfile) refreshProfile();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save branch';
      setErrorMsg(msg);
      if (err.response?.status === 403) {
        showToast(msg, 'warning');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (branches.length <= 1) {
      showToast('Cannot delete the primary branch of your restaurant.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to deactivate or remove branch "${name}"?`)) return;

    try {
      await api.delete(`/restaurant/branches/${id}`);
      showToast(`Branch "${name}" deleted.`, 'info');
      fetchBranches();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete branch', 'error');
    }
  };

  const isLimitReached = branches.length >= maxBranches;
  const filteredBranches = branches.filter((b) =>
    (b.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Multi-branch Plan Quota */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-orange-600/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Building2 className="w-3.5 h-3.5" /> Multi-Branch Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Branch Operations & Outlets
          </h1>
          <p className="text-orange-100 text-sm mt-1 max-w-xl">
            Manage separate inventories, POS billing terminals, table layouts, and staff access across your restaurant chain.
          </p>
        </div>

        {/* Quota Progress Badge */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 shrink-0 flex flex-col justify-between min-w-[240px]">
          <div className="flex items-center justify-between gap-4 text-xs font-semibold text-orange-100">
            <span>Branch Quota</span>
            <span className="font-bold text-white text-sm">
              {branches.length} / {maxBranches} Active
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-black/20 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isLimitReached ? 'bg-amber-300' : 'bg-white'
              }`}
              style={{ width: `${Math.min(100, (branches.length / maxBranches) * 100)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-orange-100">
              {isLimitReached ? 'Limit reached' : `${maxBranches - branches.length} slots available`}
            </span>
            <button
              onClick={() => navigate('/subscription')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-white hover:underline cursor-pointer"
            >
              <span>Upgrade Tier</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search branches by name, city, or branch code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-2xs"
          />
        </div>

        <button
          onClick={openCreateModal}
          disabled={isLimitReached}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
            isLimitReached
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Limit Alert if reached */}
      {isLimitReached && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Branch Quota Limit Reached</p>
              <p className="text-xs text-amber-700">
                Your current subscription package allows up to {maxBranches} branches. Upgrade to the Pro or Enterprise tier to unlock additional locations.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/subscription')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Branch Cards Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-2xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Branches Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try adjusting your search criteria or add a new branch outlet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative group"
            >
              <div>
                {/* Branch Code & Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl">
                    {branch.code || 'BR-01'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                      branch.is_active !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {branch.is_active !== false ? 'Operating' : 'Inactive'}
                  </span>
                </div>

                {/* Branch Name & Location */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  {branch.name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{branch.address ? `${branch.address}, ${branch.city}` : branch.city || 'Ahmedabad'}</span>
                </p>

                {/* Contact and Timings */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Contact:
                    </span>
                    <span className="font-medium text-slate-800">{branch.phone || '+91 98765 00000'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Manager:
                    </span>
                    <span className="font-medium text-slate-800">{branch.manager_name || 'Assigned Manager'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Working Hours:
                    </span>
                    <span className="font-medium text-slate-800">
                      {branch.opening_time || '11:00 AM'} - {branch.closing_time || '11:30 PM'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    switchBranch(branch.id);
                    showToast(`Active terminal switched to ${branch.name}`, 'info');
                  }}
                  className="flex-1 py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Switch Terminal Here
                </button>

                <button
                  onClick={() => openEditModal(branch)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Edit Branch"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(branch.id, branch.name)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Branch"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Register New Branch Outlet'}
                </h3>
                <p className="text-xs text-slate-500">
                  Set up location details, operating hours, and branch code.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Bopal Outlet"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. BR-BOPAL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Ahmedabad"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Direct Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 11111"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Shop 4-5, Galaxy Complex, Near South Bopal Ring Road"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designated Branch Manager
                  </label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operating Hours
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.opening_time}
                      onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                      placeholder="11:00 AM"
                      className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      value={formData.closing_time}
                      onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                      placeholder="11:30 PM"
                      className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-xs font-semibold text-slate-700">Active & accepting orders</span>
              </label>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingBranch ? 'Update Branch' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
