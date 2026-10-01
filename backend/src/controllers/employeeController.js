const DataService = require('../services/dataService');

const DEFAULT_PERMISSIONS = {
  owner: ['all'],
  manager: ['pos', 'orders', 'kot', 'tables', 'menu', 'inventory', 'purchases', 'suppliers', 'customers', 'employees', 'expenses', 'reports', 'settings'],
  cashier: ['pos', 'orders', 'tables', 'customers'],
  waiter: ['pos', 'tables', 'orders'],
  kitchen: ['kot', 'inventory_view']
};

const EmployeeController = {
  async getEmployees(req, res) {
    try {
      const employees = await DataService.getEmployees(req.restaurantId);
      return res.json(employees);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createEmployee(req, res) {
    try {
      const { name, phone, email, role, joining_date, salary, permissions } = req.body;
      if (!name || !role) {
        return res.status(400).json({ message: 'Employee name and role are required' });
      }

      const assignedPermissions = permissions && permissions.length > 0 ? permissions : DEFAULT_PERMISSIONS[role] || ['pos'];

      const newEmp = await DataService.createEmployee({
        restaurant_id: req.restaurantId,
        name,
        phone: phone || '',
        email: email || '',
        role,
        joining_date: joining_date || new Date().toISOString().split('T')[0],
        salary: Number(salary) || 0,
        status: 'active',
        permissions: assignedPermissions
      });

      return res.status(201).json(newEmp);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const updated = await DataService.updateEmployee(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = EmployeeController;
