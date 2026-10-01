import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportPurchases } from '../utils/exportCSV';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Drawer from '../components/common/Drawer';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';

export default function PurchasesPage() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPurchaseModal, setNewPurchaseModal] = useState(false);
  const [viewPurchase, setViewPurchase] = useState(null);

  // Form
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseStatus, setPurchaseStatus] = useState('received');
  const [purchaseItems, setPurchaseItems] = useState([
    { itemId: '', itemName: '', quantity: 1, unit: 'kg', unitPrice: 0, tax: 0, total: 0 }
  ]);

  const { showToast } = useToast();
  const { activeBranchId } = useAuth();
  const latestBranchRef = useRef(activeBranchId);

  const fetchPurchases = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    setLoading(true);
    setPurchases([]);
    try {
      const [purRes, supRes, invRes] = await Promise.all([
        api.get('/purchases', { signal }),
        api.get('/suppliers', { signal }),
        api.get('/inventory', { signal })
      ]);
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setPurchases(purRes.data || []);
        setSuppliers(supRes.data || []);
        setInventoryItems(invRes.data || []);
        if ((supRes.data || []).length > 0) setSupplierId(supRes.data[0].id);
      }
    } catch (err) {
      if (!signal?.aborted) showToast('Error loading purchase orders', 'error');
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPurchases(controller.signal);

    // Real-time WebSocket listener
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if ([
            'inventory:updated',
            'inventory:stock_changed',
            'purchase_received',
            'purchase_reversed'
          ].includes(data.type)) {
            fetchPurchases();
          }
        } catch (e) {}
      };
    } catch (err) {}

    return () => {
      controller.abort();
      if (ws) ws.close();
    };
  }, [fetchPurchases]);

  const handleAddItemRow = () => {
    setPurchaseItems((prev) => [
      ...prev,
      { itemId: '', itemName: '', quantity: 1, unit: 'kg', unitPrice: 0, tax: 0, total: 0 }
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    setPurchaseItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };

      if (field === 'itemId') {
        const itemObj = inventoryItems.find((i) => i.id === value);
        if (itemObj) {
          updated[idx].itemName = itemObj.name;
          updated[idx].unit = itemObj.unit;
          updated[idx].unitPrice = itemObj.cost_per_unit || 0;
        }
      }

      const q = Number(updated[idx].quantity) || 0;
      const p = Number(updated[idx].unitPrice) || 0;
      const sub = q * p;
      const t = parseFloat(((sub * 5) / 100).toFixed(2));
      updated[idx].tax = t;
      updated[idx].total = parseFloat((sub + t).toFixed(2));

      return updated;
    });
  };

  const subtotal = purchaseItems.reduce((acc, it) => acc + ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0);
  const taxTotal = purchaseItems.reduce((acc, it) => acc + (Number(it.tax) || 0), 0);
  const grandTotal = subtotal + taxTotal;

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    const supObj = suppliers.find((s) => s.id === supplierId);
    try {
      await api.post('/purchases', {
        supplier_id: supplierId,
        supplier_name: supObj?.name || 'Wholesale Supplier',
        invoice_number: invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        date: purchaseDate,
        items: purchaseItems,
        subtotal,
        tax_total: taxTotal,
        grand_total: grandTotal,
        status: purchaseStatus
      });

      showToast(
        purchaseStatus === 'received'
          ? 'Purchase recorded & raw inventory automatically increased!'
          : 'Purchase draft saved successfully',
        'success'
      );

      setNewPurchaseModal(false);
      setInvoiceNumber('');
      fetchPurchases();
    } catch (err) {
      showToast('Error recording purchase bill', 'error');
    }
  };

  const handleUpdateStatus = async (purchaseId, newStatus) => {
    try {
      await api.put(`/purchases/${purchaseId}/status`, { status: newStatus });
      showToast(
        newStatus === 'received'
          ? 'Purchase marked as Received! Inventory updated.'
          : `Status changed to ${newStatus}`,
        'success'
      );
      fetchPurchases();
      if (viewPurchase) {
        setViewPurchase((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast('Error updating purchase order status', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Invoices & POs</h1>
          <p className="text-xs text-slate-500 mt-1">Receive wholesale consignments and automatically replenish inventory stock</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportPurchases(purchases);
              showToast(`Exported ${purchases.length} purchases to CSV`, 'success');
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/purchases/new')}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Purchases Table */}
      {loading ? (
        <SkeletonModulePage type="table" rows={5} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Invoice #</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Items Count</th>
                  <th className="py-3.5 px-4">Subtotal</th>
                  <th className="py-3.5 px-4">Grand Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                      {pur.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {pur.supplier_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {pur.date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {(pur.items || []).length} items
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      ₹{pur.subtotal}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ₹{pur.grand_total}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={pur.status} />
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right space-x-1.5">
                      <button
                        onClick={() => setViewPurchase(pur)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                      >
                        View Details
                      </button>
                      {pur.status === 'draft' && (
                        <button
                          onClick={() => handleUpdateStatus(pur.id, 'received')}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer"
                        >
                          Mark Received
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Purchase Modal */}
      <Modal
        isOpen={newPurchaseModal}
        onClose={() => setNewPurchaseModal(false)}
        title="Create Purchase Consignment"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Invoice / PO #</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-904"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Consignment Items
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs text-orange-600 font-bold hover:underline"
              >
                + Add Another Item
              </button>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-56 overflow-y-auto">
              {purchaseItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="col-span-4">
                    <select
                      value={item.itemId}
                      onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg"
                    >
                      <option value="">Select Raw Item</option>
                      {inventoryItems.map((inv) => (
                        <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Rate ₹"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-2 text-right font-extrabold text-slate-900">
                    ₹{item.total}
                  </div>
                  <div className="col-span-1 text-right">
                    {purchaseItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-orange-50/70 p-3 rounded-xl border border-orange-200 text-xs">
            <span className="font-bold text-slate-700">Total Purchase Value:</span>
            <span className="text-base font-extrabold text-orange-600">₹{grandTotal.toFixed(2)}</span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Receipt Status</label>
            <select
              value={purchaseStatus}
              onChange={(e) => setPurchaseStatus(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            >
              <option value="received">Received (Increases Inventory Immediately)</option>
              <option value="draft">Draft (Saved for future receiving)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs"
          >
            Confirm & Save Consignment
          </button>
        </form>
      </Modal>

      {/* View Details Drawer */}
      <Drawer
        isOpen={!!viewPurchase}
        onClose={() => setViewPurchase(null)}
        title={`Purchase: ${viewPurchase?.invoice_number || ''}`}
      >
        {viewPurchase && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Supplier</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{viewPurchase.supplier_name}</span>
                <span className="text-slate-500">Date: {viewPurchase.date}</span>
              </div>
              <div className="text-right">
                <StatusBadge status={viewPurchase.status} />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Item Breakdown</h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {(viewPurchase.items || []).map((it, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900">{it.itemName}</span>
                      <span className="text-slate-500 block text-[11px]">
                        {it.quantity} {it.unit} @ ₹{it.unitPrice}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900">₹{it.total}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold">
              <span>Grand Total</span>
              <span className="text-orange-600">₹{viewPurchase.grand_total}</span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
