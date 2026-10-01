import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportMenuItems } from '../utils/exportCSV';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formGstRate, setFormGstRate] = useState('5');
  const [formImage, setFormImage] = useState('');
  const [formPrepTime, setFormPrepTime] = useState('15');

  const { showToast } = useToast();
  const { activeBranchId } = useAuth();
  const latestBranchRef = useRef(activeBranchId);

  const fetchMenu = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    setLoading(true);
    setCategories([]);
    setItems([]);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        api.get('/menu/categories', { signal }),
        api.get('/menu/items', { signal })
      ]);
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setCategories(catsRes.data || []);
        setItems(itemsRes.data || []);
        if (!formCategory && (catsRes.data || []).length > 0) {
          setFormCategory(catsRes.data[0].id);
        }
      }
    } catch (err) {
      if (!signal?.aborted) showToast('Error loading menu catalog', 'error');
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchMenu(controller.signal);
    return () => controller.abort();
  }, [fetchMenu]);

  const openAddItemModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(categories[0]?.id || '');
    setFormPrice('');
    setFormDescription('');
    setFormIsVeg(true);
    setFormGstRate('5');
    setFormImage('');
    setFormPrepTime('15');
    setItemModalOpen(true);
  };

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category_id);
    setFormPrice(String(item.price));
    setFormDescription(item.description || '');
    setFormIsVeg(item.is_veg);
    setFormGstRate(String(item.gst_rate || 5));
    setFormImage(item.image || '');
    setFormPrepTime(String(item.preparation_time || 15));
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice || !formCategory) {
      showToast('Name, price and category are required', 'warning');
      return;
    }

    try {
      const payload = {
        name: formName,
        category_id: formCategory,
        price: Number(formPrice),
        description: formDescription,
        is_veg: formIsVeg,
        gst_rate: Number(formGstRate),
        image: formImage,
        preparation_time: Number(formPrepTime)
      };

      if (editingItem) {
        await api.put(`/menu/items/${editingItem.id}`, payload);
        showToast(`Item "${formName}" updated successfully`, 'success');
      } else {
        await api.post('/menu/items', payload);
        showToast(`Item "${formName}" added to catalog`, 'success');
      }

      setItemModalOpen(false);
      fetchMenu();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving menu item', 'error');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const updatedStatus = !item.is_available;
      await api.patch(`/menu/items/${item.id}/availability`, { is_available: updatedStatus });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_available: updatedStatus } : i));
      showToast(`${item.name} is now ${updatedStatus ? 'In Stock' : 'Out of Stock'}`, 'info', 2000);
    } catch (err) {
      showToast('Error changing availability', 'error');
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/menu/items/${itemToDelete.id}`);
      showToast(`Item deleted`, 'success');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchMenu();
    } catch (err) {
      showToast('Error deleting item', 'error');
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Menu Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">Configure dishes, pricing, taxes, and instant live availability</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 w-56"
            />
          </div>
          <button
            onClick={() => {
              exportMenuItems(filteredItems);
              showToast(`Exported ${filteredItems.length} menu items to CSV`, 'success');
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={openAddItemModal}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          All Categories ({items.length})
        </button>
        {categories.map((c) => {
          const count = items.filter((i) => i.category_id === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? 'border-orange-600 text-orange-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {c.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Items List Table */}
      {loading ? (
        <SkeletonModulePage type="table" rows={6} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menu items in this category"
          description="Create your first delicious dish to make it available for order in the POS terminal."
          actionText="Add New Dish"
          onAction={openAddItemModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Dish Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">GST Rate</th>
                  <th className="py-3.5 px-4">Live Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredItems.map((item) => {
                  const catName = categories.find((c) => c.id === item.category_id)?.name || 'General';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <UtensilsCrossed className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {catName}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ₹{item.price}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {item.gst_rate || 5}% GST
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            item.is_available
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{item.is_available ? 'In Stock' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right space-x-1">
                        <button
                          onClick={() => openEditItemModal(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Dish"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Menu Item Modal */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Paneer Tikka Angara"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Price (₹) *</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="e.g. 320"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description</label>
            <textarea
              rows="2"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Brief ingredients and preparation notes..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Dietary</label>
              <select
                value={formIsVeg ? 'veg' : 'non-veg'}
                onChange={(e) => setFormIsVeg(e.target.value === 'veg')}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              >
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">GST Tax Rate</label>
              <select
                value={formGstRate}
                onChange={(e) => setFormGstRate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              >
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST</option>
                <option value="0">0% (Exempt)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Prep Time (Mins)</label>
              <input
                type="number"
                min="1"
                value={formPrepTime}
                onChange={(e) => setFormPrepTime(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Image URL (Optional)</label>
            <input
              type="url"
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setItemModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs"
            >
              {editingItem ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteItem}
        title="Delete Menu Dish"
        message={`Are you sure you want to permanently delete "${itemToDelete?.name}" from your restaurant menu?`}
        confirmText="Delete Dish"
        danger={true}
      />
    </div>
  );
}
