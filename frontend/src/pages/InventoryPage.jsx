import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Trash2,
  TrendingDown,
  TrendingUp,
  History,
  CheckCircle2,
  Download
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { exportInventory } from '../utils/exportCSV';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock'); // stock, movements
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [addItemModal, setAddItemModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [wastageModal, setWastageModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Dairy');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemMinStock, setNewItemMinStock] = useState('5');
  const [newItemCost, setNewItemCost] = useState('');

  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [wastageQty, setWastageQty] = useState('');
  const [wastageReason, setWastageReason] = useState('');

  const { showToast } = useToast();
  const { activeBranchId } = useAuth();
  const latestBranchRef = useRef(activeBranchId);

  const fetchInventory = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    setLoading(true);
    setItems([]);
    setMovements([]);
    try {
      const [invRes, movRes] = await Promise.all([
        api.get('/inventory', { signal }),
        api.get('/inventory/movements', { signal })
      ]);
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setItems(invRes.data || []);
        setMovements(movRes.data || []);
      }
    } catch (err) {
      if (!signal?.aborted) {
        showToast('Error loading inventory', 'error');
      }
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchInventory(controller.signal);

    // Real-time WebSocket listener for supply chain events
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
            'inventory:low_stock',
            'pos:order_created',
            'order:status_updated',
            'pos:order_updated'
          ].includes(data.type)) {
            fetchInventory();
          }
        } catch (e) {}
      };
    } catch (err) {}

    return () => {
      controller.abort();
      if (ws) ws.close();
    };
  }, [fetchInventory]);

  const categories = ['All', 'Dairy', 'Vegetables', 'Grains', 'Beverages', 'Meat', 'Oils', 'Packaging', 'Spices'];

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        name: newItemName,
        category: newItemCategory,
        current_stock: Number(newItemStock),
        unit: newItemUnit,
        min_stock: Number(newItemMinStock),
        cost_per_unit: Number(newItemCost) || 0
      });
      showToast(`Added ${newItemName} to inventory stock`, 'success');
      setAddItemModal(false);
      setNewItemName('');
      setNewItemStock('');
      fetchInventory();
    } catch (err) {
      showToast('Error creating inventory item', 'error');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedItem || !adjustQty) return;
    try {
      await api.post(`/inventory/${selectedItem.id}/adjust`, {
        adjustment: Number(adjustQty),
        reason: adjustReason
      });
      showToast(`Stock updated for ${selectedItem.name}`, 'success');
      setAdjustModal(false);
      setAdjustQty('');
      setAdjustReason('');
      fetchInventory();
    } catch (err) {
      showToast('Error adjusting stock', 'error');
    }
  };

  const handleRecordWastage = async (e) => {
    e.preventDefault();
    if (!selectedItem || !wastageQty) return;
    try {
      await api.post(`/inventory/${selectedItem.id}/wastage`, {
        quantity: Number(wastageQty),
        reason: wastageReason
      });
      showToast(`Recorded ${wastageQty} ${selectedItem.unit} wastage for ${selectedItem.name}`, 'warning');
      setWastageModal(false);
      setWastageQty('');
      setWastageReason('');
      fetchInventory();
    } catch (err) {
      showToast('Error recording wastage', 'error');
    }
  };

  const lowStockCount = items.filter(i => i.status === 'low' || i.status === 'critical').length;

  const filteredItems = items.filter(i => {
    if (selectedCategory !== 'All' && i.category !== selectedCategory) return false;
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Raw Stock</h1>
          <p className="text-xs text-slate-500 mt-1">Track ingredient levels, unit costs, wastage & replenishment</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportInventory(filteredItems);
              showToast(`Exported ${filteredItems.length} items to CSV`, 'success');
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setAddItemModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Low Stock Notice</h4>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                {lowStockCount} items have reached or fallen below minimum buffer thresholds.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedCategory('All')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Review Items
          </button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex border-b border-slate-200 justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'stock'
                ? 'border-orange-600 text-orange-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Stock Levels ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'movements'
                ? 'border-orange-600 text-orange-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Movement & Wastage History
          </button>
        </div>

        {activeTab === 'stock' && (
          <div className="flex items-center gap-2 pb-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw material..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:bg-white w-44"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stock Tab Table */}
      {activeTab === 'stock' && (
        loading ? (
          <SkeletonModulePage type="table" rows={6} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 sm:px-6">Item Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Current Stock</th>
                    <th className="py-3.5 px-4">Minimum Threshold</th>
                    <th className="py-3.5 px-4">Cost / Unit</th>
                    <th className="py-3.5 px-4">Health Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {item.current_stock} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {item.min_stock} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        ₹{item.cost_per_unit || 0} / {item.unit}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setAdjustModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setWastageModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                        >
                          Wastage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Movements Tab Table */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4 sm:px-6">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                      {new Date(mov.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {mov.item_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        mov.type === 'purchase_inward' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        mov.type === 'purchase_reversal' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        mov.type === 'recipe_consumption' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        mov.type === 'wastage' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        mov.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {mov.type === 'purchase_inward' ? 'PO Inward' :
                         mov.type === 'purchase_reversal' ? 'PO Reversal' :
                         mov.type === 'recipe_consumption' ? 'Recipe Order' :
                         mov.type === 'wastage' ? 'Wastage' : mov.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {mov.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {mov.reason || '—'}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-700">
                      {mov.recorded_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <Modal
        isOpen={addItemModal}
        onClose={() => setAddItemModal(false)}
        title="Add Inventory Stock Item"
      >
        <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Malai Paneer Fresh"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Measurement Unit *</label>
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              >
                <option value="kg">kg</option>
                <option value="ltr">ltr</option>
                <option value="pcs">pcs</option>
                <option value="pack">pack</option>
                <option value="g">g</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Opening Stock *</label>
              <input
                type="number"
                step="0.1"
                required
                value={newItemStock}
                onChange={(e) => setNewItemStock(e.target.value)}
                placeholder="10"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Minimum Buffer</label>
              <input
                type="number"
                step="0.1"
                required
                value={newItemMinStock}
                onChange={(e) => setNewItemMinStock(e.target.value)}
                placeholder="5"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cost / Unit (₹)</label>
              <input
                type="number"
                step="1"
                value={newItemCost}
                onChange={(e) => setNewItemCost(e.target.value)}
                placeholder="380"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs"
          >
            Save Stock Record
          </button>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={adjustModal}
        onClose={() => setAdjustModal(false)}
        title={`Adjust Stock: ${selectedItem?.name || ''}`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Current Stock: <span className="font-bold text-slate-900">{selectedItem?.current_stock} {selectedItem?.unit}</span>.
            Enter positive number to add stock (e.g. +5) or negative to deduct (e.g. -2).
          </p>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Adjustment Quantity ({selectedItem?.unit}) *</label>
            <input
              type="number"
              step="0.1"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="e.g. 5 or -2.5"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Audit Reason</label>
            <input
              type="text"
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Physical inventory count discrepancy"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl"
          >
            Apply Stock Adjustment
          </button>
        </form>
      </Modal>

      {/* Record Wastage Modal */}
      <Modal
        isOpen={wastageModal}
        onClose={() => setWastageModal(false)}
        title={`Record Wastage: ${selectedItem?.name || ''}`}
      >
        <form onSubmit={handleRecordWastage} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Deduct spoiled, dropped, or expired ingredients from active inventory.
          </p>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Wasted Quantity ({selectedItem?.unit}) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={wastageQty}
              onChange={(e) => setWastageQty(e.target.value)}
              placeholder="e.g. 1.5"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Reason for Wastage *</label>
            <input
              type="text"
              required
              value={wastageReason}
              onChange={(e) => setWastageReason(e.target.value)}
              placeholder="e.g. Overripe / curdled / dropped on kitchen floor"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
          >
            Confirm Wastage Deduction
          </button>
        </form>
      </Modal>
    </div>
  );
}
