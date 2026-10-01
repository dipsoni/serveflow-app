// backend/src/routes/importRoutes.js
const express = require('express');
const router = express.Router();
const { getFallbackStore, persistStoreToDisk, RESTAURANT_ID } = require('../config/db');

// 1. Download CSV Sample Templates
router.get('/template/:type', (req, res) => {
  const { type } = req.params;

  if (type === 'menu') {
    const csvContent = 
`name,category,price,cost_price,is_veg,description
Paneer Butter Masala,Main Course,280,110,true,Cottage cheese cubes in rich tomato butter gravy
Dal Makhani,Main Course,240,85,true,Slow cooked black lentils with fresh cream
Butter Naan,Breads,45,14,true,Traditional clay oven flatbread with butter
Chicken Tikka Biryani,Rice & Biryani,340,160,false,Fragrant spiced basmati rice with smoked chicken
Gulab Jamun,Desserts,90,30,true,Warm milk dumplings soaked in cardamom syrup
Masala Chai,Beverages,40,12,true,Spiced Indian milk tea`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="serveflow_menu_template.csv"');
    return res.send(csvContent);
  }

  if (type === 'inventory') {
    const csvContent = 
`name,sku,category,unit,min_stock,current_stock,cost_per_unit
Basmati Rice Premium,ING-RICE-01,Raw Grains,kg,30,150,85.00
Amul Butter Block,ING-BTR-01,Dairy,kg,10,40,440.00
Paneer Fresh,ING-PAN-01,Dairy,kg,15,35,320.00
Onion Red,ING-VEG-01,Vegetables,kg,50,200,32.00
Tomato Hybrid,ING-VEG-02,Vegetables,kg,40,180,28.00
Refined Sunflower Oil,ING-OIL-01,Cooking Oils,L,20,90,145.00`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="serveflow_inventory_template.csv"');
    return res.send(csvContent);
  }

  res.status(400).json({ message: 'Invalid template type. Use "menu" or "inventory".' });
});

// Helper: Simple CSV string parser handling quotes and commas
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    // Regex to split by commas not inside quotes
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }
  return rows;
}

// 2. Bulk Import Menu Items
router.post('/menu', async (req, res) => {
  try {
    const { csvData, csvContent, csv, items } = req.body;
    let records = [];

    const rawCsv = csvData || csvContent || csv;
    if (Array.isArray(items) && items.length > 0) {
      records = items;
    } else if (typeof rawCsv === 'string') {
      records = parseCSV(rawCsv);
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'No valid records found in CSV payload' });
    }

    const store = getFallbackStore();
    store.categories = store.categories || [];
    store.menuItems = store.menuItems || [];

    const imported = [];
    const errors = [];

    records.forEach((row, idx) => {
      const name = (row.name || '').trim();
      const categoryName = (row.category || row.category_name || 'General').trim();
      const price = parseFloat(row.price || row.cost || 0);
      const isVeg = String(row.is_veg).toLowerCase() === 'true' || String(row.is_veg) === '1' || row.is_veg === true;
      const description = row.description || '';

      if (!name) {
        errors.push({ row: idx + 1, error: 'Item name is missing' });
        return;
      }
      if (isNaN(price) || price < 0) {
        errors.push({ row: idx + 1, item: name, error: 'Invalid price' });
        return;
      }

      // Check or create category
      let cat = store.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (!cat) {
        cat = {
          id: `cat-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
          restaurant_id: RESTAURANT_ID,
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          is_active: true
        };
        store.categories.push(cat);
      }

      // Create new menu item
      const newItem = {
        id: `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        restaurant_id: RESTAURANT_ID,
        category_id: cat.id,
        category_name: cat.name,
        name,
        price,
        is_veg: isVeg,
        description,
        is_available: true,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        created_at: new Date().toISOString()
      };

      store.menuItems.push(newItem);
      imported.push(newItem);
    });

    // Save to disk
    persistStoreToDisk();

    res.json({
      success: true,
      message: `Successfully imported ${imported.length} menu items!`,
      importedCount: imported.length,
      errorsCount: errors.length,
      errors
    });
  } catch (err) {
    console.error('[Import Menu Error]', err);
    res.status(500).json({ message: 'Failed to process menu import', error: err.message });
  }
});

// 3. Bulk Import Inventory Items
router.post('/inventory', async (req, res) => {
  try {
    const { csvData, csvContent, csv, items } = req.body;
    let records = [];

    const rawCsv = csvData || csvContent || csv;
    if (Array.isArray(items) && items.length > 0) {
      records = items;
    } else if (typeof rawCsv === 'string') {
      records = parseCSV(rawCsv);
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'No valid records found in CSV payload' });
    }

    const store = getFallbackStore();
    store.inventoryItems = store.inventoryItems || [];

    const imported = [];
    const errors = [];

    records.forEach((row, idx) => {
      const name = (row.name || '').trim();
      const sku = (row.sku || `SKU-${Date.now().toString(36).toUpperCase()}`).trim();
      const category = (row.category || 'Raw Materials').trim();
      const unit = (row.unit || 'kg').trim();
      const minStock = parseFloat(row.min_stock || 10);
      const currentStock = parseFloat(row.current_stock || row.stock || 0);
      const costPerUnit = parseFloat(row.cost_per_unit || row.cost || 0);

      if (!name) {
        errors.push({ row: idx + 1, error: 'Inventory item name is missing' });
        return;
      }

      // Check if existing item by name or SKU
      const existing = store.inventoryItems.find(i => i.name.toLowerCase() === name.toLowerCase() || (i.sku && i.sku.toLowerCase() === sku.toLowerCase()));
      if (existing) {
        existing.current_stock = currentStock;
        existing.min_stock = minStock;
        existing.cost_per_unit = costPerUnit;
        imported.push(existing);
      } else {
        const newItem = {
          id: `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          restaurant_id: RESTAURANT_ID,
          name,
          sku,
          category,
          unit,
          min_stock: minStock,
          current_stock: currentStock,
          cost_per_unit: costPerUnit,
          created_at: new Date().toISOString()
        };
        store.inventoryItems.push(newItem);
        imported.push(newItem);
      }
    });

    persistStoreToDisk();

    res.json({
      success: true,
      message: `Successfully processed ${imported.length} inventory items!`,
      importedCount: imported.length,
      errorsCount: errors.length,
      errors
    });
  } catch (err) {
    console.error('[Import Inventory Error]', err);
    res.status(500).json({ message: 'Failed to process inventory import', error: err.message });
  }
});

module.exports = router;
