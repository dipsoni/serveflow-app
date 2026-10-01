// backend/src/services/socketService.js
const { WebSocketServer, WebSocket } = require('ws');

let wss = null;
const clients = new Set();

/**
 * Initialize WebSocket Server attached to HTTP server
 */
function initWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    clients.add(ws);
    // Parse client query or headers if needed
    const clientIp = req.socket.remoteAddress;
    console.log(`[WebSocket] Client connected (${clients.size} active). IP: ${clientIp}`);

    // Send welcome / heartbeat
    ws.send(JSON.stringify({
      type: 'system:connected',
      payload: { message: 'ServeFlow Real-Time KOT & POS stream active', timestamp: new Date().toISOString() }
    }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle incoming client messages (e.g. join branch room, ping)
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (data.type === 'subscribe:branch') {
          ws.branchId = data.branchId;
        }
      } catch (err) {
        console.error('[WebSocket] Message parse error:', err.message);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected (${clients.size} active remaining)`);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Client socket error:', err.message);
      clients.delete(ws);
    });
  });

  console.log('[WebSocket] Real-time engine mounted at path /ws');
  return wss;
}

/**
 * Broadcast event to all or branch-specific clients
 */
function broadcast(type, payload, branchId = null) {
  if (!wss) return;
  const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (!branchId || !client.branchId || client.branchId === branchId || client.branchId === 'ALL') {
        client.send(message);
      }
    }
  });
}

function broadcastNewOrder(order) {
  broadcast('pos:order_created', order, order?.branch_id);
  broadcast('pos:order_updated', order, order?.branch_id);
  broadcast('kot:ticket_created', order, order?.branch_id);
  broadcast('kot:new_order', order, order?.branch_id);
}

function broadcastKOTUpdate(kot) {
  broadcast('kot:status_updated', kot, kot?.branch_id);
  broadcast('kot:new_order', kot, kot?.branch_id);
  broadcast('kot:ticket_created', kot, kot?.branch_id);
  broadcast('kot:item_updated', kot, kot?.branch_id);
}

function broadcastReadyAlert(kot) {
  broadcast('kitchen:ready_alert', kot, kot?.branch_id);
}

function broadcastTableUpdate(table) {
  broadcast('pos:table_updated', table, table?.branch_id);
}

function broadcastInventoryAlert(item) {
  broadcast('inventory:low_stock', item, item?.branch_id);
}

function broadcastInventoryUpdate(payload = {}) {
  broadcast('inventory:updated', payload, payload?.branch_id);
  broadcast('inventory:stock_changed', payload, payload?.branch_id);
}

function broadcastOrderUpdate(order) {
  broadcast('pos:order_updated', order, order?.branch_id);
  broadcast('order:status_updated', order, order?.branch_id);
  broadcast('kot:status_updated', order, order?.branch_id);
  broadcast('kot:item_updated', order, order?.branch_id);
}

function broadcastPaymentSuccess(payload) {
  broadcast('pos:payment_success', payload, payload?.order?.branch_id || payload?.table?.branch_id);
  if (payload?.table) {
    broadcast('pos:table_updated', payload.table, payload?.table?.branch_id);
  }
  if (payload?.order) {
    broadcast('pos:order_updated', payload.order, payload?.order?.branch_id);
  }
}

module.exports = {
  initWebSocketServer,
  broadcast,
  broadcastNewOrder,
  broadcastKOTUpdate,
  broadcastReadyAlert,
  broadcastTableUpdate,
  broadcastOrderUpdate,
  broadcastPaymentSuccess,
  broadcastInventoryAlert,
  broadcastInventoryUpdate
};

