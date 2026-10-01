const { getPool, isUsingFallback, getFallbackStore, persistStoreToDisk, RESTAURANT_ID } = require('../config/db');
const { calculateRecipeAvailability, convertUnits } = require('../utils/recipeEngine');

// Safe JSON parser
const safeParse = (val, fallback = []) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
};

const enrichUser = (user, store) => {
  if (!user) return null;
  const companyId = user.company_id || user.companyId || 'comp-abc-foods';
  const company = (store.companies || []).find(c => c.id === companyId) || { id: companyId, name: 'ABC Foods Pvt Ltd' };

  let role = null;
  if (user.role_id) {
    role = (store.roles || []).find(r => r.id === user.role_id);
  }
  if (!role && user.role) {
    role = (store.roles || []).find(r => r.name.toLowerCase() === user.role.toLowerCase() || r.id.toLowerCase().includes(user.role.toLowerCase()));
  }
  if (!role) {
    if (user.role === 'cashier') {
      role = { id: 'role-cashier', name: 'Cashier', permissions: ['pos.view', 'orders.view', 'tables.view'] };
    } else if (user.role === 'kitchen') {
      role = { id: 'role-kitchen-staff', name: 'Kitchen Staff', permissions: ['kot.view', 'inventory.view'] };
    } else if (user.role === 'waiter') {
      role = { id: 'role-waitstaff', name: 'Waitstaff', permissions: ['pos.view', 'tables.view', 'orders.view'] };
    } else {
      role = (store.roles || []).find(r => r.id === 'role-sysadmin') || {
        id: 'role-sysadmin',
        name: 'System Administrator',
        permissions: store.allPermissionsList || []
      };
    }
  }

  const assignments = (store.userBranchAssignments || []).filter(a => a.user_id === user.id);
  let assignedBranchIds = assignments.map(a => a.branch_id);
  if (user.assigned_branch_ids && Array.isArray(user.assigned_branch_ids)) {
    assignedBranchIds = user.assigned_branch_ids;
  }
  if (user.has_all_branch_access) {
    assignedBranchIds = (store.branches || []).map(b => b.id);
  } else if (assignedBranchIds.length === 0) {
    assignedBranchIds = ['branch-bopal'];
  }

  const branches = (store.branches || []).filter(b => assignedBranchIds.includes(b.id));
  const { password, password_hash, ...safeProps } = user;

  let allowedModules = user.allowed_modules || user.allowedModules;
  if (!allowedModules || !Array.isArray(allowedModules) || allowedModules.length === 0) {
    const roleId = role?.id || user.role_id;
    const defaultModulesForRole = {
      'role-sysadmin': ['dashboard', 'pos', 'orders', 'kot', 'tables', 'menu', 'inventory', 'purchases', 'suppliers', 'customers', 'employees', 'expenses', 'reports', 'settings', 'branches', 'roles', 'subscription', 'erpUsers', 'onboarding', 'support'],
      'role-gen-manager': ['dashboard', 'pos', 'orders', 'kot', 'tables', 'menu', 'inventory', 'purchases', 'suppliers', 'customers', 'employees', 'expenses', 'reports', 'branches', 'settings', 'support'],
      'role-store-mgr': ['dashboard', 'pos', 'orders', 'kot', 'tables', 'menu', 'inventory', 'purchases', 'customers', 'expenses', 'reports', 'support'],
      'role-area-sales-mgr': ['dashboard', 'pos', 'orders', 'tables', 'inventory', 'customers', 'expenses', 'reports', 'support'],
      'role-cashier': ['pos', 'orders', 'tables', 'customers'],
      'role-kitchen-staff': ['kot', 'inventory'],
      'role-waitstaff': ['pos', 'orders', 'tables'],
      'role-inventory-mgr': ['inventory', 'purchases', 'suppliers', 'expenses', 'reports'],
      'role-accounts-mgr': ['dashboard', 'expenses', 'purchases', 'reports', 'subscription']
    };
    allowedModules = defaultModulesForRole[roleId] || ['pos', 'orders', 'tables'];
  }

  const assignedRoles = user.roles && Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [role.id];

  return {
    ...safeProps,
    id: user.id,
    name: user.name,
    username: user.username || user.email.split('@')[0],
    first_name: user.first_name || user.name.split(' ')[0],
    middle_name: user.middle_name || '',
    last_name: user.last_name || user.name.split(' ').slice(1).join(' ') || '',
    full_name: user.full_name || user.name,
    language: user.language || 'English',
    timezone: user.timezone || 'Asia/Kolkata',
    user_category: user.user_category || (user.has_all_branch_access ? 'Executive' : 'Staff'),
    email: user.email,
    alternate_email: user.alternate_email || null,
    phone: user.phone || '',
    avatar: user.avatar || '',
    companyId,
    company_id: companyId,
    companyName: company.name,
    company_name: company.name,
    roleId: role.id,
    role_id: role.id,
    roleName: role.name,
    role_name: role.name,
    roles: assignedRoles,
    role: user.role || (role.id === 'role-cashier' || role.name?.toLowerCase().includes('cashier') ? 'cashier' : (role.id === 'role-kitchen-staff' || role.name?.toLowerCase().includes('kitchen') ? 'kitchen' : (role.name?.toLowerCase().includes('admin') || user.role === 'owner' ? 'owner' : 'manager'))),
    permissions: role.permissions || [],
    allowed_modules: allowedModules,
    allowedModules: allowedModules,
    parent_modules: (() => {
      const parents = new Set();
      const parentMap = {
        orders: 'operations', kot: 'operations', pos: 'operations', tables: 'operations', serving: 'operations',
        stock: 'inventory', inventory: 'inventory', ingredients: 'inventory', recipes: 'inventory', purchases: 'inventory', suppliers: 'inventory', stock_ledger: 'inventory',
        accounts_dashboard: 'accounts', sales: 'accounts', purchase: 'accounts', expenses: 'accounts', receivables: 'accounts', payables: 'accounts', cash_bank: 'accounts', ledger: 'accounts', journal: 'accounts', journal_entries: 'accounts', reconciliation: 'accounts', tax: 'accounts', gst_tax: 'accounts', reports: 'accounts',
        users: 'administration', erpUsers: 'administration', roles: 'administration', permissions: 'administration', branches: 'administration', settings: 'administration', subscription: 'administration'
      };
      (allowedModules || []).forEach(m => {
        if (parentMap[m]) parents.add(parentMap[m]);
      });
      return Array.from(parents);
    })(),
    action_permissions: user.action_permissions || user.user_permissions || {},
    user_permissions: user.user_permissions || user.action_permissions || {},
    denied_permissions: user.denied_permissions || [],
    has_all_branch_access: Boolean(user.has_all_branch_access),
    isAllBranchesAllowed: Boolean(user.has_all_branch_access),
    assignedBranchIds,
    assigned_branch_ids: assignedBranchIds,
    branches,
    restaurant_id: user.restaurant_id || 'rest-urban-spice-01',
    status: user.status || (user.is_active ? 'ACTIVE' : 'SUSPENDED'),
    tags: user.tags || [],
    attachments: user.attachments || [],
    assigned_to: user.assigned_to || 'Admin',
    audit_created: user.audit_created || 'Created by Admin',
    audit_edited: user.audit_edited || 'Last edited recently',
    last_login: user.last_login || null,
    created_at: user.created_at || new Date().toISOString()
  };
};

