import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  IndianRupee,
  PieChart as PieIcon,
  Calendar,
  Layers,
  TrendingDown,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportExpenses } from '../utils/exportCSV';
import Modal from '../components/common/Modal';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ todayExpenses: 0, monthExpenses: 0, breakdown: [] });
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Raw Material');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');

  const { showToast } = useToast();
  const { activeBranchId } = useAuth();
  const latestBranchRef = useRef(activeBranchId);

  const categories = ['Electricity', 'Rent', 'Salary', 'Maintenance', 'Raw Material', 'Transport', 'Other'];
  const COLORS = ['#ea580c', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

  const fetchExpenses = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    setLoading(true);
    setExpenses([]);
    try {
      const res = await api.get('/expenses', { signal });
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setExpenses(res.data.expenses || []);
        setSummary(res.data.summary || { todayExpenses: 0, monthExpenses: 0, breakdown: [] });
      }
    } catch (err) {
      if (!signal?.aborted) showToast('Error loading expenses', 'error');
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchExpenses(controller.signal);
    return () => controller.abort();
  }, [fetchExpenses]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        title,
        category,
        amount: Number(amount),
        date,
        payment_method: paymentMethod,
        notes
      });
      showToast('Expense recorded successfully', 'success');
      setAddModal(false);
      setTitle('');
      setAmount('');
      setNotes('');
      fetchExpenses();
    } catch (err) {
      showToast('Error recording expense', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expense Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Operational overheads, maintenance, utility bills and raw material cash outs</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportExpenses(expenses);
              showToast(`Exported ${expenses.length} expenses to CSV`, 'success');
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
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards & Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI 1: Today's Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Operating Expenses</span>
          <div className="text-2xl font-extrabold text-slate-900">₹{summary.todayExpenses?.toLocaleString()}</div>
          <div className="text-xs text-slate-400">Cash and petty outflows today</div>
        </div>

        {/* KPI 2: This Month's Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">This Month's Total Expenses</span>
          <div className="text-2xl font-extrabold text-rose-600">₹{summary.monthExpenses?.toLocaleString()}</div>
          <div className="text-xs text-slate-400">Rent, electricity, wages & raw stock</div>
        </div>

        {/* Pie Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Category Mix</span>
            <span className="text-xs text-slate-400">Top cost drivers</span>
          </div>
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  dataKey="amount"
                >
                  {summary.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <SkeletonModulePage type="table" rows={5} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Title / Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 sm:px-6">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="font-bold text-slate-900 block">{exp.title}</span>
                      {exp.notes && <span className="text-[11px] text-slate-400 mt-0.5 block">{exp.notes}</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                      ₹{Number(exp.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {exp.date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {exp.payment_method}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                      {exp.recorded_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Record Restaurant Expense"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Expense Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Commercial BESCOM Electricity Bill"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="4500"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash (Petty Cash)</option>
                <option value="Card">Corporate Card</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes / Invoice Ref</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid for March meter #HT-9821..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs"
          >
            Record Expense
          </button>
        </form>
      </Modal>
    </div>
  );
}
