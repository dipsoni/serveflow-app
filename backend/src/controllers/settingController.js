const DataService = require('../services/dataService');

const SettingController = {
  async getSettings(req, res) {
    try {
      const restaurant = await DataService.getRestaurant(req.restaurantId);
      return res.json(restaurant);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateSettings(req, res) {
    try {
      const updated = await DataService.updateRestaurant(req.restaurantId, req.body);
      return res.json({
        message: 'Settings updated successfully',
        restaurant: updated
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = SettingController;
