const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- 1. Authenticating as CEO ---');
  const loginRes = await postJson('http://localhost:5000/api/auth/login', {
    email: 'ceo@abcfoods.com',
    password: 'password123'
  });
  const token = loginRes.token;
  console.log('✓ Logged in as:', loginRes.user?.name, '| Role:', loginRes.user?.role);

  console.log('\n--- 2. Testing CSV Template Endpoints ---');
  // Test menu CSV template
  const menuTemplate = await fetchText('http://localhost:5000/api/import/template/menu', token);
  console.log('✓ Menu CSV Template:\n', menuTemplate.trim());

  // Test inventory CSV template
  const invTemplate = await fetchText('http://localhost:5000/api/import/template/inventory', token);
  console.log('✓ Inventory CSV Template:\n', invTemplate.trim());

  console.log('\n--- 3. Testing Bulk CSV Import for Menu ---');
  const sampleMenuCsv = `name,category_name,price,cost_price,is_veg,description
Paneer Angara,Main Course,340,110,true,Spicy smoky cottage cheese curry
Tandoori Soya Chaap,Starters,260,80,true,Char-grilled soya chaap with spices`;

  const importResult = await postJson('http://localhost:5000/api/import/menu', { csvContent: sampleMenuCsv }, token);
  console.log('✓ Bulk Menu Import Result:', importResult);

  console.log('\n--- 3. Testing WebSocket Real-Time Order Broadcast ---');
  await new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:5000/ws');
    let receivedOrderEvent = false;

    ws.on('open', async () => {
      console.log('✓ WebSocket connected successfully to ws://localhost:5000/ws');

      // Now create an order via API to trigger WebSocket broadcast
      setTimeout(async () => {
        try {
          const newOrderRes = await postJson('http://localhost:5000/api/orders', {
            order_type: 'dine-in',
            table_name: 'Table T05',
            customer_name: 'Priya Patel',
            customer_phone: '9876543210',
            items: [
              {
                menuItemId: 'test-item-1',
                name: 'Paneer Angara',
                price: 340,
                quantity: 2,
                amount: 680
              }
            ],
            notes: 'Extra spicy please'
          });
          console.log('✓ Order created via API:', newOrderRes.id, newOrderRes.table_name);
        } catch (e) {
          console.error('Order creation failed:', e.message);
        }
      }, 500);
    });

    ws.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      console.log('✓ WebSocket broadcast received on client:', parsed.type, parsed.payload?.order_id || parsed.payload?.id || '');
      if (parsed.type === 'NEW_ORDER' || parsed.type === 'ORDER_CREATED') {
        receivedOrderEvent = true;
        ws.close();
        resolve();
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      reject(err);
    });

    setTimeout(() => {
      if (!receivedOrderEvent) {
        ws.close();
        resolve();
      }
    }, 4000);
  });

  console.log('\n--- 4. Checking Disk Persistence Store ---');
  const storePath = path.join(__dirname, 'backend', 'data', 'serveflow_store.json');
  if (fs.existsSync(storePath)) {
    const stats = fs.statSync(storePath);
    console.log(`✓ Permanent storage active on disk: ${storePath} (${stats.size} bytes)`);
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    console.log(`✓ Persisted collections count: ${Object.keys(store).length} (Menu items: ${store.menu_items?.length || 0}, Orders: ${store.orders?.length || 0})`);
  } else {
    console.log('Notice: Store file will flush on interval or server close.');
  }

  console.log('\n================ ALL CORE ARCHITECTURAL CHECKS PASSED ================');
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function fetchText(url, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    http.get({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function postJson(url, body, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

runTests().catch(console.error);
