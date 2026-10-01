const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const DashboardController = require('../controllers/dashboardController');
const MenuController = require('../controllers/menuController');
const OrderController = require('../controllers/orderController');
const KOTController = require('../controllers/kotController');
const TableController = require('../controllers/tableController');
const InventoryController = require('../controllers/inventoryController');
const PurchaseController = require('../controllers/purchaseController');
const SupplierController = require('../controllers/supplierController');
const CustomerController = require('../controllers/customerController');
const EmployeeController = require('../controllers/employeeController');
const ExpenseController = require('../controllers/expenseController');
const ReportController = require('../controllers/reportController');
const SettingController = require('../controllers/settingController');
const NotificationController = require('../controllers/notificationController');
const ERPUserController = require('../controllers/erpUserController');
const SaaSController = require('../controllers/saasController');
const RecipeController = require('../controllers/recipeController');
const AccountController = require('../controllers/accountController');

const { authenticate, authorize, requireSuperAdmin, enforceTenantAndBranch, enforceModuleAccess } = require('../middleware/authMiddleware');

// 1. PUBLIC ROUTES
router.post('/auth/login', AuthController.login);
router.get('/auth/demo-accounts', AuthController.getDemoAccounts);
router.get('/public/menu/:slug?', MenuController.getPublicMenu);

// Public SaaS routes
router.get('/public/plans', SaaSController.getPublicPlans);
router.post('/public/register', SaaSController.registerRestaurant);
router.post('/public/leads', SaaSController.createSalesLead);
router.post('/admin/auth/login', SaaSController.superAdminLogin);
// Customer contactless QR dining order placement
router.post('/orders', OrderController.createOrder);

// 1.5. SUPER ADMIN PLATFORM ROUTES
const superAdminRoutes = require('./superAdmin');
router.use('/super-admin', superAdminRoutes);

// 2. AUTHENTICATED USER ROUTES
router.use(authenticate);

// Super Admin Platform Routes
router.get('/admin/stats', requireSuperAdmin, SaaSController.getAdminStats);
router.get('/admin/restaurants', requireSuperAdmin, SaaSController.getAdminRestaurants);
router.get('/admin/restaurants/:id', requireSuperAdmin, SaaSController.getAdminRestaurantById);
router.put('/admin/restaurants/:id', requireSuperAdmin, SaaSController.updateAdminRestaurant);
router.delete('/admin/restaurants/:id', requireSuperAdmin, SaaSController.deleteAdminRestaurant);
router.post('/admin/restaurants/:id/reset-password', requireSuperAdmin, SaaSController.resetOwnerPassword);
router.post('/admin/restaurants/:id/extend-subscription', requireSuperAdmin, SaaSController.extendSubscription);
router.get('/admin/plans', requireSuperAdmin, SaaSController.getAdminPlans);
router.post('/admin/plans', requireSuperAdmin, SaaSController.createAdminPlan);
router.put('/admin/plans/:id', requireSuperAdmin, SaaSController.updateAdminPlan);
router.delete('/admin/plans/:id', requireSuperAdmin, SaaSController.deleteAdminPlan);
router.get('/admin/subscriptions', requireSuperAdmin, SaaSController.getAdminSubscriptions);
router.get('/admin/payments', requireSuperAdmin, SaaSController.getAdminPayments);
router.get('/admin/settings', requireSuperAdmin, SaaSController.getAdminSettings);
router.put('/admin/settings', requireSuperAdmin, SaaSController.updateAdminSettings);

// Super Admin Sales Leads Pipeline & Helpdesk
router.get('/admin/leads', requireSuperAdmin, SaaSController.getAdminLeads);
router.put('/admin/leads/:id', requireSuperAdmin, SaaSController.updateAdminLead);
router.post('/admin/leads/:id/convert', requireSuperAdmin, SaaSController.convertAdminLead);
router.get('/admin/support', requireSuperAdmin, SaaSController.getAdminSupportTickets);
router.put('/admin/support/:id', requireSuperAdmin, SaaSController.updateAdminSupportTicket);

// Restaurant Owner Subscription & Multi-Branch Management
router.get('/restaurant/subscription', SaaSController.getRestaurantSubscription);
router.post('/restaurant/subscription/upgrade', SaaSController.upgradeRestaurantSubscription);
router.get('/restaurant/branches', SaaSController.getTenantBranches);
router.post('/restaurant/branches', SaaSController.createTenantBranch);
router.put('/restaurant/branches/:id', SaaSController.updateTenantBranch);
router.delete('/restaurant/branches/:id', SaaSController.deleteTenantBranch);
router.get('/restaurant/roles', SaaSController.getCustomRoles);
router.post('/restaurant/roles', SaaSController.createCustomRole);
router.put('/restaurant/roles/:id', SaaSController.updateCustomRole);
router.delete('/restaurant/roles/:id', SaaSController.deleteCustomRole);

