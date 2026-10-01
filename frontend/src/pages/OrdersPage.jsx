import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Plus,
  Eye,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  UtensilsCrossed,
  RotateCcw,
  Trash2,
  Flame,
  Check,
  AlertCircle,
  ShieldAlert,
  Lock,
  AlertTriangle,
  Ban,
  Download
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportOrders } from '../utils/exportCSV';
import StatusBadge from '../components/common/StatusBadge';
import Drawer from '../components/common/Drawer';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';
import PrintableBillModal from '../components/common/PrintableBillModal';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [billModalOrder, setBillModalOrder] = useState(null);

  // Add Item Modal
  const [addItemOrder, setAddItemOrder] = useState(null);
  const [selectedAddMenuItem, setSelectedAddMenuItem] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);
  const [addNotes, setAddNotes] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // Payment Settlement Modal (Auto-Filled Payable Amount)
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Delete / Void Order Modal
  const [deleteOrderModal, setDeleteOrderModal] = useState(null);
  const [deleteReason, setDeleteReason] = useState('Fake / Mistaken order created at counter');
  const [restockInventory, setRestockInventory] = useState(true);
  const [managerPin, setManagerPin] = useState('');
  const [deletingOrder, setDeletingOrder] = useState(false);

  const { showToast } = useToast();
  const { activeBranchId, user } = useAuth();
  const latestBranchRef = useRef(activeBranchId);

  const isAdminOrManager = useMemo(() => {
    if (!user) return false;
    const r = (user.role || '').toLowerCase();
    return ['owner', 'admin', 'manager', 'super_admin', 'general_manager', 'branch_manager', 'sysadmin'].some(role => r.includes(role));
  }, [user]);

  const fetchOrders = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    try {
      const res = await api.get('/orders', { signal });
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setOrders(res.data || []);
        // Also update selectedOrder if currently viewed
        setSelectedOrder((prev) => {
          if (!prev) return null;
          const updated = (res.data || []).find((o) => o.id === prev.id);
          return updated || prev;
        });
      }
    } catch (err) {
      if (!signal?.aborted) {
        showToast('Error loading orders list', 'error');
      }
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, [fetchOrders]);

  // Fetch menu items for Add Item dropdown
  useEffect(() => {
    api.get('/menu/items')
      .then((res) => setMenuItems(res.data || []))
      .catch((e) => console.warn('Could not load menu items', e));
  }, []);

  // Real-time WebSocket listener for order & payment state changes (Requirement 18)
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
            'pos:order_updated',
            'order:status_updated',
            'kot:status_updated',
            'pos:payment_success',
            'pos:order_created',
            'kitchen:ready_alert'
          ].includes(data.type)) {
            fetchOrders();
          }
        } catch (e) {
          console.error('[WebSocket Error]', e);
        }
      };
    } catch (err) {
      console.warn('[WebSocket Init Error]', err);
    }

    const interval = setInterval(() => fetchOrders(), 10000);
    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, [fetchOrders]);

  const tabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'dine-in', label: 'Dine-in' },
    { key: 'takeaway', label: 'Takeaway' },
    { key: 'serve_pending', label: 'Serve Pending' },
    { key: 'billing_pending', label: 'Billing Pending' },
    { key: 'paid', label: 'Paid / Completed' }
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'serve_pending' && o.status !== 'serve_pending') return false;
    if (activeTab === 'billing_pending' && o.status !== 'billing_pending') return false;
    if (activeTab === 'paid' && !['paid', 'completed'].includes(o.status)) return false;
    if (['dine-in', 'takeaway', 'delivery'].includes(activeTab) && o.order_type !== activeTab) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.order_number?.toLowerCase().includes(q);
      const matchCust = o.customer_name?.toLowerCase().includes(q);
      const matchTable = o.table_name?.toLowerCase().includes(q);
      const matchKot = (o.items || []).some((it) => it.kot_number?.toLowerCase().includes(q));
      if (!matchNum && !matchCust && !matchTable && !matchKot) return false;
    }
    return true;
  });

  // Action: Mark Order Served (Requirement 6)
  const handleMarkServed = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/mark-served`);
      showToast('Order marked as SERVED to customer', 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error marking order as served', 'error');
    }
  };

  // Action: Request Bill / Billing Pending (Requirement 8 & 11)
  const handleRequestBill = async (orderId) => {
    try {
      const res = await api.post(`/orders/${orderId}/request-bill`);
      showToast('Order moved to BILLING PENDING', 'info');
      const targetOrder = orders.find((o) => o.id === orderId) || res.data;
      if (targetOrder) {
        setBillModalOrder({ ...targetOrder, status: 'billing_pending' });
      }
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating order to billing pending', 'error');
    }
  };

  // Action: Add Item to Existing Order (Requirement 1 & 16)
  const handleConfirmAddItem = async (e) => {
    e.preventDefault();
    if (!addItemOrder || !selectedAddMenuItem) return;
    const item = menuItems.find((m) => m.id === selectedAddMenuItem);
    if (!item) return;

    setAddingItem(true);
    try {
      await api.post(`/orders/${addItemOrder.id}/items`, {
        items: [
          {
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(addQuantity) || 1,
            notes: addNotes
          }
        ],
        notes: addNotes
      });
      showToast(`Added ${addQuantity}x ${item.name} to ${addItemOrder.order_number}! Generated next KOT.`, 'success');
      setAddItemOrder(null);
      setSelectedAddMenuItem('');
      setAddQuantity(1);
      setAddNotes('');
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error adding item to order', 'error');
    } finally {
      setAddingItem(false);
    }
  };

  // Action: Update Item Quantity (Requirement 1)
  const handleUpdateItemQty = async (orderId, itemIndex, newQty) => {
    try {
      await api.put(`/orders/${orderId}/items/${itemIndex}`, {
        quantity: newQty,
        reason: 'Staff adjustment'
      });
      showToast(`Quantity updated to ${newQty}`, 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating item quantity', 'error');
    }
  };

  // Action: Cancel Order Item (Requirement 1)
  const handleCancelItem = async (orderId, itemIndex, itemName) => {
    if (!window.confirm(`Are you sure you want to cancel ${itemName} from this order?`)) return;
    try {
      await api.post(`/orders/${orderId}/items/${itemIndex}/cancel`, {
        reason: 'Customer requested cancellation'
      });
      showToast(`${itemName} cancelled. Bill amount recalculated.`, 'info');
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error cancelling item', 'error');
    }
  };

  // Action: Receive Payment (Requirement 12, 13, 14, 15)
  const handleConfirmPayment = async () => {
    if (!paymentModalOrder) return;
    setProcessingPayment(true);
    try {
      await api.post(`/orders/${paymentModalOrder.id}/payment`, {
        amount: Number(paymentModalOrder.total),
        payment_method: paymentMethod,
        payment_reference: paymentRef
      });
      showToast(`Payment of ₹${paymentModalOrder.total} received via ${paymentMethod.toUpperCase()}! Table is now AVAILABLE.`, 'success');
      setPaymentModalOrder(null);
      setPaymentRef('');
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error processing payment';
      showToast(msg, 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Action: Delete / Void Order (Admin or Manager PIN override)
  const handleConfirmDeleteOrder = async (e) => {
    e.preventDefault();
    if (!deleteOrderModal) return;

    setDeletingOrder(true);
    try {
      const payload = {
        reason: deleteReason,
        restock_inventory: restockInventory
      };

      if (!isAdminOrManager) {
        if (!managerPin) {
          showToast('Manager PIN is required to authorize order deletion', 'warning');
          setDeletingOrder(false);
          return;
        }
        payload.manager_pin = managerPin;
      }

      const res = await api.delete(`/orders/${deleteOrderModal.id}`, { data: payload });
      showToast(res.data?.message || 'Order successfully deleted/voided', 'success');
      setDeleteOrderModal(null);
      setManagerPin('');
      setDeleteReason('Fake / Mistaken order created at counter');
      if (selectedOrder?.id === deleteOrderModal.id) {
        setSelectedOrder(null);
      }
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete order';
      showToast(msg, 'error');
    } finally {
      setDeletingOrder(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Order → KOT → Kitchen → Serving → Billing → Payment → Auto-Free Table Workflow
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search #ORD-1025, Table 07, KOT..."
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 w-64"
            />
          </div>
          <button
            onClick={() => fetchOrders()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {user?.permissions?.includes('*') || user?.permissions?.includes('orders.export') ? (
            <button
              onClick={() => {
                exportOrders(filteredOrders);
                showToast(`Exported ${filteredOrders.length} orders to CSV`, 'success');
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          ) : null}
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

      {/* Orders Table */}
      {loading ? (
        <SkeletonModulePage type="table" rows={6} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description="Orders will appear here as soon as tickets are placed via POS or QR menus."
          actionText="Create New Order in POS"
          onAction={() => (window.location.href = '/pos')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Order ID</th>
                  <th className="py-3.5 px-4">Table</th>
                  <th className="py-3.5 px-4">KOT Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Workflow Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.map((o) => {
                  const activeItems = (o.items || []).filter((i) => i.status !== 'cancelled');
                  const itemCount = activeItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
                  const isCancelled = ['cancelled', 'voided'].includes(o.status) || o.is_voided;
                  const isPaid = o.payment_status === 'paid' || o.status === 'paid';
                  const isServePending = o.status === 'serve_pending';
                  const isServed = o.status === 'served';
                  const isBillingPending = o.status === 'billing_pending';

                  // Get latest KOT number from items
                  const kotNumbers = [...new Set((o.items || []).map((i) => i.kot_number).filter(Boolean))];
                  const primaryKot = kotNumbers[kotNumbers.length - 1] || 'KOT-Sent';

                  return (
                    <tr
                      key={o.id}
                      className={`transition-colors cursor-pointer ${isCancelled ? 'bg-slate-50/70 opacity-75 hover:bg-slate-100/70' : 'hover:bg-slate-50/80'}`}
                      onClick={() => setSelectedOrder(o)}
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-extrabold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{o.order_number}</span>
                          {isCancelled && (
                            <span className="p-0.5 rounded bg-rose-100 text-rose-700" title="Order Cancelled & Locked">
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-orange-600 capitalize">
                          {o.table_name || (o.order_type === 'dine-in' ? 'Table' : o.order_type)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                        {primaryKot}
                        {kotNumbers.length > 1 && (
                          <span className="ml-1 text-[10px] text-blue-600 font-bold">
                            (+{kotNumbers.length - 1})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {o.customer_name || 'Walk-in'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ₹{o.total}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {isCancelled ? (
                          <span className="font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[11px] border border-slate-200">
                            CANCELLED
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                            <Check className="w-3 h-3" />
                            {o.payment_method?.toUpperCase() || 'PAID'}
                          </span>
                        ) : (
                          <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[11px] border border-rose-200">
                            UNPAID
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        {isCancelled ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 text-xs">
                              <Lock className="w-3.5 h-3.5 text-rose-500" />
                              <span>Cancelled (Locked)</span>
                            </span>
                            {/* Print Bill */}
                            <button
                              onClick={() => setBillModalOrder(o)}
                              title="Print Audit Bill"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-block"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {/* View Details */}
                            <button
                              onClick={() => setSelectedOrder(o)}
                              title="View Details"
                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer inline-block"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Serve Button */}
                            {isServePending && (
                              <button
                                onClick={() => handleMarkServed(o.id)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Mark as Served to Table"
                              >
                                <UtensilsCrossed className="w-3.5 h-3.5" />
                                <span>Mark Served</span>
                              </button>
                            )}

                            {/* Request Bill Button */}
                            {!isPaid && !isBillingPending && (
                              <button
                                onClick={() => handleRequestBill(o.id)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Set to Billing Pending & Print Bill"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Request Bill</span>
                              </button>
                            )}

                            {/* Print Bill Button when Billing Pending */}
                            {isBillingPending && (
                              <button
                                onClick={() => setBillModalOrder(o)}
                                className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                title="Print Customer Bill"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Bill</span>
                              </button>
                            )}

                            {/* Receive Payment Button */}
                            {!isPaid && (
                              <button
                                onClick={() => setPaymentModalOrder(o)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Receive Payment & Free Table"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay (₹{o.total})</span>
                              </button>
                            )}

                            {/* Add Item Button */}
                            {!isPaid && (
                              <button
                                onClick={() => setAddItemOrder(o)}
                                className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer inline-block"
                                title="Add Item to Order (Next KOT)"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}

                            {/* Print Bill */}
                            <button
                              onClick={() => setBillModalOrder(o)}
                              title="Print Receipt"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-block"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* View Drawer */}
                            <button
                              onClick={() => setSelectedOrder(o)}
                              title="View Details"
                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer inline-block"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Delete / Void Order (Admin Only or Cashier Manager Override) */}
                            <button
                              onClick={() => {
                                setDeleteOrderModal(o);
                                setDeleteReason('Fake / Mistaken order created at counter');
                                setManagerPin('');
                              }}
                              title={isAdminOrManager ? "Delete / Void Order (Admin/Manager)" : "Request Manager Authorization to Void Order"}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-block"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Drawer */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.order_number || ''}`}
        footer={
          selectedOrder && (() => {
            const isOrderCancelled = ['cancelled', 'voided'].includes(selectedOrder.status) || selectedOrder.is_voided;
            return (
              <div className="flex flex-wrap items-center justify-between w-full gap-2">
                <button
                  onClick={() => setBillModalOrder(selectedOrder)}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Bill</span>
                </button>

                {isOrderCancelled ? (
                  <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-rose-600" />
                    <span>Order Cancelled & Locked (Cannot be edited)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {selectedOrder.status === 'serve_pending' && (
                      <button
                        onClick={() => {
                          handleMarkServed(selectedOrder.id);
                          setSelectedOrder((prev) => ({ ...prev, status: 'served' }));
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>Mark as Served</span>
                      </button>
                    )}

                    {!['paid', 'completed', 'billing_pending', 'cancelled', 'voided'].includes(selectedOrder.status) && (
                      <button
                        onClick={() => {
                          handleRequestBill(selectedOrder.id);
                          setSelectedOrder((prev) => ({ ...prev, status: 'billing_pending' }));
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Billing Pending</span>
                      </button>
                    )}

                    {!['paid', 'completed', 'cancelled', 'voided'].includes(selectedOrder.status) && (
                      <button
                        onClick={() => setPaymentModalOrder(selectedOrder)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Receive Payment (₹{selectedOrder.total})</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setDeleteOrderModal(selectedOrder);
                        setDeleteReason('Fake / Mistaken order created at counter');
                        setManagerPin('');
                      }}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title={isAdminOrManager ? "Delete / Void Order (Admin)" : "Manager Authorization Required"}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isAdminOrManager ? 'Void / Delete Order' : 'Request Void (Manager PIN)'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()
        }
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            {/* Status & Timing */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Current State</span>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Created</span>
                <div className="font-bold text-slate-800 mt-1">
                  {new Date(selectedOrder.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Cancelled Banner */}
            {(['cancelled', 'voided'].includes(selectedOrder.status) || selectedOrder.is_voided) && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-extrabold uppercase tracking-wider text-[11px] text-rose-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Order Cancelled & Locked (Cancel Means Cancel)</span>
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    This order has been cancelled and cannot be edited. Recipe raw materials have been returned to inventory, dining tables freed, and kitchen tickets voided.
                  </div>
                  {selectedOrder.void_reason && (
                    <div className="text-[11px] font-semibold text-rose-700 pt-0.5">
                      <span className="font-bold">Cancellation Reason:</span> {selectedOrder.void_reason}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customer & Table Info */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div>
                <span className="text-slate-400 text-[11px] block">Customer</span>
                <span className="font-bold text-slate-800 text-sm block mt-0.5">{selectedOrder.customer_name}</span>
                {selectedOrder.customer_phone && (
                  <span className="text-slate-500 text-[11px]">{selectedOrder.customer_phone}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Table / Channel</span>
                <span className="font-extrabold text-orange-600 text-sm capitalize block mt-0.5">
                  {selectedOrder.table_name || selectedOrder.order_type}
                </span>
                <span className="text-slate-500 text-[11px] uppercase font-semibold">
                  Payment: {selectedOrder.payment_status?.toUpperCase() || 'UNPAID'}
                </span>
              </div>
            </div>

            {/* Order Items with Item-Level Management (Requirement 1 & 17) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Order Items & KOT History
                </h4>
                {!['paid', 'completed', 'cancelled', 'voided'].includes(selectedOrder.status) && !selectedOrder.is_voided && (
                  <button
                    onClick={() => setAddItemOrder(selectedOrder)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {(selectedOrder.items || []).map((it, idx) => {
                  const isCancelled = it.status === 'cancelled';
                  const isOrderLocked = ['paid', 'completed', 'cancelled', 'voided'].includes(selectedOrder.status) || selectedOrder.is_voided;
                  return (
                    <div
                      key={idx}
                      className={`p-3 flex justify-between items-center transition-colors ${
                        isCancelled ? 'bg-rose-50/40 text-slate-400' : 'bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isCancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {it.name}
                          </span>
                          {it.kot_number && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {it.kot_number}
                            </span>
                          )}
                          {isCancelled && (
                            <span className="text-[10px] font-bold text-rose-600 uppercase">
                              (Cancelled)
                            </span>
                          )}
                        </div>
                        {it.notes && <span className="text-slate-400 text-[10px] italic block">"{it.notes}"</span>}
                      </div>

                      <div className="flex items-center gap-3">
                        {!isCancelled && !isOrderLocked ? (
                          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                            <button
                              onClick={() => handleUpdateItemQty(selectedOrder.id, idx, it.quantity - 1)}
                              className="px-1.5 py-0.5 hover:bg-slate-200 rounded font-bold text-slate-700 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-1.5 font-bold text-slate-900 min-w-[16px] text-center">
                              {it.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateItemQty(selectedOrder.id, idx, it.quantity + 1)}
                              className="px-1.5 py-0.5 hover:bg-slate-200 rounded font-bold text-slate-700 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-500">×{it.quantity}</span>
                        )}

                        <span className={`font-bold min-w-[50px] text-right ${isCancelled ? 'text-slate-400' : 'text-slate-900'}`}>
                          ₹{it.price * it.quantity}
                        </span>

                        {!isCancelled && !isOrderLocked && (
                          <button
                            onClick={() => handleCancelItem(selectedOrder.id, idx, it.name)}
                            title="Cancel Item"
                            className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              {Number(selectedOrder.discount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{Number(selectedOrder.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (5%)</span>
                <span>₹{selectedOrder.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-orange-600">₹{selectedOrder.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Audit Trail & History (Requirement 17) */}
            {selectedOrder.history && selectedOrder.history.length > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Audit Trail</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedOrder.history.map((h, i) => (
                    <div key={i} className="text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 capitalize">
                          {h.action.replace(/_/g, ' ')}
                        </span>
                        {h.kot_number && <span className="text-slate-500 ml-1 font-mono">({h.kot_number})</span>}
                        {h.item_name && <span className="text-slate-600 ml-1">• {h.item_name}</span>}
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal 1: Add Item to Existing Order (Requirement 1 & 16) */}
      <Modal
        isOpen={!!addItemOrder}
        onClose={() => setAddItemOrder(null)}
        title={`Add Item to ${addItemOrder?.order_number || ''}`}
      >
        <form onSubmit={handleConfirmAddItem} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
            <span className="font-bold">Order Consolidation: </span>
            <span>New item will be added to the same bill for {addItemOrder?.table_name || 'this table'}, generating an additional KOT ticket.</span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Menu Dish</label>
            <select
              required
              value={selectedAddMenuItem}
              onChange={(e) => setSelectedAddMenuItem(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 font-semibold"
            >
              <option value="">-- Choose dish from catalog --</option>
              {menuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (₹{m.price})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max="20"
                value={addQuantity}
                onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cooking Note</label>
              <input
                type="text"
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                placeholder="e.g. Less spicy, butter extra"
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={addingItem || !selectedAddMenuItem}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md cursor-pointer transition-colors disabled:bg-slate-300"
          >
            {addingItem ? 'Adding & Firing KOT...' : 'Send to Kitchen (Additional KOT)'}
          </button>
        </form>
      </Modal>

      {/* Modal 2: Receive Payment (Auto-Filled Amount) (Requirement 12, 13, 14, 15) */}
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
              placeholder="e.g. UPI Ref / Card Last 4 Digits"
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

      {/* Bill Receipt Modal */}
      {billModalOrder && (
        <PrintableBillModal
          isOpen={!!billModalOrder}
          onClose={() => setBillModalOrder(null)}
          order={billModalOrder}
        />
      )}

      {/* Delete / Void Order Modal */}
      <Modal
        isOpen={!!deleteOrderModal}
        onClose={() => {
          setDeleteOrderModal(null);
          setManagerPin('');
        }}
        title={`Delete / Void Order ${deleteOrderModal?.order_number || ''}`}
      >
        <form onSubmit={handleConfirmDeleteOrder} className="space-y-4 text-xs">
          {!isAdminOrManager ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-xs">Admin / Manager Authorization Required</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Cashiers cannot delete or void orders directly. Please ask a Manager or Administrator to enter their Manager PIN (e.g. 1234 or 9999) to authorize voiding this fake or mistaken order.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-xs">Void Order & Release Resources</p>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  This action will cancel active kitchen KOTs, free up the table, and restock raw materials consumed by this fake order.
                </p>
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex justify-between font-bold text-slate-700">
              <span>Order Number:</span>
              <span className="font-black text-slate-900">{deleteOrderModal?.order_number}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Table / Type:</span>
              <span className="font-medium text-slate-900">{deleteOrderModal?.table_name || deleteOrderModal?.order_type}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-700">
              <span>Order Total:</span>
              <span className="font-black text-rose-600">₹{deleteOrderModal?.total}</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Reason for Deletion / Void *</label>
            <input
              type="text"
              required
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Fake order created by cashier / Customer walked out"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={restockInventory}
              onChange={(e) => setRestockInventory(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span className="font-semibold text-slate-700">Automatically restock recipe raw materials back to inventory</span>
          </label>

          {!isAdminOrManager && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Manager Authorization PIN *</label>
              <input
                type="password"
                required
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="Enter Manager PIN (1234 or 9999)"
                className="w-full text-xs p-2.5 border border-amber-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 bg-amber-50/30"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setDeleteOrderModal(null);
                setManagerPin('');
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deletingOrder}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {deletingOrder ? 'Processing...' : isAdminOrManager ? 'Confirm Void & Delete' : 'Authorize & Void'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

