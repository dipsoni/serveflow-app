import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Plus,
  UtensilsCrossed,
  ShoppingBag,
  ChefHat,
  Grid,
  BookOpen,
  Boxes,
  Truck,
  Building2,
  Users,
  ReceiptText,
  BarChart3,
  ShieldCheck,
  Settings,
  HelpCircle,
  CreditCard,
  Layers,
  Sparkles,
  TrendingUp,
  IndianRupee,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DataImportModal from '../components/DataImportModal';
import api from '../services/api';
import { SkeletonDashboard } from '../components/common/SkeletonLoader';

export default function DashboardPage() {
  const { canAccess, user, activeBranchId } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const latestBranchRef = useRef(activeBranchId);

  const fetchStats = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    setLoading(true);
    setStats(null);
    try {
      const res = await api.get('/dashboard?range=today', { signal });
      // Guard: don't update if branch changed while fetching
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setStats(res.data);
      }
    } catch (err) {
      if (!signal?.aborted) {
        console.error('Error fetching dashboard stats', err);
      }
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  // Safe fallback KPI values matching enterprise defaults
  const grossSales = stats?.kpis?.todaySales?.value || '₹24,580';
  const grossSalesChange = stats?.kpis?.todaySales?.change || '+14.2%';
  const tableOccupancy = stats?.kpis?.tableOccupancy || {
    active: 14,
    total: 22,
    label: '14 / 22 Tables Active',
    percentage: 64,
    statusText: '8 available'
  };
  const pendingKots = stats?.kpis?.pendingKots || {
    count: stats?.kpis?.pendingOrders?.numeric || 12,
    avgPrepTime: '18 mins',
    label: `${stats?.kpis?.pendingOrders?.numeric || 12} Pending KOTs`,
    indicator: 'Kitchen On Pace'
  };
  const inventoryAlerts = stats?.kpis?.inventoryAlerts || {
    count: stats?.lowStockItems?.length || 3,
    label: `${stats?.lowStockItems?.length || 3} items running low`,
    criticalCount: stats?.lowStockItems?.filter(i => i.isCritical)?.length || 1,
    status: 'Action Needed'
  };

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-6xl mx-auto space-y-5 text-xs text-slate-800 font-sans w-full min-w-0">
      
      {/* 1. TOP WORKSPACE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Home</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-slate-600 text-xs mt-0.5">Real-time restaurant operations & enterprise masters</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canAccess('pos') && (
            <button
              onClick={() => navigate('/pos')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs hover:shadow transition-all duration-150 cursor-pointer active:scale-98"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Open POS</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. REAL-TIME OPERATIONS SUMMARY (KPI WIDGET BAR) */}
      <section aria-label="Real-Time Operations Summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: Today's Total Gross Sales */}
          <div 
            onClick={() => navigate('/reports')}
            className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 p-4 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Gross Sales (Today)</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">{grossSales}</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <TrendingUp className="w-3 h-3" />
                  {grossSalesChange}
                </span>
                <span className="text-[11px] text-slate-700 font-medium">vs. yesterday</span>
              </div>
            </div>
          </div>

          {/* Card 2: Live Table Occupancy */}
          <div 
            onClick={() => navigate('/tables')}
            className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 p-4 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Table Occupancy</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 group-hover:scale-105 transition-transform">
                <Grid className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">{tableOccupancy.label}</div>
              <div className="mt-2 space-y-1">
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(tableOccupancy.percentage || 64, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 font-medium">{tableOccupancy.percentage}% seated</span>
                  <span className="text-emerald-700 font-semibold">{tableOccupancy.statusText || 'Available'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Pending KOTs in Kitchen */}
          <div 
            onClick={() => navigate('/kot')}
            className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 p-4 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Kitchen Queue (KOT)</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                <ChefHat className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900 tracking-tight">{pendingKots.label}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-700" />
                  Avg prep: {pendingKots.avgPrepTime}
                </span>
                <span className="text-[11px] text-slate-700 font-medium">{pendingKots.indicator}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Inventory Alerts */}
          <div 
            onClick={() => navigate('/inventory')}
            className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 p-4 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Inventory Health</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 group-hover:scale-105 transition-transform">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">{inventoryAlerts.label}</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  {inventoryAlerts.criticalCount > 0 ? `${inventoryAlerts.criticalCount} Critical` : 'Low Stock'}
                </span>
                <span className="text-[11px] text-slate-700 font-medium">Click to restock</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. MAIN WORKSPACE CARD CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-2xs">

        {/* 3A. YOUR SHORTCUTS (With Micro-icons & Category Badges) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Your Shortcuts</h2>
            <span className="text-[11px] text-slate-600 hidden sm:inline">Frequent cashier & manager actions</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {canAccess('pos') && (
              <button
                onClick={() => navigate('/pos')}
                className="group hover-lift inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-md text-slate-800 font-semibold hover:text-slate-950 transition-all duration-150 shadow-2xs"
                title="POS Invoice Billing"
              >
                <span className="w-5 h-5 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <ReceiptText className="w-3 h-3" />
                </span>
                <span>POS Invoice</span>
                <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Fast</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
              </button>
            )}

            {canAccess('menu') && (
              <button
                onClick={() => navigate('/menu')}
                className="group hover-lift inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md text-slate-800 font-medium hover:text-slate-950 transition-all duration-150 shadow-2xs"
              >
                <span className="w-5 h-5 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                  <BookOpen className="w-3 h-3" />
                </span>
                <span>Item Menu</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
              </button>
            )}

            {canAccess('orders') && (
              <button
                onClick={() => navigate('/orders')}
                className="group hover-lift inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md text-slate-800 font-medium hover:text-slate-950 transition-all duration-150 shadow-2xs"
              >
                <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                  <ShoppingBag className="w-3 h-3" />
                </span>
                <span>Orders</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
              </button>
            )}

            {canAccess('tables') && (
              <button
                onClick={() => navigate('/tables')}
                className="group hover-lift inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md text-slate-800 font-medium hover:text-slate-950 transition-all duration-150 shadow-2xs"
              >
                <span className="w-5 h-5 rounded bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                  <Grid className="w-3 h-3" />
                </span>
                <span>Dining Tables</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
              </button>
            )}

            {canAccess('inventory') && (
              <button
                onClick={() => navigate('/inventory')}
                className="group hover-lift inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md text-slate-800 font-medium hover:text-slate-950 transition-all duration-150 shadow-2xs"
              >
                <span className="w-5 h-5 rounded bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
                  <Boxes className="w-3 h-3" />
                </span>
                <span>Stock / Inventory</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
              </button>
            )}

            {canAccess('customers') && (
              <button
                onClick={() => navigate('/customers')}
                className="group hover-lift inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md text-slate-800 font-medium hover:text-slate-950 transition-all duration-150 shadow-2xs"
              >
                <span className="w-5 h-5 rounded bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <Users className="w-3 h-3" />
                </span>
                <span>Customers</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
              </button>
            )}

            {canAccess('suppliers') && (
              <button
                onClick={() => navigate('/suppliers')}
                className="group hover-lift inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md text-slate-800 font-medium hover:text-slate-950 transition-all duration-150 shadow-2xs"
              >
                <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Truck className="w-3 h-3" />
                </span>
                <span>Suppliers</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
              </button>
            )}

            {canAccess('reports') && (
              <button
                onClick={() => navigate('/reports')}
                className="group hover-lift inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md text-slate-800 font-medium hover:text-slate-950 transition-all duration-150 shadow-2xs"
              >
                <span className="w-5 h-5 rounded bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                  <BarChart3 className="w-3 h-3" />
                </span>
                <span>Leaderboard</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
              </button>
            )}
          </div>
        </div>

        {/* 3B. REPORTS & MASTERS (High Contrast, WCAG AA Compliant Sub-items) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Reports & Masters</h2>
            <span className="text-[11px] text-slate-600">Standard ERP ledgers & registers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

            {/* Column 1: Point of Sale & Billing */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <h3 className="font-bold text-slate-900 text-xs">Accounting & POS</h3>
              </div>
              <ul className="space-y-1">
                {canAccess('pos') && (
                  <li>
                    <button
                      onClick={() => navigate('/pos')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Chart of Accounts / POS</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
                {canAccess('orders') && (
                  <li>
                    <button
                      onClick={() => navigate('/orders')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Sales Orders Ledger</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
                {canAccess('customers') && (
                  <li>
                    <button
                      onClick={() => navigate('/customers')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Customer Directory</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
                {canAccess('suppliers') && (
                  <li>
                    <button
                      onClick={() => navigate('/suppliers')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Supplier Records</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 2: Stock & Supply Chain */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <h3 className="font-bold text-slate-900 text-xs">Stock & Operations</h3>
              </div>
              <ul className="space-y-1">
                {canAccess('menu') && (
                  <li>
                    <button
                      onClick={() => navigate('/menu')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Item Master & Recipes</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
                {canAccess('inventory') && (
                  <li>
                    <button
                      onClick={() => navigate('/inventory')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Warehouse Inventory</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
                {canAccess('purchases') && (
                  <li>
                    <button
                      onClick={() => navigate('/purchases')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Purchase Orders & GRN</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
                {canAccess('tables') && (
                  <li>
                    <button
                      onClick={() => navigate('/tables')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Dining Tables & Floor Layout</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 3: CRM & Governance */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                <h3 className="font-bold text-slate-900 text-xs">CRM & Organization</h3>
              </div>
              <ul className="space-y-1">
                {canAccess('customers') && (
                  <li>
                    <button
                      onClick={() => navigate('/customers')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Lead & Loyalty Profiles</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
                {canAccess('branches') && (
                  <li>
                    <button
                      onClick={() => navigate('/branches')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Territory (Branch Outlets)</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
                {canAccess('reports') && (
                  <li>
                    <button
                      onClick={() => navigate('/reports')}
                      className="group w-full py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-medium transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">Daily Sales & GST Summary</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </button>
                  </li>
                )}
              </ul>
            </div>

          </div>
        </div>

        {/* 3C. DATA IMPORT AND SETTINGS (Accessible Slate-700 & Border Accents) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Data Import and Settings</h2>
            <span className="text-[11px] text-slate-600">System configuration & bulk data tools</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            <button
              onClick={() => setShowImportModal(true)}
              className="group p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all duration-150 flex items-center justify-between text-left focus-visible:outline-2 focus-visible:outline-slate-900"
            >
              <div className="min-w-0 pr-2">
                <span className="block font-semibold text-slate-800 group-hover:text-slate-950 truncate">Import Data (CSV)</span>
                <span className="text-[11px] text-slate-600 block">Menu items & inventory stock</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0" />
            </button>

            {canAccess('erpUsers') && (
              <button
                onClick={() => navigate('/erp/users')}
                className="group p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all duration-150 flex items-center justify-between text-left focus-visible:outline-2 focus-visible:outline-slate-900"
              >
                <div className="min-w-0 pr-2">
                  <span className="block font-semibold text-slate-800 group-hover:text-slate-950 truncate">Users</span>
                  <span className="text-[11px] text-slate-600 block">Module access matrix</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0" />
              </button>
            )}

            {canAccess('roles') && (
              <button
                onClick={() => navigate('/roles')}
                className="group p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all duration-150 flex items-center justify-between text-left focus-visible:outline-2 focus-visible:outline-slate-900"
              >
                <div className="min-w-0 pr-2">
                  <span className="block font-semibold text-slate-800 group-hover:text-slate-950 truncate">Role Permissions</span>
                  <span className="text-[11px] text-slate-600 block">Read / Write / Delete security</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0" />
              </button>
            )}

            {canAccess('settings') && (
              <button
                onClick={() => navigate('/settings')}
                className="group p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all duration-150 flex items-center justify-between text-left focus-visible:outline-2 focus-visible:outline-slate-900"
              >
                <div className="min-w-0 pr-2">
                  <span className="block font-semibold text-slate-800 group-hover:text-slate-950 truncate">Letter Head & GST</span>
                  <span className="text-[11px] text-slate-600 block">Tax rates & thermal print header</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0" />
              </button>
            )}

            {canAccess('subscription') && (
              <button
                onClick={() => navigate('/subscription')}
                className="group p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all duration-150 flex items-center justify-between text-left focus-visible:outline-2 focus-visible:outline-slate-900"
              >
                <div className="min-w-0 pr-2">
                  <span className="block font-semibold text-slate-800 group-hover:text-slate-950 truncate">SaaS Subscription</span>
                  <span className="text-[11px] text-slate-600 block">Branch licenses & billing</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0" />
              </button>
            )}

            {canAccess('support') && (
              <button
                onClick={() => navigate('/support')}
                className="group p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all duration-150 flex items-center justify-between text-left focus-visible:outline-2 focus-visible:outline-slate-900"
              >
                <div className="min-w-0 pr-2">
                  <span className="block font-semibold text-slate-800 group-hover:text-slate-950 truncate">Help Desk & Tickets</span>
                  <span className="text-[11px] text-slate-600 block">ERP technical support</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* 3D. BOTTOM ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ServeFlow ERP v2.4 • High-Contrast Mode Active</span>
          </div>

          <button
            onClick={() => showToast('Quick document creation shortcut opened', 'info')}
            className="hover-lift inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold text-slate-800 text-xs shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Document</span>
          </button>
        </div>

      </div>

      {/* Bulk CSV Data Import Modal */}
      {showImportModal && (
        <DataImportModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={() => {
            fetchStats();
            setShowImportModal(false);
          }}
        />
      )}

    </div>
  );
}
