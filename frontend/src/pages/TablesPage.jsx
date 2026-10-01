import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Plus,
  Users,
  UtensilsCrossed,
  Receipt,
  ArrowRightLeft,
  Merge,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  QrCode,
  Copy,
  ExternalLink,
  Printer,
  Search,
  Filter,
  CreditCard,
  Banknote,
  RotateCcw,
  Check
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import PrintableBillModal from '../components/common/PrintableBillModal';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';

export default function TablesPage() {
  const { restaurant, activeBranch, activeBranchId } = useAuth();
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrModalTable, setQrModalTable] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const latestBranchRef = useRef(activeBranchId);

  // Modals
  const [addTableModal, setAddTableModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');

  const [mergeModal, setMergeModal] = useState(false);
  const [mergePrimary, setMergePrimary] = useState('');
  const [mergeSecondary, setMergeSecondary] = useState('');

  const [transferModal, setTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');

  const [viewOrderModal, setViewOrderModal] = useState(null);
  const [billModalOrder, setBillModalOrder] = useState(null);

  // Payment Settlement Modal (Auto-Filled Payable Amount)
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const fetchTables = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    try {
      const [tRes, oRes] = await Promise.all([
        api.get('/tables', { signal }),
        api.get('/orders', { signal })
      ]);
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setTables(tRes.data || []);
        setOrders(oRes.data || []);
      }
    } catch (err) {
      if (!signal?.aborted) showToast('Error loading dining tables', 'error');
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchTables(controller.signal);
    return () => controller.abort();
  }, [fetchTables]);

  // Real-time WebSocket listener for table & payment updates (Requirement 18)
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if ([
            'pos:table_updated',
            'pos:order_updated',
            'order:status_updated',
            'pos:payment_success',
            'pos:order_created',
            'kot:status_updated'
          ].includes(data.type)) {
            fetchTables();
          }
        } catch (e) {
          console.error('[Tables WS Error]', e);
        }
      };
    } catch (err) {
      console.warn('[Tables WS Init Error]', err);
    }

    const interval = setInterval(() => fetchTables(), 10000);
    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, [fetchTables]);

  // Status counts
  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const billingCount = tables.filter(t => t.status === 'billing').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;

  // Filtered tables based on status and search query
  const filteredTables = tables.filter(tbl => {
    const matchesStatus = statusFilter === 'All' || tbl.status === statusFilter.toLowerCase();
    const matchesSearch = !searchQuery.trim() || tbl.table_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateTable = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tables', {
        table_number: newTableNumber,
        capacity: Number(newTableCapacity)
      });
      showToast(`Table ${newTableNumber} created successfully`, 'success');
      setAddTableModal(false);
      setNewTableNumber('');
      setNewTableCapacity('4');
      fetchTables();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating table', 'error');
    }
  };

  const handleUpdateStatus = async (tableId, newStatus) => {
    try {
      await api.put(`/tables/${tableId}`, { status: newStatus });
      showToast(`Table marked as ${newStatus}`, 'success');
      fetchTables();
    } catch (err) {
      showToast('Error updating table status', 'error');
    }
  };

  const handleMergeTables = async () => {
    if (!mergePrimary || !mergeSecondary) return;
    try {
      await api.post('/tables/merge', {
        primaryTableId: mergePrimary,
        secondaryTableId: mergeSecondary
      });
      showToast('Tables successfully merged', 'success');
      setMergeModal(false);
      fetchTables();
    } catch (err) {
      showToast('Error merging tables', 'error');
    }
  };

  const handleTransfer = async () => {
    if (!transferFrom || !transferTo) return;
    try {
      await api.post('/tables/transfer', {
        fromTableId: transferFrom,
        toTableId: transferTo
      });
      showToast('Order transferred to destination table', 'success');
      setTransferModal(false);
      fetchTables();
    } catch (err) {
      showToast('Error transferring order', 'error');
    }
  };

  const findLinkedOrder = (tbl) => {
    if (!tbl) return null;
    if (tbl.current_order_id) {
      const byId = orders.find(o => o.id === tbl.current_order_id && !['paid', 'completed', 'cancelled'].includes(o.status) && o.payment_status !== 'paid');
      if (byId) return byId;
    }
    const cleanNum = String(tbl.table_number || '').trim().replace(/^T-?/i, '');
    return orders.find(o => {
      if (['paid', 'completed', 'cancelled'].includes(o.status) || o.payment_status === 'paid') return false;
      if (o.table_id && o.table_id === tbl.id) return true;
      const oName = String(o.table_name || '').trim().toLowerCase();
      const tNum = String(tbl.table_number || '').trim().toLowerCase();
      return oName === tNum ||
             oName === `table ${tNum}` ||
             oName === `table ${cleanNum}` ||
             oName === `table t${cleanNum}` ||
             oName === `table 0${cleanNum}`;
    }) || null;
  };

  const handleResetTable = async (tableId) => {
    try {
      await api.put(`/tables/${tableId}`, { status: 'available', current_order_id: null });
      showToast('Table released and set to AVAILABLE', 'success');
      fetchTables();
    } catch (err) {
      showToast('Failed to reset table', 'error');
    }
  };

  const handleViewOrder = (table) => {
    const linkedOrder = findLinkedOrder(table);
    if (linkedOrder) {
      setViewOrderModal(linkedOrder);
    } else {
      showToast(`No active order running on ${table.table_number}`, 'info');
    }
  };

  // Action: Mark Order Served (Requirement 6)
  const handleMarkServed = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/mark-served`);
      showToast('Order marked as SERVED to customer', 'success');
      if (viewOrderModal) {
        setViewOrderModal(prev => prev ? ({ ...prev, status: 'served' }) : null);
      }
      fetchTables();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error marking served', 'error');
    }
  };

  // Action: Request Bill (Requirement 8 & 11)
  const handleRequestBill = async (orderId) => {
    try {
      const res = await api.post(`/orders/${orderId}/request-bill`);
      showToast('Order moved to BILLING PENDING', 'info');
      const targetOrder = orders.find(o => o.id === orderId) || res.data;
      if (targetOrder) {
        setBillModalOrder({ ...targetOrder, status: 'billing_pending' });
      }
      if (viewOrderModal) {
        setViewOrderModal(null);
      }
      fetchTables();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating bill status', 'error');
    }
  };

  // Action: Receive Payment & Free Table (Requirement 9, 12, 13, 14, 15)
  const handleConfirmPayment = async () => {
    if (!paymentModalOrder) return;
    setProcessingPayment(true);
    try {
      await api.post(`/orders/${paymentModalOrder.id}/payment`, {
        amount: Number(paymentModalOrder.total),
        payment_method: paymentMethod,
        payment_reference: paymentRef
      });
      showToast(`Payment of ₹${paymentModalOrder.total} received! Table is now automatically AVAILABLE.`, 'success');
      setPaymentModalOrder(null);
      setViewOrderModal(null);
      setPaymentRef('');
      fetchTables();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error processing payment';
      showToast(msg, 'error');
    } finally {
      setProcessingPayment(false);
    }
  };


  if (loading) {
    return <SkeletonModulePage type="tables" />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-800">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dining Tables</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time table occupancy, reservations & quick billing</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTransferModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer Order</span>
          </button>
          <button
            onClick={() => setMergeModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Merge className="w-3.5 h-3.5" />
            <span>Merge Tables</span>
          </button>
          <button
            onClick={() => setAddTableModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Status Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Tables ({tables.length})
          </button>

          <button
            onClick={() => setStatusFilter('Available')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50/50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusFilter === 'Available' ? 'bg-white' : 'bg-emerald-500'}`} />
            <span>Available ({availableCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Occupied')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Occupied'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50/50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusFilter === 'Occupied' ? 'bg-white' : 'bg-amber-500'}`} />
            <span>Occupied ({occupiedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Billing')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Billing'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-50/50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusFilter === 'Billing' ? 'bg-white' : 'bg-orange-500'}`} />
            <span>Billing ({billingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Reserved')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Reserved'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50/50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusFilter === 'Reserved' ? 'bg-white' : 'bg-purple-500'}`} />
            <span>Reserved ({reservedCount})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search table e.g. T01..."
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-slate-400 focus:outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Tables Grid Layout */}
      {filteredTables.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
          <Grid className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No tables found</h3>
          <p className="text-xs text-slate-500">Try changing your search query or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTables.map((tbl) => {
            const linkedOrder = findLinkedOrder(tbl);

            const isServePending = linkedOrder?.status === 'serve_pending';
            const isBilling = (tbl.status === 'billing' || linkedOrder?.status === 'billing_pending') && !!linkedOrder;

            let borderClass = 'border-emerald-200 bg-white hover:border-emerald-400';
            let statusBg = 'bg-emerald-50 text-emerald-700';

            if (tbl.status === 'occupied' || linkedOrder) {
              if (isServePending) {
                borderClass = 'border-indigo-300 bg-indigo-50/30 hover:border-indigo-500 ring-2 ring-indigo-200';
                statusBg = 'bg-indigo-100 text-indigo-800 font-extrabold animate-pulse';
              } else if (isBilling) {
                borderClass = 'border-orange-300 bg-orange-50/30 hover:border-orange-500 ring-2 ring-orange-200';
                statusBg = 'bg-orange-100 text-orange-800 font-bold';
              } else {
                borderClass = 'border-amber-200 bg-amber-50/20 hover:border-amber-400';
                statusBg = 'bg-amber-100 text-amber-800 font-bold';
              }
            } else if (tbl.status === 'reserved') {
              borderClass = 'border-purple-200 bg-purple-50/20 hover:border-purple-400';
              statusBg = 'bg-purple-100 text-purple-800';
            }

            return (
              <div
                key={tbl.id}
                onClick={() => handleViewOrder(tbl)}
                className={`rounded-xl border p-3 sm:p-4 shadow-2xs transition-all flex flex-col justify-between h-52 cursor-pointer ${borderClass}`}
              >
                {/* Top row: Table Number & Capacity */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{tbl.table_number}</h3>
                    {linkedOrder && (
                      <span className="text-[10px] font-mono font-bold text-slate-500 block">
                        {linkedOrder.order_number}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tbl.capacity}</span>
                  </div>
                </div>

                {/* Center status & order preview */}
                <div className="my-auto text-center space-y-1 py-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBg}`}>
                    {linkedOrder ? linkedOrder.status.replace(/_/g, ' ') : tbl.status}
                  </span>

                  {linkedOrder && (
                    <div className="text-[11px] text-slate-700 font-bold pt-0.5 truncate">
                      ₹{linkedOrder.total} • {linkedOrder.customer_name}
                    </div>
                  )}
                </div>

                {/* Bottom Quick Action Hierarchy */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                  {!linkedOrder ? (
                    tbl.status === 'available' ? (
                      <button
                        onClick={() => navigate('/pos')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + New Order
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResetTable(tbl.id)}
                        className="flex-1 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="No active order on this table. Reset status to Available."
                      >
                        Free Table
                      </button>
                    )
                  ) : isServePending ? (
                    <button
                      onClick={() => handleMarkServed(linkedOrder.id)}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                      title="Mark as Served to Table"
                    >
                      <UtensilsCrossed className="w-3 h-3" />
                      <span>Serve</span>
                    </button>
                  ) : isBilling ? (
                    <div className="flex items-center gap-1 flex-1">
                      <button
                        onClick={() => setBillModalOrder(linkedOrder)}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Print Customer Bill"
                      >
                        <Printer className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setPaymentModalOrder(linkedOrder)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        title="Receive Payment & Auto-Free Table"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Pay (₹{linkedOrder.total})</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleViewOrder(tbl)}
                      className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      View Bill
                    </button>
                  )}

                  <button
                    onClick={() => setQrModalTable(tbl)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                    title={`Generate QR Flyer for ${tbl.table_number}`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      )}

      {/* Add Table Modal (Floor field removed) */}
      <Modal
        isOpen={addTableModal}
        onClose={() => setAddTableModal(false)}
        title="Add New Dining Table"
      >
        <form onSubmit={handleCreateTable} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Table Number</label>
            <input
              type="text"
              required
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="e.g. T13"
              className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Capacity (Seats)</label>
            <input
              type="number"
              min="1"
              max="30"
              required
              value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(e.target.value)}
              className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            Create Table
          </button>
        </form>
      </Modal>

      {/* Merge Tables Modal */}
      <Modal
        isOpen={mergeModal}
        onClose={() => setMergeModal(false)}
        title="Merge Dining Tables"
        footer={
          <button
            onClick={handleMergeTables}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Confirm Merge
          </button>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Combine two tables into one service party. The secondary table will be linked to the primary table order.
          </p>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Primary Table (Active Order)</label>
            <select
              value={mergePrimary}
              onChange={(e) => setMergePrimary(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            >
              <option value="">Select Primary Table</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.table_number} ({t.capacity} seats) - {t.status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Secondary Table to Merge</label>
            <select
              value={mergeSecondary}
              onChange={(e) => setMergeSecondary(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            >
              <option value="">Select Secondary Table</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.table_number} ({t.capacity} seats) - {t.status}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Transfer Order Modal */}
      <Modal
        isOpen={transferModal}
        onClose={() => setTransferModal(false)}
        title="Transfer Table Order"
        footer={
          <button
            onClick={handleTransfer}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Transfer Order
          </button>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Move an active order from one table to an empty destination table.
          </p>
          <div>
            <label className="font-bold text-slate-700 block mb-1">From Table (Occupied)</label>
            <select
              value={transferFrom}
              onChange={(e) => setTransferFrom(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            >
              <option value="">Select Source Table</option>
              {tables.filter(t => t.status === 'occupied' || t.status === 'billing').map(t => (
                <option key={t.id} value={t.id}>{t.table_number} ({t.capacity} seats)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">To Table (Available)</label>
            <select
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            >
              <option value="">Select Target Table</option>
              {tables.filter(t => t.status === 'available').map(t => (
                <option key={t.id} value={t.id}>{t.table_number} ({t.capacity} seats)</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* View Table Order Modal */}
      {viewOrderModal && (
        <Modal
          isOpen={!!viewOrderModal}
          onClose={() => setViewOrderModal(null)}
          title={`Order on ${viewOrderModal.table_name || 'Table'}`}
          footer={
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <button
                onClick={() => {
                  setBillModalOrder(viewOrderModal);
                  setViewOrderModal(null);
                }}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>

              <div className="flex items-center gap-2">
                {viewOrderModal.status === 'serve_pending' && (
                  <button
                    onClick={() => handleMarkServed(viewOrderModal.id)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Mark Served</span>
                  </button>
                )}

                {!['paid', 'completed', 'billing_pending'].includes(viewOrderModal.status) && (
                  <button
                    onClick={() => handleRequestBill(viewOrderModal.id)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Billing Pending</span>
                  </button>
                )}

                {!['paid', 'completed'].includes(viewOrderModal.status) && (
                  <button
                    onClick={() => setPaymentModalOrder(viewOrderModal)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay (₹{viewOrderModal.total})</span>
                  </button>
                )}
              </div>
            </div>
          }

        >
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
              <div>
                <span className="font-bold text-slate-900">{viewOrderModal.order_number}</span>
                <span className="text-slate-500 block">Guest: {viewOrderModal.customer_name}</span>
              </div>
              <StatusBadge status={viewOrderModal.status} />
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {(viewOrderModal.items || []).map((it, idx) => (
                <div key={idx} className="py-2 flex justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{it.name}</span>
                    <span className="text-slate-400 text-[11px] block">×{it.quantity}</span>
                  </div>
                  <span className="font-bold text-slate-800">₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
              <span>Total Bill:</span>
              <span className="text-orange-600 text-base">₹{viewOrderModal.total}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Bill Print Modal */}
      {billModalOrder && (
        <PrintableBillModal
          isOpen={!!billModalOrder}
          onClose={() => setBillModalOrder(null)}
          order={billModalOrder}
        />
      )}

      {/* Table QR Flyer Modal */}
      {qrModalTable && (
        <Modal
          isOpen={!!qrModalTable}
          onClose={() => setQrModalTable(null)}
          title={`Contactless QR Menu • ${qrModalTable.table_number}`}
        >
          <div className="text-center space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 inline-block shadow-inner">
              <div className="text-xs font-extrabold uppercase tracking-wider text-orange-600 mb-1">
                {restaurant?.name || 'ServeFlow Restaurant'}
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                {activeBranch?.name || 'Main Branch'} • Capacity: {qrModalTable.capacity} Seats
              </p>

              {/* Crisp SVG QR Code Design */}
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-xl border border-slate-200 shadow-md flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
                  {/* Outer Frame & Finder Patterns */}
                  <rect x="5" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
                  <rect x="12" y="12" width="12" height="12" rx="2" />
                  
                  <rect x="69" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
                  <rect x="76" y="12" width="12" height="12" rx="2" />

                  <rect x="5" y="69" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
                  <rect x="12" y="76" width="12" height="12" rx="2" />

                  {/* QR Data Grid Pixels */}
                  <rect x="38" y="10" width="5" height="5" />
                  <rect x="48" y="10" width="5" height="5" />
                  <rect x="58" y="10" width="5" height="5" />
                  <rect x="38" y="20" width="8" height="5" />
                  <rect x="52" y="20" width="5" height="5" />
                  <rect x="10" y="38" width="5" height="5" />
                  <rect x="22" y="38" width="8" height="5" />
                  <rect x="38" y="38" width="6" height="6" />
                  <rect x="50" y="38" width="6" height="6" />
                  <rect x="62" y="38" width="6" height="6" />
                  <rect x="78" y="38" width="8" height="5" />
                  <rect x="10" y="48" width="8" height="5" />
                  <rect x="25" y="48" width="5" height="5" />
                  <rect x="42" y="48" width="12" height="6" />
                  <rect x="62" y="48" width="6" height="6" />
                  <rect x="75" y="48" width="5" height="5" />
                  <rect x="85" y="48" width="6" height="6" />
                  <rect x="38" y="60" width="6" height="6" />
                  <rect x="50" y="60" width="6" height="6" />
                  <rect x="68" y="60" width="10" height="5" />
                  <rect x="38" y="75" width="8" height="5" />
                  <rect x="52" y="75" width="6" height="6" />
                  <rect x="68" y="75" width="6" height="6" />
                  <rect x="82" y="75" width="8" height="5" />
                  <rect x="38" y="86" width="5" height="5" />
                  <rect x="50" y="86" width="10" height="5" />
                  <rect x="68" y="86" width="5" height="5" />
                  <rect x="80" y="86" width="6" height="6" />
                </svg>
              </div>

              <div className="mt-3">
                <span className="text-base font-extrabold text-slate-900">
                  {qrModalTable.table_number}
                </span>
                <p className="text-[10px] text-slate-500 font-medium">Scan to view digital menu & order</p>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-mono bg-slate-100 p-2.5 rounded-xl break-all">
              {`${window.location.origin}/menu/${restaurant?.id || 'REST-10001'}/${activeBranch?.id || 'BR-01'}/${qrModalTable.table_number}`}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/menu/${restaurant?.id || 'REST-10001'}/${activeBranch?.id || 'BR-01'}/${qrModalTable.table_number}`;
                  navigator.clipboard.writeText(url);
                  showToast('QR Menu URL copied to clipboard!', 'success');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>

              <a
                href={`/menu/${restaurant?.id || 'REST-10001'}/${activeBranch?.id || 'BR-01'}/${qrModalTable.table_number}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Menu</span>
              </a>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Standee</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Receive Payment Settlement Modal (Auto-Filled Payable Total) (Requirements 12, 13, 14, 15) */}
      <Modal

        isOpen={!!paymentModalOrder}
        onClose={() => setPaymentModalOrder(null)}
        title={`Receive Payment • ${paymentModalOrder?.order_number || ''}`}
      >
        <div className="space-y-4 text-xs">
          {/* Auto-filled Payable Total */}
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 text-center space-y-1">
            <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">
              Total Amount Payable (Auto-Calculated)
            </span>
            <div className="text-3xl font-black text-slate-900">
              ₹{paymentModalOrder?.total}
            </div>
            <span className="text-slate-500 text-[11px] block">
              {paymentModalOrder?.table_name} • {paymentModalOrder?.customer_name}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1.5">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'upi', label: 'UPI / QR', icon: QrCode },
                { id: 'card', label: 'Card', icon: CreditCard }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-600 bg-orange-50 text-orange-950 font-black shadow-xs ring-1 ring-orange-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-orange-600" />
                    <span className="font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Transaction Ref / Notes (Optional)</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. Cash collected / UPI ref"
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={processingPayment}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/25 cursor-pointer transition-all disabled:bg-slate-300"
          >
            {processingPayment ? 'Processing Settlement...' : `Confirm Payment of ₹${paymentModalOrder?.total}`}
          </button>
        </div>
      </Modal>
    </div>
  );
}

