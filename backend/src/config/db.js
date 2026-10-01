const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const { getInitialData, RESTAURANT_ID } = require('./seedData');

let pool = null;
let useFallbackStore = false;

const DB_STORE_PATH = path.join(__dirname, '../../data/serveflow_store.json');

function loadPersistentStore() {
  try {
    if (fs.existsSync(DB_STORE_PATH)) {
      const content = fs.readFileSync(DB_STORE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.restaurant) {
        console.log('[Persistence] Loaded permanent database state from disk (serveflow_store.json)');
        const seed = getInitialData();
        if (!parsed.recipes || parsed.recipes.length === 0) {
          parsed.recipes = seed.recipes || [];
        } else if (seed.recipes) {
          for (const sRec of seed.recipes) {
            const existingIdx = parsed.recipes.findIndex(r => r.id === sRec.id || r.menu_item_id === sRec.menu_item_id);
            if (existingIdx === -1) {
              parsed.recipes.push(sRec);
            } else if (!parsed.recipes[existingIdx].ingredients || parsed.recipes[existingIdx].ingredients.length === 0) {
              parsed.recipes[existingIdx] = sRec;
            }
          }
        }
        if (seed.inventoryItems && parsed.inventoryItems) {
          for (const sItem of seed.inventoryItems) {
            const existing = parsed.inventoryItems.find(i => i.id === sItem.id);
            if (!existing) {
              parsed.inventoryItems.push(sItem);
            } else if (existing.current_stock <= 0 && sItem.current_stock > 0) {
              existing.current_stock = sItem.current_stock;
              existing.status = 'healthy';
            }
          }
        }
        if (seed.menuItems && parsed.menuItems) {
          for (const mItem of seed.menuItems) {
            if (!parsed.menuItems.some(m => m.id === mItem.id)) {
              parsed.menuItems.push(mItem);
            }
          }
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Persistence] Could not load disk store, initializing from seed:', err.message);
  }
  return getInitialData();
}

// Fallback store initialized with persistent disk state or seed
let fallbackStore = loadPersistentStore();

let saveTimeout = null;
function persistStoreToDisk() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const dataDir = path.dirname(DB_STORE_PATH);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(DB_STORE_PATH, JSON.stringify(fallbackStore, null, 2), 'utf8');
    } catch (e) {
      console.error('[Persistence] Error writing store to disk:', e.message);
    }
  }, 100);
}

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'serveflow_db';

  try {
    // Attempt root connection to create database if not exists
    const rootConn = await mysql.createConnection({
      host,
      port: Number(port),
      user,
      password,
      connectTimeout: 2000
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await rootConn.end();

    // Create pool for serveflow_db
    pool = mysql.createPool({
      host,
      port: Number(port),
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    // Test connection
    const testConn = await pool.getConnection();
    console.log(`[MySQL] Successfully connected to MySQL server at ${host}:${port}/${database}`);
    testConn.release();

    // Run table creation
    await runMigrations();

    // Check and seed if empty
    await seedMySQLDatabase();

    useFallbackStore = false;
    return true;
  } catch (err) {
    console.warn(`[MySQL Notice] Could not connect to MySQL at ${host}:${port} (${err.message}).`);
    console.info(`[MySQL Resilient Store] Starting ServeFlow with instant in-memory MySQL data provider populated with 'Urban Spice Restaurant' demo data.`);
    console.info(`[MySQL Instructions] When ready, start your MySQL server and configure .env with DB_HOST, DB_USER, DB_PASSWORD.`);
    useFallbackStore = true;
    return false;
  }
}

async function runMigrations() {
  if (!pool) return;
  const schemaPath = path.join(__dirname, '../../database.sql');
  if (fs.existsSync(schemaPath)) {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (e) {
        // Table or index might already exist
      }
    }
    console.log('[MySQL] Schema verification and migrations complete.');
  }
}

async function seedMySQLDatabase() {
  if (!pool) return;
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM restaurants');
    if (rows[0].count === 0) {
      console.log('[MySQL] Empty database detected. Seeding Urban Spice Restaurant demo data...');
      const seed = getInitialData();

      // Insert restaurant
      await pool.query(
        `INSERT INTO restaurants (id, name, tagline, slug, address, phone, email, gst_number, currency, tax_rate, service_charge, invoice_prefix, footer_text, kot_printer, bill_printer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          seed.restaurant.id, seed.restaurant.name, seed.restaurant.tagline, seed.restaurant.slug,
          seed.restaurant.address, seed.restaurant.phone, seed.restaurant.email, seed.restaurant.gst_number,
          seed.restaurant.currency, seed.restaurant.tax_rate, seed.restaurant.service_charge,
          seed.restaurant.invoice_prefix, seed.restaurant.footer_text, seed.restaurant.kot_printer, seed.restaurant.bill_printer
        ]
      );

      // Insert users
      for (const u of seed.users) {
        await pool.query(
          `INSERT INTO users (id, restaurant_id, name, email, phone, password, role, avatar, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [u.id, u.restaurant_id, u.name, u.email, u.phone, u.password, u.role, u.avatar, u.is_active]
        );
      }

      // Insert categories
      for (const c of seed.categories) {
        await pool.query(
          `INSERT INTO menu_categories (id, restaurant_id, name, slug, description, display_order, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.restaurant_id, c.name, c.slug, c.description, c.display_order, c.is_active]
        );
      }

      // Insert menu items
      for (const item of seed.menuItems) {
        await pool.query(
          `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, is_veg, gst_rate, is_available, image, preparation_time, variants, add_ons)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id, item.restaurant_id, item.category_id, item.name, item.description,
            item.price, item.is_veg, item.gst_rate, item.is_available, item.image,
            item.preparation_time, JSON.stringify(item.variants), JSON.stringify(item.add_ons)
          ]
        );
      }

      // Insert dining tables
      for (const t of seed.diningTables) {
        await pool.query(
          `INSERT INTO dining_tables (id, restaurant_id, table_number, floor, capacity, status, current_order_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.restaurant_id, t.table_number, t.floor, t.capacity, t.status, t.current_order_id]
        );
      }

      // Insert customers
      for (const cust of seed.customers) {
        await pool.query(
          `INSERT INTO customers (id, restaurant_id, name, phone, email, address, total_orders, total_spent, last_visit, favorite_items, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cust.id, cust.restaurant_id, cust.name, cust.phone, cust.email, cust.address, cust.total_orders, cust.total_spent, cust.last_visit, cust.favorite_items, cust.notes]
        );
      }

      console.log('[MySQL] Database seed completed successfully.');
    }
  } catch (err) {
    console.error('[MySQL Seed Error]', err.message);
  }
}

// Universal query dispatcher
async function executeQuery(sql, params = []) {
  if (!useFallbackStore && pool) {
    try {
      const [results] = await pool.query(sql, params);
      return results;
    } catch (err) {
      console.error('[MySQL Query Error]', err.message);
      throw err;
    }
  }
  return null;
}

module.exports = {
  initDatabase,
  getPool: () => pool,
  isUsingFallback: () => useFallbackStore,
  getFallbackStore: () => fallbackStore,
  setFallbackStore: (data) => { fallbackStore = data; },
  persistStoreToDisk,
  executeQuery,
  RESTAURANT_ID
};
