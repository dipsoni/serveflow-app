// erpSeedData.js - Multi-Company, Multi-Branch & Granular RBAC definitions
const bcrypt = require('bcryptjs');

const COMPANY_ABC = 'comp-abc-foods';
const COMPANY_URBAN = 'comp-urban-spice';

const BRANCH_BOPAL = 'branch-bopal';
const BRANCH_SATELLITE = 'branch-satellite';
const BRANCH_SG_HIGHWAY = 'branch-sg-highway';

// 1. GRANULAR PERMISSION TREE (RBAC DEFINITIONS)
const PERMISSION_GROUPS = {
  DASHBOARD: {
    category: 'Dashboard',
    permissions: [
      { key: 'dashboard.view', label: 'View Dashboard Analytics' },
      { key: 'dashboard.view_all_branches', label: 'View Consolidated All Branches' }
    ]
  },
  POS: {
    category: 'Point of Sale (POS)',
    permissions: [
      { key: 'pos.view', label: 'View POS Terminal' },
      { key: 'pos.create_order', label: 'Create New POS Orders' },
      { key: 'pos.edit_order', label: 'Edit Running Orders' },
      { key: 'pos.cancel_order', label: 'Void / Cancel Orders' },
      { key: 'pos.apply_discount', label: 'Apply Manual Discounts / Offers' },
      { key: 'pos.process_payment', label: 'Settle / Process Payments' },
      { key: 'pos.print_invoice', label: 'Reprint Receipts & Tax Invoices' }
    ]
  },
  ORDERS: {
    category: 'Order Management',
    permissions: [
      { key: 'orders.view', label: 'View Orders List' },
      { key: 'orders.create', label: 'Create Online / Phone Orders' },
      { key: 'orders.edit', label: 'Modify Order Line Items' },
      { key: 'orders.cancel', label: 'Cancel Placed Orders' },
      { key: 'orders.refund', label: 'Authorize Customer Refunds' }
    ]
  },
  KOT: {
    category: 'Kitchen Order Tickets (KOT)',
    permissions: [
      { key: 'kot.view', label: 'View Kitchen Display (KDS)' },
      { key: 'kot.create', label: 'Dispatch Order to Kitchen' },
      { key: 'kot.update', label: 'Update Dish Prep Status' },
      { key: 'kot.complete', label: 'Mark Food Ready for Service' }
    ]
  },
  TABLES: {
    category: 'Floor & Table Layout',
    permissions: [
      { key: 'tables.view', label: 'View Dining Room Plan' },
      { key: 'tables.create', label: 'Add Dining Tables' },
      { key: 'tables.edit', label: 'Update Layout & Merge Tables' },
      { key: 'tables.delete', label: 'Remove Tables' }
    ]
  },
  MENU: {
    category: 'Menu & Recipes',
    permissions: [
      { key: 'menu.view', label: 'View Menu Items & Categories' },
      { key: 'menu.create', label: 'Add New Menu Items' },
      { key: 'menu.edit', label: 'Edit Prices & Modifiers' },
      { key: 'menu.delete', label: 'Delete Menu Dishes' },
      { key: 'menu.change_availability', label: 'Toggle 86 / Out of Stock' }
    ]
  },
  INVENTORY: {
    category: 'Raw Material & Stock',
    permissions: [
      { key: 'inventory.view', label: 'View Stock Balance' },
      { key: 'inventory.add_stock', label: 'Inward New Stock' },
      { key: 'inventory.adjust_stock', label: 'Stock Audit Adjustments' },
      { key: 'inventory.view_movements', label: 'Audit Wastage & Consumption' }
    ]
  },
  PURCHASES: {
    category: 'Purchases & Procurement',
    permissions: [
      { key: 'purchases.view', label: 'View Purchase Invoices' },
      { key: 'purchases.create', label: 'Create Purchase Orders' },
      { key: 'purchases.edit', label: 'Modify Received Purchases' },
      { key: 'purchases.delete', label: 'Delete Invoices' }
    ]
  },
  EXPENSES: {
    category: 'Operating Expenses',
    permissions: [
      { key: 'expenses.view', label: 'View Expense Records' },
      { key: 'expenses.create', label: 'Record Petty Cash & Bills' },
      { key: 'expenses.edit', label: 'Edit Expense Categories' },
      { key: 'expenses.delete', label: 'Delete Expense Entries' }
    ]
  },
  REPORTS: {
    category: 'Business Analytics & Reports',
    permissions: [
      { key: 'reports.view', label: 'View Sales & Operational Reports' },
      { key: 'reports.export', label: 'Export Reports to Excel / CSV' },
      { key: 'reports.view_financial', label: 'View P&L, Tax & Margins' }
    ]
  },
  SYSTEM: {
    category: 'ERP System Administration',
    permissions: [
      { key: 'settings.view', label: 'View Company Configuration' },
      { key: 'settings.edit', label: 'Update GST & POS Printing Rules' },
      { key: 'users.manage', label: 'Manage Staff & Security Profiles' },
      { key: 'roles.manage', label: 'Edit Granular Permissions Matrix' },
      { key: 'branches.manage', label: 'Create & Restrict Branches' }
    ]
  }
};

// Flattened list of all permission strings
const ALL_PERMISSIONS_LIST = Object.values(PERMISSION_GROUPS).flatMap(g => g.permissions.map(p => p.key));