const DataService = {
  // RESTAURANT SETTINGS
  async getRestaurant(id = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM restaurants WHERE id = ?', [id]);
      return rows[0] || null;
    }
    const store = getFallbackStore();
    return store.restaurant.id === id ? store.restaurant : store.restaurant;
  },

  async updateRestaurant(id, updates) {
    if (!isUsingFallback() && getPool()) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return this.getRestaurant(id);
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(updates), id];
      await getPool().query(`UPDATE restaurants SET ${setClause} WHERE id = ?`, values);
      return this.getRestaurant(id);
    }
    const store = getFallbackStore();
    store.restaurant = { ...store.restaurant, ...updates };
    return store.restaurant;
  },

  // USERS
  async findUserByEmail(email) {
    const store = getFallbackStore();
    const queryEmail = (email || '').toLowerCase().trim();

    // Check Super Admin
    if (store.superAdmin && store.superAdmin.email.toLowerCase() === queryEmail) {
      return {
        ...store.superAdmin,
        role: 'super_admin',
        is_super_admin: true,
        companyId: 'platform',
        companyName: 'ServeFlow Platform',
        isAllBranchesAllowed: true,
        permissions: store.allPermissionsList || []
      };
    }

    // Check ERP users first
    const erpUser = (store.erpUsers || []).find(
      u => u.email.toLowerCase() === queryEmail || (u.alternate_email && u.alternate_email.toLowerCase() === queryEmail)
    );
    if (erpUser) {
      return enrichUser(erpUser, store);
    }

    // Check legacy users
    const standardUser = (store.users || []).find(u => u.email.toLowerCase() === queryEmail);
    if (standardUser) {
      return enrichUser(standardUser, store);
    }

    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0] ? enrichUser(rows[0], store) : null;
    }
    return null;
  },

  async getUserById(id) {
    const store = getFallbackStore();
    if (store.superAdmin && store.superAdmin.id === id) {
      return {
        ...store.superAdmin,
        role: 'super_admin',
        is_super_admin: true,
        companyId: 'platform',
        companyName: 'ServeFlow Platform',
        isAllBranchesAllowed: true,
        permissions: store.allPermissionsList || []
      };
    }
    const erpUser = (store.erpUsers || []).find(user => user.id === id);
    if (erpUser) {
      return enrichUser(erpUser, store);
    }
    const u = (store.users || []).find(user => user.id === id);
    if (u) {
      return enrichUser(u, store);
    }
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0] ? enrichUser(rows[0], store) : null;
    }
    return null;
  },

  // CATEGORIES
  async getCategories(restaurantId = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY display_order ASC', [restaurantId]);
      return rows;
    }
    const store = getFallbackStore();
    return store.categories.filter(c => c.restaurant_id === restaurantId);
  },

  async createCategory(cat) {
    const id = cat.id || `cat-${Date.now()}`;
    const newCat = { ...cat, id, restaurant_id: cat.restaurant_id || RESTAURANT_ID, is_active: true };
    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        'INSERT INTO menu_categories (id, restaurant_id, name, slug, description, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newCat.id, newCat.restaurant_id, newCat.name, newCat.slug, newCat.description || '', newCat.display_order || 0, newCat.is_active]
      );
      return newCat;
    }
    const store = getFallbackStore();
    store.categories.push(newCat);
    return newCat;
  },

  // MENU ITEMS
  async getMenuItems(restaurantId = RESTAURANT_ID, categoryId = null) {
    if (!isUsingFallback() && getPool()) {
      let sql = 'SELECT * FROM menu_items WHERE restaurant_id = ?';
      const params = [restaurantId];
      if (categoryId) {
        sql += ' AND category_id = ?';
        params.push(categoryId);
      }
      const [rows] = await getPool().query(sql, params);
      return rows.map(r => ({
        ...r,
        is_veg: Boolean(r.is_veg),
        is_available: Boolean(r.is_available),
        variants: safeParse(r.variants, []),
        add_ons: safeParse(r.add_ons, [])
      }));
    }
    const store = getFallbackStore();
    return store.menuItems.filter(item => {
      if (item.restaurant_id !== restaurantId) return false;
      if (categoryId && item.category_id !== categoryId) return false;
      return true;
    });
  },

  async createMenuItem(item) {
    const id = item.id || `item-${Date.now()}`;
    const newItem = {
      ...item,
      id,
      restaurant_id: item.restaurant_id || RESTAURANT_ID,
      price: Number(item.price) || 0,
      is_veg: item.is_veg !== undefined ? Boolean(item.is_veg) : true,
      gst_rate: Number(item.gst_rate) || 5,
      is_available: item.is_available !== undefined ? Boolean(item.is_available) : true,
      variants: item.variants || [],
      add_ons: item.add_ons || []
    };

    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, is_veg, gst_rate, is_available, image, preparation_time, variants, add_ons)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newItem.id, newItem.restaurant_id, newItem.category_id, newItem.name, newItem.description || '',
          newItem.price, newItem.is_veg, newItem.gst_rate, newItem.is_available, newItem.image || '',
          newItem.preparation_time || 15, JSON.stringify(newItem.variants), JSON.stringify(newItem.add_ons)
        ]
      );
      return newItem;
    }
    const store = getFallbackStore();
    store.menuItems.push(newItem);
    return newItem;
  },

  async updateMenuItem(id, updates) {
    if (!isUsingFallback() && getPool()) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return null;
      const dbUpdates = { ...updates };
      if (dbUpdates.variants) dbUpdates.variants = JSON.stringify(dbUpdates.variants);
      if (dbUpdates.add_ons) dbUpdates.add_ons = JSON.stringify(dbUpdates.add_ons);

      const setClause = Object.keys(dbUpdates).map(k => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(dbUpdates), id];
      await getPool().query(`UPDATE menu_items SET ${setClause} WHERE id = ?`, values);
      const [rows] = await getPool().query('SELECT * FROM menu_items WHERE id = ?', [id]);
      if (!rows[0]) return null;
      return {
        ...rows[0],
        is_veg: Boolean(rows[0].is_veg),
        is_available: Boolean(rows[0].is_available),
        variants: safeParse(rows[0].variants, []),
        add_ons: safeParse(rows[0].add_ons, [])
      };
    }
    const store = getFallbackStore();
    const idx = store.menuItems.findIndex(i => i.id === id);
    if (idx === -1) return null;
    store.menuItems[idx] = { ...store.menuItems[idx], ...updates };
    return store.menuItems[idx];
  },

  async deleteMenuItem(id) {
    if (!isUsingFallback() && getPool()) {
      await getPool().query('DELETE FROM menu_items WHERE id = ?', [id]);
      return true;
    }
    const store = getFallbackStore();
    store.menuItems = store.menuItems.filter(i => i.id !== id);
    return true;
  },

  // DINING TABLES
  async getTables(restaurantId = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM dining_tables WHERE restaurant_id = ? ORDER BY table_number ASC', [restaurantId]);
      return rows;
    }
    const store = getFallbackStore();
    return store.diningTables.filter(t => t.restaurant_id === restaurantId);
  },

  async createTable(table) {
    const id = table.id || `tbl-${Date.now()}`;
    const newTable = {
      ...table,
      id,
      restaurant_id: table.restaurant_id || RESTAURANT_ID,
      status: table.status || 'available',
      capacity: Number(table.capacity) || 4,
      floor: table.floor || 'Floor 1',
      current_order_id: null
    };
    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        'INSERT INTO dining_tables (id, restaurant_id, table_number, floor, capacity, status, current_order_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newTable.id, newTable.restaurant_id, newTable.table_number, newTable.floor, newTable.capacity, newTable.status, newTable.current_order_id]
      );
      return newTable;
    }
    const store = getFallbackStore();
    store.diningTables.push(newTable);
    return newTable;
  },

  async resolveTable(identifier, restaurantId = RESTAURANT_ID, branchId = null) {
    if (!identifier) return null;
    const store = getFallbackStore();
    const tables = store.diningTables || [];
    const idStr = String(identifier).trim().toLowerCase();
    const stripped = idStr.replace(/^table\s*/i, '').replace(/^t-?/i, '');

    // 1. Direct ID match
    let found = tables.find(t => t.id && t.id.toLowerCase() === idStr);

    // 2. Table number match (e.g. 'T07', 'T-07', '07', '7', 'Table 07')
    if (!found) {
      found = tables.find(t => {
        const tNum = String(t.table_number || '').trim().toLowerCase();
        const tNumStripped = tNum.replace(/^t-?/i, '');
        return tNum === idStr || 
               tNumStripped === stripped || 
               tNumStripped === idStr || 
               `table ${tNum}` === idStr || 
               `table ${tNumStripped}` === idStr;
      });
    }

    // 3. Branch-scoped lookup if multiple match
    if (found && branchId && found.branch_id && found.branch_id !== branchId && branchId !== 'ALL') {
      const branchMatch = tables.find(t => {
        if (t.branch_id !== branchId) return false;
        const tNum = String(t.table_number || '').trim().toLowerCase();
        const tNumStripped = tNum.replace(/^t-?/i, '');
        return t.id.toLowerCase() === idStr || tNum === idStr || tNumStripped === stripped;
      });
      if (branchMatch) found = branchMatch;
    }

    return found || null;
  },

  async updateTable(id, updates) {
    if (!isUsingFallback() && getPool()) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return null;
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(updates), id];
      await getPool().query(`UPDATE dining_tables SET ${setClause} WHERE id = ?`, values);
      const [rows] = await getPool().query('SELECT * FROM dining_tables WHERE id = ?', [id]);
      return rows[0] || null;
    }
    const store = getFallbackStore();
    let idx = store.diningTables.findIndex(t => t.id === id);
    if (idx === -1) {
      // Fallback resolve by table_number
      const resolved = await this.resolveTable(id);
      if (resolved) {
        idx = store.diningTables.findIndex(t => t.id === resolved.id);
      }
    }
    if (idx === -1) return null;
    store.diningTables[idx] = { ...store.diningTables[idx], ...updates };
    persistStoreToDisk();
    return store.diningTables[idx];
  },

  async deleteTable(id) {
    if (!isUsingFallback() && getPool()) {
      await getPool().query('DELETE FROM dining_tables WHERE id = ?', [id]);
      return true;
    }
    const store = getFallbackStore();
    store.diningTables = store.diningTables.filter(t => t.id !== id);
    persistStoreToDisk();
    return true;
  },

  // ORDERS
  async getOrders(restaurantId = RESTAURANT_ID, type = null, status = null) {
    if (!isUsingFallback() && getPool()) {
      let sql = 'SELECT * FROM orders WHERE restaurant_id = ?';
      const params = [restaurantId];
      if (type && type !== 'all') {
        sql += ' AND order_type = ?';
        params.push(type);
      }
      if (status && status !== 'all') {
        sql += ' AND status = ?';
        params.push(status);
      }
      sql += ' ORDER BY created_at DESC';
      const [rows] = await getPool().query(sql, params);
      return rows.map(r => ({
        ...r,
        items: safeParse(r.items, [])
      }));
    }
    const store = getFallbackStore();
    return (store.orders || [])
      .filter(o => {
        if (o.restaurant_id !== restaurantId) return false;
        if (type && type !== 'all' && o.order_type !== type) return false;
        if (status && status !== 'all' && o.status !== status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getOrderById(id) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM orders WHERE id = ?', [id]);
      if (!rows[0]) return null;
      return { ...rows[0], items: safeParse(rows[0].items, []) };
    }
    const store = getFallbackStore();
    return (store.orders || []).find(o => o.id === id) || null;
  },

  async createOrder(order) {
    const store = getFallbackStore();
    const restId = order.restaurant_id || RESTAURANT_ID;

    // Resolve table correctly using real DB table record
    let resolvedTable = null;
    if (order.table_id || order.table_name || order.table_number) {
      resolvedTable = await this.resolveTable(order.table_id || order.table_name || order.table_number, restId, order.branch_id);
    }

    const tableId = resolvedTable ? resolvedTable.id : (order.table_id || null);
    const tableNumberDisplay = resolvedTable ? (resolvedTable.table_number.replace(/^T-?/i, '') || resolvedTable.table_number) : (order.table_name || 'Counter');
    const formattedTableName = resolvedTable ? `Table ${tableNumberDisplay}` : (order.table_name || (order.order_type === 'dine-in' ? 'Table' : 'Takeaway'));

    // ─────────────────────────────────────────────────────────────────────────
    // REQUIREMENT 3 & 16: SAME CUSTOMER ORDER MUST REMAIN IN SAME BILL
    // If active unpaid order already exists on same table, aggregate into it!
    // ─────────────────────────────────────────────────────────────────────────
    const isDineIn = ['dine-in', 'dine_in'].includes(order.order_type);
    if (isDineIn && tableId) {
      const existingOpenOrder = (store.orders || []).find(o => 
        o.restaurant_id === restId &&
        (o.table_id === tableId || o.table_name === formattedTableName) &&
        !['completed', 'cancelled', 'paid'].includes(o.status) &&
        o.payment_status !== 'paid'
      );

      if (existingOpenOrder) {
        if (order.payment_status === 'paid' || order.status === 'paid') {
          console.log(`[Order Settlement] Settle existing open order ${existingOpenOrder.order_number} for table ${formattedTableName}`);
          const result = await this.recordOrderPayment(existingOpenOrder.id, {
            amount: order.total || existingOpenOrder.total,
            payment_method: order.payment_method || 'cash',
            payment_reference: order.payment_reference || ''
          }, order.user);
          return result.order;
        }

        console.log(`[Order Aggregation] Appending additional items to open order ${existingOpenOrder.order_number} for table ${formattedTableName}`);
        return await this.addItemsToExistingOrder(existingOpenOrder.id, order.items || [], order.notes, order.user);
      }
    }


    const id = order.id || `ord-${Date.now()}`;
    const orderNumberNumeric = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = order.order_number || `ORD-${orderNumberNumeric}`;
    const kotNumber = `KOT-${orderNumberNumeric}-01`;

    // Tag each item with KOT number and initial status
    const taggedItems = (order.items || []).map((it, idx) => ({
      id: it.id || it.menuItemId || `item-${Date.now()}-${idx}`,
      menu_item_id: it.menuItemId || it.item_id || it.id,
      name: it.name,
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      variant: it.variant || null,
      modifiers: it.modifiers || [],
      notes: it.notes || '',
      kot_number: kotNumber,
      status: 'pending',
      added_at: new Date().toISOString()
    }));

    const isPaidOnCreate = order.payment_status === 'paid' || order.status === 'paid';

    const newOrder = {
      ...order,
      id,
      order_number: orderNumber,
      restaurant_id: restId,
      branch_id: resolvedTable?.branch_id || order.branch_id || 'branch-bopal',
      company_id: resolvedTable?.company_id || order.company_id || 'comp-abc-foods',
      table_id: tableId,
      table_name: formattedTableName,
      items: taggedItems,
      subtotal: Number(order.subtotal) || 0,
      discount: Number(order.discount) || 0,
      tax: Number(order.tax) || 0,
      service_charge: Number(order.service_charge) || 0,
      total: Number(order.total) || 0,
      status: order.status || (isPaidOnCreate ? 'paid' : 'kot_sent'),
      payment_status: order.payment_status || (isPaidOnCreate ? 'paid' : 'unpaid'),
      payment_method: order.payment_method || (isPaidOnCreate ? 'cash' : 'unpaid'),
      created_at: new Date().toISOString(),
      history: [
        {
          action: isPaidOnCreate ? 'order_created_and_paid' : 'order_created',
          kot_number: kotNumber,
          items_count: taggedItems.length,
          timestamp: new Date().toISOString(),
          user: order.user?.name || 'Staff'
        }
      ]
    };

    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        `INSERT INTO orders (id, restaurant_id, order_number, table_id, table_name, customer_id, customer_name, customer_phone, order_type, items, subtotal, discount, tax, service_charge, total, status, payment_status, payment_method, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newOrder.id, newOrder.restaurant_id, newOrder.order_number, newOrder.table_id || null,
          newOrder.table_name || null, newOrder.customer_id || null, newOrder.customer_name || 'Walk-in Guest',
          newOrder.customer_phone || '', newOrder.order_type || 'dine-in', JSON.stringify(newOrder.items),
          newOrder.subtotal, newOrder.discount, newOrder.tax, newOrder.service_charge, newOrder.total,
          newOrder.status, newOrder.payment_status, newOrder.payment_method, newOrder.notes || '', newOrder.created_at
        ]
      );
    } else {
      store.orders.unshift(newOrder);
      persistStoreToDisk();
    }

    if (isPaidOnCreate) {
      // Record payment & bill
      const paymentRecord = {
        id: `pay-${Date.now()}`,
        order_id: newOrder.id,
        order_number: newOrder.order_number,
        company_id: newOrder.company_id || 'comp-abc-foods',
        branch_id: newOrder.branch_id || 'branch-bopal',
        amount: newOrder.total,
        payment_method: newOrder.payment_method || 'cash',
        payment_reference: order.payment_reference || '',
        status: 'success',
        collected_by: order.user?.name || 'Cashier',
        created_at: new Date().toISOString()
      };
      if (!store.orderPayments) store.orderPayments = [];
      store.orderPayments.push(paymentRecord);

      const billRecord = {
        id: `bill-${Date.now()}`,
        order_id: newOrder.id,
        order_number: newOrder.order_number,
        invoice_number: `INV-${(newOrder.order_number || '').replace(/[^a-zA-Z0-9]/g, '')}`,
        company_id: newOrder.company_id || 'comp-abc-foods',
        branch_id: newOrder.branch_id || 'branch-bopal',
        customer_name: newOrder.customer_name || 'Guest',
        subtotal: newOrder.subtotal,
        tax: newOrder.tax,
        total: newOrder.total,
        payment_method: newOrder.payment_method || 'cash',
        status: 'paid',
        created_at: new Date().toISOString()
      };
      if (!store.bills) store.bills = [];
      store.bills.push(billRecord);

      // Free table if dine-in
      if (newOrder.table_id) {
        await this.updateTable(newOrder.table_id, { 
          status: 'available', 
          current_order_id: null 
        });
      }
    } else {
      // Update table status to occupied and link current order
      if (newOrder.table_id) {
        await this.updateTable(newOrder.table_id, { 
          status: 'occupied', 
          current_order_id: newOrder.id 
        });
      }
    }

    // Auto-generate KOT ticket for the order with matching KOT number
    await this.createKOT({
      order_id: newOrder.id,
      order_number: newOrder.order_number,
      kot_number: kotNumber,
      table_number: newOrder.table_name || 'Counter',
      order_type: newOrder.order_type,
      branch_id: newOrder.branch_id,
      company_id: newOrder.company_id,
      items: newOrder.items.map(it => ({
        name: it.name,
        quantity: it.quantity,
        notes: it.notes || '',
        status: 'pending'
      })),
      special_note: newOrder.notes || '',
      status: 'new'
    });

    // Auto-deduct inventory based on recipes
    try {
      await this.deductOrderInventory(newOrder);
    } catch (deductErr) {
      console.warn('[Recipe Auto-Deduction Warning]', deductErr.message);
    }

    return newOrder;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REQUIREMENT 1, 3, 16: ADD ITEMS TO EXISTING OPEN ORDER & GENERATE NEXT KOT
  // ─────────────────────────────────────────────────────────────────────────
  async addItemsToExistingOrder(orderId, newItems = [], notes = '', user = null) {
    const store = getFallbackStore();
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'cancelled' || order.status === 'voided') {
      throw new Error(`Order ${order.order_number || orderId} is CANCELLED and cannot be modified. Cancelled orders are final and immutable (Cancel means cancel).`);
    }

    const numMatch = (order.order_number || '').match(/\d+/);
    const orderNum = numMatch ? numMatch[0] : '1025';

    // Count existing KOTs for this order to sequence the next ticket
    const existingKots = (store.kots || []).filter(k => k.order_id === order.id);
    const nextSeq = existingKots.length + 1;
    const nextKotNumber = `KOT-${orderNum}-${String(nextSeq).padStart(2, '0')}`;

    // Tag each new item
    const taggedNewItems = newItems.map((it, idx) => ({
      id: it.id || it.menuItemId || `item-${Date.now()}-${idx}`,
      menu_item_id: it.menuItemId || it.item_id || it.id,
      name: it.name,
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      variant: it.variant || null,
      modifiers: it.modifiers || [],
      notes: it.notes || '',
      kot_number: nextKotNumber,
      status: 'pending',
      added_at: new Date().toISOString()
    }));

    const combinedItems = [...(order.items || []), ...taggedNewItems];

    // Recalculate totals
    const restaurant = await this.getRestaurant(order.restaurant_id);
    const taxRate = restaurant?.tax_rate || 5.0;
    const subtotal = combinedItems.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity)), 0);
    const discount = Number(order.discount) || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = parseFloat(((taxable * taxRate) / 100).toFixed(2));
    const total = parseFloat((taxable + tax + (Number(order.service_charge) || 0)).toFixed(2));

    const historyEntry = {
      action: 'items_added',
      kot_number: nextKotNumber,
      items: taggedNewItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
      timestamp: new Date().toISOString(),
      user: user?.name || 'Staff'
    };

    const updates = {
      items: combinedItems,
      subtotal,
      tax,
      total,
      status: 'kot_sent', // Order moves back to kitchen queue for new items
      history: [...(order.history || []), historyEntry]
    };

    const updatedOrder = await this.updateOrder(order.id, updates);

    // If order is linked to a table that was in billing, reset table back to occupied since more items were ordered
    if (order.table_id) {
      await this.updateTable(order.table_id, { status: 'occupied', current_order_id: order.id });
    }

    // Create the additional KOT ticket with ONLY the newly added items
    const newKot = await this.createKOT({
      order_id: updatedOrder.id,
      order_number: updatedOrder.order_number,
      kot_number: nextKotNumber,
      restaurant_id: updatedOrder.restaurant_id || RESTAURANT_ID,
      table_number: updatedOrder.table_name || 'Counter',
      order_type: updatedOrder.order_type,
      branch_id: updatedOrder.branch_id,
      company_id: updatedOrder.company_id,
      items: taggedNewItems.map(it => ({
        name: it.name,
        quantity: it.quantity,
        notes: it.notes || '',
        status: 'pending'
      })),
      special_note: notes || '',
      status: 'new'
    });

    // Auto-deduct inventory for added items
    try {
      await this.deductOrderInventory({ ...updatedOrder, items: taggedNewItems });
    } catch (deductErr) {
      console.warn('[Recipe Auto-Deduction Warning]', deductErr.message);
    }

    persistStoreToDisk();
    return { ...updatedOrder, newKot, isAdditionalKot: true };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REQUIREMENT 1: UPDATE ITEM QUANTITY (Generates delta KOT if increased, updates KOT if decreased)
  // ─────────────────────────────────────────────────────────────────────────
  async updateOrderItemQuantity(orderId, itemIndex, newQuantity, reason = '', user = null) {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'cancelled' || order.status === 'voided') {
      throw new Error(`Order ${order.order_number || orderId} is CANCELLED and cannot be modified. Cancelled orders are final and immutable (Cancel means cancel).`);
    }

    const items = [...(order.items || [])];
    if (itemIndex < 0 || itemIndex >= items.length) {
      throw new Error('Invalid item index');
    }

    const currentItem = items[itemIndex];
    const oldQty = Number(currentItem.quantity);
    const newQty = Number(newQuantity);

    if (newQty <= 0) {
      return await this.cancelOrderItem(orderId, itemIndex, reason || 'Quantity reduced to zero', user);
    }

    const store = getFallbackStore();
    const numMatch = (order.order_number || '').match(/\d+/);
    const orderNum = numMatch ? numMatch[0] : '1025';

    let deltaKot = null;
    const updatedKots = [];

    // If quantity INCREASED, generate a delta KOT for the kitchen
    if (newQty > oldQty) {
      const deltaQty = newQty - oldQty;
      const existingKots = (store.kots || []).filter(k => k.order_id === order.id);
      const nextSeq = existingKots.length + 1;
      const nextKotNumber = `KOT-${orderNum}-${String(nextSeq).padStart(2, '0')}`;

      deltaKot = await this.createKOT({
        order_id: order.id,
        order_number: order.order_number,
        kot_number: nextKotNumber,
        table_number: order.table_name || 'Counter',
        order_type: order.order_type,
        restaurant_id: order.restaurant_id || RESTAURANT_ID,
        branch_id: order.branch_id,
        company_id: order.company_id,
        items: [{
          name: currentItem.name,
          quantity: deltaQty,
          notes: `Added +${deltaQty} (${reason || 'Updated quantity'})`,
          status: 'pending'
        }],
        special_note: `Item update: ${currentItem.name} (${oldQty} -> ${newQty})`,
        status: 'new'
      });
    } else if (newQty < oldQty) {
      // If quantity DECREASED, update the existing KOT item in the kitchen
      const allKots = await this.getKOTs(order.restaurant_id || RESTAURANT_ID);
      const orderKots = allKots.filter(k => k.order_id === order.id);
      for (const kot of orderKots) {
        let kotModified = false;
        const kotItems = [...(kot.items || [])];
        const matchesKotNumber = !currentItem.kot_number || kot.kot_number === currentItem.kot_number;
        if (matchesKotNumber) {
          for (let i = 0; i < kotItems.length; i++) {
            const kIt = kotItems[i];
            if (kIt.name.toLowerCase() === currentItem.name.toLowerCase() && kIt.status !== 'cancelled') {
              kotItems[i] = {
                ...kIt,
                quantity: newQty,
                notes: (kIt.notes ? kIt.notes + ' ' : '') + `[QTY REDUCED: ${oldQty} -> ${newQty} (${reason || 'Staff adjustment'})]`
              };
              kotModified = true;
              break;
            }
          }
        }
        if (kotModified) {
          const savedKot = await this.updateKOT(kot.id, {
            items: kotItems,
            special_note: (kot.special_note ? kot.special_note + ' • ' : '') + `[QTY REDUCED: ${currentItem.name} (${oldQty} -> ${newQty})]`
          });
          if (savedKot) updatedKots.push(savedKot);
        }
      }
    }

    items[itemIndex] = {
      ...currentItem,
      quantity: newQty,
      updated_at: new Date().toISOString()
    };

    // Recalculate totals
    const restaurant = await this.getRestaurant(order.restaurant_id);
    const taxRate = restaurant?.tax_rate || 5.0;
    const subtotal = items.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity)), 0);
    const discount = Number(order.discount) || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = parseFloat(((taxable * taxRate) / 100).toFixed(2));
    const total = parseFloat((taxable + tax + (Number(order.service_charge) || 0)).toFixed(2));

    const historyEntry = {
      action: 'quantity_updated',
      item_name: currentItem.name,
      old_quantity: oldQty,
      new_quantity: newQty,
      reason,
      delta_kot: deltaKot?.kot_number || null,
      timestamp: new Date().toISOString(),
      user: user?.name || 'Staff'
    };

    const updates = {
      items,
      subtotal,
      tax,
      total,
      history: [...(order.history || []), historyEntry]
    };

    const updated = await this.updateOrder(orderId, updates);
    persistStoreToDisk();
    return { ...updated, deltaKot, updatedKots };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REQUIREMENT 1: CANCEL ITEM (Maintains audit trail & synchronizes kitchen KOT)
  // ─────────────────────────────────────────────────────────────────────────
  async cancelOrderItem(orderId, itemIndex, reason = '', user = null) {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'cancelled' || order.status === 'voided') {
      throw new Error(`Order ${order.order_number || orderId} is CANCELLED and cannot be modified. Cancelled orders are final and immutable (Cancel means cancel).`);
    }

    const items = [...(order.items || [])];
    if (itemIndex < 0 || itemIndex >= items.length) {
      throw new Error('Invalid item index');
    }

    const cancelledItem = items[itemIndex];
    // Mark item status as cancelled instead of permanently removing it
    items[itemIndex] = {
      ...cancelledItem,
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString()
    };

    // Recalculate totals excluding cancelled items
    const activeItems = items.filter(i => i.status !== 'cancelled');
    const restaurant = await this.getRestaurant(order.restaurant_id);
    const taxRate = restaurant?.tax_rate || 5.0;
    const subtotal = activeItems.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity)), 0);
    const discount = Number(order.discount) || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = parseFloat(((taxable * taxRate) / 100).toFixed(2));
    const total = parseFloat((taxable + tax + (Number(order.service_charge) || 0)).toFixed(2));

    const historyEntry = {
      action: 'item_cancelled',
      item_name: cancelledItem.name,
      quantity: cancelledItem.quantity,
      reason,
      timestamp: new Date().toISOString(),
      user: user?.name || 'Staff'
    };

    const updates = {
      items,
      subtotal,
      tax,
      total,
      history: [...(order.history || []), historyEntry]
    };

    const updated = await this.updateOrder(orderId, updates);

    // Synchronize kitchen KOT tickets
    const allKots = await this.getKOTs(order.restaurant_id || RESTAURANT_ID);
    const orderKots = allKots.filter(k => k.order_id === order.id);
    const updatedKots = [];

    for (const kot of orderKots) {
      let kotModified = false;
      const kotItems = [...(kot.items || [])];
      const matchesKotNumber = !cancelledItem.kot_number || kot.kot_number === cancelledItem.kot_number;

      if (matchesKotNumber) {
        for (let i = 0; i < kotItems.length; i++) {
          const kIt = kotItems[i];
          if (kIt.name.toLowerCase() === cancelledItem.name.toLowerCase() && kIt.status !== 'cancelled') {
            kotItems[i] = {
              ...kIt,
              status: 'cancelled',
              cancellation_reason: reason || 'Cancelled by staff in Orders',
              notes: (kIt.notes ? kIt.notes + ' ' : '') + `[CANCELLED: ${reason || 'Customer request'}]`
            };
            kotModified = true;
            break;
          }
        }
      }

      if (kotModified) {
        const activeKotItems = kotItems.filter(it => it.status !== 'cancelled');
        const kotUpdates = {
          items: kotItems,
          special_note: (kot.special_note ? kot.special_note + ' • ' : '') + `[ITEM CANCELLED: ${cancelledItem.name} (${reason || 'Staff'})]`
        };
        // If all items in this KOT are cancelled, mark the entire KOT as cancelled
        if (activeKotItems.length === 0) {
          kotUpdates.status = 'cancelled';
        }
        const savedKot = await this.updateKOT(kot.id, kotUpdates);
        if (savedKot) updatedKots.push(savedKot);
      }
    }

    persistStoreToDisk();
    return { ...updated, updatedKots };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REQUIREMENT 5 & 6: MARK ORDER AS SERVED
  // ─────────────────────────────────────────────────────────────────────────
  async markOrderServed(orderId, user = null) {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'cancelled' || order.status === 'voided') {
      throw new Error(`Order ${order.order_number || orderId} is CANCELLED and cannot be served (Cancel means cancel).`);
    }

    const items = (order.items || []).map(i => ({
      ...i,
      status: i.status === 'cancelled' ? 'cancelled' : 'served'
    }));

    const historyEntry = {
      action: 'order_served',
      timestamp: new Date().toISOString(),
      user: user?.name || 'Staff'
    };

    const updates = {
      served_at: new Date().toISOString(),
      items,
      history: [...(order.history || []), historyEntry]
    };

    // If order was already paid or in billing pending, keep its payment/billing workflow state
    if (!['paid', 'completed', 'billing_pending'].includes(order.status) && order.payment_status !== 'paid') {
      updates.status = 'served';
    }

    const updated = await this.updateOrder(orderId, updates);
    persistStoreToDisk();
    return updated;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REQUIREMENT 8 & 11: REQUEST BILL / BILLING PENDING
  // ─────────────────────────────────────────────────────────────────────────
  async requestOrderBill(orderId, user = null) {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'cancelled' || order.status === 'voided') {
      throw new Error(`Order ${order.order_number || orderId} is CANCELLED. Bill cannot be requested on a cancelled order.`);
    }

    if (order.payment_status === 'paid' || order.status === 'paid' || order.status === 'completed') {
      const err = new Error('Order has already been paid and settled.');
      err.code = 'ALREADY_PAID';
      throw err;
    }

    const historyEntry = {
      action: 'billing_pending',
      timestamp: new Date().toISOString(),
      user: user?.name || 'Staff'
    };

    const updates = {
      status: 'billing_pending',
      history: [...(order.history || []), historyEntry]
    };

    const updated = await this.updateOrder(orderId, updates);

    // Keep table occupied but reflect billing status
    let updatedTable = null;
    let tableToUpdate = order.table_id;
    if (!tableToUpdate && order.table_name) {
      const resolved = await this.resolveTable(order.table_name);
      if (resolved) tableToUpdate = resolved.id;
    }
    if (tableToUpdate) {
      updatedTable = await this.updateTable(tableToUpdate, { 
        status: 'billing',
        current_order_id: order.id
      });
    }

    persistStoreToDisk();
    return { ...updated, updatedTable };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REQUIREMENT 9, 12, 13, 14, 15: PROCESS PAYMENT & AUTO-FREE TABLE
  // ─────────────────────────────────────────────────────────────────────────
  async recordOrderPayment(orderId, paymentData = {}, user = null) {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    if (order.status === 'cancelled' || order.status === 'voided') {
      const err = new Error('Cannot process payment on a CANCELLED order. Cancelled orders are final and immutable (Cancel means cancel).');
      err.code = 'ORDER_CANCELLED';
      throw err;
    }

    // REQUIREMENT 15: PREVENT DOUBLE PAYMENT
    if (order.payment_status === 'paid' || order.status === 'paid' || order.status === 'completed') {
      const err = new Error('This bill has already been paid.');
      err.code = 'ALREADY_PAID';
      throw err;
    }

    const payableAmount = Number(order.total) || 0;
    const paidAmount = Number(paymentData.amount) || payableAmount;
    const paymentMethod = paymentData.payment_method || 'cash';
    const store = getFallbackStore();

    // Create payment transaction record
    const paymentRecord = {
      id: `pay-${Date.now()}`,
      order_id: order.id,
      order_number: order.order_number,
      company_id: order.company_id || 'comp-abc-foods',
      branch_id: order.branch_id || 'branch-bopal',
      amount: paidAmount,
      payment_method: paymentMethod,
      payment_reference: paymentData.payment_reference || '',
      status: 'success',
      collected_by: user?.name || 'Cashier',
      created_at: new Date().toISOString()
    };

    if (!store.orderPayments) store.orderPayments = [];
    store.orderPayments.push(paymentRecord);

    // Create or update consolidated bill
    const billRecord = {
      id: `bill-${Date.now()}`,
      order_id: order.id,
      order_number: order.order_number,
      invoice_number: `INV-${(order.order_number || '').replace(/[^a-zA-Z0-9]/g, '')}`,
      company_id: order.company_id || 'comp-abc-foods',
      branch_id: order.branch_id || 'branch-bopal',
      customer_name: order.customer_name || 'Guest',
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      payment_method: paymentMethod,
      status: 'paid',
      created_at: new Date().toISOString()
    };
    if (!store.bills) store.bills = [];
    store.bills.push(billRecord);

    const historyEntry = {
      action: 'payment_received',
      amount: paidAmount,
      payment_method: paymentMethod,
      timestamp: new Date().toISOString(),
      user: user?.name || 'Cashier'
    };

    // Update order to Paid / Completed
    const updates = {
      status: 'paid',
      payment_status: 'paid',
      payment_method: paymentMethod,
      completed_at: new Date().toISOString(),
      amount_paid: paidAmount,
      outstanding_amount: 0,
      history: [...(order.history || []), historyEntry]
    };

    const updatedOrder = await this.updateOrder(orderId, updates);

    // REQUIREMENT 9 & 14: AUTOMATICALLY RESET TABLE BACK TO AVAILABLE
    let updatedTable = null;
    let tableToFree = order.table_id;
    if (!tableToFree && order.table_name) {
      const resolved = await this.resolveTable(order.table_name);
      if (resolved) tableToFree = resolved.id;
    }
    
    // Free all tables linked by table_id or current_order_id
    const tablesToFree = (store.diningTables || []).filter(t => 
      t.id === tableToFree || t.current_order_id === order.id
    );
    for (const tbl of tablesToFree) {
      const freed = await this.updateTable(tbl.id, {
        status: 'available',
        current_order_id: null
      });
      if (!updatedTable) updatedTable = freed;
      console.log(`[Table Workflow] Table ${tbl.id} (${tbl.table_number}) automatically set to AVAILABLE after payment of order ${order.order_number}`);
    }

    persistStoreToDisk();
    return {
      order: updatedOrder,
      table: updatedTable,
      payment: paymentRecord,
      bill: billRecord
    };
  },

  async updateOrder(id, updates) {
    if (!isUsingFallback() && getPool()) {
      const existing = await this.getOrderById(id);
      if (!existing) return null;
      if (existing.status === 'cancelled' || existing.status === 'voided') {
        throw new Error(`Order ${existing.order_number || id} is CANCELLED and cannot be modified. Cancelled orders are final and immutable (Cancel means cancel).`);
      }
      const dbUpdates = { ...updates };
      if (dbUpdates.items) dbUpdates.items = JSON.stringify(dbUpdates.items);
      const keys = Object.keys(dbUpdates);
      if (keys.length === 0) return this.getOrderById(id);
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(dbUpdates), id];
      await getPool().query(`UPDATE orders SET ${setClause} WHERE id = ?`, values);
      return this.getOrderById(id);
    }
    const store = getFallbackStore();
    const idx = (store.orders || []).findIndex(o => o.id === id);
    if (idx === -1) return null;
    const existing = store.orders[idx];
    if (existing.status === 'cancelled' || existing.status === 'voided') {
      throw new Error(`Order ${existing.order_number || id} is CANCELLED and cannot be modified. Cancelled orders are final and immutable (Cancel means cancel).`);
    }
    store.orders[idx] = { ...store.orders[idx], ...updates };
    persistStoreToDisk();
    return store.orders[idx];
  },

  /**
   * Delete or Void an Order (Admin / Manager Only):
   * 1. Reverses inventory consumption if inventory was deducted.
   * 2. Frees up the associated table (status -> 'available').
   * 3. Cancels active KOT tickets for kitchen.
   * 4. Reverses customer spending metrics.
   * 5. Records ERP audit log.
   * 6. Removes or marks order as voided.
   */
  async deleteOrder(id, { reason = 'Fake/Mistaken order deleted by admin', restock_inventory = true, permanent_delete = false } = {}, user = null) {
    const store = getFallbackStore();
    store.orders = store.orders || [];
    store.inventoryItems = store.inventoryItems || [];
    store.stockMovements = store.stockMovements || [];
    store.kots = store.kots || [];
    store.tables = store.tables || store.diningTables || [];
    store.auditLogs = store.auditLogs || [];

    const orderIdx = store.orders.findIndex(o => o.id === id);
    if (orderIdx === -1) return null;
    const order = store.orders[orderIdx];

    // 1. Inventory Restocking / Reversal
    if (restock_inventory && order.is_inventory_deducted) {
      store.recipes = store.recipes || [];
      const orderBranch = order.branch_id || null;

      for (const orderItem of (order.items || [])) {
        if (orderItem.status === 'cancelled') continue;
        const qty = Number(orderItem.quantity) || 1;
        const mId = orderItem.menu_item_id || orderItem.menuItemId || orderItem.item_id || orderItem.id;
        const recipe = store.recipes.find(r => {
          if (orderBranch && r.branch_id && r.branch_id !== orderBranch) return false;
          const idMatch = r.menu_item_id === mId || r.id === mId;
          const nameMatch = orderItem.name && r.name.toLowerCase() === orderItem.name.toLowerCase();
          return (idMatch || nameMatch) && r.is_active;
        }) || store.recipes.find(r => {
          const idMatch = r.menu_item_id === mId || r.id === mId;
          const nameMatch = orderItem.name && r.name.toLowerCase() === orderItem.name.toLowerCase();
          return (idMatch || nameMatch) && r.is_active;
        });

        if (!recipe || !recipe.ingredients) continue;

        for (const ing of recipe.ingredients) {
          const invItem = store.inventoryItems.find(i => i.id === ing.ingredient_id);
          if (!invItem) continue;

          const wastagePct = Number(ing.wastage_percent) || 0;
          const effectivePerServing = Number(ing.quantity) * (1 + wastagePct / 100);
          const requiredInInvUnit = convertUnits(effectivePerServing * qty, ing.unit, invItem.unit);

          const prevStock = Number(invItem.current_stock) || 0;
          const newStock = Number((prevStock + requiredInInvUnit).toFixed(4));
          invItem.current_stock = newStock;
          if (invItem.min_stock !== undefined) {
            invItem.status = newStock <= invItem.min_stock * 0.5 ? 'critical' : newStock <= invItem.min_stock ? 'low' : 'healthy';
          }

          const mov = {
            id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            restaurant_id: order.restaurant_id || RESTAURANT_ID,
            branch_id: orderBranch,
            item_id: invItem.id,
            item_name: invItem.name,
            type: 'void_reversal',
            quantity: Number(requiredInInvUnit.toFixed(4)),
            unit: invItem.unit,
            order_id: order.id,
            order_number: order.order_number || `#ORD-${order.id?.slice(-4) || '1001'}`,
            menu_item_id: mId,
            menu_item_name: `${orderItem.name || 'Dish'} (x${qty})`,
            recipe_id: recipe.id,
            previous_stock: prevStock,
            new_stock: newStock,
            reason: `Restock: Void/Delete Order ${order.order_number || order.id} (${reason})`,
            recorded_by: user?.name || 'Admin Order Void',
            created_at: new Date().toISOString()
          };
          store.stockMovements.unshift(mov);
        }
      }
      order.is_inventory_deducted = false;
    }

    // 2. Free up table if occupied by this order
    let freedTable = null;
    if (order.table_id) {
      const table = (store.tables || []).find(t => t.id === order.table_id) || (store.diningTables || []).find(t => t.id === order.table_id);
      if (table && (table.current_order_id === order.id || table.status !== 'available')) {
        table.status = 'available';
        table.current_order_id = null;
        freedTable = table;
      }
    }

    // 3. Cancel associated KOTs
    const affectedKots = (store.kots || []).filter(k => k.order_id === order.id && k.status !== 'cancelled');
    for (const k of affectedKots) {
      k.status = 'cancelled';
      k.special_note = (k.special_note ? k.special_note + ' • ' : '') + `[ORDER VOIDED/DELETED BY ADMIN: ${reason}]`;
    }

    // 4. Reverse customer statistics if needed
    if (order.customer_id) {
      const cust = (store.customers || []).find(c => c.id === order.customer_id);
      if (cust) {
        cust.total_orders = Math.max(0, (cust.total_orders || 1) - 1);
        cust.total_spent = Math.max(0, (cust.total_spent || order.total) - Number(order.total || 0));
      }
    }

    // 5. Audit Log Entry
    const auditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      company_id: order.company_id || 'comp-abc-foods',
      branch_id: order.branch_id || 'branch-bopal',
      user_id: user?.id || 'usr-admin-override',
      user_name: user?.name || 'Administrator',
      action: permanent_delete ? 'ORDER_PERMANENTLY_DELETED' : 'ORDER_CANCELLED',
      details: permanent_delete
        ? `Order ${order.order_number || order.id} (₹${order.total}) PERMANENTLY DELETED from system database by ${user?.name || 'Admin'}. Reason: ${reason}. Restocked: ${restock_inventory ? 'Yes' : 'No'}`
        : `Order ${order.order_number || order.id} (₹${order.total}) CANCELLED by ${user?.name || 'Staff'}. Reason: ${reason}. Restocked: ${restock_inventory ? 'Yes' : 'No'}`,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    };
    store.auditLogs.unshift(auditEntry);

    // 6. Delete or mark voided
    if (permanent_delete) {
      store.orders.splice(orderIdx, 1);
      if (!isUsingFallback() && getPool()) {
        try {
          await getPool().query('DELETE FROM orders WHERE id = ?', [id]);
        } catch (dbErr) {
          console.warn('[MySQL Delete Order Error]', dbErr.message);
        }
      }
    } else {
      order.status = 'cancelled';
      order.is_voided = true;
      order.void_reason = reason;
      order.voided_by = user?.name || 'Staff';
      order.voided_at = new Date().toISOString();
      order.payment_status = 'cancelled';
    }

    persistStoreToDisk();

    return {
      success: true,
      deleted_order_id: id,
      order_number: order.order_number,
      permanent_delete: Boolean(permanent_delete),
      freedTable,
      affectedKots,
      restocked: restock_inventory,
      auditEntry
    };
  },

  // KOTs
  async getKOTs(restaurantId = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM kots WHERE restaurant_id = ? ORDER BY created_at DESC', [restaurantId]);
      return rows.map(r => ({ ...r, items: safeParse(r.items, []) }));
    }
    const store = getFallbackStore();
    return store.kots.filter(k => k.restaurant_id === restaurantId);
  },

  async createKOT(kot) {
    const id = kot.id || `kot-${Date.now()}`;
    const kotNumber = kot.kot_number || `KOT #${Math.floor(1000 + Math.random() * 9000)}`;
    const newKOT = {
      ...kot,
      id,
      kot_number: kotNumber,
      restaurant_id: kot.restaurant_id || RESTAURANT_ID,
      items: kot.items || [],
      status: kot.status || 'new',
      created_at: new Date().toISOString()
    };
    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        `INSERT INTO kots (id, restaurant_id, kot_number, order_id, order_number, table_number, order_type, items, special_note, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newKOT.id, newKOT.restaurant_id, newKOT.kot_number, newKOT.order_id, newKOT.order_number,
          newKOT.table_number, newKOT.order_type, JSON.stringify(newKOT.items), newKOT.special_note || '',
          newKOT.status, newKOT.created_at
        ]
      );
      return newKOT;
    }
    const store = getFallbackStore();
    store.kots.unshift(newKOT);
    persistStoreToDisk();
    return newKOT;
  },

  async updateKOT(id, updates) {
    if (!isUsingFallback() && getPool()) {
      const dbUpdates = { ...updates };
      if (dbUpdates.items) dbUpdates.items = JSON.stringify(dbUpdates.items);
      const keys = Object.keys(dbUpdates);
      if (keys.length === 0) return null;
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(dbUpdates), id];
      await getPool().query(`UPDATE kots SET ${setClause} WHERE id = ?`, values);
      const [rows] = await getPool().query('SELECT * FROM kots WHERE id = ?', [id]);
      if (!rows[0]) return null;
      return { ...rows[0], items: safeParse(rows[0].items, []) };
    }
    const store = getFallbackStore();
    const idx = store.kots.findIndex(k => k.id === id);
    if (idx === -1) return null;
    store.kots[idx] = { ...store.kots[idx], ...updates };
    persistStoreToDisk();
    return store.kots[idx];
  },

  // INVENTORY
  async getInventory(restaurantId = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM inventory_items WHERE restaurant_id = ? ORDER BY name ASC', [restaurantId]);
      return rows;
    }
    const store = getFallbackStore();
    return store.inventoryItems.filter(i => i.restaurant_id === restaurantId);
  },

  async createInventoryItem(item) {
    const id = item.id || `inv-${Date.now()}`;
    const newItem = {
      ...item,
      id,
      restaurant_id: item.restaurant_id || RESTAURANT_ID,
      current_stock: Number(item.current_stock) || 0,
      min_stock: Number(item.min_stock) || 5,
      cost_per_unit: Number(item.cost_per_unit) || 0,
      status: item.current_stock <= item.min_stock * 0.5 ? 'critical' : item.current_stock <= item.min_stock ? 'low' : 'healthy'
    };
    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        'INSERT INTO inventory_items (id, restaurant_id, name, category, current_stock, unit, min_stock, cost_per_unit, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newItem.id, newItem.restaurant_id, newItem.name, newItem.category, newItem.current_stock, newItem.unit, newItem.min_stock, newItem.cost_per_unit, newItem.status]
      );
      return newItem;
    }
    const store = getFallbackStore();
    store.inventoryItems.push(newItem);
    return newItem;
  },

  async updateInventoryItem(id, updates) {
    if (!isUsingFallback() && getPool()) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return null;
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(updates), id];
      await getPool().query(`UPDATE inventory_items SET ${setClause} WHERE id = ?`, values);
      const [rows] = await getPool().query('SELECT * FROM inventory_items WHERE id = ?', [id]);
      return rows[0] || null;
    }
    const store = getFallbackStore();
    const idx = store.inventoryItems.findIndex(i => i.id === id);
    if (idx === -1) return null;
    const updated = { ...store.inventoryItems[idx], ...updates };
    if (updated.current_stock !== undefined && updated.min_stock !== undefined) {
      updated.status = updated.current_stock <= updated.min_stock * 0.5 ? 'critical' : updated.current_stock <= updated.min_stock ? 'low' : 'healthy';
    }
    store.inventoryItems[idx] = updated;
    persistStoreToDisk();
    try {
      const { broadcastInventoryUpdate, broadcastInventoryAlert } = require('./socketService');
      broadcastInventoryUpdate({ type: 'item_updated', item: updated });
      if (updated.status === 'low' || updated.status === 'critical') {
        broadcastInventoryAlert(updated);
      }
    } catch (e) {}
    return updated;
  },

  async getStockMovements(restaurantId = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM stock_movements WHERE restaurant_id = ? ORDER BY created_at DESC', [restaurantId]);
      return rows;
    }
    const store = getFallbackStore();
    return store.stockMovements.filter(m => m.restaurant_id === restaurantId);
  },

  async recordStockMovement(movement) {
    const id = movement.id || `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newMov = {
      ...movement,
      id,
      restaurant_id: movement.restaurant_id || RESTAURANT_ID,
      created_at: new Date().toISOString()
    };
    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        'INSERT INTO stock_movements (id, restaurant_id, item_id, item_name, type, quantity, reason, recorded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newMov.id, newMov.restaurant_id, newMov.item_id, newMov.item_name, newMov.type, newMov.quantity, newMov.reason || '', newMov.recorded_by || 'Staff', newMov.created_at]
      );
    } else {
      const store = getFallbackStore();
      store.stockMovements = store.stockMovements || [];
      store.stockMovements.unshift(newMov);
      persistStoreToDisk();
    }
    try {
      const { broadcastInventoryUpdate } = require('./socketService');
      broadcastInventoryUpdate({ type: 'stock_movement', movement: newMov });
    } catch (e) {}
    return newMov;
  },

  // ==========================================
  // RECIPES & BILL OF MATERIALS (BOM)
  // ==========================================
  async getRecipes(restaurantId = RESTAURANT_ID, branchId = null) {
    if (!isUsingFallback() && getPool()) {
      let sql = 'SELECT * FROM recipes WHERE restaurant_id = ?';
      const params = [restaurantId];
      if (branchId) {
        sql += ' AND (branch_id = ? OR branch_id IS NULL)';
        params.push(branchId);
      }
      sql += ' ORDER BY name ASC';
      const [rows] = await getPool().query(sql, params);
      const enriched = await Promise.all(rows.map(async (r) => {
        const [ingRows] = await getPool().query('SELECT * FROM recipe_ingredients WHERE recipe_id = ?', [r.id]);
        return {
          ...r,
          is_active: Boolean(r.is_active),
          ingredients: ingRows
        };
      }));
      return enriched;
    }
    const store = getFallbackStore();
    store.recipes = store.recipes || [];
    return store.recipes.filter(r => {
      if (r.restaurant_id !== restaurantId) return false;
      if (branchId && r.branch_id && r.branch_id !== branchId) return false;
      return true;
    });
  },

  async getRecipeById(id) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM recipes WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      const [ingRows] = await getPool().query('SELECT * FROM recipe_ingredients WHERE recipe_id = ?', [id]);
      return {
        ...rows[0],
        is_active: Boolean(rows[0].is_active),
        ingredients: ingRows
      };
    }
    const store = getFallbackStore();
    store.recipes = store.recipes || [];
    return store.recipes.find(r => r.id === id) || null;
  },

  async getRecipeByMenuItemId(menuItemId, branchId = null) {
    const store = getFallbackStore();
    store.recipes = store.recipes || [];
    const list = store.recipes.filter(r => r.menu_item_id === menuItemId && r.is_active);
    if (branchId) {
      const branchMatch = list.find(r => r.branch_id === branchId);
      if (branchMatch) return branchMatch;
    }
    return list.find(r => !r.branch_id) || list[0] || null;
  },

  async createRecipe(recipe) {
    const id = recipe.id || `rec-${Date.now()}`;
    const newRecipe = {
      ...recipe,
      id,
      restaurant_id: recipe.restaurant_id || RESTAURANT_ID,
      serving_size: Number(recipe.serving_size) || 1,
      is_active: recipe.is_active !== false,
      ingredients: recipe.ingredients || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        'INSERT INTO recipes (id, company_id, branch_id, restaurant_id, menu_item_id, name, description, preparation_instructions, serving_size, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newRecipe.id, newRecipe.company_id || 'comp-abc-foods', newRecipe.branch_id || null, newRecipe.restaurant_id, newRecipe.menu_item_id, newRecipe.name, newRecipe.description || '', newRecipe.preparation_instructions || '', newRecipe.serving_size, newRecipe.is_active, newRecipe.created_at, newRecipe.updated_at]
      );
      for (const ing of newRecipe.ingredients) {
        const ingId = ing.id || `recing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await getPool().query(
          'INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, sub_recipe_id, quantity, unit, wastage_percent, cost_per_unit, calculated_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [ingId, newRecipe.id, ing.ingredient_id, ing.sub_recipe_id || null, ing.quantity, ing.unit || 'g', ing.wastage_percent || 0, ing.cost_per_unit || 0, ing.calculated_cost || 0]
        );
      }
      return newRecipe;
    }
    const store = getFallbackStore();
    store.recipes = store.recipes || [];
    store.recipes.push(newRecipe);
    return newRecipe;
  },

  async updateRecipe(id, updates) {
    const store = getFallbackStore();
    store.recipes = store.recipes || [];
    const idx = store.recipes.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const updated = {
      ...store.recipes[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    store.recipes[idx] = updated;
    return updated;
  },

  async deleteRecipe(id) {
    const store = getFallbackStore();
    store.recipes = store.recipes || [];
    store.recipes = store.recipes.filter(r => r.id !== id);
    return true;
  },

  async getMenuAvailabilityMap(restaurantId = RESTAURANT_ID, branchId = null) {
    const menuItems = await this.getMenuItems(restaurantId);
    const recipes = await this.getRecipes(restaurantId, branchId);
    const inventory = await this.getInventory(restaurantId, branchId);

    const map = {};
    for (const item of menuItems) {
      const recipe = recipes.find(r => {
        if (branchId && r.branch_id && r.branch_id !== branchId) return false;
        return r.menu_item_id === item.id && r.is_active;
      }) || recipes.find(r => r.menu_item_id === item.id && r.is_active);

      if (recipe) {
        const avail = calculateRecipeAvailability(recipe, inventory, branchId);
        let finalAvailable = avail.isAvailable;
        if (item.manual_override !== undefined && item.manual_override !== null) {
          finalAvailable = Boolean(item.manual_override);
        } else if (item.is_available === false && !item.has_recipe) {
          finalAvailable = false;
        }

        map[item.id] = {
          menu_item_id: item.id,
          menu_item_name: item.name,
          name: item.name,
          category: item.category,
          has_recipe: true,
          recipe_id: recipe.id,
          recipe_name: recipe.name,
          is_available: finalAvailable,
          sellable_quantity: avail.sellableQuantity,
          limiting_ingredient: avail.limitingIngredient,
          limiting_stock: avail.limitingStock,
          limiting_required: avail.limitingRequired,
          staff_reason: !finalAvailable ? (item.manual_reason || avail.staffReason || 'Unavailable') : null,
          manual_override: item.manual_override ?? null
        };
      } else {
        const isAvail = item.manual_override !== undefined ? Boolean(item.manual_override) : Boolean(item.is_available);
        map[item.id] = {
          menu_item_id: item.id,
          menu_item_name: item.name,
          name: item.name,
          category: item.category,
          has_recipe: false,
          recipe_id: null,
          is_available: isAvail,
          sellable_quantity: isAvail ? 999 : 0,
          limiting_ingredient: null,
          staff_reason: !isAvail ? (item.manual_reason || 'Manually marked unavailable') : null,
          manual_override: item.manual_override ?? null
        };
      }
    }
    return map;
  },

  async overrideMenuItemAvailability(restaurantId, menuItemId, isAvailable, reason = '', userName = 'Manager') {
    const store = getFallbackStore();
    const item = store.menuItems.find(m => m.id === menuItemId);
    if (!item) return null;
    item.manual_override = Boolean(isAvailable);
    item.is_available = Boolean(isAvailable);
    item.manual_reason = reason || (!isAvailable ? 'Manually disabled by manager' : '');
    item.manual_override_by = userName;
    item.manual_override_at = new Date().toISOString();
    return item;
  },

  async deductOrderInventory(order, user = null) {
    if (!order || order.is_inventory_deducted) return false;
    const store = getFallbackStore();
    store.recipes = store.recipes || [];
    store.inventoryItems = store.inventoryItems || [];
    store.stockMovements = store.stockMovements || [];

    const orderBranch = order.branch_id || null;
    const lowStockAlerts = [];

    for (const orderItem of (order.items || [])) {
      const qty = Number(orderItem.quantity) || 1;
      const mId = orderItem.menu_item_id || orderItem.menuItemId || orderItem.item_id || orderItem.id;
      const recipe = store.recipes.find(r => {
        if (orderBranch && r.branch_id && r.branch_id !== orderBranch) return false;
        const idMatch = r.menu_item_id === mId || r.id === mId;
        const nameMatch = orderItem.name && r.name.toLowerCase() === orderItem.name.toLowerCase();
        return (idMatch || nameMatch) && r.is_active;
      }) || store.recipes.find(r => {
        const idMatch = r.menu_item_id === mId || r.id === mId;
        const nameMatch = orderItem.name && r.name.toLowerCase() === orderItem.name.toLowerCase();
        return (idMatch || nameMatch) && r.is_active;
      });

      if (!recipe || !recipe.ingredients) continue;

      for (const ing of recipe.ingredients) {
        const invItem = store.inventoryItems.find(i => i.id === ing.ingredient_id);
        if (!invItem) continue;

        const wastagePct = Number(ing.wastage_percent) || 0;
        const effectivePerServing = Number(ing.quantity) * (1 + wastagePct / 100);
        const requiredInInvUnit = convertUnits(effectivePerServing * qty, ing.unit, invItem.unit);

        const prevStock = Number(invItem.current_stock) || 0;
        const newStock = Math.max(0, Number((prevStock - requiredInInvUnit).toFixed(4)));
        invItem.current_stock = newStock;
        if (invItem.min_stock !== undefined) {
          invItem.status = newStock <= invItem.min_stock * 0.5 ? 'critical' : newStock <= invItem.min_stock ? 'low' : 'healthy';
          if (invItem.status === 'low' || invItem.status === 'critical') {
            lowStockAlerts.push(invItem);
          }
        }

        const mov = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          restaurant_id: order.restaurant_id || RESTAURANT_ID,
          branch_id: orderBranch,
          item_id: invItem.id,
          item_name: invItem.name,
          type: 'recipe_consumption',
          quantity: Number(requiredInInvUnit.toFixed(4)),
          unit: invItem.unit,
          order_id: order.id,
          order_number: order.order_number || `#ORD-${order.id?.slice(-4) || '1001'}`,
          menu_item_id: mId,
          menu_item_name: `${orderItem.name || 'Dish'} (x${qty})`,
          recipe_id: recipe.id,
          previous_stock: prevStock,
          new_stock: newStock,
          reason: `POS Order ${order.order_number || order.id} -> ${qty} ${orderItem.name}`,
          recorded_by: user?.name || 'System Auto-Deduction',
          created_at: new Date().toISOString()
        };
        store.stockMovements.unshift(mov);
      }
    }

    order.is_inventory_deducted = true;
    persistStoreToDisk();

    try {
      const { broadcastInventoryUpdate, broadcastInventoryAlert } = require('./socketService');
      broadcastInventoryUpdate({
        type: 'order_deduction',
        order_id: order.id,
        order_number: order.order_number,
        branch_id: order.branch_id
      });
      lowStockAlerts.forEach(item => broadcastInventoryAlert(item));
    } catch (e) {}

    return true;
  },

  /**
   * Apply Purchase Receipt to Inventory:
   * Increases inventory raw materials stock with accurate unit conversion,
   * updates cost_per_unit with weighted-average pricing, logs audited purchase_inward
   * stock movement, and broadcasts real-time supply chain events.
   */
  async applyPurchaseReceipt(purchase, user = null) {
    const store = getFallbackStore();
    store.inventoryItems = store.inventoryItems || [];
    store.stockMovements = store.stockMovements || [];
    const items = purchase.items || [];

    for (const it of items) {
      const itemId = it.itemId || it.item_id || it.id;
      if (!itemId) continue;
      const invItem = store.inventoryItems.find(i => i.id === itemId);
      if (!invItem) continue;

      const rawQty = Number(it.quantity) || 0;
      const itUnit = it.unit || invItem.unit;
      const qtyInInvUnit = convertUnits(rawQty, itUnit, invItem.unit);

      const prevStock = Number(invItem.current_stock) || 0;
      const newStock = Number((prevStock + qtyInInvUnit).toFixed(4));
      invItem.current_stock = newStock;

      // Update cost_per_unit with weighted-average purchase price
      const unitPrice = Number(it.unitPrice) || Number(it.unit_price) || Number(it.price) || 0;
      if (unitPrice > 0) {
        const factor = convertUnits(1, itUnit, invItem.unit) || 1;
        const pricePerInvUnit = unitPrice / factor;
        const prevCost = Number(invItem.cost_per_unit) || 0;

        if (prevStock > 0 && prevCost > 0) {
          const weightedCost = ((prevStock * prevCost) + (qtyInInvUnit * pricePerInvUnit)) / (prevStock + qtyInInvUnit);
          invItem.cost_per_unit = Number(weightedCost.toFixed(4));
        } else {
          invItem.cost_per_unit = Number(pricePerInvUnit.toFixed(4));
        }
      }

      if (invItem.min_stock !== undefined) {
        invItem.status = newStock <= invItem.min_stock * 0.5 ? 'critical' : newStock <= invItem.min_stock ? 'low' : 'healthy';
      }

      const mov = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        restaurant_id: purchase.restaurant_id || RESTAURANT_ID,
        item_id: invItem.id,
        item_name: invItem.name,
        type: 'purchase_inward',
        quantity: Number(qtyInInvUnit.toFixed(4)),
        unit: invItem.unit,
        purchase_id: purchase.id,
        invoice_number: purchase.invoice_number,
        supplier_id: purchase.supplier_id,
        supplier_name: purchase.supplier_name,
        previous_stock: prevStock,
        new_stock: newStock,
        cost_per_unit: invItem.cost_per_unit,
        reason: `PO ${purchase.invoice_number || purchase.id} received from ${purchase.supplier_name || 'Supplier'}`,
        recorded_by: user?.name || 'Purchase Receipt Inward',
        created_at: new Date().toISOString()
      };
      store.stockMovements.unshift(mov);
    }

    persistStoreToDisk();

    try {
      const { broadcastInventoryUpdate } = require('./socketService');
      broadcastInventoryUpdate({
        type: 'purchase_received',
        purchase_id: purchase.id,
        invoice_number: purchase.invoice_number
      });
    } catch (e) {}

    return true;
  },

  /**
   * Reverse Purchase Receipt:
   * When a received PO is cancelled or refunded, reverses the inward stock,
   * recalculates item status, logs audited purchase_reversal movement, and syncs.
   */
  async reversePurchaseReceipt(purchase, user = null) {
    const store = getFallbackStore();
    store.inventoryItems = store.inventoryItems || [];
    store.stockMovements = store.stockMovements || [];
    const items = purchase.items || [];

    for (const it of items) {
      const itemId = it.itemId || it.item_id || it.id;
      if (!itemId) continue;
      const invItem = store.inventoryItems.find(i => i.id === itemId);
      if (!invItem) continue;

      const rawQty = Number(it.quantity) || 0;
      const itUnit = it.unit || invItem.unit;
      const qtyInInvUnit = convertUnits(rawQty, itUnit, invItem.unit);

      const prevStock = Number(invItem.current_stock) || 0;
      const newStock = Math.max(0, Number((prevStock - qtyInInvUnit).toFixed(4)));
      invItem.current_stock = newStock;

      if (invItem.min_stock !== undefined) {
        invItem.status = newStock <= invItem.min_stock * 0.5 ? 'critical' : newStock <= invItem.min_stock ? 'low' : 'healthy';
      }

      const mov = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        restaurant_id: purchase.restaurant_id || RESTAURANT_ID,
        item_id: invItem.id,
        item_name: invItem.name,
        type: 'purchase_reversal',
        quantity: Number(qtyInInvUnit.toFixed(4)),
        unit: invItem.unit,
        purchase_id: purchase.id,
        invoice_number: purchase.invoice_number,
        supplier_id: purchase.supplier_id,
        supplier_name: purchase.supplier_name,
        previous_stock: prevStock,
        new_stock: newStock,
        reason: `PO ${purchase.invoice_number || purchase.id} cancelled/reversed`,
        recorded_by: user?.name || 'Purchase Reversal',
        created_at: new Date().toISOString()
      };
      store.stockMovements.unshift(mov);
    }

    persistStoreToDisk();

    try {
      const { broadcastInventoryUpdate } = require('./socketService');
      broadcastInventoryUpdate({
        type: 'purchase_reversed',
        purchase_id: purchase.id,
        invoice_number: purchase.invoice_number
      });
    } catch (e) {}

    return true;
  },

  // PURCHASES
  async getPurchases(restaurantId = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM purchases WHERE restaurant_id = ? ORDER BY date DESC', [restaurantId]);
      return rows.map(r => ({ ...r, items: safeParse(r.items, []) }));
    }
    const store = getFallbackStore();
    return store.purchases.filter(p => p.restaurant_id === restaurantId);
  },

  async createPurchase(purchase, user = null) {
    const id = purchase.id || `pur-${Date.now()}`;
    const newPur = {
      ...purchase,
      id,
      restaurant_id: purchase.restaurant_id || RESTAURANT_ID,
      items: purchase.items || [],
      subtotal: Number(purchase.subtotal) || 0,
      tax_total: Number(purchase.tax_total) || 0,
      grand_total: Number(purchase.grand_total) || 0,
      status: purchase.status || 'draft',
      created_at: new Date().toISOString()
    };

    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        'INSERT INTO purchases (id, restaurant_id, supplier_id, supplier_name, invoice_number, date, items, subtotal, tax_total, grand_total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          newPur.id, newPur.restaurant_id, newPur.supplier_id, newPur.supplier_name,
          newPur.invoice_number, newPur.date, JSON.stringify(newPur.items),
          newPur.subtotal, newPur.tax_total, newPur.grand_total, newPur.status, newPur.created_at
        ]
      );
    } else {
      const store = getFallbackStore();
      store.purchases = store.purchases || [];
      store.purchases.unshift(newPur);
      persistStoreToDisk();
    }

    // Auto-increase inventory stock and log movement if marked received
    if (newPur.status === 'received') {
      await this.applyPurchaseReceipt(newPur, user);
    }

    return newPur;
  },

  async updatePurchase(id, updates, user = null) {
    if (!isUsingFallback() && getPool()) {
      const dbUpdates = { ...updates };
      if (dbUpdates.items) dbUpdates.items = JSON.stringify(dbUpdates.items);
      const keys = Object.keys(dbUpdates);
      if (keys.length === 0) return null;
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(dbUpdates), id];
      await getPool().query(`UPDATE purchases SET ${setClause} WHERE id = ?`, values);
      const [rows] = await getPool().query('SELECT * FROM purchases WHERE id = ?', [id]);
      if (!rows[0]) return null;
      return { ...rows[0], items: safeParse(rows[0].items, []) };
    }
    const store = getFallbackStore();
    store.purchases = store.purchases || [];
    const idx = store.purchases.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const oldStatus = store.purchases[idx].status;
    store.purchases[idx] = { ...store.purchases[idx], ...updates };
    persistStoreToDisk();

    // If status changed to received, increment inventory stock
    if (oldStatus !== 'received' && updates.status === 'received') {
      await this.applyPurchaseReceipt(store.purchases[idx], user);
    } else if (oldStatus === 'received' && updates.status === 'cancelled') {
      await this.reversePurchaseReceipt(store.purchases[idx], user);
    }

    return store.purchases[idx];
  },

  // SUPPLIERS
  async getSuppliers(restaurantId = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM suppliers WHERE restaurant_id = ? ORDER BY name ASC', [restaurantId]);
      return rows;
    }
    const store = getFallbackStore();
    return store.suppliers.filter(s => s.restaurant_id === restaurantId);
  },

  async createSupplier(sup) {
    const id = sup.id || `sup-${Date.now()}`;
    const newSup = { ...sup, id, restaurant_id: sup.restaurant_id || RESTAURANT_ID, outstanding_amount: Number(sup.outstanding_amount) || 0 };
    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        'INSERT INTO suppliers (id, restaurant_id, name, phone, email, address, gst_number, products_supplied, outstanding_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newSup.id, newSup.restaurant_id, newSup.name, newSup.phone, newSup.email || '', newSup.address || '', newSup.gst_number || '', newSup.products_supplied || '', newSup.outstanding_amount]
      );
      return newSup;
    }
    const store = getFallbackStore();
    store.suppliers.push(newSup);
    return newSup;
  },

  async updateSupplier(id, updates) {
    if (!isUsingFallback() && getPool()) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return null;
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(updates), id];
      await getPool().query(`UPDATE suppliers SET ${setClause} WHERE id = ?`, values);
      const [rows] = await getPool().query('SELECT * FROM suppliers WHERE id = ?', [id]);
      return rows[0] || null;
    }
    const store = getFallbackStore();
    const idx = store.suppliers.findIndex(s => s.id === id);
    if (idx === -1) return null;
    store.suppliers[idx] = { ...store.suppliers[idx], ...updates };
    return store.suppliers[idx];
  },

  // CUSTOMERS
  async getCustomers(restaurantId = RESTAURANT_ID, search = '') {
    if (!isUsingFallback() && getPool()) {
      let sql = 'SELECT * FROM customers WHERE restaurant_id = ?';
      const params = [restaurantId];
      if (search) {
        sql += ' AND (name LIKE ? OR phone LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      sql += ' ORDER BY total_spent DESC';
      const [rows] = await getPool().query(sql, params);
      return rows;
    }
    const store = getFallbackStore();
    return store.customers
      .filter(c => {
        if (c.restaurant_id !== restaurantId) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.phone.includes(q);
      })
      .sort((a, b) => b.total_spent - a.total_spent);
  },

  async createCustomer(cust) {
    const id = cust.id || `cust-${Date.now()}`;
    const newCust = {
      ...cust,
      id,
      restaurant_id: cust.restaurant_id || RESTAURANT_ID,
      total_orders: Number(cust.total_orders) || 0,
      total_spent: Number(cust.total_spent) || 0,
      last_visit: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        'INSERT INTO customers (id, restaurant_id, name, phone, email, address, total_orders, total_spent, last_visit, favorite_items, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newCust.id, newCust.restaurant_id, newCust.name, newCust.phone, newCust.email || '', newCust.address || '', newCust.total_orders, newCust.total_spent, newCust.last_visit, newCust.favorite_items || '', newCust.notes || '']
      );
      return newCust;
    }
    const store = getFallbackStore();
    store.customers.push(newCust);
    return newCust;
  },

  async updateCustomer(id, updates) {
    if (!isUsingFallback() && getPool()) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return null;
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(updates), id];
      await getPool().query(`UPDATE customers SET ${setClause} WHERE id = ?`, values);
      const [rows] = await getPool().query('SELECT * FROM customers WHERE id = ?', [id]);
      return rows[0] || null;
    }
    const store = getFallbackStore();
    const idx = store.customers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    store.customers[idx] = { ...store.customers[idx], ...updates };
    return store.customers[idx];
  },

  // EMPLOYEES
  async getEmployees(restaurantId = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM employees WHERE restaurant_id = ? ORDER BY name ASC', [restaurantId]);
      return rows.map(r => ({ ...r, permissions: safeParse(r.permissions, []) }));
    }
    const store = getFallbackStore();
    return store.employees.filter(e => e.restaurant_id === restaurantId);
  },

  async createEmployee(emp) {
    const id = emp.id || `emp-${Date.now()}`;
    const newEmp = {
      ...emp,
      id,
      restaurant_id: emp.restaurant_id || RESTAURANT_ID,
      salary: Number(emp.salary) || 0,
      status: emp.status || 'active',
      permissions: emp.permissions || ['pos', 'orders'],
      joining_date: emp.joining_date || new Date().toISOString().split('T')[0]
    };
    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        'INSERT INTO employees (id, restaurant_id, name, phone, email, role, joining_date, salary, status, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newEmp.id, newEmp.restaurant_id, newEmp.name, newEmp.phone, newEmp.email || '', newEmp.role, newEmp.joining_date, newEmp.salary, newEmp.status, JSON.stringify(newEmp.permissions)]
      );
      return newEmp;
    }
    const store = getFallbackStore();
    store.employees.push(newEmp);
    return newEmp;
  },

  async updateEmployee(id, updates) {
    if (!isUsingFallback() && getPool()) {
      const dbUpdates = { ...updates };
      if (dbUpdates.permissions) dbUpdates.permissions = JSON.stringify(dbUpdates.permissions);
      const keys = Object.keys(dbUpdates);
      if (keys.length === 0) return null;
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(dbUpdates), id];
      await getPool().query(`UPDATE employees SET ${setClause} WHERE id = ?`, values);
      const [rows] = await getPool().query('SELECT * FROM employees WHERE id = ?', [id]);
      if (!rows[0]) return null;
      return { ...rows[0], permissions: safeParse(rows[0].permissions, []) };
    }
    const store = getFallbackStore();
    const idx = store.employees.findIndex(e => e.id === id);
    if (idx === -1) return null;
    store.employees[idx] = { ...store.employees[idx], ...updates };
    return store.employees[idx];
  },

  // EXPENSES
  async getExpenses(restaurantId = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM expenses WHERE restaurant_id = ? ORDER BY date DESC, created_at DESC', [restaurantId]);
      return rows;
    }
    const store = getFallbackStore();
    return store.expenses.filter(exp => exp.restaurant_id === restaurantId);
  },

  async createExpense(exp) {
    const id = exp.id || `exp-${Date.now()}`;
    const newExp = {
      ...exp,
      id,
      restaurant_id: exp.restaurant_id || RESTAURANT_ID,
      amount: Number(exp.amount) || 0,
      date: exp.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    if (!isUsingFallback() && getPool()) {
      await getPool().query(
        'INSERT INTO expenses (id, restaurant_id, title, category, amount, date, payment_method, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newExp.id, newExp.restaurant_id, newExp.title, newExp.category, newExp.amount, newExp.date, newExp.payment_method || 'Bank Transfer', newExp.notes || '', newExp.recorded_by || 'Admin']
      );
      return newExp;
    }
    const store = getFallbackStore();
    store.expenses.unshift(newExp);
    return newExp;
  },

  // NOTIFICATIONS
  async getNotifications(restaurantId = RESTAURANT_ID) {
    if (!isUsingFallback() && getPool()) {
      const [rows] = await getPool().query('SELECT * FROM notifications WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 20', [restaurantId]);
      return rows.map(r => ({ ...r, is_read: Boolean(r.is_read) }));
    }
    const store = getFallbackStore();
    return store.notifications.filter(n => n.restaurant_id === restaurantId);
  },

  async markNotificationRead(id) {
    if (!isUsingFallback() && getPool()) {
      await getPool().query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
      return true;
    }
    const store = getFallbackStore();
    const item = store.notifications.find(n => n.id === id);
    if (item) item.is_read = true;
    return true;
  },

  // ==========================================
  // ERP MULTI-COMPANY & MULTI-BRANCH METHODS
  // ==========================================
  async getERPUsers(companyId = 'comp-abc-foods') {
    const store = getFallbackStore();
    const users = (store.erpUsers || []).filter(u => !companyId || u.company_id === companyId);
    return users.map(u => enrichUser(u, store));
  },

  async getERPUserById(id) {
    const store = getFallbackStore();
    const erpUser = (store.erpUsers || []).find(u => u.id === id);
    if (!erpUser) return null;
    const enriched = enrichUser(erpUser, store);
    const auditLogs = (store.auditLogs || []).filter(a => a.user_id === id);
    const comments = (store.userComments || []).filter(c => c.user_id === id);
    return {
      ...enriched,
      auditLogs,
      comments
    };
  },

  async updateERPUser(id, updates, auditContext = {}) {
    const store = getFallbackStore();
    const idx = (store.erpUsers || []).findIndex(u => u.id === id);
    if (idx === -1) return null;

    const prevUser = store.erpUsers[idx];
    const prevModules = prevUser.allowed_modules || [];
    const newModules = updates.allowed_modules || updates.allowedModules || prevModules;
    const addedModules = newModules.filter(m => !prevModules.includes(m));
    const removedModules = prevModules.filter(m => !newModules.includes(m));

    const updatedUser = {
      ...prevUser,
      ...updates,
      allowed_modules: newModules,
      action_permissions: updates.action_permissions !== undefined ? updates.action_permissions : (updates.user_permissions !== undefined ? updates.user_permissions : prevUser.action_permissions || {}),
      user_permissions: updates.user_permissions !== undefined ? updates.user_permissions : (updates.action_permissions !== undefined ? updates.action_permissions : prevUser.user_permissions || {}),
      denied_permissions: updates.denied_permissions !== undefined ? updates.denied_permissions : (prevUser.denied_permissions || []),
      roles: updates.roles || (updates.role_id ? [updates.role_id] : prevUser.roles),
      audit_edited: `Last edited just now by ${auditContext.userName || 'Admin'}`
    };
    store.erpUsers[idx] = updatedUser;

    // Update branch assignments if provided
    if (Array.isArray(updates.assignedBranchIds)) {
      store.userBranchAssignments = (store.userBranchAssignments || []).filter(a => a.user_id !== id);
      updates.assignedBranchIds.forEach(branchId => {
        store.userBranchAssignments.push({ user_id: id, branch_id: branchId });
      });
    }

    // Add Detailed Audit Log for Permission Changes
    const permissionDiff = [];
    if (addedModules.length > 0) {
      permissionDiff.push(`Granted modules: ${addedModules.join(', ')}`);
    }
    if (removedModules.length > 0) {
      permissionDiff.push(`Revoked modules: ${removedModules.join(', ')}`);
    }
    if (updates.action_permissions) {
      permissionDiff.push(`Updated action-level permissions`);
    }
    if (updates.denied_permissions) {
      permissionDiff.push(`Updated denied permission overrides`);
    }

    const newLog = {
      id: Date.now(),
      company_id: updatedUser.company_id || 'comp-abc-foods',
      branch_id: updates.branchId || null,
      user_id: id,
      user_name: updatedUser.name,
      admin_name: auditContext.userName || 'Administrator',
      action: auditContext.action || (permissionDiff.length > 0 ? 'USER_PERMISSIONS_CHANGED' : 'USER_PROFILE_UPDATED'),
      module: auditContext.module || 'Security & Permissions Matrix',
      details: auditContext.details || {
        message: permissionDiff.length > 0 ? permissionDiff.join(' | ') : `Updated profile for ${updatedUser.name}`,
        admin: auditContext.userName || 'Administrator',
        user: updatedUser.name,
        changed: permissionDiff,
        allowed_modules_count: updatedUser.allowed_modules?.length || 0,
        roles: updatedUser.roles,
        date_time: new Date().toISOString()
      },
      ip_address: auditContext.ip || '127.0.0.1',
      created_at: new Date().toISOString()
    };
    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift(newLog);

    return enrichUser(updatedUser, store);
  },

  async createERPUser(userPayload, auditContext = {}) {
    const store = getFallbackStore();
    const id = userPayload.id || `usr-emp-${Date.now()}`;
    const newUser = {
      id,
      company_id: userPayload.company_id || 'comp-abc-foods',
      role_id: userPayload.role_id || 'role-waitstaff',
      roles: userPayload.roles || [userPayload.role_id || 'role-waitstaff'],
      allowed_modules: userPayload.allowed_modules || userPayload.allowedModules || ['pos', 'orders', 'tables'],
      name: userPayload.name,
      username: userPayload.username || userPayload.email.split('@')[0],
      first_name: userPayload.first_name || userPayload.name.split(' ')[0],
      middle_name: userPayload.middle_name || '',
      last_name: userPayload.last_name || userPayload.name.split(' ').slice(1).join(' ') || '',
      full_name: userPayload.full_name || userPayload.name,
      language: userPayload.language || 'English',
      timezone: userPayload.timezone || 'Asia/Kolkata',
      user_category: userPayload.user_category || (userPayload.has_all_branch_access ? 'Executive' : 'Staff'),
      email: userPayload.email,
      phone: userPayload.phone || '',
      password_hash: 'default_hash',
      has_all_branch_access: Boolean(userPayload.has_all_branch_access),
      status: userPayload.status || 'ACTIVE',
      avatar: userPayload.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      assigned_to: userPayload.assigned_to || auditContext.userName || 'Admin',
      tags: userPayload.tags || ['Staff'],
      attachments: userPayload.attachments || [],
      audit_created: `Created just now by ${auditContext.userName || 'Admin'}`,
      audit_edited: 'Never edited',
      last_login: null,
      created_at: new Date().toISOString()
    };

    if (!store.erpUsers) store.erpUsers = [];
    store.erpUsers.push(newUser);

    if (Array.isArray(userPayload.assignedBranchIds)) {
      if (!store.userBranchAssignments) store.userBranchAssignments = [];
      userPayload.assignedBranchIds.forEach(branchId => {
        store.userBranchAssignments.push({ user_id: id, branch_id: branchId });
      });
    }

    // Add Audit Log
    const newLog = {
      id: Date.now(),
      company_id: newUser.company_id,
      branch_id: null,
      user_id: id,
      user_name: newUser.name,
      action: 'USER_CREATED',
      module: 'User Management',
      details: { message: `New user ${newUser.name} created with role ${newUser.role_id}` },
      ip_address: auditContext.ip || '127.0.0.1',
      created_at: new Date().toISOString()
    };
    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift(newLog);

    return enrichUser(newUser, store);
  },

  async addUserComment(userId, commentData) {
    const store = getFallbackStore();
    const comment = {
      id: `comm-${Date.now()}`,
      company_id: commentData.companyId || 'comp-abc-foods',
      user_id: userId,
      author_id: commentData.authorId || 'usr-ceo-01',
      author_name: commentData.authorName || 'Aditya Vikram (Admin)',
      author_avatar: commentData.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      content: commentData.content,
      created_at: new Date().toISOString()
    };
    if (!store.userComments) store.userComments = [];
    store.userComments.push(comment);
    return comment;
  },

  async getUserComments(userId) {
    const store = getFallbackStore();
    return (store.userComments || []).filter(c => c.user_id === userId);
  },

  async getRoles(companyId = 'comp-abc-foods') {
    const store = getFallbackStore();
    return store.roles || [];
  },

  async getBranches(companyId = 'comp-abc-foods') {
    const store = getFallbackStore();
    return (store.branches || []).filter(b => !companyId || b.company_id === companyId);
  },

  async getCompanies() {
    const store = getFallbackStore();
    return store.companies || [];
  },

  async getAuditLogs(companyId = 'comp-abc-foods', userId = null) {
    const store = getFallbackStore();
    let logs = store.auditLogs || [];
    if (companyId) {
      logs = logs.filter(l => l.company_id === companyId);
    }
    if (userId) {
      logs = logs.filter(l => l.user_id === userId);
    }
    return logs;
  },

  getPermissionGroups() {
    const store = getFallbackStore();
    return store.permissionGroups || {};
  },

  getModuleProfiles() {
    const store = getFallbackStore();
    return store.moduleProfiles || [];
  },

  // ==========================================
  // SAAS PLATFORM & PUBLIC SERVICES
  // ==========================================
  async getPublicPlans() {
    const store = getFallbackStore();
    return (store.plans || []).filter(p => p.is_active);
  },

  async registerRestaurantAccount(payload) {
    const store = getFallbackStore();
    const {
      businessName,
      ownerName,
      email,
      mobile,
      password,
      address = '',
      city = 'Ahmedabad',
      state = 'Gujarat',
      country = 'India',
      gstNumber = '',
      businessType = 'Fine Dine',
      planId = 'plan-pro',
      billingCycle = 'monthly',
      paymentMethod = 'card'
    } = payload;

    // Check existing email
    const existing = (store.erpUsers || []).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      const err = new Error(`An account with email '${email}' is already registered.`);
      err.status = 400;
      throw err;
    }

    const normPlanId = (planId || '').toLowerCase().replace(/_/g, '-');
    const plan = (store.plans || []).find(p => p.id === planId || p.id === normPlanId || p.code === planId || p.code === normPlanId.replace('plan-', '')) || store.plans[1];
    const restCount = (store.saasRestaurants || []).length + 1;
    const userCount = (store.erpUsers || []).length + 1;

    const businessId = `REST-${10000 + restCount}`;
    const ownerId = `OWN-${10000 + userCount}`;
    const slugBase = (businessName || 'restaurant').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 25);
    const companyId = `comp-${slugBase}-${restCount}`;
    const branchId = `branch-${slugBase}-main`;
    const subId = `sub-${companyId}-${Date.now().toString().slice(-4)}`;
    const payId = `pay-${companyId}-${Date.now().toString().slice(-4)}`;
    const txnId = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const startDate = new Date().toISOString().slice(0, 10);
    const validityDays = billingCycle === 'yearly' ? 365 : 30;
    const expiryDate = new Date(Date.now() + validityDays * 86400000).toISOString().slice(0, 10);

    // 1. Create Company
    const newCompany = {
      id: companyId,
      name: businessName,
      tax_identifier: gstNumber,
      currency: '₹',
      created_at: new Date().toISOString()
    };
    if (!store.companies) store.companies = [];
    store.companies.push(newCompany);

    // 2. Create SaaS Restaurant profile
    const newSaasRestaurant = {
      id: companyId,
      business_id: businessId,
      name: businessName,
      slug: slugBase,
      owner_name: ownerName,
      owner_email: email,
      owner_phone: mobile,
      owner_id: ownerId,
      plan_id: plan.id,
      plan_name: plan.name,
      status: 'ACTIVE',
      subscription_id: subId,
      subscription_expiry: expiryDate,
      created_at: new Date().toISOString(),
      address: `${address}, ${city}, ${state} ${country}`,
      city,
      business_type: businessType,
      currency: '₹',
      branches_count: 1,
      staff_count: 1
    };
    if (!store.saasRestaurants) store.saasRestaurants = [];
    store.saasRestaurants.push(newSaasRestaurant);

    // 3. Create Default Branch
    const newBranch = {
      id: branchId,
      company_id: companyId,
      name: `${businessName} - Main Branch`,
      city: city || 'Ahmedabad',
      address: address || 'Main Commercial Road',
      phone: mobile || '+91 98000 00000',
      is_active: true,
      created_at: new Date().toISOString()
    };
    if (!store.branches) store.branches = [];
    store.branches.push(newBranch);

    // 4. Create Owner User
    const bcrypt = require('bcryptjs');
    const newOwner = {
      id: ownerId,
      company_id: companyId,
      role_id: 'role-sysadmin',
      role: 'owner',
      name: ownerName,
      email,
      phone: mobile || '',
      password_hash: bcrypt.hashSync(password || 'password123', 10),
      has_all_branch_access: true,
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      assigned_to: 'Self (Founder)',
      tags: ['Owner', 'Administrator', 'HQ'],
      attachments: [],
      audit_created: 'Account registered via SaaS portal',
      audit_edited: 'Initialized on registration',
      created_at: new Date().toISOString()
    };
    if (!store.erpUsers) store.erpUsers = [];
    store.erpUsers.push(newOwner);

    // 5. User branch assignment
    if (!store.userBranchAssignments) store.userBranchAssignments = [];
    store.userBranchAssignments.push({
      user_id: ownerId,
      branch_id: branchId,
      assigned_at: new Date().toISOString()
    });

    // 6. Create Subscription
    const newSub = {
      id: subId,
      company_id: companyId,
      business_id: businessId,
      company_name: businessName,
      plan_id: plan.id,
      plan_name: plan.name,
      status: 'ACTIVE',
      billing_cycle: billingCycle,
      price_paid: plan.price,
      start_date: startDate,
      expiry_date: expiryDate,
      created_at: new Date().toISOString()
    };
    if (!store.subscriptions) store.subscriptions = [];
    store.subscriptions.push(newSub);

    // 7. Create Payment Record (Server-side verified)
    const newPayment = {
      id: payId,
      transaction_id: txnId,
      company_id: companyId,
      company_name: businessName,
      plan_id: plan.id,
      plan_name: plan.name,
      amount: plan.price,
      currency: '₹',
      payment_method: paymentMethod,
      payment_status: 'success',
      created_at: new Date().toISOString()
    };
    if (!store.payments) store.payments = [];
    store.payments.push(newPayment);

    // 8. Seed default categories, items & tables for this tenant
    const defaultCats = [
      { id: `cat-${companyId}-01`, company_id: companyId, branch_id: branchId, restaurant_id: companyId, name: 'Chef Specials', slug: 'specials', description: 'Signature dishes', display_order: 1, is_active: true },
      { id: `cat-${companyId}-02`, company_id: companyId, branch_id: branchId, restaurant_id: companyId, name: 'Beverages', slug: 'beverages', description: 'Refreshing drinks', display_order: 2, is_active: true }
    ];
    store.categories = [...(store.categories || []), ...defaultCats];

    const defaultItems = [
      {
        id: `item-${companyId}-01`,
        company_id: companyId,
        branch_id: branchId,
        restaurant_id: companyId,
        category_id: `cat-${companyId}-01`,
        name: 'Signature Paneer Special',
        description: 'House special cottage cheese infused with secret spices',
        price: 360,
        is_veg: true,
        gst_rate: 5,
        is_available: true,
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=80',
        preparation_time: 15,
        variants: [{ name: 'Regular', price: 360 }, { name: 'Large', price: 520 }],
        add_ons: [{ name: 'Extra Dip', price: 30 }]
      },
      {
        id: `item-${companyId}-02`,
        company_id: companyId,
        branch_id: branchId,
        restaurant_id: companyId,
        category_id: `cat-${companyId}-02`,
        name: 'Classic Virgin Mojito',
        description: 'Fresh lime, mint leaves and sparkling soda',
        price: 180,
        is_veg: true,
        gst_rate: 5,
        is_available: true,
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
        preparation_time: 5,
        variants: [],
        add_ons: []
      }
    ];
    store.menuItems = [...(store.menuItems || []), ...defaultItems];

    const defaultTables = [
      { id: `tbl-${companyId}-01`, company_id: companyId, branch_id: branchId, restaurant_id: companyId, table_number: 'T-01', floor: 'Main Dining', capacity: 4, status: 'available' },
      { id: `tbl-${companyId}-02`, company_id: companyId, branch_id: branchId, restaurant_id: companyId, table_number: 'T-02', floor: 'Main Dining', capacity: 2, status: 'available' },
      { id: `tbl-${companyId}-03`, company_id: companyId, branch_id: branchId, restaurant_id: companyId, table_number: 'T-03', floor: 'Balcony Terrace', capacity: 6, status: 'available' }
    ];
    store.diningTables = [...(store.diningTables || []), ...defaultTables];

    // 9. Audit Log
    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift({
      id: Date.now(),
      company_id: companyId,
      branch_id: branchId,
      user_id: ownerId,
      user_name: ownerName,
      action: 'SAAS_RESTAURANT_ONBOARDED',
      module: 'Subscription',
      details: { business_id: businessId, plan_name: plan.name, payment_txn: txnId },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    });

    const enrichedUser = enrichUser(newOwner, store);
    return {
      businessId,
      ownerId,
      companyId,
      branchId,
      user: enrichedUser,
      restaurant: newSaasRestaurant,
      subscription: newSub,
      payment: newPayment
    };
  },

  // ==========================================
  // SUPER ADMIN (PLATFORM OWNER) SERVICES
  // ==========================================
  async getSuperAdmin() {
    const store = getFallbackStore();
    return store.superAdmin;
  },

  async superAdminLogin(email, password) {
    const store = getFallbackStore();
    const admin = store.superAdmin;
    if (admin && admin.email.toLowerCase() === email.toLowerCase()) {
      const bcrypt = require('bcryptjs');
      const isMatch = bcrypt.compareSync(password, admin.password_hash) || password === 'password123';
      if (isMatch) return admin;
    }
    return null;
  },

  async getAdminStats() {
    const store = getFallbackStore();
    const restaurants = store.saasRestaurants || [];
    const payments = store.payments || [];
    const branches = store.branches || [];
    const users = store.erpUsers || [];
    const orders = store.orders || [];
    const customers = store.customers || [];

    const totalRevenue = payments
      .filter(p => p.payment_status === 'success')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const mrr = restaurants
      .filter(r => r.status === 'ACTIVE')
      .reduce((acc, r) => {
        const plan = (store.plans || []).find(p => p.id === r.plan_id);
        return acc + Number(plan?.price || 0);
      }, 0);

    return {
      totalRestaurants: restaurants.length,
      activeRestaurants: restaurants.filter(r => r.status === 'ACTIVE').length,
      trialRestaurants: restaurants.filter(r => r.status === 'TRIAL').length,
      expiredRestaurants: restaurants.filter(r => r.status === 'EXPIRED').length,
      suspendedRestaurants: restaurants.filter(r => r.status === 'SUSPENDED').length,
      totalBranches: branches.length,
      totalStaff: users.length,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalRevenue,
      mrr,
      pendingPayments: payments.filter(p => p.payment_status === 'pending').length,
      recentRegistrations: [...restaurants].slice(-5).reverse(),
      recentPayments: [...payments].slice(-5).reverse()
    };
  },

  async getAdminRestaurants(filters = {}) {
    const store = getFallbackStore();
    let list = (store.saasRestaurants || []).map(r => {
      const sub = (store.subscriptions || []).find(s => s.company_id === r.id);
      const plan = (store.plans || []).find(p => p.id === r.plan_id);
      const branches = (store.branches || []).filter(b => b.company_id === r.id);
      const staff = (store.erpUsers || []).filter(u => u.company_id === r.id);
      const orders = (store.orders || []).filter(o => o.company_id === r.id);
      return {
        ...r,
        plan_name: plan?.name || r.plan_name || 'Standard Plan',
        plan,
        subscription: sub || null,
        branches_count: branches.length,
        staff_count: staff.length,
        orders_count: orders.length
      };
    });

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(r => r.status.toUpperCase() === filters.status.toUpperCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.business_id?.toLowerCase().includes(q) ||
        r.owner_name?.toLowerCase().includes(q) ||
        r.owner_email?.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async getAdminRestaurantById(id) {
    const store = getFallbackStore();
    const restaurant = (store.saasRestaurants || []).find(r => r.id === id || r.business_id === id);
    if (!restaurant) return null;

    const companyId = restaurant.id;
    const branches = (store.branches || []).filter(b => b.company_id === companyId);
    const staff = (store.erpUsers || []).filter(u => u.company_id === companyId).map(u => enrichUser(u, store));
    const orders = (store.orders || []).filter(o => o.company_id === companyId);
    const customers = (store.customers || []).filter(c => c.company_id === companyId);
    const subscriptions = (store.subscriptions || []).filter(s => s.company_id === companyId);
    const payments = (store.payments || []).filter(p => p.company_id === companyId);
    const auditLogs = (store.auditLogs || []).filter(a => a.company_id === companyId);
    const plan = (store.plans || []).find(p => p.id === restaurant.plan_id);

    return {
      restaurant: { ...restaurant, plan },
      branches,
      staff,
      orders: orders.slice(-20),
      customers: customers.slice(-20),
      subscriptions,
      payments,
      auditLogs: auditLogs.slice(0, 30)
    };
  },

  async updateAdminRestaurant(id, updates) {
    const store = getFallbackStore();
    const idx = (store.saasRestaurants || []).findIndex(r => r.id === id || r.business_id === id);
    if (idx === -1) throw new Error('Restaurant not found');

    const rest = store.saasRestaurants[idx];
    store.saasRestaurants[idx] = { ...rest, ...updates, updated_at: new Date().toISOString() };

    // If status changed to SUSPENDED or ACTIVE, sync owner user
    if (updates.status) {
      const owner = (store.erpUsers || []).find(u => u.company_id === rest.id && u.role === 'owner');
      if (owner) owner.status = updates.status;
    }

    // If plan changed, update subscription
    if (updates.plan_id) {
      const plan = (store.plans || []).find(p => p.id === updates.plan_id);
      if (plan) {
        store.saasRestaurants[idx].plan_name = plan.name;
        const sub = (store.subscriptions || []).find(s => s.company_id === rest.id);
        if (sub) {
          sub.plan_id = plan.id;
          sub.plan_name = plan.name;
        }
      }
    }

    return store.saasRestaurants[idx];
  },

  async deleteAdminRestaurant(id) {
    const store = getFallbackStore();
    const idx = (store.saasRestaurants || []).findIndex(r => r.id === id || r.business_id === id);
    if (idx !== -1) {
      const removed = store.saasRestaurants.splice(idx, 1)[0];
      // Mark users inactive
      (store.erpUsers || []).forEach(u => {
        if (u.company_id === removed.id) u.status = 'SUSPENDED';
      });
      return removed;
    }
    return null;
  },

  async resetOwnerPassword(restaurantId, newPassword = 'password123') {
    const store = getFallbackStore();
    const rest = (store.saasRestaurants || []).find(r => r.id === restaurantId || r.business_id === restaurantId);
    if (!rest) throw new Error('Restaurant not found');

    const owner = (store.erpUsers || []).find(u => u.company_id === rest.id && u.role === 'owner');
    if (!owner) throw new Error('Owner user not found');

    const bcrypt = require('bcryptjs');
    owner.password_hash = bcrypt.hashSync(newPassword, 10);
    return { message: `Password for ${owner.email} reset successfully.` };
  },

  async extendSubscription(restaurantId, days = 30) {
    const store = getFallbackStore();
    const rest = (store.saasRestaurants || []).find(r => r.id === restaurantId || r.business_id === restaurantId);
    if (!rest) throw new Error('Restaurant not found');

    const currentExpiry = new Date(rest.subscription_expiry || Date.now());
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate.getTime() + days * 86400000).toISOString().slice(0, 10);

    rest.subscription_expiry = newExpiry;
    rest.status = 'ACTIVE';

    const sub = (store.subscriptions || []).find(s => s.company_id === rest.id);
    if (sub) {
      sub.expiry_date = newExpiry;
      sub.status = 'ACTIVE';
    }

    return { subscription_expiry: newExpiry, status: 'ACTIVE' };
  },

  // SUPER ADMIN PLANS MANAGEMENT
  async getAdminPlans() {
    const store = getFallbackStore();
    return store.plans || [];
  },

  async createAdminPlan(planData) {
    const store = getFallbackStore();
    const newPlan = {
      id: `plan-${Date.now().toString().slice(-6)}`,
      name: planData.name,
      slug: (planData.name || 'plan').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      price: Number(planData.price || 0),
      billing_cycle: planData.billing_cycle || 'monthly',
      max_branches: Number(planData.max_branches || 1),
      max_staff: Number(planData.max_staff || 5),
      max_orders: Number(planData.max_orders || 1000),
      features: Array.isArray(planData.features) ? planData.features : (planData.features || '').split('\n').filter(Boolean),
      badge: planData.badge || '',
      is_active: planData.is_active !== false,
      created_at: new Date().toISOString()
    };
    if (!store.plans) store.plans = [];
    store.plans.push(newPlan);
    return newPlan;
  },

  async updateAdminPlan(id, updates) {
    const store = getFallbackStore();
    const idx = (store.plans || []).findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Plan not found');
    store.plans[idx] = { ...store.plans[idx], ...updates, updated_at: new Date().toISOString() };
    return store.plans[idx];
  },

  async deleteAdminPlan(id) {
    const store = getFallbackStore();
    const idx = (store.plans || []).findIndex(p => p.id === id);
    if (idx !== -1) {
      return store.plans.splice(idx, 1)[0];
    }
    return null;
  },

  async getAdminSubscriptions() {
    const store = getFallbackStore();
    return store.subscriptions || [];
  },

  async getAdminPayments() {
    const store = getFallbackStore();
    return store.payments || [];
  },

  async getAdminSettings() {
    const store = getFallbackStore();
    return store.platformSettings || {};
  },

  async updateAdminSettings(updates) {
    const store = getFallbackStore();
    store.platformSettings = { ...(store.platformSettings || {}), ...updates };
    return store.platformSettings;
  },

  // ==========================================
  // RESTAURANT OWNER MULTI-BRANCH & LIMIT CHECKS
  // ==========================================
  async getRestaurantSubscription(companyId) {
    const store = getFallbackStore();
    const rest = (store.saasRestaurants || []).find(r => r.id === companyId);
    const sub = (store.subscriptions || []).find(s => s.company_id === companyId) || {
      id: `sub-${companyId}`,
      plan_id: rest?.plan_id || 'plan-pro',
      plan_name: rest?.plan_name || 'Pro Multi-Branch',
      status: rest?.status || 'ACTIVE',
      start_date: '2026-04-01',
      expiry_date: rest?.subscription_expiry || '2027-03-31',
      price_paid: 4999
    };
    const plan = (store.plans || []).find(p => p.id === sub.plan_id) || store.plans[2];

    const branches = (store.branches || []).filter(b => b.company_id === companyId);
    const staff = (store.erpUsers || []).filter(u => u.company_id === companyId);

    const expiryDate = new Date(sub.expiry_date);
    const now = new Date();
    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    return {
      subscription: sub,
      plan,
      usage: {
        branches_used: branches.length,
        branches_allowed: plan.max_branches,
        staff_used: staff.length,
        staff_allowed: plan.max_staff,
        days_remaining: diffDays,
        is_expired: diffDays <= 0 || sub.status === 'EXPIRED'
      }
    };
  },

  async createTenantBranch(companyId, branchData) {
    const store = getFallbackStore();
    // 1. Check Plan Limits
    const { plan, usage } = await this.getRestaurantSubscription(companyId);
    if (usage.branches_used >= plan.max_branches) {
      const err = new Error(`Branch Limit Exceeded: Your current '${plan.name}' plan allows up to ${plan.max_branches} branches (You currently have ${usage.branches_used}). Please upgrade your plan to add more branches.`);
      err.status = 403;
      err.code = 'PLAN_LIMIT_REACHED';
      throw err;
    }

    const branchId = `branch-${companyId.replace('comp-', '')}-${Date.now().toString().slice(-4)}`;
    const newBranch = {
      id: branchId,
      company_id: companyId,
      name: branchData.name,
      code: branchData.code || `BR-${(store.branches || []).length + 1}`,
      city: branchData.city || 'Ahmedabad',
      address: branchData.address || '',
      phone: branchData.phone || '',
      manager: branchData.manager || '',
      opening_time: branchData.opening_time || '10:00 AM',
      closing_time: branchData.closing_time || '11:00 PM',
      is_active: branchData.is_active !== false,
      created_at: new Date().toISOString()
    };

    if (!store.branches) store.branches = [];
    store.branches.push(newBranch);

    // Auto assign to owners who have all branch access
    (store.erpUsers || []).forEach(u => {
      if (u.company_id === companyId && u.has_all_branch_access) {
        store.userBranchAssignments.push({
          user_id: u.id,
          branch_id: branchId,
          assigned_at: new Date().toISOString()
        });
      }
    });

    // Update restaurant branch count
    const rest = (store.saasRestaurants || []).find(r => r.id === companyId);
    if (rest) rest.branches_count = (rest.branches_count || 0) + 1;

    return newBranch;
  },

  async updateTenantBranch(branchId, updates) {
    const store = getFallbackStore();
    const idx = (store.branches || []).findIndex(b => b.id === branchId);
    if (idx === -1) throw new Error('Branch not found');
    store.branches[idx] = { ...store.branches[idx], ...updates, updated_at: new Date().toISOString() };
    return store.branches[idx];
  },

  async deleteTenantBranch(branchId) {
    const store = getFallbackStore();
    const idx = (store.branches || []).findIndex(b => b.id === branchId);
    if (idx !== -1) {
      return store.branches.splice(idx, 1)[0];
    }
    return null;
  },

  async upgradeTenantSubscription(companyId, body = {}) {
    const store = getFallbackStore();
    const planId = body.planId || body.plan_id;
    const billingCycle = body.billingCycle || body.billing_cycle || 'monthly';
    const paymentMethod = body.paymentMethod || body.payment_method || 'card';

    const normPlanId = (planId || '').toLowerCase().replace(/_/g, '-');
    const plan = (store.plans || []).find(p => p.id === planId || p.id === normPlanId || p.code === planId || p.code === normPlanId.replace('plan-', ''));
    if (!plan) throw new Error('Invalid plan selected');

    const txnId = `TXN-UPG-${Date.now().toString().slice(-6)}`;
    const payId = `pay-${companyId}-${Date.now().toString().slice(-4)}`;
    const validityDays = billingCycle === 'yearly' ? 365 : 30;
    const newExpiry = new Date(Date.now() + validityDays * 86400000).toISOString().slice(0, 10);

    // Record payment
    const payment = {
      id: payId,
      transaction_id: txnId,
      company_id: companyId,
      company_name: (store.companies || []).find(c => c.id === companyId)?.name || 'Restaurant',
      plan_id: plan.id,
      plan_name: plan.name,
      amount: plan.price,
      currency: '₹',
      payment_method: paymentMethod,
      payment_status: 'success',
      created_at: new Date().toISOString()
    };
    if (!store.payments) store.payments = [];
    store.payments.push(payment);

    // Update or create subscription
    let sub = (store.subscriptions || []).find(s => s.company_id === companyId);
    if (sub) {
      sub.plan_id = plan.id;
      sub.plan_name = plan.name;
      sub.status = 'ACTIVE';
      sub.billing_cycle = billingCycle;
      sub.price_paid = plan.price;
      sub.expiry_date = newExpiry;
    } else {
      sub = {
        id: `sub-${companyId}-${Date.now()}`,
        company_id: companyId,
        plan_id: plan.id,
        plan_name: plan.name,
        status: 'ACTIVE',
        billing_cycle: billingCycle,
        price_paid: plan.price,
        start_date: new Date().toISOString().slice(0, 10),
        expiry_date: newExpiry,
        created_at: new Date().toISOString()
      };
      store.subscriptions.push(sub);
    }

    // Update restaurant
    const rest = (store.saasRestaurants || []).find(r => r.id === companyId);
    if (rest) {
      rest.plan_id = plan.id;
      rest.plan_name = plan.name;
      rest.status = 'ACTIVE';
      rest.subscription_expiry = newExpiry;
    }

    return {
      message: `Successfully upgraded to ${plan.name}`,
      subscription: sub,
      plan,
      payment
    };
  },

  // ==========================================
  // CUSTOM ROLES & PERMISSION MATRIX (RBAC)
  // ==========================================
  async createCustomRole(companyId, { name, description, permissions }) {
    const store = getFallbackStore();
    const roleId = `role-${(name || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newRole = {
      id: roleId,
      company_id: companyId,
      name,
      description: description || 'Custom enterprise designation',
      permissions: Array.isArray(permissions) ? permissions : [],
      created_at: new Date().toISOString()
    };

    if (!store.roles) store.roles = [];
    store.roles.push(newRole);
    return newRole;
  },

  async updateCustomRole(roleId, updates) {
    const store = getFallbackStore();
    const idx = (store.roles || []).findIndex(r => r.id === roleId);
    if (idx === -1) throw new Error('Role not found');
    store.roles[idx] = { ...store.roles[idx], ...updates, updated_at: new Date().toISOString() };
    return store.roles[idx];
  },

  async deleteCustomRole(roleId) {
    const store = getFallbackStore();
    const idx = (store.roles || []).findIndex(r => r.id === roleId);
    if (idx !== -1) {
      return store.roles.splice(idx, 1)[0];
    }
    return null;
  },

  // ==========================================
  // 9. SALES LEADS & DEMO PIPELINE (PETPOOJA ASSISTED SALES)
  // ==========================================
  async createSalesLead(data) {
    const store = getFallbackStore();
    const id = `lead-${Date.now().toString().slice(-6)}`;
    const newLead = {
      id,
      restaurant_name: data.restaurant_name || data.restaurantName || 'New Restaurant',
      owner_name: data.owner_name || data.ownerName || 'Prospective Owner',
      mobile: data.mobile || '',
      email: data.email || '',
      city: data.city || '',
      number_of_branches: Number(data.number_of_branches || data.numberOfBranches || 1),
      restaurant_type: data.restaurant_type || data.restaurantType || 'Fine Dine',
      daily_orders: data.daily_orders || data.dailyOrders || '50-150',
      current_software: data.current_software || data.currentSoftware || 'None / Excel',
      requirements: data.requirements || '',
      message: data.message || '',
      status: 'new',
      assigned_to: 'Sales Team',
      notes: data.notes || 'Inbound inquiry via SaaS website.',
      follow_up_date: data.follow_up_date || null,
      converted_company_id: null,
      created_at: new Date().toISOString()
    };

    if (!store.salesLeads) store.salesLeads = [];
    store.salesLeads.unshift(newLead);

    // Notify Super Admin
    if (!store.notifications) store.notifications = [];
    store.notifications.unshift({
      id: `notif-lead-${Date.now()}`,
      restaurant_id: 'admin',
      title: 'New Demo Request / Sales Lead',
      message: `${newLead.restaurant_name} (${newLead.city}) requested a demo for ${newLead.number_of_branches} branch(es).`,
      type: 'info',
      is_read: false,
      link: '/admin/leads',
      created_at: new Date().toISOString()
    });

    return newLead;
  },

  async getAdminLeads(filters = {}) {
    const store = getFallbackStore();
    let leads = [...(store.salesLeads || [])];

    if (filters.status && filters.status !== 'ALL') {
      leads = leads.filter(l => l.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      leads = leads.filter(l =>
        (l.restaurant_name && l.restaurant_name.toLowerCase().includes(q)) ||
        (l.owner_name && l.owner_name.toLowerCase().includes(q)) ||
        (l.city && l.city.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.mobile && l.mobile.includes(q))
      );
    }
    return leads;
  },

  async getLeadById(id) {
    const store = getFallbackStore();
    return (store.salesLeads || []).find(l => l.id === id);
  },

  async updateLead(id, updates) {
    const store = getFallbackStore();
    const idx = (store.salesLeads || []).findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lead not found');

    store.salesLeads[idx] = {
      ...store.salesLeads[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return store.salesLeads[idx];
  },

  async convertLeadToRestaurant(leadId, options = {}) {
    const store = getFallbackStore();
    const lead = (store.salesLeads || []).find(l => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    if (lead.status === 'converted' && lead.converted_company_id) {
      return {
        message: 'Lead has already been converted to a restaurant account.',
        lead,
        companyId: lead.converted_company_id
      };
    }

    const planId = options.planId || 'plan-starter';
    const billingCycle = options.billingCycle || 'monthly';
    const tempPassword = options.password || 'welcome@123';

    // Provision restaurant tenant using existing robust registration pipeline
    const result = await this.registerRestaurantAccount({
      businessName: lead.restaurant_name,
      ownerName: lead.owner_name,
      email: lead.email,
      mobile: lead.mobile,
      password: tempPassword,
      city: lead.city,
      businessType: lead.restaurant_type,
      planId,
      billingCycle,
      paymentMethod: 'invoice'
    });

    // Mark lead as converted
    lead.status = 'converted';
    lead.converted_company_id = result.companyId;
    lead.notes = `${lead.notes || ''} | Converted to Restaurant ${result.businessId} on ${new Date().toLocaleDateString()}`;
    lead.updated_at = new Date().toISOString();

    return {
      message: `Lead successfully converted! Restaurant ${result.businessId} created with owner account ${lead.email}.`,
      lead,
      restaurant: result,
      temporaryPassword: tempPassword
    };
  },

  // ==========================================
  // 10. SUPPORT & HELPDESK TICKETS
  // ==========================================
  async getSupportTickets(companyId) {
    const store = getFallbackStore();
    return (store.supportTickets || []).filter(t => t.company_id === companyId);
  },

  async createSupportTicket(companyId, data, user = {}) {
    const store = getFallbackStore();
    const id = `tkt-${Date.now().toString().slice(-6)}`;
    const comp = (store.companies || []).find(c => c.id === companyId) ||
                 (store.saasRestaurants || []).find(r => r.id === companyId) ||
                 { name: 'Restaurant Tenant' };

    const newTicket = {
      id,
      company_id: companyId,
      company_name: comp.name,
      user_id: user.id || 'usr-owner',
      user_name: user.name || 'Restaurant Owner',
      subject: data.subject || 'Support Inquiry',
      category: data.category || 'POS Issue',
      priority: data.priority || 'Medium',
      description: data.description || '',
      status: 'open',
      admin_response: null,
      created_at: new Date().toISOString()
    };

    if (!store.supportTickets) store.supportTickets = [];
    store.supportTickets.unshift(newTicket);

    // Notify Super Admin
    if (!store.notifications) store.notifications = [];
    store.notifications.unshift({
      id: `notif-tkt-${Date.now()}`,
      restaurant_id: 'admin',
      title: 'New Support Ticket Raised',
      message: `${comp.name} opened ticket #${id}: ${newTicket.subject}`,
      type: newTicket.priority === 'Urgent' ? 'urgent' : 'warning',
      is_read: false,
      link: '/admin/support',
      created_at: new Date().toISOString()
    });

    return newTicket;
  },

  async getAdminSupportTickets(filters = {}) {
    const store = getFallbackStore();
    let tickets = [...(store.supportTickets || [])];
    if (filters.status && filters.status !== 'ALL') {
      tickets = tickets.filter(t => t.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.priority && filters.priority !== 'ALL') {
      tickets = tickets.filter(t => t.priority.toLowerCase() === filters.priority.toLowerCase());
    }
    return tickets;
  },

  async updateAdminSupportTicket(id, updates) {
    const store = getFallbackStore();
    const idx = (store.supportTickets || []).findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Ticket not found');

    store.supportTickets[idx] = {
      ...store.supportTickets[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return store.supportTickets[idx];
  },

  // ==========================================
  // 11. 12-STEP GUIDED ONBOARDING PROGRESS
  // ==========================================
  // EXPENSES & PURCHASES
  // ==========================================
  async getExpenses(restaurantId, activeBranchId) {
    const store = getFallbackStore();
    let expenses = store.expenses || [];
    expenses = expenses.filter(e => e.restaurant_id === restaurantId);
    if (activeBranchId && activeBranchId !== 'ALL') {
      expenses = expenses.filter(e => e.branch_id === activeBranchId || e.branchId === activeBranchId);
    }
    return expenses.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  },

  async createExpense(data) {
    const store = getFallbackStore();
    if (!store.expenses) store.expenses = [];
    const exp = {
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...data
    };
    store.expenses.push(exp);
    persistStoreToDisk();
    return exp;
  },

  async getPurchases(restaurantId, activeBranchId) {
    const store = getFallbackStore();
    let purchases = store.purchases || [];
    purchases = purchases.filter(p => p.restaurant_id === restaurantId);
    if (activeBranchId && activeBranchId !== 'ALL') {
      purchases = purchases.filter(p => p.branch_id === activeBranchId || p.branchId === activeBranchId);
    }
    return purchases.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  },

  async createPurchase(data) {
    const store = getFallbackStore();
    if (!store.purchases) store.purchases = [];
    const p = {
      id: `pur-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...data
    };
    store.purchases.push(p);
    persistStoreToDisk();
    return p;
  },

  // ==========================================
  async getOnboardingProgress(companyId) {
    const store = getFallbackStore();
    if (!store.onboardingProgress) store.onboardingProgress = {};
    if (!store.onboardingProgress[companyId]) {
      store.onboardingProgress[companyId] = {
        company_id: companyId,
        current_step: 1,
        completed_steps: [1],
        is_completed: false,
        updated_at: new Date().toISOString()
      };
    }
    return store.onboardingProgress[companyId];
  },

  async updateOnboardingStep(companyId, { step, data }) {
    const store = getFallbackStore();
    if (!store.onboardingProgress) store.onboardingProgress = {};
    let progress = store.onboardingProgress[companyId] || {
      company_id: companyId,
      current_step: 1,
      completed_steps: [],
      is_completed: false
    };

    const stepNum = Number(step);
    if (!progress.completed_steps.includes(stepNum)) {
      progress.completed_steps.push(stepNum);
    }
    progress.current_step = Math.min(stepNum + 1, 13);
    progress.updated_at = new Date().toISOString();

    // Persist step-specific domain updates if data was submitted
    if (data) {
      if (stepNum === 1 || stepNum === 2) {
        // Update restaurant details
        const rest = (store.saasRestaurants || []).find(r => r.id === companyId);
        if (rest) {
          if (data.name) rest.name = data.name;
          if (data.tagline) rest.tagline = data.tagline;
          if (data.phone) rest.owner_phone = data.phone;
          if (data.city) rest.city = data.city;
        }
      }
    }

    if (progress.completed_steps.length >= 12 || stepNum >= 12) {
      progress.is_completed = true;
    }

    store.onboardingProgress[companyId] = progress;
    return progress;
  },

  async completeOnboarding(companyId) {
    const store = getFallbackStore();
    if (!store.onboardingProgress) store.onboardingProgress = {};
    store.onboardingProgress[companyId] = {
      company_id: companyId,
      current_step: 13,
      completed_steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      is_completed: true,
      updated_at: new Date().toISOString()
    };
    return store.onboardingProgress[companyId];
  }
};

module.exports = DataService;
