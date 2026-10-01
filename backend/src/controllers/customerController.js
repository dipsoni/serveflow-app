const DataService = require('../services/dataService');

const CustomerController = {
  async getCustomers(req, res) {
    try {
      const { search } = req.query;
      const customers = await DataService.getCustomers(req.restaurantId, search);
      return res.json(customers);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getCustomerById(req, res) {
    try {
      const { id } = req.params;
      const customers = await DataService.getCustomers(req.restaurantId);
      const customer = customers.find(c => c.id === id);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Fetch customer order history
      const allOrders = await DataService.getOrders(req.restaurantId);
      const orderHistory = allOrders.filter(o => o.customer_id === id || (o.customer_phone && o.customer_phone === customer.phone));

      return res.json({
        ...customer,
        orderHistory
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createCustomer(req, res) {
    try {
      const { name, phone, email, address, notes, favorite_items } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ message: 'Customer name and phone are required' });
      }
      const newCust = await DataService.createCustomer({
        restaurant_id: req.restaurantId,
        name,
        phone,
        email: email || '',
        address: address || '',
        notes: notes || '',
        favorite_items: favorite_items || ''
      });
      return res.status(201).json(newCust);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const updated = await DataService.updateCustomer(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = CustomerController;