// Restaurant Owner Support Tickets & Onboarding Wizard
router.get('/restaurant/support', SaaSController.getSupportTickets);
router.post('/restaurant/support', SaaSController.createSupportTicket);
router.get('/restaurant/onboarding', SaaSController.getOnboardingProgress);
router.post('/restaurant/onboarding/step', SaaSController.updateOnboardingStep);
router.post('/restaurant/onboarding/complete', SaaSController.completeOnboarding);

router.get('/auth/me', AuthController.me);

// Dashboard
router.get('/dashboard', DashboardController.getStats);

// Menu
router.get('/menu/categories', MenuController.getCategories);
router.post('/menu/categories', authorize(['owner', 'manager']), MenuController.createCategory);
router.get('/menu/items', MenuController.getMenuItems);
router.post('/menu/items', authorize(['owner', 'manager']), MenuController.createMenuItem);
router.put('/menu/items/:id', authorize(['owner', 'manager']), MenuController.updateMenuItem);
router.patch('/menu/items/:id/availability', MenuController.toggleAvailability);
router.delete('/menu/items/:id', authorize(['owner', 'manager']), MenuController.deleteMenuItem);

// Orders
router.get('/orders', OrderController.getOrders);
router.get('/orders/:id', OrderController.getOrderById);
router.put('/orders/:id/status', OrderController.updateOrderStatus);
router.post('/orders/:id/items', OrderController.addItems);
router.put('/orders/:id/items/:itemIndex', OrderController.updateItemQuantity);
router.post('/orders/:id/items/:itemIndex/cancel', OrderController.cancelItem);
router.post('/orders/:id/mark-served', OrderController.markServed);
router.post('/orders/:id/request-bill', OrderController.requestBill);
router.post('/orders/:id/payment', OrderController.recordPayment);
router.post('/orders/:id/charge', OrderController.chargeOrder);
router.post('/orders/:id/cancel', OrderController.cancelOrder);
router.post('/orders/:id/void', OrderController.cancelOrder);
router.delete('/orders/:id', OrderController.deleteOrderPermanently);

// KOT (Kitchen)
router.get('/kot', KOTController.getKOTs);
router.put('/kot/:id/status', KOTController.updateStatus);
router.put('/kot/:id/items/:itemIndex/status', KOTController.updateItemStatus);

// Tables
router.get('/tables', TableController.getTables);
router.post('/tables', authorize(['owner', 'manager']), TableController.createTable);
router.put('/tables/:id', TableController.updateTable);
router.delete('/tables/:id', authorize(['owner', 'manager']), TableController.deleteTable);
router.post('/tables/merge', TableController.mergeTables);
router.post('/tables/transfer', TableController.transferOrder);

// Inventory
router.get('/inventory', InventoryController.getInventory);
router.post('/inventory', authorize(['owner', 'manager']), InventoryController.createItem);
router.put('/inventory/:id', authorize(['owner', 'manager']), InventoryController.updateItem);
router.post('/inventory/:id/adjust', InventoryController.adjustStock);
router.post('/inventory/:id/wastage', InventoryController.recordWastage);
router.get('/inventory/movements', InventoryController.getMovements);

// Recipes & Bill of Materials (BOM)
router.get('/recipes', authenticate, RecipeController.getRecipes);
router.get('/recipes/:id', authenticate, RecipeController.getRecipeById);
router.post('/recipes', authenticate, authorize(['owner', 'manager', 'inventory_mgr', 'sysadmin']), RecipeController.createRecipe);
router.put('/recipes/:id', authenticate, authorize(['owner', 'manager', 'inventory_mgr', 'sysadmin']), RecipeController.updateRecipe);
router.delete('/recipes/:id', authenticate, authorize(['owner', 'manager', 'inventory_mgr', 'sysadmin']), RecipeController.deleteRecipe);
router.post('/recipes/:id/duplicate', authenticate, authorize(['owner', 'manager', 'inventory_mgr', 'sysadmin']), RecipeController.duplicateRecipe);

// Menu Availability linked to Recipes & Inventory
router.get('/menu/availability', authenticate, RecipeController.getMenuAvailability);
router.post('/menu/items/:menuItemId/override-availability', authenticate, authorize(['owner', 'manager', 'sysadmin']), RecipeController.overrideAvailability);
router.post('/menu/validate-cart', authenticate, RecipeController.validateCart);