// 2. ALLOWED MODULES MATRIX (Standard Module Keys)
const MODULE_PROFILES = [
  { id: 'pos', name: 'POS / Billing', domain: 'Front of House', permissions: ['pos.view', 'pos.create_order', 'pos.edit_order', 'pos.cancel_order', 'pos.apply_discount', 'pos.process_payment', 'pos.print_invoice'] },
  { id: 'orders', name: 'Orders Management', domain: 'Front of House', permissions: ['orders.view', 'orders.create', 'orders.edit', 'orders.cancel', 'orders.refund'] },
  { id: 'kot', name: 'Kitchen KOT (KDS)', domain: 'Kitchen Operations', permissions: ['kot.view', 'kot.create', 'kot.update', 'kot.complete'] },
  { id: 'tables', name: 'Tables & Floor Layout', domain: 'Restaurant Floor', permissions: ['tables.view', 'tables.create', 'tables.edit', 'tables.delete'] },
  { id: 'menu', name: 'Menu & Catalog', domain: 'Restaurant Floor', permissions: ['menu.view', 'menu.create', 'menu.edit', 'menu.delete', 'menu.change_availability'] },
  { id: 'inventory', name: 'Inventory & Stock', domain: 'Supply Chain', permissions: ['inventory.view', 'inventory.add_stock', 'inventory.adjust_stock', 'inventory.view_movements'] },
  { id: 'purchases', name: 'Purchases & Procurement', domain: 'Supply Chain', permissions: ['purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete'] },
  { id: 'suppliers', name: 'Suppliers & Vendors', domain: 'Supply Chain', permissions: ['purchases.view', 'purchases.create', 'purchases.edit'] },
  { id: 'customers', name: 'Customers & CRM', domain: 'Customer Growth', permissions: ['pos.view', 'orders.view', 'reports.view'] },
  { id: 'expenses', name: 'Operating Expenses', domain: 'Finance & Accounts', permissions: ['expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete'] },
  { id: 'reports', name: 'Reports & Analytics', domain: 'Finance & Accounts', permissions: ['reports.view', 'reports.export', 'reports.view_financial'] },
  { id: 'dashboard', name: 'Dashboard Analytics', domain: 'Executive & HQ', permissions: ['dashboard.view', 'dashboard.view_all_branches'] },
  { id: 'branches', name: 'Multi-Branch Outlets', domain: 'Executive & HQ', permissions: ['branches.manage', 'dashboard.view'] },
  { id: 'employees', name: 'Employees & Staff', domain: 'Administration & HR', permissions: ['users.manage'] },
  { id: 'roles', name: 'Roles & RBAC', domain: 'Security & Governance', permissions: ['roles.manage', 'users.manage'] },
  { id: 'erpUsers', name: 'Users & Permissions Matrix', domain: 'Security & Governance', permissions: ['users.manage', 'roles.manage'] },
  { id: 'subscription', name: 'Billing & SaaS Limits', domain: 'Administration & HR', permissions: ['settings.view'] },
  { id: 'settings', name: 'Store Settings & Tax', domain: 'Administration & HR', permissions: ['settings.view', 'settings.edit'] },
  { id: 'onboarding', name: 'Onboarding Wizard', domain: 'Administration & HR', permissions: ['settings.view'] },
  { id: 'support', name: 'Helpdesk & Support', domain: 'Support & Helpdesk', permissions: ['dashboard.view'] }
];

