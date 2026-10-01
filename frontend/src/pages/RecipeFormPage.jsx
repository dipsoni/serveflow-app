import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CookingPot,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Info,
  DollarSign,
  TrendingDown,
  Percent,
  CheckCircle2,
  Layers,
  UtensilsCrossed,
  Building2
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function RecipeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Available options from backend
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [branches, setBranches] = useState([]);

  // Form State
  const [name, setName] = useState('');
  const [menuItemId, setMenuItemId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [description, setDescription] = useState('');
  const [preparationInstructions, setPreparationInstructions] = useState('');
  const [servingSize, setServingSize] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Dynamic Ingredient Rows
  const [ingredients, setIngredients] = useState([
    {
      ingredient_id: '',
      ingredient_name: '',
      quantity: 1,
      unit: 'g',
      wastage_percent: 0,
      cost_per_unit: 0,
      calculated_cost: 0
    }
  ]);

  // Load initial dropdown data
  useEffect(() => {
    const fetchPrerequisites = async () => {
      setLoading(true);
      try {
        const [menuRes, invRes, branchRes] = await Promise.all([
          api.get('/menu/items'),
          api.get('/inventory'),
          api.get('/branches').catch(() => ({ data: [] }))
        ]);
        setMenuItems(menuRes.data || []);
        setInventoryItems(invRes.data || []);
        setBranches(branchRes.data || []);

        // If edit mode, fetch recipe
        if (isEdit) {
          const recipeRes = await api.get(`/recipes/${id}`);
          const r = recipeRes.data;
          setName(r.name || '');
          setMenuItemId(r.menu_item_id || '');
          setBranchId(r.branch_id || '');
          setDescription(r.description || '');
          setPreparationInstructions(r.preparation_instructions || '');
          setServingSize(r.serving_size || 1);
          setIsActive(r.is_active !== false);

          if (r.ingredients && r.ingredients.length > 0) {
            setIngredients(
              r.ingredients.map((ing) => ({
                ingredient_id: ing.ingredient_id,
                ingredient_name: ing.ingredient_name || '',
                quantity: Number(ing.quantity) || 0,
                unit: ing.unit || 'g',
                wastage_percent: Number(ing.wastage_percent) || 0,
                cost_per_unit: Number(ing.cost_per_unit) || 0,
                calculated_cost: Number(ing.calculated_cost) || 0
              }))
            );
          }
        }
      } catch (err) {
        showToast('Error loading recipe form data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPrerequisites();
  }, [id, isEdit]);

  // Auto-name recipe when menu dish is selected (if name is empty)
  const handleMenuSelect = (mId) => {
    setMenuItemId(mId);
    const dish = menuItems.find((m) => m.id === mId);
    if (dish && (!name || name.trim() === '')) {
      setName(`${dish.name} Recipe`);
    }
  };

  // Ingredient row change
  const handleIngredientChange = (index, field, value) => {
    setIngredients((prev) => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: value };

      if (field === 'ingredient_id') {
        const inv = inventoryItems.find((i) => i.id === value);
        if (inv) {
          row.ingredient_name = inv.name;
          row.cost_per_unit = Number(inv.cost_per_unit) || 0;
          row.unit = inv.unit || 'g';
        }
      }

      // Recompute row cost
      const qty = Number(row.quantity) || 0;
      const unitCost = Number(row.cost_per_unit) || 0;
      const wastage = Number(row.wastage_percent) || 0;
      const baseCost = qty * unitCost;
      const wastageCost = baseCost * (wastage / 100);
      row.calculated_cost = Number((baseCost + wastageCost).toFixed(2));

      copy[index] = row;
      return copy;
    });
  };

  const addIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      {
        ingredient_id: '',
        ingredient_name: '',
        quantity: 1,
        unit: 'g',
        wastage_percent: 0,
        cost_per_unit: 0,
        calculated_cost: 0
      }
    ]);
  };

  const removeIngredientRow = (index) => {
    if (ingredients.length === 1) {
      showToast('Recipe must have at least one ingredient row', 'warning');
      return;
    }
    setIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Recipe Cost Calculations
  const costSummary = useMemo(() => {
    let rawSum = 0;
    let wastageSum = 0;

    for (const ing of ingredients) {
      const qty = Number(ing.quantity) || 0;
      const unitCost = Number(ing.cost_per_unit) || 0;
      const wastage = Number(ing.wastage_percent) || 0;
      const base = qty * unitCost;
      const wCost = base * (wastage / 100);
      rawSum += base;
      wastageSum += wCost;
    }

    const total = rawSum + wastageSum;
    const sSize = Number(servingSize) || 1;
    const costPerServing = total / sSize;

    // Selling price of selected dish
    const selectedDish = menuItems.find((m) => m.id === menuItemId);
    const dishPrice = selectedDish ? Number(selectedDish.price) || 0 : 0;
    const foodCostPct = dishPrice > 0 ? ((costPerServing / dishPrice) * 100).toFixed(1) : 0;

    return {
      rawCost: Number(rawSum.toFixed(2)),
      wastageCost: Number(wastageSum.toFixed(2)),
      totalCost: Number(total.toFixed(2)),
      costPerServing: Number(costPerServing.toFixed(2)),
      dishPrice,
      foodCostPct
    };
  }, [ingredients, servingSize, menuItemId, menuItems]);

  // Save handler (with Ctrl+S shortcut)
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!name.trim()) {
      showToast('Recipe Name is required', 'warning');
      return;
    }
    if (!menuItemId) {
      showToast('Please select a target Menu Dish', 'warning');
      return;
    }

    const validIngredients = ingredients.filter((i) => i.ingredient_id);
    if (validIngredients.length === 0) {
      showToast('Please add at least one valid raw material ingredient', 'warning');
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        name,
        menu_item_id: menuItemId,
        branch_id: branchId || null,
        description,
        preparation_instructions: preparationInstructions,
        serving_size: Number(servingSize) || 1,
        is_active: isActive,
        ingredients: validIngredients
      };

      if (isEdit) {
        await api.put(`/recipes/${id}`, payload);
        showToast('Recipe updated successfully', 'success');
      } else {
        await api.post('/recipes', payload);
        showToast('Recipe created successfully', 'success');
      }
      navigate('/recipes');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving recipe', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name, menuItemId, branchId, description, preparationInstructions, servingSize, isActive, ingredients]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto select-none">
      {/* ================= HEADER BAR ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button
              onClick={() => navigate('/recipes')}
              className="hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Recipes</span>
            </button>
            <span>/</span>
            <span className="text-slate-800 font-bold">{isEdit ? 'Edit Recipe' : 'New Recipe'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CookingPot className="w-6 h-6 text-orange-600" />
            <span>{isEdit ? `Edit: ${name}` : 'Create Recipe (Bill of Materials)'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/recipes')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saveLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saveLoading ? 'Saving...' : 'Save Recipe (Ctrl+S)'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ================= CARD 1: BASIC INFORMATION ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-600" />
              <span>1. Basic Information</span>
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">Status:</span>
              <span
                onClick={() => setIsActive(!isActive)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-black cursor-pointer transition-colors ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Menu Dish */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Target Menu Item <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={menuItemId}
                onChange={(e) => handleMenuSelect(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
              >
                <option value="">Select menu dish to link...</option>
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (₹{m.price} · {m.is_veg ? 'Veg' : 'Non-Veg'})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                This recipe will directly govern the kitchen availability of this menu item.
              </p>
            </div>

            {/* Recipe Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Recipe Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Traditional Tandoori Roti Recipe"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Branch Scope */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Branch / Outlet Scope
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
              >
                <option value="">All Branches (Global Standard Recipe)</option>
                <option value="branch-bopal">Bopal Outlet</option>
                <option value="branch-satellite">Satellite Outlet</option>
                <option value="branch-sghighway">SG Highway Outlet</option>
              </select>
            </div>

            {/* Serving Size */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Serving Size (Yield in Portions)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={servingSize}
                onChange={(e) => setServingSize(Number(e.target.value) || 1)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Number of guest portions produced by these ingredient quantities.</p>
            </div>
          </div>

          {/* Description & Preparation Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Brief Description / Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Standard 30g dough ball kneaded with refined oil and double sieved whole wheat flour."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Preparation Instructions (For Chef / Kitchen Display)
              </label>
              <textarea
                rows={2}
                value={preparationInstructions}
                onChange={(e) => setPreparationInstructions(e.target.value)}
                placeholder="1. Knead dough smoothly...\n2. Portion balls...\n3. Bake in tandoor at 350°C."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* ================= CARD 2: DYNAMIC INGREDIENTS TABLE ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-600" />
                <span>2. Ingredients & Raw Materials (Inventory Linked)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Ingredients are mapped to your live Inventory items to track stock usage and availability.
              </p>
            </div>
            <button
              type="button"
              onClick={addIngredientRow}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-700 rounded-xl text-xs font-bold border border-orange-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ingredient</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-56">Raw Material</th>
                  <th className="py-2.5 px-3 w-28">Quantity</th>
                  <th className="py-2.5 px-3 w-24">Unit</th>
                  <th className="py-2.5 px-3 w-24">Wastage %</th>
                  <th className="py-2.5 px-3 w-32">Cost / Unit</th>
                  <th className="py-2.5 px-3 w-28 text-right">Cost (₹)</th>
                  <th className="py-2.5 px-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {ingredients.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    {/* Raw Material Select */}
                    <td className="py-2.5 px-3">
                      <select
                        required
                        value={row.ingredient_id}
                        onChange={(e) => handleIngredientChange(idx, 'ingredient_id', e.target.value)}
                        className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-orange-500 cursor-pointer"
                      >
                        <option value="">Select Raw Material...</option>
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} (Stock: {inv.current_stock} {inv.unit})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0.0001"
                        step="any"
                        required
                        value={row.quantity}
                        onChange={(e) => handleIngredientChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-orange-500"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-3">
                      <select
                        value={row.unit}
                        onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                        className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-orange-500 cursor-pointer"
                      >
                        <option value="g">g (Grams)</option>
                        <option value="kg">kg (Kilograms)</option>
                        <option value="ml">ml (Milliliters)</option>
                        <option value="ltr">ltr (Liters)</option>
                        <option value="pcs">pcs (Pieces)</option>
                      </select>
                    </td>

                    {/* Wastage % */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={row.wastage_percent}
                        onChange={(e) => handleIngredientChange(idx, 'wastage_percent', Number(e.target.value))}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-orange-500"
                      />
                    </td>

                    {/* Cost Per Unit */}
                    <td className="py-2.5 px-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.cost_per_unit}
                          onChange={(e) => handleIngredientChange(idx, 'cost_per_unit', Number(e.target.value))}
                          className="w-full text-xs pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-orange-500 font-semibold"
                        />
                      </div>
                    </td>

                    {/* Row Calculated Cost */}
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      ₹{row.calculated_cost}
                    </td>

                    {/* Delete Row */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeIngredientRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= CARD 3: RECIPE COST & MARGIN ECONOMICS ================= */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-400" />
              <span>3. Recipe Costing & Food Margin Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">Live Real-time Valuation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Raw Material Cost</span>
              <div className="text-lg font-black text-white mt-0.5">₹{costSummary.rawCost}</div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wastage Cost</span>
              <div className="text-lg font-black text-amber-400 mt-0.5">₹{costSummary.wastageCost}</div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Recipe Cost</span>
              <div className="text-xl font-black text-orange-400 mt-0.5">₹{costSummary.totalCost}</div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cost / Serving</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">₹{costSummary.costPerServing}</div>
              {costSummary.dishPrice > 0 && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Food Cost: <span className="font-bold text-white">{costSummary.foodCostPct}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