// Purchases
router.get('/purchases', authorize(['owner', 'manager']), PurchaseController.getPurchases);
router.post('/purchases', authorize(['owner', 'manager']), PurchaseController.createPurchase);
router.put('/purchases/:id/status', authorize(['owner', 'manager']), PurchaseController.updateStatus);

// Suppliers
router.get('/suppliers', authorize(['owner', 'manager']), SupplierController.getSuppliers);
router.post('/suppliers', authorize(['owner', 'manager']), SupplierController.createSupplier);
router.put('/suppliers/:id', authorize(['owner', 'manager']), SupplierController.updateSupplier);

// Customers
router.get('/customers', CustomerController.getCustomers);
router.get('/customers/:id', CustomerController.getCustomerById);
router.post('/customers', CustomerController.createCustomer);
router.put('/customers/:id', CustomerController.updateCustomer);

// Employees
router.get('/employees', authorize(['owner', 'manager']), EmployeeController.getEmployees);
router.post('/employees', authorize(['owner']), EmployeeController.createEmployee);
router.put('/employees/:id', authorize(['owner']), EmployeeController.updateEmployee);

// Expenses
router.get('/expenses', authorize(['owner', 'manager']), ExpenseController.getExpenses);
router.post('/expenses', authorize(['owner', 'manager']), ExpenseController.createExpense);

// Reports
router.get('/reports', authorize(['owner', 'manager']), ReportController.getReports);

// Settings
router.get('/settings', SettingController.getSettings);
router.put('/settings', authorize(['owner', 'manager']), SettingController.updateSettings);

// Notifications
router.get('/notifications', NotificationController.getNotifications);
router.put('/notifications/:id/read', NotificationController.markAsRead);

// ERP MULTI-COMPANY & MULTI-BRANCH ENTERPRISE OS
router.get('/erp/users', enforceTenantAndBranch('users.manage'), ERPUserController.getUsers);
router.get('/erp/users/:id', enforceTenantAndBranch('users.manage'), ERPUserController.getUserById);
router.put('/erp/users/:id', enforceTenantAndBranch('users.manage'), ERPUserController.updateUser);
router.post('/erp/users', enforceTenantAndBranch('users.manage'), ERPUserController.createUser);
router.post('/erp/users/:id/comments', enforceTenantAndBranch('users.manage'), ERPUserController.addComment);
router.get('/erp/roles', ERPUserController.getRoles);
router.get('/erp/branches', ERPUserController.getBranches);
router.get('/erp/audit-logs', ERPUserController.getAuditLogs);

// ACCOUNTS HIERARCHICAL PARENT & CHILD MODULE ROUTES
// Strictly enforced via enforceModuleAccess(childModule, action) + Branch Isolation
router.get('/accounts/dashboard', enforceModuleAccess('accounts_dashboard', 'view'), AccountController.getDashboard);
router.get('/accounts/metrics', enforceModuleAccess('accounts_dashboard', 'view'), AccountController.getDashboard);
router.get('/accounts/sales', enforceModuleAccess('sales', 'view'), AccountController.getSales);
router.get('/accounts/purchase', enforceModuleAccess('purchase', 'view'), AccountController.getPurchases);
router.get('/accounts/expenses', enforceModuleAccess('expenses', 'view'), AccountController.getExpenses);
router.get('/accounts/payments', enforceModuleAccess('payments', 'view'), AccountController.getPayments);
router.get('/accounts/receivables', enforceModuleAccess('receivables', 'view'), AccountController.getReceivables);
router.get('/accounts/payables', enforceModuleAccess('payables', 'view'), AccountController.getPayables);
router.get('/accounts/cash-bank', enforceModuleAccess('cash_bank', 'view'), AccountController.getCashBank);
router.get('/accounts/ledger', enforceModuleAccess('ledger', 'view'), AccountController.getLedger);
router.get('/accounts/journal', enforceModuleAccess('journal_entries', 'view'), AccountController.getJournalEntries);
router.post('/accounts/journal', enforceModuleAccess('journal_entries', 'create'), AccountController.createJournalEntry);
router.get('/accounts/reconciliation', enforceModuleAccess('reconciliation', 'view'), AccountController.getReconciliation);
router.get('/accounts/tax', enforceModuleAccess('gst_tax', 'view'), AccountController.getTax);
router.get('/accounts/reports', enforceModuleAccess('reports', 'view'), AccountController.getFinancialReports);

// Bulk CSV Data Import
const importRoutes = require('./importRoutes');
router.use('/import', importRoutes);

module.exports = router;