// 3. ENTERPRISE ROLES MATRIX (3-Column Dense Alphabetical Grid)
const ENTERPRISE_ROLES = [
  // Column 1
  {
    id: 'role-academics',
    company_id: COMPANY_ABC,
    name: 'Academics User',
    column: 1,
    description: 'Trainees and hospitality institute interns with read-only training access.',
    permissions: ['dashboard.view', 'reports.view']
  },
  {
    id: 'role-accounts-mgr',
    company_id: COMPANY_ABC,
    name: 'Accounts Manager',
    column: 1,
    description: 'Financial ledger, reconciliations, expense auditing and GST compliance.',
    permissions: ['dashboard.view', 'reports.view', 'reports.view_financial', 'reports.export', 'expenses.view', 'expenses.create', 'expenses.edit', 'purchases.view']
  },
  {
    id: 'role-area-sales-mgr',
    company_id: COMPANY_ABC,
    name: 'Area Sales Manager',
    column: 1,
    description: 'Multi-branch oversight, daily targets, and regional restaurant throughput.',
    permissions: ['dashboard.view', 'dashboard.view_all_branches', 'pos.view', 'orders.view', 'reports.view', 'reports.export', 'tables.view', 'inventory.view', 'purchases.view']
  },
  {
    id: 'role-attendance',
    company_id: COMPANY_ABC,
    name: 'Attendance',
    column: 1,
    description: 'Biometric timekeeper and employee shift registry logger.',
    permissions: ['dashboard.view']
  },
  {
    id: 'role-auditor',
    company_id: COMPANY_ABC,
    name: 'Auditor',
    column: 1,
    description: 'External compliance auditor reviewing sales, stocks, and tax logs.',
    permissions: ['dashboard.view', 'dashboard.view_all_branches', 'reports.view', 'reports.view_financial', 'reports.export', 'inventory.view', 'inventory.view_movements', 'purchases.view', 'expenses.view']
  },
  {
    id: 'role-cashier',
    company_id: COMPANY_ABC,
    name: 'Cashier',
    column: 1,
    description: 'Front-counter billing, order collection, bill splitting, and thermal receipt printing.',
    permissions: ['dashboard.view', 'pos.view', 'pos.create_order', 'pos.process_payment', 'pos.print_invoice', 'pos.apply_discount', 'orders.view', 'orders.create', 'tables.view']
  },
  {
    id: 'role-cloud-kitchen-head',
    company_id: COMPANY_ABC,
    name: 'Cloud Kitchen Head',
    column: 1,
    description: 'Delivery-only brand manager controlling aggregators, dispatch, and menu 86-ing.',
    permissions: ['dashboard.view', 'kot.view', 'kot.create', 'kot.update', 'kot.complete', 'inventory.view', 'inventory.add_stock', 'menu.view', 'menu.change_availability', 'orders.view']
  },

  // Column 2
  {
    id: 'role-floor-captain',
    company_id: COMPANY_ABC,
    name: 'Floor Captain',
    column: 2,
    description: 'Floor head handling guest seating, order punches, and table transfers.',
    permissions: ['dashboard.view', 'pos.view', 'pos.create_order', 'orders.view', 'orders.create', 'orders.edit', 'tables.view', 'tables.create', 'tables.edit', 'kot.view']
  },
  {
    id: 'role-inventory-mgr',
    company_id: COMPANY_ABC,
    name: 'Inventory Manager',
    column: 2,
    description: 'Warehouse supervisor managing raw material inward, GRN, and wastage logs.',
    permissions: ['dashboard.view', 'inventory.view', 'inventory.add_stock', 'inventory.adjust_stock', 'inventory.view_movements', 'purchases.view', 'purchases.create', 'purchases.edit']
  },
  {
    id: 'role-kitchen-staff',
    company_id: COMPANY_ABC,
    name: 'Kitchen Staff',
    column: 2,
    description: 'Line chefs and line cooks interacting with live Kitchen Display System (KDS).',
    permissions: ['kot.view', 'kot.update', 'kot.complete', 'inventory.view']
  },
  {
    id: 'role-maintenance',
    company_id: COMPANY_ABC,
    name: 'Maintenance User',
    column: 2,
    description: 'Facility repair engineer logging machinery maintenance and equipment costs.',
    permissions: ['dashboard.view', 'expenses.create', 'expenses.view']
  },
  {
    id: 'role-regional-mgr',
    company_id: COMPANY_ABC,
    name: 'Regional Manager',
    column: 2,
    description: 'Senior state head with multi-branch management and operational authority.',
    permissions: ['dashboard.view', 'dashboard.view_all_branches', 'reports.view', 'reports.export', 'reports.view_financial', 'users.manage', 'branches.manage', 'inventory.view', 'pos.view', 'orders.view']
  },
  {
    id: 'role-purchase-mgr',
    company_id: COMPANY_ABC,
    name: 'Purchase Manager',
    column: 2,
    description: 'Procurement specialist issuing POs to meat, vegetable, and dairy suppliers.',
    permissions: ['dashboard.view', 'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete', 'inventory.view', 'inventory.add_stock']
  },
  {
    id: 'role-gen-manager',
    company_id: COMPANY_ABC,
    name: 'Restaurant General Manager',
    column: 2,
    description: 'Store general manager supervising floor, kitchen, inventory, and staff.',
    permissions: [
      'dashboard.view', 'dashboard.view_all_branches', 'pos.view', 'pos.create_order', 'pos.edit_order',
      'pos.cancel_order', 'pos.apply_discount', 'pos.process_payment', 'pos.print_invoice',
      'orders.view', 'orders.create', 'orders.edit', 'orders.cancel', 'orders.refund',
      'kot.view', 'kot.create', 'kot.update', 'kot.complete',
      'tables.view', 'tables.create', 'tables.edit', 'tables.delete',
      'menu.view', 'menu.create', 'menu.edit', 'menu.change_availability',
      'inventory.view', 'inventory.add_stock', 'inventory.adjust_stock', 'inventory.view_movements',
      'purchases.view', 'purchases.create', 'purchases.edit',
      'expenses.view', 'expenses.create', 'expenses.edit',
      'reports.view', 'reports.export', 'reports.view_financial'
    ]
  },

  // Column 3
  {
    id: 'role-report-viewer',
    company_id: COMPANY_ABC,
    name: 'Report Viewer',
    column: 3,
    description: 'Stakeholder with view-only rights to daily sales and product mix analytics.',
    permissions: ['dashboard.view', 'reports.view']
  },
  {
    id: 'role-sales-head',
    company_id: COMPANY_ABC,
    name: 'Sales Head',
    column: 3,
    description: 'VP of Sales tracking top sellers, catering bookings, and corporate tie-ups.',
    permissions: ['dashboard.view', 'dashboard.view_all_branches', 'reports.view', 'reports.export', 'orders.view', 'pos.view']
  },
  {
    id: 'role-store-mgr',
    company_id: COMPANY_ABC,
    name: 'Store Manager',
    column: 3,
    description: 'Day-to-day branch manager executing billing, table shifts, and discounts.',
    permissions: [
      'dashboard.view', 'pos.view', 'pos.create_order', 'pos.edit_order', 'pos.cancel_order',
      'pos.apply_discount', 'pos.process_payment', 'pos.print_invoice',
      'orders.view', 'orders.create', 'orders.edit', 'orders.cancel',
      'kot.view', 'tables.view', 'tables.create', 'tables.edit',
      'menu.view', 'menu.change_availability',
      'inventory.view', 'inventory.adjust_stock',
      'purchases.view', 'expenses.view', 'reports.view'
    ]
  },
  {
    id: 'role-sysadmin',
    company_id: COMPANY_ABC,
    name: 'System Administrator',
    column: 3,
    description: 'Super administrator with unrestricted global enterprise access.',
    permissions: ALL_PERMISSIONS_LIST
  },
  {
    id: 'role-waitstaff',
    company_id: COMPANY_ABC,
    name: 'Waitstaff',
    column: 3,
    description: 'Dine-in servers taking tableside tablet orders and printing draft bills.',
    permissions: ['pos.view', 'pos.create_order', 'tables.view', 'orders.view']
  },
  {
    id: 'role-delivery-coord',
    company_id: COMPANY_ABC,
    name: 'Delivery Coordinator',
    column: 3,
    description: 'Rider dispatch manager assigning orders to Zomato, Swiggy, and in-house fleet.',
    permissions: ['dashboard.view', 'orders.view', 'orders.edit', 'pos.view']
  },
  {
    id: 'role-quality-auditor',
    company_id: COMPANY_ABC,
    name: 'Quality Auditor',
    column: 3,
    description: 'Food safety and hygiene auditor reviewing kitchen hygiene and storage temps.',
    permissions: ['dashboard.view', 'kot.view', 'inventory.view', 'reports.view']
  }
];

// 4. COMPANIES
const COMPANIES = [
  {
    id: COMPANY_ABC,
    name: 'ABC Foods Pvt Ltd',
    tax_identifier: '24AAACA1234F1Z8',
    currency: '₹',
    hq_city: 'Ahmedabad, Gujarat',
    created_at: '2025-01-10T10:00:00Z'
  },
  {
    id: COMPANY_URBAN,
    name: 'Urban Spice Foods Group',
    tax_identifier: '29ABCDE1234F1Z5',
    currency: '₹',
    hq_city: 'Bengaluru, Karnataka',
    created_at: '2025-03-15T12:00:00Z'
  }
];

