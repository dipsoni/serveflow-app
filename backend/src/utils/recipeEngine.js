/**
 * SERVEFLOW RECIPE & INVENTORY AVAILABILITY ENGINE
 * Comprehensive Unit Conversion, Cost Calculation, Stock-Linked Availability,
 * Shared-Ingredient Cart Validation, and Idempotent Inventory Deductions.
 */

// Universal Unit Conversion Factors to Base Units (Mass: grams, Volume: milliliters, Count: pcs)
const UNIT_FAMILIES = {
  // Mass -> Base: 'g'
  kg: { family: 'mass', toBase: 1000 },
  kilogram: { family: 'mass', toBase: 1000 },
  g: { family: 'mass', toBase: 1 },
  gram: { family: 'mass', toBase: 1 },
  mg: { family: 'mass', toBase: 0.001 },

  // Volume -> Base: 'ml'
  ltr: { family: 'volume', toBase: 1000 },
  liter: { family: 'volume', toBase: 1000 },
  litre: { family: 'volume', toBase: 1000 },
  l: { family: 'volume', toBase: 1000 },
  ml: { family: 'volume', toBase: 1 },
  milliliter: { family: 'volume', toBase: 1 },

  // Count -> Base: 'pcs'
  pcs: { family: 'count', toBase: 1 },
  piece: { family: 'count', toBase: 1 },
  pieces: { family: 'count', toBase: 1 },
  unit: { family: 'count', toBase: 1 },
  bunch: { family: 'count', toBase: 1 },
  pack: { family: 'count', toBase: 1 }
};

/**
 * Convert quantity from one unit to another
 * E.g. convertUnits(0.5, 'kg', 'g') => 500
 * E.g. convertUnits(25, 'ml', 'ltr') => 0.025
 */
function convertUnits(quantity, fromUnit = 'g', toUnit = 'g') {
  const qty = Number(quantity) || 0;
  const fromClean = String(fromUnit).trim().toLowerCase();
  const toClean = String(toUnit).trim().toLowerCase();

  if (fromClean === toClean) return qty;

  const fromMeta = UNIT_FAMILIES[fromClean];
  const toMeta = UNIT_FAMILIES[toClean];

  // If both belong to the same family, convert accurately
  if (fromMeta && toMeta && fromMeta.family === toMeta.family) {
    const inBase = qty * fromMeta.toBase;
    return inBase / toMeta.toBase;
  }

  // Cross-family approximation fallback (e.g. 1 kg water/oil ≈ 1 liter)
  if (fromMeta && toMeta && ((fromMeta.family === 'mass' && toMeta.family === 'volume') || (fromMeta.family === 'volume' && toMeta.family === 'mass'))) {
    const inBase = qty * fromMeta.toBase; // g or ml
    return inBase / toMeta.toBase;
  }

  return qty;
}

/**
 * Calculate accurate ingredient & recipe cost
 */
function calculateRecipeCost(recipe, inventoryItems = []) {
  if (!recipe || !recipe.ingredients) {
    return {
      ingredientCost: 0,
      wastageCost: 0,
      totalCost: 0,
      costPerServing: 0,
      ingredientsWithCost: []
    };
  }

  let totalRawCost = 0;
  let totalWastageCost = 0;

  const ingredientsWithCost = recipe.ingredients.map((ing) => {
    const invItem = inventoryItems.find((i) => i.id === ing.ingredient_id) || {
      id: ing.ingredient_id,
      name: ing.ingredient_name || 'Ingredient',
      unit: ing.unit || 'g',
      cost_per_unit: Number(ing.cost_per_unit) || 0
    };

    const costPerInvUnit = Number(invItem.cost_per_unit) || Number(ing.cost_per_unit) || 0;
    const requiredInInvUnit = convertUnits(ing.quantity, ing.unit, invItem.unit);
    const baseCost = Number((requiredInInvUnit * costPerInvUnit).toFixed(2));
    const wastagePct = Number(ing.wastage_percent) || 0;
    const wastageCost = Number((baseCost * (wastagePct / 100)).toFixed(2));
    const itemTotalCost = Number((baseCost + wastageCost).toFixed(2));

    totalRawCost += baseCost;
    totalWastageCost += wastageCost;

    return {
      ...ing,
      ingredient_name: invItem.name,
      current_stock: invItem.current_stock,
      inventory_unit: invItem.unit,
      cost_per_unit: costPerInvUnit,
      base_cost: baseCost,
      wastage_cost: wastageCost,
      calculated_cost: itemTotalCost
    };
  });

  const grandTotalCost = Number((totalRawCost + totalWastageCost).toFixed(2));
  const servingSize = Number(recipe.serving_size) || 1;
  const costPerServing = Number((grandTotalCost / servingSize).toFixed(2));

  return {
    ingredientCost: Number(totalRawCost.toFixed(2)),
    wastageCost: Number(totalWastageCost.toFixed(2)),
    totalCost: grandTotalCost,
    costPerServing,
    ingredientsWithCost
  };
}

