const DataService = require('../services/dataService');

const ExpenseController = {
  async getExpenses(req, res) {
    try {
      const expenses = await DataService.getExpenses(req.restaurantId);

      const todayStr = new Date().toISOString().split('T')[0];
      const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

      let todayExpenses = 0;
      let monthExpenses = 0;
      const categoryTotals = {};

      for (const exp of expenses) {
        const amt = Number(exp.amount) || 0;
        if (exp.date === todayStr) {
          todayExpenses += amt;
        }
        if (exp.date && exp.date.startsWith(currentMonthStr)) {
          monthExpenses += amt;
        }
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
      }

      const breakdown = Object.keys(categoryTotals).map(cat => ({
        category: cat,
        amount: categoryTotals[cat]
      }));

      return res.json({
        expenses,
        summary: {
          todayExpenses,
          monthExpenses,
          breakdown
        }
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createExpense(req, res) {
    try {
      const { title, category, amount, date, payment_method, notes } = req.body;
      if (!title || !category || amount === undefined) {
        return res.status(400).json({ message: 'Title, category, and amount are required' });
      }

      const newExp = await DataService.createExpense({
        restaurant_id: req.restaurantId,
        title,
        category,
        amount: Number(amount) || 0,
        date: date || new Date().toISOString().split('T')[0],
        payment_method: payment_method || 'Bank Transfer',
        notes: notes || '',
        recorded_by: req.user ? req.user.name : 'Admin'
      });

      return res.status(201).json(newExp);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = ExpenseController;