// 5. BRANCHES (Ahmedabad Branches for ABC Foods)
const BRANCHES = [
  {
    id: BRANCH_BOPAL,
    company_id: COMPANY_ABC,
    name: 'Bopal Branch',
    city: 'Ahmedabad',
    address: 'Shop 101-104, Gala Empire, South Bopal, Ahmedabad, Gujarat 380058',
    phone: '+91 98250 11001',
    is_active: true
  },
  {
    id: BRANCH_SATELLITE,
    company_id: COMPANY_ABC,
    name: 'Satellite Branch',
    city: 'Ahmedabad',
    address: 'Block B, Dev Arc Mall, ISKCON Cross Road, Satellite, Ahmedabad, Gujarat 380015',
    phone: '+91 98250 11002',
    is_active: true
  },
  {
    id: BRANCH_SG_HIGHWAY,
    company_id: COMPANY_ABC,
    name: 'SG Highway Branch',
    city: 'Ahmedabad',
    address: 'Titanium City Center, 100 Ft Anand Nagar Rd, SG Highway, Ahmedabad, Gujarat 380051',
    phone: '+91 98250 11003',
    is_active: true
  }
];

// Helper to get initial ERP users
const getInitialERPUsers = () => {
  const hashedPassword = bcrypt.hashSync('password123', 10);

  return [
    {
      id: 'usr-ceo-01',
      company_id: COMPANY_ABC,
      role_id: 'role-sysadmin',
      roles: ['role-sysadmin'],
      name: 'Aditya Vikram',
      username: 'aditya',
      first_name: 'Aditya',
      middle_name: '',
      last_name: 'Vikram',
      full_name: 'Aditya Vikram',
      language: 'English',
      timezone: 'Asia/Kolkata',
      user_category: 'Executive',
      email: 'ceo@abcfoods.com',
      alternate_email: 'owner@serveflow.com',
      phone: '+91 98250 00001',
      password_hash: hashedPassword,
      has_all_branch_access: true, // Reserved for Company Owner / CEO
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      assigned_to: 'Board of Directors',
      tags: ['Executive', 'HQ', 'Signatory', 'Audit Lead'],
      allowed_modules: ['dashboard', 'pos', 'orders', 'kot', 'tables', 'menu', 'inventory', 'purchases', 'suppliers', 'customers', 'employees', 'expenses', 'reports', 'settings', 'branches', 'roles', 'subscription', 'erpUsers', 'onboarding', 'support'],
      attachments: [
        { name: 'Incorporation_Cert_ABC_Foods.pdf', size: '2.4 MB', date: '2025-01-15' },
        { name: 'FSSAI_Central_License_2026.pdf', size: '1.8 MB', date: '2025-02-10' },
        { name: 'Board_Resolution_PowerOfAttorney.pdf', size: '920 KB', date: '2025-02-28' }
      ],
      audit_created: 'Created 8 months ago by Platform SuperAdmin',
      audit_edited: 'Last edited 2 hours ago by Aditya Vikram',
      last_login: new Date(Date.now() - 35 * 60000).toISOString(),
      created_at: new Date(Date.now() - 240 * 86400000).toISOString()
    },
    {
      id: 'usr-area-mgr-01',
      company_id: COMPANY_ABC,
      role_id: 'role-area-sales-mgr',
      roles: ['role-area-sales-mgr'],
      name: 'Priya Sharma',
      username: 'priya',
      first_name: 'Priya',
      middle_name: '',
      last_name: 'Sharma',
      full_name: 'Priya Sharma',
      language: 'English',
      timezone: 'Asia/Kolkata',
      user_category: 'Operations',
      email: 'areamanager@abcfoods.com',
      alternate_email: 'manager@serveflow.com',
      phone: '+91 98250 00002',
      password_hash: hashedPassword,
      has_all_branch_access: false,
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      assigned_to: 'Aditya Vikram',
      tags: ['Area Sales', 'Multi-Branch', 'Operations Lead'],
      allowed_modules: ['dashboard', 'pos', 'orders', 'tables', 'inventory', 'customers', 'expenses', 'reports', 'support'],
      attachments: [
        { name: 'Employment_Agreement_PriyaSharma.pdf', size: '840 KB', date: '2025-03-01' },
        { name: 'Regional_Sales_Targets_Q3.xlsx', size: '340 KB', date: '2026-07-01' }
      ],
      audit_created: 'Created 6 months ago by Admin',
      audit_edited: 'Last edited 5 hours ago by Aditya Vikram',
      last_login: new Date(Date.now() - 120 * 60000).toISOString(),
      created_at: new Date(Date.now() - 180 * 86400000).toISOString()
    },
    {
      id: 'usr-cashier-01',
      company_id: COMPANY_ABC,
      role_id: 'role-cashier',
      roles: ['role-cashier'],
      name: 'Rohan Joshi',
      username: 'rohan',
      first_name: 'Rohan',
      middle_name: '',
      last_name: 'Joshi',
      full_name: 'Rohan Joshi',
      language: 'English',
      timezone: 'Asia/Kolkata',
      user_category: 'Staff',
      email: 'cashier.bopal@abcfoods.com',
      alternate_email: 'cashier@serveflow.com',
      phone: '+91 98250 00003',
      password_hash: hashedPassword,
      has_all_branch_access: false,
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      assigned_to: 'Priya Sharma',
      tags: ['Front Desk', 'Bopal Staff', 'POS Specialist'],
      allowed_modules: ['pos', 'orders', 'tables', 'customers'],
      attachments: [
        { name: 'Govt_Identity_Aadhaar_Verified.pdf', size: '420 KB', date: '2025-06-12' },
        { name: 'POS_Handling_Certification.pdf', size: '610 KB', date: '2025-06-15' }
      ],
      audit_created: 'Created 3 months ago by Priya Sharma',
      audit_edited: 'Last edited 1 day ago by Priya Sharma',
      last_login: new Date(Date.now() - 15 * 60000).toISOString(),
      created_at: new Date(Date.now() - 90 * 86400000).toISOString()
    },
    {
      id: 'usr-kitchen-01',
      company_id: COMPANY_ABC,
      role_id: 'role-kitchen-staff',
      roles: ['role-kitchen-staff'],
      name: 'Chef Sanjeev Kumar',
      username: 'sanjeev',
      first_name: 'Sanjeev',
      middle_name: '',
      last_name: 'Kumar',
      full_name: 'Chef Sanjeev Kumar',
      language: 'English',
      timezone: 'Asia/Kolkata',
      user_category: 'Staff',
      email: 'chef.satellite@abcfoods.com',
      alternate_email: 'kitchen@serveflow.com',
      phone: '+91 98250 00004',
      password_hash: hashedPassword,
      has_all_branch_access: false,
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=250&q=80',
      assigned_to: 'Priya Sharma',
      tags: ['Head Chef', 'Satellite Kitchen', 'Culinary Specialist'],
      allowed_modules: ['kot', 'inventory'],
      attachments: [
        { name: 'FSSAI_Food_Safety_Supervisor_Cert.pdf', size: '1.4 MB', date: '2025-05-10' },
        { name: 'Culinary_Health_Fitness_Doc.pdf', size: '510 KB', date: '2025-05-12' }
      ],
      audit_created: 'Created 4 months ago by Priya Sharma',
      audit_edited: 'Last edited 3 days ago by Priya Sharma',
      last_login: new Date(Date.now() - 45 * 60000).toISOString(),
      created_at: new Date(Date.now() - 120 * 86400000).toISOString()
    },
    {
      id: 'usr-mgr-sg-01',
      company_id: COMPANY_ABC,
      role_id: 'role-store-mgr',
      roles: ['role-store-mgr'],
      name: 'Kavita Patel',
      username: 'kavita',
      first_name: 'Kavita',
      middle_name: '',
      last_name: 'Patel',
      full_name: 'Kavita Patel',
      language: 'English',
      timezone: 'Asia/Kolkata',
      user_category: 'Store Manager',
      email: 'manager.sghighway@abcfoods.com',
      phone: '+91 98250 00005',
      password_hash: hashedPassword,
      has_all_branch_access: false,
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
      assigned_to: 'Aditya Vikram',
      tags: ['Store Manager', 'SG Highway', 'Store Operations'],
      allowed_modules: ['dashboard', 'pos', 'orders', 'kot', 'tables', 'menu', 'inventory', 'purchases', 'customers', 'expenses', 'reports', 'support'],
      attachments: [
        { name: 'Store_Manager_Contract_Kavita.pdf', size: '1.1 MB', date: '2025-07-20' }
      ],
      audit_created: 'Created 2 months ago by Aditya Vikram',
      audit_edited: 'Last edited 1 week ago by Aditya Vikram',
      last_login: new Date(Date.now() - 180 * 60000).toISOString(),
      created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      id: 'usr-raj-gupta-01',
      company_id: COMPANY_ABC,
      role_id: 'role-cashier',
      roles: ['role-cashier'],
      name: 'Raj Gupta',
      username: 'raj',
      first_name: 'Raj',
      middle_name: '',
      last_name: 'Gupta',
      full_name: 'Raj Gupta',
      language: 'English',
      timezone: 'Asia/Kolkata',
      user_category: 'Staff',
      email: 'raj.gupta@abcfoods.com',
      alternate_email: 'raj.gupta@globalmanikchand.in',
      phone: '+91 98250 00009',
      password_hash: hashedPassword,
      has_all_branch_access: false,
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      assigned_to: 'Priya Sharma',
      tags: ['Front Desk', 'Satellite Staff', 'Cashier'],
      allowed_modules: ['pos', 'orders', 'tables', 'customers'],
      attachments: [
        { name: 'Raj_Gupta_Photo_Identity.jpg', size: '220 KB', date: '2025-09-10' },
        { name: 'POS_Terminal_Access_Clearance.pdf', size: '380 KB', date: '2025-09-12' }
      ],
      audit_created: 'Created 15 days ago by Priya Sharma',
      audit_edited: 'Last edited 15 hours ago by Raj Gupta',
      last_login: new Date(Date.now() - 900 * 60000).toISOString(),
      created_at: new Date(Date.now() - 15 * 86400000).toISOString()
    }
  ];
};

