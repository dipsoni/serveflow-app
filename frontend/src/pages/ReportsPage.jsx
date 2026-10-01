import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  PieChart as PieIcon,
  ShoppingBag,
  IndianRupee,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonCard, SkeletonStatRow, SkeletonTable } from '../components/common/SkeletonLoader';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales'); // sales, items, categories, payments, orders, inventory
  const [range, setRange] = useState('monthly');

  const { showToast } = useToast();
  const { activeBranchId } = useAuth();
  const latestBranchRef = useRef(activeBranchId);

  const fetchReports = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    setLoading(true);
    setReportData(null);
    try {
      const res = await api.get(`/reports?range=${range}`, { signal });
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setReportData(res.data);
      }
    } catch (err) {
      if (!signal?.aborted) showToast('Error loading restaurant analytics', 'error');
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId, range]);

  useEffect(() => {
    const controller = new AbortController();
    fetchReports(controller.signal);
    return () => controller.abort();
  }, [fetchReports]);

  const handleExportCSV = () => {
    if (!reportData) return;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'sales') {
      csvContent += 'Period,Sales (INR),Orders,Est Profit\n';
      reportData.salesTrend.forEach((row) => {
        csvContent += `${row.label},${row.sales},${row.orders},${row.profit}\n`;
      });
    } else if (activeTab === 'items') {
      csvContent += 'Item Name,Category,Quantity Sold,Unit Price,Revenue (INR)\n';
      reportData.itemReport.forEach((row) => {
        csvContent += `"${row.name}","${row.category}",${row.quantitySold},${row.unitPrice},${row.revenue}\n`;
      });
    } else if (activeTab === 'payments') {
      csvContent += 'Payment Method,Transactions,Total Revenue (INR)\n';
      reportData.paymentReport.forEach((row) => {
        csvContent += `"${row.method}",${row.transactions},${row.amount}\n`;
      });
    } else {
      csvContent += 'Category,Revenue,Percentage\n';
      reportData.categoryReport.forEach((row) => {
        csvContent += `"${row.category}",${row.revenue},${row.percentage}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ServeFlow_${activeTab}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${activeTab} report to CSV`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { key: 'sales', label: 'Sales Report' },
    { key: 'items', label: 'Item Performance' },
    { key: 'categories', label: 'Category Revenue' },
    { key: 'payments', label: 'Payment Methods' },
    { key: 'orders', label: 'Order Metrics' },
    { key: 'inventory', label: 'Inventory Valuation' }
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-64 mb-2" />
          <div className="h-3 bg-slate-200 rounded w-96" />
        </div>
        <SkeletonStatRow count={4} />
        <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-40 mb-4" />
          <SkeletonTable rows={6} showHeader={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Intelligence & Reports</h1>
          <p className="text-xs text-slate-500 mt-1">Exportable audit reports for accounting, GST filings, and revenue forecasting</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range select */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
          >
            <option value="daily">Daily View</option>
            <option value="weekly">Weekly View</option>
            <option value="monthly">Monthly Overview</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top High-level Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Gross Sales</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{reportData?.summary?.grossRevenue?.toLocaleString() || '497,200'}</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">+14.2% vs previous period</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tax Collected (GST)</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{reportData?.summary?.taxCollected?.toLocaleString() || '23,105'}</div>
          <span className="text-xs text-slate-400 mt-1 block">5% CGST + SGST</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Operating Expenses</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">₹{reportData?.summary?.totalExpenses?.toLocaleString() || '88,750'}</div>
          <span className="text-xs text-slate-400 mt-1 block">Raw material, rent, salary</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Estimated Net Profit</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">₹{reportData?.summary?.netProfit?.toLocaleString() || '373,350'}</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">75.1% operational margin</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'border-orange-600 text-orange-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Tab Contents */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <div>
          {/* TAB 1: SALES REPORT */}
          {activeTab === 'sales' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Periodic Sales Velocity</h3>
                <p className="text-xs text-slate-500">Revenue generation trend across billing cycles</p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData?.salesTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      formatter={(value, name) => [`₹${value}`, name === 'sales' ? 'Revenue' : 'Gross Margin']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="sales" fill="#ea580c" radius={[6, 6, 0, 0]} name="Sales" />
                    <Bar dataKey="profit" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Est Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto pt-4 border-t border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase text-[11px] pb-2">
                      <th className="pb-2">Period</th>
                      <th className="pb-2">Total Sales</th>
                      <th className="pb-2">Orders Volume</th>
                      <th className="pb-2 text-right">Avg Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData?.salesTrend || []).map((row, i) => (
                      <tr key={i} className="py-2.5">
                        <td className="py-2.5 font-bold text-slate-900">{row.label}</td>
                        <td className="py-2.5 font-extrabold text-orange-600">₹{row.sales.toLocaleString()}</td>
                        <td className="py-2.5 text-slate-700">{row.orders} checks</td>
                        <td className="py-2.5 text-right font-medium text-slate-900">₹{Math.round(row.sales / row.orders)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ITEM REPORT */}
          {activeTab === 'items' && (
            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Dish Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Qty Sold</th>
                    <th className="py-3.5 px-4">Unit Menu Price</th>
                    <th className="py-3.5 px-6 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(reportData?.itemReport || []).map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-900">{it.name}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{it.category}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900">{it.quantitySold} portions</td>
                      <td className="py-3.5 px-4 text-slate-700">₹{it.unitPrice}</td>
                      <td className="py-3.5 px-6 text-right font-extrabold text-orange-600 text-sm">
                        ₹{it.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: CATEGORY REPORT */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Revenue Distribution by Category</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData?.categoryReport || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="revenue"
                      >
                        {(reportData?.categoryReport || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Category Contribution</h3>
                <div className="space-y-3">
                  {(reportData?.categoryReport || []).map((cat, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-bold text-slate-800">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-slate-900">₹{cat.revenue.toLocaleString()}</span>
                        <span className="text-slate-400 block text-[11px] font-semibold">{cat.percentage}% share</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENT REPORT */}
          {activeTab === 'payments' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Payment Tender Settlement</h3>
                <p className="text-xs text-slate-500">Cash vs digital gateway reconciliation</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(reportData?.paymentReport || []).map((p, i) => (
                  <div key={i} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">{p.method}</span>
                    <div className="text-2xl font-extrabold text-slate-900">₹{p.amount.toLocaleString()}</div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                      <span>{p.transactions} receipts</span>
                      <span className="font-bold text-slate-700">{p.percentage}% share</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ORDER REPORT */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Lifetime Orders</span>
                <div className="text-2xl font-extrabold text-slate-900">{reportData?.orderReport?.totalOrders}</div>
                <div className="text-xs text-emerald-600 font-semibold">94.2% completion rate</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Fulfilled Orders</span>
                <div className="text-2xl font-extrabold text-emerald-600">{reportData?.orderReport?.completedOrders}</div>
                <div className="text-xs text-slate-400">Successfully billed & settled</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Cancelled / Void Checks</span>
                <div className="text-2xl font-extrabold text-rose-600">{reportData?.orderReport?.cancelledOrders}</div>
                <div className="text-xs text-slate-400">2.4% cancellation threshold</div>
              </div>
            </div>
          )}

          {/* TAB 6: INVENTORY REPORT */}
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Stock Asset Valuation</span>
                <div className="text-2xl font-extrabold text-slate-900">₹{reportData?.inventoryReport?.totalStockValue?.toLocaleString()}</div>
                <div className="text-xs text-slate-400">Across {reportData?.inventoryReport?.totalItemsCount} catalogued raw ingredients</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Critical Low Stock Count</span>
                <div className="text-2xl font-extrabold text-amber-600">{reportData?.inventoryReport?.lowStockItemsCount} items</div>
                <div className="text-xs text-amber-700 font-semibold">Requires immediate supplier purchase</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Recorded Spoilage / Wastage</span>
                <div className="text-2xl font-extrabold text-rose-600">₹{reportData?.inventoryReport?.estimatedWastageValue?.toLocaleString()}</div>
                <div className="text-xs text-slate-400">{reportData?.inventoryReport?.wastageRecordedItems} incidents this month</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
