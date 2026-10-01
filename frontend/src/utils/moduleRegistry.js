// frontend/src/utils/moduleRegistry.js
/**
 * ServeFlow Hierarchical Module Registry (Frontend)
 *
 * Defines the canonical Parent and Child Module hierarchy:
 * 1. Operations (Orders, KOT, POS, Tables, Serving)
 * 2. Inventory (Stock, Ingredients, Recipes, Purchase Orders, Suppliers, Stock Ledger)
 * 3. Accounts (Dashboard, Sales, Purchase, Expenses, Receivables, Payables, Cash & Bank, Ledger, Journal Entries, Reconciliation, GST / Tax, Reports)
 * 4. Administration (Users, Roles, Permissions, Branches, Settings, Subscription)
 */

export const STANDARD_ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'approve', label: 'Approve' },
  { key: 'export', label: 'Export' }
];

export const HIERARCHICAL_MODULES = [
  {
    id: 'operations',
    name: 'Operations',
    description: 'Front-of-house table seating, orders billing, and kitchen order dispatching',
    icon: 'UtensilsCrossed',
    children: [
      {
        id: 'orders',
        name: 'Orders',
        route: '/orders',
        icon: 'ShoppingBag',
        description: 'Customer dining & takeaway order pipeline',
        actions: ['view', 'create', 'edit', 'delete', 'export']
      },
      {
        id: 'kot',
        name: 'KOT (Kitchen)',
        route: '/kot',
        icon: 'ChefHat',
        description: 'Kitchen Display System (KDS) & order preparation status',
        actions: ['view', 'create', 'edit', 'approve']
      },
      {
        id: 'pos',
        name: 'Point of Sale (POS)',
        route: '/pos',
        icon: 'Flame',
        description: 'Front counter billing terminal & rapid checkout',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'tables',
        name: 'Tables & Floor Layout',
        route: '/tables',
        icon: 'Grid',
        description: 'Dining room tables, floor management & guest seating',
        actions: ['view', 'create', 'edit', 'delete']
      },
      {
        id: 'serving',
        name: 'Serving & Dispatch',
        route: '/orders?tab=serving',
        icon: 'CheckCircle2',
        description: 'Food runner & table dispatch tracking',
        actions: ['view', 'edit', 'approve']
      }
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Raw materials, stock management, recipes, and procurement orders',
    icon: 'Boxes',
    children: [
      {
        id: 'stock',
        alias: 'inventory',
        name: 'Stock & Items',
        route: '/inventory',
        icon: 'Boxes',
        description: 'Current on-hand warehouse stock & minimum alerts',
        actions: ['view', 'create', 'edit', 'delete', 'export']
      },
      {
        id: 'ingredients',
        name: 'Ingredients & Raw Materials',
        route: '/inventory?tab=items',
        icon: 'Boxes',
        description: 'Ingredients master list with units of measure',
        actions: ['view', 'create', 'edit', 'delete']
      },
      {
        id: 'recipes',
        name: 'Recipes (BOM)',
        route: '/recipes',
        icon: 'CookingPot',
        description: 'Bill of materials (BOM), portion costing & margins',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'purchases',
        name: 'Purchase Orders',
        route: '/purchases',
        icon: 'Truck',
        description: 'Supplier POs, goods receipt notes & vendor bills',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'suppliers',
        name: 'Suppliers & Vendors',
        route: '/suppliers',
        icon: 'Building2',
        description: 'Vendor contact directory and payment terms',
        actions: ['view', 'create', 'edit', 'delete', 'export']
      },
      {
        id: 'stock_ledger',
        name: 'Stock Ledger & Movements',
        route: '/inventory?tab=movements',
        icon: 'ReceiptText',
        description: 'Wastage logs, inward transfers & stock audit movements',
        actions: ['view', 'create', 'export']
      }
    ]
  },
  {
    id: 'accounts',
    name: 'Accounts',
    description: 'Financial accounting, sales register, ledger, journal entries & tax compliance',
    icon: 'ReceiptText',
    children: [
      {
        id: 'accounts_dashboard',
        name: 'Dashboard',
        route: '/accounts',
        icon: 'LayoutDashboard',
        description: 'Financial executive dashboard and liquidity metrics',
        actions: ['view', 'export']
      },
      {
        id: 'sales',
        name: 'Sales',
        route: '/accounts/sales',
        icon: 'ShoppingBag',
        description: 'Sales invoices register, daily revenues & receipts',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'purchase',
        name: 'Purchase',
        route: '/accounts/purchase',
        icon: 'Truck',
        description: 'Accounts payable invoices & vendor purchase bills',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'expenses',
        alias: 'expenses',
        name: 'Expenses',
        route: '/accounts/expenses',
        icon: 'CreditCard',
        description: 'Operating expenses, petty cash, utilities and rent',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'receivables',
        name: 'Receivables',
        route: '/accounts/receivables',
        icon: 'CreditCard',
        description: 'Customer credit ledger and outstanding receivables',
        actions: ['view', 'create', 'edit', 'export']
      },
      {
        id: 'payables',
        name: 'Payables',
        route: '/accounts/payables',
        icon: 'Building2',
        description: 'Vendor bills aging & pending vendor payouts',
        actions: ['view', 'create', 'edit', 'approve', 'export']
      },
      {
        id: 'cash_bank',
        name: 'Cash & Bank',
        route: '/accounts/cash-bank',
        icon: 'Landmark',
        description: 'Cash drawer balances, bank accounts & UPI settlements',
        actions: ['view', 'create', 'edit', 'export']
      },
      {
        id: 'ledger',
        name: 'Ledger',
        route: '/accounts/ledger',
        icon: 'BookOpen',
        description: 'General ledger account books and running balances',
        actions: ['view', 'export']
      },
      {
        id: 'journal_entries',
        alias: 'journal',
        name: 'Journal Entries',
        route: '/accounts/journal',
        icon: 'ReceiptText',
        description: 'Double-entry debit/credit adjustments and provisions',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'reconciliation',
        name: 'Reconciliation',
        route: '/accounts/reconciliation',
        icon: 'CheckCircle2',
        description: 'Bank statements & POS payment gateway reconciliation',
        actions: ['view', 'create', 'edit', 'approve', 'export']
      },
      {
        id: 'gst_tax',
        alias: 'tax',
        name: 'GST / Tax',
        route: '/accounts/tax',
        icon: 'ShieldCheck',
        description: 'GST GSTR-1 / GSTR-3B audit reports & tax summary',
        actions: ['view', 'export']
      },
      {
        id: 'reports',
        alias: 'reports',
        name: 'Reports',
        route: '/accounts/reports',
        icon: 'BarChart3',
        description: 'Profit & Loss (P&L), Balance Sheet & Cash Flow reports',
        actions: ['view', 'export']
      }
    ]
  },
  {
    id: 'administration',
    name: 'Administration',
    description: 'Enterprise governance, user accounts, RBAC matrix, and branch configuration',
    icon: 'Settings',
    children: [
      {
        id: 'users',
        alias: 'erpUsers',
        name: 'Users',
        route: '/erp/users',
        icon: 'Users',
        description: 'Staff profiles, security credentials and user overrides',
        actions: ['view', 'create', 'edit', 'delete', 'export']
      },
      {
        id: 'roles',
        name: 'Roles',
        route: '/roles',
        icon: 'Layers',
        description: 'Enterprise role templates & granular permissions matrix',
        actions: ['view', 'create', 'edit', 'delete']
      },
      {
        id: 'permissions',
        name: 'Permissions',
        route: '/roles',
        icon: 'ShieldCheck',
        description: 'Security rules and action enforcement controls',
        actions: ['view', 'edit']
      },
      {
        id: 'branches',
        name: 'Branches',
        route: '/branches',
        icon: 'Building2',
        description: 'Multi-branch restaurant outlets and geo-zones',
        actions: ['view', 'create', 'edit', 'delete']
      },
      {
        id: 'settings',
        name: 'Settings',
        route: '/settings',
        icon: 'Settings',
        description: 'Store taxes, bill printers and platform parameters',
        actions: ['view', 'edit']
      },
      {
        id: 'subscription',
        name: 'Subscription & Limits',
        route: '/subscription',
        icon: 'CreditCard',
        description: 'SaaS plan tiers, licenses and billing usage',
        actions: ['view', 'edit']
      }
    ]
  }
];

// Flat maps for fast lookup
export const CHILD_TO_PARENT_MAP = {};
export const MODULE_BY_ID = {};

HIERARCHICAL_MODULES.forEach(parent => {
  parent.children.forEach(child => {
    CHILD_TO_PARENT_MAP[child.id] = parent.id;
    if (child.alias) CHILD_TO_PARENT_MAP[child.alias] = parent.id;
    MODULE_BY_ID[child.id] = { ...child, parentId: parent.id, parentName: parent.name };
    if (child.alias) MODULE_BY_ID[child.alias] = { ...child, parentId: parent.id, parentName: parent.name };
  });
});

/**
 * Checks if user has permission to view a parent module
 * (Must have access to at least ONE child module)
 */
export function canViewParentModule(parentModuleId, allowedModules = []) {
  if (!Array.isArray(allowedModules)) return false;
  const parent = HIERARCHICAL_MODULES.find(p => p.id === parentModuleId);
  if (!parent) return false;
  return parent.children.some(child => {
    return allowedModules.includes(child.id) || (child.alias && allowedModules.includes(child.alias));
  });
}

/**
 * Returns list of child modules authorized for the user under a given parent
 */
export function getAuthorizedChildModules(parentModuleId, allowedModules = []) {
  if (!Array.isArray(allowedModules)) return [];
  const parent = HIERARCHICAL_MODULES.find(p => p.id === parentModuleId);
  if (!parent) return [];
  return parent.children.filter(child => {
    return allowedModules.includes(child.id) || (child.alias && allowedModules.includes(child.alias));
  });
}