// 6. USER BRANCH ASSIGNMENTS
const USER_BRANCH_ASSIGNMENTS = [
  // Aditya Vikram (CEO) - Access All Branches (Flagged true, and mapped to all 3)
  { user_id: 'usr-ceo-01', branch_id: BRANCH_BOPAL },
  { user_id: 'usr-ceo-01', branch_id: BRANCH_SATELLITE },
  { user_id: 'usr-ceo-01', branch_id: BRANCH_SG_HIGHWAY },

  // Priya Sharma (Area Sales Manager) - Restricted to Bopal & Satellite
  { user_id: 'usr-area-mgr-01', branch_id: BRANCH_BOPAL },
  { user_id: 'usr-area-mgr-01', branch_id: BRANCH_SATELLITE },

  // Rohan Joshi (Cashier) - Locked to Bopal Branch only
  { user_id: 'usr-cashier-01', branch_id: BRANCH_BOPAL },

  // Chef Sanjeev Kumar (Kitchen) - Locked to Satellite Branch only
  { user_id: 'usr-kitchen-01', branch_id: BRANCH_SATELLITE },

  // Kavita Patel (Store Manager) - Locked to SG Highway Branch only
  { user_id: 'usr-mgr-sg-01', branch_id: BRANCH_SG_HIGHWAY },

  // Raj Gupta (Cashier) - Locked to Satellite Branch
  { user_id: 'usr-raj-gupta-01', branch_id: BRANCH_SATELLITE }
];

