// backend/src/config/moduleRegistry.js
/**
 * ServeFlow Hierarchical Module Registry
 *
 * Defines the standard Parent Modules and Child Modules, default routes,
 * display icons/labels, and granular action permissions:
 * - View
 * - Create
 * - Edit
 * - Delete
 * - Approve
 * - Export
 *
 * Parent modules are dynamically shown in navigation ONLY if the authenticated user
 * has access to at least ONE child module under that parent.
 */

const STANDARD_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

const HIERARCHICAL_MODULES = [
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
        defaultActions: ['view', 'create', 'edit', 'cancel', 'refund']
      },
      {
        id: 'kot',
        name: 'KOT (Kitchen)',
        route: '/kot',
        icon: 'ChefHat',
        description: 'Kitchen Display System (KDS) & order preparation status',
        defaultActions: ['view', 'create', 'edit', 'complete']
      },
      {
        id: 'pos',
        name: 'Point of Sale (POS)',
        route: '/pos',
        icon: 'Flame',
        description: 'Front counter billing terminal & rapid checkout',
        defaultActions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'tables',
        name: 'Tables & Floor Layout',
        route: '/tables',
        icon: 'Grid',
        description: 'Dining room tables, floor management & guest seating',
        defaultActions: ['view', 'create', 'edit', 'delete']
      },
      {
        id: 'serving',
        name: 'Serving & Dispatch',
        route: '/orders?tab=serving',
        icon: 'CheckCircle2',
        description: 'Food runner & table dispatch tracking',
        defaultActions: ['view', 'edit', 'approve']
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
        name: 'Stock & Items',
        route: '/inventory',
        alias: 'inventory',
        icon: 'Boxes',
        description: 'Current on-hand warehouse stock & minimum alerts',
        defaultActions: ['view', 'create', 'edit', 'delete', 'export']
      },
      {
        id: 'ingredients',
        name: 'Ingredients & Raw Materials',
        route: '/inventory?tab=items',
        icon: 'Boxes',
        description: 'Ingredients master list with units of measure',
        defaultActions: ['view', 'create', 'edit', 'delete']
      },
      {
        id: 'recipes',
        name: 'Recipes (BOM)',
        route: '/recipes',
        icon: 'CookingPot',
        description: 'Bill of materials (BOM), portion costing & margins',
        defaultActions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'purchases',
        name: 'Purchase Orders',
        route: '/purchases',
        icon: 'Truck',
        description: 'Supplier POs, goods receipt notes & vendor bills',
        defaultActions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'suppliers',
        name: 'Suppliers & Vendors',
        route: '/suppliers',
        icon: 'Building2',
        description: 'Vendor contact directory and payment terms',
        defaultActions: ['view', 'create', 'edit', 'delete', 'export']
      },
      {
        id: 'stock_ledger',
        name: 'Stock Ledger & Movements',
        route: '/inventory?tab=movements',
        icon: 'ReceiptText',
        description: 'Wastage logs, inward transfers & stock audit movements',
        defaultActions: ['view', 'create', 'export']
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
        defaultActions: ['view', 'export']
      },
      {
        id: 'sales',
        name: 'Sales',
        route: '/accounts/sales',
        icon: 'ShoppingBag',
        description: 'Sales invoices register, daily revenues & receipts',
        defaultActions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'purchase',
        name: 'Purchase',
        route: '/accounts/purchase',
        icon: 'Truck',
        description: 'Accounts payable invoices & vendor purchase bills',
        defaultActions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'expenses',
        name: 'Expenses',
        route: '/accounts/expenses',
        alias: 'expenses',
        icon: 'CreditCard',
        description: 'Operating expenses, petty cash, utilities and rent',
        defaultActions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'receivables',
        name: 'Receivables',
        route: '/accounts/receivables',
        icon: 'CreditCard',
        description: 'Customer credit ledger and outstanding receivables',
        defaultActions: ['view', 'create', 'edit', 'export']
      },
      {
        id: 'payables',
        name: 'Payables',
        route: '/accounts/payables',
        icon: 'Building2',
        description: 'Vendor bills aging & pending vendor payouts',
        defaultActions: ['view', 'create', 'edit', 'approve', 'export']
      },
      {
        id: 'cash_bank',
        name: 'Cash & Bank',
        route: '/accounts/cash-bank',
        icon: 'Landmark',
        description: 'Cash drawer balances, bank accounts & UPI settlements',
        defaultActions: ['view', 'create', 'edit', 'export']
      },
      {
        id: 'ledger',
        name: 'Ledger',
        route: '/accounts/ledger',
        icon: 'BookOpen',
        description: 'General ledger account books and running balances',
        defaultActions: ['view', 'export']
      },
      {
        id: 'journal_entries',
        name: 'Journal Entries',
        route: '/accounts/journal',
        alias: 'journal',
        icon: 'ReceiptText',
        description: 'Double-entry debit/credit adjustments and provisions',
        defaultActions: ['view', 'create', 'edit', 'delete', 'approve', 'export']
      },
      {
        id: 'reconciliation',
        name: 'Reconciliation',
        route: '/accounts/reconciliation',
        icon: 'CheckCircle2',
        description: 'Bank statements & POS payment gateway reconciliation',
        defaultActions: ['view', 'create', 'edit', 'approve', 'export']
      },
      {
        id: 'gst_tax',
        name: 'GST / Tax',
        route: '/accounts/tax',
        alias: 'tax',
        icon: 'ShieldCheck',
        description: 'GST GSTR-1 / GSTR-3B audit reports & tax summary',
        defaultActions: ['view', 'export']
      },
      {
        id: 'reports',
        name: 'Reports',
        route: '/accounts/reports',
        alias: 'reports',
        icon: 'BarChart3',
        description: 'Profit & Loss (P&L), Balance Sheet & Cash Flow reports',
        defaultActions: ['view', 'export']
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
        name: 'Users',
        route: '/erp/users',
        alias: 'erpUsers',
        icon: 'Users',
        description: 'Staff profiles, security credentials and user overrides',
        defaultActions: ['view', 'create', 'edit', 'delete', 'export']
      },
      {
        id: 'roles',
        name: 'Roles',
        route: '/roles',
        icon: 'Layers',
        description: 'Enterprise role templates & granular permissions matrix',
        defaultActions: ['view', 'create', 'edit', 'delete']
      },
      {
        id: 'permissions',
        name: 'Permissions',
        route: '/roles',
        icon: 'ShieldCheck',
        description: 'Security rules and action enforcement controls',
        defaultActions: ['view', 'edit']
      },
      {
        id: 'branches',
        name: 'Branches',
        route: '/branches',
        icon: 'Building2',
        description: 'Multi-branch restaurant outlets and geo-zones',
        defaultActions: ['view', 'create', 'edit', 'delete']
      },
      {
        id: 'settings',
        name: 'Settings',
        route: '/settings',
        icon: 'Settings',
        description: 'Store taxes, bill printers and platform parameters',
        defaultActions: ['view', 'edit']
      },
      {
        id: 'subscription',
        name: 'Subscription & Limits',
        route: '/subscription',
        icon: 'CreditCard',
        description: 'SaaS plan tiers, licenses and billing usage',
        defaultActions: ['view', 'edit']
      }
    ]
  }
];

