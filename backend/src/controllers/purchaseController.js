const DataService = require('../services/dataService');

const PurchaseController = {
  async getPurchases(req, res) {
    try {
      const purchases = await DataService.getPurchases(req.restaurantId);
      return res.json(purchases);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createPurchase(req, res) {
    try {
      const { supplier_id, supplier_name, invoice_number, date, items, subtotal, tax_total, grand_total, status } = req.body;

      if (!supplier_name || !items || items.length === 0) {
        return res.status(400).json({ message: 'Supplier name and items are required' });
      }

      const newPurchase = await DataService.createPurchase({
        restaurant_id: req.restaurantId,
        supplier_id: supplier_id || 'sup-custom',
        supplier_name,
        invoice_number: invoice_number || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
        date: date || new Date().toISOString().split('T')[0],
        items,
        subtotal: Number(subtotal) || 0,
        tax_total: Number(tax_total) || 0,
        grand_total: Number(grand_total) || 0,
        status: status || 'draft'
      }, req.user);

      return res.status(201).json(newPurchase);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // draft, received, cancelled
      const updated = await DataService.updatePurchase(id, { status }, req.user);
      if (!updated) {
        return res.status(404).json({ message: 'Purchase not found' });
      }
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = PurchaseController;