// 7. INITIAL AUDIT LOGS
const INITIAL_AUDIT_LOGS = [
  {
    id: 101,
    company_id: COMPANY_ABC,
    branch_id: BRANCH_BOPAL,
    user_id: 'usr-area-mgr-01',
    user_name: 'Priya Sharma',
    action: 'ROLE_UPDATE',
    module: 'User Management',
    details: { message: 'Updated role profile to Area Sales Manager', previous_role: 'Store Manager', updated_by: 'Aditya Vikram' },
    ip_address: '192.168.1.45',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 102,
    company_id: COMPANY_ABC,
    branch_id: null,
    user_id: 'usr-area-mgr-01',
    user_name: 'Priya Sharma',
    action: 'BRANCH_SCOPE_RESTRICTION',
    module: 'Security & Access',
    details: { message: 'Designated branch scope assigned: [Bopal Branch, Satellite Branch]', restricted_by: 'Aditya Vikram' },
    ip_address: '192.168.1.45',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: 103,
    company_id: COMPANY_ABC,
    branch_id: BRANCH_BOPAL,
    user_id: 'usr-cashier-01',
    user_name: 'Rohan Joshi',
    action: 'PERMISSION_GRANT',
    module: 'POS Billing',
    details: { message: 'Granted permission: pos.apply_discount (Cap limit: 15%)', granted_by: 'Priya Sharma' },
    ip_address: '10.0.0.12',
    created_at: new Date(Date.now() - 26 * 3600000).toISOString()
  },
  {
    id: 104,
    company_id: COMPANY_ABC,
    branch_id: BRANCH_SATELLITE,
    user_id: 'usr-kitchen-01',
    user_name: 'Chef Sanjeev Kumar',
    action: 'BRANCH_LOCK_ENFORCED',
    module: 'Scope Isolation',
    details: { message: 'Single-branch lock activated for Satellite Kitchen KDS display', locked_by: 'System' },
    ip_address: '10.0.0.24',
    created_at: new Date(Date.now() - 72 * 3600000).toISOString()
  },
  {
    id: 105,
    company_id: COMPANY_ABC,
    branch_id: BRANCH_BOPAL,
    user_id: 'usr-ceo-01',
    user_name: 'Aditya Vikram',
    action: 'AUTH_LOGIN_SUCCESS',
    module: 'Authentication',
    details: { message: 'Successful hardware token MFA session initialized', device: 'Chrome 128 / Windows NT' },
    ip_address: '14.139.122.9',
    created_at: new Date(Date.now() - 35 * 60000).toISOString()
  }
];

// 8. COLLABORATIVE COMMENTS & ACTIVITY THREAD
const INITIAL_COMMENTS = [
  {
    id: 'comm-101',
    company_id: COMPANY_ABC,
    user_id: 'usr-area-mgr-01',
    author_id: 'usr-ceo-01',
    author_name: 'Aditya Vikram (CEO)',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    content: 'Priya has been granted oversight over both Bopal and Satellite branches to manage the Q4 expansion.',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    id: 'comm-102',
    company_id: COMPANY_ABC,
    user_id: 'usr-area-mgr-01',
    author_id: 'usr-area-mgr-01',
    author_name: 'Priya Sharma (Area Mgr)',
    author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    content: 'Noted sir! I will coordinate directly with Rohan at Bopal and Chef Sanjeev at Satellite for peak weekend inventory.',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString()
  }
];

// 9. SAAS SUBSCRIPTION PLANS (Configurable by Super Admin)
const INITIAL_PLANS = [
  {
    id: 'plan-free',
    name: 'Free Demo / Trial',
    slug: 'free',
    price: 0,
    billing_cycle: 'monthly',
    max_branches: 1,
    max_staff: 3,
    max_orders: 150,
    features: [
      'Single Branch POS',
      'Basic Digital QR Menu',
      'Up to 3 Staff Accounts',
      'Standard Cash & UPI Billing',
      'Daily Sales Overview'
    ],
    badge: 'Free Forever',
    is_active: true
  },
  {
    id: 'plan-starter',
    name: 'Starter Growth',
    slug: 'starter',
    price: 2499,
    billing_cycle: 'monthly',
    max_branches: 2,
    max_staff: 10,
    max_orders: 1500,
    features: [
      'Up to 2 Branches',
      'Interactive QR Ordering with Cart',
      'Kitchen Order Ticket (KOT) Display',
      'Inventory Stock Tracking & Low-Stock Alerts',
      'Up to 10 Staff with Role Permissions',
      'GST Tax Invoice & Thermal Receipt Printing'
    ],
    badge: 'Popular for Cafes',
    is_active: true
  },
  {
    id: 'plan-pro',
    name: 'Pro Multi-Branch',
    slug: 'pro',
    price: 4999,
    billing_cycle: 'monthly',
    max_branches: 5,
    max_staff: 35,
    max_orders: 10000,
    features: [
      'Up to 5 Branches with Instant Branch Switcher',
      'Decoupled Spatial Scope & Single-Branch Terminal Locking',
      'Unlimited QR Code Generations for all Tables',
      'Recipe BOM (Bill of Materials) & Food Costing',
      'Frappe/ERPNext 21-Role Permission Matrix',
      'Collaborative Notes, Activity Stream & IP Audit Trail',
      'Multi-Branch Consolidated Financial Reports',
      '24/7 Priority Support'
    ],
    badge: 'Most Popular',
    is_active: true
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Chain OS',
    slug: 'enterprise',
    price: 9999,
    billing_cycle: 'monthly',
    max_branches: 25,
    max_staff: 150,
    max_orders: 999999,
    features: [
      'Up to 25 Branches (Expandable Unlimited)',
      'Custom Role Builder & Granular Access Control',
      'Central Base Kitchen Commissary Indent & Route Planning',
      'Aggregator Sync (Swiggy / Zomato channel toggle)',
      'Tally / SAP ERP Accounting Data Export',
      'Dedicated Account Manager & Hardware Support'
    ],
    badge: 'For Multi-Unit Chains',
    is_active: true
  }
];

// 10. SAAS PLATFORM SUPER ADMIN
const SUPER_ADMIN = {
  id: 'usr-super-admin-01',
  name: 'Platform Super Admin',
  email: 'admin@serveflow.io',
  password_hash: bcrypt.hashSync('password123', 10),
  role: 'super_admin',
  is_super_admin: true,
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  created_at: '2026-01-01T00:00:00.000Z'
};