// Flat lookup helpers
const ALL_CHILD_MODULES = [];
const CHILD_TO_PARENT_MAP = {};
const MODULE_ACTION_MAP = {};

HIERARCHICAL_MODULES.forEach(parent => {
  parent.children.forEach(child => {
    ALL_CHILD_MODULES.push({
      ...child,
      parentId: parent.id,
      parentName: parent.name
    });
    CHILD_TO_PARENT_MAP[child.id] = parent.id;
    if (child.alias) {
      CHILD_TO_PARENT_MAP[child.alias] = parent.id;
    }
    MODULE_ACTION_MAP[child.id] = child.defaultActions || STANDARD_ACTIONS;
    if (child.alias) {
      MODULE_ACTION_MAP[child.alias] = child.defaultActions || STANDARD_ACTIONS;
    }
  });
});

/**
 * Resolves a given child module ID to its parent module ID
 */
function getParentModuleId(childModuleId) {
  if (CHILD_TO_PARENT_MAP[childModuleId]) return CHILD_TO_PARENT_MAP[childModuleId];
  // Check direct matches
  for (const parent of HIERARCHICAL_MODULES) {
    if (parent.id === childModuleId) return parent.id;
    if (parent.children.some(c => c.id === childModuleId || c.alias === childModuleId)) {
      return parent.id;
    }
  }
  return null;
}

/**
 * Validates whether a user with given allowed_modules has access to a parent module
 */
function hasParentModuleAccess(parentModuleId, allowedModules = []) {
  if (!Array.isArray(allowedModules)) return false;
  const parent = HIERARCHICAL_MODULES.find(p => p.id === parentModuleId);
  if (!parent) return false;

  return parent.children.some(child => {
    return allowedModules.includes(child.id) || (child.alias && allowedModules.includes(child.alias));
  });
}

/**
 * Computes the authorized child modules for a given parent module and user
 */
function getAuthorizedChildren(parentModuleId, allowedModules = []) {
  if (!Array.isArray(allowedModules)) return [];
  const parent = HIERARCHICAL_MODULES.find(p => p.id === parentModuleId);
  if (!parent) return [];

  return parent.children.filter(child => {
    return allowedModules.includes(child.id) || (child.alias && allowedModules.includes(child.alias));
  });
}

module.exports = {
  STANDARD_ACTIONS,
  HIERARCHICAL_MODULES,
  ALL_CHILD_MODULES,
  CHILD_TO_PARENT_MAP,
  MODULE_ACTION_MAP,
  getParentModuleId,
  hasParentModuleAccess,
  getAuthorizedChildren
};
