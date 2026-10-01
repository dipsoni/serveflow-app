import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Lock,
  Download
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportEmployees } from '../utils/exportCSV';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('cashier');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  const { showToast } = useToast();
  const { activeBranchId } = useAuth();
  const latestBranchRef = useRef(activeBranchId);

  const fetchEmployees = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    setLoading(true);
    setEmployees([]);
    try {
      const res = await api.get('/employees', { signal });
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setEmployees(res.data || []);
      }
    } catch (err) {
      if (!signal?.aborted) showToast('Error loading staff roster', 'error');
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchEmployees(controller.signal);
    return () => controller.abort();
  }, [fetchEmployees]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', {
        name,
        phone,
        email,
        role,
        salary: Number(salary) || 0,
        joining_date: joiningDate
      });
      showToast(`Employee ${name} registered successfully`, 'success');
      setAddModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setSalary('');
      fetchEmployees();
    } catch (err) {
      showToast('Error registering employee', 'error');
    }
  };

  const handleToggleStatus = async (emp) => {
    try {
      const newStatus = emp.status === 'active' ? 'inactive' : 'active';
      await api.put(`/employees/${emp.id}`, { status: newStatus });
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: newStatus } : e));
      showToast(`${emp.name} marked as ${newStatus}`, 'info');
    } catch (err) {
      showToast('Error updating status', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff & Roles Management</h1>
          <p className="text-xs text-slate-500 mt-1">Role authorizations: Owner, Manager, Cashier, Kitchen Staff, Waiter</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportEmployees(employees);
              showToast(`Exported ${employees.length} employees to CSV`, 'success');
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setAddModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Roster Table */}
      {loading ? (
        <SkeletonModulePage type="table" rows={5} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Employee</th>
                  <th className="py-3.5 px-4">Role Badge</th>
                  <th className="py-3.5 px-4">Phone / Contact</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4">Permissions Scope</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {employees.map((emp) => {
                  let roleColor = 'bg-slate-100 text-slate-700';
                  if (emp.role === 'owner') roleColor = 'bg-purple-100 text-purple-800 border-purple-200';
                  else if (emp.role === 'manager') roleColor = 'bg-blue-100 text-blue-800 border-blue-200';
                  else if (emp.role === 'cashier') roleColor = 'bg-orange-100 text-orange-800 border-orange-200';
                  else if (emp.role === 'kitchen') roleColor = 'bg-amber-100 text-amber-800 border-amber-200';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-xs flex items-center justify-center text-slate-700">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{emp.name}</span>
                            <span className="text-[11px] text-slate-400">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${roleColor}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {emp.phone}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {emp.joining_date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200 font-medium">
                          {emp.role === 'owner' ? 'Full SuperAdmin Access' :
                           emp.role === 'kitchen' ? 'KOT Screen Only' :
                           emp.role === 'cashier' ? 'POS, Orders & Billing' : 'Operations & Inventory'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                        >
                          {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Register Restaurant Staff Member"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunil Rao"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00005"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@restaurant.com"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              >
                <option value="owner">Owner (Full Access)</option>
                <option value="manager">Manager (All Operations)</option>
                <option value="cashier">Cashier (POS & Orders)</option>
                <option value="kitchen">Kitchen Staff (KOT)</option>
                <option value="waiter">Waiter (Floor Orders)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Monthly Salary (₹)</label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="25000"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Joining Date</label>
            <input
              type="date"
              required
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs"
          >
            Register Staff Account
          </button>
        </form>
      </Modal>
    </div>
  );
}