/**
 * Calculate maximum sellable quantity for a recipe given current inventory
 * Formula: Maximum Sellable Quantity = min( floor(Current Stock / Required Qty per serving) )
 */
function calculateRecipeAvailability(recipe, inventoryItems = [], branchId = null) {
  if (!recipe || !recipe.is_active) {
    return {
      sellableQuantity: 0,
      isAvailable: false,
      limitingIngredient: null,
      limitingStock: 0,
      limitingRequired: 0,
      staffReason: 'Recipe is inactive',
      ingredientContributions: []
    };
  }

  const ingredients = recipe.ingredients || [];
  if (ingredients.length === 0) {
    return {
      sellableQuantity: 999,
      isAvailable: true,
      limitingIngredient: null,
      limitingStock: 0,
      limitingRequired: 0,
      staffReason: null,
      ingredientContributions: []
    };
  }

  let minPortions = Infinity;
  let limitingIng = null;
  let limitingStock = 0;
  let limitingReq = 0;
  const contributions = [];

  for (const ing of ingredients) {
    const invItem = inventoryItems.find((i) => {
      if (branchId && i.branch_id && i.branch_id !== branchId) return false;
      return i.id === ing.ingredient_id;
    }) || inventoryItems.find((i) => i.id === ing.ingredient_id);

    const currentStock = invItem ? Number(invItem.current_stock) || 0 : 0;
    const wastagePct = Number(ing.wastage_percent) || 0;
    // Effective required quantity per serving accounting for wastage
    const effectiveQty = Number(ing.quantity) * (1 + wastagePct / 100);

    // Convert effective required quantity into the inventory item's unit
    const invUnit = invItem?.unit || ing.unit;
    const effectiveQtyInInvUnit = convertUnits(effectiveQty, ing.unit, invUnit);

    let portions = 0;
    if (effectiveQtyInInvUnit > 0) {
      portions = Math.floor(currentStock / effectiveQtyInInvUnit);
    }

    contributions.push({
      ingredient_id: ing.ingredient_id,
      ingredient_name: invItem?.name || ing.ingredient_name || 'Ingredient',
      required_qty: ing.quantity,
      unit: ing.unit,
      effective_qty: effectiveQty,
      inventory_unit: invUnit,
      current_stock: currentStock,
      max_portions: portions
    });

    if (portions < minPortions) {
      minPortions = portions;
      limitingIng = invItem?.name || ing.ingredient_name || 'Ingredient';
      limitingStock = currentStock;
      limitingReq = effectiveQtyInInvUnit;
    }
  }

  const sellableQuantity = minPortions === Infinity ? 0 : Math.max(0, minPortions);
  const isAvailable = sellableQuantity > 0;
  const staffReason = !isAvailable
    ? `Unavailable — insufficient ${limitingIng} stock (${limitingStock} ${ingredients[0]?.unit || ''} remaining, requires ${limitingReq})`
    : null;

  return {
    sellableQuantity,
    isAvailable,
    limitingIngredient: limitingIng,
    limitingStock,
    limitingRequired: limitingReq,
    staffReason,
    ingredientContributions: contributions
  };
}

