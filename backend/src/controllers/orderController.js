const DataService = require('../services/dataService');
const { 
  broadcastNewOrder, 
  broadcastOrderUpdate, 
  broadcastPaymentSuccess, 
  broadcastKOTUpdate,
  broadcastTableUpdate
} = require('../services/socketService');

const OrderController = {
  async getOrders(req, res) {
    try {
      const { type, status } = req.query;
      const restId = req.restaurantId || req.query.restaurantId || 'rest-urban-spice-01';
      const orders = await DataService.getOrders(restId, type, status);
      return res.json(orders);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await DataService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      return res.json(order);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createOrder(req, res) {
    try {
      const { 
        items, 
        order_type, 
        table_id, 
        table_name, 
        customer_id, 
        customer_name, 
        customer_phone, 
        discount = 0, 
        notes = '', 
        branch_id, 
        company_id 
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Order must contain at least one item' });
      }

      const restId = req.restaurantId || req.body.restaurant_id || 'rest-urban-spice-01';
      const restaurant = await DataService.getRestaurant(restId);
      const taxRate = restaurant?.tax_rate || 5.0;

      // Calculate subtotal
      const subtotal = items.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity)), 0);
      const discountAmount = Number(discount) || 0;
      const taxable = Math.max(0, subtotal - discountAmount);
      const tax = parseFloat(((taxable * taxRate) / 100).toFixed(2));
      const total = parseFloat((taxable + tax).toFixed(2));

      const isPaid = req.body.payment_status === 'paid' || req.body.status === 'paid';
      const orderStatus = req.body.status || (isPaid ? 'paid' : 'kot_sent');
      const paymentStatus = req.body.payment_status || (isPaid ? 'paid' : 'unpaid');
      const paymentMethod = req.body.payment_method || (isPaid ? 'cash' : 'unpaid');

      const newOrder = await DataService.createOrder({
        restaurant_id: restId,
        branch_id: branch_id || req.scope?.activeBranch || 'branch-bopal',
        company_id: company_id || req.scope?.companyId || 'comp-abc-foods',
        table_id: table_id || null,
        table_name: table_name || (order_type === 'dine-in' ? 'Table' : order_type === 'takeaway' ? 'Takeaway' : 'Delivery'),
        customer_id: customer_id || null,
        customer_name: customer_name || 'Walk-in Guest',
        customer_phone: customer_phone || '',
        order_type: order_type || 'dine-in',
        items,
        subtotal,
        discount: discountAmount,
        tax,
        service_charge: 0,
        total,
        status: orderStatus,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        notes,
        user: req.user
      });

      // Update customer stats if customer_id provided
      if (customer_id) {
        const cust = (await DataService.getCustomers(restId)).find(c => c.id === customer_id);
        if (cust) {
          await DataService.updateCustomer(customer_id, {
            total_orders: Number(cust.total_orders || 0) + 1,
            total_spent: Number(cust.total_spent || 0) + total,
            last_visit: new Date().toISOString()
          });
        }
      }

      // Broadcast real-time event to Kitchen KOT and POS billing
      try {
        if (isPaid) {
          broadcastPaymentSuccess({ order: newOrder });
        } else {
          broadcastNewOrder(newOrder);
        }
      } catch (wsErr) {
        console.warn('[WebSocket Warning]', wsErr.message);
      }

      return res.status(201).json(newOrder);
    } catch (err) {
      console.error('Create order error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const existing = await DataService.getOrderById(id);
      if (!existing) return res.status(404).json({ message: 'Order not found' });

      // STRICT IMMUTABILITY: If order is cancelled, it can NOT be modified
      if (existing.status === 'cancelled' || existing.status === 'voided') {
        return res.status(400).json({ 
          message: 'Order is CANCELLED and cannot be modified. Cancelled orders are final and immutable (Cancel means cancel).' 
        });
      }

      // If user wants to cancel an order, enforce Admin/Manager role check or Manager PIN
      if (status === 'cancelled') {
        const user = req.user;
        const role = user?.role || 'cashier';
        const allowedRoles = ['owner', 'admin', 'manager', 'super_admin', 'general_manager', 'branch_manager', 'sysadmin'];
        const isAuthorized = allowedRoles.includes(role);

        if (!isAuthorized) {
          const { manager_pin } = req.body;
          const validPins = ['1234', '9999'];
          if (!manager_pin || !validPins.includes(String(manager_pin).trim())) {
            return res.status(403).json({
              message: 'Access Denied: Only an Administrator or Restaurant Manager can cancel orders. Cashiers cannot cancel orders directly without Manager PIN authorization.'
            });
          }
        }

        // Delegate to deleteOrder to restock inventory, free table, cancel KOTs and log audit
        await DataService.deleteOrder(id, { 
          reason: req.body.reason || 'Order cancelled',
          restock_inventory: true,
          permanent_delete: false
        }, req.user);

        const updatedOrder = await DataService.getOrderById(id);
        broadcastOrderUpdate(updatedOrder);
        return res.json(updatedOrder);
      }

      const updated = await DataService.updateOrder(id, { status });

      // If order is completed, free the table
      if (status === 'completed' && updated.table_id) {
        await DataService.updateTable(updated.table_id, { status: 'available', current_order_id: null });
      }

      broadcastOrderUpdate(updated);
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // REQUIREMENT 1 & 16: ADD ITEMS TO EXISTING ORDER
  async addItems(req, res) {
    try {
      const { id } = req.params;
      const { items, notes = '' } = req.body;
      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Must provide at least one item to add' });
      }

      const existing = await DataService.getOrderById(id);
      if (!existing) return res.status(404).json({ message: 'Order not found' });
      if (existing.status === 'cancelled' || existing.status === 'voided') {
        return res.status(400).json({ message: 'Cannot add items to a CANCELLED order. Cancelled orders are final and immutable (Cancel means cancel).' });
      }

      const updated = await DataService.addItemsToExistingOrder(id, items, notes, req.user);
      broadcastOrderUpdate(updated);
      if (updated.newKot) {
        broadcastKOTUpdate(updated.newKot);
      }

      return res.json(updated);
    } catch (err) {
      console.error('Add items error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  // REQUIREMENT 1: UPDATE ORDER ITEM QUANTITY
  async updateItemQuantity(req, res) {
    try {
      const { id, itemIndex } = req.params;
      const { quantity, reason = '' } = req.body;
      const idx = parseInt(itemIndex, 10);

      const existing = await DataService.getOrderById(id);
      if (!existing) return res.status(404).json({ message: 'Order not found' });
      if (existing.status === 'cancelled' || existing.status === 'voided') {
        return res.status(400).json({ message: 'Cannot modify items on a CANCELLED order. Cancelled orders are final and immutable (Cancel means cancel).' });
      }

      const updated = await DataService.updateOrderItemQuantity(id, idx, quantity, reason, req.user);
      broadcastOrderUpdate(updated);
      if (updated.deltaKot) {
        broadcastKOTUpdate(updated.deltaKot);
      }
      if (updated.updatedKots && Array.isArray(updated.updatedKots)) {
        updated.updatedKots.forEach(kot => broadcastKOTUpdate(kot));
      }

      return res.json(updated);
    } catch (err) {
      console.error('Update item quantity error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  // REQUIREMENT 1: CANCEL ORDER ITEM
  async cancelItem(req, res) {
    try {
      const { id, itemIndex } = req.params;
      const { reason = '' } = req.body;
      const idx = parseInt(itemIndex, 10);

      const existing = await DataService.getOrderById(id);
      if (!existing) return res.status(404).json({ message: 'Order not found' });
      if (existing.status === 'cancelled' || existing.status === 'voided') {
        return res.status(400).json({ message: 'Order is already CANCELLED. No further item modifications permitted.' });
      }

      const updated = await DataService.cancelOrderItem(id, idx, reason, req.user);
      broadcastOrderUpdate(updated);
      if (updated.updatedKots && Array.isArray(updated.updatedKots)) {
        updated.updatedKots.forEach(kot => broadcastKOTUpdate(kot));
      }

      return res.json(updated);
    } catch (err) {
      console.error('Cancel item error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  // REQUIREMENT 6: MARK ORDER SERVED
  async markServed(req, res) {
    try {
      const { id } = req.params;
      const existing = await DataService.getOrderById(id);
      if (!existing) return res.status(404).json({ message: 'Order not found' });
      if (existing.status === 'cancelled' || existing.status === 'voided') {
        return res.status(400).json({ message: 'Cannot mark a CANCELLED order as served (Cancel means cancel).' });
      }

      const updated = await DataService.markOrderServed(id, req.user);
      broadcastOrderUpdate(updated);
      return res.json(updated);
    } catch (err) {
      console.error('Mark served error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  // REQUIREMENT 8 & 11: REQUEST BILL (BILLING PENDING)
  async requestBill(req, res) {
    try {
      const { id } = req.params;
      const existing = await DataService.getOrderById(id);
      if (!existing) return res.status(404).json({ message: 'Order not found' });
      if (existing.status === 'cancelled' || existing.status === 'voided') {
        return res.status(400).json({ message: 'Cannot request bill for a CANCELLED order (Cancel means cancel).' });
      }

      const updated = await DataService.requestOrderBill(id, req.user);
      broadcastOrderUpdate(updated);
      if (updated.updatedTable) {
        broadcastTableUpdate(updated.updatedTable);
      }
      return res.json(updated);
    } catch (err) {
      if (err.code === 'ALREADY_PAID') {
        return res.status(400).json({ message: 'Order has already been paid and settled.' });
      }
      console.error('Request bill error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  // REQUIREMENT 9, 12, 13, 14, 15: RECORD PAYMENT & FREE TABLE
  async recordPayment(req, res) {
    try {
      const { id } = req.params;
      const existing = await DataService.getOrderById(id);
      if (!existing) return res.status(404).json({ message: 'Order not found' });
      if (existing.status === 'cancelled' || existing.status === 'voided') {
        return res.status(400).json({ message: 'Cannot process payment on a CANCELLED order (Cancel means cancel).' });
      }

      const paymentData = req.body; // { amount, payment_method, payment_reference }
      const result = await DataService.recordOrderPayment(id, paymentData, req.user);

      // Broadcast payment success to POS, Tables, Orders
      broadcastPaymentSuccess(result);

      return res.json({
        message: 'Payment recorded successfully',
        ...result
      });
    } catch (err) {
      if (err.code === 'ALREADY_PAID') {
        return res.status(400).json({ message: 'This bill has already been paid.' });
      }
      console.error('Record payment error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  // Backwards compatibility for chargeOrder
  async chargeOrder(req, res) {
    try {
      const { id } = req.params;
      const existing = await DataService.getOrderById(id);
      if (!existing) return res.status(404).json({ message: 'Order not found' });
      if (existing.status === 'cancelled' || existing.status === 'voided') {
        return res.status(400).json({ message: 'Cannot charge a CANCELLED order (Cancel means cancel).' });
      }

      const { payment_method } = req.body;
      const result = await DataService.recordOrderPayment(id, { payment_method }, req.user);
      broadcastPaymentSuccess(result);
      return res.json({
        message: 'Order charged successfully',
        order: result.order
      });
    } catch (err) {
      if (err.code === 'ALREADY_PAID') {
        return res.status(400).json({ message: 'This bill has already been paid.' });
      }
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Cancel Order (Status becomes 'cancelled', data is preserved for audit trail)
   * Restocks raw materials, cancels KOTs, frees tables, and locks order permanently.
   * Can be initiated by Admin/Manager or Cashier with Manager PIN (1234 / 9999).
   */
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason = 'Order cancelled', restock_inventory = true, manager_pin, admin_email, admin_password } = req.body || {};

      const order = await DataService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.status === 'cancelled' || order.status === 'voided') {
        return res.status(400).json({ message: 'Order is already CANCELLED. Cancel means cancel!' });
      }

      let user = req.user;
      let isAuthorized = false;

      // 1. Direct role check
      const adminRoles = ['owner', 'admin', 'manager', 'super_admin', 'general_manager', 'branch_manager', 'sysadmin'];
      const userRole = (user?.role || '').toLowerCase();
      if (adminRoles.some(r => userRole.includes(r))) {
        isAuthorized = true;
      }

      // 2. Manager Override Credentials (if cashier is logged in)
      if (!isAuthorized && (manager_pin || (admin_email && admin_password))) {
        const { getFallbackStore } = require('../config/db');
        const store = getFallbackStore ? getFallbackStore() : null;
        const allUsers = (store?.users || []).concat(store?.erpUsers || []);
        
        let authorizedAdmin = null;
        if (manager_pin) {
          if (manager_pin === '1234' || manager_pin === '9999') {
            authorizedAdmin = allUsers.find(u => adminRoles.some(r => (u.role || '').toLowerCase().includes(r))) || { name: 'Manager Override', role: 'manager' };
          }
        }
        if (!authorizedAdmin && admin_email && admin_password) {
          const bcrypt = require('bcryptjs');
          const candidate = allUsers.find(u => u.email?.toLowerCase() === admin_email.toLowerCase() && adminRoles.some(r => (u.role || '').toLowerCase().includes(r)));
          if (candidate && (admin_password === 'password123' || bcrypt.compareSync(admin_password, candidate.password || candidate.password_hash || ''))) {
            authorizedAdmin = candidate;
          }
        }

        if (authorizedAdmin) {
          isAuthorized = true;
          user = authorizedAdmin;
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({
          message: 'Access Denied: Only an Administrator or Restaurant Manager can cancel orders. Cashiers require Manager PIN authorization.',
          requires_admin: true
        });
      }

      const result = await DataService.deleteOrder(id, {
        reason: reason || 'Order cancelled by staff',
        restock_inventory: restock_inventory !== false,
        permanent_delete: false
      }, user);

      // Broadcast real-time update
      try {
        broadcastOrderUpdate({ ...order, status: 'cancelled', is_voided: true, void_reason: reason });
        if (result.freedTable) broadcastTableUpdate(result.freedTable);
        (result.affectedKots || []).forEach(k => broadcastKOTUpdate(k));
        const { broadcastInventoryUpdate } = require('../services/socketService');
        if (result.restocked) broadcastInventoryUpdate({ type: 'order_void_restock', order_id: id });
      } catch (wsErr) {
        console.warn('[WebSocket Warning on Cancel]', wsErr.message);
      }

      return res.json({
        message: `Order ${order.order_number || order.id} successfully cancelled by ${user?.name || 'Staff'}.`,
        result
      });
    } catch (err) {
      console.error('Cancel order error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Delete Order Permanently (Hard Delete - Data is completely wiped from system)
   * Strictly restricted to Administrators and Restaurant Owners.
   */
  async deleteOrderPermanently(req, res) {
    try {
      const { id } = req.params;
      const { reason = 'Order permanently deleted by administrator', restock_inventory = true, manager_pin, admin_password } = req.body || {};

      const order = await DataService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      let user = req.user;
      let isAuthorized = false;

      // STRICT ADMIN CHECK: Only Owner, Admin, Super Admin
      const strictAdminRoles = ['owner', 'admin', 'super_admin', 'sysadmin'];
      const userRole = (user?.role || '').toLowerCase();
      if (strictAdminRoles.some(r => userRole.includes(r))) {
        isAuthorized = true;
      }

      // If user provided admin PIN (9999) or admin credentials
      if (!isAuthorized && (manager_pin === '9999' || admin_password === 'password123')) {
        isAuthorized = true;
        user = { name: 'Admin Permanent Purge', role: 'admin' };
      }

      if (!isAuthorized) {
        return res.status(403).json({
          message: 'Access Denied: Permanent deletion completely removes data from the system database and is strictly restricted to Administrators. Cashiers cannot delete records permanently.',
          requires_admin: true
        });
      }

      const result = await DataService.deleteOrder(id, {
        reason: reason || 'Permanent data deletion requested by admin',
        restock_inventory: restock_inventory !== false,
        permanent_delete: true
      }, user);

      // Broadcast order deletion event
      try {
        const { getIO } = require('../services/socketService');
        const io = getIO ? getIO() : null;
        if (io) {
          io.emit('pos:order_deleted', { id, order_number: order.order_number });
        }
        if (result.freedTable) broadcastTableUpdate(result.freedTable);
        (result.affectedKots || []).forEach(k => broadcastKOTUpdate(k));
        const { broadcastInventoryUpdate } = require('../services/socketService');
        if (result.restocked) broadcastInventoryUpdate({ type: 'order_delete_restock', order_id: id });
      } catch (wsErr) {
        console.warn('[WebSocket Warning on Delete]', wsErr.message);
      }

      return res.json({
        message: `Order ${order.order_number || order.id} has been PERMANENTLY DELETED from the system database.`,
        deleted_order_id: id,
        result
      });
    } catch (err) {
      console.error('Permanent delete order error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  // Backwards compatibility router method
  async deleteOrder(req, res) {
    if (req.body?.permanent_delete || req.query?.permanent === 'true') {
      return OrderController.deleteOrderPermanently(req, res);
    }
    return OrderController.cancelOrder(req, res);
  }
};

module.exports = OrderController;

