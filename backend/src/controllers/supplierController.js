const DataService = require('../services/dataService');

const SupplierController = {
  async getSuppliers(req, res) {
    try {
      const suppliers = await DataService.getSuppliers(req.restaurantId);
      return res.json(suppliers);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createSupplier(req, res) {
    try {
      const { name, phone, email, address, gst_number, products_supplied, outstanding_amount } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ message: 'Supplier name and phone are required' });
      }
      const newSup = await DataService.createSupplier({
        restaurant_id: req.restaurantId,
        name,
        phone,
        email: email || '',
        address: address || '',
        gst_number: gst_number || '',
        products_supplied: products_supplied || '',
        outstanding_amount: Number(outstanding_amount) || 0
      });
      return res.status(201).json(newSup);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateSupplier(req, res) {
    try {
      const { id } = req.params;
      const updated = await DataService.updateSupplier(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = SupplierController;