/**
 * Validate complete Cart against Shared Ingredients
 * Prevents multiple menu items from overselling the same shared raw material!
 */
function validateCartIngredients(cartItems = [], recipes = [], inventoryItems = [], branchId = null) {
  // Aggregate required quantity by ingredient id (converted to inventory unit)
  const aggregatedRequirements = {};

  for (const cartItem of cartItems) {
    const qty = Number(cartItem.quantity) || 1;
    const menuItemId = cartItem.menu_item_id || cartItem.menuItemId || cartItem.id || cartItem.item_id;

    // Find recipe for this menu dish (match by ID or item name)
    const recipe = recipes.find((r) => {
      if (branchId && r.branch_id && r.branch_id !== branchId) return false;
      const idMatch = r.menu_item_id === menuItemId || r.id === menuItemId;
      const nameMatch = cartItem.name && r.name.toLowerCase() === cartItem.name.toLowerCase();
      return (idMatch || nameMatch) && r.is_active;
    }) || recipes.find((r) => {
      const idMatch = r.menu_item_id === menuItemId || r.id === menuItemId;
      const nameMatch = cartItem.name && r.name.toLowerCase() === cartItem.name.toLowerCase();
      return (idMatch || nameMatch) && r.is_active;
    });

    if (!recipe || !recipe.ingredients) continue;

    for (const ing of recipe.ingredients) {
      const invItem = inventoryItems.find((i) => i.id === ing.ingredient_id);
      const invUnit = invItem?.unit || ing.unit;
      const wastagePct = Number(ing.wastage_percent) || 0;
      const effectivePerServing = Number(ing.quantity) * (1 + wastagePct / 100);
      const effectivePerServingInInvUnit = convertUnits(effectivePerServing, ing.unit, invUnit);
      const totalItemNeeded = effectivePerServingInInvUnit * qty;

      if (!aggregatedRequirements[ing.ingredient_id]) {
        aggregatedRequirements[ing.ingredient_id] = {
          ingredient_id: ing.ingredient_id,
          ingredient_name: invItem?.name || ing.ingredient_name || 'Raw Material',
          unit: invUnit,
          total_required: 0,
          current_stock: invItem ? Number(invItem.current_stock) || 0 : 0
        };
      }

      aggregatedRequirements[ing.ingredient_id].total_required += totalItemNeeded;
    }
  }

  // Check each ingredient requirement against current stock
  const shortages = [];
  for (const ingId of Object.keys(aggregatedRequirements)) {
    const req = aggregatedRequirements[ingId];
    if (req.total_required > req.current_stock) {
      shortages.push({
        ingredient_id: req.ingredient_id,
        ingredient_name: req.ingredient_name,
        required: Number(req.total_required.toFixed(2)),
        available: Number(req.current_stock.toFixed(2)),
        unit: req.unit,
        shortage: Number((req.total_required - req.current_stock).toFixed(2)),
        message: `Insufficient ${req.ingredient_name} stock: required ${Number(req.total_required.toFixed(2))} ${req.unit}, available ${Number(req.current_stock.toFixed(2))} ${req.unit}`
      });
    }
  }

  if (shortages.length > 0) {
    const first = shortages[0];
    return {
      isValid: false,
      is_valid: false,
      shortages,
      message: `Insufficient stock to complete this order. ${first.ingredient_name} required: ${first.required} ${first.unit}, available: ${first.available} ${first.unit}.`
    };
  }

  return {
    isValid: true,
    is_valid: true,
    shortages: [],
    message: 'All cart recipe requirements are verified in stock.'
  };
}

module.exports = {
  UNIT_FAMILIES,
  convertUnits,
  calculateRecipeCost,
  calculateRecipeAvailability,
  validateCartIngredients
};
