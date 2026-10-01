const DataService = require('../services/dataService');
const {
  calculateRecipeCost,
  calculateRecipeAvailability,
  validateCartIngredients
} = require('../utils/recipeEngine');

const RecipeController = {
  /**
   * Get all recipes for tenant & branch
   */
  async getRecipes(req, res) {
    try {
      const { branch_id, status } = req.query;
      const recipes = await DataService.getRecipes(req.restaurantId, branch_id);
      const inventory = await DataService.getInventory(req.restaurantId, branch_id);
      const menuItems = await DataService.getMenuItems(req.restaurantId);

      // Enrich with calculations
      const enriched = recipes.map((recipe) => {
        const menuItem = menuItems.find((m) => m.id === recipe.menu_item_id) || {
          name: recipe.name,
          price: 0,
          is_veg: true
        };
        const costMeta = calculateRecipeCost(recipe, inventory);
        const availMeta = calculateRecipeAvailability(recipe, inventory, branch_id);

        return {
          ...recipe,
          menu_item_name: menuItem.name,
          menu_item_price: menuItem.price,
          menu_item_is_veg: menuItem.is_veg,
          ingredients_count: recipe.ingredients ? recipe.ingredients.length : 0,
          total_cost: costMeta.totalCost,
          cost_per_serving: costMeta.costPerServing,
          sellable_quantity: availMeta.sellableQuantity,
          is_available: availMeta.isAvailable,
          limiting_ingredient: availMeta.limitingIngredient,
          limiting_stock: availMeta.limitingStock,
          staff_reason: availMeta.staffReason
        };
      });

      let filtered = enriched;
      if (status && status !== 'all') {
        filtered = filtered.filter((r) => (status === 'active' ? r.is_active : !r.is_active));
      }

      return res.json(filtered);
    } catch (err) {
      console.error('[Get Recipes Error]', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Get detailed single recipe by ID
   */
  async getRecipeById(req, res) {
    try {
      const { id } = req.params;
      const recipe = await DataService.getRecipeById(id);
      if (!recipe || recipe.restaurant_id !== req.restaurantId) {
        return res.status(404).json({ message: 'Recipe not found' });
      }

      const inventory = await DataService.getInventory(req.restaurantId, recipe.branch_id);
      const menuItems = await DataService.getMenuItems(req.restaurantId);
      const menuItem = menuItems.find((m) => m.id === recipe.menu_item_id);

      const costMeta = calculateRecipeCost(recipe, inventory);
      const availMeta = calculateRecipeAvailability(recipe, inventory, recipe.branch_id);

      // Get recent deductions/movements for this recipe
      const allMovements = await DataService.getStockMovements(req.restaurantId);
      const recentDeductions = allMovements
        .filter((m) => m.recipe_id === id || (m.menu_item_id && m.menu_item_id === recipe.menu_item_id))
        .slice(0, 10);

      return res.json({
        ...recipe,
        menu_item: menuItem || null,
        cost_breakdown: costMeta,
        availability: availMeta,
        recent_deductions: recentDeductions
      });
    } catch (err) {
      console.error('[Get Recipe By ID Error]', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Create new recipe
   */
  async createRecipe(req, res) {
    try {
      const { name, menu_item_id, branch_id, description, preparation_instructions, serving_size, is_active, ingredients } = req.body;

      if (!name || !menu_item_id) {
        return res.status(400).json({ message: 'Recipe Name and Menu Item are required' });
      }

      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ message: 'At least one ingredient is required' });
      }

      const newRecipe = await DataService.createRecipe({
        restaurant_id: req.restaurantId,
        company_id: req.user?.company_id || 'comp-abc-foods',
        branch_id: branch_id || null,
        menu_item_id,
        name,
        description: description || '',
        preparation_instructions: preparation_instructions || '',
        serving_size: Number(serving_size) || 1,
        is_active: is_active !== false,
        ingredients: ingredients.map((ing) => ({
          ingredient_id: ing.ingredient_id,
          ingredient_name: ing.ingredient_name || '',
          quantity: Number(ing.quantity) || 0,
          unit: ing.unit || 'g',
          wastage_percent: Number(ing.wastage_percent) || 0,
          cost_per_unit: Number(ing.cost_per_unit) || 0,
          calculated_cost: Number(ing.calculated_cost) || 0
        }))
      });

      return res.status(201).json(newRecipe);
    } catch (err) {
      console.error('[Create Recipe Error]', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Update existing recipe
   */
  async updateRecipe(req, res) {
    try {
      const { id } = req.params;
      const existing = await DataService.getRecipeById(id);
      if (!existing || existing.restaurant_id !== req.restaurantId) {
        return res.status(404).json({ message: 'Recipe not found' });
      }

      const updated = await DataService.updateRecipe(id, req.body);
      return res.json(updated);
    } catch (err) {
      console.error('[Update Recipe Error]', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Delete recipe
   */
  async deleteRecipe(req, res) {
    try {
      const { id } = req.params;
      const existing = await DataService.getRecipeById(id);
      if (!existing || existing.restaurant_id !== req.restaurantId) {
        return res.status(404).json({ message: 'Recipe not found' });
      }

      await DataService.deleteRecipe(id);
      return res.json({ message: 'Recipe deleted successfully' });
    } catch (err) {
      console.error('[Delete Recipe Error]', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Duplicate recipe
   */
  async duplicateRecipe(req, res) {
    try {
      const { id } = req.params;
      const existing = await DataService.getRecipeById(id);
      if (!existing || existing.restaurant_id !== req.restaurantId) {
        return res.status(404).json({ message: 'Recipe not found' });
      }

      const cloned = await DataService.createRecipe({
        ...existing,
        id: `rec-${Date.now()}`,
        name: `${existing.name} (Copy)`,
        created_at: new Date().toISOString()
      });

      return res.status(201).json(cloned);
    } catch (err) {
      console.error('[Duplicate Recipe Error]', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Real-time Menu Item Availability for POS & Staff
   * Calculates maximum sellable quantity based on recipes and inventory stock.
   */
  async getMenuAvailability(req, res) {
    try {
      const { branch_id } = req.query;
      const availabilityMap = await DataService.getMenuAvailabilityMap(req.restaurantId, branch_id);
      return res.json(Object.values(availabilityMap));
    } catch (err) {
      console.error('[Get Menu Availability Error]', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Manual availability override by authorized manager
   */
  async overrideAvailability(req, res) {
    try {
      const { menuItemId } = req.params;
      const { is_available, reason } = req.body;

      const updated = await DataService.overrideMenuItemAvailability(
        req.restaurantId,
        menuItemId,
        is_available,
        reason,
        req.user?.name || 'Manager'
      );

      return res.json(updated);
    } catch (err) {
      console.error('[Override Availability Error]', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Cart-Level Shared Ingredient Pre-flight Validation
   */
  async validateCart(req, res) {
    try {
      const { items, branch_id } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Cart items array is required' });
      }

      const recipes = await DataService.getRecipes(req.restaurantId, branch_id);
      const inventory = await DataService.getInventory(req.restaurantId, branch_id);

      const result = validateCartIngredients(items, recipes, inventory, branch_id);
      return res.json(result);
    } catch (err) {
      console.error('[Validate Cart Error]', err);
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = RecipeController;
