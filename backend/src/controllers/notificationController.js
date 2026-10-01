const DataService = require('../services/dataService');

const NotificationController = {
  async getNotifications(req, res) {
    try {
      const notifications = await DataService.getNotifications(req.restaurantId);
      return res.json(notifications);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      await DataService.markNotificationRead(id);
      return res.json({ message: 'Notification marked as read' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = NotificationController;
