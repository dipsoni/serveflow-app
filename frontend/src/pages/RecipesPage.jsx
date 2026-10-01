import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CookingPot,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Building2,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  UtensilsCrossed,
  Clock,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';
import Modal from '../components/common/Modal';

export default function RecipesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activeBranchId } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const latestBranchRef = useRef(activeBranchId);

  const fetchRecipes = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    setLoading(true);
    setRecipes([]);
    try {
      const branchParam = selectedBranch !== 'ALL' ? `?branch_id=${selectedBranch}` : '';
      const res = await api.get(`/recipes${branchParam}`, { signal });
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setRecipes(res.data || []);
      }
    } catch (err) {
      if (!signal?.aborted) showToast('Error loading recipes and BOM catalog', 'error');
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId, selectedBranch]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRecipes(controller.signal);

    // Real-time WebSocket listener to keep sellable portions & costs synced
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
            'pos:order_created',
            'order:status_updated',
            'purchase_received'
          ].includes(data.type)) {
            fetchRecipes();
          }
        } catch (e) {}
      };
    } catch (err) {}

    return () => {
      controller.abort();
      if (ws) ws.close();
    };
  }, [fetchRecipes]);

  // Duplicate recipe
  const handleDuplicate = async (recipe) => {
    try {
      const res = await api.post(`/recipes/${recipe.id}/duplicate`);
      showToast(`Cloned recipe: ${res.data.name}`, 'success');
      fetchRecipes();
    } catch (err) {
      showToast('Failed to duplicate recipe', 'error');
    }
  };

  // Delete recipe
  const confirmDelete = async () => {
    if (!recipeToDelete) return;
    setActionLoading(true);
    try {
      await api.delete(`/recipes/${recipeToDelete.id}`);
      showToast(`Deleted recipe: ${recipeToDelete.name}`, 'info');
      setDeleteModalOpen(false);
      setRecipeToDelete(null);
      fetchRecipes();
    } catch (err) {
      showToast('Error deleting recipe', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesMenu = r.menu_item_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesMenu) return false;
      }

      // Status
      if (statusFilter === 'ACTIVE' && !r.is_active) return false;
      if (statusFilter === 'INACTIVE' && r.is_active) return false;

      // Availability
      if (availabilityFilter === 'IN_STOCK' && (r.sellable_quantity || 0) <= 0) return false;
      if (availabilityFilter === 'OUT_OF_STOCK' && (r.sellable_quantity || 0) > 0) return false;

      return true;
    });
  }, [recipes, searchQuery, statusFilter, availabilityFilter]);

  // Statistics
  const totalActive = recipes.filter((r) => r.is_active).length;
  const inStockCount = recipes.filter((r) => (r.sellable_quantity || 0) > 0).length;
  const outOfStockCount = recipes.filter((r) => (r.sellable_quantity || 0) <= 0).length;
  const avgCost = recipes.length > 0
    ? (recipes.reduce((sum, r) => sum + (Number(r.cost_per_serving) || Number(r.total_cost) || 0), 0) / recipes.length).toFixed(2)
    : '0.00';

  if (loading) {
    return <SkeletonModulePage type="grid" />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* ================= HEADER & BREADCRUMBS ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Home</span>
            <span>/</span>
            <span>Menu & Kitchen</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">Recipes & BOM</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CookingPot className="w-6 h-6 text-orange-600" />
            <span>Recipe Management & Bill of Materials</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect menu items with inventory raw materials, calculate food costs, and enforce stock-linked availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchRecipes}
            title="Refresh recipe availability"
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/recipes/new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Recipe</span>
          </button>
        </div>
      </div>

      {/* ================= STATS WIDGETS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Recipes</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalActive}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Total bill of materials mapped</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Stock Dishes</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{inStockCount}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Sufficient ingredients in inventory</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Critical / 86'd Out</span>
          <div className="text-2xl font-black text-red-600 mt-1">{outOfStockCount}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span>Raw material shortage (0 portions)</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Portion Cost</span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{avgCost}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Raw material & wastage per serving</span>
          </div>
        </div>
      </div>

      {/* ================= FILTER & TOOLBAR ================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by recipe name or menu dish..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Branch Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                <option value="branch-bopal">Bopal Outlet</option>
                <option value="branch-satellite">Satellite Outlet</option>
                <option value="branch-sghighway">SG Highway Outlet</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="IN_STOCK">In Stock (&gt;0)</option>
                <option value="OUT_OF_STOCK">Out of Stock (86'd)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-white shadow-2xs text-slate-900 font-extrabold' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'ACTIVE' ? 'bg-white shadow-2xs text-emerald-700 font-extrabold' : 'text-slate-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'INACTIVE' ? 'bg-white shadow-2xs text-slate-600 font-extrabold' : 'text-slate-600'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RECIPES TABLE ================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Recipe & Dish Mapping</th>
                <th className="py-3 px-3">Branch Scope</th>
                <th className="py-3 px-3 text-center">Ingredients</th>
                <th className="py-3 px-3 text-right">Recipe Cost</th>
                <th className="py-3 px-4">Stock Availability</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecipes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CookingPot className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No recipes found matching criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Click "+ New Recipe" to create your first bill of materials.</p>
                  </td>
                </tr>
              ) : (
                filteredRecipes.map((r) => {
                  const sellable = r.sellable_quantity || 0;
                  const isAvailable = sellable > 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Dish Mapping */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{r.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              r.menu_item_is_veg ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span className="font-semibold text-slate-700">{r.menu_item_name}</span>
                          <span className="text-slate-400">· Selling: ₹{r.menu_item_price}</span>
                        </div>
                      </td>

                      {/* Branch Scope */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                          {r.branch_id ? r.branch_id.replace('branch-', '').toUpperCase() : 'All Branches'}
                        </span>
                      </td>

                      {/* Ingredients Count */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-800">{r.ingredients_count}</span>
                        <span className="text-[10px] text-slate-400 ml-1">items</span>
                      </td>

                      {/* Recipe Cost */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-extrabold text-slate-900">₹{r.total_cost}</div>
                        <div className="text-[10px] text-slate-400">₹{r.cost_per_serving} / portion</div>
                      </td>

                      {/* Stock Availability Linked */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-black inline-flex items-center gap-1 ${
                              isAvailable
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isAvailable ? 'bg-emerald-600' : 'bg-red-600'
                              }`}
                            />
                            <span>Available: {sellable}</span>
                          </span>
                        </div>
                        {r.limiting_ingredient && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">
                            Limiting: <span className="font-bold text-amber-700">{r.limiting_ingredient}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {r.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/recipes/${r.id}`)}
                            title="View Recipe Details"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/recipes/${r.id}/edit`)}
                            title="Edit Recipe"
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(r)}
                            title="Duplicate Recipe"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setRecipeToDelete(r);
                              setDeleteModalOpen(true);
                            }}
                            title="Delete Recipe"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Recipe"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={actionLoading}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              {actionLoading ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        }
      >
        <p className="text-xs text-slate-600">
          Are you sure you want to delete <strong className="text-slate-900">{recipeToDelete?.name}</strong>?
          This will unlink the inventory availability calculation from its mapped menu item.
        </p>
      </Modal>
    </div>
  );
}
