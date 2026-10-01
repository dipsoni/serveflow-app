const DataService = require('../services/dataService');
const { broadcastKOTUpdate, broadcastReadyAlert, broadcastOrderUpdate } = require('../services/socketService');

const KOTController = {
  async getKOTs(req, res) {
    try {
      const kots = await DataService.getKOTs(req.restaurantId);
      return res.json(kots);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // new, preparing, ready, completed

      const updates = { status };
      const now = new Date().toISOString();
      if (status === 'preparing') updates.prepared_at = now;
      if (status === 'ready') updates.ready_at = now;
      if (status === 'completed') updates.completed_at = now;

      const updated = await DataService.updateKOT(id, updates);
      if (!updated) {
        return res.status(404).json({ message: 'KOT not found' });
      }

      // Synchronize linked order status (Requirements 5, 6, 7)
      if (updated.order_id) {
        const linkedOrder = await DataService.getOrderById(updated.order_id);
        if (linkedOrder && !['cancelled', 'voided'].includes(linkedOrder.status)) {
          if (status === 'preparing') {
            const ord = await DataService.updateOrder(updated.order_id, { status: 'preparing' });
            if (ord) broadcastOrderUpdate(ord);
          } else if (status === 'ready') {
            const ord = await DataService.updateOrder(updated.order_id, { status: 'ready' });
            if (ord) broadcastOrderUpdate(ord);
          } else if (status === 'completed') {
            // When kitchen marks completed, order transitions to SERVE PENDING
            const allKots = await DataService.getKOTs(updated.restaurant_id || req.restaurantId);
            const relatedKots = allKots.filter(k => k.order_id === updated.order_id);
            const allCompleted = relatedKots.length === 0 || relatedKots.every(k => k.id === updated.id ? true : ['completed', 'served'].includes(k.status));
            
            if (allCompleted) {
              const ord = await DataService.updateOrder(updated.order_id, { status: 'serve_pending' });
              if (ord) broadcastOrderUpdate(ord);
            }
          }
        }
      }

      // Broadcast real-time WebSocket events
      try {
        broadcastKOTUpdate(updated);
        if (status === 'ready') {
          broadcastReadyAlert(updated);
        }
      } catch (wsErr) {
        console.warn('[WebSocket Warning]', wsErr.message);
      }

      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateItemStatus(req, res) {
    try {
      const { id, itemIndex } = req.params;
      const { status } = req.body;
      const kots = await DataService.getKOTs(req.restaurantId);
      const kot = kots.find(k => k.id === id);
      if (!kot) return res.status(404).json({ message: 'KOT not found' });

      const items = [...(kot.items || [])];
      const idx = parseInt(itemIndex, 10);
      if (idx >= 0 && idx < items.length) {
        items[idx].status = status;
      }

      // Aggregate KOT overall status based on items
      let overallStatus = kot.status;
      const activeItems = items.filter(i => i.status !== 'cancelled');
      if (activeItems.length > 0) {
        if (activeItems.every(i => i.status === 'completed')) {
          overallStatus = 'completed';
        } else if (activeItems.some(i => i.status === 'ready')) {
          overallStatus = 'ready';
        } else if (activeItems.some(i => i.status === 'preparing')) {
          overallStatus = 'preparing';
        }
      }

      const updated = await DataService.updateKOT(id, { items, status: overallStatus });

      if (updated.order_id) {
        const linkedOrder = await DataService.getOrderById(updated.order_id);
        if (linkedOrder && !['cancelled', 'voided'].includes(linkedOrder.status)) {
          if (overallStatus === 'completed') {
            const allKots = await DataService.getKOTs(updated.restaurant_id || req.restaurantId);
            const relatedKots = allKots.filter(k => k.order_id === updated.order_id);
            const allDone = relatedKots.length === 0 || relatedKots.every(k => k.id === updated.id ? true : ['completed', 'served'].includes(k.status));
            if (allDone) {
              const ord = await DataService.updateOrder(updated.order_id, { status: 'serve_pending' });
              if (ord) broadcastOrderUpdate(ord);
            }
          } else if (overallStatus === 'ready') {
            const ord = await DataService.updateOrder(updated.order_id, { status: 'ready' });
            if (ord) broadcastOrderUpdate(ord);
          } else if (overallStatus === 'preparing') {
            const ord = await DataService.updateOrder(updated.order_id, { status: 'preparing' });
            if (ord) broadcastOrderUpdate(ord);
          }
        }
      }

      broadcastKOTUpdate(updated);
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = KOTController;

