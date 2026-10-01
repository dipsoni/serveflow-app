import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Users2,
  Lock,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard & Metrics' },
  { id: 'pos', label: 'POS Billing Terminal' },
  { id: 'orders', label: 'Orders & Dispatch' },
  { id: 'kot', label: 'Kitchen Display (KOT)' },
  { id: 'tables', label: 'Tables Floor & QR Codes' },
  { id: 'menu', label: 'Menu & Category Catalog' },
  { id: 'inventory', label: 'Inventory & Stock Wastage' },
  { id: 'purchases', label: 'Purchases & Suppliers' },
  { id: 'customers', label: 'Customer Management' },
  { id: 'staff', label: 'Staff & Employees' },
  { id: 'branches', label: 'Branch Outlets' },
  { id: 'reports', label: 'Reports & Analytics Export' },
  { id: 'billing', label: 'Subscription & Billing' },
  { id: 'settings', label: 'Restaurant Settings' },
];

const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'approve'];

export default function RolesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [saving, setSaving] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [permissionMatrix, setPermissionMatrix] = useState({});

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/restaurant/roles');
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error('Error fetching roles', err);
      // Fallback default system roles if backend returns empty
      setRoles([
        {
          id: 'role_branch_mgr',
          name: 'Branch Manager',
          description: 'Full operational control over assigned restaurant branches',
          is_system: false,
          permissions: {
            dashboard: { view: true },
            pos: { view: true, create: true, edit: true },
            orders: { view: true, create: true, edit: true, delete: false, export: true },
            kot: { view: true, edit: true },
            tables: { view: true, create: true, edit: true },
            menu: { view: true, edit: true },
            inventory: { view: true, create: true, edit: true },
            staff: { view: true, create: true, edit: true },
            reports: { view: true, export: true }
          }
        },
        {
          id: 'role_cashier',
          name: 'Cashier',
          description: 'POS billing, order charging, customer registration and receipts',
          is_system: false,
          permissions: {
            pos: { view: true, create: true, edit: true },
            orders: { view: true, create: true },
            customers: { view: true, create: true }
          }
        },
        {
          id: 'role_waiter',
          name: 'Waiter',
          description: 'Table status viewing and customer order taking',
          is_system: false,
          permissions: {
            pos: { view: true, create: true },
            tables: { view: true },
            orders: { view: true, create: true },
            menu: { view: true }
          }
        },
        {
          id: 'role_kitchen',
          name: 'Kitchen Staff',
          description: 'Live KOT screen, ticket status transitions (Preparing/Ready)',
          is_system: false,
          permissions: {
            kot: { view: true, edit: true },
            menu: { view: true }
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    // Initialize default permissions empty
    const initMatrix = {};
    MODULES.forEach((m) => {
      initMatrix[m.id] = { view: false, create: false, edit: false, delete: false, export: false, approve: false };
    });
    setPermissionMatrix(initMatrix);
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');

    const initMatrix = {};
    MODULES.forEach((m) => {
      const existing = role.permissions?.[m.id] || {};
      initMatrix[m.id] = {
        view: !!existing.view,
        create: !!existing.create,
        edit: !!existing.edit,
        delete: !!existing.delete,
        export: !!existing.export,
        approve: !!existing.approve,
      };
    });
    setPermissionMatrix(initMatrix);
    setModalOpen(true);
  };

  const togglePermission = (moduleId, action) => {
    setPermissionMatrix((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId]?.[action]
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      showToast('Please provide a role title', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: roleName,
        description: roleDescription,
        permissions: permissionMatrix
      };

      if (editingRole) {
        await api.put(`/restaurant/roles/${editingRole.id}`, payload);
        showToast(`Role "${roleName}" updated successfully!`, 'success');
      } else {
        await api.post('/restaurant/roles', payload);
        showToast(`Role "${roleName}" created successfully!`, 'success');
      }

      setModalOpen(false);
      fetchRoles();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save role', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete role "${name}"?`)) return;
    try {
      await api.delete(`/restaurant/roles/${id}`);
      showToast(`Role "${name}" deleted.`, 'info');
      fetchRoles();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete role', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> RBAC Access Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Roles & Permissions Matrix
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Create fine-grained designations for Managers, Cashiers, Waiters, and Kitchen staff with granular module permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/erp/users')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Users2 className="w-4 h-4 text-emerald-400" />
            <span>Assign Users & Terminals</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-orange-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      {/* Roles Cards Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const permEntries = Object.entries(role.permissions || {});
            const enabledModuleCount = permEntries.filter(([_, act]) =>
              Object.values(act || {}).some(Boolean)
            ).length;

            return (
              <div
                key={role.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{role.name}</h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {role.is_system ? 'System Preset' : 'Custom Defined'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
                      {enabledModuleCount} Modules Allowed
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 mb-4 leading-relaxed">
                    {role.description || 'Custom staff permission set.'}
                  </p>

                  {/* Summary of Active Permissions */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Access Highlights
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {MODULES.map((m) => {
                        const mPerms = role.permissions?.[m.id];
                        const hasAny = mPerms && Object.values(mPerms).some(Boolean);
                        if (!hasAny) return null;
                        const actionsText = Object.entries(mPerms)
                          .filter(([_, val]) => val)
                          .map(([act]) => act)
                          .join(', ');
                        return (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 shadow-2xs"
                            title={actionsText}
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{m.label.split(' ')[0]}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(role)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Matrix</span>
                  </button>

                  {!role.is_system && (
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete Role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role & Matrix Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Designation Role'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure granular View, Create, Edit, Delete, Export, and Approve rights.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
              {/* Role Name & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Floor Captain / Head Chef"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Description
                  </label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Brief description of responsibilities"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Matrix Table */}
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl mb-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-md z-10 border-b border-slate-200">
                    <tr className="text-slate-700 uppercase font-bold text-[11px]">
                      <th className="py-3 px-4">System Module</th>
                      {ACTIONS.map((act) => (
                        <th key={act} className="py-3 px-3 text-center uppercase">
                          {act}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {MODULES.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {m.label}
                        </td>
                        {ACTIONS.map((act) => {
                          const isChecked = !!permissionMatrix[m.id]?.[act];
                          return (
                            <td key={act} className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(m.id, act)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingRole ? 'Update Role Matrix' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
