const DataService = require('../services/dataService');

const InventoryController = {
  async getInventory(req, res) {
    try {
      const items = await DataService.getInventory(req.restaurantId);
      return res.json(items);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createItem(req, res) {
    try {
      const { name, category, current_stock, unit, min_stock, cost_per_unit } = req.body;
      if (!name || !category) {
        return res.status(400).json({ message: 'Name and category are required' });
      }
      const newItem = await DataService.createInventoryItem({
        restaurant_id: req.restaurantId,
        name,
        category,
        current_stock: Number(current_stock) || 0,
        unit: unit || 'kg',
        min_stock: Number(min_stock) || 5,
        cost_per_unit: Number(cost_per_unit) || 0
      });
      return res.status(201).json(newItem);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const updated = await DataService.updateInventoryItem(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Item not found' });
      }
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async adjustStock(req, res) {
    try {
      const { id } = req.params;
      const { adjustment, type = 'adjustment', reason = '' } = req.body; // adjustment can be positive or negative
      const inventory = await DataService.getInventory(req.restaurantId);
      const item = inventory.find(i => i.id === id);
      if (!item) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }

      const newStock = Math.max(0, Number(item.current_stock) + Number(adjustment));
      const updated = await DataService.updateInventoryItem(id, { current_stock: newStock });

      await DataService.recordStockMovement({
        item_id: item.id,
        item_name: item.name,
        type,
        quantity: Math.abs(adjustment),
        reason: reason || (adjustment >= 0 ? 'Manual Stock In' : 'Manual Stock Reduction'),
        recorded_by: req.user ? req.user.name : 'Staff'
      });

      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async recordWastage(req, res) {
    try {
      const { id } = req.params;
      const { quantity, reason } = req.body;
      const inventory = await DataService.getInventory(req.restaurantId);
      const item = inventory.find(i => i.id === id);
      if (!item) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }

      const wastageQty = Number(quantity) || 0;
      const newStock = Math.max(0, Number(item.current_stock) - wastageQty);
      const updated = await DataService.updateInventoryItem(id, { current_stock: newStock });

      await DataService.recordStockMovement({
        item_id: item.id,
        item_name: item.name,
        type: 'wastage',
        quantity: wastageQty,
        reason: reason || 'Spoilage / damaged during prep',
        recorded_by: req.user ? req.user.name : 'Staff'
      });

      return res.json({ message: 'Wastage recorded successfully', item: updated });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getMovements(req, res) {
    try {
      const movements = await DataService.getStockMovements(req.restaurantId);
      return res.json(movements);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = InventoryController;