// 11. ENHANCED TENANT RESTAURANTS FOR SAAS
const SAAS_RESTAURANTS = [
  {
    id: COMPANY_ABC,
    business_id: 'REST-10001',
    name: 'ABC Foods Pvt Ltd',
    slug: 'abc-foods',
    owner_name: 'Aditya Vikram',
    owner_email: 'ceo@abcfoods.com',
    owner_phone: '+91 98765 00001',
    owner_id: 'OWN-10001',
    plan_id: 'plan-pro',
    plan_name: 'Pro Multi-Branch',
    status: 'ACTIVE',
    subscription_id: 'sub-abc-01',
    subscription_expiry: '2027-03-31',
    created_at: '2026-03-01T10:00:00.000Z',
    address: 'S.G. Highway, Bodakdev, Ahmedabad, Gujarat 380054',
    city: 'Ahmedabad',
    currency: '₹',
    branches_count: 3,
    staff_count: 5
  },
  {
    id: 'comp-royal-dining',
    business_id: 'REST-10002',
    name: 'The Royal Heritage Dining',
    slug: 'royal-heritage',
    owner_name: 'Kabir Singhania',
    owner_email: 'kabir@royalheritage.com',
    owner_phone: '+91 98234 11223',
    owner_id: 'OWN-10002',
    plan_id: 'plan-starter',
    plan_name: 'Starter Growth',
    status: 'TRIAL',
    subscription_id: 'sub-royal-01',
    subscription_expiry: '2026-10-15',
    created_at: '2026-09-15T09:30:00.000Z',
    address: 'Park Street, Kolkata, West Bengal 700016',
    city: 'Kolkata',
    currency: '₹',
    branches_count: 1,
    staff_count: 3
  },
  {
    id: 'comp-mumbai-chaat',
    business_id: 'REST-10003',
    name: 'Bombay Street Chaat Co',
    slug: 'bombay-chaat',
    owner_name: 'Meera Joshi',
    owner_email: 'meera@bombaychaat.in',
    owner_phone: '+91 99001 22334',
    owner_id: 'OWN-10003',
    plan_id: 'plan-free',
    plan_name: 'Free Demo / Trial',
    status: 'EXPIRED',
    subscription_id: 'sub-mumbai-01',
    subscription_expiry: '2026-08-30',
    created_at: '2026-07-01T11:00:00.000Z',
    address: 'Bandra West, Mumbai, Maharashtra 400050',
    city: 'Mumbai',
    currency: '₹',
    branches_count: 1,
    staff_count: 2
  }
];

// 12. INITIAL SUBSCRIPTIONS
const INITIAL_SUBSCRIPTIONS = [
  {
    id: 'sub-abc-01',
    company_id: COMPANY_ABC,
    business_id: 'REST-10001',
    company_name: 'ABC Foods Pvt Ltd',
    plan_id: 'plan-pro',
    plan_name: 'Pro Multi-Branch',
    status: 'ACTIVE',
    billing_cycle: 'monthly',
    price_paid: 4999,
    start_date: '2026-04-01',
    expiry_date: '2027-03-31',
    created_at: '2026-04-01T10:00:00.000Z'
  },
  {
    id: 'sub-royal-01',
    company_id: 'comp-royal-dining',
    business_id: 'REST-10002',
    company_name: 'The Royal Heritage Dining',
    plan_id: 'plan-starter',
    plan_name: 'Starter Growth',
    status: 'TRIAL',
    billing_cycle: 'monthly',
    price_paid: 0,
    start_date: '2026-09-15',
    expiry_date: '2026-10-15',
    created_at: '2026-09-15T09:30:00.000Z'
  },
  {
    id: 'sub-mumbai-01',
    company_id: 'comp-mumbai-chaat',
    business_id: 'REST-10003',
    company_name: 'Bombay Street Chaat Co',
    plan_id: 'plan-free',
    plan_name: 'Free Demo / Trial',
    status: 'EXPIRED',
    billing_cycle: 'monthly',
    price_paid: 0,
    start_date: '2026-07-01',
    expiry_date: '2026-08-30',
    created_at: '2026-07-01T11:00:00.000Z'
  }
];

// 13. INITIAL PAYMENTS
const INITIAL_PAYMENTS = [
  {
    id: 'pay-101',
    transaction_id: 'TXN-20260401-8842',
    company_id: COMPANY_ABC,
    company_name: 'ABC Foods Pvt Ltd',
    plan_id: 'plan-pro',
    plan_name: 'Pro Multi-Branch',
    amount: 4999,
    currency: '₹',
    payment_method: 'card',
    payment_status: 'success',
    created_at: '2026-04-01T10:30:00.000Z'
  },
  {
    id: 'pay-102',
    transaction_id: 'TXN-20260501-9124',
    company_id: COMPANY_ABC,
    company_name: 'ABC Foods Pvt Ltd',
    plan_id: 'plan-pro',
    plan_name: 'Pro Multi-Branch',
    amount: 4999,
    currency: '₹',
    payment_method: 'upi',
    payment_status: 'success',
    created_at: '2026-05-01T10:30:00.000Z'
  },
  {
    id: 'pay-103',
    transaction_id: 'TXN-20260601-3419',
    company_id: COMPANY_ABC,
    company_name: 'ABC Foods Pvt Ltd',
    plan_id: 'plan-pro',
    plan_name: 'Pro Multi-Branch',
    amount: 4999,
    currency: '₹',
    payment_method: 'netbanking',
    payment_status: 'success',
    created_at: '2026-06-01T10:30:00.000Z'
  }
];

// 14. PLATFORM SETTINGS
const PLATFORM_SETTINGS = {
  platform_name: 'ServeFlow Restaurant OS',
  tagline: 'Next-Gen Multi-Branch Restaurant Management SaaS',
  logo: '/logo.svg',
  contact_email: 'support@serveflow.io',
  support_phone: '+91 80000 12345',
  currency: '₹',
  tax_percentage: 18,
  allow_signups: true,
  trial_days: 14,
  payment_gateway_mode: 'sandbox'
};

