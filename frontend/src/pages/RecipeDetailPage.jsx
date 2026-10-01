import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  CookingPot,
  ArrowLeft,
  Edit2,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  Layers,
  UtensilsCrossed,
  Clock,
  TrendingDown,
  Percent,
  DollarSign,
  Package,
  Activity,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  FileText,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const fetchRecipe = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/recipes/${id}`);
      setRecipe(res.data);
    } catch (err) {
      showToast('Error loading recipe details', 'error');
      navigate('/recipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const handleDuplicate = async () => {
    try {
      const res = await api.post(`/recipes/${recipe.id}/duplicate`);
      showToast(`Cloned recipe: ${res.data.name}`, 'success');
      navigate(`/recipes/${res.data.id}/edit`);
    } catch (err) {
      showToast('Failed to clone recipe', 'error');
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/recipes/${recipe.id}`);
      showToast('Recipe deleted successfully', 'info');
      navigate('/recipes');
    } catch (err) {
      showToast('Error deleting recipe', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleManualOverride = async () => {
    if (!recipe?.menu_item_id) return;
    setActionLoading(true);
    try {
      const currentOverride = recipe.menu_item?.is_manual_override;
      const targetState = !currentOverride;
      await api.post(`/menu/items/${recipe.menu_item_id}/override-availability`, {
        is_override: targetState,
        override_available: false,
        reason: overrideReason || 'Manual kitchen override'
      });
      showToast(targetState ? 'Manual 86 override applied' : 'Automatic inventory calculation resumed', 'success');
      setOverrideModalOpen(false);
      setOverrideReason('');
      fetchRecipe();
    } catch (err) {
      showToast('Failed to update availability override', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading recipe & live stock metrics...</p>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  const { availability, cost_breakdown, menu_item, ingredients, recent_deductions } = recipe;
  const isAvailable = availability?.is_available;
  const sellableQty = availability?.sellable_portions ?? 0;
  const limitingName = availability?.limiting_ingredient_name;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Breadcrumb & Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/recipes')}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Back to Recipes"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Link to="/recipes" className="hover:text-orange-600 transition-colors">Recipes</Link>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-slate-800">{recipe.name}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <CookingPot className="w-6 h-6 text-orange-600" />
                    {recipe.name}
                  </h1>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      recipe.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {recipe.is_active ? 'Active' : 'Draft / Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchRecipe}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                title="Refresh Live Stock"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleDuplicate}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                Duplicate
              </button>
              <button
                onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Recipe
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Recipe"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Availability Banner / KPI Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sellable Portions */}
          <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Sellable Portions</span>
              <span className={`p-1.5 rounded-lg ${isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {isAvailable ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold ${sellableQty === 0 ? 'text-rose-600' : sellableQty <= 5 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {sellableQty}
              </span>
              <span className="text-xs text-slate-500 font-medium">portions available</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              {isAvailable ? (
                <span className="text-emerald-600 font-medium">Ready for POS & QR ordering</span>
              ) : (
                <span className="text-rose-600 font-medium">Sold Out / Kitchen 86'd</span>
              )}
            </p>
          </div>

          {/* Limiting Raw Material */}
          <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Bottleneck Ingredient</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-base font-bold text-slate-900 truncate block">
                {limitingName || 'None (Adequate)'}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                {availability?.limiting_stock !== undefined ? (
                  <span>
                    Stock: <strong className="text-slate-800">{availability.limiting_stock} {availability.limiting_unit}</strong>
                  </span>
                ) : (
                  'All ingredients stocked'
                )}
              </p>
            </div>
          </div>

          {/* Total Recipe Cost */}
          <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Recipe Cost (BOM)</span>
              <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                ₹{(cost_breakdown?.total_cost || 0).toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">/ portion</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>Raw: ₹{(cost_breakdown?.raw_cost || 0).toFixed(2)}</span>
              <span>•</span>
              <span>Wastage: ₹{(cost_breakdown?.wastage_cost || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Food Cost Margin */}
          <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Food Cost Margin</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Percent className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {cost_breakdown?.food_cost_percentage !== null
                  ? `${cost_breakdown.food_cost_percentage}%`
                  : 'N/A'}
              </span>
              <span className="text-xs text-slate-500">of menu price</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Selling Price: <strong className="text-slate-800">₹{(menu_item?.price || 0).toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {/* Manual Kitchen Override Warning (if active) */}
        {menu_item?.is_manual_override && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900">Manual Kitchen 86 Override Active</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  This dish has been manually disabled by kitchen staff. Automatic stock calculations are overridden until resumed.
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleManualOverride}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
            >
              Resume Auto Stock
            </button>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Bill of Materials Table & Instructions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ingredients Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-600" />
                    Bill of Materials (BOM)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ingredients?.length || 0} inventory raw materials mapped to this dish
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                  Portion Size: {recipe.serving_size || 1} Serving
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Ingredient</th>
                      <th className="px-4 py-3 text-right">Required Qty</th>
                      <th className="px-4 py-3 text-right">Wastage %</th>
                      <th className="px-4 py-3 text-right">Current Stock</th>
                      <th className="px-4 py-3 text-right">Max Portions</th>
                      <th className="px-4 py-3 text-right">Unit Rate</th>
                      <th className="px-4 py-3 text-right">Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {ingredients?.map((ing, idx) => {
                      const breakdown = availability?.ingredient_breakdown?.find(
                        (b) => b.ingredient_id === ing.ingredient_id
                      );
                      const isLimiting = breakdown?.is_limiting;
                      const maxPossible = breakdown?.max_portions ?? 0;

                      return (
                        <tr
                          key={ing.ingredient_id || idx}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isLimiting ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              {isLimiting && (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" title="Limiting Ingredient" />
                              )}
                              <span>{ing.ingredient_name || ing.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {ing.quantity} {ing.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            {ing.wastage_percent ? `${ing.wastage_percent}%` : '0%'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">
                            {breakdown ? `${breakdown.current_stock} ${breakdown.stock_unit}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                maxPossible === 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : isLimiting
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {maxPossible}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            ₹{(ing.cost_per_unit || 0).toFixed(2)}/{ing.unit}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            ₹{(ing.calculated_cost || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900">
                    <tr>
                      <td colSpan="6" className="px-4 py-3 text-right text-xs uppercase text-slate-600">
                        Total Recipe Production Cost:
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-orange-600">
                        ₹{(cost_breakdown?.total_cost || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Preparation Instructions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-orange-600" />
                Preparation & Kitchen Instructions (SOP)
              </h3>
              {recipe.preparation_instructions ? (
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {recipe.preparation_instructions}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No step-by-step preparation instructions specified for this recipe yet.
                </p>
              )}
            </div>

            {/* Recent Inventory Deductions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-600" />
                  Recent Recipe Consumption & Deductions
                </h3>
                <span className="text-xs text-slate-500">Auto-deducted on order settlement</span>
              </div>

              {recent_deductions && recent_deductions.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                  {recent_deductions.map((ded, i) => (
                    <div key={ded.id || i} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{ded.item_name || 'Ingredient'}</span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Qty: <strong className="text-rose-600">-{ded.quantity} {ded.unit}</strong></span>
                          <span>•</span>
                          <span>Order: #{ded.order_id || 'N/A'}</span>
                          <span>•</span>
                          <span>{new Date(ded.created_at || Date.now()).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px]">
                        Bal: {ded.new_stock || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg">
                  No stock deduction transactions recorded for this recipe yet. Stock deducts automatically when orders are processed.
                </p>
              )}
            </div>
          </div>

          {/* Right Column (1 Col): Recipe Overview & Kitchen Controls */}
          <div className="space-y-6">
            {/* Meta Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                Linked Menu Dish
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Menu Item Name</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {menu_item?.name || recipe.name}
                  </p>
                </div>

                <div className="flex justify-between">
                  <div>
                    <span className="text-slate-500">Menu Category</span>
                    <p className="font-semibold text-slate-800">{menu_item?.category || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Menu Price</span>
                    <p className="font-bold text-slate-900">₹{(menu_item?.price || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-500">Assigned Branch</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-1">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{recipe.branch_id === 'ALL' || !recipe.branch_id ? 'All Restaurant Outlets' : recipe.branch_id}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-500">Recipe Description</span>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    {recipe.description || 'No public description provided.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between text-slate-500">
                  <span>Last Updated:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(recipe.updated_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Kitchen Availability Override Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                Kitchen Availability Controls
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                If the kitchen temporarily runs out of preparation gas, tandoor heat, or special equipment, managers can manually mark this item unavailable.
              </p>

              <button
                onClick={() => setOverrideModalOpen(true)}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  menu_item?.is_manual_override
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {menu_item?.is_manual_override ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Clear Override & Resume Auto Stock
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Manual Kitchen 86 (Override)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Recipe"
      >
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Are you sure you want to permanently delete <strong className="text-slate-900">{recipe.name}</strong>?
          </p>
          <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
            Warning: The connected menu item will revert to unlinked status, and automatic inventory stock deduction on POS orders will cease.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {actionLoading ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Override Reason Modal */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title={menu_item?.is_manual_override ? 'Resume Automatic Stock' : 'Manual Kitchen 86 Override'}
      >
        <div className="space-y-4 text-xs text-slate-600">
          {menu_item?.is_manual_override ? (
            <p>
              This will remove the manual kitchen lock and recalculate real-time sellable portions from the live inventory raw materials.
            </p>
          ) : (
            <div>
              <p className="mb-2">
                Marking this item unavailable will immediately 86 it on POS terminals and Customer QR ordering, regardless of raw ingredient stock levels.
              </p>
              <label className="block text-slate-700 font-semibold mb-1">Reason for Kitchen Override (Staff only):</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Tandoor oven undergoing maintenance"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setOverrideModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleManualOverride}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Apply Setting'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
