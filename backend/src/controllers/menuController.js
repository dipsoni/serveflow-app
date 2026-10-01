const DataService = require('../services/dataService');

const MenuController = {
  async getCategories(req, res) {
    try {
      const categories = await DataService.getCategories(req.restaurantId);
      return res.json(categories);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createCategory(req, res) {
    try {
      const category = await DataService.createCategory({
        ...req.body,
        restaurant_id: req.restaurantId
      });
      return res.status(201).json(category);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getMenuItems(req, res) {
    try {
      const { category_id } = req.query;
      const items = await DataService.getMenuItems(req.restaurantId, category_id);
      return res.json(items);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createMenuItem(req, res) {
    try {
      const { name, category_id, price } = req.body;
      if (!name || !category_id || price === undefined) {
        return res.status(400).json({ message: 'Name, category, and price are required' });
      }
      const newItem = await DataService.createMenuItem({
        ...req.body,
        restaurant_id: req.restaurantId
      });
      return res.status(201).json(newItem);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateMenuItem(req, res) {
    try {
      const { id } = req.params;
      const updated = await DataService.updateMenuItem(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Menu item not found' });
      }
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async toggleAvailability(req, res) {
    try {
      const { id } = req.params;
      const { is_available } = req.body;
      const updated = await DataService.updateMenuItem(id, { is_available });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async deleteMenuItem(req, res) {
    try {
      const { id } = req.params;
      await DataService.deleteMenuItem(id);
      return res.json({ message: 'Menu item deleted successfully' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getPublicMenu(req, res) {
    try {
      const restaurant = await DataService.getRestaurant();
      const categories = await DataService.getCategories(restaurant.id);
      const items = await DataService.getMenuItems(restaurant.id);
      const availabilityMap = await DataService.getMenuAvailabilityMap(restaurant.id, null);

      // Return items with sanitized is_available flag — NEVER expose internal ingredients or stock
      const publicItems = items.map((it) => {
        const avail = availabilityMap[it.id];
        const isAvailable = avail ? Boolean(avail.is_available) : Boolean(it.is_available);
        return {
          id: it.id,
          category_id: it.category_id,
          name: it.name,
          description: it.description,
          price: it.price,
          is_veg: it.is_veg,
          image: it.image,
          preparation_time: it.preparation_time,
          variants: it.variants || [],
          add_ons: it.add_ons || [],
          is_available: isAvailable
        };
      });

      return res.json({
        restaurant: {
          name: restaurant.name,
          tagline: restaurant.tagline,
          address: restaurant.address,
          phone: restaurant.phone,
          currency: restaurant.currency || '₹',
          tax_rate: restaurant.tax_rate || 5.0
        },
        categories,
        items: publicItems
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = MenuController;
