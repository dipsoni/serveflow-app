const DataService = require('../services/dataService');
const { broadcastTableUpdate } = require('../services/socketService');

const TableController = {
  async getTables(req, res) {
    try {
      const tables = await DataService.getTables(req.restaurantId);
      return res.json(tables);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createTable(req, res) {
    try {
      const { table_number, floor, capacity } = req.body;
      if (!table_number) {
        return res.status(400).json({ message: 'Table number is required' });
      }
      const newTable = await DataService.createTable({
        restaurant_id: req.restaurantId,
        table_number,
        floor: floor || 'Main Dining',
        capacity: Number(capacity) || 4,
        status: 'available'
      });
      broadcastTableUpdate(newTable);
      return res.status(201).json(newTable);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateTable(req, res) {
    try {
      const { id } = req.params;
      const updated = await DataService.updateTable(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Table not found' });
      }
      broadcastTableUpdate(updated);
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async deleteTable(req, res) {
    try {
      const { id } = req.params;
      await DataService.deleteTable(id);
      return res.json({ message: 'Table deleted successfully' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async mergeTables(req, res) {
    try {
      const { primaryTableId, secondaryTableId } = req.body;
      if (!primaryTableId || !secondaryTableId) {
        return res.status(400).json({ message: 'Primary and secondary table IDs are required' });
      }
      await DataService.updateTable(secondaryTableId, {
        status: 'occupied',
        merged_with: primaryTableId
      });
      return res.json({ message: 'Tables merged successfully' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async transferOrder(req, res) {
    try {
      const { fromTableId, toTableId } = req.body;
      const tables = await DataService.getTables(req.restaurantId);
      const fromTable = tables.find(t => t.id === fromTableId);
      const toTable = tables.find(t => t.id === toTableId);

      if (!fromTable || !toTable) {
        return res.status(404).json({ message: 'Tables not found' });
      }

      if (fromTable.current_order_id) {
        // Move order to new table
        await DataService.updateOrder(fromTable.current_order_id, {
          table_id: toTable.id,
          table_name: `Table ${toTable.table_number}`
        });

        await DataService.updateTable(toTable.id, {
          status: 'occupied',
          current_order_id: fromTable.current_order_id
        });

        await DataService.updateTable(fromTable.id, {
          status: 'available',
          current_order_id: null
        });
      }

      return res.json({ message: 'Order transferred successfully' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = TableController;
