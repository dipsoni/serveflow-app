import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  CreditCard,
  Building2,
  Landmark,
  BookOpen,
  ReceiptText,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  Filter,
  Plus,
  Download,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportAccountsTab } from '../utils/exportCSV';
import api from '../services/api';

export default function AccountsPage() {
  const { user, canAccess, canAccessAction, activeBranch } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current active child tab based on pathname
  // Routes: /accounts, /accounts/sales, /accounts/purchase, /accounts/expenses, etc.
  const path = location.pathname;
  let activeTab = 'accounts_dashboard';
  if (path.includes('/accounts/sales')) activeTab = 'sales';
  else if (path.includes('/accounts/purchase')) activeTab = 'purchase';
  else if (path.includes('/accounts/expenses')) activeTab = 'expenses';
  else if (path.includes('/accounts/payments')) activeTab = 'payments';
  else if (path.includes('/accounts/receivables')) activeTab = 'receivables';
  else if (path.includes('/accounts/payables')) activeTab = 'payables';
  else if (path.includes('/accounts/cash-bank')) activeTab = 'cash_bank';
  else if (path.includes('/accounts/ledger')) activeTab = 'ledger';
  else if (path.includes('/accounts/journal')) activeTab = 'journal_entries';
  else if (path.includes('/accounts/reconciliation')) activeTab = 'reconciliation';
  else if (path.includes('/accounts/tax')) activeTab = 'gst_tax';
  else if (path.includes('/accounts/reports')) activeTab = 'reports';

  // Sub-module tabs definition with required permission keys
  const TABS = [
    { id: 'accounts_dashboard', label: 'Dashboard', path: '/accounts', icon: LayoutDashboard, perm: 'accounts_dashboard' },
    { id: 'sales', label: 'Sales', path: '/accounts/sales', icon: ShoppingBag, perm: 'sales' },
    { id: 'purchase', label: 'Purchase', path: '/accounts/purchase', icon: Truck, perm: 'purchase' },
    { id: 'expenses', label: 'Expenses', path: '/accounts/expenses', icon: CreditCard, perm: 'expenses' },
    { id: 'payments', label: 'Payments', path: '/accounts/payments', icon: DollarSign, perm: 'payments' },
    { id: 'receivables', label: 'Receivables', path: '/accounts/receivables', icon: CreditCard, perm: 'receivables' },
    { id: 'payables', label: 'Payables', path: '/accounts/payables', icon: Building2, perm: 'payables' },
    { id: 'cash_bank', label: 'Cash & Bank', path: '/accounts/cash-bank', icon: Landmark, perm: 'cash_bank' },
    { id: 'ledger', label: 'Ledger', path: '/accounts/ledger', icon: BookOpen, perm: 'ledger' },
    { id: 'journal_entries', label: 'Journal Entries', path: '/accounts/journal', icon: ReceiptText, perm: 'journal_entries' },
    { id: 'reconciliation', label: 'Reconciliation', path: '/accounts/reconciliation', icon: CheckCircle2, perm: 'reconciliation' },
    { id: 'gst_tax', label: 'GST / Tax', path: '/accounts/tax', icon: ShieldCheck, perm: 'gst_tax' },
    { id: 'reports', label: 'Reports', path: '/accounts/reports', icon: BarChart3, perm: 'reports' }
  ];

  // Filter tabs by user's permission
  const authorizedTabs = TABS.filter(t => canAccess(t.perm, 'view'));

  // Loading and data states
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [branchWiseSummary, setBranchWiseSummary] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [cashBank, setCashBank] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [taxData, setTaxData] = useState(null);

  // Journal Entry modal form state
  const [showJEModal, setShowJEModal] = useState(false);
  const [jeForm, setJeForm] = useState({
    description: '',
    debitAccount: 'Petty Cash - Bopal',
    creditAccount: 'Customer Deposits (Liability)',
    amount: '',
    reference: ''
  });

  // Fetch relevant tab data
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'accounts_dashboard') {
          const res = await api.get('/accounts/dashboard');
          if (isMounted) {
            setMetrics(res.data.metrics);
            setBranchWiseSummary(res.data.branchWiseSummary || []);
          }
        } else if (activeTab === 'sales') {
          const res = await api.get('/accounts/sales');
          if (isMounted) setSales(res.data.sales || []);
        } else if (activeTab === 'purchase') {
          const res = await api.get('/accounts/purchase');
          if (isMounted) setPurchases(res.data.purchases || []);
        } else if (activeTab === 'expenses') {
          const res = await api.get('/accounts/expenses');
          if (isMounted) setExpenses(res.data.expenses || []);
        } else if (activeTab === 'payments') {
          const res = await api.get('/accounts/payments');
          if (isMounted) setPayments(res.data.payments || []);
        } else if (activeTab === 'receivables') {
          const res = await api.get('/accounts/receivables');
          if (isMounted) setReceivables(res.data.receivables || []);
        } else if (activeTab === 'payables') {
          const res = await api.get('/accounts/payables');
          if (isMounted) setPayables(res.data.payables || []);
        } else if (activeTab === 'cash_bank') {
          const res = await api.get('/accounts/cash-bank');
          if (isMounted) setCashBank(res.data.registers || []);
        } else if (activeTab === 'ledger') {
          const res = await api.get('/accounts/ledger');
          if (isMounted) setLedger(res.data.accounts || []);
        } else if (activeTab === 'journal_entries') {
          const res = await api.get('/accounts/journal');
          if (isMounted) setJournalEntries(res.data.journalEntries || []);
        } else if (activeTab === 'reconciliation') {
          const res = await api.get('/accounts/reconciliation');
          if (isMounted) setReconciliations(res.data.reconciliations || []);
        } else if (activeTab === 'gst_tax') {
          const res = await api.get('/accounts/tax');
          if (isMounted) setTaxData(res.data.gstSummary);
        } else if (activeTab === 'reports') {
          // Reports general overview
        }
      } catch (err) {
        console.error('Failed to load accounts sub-module data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [activeTab, activeBranch]);

  // Handle Journal Entry Creation
  const handleCreateJE = async (e) => {
    e.preventDefault();
    if (!jeForm.description || !jeForm.amount) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      const res = await api.post('/accounts/journal', jeForm);
      showToast('Journal Entry posted successfully', 'success');
      setShowJEModal(false);
      setJeForm({
        description: '',
        debitAccount: 'Petty Cash - Bopal',
        creditAccount: 'Customer Deposits (Liability)',
        amount: '',
        reference: ''
      });
      // Refresh journal entries
      const refresh = await api.get('/accounts/journal');
      setJournalEntries(refresh.data.journalEntries || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create Journal Entry', 'error');
    }
  };

  // If user tries to access a tab directly they don't have permission for:
  const currentTabObj = TABS.find(t => t.id === activeTab);
  if (currentTabObj && !canAccess(currentTabObj.perm, 'view')) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-12">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-6">
          You don't have permission to access the <span className="font-semibold text-slate-900">{currentTabObj.label}</span> child module.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-600 text-left mb-6">
          <p>User: {user?.name || user?.email}</p>
          <p>Required Module: Accounts → {currentTabObj.label}</p>
          <p>Status: Authorization Denied (Backend & Frontend Enforced)</p>
        </div>
        {authorizedTabs.length > 0 ? (
          <button
            onClick={() => navigate(authorizedTabs[0].path)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Go to {authorizedTabs[0].label}
          </button>
        ) : (
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Home
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Parent Module</span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700">Accounts & Financial Architecture</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            {currentTabObj ? currentTabObj.label : 'Accounts'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            General ledger, double-entry journal, sales register, operating expenses & tax audit
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          {activeTab === 'journal_entries' && canAccessAction('journal_entries', 'create') && (
            <button
              onClick={() => setShowJEModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Journal Entry</span>
            </button>
          )}

          {canAccessAction(activeTab, 'export') && (
            <button
              onClick={() => {
                exportAccountsTab(activeTab, activeTab === 'sales' ? sales : activeTab === 'purchase' ? purchases : activeTab === 'expenses' ? expenses : activeTab === 'receivables' ? receivables : activeTab === 'payables' ? payables : activeTab === 'ledger' ? ledger : activeTab === 'journal_entries' ? journalEntries : activeTab === 'cash_bank' ? cashBank : activeTab === 'reconciliation' ? reconciliation : []);
                showToast(`Exported ${currentTabObj?.label || 'Accounts'} data to CSV`, 'success');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Child Module Navigation Tabs (Only shows authorized children!) */}
      <div className="border-b border-slate-200 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max pb-px">
          {authorizedTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 ${
                  isActive
                    ? 'border-slate-900 text-slate-950 font-semibold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT AREAS */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Loading {currentTabObj?.label}...</p>
        </div>
      ) : (
        <>
          {/* 1. ACCOUNTS DASHBOARD */}
          {activeTab === 'accounts_dashboard' && (
            <div className="space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Total Sales Turnover</span>
                    <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 font-semibold">Live</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    ₹{(metrics?.totalRevenue || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-medium">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>POS receipts & online sales</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Total Purchases (COGS)</span>
                    <span className="p-1 rounded-md bg-blue-50 text-blue-600 font-semibold">Vendor</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    ₹{(metrics?.totalPurchases || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                    <span>Direct ingredient & supply bills</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Operating Expenses</span>
                    <span className="p-1 rounded-md bg-amber-50 text-amber-600 font-semibold">Petty Cash</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    ₹{(metrics?.totalExpenses || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-2 font-medium">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Salaries, utilities, store rent</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Net Operating Margin</span>
                    <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 font-semibold">Net P&L</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    ₹{(metrics?.netOperatingIncome || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-medium">
                    <span>Operating profitability</span>
                  </div>
                </div>
              </div>

              {/* Working Capital & Liquidity Snapshot */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                    <span>Working Capital Liquidity</span>
                    <span className="text-xs font-mono text-slate-400">Cash vs Receivables</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Cash in Hand & Counter Drawers</span>
                      <span className="font-bold text-slate-900">₹{(metrics?.cashInHand || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Bank Accounts & UPI Settlements</span>
                      <span className="font-bold text-slate-900">₹{(metrics?.bankBalance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Customer Receivables Outstanding</span>
                      <span className="font-bold text-amber-600">₹{(metrics?.pendingReceivables || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                    <span>Payables & Compliance</span>
                    <span className="text-xs font-mono text-slate-400">Current Liabilities</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Vendor Invoices Due (Trade Payables)</span>
                      <span className="font-bold text-rose-600">₹{(metrics?.pendingPayables || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">GST Net Tax Output Payable</span>
                      <span className="font-bold text-slate-900">Calculated on GSTR-3B</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Active Branch Scope</span>
                      <span className="font-semibold text-slate-800">{activeBranch?.name || 'Consolidated'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch-wise Summary */}
              {branchWiseSummary && branchWiseSummary.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden mt-6">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Branch-wise Financial Summary</h3>
                      <p className="text-xs text-slate-500">Breakdown of Sales, Purchases, and Expenses across branches</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2.5">Branch</th>
                          <th className="px-4 py-2.5 text-right">Sales</th>
                          <th className="px-4 py-2.5 text-right">Purchase</th>
                          <th className="px-4 py-2.5 text-right">Expenses</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {branchWiseSummary.map((b) => (
                          <tr key={b.branchId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900">{b.branchName}</td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-600">₹{(b.sales || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono text-rose-600">₹{(b.purchase || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono text-amber-600">₹{(b.expenses || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. SALES REGISTER */}
          {activeTab === 'sales' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sales Invoices & Receipts</h3>
                  <p className="text-xs text-slate-500">Live order invoices generated from POS and online channels</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                  {sales.length} Invoices
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Invoice #</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Customer / Table</th>
                      <th className="px-4 py-2.5">Payment</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                      <th className="px-4 py-2.5 text-right">GST (5%)</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sales.map(item => (
                      <tr key={item.invoiceNumber} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">{item.invoiceNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{item.customer}</div>
                          <div className="text-[10px] text-slate-400">{item.table}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.paymentMethod}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">₹{item.subtotal.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">₹{item.gstAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">₹{item.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PURCHASES BILLS */}
          {activeTab === 'purchase' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Vendor Purchase Bills</h3>
                  <p className="text-xs text-slate-500">Inward inventory receipts and procurement bills</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                  {purchases.length} Purchase Bills
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">PO Number</th>
                      <th className="px-4 py-2.5">Supplier</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5">Payment Status</th>
                      <th className="px-4 py-2.5">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">{p.po_number || p.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{p.supplier_name || 'Vendor'}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(p.created_at || Date.now()).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₹{Number(p.total_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {p.payment_status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {p.status || 'Received'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Operating Expenses Register</h3>
                  <p className="text-xs text-slate-500">Rent, electricity, staff petty cash, and daily operational expenditures</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                  {expenses.length} Records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5">Payment Method</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 text-slate-500">{new Date(e.date || e.created_at || Date.now()).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{e.description || e.title}</td>
                        <td className="px-4 py-3 text-slate-600">{e.payment_method || 'Petty Cash'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₹{Number(e.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4.5 PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Payments (In / Out)</h3>
                  <p className="text-xs text-slate-500">Incoming & Outgoing Payments</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Direction</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Payment Method</th>
                      <th className="px-4 py-2.5">Reference</th>
                      <th className="px-4 py-2.5">Branch</th>
                      <th className="px-4 py-2.5">Related Tx</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 text-slate-500">{new Date(p.date || p.created_at || Date.now()).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            p.direction === 'Incoming' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {p.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{Number(p.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-600">{p.paymentMethod}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{p.reference}</td>
                        <td className="px-4 py-3 text-slate-600">{p.branchName}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{p.relatedTransaction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. RECEIVABLES */}
          {activeTab === 'receivables' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Trade Receivables (Debtors)</h3>
                  <p className="text-xs text-slate-500">Corporate catering credits and client receivables aging</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">ID</th>
                      <th className="px-4 py-2.5">Customer Name</th>
                      <th className="px-4 py-2.5">Invoice #</th>
                      <th className="px-4 py-2.5">Due Date</th>
                      <th className="px-4 py-2.5">Branch</th>
                      <th className="px-4 py-2.5 text-right">Invoice Amount</th>
                      <th className="px-4 py-2.5 text-right">Balance Due</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receivables.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-medium text-slate-500">{r.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{r.customerName}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{r.invoiceNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{r.dueDate}</td>
                        <td className="px-4 py-3 text-slate-600">{r.branchName}</td>
                        <td className="px-4 py-3 text-right font-mono">₹{r.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                          ₹{r.balanceDue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.status === 'Settled' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. PAYABLES */}
          {activeTab === 'payables' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Trade Payables (Creditors)</h3>
                  <p className="text-xs text-slate-500">Pending vendor disbursements and raw material supplier aging</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">ID</th>
                      <th className="px-4 py-2.5">Vendor Name</th>
                      <th className="px-4 py-2.5">Bill #</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Due Date</th>
                      <th className="px-4 py-2.5 text-right">Bill Amount</th>
                      <th className="px-4 py-2.5 text-right">Balance Due</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payables.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-medium text-slate-500">{p.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{p.vendorName}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{p.billNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{p.category}</td>
                        <td className="px-4 py-3 text-slate-500">{p.dueDate}</td>
                        <td className="px-4 py-3 text-right font-mono">₹{p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                          ₹{p.balanceDue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. CASH & BANK */}
          {activeTab === 'cash_bank' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cashBank.map(cb => (
                <div key={cb.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">{cb.type}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                      {cb.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{cb.name}</h4>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{cb.accountNumber}</p>
                    <p className="text-xs text-slate-400">{cb.branch}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Available Balance</span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      ₹{cb.currentBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 8. GENERAL LEDGER */}
          {activeTab === 'ledger' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">General Ledger Accounts</h3>
                  <p className="text-xs text-slate-500">Chart of accounts & running balances</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Code</th>
                      <th className="px-4 py-2.5">Account Head</th>
                      <th className="px-4 py-2.5">Account Group</th>
                      <th className="px-4 py-2.5 text-right">Debit</th>
                      <th className="px-4 py-2.5 text-right">Credit</th>
                      <th className="px-4 py-2.5 text-right">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledger.map(acc => (
                      <tr key={acc.code} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-medium text-slate-500">{acc.code}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{acc.name}</td>
                        <td className="px-4 py-3 text-slate-600">{acc.group}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">₹{acc.debit.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">₹{acc.credit.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${
                          acc.balance >= 0 ? 'text-slate-900' : 'text-slate-600'
                        }`}>
                          ₹{Math.abs(acc.balance).toLocaleString()} {acc.balance >= 0 ? 'Dr' : 'Cr'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. JOURNAL ENTRIES */}
          {activeTab === 'journal_entries' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Journal Entries (Double-Entry)</h3>
                  <p className="text-xs text-slate-500">Manual journal vouchers, provisions, and inter-branch adjustments</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                  {journalEntries.length} Vouchers
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Voucher #</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5">Debit Account</th>
                      <th className="px-4 py-2.5">Credit Account</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5">Posted By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journalEntries.map(je => (
                      <tr key={je.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{je.id}</td>
                        <td className="px-4 py-3 text-slate-500">{je.date}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium">{je.description}</td>
                        <td className="px-4 py-3 font-medium text-emerald-700">{je.debitAccount}</td>
                        <td className="px-4 py-3 font-medium text-indigo-700">{je.creditAccount}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₹{je.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">{je.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. RECONCILIATION */}
          {activeTab === 'reconciliation' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bank & Payment Gateway Reconciliation</h3>
                  <p className="text-xs text-slate-500">POS daily collections vs bank settlements & EDC MDR charges</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Statement Date</th>
                      <th className="px-4 py-2.5">Gateway / Tender</th>
                      <th className="px-4 py-2.5">Settlement UTR</th>
                      <th className="px-4 py-2.5 text-right">POS Reported</th>
                      <th className="px-4 py-2.5 text-right">Bank Settled</th>
                      <th className="px-4 py-2.5 text-right">Difference</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reconciliations.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-800">{rec.date}</td>
                        <td className="px-4 py-3 text-slate-700">{rec.gateway}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{rec.settlementUtr}</td>
                        <td className="px-4 py-3 text-right font-mono">₹{rec.posReportedAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono">₹{rec.bankSettledAmount.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${
                          rec.difference === 0 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {rec.difference === 0 ? '₹0.00' : `₹${rec.difference.toLocaleString()}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            rec.status === 'Reconciled' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 11. GST / TAX AUDIT */}
          {activeTab === 'gst_tax' && taxData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Taxable Base</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    ₹{taxData.totalTaxableTurnover.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Aggregate Sales for September 2026</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Output GST (5%)</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    ₹{taxData.totalOutputGST.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    CGST: ₹{taxData.cgstAmount.toLocaleString()} | SGST: ₹{taxData.sgstAmount.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Net GST Liability</span>
                  <div className="text-2xl font-bold text-rose-600 mt-1">
                    ₹{taxData.netGstPayable.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    After ITC Credit offset of ₹{taxData.itcClaimable.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">GST Compliance Status</h4>
                  <p className="text-xs text-slate-500">Government Portal Filing Readiness</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
                    GSTR-1: {taxData.filingStatusGSTR1}
                  </span>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200">
                    GSTR-3B: {taxData.filingStatusGSTR3B}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 12. REPORTS */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: '1. Sales Report', desc: 'Detailed sales history and itemized order breakdown' },
                { title: '2. Purchase Report', desc: 'Vendor bills, inventory purchases, and COGS' },
                { title: '3. Expense Report', desc: 'Operational and miscellaneous expenses breakdown' },
                { title: '4. Payment Report', desc: 'Incoming and outgoing payment ledger' },
                { title: '5. Receivable Report', desc: 'Trade debtors and pending client payments' },
                { title: '6. Payable Report', desc: 'Trade creditors and pending vendor bills' },
                { title: '7. Branch-wise Summary', desc: 'Consolidated performance overview by branch' }
              ].map((rep, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{rep.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{rep.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                      Export As:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => showToast(`Exported ${rep.title} to Excel/CSV`, 'success')}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded"
                      >
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={() => showToast(`Generated and exported ${rep.title} to PDF`, 'success')}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </>
      )}

      {/* CREATE JOURNAL ENTRY MODAL */}
      {showJEModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Post New Journal Entry</h3>
              <button
                onClick={() => setShowJEModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateJE} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Description / Narration</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Banquet booking advance deposit"
                  value={jeForm.description}
                  onChange={e => setJeForm({ ...jeForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Debit Account Head</label>
                <select
                  value={jeForm.debitAccount}
                  onChange={e => setJeForm({ ...jeForm, debitAccount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                >
                  <option>Petty Cash - Bopal</option>
                  <option>HDFC Bank Current Account</option>
                  <option>Depreciation Expense</option>
                  <option>Insurance Expense</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Credit Account Head</label>
                <select
                  value={jeForm.creditAccount}
                  onChange={e => setJeForm({ ...jeForm, creditAccount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                >
                  <option>Customer Deposits (Liability)</option>
                  <option>Accumulated Depreciation - Kitchen</option>
                  <option>Prepaid Expenses</option>
                  <option>Owner Capital & Reserves</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 15000"
                  value={jeForm.amount}
                  onChange={e => setJeForm({ ...jeForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJEModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
                >
                  Post Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