// 15. SALES LEADS & DEMO REQUESTS (PETPOOJA ASSISTED SALES PIPELINE)
const INITIAL_SALES_LEADS = [
  {
    id: 'lead-1001',
    restaurant_name: 'Copper Chimney Grand',
    owner_name: 'Rajesh Singhania',
    mobile: '+91 98220 12345',
    email: 'rajesh@copperchimney.in',
    city: 'Mumbai',
    number_of_branches: 4,
    restaurant_type: 'Fine Dine',
    daily_orders: '300-500',
    current_software: 'Legacy Desktop POS',
    requirements: 'Centralized multi-outlet reporting, QR table ordering, kitchen display screens (KDS)',
    message: 'We are expanding to 2 more locations in Navi Mumbai and Pune. Need a unified cloud solution.',
    status: 'demo_scheduled',
    assigned_to: 'Pooja Mehta (Sales)',
    notes: 'Demo scheduled for tomorrow 3 PM IST via Google Meet. Highly interested in Pro Multi-Branch.',
    follow_up_date: '2026-09-29',
    converted_company_id: null,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    id: 'lead-1002',
    restaurant_name: 'Chai Shai Express',
    owner_name: 'Karan Dave',
    mobile: '+91 97123 45678',
    email: 'karan@chaishai.com',
    city: 'Ahmedabad',
    number_of_branches: 2,
    restaurant_type: 'Quick Service (QSR)',
    daily_orders: '600-1000',
    current_software: 'Excel Sheets',
    requirements: 'Fast 1-second counter billing, thermal receipt printing, barcode scanning, UPI dynamic QR',
    message: 'We have long queues during morning tea rush. Need instant checkout speeds.',
    status: 'new',
    assigned_to: 'Vikram Sales',
    notes: 'Inbound demo inquiry from public website pricing calculator.',
    follow_up_date: '2026-09-28',
    converted_company_id: null,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: 'lead-1003',
    restaurant_name: 'Bistro 44 Rooftop Cafe',
    owner_name: 'Simran Walia',
    mobile: '+91 98990 88776',
    email: 'simran@bistro44.com',
    city: 'Bengaluru',
    number_of_branches: 1,
    restaurant_type: 'Cafe / Bakery',
    daily_orders: '150-250',
    current_software: 'None',
    requirements: 'Interactive table QR ordering with cart, low-stock inventory alerts, live kitchen ticket board',
    message: 'Looking to modernize our Indiranagar rooftop cafe. Need guest self-ordering.',
    status: 'proposal_sent',
    assigned_to: 'Pooja Mehta (Sales)',
    notes: 'Shared quotation for Starter Growth annual billing with 15% promotional discount.',
    follow_up_date: '2026-09-30',
    converted_company_id: null,
    created_at: new Date(Date.now() - 72 * 3600000).toISOString()
  },
  {
    id: 'lead-1004',
    restaurant_name: 'Royal Flavors Biryani Hub',
    owner_name: 'Mohammad Farooq',
    mobile: '+91 98450 99887',
    email: 'farooq@royalflavors.in',
    city: 'Hyderabad',
    number_of_branches: 6,
    restaurant_type: 'Multi-Chain',
    daily_orders: '1000+',
    current_software: 'Custom Legacy System',
    requirements: 'Central commissary indents, recipe costing, aggregator Swiggy/Zomato consolidation',
    message: 'Need enterprise scale support for 6 cloud kitchens and 2 dine-in outlets.',
    status: 'negotiation',
    assigned_to: 'Super Admin',
    notes: 'Enterprise contract drafted. Waiting for finance team review.',
    follow_up_date: '2026-10-02',
    converted_company_id: null,
    created_at: new Date(Date.now() - 120 * 3600000).toISOString()
  }
];

// 16. SUPPORT & HELPDESK TICKETS
const INITIAL_SUPPORT_TICKETS = [
  {
    id: 'tkt-2001',
    company_id: COMPANY_ABC,
    company_name: 'ABC Foods Pvt Ltd',
    user_id: 'usr-ceo-01',
    user_name: 'Aditya Vikram',
    subject: 'Adding custom logo & FSSAI number to thermal POS receipts',
    category: 'POS Issue',
    priority: 'Medium',
    description: 'We want to upload our monochrome logo and print our 14-digit FSSAI license number on customer thermal receipts.',
    status: 'open',
    admin_response: null,
    created_at: new Date(Date.now() - 14 * 3600000).toISOString()
  },
  {
    id: 'tkt-2002',
    company_id: 'comp-royal-dining',
    company_name: 'The Royal Heritage Dining',
    user_id: 'OWN-10002',
    user_name: 'Kabir Singhania',
    subject: 'Request to extend 14-day trial for second heritage hall launch',
    category: 'Billing',
    priority: 'Low',
    description: 'We are opening our second heritage dining hall next Monday and would like a 10-day trial extension to test table layout.',
    status: 'in_progress',
    admin_response: 'Reviewed your request. Granted 10 additional trial days through October 25, 2026.',
    created_at: new Date(Date.now() - 36 * 3600000).toISOString()
  }
];

// 17. ONBOARDING PROGRESS SEED
const INITIAL_ONBOARDING = {
  [COMPANY_ABC]: {
    company_id: COMPANY_ABC,
    current_step: 13,
    completed_steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    is_completed: true,
    updated_at: new Date().toISOString()
  },
  'comp-royal-dining': {
    company_id: 'comp-royal-dining',
    current_step: 7,
    completed_steps: [1, 2, 3, 4, 5, 6],
    is_completed: false,
    updated_at: new Date().toISOString()
  }
};

module.exports = {
  COMPANY_ABC,
  COMPANY_URBAN,
  BRANCH_BOPAL,
  BRANCH_SATELLITE,
  BRANCH_SG_HIGHWAY,
  PERMISSION_GROUPS,
  ALL_PERMISSIONS_LIST,
  MODULE_PROFILES,
  ENTERPRISE_ROLES,
  COMPANIES,
  BRANCHES,
  getInitialERPUsers,
  USER_BRANCH_ASSIGNMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_COMMENTS,
  INITIAL_PLANS,
  SUPER_ADMIN,
  SAAS_RESTAURANTS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_PAYMENTS,
  PLATFORM_SETTINGS,
  INITIAL_SALES_LEADS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_ONBOARDING
};

